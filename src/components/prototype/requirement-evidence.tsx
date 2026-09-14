import { useMemo, useRef, useState } from "react";
import { Link, useBlocker } from "@tanstack/react-router";
import {
  Box,
  Button,
  buttonVariants,
  DataTable,
  defineColumns,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Inline,
  KeyValue,
  RecordBrowser,
  Stack,
  useDataTable,
} from "@ledger/design-system";
import { Plus } from "lucide-react";
import { useWorkspace } from "@/components/app/workspace";
import { useModelSave, useRow, useRows, type Row } from "@/lib/models";
import { useLinkRequirementEvidence } from "@/lib/requirement-evidence";
import { labelFor } from "@/lib/records";
import type { CreateEvidenceResult } from "@/lib/evidence-create";
import { CreateEvidenceDialog } from "./create-evidence-dialog";
import { EvidenceVersionDetails } from "./evidence-version-details";
import { EmptyState, QueryState } from "./work-common";
import { displayDate } from "./work-format";

type EvidenceChoice = {
  id: string;
  title: string;
  versionLabel: string;
  kind: string;
  owner: string;
  context: string;
  state: string;
  collected: string;
  artifact: Row<"evidence_artifacts">;
  version: Row<"evidence_versions">;
};

const pickerColumns = defineColumns<EvidenceChoice>((c) => [
  c.id("versionLabel", { header: "Version", width: 120, hideable: false }),
  c.text("title", { header: "Artifact", minWidth: 260, hideable: false }),
  c.text("kind", { header: "Kind", width: 130 }),
  c.status("state", { header: "State", width: 115, tone: () => "success" }),
  c.text("owner", { header: "Owner", width: 165 }),
  c.text("context", { header: "Context", width: 150 }),
  c.text("collected", { header: "Collected", width: 125 }),
]);

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
  const writable =
    !readOnly && workspace.role !== "viewer" && requirement.data?.tenant_id === workspace.tenantId;
  const contextValid = identity.data?.program_id === programId;
  const queries = [requirement, identity, links, artifacts, versions, parties];
  const ready = queries.every((query) => query.data !== undefined && !query.error);
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
            state: labelFor(version.state),
            owner: artifact.owner_party_id
              ? (parties.data?.find((party) => party.id === artifact.owner_party_id)?.name ??
                "Unavailable owner")
              : "Not recorded",
            context: artifact.program_id ? "This program" : "Workspace",
            collected: displayDate(version.collected_at),
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
  const linkedIds = new Set((links.data ?? []).map((row) => row.evidence_version_id));
  const linked = all.filter((row) => linkedIds.has(row.id));
  const eligible = all.filter(
    (row) =>
      row.version.state === "published" &&
      (!row.artifact.program_id || row.artifact.program_id === programId) &&
      !linkedIds.has(row.id),
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
  const columns = useMemo(
    () =>
      defineColumns<EvidenceChoice>((c) => [
        c.id("versionLabel", {
          header: "Version",
          width: 130,
          hideable: false,
          preview: (row) => setPreviewId(row.id),
          active: (row) => row.id === previewId,
        }),
        c.text("title", { header: "Artifact", minWidth: 240, hideable: false }),
        c.text("kind", { header: "Kind", width: 135 }),
        c.text("owner", { header: "Owner", width: 165 }),
        c.text("collected", { header: "Collected", width: 130 }),
      ]),
    [previewId],
  );
  const table = useDataTable({
    data: linked,
    columns,
    getRowId: (row) => row.id,
    label: "Linked evidence",
    pageSize: 10,
    resizable: true,
    reorderable: true,
  });
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
  async function confirm(records: EvidenceChoice[]) {
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
    } finally {
      inFlight.current = false;
    }
  }
  return (
    <Stack space="space.150">
      <Inline alignBlock="center" space="space.150" shouldWrap>
        <p className="min-w-0 flex-1 text-subtle">
          Evidence is pinned to the exact published version supporting this requirement.
        </p>
        {writable ? (
          <Button
            iconBefore={<Plus />}
            size="small"
            variant="primary"
            disabled={!ready || !contextValid}
            onClick={beginBrowse}
          >
            Add evidence
          </Button>
        ) : null}
      </Inline>
      <QueryState queries={queries}>
        <DataTable
          table={table}
          onRowClick={(row) => setPreviewId(row.id)}
          toolbar={
            <Inline space="space.100" alignBlock="center">
              <DataTable.Search table={table} placeholder="Find linked evidence" />
              <DataTable.Columns table={table} />
            </Inline>
          }
          empty={{
            title: "No linked evidence",
            description: "Choose published evidence versions that support this requirement.",
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
          <DialogContent
            style={{ width: "90vw", maxWidth: "none", height: "90dvh", maxHeight: "90dvh" }}
          >
            <DialogHeader>
              <DialogTitle>Add evidence</DialogTitle>
              <DialogDescription>
                Choose published evidence from this program or unscoped workspace artifacts.
              </DialogDescription>
            </DialogHeader>
            <Box padding="space.250" className="border-b border-default">
              <KeyValue label="Requirement">
                {identity.data?.code} · {requirement.data?.title}
              </KeyValue>
            </Box>
            <Box padding="space.250" className="min-h-0 flex-1 overflow-y-auto">
              <EmptyState
                illustration="document"
                title={
                  publishedVersions.length
                    ? "All available evidence is already linked"
                    : "No published evidence available"
                }
                description={
                  publishedVersions.length
                    ? `${publishedVersions.length} published ${publishedVersions.length === 1 ? "version is" : "versions are"} already linked to this requirement.`
                    : draftVersions.length
                      ? `${draftVersions.length} draft evidence ${draftVersions.length === 1 ? "version exists" : "versions exist"} in this program or the workspace. Drafts become available here after publication.`
                      : "This program and the workspace have no published evidence versions to link."
                }
                action={
                  <Stack space="space.150">
                    {publishedVersions.length && draftVersions.length ? (
                      <p className="font-body-small text-subtle">
                        {draftVersions.length} additional draft evidence{" "}
                        {draftVersions.length === 1 ? "version is" : "versions are"} waiting for
                        publication.
                      </p>
                    ) : null}
                    {draftsWithoutSource.length ? (
                      <p className="font-body-small text-subtle">
                        {draftsWithoutSource.length} of these drafts still need an uploaded file or
                        an external reference before they can be published.
                      </p>
                    ) : null}
                    <Inline alignInline="center" space="space.100" shouldWrap>
                      <Link
                        className={buttonVariants({ variant: "secondary" })}
                        to="/programs/$programId"
                        params={{ programId }}
                        search={{ tab: "Evidence" }}
                      >
                        Open program evidence
                      </Link>
                      <Button variant="primary" onClick={() => setSurface("create")}>
                        New evidence / Upload
                      </Button>
                    </Inline>
                  </Stack>
                }
              />
            </Box>
            <DialogFooter>
              <Button onClick={closeBrowser}>Close</Button>
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
          onConfirm={confirm}
          confirmLabel="Link evidence"
          context={
            <Stack space="space.100">
              <KeyValue label="Requirement">
                {identity.data?.code} · {requirement.data?.title}
              </KeyValue>
              <p className="font-body-small text-subtle">
                Only this program’s evidence and unscoped workspace artifacts are available. Each
                row is a specific version. Already linked versions are excluded.
              </p>
              {!ready ? (
                <p role="alert" className="text-danger">
                  Evidence records could not be loaded completely. Close the browser and retry
                  loading the requirement.
                </p>
              ) : null}
            </Stack>
          }
          actions={
            <Button
              size="small"
              disabled={link.isPending}
              onClick={() => {
                if (!inFlight.current) setSurface("create");
              }}
            >
              New evidence / Upload
            </Button>
          }
        />
      ) : null}
      {surface === "create" ? (
        <CreateEvidenceDialog
          programId={programId}
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
          onClose={() => setSurface("browse")}
        />
      ) : null}
      {preview && !surface ? (
        <Dialog
          open
          onOpenChange={(open) => {
            if (!open) setPreviewId(null);
          }}
        >
          <DialogContent style={{ maxWidth: 800, height: "85dvh" }}>
            <DialogHeader>
              <DialogTitle>{preview.title}</DialogTitle>
              <DialogDescription>
                Evidence linked to {identity.data?.code} · Version {preview.version.version_number}
              </DialogDescription>
            </DialogHeader>
            <Box padding="space.250" className="min-h-0 flex-1 overflow-y-auto">
              <EvidenceVersionDetails artifact={preview.artifact} version={preview.version} />
              {(links.data ?? [])
                .filter((row) => row.evidence_version_id === preview.id)
                .map((row) => (
                  <Stack key={row.id} space="space.150" className="pt-200">
                    {row.claim ? (
                      <KeyValue label="Claim" wrap>
                        {row.claim}
                      </KeyValue>
                    ) : null}
                    {row.applicability_rationale ? (
                      <KeyValue label="Applicability rationale" wrap>
                        {row.applicability_rationale}
                      </KeyValue>
                    ) : null}
                  </Stack>
                ))}
            </Box>
            <DialogFooter>
              <Button onClick={() => setPreviewId(null)}>Close preview</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : null}
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
  onClose: () => void;
}) {
  const workspace = useWorkspace();
  const artifact = useRow("evidence_artifacts", artifactId);
  const version = useRow("evidence_versions", versionId);
  const parties = useRows("parties");
  const publish = useModelSave("evidence_versions");
  const busy = useRef(false);
  const fileInFlight = useRef(false);
  const [fileBusy, setFileBusy] = useState(false);
  const [error, setError] = useState("");
  const current = version.data;
  const me = parties.data?.find((party) => party.auth_user_id === workspace.userId);
  const canPublish =
    !!current &&
    current.state === "draft" &&
    !!(current.external_uri || current.storage_object_id) &&
    !(current.storage_object_name && !current.storage_object_id) &&
    workspace.role !== "viewer";
  useBlocker({
    shouldBlockFn: () => busy.current || fileInFlight.current,
    enableBeforeUnload: () => busy.current || fileInFlight.current,
  });
  function close() {
    if (!busy.current && !fileInFlight.current) onClose();
  }
  async function publishVersion() {
    if (busy.current || fileInFlight.current || !current || !canPublish) return;
    busy.current = true;
    setError("");
    try {
      await publish.mutateAsync({
        id: current.id,
        revision: current.revision,
        values: { state: "published", ...(me ? { published_by_party_id: me.id } : {}) },
      });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The version could not be published.");
    } finally {
      busy.current = false;
    }
  }
  return (
    <Dialog
      open
      onOpenChange={(open, details) => {
        if (!open) {
          details.cancel();
          close();
        }
      }}
    >
      <DialogContent
        style={{ maxWidth: 800, height: "85dvh" }}
        showCloseButton={!publish.isPending && !fileBusy}
      >
        <DialogHeader>
          <DialogTitle>{artifact.data?.title ?? "Prepare evidence"}</DialogTitle>
          <DialogDescription>
            Attach a file or review the external reference, then publish this version when ready.
          </DialogDescription>
        </DialogHeader>
        <Box padding="space.250" className="min-h-0 flex-1 overflow-y-auto">
          <QueryState queries={[artifact, version, parties]}>
            {artifact.data && current ? (
              <fieldset disabled={publish.isPending} className="min-w-0 border-0 p-0">
                <EvidenceVersionDetails
                  artifact={artifact.data}
                  version={current}
                  onFileBusyChange={(active) => {
                    fileInFlight.current = active;
                    setFileBusy(active);
                  }}
                />
              </fieldset>
            ) : null}
          </QueryState>
          {current?.state === "draft" ? (
            <p className="pt-200 text-subtle">
              Publishing freezes this version and makes it available in the evidence browser. It
              does not record a review decision or link it automatically.
            </p>
          ) : null}
          {current?.state === "published" ? (
            <p role="status" className="pt-200">
              Version published. Return to the browser and select it to link it to this requirement.
            </p>
          ) : null}
          {error ? (
            <p role="alert" className="pt-200 text-danger">
              {error}
            </p>
          ) : null}
        </Box>
        <DialogFooter>
          <Button disabled={publish.isPending || fileBusy} onClick={close}>
            Back to evidence browser
          </Button>
          {current?.state === "draft" ? (
            <Button
              variant="primary"
              isLoading={publish.isPending}
              disabled={!canPublish || publish.isPending || fileBusy}
              onClick={() => void publishVersion()}
            >
              Publish version
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
