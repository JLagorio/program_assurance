import { useCallback, useMemo, type ReactElement, type ReactNode } from "react";
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
import { openIssue } from "@/lib/assurance-trace";
import { controlStatusShare, useProgramControlStatus } from "@/lib/control-status";
import { NO_OWNER, unownedQuestions, useProgramUnowned } from "@/lib/owner-assign";
import { programTasksView, registerViews } from "@/lib/register-views";
import {
  operationalIssueStatuses,
  riskStatuses,
  severityLevels,
  taskStatuses,
  type StatusTone,
  type StatusVocabulary,
} from "@/lib/status";
import { questionSearch } from "./collection-question";
import { ControlStatusKey, ControlStatusMap } from "./control-status";
import { controlStatusLink } from "./control-status-link";
import { useOpenRecord } from "./record-preview";
import { QueryState, ReportFailures, type QueryStatus } from "./work-common";

/** The program tabs that hold open work. */
type WorkTab = "Schedule" | "Findings" | "POA&M & risk";

type Line = { key: string; label: string; value: number; tone: StatusTone };

/** One line a value of the vocabulary, in the order given, counting the rows that hold it. */
function lines<Row>(
  rows: readonly Row[],
  read: (row: Row) => string | null,
  vocabulary: StatusVocabulary,
  values: readonly string[],
): Line[] {
  return values.map((value) => ({
    key: value,
    label: vocabulary[value]?.label ?? value,
    value: rows.filter((row) => read(row) === value).length,
    // A line is toned only where the value itself is a problem; the rest stay in the text colour.
    tone: vocabulary[value]?.tone === "danger" ? "danger" : "neutral",
  }));
}

type Work<Row> = QueryStatus & { data?: readonly Row[] | undefined };

/** The open operational issue statuses, which a severity's line asks for beside its severity. */
const openIssueStatuses = Object.keys(operationalIssueStatuses).filter(openIssue);

/**
 * The program's open work as three counted groups: each a Tray whose heading is the count and
 * opens the tab that holds it, over the parts a reader acts on first, one line each. Tasks and
 * risks break down by status, operational issues by severity, worst first. A line that counts
 * something opens its tab's register asked for exactly those records; a zero opens nothing.
 */
export function ProgramOpenWork({
  programId,
  tasks,
  issues,
  risks,
  tabLink,
}: {
  programId: string;
  tasks: Work<{ status: string }>;
  issues: Work<{ status: string; severity: string | null }>;
  risks: Work<{ status: string }>;
  /** A link to one of the program's tabs, asking its register a question when one is given. */
  tabLink: (
    tab: WorkTab,
    question?: Record<string, unknown>,
    section?: string,
  ) => ReactElement<{ className?: string | undefined; children?: ReactNode }>;
}) {
  const openTasks = tasks.data?.filter((task) => !["done", "cancelled"].includes(task.status));
  const openIssues = issues.data?.filter(
    (issue) => !["closed", "resolved", "cancelled"].includes(issue.status),
  );
  const openRisks = risks.data?.filter((risk) => risk.status !== "closed");
  // How many of the open issues and risks nobody owns, counted on the server.
  const unowned = useProgramUnowned(programId);
  const queues: {
    title: string;
    tab: WorkTab;
    query: QueryStatus;
    open: number | undefined;
    lines: Line[];
    /** The question a line asks of the tab's register: its view and the filters for its value. */
    ask: (value: string) => Record<string, unknown>;
    /** The id of the Section that holds the register, where the tab draws others above it. */
    section?: string;
    /**
     * The open records nobody owns, the last line, where the records carry an owner: its count
     * and the question that asks the tab's register for exactly those records.
     */
    unowned?: { count: QueryStatus & { data?: number | undefined }; ask: Record<string, unknown> };
  }[] = [
    {
      title: "open tasks",
      tab: "Schedule",
      query: tasks,
      ask: (value) =>
        questionSearch(programTasksView(programId), {
          filters: [{ id: "status", value: [value] }],
        }),
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
      ask: (value) =>
        questionSearch(registerViews.programOperationalIssues, {
          filters: [
            { id: "severity", value: [value] },
            { id: "status", value: openIssueStatuses },
          ],
        }),
      open: openIssues?.length,
      lines: lines(openIssues ?? [], (issue) => issue.severity, severityLevels, [
        "critical",
        "high",
        "moderate",
        "low",
      ]),
      unowned: {
        count: unowned.issues,
        ask: questionSearch(
          registerViews.programOperationalIssues,
          unownedQuestions.operational_issues,
        ),
      },
    },
    {
      title: "open risks",
      tab: "POA&M & risk",
      query: risks,
      ask: (value) =>
        questionSearch(registerViews.programRisks, { filters: [{ id: "status", value: [value] }] }),
      // Risks follow the POA&M plans and remediation items on their tab.
      section: registerViews.programRisks,
      open: openRisks?.length,
      lines: lines(openRisks ?? [], (risk) => risk.status, riskStatuses, [
        "open",
        "investigating",
        "responding",
        "accepted",
      ]),
      unowned: {
        count: unowned.risks,
        ask: questionSearch(registerViews.programRisks, unownedQuestions.risks),
      },
    },
  ];
  return (
    <Grid templateColumns="repeat(auto-fit, minmax(min(100%, 208px), 1fr))" gap="space.200">
      {/* A No owner count that could not be read is said by the page's one alert. */}
      <ReportFailures queries={[unowned.issues, unowned.risks]} />
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
                    key={line.key}
                    label={line.label}
                    value={line.value}
                    tone={line.tone}
                    isLoading={loading}
                    {...(line.value > 0 && !loading
                      ? { link: tabLink(queue.tab, queue.ask(line.key), queue.section) }
                      : {})}
                  />
                ))}
                {/* The open records nobody owns: a count opens exactly those, and a zero nothing.
                    A count that could not be read draws no line, never a zero: the page's alert
                    says it, with Retry. */}
                {queue.unowned &&
                !(queue.unowned.count.isError && queue.unowned.count.data === undefined) ? (
                  <Stat.Row
                    label={NO_OWNER}
                    value={queue.unowned.count.data ?? 0}
                    isLoading={loading || queue.unowned.count.data === undefined}
                    {...(!loading && (queue.unowned.count.data ?? 0) > 0
                      ? { link: tabLink(queue.tab, queue.unowned.ask, queue.section) }
                      : {})}
                  />
                ) : null}
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
 * the controls and opens the Control status view, over the whole baseline as one strip of marks,
 * each coloured by its status, under a key that counts each. A count of the key opens the view's
 * List at that status, and a mark opens its control, so no number here is a dead end. A program
 * with no baseline draws nothing here: the Control baseline section under it says so.
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
  const openRecord = useOpenRecord();
  const statusLink = useMemo(() => controlStatusLink(programId), [programId]);
  const openControl = useCallback(
    (controlId: string) => openRecord("controls", { id: controlId, program_id: programId }),
    [openRecord, programId],
  );
  if (status.data && !status.data.baseline) return null;
  const view = <Link to="/programs/$programId/control-status" params={{ programId }} />;
  return (
    <QueryState queries={[status]}>
      <Tray
        title="controls in the baseline"
        link={view}
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
                <ControlStatusKey counts={status.data.counts} link={statusLink} />
                <ControlStatusMap
                  status={status.data}
                  layout="strip"
                  label={`Controls in the control baseline of ${programName}, each coloured by where the program stands on it`}
                  onSelect={openControl}
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
