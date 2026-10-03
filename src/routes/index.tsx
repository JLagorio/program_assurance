import { EmptyMessage, QueryState, type QueryStatus } from "@/components/prototype/work-common";
import { RecordLink, recordDestination } from "@/components/prototype/record-preview";
import { questionSearch } from "@/components/prototype/collection-question";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, type ReactNode } from "react";
import {
  Absent,
  Box,
  Chart,
  DataTable,
  Grid,
  Id,
  LinkButton,
  PageHeader,
  Section,
  Stack,
  Stat,
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
import { useRows, type Row, type TableName } from "@/lib/models";
import {
  determinations,
  operationalIssueStatuses,
  programStatuses,
  riskLevels,
  riskStatuses,
  severityLevels,
  statusEntry,
} from "@/lib/status";
import { useWorkspace } from "@/components/app/workspace";
import { Page } from "@/components/app/shell";
import { LevelIndicator } from "@/components/app/status";
import { labelFor } from "@/lib/records";
import { registerViews } from "@/lib/register-views";

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

/** A severity's place in the order, highest first; an unassessed risk sorts last. */
const severityRank = (value: string | null | undefined) =>
  statusEntry(severityLevels, value)?.rank ?? -1;
const isSevere = (value: string | null | undefined) => value === "high" || value === "critical";

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
/**
 * Every record, as the register opens unasked: a View all link opens this rather than the question
 * the register last asked in this tab, which may be a tile's or a cell's.
 */
const everyRecord: TableQuery = { filters: [] };

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
  retryLabel,
  empty,
  onRowClick,
}: {
  title: string;
  viewAll: ReactNode;
  table: DataTableInstance<T>;
  queries: QueryStatus[];
  retryLabel: string;
  empty: DataTableEmpty;
  onRowClick: (row: T) => void;
}) {
  const failed = queries.filter((query) => query.isError);
  const missing = failed.some((query) => query.data === undefined);
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

type RiskRow = {
  id: string;
  title: string;
  status: string;
  severity: string | null;
  program: string | null;
  owner: string | null;
  program_id: string;
  updated_at: string;
};
type ProgramRow = Pick<Row<"programs">, "id" | "code" | "name" | "status" | "updated_at">;

/** An activity entry: one event, or consecutive edits of one requirement by one person. */
type FeedEntry = {
  events: Row<"activity_events">[];
  actor: string | null;
  requirement: { id: string; code: string; programId: string } | null;
};

/** The record an activity event names, when it has a page of its own. */
function eventRecord(event: Row<"activity_events">): { table: TableName; id: string } | null {
  const targets: [TableName, string | null][] = [
    ["tasks", event.task_id],
    ["risks", event.risk_id],
    ["operational_issues", event.issue_id],
    ["poam_items", event.poam_item_id],
    ["assessment_campaigns", event.assessment_campaign_id],
    ["authorization_packages", event.package_id],
    ["evidence_artifacts", event.evidence_artifact_id],
  ];
  const found = targets.find(([, id]) => !!id);
  return found ? { table: found[0], id: found[1]! } : null;
}

/** A requirement edit's changed fields, in the reader's words. */
const changeLabels: Record<string, string> = {
  title: "title",
  statement: "statement",
  acceptanceCriteria: "acceptance criteria",
  rationale: "rationale",
  requirementType: "requirement type",
  ownerPartyId: "owner",
};
function changedFields(event: Row<"activity_events">) {
  const changes = event.changes;
  if (!changes || typeof changes !== "object" || Array.isArray(changes)) return [];
  return Object.entries(changes)
    .filter(([, value]) => {
      if (!value || typeof value !== "object" || Array.isArray(value)) return false;
      const change = value as Record<string, unknown>;
      return change["before"] !== change["after"];
    })
    .map(([field]) => changeLabels[field] ?? labelFor(field).toLowerCase());
}

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

function Portfolio() {
  const workspace = useWorkspace();
  const navigate = useNavigate();
  const { locale, formatNumber, formatPlural } = useLedgerLocale();
  const formatList = (items: string[]) =>
    new Intl.ListFormat(locale, { style: "long", type: "conjunction" }).format(items);
  const programs = useRows("programs", undefined, {
    columns: ["id", "code", "name", "status", "updated_at"] as const,
  });
  const risks = useRows("risks", undefined, {
    columns: ["id", "title", "status", "program_id", "owner_party_id", "updated_at"] as const,
  });
  const riskVersions = useRows("risk_revisions", undefined, {
    columns: ["id", "risk_id", "version_number", "severity", "likelihood", "impact"] as const,
  });
  const issues = useRows("operational_issues", undefined, {
    columns: ["id", "status", "severity"] as const,
  });
  const findings = useRows("assessment_findings", undefined, {
    columns: ["id", "determination"] as const,
  });
  const parties = useRows("parties", undefined, { columns: ["id", "name"] as const });
  const activity = useRows("activity_events", undefined, {
    order: { column: "occurred_at", ascending: false },
  });
  const requirementRevisions = useRows("requirement_revisions", undefined, {
    columns: ["id", "engineering_requirement_id"] as const,
  });
  const requirements = useRows("engineering_requirements", undefined, {
    columns: ["id", "code", "program_id"] as const,
  });
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
  // Each risk's latest assessment: the severity the widget orders by, the likelihood and impact
  // the matrix places it at.
  const latestAssessment = useMemo(() => {
    const latest = new Map<
      string,
      {
        version: number;
        severity: string | null;
        likelihood: string | null;
        impact: string | null;
      }
    >();
    for (const version of riskVersions.data ?? []) {
      const current = latest.get(version.risk_id);
      if (!current || current.version < version.version_number)
        latest.set(version.risk_id, {
          version: version.version_number,
          severity: version.severity,
          likelihood: version.likelihood,
          impact: version.impact,
        });
    }
    return latest;
  }, [riskVersions.data]);

  const openRisks = risks.data?.filter((row) => openRisk(row.status));
  const openIssues = issues.data?.filter((row) => openIssue(row.status));
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
      query: [risks, riskVersions],
      value: riskVersions.data ? openRisks?.length : undefined,
      note:
        openRisks &&
        `${formatNumber(openRisks.filter((row) => isSevere(latestAssessment.get(row.id)?.severity)).length)} high or critical`,
      zero: "No open risks",
      link: <Link to="/risks" search={questionSearch(registerViews.risks, openRisksQuestion)} />,
    },
    {
      label: "Open operational issues",
      query: [issues],
      value: openIssues?.length,
      note:
        openIssues &&
        `${formatNumber(openIssues.filter((row) => isSevere(row.severity)).length)} high or critical`,
      zero: "No open operational issues",
      link: (
        <Link
          to="/findings"
          search={questionSearch(registerViews.operationalIssues, {
            filters: [{ id: "status", value: openIssueStatuses }],
          })}
        />
      ),
    },
    {
      label: "Unsatisfied assessment findings",
      query: [findings],
      value: findings.data?.filter((row) => unsatisfied(row.determination)).length,
      note: "Partially or other than satisfied",
      zero: "No findings short of satisfied",
      link: (
        <Link
          to="/findings"
          search={{
            tab: "findings",
            ...questionSearch(registerViews.assessmentFindings, {
              filters: [{ id: "determination", value: unsatisfiedDeterminations }],
            }),
          }}
        />
      ),
    },
  ];
  const metricQueries = [programs, risks, riskVersions, issues, findings];

  // The matrix: each open risk at its latest assessment's likelihood and impact.
  const matrix = useMemo(() => {
    const counts = new Map<string, number>();
    let unassessed = 0;
    for (const risk of risks.data ?? []) {
      if (!openRisk(risk.status)) continue;
      const latest = latestAssessment.get(risk.id);
      if (!latest?.likelihood || !latest.impact) {
        unassessed += 1;
        continue;
      }
      const key = `${latest.likelihood}|${latest.impact}`;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return { counts, unassessed };
  }, [risks.data, latestAssessment]);

  const riskRows = useMemo<RiskRow[]>(
    () =>
      (risks.data ?? [])
        .filter((row) => openRisk(row.status))
        .map((row) => ({
          id: row.id,
          title: row.title,
          status: row.status,
          severity: latestAssessment.get(row.id)?.severity ?? null,
          program: programName.get(row.program_id) ?? null,
          owner: row.owner_party_id ? (partyName.get(row.owner_party_id) ?? null) : null,
          program_id: row.program_id,
          updated_at: row.updated_at,
        }))
        .sort(
          (a, b) =>
            severityRank(b.severity) - severityRank(a.severity) ||
            b.updated_at.localeCompare(a.updated_at),
        )
        .slice(0, TOP),
    [risks.data, latestAssessment, programName, partyName],
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
    () =>
      (programs.data ?? [])
        .slice()
        .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
        .slice(0, TOP),
    [programs.data],
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
        c.text("code", {
          header: "Code",
          width: 120,
          priority: 2,
          sortable: false,
          cell: (row) => <Id>{row.code}</Id>,
        }),
        c.date("updated_at", { header: "Updated", priority: 3, sortable: false }),
      ]),
    [],
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
    const entries: FeedEntry[] = [];
    const events = (activity.data ?? [])
      .slice()
      .sort((a, b) => b.occurred_at.localeCompare(a.occurred_at));
    for (const event of events) {
      const requirementId = event.requirement_revision_id
        ? requirementOf.get(event.requirement_revision_id)
        : undefined;
      const record = requirementId ? requirementById.get(requirementId) : undefined;
      const requirement = record
        ? { id: record.id, code: record.code, programId: record.program_id }
        : null;
      const previous = entries.at(-1);
      if (
        requirement &&
        previous?.requirement?.id === requirement.id &&
        previous.actor === event.actor_party_id
      )
        previous.events.push(event);
      else if (entries.length < FEED)
        entries.push({ events: [event], actor: event.actor_party_id, requirement });
      else break;
    }
    return entries;
  }, [activity.data, requirementRevisions.data, requirements.data]);

  /** An entry as the feed reads it: who did what, to which record, and when. */
  const feedItem = (entry: FeedEntry) => {
    const [latest] = entry.events as [Row<"activity_events">];
    const actor = entry.actor ? partyName.get(entry.actor) : undefined;
    const program = latest.program_id ? programName.get(latest.program_id) : undefined;
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
        link: (
          <Link
            {...recordDestination("engineering_requirements", {
              id: entry.requirement.id,
              program_id: entry.requirement.programId,
            })}
          />
        ),
      };
    }
    // A recorded verb phrase ("assigned …") reads after the person who did it; any other text is
    // what was said, under the kind of event, so the title still says who did what.
    const [first = "", ...rest] = (latest.description ?? "").split("\n");
    const phrase = /^[a-z]/.test(first.trim());
    const deed = phrase ? first.trim() : labelFor(latest.event_type).toLowerCase();
    const said = (phrase ? rest : [first, ...rest]).join(" ").trim();
    const record = eventRecord(latest);
    return {
      title: actor ? `${actor} ${deed}` : capitalize(deed),
      description: said || undefined,
      meta: program,
      link: record ? (
        <Link
          {...recordDestination(record.table, { id: record.id, program_id: latest.program_id })}
        />
      ) : undefined,
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
                queries={[risks, riskVersions]}
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
                queries={[risks, riskVersions, programs, parties]}
                retryLabel="Retry loading risks"
                empty={{
                  title: "No open risks",
                  description: "Open risks appear here, highest severity first.",
                  size: "compact",
                  icon: <ShieldAlert />,
                }}
                onRowClick={(row) => void navigate(recordDestination("risks", row))}
              />
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
                queries={[programs]}
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
                onRowClick={(row) => void navigate(recordDestination("programs", row))}
              />
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
