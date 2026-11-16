// From the product pattern contract (docs/guides/product-patterns.md), moved here on
// 2026-11-16 when the contract was cut to its rules: what holds for this screen alone, and the
// full wording of rules the contract now states in fewer words.
//
// A dashboard says what needs attention across registers and leaves the work to them. It is one
// `PageHeader` that holds only the name, a Stat band, then its widgets in the page's own columns:
// the chart and top-N widgets take two thirds and the activity feed one third while Main has room
// (an `@container` grid, never the viewport), and they stack in one column when a panel or a phone
// narrows it. Reference: the Portfolio (src/routes/index.tsx).
//
// The Stat band is one `Stat.Grid frame="band"`, a named group of up to four linked `Stat.Tile`s.
// Each tile counts one thing a reader acts on (open risks, open operational issues), its note names
// the part to look at first ("12 high or critical"; on Open risks, "41 without an owner", or "All
// have an owner", since the matrix and Highest open risks under the band say their severity), and
// its `link` opens the register it counts on the tile's question, through `questionSearch`: a tile
// that counts part of a register carries its filter, and one that counts the whole register clears
// the filters (`{ filters: [] }`), so it opens what it counts whatever the register last asked. The
// value is the number itself, which the tile writes in the reader's locale and mutes at zero.
// `isLoading` holds its place while it loads; a count that cannot load is `Absent` with a "Could
// not load" note, under one alert with Retry above the band. A linked tile holds no other control.
//
// A chart widget is a `Chart` frame. Its title says what it counts and how it splits it (Open risks
// by likelihood and impact), a heading at the widgets' level (`titleLevel`), its description says
// what the plot leaves out (open risks not yet assessed), and its table twin is one toggle away. It
// loads as the plot's skeleton. A failure is one alert with Retry above it (`QueryState`), as on
// the other widgets: a failed refresh keeps the plot, and a failed first load says Could not load
// in the plot's place. Each mark that holds records links to the register filtered to them through
// the register's address question (`link` on `Chart.Heatmap`, built with `questionSearch`), and the
// table twin carries the same links; a mark of zero does not link, and a mark never opens a card. A
// chart reads what it places from the register's view, scoped to the records it counts and the
// columns it places them by, never every record and revision behind them: the risk matrix reads
// each open risk's latest likelihood and impact from `risk_rows`, those columns alone
// (`useServerResultRows` in server-table). Reference: the risk matrix in the Portfolio
// (src/routes/index.tsx).
//
// A top-N widget is a `Section` whose title says which records and in what order (Highest open
// risks, Recently updated programs) and whose action is a View all `TextLink` to the register,
// which opens it unasked (`questionSearch(view, { filters: [] })`) rather than on the question it
// last asked in the tab. Its body is a `DataTable` with no toolbar: at most five rows in the order
// the title names, the record's name as its `RecordLink`, and a row click that follows it. Its rows
// are read on the server in that order, five of them: Highest open risks reads `risk_rows` scoped
// to the open risks, the highest latest severity first, the unassessed last, then the latest
// changed, with the program's and the owner's names. Recently updated programs orders a program by
// the latest moment anything in it was recorded or changed, read in one request from
// `program_activity` (its activity events, its published assessment results, a change to its
// requirements, operational issues, risks and their assessments, tasks and evidence artifacts, else
// its own last edit), and its Updated column is that moment. It has no Columns, Settings, column
// menu (`pinnable` and `hideable` are off), sort, filters, pagination or eye; the register has
// them. It loads under skeleton rows, and a failure is one alert with Retry that keeps any rows
// already shown. Its empty state is the compact empty with an icon, a title and one line, with a
// create action only where the register it stands for would offer one to an empty workspace (Create
// program). A column may say where each of its records stands, read for the rows shown and never
// for a register's every row: Recently updated programs has Controls satisfied, the share of the
// program's control baseline an assessor found satisfied beside a `Tally` of its six control
// statuses in the Overview's marks (`ControlStatusTally` in control-status), named with each status
// and its count. The five rows' counts are one read of the counts alone
// (`program_control_status_counts` through `useProgramsControlStatusCounts` in control-status,
// handed to the cells by `ProgramStandings`), counted as the status counts its totals, never a
// program's whole control status; a program with no control baseline draws Absent, a program the
// read leaves out because the reader can no longer read it (one deleted since the rows were read)
// draws Absent (Not available) while the other rows draw their counts, and a read that fails says
// Could not load in its cell under the widget's alert, with the rows kept.
//
// The activity feed is a `Section` holding a `Timeline size="small" wrap`, newest first and a
// handful of entries long. It reads the workspace's latest events with the columns an entry draws
// (`recentActivityRead` in activity-entries), never every event; an event that names a record by
// its code reads its kind and the code over what changed. Each entry's title says who did what
// ("Priya Raghavan assigned …"), links to the record it names when that record has a page, carries
// the program as its meta and what was said as its description, and shows its time as relative
// words with the full moment in the reader's zone (`dateTime` alone). An event names its program,
// the one record of it the event is about, or that record and its program: a publication of
// assessment results names the program and the campaign, so it reads "Priya Raghavan published
// assessment results of Continuous monitoring FY2027" over the results and their findings, links to
// the campaign, whose record lists its results, and stands in the program's Activity too.
// Consecutive edits of one record by one person are one entry that says what changed and in how
// many edits. A filterable audit log is a register, not this feed, and a record's own activity is
// the Timeline in its body (Record pages).

import { EmptyMessage, QueryState, type QueryStatus } from "@/components/prototype/work-common";
import { ControlStatusTally } from "@/components/prototype/control-status";
import {
  ControlStatusSparkline,
  ControlStatusTrends,
} from "@/components/prototype/control-status-trend";
import { QueryValue } from "@/components/prototype/library-shared";
import { RecordLink, recordLink, useOpenRecord } from "@/components/prototype/record-preview";
import { questionSearch } from "@/components/prototype/collection-question";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import type { UseQueryResult } from "@tanstack/react-query";
import { createContext, useContext, useMemo, type ReactNode } from "react";
import {
  Absent,
  Box,
  Chart,
  DataTable,
  Grid,
  Id,
  Inline,
  LinkButton,
  PageHeader,
  Section,
  Stack,
  Stat,
  Text,
  TextLink,
  Timeline,
  defineColumns,
  useDataTable,
  useLedgerLocale,
  type DataTableEmpty,
  type DataTableInstance,
  type HeatmapSelection,
  type StatTileProps,
  type TableQuery,
} from "@ledger/design-system";
import { FolderKanban, Plus, ShieldAlert } from "lucide-react";
import {
  controlStatusShare,
  useProgramsControlStatusCounts,
  type ControlStatusTotals,
} from "@/lib/control-status";
import {
  RECENT_ACTIVITY_EVENTS,
  activityEntries,
  changedFields,
  eventRecord,
  eventWords,
  recentActivityRead,
  type ActivityEntry,
  type ActivityEvent,
} from "@/lib/activity-entries";
import { useRows } from "@/lib/models";
import { useRecentPostureTrend } from "@/lib/posture-trend";
import {
  determinations,
  operationalIssueStatuses,
  programStatuses,
  riskLevels,
  riskStatuses,
  severityLevels,
} from "@/lib/status";
import { useWorkspace } from "@/components/app/workspace";
import { Page } from "@/components/app/shell";
import { LevelIndicator } from "@/components/app/status";
import { noOwnerFilter, ownerField } from "@/lib/owner-assign";
import { registerViews } from "@/lib/register-views";
import {
  serverRead,
  useServerCountQueries,
  useServerResultRows,
  useServerRows,
  type ServerRow,
} from "@/lib/server-table";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "Portfolio — Program Assurance" }] }),
  component: Portfolio,
});

/** How many records a widget shows before its View all link takes over. */
const TOP = 5;
/** How many entries the activity feed shows, after consecutive edits of one record are joined. */
const FEED = 8;

/** A query is loading while it fetches with nothing to show; a failure is not a load. */
const isLoading = (query: QueryStatus) =>
  query.isPending && query.data === undefined && query.fetchStatus !== "idle";
const hasFailed = (query: QueryStatus) => query.isError && query.data === undefined;
/** A tile's count, read on the server: its loading and its failure too, never a zero. */
type CountQuery = ReturnType<typeof useServerCountQueries>[number];

const openRisk = (status: string) => status !== "closed";
const openIssue = (status: string) => !["closed", "resolved", "cancelled"].includes(status);
const unsatisfied = (determination: string) =>
  determination === "partially_satisfied" || determination === "other_than_satisfied";

/*
 * Each tile and each cell links to the register filtered to what it counts: the register reads its
 * question from the address, under its view's name (ProductCollection's `keepQuestion`).
 */
const openRiskStatuses = Object.keys(riskStatuses).filter(openRisk);
const openIssueStatuses = Object.keys(operationalIssueStatuses).filter(openIssue);
const unsatisfiedDeterminations = Object.keys(determinations).filter(unsatisfied);
const openRisksQuestion: TableQuery = { filters: [{ id: "status", value: openRiskStatuses }] };
const openIssuesQuestion: TableQuery = { filters: [{ id: "status", value: openIssueStatuses }] };
const unsatisfiedQuestion: TableQuery = {
  filters: [{ id: "determination", value: unsatisfiedDeterminations }],
};
/** A tile's question narrowed to its high and critical records: the tile's note. */
const severeOf = (question: TableQuery): TableQuery => ({
  filters: [...(question.filters ?? []), { id: "severity", value: ["high", "critical"] }],
});
/**
 * A tile's question narrowed to the records nobody owns: the Open risks tile's note, since the
 * matrix and Highest open risks under the band already say the risks' severity.
 */
const unownedOf = (question: TableQuery): TableQuery => ({
  filters: [...(question.filters ?? []), ...noOwnerFilter()],
});
/**
 * Every record, as the register opens unasked: a View all link opens this rather than the question
 * the register last asked in this tab, which may be a tile's or a cell's.
 */
const everyRecord: TableQuery = { filters: [] };

/*
 * The tiles count on the server what the registers they open hold: each asks its register's view
 * the tile's question, and reads the count alone (a HEAD request), never the rows.
 */
const riskCounts = serverRead({
  source: "risk_rows",
  model: "risks",
  // A risk's severity is its latest assessment's.
  models: ["risk_revisions"],
  columns: ["id", "status", "severity"],
  // No owner asks for the risks nobody owns, as the register's Owner filter does.
  fields: { owner_party_id: ownerField },
});
const issueCounts = serverRead({
  source: "operational_issue_rows",
  model: "operational_issues",
  columns: ["id", "status", "severity"],
});
const findingCounts = serverRead({
  source: "assessment_finding_rows",
  model: "assessment_findings",
  columns: ["id", "determination"],
});

/*
 * The risk widgets read the risk register's view, scoped to the open risks: never every risk and
 * risk assessment of the workspace. The matrix reads each open risk's latest likelihood and impact
 * alone, and Highest open risks its five rows, ordered on the server.
 */
const openRiskMatrixRead = serverRead({
  source: "risk_rows",
  model: "risks",
  // A risk's likelihood and impact are its latest assessment's.
  models: ["risk_revisions"],
  columns: ["id", "likelihood", "impact"],
  scope: { status: openRiskStatuses },
});
/**
 * The open risks by their latest assessment's severity, the unassessed last, then the latest
 * changed first, with their program's and owner's names.
 */
const highestOpenRisksRead = serverRead({
  source: "risk_rows",
  model: "risks",
  // A new assessment changes a risk's latest severity.
  models: ["risk_revisions"],
  columns: ["id", "title", "status", "severity", "program_name", "owner_name"],
  scope: { status: openRiskStatuses },
  order: [
    { column: "severity_rank", ascending: false },
    { column: "updated_at", ascending: false },
  ],
});

/**
 * The programs that last saw activity, latest first: anything recorded or changed in the program
 * (its activity events, its published assessment results, a change to its requirements, issues,
 * risks, tasks or evidence), else its own last edit, which `program_activity` answers on the server.
 */
const recentProgramsRead = serverRead({
  source: "program_activity",
  model: "programs",
  models: [
    "activity_events",
    "assessment_results_revisions",
    "requirement_revisions",
    "operational_issues",
    "risks",
    "risk_revisions",
    "tasks",
    "evidence_artifacts",
  ],
  columns: ["id", "code", "name", "status", "last_activity_at"],
  order: [{ column: "last_activity_at", ascending: false }],
});

/** The risk matrix's axes: likelihood rows likeliest first, impact columns least first. */
const levelsByRank = Object.entries(riskLevels).map(([value, entry]) => ({ value, ...entry }));
const likelihoodRows = [...levelsByRank].sort((a, b) => b.rank - a.rank);
const impactColumns = [...levelsByRank].sort((a, b) => a.rank - b.rank);
const levelOf = (label: string) => levelsByRank.find((level) => level.label === label)?.value;

/**
 * A top-N widget: a named Section whose action is View all, over a DataTable with no toolbar and
 * no pager. It loads under skeleton rows, and a failure is one alert with Retry that keeps any rows
 * already shown.
 */
function Widget<T extends { id: string }>({
  title,
  viewAll,
  table,
  queries,
  values,
  retryLabel,
  empty,
  onRowClick,
}: {
  title: string;
  viewAll: ReactNode;
  table: DataTableInstance<T>;
  queries: QueryStatus[];
  /**
   * Reads a column draws in place, one a row (a program's control status): a failure joins the
   * widget's one alert with Retry, the rows stay, and the cell says Could not load. They never
   * hold the rows back.
   */
  values?: QueryStatus[] | undefined;
  retryLabel: string;
  empty: DataTableEmpty;
  onRowClick: (row: T) => void;
}) {
  const failed = [...queries, ...(values ?? [])].filter((query) => query.isError);
  const missing = queries.some((query) => query.isError && query.data === undefined);
  return (
    <Section title={title} action={viewAll}>
      <Stack space="space.150">
        {failed.length > 0 && <QueryState queries={failed} retryLabel={retryLabel} />}
        {!missing && (
          <DataTable
            table={table}
            responsive
            state={queries.some(isLoading) ? "loading" : "ready"}
            loadingRows={TOP}
            empty={empty}
            onRowClick={onRowClick}
          />
        )}
      </Stack>
    </Section>
  );
}

/**
 * The risk matrix: open risks counted by the likelihood and impact of their latest assessment, a
 * heatmap with its table twin one toggle away. Its title is the widget's heading. It loads as the
 * grid's skeleton. A failure is one alert with Retry above it, as on every widget: a failed refresh
 * keeps the grid, and a failed load says Could not load in the grid's place, as a Stat tile does.
 * A cell that holds risks links to the risk register filtered to them; a risk not yet assessed is
 * counted in the description, not the grid.
 */
function RiskMatrix({
  counts,
  unassessed,
  queries,
}: {
  /** Open risks by `likelihood|impact`, stored values. */
  counts: ReadonlyMap<string, number>;
  /** Open risks whose latest assessment records no likelihood or impact, or that have none. */
  unassessed: number;
  queries: QueryStatus[];
}) {
  const { formatNumber, formatPlural } = useLedgerLocale();
  const failed = queries.filter((query) => query.isError);
  const missing = failed.some((query) => query.data === undefined);
  const loading = !missing && queries.some(isLoading);
  const count = (likelihood: string, impact: string) => counts.get(`${likelihood}|${impact}`) ?? 0;
  const value = (row: string, column: string) => {
    const likelihood = levelOf(row);
    const impact = levelOf(column);
    return likelihood && impact ? count(likelihood, impact) : null;
  };
  const most = Math.max(0, ...counts.values());
  const assessed = [...counts.values()].reduce((sum, n) => sum + n, 0);
  const cellLink = ({ row, column }: HeatmapSelection) => {
    const likelihood = levelOf(row);
    const impact = levelOf(column);
    if (!likelihood || !impact) return undefined;
    return (
      <Link
        to="/risks"
        search={questionSearch(registerViews.risks, {
          filters: [
            ...(openRisksQuestion.filters ?? []),
            { id: "likelihood", value: [likelihood] },
            { id: "impact", value: [impact] },
          ],
        })}
      />
    );
  };
  const notAssessed = unassessed
    ? formatPlural(unassessed, {
        one: "{count} open risk is not yet assessed",
        other: "{count} open risks are not yet assessed",
      })
    : undefined;
  return (
    <Stack space="space.150" className="min-w-0">
      {failed.length > 0 && (
        <QueryState queries={failed} retryLabel="Retry loading the risk matrix" />
      )}
      <Chart
        title="Open risks by likelihood and impact"
        titleLevel={2}
        description={
          notAssessed
            ? `At their latest assessment. ${notAssessed}.`
            : "At their latest assessment."
        }
        summary={
          assessed
            ? formatPlural(assessed, {
                one: "{count} assessed open risk, placed by its likelihood and impact.",
                other: "{count} assessed open risks, placed by their likelihood and impact.",
              })
            : undefined
        }
        // A failed load stands in its place under the alert above, which carries Retry.
        state={missing ? "empty" : loading ? "loading" : assessed === 0 ? "empty" : "ready"}
        statusTitle={
          missing ? "Could not load" : unassessed ? "No assessed open risks" : "No open risks"
        }
        statusText={
          missing
            ? "The matrix appears here once the open risks load."
            : "An open risk appears here once its assessment records a likelihood and an impact."
        }
      >
        <Stack space="space.150">
          <Chart.Heatmap
            rows={likelihoodRows.map((level) => level.label)}
            columns={impactColumns.map((level) => level.label)}
            value={value}
            scale="sequential"
            domain={[0, Math.max(1, most)]}
            zeroStep
            showValues
            rowLabel="Likelihood"
            columnLabel="Impact"
            link={cellLink}
          />
          <Chart.Scale
            scale="sequential"
            zeroStep
            min={formatNumber(0)}
            max={formatPlural(Math.max(1, most), { one: "{count} risk", other: "{count} risks" })}
          />
        </Stack>
      </Chart>
    </Stack>
  );
}

/** An open risk the matrix places, at its latest assessment. */
type MatrixRisk = ServerRow<"risk_rows", "id" | "likelihood" | "impact">;
/** One of the highest open risks, as the register's view reads it. */
type HighestRisk = ServerRow<
  "risk_rows",
  "id" | "title" | "status" | "severity" | "program_name" | "owner_name",
  "title" | "status"
>;
type RiskRow = {
  id: string;
  title: string;
  status: string;
  severity: string | null;
  program: string | null;
  owner: string | null;
};
/** A program the widget lists: its own fields, and the moment it last saw activity. */
type ProgramRow = ServerRow<
  "program_activity",
  "id" | "code" | "name" | "status" | "last_activity_at",
  "code" | "name" | "status" | "last_activity_at"
>;

/** The rows' control status counts, read once for every row, for the cells to draw from. */
const ProgramStandings = createContext<UseQueryResult<
  ReadonlyMap<string, ControlStatusTotals>,
  Error
> | null>(null);

/**
 * Where a program stands on its control baseline, in one line: the share an assessor found
 * satisfied, its last twelve days as a sparkline beside it once there are two, then every status
 * as its share of the baseline. The widget reads its rows' counts once, in one request
 * (`useProgramsControlStatusCounts`, handed to the cells by `ProgramStandings`), and their trends
 * once (`ControlStatusTrends`), with its alert, so this asks nothing more.
 */
function ProgramControlStatusCell({ program }: { program: ProgramRow }) {
  const { formatNumber } = useLedgerLocale();
  const standings = useContext(ProgramStandings);
  const status = standings?.data?.get(program.id);
  return (
    <QueryValue queries={standings ? [standings] : []}>
      {() =>
        !status ? (
          <Absent label="Not available" />
        ) : status.baseline ? (
          <Inline space="space.100" alignBlock="center" className="min-w-0">
            <Text numeric>{formatNumber(controlStatusShare(status, "satisfied"))}%</Text>
            <ControlStatusSparkline programId={program.id} status={status} />
            <ControlStatusTally
              status={status}
              label={`Control status of ${program.name}, ${formatNumber(status.total)} controls`}
            />
          </Inline>
        ) : (
          <Absent label="No control baseline" />
        )
      }
    </QueryValue>
  );
}

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

function Portfolio() {
  const workspace = useWorkspace();
  const openRecord = useOpenRecord();
  const { locale, formatNumber, formatPlural } = useLedgerLocale();
  const formatList = (items: string[]) =>
    new Intl.ListFormat(locale, { style: "long", type: "conjunction" }).format(items);
  const programs = useRows("programs", undefined, {
    columns: ["id", "name", "status"] as const,
  });
  // The open risks the matrix places, and the five highest of them, from the register's view.
  const matrixRisks = useServerResultRows<MatrixRisk>(openRiskMatrixRead);
  const highestRisks = useServerRows<HighestRisk>(highestOpenRisksRead, {
    pageIndex: 0,
    pageSize: TOP,
  });
  // Each tile's count and note: the server counts its register's question, rows unread.
  const [openRiskCount, unownedRiskCount] = useServerCountQueries(riskCounts, [
    openRisksQuestion,
    unownedOf(openRisksQuestion),
  ]) as [CountQuery, CountQuery];
  const [openIssueCount, severeIssueCount] = useServerCountQueries(issueCounts, [
    openIssuesQuestion,
    severeOf(openIssuesQuestion),
  ]) as [CountQuery, CountQuery];
  const [unsatisfiedCount] = useServerCountQueries(findingCounts, [unsatisfiedQuestion]) as [
    CountQuery,
  ];
  // The programs that last saw activity: the widget's rows, ordered on the server.
  const recentPrograms = useServerRows<ProgramRow>(recentProgramsRead, {
    pageIndex: 0,
    pageSize: TOP,
  });
  const parties = useRows("parties", undefined, { columns: ["id", "name"] as const });
  // The feed reads the workspace's latest events, a page of them with the columns an entry draws,
  // then names the requirements those events edited: never every event, revision or requirement.
  const activity = useServerRows<ActivityEvent>(recentActivityRead, {
    pageIndex: 0,
    pageSize: RECENT_ACTIVITY_EVENTS,
  });
  const events = activity.data?.rows;
  const revisionIds = useMemo(
    () => [...new Set((events ?? []).flatMap((e) => e.requirement_revision_id ?? []))],
    [events],
  );
  const requirementRevisions = useRows(
    "requirement_revisions",
    { id: revisionIds },
    { columns: ["id", "engineering_requirement_id"] as const, enabled: events !== undefined },
  );
  const requirementIds = useMemo(
    () => [
      ...new Set((requirementRevisions.data ?? []).map((row) => row.engineering_requirement_id)),
    ],
    [requirementRevisions.data],
  );
  const requirements = useRows(
    "engineering_requirements",
    { id: requirementIds },
    {
      columns: ["id", "code", "program_id"] as const,
      enabled: requirementRevisions.data !== undefined,
    },
  );
  const canCreate = workspace.role !== "viewer";

  // One lookup per related table: the widgets and the feed read their names from it.
  const programName = useMemo(
    () => new Map((programs.data ?? []).map((row) => [row.id, row.name])),
    [programs.data],
  );
  const partyName = useMemo(
    () => new Map((parties.data ?? []).map((row) => [row.id, row.name])),
    [parties.data],
  );

  /** A note that counts the tile's high and critical records, once its count has loaded. */
  const severeNote = (count: CountQuery) =>
    count.data === undefined ? undefined : `${formatNumber(count.data)} high or critical`;
  /** A note that counts the tile's records nobody owns, once its count has loaded. */
  const unownedNote = (count: CountQuery) =>
    count.data === undefined
      ? undefined
      : count.data === 0
        ? "All have an owner"
        : `${formatNumber(count.data)} without an owner`;
  const metrics: {
    label: string;
    query: QueryStatus[];
    value: number | undefined;
    note: string | undefined;
    zero: string;
    link: StatTileProps["link"];
  }[] = [
    {
      label: "Programs",
      query: [programs],
      value: programs.data?.length,
      note:
        programs.data &&
        `${formatNumber(programs.data.filter((row) => row.status === "active").length)} active`,
      zero: "No programs recorded yet",
      // Every program, whatever the register was last asked.
      link: <Link to="/programs" search={questionSearch(registerViews.programs, everyRecord)} />,
    },
    {
      label: "Open risks",
      query: [openRiskCount, unownedRiskCount],
      value: openRiskCount.data,
      // Their severity is the matrix's and Highest open risks' below: the part to look at first
      // here is the risks nobody is answerable for.
      note: unownedNote(unownedRiskCount),
      zero: "No open risks",
      link: <Link to="/risks" search={questionSearch(registerViews.risks, openRisksQuestion)} />,
    },
    {
      label: "Open operational issues",
      query: [openIssueCount, severeIssueCount],
      value: openIssueCount.data,
      note: severeNote(severeIssueCount),
      zero: "No open operational issues",
      link: (
        <Link
          to="/findings"
          search={questionSearch(registerViews.operationalIssues, openIssuesQuestion)}
        />
      ),
    },
    {
      label: "Unsatisfied assessment findings",
      query: [unsatisfiedCount],
      value: unsatisfiedCount.data,
      note: "Partially or other than satisfied",
      zero: "No findings short of satisfied",
      link: (
        <Link
          to="/findings"
          search={{
            tab: "findings",
            ...questionSearch(registerViews.assessmentFindings, unsatisfiedQuestion),
          }}
        />
      ),
    },
  ];
  const metricQueries = [
    programs,
    openRiskCount,
    unownedRiskCount,
    openIssueCount,
    severeIssueCount,
    unsatisfiedCount,
  ];

  // The matrix: each open risk at its latest assessment's likelihood and impact.
  const matrix = useMemo(() => {
    const counts = new Map<string, number>();
    let unassessed = 0;
    for (const risk of matrixRisks.data ?? []) {
      if (!risk.likelihood || !risk.impact) {
        unassessed += 1;
        continue;
      }
      const key = `${risk.likelihood}|${risk.impact}`;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return { counts, unassessed };
  }, [matrixRisks.data]);

  // The five the server ordered, highest severity first, as the widget's rows.
  const riskRows = useMemo<RiskRow[]>(
    () =>
      (highestRisks.data?.rows ?? []).map((row) => ({
        id: row.id,
        title: row.title,
        status: row.status,
        severity: row.severity,
        program: row.program_name,
        owner: row.owner_name,
      })),
    [highestRisks.data],
  );
  const riskColumns = useMemo(
    () =>
      defineColumns<RiskRow>((c) => [
        c.text("title", {
          header: "Risk",
          minWidth: 180,
          priority: 0,
          sortable: false,
          hideable: false,
          cell: (row) => (
            <RecordLink table="risks" record={row}>
              {row.title}
            </RecordLink>
          ),
        }),
        c.status("severity", {
          header: "Latest severity",
          width: 140,
          priority: 1,
          sortable: false,
          statuses: severityLevels,
          cell: (row) => <LevelIndicator levels={severityLevels} value={row.severity} />,
        }),
        c.status("status", {
          header: "Status",
          width: 130,
          priority: 2,
          sortable: false,
          statuses: riskStatuses,
        }),
        c.text("program", { header: "Program", minWidth: 140, priority: 3, sortable: false }),
        // A person, with their avatar, at the kind's width.
        c.person("owner", { header: "Owner", priority: 4, sortable: false }),
      ]),
    [],
  );
  const riskTable = useDataTable({
    columns: riskColumns,
    data: riskRows,
    getRowId: (row) => row.id,
    label: "Highest open risks",
    pageSize: TOP,
    // A widget has no column menu: hiding, pinning and sorting belong to the register.
    pinnable: false,
    hideable: false,
  });

  const programRows = useMemo<ProgramRow[]>(
    () => recentPrograms.data?.rows ?? [],
    [recentPrograms.data],
  );
  const programColumns = useMemo(
    () =>
      defineColumns<ProgramRow>((c) => [
        c.text("name", {
          header: "Program",
          minWidth: 180,
          priority: 0,
          sortable: false,
          hideable: false,
          cell: (row) => (
            <RecordLink table="programs" record={row}>
              {row.name}
            </RecordLink>
          ),
        }),
        c.status("status", {
          header: "Status",
          width: 130,
          priority: 1,
          sortable: false,
          statuses: programStatuses,
        }),
        // Satisfied, as a share of the control baseline, beside a tally of its six statuses.
        c.custom("control_status", {
          header: "Controls satisfied",
          width: 200,
          priority: 2,
          cell: (row) => <ProgramControlStatusCell program={row} />,
        }),
        c.text("code", {
          header: "Code",
          width: 120,
          priority: 3,
          sortable: false,
          cell: (row) => <Id>{row.code}</Id>,
        }),
        // When anything in the program last changed: the order the widget lists them in.
        c.date("last_activity_at", { header: "Updated", priority: 4, sortable: false }),
      ]),
    [],
  );
  // The rows' control status counts, read once for all of them: each row's cell draws from them.
  const programStandings = useProgramsControlStatusCounts(
    useMemo(() => programRows.map((row) => row.id), [programRows]),
  );
  // The rows' trends, read once for all of them: each row's sparkline draws from them.
  const programTrends = useRecentPostureTrend(
    useMemo(() => programRows.map((row) => row.id), [programRows]),
  );
  const programTable = useDataTable({
    columns: programColumns,
    data: programRows,
    getRowId: (row) => row.id,
    label: "Recently updated programs",
    pageSize: TOP,
    // A widget has no column menu: hiding, pinning and sorting belong to the register.
    pinnable: false,
    hideable: false,
  });

  // Consecutive edits of one requirement by one person read as one entry; every other event is
  // its own, the recorded sentence after the person who did it.
  const feed = useMemo(() => {
    const requirementOf = new Map(
      (requirementRevisions.data ?? []).map((row) => [row.id, row.engineering_requirement_id]),
    );
    const requirementById = new Map((requirements.data ?? []).map((row) => [row.id, row]));
    return activityEntries(
      events ?? [],
      (revisionId) => {
        const record = requirementById.get(requirementOf.get(revisionId) ?? "");
        return record
          ? { id: record.id, code: record.code, programId: record.program_id }
          : undefined;
      },
      FEED,
    );
  }, [events, requirementRevisions.data, requirements.data]);

  /** An entry as the feed reads it: who did what, to which record, and when. */
  const feedItem = (entry: ActivityEntry) => {
    const [latest] = entry.events as [ActivityEvent];
    const actor = entry.actor ? partyName.get(entry.actor) : undefined;
    const program = latest.program_id ? programName.get(latest.program_id) : undefined;
    if (entry.requirement && latest.event_type === "created")
      return {
        title: `${actor ?? "Someone"} created ${entry.requirement.code}`,
        meta: program,
        link: recordLink("engineering_requirements", {
          id: entry.requirement.id,
          program_id: entry.requirement.programId,
        }),
      };
    if (entry.requirement) {
      const fields = [...new Set(entry.events.flatMap(changedFields))];
      const edits = formatPlural(entry.events.length, {
        one: "{count} edit",
        other: "{count} edits",
      });
      return {
        title: `${actor ?? "Someone"} edited ${entry.requirement.code}`,
        description: fields.length
          ? `Changed the ${formatList(fields)} in ${edits}.`
          : entry.events.length > 1
            ? `Saved ${edits} as draft revisions.`
            : "Saved a draft revision.",
        meta: program,
        link: recordLink("engineering_requirements", {
          id: entry.requirement.id,
          program_id: entry.requirement.programId,
        }),
      };
    }
    // What the person did, and what was said (activity-entries).
    const { deed, said } = eventWords(latest);
    const record = eventRecord(latest);
    return {
      title: actor ? `${actor} ${deed}` : capitalize(deed),
      description: said,
      meta: program,
      // The record it names, where that record has a page.
      link: record
        ? recordLink(record.table, { id: record.id, program_id: latest.program_id })
        : undefined,
    };
  };

  return (
    <Page>
      <PageHeader>
        <PageHeader.Heading>
          <PageHeader.Title>Portfolio</PageHeader.Title>
        </PageHeader.Heading>
      </PageHeader>
      <Stack space="space.300">
        <Stack space="space.150">
          {metricQueries.some(hasFailed) && (
            <QueryState
              queries={metricQueries.filter(hasFailed)}
              retryLabel="Retry loading totals"
            />
          )}
          <Stat.Grid
            cols={4}
            frame="band"
            role="group"
            aria-label="Portfolio totals"
            aria-busy={metrics.some((metric) => metric.query.some(isLoading))}
          >
            {metrics.map((metric) => {
              const failed = metric.query.some(hasFailed);
              const loading = !failed && metric.value === undefined;
              return (
                <Stat.Tile
                  key={metric.label}
                  label={metric.label}
                  value={failed ? <Absent label="Not available" /> : (metric.value ?? null)}
                  isLoading={loading}
                  note={
                    failed
                      ? "Could not load"
                      : loading
                        ? undefined
                        : metric.value === 0
                          ? metric.zero
                          : metric.note
                  }
                  link={metric.link}
                />
              );
            })}
          </Stat.Grid>
        </Stack>
        {/* The columns follow the page's own width, not the window's: the widgets take two thirds
          and the activity one when Main has room (the 4xl container, 56rem), and the activity
          drops under the widgets when a panel or a phone narrows it. */}
        <Box className="@container">
          <Grid gap="space.400" alignItems="start" className="grid-cols-1 @4xl:grid-cols-3">
            <Stack space="space.400" className="min-w-0 @4xl:col-span-2">
              <RiskMatrix
                counts={matrix.counts}
                unassessed={matrix.unassessed}
                queries={[matrixRisks]}
              />
              <Widget
                title="Highest open risks"
                viewAll={
                  <TextLink
                    render={
                      <Link to="/risks" search={questionSearch(registerViews.risks, everyRecord)} />
                    }
                  >
                    View all risks
                  </TextLink>
                }
                table={riskTable}
                queries={[highestRisks]}
                retryLabel="Retry loading risks"
                empty={{
                  title: "No open risks",
                  description: "Open risks appear here, highest severity first.",
                  size: "compact",
                  icon: <ShieldAlert />,
                }}
                onRowClick={(row) => openRecord("risks", row)}
              />
              <ProgramStandings.Provider value={programStandings}>
                <ControlStatusTrends trend={programTrends}>
                  <Widget
                    title="Recently updated programs"
                    viewAll={
                      <TextLink
                        render={
                          <Link
                            to="/programs"
                            search={questionSearch(registerViews.programs, everyRecord)}
                          />
                        }
                      >
                        View all programs
                      </TextLink>
                    }
                    table={programTable}
                    queries={[recentPrograms]}
                    values={[programStandings, programTrends]}
                    retryLabel="Retry loading programs"
                    empty={{
                      title: "No programs yet",
                      description: canCreate
                        ? "Create a program to start building its assurance record."
                        : "Programs appear here once someone in the workspace creates one.",
                      size: "compact",
                      icon: <FolderKanban />,
                      action: canCreate ? (
                        <LinkButton
                          size="small"
                          variant="primary"
                          iconBefore={<Plus />}
                          render={<Link to="/programs/new" />}
                        >
                          Create program
                        </LinkButton>
                      ) : undefined,
                    }}
                    onRowClick={(row) => openRecord("programs", row)}
                  />
                </ControlStatusTrends>
              </ProgramStandings.Provider>
            </Stack>
            <Section title="Recent activity" className="min-w-0">
              <QueryState
                queries={[activity, parties, programs, requirementRevisions, requirements]}
                retryLabel="Retry loading activity"
              >
                {feed.length ? (
                  <Timeline label="Recent activity" size="small" wrap>
                    {feed.map((entry) => {
                      const item = feedItem(entry);
                      const newest = entry.events[0]!;
                      return (
                        <Timeline.Item
                          key={newest.id}
                          title={item.title}
                          {...(item.description ? { description: item.description } : {})}
                          {...(item.meta ? { meta: item.meta } : {})}
                          {...(item.link ? { link: item.link } : {})}
                          dateTime={newest.occurred_at}
                        />
                      );
                    })}
                  </Timeline>
                ) : (
                  <EmptyMessage
                    compact
                    title="No activity yet"
                    description="Changes to tasks, requirements and risks appear here as they are recorded."
                  />
                )}
              </QueryState>
            </Section>
          </Grid>
        </Box>
      </Stack>
    </Page>
  );
}
