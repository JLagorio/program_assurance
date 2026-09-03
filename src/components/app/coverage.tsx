/**
 * The two RMF answers a program record owes the reader:
 *   CoverageBand   — how much of the tailored baseline is satisfied, by whom.
 *   MilestoneTrack — which dated decision gates are coming due.
 *
 * Presentation only: bars and tracks, no chart library, no cards.
 */

import { Progress, Id, Stepper } from "@/ds/primitives";
import { Section } from "@/ds/patterns";
import { cn } from "@/lib/utils";
import type { Coverage, MilestoneNode } from "@/lib/program-coverage";

const toneText: Record<string, string> = {
  success: "text-legacy-success",
  warning: "text-legacy-warning",
  danger: "text-legacy-danger",
  info: "text-primary",
  neutral: "text-muted-foreground",
};

const toneDot: Record<string, string> = {
  success: "bg-legacy-success",
  warning: "bg-legacy-warning",
  danger: "bg-legacy-danger",
  info: "bg-primary",
  neutral: "bg-muted-foreground/40",
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
      action={<span className="text-12 text-muted-foreground">{baseline}</span>}
    >
      <div className="pt-3">
        <div className="flex items-baseline gap-2 pb-2">
          <span className="tnum text-20 font-semibold leading-none">{coverage.pct}%</span>
          <span className="tnum text-12 text-muted-foreground">
            {coverage.satisfied}/{coverage.total} controls satisfied
          </span>
          <span className="tnum ml-auto text-12 text-muted-foreground">
            {coverage.inherited} inherited · {coverage.systemImplemented} system-implemented
          </span>
        </div>

        <Progress.Stacked
          segments={coverage.segments.map((s) => ({
            key: s.key,
            value: s.value,
            tone: s.tone,
            title: `${s.label} — ${s.value}`,
            onClick: () => onSelectSegment(s.key),
          }))}
        />

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-2">
          {coverage.segments.map((s) => (
            <button
              key={s.key}
              type="button"
              onClick={() => onSelectSegment(s.key)}
              className="group flex items-center gap-1.5 text-12"
            >
              <span className={cn("size-1.5 rounded-full", toneDot[s.tone])} />
              <span className="text-muted-foreground group-hover:text-foreground">{s.label}</span>
              <span className="tnum font-medium">{s.value}</span>
            </button>
          ))}
        </div>

        <div className="pt-3.5">
          <div className="grid grid-cols-1 gap-x-8 gap-y-0 md:grid-cols-2">
            {families.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => onSelectFamily(f.id)}
                className="group flex items-center gap-3 border-b border-border-legacy-subtle py-1.5 text-left last:border-0"
              >
                <Id className="w-8 shrink-0 text-muted-foreground">{f.id}</Id>
                <span className="min-w-0 flex-1 truncate text-12 group-hover:underline">
                  {f.name}
                </span>
                <span className="w-24 shrink-0">
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
                <span className="tnum w-16 shrink-0 text-right text-12 text-muted-foreground">
                  {f.satisfied}/{f.total}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
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
      <div className="overflow-x-auto pt-4">
        <Stepper className="min-w-[640px]">
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
      </div>
    </Section>
  );
}
