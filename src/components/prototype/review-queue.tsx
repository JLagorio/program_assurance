import { ProductCollection } from "./product-collection";
import { AssuranceReviewThreadDialog } from "./assurance-review";
import { useServerCollection, vocabularyOptions } from "./collection-question";
import {
  RecordLink,
  RecordPreviewActions,
  RecordPreviewPanel,
  recordDestination,
  useDisplayedRecords,
  useEndOnHide,
  useOpenRecord,
  type PreviewRecord,
  type RecordDestination,
} from "./record-preview";
import { DueDate } from "./work-common";
import { usePublishResults } from "./publish-results";
import { useMemo, useRef, useState, type ReactNode, type RefObject } from "react";
import { Link, defaultParseSearch, useNavigate } from "@tanstack/react-router";
import {
  Absent,
  Button,
  DataTable,
  DateTime,
  KeyValue,
  LinkButton,
  PageHeader,
  Person,
  TextLink,
  defineColumns,
  useLedgerLocale,
  type FilterOption,
} from "@ledger/design-system";
import { Page } from "@/components/app/shell";
import { StatusBadge } from "@/components/app/status";
import { useWorkspace } from "@/components/app/workspace";
import type { ResultsToPublish } from "@/lib/assessment-results";
import { reviewTargetHref, reviewTargetSchema, type ReviewTarget } from "@/lib/assurance-review";
import { useRow, useRows, type TableName } from "@/lib/models";
import { registerViews } from "@/lib/register-views";
import { serverRead, type ServerRow } from "@/lib/server-table";
import { reviewQueueKinds } from "@/lib/status";

/*
 * The Review queue: everything in the workspace waiting on a reviewer, across programs and whoever
 * is meant to act, one row a record (`review_queue_rows`). My work's Attention is the reader's own
 * inbox; this is the workspace's register of what waits. A row's name opens the page where its
 * review is done: the evidence version's review, the product assessment, the package, the record
 * a discussion was started on. A gate and a draft assessment results revision have no page of
 * their own, so their names open the preview, where results to publish are published.
 */

/** A record waiting, as the queue's view gives it. */
type ReviewRecord = ServerRow<
  "review_queue_rows",
  | "id"
  | "tenant_id"
  | "kind"
  | "record_table"
  | "parent_id"
  | "parent_name"
  | "target"
  | "version_number"
  | "name"
  | "program_id"
  | "program_name"
  | "waiting_since"
  | "waiting_on_party_id"
  | "waiting_on_name"
  | "requested_by_party_id"
  | "requested_by_name"
  | "owner_party_id"
  | "owner_name"
  | "due_on"
  | "determination_count",
  "tenant_id" | "kind" | "record_table" | "name" | "waiting_since"
>;
type ReviewRow = ReviewRecord & {
  /** The program's name; null when the record names none or the reader cannot see it. */
  program: string | null;
  /** Who the schema says acts; null where it names nobody. */
  waiting_on: string | null;
  /** Who asked; null where nobody is recorded. */
  requested_by: string | null;
};

/** Each record of a page as the register draws it. */
const reviewRows = (page: ReviewRecord[]): ReviewRow[] =>
  page.map((record) => ({
    ...record,
    program: record.program_name,
    waiting_on: record.waiting_on_name,
    requested_by: record.requested_by_name,
  }));

/** The Program filter's value, and the cell's words, for a record that belongs to no program. */
const NO_PROGRAM = "No program";
/** The person columns' filter value, and the cells' words, where the schema names nobody. */
const NOT_NAMED = "Not named";

/**
 * The queue, a page at a time from the server, the record that has waited longest first. Every
 * table the view derives from is named, so a review recorded, a gate decided, an assessment
 * published, a discussion resolved or a name changed reads the page again.
 */
const reviewRead = serverRead({
  source: "review_queue_rows",
  models: [
    "evidence_artifacts",
    "evidence_versions",
    "evidence_reviews",
    "assessment_campaigns",
    "assessment_plan_revisions",
    "assessment_results_revisions",
    "assessment_findings",
    "products",
    "product_revisions",
    "product_assessments",
    "product_determinations",
    "lifecycle_gates",
    "authorization_packages",
    "package_revisions",
    "authorization_decisions",
    "assurance_review_threads",
    "programs",
    "parties",
  ],
  columns: [
    "id",
    "tenant_id",
    "kind",
    "record_table",
    "parent_id",
    "parent_name",
    "target",
    "version_number",
    "name",
    "program_id",
    "program_name",
    "waiting_since",
    "waiting_on_party_id",
    "waiting_on_name",
    "requested_by_party_id",
    "requested_by_name",
    "owner_party_id",
    "owner_name",
    "due_on",
    "determination_count",
  ],
  search: ["name", "program_name", "waiting_on_name", "requested_by_name"],
  fields: {
    kind: { labels: reviewQueueKinds, sort: "kind_rank" },
    // The program and the people sort, are filtered and are found by their names.
    program: { column: "program_name", emptyLabel: NO_PROGRAM },
    waiting_on: { column: "waiting_on_name", emptyLabel: NOT_NAMED },
    requested_by: { column: "requested_by_name", emptyLabel: NOT_NAMED },
  },
  order: [{ column: "waiting_since", ascending: true }],
});

/** A record's table and identity as `RecordLink` and `recordDestination` read them. */
function reviewRecord(row: ReviewRow): { table: TableName; record: PreviewRecord } {
  switch (row.kind) {
    // An evidence version opens its artifact at that version: the review.
    case "evidence":
      return { table: "evidence_versions", record: { id: row.id, artifact_id: row.parent_id } };
    // A package version is decided on its package's page.
    case "package":
      return row.parent_id
        ? { table: "authorization_packages", record: { id: row.parent_id } }
        : { table: "package_revisions", record: { id: row.id } };
    default:
      return { table: row.record_table as TableName, record: { id: row.id } };
  }
}

/** What a discussion was started on, as the review command validated it; null when unreadable. */
function discussionTarget(row: ReviewRow): ReviewTarget | null {
  if (row.kind !== "discussion") return null;
  const target = reviewTargetSchema.safeParse(row.target);
  return target.success ? target.data : null;
}

/**
 * The page a discussion's record is reviewed on, as the router reads an address: the requirement,
 * the evidence version, the workbook cell, the traceability matrix. A target whose program is not
 * recorded names no page (the review command's fallback is the Programs register), so its name
 * opens the preview instead.
 */
function discussionLink(row: ReviewRow): { to: string; search: Record<string, unknown> } | null {
  const target = discussionTarget(row);
  if (!target) return null;
  const href = reviewTargetHref(target, row.program_id);
  if (href === "/programs") return null;
  const url = new URL(href, "https://review.invalid");
  return { to: url.pathname, search: defaultParseSearch(url.search) };
}

/** Where a row's name leads: the page its review is done on, or nothing for a record with none. */
function reviewDestination(row: ReviewRow): RecordDestination | null {
  const { table, record } = reviewRecord(row);
  return recordDestination(table, record);
}

/** The words for what a discussion was started on. */
const targetWords: Record<ReviewTarget["kind"], string> = {
  requirement: "Requirement",
  "requirement-change": "Requirement change",
  mapping: "Control mapping",
  evidence: "Evidence version",
  citation: "Evidence citation",
  passage: "Evidence passage",
  "assessment-finding": "Assessment finding",
  cell: "Workbook cell",
};

/**
 * A record's name: a link to the page its review is done on, else a link-styled button that opens
 * the queue's preview of it.
 */
function ReviewName({ row, onPreview }: { row: ReviewRow; onPreview: () => void }) {
  const link = discussionLink(row);
  if (link)
    return (
      <TextLink
        render={
          <Link
            to={link.to as never}
            search={link.search as never}
            onClick={(event) => event.stopPropagation()}
          />
        }
      >
        {row.name}
      </TextLink>
    );
  const { table, record } = reviewRecord(row);
  return (
    <RecordLink table={table} record={record} onPreview={onPreview}>
      {row.name}
    </RecordLink>
  );
}

/** A person the register names: their name, else why there is none. */
const named = (name: string | null, id: string | null) =>
  name ? <Person name={name} /> : <Absent label={id ? "Not available" : NOT_NAMED} />;
/** The program's name, else why there is none. */
const programCell = (row: ReviewRow) =>
  row.program ?? <Absent label={row.program_id ? "Not available" : NO_PROGRAM} />;

/**
 * The register's columns, built once with the preview's setter: a record with no page of its own
 * opens the queue's preview from its name, so stepping through it rebuilds none of them.
 */
const reviewColumns = (preview: (row: ReviewRow) => void) =>
  defineColumns<ReviewRow>((c) => [
    c.text("name", {
      header: "Record",
      minWidth: 200,
      priority: 0,
      hideable: false,
      cell: (row) => <ReviewName row={row} onPreview={() => preview(row)} />,
    }),
    // The kind stays beside the record longest in a narrow register, then who it waits on.
    c.status("kind", { header: "Kind", width: 230, priority: 1, statuses: reviewQueueKinds }),
    c.text("program", { header: "Program", width: 200, priority: 3, cell: programCell }),
    c.person("waiting_on", {
      header: "Waiting on",
      priority: 2,
      cell: (row) => named(row.waiting_on, row.waiting_on_party_id),
    }),
    c.date("waiting_since", { header: "Waiting since", priority: 4 }),
    c.person("requested_by", {
      header: "Requested by",
      priority: 5,
      cell: (row) => named(row.requested_by, row.requested_by_party_id),
    }),
  ]);

const reviewNoun = { one: "review", other: "reviews" };

export function ReviewQueue() {
  const navigate = useNavigate();
  const openRecord = useOpenRecord();
  const [preview, setPreview] = useState<ReviewRow | null>(null);
  useEndOnHide(() => setPreview(null));
  const columns = useMemo(() => reviewColumns(setPreview), []);
  // The programs and the people by name, for the Program and Waiting on filters: the server's rows
  // are one page, so their names are not every name there is.
  const programs = useRows("programs", {}, { columns: ["id", "name"] });
  const parties = useRows("parties", {}, { columns: ["id", "name"] });
  const programOptions = useMemo<FilterOption[]>(
    () => [...names(programs.data), { value: NO_PROGRAM }],
    [programs.data],
  );
  const partyOptions = useMemo<FilterOption[]>(
    () => [...names(parties.data), { value: NOT_NAMED }],
    [parties.data],
  );
  const collection = useServerCollection<ReviewRow, ReviewRecord>(reviewRead, {
    columns,
    rows: reviewRows,
    getRowId: (row) => row.id,
    rowLabel: (row) => row.name,
    preview: useMemo(
      () => ({ onPreview: setPreview, activeId: preview?.id ?? null }),
      [preview?.id],
    ),
    label: "Review queue",
    view: registerViews.reviewQueue,
    resizable: true,
    reorderable: true,
  });
  const { table } = collection;
  const displayed = useDisplayedRecords(table);
  /** A row goes where its name goes: the page its review is done on, else the queue's preview. */
  const open = (row: ReviewRow) => {
    const link = discussionLink(row);
    if (link) return void navigate({ to: link.to as never, search: link.search as never });
    const { table: model, record } = reviewRecord(row);
    openRecord(model, record, () => setPreview(row));
  };
  return (
    <Page>
      <PageHeader>
        <PageHeader.Heading>
          <PageHeader.Title>Review queue</PageHeader.Title>
        </PageHeader.Heading>
      </PageHeader>
      <ProductCollection
        {...collection}
        // The programs' and the people's names list the filters' values.
        queries={[...collection.queries, programs, parties]}
        fill
        noun={reviewNoun}
        onRowClick={open}
        empty={{
          illustration: "done",
          title: "Nothing waiting on a reviewer",
          description:
            "Evidence to accept, results to publish, gates to decide and open discussions appear here.",
        }}
        searchLabel="Find reviews"
        filters={
          <>
            <DataTable.Filter
              table={table}
              column="kind"
              options={vocabularyOptions(reviewQueueKinds)}
            />
            <DataTable.Filter table={table} column="program" options={programOptions} />
            <DataTable.Filter table={table} column="waiting_on" options={partyOptions} />
          </>
        }
      />
      {preview && (
        <ReviewPreview
          // The page's copy, once a refresh brings it, else the row the reader opened.
          record={displayed.find((row) => row.id === preview.id) ?? preview}
          rows={displayed}
          onSelect={setPreview}
          onClose={() => setPreview(null)}
        />
      )}
    </Page>
  );
}

/** Every distinct name, in the reader's alphabetical order, as filter values. */
function names(rows: readonly { name: string }[] | undefined): FilterOption[] {
  return [...new Set((rows ?? []).map((row) => row.name))]
    .sort((a, b) => a.localeCompare(b))
    .map((value) => ({ value }));
}

/**
 * Publish assessment results, the preview's one primary for results waiting to be published. The
 * results revision is read as the preview opens, for the revision the reader saw; the findings are
 * the number the preview says. It keeps its place and says why while that read loads, when it
 * fails, and once the results are published, here or in another session, so focus stays on it.
 */
function PublishResultsAction({
  record,
  onPublish,
}: {
  record: ReviewRow;
  onPublish: (
    results: ResultsToPublish,
    returnFocus: RefObject<HTMLElement | null>,
  ) => Promise<boolean>;
}) {
  const results = useRow("assessment_results_revisions", record.id);
  const [published, setPublished] = useState(false);
  const button = useRef<HTMLButtonElement>(null);
  const row = results.data;
  const waits =
    published || row?.state === "published"
      ? "These assessment results are published."
      : row === null
        ? "These assessment results are no longer available."
        : results.isError
          ? "The assessment results could not be read."
          : !row
            ? "Reading the assessment results…"
            : undefined;
  const publish = async () => {
    if (!row || waits) return;
    const done = await onPublish(
      {
        id: row.id,
        title: record.name,
        versionNumber: row.version_number,
        revision: row.revision,
        findings: record.determination_count ?? 0,
      },
      button,
    );
    if (done) setPublished(true);
  };
  return (
    <Button
      ref={button}
      size="small"
      variant="primary"
      onClick={() => void publish()}
      {...(waits ? { disabledReason: waits } : {})}
    >
      Publish assessment results
    </Button>
  );
}

/**
 * A record of the queue beside the register: what waits and on whom, in the facts its kind holds,
 * with previous and next through the queue and, where the record has a page, the page its review
 * is done on. A discussion opens its thread, where it is resolved; a gate opens its program's
 * Lifecycle gates, where it is decided; results to publish are published here, by a reader who may
 * write. Once they are, the record leaves the queue and the preview stays on it, outside the
 * results.
 */
function ReviewPreview({
  record,
  rows,
  onSelect,
  onClose,
}: {
  record: ReviewRow;
  rows: ReviewRow[];
  onSelect: (row: ReviewRow) => void;
  onClose: () => void;
}) {
  const workspace = useWorkspace();
  const publish = usePublishResults();
  const [discussing, setDiscussing] = useState(false);
  const link = discussionLink(record);
  const actions =
    record.kind === "assessment_results" && workspace.role !== "viewer" ? (
      <PublishResultsAction key={record.id} record={record} onPublish={publish.ask} />
    ) : record.kind === "discussion" ? (
      <Button size="small" variant="primary" onClick={() => setDiscussing(true)}>
        Open discussion
      </Button>
    ) : record.kind === "gate" && record.program_id ? (
      <LinkButton
        size="small"
        variant="primary"
        render={
          <Link
            to="/programs/$programId"
            params={{ programId: record.program_id }}
            search={{ tab: "Schedule" }}
            hash="program-lifecycle_gates"
          />
        }
      >
        Open lifecycle gates
      </LinkButton>
    ) : undefined;
  return (
    <>
      <RecordPreviewPanel
        title={record.name}
        label="Review preview"
        onClose={onClose}
        recordActions={actions}
        navigation={
          <RecordPreviewActions
            table={record.record_table as TableName}
            record={record}
            rows={rows}
            onSelect={onSelect}
            recordLabel={record.name}
            // A discussion opens the record it was started on; every other record, its own page,
            // or none for a record with no page.
            destination={link ? undefined : reviewDestination(record)}
            openLink={
              link ? (
                <Link
                  to={link.to as never}
                  search={link.search as never}
                  target="_blank"
                  rel="noopener noreferrer"
                />
              ) : undefined
            }
          />
        }
      >
        <ReviewFacts key={record.id} record={record} />
      </RecordPreviewPanel>
      {discussing && (
        <AssuranceReviewThreadDialog threadId={record.id} onClose={() => setDiscussing(false)} />
      )}
      {publish.confirmation}
    </>
  );
}

/** Past this many characters a label no longer fits KeyValue's `default` label column. */
const LONG_LABEL = 14;

/** What a record waits on and since when, in the facts its kind holds. */
function ReviewFacts({ record }: { record: ReviewRow }) {
  const { formatNumber } = useLedgerLocale();
  const version = (label: string) =>
    record.version_number === null
      ? null
      : ([label, `Version ${record.version_number}`] as [string, ReactNode]);
  const program: [string, ReactNode] = [
    "Program",
    record.program_id && record.program ? (
      <RecordLink table="programs" record={{ id: record.program_id }}>
        {record.program}
      </RecordLink>
    ) : (
      programCell(record)
    ),
  ];
  const parent = (label: string, table: TableName): [string, ReactNode] => [
    label,
    record.parent_id ? (
      <RecordLink table={table} record={{ id: record.parent_id }}>
        {record.parent_name ?? <Absent label="Not available" />}
      </RecordLink>
    ) : (
      <Absent label="Not available" />
    ),
  ];
  const waitingOn: [string, ReactNode] = [
    "Waiting on",
    named(record.waiting_on, record.waiting_on_party_id),
  ];
  const requestedBy: [string, ReactNode] = [
    "Requested by",
    named(record.requested_by, record.requested_by_party_id),
  ];
  const owner: [string, ReactNode] = [
    "Owner",
    record.owner_name ? (
      <Person name={record.owner_name} />
    ) : (
      <Absent label={record.owner_party_id ? "Not available" : "Not recorded"} />
    ),
  ];
  const determinations: [string, ReactNode] = [
    "Determinations",
    formatNumber(record.determination_count ?? 0),
  ];
  const target = discussionTarget(record);
  const byKind: Record<string, ([string, ReactNode] | null)[]> = {
    evidence: [program, version("Version"), waitingOn, requestedBy, owner],
    assessment_results: [
      program,
      parent("Assessment campaign", "assessment_campaigns"),
      version("Results version"),
      determinations,
      owner,
    ],
    product_assessment: [
      parent("Product", "products"),
      version("Product version"),
      determinations,
      waitingOn,
    ],
    gate: [program, ["Due", <DueDate value={record.due_on} />]],
    package: [program, version("Version"), owner],
    discussion: [
      program,
      ["Discussion of", target ? targetWords[target.kind] : <Absent label="Not available" />],
      requestedBy,
    ],
  };
  const facts = [
    ["Kind", <StatusBadge statuses={reviewQueueKinds} value={record.kind} />] as [
      string,
      ReactNode,
    ],
    ...(byKind[record.kind] ?? [program]).filter((fact): fact is [string, ReactNode] => !!fact),
    ["Waiting since", <DateTime value={record.waiting_since} />] as [string, ReactNode],
  ];
  return (
    <KeyValue.Group
      {...(facts.some(([label]) => label.length > LONG_LABEL)
        ? { labelWidth: "wide" as const }
        : {})}
    >
      {facts.map(([label, value]) => (
        <KeyValue key={label} label={label} wrap>
          {value}
        </KeyValue>
      ))}
    </KeyValue.Group>
  );
}
