import * as ProgressPrimitive from "@radix-ui/react-progress";

import { cn } from "../lib/cn";
import { toneClasses, type Tone } from "./badge";

/** One value out of 100 as a thin bar. Radix underneath for role and aria-valuenow. */
function ProgressRoot({
  value,
  tone = "information",
  className,
}: {
  value: number;
  tone?: Tone | undefined;
  className?: string | undefined;
}) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <ProgressPrimitive.Root
      value={clamped}
      className={cn("h-075 w-full overflow-hidden rounded-full bg-neutral", className)}
    >
      <ProgressPrimitive.Indicator
        className={cn(
          "h-full rounded-full transition-all duration-fast ease-standard",
          toneClasses[tone].fill,
        )}
        style={{ width: `${clamped}%` }}
      />
    </ProgressPrimitive.Root>
  );
}

export type StackedSegment = {
  key: string;
  value: number;
  tone: Tone;
  /** `hatched` is what is not known or not covered: a hole in the record, drawn in the tone's icon colour over the track, never a flat fill. */
  appearance?: "solid" | "hatched" | undefined;
  title?: string | undefined;
  onClick?: (() => void) | undefined;
};

const hatch = {
  backgroundImage: "repeating-linear-gradient(135deg, transparent 0 2px, currentColor 2px 3px)",
} as const;
const segmentClass = (s: StackedSegment) =>
  cn(
    "h-full transition-all duration-fast ease-standard",
    s.appearance === "hatched" ? toneClasses[s.tone].icon : toneClasses[s.tone].fill,
  );
const segmentStyle = (s: StackedSegment, total: number) => ({
  width: `${(s.value / total) * 100}%`,
  ...(s.appearance === "hatched" ? hatch : {}),
});

/** Segmented proportional bar. One primitive for every coverage read-out. */
function StackedBar({
  segments,
  height = 8,
}: {
  segments: StackedSegment[];
  height?: number | undefined;
}) {
  const total = segments.reduce((a, s) => a + Math.max(0, s.value), 0) || 1;
  return (
    <span className="flex w-full overflow-hidden rounded-full bg-neutral" style={{ height }}>
      {segments
        .filter((s) => s.value > 0)
        .map((s) =>
          s.onClick ? (
            <button
              key={s.key}
              type="button"
              title={s.title}
              onClick={s.onClick}
              className={segmentClass(s)}
              style={segmentStyle(s, total)}
            />
          ) : (
            <span
              key={s.key}
              title={s.title}
              className={segmentClass(s)}
              style={segmentStyle(s, total)}
            />
          ),
        )}
    </span>
  );
}

export const Progress = Object.assign(ProgressRoot, { Stacked: StackedBar });
