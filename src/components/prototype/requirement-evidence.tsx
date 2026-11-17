import { useConfirmation } from "@/components/app/confirmation";
import { useDraftGuard } from "@/components/app/use-draft-guard";
import { ProductCollection } from "./product-collection";
import { useServerPage } from "./collection-question";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { UseQueryResult } from "@tanstack/react-query";
import { Link, useBlocker } from "@tanstack/react-router";
import { MoreHorizontal, Plus } from "lucide-react";
import {
  Absent,
  Alert,
  AlertDescription,
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
  Person,
  Prose,
  RecordBrowser,
  Stack,
  Text,
  toast,
  useDataTable,
  type FilterOption,
  type RecordBrowserQuery,
} from "@ledger/design-system";
import { useWorkspace } from "@/components/app/workspace";
import { idSet, useModelSave, useRow, useRows, type Row } from "@/lib/models";
import { ownerField } from "@/lib/owner-assign";
import { useLinkRequirementEvidence } from "@/lib/requirement-evidence";
import { useRemoveRequirementLink } from "@/lib/requirement-links";
import { labelFor } from "@/lib/records";
import {
  serverRead,
  useServerCountQueries,
  type ServerResultQuestion,
  type ServerRow,
} from "@/lib/server-table";
import { revisionStates } from "@/lib/status";
import { createEvidenceSchema, type CreateEvidenceResult } from "@/lib/evidence-create";
import { CreateEvidenceDialog } from "./create-evidence-dialog";
import { EvidenceFacts, EvidenceVersionDetails } from "./evidence-version-details";
import {
  RecordLink,
  RecordPreviewActions,
  RecordPreviewPanel,
  useDisplayedRecords,
  useRemovalFocus,
  useEndOnHide,
  useOpenRecord,
} from "./record-preview";
import { QueryState } from "./work-common";

/** What a linked version's row says of its artifact: its columns, and whose evidence it is. */
const artifactColumns = ["id", "title", "artifact_kind", "program_id", "owner_party_id"] as const;
/** What a linked version's row says of its version: its columns, and its state. */
const versionColumns = ["id", "artifact_id", "version_number", "state", "collected_at"] as const;
/** A linked version's preview draws its facts and its file too. */
const linkedArtifactColumns = [...artifactColumns, "description"] as const;
const linkedVersionColumns = [
  ...versionColumns,
  "external_uri",
  "storage_object_id",
  "published_at",
  "expires_at",
  "storage_object_name",
  "media_type",
  "byte_size",
  "sha256",
  "provenance",
] as const;
type ArtifactSummary = Pick<Row<"evidence_artifacts">, (typeof artifactColumns)[number]>;
type VersionSummary = Pick<Row<"evidence_versions">, (typeof versionColumns)[number]>;

type EvidenceChoice<
  A extends ArtifactSummary = ArtifactSummary,
  V extends VersionSummary = VersionSummary,
> = {
  id: string;
  title: string;
  versionLabel: string;
  kind: string;
  /** The owner's name; `null` with no owner recorded, or when the owner is not in the workspace. */
  owner: string | null;
  ownerMissing: boolean;
  context: string;
  state: string;
  collected: string | undefined;
  artifact: A;
  version: V;
};
/** A version linked to the requirement, read with what its preview draws. */
type LinkedChoice = EvidenceChoice<
  Pick<Row<"evidence_artifacts">, (typeof linkedArtifactColumns)[number]>,
  Pick<Row<"evidence_versions">, (typeof linkedVersionColumns)[number]>
>;

/** Each version as a row, with its artifact's title, kind, owner and context, artifact by artifact. */
function evidenceChoices<A extends ArtifactSummary, V extends VersionSummary>(
  versions: readonly V[] | undefined,
  artifacts: readonly A[] | undefined,
  parties: readonly { id: string; name: string }[] | undefined,
): EvidenceChoice<A, V>[] {
  const artifactMap = new Map((artifacts ?? []).map((row) => [row.id, row]));
  const names = new Map((parties ?? []).map((party) => [party.id, party.name]));
  return (versions ?? [])
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
          owner: artifact.owner_party_id ? (names.get(artifact.owner_party_id) ?? null) : null,
          ownerMissing: !!artifact.owner_party_id && !names.has(artifact.owner_party_id),
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
}

/** What the browser reads of a version it offers: what its columns draw. */
const offerColumns = [
  "id",
  "artifact_id",
  "title",
  "artifact_kind",
  "program_id",
  "owner_party_id",
  "owner_name",
  "version_number",
  "state",
  "collected_at",
  "context",
] as const;
type OfferRow = ServerRow<
  "evidence_version_rows",
  (typeof offerColumns)[number],
  "artifact_id" | "title" | "artifact_kind" | "version_number" | "state" | "context"
>;

/** A version the browser offers, as its row draws it. */
type OfferChoice = {
  id: string;
  artifactId: string;
  title: string;
  versionLabel: string;
  /** The artifact's kind as stored; the cell and the filter say it in words. */
  kind: string;
  state: string;
  /** The owner's name; `null` with no owner recorded, or when the owner is not in the workspace. */
  owner: string | null;
  ownerMissing: boolean;
  /** `program` (this program's evidence) or `workspace` (an unscoped artifact), said in words. */
  context: string;
  collected: string | undefined;
};

const offerChoice = (row: OfferRow): OfferChoice => ({
  id: row.id,
  artifactId: row.artifact_id,
  title: row.title,
  versionLabel: `Version ${row.version_number}`,
  kind: row.artifact_kind,
  state: row.state,
  owner: row.owner_name,
  ownerMissing: !!row.owner_party_id && row.owner_name === null,
  context: row.context,
  collected: row.collected_at ?? undefined,
});

/**
 * The kinds an artifact records, as its create command accepts them, each in words: the Kind
 * filter offers every one (the server's rows are one page), and the search finds a kind by them.
 */
const artifactKinds = createEvidenceSchema.innerType().shape.artifactKind.options;
const kindLabels = Object.fromEntries(
  artifactKinds.map((kind) => [kind, { label: labelFor(kind) }]),
);
const kindOptions: FilterOption[] = artifactKinds.map((value) => ({
  value,
  label: labelFor(value),
}));
/** Whose evidence a version is: this program's, or an unscoped artifact of the workspace. */
const contextWords: Record<string, { label: string }> = {
  program: { label: "This program" },
  workspace: { label: "Workspace" },
};
const contextOptions: FilterOption[] = Object.entries(contextWords).map(([value, word]) => ({
  value,
  label: word.label,
}));

/**
 * The published versions a requirement can link, a page at a time: this program's evidence and
 * the workspace's unscoped artifacts, but none the requirement cites already, by the artifact's
 * title and then its newest version first.
 */
const offerRead = (programId: string, linked: readonly string[]) => {
  const inScope = `program_id.eq.${programId},program_id.is.null`;
  return serverRead({
    source: "evidence_version_rows",
    model: "evidence_versions",
    // An artifact renamed or given another owner, or an owner renamed, changes what a row says.
    models: ["evidence_artifacts", "parties"],
    columns: offerColumns,
    scope: {
      state: "published",
      or: linked.length ? `and(or(${inScope}),id.not.in.(${linked.join(",")}))` : inScope,
    },
    search: ["title", "owner_name"],
    fields: {
      versionLabel: { column: "version_number", filter: false },
      kind: { column: "artifact_kind", labels: kindLabels },
      state: { labels: revisionStates },
      owner: ownerField,
      context: { labels: contextWords },
      collected: { column: "collected_at", filter: false },
    },
    order: [{ column: "title" }, { column: "version_number", ascending: false }],
  });
};

/** Every version this program and the workspace hold, counted for the browser's empty state. */
const offeredRead = (programId: string) =>
  serverRead({
    source: "evidence_version_rows",
    model: "evidence_versions",
    models: ["evidence_artifacts"],
    columns: ["id", "state", "source_recorded"],
    scope: { or: `program_id.eq.${programId},program_id.is.null` },
  });
/** The published versions, the drafts, and the drafts with no file or reference yet. */
const OFFERED: ServerResultQuestion[] = [
  { filters: [{ id: "state", value: "published" }] },
  { filters: [{ id: "state", value: "draft" }] },
  {
    filters: [
      { id: "state", value: "draft" },
      { id: "source_recorded", value: false },
    ],
  },
];

/** Each opening of the browser asks from here: no search, the server's order, the first page. */
const FIRST_OFFER: RecordBrowserQuery = {
  search: "",
  sorting: [],
  filters: [],
  pageIndex: 0,
  pageSize: 20,
};

/**
 * A version the browser previews: its artifact and version read whole as the preview opens, since
 * the browser's rows carry only what its columns draw.
 */
function CandidateDetails({ choice }: { choice: OfferChoice }) {
  const artifact = useRow("evidence_artifacts", choice.artifactId);
  const version = useRow("evidence_versions", choice.id);
  return (
    <QueryState queries={[artifact, version]}>
      {artifact.data && version.data ? (
        <EvidenceVersionDetails artifact={artifact.data} version={version.data} />
      ) : null}
    </QueryState>
  );
}

/** The owner as a person, or what the lookup came to. */
const ownerCell = (row: { owner: string | null; ownerMissing: boolean }) =>
  row.owner ? (
    <Person name={row.owner} />
  ) : (
    <Absent label={row.ownerMissing ? "Not available" : "Not recorded"} />
  );

/** In the browser the artifact's name leads each row and carries the eye; its version follows. */
const pickerColumns = defineColumns<OfferChoice>((c) => [
  c.text("title", { header: "Artifact", minWidth: 220, priority: 0, hideable: false }),
  c.text("versionLabel", { header: "Version", width: 110, priority: 1 }),
  c.text("kind", { header: "Kind", width: 130, cell: (row) => labelFor(row.kind) }),
  c.status("state", { header: "State", width: 115, statuses: revisionStates }),
  // Sized, so the spare width goes to the artifact's name rather than to a column of names.
  c.person("owner", { header: "Owner", width: 160, cell: ownerCell }),
  c.text("context", {
    header: "Context",
    width: 150,
    cell: (row) => contextWords[row.context]?.label ?? row.context,
  }),
  c.date("collected", { header: "Collected" }),
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
  const openRecord = useOpenRecord();
  const requirement = useRow("requirement_revisions", requirementRevisionId);
  const identity = useRow("engineering_requirements", requirement.data?.engineering_requirement_id);
  const links = useRows(
    "requirement_evidence",
    { requirement_revision_id: requirementRevisionId },
    { columns: ["id", "revision", "evidence_version_id", "claim", "applicability_rationale"] },
  );
  // The linked versions and their artifacts, with what the table and its preview draw.
  const linkedIds = idSet(links.data?.map((row) => row.evidence_version_id));
  const versions = useRows(
    "evidence_versions",
    { id: linkedIds },
    { columns: linkedVersionColumns, enabled: links.isSuccess },
  );
  const artifacts = useRows(
    "evidence_artifacts",
    { "evidence_versions.id": linkedIds },
    { columns: linkedArtifactColumns, enabled: links.isSuccess },
  );
  const parties = useRows("parties", undefined, { columns: ["id", "name"] });
  // Whether the browser, or a form it opened, is open: the preview stays closed meanwhile.
  const [browsing, setBrowsing] = useState(false);
  const [previewId, setPreviewId] = useState<string | null>(null);
  // A preview belongs to its tab: it ends when the record's tab hides this collection.
  useEndOnHide(() => setPreviewId(null));
  const remove = useRemoveRequirementLink();
  const { confirm, confirmation } = useConfirmation();
  // Every member but a viewer links and unlinks the workspace's own requirement evidence, and
  // row-level security decides each write: the role says it, so the tab does not load the record
  // schema.
  const writable =
    !readOnly && workspace.role !== "viewer" && requirement.data?.tenant_id === workspace.tenantId;
  const canUnlink = writable;
  const contextValid = identity.data?.program_id === programId;
  const queries = [requirement, identity, links, artifacts, versions, parties];
  // Loaded once every query has data; a failed refresh keeps what was loaded.
  const loaded = queries.every((query) => query.data !== undefined);
  const loadFailed = queries.some((query) => query.data === undefined && query.isError);
  const requirementName = identity.data
    ? `${identity.data.code} · ${requirement.data?.title ?? ""}`
    : (requirement.data?.title ?? "This requirement");
  const linkFor = useMemo(
    () => new Map((links.data ?? []).map((row) => [row.evidence_version_id, row])),
    [links.data],
  );
  const linked = useMemo<LinkedChoice[]>(
    () =>
      evidenceChoices(versions.data, artifacts.data, parties.data).filter((row) =>
        linkFor.has(row.id),
      ),
    [versions.data, artifacts.data, parties.data, linkFor],
  );
  const preview = linked.find((row) => row.id === previewId);
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
      defineColumns<LinkedChoice>((c) => [
        // The artifact's name is the row's identity: it opens the version and carries the eye.
        c.id("title", {
          header: "Artifact",
          minWidth: 200,
          priority: 0,
          hideable: false,
          cell: (row) => (
            <RecordLink
              table="evidence_versions"
              record={row.version}
              onPreview={() => setPreviewId(row.id)}
            >
              {row.title}
            </RecordLink>
          ),
        }),
        c.text("versionLabel", { header: "Version", width: 110, priority: 1 }),
        c.text("kind", { header: "Kind", width: 135 }),
        c.person("owner", { header: "Owner", width: 160, cell: ownerCell }),
        c.date("collected", { header: "Collected" }),
        ...(canUnlink
          ? [
              c.actions((row: LinkedChoice) => [
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
    [canUnlink, linkFor],
  );
  // The preview is the table's, so opening or stepping through it never rebuilds the columns.
  const tablePreview = useMemo(
    () => ({ onPreview: (row: LinkedChoice) => setPreviewId(row.id), activeId: previewId }),
    [previewId],
  );
  const table = useDataTable({
    data: linked,
    columns,
    getRowId: (row) => row.id,
    preview: tablePreview,
    rowLabel: (row) => `${row.title}, ${row.versionLabel}`,
    label: "Linked evidence",
    pageSize: 10,
    resizable: true,
    reorderable: true,
  });
  const displayed = useDisplayedRecords(table);
  function beginBrowse() {
    setPreviewId(null);
    setBrowsing(true);
  }
  const unavailable = !loaded
    ? loadFailed
      ? "The evidence could not be loaded. Retry loading it first."
      : "The evidence is still loading."
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
      <ProductCollection
        table={table}
        queries={queries}
        onRowClick={(row) =>
          openRecord("evidence_versions", row.version, () => setPreviewId(row.id))
        }
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
      {writable ? (
        // Mounted while the tab is, so the browser plays its exit; each opening starts afresh,
        // with the chosen versions kept across the create and prepare steps.
        <EvidenceLinkBrowser
          open={browsing}
          onClose={() => setBrowsing(false)}
          programId={programId}
          requirementRevisionId={requirementRevisionId}
          linkedVersionIds={links.data ? linkedIds : undefined}
          queries={queries}
          blocked={
            !contextValid || !loaded
              ? "Reload this requirement before linking evidence."
              : undefined
          }
          title="Add evidence"
          description="Find, preview and choose the published versions to link to this requirement."
          confirmLabel="Link evidence"
          context={
            <Stack space="space.100">
              <KeyValue label="Requirement">{requirementName}</KeyValue>
              <Text as="p" size="small" color="color.text.subtle">
                Only this program’s evidence and unscoped workspace artifacts are available. Each
                row is a specific version. Already linked versions are excluded.
              </Text>
            </Stack>
          }
        />
      ) : null}
      {preview && !browsing ? (
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

/** A read the browser waits on beside its own: its data, its failure and its retry. */
type BrowserQuery = Pick<UseQueryResult<unknown, Error>, "data" | "isError" | "refetch">;

/**
 * Add evidence to one requirement revision: a RecordBrowser over the published versions of the
 * program's evidence and of the workspace's unscoped artifacts that the revision does not cite yet,
 * a page at a time from the server, with Create evidence artifact and its Prepare evidence step,
 * which return the version published there chosen; the chosen versions are linked in one request
 * (`link_requirement_evidence`). The requirement's Evidence tab and a control's Add evidence both
 * open it; each opening asks from the first page again. `onClose` runs once the browser and the
 * forms it opened have closed.
 */
export function EvidenceLinkBrowser({
  open,
  onClose,
  programId,
  requirementRevisionId,
  linkedVersionIds,
  queries,
  blocked,
  title,
  description,
  confirmLabel,
  context,
  onLinked,
}: {
  open: boolean;
  onClose: () => void;
  programId: string;
  requirementRevisionId: string;
  /** The versions the revision cites already, which it does not offer; none until they are read. */
  linkedVersionIds: readonly string[] | undefined;
  /** The caller's reads the browser waits on, whose failure it says with its own. */
  queries: readonly BrowserQuery[];
  /** Why the chosen versions cannot be linked now, said when the reader confirms. */
  blocked?: string | undefined;
  title: string;
  description: string;
  confirmLabel: string;
  context: ReactNode;
  /** After the link, once its toast is shown: the caller says what it moved. */
  onLinked?: ((count: number) => void) | undefined;
}) {
  const parties = useRows("parties", undefined, { columns: ["id", "name"] });
  const [surface, setSurface] = useState<"browse" | "create" | "prepare" | null>(null);
  // What the browser offers is read once it first opens, a page at a time from the server: the
  // published versions of this program's evidence and of the workspace's unscoped artifacts that
  // the requirement does not cite yet, each with what the browser's columns draw. The browser
  // holds no question of its own: each opening asks from the first page again.
  const [browsed, setBrowsed] = useState(false);
  const [offerQuestion, setOfferQuestion] = useState(FIRST_OFFER);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  // Each opening starts afresh: the first page, nothing chosen.
  const [wasOpen, setWasOpen] = useState(false);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setBrowsed(true);
      setOfferQuestion(FIRST_OFFER);
      setSelectedIds([]);
      setSurface("browse");
    } else setSurface(null);
  }
  const linkedKey = (linkedVersionIds ?? []).join(",");
  const offerReadNow = useMemo(
    () => offerRead(programId, linkedKey ? linkedKey.split(",") : []),
    [programId, linkedKey],
  );
  const offer = useServerPage<OfferRow>(offerReadNow, offerQuestion, {
    enabled: browsed && linkedVersionIds !== undefined,
  });
  const offerPage = offer.page;
  const offerRows = useMemo(() => (offerPage?.rows ?? []).map(offerChoice), [offerPage]);
  // How many there are to choose from, search and filters aside: what the page that answers the
  // opening question counts.
  const [offerTotal, setOfferTotal] = useState<number | undefined>(undefined);
  const unasked = !!offerPage && !offerPage.question.search && !offerPage.question.filters?.length;
  if (unasked && offerPage.count !== offerTotal) setOfferTotal(offerPage.count);
  // With nothing to offer, the browser says why: how many versions are published (all linked),
  // how many are drafts, and how many drafts have no file or reference yet. Counted once it knows.
  const nothingOffered = unasked && offerPage.count === 0;
  const offeredReadNow = useMemo(() => offeredRead(programId), [programId]);
  const offeredCounts = useServerCountQueries(offeredReadNow, OFFERED, {
    enabled: browsed && nothingOffered,
  });
  const [publishedCount = 0, draftCount = 0, draftsWithoutSource = 0] = offeredCounts.map(
    (count) => count.data,
  );
  const [created, setCreated] = useState<CreateEvidenceResult | null>(null);
  // A version published here returns chosen to the browser, though no page it reads may hold it
  // yet: its row, from what Prepare evidence read of it and its artifact.
  const createdVersion = useRow("evidence_versions", created?.versionId);
  const createdArtifact = useRow("evidence_artifacts", created?.artifactId);
  const createdChoice = useMemo<OfferChoice | undefined>(() => {
    const version = createdVersion.data;
    const artifact = createdArtifact.data;
    if (!version || !artifact || version.state !== "published") return undefined;
    const owner = artifact.owner_party_id
      ? (parties.data?.find((party) => party.id === artifact.owner_party_id)?.name ?? null)
      : null;
    return offerChoice({
      id: version.id,
      artifact_id: artifact.id,
      title: artifact.title,
      artifact_kind: artifact.artifact_kind,
      program_id: artifact.program_id,
      owner_party_id: artifact.owner_party_id,
      owner_name: owner,
      version_number: version.version_number,
      state: version.state,
      collected_at: version.collected_at,
      context: artifact.program_id ? "program" : "workspace",
    });
  }, [createdVersion.data, createdArtifact.data, parties.data]);
  const pendingCreated = useRef<CreateEvidenceResult | null>(null);
  const inFlight = useRef(false);
  const link = useLinkRequirementEvidence();
  // The browser's reads beside the caller's: it waits on both and says either's failure, and with
  // nothing to offer it waits on the counts its empty state says too.
  const browserQueries = [
    ...queries,
    parties,
    ...offer.queries,
    ...(nothingOffered ? offeredCounts : []),
  ];
  // The browser's state: a failed load, or a failed refresh whose rows stay under the alert (the
  // alert stays while its Try again runs, so focus stays on it); then the page on its way, a
  // search being typed included, under the rows the reader has.
  const browserState = browserQueries.some((query) => query.isError)
    ? "error"
    : !browserQueries.every((query) => query.data !== undefined)
      ? "loading"
      : offer.typing || offer.result.isPlaceholderData || offer.result.isFetching
        ? "refreshing"
        : "ready";
  // The Owner filter's values: every person and organization by name, since one page's owners are
  // not every owner there is.
  const ownerOptions = useMemo<FilterOption[]>(
    () =>
      [...new Set((parties.data ?? []).map((party) => party.name))]
        .sort((a, b) => a.localeCompare(b))
        .map((value) => ({ value })),
    [parties.data],
  );
  useBlocker({ shouldBlockFn: () => inFlight.current, enableBeforeUnload: () => inFlight.current });
  function closeBrowser() {
    if (inFlight.current) return;
    setSurface(null);
    setSelectedIds([]);
    onClose();
  }
  /** Opens the browser on the first page of what it offers, as each opening of it starts afresh. */
  function browse() {
    setOfferQuestion(FIRST_OFFER);
    setSurface("browse");
  }
  async function confirmLink(records: OfferChoice[]) {
    if (inFlight.current) return;
    if (blocked) throw new Error(blocked);
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
      onLinked?.(records.length);
    } finally {
      inFlight.current = false;
    }
  }
  // With nothing eligible, the browser says why and what makes something to link.
  const noneEligible = {
    illustration: "document" as const,
    title: publishedCount
      ? "All available evidence is already linked"
      : "No published evidence available",
    description: [
      publishedCount
        ? `${plural(publishedCount, "published version")} ${publishedCount === 1 ? "is" : "are"} already linked to this requirement.`
        : draftCount
          ? `${plural(draftCount, "draft evidence version")} ${draftCount === 1 ? "becomes" : "become"} available here once published.`
          : "This program and the workspace have no published evidence versions to link.",
      publishedCount && draftCount
        ? `${plural(draftCount, "more draft version")} ${draftCount === 1 ? "is" : "are"} waiting for publication.`
        : "",
      draftsWithoutSource
        ? `${draftsWithoutSource} of the drafts still ${draftsWithoutSource === 1 ? "needs" : "need"} an uploaded file or an external reference before publication.`
        : "",
    ]
      .filter(Boolean)
      .join(" "),
    secondary: (
      <LinkButton
        variant="secondary"
        render={
          <Link to="/programs/$programId" params={{ programId }} search={{ tab: "Evidence" }} />
        }
      >
        Open program evidence
      </LinkButton>
    ),
  };
  return (
    <>
      <RecordBrowser
        open={surface === "browse"}
        title={title}
        description={description}
        records={offerRows}
        server={{
          query: offerQuestion,
          onQueryChange: setOfferQuestion,
          rowCount: offerPage?.count ?? 0,
          total: offerTotal,
          filterOptions: { kind: kindOptions, owner: ownerOptions, context: contextOptions },
          selected: createdChoice ? [createdChoice] : undefined,
        }}
        columns={pickerColumns}
        filters={["kind", "owner", "context"]}
        previewColumn="title"
        searchPlaceholder="Find evidence to link"
        recordTitle={(row) => row.title}
        recordLabel={(row) => `${row.title}, ${row.versionLabel.toLowerCase()}`}
        recordCode={(row) => row.versionLabel}
        state={browserState}
        error="The evidence could not be loaded."
        onRetry={() => {
          for (const query of browserQueries) if (query.isError) void query.refetch();
        }}
        empty={noneEligible}
        renderPreview={(row) => <CandidateDetails choice={row} />}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        onClose={closeBrowser}
        onConfirm={confirmLink}
        confirmLabel={confirmLabel}
        context={context}
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
            if (pendingCreated.current) setSurface("prepare");
            else browse();
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
            browse();
          }}
        />
      ) : null}
    </>
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
  // The reader's own party, who publishes the version.
  const parties = useRows(
    "parties",
    { auth_user_id: workspace.userId },
    { columns: ["id", "auth_user_id"] },
  );
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
