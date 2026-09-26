import { useConfirmation } from "@/components/app/confirmation";
import { useDraftGuard } from "@/components/app/use-draft-guard";
import { ProductCollection } from "./product-collection";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useBlocker, useNavigate } from "@tanstack/react-router";
import { AlertCircle, MoreHorizontal, Plus } from "lucide-react";
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  defineColumns,
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  FieldSet,
  IconButton,
  KeyValue,
  LinkButton,
  Prose,
  RecordBrowser,
  Stack,
  Text,
  toast,
  useDataTable,
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyMedia,
  EmptyIllustration,
  EmptyDescription,
  EmptyContent,
} from "@ledger/design-system";
import { useWorkspace } from "@/components/app/workspace";
import { useModelSave, useRow, useRows, type Row } from "@/lib/models";
import { useLinkRequirementEvidence } from "@/lib/requirement-evidence";
import { useRemoveRequirementLink } from "@/lib/requirement-links";
import { labelFor } from "@/lib/records";
import { revisionStates } from "@/lib/status";
import type { CreateEvidenceResult } from "@/lib/evidence-create";
import { CreateEvidenceDialog } from "./create-evidence-dialog";
import { EvidenceFacts, EvidenceVersionDetails } from "./evidence-version-details";
import {
  RecordLink,
  RecordPreviewActions,
  RecordPreviewPanel,
  recordDestination,
  useDisplayedRecords,
  useRemovalFocus,
} from "./record-preview";
import { QueryState } from "./work-common";

type EvidenceChoice = {
  id: string;
  title: string;
  versionLabel: string;
  kind: string;
  owner: string;
  context: string;
  state: string;
  collected: string | undefined;
  artifact: Row<"evidence_artifacts">;
  version: Row<"evidence_versions">;
};

const pickerColumns = defineColumns<EvidenceChoice>((c) => [
  c.id("versionLabel", { header: "Version", width: 120, hideable: false }),
  c.text("title", { header: "Artifact", minWidth: 260, hideable: false }),
  c.text("kind", { header: "Kind", width: 130 }),
  c.status("state", { header: "State", width: 115, statuses: revisionStates }),
  c.text("owner", { header: "Owner", width: 165 }),
  c.text("context", { header: "Context", width: 150 }),
  c.date("collected", { header: "Collected", width: 125 }),
]);

const plural = (count: number, one: string, many = `${one}s`) =>
  `${count} ${count === 1 ? one : many}`;

export function RequirementEvidence({
  programId,
  requirementRevisionId,
  readOnly = false,
}: {
  programId: string;
  requirementRevisionId: string;
  readOnly?: boolean;
}) {
  const workspace = useWorkspace();
  const navigate = useNavigate();
  const requirement = useRow("requirement_revisions", requirementRevisionId);
  const identity = useRow("engineering_requirements", requirement.data?.engineering_requirement_id);
  const links = useRows("requirement_evidence", { requirement_revision_id: requirementRevisionId });
  const artifacts = useRows("evidence_artifacts");
  const versions = useRows("evidence_versions");
  const parties = useRows("parties");
  const [surface, setSurface] = useState<"browse" | "create" | "prepare" | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [created, setCreated] = useState<CreateEvidenceResult | null>(null);
  const pendingCreated = useRef<CreateEvidenceResult | null>(null);
  const inFlight = useRef(false);
  const link = useLinkRequirementEvidence();
  const remove = useRemoveRequirementLink();
  const { confirm, confirmation } = useConfirmation();
  const collection = workspace.collections.find((item) => item.name === "requirement_evidence");
  const writable =
    !readOnly && workspace.role !== "viewer" && requirement.data?.tenant_id === workspace.tenantId;
  const canUnlink = writable && !!collection?.can_delete;
  const contextValid = identity.data?.program_id === programId;
  const queries = [requirement, identity, links, artifacts, versions, parties];
  const ready = queries.every((query) => query.data !== undefined && !query.error);
  const requirementName = identity.data
    ? `${identity.data.code} · ${requirement.data?.title ?? ""}`
    : (requirement.data?.title ?? "This requirement");
  const all = useMemo<EvidenceChoice[]>(() => {
    const artifactMap = new Map((artifacts.data ?? []).map((row) => [row.id, row]));
    return (versions.data ?? [])
      .flatMap((version) => {
        const artifact = artifactMap.get(version.artifact_id);
        if (!artifact) return [];
        return [
          {
            id: version.id,
            title: artifact.title,
            versionLabel: `Version ${version.version_number}`,
            kind: labelFor(artifact.artifact_kind),
            state: version.state,
            owner: artifact.owner_party_id
              ? (parties.data?.find((party) => party.id === artifact.owner_party_id)?.name ??
                "Unavailable owner")
              : "Not recorded",
            context: artifact.program_id ? "This program" : "Workspace",
            collected: version.collected_at ?? undefined,
            artifact,
            version,
          },
        ];
      })
      .sort(
        (a, b) =>
          a.title.localeCompare(b.title) || b.version.version_number - a.version.version_number,
      );
  }, [artifacts.data, versions.data, parties.data]);
  const linkFor = useMemo(
    () => new Map((links.data ?? []).map((row) => [row.evidence_version_id, row])),
    [links.data],
  );
  const linked = useMemo(() => all.filter((row) => linkFor.has(row.id)), [all, linkFor]);
  const eligible = all.filter(
    (row) =>
      row.version.state === "published" &&
      (!row.artifact.program_id || row.artifact.program_id === programId) &&
      !linkFor.has(row.id),
  );
  const availableVersions = all.filter(
    (row) => !row.artifact.program_id || row.artifact.program_id === programId,
  );
  const draftVersions = availableVersions.filter((row) => row.version.state === "draft");
  const draftsWithoutSource = draftVersions.filter(
    (row) => !row.version.external_uri && !row.version.storage_object_id,
  );
  const publishedVersions = availableVersions.filter((row) => row.version.state === "published");
  const preview = all.find((row) => row.id === previewId);
  const focus = useRemovalFocus(linked);
  async function unlink(row: EvidenceChoice) {
    const record = linkFor.get(row.id);
    if (!record) return;
    const name = `${row.title}, ${row.versionLabel.toLowerCase()}`;
    const removed = await confirm({
      title: "Unlink evidence?",
      description: `${name} will no longer support ${requirementName}. The evidence version is kept; the claim and rationale recorded on this link are removed.`,
      confirmLabel: "Unlink evidence",
      variant: "danger",
      failureTitle: "The evidence was not unlinked",
      action: () => {
        focus.removed(row.id);
        return remove.mutateAsync({
          table: "requirement_evidence",
          id: record.id,
          revision: record.revision,
        });
      },
    });
    if (!removed) return;
    setPreviewId((current) => (current === row.id ? null : current));
    toast.add({
      type: "success",
      title: "Evidence unlinked",
      description: `${name} no longer supports this requirement.`,
    });
  }
  const columns = useMemo(
    () =>
      defineColumns<EvidenceChoice>((c) => [
        c.id("versionLabel", {
          header: "Version",
          width: 130,
          priority: 1,
          hideable: false,
          preview: (row) => setPreviewId(row.id),
          active: (row) => row.id === previewId,
        }),
        c.text("title", {
          header: "Artifact",
          minWidth: 180,
          priority: 0,
          hideable: false,
          cell: (row) => (
            <RecordLink table="evidence_versions" record={row.version}>
              {row.title}
            </RecordLink>
          ),
        }),
        c.text("kind", { header: "Kind", width: 135 }),
        c.text("owner", { header: "Owner", width: 165 }),
        c.date("collected", { header: "Collected", width: 130 }),
        ...(canUnlink
          ? [
              c.actions((row: EvidenceChoice) => [
                {
                  label: "Unlink evidence",
                  tone: "danger" as const,
                  onSelect: () => void unlink(row),
                },
              ]),
            ]
          : []),
      ]),
    // unlink reads the row it is given and the current links.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [previewId, canUnlink, linkFor],
  );
  const table = useDataTable({
    data: linked,
    columns,
    getRowId: (row) => row.id,
    rowLabel: (row) => `${row.title}, ${row.versionLabel}`,
    label: "Linked evidence",
    pageSize: 10,
    resizable: true,
    reorderable: true,
  });
  const displayed = useDisplayedRecords(table);
  useBlocker({ shouldBlockFn: () => inFlight.current, enableBeforeUnload: () => inFlight.current });
  function closeBrowser() {
    if (inFlight.current) return;
    setSurface(null);
    setSelectedIds([]);
  }
  function beginBrowse() {
    setPreviewId(null);
    setSelectedIds([]);
    setSurface("browse");
  }
  async function confirmLink(records: EvidenceChoice[]) {
    if (inFlight.current) return;
    if (!writable || !contextValid || !ready)
      throw new Error("Reload this requirement before linking evidence.");
    inFlight.current = true;
    try {
      await link.mutateAsync({
        programId,
        requirementRevisionId,
        evidenceVersionIds: records.map((row) => row.id),
      });
      toast.add({
        type: "success",
        title: `${plural(records.length, "evidence version")} linked`,
        description: records.map((row) => `${row.title}, ${row.versionLabel}`).join("; "),
      });
    } finally {
      inFlight.current = false;
    }
  }
  const unavailable = !ready
    ? "The evidence is still loading."
    : !contextValid
      ? "Reload this requirement to add evidence to it."
      : undefined;
  const addEvidence = writable ? (
    <Button
      ref={(node: HTMLButtonElement | null) => {
        focus.target.current = node;
      }}
      iconBefore={<Plus />}
      size="small"
      variant="primary"
      disabledReason={unavailable}
      onClick={beginBrowse}
    >
      Add evidence
    </Button>
  ) : null;
  const previewLink = preview ? linkFor.get(preview.id) : undefined;
  return (
    <Stack space="space.150">
      <QueryState queries={queries}>
        <ProductCollection
          table={table}
          onRowClick={(row) => void navigate(recordDestination("evidence_versions", row.version))}
          fill
          searchLabel="Find linked evidence"
          action={addEvidence}
          empty={{
            illustration: "document",
            title: "No linked evidence",
            description: "Choose published evidence versions that support this requirement.",
            action: addEvidence,
          }}
        />
      </QueryState>
      {surface === "browse" && ready && !eligible.length ? (
        <Dialog
          open
          onOpenChange={(open, details) => {
            if (!open) {
              details.cancel();
              closeBrowser();
            }
          }}
        >
          <DialogContent width="medium">
            <DialogHeader>
              <DialogTitle>Add evidence</DialogTitle>
              <DialogDescription>{requirementName}</DialogDescription>
            </DialogHeader>
            <DialogBody>
              <Empty>
                <EmptyMedia aria-hidden>
                  <EmptyIllustration kind="document" />
                </EmptyMedia>
                <EmptyHeader>
                  <EmptyTitle>
                    {publishedVersions.length
                      ? "All available evidence is already linked"
                      : "No published evidence available"}
                  </EmptyTitle>
                  <EmptyDescription>
                    {publishedVersions.length
                      ? `${publishedVersions.length} published ${publishedVersions.length === 1 ? "version is" : "versions are"} already linked to this requirement.`
                      : draftVersions.length
                        ? `${plural(draftVersions.length, "draft evidence version")} in this program or the workspace ${draftVersions.length === 1 ? "becomes" : "become"} available here once published.`
                        : "This program and the workspace have no published evidence versions to link."}
                    {publishedVersions.length && draftVersions.length
                      ? ` ${plural(draftVersions.length, "more draft version")} ${draftVersions.length === 1 ? "is" : "are"} waiting for publication.`
                      : ""}
                    {draftsWithoutSource.length
                      ? ` ${draftsWithoutSource.length} of the drafts still ${draftsWithoutSource.length === 1 ? "needs" : "need"} an uploaded file or an external reference before publication.`
                      : ""}
                  </EmptyDescription>
                </EmptyHeader>
                <EmptyContent>
                  <LinkButton
                    variant="secondary"
                    render={
                      <Link
                        to="/programs/$programId"
                        params={{ programId }}
                        search={{ tab: "Evidence" }}
                      />
                    }
                  >
                    Open program evidence
                  </LinkButton>
                </EmptyContent>
              </Empty>
            </DialogBody>
            <DialogFooter>
              <DialogClose render={<Button variant="subtle" />}>Close</DialogClose>
              <Button variant="primary" onClick={() => setSurface("create")}>
                Create evidence artifact
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : surface === "browse" ? (
        <RecordBrowser
          open
          title="Add evidence"
          description="Search, preview, and select published versions to link to this requirement."
          records={eligible}
          columns={pickerColumns}
          filters={["kind", "owner", "context"]}
          recordTitle={(row) => row.title}
          renderPreview={(row) => (
            <EvidenceVersionDetails artifact={row.artifact} version={row.version} />
          )}
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          onClose={closeBrowser}
          onConfirm={confirmLink}
          confirmLabel="Link evidence"
          context={
            <Stack space="space.100">
              <KeyValue label="Requirement">{requirementName}</KeyValue>
              <Text as="p" size="small" color="color.text.subtle">
                Only this program’s evidence and unscoped workspace artifacts are available. Each
                row is a specific version. Already linked versions are excluded.
              </Text>
              {!ready ? (
                <Alert variant="destructive" role="alert">
                  <AlertCircle aria-hidden />
                  <AlertTitle>The evidence could not be loaded completely</AlertTitle>
                  <AlertDescription>Close the browser and reload the requirement.</AlertDescription>
                </Alert>
              ) : null}
            </Stack>
          }
          actions={
            <Button
              size="small"
              onClick={() => {
                if (!inFlight.current) setSurface("create");
              }}
            >
              Create evidence artifact
            </Button>
          }
        />
      ) : null}
      {surface === "create" ? (
        <CreateEvidenceDialog
          programId={programId}
          // The opener leaves with the browser; the next surface takes focus when it opens.
          finalFocus={false}
          onCreated={(result) => {
            pendingCreated.current = result;
            setCreated(result);
          }}
          onClose={() => {
            setSurface(pendingCreated.current ? "prepare" : "browse");
            pendingCreated.current = null;
          }}
        />
      ) : null}
      {surface === "prepare" && created ? (
        <PrepareEvidence
          versionId={created.versionId}
          artifactId={created.artifactId}
          onClose={(published) => {
            // A version published here is what the reader came to link: it returns chosen.
            if (published)
              setSelectedIds((current) =>
                current.includes(created.versionId) ? current : [...current, created.versionId],
              );
            setSurface("browse");
          }}
        />
      ) : null}
      {preview && !surface ? (
        <RecordPreviewPanel
          title={preview.title}
          label="Evidence version preview"
          defaultWidth={640}
          onClose={() => setPreviewId(null)}
          recordActions={
            canUnlink && previewLink ? (
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <IconButton
                      size="small"
                      variant="subtle"
                      label="Linked evidence actions"
                      icon={<MoreHorizontal />}
                    />
                  }
                />
                <DropdownMenuContent align="end">
                  <DropdownMenuItem variant="danger" onClick={() => void unlink(preview)}>
                    Unlink evidence
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : undefined
          }
          navigation={
            <RecordPreviewActions
              table="evidence_versions"
              record={preview.version}
              rows={displayed}
              onSelect={(row) => setPreviewId(row.id)}
            />
          }
        >
          <Stack space="space.200">
            {previewLink ? (
              <EvidenceFacts
                facts={[
                  ["Claim", previewLink.claim ? <Prose>{previewLink.claim}</Prose> : null],
                  [
                    "Applicability rationale",
                    previewLink.applicability_rationale ? (
                      <Prose>{previewLink.applicability_rationale}</Prose>
                    ) : null,
                  ],
                ]}
              />
            ) : null}
            <EvidenceVersionDetails artifact={preview.artifact} version={preview.version} />
          </Stack>
        </RecordPreviewPanel>
      ) : null}
      {confirmation}
    </Stack>
  );
}

function PrepareEvidence({
  artifactId,
  versionId,
  onClose,
}: {
  artifactId: string;
  versionId: string;
  /** Called once the dialog has closed; `published` when this version was published here. */
  onClose: (published: boolean) => void;
}) {
  const workspace = useWorkspace();
  const artifact = useRow("evidence_artifacts", artifactId);
  const version = useRow("evidence_versions", versionId);
  const parties = useRows("parties");
  const publish = useModelSave("evidence_versions");
  const [open, setOpen] = useState(true);
  const [fileBusy, setFileBusy] = useState(false);
  const [fileDirty, setFileDirty] = useState(false);
  const uploading = useRef(false);
  // An upload in flight holds the route as a pending save does; the Dialog's `pending` holds it.
  useBlocker({
    shouldBlockFn: () => uploading.current,
    enableBeforeUnload: () => uploading.current,
  });
  const published = useRef(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const publishRef = useRef<HTMLButtonElement>(null);
  const backRef = useRef<HTMLButtonElement>(null);
  const guard = useDraftGuard({
    dirty: fileDirty,
    onClose: () => setOpen(false),
    description: "The file you chose has not been uploaded and will be lost.",
  });
  const current = version.data;
  const me = parties.data?.find((party) => party.auth_user_id === workspace.userId);
  const busy = guard.busy || fileBusy;
  // The file control is the task's first step. When the version was still loading as the dialog
  // opened, focus moves to it once it appears.
  const arrived = useRef(false);
  const loaded = !!artifact.data && !!current;
  useEffect(() => {
    if (!loaded || arrived.current) return;
    arrived.current = true;
    const frame = requestAnimationFrame(() => trigger.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [loaded]);
  const unpublishable = !current
    ? "The version is still loading."
    : workspace.role === "viewer"
      ? "An editor, admin, or owner can publish evidence."
      : current.storage_object_name && !current.storage_object_id
        ? "Finish the upload before publishing."
        : !(current.external_uri || current.storage_object_id)
          ? "Attach a file or record an external reference before publishing."
          : undefined;
  // Publishing takes the Publish button away with the draft state; the next step, back to the
  // browser where the version is chosen, takes focus once the prompt has let go of it. The prompt
  // hands focus back to the last opener it can still find, which may be outside this dialog.
  const state = current?.state;
  useEffect(() => {
    if (state !== "published" || !published.current) return;
    let waited = 0;
    let held = 0;
    let frame = 0;
    const settle = () => {
      const active = document.activeElement;
      if (active?.closest('[role="alertdialog"]')) {
        if (waited++ < 120) frame = requestAnimationFrame(settle);
        return;
      }
      const dialog = backRef.current?.closest('[role="dialog"]');
      if (dialog && !dialog.contains(active)) backRef.current?.focus();
      if (held++ < 10) frame = requestAnimationFrame(settle);
    };
    frame = requestAnimationFrame(settle);
    return () => cancelAnimationFrame(frame);
  }, [state]);
  /** Publishing cannot be undone: the shared prompt asks, runs it, and says a failure there. */
  async function publishVersion() {
    if (busy || !current || unpublishable) return;
    const version = current;
    // The dialog stays open and says the result itself ("Version published…"), so no toast: at a
    // phone's width one would cover the footer that now holds focus.
    await guard.confirm({
      title: `Publish version ${version.version_number}?`,
      description:
        "A published version cannot be changed or deleted. It becomes available to link in the evidence browser; publishing does not record a review decision.",
      confirmLabel: "Publish version",
      variant: "primary",
      failureTitle: "The version was not published",
      action: async () => {
        if (!guard.start()) throw new Error("Wait for the current change to finish.");
        try {
          await publish.mutateAsync({
            id: version.id,
            revision: version.revision,
            values: { state: "published", ...(me ? { published_by_party_id: me.id } : {}) },
          });
          published.current = true;
        } finally {
          guard.finish();
        }
      },
    });
  }
  return (
    <Dialog
      open={open}
      pending={busy}
      onOpenChange={(next, details) => {
        if (next) return;
        details.cancel();
        void guard.close();
      }}
      onOpenChangeComplete={(next) => {
        if (!next) onClose(published.current || current?.state === "published");
      }}
    >
      <DialogContent width="large" initialFocus={() => trigger.current ?? true}>
        <DialogHeader>
          <DialogTitle>Prepare evidence</DialogTitle>
          <DialogDescription>
            Attach a file or review the external reference, then publish this version when ready.
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          <Stack space="space.200">
            <QueryState queries={[artifact, version, parties]}>
              {artifact.data && current ? (
                <FieldSet disabled={guard.busy}>
                  <EvidenceVersionDetails
                    artifact={artifact.data}
                    version={current}
                    triggerRef={trigger}
                    onFileDirtyChange={setFileDirty}
                    onFileBusyChange={(active) => {
                      uploading.current = active;
                      setFileBusy(active);
                    }}
                  />
                </FieldSet>
              ) : null}
            </QueryState>
            {current?.state === "draft" ? (
              <Text as="p" color="color.text.subtle">
                Publishing freezes this version and makes it available in the evidence browser. It
                does not record a review decision or link it automatically.
              </Text>
            ) : null}
            {current?.state === "published" ? (
              <Alert role="status">
                <AlertDescription>
                  Version published. Return to the browser to link it: it is already chosen there.
                </AlertDescription>
              </Alert>
            ) : null}
          </Stack>
        </DialogBody>
        <DialogFooter>
          <DialogClose render={<Button ref={backRef} variant="subtle" />}>
            Back to evidence browser
          </DialogClose>
          {current?.state === "draft" ? (
            <Button
              ref={publishRef}
              variant="primary"
              isLoading={guard.busy}
              disabledReason={unpublishable}
              onClick={() => void publishVersion()}
            >
              Publish version
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
      {guard.confirmation}
    </Dialog>
  );
}
