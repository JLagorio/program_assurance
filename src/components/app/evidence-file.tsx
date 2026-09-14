import { useEffect, useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useQueryClient } from "@tanstack/react-query";
import { Box, Button, Field, FieldLabel, Inline, Input, Stack } from "@ledger/design-system";
import { getRecord, requireIdentity, saveRecord, type Workspace } from "@/lib/database";
import type { Collection, DataRecord } from "@/lib/records";
import { useWorkspace } from "./workspace";

const MAX_BYTES = 50 * 1024 * 1024;
async function digest(blob: Blob) {
  const hash = await crypto.subtle.digest("SHA-256", await blob.arrayBuffer());
  return Array.from(new Uint8Array(hash), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

// Each operation keeps its original identity, even if another tab changes sign-in.
function privateStorage(token: string, signal: AbortSignal) {
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
              AbortSignal.timeout(30_000),
              ...(init?.signal ? [init.signal] : []),
            ]),
          }),
      },
    },
  ).storage.from("evidence");
}

/** Files are uploaded to private Storage and tied to one actual evidence revision. */
export function EvidenceFile(props: {
  collection: Collection;
  record: DataRecord;
  onBusyChange?: ((busy: boolean) => void) | undefined;
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

function EvidenceFileEditor({
  collection,
  record,
  workspace,
  onBusyChange,
}: {
  collection: Collection;
  record: DataRecord;
  workspace: Workspace;
  onBusyChange?: ((busy: boolean) => void) | undefined;
}) {
  const cache = useQueryClient();
  const operation = useRef<AbortController | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState<"upload" | "recover" | "download" | null>(null);
  const [error, setError] = useState("");
  const path =
    typeof record["storage_object_name"] === "string" ? record["storage_object_name"] : null;
  const hasFile = !!path && !!record["storage_object_id"];
  const writable = workspace.role !== "viewer" && record["state"] === "draft" && !hasFile;
  const recordKey = ["record", workspace.tenantId, collection.name, record.id];
  useEffect(() => () => operation.current?.abort(), []);

  function begin(kind: NonNullable<typeof busy>) {
    if (operation.current) return null;
    const controller = new AbortController();
    operation.current = controller;
    onBusyChange?.(true);
    setBusy(kind);
    setError("");
    return controller;
  }
  function finish(controller: AbortController) {
    if (controller.signal.aborted) return;
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
    const controller = begin(selectedFile ? "upload" : "recover");
    if (!controller) return;
    try {
      const token = await checkIdentity(controller);
      const storage = privateStorage(token, controller.signal);
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
        if (selectedFile.size > MAX_BYTES) throw new Error("Choose a file no larger than 50 MiB.");
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
        if (stored.data.size > MAX_BYTES)
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
    } catch (cause) {
      if (!controller.signal.aborted)
        setError(
          cause instanceof Error
            ? cause.message
            : "The file could not be attached. Your selected file is retained; retry or recover the upload.",
        );
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
      const { data, error: downloadError } = await privateStorage(
        token,
        controller.signal,
      ).download(path);
      if (downloadError) throw new Error(downloadError.message);
      await checkIdentity(controller);
      const url = URL.createObjectURL(data);
      const link = document.createElement("a");
      link.href = url;
      link.download = path.split("/").at(-1) ?? record.id;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
    } catch (cause) {
      if (!controller.signal.aborted)
        setError(cause instanceof Error ? cause.message : "The file could not be downloaded.");
    } finally {
      finish(controller);
    }
  }
  return (
    <Box padding="space.250" backgroundColor="elevation.surface.sunken">
      <Stack space="space.200">
        <h2 className="font-heading-small">Evidence file</h2>
        {hasFile && path ? (
          <Inline space="space.150" alignBlock="center" shouldWrap>
            <span>{path.split("/").at(-1)}</span>
            <Button variant="secondary" disabled={!!busy} onClick={() => void download()}>
              {busy === "download" ? "Downloading…" : "Download file"}
            </Button>
          </Inline>
        ) : (
          <p className="text-subtle">No uploaded file is attached to this version.</p>
        )}
        {writable && (
          <Stack space="space.150">
            <Field>
              <FieldLabel htmlFor="evidence-upload">Attach a file (up to 50 MiB)</FieldLabel>
              <Input
                id="evidence-upload"
                type="file"
                disabled={!!busy}
                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              />
            </Field>
            <Inline space="space.150" shouldWrap>
              <Button
                variant="primary"
                disabled={!file || !!busy}
                onClick={() => file && void attach(file)}
              >
                {busy === "upload" ? "Uploading…" : "Upload file"}
              </Button>
              {path && (
                <Button variant="secondary" disabled={!!busy} onClick={() => void attach()}>
                  {busy === "recover" ? "Recovering…" : "Recover uploaded file"}
                </Button>
              )}
            </Inline>
            {path && (
              <p className="font-body-small text-subtle">
                Reserved filename: {path.split("/").at(-1)}. If an earlier upload finished but its
                record did not save, recover it without uploading again.
              </p>
            )}
            <p className="font-body-small text-subtle">
              File size, media type, and SHA-256 are recorded from the file. Publish this version
              after reviewing its provenance.
            </p>
          </Stack>
        )}
        {error && (
          <p role="alert" className="text-danger">
            {error}
          </p>
        )}
      </Stack>
    </Box>
  );
}
