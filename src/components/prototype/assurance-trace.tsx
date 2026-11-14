import { useMemo, type ReactNode } from "react";
import type { UseQueryResult } from "@tanstack/react-query";
import {
  Absent,
  Dot,
  Section,
  Stack,
  Stat,
  Trace,
  defineColumns,
  useDataTable,
  useLedgerLocale,
  type TraceNode,
  type TraceStage,
} from "@ledger/design-system";
import { ClipboardCheck } from "lucide-react";
import {
  TRACE_KINDS,
  openIssue,
  openRisk,
  shortOfSatisfied,
  traceKey,
  traceLinks,
  traceReach,
  traceTreatment,
  type AssuranceTrace,
  type TraceKind,
  type TraceRemediation,
} from "@/lib/assurance-trace";
import { useControlAssessment } from "@/lib/control-assessment";
import { useProgramControlStatus } from "@/lib/control-status";
import {
  determinations,
  operationalIssueStatuses,
  remediationStatuses,
  riskLevels,
  riskStatuses,
  severityLevels,
  statusEntry,
  statusLabel,
  statusTone,
  type StatusTone,
  type StatusVocabulary,
} from "@/lib/status";
import { isReaderFix, traceGapFixes, type StepPlans, type StepStanding } from "@/lib/next-steps";
import { useWorkspace } from "@/components/app/workspace";
import { NextStep, StepSurfaceHost } from "./next-step";
import { ProductCollection } from "./product-collection";
import { RecordLink, recordLink, useOpenRecord } from "./record-preview";
import { DueDate, QueryState, type QueryStatus } from "./work-common";

/*
 * A record's story band: what the record reaches, in numbers, then the chain it sits on, drawn.
 * The seven records of the chain open with it: a control, a requirement, an evidence artifact, an
 * assessment finding, an operational issue, a risk and a remediation item. Each stage's records
 * link to their pages, so the trace is also the way from one record of the chain to the next.
 */

/** Today in the reader's zone as a calendar day ("2026-11-10"), what a due day is compared with. */
export function useToday() {
  const { zonedParts } = useLedgerLocale();
  const { year, month, day } = zonedParts(Date.now());
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** A severity's mark: a dot in its tone, beside the word the node's line says. */
const severityMark = (severity: string | null): ReactNode =>
  severity ? <Dot tone={statusTone(severityLevels, severity)} /> : undefined;

/** A stored calendar day ("2026-12-29") as the kit's day: no zone moves it. */
function dayOf(value: string) {
  const [year = 0, month = 1, day = 1] = value.slice(0, 10).split("-").map(Number);
  return { year, month, day };
}

/** A severity and a status on one line: "Critical · Open". */
const standing = (severity: string | null, status: string, statuses: StatusVocabulary) =>
  [severity ? statusLabel(severityLevels, severity) : null, statusLabel(statuses, status)]
    .filter(Boolean)
    .join(" · ");

/** What a stage says when the trace finds nothing for it: the gap is part of the story. */
const emptyStage: Record<TraceKind, string> = {
  control: "No control met",
  requirement: "No requirement supported",
  evidence: "No evidence cited",
  finding: "No assessment finding",
  issue: "No operational issue",
  risk: "No risk recorded",
  remediation: "No remediation item",
};
const stageLabel: Record<TraceKind, string> = {
  control: "Controls",
  requirement: "Requirements",
  evidence: "Evidence",
  finding: "Assessment findings",
  issue: "Operational issues",
  risk: "Risks",
  remediation: "Remediation",
};

/**
 * Where a program stands on the control a trace is about, as its control status reads it: `known`
 * once the read has answered, `value` null where the control is not in the baseline. `plans` is
 * what the program's open campaigns hold of a control whose evidence waits on an assessor, once
 * read: its Assessment findings stage waits on it.
 */
type TraceStanding = {
  known: boolean;
  value: StepStanding | null;
  plans?: StepPlans | undefined;
};

/** A trace as the kit draws it: its seven stages, each record a link to its page, and the links. */
function useTraceStages(
  trace: AssuranceTrace | undefined,
  programId: string | null | undefined,
  controlStanding: TraceStanding,
  canWrite: boolean,
) {
  const { formatDate, formatDay } = useLedgerLocale();
  return useMemo(() => {
    if (!trace) return null;
    // A control opens inside the program its requirements belong to, when they share one; with no
    // requirement, inside the program of the record the trace is about.
    const programs = new Set(trace.requirements.map((requirement) => requirement.program_id));
    const own = <T extends { id: string; program_id: string | null }>(records: readonly T[]) =>
      records.find((record) => record.id === trace.focus.id)?.program_id ?? undefined;
    const focusProgram =
      trace.focus.kind === "finding"
        ? own(trace.findings)
        : trace.focus.kind === "issue"
          ? own(trace.issues)
          : trace.focus.kind === "risk"
            ? own(trace.risks)
            : undefined;
    const scope =
      programId ??
      (programs.size === 1 ? [...programs][0] : programs.size === 0 ? focusProgram : undefined);
    const short = { month: "short", day: "numeric" } as const;
    // A moment reads in the reader's zone; a due day is a calendar day, the same everywhere.
    const moment = (value: string) => formatDate(new Date(value), short);
    const day = (value: string) => formatDay(dayOf(value), short);
    const nodes: Record<TraceKind, TraceNode[]> = {
      control: trace.controls.map((control) => ({
        id: traceKey("control", control.id),
        code: control.code,
        title: control.title,
        link: recordLink("controls", { id: control.id, ...(scope ? { program_id: scope } : {}) }),
      })),
      requirement: trace.requirements.map((requirement) => ({
        id: traceKey("requirement", requirement.id),
        code: requirement.code,
        title: requirement.title,
        ...(requirement.evidence_count === 0
          ? { mark: <Dot tone="warning" />, meta: "No evidence" }
          : {}),
        link: recordLink("engineering_requirements", {
          id: requirement.id,
          program_id: requirement.program_id,
        }),
      })),
      evidence: trace.evidence.map((evidence) => ({
        id: traceKey("evidence", evidence.id),
        title: evidence.title,
        ...(evidence.collected_at ? { meta: `Collected ${moment(evidence.collected_at)}` } : {}),
        link: recordLink("evidence_artifacts", { id: evidence.id }),
      })),
      // The assessor's verdict in its tone and words, and when it was made; a finding of draft
      // results, only ever the record traced, says so instead.
      finding: trace.findings.map((finding) => ({
        id: traceKey("finding", finding.id),
        title: finding.title,
        mark: <Dot tone={statusTone(determinations, finding.determination)} />,
        meta: [
          statusLabel(determinations, finding.determination),
          finding.results_state === "draft"
            ? "Draft results"
            : finding.determined_at
              ? moment(finding.determined_at)
              : null,
        ]
          .filter(Boolean)
          .join(" · "),
        link: recordLink("assessment_findings", { id: finding.id }),
      })),
      issue: trace.issues.map((issue) => ({
        id: traceKey("issue", issue.id),
        title: issue.title,
        mark: severityMark(issue.severity),
        meta: standing(issue.severity, issue.status, operationalIssueStatuses),
        link: recordLink("operational_issues", { id: issue.id }),
      })),
      risk: trace.risks.map((risk) => ({
        id: traceKey("risk", risk.id),
        title: risk.title,
        mark: severityMark(risk.severity),
        meta: standing(risk.severity, risk.status, riskStatuses),
        link: recordLink("risks", { id: risk.id }),
      })),
      remediation: trace.remediation.map((item) => ({
        id: traceKey("remediation", item.id),
        title: item.title,
        meta: [
          statusLabel(remediationStatuses, item.status),
          item.completed_on
            ? `Done ${day(item.completed_on)}`
            : item.planned_on
              ? `Due ${day(item.planned_on)}`
              : null,
        ]
          .filter(Boolean)
          .join(" · "),
        link: recordLink("poam_items", { id: item.id }),
      })),
    };
    // A gap the reader can close from this record carries its fix, for a reader who may make it: a
    // link to where it is made, or, for a fix made on the control itself, the button that opens it
    // over the page. A control's requirements wait on where the program stands on it, since one its
    // product decided names the product assessment instead of a fix; its assessment findings wait
    // on what the program's open campaigns hold of it too.
    const fixes = new Map(
      traceGapFixes(trace, scope, controlStanding.value, controlStanding.plans)
        .filter((fix) => !isReaderFix(fix) || canWrite)
        .filter(
          (fix) =>
            !(
              trace.focus.kind === "control" &&
              (fix.stage === "requirement" || fix.stage === "finding")
            ) || controlStanding.known,
        )
        .map((fix) => [fix.stage, fix]),
    );
    // The control the trace is about, which a fix made on it works on.
    const focused =
      trace.focus.kind === "control"
        ? trace.controls.find((control) => control.id === trace.focus.id)
        : undefined;
    const stages: TraceStage[] = TRACE_KINDS.map((kind) => {
      const fix =
        kind === "control" || kind === "requirement" || kind === "evidence" || kind === "finding"
          ? fixes.get(kind)
          : undefined;
      return {
        id: kind,
        label: stageLabel[kind],
        nodes: nodes[kind],
        empty: emptyStage[kind],
        ...(fix && scope
          ? {
              action: (
                <NextStep
                  step={fix}
                  programId={scope}
                  control={
                    focused
                      ? { id: focused.id, code: focused.code, title: focused.title }
                      : undefined
                  }
                  canWrite={canWrite}
                  own={trace.focus.kind === "requirement"}
                  size="small"
                />
              ),
            }
          : {}),
      };
    });
    return {
      stages,
      links: traceLinks(trace),
      focus: traceKey(trace.focus.kind, trace.focus.id),
    };
  }, [trace, programId, controlStanding, canWrite, formatDate, formatDay]);
}

/** The highest severity among records, by the product's order. */
function worst(records: readonly { severity: string | null }[]) {
  let found: string | null = null;
  for (const record of records) {
    if (!record.severity) continue;
    const rank = statusEntry(severityLevels, record.severity)?.rank ?? -1;
    if (found === null || rank > (statusEntry(severityLevels, found)?.rank ?? -1))
      found = record.severity;
  }
  return found;
}

type Tile = {
  label: string;
  value: ReactNode;
  note?: string | undefined;
  tone?: StatusTone | undefined;
};

/** The band's numbers for a trace: what its focus is, what it rests on or reaches, and how its treatment stands. */
function useTiles(trace: AssuranceTrace | undefined, today: string): Tile[] {
  const { formatDate, formatDay, formatPlural } = useLedgerLocale();
  return useMemo(() => {
    if (!trace) return [];
    const reach = traceReach(trace);
    const treatment = traceTreatment(trace.remediation, today);
    const openIssues = trace.issues.filter((issue) => openIssue(issue.status));
    const openRisks = trace.risks.filter((risk) => openRisk(risk.status));
    const count = (value: number, one: string, other: string) =>
      formatPlural(value, { one: `{count} ${one}`, other: `{count} ${other}` });
    const families = reach.families.map((family) => family.code).join(", ");
    const reached: Tile = {
      label: "Controls reached",
      value: trace.controls.length,
      note:
        [families, reach.elements.length ? count(reach.elements.length, "element", "elements") : ""]
          .filter(Boolean)
          .join(" · ") || undefined,
    };
    const severe = (records: readonly { severity: string | null }[]) => {
      const level = worst(records);
      return level
        ? { note: `Worst ${statusLabel(severityLevels, level).toLowerCase()}`, level }
        : { note: undefined, level: null };
    };
    const issues = (label: string): Tile => {
      const { note, level } = severe(openIssues);
      return {
        label,
        value: openIssues.length,
        note,
        ...(level ? { tone: statusTone(severityLevels, level) } : {}),
      };
    };
    const risks = (label: string): Tile => {
      const { note, level } = severe(openRisks);
      return {
        label,
        value: openRisks.length,
        note,
        ...(level ? { tone: statusTone(severityLevels, level) } : {}),
      };
    };
    const milestones: Tile = treatment.milestones
      ? {
          label: "Milestones done",
          value: `${treatment.completed}/${treatment.milestones}`,
          note:
            [
              treatment.dueOn
                ? `Due ${formatDay(dayOf(treatment.dueOn), { month: "short", day: "numeric", year: "numeric" })}`
                : "",
              treatment.late ? `${treatment.late} late` : "",
            ]
              .filter(Boolean)
              .join(" · ") || undefined,
          ...(treatment.late || treatment.overdue ? { tone: "danger" as const } : {}),
        }
      : {
          label: "Remediation items",
          value: treatment.items,
          note: treatment.items ? count(treatment.open, "open", "open") : undefined,
        };
    const severityTile = (
      severity: string | null,
      note: string | undefined,
      absent: string,
    ): Tile => ({
      label: "Severity",
      value: severity ? statusLabel(severityLevels, severity) : absent,
      note,
      ...(severity ? { tone: statusTone(severityLevels, severity) } : {}),
    });
    // The evidence a trace reaches, and how much of it a reviewer has accepted.
    const accepted = trace.evidence.filter((evidence) => evidence.review === "accepted").length;
    const evidence: Tile = {
      label: "Evidence",
      value: trace.evidence.length,
      note: trace.evidence.length ? `${accepted} accepted` : undefined,
    };
    switch (trace.focus.kind) {
      case "risk": {
        const risk = trace.risks.find((item) => item.id === trace.focus.id);
        const rating = [
          risk?.likelihood ? `${statusLabel(riskLevels, risk.likelihood)} likelihood` : "",
          risk?.impact ? `${statusLabel(riskLevels, risk.impact).toLowerCase()} impact` : "",
        ]
          .filter(Boolean)
          .join(" · ");
        return [
          severityTile(risk?.severity ?? null, rating || undefined, "Not assessed"),
          issues("Open issues it rests on"),
          reached,
          milestones,
        ];
      }
      case "issue": {
        const issue = trace.issues.find((item) => item.id === trace.focus.id);
        return [
          severityTile(
            issue?.severity ?? null,
            issue ? statusLabel(operationalIssueStatuses, issue.status) : undefined,
            "Not rated",
          ),
          risks("Open risks"),
          reached,
          milestones,
        ];
      }
      case "evidence":
        return [
          {
            label: "Requirements supported",
            value: trace.requirements.length,
            note: trace.controls.length
              ? `${count(trace.controls.length, "control", "controls")}${families ? ` · ${families}` : ""}`
              : undefined,
          },
          issues("Open issues citing it"),
          risks("Open risks"),
          milestones,
        ];
      case "finding": {
        // The assessor's verdict, the controls it judges, what it led to and how that is treated.
        const finding = trace.findings.find((item) => item.id === trace.focus.id);
        const judgedIds = new Set(
          trace.links.control_finding
            .filter(([, judging]) => judging === trace.focus.id)
            .map(([control]) => control),
        );
        const judged = trace.controls.filter((control) => judgedIds.has(control.id));
        const when =
          finding?.results_state === "draft"
            ? "Draft results"
            : finding?.determined_at
              ? `Determined ${formatDate(new Date(finding.determined_at), { month: "short", day: "numeric", year: "numeric" })}`
              : undefined;
        return [
          {
            label: "Determination",
            value: finding ? statusLabel(determinations, finding.determination) : "Not recorded",
            note: when,
            ...(finding ? { tone: statusTone(determinations, finding.determination) } : {}),
          },
          {
            label: "Controls judged",
            value: judged.length,
            note: judged.map((control) => control.code).join(", ") || undefined,
          },
          risks("Open risks"),
          milestones,
        ];
      }
      case "control": {
        const evidenced = trace.requirements.filter(
          (requirement) => requirement.evidence_count > 0,
        ).length;
        // What assessors found short of satisfied on the control's parts, in published results;
        // its Requirements tile already says how many cite evidence.
        const short = trace.findings.filter((finding) => shortOfSatisfied(finding.determination));
        const worst = short.some((finding) => finding.determination === "other_than_satisfied")
          ? "other_than_satisfied"
          : short.length
            ? "partially_satisfied"
            : null;
        const findings: Tile = {
          label: "Findings short of satisfied",
          value: short.length,
          note: trace.findings.length
            ? formatPlural(trace.findings.length, {
                one: "of {count} finding",
                other: "of {count} findings",
              })
            : undefined,
          ...(worst ? { tone: statusTone(determinations, worst) } : {}),
        };
        return [
          {
            label: "Requirements",
            value: trace.requirements.length,
            note: trace.requirements.length ? `${evidenced} with evidence` : undefined,
            ...(trace.requirements.length && evidenced < trace.requirements.length
              ? { tone: "warning" as const }
              : {}),
          },
          findings,
          issues("Open issues"),
          risks("Open risks"),
        ];
      }
      case "requirement":
        // What the requirement meets, what supports it, and what was found against that support.
        return [
          { ...reached, label: "Controls met" },
          evidence,
          issues("Open issues"),
          risks("Open risks"),
        ];
      case "remediation": {
        // The item's own milestones: a trace from a remediation item holds no other item.
        const item = trace.remediation.find((entry) => entry.id === trace.focus.id);
        const day = (value: string) =>
          formatDay(dayOf(value), { month: "short", day: "numeric", year: "numeric" });
        const finished = item?.completed_on ? `Done ${day(item.completed_on)}` : undefined;
        const own: Tile = treatment.milestones
          ? { ...milestones, ...(finished ? { note: finished } : {}) }
          : {
              label: "Milestones",
              value: 0,
              note: finished ?? (treatment.dueOn ? `Due ${day(treatment.dueOn)}` : undefined),
              ...(treatment.overdue ? { tone: "danger" as const } : {}),
            };
        return [own, issues("Open issues it answers"), risks("Open risks"), reached];
      }
    }
  }, [trace, today, formatDate, formatDay, formatPlural]);
}

/** The band's labels for each kind of record, which hold their place while its trace loads. */
const tileLabels: Record<TraceKind, readonly string[]> = {
  control: ["Requirements", "Findings short of satisfied", "Open issues", "Open risks"],
  requirement: ["Controls met", "Evidence", "Open issues", "Open risks"],
  evidence: ["Requirements supported", "Open issues citing it", "Open risks", "Milestones done"],
  finding: ["Determination", "Controls judged", "Open risks", "Milestones done"],
  issue: ["Severity", "Open risks", "Controls reached", "Milestones done"],
  risk: ["Severity", "Open issues it rests on", "Controls reached", "Milestones done"],
  remediation: ["Milestones done", "Open issues it answers", "Open risks", "Controls reached"],
};

/**
 * The band a chain record opens with: up to four numbers that say where the record stands, then
 * its trace. It reads from the page's own trace query, so the sections under it draw the same
 * answer, and a failure is the page's one alert.
 */
export function TraceBand({
  trace,
  kind,
  name,
  programId,
}: {
  trace: UseQueryResult<AssuranceTrace, Error>;
  /** The kind of record the page is of, which names the numbers while the trace loads. */
  kind: TraceKind;
  /** The record in words, for the trace's name: "the risk Signing keys rotate without a record". */
  name: string;
  /** The program a control's trace is kept to, so its controls open inside that program. */
  programId?: string | null | undefined;
}) {
  const today = useToday();
  const tiles = useTiles(trace.data, today);
  const workspace = useWorkspace();
  // Where the program stands on a control decides what its empty requirements say: one its
  // product decided names the product assessment. The read the page's Details already share.
  const statuses = useProgramControlStatus(kind === "control" ? programId : null);
  const focusId = trace.data?.focus.id;
  const focusStanding =
    kind === "control" && programId && statuses.isSuccess
      ? (statuses.data.controls.find((control) => control.id === focusId) ?? null)
      : null;
  // Evidence nobody has determined waits on what the program's open campaigns hold of the control,
  // which the Details read too: its fix adds it to a draft plan, or plans an assessment around it.
  const waiting = focusStanding?.status === "not_assessed";
  const assessment = useControlAssessment(programId, focusId, { enabled: waiting });
  const controlStanding = useMemo<TraceStanding>(() => {
    if (kind !== "control" || !programId) return { known: true, value: null };
    if (!statuses.isSuccess) return { known: false, value: null };
    if (waiting && !assessment.data) return { known: false, value: focusStanding };
    return { known: true, value: focusStanding, plans: assessment.data };
  }, [kind, programId, statuses.isSuccess, focusStanding, waiting, assessment.data]);
  const drawn = useTraceStages(trace.data, programId, controlStanding, workspace.role !== "viewer");
  // While another record's trace loads, the numbers wait, and a chain still drawn from the record
  // before is marked busy: nothing of that record stands as this one's.
  const stale = trace.isPlaceholderData;
  const loading = stale || (trace.data === undefined && !trace.isError);
  // A trace that could not load keeps the band's place and says so; a number never reads as zero.
  const failed = trace.data === undefined && trace.isError;
  const held: Tile[] = tileLabels[kind].map((label) =>
    failed
      ? { label, value: <Absent label="Not available" />, note: "Could not load" }
      : { label, value: 0 },
  );
  return (
    <Stack space="space.250" className="min-w-0">
      <Stat.Grid frame="band" cols={4} aria-label={`Where ${name} stands`}>
        {(loading || failed ? held : tiles).map((tile: Tile) => (
          <Stat.Tile
            key={tile.label}
            label={tile.label}
            value={tile.value}
            note={tile.note}
            tone={tile.tone}
            isLoading={loading}
          />
        ))}
      </Stat.Grid>
      <Section title="Trace">
        {/* The trace holds what a fix opens, so it stays open while the stage under it fills. */}
        <StepSurfaceHost>
          <QueryState query={trace}>
            {drawn && (
              <Trace
                label={`The chain around ${name}`}
                aria-busy={stale || undefined}
                stages={drawn.stages}
                links={drawn.links}
                focus={drawn.focus}
              />
            )}
          </QueryState>
        </StepSurfaceHost>
      </Section>
    </Stack>
  );
}

type RemediationLine = TraceRemediation & { done: number; planned: number };

/** A remediation item's milestones that still count: a cancelled one is not planned. */
const remediationLine = (item: TraceRemediation): RemediationLine => {
  const milestones = item.milestones.filter((milestone) => milestone.status !== "cancelled");
  return {
    ...item,
    planned: milestones.length,
    done: milestones.filter(
      (milestone) => milestone.status === "completed" || !!milestone.completed_on,
    ).length,
  };
};

const remediationColumns = defineColumns<RemediationLine>((c) => [
  c.text("title", {
    header: "Remediation item",
    minWidth: 200,
    priority: 0,
    hideable: false,
    sortable: false,
    cell: (row) => (
      <RecordLink table="poam_items" record={row}>
        {row.title}
      </RecordLink>
    ),
  }),
  c.status("status", {
    header: "Status",
    width: 130,
    priority: 1,
    sortable: false,
    statuses: remediationStatuses,
  }),
  c.custom("milestones", {
    header: "Milestones",
    width: 120,
    priority: 3,
    cell: (row) => (row.planned ? `${row.done} of ${row.planned}` : "None"),
  }),
  c.custom("planned_on", {
    header: "Planned",
    // Wide enough for the day and where it stands ("Dec 29, 2026 · Due in 2 days") on one line.
    minWidth: 200,
    priority: 2,
    cell: (row) => (
      <DueDate
        value={row.completed_on ?? row.planned_on}
        done={row.status === "completed" || !!row.completed_on}
        cancelled={row.status === "cancelled" || row.status === "risk_accepted"}
      />
    ),
  }),
]);

/**
 * What is being done about the records of a trace: its remediation items in the order they are
 * due, each with its status, its milestones reached and its planned completion. Its order is its
 * meaning, so it has no search or sort; each item opens its own record.
 */
export function TraceRemediationSection({
  items,
  queries,
}: {
  items: readonly TraceRemediation[] | undefined;
  /** The trace's read: the section loads, and fails, with it. */
  queries: QueryStatus[];
}) {
  const open = useOpenRecord();
  const rows = useMemo(() => (items ?? []).map(remediationLine), [items]);
  const table = useDataTable({
    columns: remediationColumns,
    data: rows,
    getRowId: (row) => row.id,
    label: "Remediation",
    pinnable: false,
    hideable: false,
  });
  return (
    <Section title="Remediation" count={items ? rows.length : undefined} countMax={9999}>
      <ProductCollection
        compact
        keepQuestion={false}
        search={false}
        sort={false}
        table={table}
        queries={queries}
        onRowClick={(row) => open("poam_items", row)}
        empty={{
          title: "No remediation item",
          description:
            "A remediation item appears here once it answers an operational issue here, or its commitment cites a risk here.",
          icon: <ClipboardCheck />,
        }}
      />
    </Section>
  );
}
