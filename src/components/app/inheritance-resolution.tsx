/**
 * Inheritance resolution presentation — the "why this provider, and what do I
 * still owe" surface.
 *
 * An inherited control looks like a saving until an assessor asks two questions
 * the old matrix could not answer. *Why this provider?* — a control offered by
 * two components used to resolve on seed order, and the loser vanished. *What do
 * I still owe?* — a Shared control used to render as "Inherited", which told the
 * AO the program owed nothing on exactly the rows where it owes the most.
 *
 * So the conflict list and the obligation column are the load-bearing parts of
 * this file, not decoration. A row with shared responsibility and no stated
 * obligation is called out in red rather than shown as an em dash, because an
 * unstated obligation is the failure mode the product exists to surface: nobody
 * implements it, nobody assesses it, and the package ships with a hole in it.
 *
 * Presentation only. Every value arrives as a prop from `@/lib/inheritance`;
 * nothing here resolves, ranks or filters anything. Routes own the links.
 */

import type { ReactNode } from "react";

import {
  Badge,
  Dot,
  EmptyState,
  KeyValue,
  Meter,
  Mono,
  RailGroup,
  StackedBar,
  Table,
  Td,
  Th,
  Tr,
  type Tone,
} from "@/components/app/ui";
import {
  designationTone,
  inheritanceStateTone,
  shareTone,
  type InheritanceConflict,
  type inheritanceSummary,
  type ResolvedInheritance,
} from "@/lib/inheritance";
import { cn } from "@/lib/utils";

/* ── Shared reads ────────────────────────────────────────────────────────── */

/** The shape `inheritanceSummary` returns, named so props can carry it. */
export type InheritanceSummaryCounts = ReturnType<typeof inheritanceSummary>;

/** One losing candidate paired with the winner it lost to. */
export type ConflictEntry = {
  control: string;
  winner: ResolvedInheritance;
  conflict: InheritanceConflict;
};

function Dash() {
  return <span className="text-muted-foreground">—</span>;
}

function isBlank(value: string): boolean {
  const trimmed = value.trim();
  return trimmed === "" || trimmed === "—";
}

/**
 * The gap this screen exists to surface: the provider named the consumer as a
 * co-implementer and then named nothing for the consumer to do. Provider-only
 * rows are excluded — a fully inherited control genuinely owes nothing.
 */
export function obligationUnstated(row: ResolvedInheritance): boolean {
  return row.share !== "Provider" && isBlank(row.consumerObligation);
}

/** Rows where the consuming system carries work of its own. */
export function carriesObligation(row: ResolvedInheritance): boolean {
  return row.share !== "Provider";
}

type VersionRead = {
  accepted: string;
  offered: string;
  drifted: boolean;
  detail: string;
};

/**
 * Inheritance is a versioned reference, not a snapshot: what the consumer signed
 * for and what the provider ships today are two different facts, and the gap
 * between them is the whole point of the column.
 */
function versionRead(row: ResolvedInheritance): VersionRead {
  const offered = row.component.version;
  const offeredAssessment = row.provided.assessmentVersion;
  if (!row.accepted) {
    return {
      accepted: "—",
      offered,
      drifted: true,
      detail: `Nothing accepted. ${row.component.name} offers ${offered}, assessed under ${offeredAssessment} on ${row.provided.assessedOn}.`,
    };
  }
  const drifted =
    row.accepted.acceptedVersion !== offered ||
    row.accepted.acceptedAssessmentVersion !== offeredAssessment;
  return {
    accepted: row.accepted.acceptedVersion,
    offered,
    drifted,
    detail: drifted
      ? `Accepted ${row.accepted.acceptedVersion} / ${row.accepted.acceptedAssessmentVersion} on ${row.accepted.acceptedOn}; the provider now ships ${offered} / ${offeredAssessment}.`
      : `Accepted ${row.accepted.acceptedVersion} / ${row.accepted.acceptedAssessmentVersion} on ${row.accepted.acceptedOn}; unchanged since.`,
  };
}

/* ── Chips ───────────────────────────────────────────────────────────────── */

export function InheritanceStateChip({ row }: { row: ResolvedInheritance }) {
  return (
    <span title={row.stateReason}>
      <Badge size="xs" tone={inheritanceStateTone[row.state]}>
        {row.state}
      </Badge>
    </span>
  );
}

export function DesignationChip({ row }: { row: ResolvedInheritance }) {
  return (
    <span title={`eMASS implementation status: ${row.emassStatus}`}>
      <Badge size="xs" tone={designationTone[row.designation]}>
        {row.designation}
      </Badge>
    </span>
  );
}

/* ── ResolutionTable ─────────────────────────────────────────────────────── */

export function ResolutionTable({
  rows,
  selected,
  onSelect,
}: {
  rows: ResolvedInheritance[];
  /** Control natural key of the highlighted row. */
  selected?: string | null;
  onSelect?: (control: string) => void;
}) {
  if (rows.length === 0) {
    return (
      <div className="pt-4">
        <EmptyState
          title="Nothing inherited"
          description="No reusable component lists this program as a consumer, so every control is system-specific and assessed here."
        />
      </div>
    );
  }

  return (
    <Table className="table-fixed">
      <colgroup>
        <col style={{ width: "88px" }} />
        <col style={{ width: "184px" }} />
        <col style={{ width: "92px" }} />
        <col style={{ width: "124px" }} />
        <col style={{ width: "84px" }} />
        <col style={{ width: "128px" }} />
        <col style={{ width: "132px" }} />
        <col />
      </colgroup>
      <thead>
        <tr>
          <Th>Control</Th>
          <Th>Provider</Th>
          <Th>Tier</Th>
          <Th>Designation</Th>
          <Th>Share</Th>
          <Th>Accepted → offered</Th>
          <Th>State</Th>
          <Th>This system still owes</Th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => {
          const version = versionRead(row);
          const unstated = obligationUnstated(row);
          return (
            <Tr
              key={row.control}
              className={cn(
                onSelect ? "cursor-pointer" : undefined,
                selected === row.control ? "bg-primary-soft/40" : undefined,
              )}
              onClick={onSelect ? () => onSelect(row.control) : undefined}
            >
              <Td>
                <Mono className={onSelect ? "text-primary" : "text-foreground"}>{row.control}</Mono>
              </Td>
              <Td
                className="truncate"
                title={`${row.component.id} — ${row.component.name} (${row.component.provider})`}
              >
                {row.component.name}
              </Td>
              <Td className="text-muted-foreground">{row.tier}</Td>
              <Td>
                <DesignationChip row={row} />
              </Td>
              <Td>
                <Badge size="xs" tone={shareTone[row.share]}>
                  {row.share}
                </Badge>
              </Td>
              <Td title={version.detail}>
                {row.accepted ? (
                  <span className="flex items-center gap-1">
                    <Mono className="text-muted-foreground">{version.accepted}</Mono>
                    <span className="text-border-strong">→</span>
                    <Mono className={version.drifted ? "text-warning" : "text-muted-foreground"}>
                      {version.offered}
                    </Mono>
                  </span>
                ) : (
                  <Badge size="xs" tone="warning">
                    Never accepted
                  </Badge>
                )}
              </Td>
              <Td>
                <InheritanceStateChip row={row} />
              </Td>
              <Td
                className={cn("truncate", unstated ? "text-danger" : "text-muted-foreground")}
                title={
                  unstated
                    ? `${row.component.name} offers ${row.control} as ${row.provided.model} but states no consumer obligation.`
                    : row.consumerObligation
                }
              >
                {unstated ? (
                  <span className="flex items-center gap-1.5">
                    <Dot tone="danger" />
                    <span className="truncate font-medium">Obligation not stated</span>
                  </span>
                ) : isBlank(row.consumerObligation) ? (
                  <span title="Fully inherited — the provider carries this control end to end.">
                    Nothing — fully inherited
                  </span>
                ) : (
                  row.consumerObligation
                )}
              </Td>
            </Tr>
          );
        })}
      </tbody>
    </Table>
  );
}

/* ── ConflictList ────────────────────────────────────────────────────────── */

function ProviderCard({
  caption,
  tone,
  name,
  id,
  tier,
  model,
}: {
  caption: string;
  tone: Tone;
  name: string;
  id: string;
  tier: string;
  model: string;
}) {
  const ring: Record<Tone, string> = {
    neutral: "border-border",
    success: "border-success/35",
    warning: "border-warning/35",
    danger: "border-danger/35",
    info: "border-info/35",
  };
  return (
    <div className={cn("rounded-md border bg-card px-3 py-2.5", ring[tone])}>
      <div className="flex items-center gap-1.5">
        <Dot tone={tone} />
        <span className="text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
          {caption}
        </span>
      </div>
      <div className="mt-1 truncate text-[13px] font-medium" title={name}>
        {name}
      </div>
      <div className="mt-1 flex flex-wrap items-center gap-1.5">
        <Mono className="text-muted-foreground">{id}</Mono>
        <Badge size="xs">{tier} tier</Badge>
        <Badge size="xs">{model}</Badge>
      </div>
    </div>
  );
}

export function ConflictList({
  items,
  nameOf,
}: {
  items: ConflictEntry[];
  /** Resolves a CMP- id to its display name; ids stand alone without it. */
  nameOf?: (componentId: string) => string;
}) {
  if (items.length === 0) {
    return (
      <div className="pt-4">
        <EmptyState
          title="No provider competed for a control"
          description="Every inherited control on this system is offered by exactly one component, so the CCP tier ladder had nothing to deconflict."
        />
      </div>
    );
  }

  return (
    <div className="divide-y divide-border">
      {items.map((item) => (
        <article key={`${item.control}|${item.conflict.component}`} className="py-4 last:pb-0">
          <div className="flex flex-wrap items-center gap-2">
            <Mono>{item.control}</Mono>
            <span className="min-w-0 truncate text-[13px] font-medium">
              {item.winner.provided.title}
            </span>
            <span className="ml-auto flex items-center gap-1.5">
              <DesignationChip row={item.winner} />
              <InheritanceStateChip row={item.winner} />
            </span>
          </div>

          <div className="mt-2.5 grid gap-2 md:grid-cols-2">
            <ProviderCard
              caption="Resolved to"
              tone="success"
              name={item.winner.component.name}
              id={item.winner.component.id}
              tier={item.winner.tier}
              model={item.winner.provided.model}
            />
            <ProviderCard
              caption="Deconflicted"
              tone="neutral"
              name={nameOf ? nameOf(item.conflict.component) : item.conflict.component}
              id={item.conflict.component}
              tier={item.conflict.tier}
              model={item.conflict.model}
            />
          </div>

          <p className="mt-2.5 text-[12.5px] leading-relaxed text-muted-foreground">
            {item.conflict.reason}
          </p>
        </article>
      ))}
    </div>
  );
}

/* ── ObligationList ──────────────────────────────────────────────────────── */

export function ObligationList({ rows }: { rows: ResolvedInheritance[] }) {
  if (rows.length === 0) {
    return (
      <div className="pt-4">
        <EmptyState
          title="Nothing owed on an inherited control"
          description="Every resolved control is fully inherited: the provider implements it end to end and the consuming system carries no residual obligation."
        />
      </div>
    );
  }

  return (
    <div className="divide-y divide-border">
      {rows.map((row) => {
        const unstated = obligationUnstated(row);
        return (
          <article key={row.control} className="py-4 last:pb-0">
            <div className="flex flex-wrap items-center gap-2">
              <Mono>{row.control}</Mono>
              <span className="min-w-0 truncate text-[13px] font-medium">{row.provided.title}</span>
              <DesignationChip row={row} />
              <Badge size="xs" tone={shareTone[row.share]}>
                {row.share}
              </Badge>
              <span className="ml-auto flex items-center gap-1.5">
                <span className="truncate text-[12px] text-muted-foreground">
                  {row.component.name} · {row.tier} tier
                </span>
                <InheritanceStateChip row={row} />
              </span>
            </div>

            <div className="mt-3 grid gap-x-6 gap-y-3 md:grid-cols-2">
              <div>
                <h4 className="text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
                  {row.component.name} provides
                </h4>
                <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">
                  {isBlank(row.provided.assertion)
                    ? "The provider has published no implementation statement for this control."
                    : row.provided.assertion}
                </p>
              </div>
              <div>
                <h4 className="text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
                  This system still owes
                </h4>
                {unstated ? (
                  <div className="mt-1 flex items-start gap-2 rounded-md bg-danger-soft px-2.5 py-2 text-[12.5px] leading-relaxed text-danger">
                    <span className="pt-1.5">
                      <Dot tone="danger" />
                    </span>
                    <span className="min-w-0">
                      {row.component.name} offers {row.control} as {row.provided.model} —{" "}
                      {row.share.toLowerCase()} responsibility — and states no consumer obligation.
                      Until the obligation is written down, nobody implements it, no assessor tests
                      it, and the row ships as inherited while the consuming half of the control is
                      unimplemented.
                    </span>
                  </div>
                ) : (
                  <p className="mt-1 text-[12.5px] leading-relaxed text-foreground">
                    {row.consumerObligation}
                  </p>
                )}
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}

/* ── NotApplicableTable ──────────────────────────────────────────────────── */

export function NotApplicableTable({ rows }: { rows: ResolvedInheritance[] }) {
  if (rows.length === 0) {
    return (
      <div className="pt-4">
        <EmptyState
          title="Every offer reaches this system"
          description="No provider scoped an offer to inventory this program does not carry, so nothing was excluded on applicability."
        />
      </div>
    );
  }

  return (
    <Table className="table-fixed">
      <colgroup>
        <col style={{ width: "88px" }} />
        <col style={{ width: "220px" }} />
        <col style={{ width: "184px" }} />
        <col style={{ width: "116px" }} />
        <col />
      </colgroup>
      <thead>
        <tr>
          <Th>Control</Th>
          <Th>Title</Th>
          <Th>Offered by</Th>
          <Th>Model</Th>
          <Th>Why it does not reach this system</Th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <Tr key={`${row.control}|${row.component.id}`}>
            <Td>
              <Mono>{row.control}</Mono>
            </Td>
            <Td className="truncate" title={row.provided.title}>
              {row.provided.title}
            </Td>
            <Td className="truncate" title={`${row.component.id} — ${row.component.provider}`}>
              {row.component.name}
            </Td>
            <Td>
              <Badge size="xs">{row.provided.model}</Badge>
            </Td>
            <Td className="truncate text-muted-foreground" title={row.applicabilityReason}>
              {isBlank(row.applicabilityReason) ? <Dash /> : row.applicabilityReason}
            </Td>
          </Tr>
        ))}
      </tbody>
    </Table>
  );
}

/* ── InheritanceSummaryStats ─────────────────────────────────────────────── */

function Stat({
  label,
  value,
  note,
  tone = "neutral",
}: {
  label: string;
  value: number;
  note: string;
  tone?: Tone;
}) {
  const text: Record<Tone, string> = {
    neutral: "text-foreground",
    success: "text-success",
    warning: "text-warning",
    danger: "text-danger",
    info: "text-primary",
  };
  return (
    <div className="border-b border-border px-4 py-3 first:pl-0 md:border-b-0 md:border-r md:last:border-r-0">
      <div className="text-[12px] text-muted-foreground">{label}</div>
      <div className={cn("tnum mt-0.5 text-[20px] font-semibold tracking-[-0.02em]", text[tone])}>
        {value}
      </div>
      <div className="mt-0.5 text-[12px] text-muted-foreground">{note}</div>
    </div>
  );
}

function BreakdownRow({
  label,
  count,
  total,
  tone,
}: {
  label: ReactNode;
  count: number;
  total: number;
  tone: Tone;
}) {
  const pct = Math.round((count / (total || 1)) * 100);
  return (
    <div className="flex items-center gap-3 border-b border-border-subtle py-2 last:border-0">
      <span className="w-[132px] shrink-0 truncate text-12">{label}</span>
      <span className="min-w-0 flex-1">
        <Meter value={pct} tone={tone} />
      </span>
      <span className="tnum w-16 shrink-0 text-right text-12 text-muted-foreground">
        {count} · {pct}%
      </span>
    </div>
  );
}

export function InheritanceSummaryStats({
  summary,
  unstated = 0,
}: {
  summary: InheritanceSummaryCounts;
  /** Shared rows whose consumer obligation was never written down. */
  unstated?: number;
}) {
  const attention = summary.drifted + summary.stale;
  // A failing provider propagates its deficiency; a revoked offer reverts the
  // obligation to this system. The tile and the bar bucket them together and say
  // so in the label; the "By resolution state" breakdown below splits them, so no
  // number on this page is named after only half of what it counts.
  const legend: { key: string; label: string; value: number; tone: Tone }[] = [
    { key: "current", label: "Current", value: summary.current, tone: "success" },
    { key: "attention", label: "Drifted or stale", value: attention, tone: "warning" },
    {
      key: "failed",
      label: "Provider failed or revoked",
      value: summary.failedOrRevoked,
      tone: "danger",
    },
  ];

  return (
    <div className="space-y-5 pt-3">
      <div className="grid grid-cols-2 border-y border-border md:grid-cols-5">
        <Stat label="Resolved" value={summary.total} note="controls inherited" />
        <Stat
          label="Current"
          value={summary.current}
          note="accepted and fresh"
          tone={summary.current > 0 ? "success" : "neutral"}
        />
        <Stat
          label="Version drift"
          value={summary.drifted}
          note="provider has moved"
          tone={summary.drifted > 0 ? "warning" : "neutral"}
        />
        <Stat
          label="Provider failed or revoked"
          value={summary.failedOrRevoked}
          note="the provider offer no longer holds"
          tone={summary.failedOrRevoked > 0 ? "danger" : "neutral"}
        />
        <Stat
          label="Unstated obligation"
          value={unstated}
          note="shared, nothing written down"
          tone={unstated > 0 ? "danger" : "neutral"}
        />
      </div>

      <div>
        <StackedBar
          segments={legend.map((l) => ({
            key: l.key,
            value: l.value,
            tone: l.tone,
            title: `${l.label} — ${l.value}`,
          }))}
        />
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-2">
          {legend.map((l) => (
            <span key={l.key} className="flex items-center gap-1.5 text-12">
              <Dot tone={l.tone} />
              <span className="text-muted-foreground">{l.label}</span>
              <span className="tnum font-medium">{l.value}</span>
            </span>
          ))}
          <span className="tnum ml-auto text-12 text-muted-foreground">
            {summary.notApplicable} offered but not applicable · {summary.unaccepted} never accepted
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-x-8 gap-y-5 lg:grid-cols-2">
        <div>
          <h3 className="pb-1 text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
            By designation
          </h3>
          <BreakdownRow
            label="Common"
            count={summary.common}
            total={summary.total}
            tone="neutral"
          />
          <BreakdownRow
            label="Hybrid"
            count={summary.hybrid}
            total={summary.total}
            tone="neutral"
          />
          <BreakdownRow
            label="System-Specific"
            count={summary.systemSpecific}
            total={summary.total}
            tone="neutral"
          />
        </div>
        <div>
          <h3 className="pb-1 text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
            By resolution state
          </h3>
          <BreakdownRow
            label="Current"
            count={summary.current}
            total={summary.total}
            tone="success"
          />
          <BreakdownRow
            label="Version drift"
            count={summary.drifted}
            total={summary.total}
            tone="warning"
          />
          <BreakdownRow
            label="Evidence stale"
            count={summary.stale}
            total={summary.total}
            tone="warning"
          />
          <BreakdownRow
            label="Provider failed"
            count={summary.failed}
            total={summary.total}
            tone="danger"
          />
          <BreakdownRow
            label="Revoked"
            count={summary.revoked}
            total={summary.total}
            tone="danger"
          />
        </div>
      </div>
    </div>
  );
}

/* ── ResolutionRail ──────────────────────────────────────────────────────── */

function WrapValue({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[104px_1fr] items-baseline gap-3 py-[5px]">
      <dt className="truncate text-[12.5px] text-muted-foreground">{label}</dt>
      <dd className="min-w-0 text-[12.5px] leading-snug text-foreground">{children}</dd>
    </div>
  );
}

function ProseBlock({ label, children }: { label: string; children: string }) {
  return (
    <div className="pt-1.5">
      <div className="text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
        {label}
      </div>
      <p className="mt-1 text-[12.5px] leading-relaxed text-foreground">{children}</p>
    </div>
  );
}

export function ResolutionRail({ row }: { row: ResolvedInheritance }) {
  const version = versionRead(row);
  const unstated = obligationUnstated(row);

  return (
    <div>
      {unstated ? (
        <div className="mb-3 flex items-start gap-2 rounded-md bg-danger-soft px-2.5 py-2 text-[12.5px] leading-snug text-danger">
          <span className="pt-1.5">
            <Dot tone="danger" />
          </span>
          <span className="min-w-0 font-medium">
            Shared responsibility with no consumer obligation stated.
          </span>
        </div>
      ) : null}

      <RailGroup title="Resolution">
        <KeyValue label="Control">
          <Mono>{row.control}</Mono>
        </KeyValue>
        <WrapValue label="Title">{row.provided.title}</WrapValue>
        <KeyValue label="Family">{row.provided.family}</KeyValue>
        <WrapValue label="Provider">{row.component.name}</WrapValue>
        <KeyValue label="Component">
          <Mono>{row.component.id}</Mono>
        </KeyValue>
        <KeyValue label="CCP tier">{row.tier}</KeyValue>
        <KeyValue label="Model">{row.provided.model}</KeyValue>
        <KeyValue label="Designation">
          <DesignationChip row={row} />
        </KeyValue>
        <KeyValue label="Share">
          <Badge size="xs" tone={shareTone[row.share]}>
            {row.share}
          </Badge>
        </KeyValue>
        <KeyValue label="eMASS status">{row.emassStatus}</KeyValue>
      </RailGroup>

      <RailGroup title="State">
        <KeyValue label="Resolution">
          <Badge size="xs" tone={inheritanceStateTone[row.state]}>
            {row.state}
          </Badge>
        </KeyValue>
        <ProseBlock label="Why">{row.stateReason}</ProseBlock>
      </RailGroup>

      <RailGroup title="Acceptance">
        <KeyValue label="Accepted">
          {row.accepted ? <Mono>{version.accepted}</Mono> : <Dash />}
        </KeyValue>
        <KeyValue label="Assessment">
          {row.accepted ? <Mono>{row.accepted.acceptedAssessmentVersion}</Mono> : <Dash />}
        </KeyValue>
        <KeyValue label="Signed">{row.accepted ? row.accepted.acceptedOn : "—"}</KeyValue>
        <WrapValue label="Signed by">{row.accepted ? row.accepted.acceptedBy : "—"}</WrapValue>
        <KeyValue label="Offered">
          <Mono className={version.drifted ? "text-warning" : "text-foreground"}>
            {version.offered}
          </Mono>
        </KeyValue>
        <KeyValue label="Offered under">
          <Mono>{row.provided.assessmentVersion}</Mono>
        </KeyValue>
        <KeyValue label="Assessed">{row.provided.assessedOn}</KeyValue>
        {row.accepted && !isBlank(row.accepted.note) ? (
          <ProseBlock label="Acceptance note">{row.accepted.note}</ProseBlock>
        ) : null}
      </RailGroup>

      <RailGroup title="Evidence">
        <WrapValue label="Artifact">{row.provided.evidence}</WrapValue>
        <KeyValue label="Age">
          <span className={cn("tnum", row.stale ? "text-warning" : "")}>
            {row.evidenceAgeDays} days
          </span>
        </KeyValue>
        <KeyValue label="Provider status">
          <Badge size="xs" tone={row.provided.status === "Satisfied" ? "success" : "danger"}>
            {row.provided.status}
          </Badge>
        </KeyValue>
      </RailGroup>

      <RailGroup title="Responsibility">
        <ProseBlock label={`${row.component.name} provides`}>
          {isBlank(row.provided.assertion)
            ? "The provider has published no implementation statement for this control."
            : row.provided.assertion}
        </ProseBlock>
        <ProseBlock label="This system still owes">
          {unstated
            ? `${row.component.name} names this system as a co-implementer of ${row.control} and states no obligation. The obligation has to be written down before the row can be assessed.`
            : isBlank(row.consumerObligation)
              ? "Nothing — the provider carries this control end to end."
              : row.consumerObligation}
        </ProseBlock>
      </RailGroup>

      <RailGroup title="Applicability">
        <KeyValue label="Applies">
          <Badge size="xs" tone={row.applicable ? "success" : "neutral"}>
            {row.applicable ? "Yes" : "No"}
          </Badge>
        </KeyValue>
        <ProseBlock label="Basis">{row.applicabilityReason}</ProseBlock>
      </RailGroup>

      {row.conflicts.length > 0 ? (
        <RailGroup title={`Deconflicted (${row.conflicts.length})`}>
          {row.conflicts.map((conflict) => (
            <div key={conflict.component} className="pt-1.5 first:pt-0.5">
              <div className="flex flex-wrap items-center gap-1.5">
                <Mono className="text-muted-foreground">{conflict.component}</Mono>
                <Badge size="xs">{conflict.tier} tier</Badge>
                <Badge size="xs">{conflict.model}</Badge>
              </div>
              <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">
                {conflict.reason}
              </p>
            </div>
          ))}
        </RailGroup>
      ) : null}
    </div>
  );
}
