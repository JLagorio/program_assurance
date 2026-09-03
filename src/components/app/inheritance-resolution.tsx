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
  Absent,
  Badge,
  Box,
  Dot,
  Empty,
  Grid,
  Id,
  Inline,
  Inspector,
  KeyValue,
  Progress,
  Stack,
  Stat,
  Table,
} from "@ledger/design-system";
import type { Tone } from "@ledger/design-system";
import {
  designationTone,
  inheritanceStateTone,
  shareTone,
  type InheritanceConflict,
  type inheritanceSummary,
  type ResolvedInheritance,
} from "@/lib/inheritance";
import { cn } from "@ledger/design-system/cn";

/* ── Shared reads ────────────────────────────────────────────────────────── */

/** The shape `inheritanceSummary` returns, named so props can carry it. */
export type InheritanceSummaryCounts = ReturnType<typeof inheritanceSummary>;

/** One losing candidate paired with the winner it lost to. */
export type ConflictEntry = {
  control: string;
  winner: ResolvedInheritance;
  conflict: InheritanceConflict;
};

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
      <Badge size="xsmall" tone={inheritanceStateTone[row.state]}>
        {row.state}
      </Badge>
    </span>
  );
}

export function DesignationChip({ row }: { row: ResolvedInheritance }) {
  return (
    <span title={`eMASS implementation status: ${row.emassStatus}`}>
      <Badge size="xsmall" tone={designationTone[row.designation]}>
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
      <Box paddingBlockStart="space.200">
        <Empty
          title="Nothing inherited"
          description="No reusable component lists this program as a consumer, so every control is system-specific and assessed here."
        />
      </Box>
    );
  }

  return (
    <Table className="table-fixed">
      <thead>
        <tr>
          <Table.Header width={88}>Control</Table.Header>
          <Table.Header width={184}>Provider</Table.Header>
          <Table.Header width={92}>Tier</Table.Header>
          <Table.Header width={124}>Designation</Table.Header>
          <Table.Header width={84}>Share</Table.Header>
          <Table.Header width={128}>Accepted → offered</Table.Header>
          <Table.Header width={132}>State</Table.Header>
          <Table.Header>This system still owes</Table.Header>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => {
          const version = versionRead(row);
          const unstated = obligationUnstated(row);
          return (
            <Table.Row
              key={row.control}
              className={cn(
                onSelect ? "cursor-pointer" : undefined,
                selected === row.control ? "bg-selected" : undefined,
              )}
              onClick={onSelect ? () => onSelect(row.control) : undefined}
            >
              <Table.Id id={row.control} tone={onSelect ? "brand" : "subtle"} />
              <Table.Cell
                className="truncate"
                title={`${row.component.id} — ${row.component.name} (${row.component.provider})`}
              >
                {row.component.name}
              </Table.Cell>
              <Table.Cell>{row.tier}</Table.Cell>
              <Table.Cell>
                <DesignationChip row={row} />
              </Table.Cell>
              <Table.Cell>
                <Badge size="xsmall" tone={shareTone[row.share]}>
                  {row.share}
                </Badge>
              </Table.Cell>
              <Table.Cell title={version.detail}>
                {row.accepted ? (
                  <Inline as="span" space="space.050" alignBlock="center">
                    <Id>{version.accepted}</Id>
                    <span className="text-subtlest">→</span>
                    <Id className={version.drifted ? "text-warning" : "text-subtle"}>
                      {version.offered}
                    </Id>
                  </Inline>
                ) : (
                  <Badge size="xsmall" tone="warning">
                    Never accepted
                  </Badge>
                )}
              </Table.Cell>
              <Table.Cell>
                <InheritanceStateChip row={row} />
              </Table.Cell>
              <Table.Cell
                className={cn("truncate", unstated ? "text-danger" : "")}
                title={
                  unstated
                    ? `${row.component.name} offers ${row.control} as ${row.provided.model} but states no consumer obligation.`
                    : row.consumerObligation
                }
              >
                {unstated ? (
                  <Inline as="span" space="space.075" alignBlock="center">
                    <Dot tone="danger" />
                    <span className="truncate font-medium">Obligation not stated</span>
                  </Inline>
                ) : isBlank(row.consumerObligation) ? (
                  <span title="Fully inherited — the provider carries this control end to end.">
                    Nothing — fully inherited
                  </span>
                ) : (
                  row.consumerObligation
                )}
              </Table.Cell>
            </Table.Row>
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
    neutral: "border-default",
    success: "border-success-subtle",
    warning: "border-warning-subtle",
    danger: "border-danger-subtle",
    information: "border-information-subtle",
  };
  return (
    <Box
      className={cn("rounded-medium border bg-surface", ring[tone])}
      paddingInline="space.150"
      paddingBlock="space.100"
    >
      <Inline space="space.075" alignBlock="center">
        <Dot tone={tone} />
        <span className="font-heading-xxsmall uppercase text-subtle">{caption}</span>
      </Inline>
      <Box className="truncate font-body font-medium" title={name} paddingBlockStart="space.050">
        {name}
      </Box>
      <Inline className="pt-050" space="space.075" alignBlock="center" shouldWrap>
        <Id className="text-subtle">{id}</Id>
        <Badge size="xsmall">{tier} tier</Badge>
        <Badge size="xsmall">{model}</Badge>
      </Inline>
    </Box>
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
      <Box paddingBlockStart="space.200">
        <Empty
          title="No provider competed for a control"
          description="Every inherited control on this system is offered by exactly one component, so the CCP tier ladder had nothing to deconflict."
        />
      </Box>
    );
  }

  return (
    <div className="divide-y">
      {items.map((item) => (
        <Box
          key={`${item.control}|${item.conflict.component}`}
          className="last:pb-0"
          as="article"
          paddingBlock="space.200"
        >
          <Inline space="space.100" alignBlock="center" shouldWrap>
            <Id>{item.control}</Id>
            <span className="min-w-0 truncate font-body font-medium">
              {item.winner.provided.title}
            </span>
            <Inline className="ml-auto" as="span" space="space.075" alignBlock="center">
              <DesignationChip row={item.winner} />
              <InheritanceStateChip row={item.winner} />
            </Inline>
          </Inline>

          <Grid
            className="pt-100"
            gap="space.100"
            templateColumns={{ md: "repeat(2, minmax(0, 1fr))" }}
          >
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
          </Grid>

          <p className="pt-100 font-body-small text-subtle">{item.conflict.reason}</p>
        </Box>
      ))}
    </div>
  );
}

/* ── ObligationList ──────────────────────────────────────────────────────── */

export function ObligationList({ rows }: { rows: ResolvedInheritance[] }) {
  if (rows.length === 0) {
    return (
      <Box paddingBlockStart="space.200">
        <Empty
          title="Nothing owed on an inherited control"
          description="Every resolved control is fully inherited: the provider implements it end to end and the consuming system carries no residual obligation."
        />
      </Box>
    );
  }

  return (
    <div className="divide-y">
      {rows.map((row) => {
        const unstated = obligationUnstated(row);
        return (
          <Box key={row.control} className="last:pb-0" as="article" paddingBlock="space.200">
            <Inline space="space.100" alignBlock="center" shouldWrap>
              <Id>{row.control}</Id>
              <span className="min-w-0 truncate font-body font-medium">{row.provided.title}</span>
              <DesignationChip row={row} />
              <Badge size="xsmall" tone={shareTone[row.share]}>
                {row.share}
              </Badge>
              <Inline className="ml-auto" as="span" space="space.075" alignBlock="center">
                <span className="truncate font-body-small text-subtle">
                  {row.component.name} · {row.tier} tier
                </span>
                <InheritanceStateChip row={row} />
              </Inline>
            </Inline>

            <Grid
              className="pt-150"
              columnGap="space.300"
              rowGap="space.150"
              templateColumns={{ md: "repeat(2, minmax(0, 1fr))" }}
            >
              <div>
                <h4 className="font-heading-xxsmall uppercase text-subtle">
                  {row.component.name} provides
                </h4>
                <p className="pt-050 font-body-small text-subtle">
                  {isBlank(row.provided.assertion)
                    ? "The provider has published no implementation statement for this control."
                    : row.provided.assertion}
                </p>
              </div>
              <div>
                <h4 className="font-heading-xxsmall uppercase text-subtle">
                  This system still owes
                </h4>
                {unstated ? (
                  <Box paddingBlockStart="space.050">
                    <Inline
                      className="rounded-medium bg-danger px-100 py-100 font-body-small text-danger"
                      space="space.100"
                      alignBlock="start"
                    >
                      <Box as="span" paddingBlockStart="space.075">
                        <Dot tone="danger" />
                      </Box>
                      <span className="min-w-0">
                        {row.component.name} offers {row.control} as {row.provided.model} —{" "}
                        {row.share.toLowerCase()} responsibility — and states no consumer
                        obligation. Until the obligation is written down, nobody implements it, no
                        assessor tests it, and the row ships as inherited while the consuming half
                        of the control is unimplemented.
                      </span>
                    </Inline>
                  </Box>
                ) : (
                  <p className="pt-050 font-body-small text-default">{row.consumerObligation}</p>
                )}
              </div>
            </Grid>
          </Box>
        );
      })}
    </div>
  );
}

/* ── NotApplicableTable ──────────────────────────────────────────────────── */

export function NotApplicableTable({ rows }: { rows: ResolvedInheritance[] }) {
  if (rows.length === 0) {
    return (
      <Box paddingBlockStart="space.200">
        <Empty
          title="Every offer reaches this system"
          description="No provider scoped an offer to inventory this program does not carry, so nothing was excluded on applicability."
        />
      </Box>
    );
  }

  return (
    <Table className="table-fixed">
      <thead>
        <tr>
          <Table.Header width={88}>Control</Table.Header>
          <Table.Header width={220}>Title</Table.Header>
          <Table.Header width={184}>Offered by</Table.Header>
          <Table.Header width={116}>Model</Table.Header>
          <Table.Header>Why it does not reach this system</Table.Header>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <Table.Row key={`${row.control}|${row.component.id}`}>
            <Table.Cell>
              <Id>{row.control}</Id>
            </Table.Cell>
            <Table.Cell className="truncate" title={row.provided.title}>
              {row.provided.title}
            </Table.Cell>
            <Table.Cell
              className="truncate"
              title={`${row.component.id} — ${row.component.provider}`}
            >
              {row.component.name}
            </Table.Cell>
            <Table.Cell>
              <Badge size="xsmall">{row.provided.model}</Badge>
            </Table.Cell>
            <Table.Cell className="truncate" title={row.applicabilityReason}>
              {isBlank(row.applicabilityReason) ? <Absent /> : row.applicabilityReason}
            </Table.Cell>
          </Table.Row>
        ))}
      </tbody>
    </Table>
  );
}

/* ── InheritanceSummaryStats ─────────────────────────────────────────────── */

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
    <Inline
      className="border-b border-default py-100 last:border-0"
      space="space.150"
      alignBlock="center"
    >
      <span className="shrink-0 truncate font-body-small" style={{ width: 132 }}>
        {label}
      </span>
      <span className="min-w-0 flex-1">
        <Progress value={pct} tone={tone} />
      </span>
      <span className="tabular-nums shrink-0 text-right font-body-small text-subtle w-800">
        {count} · {pct}%
      </span>
    </Inline>
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
    <Stack className="pt-150" space="space.250">
      <Grid
        className="border-y border-default"
        templateColumns={{ base: "repeat(2, minmax(0, 1fr))", md: "repeat(5, minmax(0, 1fr))" }}
      >
        <Stat.Tile label="Resolved" value={summary.total} note="controls inherited" />
        <Stat.Tile
          label="Current"
          value={summary.current}
          note="accepted and fresh"
          tone={summary.current > 0 ? "success" : "neutral"}
        />
        <Stat.Tile
          label="Version drift"
          value={summary.drifted}
          note="provider has moved"
          tone={summary.drifted > 0 ? "warning" : "neutral"}
        />
        <Stat.Tile
          label="Provider failed or revoked"
          value={summary.failedOrRevoked}
          note="the provider offer no longer holds"
          tone={summary.failedOrRevoked > 0 ? "danger" : "neutral"}
        />
        <Stat.Tile
          label="Unstated obligation"
          value={unstated}
          note="shared, nothing written down"
          tone={unstated > 0 ? "danger" : "neutral"}
        />
      </Grid>

      <div>
        <Progress.Stacked
          segments={legend.map((l) => ({
            key: l.key,
            value: l.value,
            tone: l.tone,
            title: `${l.label} — ${l.value}`,
          }))}
        />
        <Inline
          className="pt-100"
          space="space.200"
          rowSpace="space.050"
          alignBlock="center"
          shouldWrap
        >
          {legend.map((l) => (
            <Inline
              key={l.key}
              className="font-body-small"
              as="span"
              space="space.075"
              alignBlock="center"
            >
              <Dot tone={l.tone} />
              <span className="text-subtle">{l.label}</span>
              <span className="tabular-nums font-medium">{l.value}</span>
            </Inline>
          ))}
          <span className="tabular-nums ml-auto font-body-small text-subtle">
            {summary.notApplicable} offered but not applicable · {summary.unaccepted} never accepted
          </span>
        </Inline>
      </div>

      <Grid
        columnGap="space.400"
        rowGap="space.250"
        templateColumns={{ base: "repeat(1, minmax(0, 1fr))", lg: "repeat(2, minmax(0, 1fr))" }}
      >
        <div>
          <h3 className="pb-050 font-heading-xxsmall uppercase text-subtle">By designation</h3>
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
          <h3 className="pb-050 font-heading-xxsmall uppercase text-subtle">By resolution state</h3>
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
      </Grid>
    </Stack>
  );
}

/* ── ResolutionRail ──────────────────────────────────────────────────────── */

function WrapValue({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Grid className="py-050" gap="space.150" templateColumns="104px 1fr" alignItems="baseline">
      <dt className="truncate font-body-small text-subtle">{label}</dt>
      <dd className="min-w-0 font-body-small text-default">{children}</dd>
    </Grid>
  );
}

function ProseBlock({ label, children }: { label: string; children: string }) {
  return (
    <Box paddingBlockStart="space.075">
      <div className="font-heading-xxsmall uppercase text-subtle">{label}</div>
      <p className="pt-050 font-body-small text-default">{children}</p>
    </Box>
  );
}

export function ResolutionRail({ row }: { row: ResolvedInheritance }) {
  const version = versionRead(row);
  const unstated = obligationUnstated(row);

  return (
    <div>
      {unstated ? (
        <Box paddingBlockEnd="space.150">
          <Inline
            className="rounded-medium bg-danger px-100 py-100 font-body-small text-danger"
            space="space.100"
            alignBlock="start"
          >
            <Box as="span" paddingBlockStart="space.075">
              <Dot tone="danger" />
            </Box>
            <span className="min-w-0 font-medium">
              Shared responsibility with no consumer obligation stated.
            </span>
          </Inline>
        </Box>
      ) : null}

      <Inspector.Group title="Resolution">
        <KeyValue label="Control">
          <Id>{row.control}</Id>
        </KeyValue>
        <WrapValue label="Title">{row.provided.title}</WrapValue>
        <KeyValue label="Family">{row.provided.family}</KeyValue>
        <WrapValue label="Provider">{row.component.name}</WrapValue>
        <KeyValue label="Component">
          <Id>{row.component.id}</Id>
        </KeyValue>
        <KeyValue label="CCP tier">{row.tier}</KeyValue>
        <KeyValue label="Model">{row.provided.model}</KeyValue>
        <KeyValue label="Designation">
          <DesignationChip row={row} />
        </KeyValue>
        <KeyValue label="Share">
          <Badge size="xsmall" tone={shareTone[row.share]}>
            {row.share}
          </Badge>
        </KeyValue>
        <KeyValue label="eMASS status">{row.emassStatus}</KeyValue>
      </Inspector.Group>

      <Inspector.Group title="State">
        <KeyValue label="Resolution">
          <Badge size="xsmall" tone={inheritanceStateTone[row.state]}>
            {row.state}
          </Badge>
        </KeyValue>
        <ProseBlock label="Why">{row.stateReason}</ProseBlock>
      </Inspector.Group>

      <Inspector.Group title="Acceptance">
        <KeyValue label="Accepted">
          {row.accepted ? <Id>{version.accepted}</Id> : <Absent />}
        </KeyValue>
        <KeyValue label="Assessment">
          {row.accepted ? <Id>{row.accepted.acceptedAssessmentVersion}</Id> : <Absent />}
        </KeyValue>
        <KeyValue label="Signed">{row.accepted ? row.accepted.acceptedOn : "—"}</KeyValue>
        <WrapValue label="Signed by">{row.accepted ? row.accepted.acceptedBy : "—"}</WrapValue>
        <KeyValue label="Offered">
          <Id className={version.drifted ? "text-warning" : "text-default"}>{version.offered}</Id>
        </KeyValue>
        <KeyValue label="Offered under">
          <Id>{row.provided.assessmentVersion}</Id>
        </KeyValue>
        <KeyValue label="Assessed">{row.provided.assessedOn}</KeyValue>
        {row.accepted && !isBlank(row.accepted.note) ? (
          <ProseBlock label="Acceptance note">{row.accepted.note}</ProseBlock>
        ) : null}
      </Inspector.Group>

      <Inspector.Group title="Evidence">
        <WrapValue label="Artifact">{row.provided.evidence}</WrapValue>
        <KeyValue label="Age">
          <span className={cn("tabular-nums", row.stale ? "text-warning" : "")}>
            {row.evidenceAgeDays} days
          </span>
        </KeyValue>
        <KeyValue label="Provider status">
          <Badge size="xsmall" tone={row.provided.status === "Satisfied" ? "success" : "danger"}>
            {row.provided.status}
          </Badge>
        </KeyValue>
      </Inspector.Group>

      <Inspector.Group title="Responsibility">
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
      </Inspector.Group>

      <Inspector.Group title="Applicability">
        <KeyValue label="Applies">
          <Badge size="xsmall" tone={row.applicable ? "success" : "neutral"}>
            {row.applicable ? "Yes" : "No"}
          </Badge>
        </KeyValue>
        <ProseBlock label="Basis">{row.applicabilityReason}</ProseBlock>
      </Inspector.Group>

      {row.conflicts.length > 0 ? (
        <Inspector.Group title={`Deconflicted (${row.conflicts.length})`}>
          {row.conflicts.map((conflict) => (
            <Box key={conflict.component} className="first:pt-025" paddingBlockStart="space.075">
              <Inline space="space.075" alignBlock="center" shouldWrap>
                <Id className="text-subtle">{conflict.component}</Id>
                <Badge size="xsmall">{conflict.tier} tier</Badge>
                <Badge size="xsmall">{conflict.model}</Badge>
              </Inline>
              <p className="pt-050 font-body-small text-subtle">{conflict.reason}</p>
            </Box>
          ))}
        </Inspector.Group>
      ) : null}
    </div>
  );
}
