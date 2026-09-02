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
  Badge,
  Button,
  Dot,
  EmptyState,
  KeyValue,
  Meter,
  Mono,
  Person,
  RailGroup,
  Section,
  StackedBar,
  Table,
  Td,
  Th,
  Tr,
  type Tone,
  IdCell,
} from "@/components/app/ui";
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

function Dash() {
  return <span className="text-muted-foreground">—</span>;
}

function ProseBlock({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="pt-1.5">
      <div className="text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
        {label}
      </div>
      <p className="mt-1 text-[12.5px] leading-relaxed text-foreground">{children}</p>
    </div>
  );
}

/** `KeyValue` truncates to one line, which is wrong for a list of ids. */
function WrapValue({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[104px_1fr] items-baseline gap-3 py-[5px]">
      <dt className="truncate text-[12.5px] text-muted-foreground">{label}</dt>
      <dd className="min-w-0 text-[12.5px] leading-snug text-foreground">{children}</dd>
    </div>
  );
}

function IdList({ ids, empty = "—" }: { ids: string[]; empty?: string }) {
  if (ids.length === 0) return <span className="text-[12.5px] text-muted-foreground">{empty}</span>;
  return (
    <span className="flex flex-wrap gap-1">
      {ids.map((id) => (
        <Mono key={id} className="text-[11.5px] text-muted-foreground">
          {id}
        </Mono>
      ))}
    </span>
  );
}

function Stat({ label, value, tone = "neutral" }: { label: string; value: number; tone?: Tone }) {
  const text: Record<Tone, string> = {
    neutral: "text-foreground",
    success: "text-success",
    warning: "text-warning",
    danger: "text-danger",
    info: "text-primary",
  };
  return (
    <div className="border-b border-border-subtle py-2 last:border-0 md:border-0">
      <div className={cn("tnum text-20 font-semibold leading-none", text[tone])}>{value}</div>
      <div className="mt-1 text-12 text-muted-foreground">{label}</div>
    </div>
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
    <div
      className={cn(
        "rounded-md px-3 py-2.5",
        tone === "danger" ? "bg-danger-soft" : "bg-warning-soft",
      )}
    >
      <div
        className={cn(
          "flex items-center gap-1.5 text-[12.5px] font-semibold",
          tone === "danger" ? "text-danger" : "text-warning",
        )}
      >
        <Dot tone={tone} />
        {title}
      </div>
      <div className="pt-1.5">{children}</div>
    </div>
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
    <div className="space-y-7">
      {disagreements.length > 0 ? (
        <Callout
          tone="warning"
          title={`${disagreements.length} ${
            disagreements.length === 1 ? "objective reads" : "objectives read"
          } differently once the runs are counted`}
        >
          <div className="space-y-1 text-[12.5px]">
            {disagreements.map((d) => (
              <div key={d.id} className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <Mono>{d.id}</Mono>
                <span className="text-muted-foreground">declared</span>
                <ResultChip result={d.declared} />
                <span className="text-muted-foreground">·</span>
                <span className="text-muted-foreground">executed</span>
                <ResultChip result={d.executed} />
                {d.run ? (
                  <span className="text-muted-foreground">
                    decided by <Mono className="text-muted-foreground">{d.run}</Mono>
                  </span>
                ) : null}
              </div>
            ))}
          </div>
        </Callout>
      ) : null}

      {gaps.length > 0 ? (
        <Callout
          tone="danger"
          title={`${gaps.length} ${
            gaps.length === 1 ? "objective has" : "objectives have"
          } no procedure written`}
        >
          <div className="space-y-1.5 text-[12.5px]">
            {gaps.map((g) => (
              <div key={g.id} className="flex items-baseline gap-2">
                <Mono className="shrink-0">{g.id}</Mono>
                <span className="min-w-0 leading-snug text-foreground">{g.statement}</span>
                <span className="ml-auto shrink-0">
                  <ResultChip result={g.declared} />
                </span>
              </div>
            ))}
          </div>
          <p className="pt-2 text-[12px] leading-relaxed text-muted-foreground">
            Nothing is written to execute against these objectives, so no run can ever move them.
            The declared result stands with no procedure, no build and no step record behind it.
          </p>
        </Callout>
      ) : null}

      <Section
        title="Objectives as executed"
        description="Every result on this row is derived from the run log — each procedure's latest complete run, rolled up to the worst verdict across the procedures written for the objective, falling back to the declared value only where nothing has been executed."
        action={
          <span className="tnum text-12 text-muted-foreground">
            {execution.complete}/{planned} carry a complete run
          </span>
        }
      >
        <div className="pt-3">
          <StackedBar
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
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-2">
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
              <span key={s.key} className="flex items-center gap-1.5 text-12">
                <Dot tone={s.tone} />
                <span className="text-muted-foreground">{s.label}</span>
                <span className="tnum font-medium">{s.value}</span>
              </span>
            ))}
          </div>

          <div className="pt-4">
            <div className="flex items-baseline gap-2 pb-2">
              <span className="tnum text-20 font-semibold leading-none">{coverage}%</span>
              <span className="text-12 text-muted-foreground">
                of the campaign&rsquo;s objectives have a procedure written against them
              </span>
            </div>
            <Meter
              value={coverage}
              tone={
                execution.unproceduredObjectives.length === 0
                  ? "success"
                  : coverage >= 75
                    ? "warning"
                    : "danger"
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-x-8 pt-4 md:grid-cols-4">
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
          </div>
        </div>
      </Section>
    </div>
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
      <EmptyState
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
          <Th>Objective</Th>
          <Th>Statement</Th>
          <Th>Procedures</Th>
          <Th>Declared</Th>
          <Th>Executed</Th>
          <Th>Decided by</Th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <Tr
            key={row.objective}
            className={cn(
              "cursor-pointer",
              selected === row.objective && "bg-primary-soft/40",
              row.disagrees && selected !== row.objective && "bg-warning-soft/40",
            )}
            onClick={() => onSelect(row)}
            title={row.basis}
          >
            <IdCell id={row.objective} />
            <Td className="truncate">{row.statement}</Td>
            <Td className="truncate">
              {row.procedures.length === 0 ? (
                <span className="text-danger">None written</span>
              ) : (
                <Mono className="text-muted-foreground">{row.procedures.join(", ")}</Mono>
              )}
            </Td>
            <Td>
              <ResultChip result={row.declared} />
            </Td>
            <Td>
              <span className="flex items-center gap-1.5">
                <ResultChip result={row.executed} />
                {row.disagrees ? (
                  <span className="shrink-0 text-11 font-medium text-warning">≠</span>
                ) : null}
              </span>
            </Td>
            <Td className="truncate">
              {row.source === "Run" && row.run ? (
                <span className="flex items-center gap-1.5">
                  <Mono>{row.run}</Mono>
                  <span className="text-11">run log</span>
                </span>
              ) : (
                <span className="text-11">Declared — nothing completed</span>
              )}
            </Td>
          </Tr>
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
        <div className="mb-3 flex items-start gap-2 rounded-md bg-warning-soft px-2.5 py-2 text-[12.5px] leading-snug text-warning">
          <span className="pt-1.5">
            <Dot tone="warning" />
          </span>
          <span className="min-w-0 font-medium">
            The campaign record declares {row.declared}. The run log returns {row.executed}.
          </span>
        </div>
      ) : null}

      <RailGroup title="Objective">
        <KeyValue label="Objective">
          <Mono>{row.objective}</Mono>
        </KeyValue>
        <WrapValue label="Statement">{row.statement}</WrapValue>
        <WrapValue label="CCIs">
          <IdList ids={row.ccis} />
        </WrapValue>
        <KeyValue label="Event">{row.event ? <Mono>{row.event}</Mono> : <Dash />}</KeyValue>
      </RailGroup>

      <RailGroup title="Result">
        <KeyValue label="Declared">
          <ResultChip result={row.declared} />
        </KeyValue>
        <KeyValue label="Executed">
          <ResultChip result={row.executed} />
        </KeyValue>
        <KeyValue label="Source">{row.source === "Run" ? "Run log" : "Campaign record"}</KeyValue>
        <KeyValue label="Decided by">{row.run ? <Mono>{row.run}</Mono> : <Dash />}</KeyValue>
        <ProseBlock label="Basis">{row.basis}</ProseBlock>
      </RailGroup>

      <RailGroup title="Execution">
        <WrapValue label="Procedures">
          <IdList ids={row.procedures} empty="No procedure written" />
        </WrapValue>
        <KeyValue label="Runs">
          <span className="tnum">{row.runs}</span>
        </KeyValue>
      </RailGroup>
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
      <EmptyState
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
          <Th>Procedure</Th>
          <Th>Title</Th>
          <Th>Objective</Th>
          <Th>Method</Th>
          <Th className="text-right">Steps</Th>
          <Th className="text-right">Minutes</Th>
          <Th className="text-right">Runs</Th>
          <Th>Latest verdict</Th>
        </tr>
      </thead>
      <tbody>
        {rows.map(({ procedure, runs, verdict }) => (
          <Tr
            key={procedure.id}
            className={cn("cursor-pointer", selected === procedure.id && "bg-primary-soft/40")}
            onClick={() => onSelect({ procedure, runs, verdict })}
            title={procedure.title}
          >
            <Td>
              <span className="flex items-baseline gap-1.5">
                <Mono>{procedure.id}</Mono>
                <span className="shrink-0 text-11 text-muted-foreground">{procedure.version}</span>
              </span>
            </Td>
            <Td className="truncate">{procedure.title}</Td>
            <Td>
              <Mono>{procedure.objective}</Mono>
            </Td>
            <Td className="truncate">
              <Badge>{procedure.method}</Badge>
            </Td>
            <Td className="tnum text-right">{procedure.steps.length}</Td>
            <Td className="tnum text-right">{procedure.duration}</Td>
            <Td className="tnum text-right">{runs}</Td>
            <Td className="truncate" title={verdict?.basis}>
              {verdict ? <ResultChip result={verdict.result} /> : <Dash />}
            </Td>
          </Tr>
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
      <EmptyState
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
          <Th className="text-right">#</Th>
          <Th>Action</Th>
          <Th>Expected</Th>
          <Th>Collect</Th>
          {records ? <Th>Recorded</Th> : null}
        </tr>
      </thead>
      <tbody>
        {steps.map((step) => {
          const record = records?.get(step.id);
          return (
            <Tr key={step.id} className="align-top">
              <Td className="tnum whitespace-normal py-2 align-top text-right">{step.n}</Td>
              <Td className="max-w-none whitespace-normal py-2 align-top leading-snug">
                <Mono className="text-[11px] text-muted-foreground">{step.id}</Mono>
                <span className="mt-0.5 block">{step.action}</span>
              </Td>
              <Td className="max-w-none whitespace-normal py-2 align-top leading-snug">
                {step.expected}
              </Td>
              <Td className="max-w-none whitespace-normal py-2 align-top leading-snug">
                {step.collect}
              </Td>
              {records ? (
                <Td className="whitespace-normal py-2 align-top">
                  <Badge tone={stepResultTone[record?.result ?? "Not run"]}>
                    {record?.result ?? "Not run"}
                  </Badge>
                </Td>
              ) : null}
            </Tr>
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
      <RailGroup title="Procedure">
        <KeyValue label="Procedure">
          <Mono>{procedure.id}</Mono>
        </KeyValue>
        <WrapValue label="Title">{procedure.title}</WrapValue>
        <KeyValue label="Objective">
          <Mono>{procedure.objective}</Mono>
        </KeyValue>
        <KeyValue label="Method">
          <Badge>{procedure.method}</Badge>
        </KeyValue>
        <KeyValue label="Steps">
          <span className="tnum">{procedure.steps.length}</span>
        </KeyValue>
        <KeyValue label="Duration">
          <span className="tnum">{procedure.duration} min</span>
        </KeyValue>
        <KeyValue label="Author">
          <Person name={procedure.author} />
        </KeyValue>
        <KeyValue label="Version">{procedure.version}</KeyValue>
      </RailGroup>

      <RailGroup title="Written against">
        <WrapValue label="Components">
          <IdList ids={procedure.nodes} empty="Not allocated" />
        </WrapValue>
      </RailGroup>

      <RailGroup title="Execution">
        <KeyValue label="Runs">
          <span className="tnum">{runs}</span>
        </KeyValue>
        <KeyValue label="Latest">
          {verdict ? <ResultChip result={verdict.result} /> : <Dash />}
        </KeyValue>
        {verdict ? <ProseBlock label="Basis">{verdict.basis}</ProseBlock> : null}
      </RailGroup>
    </div>
  );
}

export function PreconditionList({ items }: { items: string[] }) {
  if (items.length === 0) {
    return <p className="text-[13px] text-muted-foreground">No preconditions are declared.</p>;
  }
  return (
    <ol className="space-y-1.5 pt-1">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2.5 text-[13px] leading-relaxed">
          <span className="tnum w-4 shrink-0 text-right text-muted-foreground">{i + 1}</span>
          <span className="min-w-0 text-muted-foreground">{item}</span>
        </li>
      ))}
    </ol>
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
      <EmptyState
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
          <Th>Run</Th>
          <Th>Procedure</Th>
          <Th>Build under test</Th>
          <Th>Operator</Th>
          <Th>State</Th>
          <Th>Verdict</Th>
          <Th className="text-right">P/F/I</Th>
          <Th>Started</Th>
        </tr>
      </thead>
      <tbody>
        {rows.map(({ run, procedure, verdict }) => (
          <Tr
            key={run.id}
            className={cn("cursor-pointer", selected === run.id && "bg-primary-soft/40")}
            onClick={() => onSelect({ run, procedure, verdict })}
            title={verdict?.basis ?? run.notes}
          >
            <Td>
              <span className="flex items-baseline gap-1.5">
                <Mono>{run.id}</Mono>
                {run.retestOf ? (
                  <span
                    className="shrink-0 text-11 text-muted-foreground"
                    title={`Retest of ${run.retestOf}`}
                  >
                    ↻
                  </span>
                ) : null}
              </span>
            </Td>
            <Td>
              <Mono>{run.procedure}</Mono>
            </Td>
            <Td className="truncate">{run.build}</Td>
            <Td className="truncate">{run.operator}</Td>
            <Td className="truncate">
              <Badge tone={runStateTone[run.state]}>{run.state}</Badge>
            </Td>
            <Td className="truncate">
              {verdict ? <ResultChip result={verdict.result} /> : <Dash />}
            </Td>
            <Td className="tnum text-right">
              {verdict ? `${verdict.pass}/${verdict.fail}/${verdict.inconclusive}` : "—"}
            </Td>
            <Td className="tnum truncate">
              {run.started}
              {procedure ? "" : " · procedure missing"}
            </Td>
          </Tr>
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
    <div className="space-y-7">
      <Section
        title={
          <span className="flex flex-wrap items-center gap-2">
            <Mono>{run.id}</Mono>
            <span>{procedure?.title ?? run.procedure}</span>
          </span>
        }
        description={`${run.procedure} · ${procedure?.method ?? "—"} · operator ${run.operator} · witness ${run.witness}`}
        action={
          <span className="flex items-center gap-2">
            <Badge tone={runStateTone[run.state]}>{run.state}</Badge>
            {verdict ? <ResultChip result={verdict.result} /> : null}
          </span>
        }
      >
        <div className="grid gap-x-8 gap-y-1 pt-3 md:grid-cols-2">
          <div>
            <ProseBlock label="Build under test">{run.build}</ProseBlock>
            <ProseBlock label="Configuration">{run.configuration}</ProseBlock>
          </div>
          <div>
            <ProseBlock label="Verdict basis">
              {verdict ? verdict.basis : "No verdict — the run names a procedure that is missing."}
            </ProseBlock>
            <div className="grid grid-cols-[104px_1fr] items-baseline gap-3 py-[5px] pt-3">
              <dt className="truncate text-[12.5px] text-muted-foreground">Window</dt>
              <dd className="tnum min-w-0 text-[12.5px] leading-snug text-foreground">
                {run.started} → {run.completed}
              </dd>
            </div>
            <div className="grid grid-cols-[104px_1fr] items-baseline gap-3 py-[5px]">
              <dt className="truncate text-[12.5px] text-muted-foreground">Components</dt>
              <dd className="min-w-0 text-[12.5px] leading-snug">
                <IdList ids={run.nodes} />
              </dd>
            </div>
            <div className="grid grid-cols-[104px_1fr] items-baseline gap-3 py-[5px]">
              <dt className="truncate text-[12.5px] text-muted-foreground">Findings raised</dt>
              <dd className="min-w-0 text-[12.5px] leading-snug">
                <IdList ids={run.findings} empty="None" />
              </dd>
            </div>
          </div>
        </div>

        {run.notes ? (
          <p className="max-w-3xl pt-3 text-[13px] leading-relaxed text-muted-foreground">
            {run.notes}
          </p>
        ) : null}

        {onComplete && run.state !== "Complete" ? (
          <div className="flex flex-wrap items-center gap-3 pt-4">
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
              <span className="min-w-0 flex-1 text-[12.5px] leading-snug text-warning">
                {blockedReason} A run cannot be completed until every step carries a result — the
                objective&rsquo;s executed value is taken from complete runs only.
              </span>
            ) : (
              <span className="text-[12.5px] text-muted-foreground">
                Every step carries a result, so the run can be closed. Its verdict then speaks for{" "}
                {run.procedure} in the objective&rsquo;s rollup, which takes the worst of the
                procedures written for it.
              </span>
            )}
          </div>
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
          <EmptyState
            title="No steps to record"
            description={`${run.procedure} is not in the procedure library, so this run has nothing to be judged against.`}
          />
        ) : (
          <div className="divide-y divide-border-subtle">
            {steps.map((step) => {
              const record = byStep.get(step.id);
              const result = record?.result ?? "Not run";
              const unevidenced = result !== "Not run" && (record?.evidence.length ?? 0) === 0;
              return (
                <div key={step.id} className="grid gap-x-6 gap-y-2 py-3 md:grid-cols-[1fr_1fr]">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Mono className="text-[11.5px] text-muted-foreground">{step.id}</Mono>
                      <Badge tone={stepResultTone[result]}>{result}</Badge>
                      <span className="tnum text-11 text-muted-foreground">
                        {record?.at ?? "—"}
                      </span>
                    </div>
                    <p className="mt-1 text-[13px] leading-relaxed">{step.action}</p>
                    <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">
                      Expected: {step.expected}
                    </p>
                  </div>
                  <div className="min-w-0">
                    <div className="text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
                      Observed
                    </div>
                    <p className="mt-1 text-[12.5px] leading-relaxed text-foreground">
                      {record?.observed ?? "—"}
                    </p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[12px]">
                      <span className="text-muted-foreground">Evidence</span>
                      <IdList ids={record?.evidence ?? []} empty="None collected" />
                      {unevidenced ? (
                        <Badge tone="warning" size="xs">
                          Recorded without the artifact the step demands
                        </Badge>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Section>
    </div>
  );
}

export function RunRail({ row }: { row: RunListRow }) {
  const { run, procedure, verdict } = row;
  return (
    <div>
      <RailGroup title="Run">
        <KeyValue label="Run">
          <Mono>{run.id}</Mono>
        </KeyValue>
        <KeyValue label="Procedure">
          <Mono>{run.procedure}</Mono>
        </KeyValue>
        <KeyValue label="Objective">
          {procedure ? <Mono>{procedure.objective}</Mono> : <Dash />}
        </KeyValue>
        <KeyValue label="Event">{run.event ? <Mono>{run.event}</Mono> : <Dash />}</KeyValue>
        <KeyValue label="State">
          <Badge tone={runStateTone[run.state]}>{run.state}</Badge>
        </KeyValue>
        <KeyValue label="Verdict">
          {verdict ? <ResultChip result={verdict.result} /> : <Dash />}
        </KeyValue>
        <KeyValue label="Retest of">
          {run.retestOf ? <Mono>{run.retestOf}</Mono> : <Dash />}
        </KeyValue>
      </RailGroup>

      <RailGroup title="Conduct">
        <KeyValue label="Operator">
          <Person name={run.operator} />
        </KeyValue>
        <KeyValue label="Witness">
          {run.witness === "—" ? <Dash /> : <Person name={run.witness} />}
        </KeyValue>
        <KeyValue label="Started">
          <span className="tnum">{run.started}</span>
        </KeyValue>
        <KeyValue label="Completed">
          <span className="tnum">{run.completed}</span>
        </KeyValue>
        <WrapValue label="Components">
          <IdList ids={run.nodes} />
        </WrapValue>
        <WrapValue label="Findings">
          <IdList ids={run.findings} empty="None raised" />
        </WrapValue>
      </RailGroup>

      <RailGroup title="Configuration">
        <ProseBlock label="Build">{run.build}</ProseBlock>
        <ProseBlock label="Deviations">{run.configuration}</ProseBlock>
      </RailGroup>
    </div>
  );
}

/* ── Regression ──────────────────────────────────────────────────────────── */

export function RegressionTable({ rows }: { rows: RegressionRow[] }) {
  if (rows.length === 0) {
    return (
      <EmptyState
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
          <Th>Procedure</Th>
          <Th>Step</Th>
          <Th>Prior run</Th>
          <Th>Prior result</Th>
          <Th>Current run</Th>
          <Th>Current result</Th>
          <Th>Movement</Th>
          <Th>Reading</Th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <Tr
            key={`${row.currentRun}|${row.step}`}
            className={cn(row.state === "Regressed" && "bg-danger-soft/40")}
          >
            <Td>
              <Mono>{row.procedure}</Mono>
            </Td>
            <Td>
              <Mono>{row.step}</Mono>
            </Td>
            <Td>
              <Mono>{row.priorRun}</Mono>
            </Td>
            <Td>
              <Badge tone={stepResultTone[row.priorResult]}>{row.priorResult}</Badge>
            </Td>
            <Td>
              <Mono>{row.currentRun}</Mono>
            </Td>
            <Td>
              <Badge tone={stepResultTone[row.currentResult]}>{row.currentResult}</Badge>
            </Td>
            <Td>
              <Badge tone={regressionStateTone[row.state]}>{row.state}</Badge>
            </Td>
            <Td className="truncate">
              {row.state === "Regressed"
                ? `${row.step} passed in ${row.priorRun} and fails in ${row.currentRun}.`
                : row.state === "Fixed"
                  ? `${row.step} failed in ${row.priorRun} and passes in ${row.currentRun}.`
                  : row.state === "Still failing"
                    ? `${row.step} has failed in both runs — the retest did not move it.`
                    : `${row.step} passed in both runs.`}
            </Td>
          </Tr>
        ))}
      </tbody>
    </Table>
  );
}
