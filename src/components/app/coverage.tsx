/**
 * The two RMF answers a program record owes the reader:
 *   CoverageBand   — how much of the tailored baseline is satisfied, by whom.
 *   MilestoneTrack — which dated decision gates are coming due.
 *
 * Presentation only: bars and tracks, no chart library, no cards.
 */

import { Check } from "lucide-react";

import { Meter, Id } from "@/ds/primitives";
import { Section } from "@/ds/patterns";
import { cn } from "@/lib/utils";
import type { Coverage, MilestoneNode } from "@/lib/program-coverage";

const toneText: Record<string, string> = {
  success: "text-success",
  warning: "text-warning",
  danger: "text-danger",
  info: "text-primary",
  neutral: "text-muted-foreground",
};

const toneDot: Record<string, string> = {
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
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

        <Meter.Stacked
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
                className="group flex items-center gap-3 border-b border-border-subtle py-1.5 text-left last:border-0"
              >
                <Id className="w-8 shrink-0 text-muted-foreground">{f.id}</Id>
                <span className="min-w-0 flex-1 truncate text-12 group-hover:underline">
                  {f.name}
                </span>
                <span className="w-24 shrink-0">
                  <Meter.Stacked
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
        <ol className="flex min-w-[640px] items-start">
          {nodes.map((n, i) => (
            <li key={n.id} className="relative flex min-w-0 flex-1 flex-col">
              <span className="flex items-center">
                <span
                  aria-hidden
                  className={cn("h-px flex-1", i === 0 ? "bg-transparent" : "bg-border")}
                />
                <button
                  type="button"
                  onClick={() => onSelect(n)}
                  title={`${n.id} ${n.name} — ${n.status}, planned ${n.planned}`}
                  className={cn(
                    "grid size-4 place-items-center rounded-full border transition-colors duration-100",
                    n.state === "done"
                      ? "border-success bg-success text-background"
                      : n.state === "current"
                        ? cn(
                            "border-current bg-background",
                            toneText[n.tone],
                            "ring-2 ring-current/20",
                          )
                        : "border-border bg-background",
                  )}
                >
                  {n.state === "done" ? <Check className="size-2.5" /> : null}
                </button>
                <span
                  aria-hidden
                  className={cn(
                    "h-px flex-1",
                    i === nodes.length - 1 ? "bg-transparent" : "bg-border",
                  )}
                />
              </span>
              <span className="mt-1.5 flex flex-col items-center px-1 text-center">
                <button
                  type="button"
                  onClick={() => onSelect(n)}
                  className={cn(
                    "truncate text-12 hover:underline",
                    n.state === "current" ? "font-semibold" : "font-medium",
                    n.state === "upcoming" ? "text-muted-foreground" : "text-foreground",
                  )}
                >
                  {n.id}
                </button>
                <span className="tnum text-11 text-muted-foreground">{n.planned}</span>
                <span className={cn("tnum text-11", toneText[n.tone])}>
                  {n.state === "done"
                    ? "Complete"
                    : n.daysOut === null
                      ? n.status
                      : n.daysOut < 0
                        ? `${Math.abs(n.daysOut)}d overdue`
                        : `${n.daysOut}d out`}
                </span>
              </span>
            </li>
          ))}
        </ol>
      </div>
    </Section>
  );
}
