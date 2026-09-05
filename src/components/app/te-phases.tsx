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
import { ArrowRight, Calculator, CornerDownRight, PenLine } from "lucide-react";

import {
  Absent,
  Alert,
  Badge,
  Box,
  Button,
  Card,
  Eyebrow,
  Grid,
  Id,
  Inline,
  Stack,
  Stat,
  Table,
} from "@ledger/design-system";
import type { Tone } from "@ledger/design-system";
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
import { cn } from "@ledger/design-system/cn";

/* ── Shared bits ─────────────────────────────────────────────────────────── */

function IdChips({ ids, tone = "neutral" }: { ids: string[]; tone?: Tone }) {
  return (
    <Inline space="space.075" shouldWrap>
      {ids.map((id) => (
        <Badge key={id} tone={tone}>
          <span className="font-body-xsmall">{id}</span>
        </Badge>
      ))}
    </Inline>
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
    <Badge size="xsmall">
      <span className="">Tier {tier}</span>
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
    <Inline className="font-body-small" as="span" space="space.050" alignBlock="center">
      <span className="text-subtle">{label}</span>
      <Badge size="xsmall" tone={tone}>
        <span className="tabular-nums">
          {met}/{total}
        </span>
      </Badge>
    </Inline>
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
    <Stack className="pt-200" space="space.250">
      {regimes.map((regime) => {
        const band = phases.filter((p) => p.kind === regime.kind);
        if (band.length === 0) return null;
        const operational = regime.kind === "Operational";
        return (
          <section
            key={regime.kind}
            className={cn(
              "rounded-large border",
              operational ? "border-brand bg-selected" : "border-default bg-surface-sunken",
            )}
          >
            <Inline
              className="border-b border-default px-200 py-100"
              space="space.150"
              rowSpace="space.050"
              alignBlock="baseline"
              shouldWrap
            >
              <h3 className="font-body-small font-semibold">{regime.title}</h3>
              <Badge size="xsmall" tone={operational ? "information" : "neutral"}>
                {operational ? "OT&E" : "DT&E"}
              </Badge>
              <span className="font-body-small text-subtle">
                Authority: <span className="font-medium text-default">{regime.authority}</span>
              </span>
              <span className="tabular-nums ml-auto font-body-small text-subtle">
                {band.length} of {phases.length} phases
              </span>
            </Inline>
            <p className="px-200 pt-100 font-body-small text-subtle">{regime.blurb}</p>
            <Stack className="p-150" space="space.100">
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
            </Stack>
          </section>
        );
      })}
    </Stack>
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
      <Inline as="span" space="space.150" alignBlock="start">
        <Box paddingBlockStart="space.025">
          <Inline
            as="span"
            display="inline-flex"
            alignBlock="center"
            alignInline="center"
            className={cn(
              "tabular-nums shrink-0 rounded-full font-body-small font-semibold outline-focused",
              phase.state === "Complete" ? "bg-success text-success" : "bg-surface text-subtle",
              "size-300",
            )}
          >
            {phase.n}
          </Inline>
        </Box>
        <span className="min-w-0 flex-1">
          <Inline as="span" space="space.100" rowSpace="space.050" alignBlock="baseline" shouldWrap>
            <span className="font-body font-semibold">{phase.short}</span>
            <Id className="text-subtle">{phase.id}</Id>
            <span className="min-w-0 truncate font-body-small text-subtle">{phase.name}</span>
            <Inline className="ml-auto shrink-0" as="span" space="space.100" alignBlock="center">
              {readiness ? (
                <>
                  <GateCount label="Entry" met={readiness.entryMet} total={readiness.entryTotal} />
                  <GateCount label="Exit" met={readiness.exitMet} total={readiness.exitTotal} />
                </>
              ) : null}
              <PhaseStateChip phase={phase} />
            </Inline>
          </Inline>

          <Inline
            className="pt-075 font-body-small text-subtle"
            as="span"
            space="space.200"
            rowSpace="space.050"
            alignBlock="center"
            shouldWrap
          >
            <span className="tabular-nums">{phase.window}</span>
            <span>{phase.lead}</span>
            <span>
              Informs <span className="text-default">{phase.gate}</span>
            </span>
            <Inline as="span" space="space.075" alignBlock="center">
              {phase.campaigns.length === 0 ? (
                <span>No campaign — this phase produces a record, not an execution</span>
              ) : (
                phase.campaigns.map((id) => (
                  <Badge key={id} size="xsmall">
                    <span className="font-body-xsmall" title={campaignName?.(id) ?? id}>
                      {id}
                    </span>
                  </Badge>
                ))
              )}
            </Inline>
          </Inline>

          {readiness ? (
            <Box
              className={cn(
                "block truncate font-body-small",
                blocked ? "text-warning" : "text-success",
              )}
              title={readiness.blocker === "—" ? undefined : readiness.blocker}
              as="span"
              paddingBlockStart="space.075"
            >
              {blocked
                ? `Blocking — ${readiness.blocker}`
                : readiness.canExit
                  ? "Every entry and exit criterion is met as of today."
                  : "No criterion is unmet."}
            </Box>
          ) : null}
        </span>
      </Inline>
    </>
  );

  const shell = cn(
    "block w-full rounded-medium border px-150 py-100 text-left transition-colors duration-fast",
    selected
      ? "border-brand bg-surface shadow-raised"
      : "border-default bg-surface hover:bg-surface-hovered",
  );

  if (!onSelect) return <div className={shell}>{body}</div>;
  return (
    <button type="button" onClick={onSelect} className={shell} aria-pressed={selected}>
      {body}
    </button>
  );
}

/* ── PhaseReadinessSummary ───────────────────────────────────────────────── */

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
    <Stack className="pt-200" space="space.200">
      <Box
        className={cn(
          "rounded-large border",
          verdict.tone === "success"
            ? "border-success-subtle bg-success"
            : verdict.tone === "warning"
              ? "border-warning-subtle bg-warning"
              : "border-danger-subtle bg-danger",
        )}
        paddingInline="space.200"
        paddingBlock="space.150"
      >
        <Inline space="space.100" rowSpace="space.050" alignBlock="baseline" shouldWrap>
          <h3 className="font-body font-semibold">{verdict.head}</h3>
          <PhaseStateChip phase={phase} />
          <span className="ml-auto font-body-small text-subtle">
            Evaluated against the register as it stands today
          </span>
        </Inline>
        <p className="pt-075 font-body-small text-subtle">{verdict.text}</p>

        <Box paddingBlockStart="space.150">
          <Box
            className="rounded-medium border border-default bg-surface"
            paddingInline="space.150"
            paddingBlock="space.100"
          >
            <Eyebrow tone={readiness.blocker === "—" ? "success" : "danger"}>
              {readiness.blocker === "—" ? "Nothing blocking" : "Blocking"}
            </Eyebrow>
            <p className="pt-050 font-body-small text-default">
              {readiness.blocker === "—"
                ? "No criterion on this phase is unmet. Every derived sentence below was recomputed for this render; none of them is a stored verdict."
                : readiness.blocker}
            </p>
          </Box>
        </Box>
      </Box>

      <Stat.Grid cols={5} frame="band">
        <Stat.Tile
          label="Entry"
          value={`${readiness.entryMet}/${readiness.entryTotal}`}
          note="criteria met"
          tone={readiness.canEnter ? "success" : "danger"}
        />
        <Stat.Tile
          label="Exit"
          value={`${readiness.exitMet}/${readiness.exitTotal}`}
          note="criteria met"
          tone={readiness.canExit ? "success" : "warning"}
        />
        <Stat.Tile
          label="Derived"
          value={`${derived.length}`}
          note="computed from the record"
          tone="neutral"
        />
        <Stat.Tile
          label="Attested"
          value={`${attested.length}`}
          note="a person has to sign"
          tone="neutral"
        />
        <Stat.Tile
          label="Unsigned"
          value={`${unsigned.length}`}
          note={unsigned.length === 0 ? "every attestation on file" : "attestation missing"}
          tone={unsigned.length === 0 ? "success" : "danger"}
        />
      </Stat.Grid>
    </Stack>
  );
}

/* ── CriteriaTable ───────────────────────────────────────────────────────── */

function BasisChip({ criterion }: { criterion: PhaseCriterion }) {
  if (criterion.basis === "Derived") {
    return (
      <Badge tone="information" icon={<Calculator className="size-150" />}>
        Derived
      </Badge>
    );
  }
  const signed = criterion.attestedBy !== "—" && criterion.attestedOn !== "—";
  return (
    <Badge tone={signed ? "neutral" : "danger"} icon={<PenLine className="size-150" />}>
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
    <Box
      className={cn(
        "border-s",
        derivedBasis
          ? met
            ? "border-success-subtle"
            : "border-brand"
          : unsignedAttestation
            ? "border-danger"
            : "border-dashed border-bold",
      )}
      as="li"
      paddingBlock="space.150"
      paddingInlineStart="space.150"
    >
      <Inline space="space.100" rowSpace="space.050" alignBlock="center" shouldWrap>
        <Id>{criterion.id}</Id>
        <Badge size="xsmall">{criterion.kind}</Badge>
        <BasisChip criterion={criterion} />
        <Inline className="ml-auto" as="span" space="space.100" alignBlock="center">
          <Badge tone={met ? "success" : "danger"}>{met ? "Met" : "Not met"}</Badge>
        </Inline>
      </Inline>

      <p className="pt-075 font-body-small text-default">{criterion.statement}</p>

      <Box paddingBlockStart="space.100">
        <Box
          className={cn(
            "rounded-medium border",
            derivedBasis
              ? met
                ? "border-success-subtle bg-success"
                : "border-warning-subtle bg-warning"
              : unsignedAttestation
                ? "border-danger-subtle bg-danger"
                : "border-default bg-surface-sunken",
          )}
          paddingInline="space.150"
          paddingBlock="space.100"
        >
          <Eyebrow tone={derivedBasis ? "information" : unsignedAttestation ? "danger" : "neutral"}>
            {derivedBasis
              ? "Computed now"
              : unsignedAttestation
                ? "No signature on file"
                : "Signature on file"}
          </Eyebrow>
          <p className="pt-050 font-body-small text-default">
            {result ? result.finding : "This criterion was not evaluated for this program."}
          </p>

          {derivedBasis ? (
            <p className="pt-075 flex items-start gap-075 font-body-small text-subtle">
              <CornerDownRight className="pt-025 shrink-0 size-150" />
              <span>
                <span className="font-medium text-default">From </span>
                {criterion.derivation}
              </span>
            </p>
          ) : (
            <p className="pt-075 flex flex-wrap items-start gap-x-150 gap-y-050 font-body-small text-subtle">
              <CornerDownRight className="pt-025 shrink-0 size-150" />
              <span>
                Signer{" "}
                <span className={signed ? "font-medium text-default" : "font-medium text-danger"}>
                  {criterion.attestedBy}
                </span>
              </span>
              <span>
                Dated{" "}
                <span
                  className={cn(
                    "tabular-nums",
                    signed ? "font-medium text-default" : "font-medium text-danger",
                  )}
                >
                  {criterion.attestedOn}
                </span>
              </span>
              {signed ? null : <span>Both fields a signature would fill are empty.</span>}
            </p>
          )}
        </Box>
      </Box>

      <Inline
        className="pt-100"
        space="space.100"
        rowSpace="space.075"
        alignBlock="baseline"
        shouldWrap
      >
        <Eyebrow>Evidence</Eyebrow>
        {result && result.evidence.length > 0 ? (
          <IdChips ids={result.evidence} tone={met ? "neutral" : "warning"} />
        ) : (
          <span className="font-body-small text-subtle">
            {derivedBasis
              ? "None — this judgement rests on the absence of a record rather than on any one record."
              : "None — an attestation carries a signature, not an artifact id."}
          </span>
        )}
      </Inline>
    </Box>
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
      <p className="pt-200 font-body-small text-subtle">
        No {kind.toLowerCase()} criterion is authored for this phase.
      </p>
    );
  }

  return (
    <Box paddingBlockStart="space.150">
      <Inline
        className="pb-050 font-body-small text-subtle"
        space="space.150"
        rowSpace="space.050"
        alignBlock="baseline"
        shouldWrap
      >
        <span className="tabular-nums">
          <span
            className={cn("font-medium", met === scoped.length ? "text-success" : "text-warning")}
          >
            {met}
          </span>{" "}
          of {scoped.length} met
        </span>
        <span className="tabular-nums">
          {derived} derived · {attested} attested
        </span>
      </Inline>
      <ul className="divide-y">
        {scoped.map((c) => (
          <CriterionRow key={c.id} criterion={c} result={results.get(c.id) ?? null} />
        ))}
      </ul>
    </Box>
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
      <p className="pt-200 font-body-small text-subtle">
        No threat scenario is written against this phase.
      </p>
    );
  }

  return (
    <Table className="table-fixed">
      <thead>
        <tr>
          <Table.Header width={92}>Scenario</Table.Header>
          <Table.Header>Name</Table.Header>
          {showPhase ? <Table.Header width={104}>Phase</Table.Header> : null}
          <Table.Header width={68}>Tier</Table.Header>
          <Table.Header width={168}>Mission function</Table.Header>
          <Table.Header width={128}>Chain</Table.Header>
          <Table.Header className="text-right" width={84}>
            Path
          </Table.Header>
          <Table.Header width={88}>Event</Table.Header>
          <Table.Header width={118}>Status</Table.Header>
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
                selected === s.id ? "bg-neutral-subtle" : "",
              )}
              onClick={onSelect ? () => onSelect(s.id) : undefined}
            >
              <Table.Id id={s.id} tone={onSelect ? "brand" : "subtle"} />
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
                <Inline as="span" space="space.075" alignBlock="center">
                  <span className="tabular-nums text-subtle">{s.chain.length}</span>
                  <span className="min-w-0 truncate font-body-small text-subtle">
                    {first ? first.tactic : "—"}
                    {last && first && last.tactic !== first.tactic ? ` → ${last.tactic}` : ""}
                  </span>
                  {ics ? (
                    <Badge size="xsmall" tone="information">
                      ICS
                    </Badge>
                  ) : null}
                </Inline>
              </Table.Cell>
              <Table.Cell className="tabular-nums text-right" title={s.path.join(" → ")}>
                {s.path.length} nodes
              </Table.Cell>
              <Table.Cell>{s.event ? <Id>{s.event}</Id> : <Absent />}</Table.Cell>
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
  Management: "information",
  Isolated: "success",
};

function TechniqueStep({ step, n }: { step: ThreatScenario["chain"][number]; n: number }) {
  return (
    <Box
      className="flex-1 rounded-medium border border-default bg-surface"
      paddingInline="space.100"
      paddingBlock="space.100"
      style={{ minWidth: 168 }}
    >
      <Inline space="space.075" alignBlock="center">
        <Inline
          className="tabular-nums size-icon-medium rounded-full bg-neutral font-body-xsmall font-semibold text-subtle"
          as="span"
          display="inline-flex"
          alignBlock="center"
          alignInline="center"
        >
          {n}
        </Inline>
        <Eyebrow as="span" className="min-w-0 truncate">
          {step.tactic}
        </Eyebrow>
        {step.matrix === "ICS" ? (
          <Badge size="xsmall" tone="information" className="ml-auto">
            ICS
          </Badge>
        ) : null}
      </Inline>
      <Inline className="pt-050" space="space.075" alignBlock="baseline">
        <Id>{step.id}</Id>
      </Inline>
      <Box className="font-body-small font-medium" paddingBlockStart="space.025">
        {step.name}
      </Box>
    </Box>
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
    <Card className="p-200">
      <Inline space="space.100" rowSpace="space.050" alignBlock="baseline" shouldWrap>
        <Id>{scenario.id}</Id>
        <h3 className="font-body font-semibold">{scenario.name}</h3>
        <TierChip tier={scenario.tier} />
        <Badge tone={scenarioStatusTone[scenario.status]}>{scenario.status}</Badge>
        <span className="ml-auto font-body-small text-subtle">
          {scenario.event ? (
            <>
              Executed by <Id className="text-subtle">{scenario.event}</Id>
            </>
          ) : (
            "No test event assigned"
          )}
        </span>
      </Inline>

      <Box paddingBlockStart="space.100">
        <Eyebrow>Adversary objective</Eyebrow>
        <p className="pt-050 font-body-small text-default">{scenario.objective}</p>
      </Box>

      <Inline
        className="pt-150 font-body-small text-subtle"
        space="space.200"
        rowSpace="space.050"
        alignBlock="center"
        shouldWrap
      >
        <span>
          Mission function at risk:{" "}
          <span className="font-medium text-default">{scenario.missionFunction}</span>
        </span>
        <span>
          Assumed start: <Id className="text-subtle">{scenario.entryPoint}</Id>
          {entry && !entry.missing ? ` — ${entry.name}` : ""}
        </span>
        <span className="tabular-nums">
          {scenario.chain.length} techniques · {path.length} nodes · {boundaries} trust{" "}
          {boundaries === 1 ? "boundary" : "boundaries"} crossed
        </span>
      </Inline>

      {/* The chain */}
      <Box paddingBlockStart="space.200">
        <Eyebrow tone="information">ATT&amp;CK chain — in order</Eyebrow>
        <Inline className="pt-100" space="space.075" alignBlock="stretch" shouldWrap>
          {scenario.chain.map((step, i) => (
            <Inline
              key={`${step.id}-${i}`}
              space="space.075"
              alignBlock="center"
              grow="fill"
              style={{ minWidth: 168 }}
            >
              <TechniqueStep step={step} n={i + 1} />
              {i < scenario.chain.length - 1 ? (
                <ArrowRight className="size-icon-small shrink-0 text-subtle" aria-hidden />
              ) : null}
            </Inline>
          ))}
        </Inline>
      </Box>

      {/* The walk */}
      <Box paddingBlockStart="space.200">
        <Eyebrow tone="information">Through the composition graph</Eyebrow>
        <p className="pt-050 font-body-small text-subtle">
          Each step below is either a reachability edge in the direction of travel or a containment
          link into what a component is made of. Both are ways an adversary actually moves; a step
          that is neither would be a fabricated path, and is called out as one.
        </p>

        {unwalkable.length > 0 ? (
          <Box paddingBlockStart="space.100">
            <Alert tone="danger">
              {unwalkable.length} {unwalkable.length === 1 ? "step is" : "steps are"} not
              traversable in the composition graph —{" "}
              {unwalkable.map((h) => `${h.from} → ${h.to}`).join(", ")}. The scenario cannot be
              executed as written against this system.
            </Alert>
          </Box>
        ) : null}

        <Box as="ol" paddingBlockStart="space.100">
          {path.map((node, i) => {
            const hop = i > 0 ? (hops[i - 1] ?? null) : null;
            const previous = i > 0 ? (path[i - 1] ?? null) : null;
            return (
              <li key={`${node.id}-${i}`}>
                {hop ? (
                  <Inline className="ps-150" space="space.150" alignBlock="stretch">
                    <span
                      className={cn(
                        "w-px shrink-0",
                        hop.via === "Unwalkable" ? "bg-danger-bold" : "bg-neutral-hovered",
                      )}
                      aria-hidden
                    />
                    <Inline
                      className="py-075 font-body-small"
                      space="space.100"
                      rowSpace="space.050"
                      alignBlock="center"
                      shouldWrap
                    >
                      {hop.via === "Unwalkable" ? (
                        <Badge size="xsmall" tone="danger">
                          No path in the graph
                        </Badge>
                      ) : (
                        <Badge size="xsmall" tone="neutral">
                          {hop.kind}
                        </Badge>
                      )}
                      {hop.label !== "—" ? <span className="text-subtle">{hop.label}</span> : null}
                      {hop.crossesBoundary && previous ? (
                        <Badge size="xsmall" tone="warning">
                          Crosses {previous.zone} → {node.zone}
                        </Badge>
                      ) : null}
                      {hop.critical ? (
                        <span className="text-subtle">
                          No redundant path — this hop is the only one
                        </span>
                      ) : null}
                    </Inline>
                  </Inline>
                ) : null}

                <Inline space="space.150" alignBlock="center">
                  <Inline
                    className={cn(
                      "shrink-0 rounded-full font-body-xsmall font-semibold outline-focused",
                      i === 0
                        ? "bg-warning text-warning"
                        : i === path.length - 1
                          ? "bg-danger text-danger"
                          : "bg-neutral text-subtle",
                    )}
                    style={{ width: 22, height: 22 }}
                    as="span"
                    display="inline-flex"
                    alignBlock="center"
                    alignInline="center"
                  >
                    {i + 1}
                  </Inline>
                  <Inline
                    className="min-w-0"
                    as="span"
                    space="space.100"
                    rowSpace="space.025"
                    alignBlock="baseline"
                    shouldWrap
                  >
                    <Id className="text-subtle">{node.id}</Id>
                    <span className="font-body-small font-medium">
                      {node.missing ? "Not in the graph" : node.name}
                    </span>
                    <Badge size="xsmall" tone={node.missing ? "danger" : "neutral"}>
                      {node.kind}
                    </Badge>
                    <Badge size="xsmall" tone={zoneTone[node.zone] ?? "neutral"}>
                      {node.zone}
                    </Badge>
                    <span className="font-body-small text-subtle">{node.criticality}</span>
                    {i === 0 ? (
                      <span className="font-body-small text-subtle">— assumed foothold</span>
                    ) : null}
                    {i === path.length - 1 ? (
                      <span className="font-body-small text-subtle">— objective</span>
                    ) : null}
                  </Inline>
                </Inline>
              </li>
            );
          })}
        </Box>
      </Box>

      <Box className="border-t border-default pt-150" paddingBlockStart="space.200">
        <Eyebrow>Assessor note</Eyebrow>
        <p className="pt-050 font-body-small text-subtle">{scenario.note}</p>
      </Box>

      <Inline
        className="pt-150 font-body-small text-subtle"
        space="space.100"
        alignBlock="center"
        shouldWrap
      >
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
      </Inline>
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
      <p className="pt-200 font-body-small text-subtle">
        No mission effect is recorded. Until a scenario is executed there is nothing to score.
      </p>
    );
  }

  return (
    <Table className="table-fixed">
      <thead>
        <tr>
          <Table.Header width={94}>Effect</Table.Header>
          <Table.Header width={118}>Kind</Table.Header>
          <Table.Header>Mission function</Table.Header>
          <Table.Header width={104}>Scenario</Table.Header>
          <Table.Header width={104}>Confirmed by</Table.Header>
          <Table.Header width={118}>Reproduced</Table.Header>
          <Table.Header width={128}>Findings</Table.Header>
        </tr>
      </thead>
      <tbody>
        {effects.map((e) => {
          const none = e.effect === "No effect";
          const noWorkaround = e.workaround === "None identified";
          return (
            <Fragment key={e.id}>
              <Table.Row className="border-0" isStatic>
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
                  <Badge size="xsmall" tone={e.reproduced ? "neutral" : "warning"}>
                    {e.reproduced ? "Reproduced" : "Single observation"}
                  </Badge>
                </Table.Cell>
                <Table.Cell>
                  {e.findings.length === 0 ? (
                    <Badge size="xsmall" tone={none ? "neutral" : "danger"}>
                      {none ? "None needed" : "None raised"}
                    </Badge>
                  ) : (
                    <Inline as="span" space="space.050" shouldWrap>
                      {e.findings.map((f) => (
                        <Id key={f} className="text-subtle">
                          {f}
                        </Id>
                      ))}
                    </Inline>
                  )}
                </Table.Cell>
              </Table.Row>
              <tr className="border-b border-default last:border-0">
                <td colSpan={7} className="px-150 pb-200 pt-0 align-top">
                  <Box
                    className={cn(
                      "rounded-medium border-s",
                      none
                        ? "border-success-subtle"
                        : noWorkaround
                          ? "border-danger-subtle"
                          : "border-warning-subtle",
                    )}
                    paddingInlineStart="space.150"
                  >
                    <Eyebrow tone={none ? "success" : "neutral"}>
                      {none ? "Observed — objective not achieved" : "Observed"}
                    </Eyebrow>
                    <p className="pt-050 whitespace-normal font-body-small text-default">
                      {e.observed}
                    </p>
                    <Grid
                      className="pt-100"
                      columnGap="space.300"
                      rowGap="space.100"
                      templateColumns={{ sm: "repeat(2, minmax(0, 1fr))" }}
                    >
                      <div>
                        <Eyebrow>Persistence</Eyebrow>
                        <p className="pt-025 whitespace-normal font-body-small text-subtle">
                          {e.duration === "—" ? <Absent /> : e.duration}
                        </p>
                      </div>
                      <div>
                        <Eyebrow tone={noWorkaround ? "danger" : "neutral"}>
                          Operator workaround
                        </Eyebrow>
                        <p
                          className={cn(
                            "pt-025 whitespace-normal font-body-small",
                            noWorkaround ? "text-danger" : "text-subtle",
                          )}
                        >
                          {noWorkaround
                            ? "None identified — the operator has nothing to do about this one."
                            : e.workaround}
                        </p>
                      </div>
                    </Grid>
                  </Box>
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
    <Stack className="pt-200" space="space.200">
      <Stat.Grid cols={5} frame="band">
        <Stat.Tile
          label="Scenarios"
          value={`${scenarios.length}`}
          note={`${coverage.exercised} executed · ${ics} written against the ICS matrix`}
        />
        <Stat.Tile
          label="Techniques"
          value={`${coverage.techniques}`}
          note={`distinct ATT&CK ids across ${coverage.tactics.length} tactics`}
        />
        <Stat.Tile
          label="Nodes reached"
          value={`${coverage.nodesTargeted}`}
          note={`of ${total} in the composition graph`}
        />
        <Stat.Tile
          label="Never targeted"
          value={`${coverage.nodesUntargeted}`}
          note="no scenario path touches them"
          tone={coverage.nodesUntargeted > 0 ? "warning" : "neutral"}
        />
        <Stat.Tile
          label="Unexercised"
          value={`${coverage.unexercised.length}`}
          note="written but not executed"
          tone={coverage.unexercised.length > 0 ? "warning" : "success"}
        />
      </Stat.Grid>

      <Grid gap="space.200" templateColumns={{ lg: "repeat(2, minmax(0, 1fr))" }}>
        <div>
          <Eyebrow>Tactics represented</Eyebrow>
          <Inline className="pt-075" space="space.075" shouldWrap>
            {coverage.tactics.map((t) => (
              <Badge key={t}>{t}</Badge>
            ))}
          </Inline>
        </div>
        <div>
          <Eyebrow tone={coverage.unexercised.length > 0 ? "warning" : "neutral"}>
            Written but not executed
          </Eyebrow>
          {coverage.unexercised.length === 0 ? (
            <p className="pt-075 font-body-small text-subtle">
              Every scenario on record has been executed.
            </p>
          ) : (
            <>
              <Box paddingBlockStart="space.075">
                <IdChips ids={cap.shown} tone="warning" />
              </Box>
              {cap.hidden > 0 || cap.expanded ? (
                <Box paddingBlockStart="space.100">
                  <Button variant="link" size="small" onClick={cap.toggle}>
                    {cap.expanded ? "Show fewer" : `Show ${cap.hidden} more`}
                  </Button>
                </Box>
              ) : null}
              <p className="pt-075 font-body-small text-subtle">
                An unexercised scenario is a residual the program is carrying, not an absence. Each
                one names in its note why it was not run — denied authority, out of scope for
                production infrastructure, or waiting on a configuration that has not shipped.
              </p>
            </>
          )}
        </div>
      </Grid>
    </Stack>
  );
}
