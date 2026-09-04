/**
 * The two RMF answers a program record owes the reader:
 *   CoverageBand   — how much of the tailored baseline is satisfied, by whom.
 *   MilestoneTrack — which dated decision gates are coming due.
 *
 * Presentation only: bars and tracks, no chart library, no cards.
 */

import { Box, Grid, Id, Inline, Progress, Section, Stepper } from "@ledger/design-system";
import { cn } from "@/lib/utils";
import type { Coverage, MilestoneNode } from "@/lib/program-coverage";

const toneText: Record<string, string> = {
  success: "text-success",
  warning: "text-warning",
  danger: "text-danger",
  info: "text-brand",
  neutral: "text-subtle",
};

const toneDot: Record<string, string> = {
  success: "bg-success-bold",
  warning: "bg-warning-bold",
  danger: "bg-danger-bold",
  info: "bg-brand-bold",
  neutral: "bg-neutral-bold",
};

export function CoverageBand({
  coverage,
  baseline,
  onSelectFamily,
  onSelectSegment,
}: {
  coverage: Coverage;
  baseline: string;
  onSelectFamily: (family: string) => void;
  onSelectSegment: (key: string) => void;
}) {
  const families = coverage.families.slice(0, 6);

  return (
    <Section
      title="Control coverage"
      action={<span className="font-body-small text-subtle">{baseline}</span>}
    >
      <Box paddingBlockStart="space.150">
        <Inline className="pb-100" space="space.100" alignBlock="baseline">
          <span className="tabular-nums font-heading-small font-semibold">{coverage.pct}%</span>
          <span className="tabular-nums font-body-small text-subtle">
            {coverage.satisfied}/{coverage.total} controls satisfied
          </span>
          <span className="tabular-nums ml-auto font-body-small text-subtle">
            {coverage.inherited} inherited · {coverage.systemImplemented} system-implemented
          </span>
        </Inline>

        <Progress.Stacked
          segments={coverage.segments.map((s) => ({
            key: s.key,
            value: s.value,
            tone: s.tone,
            title: `${s.label} — ${s.value}`,
            onClick: () => onSelectSegment(s.key),
          }))}
        />

        <Inline
          className="pt-100"
          space="space.200"
          rowSpace="space.050"
          alignBlock="center"
          shouldWrap
        >
          {coverage.segments.map((s) => (
            <button
              key={s.key}
              type="button"
              onClick={() => onSelectSegment(s.key)}
              className="group flex items-center gap-075 font-body-small"
            >
              <span className={cn("rounded-full", toneDot[s.tone], "size-075")} />
              <span className="text-subtle group-hover:text-default">{s.label}</span>
              <span className="tabular-nums font-medium">{s.value}</span>
            </button>
          ))}
        </Inline>

        <Box paddingBlockStart="space.150">
          <Grid
            columnGap="space.400"
            rowGap="space.0"
            templateColumns={{ base: "repeat(1, minmax(0, 1fr))", md: "repeat(2, minmax(0, 1fr))" }}
          >
            {families.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => onSelectFamily(f.id)}
                className="flex items-center gap-150 border-b border-default py-075 text-left transition-colors duration-fast ease-standard last:border-0 hover:bg-neutral-subtle-hovered focus-visible:outline-focused"
              >
                <Id className="shrink-0 text-subtle w-400">{f.id}</Id>
                <span className="min-w-0 flex-1 truncate font-body-small">{f.name}</span>
                <span className="shrink-0 w-1000">
                  <Progress.Stacked
                    height={4}
                    segments={[
                      { key: "s", value: f.satisfied, tone: "success" },
                      { key: "p", value: f.partial, tone: "warning" },
                      { key: "o", value: f.other, tone: "danger" },
                      { key: "n", value: f.notAssessed, tone: "neutral" },
                    ]}
                  />
                </span>
                <span className="tabular-nums shrink-0 text-right font-body-small text-subtle w-800">
                  {f.satisfied}/{f.total}
                </span>
              </button>
            ))}
          </Grid>
        </Box>
      </Box>
    </Section>
  );
}

export function MilestoneTrack({
  nodes,
  onSelect,
}: {
  nodes: MilestoneNode[];
  onSelect: (node: MilestoneNode) => void;
}) {
  if (nodes.length === 0) return null;

  return (
    <Section title="Milestones">
      <Box className="overflow-x-auto" paddingBlockStart="space.200">
        <Stepper style={{ minWidth: 640 }}>
          {nodes.map((n, i) => (
            <Stepper.Item
              key={n.id}
              state={n.state}
              label={n.id}
              meta={
                <>
                  <span className="block">{n.planned}</span>
                  <span className={cn("block", toneText[n.tone])}>
                    {n.state === "done"
                      ? "Complete"
                      : n.daysOut === null
                        ? n.status
                        : n.daysOut < 0
                          ? `${Math.abs(n.daysOut)}d overdue`
                          : `${n.daysOut}d out`}
                  </span>
                </>
              }
              title={`${n.id} ${n.name} — ${n.status}, planned ${n.planned}`}
              first={i === 0}
              last={i === nodes.length - 1}
              onSelect={() => onSelect(n)}
            />
          ))}
        </Stepper>
      </Box>
    </Section>
  );
}
