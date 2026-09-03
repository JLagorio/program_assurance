/**
 * Baseline and change-invalidation presentation.
 *
 * The load-bearing component is `ImpactView`, and what it has to make legible
 * is a doctrine, not a number:
 *
 *  - **A contained change is a result, not an absence.** When CM-3(2) says a
 *    change has no security impact, this view does not render an empty page. It
 *    renders the verdict, the ISSE's written analysis in full, and a row of
 *    zeros that are the *finding* — the cascade did not run because the analysis
 *    said it must not, and that reasoning is the auditable part.
 *  - **Invalidated and Suspect are different states and must never look alike.**
 *    They are separated into two blocks with their own accent, their own count
 *    and their own one-sentence rule, and every touched node prints the actual
 *    descend/ascend reason string rather than a tidied summary of it.
 *  - **An invalidated row shows what the matrix actually did to it.** A positive
 *    claim is withdrawn, and renders struck through beside the "Not assessed" it
 *    became, because a value that is silently replaced cannot be audited. A
 *    deficiency is *not* withdrawn: it is re-tested, not re-scored, and renders
 *    un-struck with the re-test owed — re-scoring an open deficiency to "Not
 *    assessed" would sever the POA&M obligation. The view never re-derives that
 *    branch; `impactOf` carries the post-overlay determination and the outcome
 *    as data, so this file can only ever print what `buildSctm` holds.
 *  - **An unrecorded pin movement is a CM-3 finding.** `UnrecordedChangeNotice`
 *    states it as one, in the language of the control, above the diff table that
 *    found it — never as one more grey row among the recorded ones.
 *
 * Presentation only. Every value arrives as a prop from `@/lib/baselines`;
 * nothing here diffs, cascades or gates.
 */

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { ArrowRight, TriangleAlert } from "lucide-react";

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
  Section,
  Stack,
  Stat,
  Table,
  Toolbar,
} from "@ledger/design-system";
import type { Tone } from "@ledger/design-system";
import {
  buildStateTone,
  changeKindTone,
  impactStateTone,
  securityImpactTone,
  type Build,
  type BuildState,
  type ChangeImpact,
  type ChangeKind,
  type ChangeRecord,
  type ImpactState,
  type ParameterPin,
  type PinDelta,
  type RetestItem,
  type SecurityImpact,
  type TouchedNode,
} from "@/lib/baselines";
import { cn } from "@/lib/utils";

type NodeNamer = (nodeId: string) => string;
type AuditRecord = ChangeImpact["records"][number];

/* ── Shared bits ─────────────────────────────────────────────────────────── */

export function BuildStateChip({ state }: { state: BuildState }) {
  return (
    <Badge size="xsmall" tone={buildStateTone[state]}>
      {state}
    </Badge>
  );
}

export function ChangeKindChip({ kind }: { kind: ChangeKind }) {
  return (
    <Badge size="xsmall" tone={changeKindTone[kind]}>
      {kind}
    </Badge>
  );
}

/** The CM-3(2) verdict. "Significant" is caution — it cascades, it is not a failure. */
export function ImpactChip({ impact }: { impact: SecurityImpact }) {
  return <Badge tone={securityImpactTone[impact]}>{impact}</Badge>;
}

export function ImpactStateChip({ state }: { state: ImpactState }) {
  return (
    <Badge size="xsmall" tone={impactStateTone[state]}>
      {state}
    </Badge>
  );
}

/** Node ids read as noise alone; the part name is what the reader recognises. */
function NodeRef({ id, nodeName }: { id: string; nodeName?: NodeNamer | undefined }) {
  if (id === "—") return <Absent />;
  const name = nodeName?.(id);
  const full = name && name !== id ? `${id} — ${name}` : id;
  return (
    <Inline className="min-w-0" title={full} as="span" space="space.075" alignBlock="center">
      <Id className="shrink-0 text-subtle">{id}</Id>
      {name && name !== id ? <span className="min-w-0 truncate">{name}</span> : null}
    </Inline>
  );
}

/** A configuration movement. The old value is struck: it is no longer in force. */
function Movement({ from, to }: { from: string; to: string }) {
  return (
    <Inline
      className="min-w-0"
      title={`${from} → ${to}`}
      as="span"
      space="space.075"
      alignBlock="center"
    >
      <span className="min-w-0 truncate text-subtle line-through">{from}</span>
      <ArrowRight className="shrink-0 text-subtle size-150" />
      <span className="min-w-0 truncate font-medium">{to}</span>
    </Inline>
  );
}

/**
 * The reason strings are full written sentences, several of them 240 characters
 * long. They never go in a `Td`.
 */
function ProseBlock({
  label,
  tone = "neutral",
  children,
}: {
  label: string;
  tone?: Tone;
  children: ReactNode;
}) {
  return (
    <Box paddingBlockStart="space.075">
      <div
        className={cn(
          "font-heading-xxsmall uppercase",
          tone === "danger" ? "text-danger" : tone === "warning" ? "text-warning" : "text-subtle",
        )}
      >
        {label}
      </div>
      <p className="pt-050 font-body-small text-default">{children}</p>
    </Box>
  );
}

/** A capped list with an honest "showing N of M" control. */
function useCap<T>(rows: T[], initial: number) {
  const [expanded, setExpanded] = useState(false);
  const shown = expanded ? rows : rows.slice(0, initial);
  const hidden = rows.length - shown.length;
  return { shown, hidden, expanded, toggle: () => setExpanded((v) => !v) };
}

function MoreButton({
  hidden,
  expanded,
  onToggle,
  noun,
}: {
  hidden: number;
  expanded: boolean;
  onToggle: () => void;
  noun: string;
}) {
  if (hidden === 0 && !expanded) return null;
  return (
    <Box paddingBlockStart="space.100">
      <Button variant="link" size="small" onClick={onToggle}>
        {expanded ? "Show fewer" : `Show ${hidden} more ${noun}`}
      </Button>
    </Box>
  );
}

/* ── Builds ──────────────────────────────────────────────────────────────── */

export function BuildTable({
  builds,
  selected,
  onSelect,
}: {
  builds: Build[];
  selected?: string | null;
  onSelect?: (id: string) => void;
}) {
  if (builds.length === 0) {
    return (
      <Box paddingBlockStart="space.200">
        <Empty
          title="No configuration baseline"
          description="Nothing has been pinned for this program, so no determination on it can be said to be true of a known configuration."
        />
      </Box>
    );
  }
  return (
    <Table className="table-fixed">
      <thead>
        <tr>
          <Table.Header width={104}>Build</Table.Header>
          <Table.Header>Name</Table.Header>
          <Table.Header width={150}>State</Table.Header>
          <Table.Header width={108}>Approved</Table.Header>
          <Table.Header width={260}>Change control board</Table.Header>
          <Table.Header width={108}>Supersedes</Table.Header>
          <Table.Header width={72} className="text-right">
            Pins
          </Table.Header>
          <Table.Header width={92} className="text-right">
            Parameters
          </Table.Header>
        </tr>
      </thead>
      <tbody>
        {builds.map((build) => (
          <Table.Row
            key={build.id}
            className={cn(onSelect && "cursor-pointer", selected === build.id && "bg-selected")}
            onClick={onSelect ? () => onSelect(build.id) : undefined}
            title={build.note}
          >
            <Table.Id id={build.id} />
            <Table.Cell>{build.name}</Table.Cell>
            <Table.Cell>
              <BuildStateChip state={build.state} />
            </Table.Cell>
            <Table.Cell className="tabular-nums">{build.approved}</Table.Cell>
            <Table.Cell title={build.ccb}>{build.ccb}</Table.Cell>
            <Table.Cell>{build.supersedes ? <Id>{build.supersedes}</Id> : <Absent />}</Table.Cell>
            <Table.Cell className="tabular-nums text-right">{build.pins.length}</Table.Cell>
            <Table.Cell className="tabular-nums text-right">{build.parameters.length}</Table.Cell>
          </Table.Row>
        ))}
      </tbody>
    </Table>
  );
}

/** The organization-defined parameter values a build puts in force. */
export function ParameterTable({ parameters }: { parameters: ParameterPin[] }) {
  if (parameters.length === 0) {
    return (
      <Box paddingBlockStart="space.200">
        <Empty
          title="No parameters pinned"
          description="This build fixes no organization-defined parameter values, so every ODP the controls carry is unstated."
        />
      </Box>
    );
  }
  return (
    <Table className="table-fixed">
      <thead>
        <tr>
          <Table.Header width={96}>Control</Table.Header>
          <Table.Header>Parameter</Table.Header>
          <Table.Header style={{ width: "44%" }}>Value in force</Table.Header>
        </tr>
      </thead>
      <tbody>
        {parameters.map((p) => (
          <Table.Row key={`${p.control}|${p.parameter}`} title={`${p.parameter} — ${p.value}`}>
            <Table.Id id={p.control} />
            <Table.Cell>{p.parameter}</Table.Cell>
            <Table.Cell>{p.value}</Table.Cell>
          </Table.Row>
        ))}
      </tbody>
    </Table>
  );
}

export function BuildRail({
  build,
  deltas,
  unrecorded,
}: {
  build: Build;
  /** Pin movements between the authorized baseline and the candidate. */
  deltas: number;
  unrecorded: number;
}) {
  return (
    <div>
      <Inspector.Group title="Baseline">
        <KeyValue label="Build">
          <Id>{build.id}</Id>
        </KeyValue>
        <KeyValue label="Name">{build.name}</KeyValue>
        <KeyValue label="State">
          <BuildStateChip state={build.state} />
        </KeyValue>
        <KeyValue label="Approved">
          <span className="tabular-nums">{build.approved}</span>
        </KeyValue>
        <KeyValue label="Supersedes">
          {build.supersedes ? <Id>{build.supersedes}</Id> : <Absent />}
        </KeyValue>
        <KeyValue label="Pinned">
          <span className="tabular-nums">
            {build.pins.length} components · {build.parameters.length} parameters
          </span>
        </KeyValue>
        <ProseBlock label="Approving authority">{build.ccb}</ProseBlock>
        <ProseBlock label="Note">{build.note}</ProseBlock>
      </Inspector.Group>

      <Inspector.Group title="Movement">
        <KeyValue label="Pins moved">
          <span className="tabular-nums">{deltas}</span>
        </KeyValue>
        <KeyValue label="Unrecorded">
          <Inline as="span" space="space.075" alignBlock="center">
            <span className="tabular-nums">{unrecorded}</span>
            {unrecorded > 0 ? (
              <Badge size="xsmall" tone="danger">
                CM-3
              </Badge>
            ) : null}
          </Inline>
        </KeyValue>
        <ProseBlock label="Why it matters">
          A determination is only ever true of a configuration. Every pin in this build is a claim
          that the item under it is the one the assessor looked at; a pin that moves without a
          change record is a claim nobody made.
        </ProseBlock>
      </Inspector.Group>
    </div>
  );
}

/* ── Diff ────────────────────────────────────────────────────────────────── */

/**
 * The CM-3 finding, stated as one. A pin that moved between the authorized
 * baseline and the candidate with no `CHG-` against it was never proposed,
 * never analysed under CM-3(2) and never approved by the board — so there is no
 * one to ask what it was supposed to do, and no verdict to appeal to when the
 * assessor asks whether the determinations underneath it still hold.
 */
export function UnrecordedChangeNotice({
  rows,
  from,
  to,
  nodeName,
}: {
  rows: PinDelta[];
  from: string;
  to: string;
  nodeName?: NodeNamer | undefined;
}) {
  if (rows.length === 0) return null;
  return (
    <Box
      className="rounded-large border border-danger-subtle bg-danger"
      paddingInline="space.200"
      paddingBlock="space.150"
    >
      <Inline space="space.100" alignBlock="start">
        <TriangleAlert className="pt-025 size-icon-medium shrink-0 text-danger" />
        <div className="min-w-0">
          <p className="font-body font-semibold text-danger">
            CM-3 — {rows.length} configuration item{rows.length === 1 ? "" : "s"} moved with no
            change record
          </p>
          <p className="pt-050 font-body-small text-default">
            {rows.length === 1 ? "This pin" : "These pins"} differ{rows.length === 1 ? "s" : ""}{" "}
            between {from} and {to} and no <Id>CHG-</Id> was ever filed against{" "}
            {rows.length === 1 ? "it" : "them"}. The movement was not proposed, so it was not
            analysed under CM-3(2), so it was not approved by the change control board — and no
            security impact verdict exists to say whether the determinations allocated to{" "}
            {rows.length === 1 ? "this component" : "these components"} survive it. This is a
            finding against the configuration management process itself, not a row in the diff.
          </p>
          <Stack className="pt-100" as="ul" space="space.075">
            {rows.map((row) => (
              <li key={`${row.node}|${row.label}`} className="font-body-small">
                <Inline
                  as="span"
                  space="space.075"
                  rowSpace="space.050"
                  alignBlock="center"
                  shouldWrap
                >
                  {row.node === "—" ? null : <Id className="text-danger">{row.node}</Id>}
                  <span className="font-medium">
                    {row.node === "—" ? row.label : (nodeName?.(row.node) ?? row.label)}
                  </span>
                  <Badge size="xsmall">{row.kind}</Badge>
                  <span className="text-subtle line-through">{row.from}</span>
                  <ArrowRight className="text-subtle size-150" />
                  <span className="font-medium">{row.to}</span>
                </Inline>
              </li>
            ))}
          </Stack>
        </div>
      </Inline>
    </Box>
  );
}

export function PinDiffTable({
  rows,
  nodeName,
}: {
  rows: PinDelta[];
  nodeName?: NodeNamer | undefined;
}) {
  if (rows.length === 0) {
    return (
      <Box paddingBlockStart="space.200">
        <Empty
          title="Nothing moved"
          description="Every pin in the candidate matches the authorized baseline, so the two builds describe the same configuration."
        />
      </Box>
    );
  }
  return (
    <Table className="table-fixed">
      <thead>
        <tr>
          <Table.Header width={104}>Component</Table.Header>
          <Table.Header>Item</Table.Header>
          <Table.Header width={148}>Kind</Table.Header>
          <Table.Header style={{ width: "38%" }}>Movement</Table.Header>
          <Table.Header width={184}>Change record</Table.Header>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => {
          const unrecorded = row.recorded === null;
          return (
            <Table.Row
              key={`${row.node}|${row.label}`}
              className={cn(unrecorded && "bg-danger")}
              title={
                unrecorded
                  ? `${row.label} moved from ${row.from} to ${row.to} with no change record — CM-3.`
                  : `${row.label} moved from ${row.from} to ${row.to} under ${row.recorded}.`
              }
            >
              <Table.Cell>
                {row.node === "—" ? (
                  <Absent />
                ) : (
                  <Id className={unrecorded ? "text-danger" : "text-subtle"}>{row.node}</Id>
                )}
              </Table.Cell>
              {/* The Component column one cell left already carries the id, and
                  `NodeRef` marks the id `shrink-0` and the name `truncate`, so
                  repeating it here protects the duplicate and truncates the only
                  unique string in the row. Name only. */}
              <Table.Cell>
                {row.node === "—" ? row.label : (nodeName?.(row.node) ?? row.label)}
              </Table.Cell>
              <Table.Cell>
                <ChangeKindChip kind={row.kind} />
              </Table.Cell>
              <Table.Cell>
                <Movement from={row.from} to={row.to} />
              </Table.Cell>
              <Table.Cell>
                {unrecorded ? (
                  <Inline as="span" space="space.075" alignBlock="center">
                    <Dot tone="danger" />
                    <span className="truncate font-medium text-danger">No change record</span>
                  </Inline>
                ) : (
                  <Id className="text-subtle">{row.recorded}</Id>
                )}
              </Table.Cell>
            </Table.Row>
          );
        })}
      </tbody>
    </Table>
  );
}

/* ── Changes ─────────────────────────────────────────────────────────────── */

function effectLabel(impact: ChangeImpact | null): { text: string; tone: Tone } {
  if (!impact) return { text: "Not analysed", tone: "neutral" };
  if (impact.contained) return { text: "Contained — nothing invalidated", tone: "neutral" };
  const rows = impact.invalidatedRows.length;
  const suspect = impact.suspectRows.length;
  return {
    text: `${rows} invalidated · ${suspect} suspect`,
    tone: rows > 0 ? "danger" : "warning",
  };
}

export function ChangeTable({
  changes,
  impacts,
  selected,
  onSelect,
  nodeName,
}: {
  changes: ChangeRecord[];
  impacts: Map<string, ChangeImpact>;
  selected?: string | null;
  onSelect?: (id: string) => void;
  nodeName?: NodeNamer | undefined;
}) {
  if (changes.length === 0) {
    return (
      <Box paddingBlockStart="space.200">
        <Empty
          title="No change records"
          description="Nothing has been proposed against this program's baseline. A program with a live candidate build and no change records is not a stable program — it is an unmanaged one."
        />
      </Box>
    );
  }
  return (
    <Table className="table-fixed">
      <thead>
        <tr>
          <Table.Header width={100}>Change</Table.Header>
          <Table.Header width={148}>Kind</Table.Header>
          <Table.Header>Subject</Table.Header>
          <Table.Header style={{ width: "30%" }}>Movement</Table.Header>
          <Table.Header width={104}>Requested</Table.Header>
          <Table.Header width={128}>CM-3(2)</Table.Header>
          <Table.Header width={206}>Effect</Table.Header>
        </tr>
      </thead>
      <tbody>
        {changes.map((change) => {
          const impact = impacts.get(change.id) ?? null;
          const effect = effectLabel(impact);
          return (
            <Table.Row
              key={change.id}
              className={cn(
                onSelect && "cursor-pointer",
                selected === change.id && "bg-selected",
                change.acknowledged && "opacity-disabled",
              )}
              onClick={onSelect ? () => onSelect(change.id) : undefined}
              title={change.analysis}
            >
              <Table.Cell>
                <Inline as="span" space="space.075" alignBlock="center">
                  <Id>{change.id}</Id>
                  {change.acknowledged ? (
                    <Badge size="xsmall" tone="neutral">
                      Ack
                    </Badge>
                  ) : null}
                </Inline>
              </Table.Cell>
              <Table.Cell>
                <ChangeKindChip kind={change.kind} />
              </Table.Cell>
              <Table.Cell>
                {change.node === "—" ? (
                  <Id>{change.subject}</Id>
                ) : (
                  <NodeRef id={change.node} nodeName={nodeName} />
                )}
              </Table.Cell>
              <Table.Cell>
                <Movement from={change.from} to={change.to} />
              </Table.Cell>
              <Table.Cell className="tabular-nums">{change.requested}</Table.Cell>
              <Table.Cell>
                <ImpactChip impact={change.impact} />
              </Table.Cell>
              <Table.Cell
                className={cn(
                  effect.tone === "danger"
                    ? "text-danger"
                    : effect.tone === "warning"
                      ? "text-warning"
                      : "",
                )}
              >
                {effect.text}
              </Table.Cell>
            </Table.Row>
          );
        })}
      </tbody>
    </Table>
  );
}

export function ChangeRail({
  change,
  impact,
  onAcknowledge,
  onOpenImpact,
}: {
  change: ChangeRecord;
  impact: ChangeImpact | null;
  onAcknowledge?: (id: string, next: boolean) => void;
  onOpenImpact?: (id: string) => void;
}) {
  return (
    <div>
      <Inspector.Group title="Change">
        <KeyValue label="Record">
          <Id>{change.id}</Id>
        </KeyValue>
        <KeyValue label="Kind">
          <ChangeKindChip kind={change.kind} />
        </KeyValue>
        <KeyValue label="Subject">
          <Id>{change.subject}</Id>
        </KeyValue>
        <KeyValue label="Against">
          <Id>{change.build}</Id>
        </KeyValue>
        <KeyValue label="From">{change.from}</KeyValue>
        <KeyValue label="To">{change.to}</KeyValue>
        <KeyValue label="Requested">
          <span className="tabular-nums">{change.requested}</span>
        </KeyValue>
        <KeyValue label="By">{change.requestedBy}</KeyValue>
        <KeyValue label="Approved by">{change.approvedBy}</KeyValue>
      </Inspector.Group>

      <Inspector.Group title="Security impact analysis">
        <KeyValue label="Verdict">
          <ImpactChip impact={change.impact} />
        </KeyValue>
        <ProseBlock label="CM-3(2) analysis">{change.analysis}</ProseBlock>
      </Inspector.Group>

      <Inspector.Group title="Effect">
        {impact === null ? (
          <ProseBlock label="Status">
            No impact record has been computed for this change.
          </ProseBlock>
        ) : impact.contained ? (
          <ProseBlock label="Contained">
            The gate stopped this change. No requirement row, evidence item, finding or inheritance
            reference is invalidated, and the analysis above is the record of why.
          </ProseBlock>
        ) : (
          <>
            <KeyValue label="Nodes touched">
              <span className="tabular-nums">{impact.touched.length}</span>
            </KeyValue>
            <KeyValue label="Invalidated">
              <span className="tabular-nums text-danger">{impact.invalidatedRows.length}</span>
            </KeyValue>
            <KeyValue label="Suspect">
              <span className="tabular-nums text-warning">{impact.suspectRows.length}</span>
            </KeyValue>
            <KeyValue label="Evidence">
              <span className="tabular-nums">{impact.invalidatedEvidence.length}</span>
            </KeyValue>
            <KeyValue label="Re-tests">
              <span className="tabular-nums">{impact.retests.length}</span>
            </KeyValue>
          </>
        )}
        <Inline className="pt-100" space="space.100" alignBlock="center" shouldWrap>
          {onOpenImpact ? (
            <Button size="small" onClick={() => onOpenImpact(change.id)}>
              Open impact
            </Button>
          ) : null}
          {onAcknowledge ? (
            <Button
              size="small"
              variant={change.acknowledged ? "subtle" : "secondary"}
              onClick={() => onAcknowledge(change.id, !change.acknowledged)}
            >
              {change.acknowledged ? "Withdraw acknowledgement" : "Acknowledge — re-verified"}
            </Button>
          ) : null}
        </Inline>
        <p className="pt-100 font-body-small text-subtle">
          Acknowledging records that the affected requirements have been re-run against the
          configuration this change produces. It removes the change from the live overlay. It does
          not create evidence, close a finding or change a determination.
        </p>
      </Inspector.Group>
    </div>
  );
}

/* ── Impact ──────────────────────────────────────────────────────────────── */

/** `${control}|${unit}|${requirement}` — the SCTM row key. */
function splitRowKey(key: string): { control: string; unit: string; requirement: string } {
  const parts = key.split("|");
  return {
    control: parts[0] ?? key,
    unit: parts[1] ?? "—",
    requirement: parts[2] ?? "—",
  };
}

/** `${program}|${component}|${control}` — the accepted inheritance reference. */
function splitInheritanceKey(key: string): { component: string; control: string } {
  const parts = key.split("|");
  return { component: parts[1] ?? "—", control: parts[2] ?? key };
}

function TouchedGroup({
  state,
  nodes,
  rule,
  nodeName,
}: {
  state: ImpactState;
  nodes: TouchedNode[];
  rule: string;
  nodeName?: NodeNamer | undefined;
}) {
  const cap = useCap(nodes, 8);
  const danger = state === "Invalidated";
  return (
    <Box
      className={cn(
        "rounded-large border",
        danger ? "border-danger-subtle bg-danger" : "border-warning-subtle bg-warning",
      )}
      paddingInline="space.200"
      paddingBlock="space.150"
    >
      <Inline space="space.100" alignBlock="baseline">
        <ImpactStateChip state={state} />
        <span
          className={cn(
            "tabular-nums font-body font-semibold",
            danger ? "text-danger" : "text-warning",
          )}
        >
          {nodes.length}
        </span>
        <span className="font-body-small text-subtle">
          composition node{nodes.length === 1 ? "" : "s"}
        </span>
      </Inline>
      <p className="pt-075 font-body-small text-default">{rule}</p>
      {nodes.length === 0 ? (
        <p className="pt-100 font-body-small text-subtle">
          No node reached this state for this change.
        </p>
      ) : (
        <Stack className="pt-100" as="ul" space="space.100">
          {cap.shown.map((node) => (
            <Box
              key={node.node}
              className={cn("border-s", danger ? "border-danger-subtle" : "border-warning-subtle")}
              as="li"
              paddingInlineStart="space.100"
            >
              <Inline space="space.100" rowSpace="space.050" alignBlock="center" shouldWrap>
                <Id className={danger ? "text-danger" : "text-warning"}>{node.node}</Id>
                <span className="font-body-small font-medium">
                  {nodeName?.(node.node) ?? node.node}
                </span>
                <Badge size="xsmall">
                  {node.hops} hop{node.hops === 1 ? "" : "s"}
                </Badge>
              </Inline>
              <p className="pt-025 font-body-small text-subtle">{node.reason}</p>
            </Box>
          ))}
        </Stack>
      )}
      {cap.hidden > 0 || cap.expanded ? (
        <Button variant="link" size="small" onClick={cap.toggle} className="pt-100">
          {cap.expanded ? "Show fewer" : `Show ${cap.hidden} more`}
        </Button>
      ) : null}
    </Box>
  );
}

/**
 * True only when the overlay actually moved the determination.
 *
 * `buildSctm` withdraws a positive claim and refuses to withdraw anything else:
 * a deficiency keeps "Other than satisfied" and is owed a re-test, and
 * "Not applicable" / "Not assessed" are scoping decisions rather than
 * assessment results to retract. `impactOf` carries the post-overlay value, so
 * the comparison here is a read, not a re-derivation of the rule.
 */
function wasWithdrawn(record: AuditRecord): boolean {
  return record.toDetermination !== undefined && record.toDetermination !== record.from;
}

/** The determination cell of an invalidated row: strike only what was struck. */
function DeterminationOutcome({ record }: { record: AuditRecord }) {
  const withdrawn = wasWithdrawn(record);
  return (
    <Inline as="span" space="space.075" alignBlock="center">
      <span className={cn("shrink-0 font-body-small", withdrawn && "text-subtle line-through")}>
        {record.from}
      </span>
      {withdrawn ? <ArrowRight className="shrink-0 text-subtle size-150" /> : null}
      <Badge size="xsmall" tone={withdrawn ? "danger" : "warning"}>
        {record.outcome ?? (withdrawn ? "Withdrawn" : "Retained — re-test owed")}
      </Badge>
    </Inline>
  );
}

function InvalidatedRowTable({ records }: { records: AuditRecord[] }) {
  const cap = useCap(records, 25);
  return (
    <>
      <Table className="table-fixed">
        <thead>
          <tr>
            <Table.Header width={110}>Control</Table.Header>
            <Table.Header width={86}>Unit</Table.Header>
            <Table.Header>Requirement</Table.Header>
            <Table.Header width={300}>Determination</Table.Header>
          </tr>
        </thead>
        <tbody>
          {cap.shown.map((record) => {
            const row = splitRowKey(record.ref);
            return (
              <Table.Row key={record.id} title={record.why}>
                <Table.Id id={row.control} />
                <Table.Cell>
                  <Badge size="xsmall">{row.unit}</Badge>
                </Table.Cell>
                <Table.Cell>
                  <Id>{row.requirement}</Id>
                </Table.Cell>
                <Table.Cell>
                  <DeterminationOutcome record={record} />
                </Table.Cell>
              </Table.Row>
            );
          })}
        </tbody>
      </Table>
      <MoreButton
        hidden={cap.hidden}
        expanded={cap.expanded}
        onToggle={cap.toggle}
        noun="invalidated rows"
      />
    </>
  );
}

function SuspectRowTable({ records }: { records: AuditRecord[] }) {
  const cap = useCap(records, 20);
  return (
    <>
      <Table className="table-fixed">
        <thead>
          <tr>
            <Table.Header width={110}>Control</Table.Header>
            <Table.Header width={86}>Unit</Table.Header>
            <Table.Header>Requirement</Table.Header>
            <Table.Header width={220}>Determination</Table.Header>
          </tr>
        </thead>
        <tbody>
          {cap.shown.map((record) => {
            const row = splitRowKey(record.ref);
            return (
              <Table.Row key={record.id} title={record.why}>
                <Table.Id id={row.control} />
                <Table.Cell>
                  <Badge size="xsmall">{row.unit}</Badge>
                </Table.Cell>
                <Table.Cell>
                  <Id>{row.requirement}</Id>
                </Table.Cell>
                <Table.Cell>
                  <Inline as="span" space="space.075" alignBlock="center">
                    <span className="shrink-0 font-body-small">{record.from}</span>
                    <Badge size="xsmall" tone="warning">
                      {record.outcome ?? "Stands — flagged"}
                    </Badge>
                  </Inline>
                </Table.Cell>
              </Table.Row>
            );
          })}
        </tbody>
      </Table>
      <MoreButton
        hidden={cap.hidden}
        expanded={cap.expanded}
        onToggle={cap.toggle}
        noun="suspect rows"
      />
    </>
  );
}

function AuditTrail({ records }: { records: AuditRecord[] }) {
  const cap = useCap(records, 12);
  return (
    <>
      <Table className="table-fixed">
        <thead>
          <tr>
            <Table.Header width={124}>Record</Table.Header>
            <Table.Header width={148}>Scope</Table.Header>
            <Table.Header width={200}>Reference</Table.Header>
            <Table.Header width={220}>Transition</Table.Header>
            <Table.Header>Basis</Table.Header>
          </tr>
        </thead>
        <tbody>
          {cap.shown.map((record) => (
            <Table.Row key={record.id} title={record.why}>
              <Table.Id id={record.id} />
              <Table.Cell>{record.scope}</Table.Cell>
              <Table.Cell>
                <Id>{record.ref}</Id>
              </Table.Cell>
              <Table.Cell>
                <Movement from={record.from} to={record.to} />
              </Table.Cell>
              <Table.Cell>{record.why}</Table.Cell>
            </Table.Row>
          ))}
        </tbody>
      </Table>
      <MoreButton
        hidden={cap.hidden}
        expanded={cap.expanded}
        onToggle={cap.toggle}
        noun="audit records"
      />
    </>
  );
}

function IdChips({ ids, tone = "neutral" }: { ids: string[]; tone?: Tone }) {
  return (
    <Inline className="pt-150" space="space.075" shouldWrap>
      {ids.map((id) => (
        <Badge key={id} tone={tone}>
          <span className="font-body-xsmall">{id}</span>
        </Badge>
      ))}
    </Inline>
  );
}

/**
 * The centrepiece.
 *
 * It is written so that the two verdicts read as two different *results*, never
 * as "something" and "nothing". A contained change gets the same verdict panel,
 * the same analysis in full and the same tile strip — the tiles just read zero,
 * and that row of zeros is the claim the ISSE is accountable for.
 */
export function ImpactView({
  change,
  impact,
  nodeName,
  onAcknowledge,
}: {
  change: ChangeRecord;
  impact: ChangeImpact | null;
  nodeName?: NodeNamer | undefined;
  onAcknowledge?: (id: string, next: boolean) => void;
}) {
  const invalidatedNodes = useMemo(
    () => (impact?.touched ?? []).filter((t) => t.state === "Invalidated"),
    [impact],
  );
  const suspectNodes = useMemo(
    () => (impact?.touched ?? []).filter((t) => t.state === "Suspect"),
    [impact],
  );
  const rowRecords = useMemo(
    () => (impact?.records ?? []).filter((r) => r.scope === "SCTM row"),
    [impact],
  );
  const invalidatedRowRecords = useMemo(
    () => rowRecords.filter((r) => r.to === "Invalidated"),
    [rowRecords],
  );
  const suspectRowRecords = useMemo(
    () => rowRecords.filter((r) => r.to === "Suspect"),
    [rowRecords],
  );
  // Invalidated is a currency; withdrawn is what happened to the determination
  // underneath it, and the two are not the same number. Both are read off the
  // records rather than recomputed, so this view cannot drift from the matrix.
  const withdrawnCount = useMemo(
    () => invalidatedRowRecords.filter(wasWithdrawn).length,
    [invalidatedRowRecords],
  );
  const retainedCount = invalidatedRowRecords.length - withdrawnCount;

  if (!impact) {
    return (
      <Empty
        title="No impact record"
        description={`${change.id} has no computed impact. A change record with no analysis behind it cannot be reasoned about.`}
      />
    );
  }

  const contained = impact.contained;
  const gateRecord = impact.records[0] ?? null;

  // Three different things happen to a row, and collapsing them into one verb
  // is the whole defect: a withdrawal is a retraction, a retention is a
  // deficiency that still counts against the program, and a flag is neither.
  const clauses: string[] = [];
  if (withdrawnCount > 0) {
    clauses.push(`${withdrawnCount} determination${withdrawnCount === 1 ? "" : "s"} withdrawn`);
  }
  if (retainedCount > 0) {
    clauses.push(`${retainedCount} retained with a re-test owed`);
  }
  if (impact.suspectRows.length > 0) {
    clauses.push(`${impact.suspectRows.length} flagged for the assessor`);
  }
  const headline =
    clauses.length === 0
      ? "The cascade reached no requirement row. Nothing is withdrawn or flagged."
      : `${clauses.join(", ")}.`;

  return (
    <Stack space="space.300">
      {/* Verdict */}
      <Box
        className={cn(
          "rounded-large border",
          contained ? "border-default bg-surface-sunken" : "border-warning-subtle bg-warning",
        )}
        paddingInline="space.200"
        paddingBlock="space.150"
      >
        <Inline space="space.100" alignBlock="center" shouldWrap>
          <span className="font-heading-xxsmall uppercase text-subtle">
            CM-3(2) security impact analysis
          </span>
          <ImpactChip impact={change.impact} />
          <Badge tone={contained ? "success" : "danger"}>
            {contained ? "Contained" : "Cascaded"}
          </Badge>
          <Inline className="ml-auto" as="span" space="space.100" alignBlock="center">
            <Id>{change.id}</Id>
            {change.acknowledged ? <Badge size="xsmall">Acknowledged</Badge> : null}
          </Inline>
        </Inline>

        <h3 className="pt-100 font-body-large font-semibold">
          {contained
            ? "The analysis stopped the cascade. No determination is withdrawn."
            : headline}
        </h3>

        <p className="pt-075 font-body-small text-subtle">
          {change.kind} · {change.subject} · <span className="line-through">{change.from}</span> →{" "}
          {change.to} · requested {change.requested} by {change.requestedBy} · approved by{" "}
          {change.approvedBy}
        </p>

        <Box className="border-t border-default" paddingBlockStart="space.150">
          <div className="font-heading-xxsmall uppercase text-subtle">
            The ISSE&rsquo;s written analysis
          </div>
          <p className="pt-050 font-body-small text-default">{change.analysis}</p>
        </Box>

        {contained ? (
          <p className="pt-150 border-t border-default font-body-small text-subtle">
            Nothing is missing from this page. A change analysed as{" "}
            <span className="font-medium text-default">{change.impact.toLowerCase()}</span> impact
            is a <span className="font-medium text-default">result</span>, not an absence: the zeros
            below are the claim, the paragraph above is the reasoning, and both are on the record
            under {gateRecord?.id ?? "the change"}. An implementation that skipped the gate would
            have turned most of this program&rsquo;s matrix amber on this change alone, and nobody
            would have been able to say why.
          </p>
        ) : null}

        {onAcknowledge ? (
          <Inline className="pt-150" space="space.100" alignBlock="center">
            <Button
              size="small"
              variant={change.acknowledged ? "subtle" : "secondary"}
              onClick={() => onAcknowledge(change.id, !change.acknowledged)}
            >
              {change.acknowledged ? "Withdraw acknowledgement" : "Acknowledge — re-verified"}
            </Button>
            <span className="font-body-small text-subtle">
              {change.acknowledged
                ? "This change is not applied to the live matrix."
                : "Removes the change from the live overlay. Creates no evidence."}
            </span>
          </Inline>
        ) : null}
      </Box>

      {/* Effect tiles */}
      <Grid
        className="overflow-hidden rounded-large border border-default bg-neutral"
        gap="space.025"
        templateColumns={{
          base: "repeat(2, minmax(0, 1fr))",
          sm: "repeat(3, minmax(0, 1fr))",
          lg: "repeat(6, minmax(0, 1fr))",
        }}
      >
        <Stat.Tile
          label="Nodes touched"
          value={impact.touched.length}
          note={`${invalidatedNodes.length} invalidated · ${suspectNodes.length} suspect`}
          tone="warning"
        />
        <Stat.Tile
          label="Rows invalidated"
          value={impact.invalidatedRows.length}
          note={
            invalidatedRowRecords.length === 0
              ? "no determination affected"
              : `${withdrawnCount} withdrawn · ${retainedCount} re-test owed`
          }
          tone="danger"
        />
        <Stat.Tile
          label="Rows suspect"
          value={impact.suspectRows.length}
          note="determination stands, assessor flagged"
          tone="warning"
        />
        <Stat.Tile
          label="Evidence superseded"
          value={impact.invalidatedEvidence.length}
          note="collected before the change was requested"
          tone="warning"
        />
        <Stat.Tile
          label="Findings to re-check"
          value={impact.reopenCandidates.length}
          note="closed against a configuration that moved"
          tone="warning"
        />
        <Stat.Tile
          label="Re-tests owed"
          value={impact.retests.length}
          note="distinct requirement, component and method"
          tone="warning"
        />
      </Grid>

      {contained ? (
        <Section
          title="Audit record"
          description="The gate produces a record whether or not it cascades. This is the one line a package reviewer reads to see that the change was analysed and why the analysis ended here."
        >
          <Box paddingBlockStart="space.200">
            <AuditTrail records={impact.records} />
          </Box>
        </Section>
      ) : null}

      {!contained ? (
        <>
          <Section
            title="Touched components"
            description="Two states, two rules, and the direction between them is the doctrine. Descending the composition tree invalidates; ascending it only casts suspicion. Reversing that would make one package bump invalidate the whole system."
          >
            {impact.touched.length === 0 ? (
              <Box paddingBlockStart="space.200">
                <Empty
                  title="Not scoped to a component"
                  description={
                    change.kind === "Control parameter"
                      ? `An organization-defined parameter is a property of the requirement, not of any one component. ${change.subject} moved from ${change.from} to ${change.to}, so every ${change.subject} row is invalidated wherever the graph allocated it — the cascade runs over the requirement set, not over the composition tree.`
                      : `A provider re-assessment is a property of the inheritance reference, not of this program's inventory. ${change.subject} moved from ${change.from} to ${change.to}, so every row inherited from that provider is invalidated without any node in this graph being touched.`
                  }
                />
              </Box>
            ) : (
              <Grid
                className="pt-200"
                gap="space.150"
                templateColumns={{ lg: "repeat(2, minmax(0, 1fr))" }}
              >
                <TouchedGroup
                  state="Invalidated"
                  nodes={invalidatedNodes}
                  rule="The changed component and everything contained in it. A part inside a component that moved is not the part that was assessed, so its determinations no longer describe anything in force."
                  nodeName={nodeName}
                />
                <TouchedGroup
                  state="Suspect"
                  nodes={suspectNodes}
                  rule="Everything that contains the changed component, and everything that reaches it over a critical path. Their own controls may still hold, so the assessor is asked rather than told."
                  nodeName={nodeName}
                />
              </Grid>
            )}
          </Section>

          <Section
            title="Determinations affected"
            description={`${
              invalidatedRowRecords.length === 0
                ? "No requirement row was"
                : `${invalidatedRowRecords.length} requirement row${
                    invalidatedRowRecords.length === 1 ? " was" : "s were"
                  }`
            } taken against the configuration this change replaces. ${
              invalidatedRowRecords.length === 0
                ? "Nothing is withdrawn"
                : withdrawnCount === 0
                  ? "None of them is a positive claim, so nothing is withdrawn"
                  : `${withdrawnCount} positive claim${
                      withdrawnCount === 1 ? " is" : "s are"
                    } withdrawn and struck through — an assessor has to be able to see what was claimed and when it stopped counting`
            }${
              retainedCount === 0
                ? "."
                : `; the other ${retainedCount} ${
                    retainedCount === 1
                      ? "is a deficiency or scoping decision that stands"
                      : "are deficiencies or scoping decisions that stand"
                  } and ${
                    retainedCount === 1 ? "is" : "are"
                  } re-tested rather than re-scored, because withdrawing an open deficiency to "Not assessed" would sever the POA&M obligation.`
            }`}
            action={
              <span className="tabular-nums font-body-small text-subtle">
                {withdrawnCount} withdrawn · {retainedCount} re-test owed
              </span>
            }
          >
            {invalidatedRowRecords.length === 0 ? (
              <Box paddingBlockStart="space.200">
                <Empty
                  title="No determination affected"
                  description={
                    impact.suspectRows.length > 0
                      ? "Nothing this change reaches is retracted. Every row it touches keeps its determination and is flagged for the assessor below."
                      : "The change touched components, but no requirement row is allocated to any of them."
                  }
                />
              </Box>
            ) : (
              <Box paddingBlockStart="space.200">
                <InvalidatedRowTable records={invalidatedRowRecords} />
              </Box>
            )}
          </Section>

          {suspectRowRecords.length > 0 ? (
            <Section
              title="Determinations flagged"
              description="Allocated to a component that contains or reaches the change but is not itself altered by it. These determinations stand and still count toward coverage; they are put in front of the assessor rather than taken away."
              action={
                <span className="tabular-nums font-body-small text-subtle">
                  {impact.suspectRows.length} row{impact.suspectRows.length === 1 ? "" : "s"}
                </span>
              }
            >
              <Box paddingBlockStart="space.200">
                <SuspectRowTable records={suspectRowRecords} />
              </Box>
            </Section>
          ) : null}

          {impact.invalidatedEvidence.length > 0 ? (
            <Section
              title="Evidence superseded"
              description="Cited by an invalidated row and collected before the change was requested, so it describes the configuration the change replaces. Evidence gathered after the request date survives."
            >
              <IdChips ids={impact.invalidatedEvidence} tone="warning" />
            </Section>
          ) : null}

          {impact.reopenCandidates.length > 0 ? (
            <Section
              title="Closures to re-confirm"
              description="A finding closed against a configuration that no longer exists has not been proven closed against the one that does. This is a queue for the assessor — nothing here has been re-opened."
            >
              <IdChips ids={impact.reopenCandidates} tone="warning" />
            </Section>
          ) : null}

          {impact.invalidatedInheritance.length > 0 ? (
            <Section
              title="Inheritance references invalidated"
              description="The program accepted a named assessment from this provider. That is no longer the assessment the provider publishes, so the accepted reference points at something that has moved."
            >
              <Table className="table-fixed">
                <thead>
                  <tr>
                    <Table.Header width={140}>Provider</Table.Header>
                    <Table.Header width={140}>Control</Table.Header>
                    <Table.Header>State</Table.Header>
                  </tr>
                </thead>
                <tbody>
                  {impact.invalidatedInheritance.map((reference) => {
                    const parsed = splitInheritanceKey(reference);
                    return (
                      <Table.Row key={reference}>
                        <Table.Cell>
                          <Id>{parsed.component}</Id>
                        </Table.Cell>
                        <Table.Id id={parsed.control} />
                        <Table.Cell>
                          <Inline as="span" space="space.075" alignBlock="center">
                            <span className="font-body-small text-subtle line-through">
                              Accepted
                            </span>
                            <ArrowRight className="shrink-0 text-subtle size-150" />
                            <Badge size="xsmall" tone="danger">
                              Invalidated
                            </Badge>
                          </Inline>
                        </Table.Cell>
                      </Table.Row>
                    );
                  })}
                </tbody>
              </Table>
            </Section>
          ) : null}

          <Section
            title="Audit trail"
            description={`${impact.records.length} state transition${
              impact.records.length === 1 ? "" : "s"
            }, each with the basis on which it was made. Every row above is derived from one of these; nothing changes state off the record.`}
          >
            <Box paddingBlockStart="space.200">
              <AuditTrail records={impact.records} />
            </Box>
          </Section>
        </>
      ) : null}
    </Stack>
  );
}

/* ── Retest queue ────────────────────────────────────────────────────────── */

export function RetestQueueTable({
  items,
  nodeName,
}: {
  items: RetestItem[];
  nodeName?: NodeNamer | undefined;
}) {
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState(60);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q === "") return items;
    return items.filter((item) =>
      [item.control, item.requirement, item.node, item.method, item.procedure ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [items, query]);

  const withProcedure = useMemo(
    () => filtered.filter((i) => i.procedure !== null).length,
    [filtered],
  );

  if (items.length === 0) {
    return (
      <Box paddingBlockStart="space.200">
        <Empty
          title="Nothing owed"
          description="No live change has withdrawn a determination, so no requirement is waiting to be re-verified against the configuration in force."
        />
      </Box>
    );
  }

  const shown = filtered.slice(0, limit);

  return (
    <>
      <Toolbar
        search={query}
        onSearch={(v) => {
          setQuery(v);
          setLimit(60);
        }}
        placeholder="Control, requirement, component"
        actions={
          <span className="tabular-nums font-body-small text-subtle">
            {withProcedure} of {filtered.length} have an executable procedure
          </span>
        }
      >
        <span className="font-body-small text-subtle">
          showing {shown.length} of {filtered.length}
          {filtered.length === items.length ? "" : ` (${items.length} total)`}
        </span>
      </Toolbar>
      <Table className="table-fixed">
        <thead>
          <tr>
            <Table.Header width={104}>Control</Table.Header>
            <Table.Header width={132}>Requirement</Table.Header>
            <Table.Header style={{ width: "23%" }}>Component</Table.Header>
            <Table.Header width={120}>Method</Table.Header>
            <Table.Header width={116}>Procedure</Table.Header>
            <Table.Header>Why it is owed</Table.Header>
          </tr>
        </thead>
        <tbody>
          {shown.map((item) => (
            <Table.Row
              key={`${item.control}|${item.requirement}|${item.node}|${item.method}`}
              title={item.reason}
            >
              <Table.Id id={item.control} />
              <Table.Cell>
                <Id>{item.requirement}</Id>
              </Table.Cell>
              <Table.Cell>
                <NodeRef id={item.node} nodeName={nodeName} />
              </Table.Cell>
              <Table.Cell>
                <Badge size="xsmall">{item.method}</Badge>
              </Table.Cell>
              <Table.Cell>
                {item.procedure ? (
                  <Id>{item.procedure}</Id>
                ) : (
                  <span className="font-body-small text-subtle">None — by hand</span>
                )}
              </Table.Cell>
              <Table.Cell>{item.reason}</Table.Cell>
            </Table.Row>
          ))}
        </tbody>
      </Table>
      {shown.length < filtered.length ? (
        <Box paddingBlockStart="space.100">
          <Button variant="link" size="small" onClick={() => setLimit((n) => n + 120)}>
            Show {Math.min(120, filtered.length - shown.length)} more
          </Button>
        </Box>
      ) : null}
      {filtered.length === 0 ? (
        <Box paddingBlockStart="space.200">
          <Empty
            title="No match"
            description={`Nothing in the re-test queue matches “${query}”.`}
          />
        </Box>
      ) : null}
    </>
  );
}

/** How much work the live changes have created, by verification method. */
export function RetestSummary({ items }: { items: RetestItem[] }) {
  const byMethod = useMemo(() => {
    const counts = new Map<string, number>();
    for (const item of items) counts.set(item.method, (counts.get(item.method) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  }, [items]);
  const automatable = items.filter((i) => i.procedure !== null).length;
  const controls = new Set(items.map((i) => i.control)).size;
  const components = new Set(items.map((i) => i.node)).size;

  return (
    <Grid
      className="overflow-hidden rounded-large border border-default bg-neutral"
      gap="space.025"
      templateColumns={{ base: "repeat(2, minmax(0, 1fr))", sm: "repeat(4, minmax(0, 1fr))" }}
    >
      {/* A numeric note under a value reads as a decomposition of it, so the
          whole-queue method split belongs on the whole-queue tile and nowhere
          else — beside `automatable` it read "9 with a procedure, of which 377
          inspection and 50 test". */}
      <Stat.Tile
        label="Re-tests owed"
        value={items.length}
        note={
          byMethod.length === 0
            ? "distinct requirement and component"
            : byMethod.map(([m, n]) => `${n} ${m.toLowerCase()}`).join(" · ")
        }
      />
      <Stat.Tile label="Controls" value={controls} note="carrying at least one invalidated row" />
      <Stat.Tile label="Components" value={components} note="the work is allocated to" />
      <Stat.Tile
        label="With a procedure"
        value={automatable}
        note={`${items.length - automatable} done by hand`}
      />
    </Grid>
  );
}
