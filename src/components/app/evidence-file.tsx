import { useEffect, useRef, useState, type Ref } from "react";
import { createClient } from "@supabase/supabase-js";
import { useQueryClient } from "@tanstack/react-query";
import { AlertCircle, FileText, RotateCcw, X } from "lucide-react";
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Attachment,
  Button,
  DropZone,
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
  Inline,
  Section,
  Spinner,
  Stack,
  Text,
  announce,
  downloadBlob,
  formatFileSize,
  toast,
  useLedgerLocale,
} from "@ledger/design-system";
import { getRecord, requireIdentity, saveRecord, type Workspace } from "@/lib/database";
import type { Collection, DataRecord } from "@/lib/records";
import { useWorkspace } from "./workspace";

/** The largest file a reader may choose, in decimal units so the hint and a refusal agree. */
const MAX_SELECTED_BYTES = 50_000_000;
/** The evidence bucket's own limit (50 MiB), which a recovered object is checked against. */
const MAX_STORED_BYTES = 50 * 1024 * 1024;
async function digest(blob: Blob) {
  const hash = await crypto.subtle.digest("SHA-256", await blob.arrayBuffer());
  return Array.from(new Uint8Array(hash), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

/**
 * How long one transfer may take before it gives up: 30 seconds, or the time the file takes at a
 * slow 50 kB/s, so a large file on a slow link is not cut off while it is still moving. An upload
 * can be cancelled sooner.
 */
const transferTimeout = (bytes: number) => Math.max(30_000, Math.ceil(bytes / 50_000) * 1000);

// Each operation keeps its original identity, even if another tab changes sign-in.
function privateStorage(token: string, signal: AbortSignal, timeout = 30_000) {
  return createClient(
    import.meta.env["VITE_SUPABASE_URL"],
    import.meta.env["VITE_SUPABASE_ANON_KEY"],
    {
      accessToken: async () => token,
      global: {
        fetch: (input, init) =>
          fetch(input, {
            ...init,
            signal: AbortSignal.any([
              signal,
              AbortSignal.timeout(timeout),
              ...(init?.signal ? [init.signal] : []),
            ]),
          }),
      },
    },
  ).storage.from("evidence");
}

type Operation = "upload" | "recover" | "download";
const failureTitles: Record<Operation, string> = {
  upload: "The file was not attached",
  recover: "The upload was not recovered",
  download: "The file was not downloaded",
};

/** Files are uploaded to private Storage and tied to one actual evidence revision. */
export function EvidenceFile(props: {
  collection: Collection;
  record: DataRecord;
  onBusyChange?: ((busy: boolean) => void) | undefined;
  onDirtyChange?: ((dirty: boolean) => void) | undefined;
  /**
   * The Choose a file button. Inside a Dialog or Sheet, give the same ref to the content's
   * `initialFocus` to start there.
   */
  triggerRef?: Ref<HTMLButtonElement> | undefined;
}) {
  const workspace = useWorkspace();
  return (
    <EvidenceFileEditor
      key={`${workspace.userId}:${workspace.tenantId}:${props.record.id}`}
      {...props}
      workspace={workspace}
    />
  );
}

function assign<T>(ref: Ref<T> | undefined, node: T | null) {
  if (typeof ref === "function") ref(node);
  else if (ref) ref.current = node;
}

function EvidenceFileEditor({
  collection,
  record,
  workspace,
  onBusyChange,
  onDirtyChange,
  triggerRef,
}: {
  collection: Collection;
  record: DataRecord;
  workspace: Workspace;
  onBusyChange?: ((busy: boolean) => void) | undefined;
  onDirtyChange?: ((dirty: boolean) => void) | undefined;
  triggerRef?: Ref<HTMLButtonElement> | undefined;
}) {
  const cache = useQueryClient();
  const { locale } = useLedgerLocale();
  const operation = useRef<AbortController | null>(null);
  const trigger = useRef<HTMLButtonElement | null>(null);
  const uploadButton = useRef<HTMLButtonElement | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState<Operation | null>(null);
  const [failure, setFailure] = useState<{ operation: Operation; message: string } | null>(null);
  // What the Upload button found missing when it was pressed: the Field's own error.
  const [problem, setProblem] = useState<string | undefined>();
  const path =
    typeof record["storage_object_name"] === "string" ? record["storage_object_name"] : null;
  const hasFile = !!path && !!record["storage_object_id"];
  const storedName = path?.split("/").at(-1) ?? record.id;
  const writable = workspace.role !== "viewer" && record["state"] === "draft" && !hasFile;
  const recordKey = ["record", workspace.tenantId, collection.name, record.id];
  const bindTrigger = (node: HTMLButtonElement | null) => {
    trigger.current = node;
    assign(triggerRef, node);
  };
  useEffect(() => () => operation.current?.abort(), []);

  function begin(kind: Operation) {
    if (operation.current) return null;
    const controller = new AbortController();
    operation.current = controller;
    onBusyChange?.(true);
    setBusy(kind);
    setFailure(null);
    return controller;
  }
  function finish(controller: AbortController) {
    if (controller.signal.aborted) {
      // A cancelled upload's reservation can land after Cancel: read the record again, so
      // Recover uploaded file appears once it has.
      void cache.invalidateQueries({ queryKey: recordKey }).catch(() => {});
      return;
    }
    operation.current = null;
    onBusyChange?.(false);
    setBusy(null);
    void cache.invalidateQueries({ queryKey: recordKey }).catch(() => {});
    void cache
      .invalidateQueries({ queryKey: ["model", workspace.tenantId, collection.name] })
      .catch(() => {});
    void cache
      .invalidateQueries({ queryKey: ["models", workspace.tenantId, collection.name] })
      .catch(() => {});
    void cache
      .invalidateQueries({ queryKey: ["records", workspace.tenantId, collection.name] })
      .catch(() => {});
  }
  async function checkIdentity(controller: AbortController) {
    controller.signal.throwIfAborted();
    const token = await requireIdentity(workspace);
    controller.signal.throwIfAborted();
    return token;
  }

  async function attach(selectedFile?: File) {
    const kind: Operation = selectedFile ? "upload" : "recover";
    const controller = begin(kind);
    if (!controller) return;
    try {
      const token = await checkIdentity(controller);
      const storage = privateStorage(
        token,
        controller.signal,
        transferTimeout(selectedFile?.size ?? MAX_STORED_BYTES),
      );
      let current = await getRecord(workspace, collection, record.id);
      await checkIdentity(controller);
      if (current["state"] !== "draft")
        throw new Error(
          "This version is published. Create another draft version to attach a file.",
        );
      if (current["storage_object_id"]) {
        cache.setQueryData(recordKey, current);
        throw new Error("This version already has an attached file.");
      }
      let objectName =
        typeof current["storage_object_name"] === "string" ? current["storage_object_name"] : "";
      let selectedHash: string | null = null;
      if (selectedFile) {
        if (selectedFile.size > MAX_SELECTED_BYTES)
          throw new Error(
            `Choose a file no larger than ${formatFileSize(MAX_SELECTED_BYTES, { locale })}.`,
          );
        const filename = selectedFile.name.normalize("NFC").replace(/[^a-zA-Z0-9._-]/g, "_");
        if (!filename || /^\.+$/.test(filename))
          throw new Error("Choose a file with a valid filename.");
        const requestedPath = `${workspace.tenantId}/${current["artifact_id"]}/${current.id}/${filename}`;
        if (objectName && objectName !== requestedPath) {
          throw new Error(
            "This version has a reserved upload. Recover that file or select the original filename to resume; use another version for a different file.",
          );
        }
        selectedHash = await digest(selectedFile);
        await checkIdentity(controller);
        if (!objectName) {
          // Reserve the exact path first: Storage RLS checks this actual draft row.
          current = await saveRecord(
            workspace,
            collection,
            { storage_object_name: requestedPath },
            current,
          );
          await checkIdentity(controller);
          objectName = requestedPath;
          cache.setQueryData(recordKey, current);
        }
      }
      if (!objectName) throw new Error("No upload is reserved for this version.");
      const existing = await storage.info(objectName);
      await checkIdentity(controller);
      let objectId: string;
      let metadata: { sha256: string; media_type: string | null; byte_size: number };
      if (existing.error) {
        // Network/auth failures are not evidence that an object is missing.
        const missing =
          "statusCode" in existing.error && String(existing.error.statusCode) === "404";
        if (!missing) throw new Error(existing.error.message);
        if (!selectedFile || !selectedHash)
          throw new Error(
            "No file reached Storage at this path. Select the original file and upload it again.",
          );
        const uploaded = await storage.upload(objectName, selectedFile, { upsert: false });
        if (uploaded.error)
          throw new Error(
            `${uploaded.error.message} If the upload reached Storage, use Recover uploaded file.`,
          );
        objectId = uploaded.data.id;
        metadata = {
          sha256: selectedHash,
          media_type: selectedFile.type || null,
          byte_size: selectedFile.size,
        };
      } else {
        // Recover from a lost upload response or failed metadata save. Derive metadata
        // from the actual stored bytes instead of assuming a selected file matches.
        const stored = await storage.download(objectName);
        if (stored.error) throw new Error(stored.error.message);
        if (stored.data.size > MAX_STORED_BYTES)
          throw new Error("The stored object exceeds the evidence file size limit.");
        const actualHash = await digest(stored.data);
        if (selectedHash && actualHash !== selectedHash)
          throw new Error(
            "A different file already exists at this path. Recover that upload or create another version; it was not overwritten.",
          );
        objectId = existing.data.id;
        metadata = {
          sha256: actualHash,
          media_type: stored.data.type || null,
          byte_size: stored.data.size,
        };
      }
      await checkIdentity(controller);
      if (!objectId)
        throw new Error(
          "Storage did not return an object ID. Recover the upload before publishing this version.",
        );
      const saved = await saveRecord(
        workspace,
        collection,
        { storage_object_id: objectId, ...metadata },
        current,
      );
      await checkIdentity(controller);
      cache.setQueryData(recordKey, saved);
      setFile(null);
      onDirtyChange?.(false);
      toast.add({
        type: "success",
        title: kind === "upload" ? "File attached" : "Upload recovered",
        description: objectName.split("/").at(-1),
      });
    } catch (cause) {
      if (!controller.signal.aborted)
        setFailure({
          operation: kind,
          message:
            cause instanceof Error
              ? cause.message
              : "The file could not be attached. Your selected file is retained; retry or recover the upload.",
        });
    } finally {
      finish(controller);
    }
  }
  async function download() {
    if (!hasFile || !path) return;
    const controller = begin("download");
    if (!controller) return;
    try {
      const token = await checkIdentity(controller);
      const size = typeof record["byte_size"] === "number" ? record["byte_size"] : MAX_STORED_BYTES;
      const { data, error: downloadError } = await privateStorage(
        token,
        controller.signal,
        transferTimeout(size),
      ).download(path);
      if (downloadError) throw new Error(downloadError.message);
      await checkIdentity(controller);
      downloadBlob(data, storedName);
      announce(`Downloaded ${storedName}.`);
    } catch (cause) {
      if (!controller.signal.aborted)
        setFailure({
          operation: "download",
          message: cause instanceof Error ? cause.message : "The file could not be downloaded.",
        });
    } finally {
      finish(controller);
    }
  }

  function choose(selected: File | undefined) {
    if (!selected) return;
    setFile(selected);
    setProblem(undefined);
    setFailure(null);
    onDirtyChange?.(true);
  }
  function remove() {
    if (!file) return;
    const name = file.name;
    setFile(null);
    setFailure(null);
    onDirtyChange?.(false);
    announce(`Removed ${name}.`);
    // The row took focus with it; the trigger is the control that survives.
    trigger.current?.focus();
  }
  /**
   * Stops the upload in progress. The chosen file stays ready to upload again; a path the upload
   * already reserved stays recoverable through Recover uploaded file.
   */
  function cancel() {
    const controller = operation.current;
    if (!controller || busy !== "upload" || !file) return;
    controller.abort();
    operation.current = null;
    onBusyChange?.(false);
    setBusy(null);
    // The reservation may have been saved before the cancel: the record says what to recover.
    void cache.invalidateQueries({ queryKey: recordKey }).catch(() => {});
    announce(`Cancelled the upload of ${file.name}.`);
    // Cancel went with the upload; the Upload file button is where the reader starts again.
    uploadButton.current?.focus();
  }
  function upload() {
    if (busy) return;
    if (!file) {
      setProblem("Choose a file to upload.");
      trigger.current?.focus();
      return;
    }
    void attach(file);
  }
  const waiting = "Wait for the current file operation to finish.";
  const uploadFailed = failure?.operation === "upload" && !!file;
  const storedSize =
    typeof record["byte_size"] === "number"
      ? formatFileSize(record["byte_size"], { locale })
      : null;
  const storedType = typeof record["media_type"] === "string" ? record["media_type"] : null;

  return (
    <Section title="Evidence file">
      <Stack space="space.200">
        {hasFile && path ? (
          <Attachment state={busy === "download" ? "processing" : "done"} className="w-full">
            <Attachment.Media aria-hidden="true">
              {busy === "download" ? <Spinner isDecorative /> : <FileText />}
            </Attachment.Media>
            <Attachment.Content>
              <Attachment.Title>{storedName}</Attachment.Title>
              <Attachment.Description>
                {busy === "download"
                  ? "Downloading…"
                  : [storedType, storedSize].filter(Boolean).join(" · ") || "Attached file"}
              </Attachment.Description>
            </Attachment.Content>
            <Attachment.Trigger
              aria-label={`Download ${storedName}`}
              title={`Download ${storedName}`}
              onClick={() => void download()}
            />
          </Attachment>
        ) : !writable ? (
          <Text color="color.text.subtle">No uploaded file is attached to this version.</Text>
        ) : null}
        {writable && (
          <Stack space="space.200">
            <Field>
              <FieldLabel>Attach a file</FieldLabel>
              <DropZone
                maxSize={MAX_SELECTED_BYTES}
                disabled={!!busy}
                triggerRef={bindTrigger}
                onSelect={(files) => choose(files[0])}
                // The zone says why it refused; an earlier "Choose a file" no longer applies.
                onReject={() => setProblem(undefined)}
              >
                <FieldDescription>
                  Any type, up to {formatFileSize(MAX_SELECTED_BYTES, { locale })}. Its size, media
                  type and SHA-256 are recorded from the file.
                </FieldDescription>
              </DropZone>
              {problem ? <FieldError>{problem}</FieldError> : null}
            </Field>
            {file ? (
              <Attachment
                state={busy === "upload" ? "uploading" : uploadFailed ? "error" : "idle"}
                className="w-full"
              >
                <Attachment.Media aria-hidden="true">
                  {busy === "upload" ? <Spinner isDecorative /> : <FileText />}
                </Attachment.Media>
                <Attachment.Content>
                  <Attachment.Title>{file.name}</Attachment.Title>
                  <Attachment.Description>
                    {busy === "upload"
                      ? "Uploading…"
                      : uploadFailed
                        ? "Not uploaded. Retry, or remove it and choose another file."
                        : `Ready to upload · ${formatFileSize(file.size, { locale })}`}
                  </Attachment.Description>
                </Attachment.Content>
                {busy === "upload" ? (
                  <Attachment.Actions>
                    <Attachment.Action
                      label={`Cancel uploading ${file.name}`}
                      icon={<X />}
                      onClick={cancel}
                    />
                  </Attachment.Actions>
                ) : (
                  <Attachment.Actions>
                    {uploadFailed ? (
                      <Attachment.Action
                        label={`Retry ${file.name}`}
                        icon={<RotateCcw />}
                        onClick={() => void attach(file)}
                      />
                    ) : null}
                    <Attachment.Action
                      label={`Remove ${file.name}`}
                      icon={<X />}
                      onClick={remove}
                    />
                  </Attachment.Actions>
                )}
              </Attachment>
            ) : null}
            <Inline space="space.150" rowSpace="space.100" shouldWrap>
              <Button
                ref={uploadButton}
                variant="primary"
                isLoading={busy === "upload"}
                loadingLabel={file ? `Uploading ${file.name}` : "Uploading the file"}
                disabledReason={busy && busy !== "upload" ? waiting : undefined}
                onClick={upload}
              >
                Upload file
              </Button>
              {path && (
                <Button
                  variant="secondary"
                  isLoading={busy === "recover"}
                  loadingLabel="Recovering the uploaded file"
                  disabledReason={busy && busy !== "recover" ? waiting : undefined}
                  onClick={() => void attach()}
                >
                  Recover uploaded file
                </Button>
              )}
            </Inline>
            {path && (
              <Text size="small" color="color.text.subtle">
                Reserved filename: {storedName}. If an earlier upload finished but its record did
                not save, recover it without uploading again.
              </Text>
            )}
            <Text size="small" color="color.text.subtle">
              Publish this version after reviewing its provenance.
            </Text>
          </Stack>
        )}
        {failure ? (
          <Alert variant="destructive" role="alert">
            <AlertCircle aria-hidden />
            <AlertTitle>{failureTitles[failure.operation]}</AlertTitle>
            <AlertDescription>{failure.message}</AlertDescription>
          </Alert>
        ) : null}
      </Stack>
    </Section>
  );
}
