/**
 * The test execution surface: the procedure that was written, the run that was
 * executed against a named build, the step records the operator actually took,
 * and the regression table that compares a retest against the run it re-executes.
 *
 * The load-bearing view here is the declared-versus-executed objective table.
 * `TestObjective.result` is an assertion somebody typed into the campaign
 * record; a run verdict is what the step records add up to. Where the two
 * disagree the table shows BOTH values side by side and says which one the
 * product is standing behind — collapsing them into one column would hide the
 * only thing this feature exists to surface.
 *
 * Presentation only. Every value arrives as a prop; nothing here derives a
 * verdict, resolves an objective, sorts a run log or reads a clock.
 */

import type { ReactNode } from "react";

import {
  Absent,
  Badge,
  Box,
  Button,
  Dot,
  Empty,
  Grid,
  Id,
  Inline,
  Inspector,
  KeyValue,
  Person,
  Progress,
  Section,
  Stack,
  Stat,
  Table,
} from "@ledger/design-system";
import type { Tone } from "@ledger/design-system";
import { objectiveTone, type ObjectiveResult } from "@/lib/campaigns";
import {
  regressionStateTone,
  runStateTone,
  stepResultTone,
  type CampaignExecution,
  type ProcedureStep,
  type RegressionRow,
  type RunVerdict,
  type StepRecord,
  type TestProcedure,
  type TestRun,
} from "@/lib/test-execution";
import { cn } from "@/lib/utils";

/* ── Row shapes the route assembles ──────────────────────────────────────── */

/** One objective as the campaign declared it and as the run log executed it. */
export type ObjectiveExecutionRow = {
  objective: string;
  statement: string;
  ccis: string[];
  event: string | null;
  /** `TestObjective.result` — the value in the campaign record. */
  declared: ObjectiveResult;
  /** `resolvedObjectiveResult(...).result` — the value the runs support. */
  executed: ObjectiveResult;
  source: "Run" | "Declared";
  /** TR- that decides the executed result — the full attribution is in `basis`. */
  run: string | null;
  /** The full sentence from `resolvedObjectiveResult`. Rendered verbatim. */
  basis: string;
  disagrees: boolean;
  procedures: string[]; // TP-
  runs: number;
};

export type ProcedureListRow = {
  procedure: TestProcedure;
  runs: number;
  /** The latest run's derived verdict, or null when nothing has been run. */
  verdict: RunVerdict | null;
};

export type RunListRow = {
  run: TestRun;
  procedure: TestProcedure | null;
  verdict: RunVerdict | null;
};

/* ── Small shared pieces ─────────────────────────────────────────────────── */

export function ResultChip({ result }: { result: ObjectiveResult }) {
  return <Badge tone={objectiveTone(result)}>{result}</Badge>;
}

function ProseBlock({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Box paddingBlockStart="space.075">
      <div className="font-heading-xxsmall uppercase text-subtle">{label}</div>
      <p className="pt-050 font-body-small text-default">{children}</p>
    </Box>
  );
}

/** `KeyValue` truncates to one line, which is wrong for a list of ids. */
function WrapValue({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Grid className="py-050" gap="space.150" templateColumns="104px 1fr" alignItems="baseline">
      <dt className="truncate font-body-small text-subtle">{label}</dt>
      <dd className="min-w-0 font-body-small text-default">{children}</dd>
    </Grid>
  );
}

function Callout({
  tone,
  title,
  children,
}: {
  tone: "danger" | "warning";
  title: string;
  children: ReactNode;
}) {
  return (
    <Box
      className={cn("rounded-medium", tone === "danger" ? "bg-danger" : "bg-warning")}
      paddingInline="space.150"
      paddingBlock="space.100"
    >
      <Inline
        className={cn(
          "font-body-small font-semibold",
          tone === "danger" ? "text-danger" : "text-warning",
        )}
        space="space.075"
        alignBlock="center"
      >
        <Dot tone={tone} />
        {title}
      </Inline>
      <Box paddingBlockStart="space.075">{children}</Box>
    </Box>
  );
}

/* ── Campaign rollup ─────────────────────────────────────────────────────── */

export function ExecutionSummary({
  execution,
  gaps,
  disagreements,
}: {
  execution: CampaignExecution;
  /** `unproceduredObjectives`, resolved to their statements by the route. */
  gaps: { id: string; statement: string; declared: ObjectiveResult }[];
  disagreements: {
    id: string;
    declared: ObjectiveResult;
    executed: ObjectiveResult;
    run: string | null;
  }[];
}) {
  const planned = execution.objectives;
  const coverage = Math.round((execution.withProcedure / (planned || 1)) * 100);

  return (
    <Stack space="space.300">
      {disagreements.length > 0 ? (
        <Callout
          tone="warning"
          title={`${disagreements.length} ${
            disagreements.length === 1 ? "objective reads" : "objectives read"
          } differently once the runs are counted`}
        >
          <Stack className="font-body-small" space="space.050">
            {disagreements.map((d) => (
              <Inline
                key={d.id}
                space="space.100"
                rowSpace="space.050"
                alignBlock="center"
                shouldWrap
              >
                <Id>{d.id}</Id>
                <span className="text-subtle">declared</span>
                <ResultChip result={d.declared} />
                <span className="text-subtle">·</span>
                <span className="text-subtle">executed</span>
                <ResultChip result={d.executed} />
                {d.run ? (
                  <span className="text-subtle">
                    decided by <Id className="text-subtle">{d.run}</Id>
                  </span>
                ) : null}
              </Inline>
            ))}
          </Stack>
        </Callout>
      ) : null}

      {gaps.length > 0 ? (
        <Callout
          tone="danger"
          title={`${gaps.length} ${
            gaps.length === 1 ? "objective has" : "objectives have"
          } no procedure written`}
        >
          <Stack className="font-body-small" space="space.075">
            {gaps.map((g) => (
              <Inline key={g.id} space="space.100" alignBlock="baseline">
                <Id className="shrink-0">{g.id}</Id>
                <span className="min-w-0 text-default">{g.statement}</span>
                <span className="ml-auto shrink-0">
                  <ResultChip result={g.declared} />
                </span>
              </Inline>
            ))}
          </Stack>
          <p className="pt-100 font-body-small text-subtle">
            Nothing is written to execute against these objectives, so no run can ever move them.
            The declared result stands with no procedure, no build and no step record behind it.
          </p>
        </Callout>
      ) : null}

      <Section
        title="Objectives as executed"
        description="Every result on this row is derived from the run log — each procedure's latest complete run, rolled up to the worst verdict across the procedures written for the objective, falling back to the declared value only where nothing has been executed."
        action={
          <span className="tabular-nums font-body-small text-subtle">
            {execution.complete}/{planned} carry a complete run
          </span>
        }
      >
        <Box paddingBlockStart="space.150">
          <Progress.Stacked
            segments={[
              {
                key: "met",
                value: execution.met,
                tone: "success",
                title: `Met — ${execution.met}`,
              },
              {
                key: "partial",
                value: execution.partiallyMet,
                tone: "warning",
                title: `Partially met — ${execution.partiallyMet}`,
              },
              {
                key: "notMet",
                value: execution.notMet,
                tone: "danger",
                title: `Not met — ${execution.notMet}`,
              },
              {
                key: "notRun",
                value: execution.notRun,
                tone: "neutral",
                title: `Not run — ${execution.notRun}`,
              },
            ]}
          />
          <Inline
            className="pt-100"
            space="space.200"
            rowSpace="space.050"
            alignBlock="center"
            shouldWrap
          >
            {(
              [
                { key: "met", label: "Met", value: execution.met, tone: "success" },
                {
                  key: "partial",
                  label: "Partially met",
                  value: execution.partiallyMet,
                  tone: "warning",
                },
                { key: "notMet", label: "Not met", value: execution.notMet, tone: "danger" },
                { key: "notRun", label: "Not run", value: execution.notRun, tone: "neutral" },
              ] as { key: string; label: string; value: number; tone: Tone }[]
            ).map((s) => (
              <Inline
                key={s.key}
                className="font-body-small"
                as="span"
                space="space.075"
                alignBlock="center"
              >
                <Dot tone={s.tone} />
                <span className="text-subtle">{s.label}</span>
                <span className="tabular-nums font-medium">{s.value}</span>
              </Inline>
            ))}
          </Inline>

          <Box paddingBlockStart="space.200">
            <Inline className="pb-100" space="space.100" alignBlock="baseline">
              <span className="tabular-nums font-heading-small font-semibold">{coverage}%</span>
              <span className="font-body-small text-subtle">
                of the campaign&rsquo;s objectives have a procedure written against them
              </span>
            </Inline>
            <Progress
              value={coverage}
              tone={
                execution.unproceduredObjectives.length === 0
                  ? "success"
                  : coverage >= 75
                    ? "warning"
                    : "danger"
              }
            />
          </Box>

          <Grid
            className="pt-200"
            columnGap="space.400"
            templateColumns={{ base: "repeat(2, minmax(0, 1fr))", md: "repeat(4, minmax(0, 1fr))" }}
          >
            <Stat label="Objectives in scope" value={planned} />
            <Stat
              label="With a procedure"
              value={execution.withProcedure}
              tone={execution.unproceduredObjectives.length > 0 ? "warning" : "success"}
            />
            <Stat label="Objectives run" value={execution.run} />
            <Stat
              label="Recorded steps with no artifact"
              value={execution.unevidencedSteps}
              tone={execution.unevidencedSteps > 0 ? "warning" : "success"}
            />
          </Grid>
        </Box>
      </Section>
    </Stack>
  );
}

/* ── Declared versus executed ────────────────────────────────────────────── */

export function ObjectiveExecutionTable({
  rows,
  onSelect,
  selected,
}: {
  rows: ObjectiveExecutionRow[];
  onSelect: (row: ObjectiveExecutionRow) => void;
  selected?: string | null;
}) {
  if (rows.length === 0) {
    return (
      <Empty
        title="This campaign covers no objectives"
        description="No event under the campaign names an objective, so there is nothing for a procedure to execute against and nothing for the run log to contradict."
      />
    );
  }

  return (
    <Table className="table-fixed">
      <colgroup>
        <col style={{ width: "84px" }} />
        <col />
        <col style={{ width: "128px" }} />
        <col style={{ width: "116px" }} />
        <col style={{ width: "116px" }} />
        <col style={{ width: "152px" }} />
      </colgroup>
      <thead>
        <tr>
          <Table.Header>Objective</Table.Header>
          <Table.Header>Statement</Table.Header>
          <Table.Header>Procedures</Table.Header>
          <Table.Header>Declared</Table.Header>
          <Table.Header>Executed</Table.Header>
          <Table.Header>Decided by</Table.Header>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <Table.Row
            key={row.objective}
            className={cn(
              "cursor-pointer",
              selected === row.objective && "bg-selected",
              row.disagrees && selected !== row.objective && "bg-warning",
            )}
            onClick={() => onSelect(row)}
            title={row.basis}
          >
            <Table.Id id={row.objective} />
            <Table.Cell className="truncate">{row.statement}</Table.Cell>
            <Table.Cell className="truncate">
              {row.procedures.length === 0 ? (
                <span className="text-danger">None written</span>
              ) : (
                <Id className="text-subtle">{row.procedures.join(", ")}</Id>
              )}
            </Table.Cell>
            <Table.Cell>
              <ResultChip result={row.declared} />
            </Table.Cell>
            <Table.Cell>
              <Inline as="span" space="space.075" alignBlock="center">
                <ResultChip result={row.executed} />
                {row.disagrees ? (
                  <span className="shrink-0 font-body-xsmall font-medium text-warning">≠</span>
                ) : null}
              </Inline>
            </Table.Cell>
            <Table.Cell className="truncate">
              {row.source === "Run" && row.run ? (
                <Inline as="span" space="space.075" alignBlock="center">
                  <Id>{row.run}</Id>
                  <span className="font-body-xsmall">run log</span>
                </Inline>
              ) : (
                <span className="font-body-xsmall">Declared — nothing completed</span>
              )}
            </Table.Cell>
          </Table.Row>
        ))}
      </tbody>
    </Table>
  );
}

/** The rail for one objective row — the basis sentence in full, never truncated. */
export function ObjectiveRail({ row }: { row: ObjectiveExecutionRow }) {
  return (
    <div>
      {row.disagrees ? (
        <Box paddingBlockEnd="space.150">
          <Inline
            className="rounded-medium bg-warning px-100 py-100 font-body-small text-warning"
            space="space.100"
            alignBlock="start"
          >
            <Box as="span" paddingBlockStart="space.075">
              <Dot tone="warning" />
            </Box>
            <span className="min-w-0 font-medium">
              The campaign record declares {row.declared}. The run log returns {row.executed}.
            </span>
          </Inline>
        </Box>
      ) : null}

      <Inspector.Group title="Objective">
        <KeyValue label="Objective">
          <Id>{row.objective}</Id>
        </KeyValue>
        <WrapValue label="Statement">{row.statement}</WrapValue>
        <WrapValue label="CCIs">
          <Id.List ids={row.ccis} />
        </WrapValue>
        <KeyValue label="Event">{row.event ? <Id>{row.event}</Id> : <Absent />}</KeyValue>
      </Inspector.Group>

      <Inspector.Group title="Result">
        <KeyValue label="Declared">
          <ResultChip result={row.declared} />
        </KeyValue>
        <KeyValue label="Executed">
          <ResultChip result={row.executed} />
        </KeyValue>
        <KeyValue label="Source">{row.source === "Run" ? "Run log" : "Campaign record"}</KeyValue>
        <KeyValue label="Decided by">{row.run ? <Id>{row.run}</Id> : <Absent />}</KeyValue>
        <ProseBlock label="Basis">{row.basis}</ProseBlock>
      </Inspector.Group>

      <Inspector.Group title="Execution">
        <WrapValue label="Procedures">
          <Id.List ids={row.procedures} empty="No procedure written" />
        </WrapValue>
        <KeyValue label="Runs">
          <span className="tabular-nums">{row.runs}</span>
        </KeyValue>
      </Inspector.Group>
    </div>
  );
}

/* ── Procedures ──────────────────────────────────────────────────────────── */

export function ProcedureList({
  rows,
  onSelect,
  selected,
}: {
  rows: ProcedureListRow[];
  onSelect: (row: ProcedureListRow) => void;
  selected?: string | null;
}) {
  if (rows.length === 0) {
    return (
      <Empty
        title="No procedure is written for this campaign"
        description="Every objective the campaign covers is still an assertion — there is no written action, no pass criterion and no artifact to collect."
      />
    );
  }

  return (
    <Table className="table-fixed">
      <colgroup>
        <col style={{ width: "88px" }} />
        <col />
        <col style={{ width: "84px" }} />
        <col style={{ width: "116px" }} />
        <col style={{ width: "64px" }} />
        <col style={{ width: "72px" }} />
        <col style={{ width: "64px" }} />
        <col style={{ width: "116px" }} />
      </colgroup>
      <thead>
        <tr>
          <Table.Header>Procedure</Table.Header>
          <Table.Header>Title</Table.Header>
          <Table.Header>Objective</Table.Header>
          <Table.Header>Method</Table.Header>
          <Table.Header className="text-right">Steps</Table.Header>
          <Table.Header className="text-right">Minutes</Table.Header>
          <Table.Header className="text-right">Runs</Table.Header>
          <Table.Header>Latest verdict</Table.Header>
        </tr>
      </thead>
      <tbody>
        {rows.map(({ procedure, runs, verdict }) => (
          <Table.Row
            key={procedure.id}
            className={cn("cursor-pointer", selected === procedure.id && "bg-selected")}
            onClick={() => onSelect({ procedure, runs, verdict })}
            title={procedure.title}
          >
            <Table.Cell>
              <Inline as="span" space="space.075" alignBlock="baseline">
                <Id>{procedure.id}</Id>
                <span className="shrink-0 font-body-xsmall text-subtle">{procedure.version}</span>
              </Inline>
            </Table.Cell>
            <Table.Cell className="truncate">{procedure.title}</Table.Cell>
            <Table.Cell>
              <Id>{procedure.objective}</Id>
            </Table.Cell>
            <Table.Cell className="truncate">
              <Badge>{procedure.method}</Badge>
            </Table.Cell>
            <Table.Cell className="tabular-nums text-right">{procedure.steps.length}</Table.Cell>
            <Table.Cell className="tabular-nums text-right">{procedure.duration}</Table.Cell>
            <Table.Cell className="tabular-nums text-right">{runs}</Table.Cell>
            <Table.Cell className="truncate" title={verdict?.basis}>
              {verdict ? <ResultChip result={verdict.result} /> : <Absent />}
            </Table.Cell>
          </Table.Row>
        ))}
      </tbody>
    </Table>
  );
}

/**
 * The written procedure, step by step. Every column here is prose an operator
 * has to read and judge, so the cells wrap rather than truncate — a pass
 * criterion cut off at the column edge is not a pass criterion.
 */
export function StepTable({
  steps,
  records,
}: {
  steps: ProcedureStep[];
  /** Optional per-step record, keyed by step id — shown as a trailing column. */
  records?: Map<string, StepRecord>;
}) {
  if (steps.length === 0) {
    return (
      <Empty
        title="This procedure declares no steps"
        description="There is nothing to record and nothing a run of it could ever prove."
      />
    );
  }

  return (
    <Table className="table-fixed">
      <colgroup>
        <col style={{ width: "40px" }} />
        <col />
        <col />
        <col style={{ width: "240px" }} />
        {records ? <col style={{ width: "116px" }} /> : null}
      </colgroup>
      <thead>
        <tr>
          <Table.Header className="text-right">#</Table.Header>
          <Table.Header>Action</Table.Header>
          <Table.Header>Expected</Table.Header>
          <Table.Header>Collect</Table.Header>
          {records ? <Table.Header>Recorded</Table.Header> : null}
        </tr>
      </thead>
      <tbody>
        {steps.map((step) => {
          const record = records?.get(step.id);
          return (
            <Table.Row key={step.id} className="align-top">
              <Table.Cell className="tabular-nums whitespace-normal py-100 align-top text-right">
                {step.n}
              </Table.Cell>
              <Table.Cell className="max-w-none whitespace-normal py-100 align-top">
                <Id className="font-body-xsmall text-subtle">{step.id}</Id>
                <Box className="block" as="span" paddingBlockStart="space.025">
                  {step.action}
                </Box>
              </Table.Cell>
              <Table.Cell className="max-w-none whitespace-normal py-100 align-top">
                {step.expected}
              </Table.Cell>
              <Table.Cell className="max-w-none whitespace-normal py-100 align-top">
                {step.collect}
              </Table.Cell>
              {records ? (
                <Table.Cell className="whitespace-normal py-100 align-top">
                  <Badge tone={stepResultTone[record?.result ?? "Not run"]}>
                    {record?.result ?? "Not run"}
                  </Badge>
                </Table.Cell>
              ) : null}
            </Table.Row>
          );
        })}
      </tbody>
    </Table>
  );
}

export function ProcedureRail({ row }: { row: ProcedureListRow }) {
  const { procedure, runs, verdict } = row;
  return (
    <div>
      <Inspector.Group title="Procedure">
        <KeyValue label="Procedure">
          <Id>{procedure.id}</Id>
        </KeyValue>
        <WrapValue label="Title">{procedure.title}</WrapValue>
        <KeyValue label="Objective">
          <Id>{procedure.objective}</Id>
        </KeyValue>
        <KeyValue label="Method">
          <Badge>{procedure.method}</Badge>
        </KeyValue>
        <KeyValue label="Steps">
          <span className="tabular-nums">{procedure.steps.length}</span>
        </KeyValue>
        <KeyValue label="Duration">
          <span className="tabular-nums">{procedure.duration} min</span>
        </KeyValue>
        <KeyValue label="Author">
          <Person name={procedure.author} />
        </KeyValue>
        <KeyValue label="Version">{procedure.version}</KeyValue>
      </Inspector.Group>

      <Inspector.Group title="Written against">
        <WrapValue label="Components">
          <Id.List ids={procedure.nodes} empty="Not allocated" />
        </WrapValue>
      </Inspector.Group>

      <Inspector.Group title="Execution">
        <KeyValue label="Runs">
          <span className="tabular-nums">{runs}</span>
        </KeyValue>
        <KeyValue label="Latest">
          {verdict ? <ResultChip result={verdict.result} /> : <Absent />}
        </KeyValue>
        {verdict ? <ProseBlock label="Basis">{verdict.basis}</ProseBlock> : null}
      </Inspector.Group>
    </div>
  );
}

export function PreconditionList({ items }: { items: string[] }) {
  if (items.length === 0) {
    return <p className="font-body text-subtle">No preconditions are declared.</p>;
  }
  return (
    <Stack className="pt-050" as="ol" space="space.075">
      {items.map((item, i) => (
        <Inline key={i} className="font-body" as="li" space="space.100">
          <span className="tabular-nums shrink-0 text-right text-subtle w-200">{i + 1}</span>
          <span className="min-w-0 text-subtle">{item}</span>
        </Inline>
      ))}
    </Stack>
  );
}

/* ── Runs ────────────────────────────────────────────────────────────────── */

export function RunTable({
  rows,
  onSelect,
  selected,
}: {
  rows: RunListRow[];
  onSelect: (row: RunListRow) => void;
  selected?: string | null;
}) {
  if (rows.length === 0) {
    return (
      <Empty
        title="Nothing has been run"
        description="No procedure under this campaign has been executed against a build, so every objective result here is still a declaration."
      />
    );
  }

  return (
    <Table className="table-fixed">
      <colgroup>
        <col style={{ width: "84px" }} />
        <col style={{ width: "88px" }} />
        <col />
        <col style={{ width: "132px" }} />
        <col style={{ width: "116px" }} />
        <col style={{ width: "116px" }} />
        <col style={{ width: "64px" }} />
        <col style={{ width: "136px" }} />
      </colgroup>
      <thead>
        <tr>
          <Table.Header>Run</Table.Header>
          <Table.Header>Procedure</Table.Header>
          <Table.Header>Build under test</Table.Header>
          <Table.Header>Operator</Table.Header>
          <Table.Header>State</Table.Header>
          <Table.Header>Verdict</Table.Header>
          <Table.Header className="text-right">P/F/I</Table.Header>
          <Table.Header>Started</Table.Header>
        </tr>
      </thead>
      <tbody>
        {rows.map(({ run, procedure, verdict }) => (
          <Table.Row
            key={run.id}
            className={cn("cursor-pointer", selected === run.id && "bg-selected")}
            onClick={() => onSelect({ run, procedure, verdict })}
            title={verdict?.basis ?? run.notes}
          >
            <Table.Cell>
              <Inline as="span" space="space.075" alignBlock="baseline">
                <Id>{run.id}</Id>
                {run.retestOf ? (
                  <span
                    className="shrink-0 font-body-xsmall text-subtle"
                    title={`Retest of ${run.retestOf}`}
                  >
                    ↻
                  </span>
                ) : null}
              </Inline>
            </Table.Cell>
            <Table.Cell>
              <Id>{run.procedure}</Id>
            </Table.Cell>
            <Table.Cell className="truncate">{run.build}</Table.Cell>
            <Table.Cell className="truncate">{run.operator}</Table.Cell>
            <Table.Cell className="truncate">
              <Badge tone={runStateTone[run.state]}>{run.state}</Badge>
            </Table.Cell>
            <Table.Cell className="truncate">
              {verdict ? <ResultChip result={verdict.result} /> : <Absent />}
            </Table.Cell>
            <Table.Cell className="tabular-nums text-right">
              {verdict ? `${verdict.pass}/${verdict.fail}/${verdict.inconclusive}` : "—"}
            </Table.Cell>
            <Table.Cell className="tabular-nums truncate">
              {run.started}
              {procedure ? "" : " · procedure missing"}
            </Table.Cell>
          </Table.Row>
        ))}
      </tbody>
    </Table>
  );
}

/**
 * One run, step record by step record. The run's STATE and its VERDICT are
 * shown side by side and never merged: an aborted run can still have recorded
 * enough to return Partially met, and a complete run can return Not met. The
 * state says what happened to the run; the verdict says what the records add
 * up to.
 */
export function RunRecordView({
  run,
  procedure,
  verdict,
  blockedReason,
  onComplete,
}: {
  run: TestRun;
  procedure: TestProcedure | null;
  verdict: RunVerdict | null;
  /** `completionBlockedBy(run.id)` — the sentence, or null when it would succeed. */
  blockedReason?: string | null;
  onComplete?: () => void;
}) {
  const byStep = new Map(run.records.map((r) => [r.step, r]));
  const steps: ProcedureStep[] = procedure?.steps ?? [];
  const canComplete =
    run.state !== "Complete" && blockedReason === null && onComplete !== undefined;

  return (
    <Stack space="space.300">
      <Section
        title={
          <Inline as="span" space="space.100" alignBlock="center" shouldWrap>
            <Id>{run.id}</Id>
            <span>{procedure?.title ?? run.procedure}</span>
          </Inline>
        }
        description={`${run.procedure} · ${procedure?.method ?? "—"} · operator ${run.operator} · witness ${run.witness}`}
        action={
          <Inline as="span" space="space.100" alignBlock="center">
            <Badge tone={runStateTone[run.state]}>{run.state}</Badge>
            {verdict ? <ResultChip result={verdict.result} /> : null}
          </Inline>
        }
      >
        <Grid
          className="pt-150"
          columnGap="space.400"
          rowGap="space.050"
          templateColumns={{ md: "repeat(2, minmax(0, 1fr))" }}
        >
          <div>
            <ProseBlock label="Build under test">{run.build}</ProseBlock>
            <ProseBlock label="Configuration">{run.configuration}</ProseBlock>
          </div>
          <div>
            <ProseBlock label="Verdict basis">
              {verdict ? verdict.basis : "No verdict — the run names a procedure that is missing."}
            </ProseBlock>
            <Grid
              className="py-050 pt-150"
              gap="space.150"
              templateColumns="104px 1fr"
              alignItems="baseline"
            >
              <dt className="truncate font-body-small text-subtle">Window</dt>
              <dd className="tabular-nums min-w-0 font-body-small text-default">
                {run.started} → {run.completed}
              </dd>
            </Grid>
            <Grid
              className="py-050"
              gap="space.150"
              templateColumns="104px 1fr"
              alignItems="baseline"
            >
              <dt className="truncate font-body-small text-subtle">Components</dt>
              <dd className="min-w-0 font-body-small">
                <Id.List ids={run.nodes} />
              </dd>
            </Grid>
            <Grid
              className="py-050"
              gap="space.150"
              templateColumns="104px 1fr"
              alignItems="baseline"
            >
              <dt className="truncate font-body-small text-subtle">Findings raised</dt>
              <dd className="min-w-0 font-body-small">
                <Id.List ids={run.findings} empty="None" />
              </dd>
            </Grid>
          </div>
        </Grid>

        {run.notes ? (
          <p className="max-w-layout-measure pt-150 font-body text-subtle">{run.notes}</p>
        ) : null}

        {onComplete && run.state !== "Complete" ? (
          <Inline className="pt-200" space="space.150" alignBlock="center" shouldWrap>
            <Button
              variant={canComplete ? "primary" : "secondary"}
              disabled={!canComplete}
              onClick={() => {
                if (canComplete) onComplete();
              }}
              title={blockedReason ?? "Move the run to Complete"}
            >
              Mark run complete
            </Button>
            {blockedReason ? (
              <span className="min-w-0 flex-1 font-body-small text-warning">
                {blockedReason} A run cannot be completed until every step carries a result — the
                objective&rsquo;s executed value is taken from complete runs only.
              </span>
            ) : (
              <span className="font-body-small text-subtle">
                Every step carries a result, so the run can be closed. Its verdict then speaks for{" "}
                {run.procedure} in the objective&rsquo;s rollup, which takes the worst of the
                procedures written for it.
              </span>
            )}
          </Inline>
        ) : null}
      </Section>

      <Section
        title="Step records"
        description={
          verdict
            ? `${verdict.pass} passed · ${verdict.fail} failed · ${verdict.inconclusive} inconclusive · ${verdict.notRun} not run · ${verdict.unevidenced} recorded without an artifact`
            : "What the operator observed at each step."
        }
      >
        {steps.length === 0 ? (
          <Empty
            title="No steps to record"
            description={`${run.procedure} is not in the procedure library, so this run has nothing to be judged against.`}
          />
        ) : (
          <div className="divide-y">
            {steps.map((step) => {
              const record = byStep.get(step.id);
              const result = record?.result ?? "Not run";
              const unevidenced = result !== "Not run" && (record?.evidence.length ?? 0) === 0;
              return (
                <Grid
                  key={step.id}
                  className="py-150"
                  columnGap="space.300"
                  rowGap="space.100"
                  templateColumns={{ md: "1fr 1fr" }}
                >
                  <div className="min-w-0">
                    <Inline space="space.100" alignBlock="center" shouldWrap>
                      <Id className="font-body-xsmall text-subtle">{step.id}</Id>
                      <Badge tone={stepResultTone[result]}>{result}</Badge>
                      <span className="tabular-nums font-body-xsmall text-subtle">
                        {record?.at ?? "—"}
                      </span>
                    </Inline>
                    <p className="pt-050 font-body">{step.action}</p>
                    <p className="pt-050 font-body-small text-subtle">Expected: {step.expected}</p>
                  </div>
                  <div className="min-w-0">
                    <div className="font-heading-xxsmall uppercase text-subtle">Observed</div>
                    <p className="pt-050 font-body-small text-default">{record?.observed ?? "—"}</p>
                    <Inline
                      className="pt-075 font-body-small"
                      space="space.100"
                      alignBlock="center"
                      shouldWrap
                    >
                      <span className="text-subtle">Evidence</span>
                      <Id.List ids={record?.evidence ?? []} empty="None collected" />
                      {unevidenced ? (
                        <Badge tone="warning" size="xsmall">
                          Recorded without the artifact the step demands
                        </Badge>
                      ) : null}
                    </Inline>
                  </div>
                </Grid>
              );
            })}
          </div>
        )}
      </Section>
    </Stack>
  );
}

export function RunRail({ row }: { row: RunListRow }) {
  const { run, procedure, verdict } = row;
  return (
    <div>
      <Inspector.Group title="Run">
        <KeyValue label="Run">
          <Id>{run.id}</Id>
        </KeyValue>
        <KeyValue label="Procedure">
          <Id>{run.procedure}</Id>
        </KeyValue>
        <KeyValue label="Objective">
          {procedure ? <Id>{procedure.objective}</Id> : <Absent />}
        </KeyValue>
        <KeyValue label="Event">{run.event ? <Id>{run.event}</Id> : <Absent />}</KeyValue>
        <KeyValue label="State">
          <Badge tone={runStateTone[run.state]}>{run.state}</Badge>
        </KeyValue>
        <KeyValue label="Verdict">
          {verdict ? <ResultChip result={verdict.result} /> : <Absent />}
        </KeyValue>
        <KeyValue label="Retest of">{run.retestOf ? <Id>{run.retestOf}</Id> : <Absent />}</KeyValue>
      </Inspector.Group>

      <Inspector.Group title="Conduct">
        <KeyValue label="Operator">
          <Person name={run.operator} />
        </KeyValue>
        <KeyValue label="Witness">
          {run.witness === "—" ? <Absent /> : <Person name={run.witness} />}
        </KeyValue>
        <KeyValue label="Started">
          <span className="tabular-nums">{run.started}</span>
        </KeyValue>
        <KeyValue label="Completed">
          <span className="tabular-nums">{run.completed}</span>
        </KeyValue>
        <WrapValue label="Components">
          <Id.List ids={run.nodes} />
        </WrapValue>
        <WrapValue label="Findings">
          <Id.List ids={run.findings} empty="None raised" />
        </WrapValue>
      </Inspector.Group>

      <Inspector.Group title="Configuration">
        <ProseBlock label="Build">{run.build}</ProseBlock>
        <ProseBlock label="Deviations">{run.configuration}</ProseBlock>
      </Inspector.Group>
    </div>
  );
}

/* ── Regression ──────────────────────────────────────────────────────────── */

export function RegressionTable({ rows }: { rows: RegressionRow[] }) {
  if (rows.length === 0) {
    return (
      <Empty
        title="No step has been compared against a prior run"
        description="A regression row needs a retest and a decisive record on both sides. Nothing under this campaign re-executes a procedure with two Pass-or-Fail observations of the same step."
      />
    );
  }

  return (
    <Table className="table-fixed">
      <colgroup>
        <col style={{ width: "92px" }} />
        <col style={{ width: "116px" }} />
        <col style={{ width: "96px" }} />
        <col style={{ width: "104px" }} />
        <col style={{ width: "96px" }} />
        <col style={{ width: "104px" }} />
        <col style={{ width: "120px" }} />
        <col />
      </colgroup>
      <thead>
        <tr>
          <Table.Header>Procedure</Table.Header>
          <Table.Header>Step</Table.Header>
          <Table.Header>Prior run</Table.Header>
          <Table.Header>Prior result</Table.Header>
          <Table.Header>Current run</Table.Header>
          <Table.Header>Current result</Table.Header>
          <Table.Header>Movement</Table.Header>
          <Table.Header>Reading</Table.Header>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <Table.Row
            key={`${row.currentRun}|${row.step}`}
            className={cn(row.state === "Regressed" && "bg-danger")}
          >
            <Table.Cell>
              <Id>{row.procedure}</Id>
            </Table.Cell>
            <Table.Cell>
              <Id>{row.step}</Id>
            </Table.Cell>
            <Table.Cell>
              <Id>{row.priorRun}</Id>
            </Table.Cell>
            <Table.Cell>
              <Badge tone={stepResultTone[row.priorResult]}>{row.priorResult}</Badge>
            </Table.Cell>
            <Table.Cell>
              <Id>{row.currentRun}</Id>
            </Table.Cell>
            <Table.Cell>
              <Badge tone={stepResultTone[row.currentResult]}>{row.currentResult}</Badge>
            </Table.Cell>
            <Table.Cell>
              <Badge tone={regressionStateTone[row.state]}>{row.state}</Badge>
            </Table.Cell>
            <Table.Cell className="truncate">
              {row.state === "Regressed"
                ? `${row.step} passed in ${row.priorRun} and fails in ${row.currentRun}.`
                : row.state === "Fixed"
                  ? `${row.step} failed in ${row.priorRun} and passes in ${row.currentRun}.`
                  : row.state === "Still failing"
                    ? `${row.step} has failed in both runs — the retest did not move it.`
                    : `${row.step} passed in both runs.`}
            </Table.Cell>
          </Table.Row>
        ))}
      </tbody>
    </Table>
  );
}
