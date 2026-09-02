/**
 * Cyber T&E phase presentation — the phase track, the gate, the adversary.
 *
 * Three things this file exists to make legible, and each of them is a doctrine
 * rather than a layout preference:
 *
 *  - **DT&E and OT&E are different regimes with different authorities.** The
 *    track is not six equal cards in a row. Phases 1–4 sit inside a
 *    developmental band the program runs; phases 5 and 6 sit inside an
 *    operational band the operational test agency runs and the program cannot
 *    waive. Flattening them into one strip would say the program can sign off
 *    its own adversarial assessment, which is exactly what it cannot do.
 *
 *  - **A gate criterion shows its arithmetic or its signature, never a tick.**
 *    `CriteriaTable` prints the whole computed sentence with the numbers in it
 *    and the ids the judgement rests on, and it separates `Derived` from
 *    `Attested` by accent, by icon and by label — because they fail differently.
 *    A Derived criterion that is unmet is a fact about the system; an Attested
 *    criterion with no signer is a fact about the paperwork, and an unsigned one
 *    is rendered as the gap it is rather than as a quiet grey row.
 *
 *  - **An attack chain without a path is a story.** `AttackChain` prints the
 *    ordered ATT&CK technique chain and then, beneath it, the actual walk
 *    through the composition graph — hop by hop, naming the reachability edge or
 *    the containment link that carries each step, the trust boundary it crosses
 *    and whether the hop has a redundant path. A step the graph cannot walk is
 *    called out in red rather than drawn as if it were real.
 *
 * Presentation only. Every number, sentence and verdict arrives as a prop from
 * `@/lib/te-phases`; nothing here evaluates a criterion or walks the graph.
 */

import { Fragment, useState } from "react";
import type { ReactNode } from "react";
import { ArrowRight, Calculator, CornerDownRight, PenLine, TriangleAlert } from "lucide-react";

import { Badge, Button, Card, Table, type Tone, Id } from "@/components/app/ui";
import {
  effectTone,
  phaseStateTone,
  scenarioStatusTone,
  type CriterionKind,
  type CriterionResult,
  type MissionEffect,
  type PhaseCriterion,
  type PhaseReadiness,
  type TePhase,
  type TePhaseId,
  type ThreatScenario,
} from "@/lib/te-phases";
import { cn } from "@/lib/utils";

/* ── Shared bits ─────────────────────────────────────────────────────────── */

function Dash() {
  return <span className="text-muted-foreground">—</span>;
}

/** A short label above a value or a paragraph. The house eyebrow. */
function Eyebrow({ children, tone = "neutral" }: { children: ReactNode; tone?: Tone }) {
  return (
    <div
      className={cn(
        "text-[11px] font-medium uppercase tracking-[0.06em]",
        tone === "danger"
          ? "text-danger"
          : tone === "warning"
            ? "text-warning"
            : tone === "success"
              ? "text-success"
              : tone === "info"
                ? "text-primary"
                : "text-muted-foreground",
      )}
    >
      {children}
    </div>
  );
}

function IdChips({ ids, tone = "neutral" }: { ids: string[]; tone?: Tone }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {ids.map((id) => (
        <Badge key={id} tone={tone}>
          <span className="text-[11.5px]">{id}</span>
        </Badge>
      ))}
    </div>
  );
}

/** A capped list with an honest "showing N of M" control. */
function useCap<T>(rows: T[], initial: number) {
  const [expanded, setExpanded] = useState(false);
  const shown = expanded ? rows : rows.slice(0, initial);
  const hidden = rows.length - shown.length;
  return { shown, hidden, expanded, toggle: () => setExpanded((v) => !v) };
}

/**
 * A tier is a property of the portrayal, not a posture — a tier VI adversary is
 * not "worse news" than a tier II one, it is a different assumption about who is
 * attacking. So it stays neutral and never borrows the CAT I red.
 */
export function TierChip({ tier }: { tier: string }) {
  return (
    <Badge size="xs">
      <span className="tracking-[0.04em]">Tier {tier}</span>
    </Badge>
  );
}

export function PhaseStateChip({ phase }: { phase: TePhase }) {
  return <Badge tone={phaseStateTone[phase.state]}>{phase.state}</Badge>;
}

/** Entry 2/2 · Exit 0/1 — green only when the whole set is met. */
function GateCount({ label, met, total }: { label: string; met: number; total: number }) {
  const tone: Tone = total === 0 ? "neutral" : met === total ? "success" : "warning";
  return (
    <span className="flex items-center gap-1 text-[12px]">
      <span className="text-muted-foreground">{label}</span>
      <Badge size="xs" tone={tone}>
        <span className="tnum">
          {met}/{total}
        </span>
      </Badge>
    </span>
  );
}

/* ── PhaseTrack ──────────────────────────────────────────────────────────── */

/**
 * The two regimes, stated once, in the language of who holds the authority.
 * They sit above the phases they govern so the split cannot be missed.
 */
const regimes: { kind: TePhase["kind"]; title: string; authority: string; blurb: string }[] = [
  {
    kind: "Developmental",
    title: "Developmental test & evaluation",
    authority: "Program manager",
    blurb:
      "Phases 1–4 are run by or for the developer, on the developer's schedule, to find and fix what is wrong before anyone else has to live with it. CVI is cooperative and white-box — the system owner is in the room. The ACD red cell is adversarial but still developmental: it works under the program's rules of engagement and reports to the program.",
  },
  {
    kind: "Operational",
    title: "Operational test & evaluation",
    authority: "Operational test agency",
    blurb:
      "Phases 5 and 6 are run independently of the program, on a production-representative configuration, with operators in the loop. CVPA is cooperative and hands the AA team a scoped surface. The AA is scored in mission effect — what the adversary did to the mission — not in findings count, and the program cannot waive its result.",
  },
];

export function PhaseTrack({
  phases,
  readiness,
  selected,
  onSelect,
  campaignName,
}: {
  phases: TePhase[];
  /** Live readiness per phase, keyed by phase id. Missing entries render as "—". */
  readiness: Map<TePhaseId, PhaseReadiness>;
  selected?: TePhaseId | null;
  onSelect?: (id: TePhaseId) => void;
  /** Resolves a TC- id to its campaign name for the row title. */
  campaignName?: (id: string) => string;
}) {
  return (
    <div className="space-y-5 pt-4">
      {regimes.map((regime) => {
        const band = phases.filter((p) => p.kind === regime.kind);
        if (band.length === 0) return null;
        const operational = regime.kind === "Operational";
        return (
          <section
            key={regime.kind}
            className={cn(
              "rounded-lg border",
              operational ? "border-primary/25 bg-primary-soft/25" : "border-border bg-subtle/60",
            )}
          >
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-border px-4 py-2.5">
              <h3 className="text-[12.5px] font-semibold">{regime.title}</h3>
              <Badge size="xs" tone={operational ? "info" : "neutral"}>
                {operational ? "OT&E" : "DT&E"}
              </Badge>
              <span className="text-[12px] text-muted-foreground">
                Authority: <span className="font-medium text-foreground">{regime.authority}</span>
              </span>
              <span className="tnum ml-auto text-[12px] text-muted-foreground">
                {band.length} of {phases.length} phases
              </span>
            </div>
            <p className="px-4 pt-2.5 text-[12.5px] leading-relaxed text-muted-foreground">
              {regime.blurb}
            </p>
            <div className="space-y-2 p-3">
              {band.map((phase) => (
                <PhaseCard
                  key={phase.id}
                  phase={phase}
                  readiness={readiness.get(phase.id) ?? null}
                  selected={selected === phase.id}
                  {...(onSelect ? { onSelect: () => onSelect(phase.id) } : {})}
                  {...(campaignName ? { campaignName } : {})}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function PhaseCard({
  phase,
  readiness,
  selected,
  onSelect,
  campaignName,
}: {
  phase: TePhase;
  readiness: PhaseReadiness | null;
  selected: boolean;
  onSelect?: () => void;
  campaignName?: (id: string) => string;
}) {
  const blocked = readiness !== null && readiness.blocker !== "—";

  const body = (
    <>
      <span className="flex items-start gap-3">
        <span
          className={cn(
            "tnum mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-full text-[12px] font-semibold ring-1 ring-inset",
            phase.state === "Complete"
              ? "bg-success-soft text-success ring-success/25"
              : "bg-card text-muted-foreground ring-border-strong",
          )}
        >
          {phase.n}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <span className="text-[13px] font-semibold">{phase.short}</span>
            <Id className="text-muted-foreground">{phase.id}</Id>
            <span className="min-w-0 truncate text-[12px] text-muted-foreground">{phase.name}</span>
            <span className="ml-auto flex shrink-0 items-center gap-2">
              {readiness ? (
                <>
                  <GateCount label="Entry" met={readiness.entryMet} total={readiness.entryTotal} />
                  <GateCount label="Exit" met={readiness.exitMet} total={readiness.exitTotal} />
                </>
              ) : null}
              <PhaseStateChip phase={phase} />
            </span>
          </span>

          <span className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-muted-foreground">
            <span className="tnum">{phase.window}</span>
            <span>{phase.lead}</span>
            <span>
              Informs <span className="text-foreground">{phase.gate}</span>
            </span>
            <span className="flex items-center gap-1.5">
              {phase.campaigns.length === 0 ? (
                <span>No campaign — this phase produces a record, not an execution</span>
              ) : (
                phase.campaigns.map((id) => (
                  <Badge key={id} size="xs">
                    <span className="text-[11.5px]" title={campaignName?.(id) ?? id}>
                      {id}
                    </span>
                  </Badge>
                ))
              )}
            </span>
          </span>

          {readiness ? (
            <span
              className={cn(
                "mt-1.5 block truncate text-[12px]",
                blocked ? "text-warning" : "text-success",
              )}
              title={readiness.blocker === "—" ? undefined : readiness.blocker}
            >
              {blocked
                ? `Blocking — ${readiness.blocker}`
                : readiness.canExit
                  ? "Every entry and exit criterion is met as of today."
                  : "No criterion is unmet."}
            </span>
          ) : null}
        </span>
      </span>
    </>
  );

  const shell = cn(
    "block w-full rounded-md border px-3 py-2.5 text-left transition-colors duration-100",
    selected
      ? "border-primary/40 bg-card shadow-hairline"
      : "border-border bg-card hover:bg-surface-hover",
  );

  if (!onSelect) return <div className={shell}>{body}</div>;
  return (
    <button type="button" onClick={onSelect} className={shell} aria-pressed={selected}>
      {body}
    </button>
  );
}

/* ── PhaseReadinessSummary ───────────────────────────────────────────────── */

function Tile({
  label,
  value,
  note,
  tone = "neutral",
}: {
  label: string;
  value: string;
  note: string;
  tone?: Tone;
}) {
  return (
    <div className="bg-background px-4 py-3">
      <div className="text-[12px] text-muted-foreground">{label}</div>
      <div
        className={cn(
          "tnum mt-0.5 text-[20px] font-semibold tracking-[-0.02em]",
          tone === "danger"
            ? "text-danger"
            : tone === "warning"
              ? "text-warning"
              : tone === "success"
                ? "text-success"
                : "",
        )}
      >
        {value}
      </div>
      <div className="mt-0.5 text-[12px] leading-snug text-muted-foreground">{note}</div>
    </div>
  );
}

/**
 * The verdict, and above everything else the ONE sentence that is stopping the
 * gate. A reader who takes nothing else off this page should still be able to
 * say what is in the way and which record proves it.
 */
export function PhaseReadinessSummary({
  phase,
  readiness,
  criteria,
}: {
  phase: TePhase;
  readiness: PhaseReadiness;
  criteria: PhaseCriterion[];
}) {
  const derived = criteria.filter((c) => c.basis === "Derived");
  const attested = criteria.filter((c) => c.basis === "Attested");
  const unsigned = attested.filter((c) => c.attestedBy === "—" || c.attestedOn === "—");

  const verdict = readiness.canExit
    ? {
        tone: "success" as Tone,
        head: `${phase.id} meets every criterion it has`,
        text: `All ${readiness.entryTotal} entry and ${readiness.exitTotal} exit criteria are met when re-read against today's register. The phase can close, and the ${derived.length} derived criteria will say so again on their own the next time anything underneath them moves.`,
      }
    : readiness.canEnter
      ? {
          tone: "warning" as Tone,
          head: `${phase.id} can be entered but cannot be closed`,
          text: `Entry is satisfied ${readiness.entryMet}/${readiness.entryTotal}; exit is ${readiness.exitMet}/${readiness.exitTotal}. The phase is legitimately in execution — what is below is the work between here and its gate, not a defect in the record.`,
        }
      : {
          tone: "danger" as Tone,
          head: `${phase.id} does not meet its entry criteria`,
          text: `Entry is satisfied ${readiness.entryMet}/${readiness.entryTotal}. ${
            phase.state === "Complete"
              ? "The phase is recorded Complete and was signed off on its own evidence at the time. Re-read against today's register it no longer passes — that divergence is reported, not reconciled away."
              : "Work executed before entry is met is work whose result the gate cannot stand behind."
          }`,
        };

  return (
    <div className="space-y-4 pt-4">
      <div
        className={cn(
          "rounded-lg border px-4 py-3",
          verdict.tone === "success"
            ? "border-success/30 bg-success-soft/40"
            : verdict.tone === "warning"
              ? "border-warning/30 bg-warning-soft/40"
              : "border-danger/30 bg-danger-soft/40",
        )}
      >
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <h3 className="text-[13px] font-semibold">{verdict.head}</h3>
          <PhaseStateChip phase={phase} />
          <span className="ml-auto text-[12px] text-muted-foreground">
            Evaluated against the register as it stands today
          </span>
        </div>
        <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted-foreground">{verdict.text}</p>

        <div className="mt-3 rounded-md border border-border bg-card px-3 py-2.5">
          <Eyebrow tone={readiness.blocker === "—" ? "success" : "danger"}>
            {readiness.blocker === "—" ? "Nothing blocking" : "Blocking"}
          </Eyebrow>
          <p className="mt-1 text-[12.5px] leading-relaxed text-foreground">
            {readiness.blocker === "—"
              ? "No criterion on this phase is unmet. Every derived sentence below was recomputed for this render; none of them is a stored verdict."
              : readiness.blocker}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-px border-y border-border bg-border md:grid-cols-5">
        <Tile
          label="Entry"
          value={`${readiness.entryMet}/${readiness.entryTotal}`}
          note="criteria met"
          tone={readiness.canEnter ? "success" : "danger"}
        />
        <Tile
          label="Exit"
          value={`${readiness.exitMet}/${readiness.exitTotal}`}
          note="criteria met"
          tone={readiness.canExit ? "success" : "warning"}
        />
        <Tile
          label="Derived"
          value={`${derived.length}`}
          note="computed from the record"
          tone="neutral"
        />
        <Tile
          label="Attested"
          value={`${attested.length}`}
          note="a person has to sign"
          tone="neutral"
        />
        <Tile
          label="Unsigned"
          value={`${unsigned.length}`}
          note={unsigned.length === 0 ? "every attestation on file" : "attestation missing"}
          tone={unsigned.length === 0 ? "success" : "danger"}
        />
      </div>
    </div>
  );
}

/* ── CriteriaTable ───────────────────────────────────────────────────────── */

function BasisChip({ criterion }: { criterion: PhaseCriterion }) {
  if (criterion.basis === "Derived") {
    return (
      <Badge tone="info" icon={<Calculator className="size-3" />}>
        Derived
      </Badge>
    );
  }
  const signed = criterion.attestedBy !== "—" && criterion.attestedOn !== "—";
  return (
    <Badge tone={signed ? "neutral" : "danger"} icon={<PenLine className="size-3" />}>
      {signed ? "Attested" : "Attested — unsigned"}
    </Badge>
  );
}

/**
 * One criterion, whole. The statement, then what the platform actually did
 * about it, then the ids it did it from.
 *
 * The accent is the tell: a Derived criterion carries the primary rule down its
 * left edge because it is arithmetic a reader can re-run; an Attested one
 * carries a dashed neutral rule because it is a promise, and an unsigned one
 * carries a red rule because it is a promise nobody has made.
 */
function CriterionRow({
  criterion,
  result,
}: {
  criterion: PhaseCriterion;
  result: CriterionResult | null;
}) {
  const derivedBasis = criterion.basis === "Derived";
  const signed = criterion.attestedBy !== "—" && criterion.attestedOn !== "—";
  const met = result?.met ?? false;
  const unsignedAttestation = !derivedBasis && !signed;

  return (
    <li
      className={cn(
        "border-l-2 py-3 pl-3.5",
        derivedBasis
          ? met
            ? "border-success/50"
            : "border-primary/50"
          : unsignedAttestation
            ? "border-danger"
            : "border-dashed border-border-strong",
      )}
    >
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <Id>{criterion.id}</Id>
        <Badge size="xs">{criterion.kind}</Badge>
        <BasisChip criterion={criterion} />
        <span className="ml-auto flex items-center gap-2">
          <Badge tone={met ? "success" : "danger"}>{met ? "Met" : "Not met"}</Badge>
        </span>
      </div>

      <p className="mt-1.5 text-[12.5px] leading-relaxed text-foreground">{criterion.statement}</p>

      <div
        className={cn(
          "mt-2 rounded-md border px-3 py-2",
          derivedBasis
            ? met
              ? "border-success/25 bg-success-soft/30"
              : "border-warning/30 bg-warning-soft/30"
            : unsignedAttestation
              ? "border-danger/30 bg-danger-soft/40"
              : "border-border bg-subtle",
        )}
      >
        <Eyebrow tone={derivedBasis ? "info" : unsignedAttestation ? "danger" : "neutral"}>
          {derivedBasis
            ? "Computed now"
            : unsignedAttestation
              ? "No signature on file"
              : "Signature on file"}
        </Eyebrow>
        <p className="mt-1 text-[12.5px] leading-relaxed text-foreground">
          {result ? result.finding : "This criterion was not evaluated for this program."}
        </p>

        {derivedBasis ? (
          <p className="mt-1.5 flex items-start gap-1.5 text-[12px] leading-relaxed text-muted-foreground">
            <CornerDownRight className="mt-0.5 size-3 shrink-0" />
            <span>
              <span className="font-medium text-foreground">From </span>
              {criterion.derivation}
            </span>
          </p>
        ) : (
          <p className="mt-1.5 flex flex-wrap items-start gap-x-3 gap-y-1 text-[12px] leading-relaxed text-muted-foreground">
            <CornerDownRight className="mt-0.5 size-3 shrink-0" />
            <span>
              Signer{" "}
              <span className={signed ? "font-medium text-foreground" : "font-medium text-danger"}>
                {criterion.attestedBy}
              </span>
            </span>
            <span>
              Dated{" "}
              <span
                className={cn(
                  "tnum",
                  signed ? "font-medium text-foreground" : "font-medium text-danger",
                )}
              >
                {criterion.attestedOn}
              </span>
            </span>
            {signed ? null : <span>Both fields a signature would fill are empty.</span>}
          </p>
        )}
      </div>

      <div className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-1.5">
        <Eyebrow>Evidence</Eyebrow>
        {result && result.evidence.length > 0 ? (
          <IdChips ids={result.evidence} tone={met ? "neutral" : "warning"} />
        ) : (
          <span className="text-[12px] text-muted-foreground">
            {derivedBasis
              ? "None — this judgement rests on the absence of a record rather than on any one record."
              : "None — an attestation carries a signature, not an artifact id."}
          </span>
        )}
      </div>
    </li>
  );
}

export function CriteriaTable({
  criteria,
  results,
  kind,
}: {
  criteria: PhaseCriterion[];
  /** Evaluated results keyed by criterion id. A missing entry renders as unevaluated. */
  results: Map<string, CriterionResult>;
  kind: CriterionKind;
}) {
  const scoped = criteria.filter((c) => c.kind === kind);
  const derived = scoped.filter((c) => c.basis === "Derived").length;
  const attested = scoped.length - derived;
  const met = scoped.filter((c) => results.get(c.id)?.met === true).length;

  if (scoped.length === 0) {
    return (
      <p className="pt-4 text-[12.5px] text-muted-foreground">
        No {kind.toLowerCase()} criterion is authored for this phase.
      </p>
    );
  }

  return (
    <div className="pt-3">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 pb-1 text-[12px] text-muted-foreground">
        <span className="tnum">
          <span
            className={cn("font-medium", met === scoped.length ? "text-success" : "text-warning")}
          >
            {met}
          </span>{" "}
          of {scoped.length} met
        </span>
        <span className="tnum">
          {derived} derived · {attested} attested
        </span>
      </div>
      <ul className="divide-y divide-border-subtle">
        {scoped.map((c) => (
          <CriterionRow key={c.id} criterion={c} result={results.get(c.id) ?? null} />
        ))}
      </ul>
    </div>
  );
}

/* ── ScenarioTable ───────────────────────────────────────────────────────── */

export function ScenarioTable({
  scenarios,
  selected,
  onSelect,
  phaseShort,
  showPhase = false,
}: {
  scenarios: ThreatScenario[];
  selected?: string | null;
  onSelect?: (id: string) => void;
  /** Resolves PH- to its short name for the phase column. */
  phaseShort?: (id: TePhaseId) => string;
  showPhase?: boolean;
}) {
  if (scenarios.length === 0) {
    return (
      <p className="pt-4 text-[12.5px] text-muted-foreground">
        No threat scenario is written against this phase.
      </p>
    );
  }

  return (
    <Table className="table-fixed">
      <colgroup>
        <col style={{ width: "92px" }} />
        <col />
        {showPhase ? <col style={{ width: "104px" }} /> : null}
        <col style={{ width: "68px" }} />
        <col style={{ width: "168px" }} />
        <col style={{ width: "128px" }} />
        <col style={{ width: "84px" }} />
        <col style={{ width: "88px" }} />
        <col style={{ width: "118px" }} />
      </colgroup>
      <thead>
        <tr>
          <Table.Header>Scenario</Table.Header>
          <Table.Header>Name</Table.Header>
          {showPhase ? <Table.Header>Phase</Table.Header> : null}
          <Table.Header>Tier</Table.Header>
          <Table.Header>Mission function</Table.Header>
          <Table.Header>Chain</Table.Header>
          <Table.Header className="text-right">Path</Table.Header>
          <Table.Header>Event</Table.Header>
          <Table.Header>Status</Table.Header>
        </tr>
      </thead>
      <tbody>
        {scenarios.map((s) => {
          const ics = s.chain.some((step) => step.matrix === "ICS");
          const first = s.chain[0];
          const last = s.chain[s.chain.length - 1];
          const chainTitle = s.chain.map((step) => `${step.id} ${step.name}`).join(" → ");
          return (
            <Table.Row
              key={s.id}
              className={cn(
                onSelect ? "cursor-pointer" : "",
                selected === s.id ? "bg-muted/50" : "",
              )}
              onClick={onSelect ? () => onSelect(s.id) : undefined}
            >
              <Table.Cell>
                <Id className={onSelect ? "text-primary" : "text-muted-foreground"}>{s.id}</Id>
              </Table.Cell>
              <Table.Cell className="truncate" title={`${s.name} — ${s.objective}`}>
                {s.name}
              </Table.Cell>
              {showPhase ? (
                <Table.Cell className="truncate">
                  {phaseShort ? phaseShort(s.phase) : s.phase}
                </Table.Cell>
              ) : null}
              <Table.Cell>
                <TierChip tier={s.tier} />
              </Table.Cell>
              <Table.Cell className="truncate" title={s.missionFunction}>
                {s.missionFunction}
              </Table.Cell>
              <Table.Cell className="truncate" title={chainTitle}>
                <span className="flex items-center gap-1.5">
                  <span className="tnum text-muted-foreground">{s.chain.length}</span>
                  <span className="min-w-0 truncate text-[12px] text-muted-foreground">
                    {first ? first.tactic : "—"}
                    {last && first && last.tactic !== first.tactic ? ` → ${last.tactic}` : ""}
                  </span>
                  {ics ? (
                    <Badge size="xs" tone="info">
                      ICS
                    </Badge>
                  ) : null}
                </span>
              </Table.Cell>
              <Table.Cell className="tnum text-right" title={s.path.join(" → ")}>
                {s.path.length} nodes
              </Table.Cell>
              <Table.Cell>{s.event ? <Id>{s.event}</Id> : <Dash />}</Table.Cell>
              <Table.Cell>
                <Badge tone={scenarioStatusTone[s.status]}>{s.status}</Badge>
              </Table.Cell>
            </Table.Row>
          );
        })}
      </tbody>
    </Table>
  );
}

/* ── AttackChain ─────────────────────────────────────────────────────────── */

/** One node on a scenario path, resolved against the composition graph. */
export type ChainNode = {
  id: string;
  /** "—" when the path names a node the graph does not carry. */
  name: string;
  kind: string;
  zone: string;
  criticality: string;
  /** True when the id resolves to nothing in the graph. */
  missing: boolean;
};

/** How the adversary gets from one node to the next. */
export type ChainHop = {
  from: string;
  to: string;
  /** "Edge" — a reachability edge. "Containment" — down into a part. */
  via: "Edge" | "Containment" | "Unwalkable";
  /** "Flows to" for an edge, "Contains" for containment. */
  kind: string;
  /** The edge's protocol/data label, or "—". */
  label: string;
  /** No redundant path exists for this hop. */
  critical: boolean;
  /** The hop leaves one trust zone for a more trusted one. */
  crossesBoundary: boolean;
};

const zoneTone: Record<string, Tone> = {
  Public: "danger",
  DMZ: "warning",
  Enclave: "neutral",
  Management: "info",
  Isolated: "success",
};

function TechniqueStep({ step, n }: { step: ThreatScenario["chain"][number]; n: number }) {
  return (
    <div className="min-w-[168px] flex-1 rounded-md border border-border bg-card px-2.5 py-2">
      <div className="flex items-center gap-1.5">
        <span className="tnum inline-flex size-4 items-center justify-center rounded-full bg-muted text-[10px] font-semibold text-muted-foreground">
          {n}
        </span>
        <span className="min-w-0 truncate text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
          {step.tactic}
        </span>
        {step.matrix === "ICS" ? (
          <Badge size="xs" tone="info" className="ml-auto">
            ICS
          </Badge>
        ) : null}
      </div>
      <div className="mt-1 flex items-baseline gap-1.5">
        <Id>{step.id}</Id>
      </div>
      <div className="mt-0.5 text-[12.5px] font-medium leading-snug">{step.name}</div>
    </div>
  );
}

/**
 * The chain and the walk, in that order and on the same card.
 *
 * A technique list on its own is a story about an adversary. The graph path
 * underneath it is what makes it a claim about THIS system: every hop names the
 * reachability edge or the containment link that carries it, so a reader can go
 * to the composition page and check it.
 */
export function AttackChain({
  scenario,
  path,
  hops,
  effects = [],
}: {
  scenario: ThreatScenario;
  /** The scenario's path resolved to graph nodes, in order. */
  path: ChainNode[];
  /** One hop per consecutive pair — `path.length - 1` entries. */
  hops: ChainHop[];
  /** Mission effects recorded against this scenario, for the footer line. */
  effects?: MissionEffect[];
}) {
  const unwalkable = hops.filter((h) => h.via === "Unwalkable");
  const boundaries = hops.filter((h) => h.crossesBoundary).length;
  const entry = path[0] ?? null;

  return (
    <Card className="p-4">
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <Id>{scenario.id}</Id>
        <h3 className="text-[13.5px] font-semibold">{scenario.name}</h3>
        <TierChip tier={scenario.tier} />
        <Badge tone={scenarioStatusTone[scenario.status]}>{scenario.status}</Badge>
        <span className="ml-auto text-[12px] text-muted-foreground">
          {scenario.event ? (
            <>
              Executed by <Id className="text-muted-foreground">{scenario.event}</Id>
            </>
          ) : (
            "No test event assigned"
          )}
        </span>
      </div>

      <div className="mt-2">
        <Eyebrow>Adversary objective</Eyebrow>
        <p className="mt-1 text-[12.5px] leading-relaxed text-foreground">{scenario.objective}</p>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-muted-foreground">
        <span>
          Mission function at risk:{" "}
          <span className="font-medium text-foreground">{scenario.missionFunction}</span>
        </span>
        <span>
          Assumed start: <Id className="text-muted-foreground">{scenario.entryPoint}</Id>
          {entry && !entry.missing ? ` — ${entry.name}` : ""}
        </span>
        <span className="tnum">
          {scenario.chain.length} techniques · {path.length} nodes · {boundaries} trust{" "}
          {boundaries === 1 ? "boundary" : "boundaries"} crossed
        </span>
      </div>

      {/* The chain */}
      <div className="mt-4">
        <Eyebrow tone="info">ATT&amp;CK chain — in order</Eyebrow>
        <div className="mt-2 flex flex-wrap items-stretch gap-1.5">
          {scenario.chain.map((step, i) => (
            <div key={`${step.id}-${i}`} className="flex min-w-[168px] flex-1 items-center gap-1.5">
              <TechniqueStep step={step} n={i + 1} />
              {i < scenario.chain.length - 1 ? (
                <ArrowRight className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
              ) : null}
            </div>
          ))}
        </div>
      </div>

      {/* The walk */}
      <div className="mt-4">
        <Eyebrow tone="info">Through the composition graph</Eyebrow>
        <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">
          Each step below is either a reachability edge in the direction of travel or a containment
          link into what a component is made of. Both are ways an adversary actually moves; a step
          that is neither would be a fabricated path, and is called out as one.
        </p>

        {unwalkable.length > 0 ? (
          <div className="mt-2 flex items-start gap-2 rounded-md border border-danger/30 bg-danger-soft/40 px-3 py-2">
            <TriangleAlert className="mt-0.5 size-3.5 shrink-0 text-danger" />
            <p className="text-[12.5px] leading-relaxed text-foreground">
              {unwalkable.length} {unwalkable.length === 1 ? "step is" : "steps are"} not
              traversable in the composition graph —{" "}
              {unwalkable.map((h) => `${h.from} → ${h.to}`).join(", ")}. The scenario cannot be
              executed as written against this system.
            </p>
          </div>
        ) : null}

        <ol className="mt-2.5">
          {path.map((node, i) => {
            const hop = i > 0 ? (hops[i - 1] ?? null) : null;
            const previous = i > 0 ? (path[i - 1] ?? null) : null;
            return (
              <li key={`${node.id}-${i}`}>
                {hop ? (
                  <div className="flex items-stretch gap-3 pl-[11px]">
                    <span
                      className={cn(
                        "w-px shrink-0",
                        hop.via === "Unwalkable" ? "bg-danger" : "bg-border-strong",
                      )}
                      aria-hidden
                    />
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 py-1.5 text-[12px]">
                      {hop.via === "Unwalkable" ? (
                        <Badge size="xs" tone="danger">
                          No path in the graph
                        </Badge>
                      ) : (
                        <Badge size="xs" tone="neutral">
                          {hop.kind}
                        </Badge>
                      )}
                      {hop.label !== "—" ? (
                        <span className="text-muted-foreground">{hop.label}</span>
                      ) : null}
                      {hop.crossesBoundary && previous ? (
                        <Badge size="xs" tone="warning">
                          Crosses {previous.zone} → {node.zone}
                        </Badge>
                      ) : null}
                      {hop.critical ? (
                        <span className="text-muted-foreground">
                          No redundant path — this hop is the only one
                        </span>
                      ) : null}
                    </div>
                  </div>
                ) : null}

                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      "inline-flex size-[22px] shrink-0 items-center justify-center rounded-full text-[10px] font-semibold ring-1 ring-inset",
                      i === 0
                        ? "bg-warning-soft text-warning ring-warning/30"
                        : i === path.length - 1
                          ? "bg-danger-soft text-danger ring-danger/25"
                          : "bg-muted text-muted-foreground ring-border-strong",
                    )}
                  >
                    {i + 1}
                  </span>
                  <span className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-0.5">
                    <Id className="text-muted-foreground">{node.id}</Id>
                    <span className="text-[12.5px] font-medium">
                      {node.missing ? "Not in the graph" : node.name}
                    </span>
                    <Badge size="xs" tone={node.missing ? "danger" : "neutral"}>
                      {node.kind}
                    </Badge>
                    <Badge size="xs" tone={zoneTone[node.zone] ?? "neutral"}>
                      {node.zone}
                    </Badge>
                    <span className="text-[12px] text-muted-foreground">{node.criticality}</span>
                    {i === 0 ? (
                      <span className="text-[12px] text-muted-foreground">— assumed foothold</span>
                    ) : null}
                    {i === path.length - 1 ? (
                      <span className="text-[12px] text-muted-foreground">— objective</span>
                    ) : null}
                  </span>
                </div>
              </li>
            );
          })}
        </ol>
      </div>

      <div className="mt-4 border-t border-border pt-3">
        <Eyebrow>Assessor note</Eyebrow>
        <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">{scenario.note}</p>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-[12px] text-muted-foreground">
        <Eyebrow>Mission effect</Eyebrow>
        {effects.length === 0 ? (
          <span>
            {scenario.status === "Executed"
              ? "Executed, with no mission effect recorded against it."
              : "None — the scenario has not been executed, so there is nothing to score."}
          </span>
        ) : (
          effects.map((e) => (
            <Badge key={e.id} tone={effectTone[e.effect]}>
              {e.id} — {e.effect}
            </Badge>
          ))
        )}
      </div>
    </Card>
  );
}

/* ── MissionEffectTable ──────────────────────────────────────────────────── */

/**
 * An adversarial assessment is scored in mission effect, so the prose is the
 * substance and it does not go in a truncating cell. Each effect gets a
 * scannable row and, directly beneath it, what an operator actually saw, how
 * long it lasted and what they can do about it.
 *
 * "No effect" is a result and reads as one: the adversary tried and the mission
 * held. A product that renders only the successes is lying about the assessment.
 */
export function MissionEffectTable({
  effects,
  scenarioName,
}: {
  effects: MissionEffect[];
  /** Resolves THR- to its scenario name for the row title. */
  scenarioName?: (id: string) => string;
}) {
  if (effects.length === 0) {
    return (
      <p className="pt-4 text-[12.5px] text-muted-foreground">
        No mission effect is recorded. Until a scenario is executed there is nothing to score.
      </p>
    );
  }

  return (
    <Table className="table-fixed">
      <colgroup>
        <col style={{ width: "94px" }} />
        <col style={{ width: "118px" }} />
        <col />
        <col style={{ width: "104px" }} />
        <col style={{ width: "104px" }} />
        <col style={{ width: "118px" }} />
        <col style={{ width: "128px" }} />
      </colgroup>
      <thead>
        <tr>
          <Table.Header>Effect</Table.Header>
          <Table.Header>Kind</Table.Header>
          <Table.Header>Mission function</Table.Header>
          <Table.Header>Scenario</Table.Header>
          <Table.Header>Confirmed by</Table.Header>
          <Table.Header>Reproduced</Table.Header>
          <Table.Header>Findings</Table.Header>
        </tr>
      </thead>
      <tbody>
        {effects.map((e) => {
          const none = e.effect === "No effect";
          const noWorkaround = e.workaround === "None identified";
          return (
            <Fragment key={e.id}>
              <Table.Row className="border-0 hover:bg-transparent">
                <Table.Cell>
                  <Id>{e.id}</Id>
                </Table.Cell>
                <Table.Cell>
                  <Badge tone={effectTone[e.effect]}>{e.effect}</Badge>
                </Table.Cell>
                <Table.Cell className="truncate" title={e.missionFunction}>
                  {e.missionFunction}
                </Table.Cell>
                <Table.Cell title={scenarioName?.(e.scenario) ?? e.scenario}>
                  <Id>{e.scenario}</Id>
                </Table.Cell>
                <Table.Cell>
                  <Id>{e.confirmedBy}</Id>
                </Table.Cell>
                <Table.Cell>
                  <Badge size="xs" tone={e.reproduced ? "neutral" : "warning"}>
                    {e.reproduced ? "Reproduced" : "Single observation"}
                  </Badge>
                </Table.Cell>
                <Table.Cell>
                  {e.findings.length === 0 ? (
                    <Badge size="xs" tone={none ? "neutral" : "danger"}>
                      {none ? "None needed" : "None raised"}
                    </Badge>
                  ) : (
                    <span className="flex flex-wrap gap-1">
                      {e.findings.map((f) => (
                        <Id key={f} className="text-muted-foreground">
                          {f}
                        </Id>
                      ))}
                    </span>
                  )}
                </Table.Cell>
              </Table.Row>
              <tr className="border-b border-border-subtle last:border-0">
                <td colSpan={7} className="px-3 pb-4 pt-0 align-top">
                  <div
                    className={cn(
                      "rounded-md border-l-2 pl-3",
                      none
                        ? "border-success/50"
                        : noWorkaround
                          ? "border-danger/60"
                          : "border-warning/50",
                    )}
                  >
                    <Eyebrow tone={none ? "success" : "neutral"}>
                      {none ? "Observed — objective not achieved" : "Observed"}
                    </Eyebrow>
                    <p className="mt-1 whitespace-normal text-[12.5px] leading-relaxed text-foreground">
                      {e.observed}
                    </p>
                    <div className="mt-2 grid gap-x-6 gap-y-2 sm:grid-cols-2">
                      <div>
                        <Eyebrow>Persistence</Eyebrow>
                        <p className="mt-0.5 whitespace-normal text-[12.5px] leading-relaxed text-muted-foreground">
                          {e.duration === "—" ? <Dash /> : e.duration}
                        </p>
                      </div>
                      <div>
                        <Eyebrow tone={noWorkaround ? "danger" : "neutral"}>
                          Operator workaround
                        </Eyebrow>
                        <p
                          className={cn(
                            "mt-0.5 whitespace-normal text-[12.5px] leading-relaxed",
                            noWorkaround ? "text-danger" : "text-muted-foreground",
                          )}
                        >
                          {noWorkaround
                            ? "None identified — the operator has nothing to do about this one."
                            : e.workaround}
                        </p>
                      </div>
                    </div>
                  </div>
                </td>
              </tr>
            </Fragment>
          );
        })}
      </tbody>
    </Table>
  );
}

/* ── Attack-surface coverage ─────────────────────────────────────────────── */

/**
 * What the scenario set does and does not reach. `unexercised` is the load-
 * bearing half: a coverage read-out that prints only what was tested tells the
 * reader the surface is smaller than it is.
 */
export function AttackSurfaceSummary({
  coverage,
  scenarios,
}: {
  coverage: {
    techniques: number;
    tactics: string[];
    exercised: number;
    unexercised: string[];
    nodesTargeted: number;
    nodesUntargeted: number;
  };
  scenarios: ThreatScenario[];
}) {
  const cap = useCap(coverage.unexercised, 6);
  const total = coverage.nodesTargeted + coverage.nodesUntargeted;
  const ics = scenarios.filter((s) => s.chain.some((step) => step.matrix === "ICS")).length;

  return (
    <div className="space-y-4 pt-4">
      <div className="grid grid-cols-2 gap-px border-y border-border bg-border md:grid-cols-5">
        <Tile
          label="Scenarios"
          value={`${scenarios.length}`}
          note={`${coverage.exercised} executed · ${ics} written against the ICS matrix`}
        />
        <Tile
          label="Techniques"
          value={`${coverage.techniques}`}
          note={`distinct ATT&CK ids across ${coverage.tactics.length} tactics`}
        />
        <Tile
          label="Nodes reached"
          value={`${coverage.nodesTargeted}`}
          note={`of ${total} in the composition graph`}
        />
        <Tile
          label="Never targeted"
          value={`${coverage.nodesUntargeted}`}
          note="no scenario path touches them"
          tone={coverage.nodesUntargeted > 0 ? "warning" : "neutral"}
        />
        <Tile
          label="Unexercised"
          value={`${coverage.unexercised.length}`}
          note="written but not executed"
          tone={coverage.unexercised.length > 0 ? "warning" : "success"}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div>
          <Eyebrow>Tactics represented</Eyebrow>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {coverage.tactics.map((t) => (
              <Badge key={t}>{t}</Badge>
            ))}
          </div>
        </div>
        <div>
          <Eyebrow tone={coverage.unexercised.length > 0 ? "warning" : "neutral"}>
            Written but not executed
          </Eyebrow>
          {coverage.unexercised.length === 0 ? (
            <p className="mt-1.5 text-[12.5px] text-muted-foreground">
              Every scenario on record has been executed.
            </p>
          ) : (
            <>
              <div className="mt-1.5">
                <IdChips ids={cap.shown} tone="warning" />
              </div>
              {cap.hidden > 0 || cap.expanded ? (
                <div className="pt-2">
                  <Button variant="link" size="sm" onClick={cap.toggle}>
                    {cap.expanded ? "Show fewer" : `Show ${cap.hidden} more`}
                  </Button>
                </div>
              ) : null}
              <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted-foreground">
                An unexercised scenario is a residual the program is carrying, not an absence. Each
                one names in its note why it was not run — denied authority, out of scope for
                production infrastructure, or waiting on a configuration that has not shipped.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
