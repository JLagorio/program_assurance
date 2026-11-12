import type { ReactElement, ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import {
  Card,
  CardContent,
  Grid,
  Skeleton,
  Stack,
  Stat,
  Tray,
  useLedgerLocale,
} from "@ledger/design-system";
import { controlStatusShare, useProgramControlStatus } from "@/lib/control-status";
import {
  operationalIssueStatuses,
  riskStatuses,
  severityLevels,
  taskStatuses,
  type StatusTone,
  type StatusVocabulary,
} from "@/lib/status";
import { ControlStatusKey, ControlStatusMap } from "./control-status";
import { QueryState, type QueryStatus } from "./work-common";

/** The program tabs that hold open work. */
type WorkTab = "Schedule" | "Findings" | "POA&M & risk";

type Line = { label: string; value: number; tone: StatusTone };

/** One line a value of the vocabulary, in the order given, counting the rows that hold it. */
function lines<Row>(
  rows: readonly Row[],
  read: (row: Row) => string | null,
  vocabulary: StatusVocabulary,
  values: readonly string[],
): Line[] {
  return values.map((value) => ({
    label: vocabulary[value]?.label ?? value,
    value: rows.filter((row) => read(row) === value).length,
    // A line is toned only where the value itself is a problem; the rest stay in the text colour.
    tone: vocabulary[value]?.tone === "danger" ? "danger" : "neutral",
  }));
}

type Work<Row> = QueryStatus & { data?: readonly Row[] | undefined };

/**
 * The program's open work as three counted groups: each a Tray whose heading is the count and
 * opens the tab that holds it, over the parts a reader acts on first, one line each. Tasks and
 * risks break down by status, operational issues by severity, worst first.
 */
export function ProgramOpenWork({
  tasks,
  issues,
  risks,
  tabLink,
}: {
  tasks: Work<{ status: string }>;
  issues: Work<{ status: string; severity: string | null }>;
  risks: Work<{ status: string }>;
  /** A link to one of the program's tabs. */
  tabLink: (tab: WorkTab) => ReactElement<{ className?: string | undefined; children?: ReactNode }>;
}) {
  const openTasks = tasks.data?.filter((task) => !["done", "cancelled"].includes(task.status));
  const openIssues = issues.data?.filter(
    (issue) => !["closed", "resolved", "cancelled"].includes(issue.status),
  );
  const openRisks = risks.data?.filter((risk) => risk.status !== "closed");
  const queues: {
    title: string;
    tab: WorkTab;
    query: QueryStatus;
    open: number | undefined;
    lines: Line[];
  }[] = [
    {
      title: "open tasks",
      tab: "Schedule",
      query: tasks,
      open: openTasks?.length,
      lines: lines(openTasks ?? [], (task) => task.status, taskStatuses, [
        "blocked",
        "waiting",
        "in_progress",
        "open",
      ]),
    },
    {
      title: "open issues",
      tab: "Findings",
      query: issues,
      open: openIssues?.length,
      lines: lines(openIssues ?? [], (issue) => issue.severity, severityLevels, [
        "critical",
        "high",
        "moderate",
        "low",
      ]),
    },
    {
      title: "open risks",
      tab: "POA&M & risk",
      query: risks,
      open: openRisks?.length,
      lines: lines(openRisks ?? [], (risk) => risk.status, riskStatuses, [
        "open",
        "investigating",
        "responding",
        "accepted",
      ]),
    },
  ];
  return (
    <Grid templateColumns="repeat(auto-fit, minmax(min(100%, 208px), 1fr))" gap="space.200">
      {queues.map((queue) => {
        const failed = queue.open === undefined && queue.query.isError;
        const loading = queue.open === undefined && !failed;
        return (
          <Tray
            key={queue.title}
            // A queue's heading opens the tab that holds it.
            link={tabLink(queue.tab)}
            {...(failed
              ? { title: `Could not load ${queue.title}` }
              : { title: queue.title, value: queue.open ?? null, isLoading: loading })}
          >
            {failed ? null : (
              <Stat.List aria-label={`${queue.title}, in parts`}>
                {queue.lines.map((line) => (
                  <Stat.Row
                    key={line.label}
                    label={line.label}
                    value={line.value}
                    tone={line.tone}
                    isLoading={loading}
                  />
                ))}
              </Stat.List>
            )}
          </Tray>
        );
      })}
    </Grid>
  );
}

/**
 * Where the program stands on every control of its control baseline: a Tray whose heading counts
 * the controls and opens the Control baseline view, over the whole baseline as one strip of
 * marks, each coloured by its status, under a key that counts each. A program with no baseline
 * draws nothing here: the Control baseline section under it says so.
 */
export function ProgramControlStatusTray({
  programId,
  programName,
}: {
  programId: string;
  programName: string;
}) {
  const { formatNumber } = useLedgerLocale();
  const status = useProgramControlStatus(programId);
  if (status.data && !status.data.baseline) return null;
  const baseline = <Link to="/programs/$programId/control-baseline" params={{ programId }} />;
  return (
    <QueryState queries={[status]}>
      <Tray
        title="controls in the baseline"
        link={baseline}
        {...(status.data
          ? {
              value: status.data.total,
              action: `${formatNumber(controlStatusShare(status.data, "satisfied"))}% satisfied`,
            }
          : { isLoading: true })}
      >
        <Card size="small">
          <CardContent>
            {status.data ? (
              <Stack space="space.150">
                <ControlStatusKey counts={status.data.counts} />
                <ControlStatusMap
                  status={status.data}
                  layout="strip"
                  label={`Controls in the control baseline of ${programName}, each coloured by where the program stands on it`}
                />
              </Stack>
            ) : (
              <Skeleton shape="block" height={96} />
            )}
          </CardContent>
        </Card>
      </Tray>
    </QueryState>
  );
}
