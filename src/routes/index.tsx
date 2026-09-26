import { EmptyMessage, type QueryStatus } from "@/components/prototype/work-common";
import { recordDestination } from "@/components/prototype/record-preview";
import { createFileRoute, Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import {
  Absent,
  Box,
  Grid,
  LinkButton,
  PageHeader,
  Section,
  Skeleton,
  Stack,
  Stat,
  Text,
  TextLink,
  Timeline,
  useLedgerLocale,
} from "@ledger/design-system";
import { Plus } from "lucide-react";
import { useRows, type Row, type TableName } from "@/lib/models";
import { severityLevels } from "@/lib/status";
import { useWorkspace } from "@/components/app/workspace";
import { LevelIndicator } from "@/components/app/status";
import { labelFor, type DataRecord } from "@/lib/records";
import { ModelTable, QueryState } from "@/components/prototype/record-tools";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "Portfolio — Program Assurance" }] }),
  component: Portfolio,
});

/**
 * A tile's number: the count in the reader's locale ("1,196"), a skeleton while it loads, Absent
 * when it could not load.
 */
function tileValue(
  query: QueryStatus,
  value: number | undefined,
  formatNumber: (value: number) => string,
): ReactNode {
  if (value !== undefined) return formatNumber(value);
  if (query.isError) return <Absent label="Could not load" />;
  return <Skeleton shape="heading" width={40} />;
}

/** The record an activity event is about, when it names one with a page of its own. */
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

/**
 * A related record's name from the page's one lookup of that table. The register holds its rows
 * back while the lookup loads or fails, so here the name is known, missing or never recorded.
 */
function RelatedName({ id, name }: { id: unknown; name: (id: unknown) => string | undefined }) {
  if (id === null || id === undefined || id === "") return <Absent label="Not recorded" />;
  return <>{name(id) ?? <Text color="color.text.subtle">Not available</Text>}</>;
}

/** An event's sentence as a title: the recorded description, starting with a capital. */
function eventTitle(event: Row<"activity_events">) {
  const text = event.description?.trim() || labelFor(event.event_type);
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function Portfolio() {
  const workspace = useWorkspace();
  const { formatDate, formatNumber, formatPlural } = useLedgerLocale();
  const programs = useRows("programs"),
    risks = useRows("risks"),
    riskVersions = useRows("risk_revisions"),
    findings = useRows("assessment_findings"),
    evidence = useRows("evidence_artifacts"),
    activity = useRows("activity_events"),
    parties = useRows("parties"),
    baselines = useRows("scope_baselines");
  const metrics = [
    {
      label: "Programs",
      query: programs,
      value: programs.data?.length,
      note: "Recorded programs",
      zero: "No programs recorded yet",
    },
    {
      label: "Open risks",
      query: risks,
      value: risks.data?.filter((row) => row.status !== "closed").length,
      note: "Includes accepted risks",
      zero: "No open risks",
    },
    {
      label: "Unsatisfied findings",
      query: findings,
      value: findings.data?.filter((row) =>
        ["partially_satisfied", "other_than_satisfied"].includes(row.determination),
      ).length,
      note: "Recorded assessment determinations",
      zero: "No findings short of satisfied",
    },
    {
      label: "Evidence artifacts",
      query: evidence,
      value: evidence.data?.length,
      note: "Registered evidence identities",
      zero: "No evidence registered yet",
    },
  ];
  const recentRisks = risks.data
    ?.slice()
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
    .slice(0, 5);
  const latest = (id: string) =>
    riskVersions.data
      ?.filter((row) => row.risk_id === id)
      .sort((a, b) => b.version_number - a.version_number)[0];
  // One lookup per related table: the cells, the search, the sort and the chips read the names.
  const programName = (id: unknown) =>
    programs.data?.find((program) => program.id === id)?.name ?? undefined;
  const partyName = (id: unknown) =>
    parties.data?.find((party) => party.id === id)?.name ?? undefined;
  const recentActivity = activity.data
    ?.slice()
    .sort((a, b) => b.occurred_at.localeCompare(a.occurred_at))
    .slice(0, 10);
  const canCreate = workspace.role !== "viewer";
  return (
    <Stack className="animate-rise" space="space.300">
      <PageHeader>
        <PageHeader.Heading>
          <PageHeader.Title>Portfolio</PageHeader.Title>
        </PageHeader.Heading>
      </PageHeader>
      <Stat.Grid
        cols={4}
        frame="band"
        role="group"
        aria-label="Portfolio totals"
        aria-busy={metrics.some((metric) => metric.value === undefined && !metric.query.isError)}
      >
        {metrics.map((metric) => (
          <Stat.Tile
            key={metric.label}
            label={metric.label}
            value={tileValue(metric.query, metric.value, formatNumber)}
            note={
              metric.value === undefined && metric.query.isError
                ? "Could not load"
                : metric.value === 0
                  ? metric.zero
                  : metric.note
            }
          />
        ))}
      </Stat.Grid>
      {/* The columns follow the page's own width, not the window's: the registers take two thirds
          and the activity one when Main has room (the 4xl container, 56rem), and the activity
          drops under the registers when a panel or a phone narrows it. */}
      <Box className="@container">
        <Grid gap="space.400" alignItems="start" className="grid-cols-1 @4xl:grid-cols-3">
          <Stack space="space.300" className="min-w-0 @4xl:col-span-2">
            <Section
              title="Risk posture"
              action={<TextLink render={<Link to="/risks" />}>Risk register</TextLink>}
            >
              <ModelTable
                model="risks"
                rows={(recentRisks ?? []) as DataRecord[]}
                queries={[risks, riskVersions, programs, parties]}
                columns={[
                  // In a narrow column the severity and status stay beside the risk longest.
                  { key: "title", label: "Risk", width: 200 },
                  {
                    key: "program",
                    label: "Program",
                    priority: 3,
                    value: (row) => programName(row["program_id"]),
                    render: (row) => <RelatedName id={row["program_id"]} name={programName} />,
                  },
                  {
                    key: "owner",
                    label: "Owner",
                    priority: 4,
                    value: (row) => partyName(row["owner_party_id"]),
                    render: (row) => <RelatedName id={row["owner_party_id"]} name={partyName} />,
                  },
                  {
                    key: "severity",
                    label: "Latest severity",
                    priority: 2,
                    width: 140,
                    statuses: severityLevels,
                    value: (row) => latest(row.id)?.severity,
                    render: (row) => (
                      <LevelIndicator levels={severityLevels} value={latest(row.id)?.severity} />
                    ),
                  },
                  { key: "status", priority: 1, width: 120 },
                ]}
                searchLabel="Search recent risks"
                empty={{
                  title: "No risks recorded",
                  description: "Risk assessments appear here when they are saved.",
                }}
              />
            </Section>
            <Section
              title="Programs"
              action={<TextLink render={<Link to="/programs" />}>All programs</TextLink>}
            >
              <ModelTable
                model="programs"
                rows={(programs.data ?? []) as DataRecord[]}
                queries={[programs]}
                columns={[
                  { key: "name", label: "Program", width: 200 },
                  { key: "code", priority: 2 },
                  { key: "status", priority: 1, width: 120 },
                ]}
                searchLabel="Search programs"
                actions={
                  canCreate ? (
                    <LinkButton
                      size="small"
                      variant="primary"
                      iconBefore={<Plus />}
                      render={<Link to="/programs/new" />}
                    >
                      Create program
                    </LinkButton>
                  ) : undefined
                }
                empty={{
                  title: "No programs yet",
                  description: canCreate
                    ? "Create your first program to start building its assurance record."
                    : "Programs appear here once someone in the workspace creates one.",
                }}
              />
            </Section>
          </Stack>
          <Stack space="space.300" className="min-w-0">
            <Section title="Assurance activity">
              <QueryState queries={[activity, parties]} retryLabel="Retry loading activity">
                {recentActivity?.length ? (
                  <Timeline label="Assurance activity" size="small" wrap>
                    {recentActivity.map((event) => {
                      const record = eventRecord(event);
                      const actor = event.actor_party_id ? partyName(event.actor_party_id) : null;
                      const program = event.program_id ? programName(event.program_id) : null;
                      const meta = [actor, program].filter(Boolean).join(" · ");
                      const instant = new Date(event.occurred_at);
                      return (
                        <Timeline.Item
                          key={event.id}
                          title={eventTitle(event)}
                          {...(meta ? { meta } : {})}
                          {...(record
                            ? { link: <Link {...recordDestination(record.table, record)} /> }
                            : {})}
                          time={formatDate(instant, { dateStyle: "medium", timeStyle: "short" })}
                          timeTitle={formatDate(instant, { dateStyle: "full", timeStyle: "long" })}
                          dateTime={event.occurred_at}
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
            <Section title="Reference and baseline coverage">
              <Stack space="space.150">
                <QueryState queries={[baselines]} retryLabel="Retry loading baselines">
                  <Text>
                    {formatPlural(baselines.data?.length ?? 0, {
                      one: "{count} adopted scope baseline",
                      other: "{count} adopted scope baselines",
                    })}
                  </Text>
                </QueryState>
                <Text color="color.text.subtle">
                  Reference controls are available in the catalog. Assessment outcomes remain
                  unrecorded until your work produces them.
                </Text>
                <TextLink render={<Link to="/catalog" />}>Browse catalog</TextLink>
              </Stack>
            </Section>
          </Stack>
        </Grid>
      </Box>
    </Stack>
  );
}
