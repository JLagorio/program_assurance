import { useCallback, useMemo, useRef, useState, type RefObject } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  Absent,
  Button,
  DateLabel,
  DateTime,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  IconButton,
  Id,
  DataTable,
  defineColumns,
  Inline,
  Person,
  PreviewSheet,
  Prose,
  Section,
  Stack,
  useDataTable,
  type FilterOption,
  type Preset,
} from "@ledger/design-system";
import {
  RecordLink,
  RecordPreviewPanel,
  RecordPreviewActions,
  recordDestination,
  useDisplayedRecords,
  useEndOnHide,
} from "./record-preview";
import type { ReactNode } from "react";
import { ProductCollection } from "./product-collection";
import {
  useServerCollection,
  useServerPresetCounts,
  vocabularyOptions,
} from "./collection-question";
import { MoreHorizontal, Plus } from "lucide-react";
import { useRow, useRows, type Row, type TableName } from "@/lib/models";
import { labelFor, type DataRecord } from "@/lib/records";
import { createEvidenceSchema } from "@/lib/evidence-create";
import { serverRead, type ServerRow } from "@/lib/server-table";
import { evidenceReviewDecisions, revisionStates, type StatusVocabulary } from "@/lib/status";
import { StatusBadge } from "@/components/app/status";
import { useWorkspace } from "@/components/app/workspace";
import { useCollection } from "@/lib/collections";
import { EvidenceFile } from "@/components/app/evidence-file";
import { CreateEvidenceDialog } from "./create-evidence-dialog";
import {
  EvidenceFacts,
  EvidenceReviews,
  ExternalReference,
  FileSize,
} from "./evidence-version-details";
import { RelationName } from "./record-tools";
import { DetailFacts, ModelForm, type FormTarget } from "./work-common";

/** The latest review's decision, and "Not reviewed" where the latest version has none. */
const latestReviewStatuses: StatusVocabulary = {
  not_reviewed: { label: "Not reviewed", tone: "neutral", rank: -1 },
  ...evidenceReviewDecisions,
};

/**
 * The kinds an artifact records, as its create command accepts them, each in words: the Kind
 * filter offers every one (the server's rows are one page), and the search finds a kind by them.
 */
const artifactKinds = createEvidenceSchema.innerType().shape.artifactKind.options;
const kindOptions: FilterOption[] = artifactKinds.map((value) => ({
  value,
  label: labelFor(value),
}));
const kindLabels = Object.fromEntries(
  artifactKinds.map((kind) => [kind, { label: labelFor(kind) }]),
);

/**
 * The register's columns, one list for every render: the preview is the table's, so stepping
 * through artifacts never rebuilds them. A program's own evidence leaves out the Program column.
 */
const evidenceColumns = (inProgram: boolean) =>
  defineColumns<EvidenceRow>((c) => [
    // A name with a minimum and no width shares the spare width with the other unsized fields.
    c.text("title", {
      header: "Artifact",
      minWidth: 200,
      priority: 0,
      hideable: false,
      cell: (row) => (
        <RecordLink table="evidence_artifacts" record={row}>
          {row.title}
        </RecordLink>
      ),
    }),
    ...(inProgram
      ? []
      : [
          c.text("program", {
            header: "Program",
            width: 170,
            cell: (row) => row.program ?? <Absent label={missing(row.program_id)} />,
          }),
        ]),
    c.text("kind", { header: "Kind", width: 120, cell: (row) => labelFor(row.kind) }),
    // A person and a date take their kinds' widths.
    c.person("owner", {
      header: "Owner",
      cell: (row) =>
        row.owner ? <Person name={row.owner} /> : <Absent label={missing(row.owner_party_id)} />,
    }),
    c.text("version", { header: "Version", width: 105 }),
    c.date("collected", { header: "Collected" }),
    c.status("review", {
      header: "Latest review",
      width: 150,
      statuses: latestReviewStatuses,
    }),
  ]);
/** A name the row cannot show: none recorded, or one recorded that the reader cannot see. */
const missing = (id: string | null) => (id ? "Not available" : "Not recorded");
const registerColumns = evidenceColumns(false);
const programColumns = evidenceColumns(true);

/** What an artifact's preview reads of it, and its Edit seeds the form from. */
type Artifact = Pick<
  Row<"evidence_artifacts">,
  | "id"
  | "tenant_id"
  | "title"
  | "description"
  | "artifact_kind"
  | "program_id"
  | "scope_id"
  | "owner_party_id"
  | "source_uri"
  | "retention_until"
  | "revision"
>;
/**
 * An artifact as the register reads it: every column its preview's Edit seeds the form from, its
 * program and owner by name, its latest version and that version's latest review.
 */
type EvidenceRecord = ServerRow<
  "evidence_artifact_rows",
  | keyof Artifact
  | "updated_at"
  | "program_name"
  | "owner_name"
  | "latest_version_number"
  | "collected_at"
  | "review",
  "tenant_id" | "title" | "artifact_kind" | "revision" | "updated_at" | "review"
>;
type EvidenceRow = EvidenceRecord & {
  /** The program's name; null when the artifact names none or the reader cannot see it. */
  program: string | null;
  /** The artifact's kind as stored; the cell and the filter say it in words. */
  kind: string;
  /** The owner's name; null when none is recorded or the reader cannot see them. */
  owner: string | null;
  version: string;
  collected: string | undefined;
};

/** Each artifact of a page as the register draws it. */
const evidenceRows = (page: EvidenceRecord[]): EvidenceRow[] =>
  page.map((artifact) => ({
    ...artifact,
    // A name the reader cannot see is null, and its cell says so: never words in its place.
    program: artifact.program_name,
    kind: artifact.artifact_kind,
    owner: artifact.owner_name,
    version:
      artifact.latest_version_number === null
        ? "No versions"
        : `Version ${artifact.latest_version_number}`,
    collected: artifact.collected_at ?? undefined,
  }));

/**
 * The evidence of the workspace or of one program, a page at a time from the server, newest change
 * first: each artifact's latest version and its latest review come from the view, where the sort,
 * the filters and the search reach them too.
 */
const evidenceRead = (programId: string | undefined) =>
  serverRead({
    source: "evidence_artifact_rows",
    model: "evidence_artifacts",
    // A new version, or a review of the latest one, changes what the row says of its artifact.
    models: ["evidence_versions", "evidence_reviews"],
    columns: [
      "id",
      "tenant_id",
      "title",
      "description",
      "artifact_kind",
      "program_id",
      "scope_id",
      "owner_party_id",
      "source_uri",
      "retention_until",
      "revision",
      "updated_at",
      "program_name",
      "owner_name",
      "latest_version_number",
      "collected_at",
      "review",
    ],
    scope: programId ? { program_id: programId } : {},
    search: ["title", "program_name", "owner_name"],
    fields: {
      program: { column: "program_name", filter: false },
      kind: { column: "artifact_kind", labels: kindLabels },
      owner: { column: "owner_name", filter: false },
      version: { column: "latest_version_number", filter: false },
      collected: { column: "collected_at", filter: false },
      review: { labels: latestReviewStatuses, sort: "review_rank" },
    },
    order: [{ column: "updated_at", ascending: false }],
  });

const presets: Preset[] = [
  { id: "all", label: "All evidence" },
  {
    id: "pending",
    label: "Not reviewed",
    filters: [{ id: "review", value: ["not_reviewed", "pending"] }],
  },
  {
    id: "revision",
    label: "Needs revision",
    filters: [{ id: "review", value: ["needs_revision"] }],
  },
];

/** Of two copies of one artifact, the later revision: the page's after a refresh, else the one saved. */
const later = <T extends { revision: number }>(a: T | undefined, b: T | undefined) =>
  a && b ? (b.revision > a.revision ? b : a) : (a ?? b);

export function EvidenceBrowser({ programId }: { programId?: string }) {
  const workspace = useWorkspace();
  const navigate = useNavigate();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // The artifact the reader opened or saved last, while the page may not hold it.
  const [held, setHeld] = useState<Artifact | null>(null);
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
  // A preview belongs to its tab: it ends when a program tab hides this register.
  useEndOnHide(() => {
    setSelectedId(null);
    setSelectedVersionId(null);
  });
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<FormTarget | null>(null);
  const openPreview = useCallback(
    (row: EvidenceRow) => {
      if (!form && !creating) {
        setSelectedId(row.id);
        setHeld(row);
        setSelectedVersionId(null);
      }
    },
    [form, creating],
  );
  const preview = useMemo(
    () => ({ onPreview: openPreview, activeId: selectedId }),
    [openPreview, selectedId],
  );
  const read = useMemo(() => evidenceRead(programId), [programId]);
  const collection = useServerCollection<EvidenceRow, EvidenceRecord>(read, {
    columns: programId ? programColumns : registerColumns,
    rows: evidenceRows,
    getRowId: (row) => row.id,
    preview,
    label: "Evidence",
    view: `evidence-${programId ?? "all"}`,
    resizable: true,
    reorderable: true,
  });
  const { table } = collection;
  const presetCounts = useServerPresetCounts(read, presets);
  const displayed = useDisplayedRecords(table);
  const onPage = displayed.find((row) => row.id === selectedId);
  const kept = held?.id === selectedId ? held : undefined;
  // An artifact neither the page nor the reader's last step holds (one just created) is read.
  const fetched = useRow("evidence_artifacts", selectedId && !onPage && !kept ? selectedId : null);
  const selected = later<Artifact>(onPage, kept) ?? fetched.data ?? undefined;
  return (
    <Stack space="space.150">
      {creating && (
        <CreateEvidenceDialog
          programId={programId}
          onClose={() => setCreating(false)}
          onCreated={(result) => {
            setSelectedId(result.artifactId);
            setHeld(null);
            setSelectedVersionId(result.versionId);
          }}
        />
      )}
      {form && (
        <ModelForm
          target={form}
          onClose={() => setForm(null)}
          onSaved={(record) => {
            if (form.table === "evidence_artifacts") {
              setSelectedId(record.id);
              setHeld(record as unknown as Artifact);
            }
          }}
        />
      )}
      <ProductCollection
        {...collection}
        fill
        searchLabel="Find evidence"
        onRowClick={(row) => void navigate(recordDestination("evidence_artifacts", row))}
        empty={{
          illustration: "document",
          title: "No evidence yet",
          description:
            "Create an artifact and its first draft version, then attach its file and supporting relationships.",
        }}
        views={
          <DataTable.Presets table={table} variant="menu" presets={presets} counts={presetCounts} />
        }
        filters={
          <>
            <DataTable.Filter
              table={table}
              column="review"
              options={vocabularyOptions(latestReviewStatuses)}
            />
            <DataTable.Filter table={table} column="kind" options={kindOptions} />
          </>
        }
        action={
          workspace.role !== "viewer" ? (
            <Button
              size="small"
              variant="primary"
              iconBefore={<Plus />}
              // Stays enabled while its dialog is open, so focus returns to it on close.
              onClick={() => {
                if (!form && !creating) setCreating(true);
              }}
            >
              Create evidence artifact
            </Button>
          ) : undefined
        }
      />
      {/* The panel stays mounted under a form opened from it, so focus returns to the trigger. */}
      {selected && (
        <EvidencePreview
          artifact={selected}
          formOpen={!!form || creating}
          navigation={
            <RecordPreviewActions
              table="evidence_artifacts"
              record={selected}
              rows={displayed}
              onSelect={openPreview}
            />
          }
          versionId={selectedVersionId}
          onSelectVersion={setSelectedVersionId}
          onClose={() => setSelectedId(null)}
          onEdit={setForm}
        />
      )}
    </Stack>
  );
}

/** An artifact's versions in its preview, one list for every render: the preview is the table's. */
const versionTableColumns = defineColumns<Row<"evidence_versions">>((c) => [
  c.id("version_number", {
    header: "Version",
    priority: 0,
    // "Version 12" needs little room: a minimum leaves the State beside it in a narrow panel.
    minWidth: 120,
    hideable: false,
    cell: (row) => (
      <RecordLink table="evidence_versions" record={row}>
        Version {row.version_number}
      </RecordLink>
    ),
  }),
  c.status("state", { header: "State", width: 130, statuses: revisionStates }),
  c.date("collected_at", { header: "Collected" }),
  c.text("storage_object_name", {
    header: "File",
    width: 180,
    cell: (row) =>
      row.storage_object_id
        ? "Uploaded"
        : row.storage_object_name
          ? "Upload unfinished"
          : row.external_uri
            ? "External reference"
            : "No file",
  }),
]);

function EvidencePreview({
  artifact,
  formOpen,
  navigation,
  versionId,
  onSelectVersion: setVersionId,
  onClose,
  onEdit,
}: {
  artifact: Artifact;
  /** A form is open over the preview: the modal version review steps aside so they do not stack. */
  formOpen: boolean;
  navigation: ReactNode;
  versionId: string | null;
  onSelectVersion: (id: string | null) => void;
  onClose: () => void;
  onEdit: (target: FormTarget) => void;
}) {
  const workspace = useWorkspace();
  const versions = useRows("evidence_versions", { artifact_id: artifact.id });
  const sorted = useMemo(
    () => [...(versions.data ?? [])].sort((a, b) => b.version_number - a.version_number),
    [versions.data],
  );
  const current = sorted.find((version) => version.id === versionId);
  const writable = workspace.role !== "viewer";
  // A form opened from the version review replaces the sheet; when the sheet comes back, focus
  // goes to the control that opened the form, not to the sheet's title.
  const reviewButton = useRef<HTMLButtonElement>(null);
  const menuButton = useRef<HTMLButtonElement>(null);
  const reopenFrom = useRef<"review" | "menu" | null>(null);
  const editFromSheet = (target: FormTarget, from: "review" | "menu") => {
    reopenFrom.current = from;
    onEdit(target);
  };
  const reopenFocus = reopenFrom.current
    ? {
        initialFocus: () => {
          const from = reopenFrom.current;
          reopenFrom.current = null;
          return (from === "review" ? reviewButton.current : menuButton.current) ?? true;
        },
      }
    : {};
  const preview = useMemo(
    () => ({
      onPreview: (row: Row<"evidence_versions">) => setVersionId(row.id),
      activeId: versionId,
    }),
    [versionId, setVersionId],
  );
  const table = useDataTable({
    columns: versionTableColumns,
    data: sorted,
    getRowId: (row) => row.id,
    preview,
    // Its controls say which version: "Preview Version 2", not a row's number or id.
    rowLabel: (row) => `Version ${row.version_number}`,
    label: "Evidence versions",
  });
  const displayed = useDisplayedRecords(table);
  const createVersion = writable ? (
    <Button
      size="small"
      variant="primary"
      iconBefore={<Plus />}
      disabledReason={
        versions.isPending
          ? "The versions are still loading."
          : versions.isError
            ? "Load the versions before creating another."
            : undefined
      }
      onClick={() =>
        onEdit({
          table: "evidence_versions",
          initialValues: {
            artifact_id: artifact.id,
            version_number: (sorted[0]?.version_number ?? 0) + 1,
          },
        })
      }
    >
      Create evidence version
    </Button>
  ) : undefined;
  return (
    <RecordPreviewPanel
      title={artifact.title}
      label="Evidence artifact preview"
      navigation={navigation}
      onClose={onClose}
      recordActions={
        writable ? (
          <Button
            size="small"
            variant="primary"
            onClick={() =>
              onEdit({ table: "evidence_artifacts", existing: artifact as DataRecord })
            }
          >
            Edit evidence artifact
          </Button>
        ) : undefined
      }
    >
      <Stack space="space.250">
        <DetailFacts
          facts={[
            ["Description", artifact.description ? <Prose>{artifact.description}</Prose> : null],
            ["Kind", labelFor(artifact.artifact_kind)],
            // The owner read by their id, which the preview's Edit saves, so a change reads at once.
            [
              "Owner",
              artifact.owner_party_id ? (
                <RelationName table="parties" id={artifact.owner_party_id} />
              ) : null,
            ],
            [
              "Source",
              artifact.source_uri ? <ExternalReference uri={artifact.source_uri} /> : null,
            ],
            [
              "Retain until",
              artifact.retention_until ? <DateTime value={artifact.retention_until} /> : null,
            ],
          ]}
        />
        <Section title="Versions">
          {/* The preview's few versions ask nothing of a search: the toolbar keeps the create. */}
          <ProductCollection
            compact
            search={false}
            table={table}
            queries={[versions]}
            action={createVersion}
            // The preview's record header keeps the one primary, Edit evidence artifact.
            actionVariant="secondary"
            empty={{
              illustration: "document",
              title: "No versions yet",
              description:
                "Create a draft version to upload a file or reference an external artifact.",
            }}
          />
        </Section>
        {current && !formOpen && (
          <PreviewSheet
            open
            onClose={() => setVersionId(null)}
            title={`${artifact.title} · Version ${current.version_number}`}
            navigation={
              <RecordPreviewActions
                table="evidence_versions"
                record={current}
                rows={displayed}
                onSelect={(row) => setVersionId(row.id)}
              />
            }
            {...reopenFocus}
            actions={
              writable ? (
                <EvidenceVersionActions
                  version={current}
                  onEdit={editFromSheet}
                  reviewButton={reviewButton}
                  menuButton={menuButton}
                />
              ) : undefined
            }
          >
            <EvidenceVersion key={current.id} version={current} />
          </PreviewSheet>
        )}
      </Stack>
    </RecordPreviewPanel>
  );
}

const evidenceRelationships = [
  ["Requirement", "requirement_evidence"],
  ["Implementation", "implementation_evidence"],
  ["Observation", "observation_evidence"],
  ["Assessment finding", "finding_evidence"],
  ["Test run", "test_run_evidence"],
  ["Step result", "step_result_evidence"],
  ["Task", "task_evidence"],
  ["Operational issue", "issue_evidence"],
  ["Gate criterion", "gate_evidence"],
] as const;
function EvidenceVersionActions({
  version,
  onEdit,
  reviewButton,
  menuButton,
}: {
  version: Row<"evidence_versions">;
  /** Opens a form; `from` says which control asked, so focus can return to it. */
  onEdit: (target: FormTarget, from: "review" | "menu") => void;
  reviewButton: RefObject<HTMLButtonElement | null>;
  menuButton: RefObject<HTMLButtonElement | null>;
}) {
  const workspace = useWorkspace();
  // The reader's own party, the review's reviewer unless they choose another.
  const parties = useRows(
    "parties",
    { auth_user_id: workspace.userId },
    { columns: ["id", "auth_user_id"] },
  );
  const me = parties.data?.find((party) => party.auth_user_id === workspace.userId);
  return (
    <Inline space="space.100">
      <Button
        ref={reviewButton}
        size="small"
        variant="primary"
        onClick={() =>
          onEdit(
            {
              table: "evidence_reviews",
              initialValues: {
                evidence_version_id: version.id,
                ...(me ? { reviewer_party_id: me.id } : {}),
              },
            },
            "review",
          )
        }
      >
        Create evidence review
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <IconButton
              ref={menuButton}
              size="small"
              variant="subtle"
              label="Evidence version actions"
              icon={<MoreHorizontal />}
            />
          }
        />
        <DropdownMenuContent align="end">
          {version.state === "draft" && (
            <DropdownMenuItem
              onClick={() =>
                onEdit({ table: "evidence_versions", existing: version as DataRecord }, "menu")
              }
            >
              Edit evidence version
            </DropdownMenuItem>
          )}
          {evidenceRelationships.map(([label, table]) => (
            <DropdownMenuItem
              key={table}
              onClick={() =>
                onEdit(
                  {
                    table,
                    operationLabel: `Link ${label.toLowerCase()}`,
                    initialValues: { evidence_version_id: version.id },
                  },
                  "menu",
                )
              }
            >
              Link {label.toLowerCase()}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </Inline>
  );
}

function EvidenceVersion({ version }: { version: Row<"evidence_versions"> }) {
  const collection = useCollection("evidence_versions").data;
  return (
    <Stack space="space.250">
      <Section title="Version details">
        <EvidenceFacts
          facts={[
            ["State", <StatusBadge statuses={revisionStates} value={version.state} />],
            ["Collected", version.collected_at ? <DateTime value={version.collected_at} /> : null],
            // Where the expiry stands: expired, today or soon say so beside the moment.
            [
              "Expires",
              version.expires_at ? <DateLabel kind="expiry" value={version.expires_at} /> : null,
            ],
            [
              "External reference",
              version.external_uri ? (
                <ExternalReference uri={version.external_uri}>
                  Open external artifact
                </ExternalReference>
              ) : null,
            ],
            ["Media type", version.media_type],
            [
              "Size",
              typeof version.byte_size === "number" ? <FileSize bytes={version.byte_size} /> : null,
            ],
            ["SHA-256", version.sha256 ? <Id className="break-all">{version.sha256}</Id> : null],
          ]}
        />
        {/* Authored text reads as a paragraph at every width, not squeezed beside a label. */}
        {version.provenance ? <Prose label="Provenance">{version.provenance}</Prose> : null}
      </Section>
      {collection && <EvidenceFile collection={collection} record={version as DataRecord} />}
      <EvidenceSupport versionId={version.id} />
      <EvidenceReviews versionId={version.id} />
    </Stack>
  );
}

/** A requirement revision's name, linked to its requirement's record page. */
function SupportedRequirement({ revisionId }: { revisionId: string }) {
  const revision = useRow("requirement_revisions", revisionId);
  const requirement = useRow("engineering_requirements", revision.data?.engineering_requirement_id);
  if (!revision.data || !requirement.data)
    return <RelationName table="requirement_revisions" id={revisionId} />;
  return (
    <RecordLink table="engineering_requirements" record={requirement.data}>
      {requirement.data.code} · {revision.data.title}
    </RecordLink>
  );
}

function EvidenceSupport({ versionId }: { versionId: string }) {
  const filter = { evidence_version_id: versionId };
  const requirements = useRows("requirement_evidence", filter);
  const implementations = useRows("implementation_evidence", filter);
  const observations = useRows("observation_evidence", filter);
  const findings = useRows("finding_evidence", filter);
  const runs = useRows("test_run_evidence", filter);
  const steps = useRows("step_result_evidence", filter);
  const tasks = useRows("task_evidence", filter);
  const issues = useRows("issue_evidence", filter);
  const gates = useRows("gate_evidence", filter);
  const groups = [
    {
      label: "Requirement",
      table: "requirement_evidence" as const,
      query: requirements,
      column: "requirement_revision_id",
      target: "requirement_revisions",
    },
    {
      label: "Implementation",
      table: "implementation_evidence" as const,
      query: implementations,
      column: "implementation_statement_id",
      target: "implementation_statements",
    },
    {
      label: "Observation",
      table: "observation_evidence" as const,
      query: observations,
      column: "observation_id",
      target: "observations",
    },
    {
      label: "Finding",
      table: "finding_evidence" as const,
      query: findings,
      column: "finding_id",
      target: "assessment_findings",
    },
    {
      label: "Test run",
      table: "test_run_evidence" as const,
      query: runs,
      column: "test_run_id",
      target: "test_runs",
    },
    {
      label: "Step result",
      table: "step_result_evidence" as const,
      query: steps,
      column: "step_result_id",
      target: "step_results",
    },
    {
      label: "Task",
      table: "task_evidence" as const,
      query: tasks,
      column: "task_id",
      target: "tasks",
    },
    {
      label: "Issue",
      table: "issue_evidence" as const,
      query: issues,
      column: "issue_id",
      target: "operational_issues",
    },
    {
      label: "Gate criterion",
      table: "gate_evidence" as const,
      query: gates,
      column: "gate_criterion_id",
      target: "gate_criteria",
    },
  ];
  const links = groups.flatMap((group) =>
    (group.query.data ?? []).map((row) => ({
      ...group,
      row: row as DataRecord,
      id: `${group.table}/${row.id}`,
    })),
  );
  const columns = defineColumns<(typeof links)[number]>((c) => [
    c.id("target", {
      header: "Supported record",
      priority: 0,
      minWidth: 200,
      hideable: false,
      // The link reads as the record it opens: its code and name.
      cell: (link) => {
        const id = String(link.row[link.column]);
        return link.target === "requirement_revisions" ? (
          <SupportedRequirement revisionId={id} />
        ) : (
          <RecordLink table={link.target as TableName} record={{ id }}>
            <RelationName table={link.target as TableName} id={id} />
          </RecordLink>
        );
      },
    }),
    c.text("label", { header: "Record type", width: 180 }),
  ]);
  const table = useDataTable({
    data: links,
    columns,
    getRowId: (link) => `${link.table}/${link.row.id}`,
    label: "Evidence support relationships",
  });
  return (
    <Section title="Supports">
      <ProductCollection
        compact
        table={table}
        queries={groups.map((group) => group.query)}
        searchLabel="Find relationships"
        empty={{
          illustration: "tree",
          title: "No support relationships",
          description: "Link the controls, requirements or findings this evidence supports.",
        }}
      />
    </Section>
  );
}
