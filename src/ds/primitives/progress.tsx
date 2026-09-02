import * as ProgressPrimitive from "@radix-ui/react-progress";

import { cn } from "@/lib/utils";

import { toneClasses } from "./tone";
import type { Tone } from "./tone";

/** One value out of 100 as a thin bar. Radix underneath for role and aria-valuenow. */
function ProgressRoot({
  value,
  tone = "info",
  className,
}: {
  value: number;
  tone?: Tone;
  className?: string;
}) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <ProgressPrimitive.Root
      value={clamped}
      className={cn("h-1.5 w-full overflow-hidden rounded-full bg-muted", className)}
    >
      <ProgressPrimitive.Indicator
        className={cn(
          "h-full rounded-full transition-[width] duration-[120ms]",
          toneClasses[tone].fill,
        )}
        style={{ width: `${clamped}%` }}
      />
    </ProgressPrimitive.Root>
  );
}

/** Segmented proportional bar. One primitive for every coverage read-out. */
function StackedBar({
  segments,
  height = 8,
}: {
  segments: {
    key: string;
    value: number;
    tone: Tone;
    title?: string;
    onClick?: () => void;
  }[];
  height?: number;
}) {
  const total = segments.reduce((a, s) => a + Math.max(0, s.value), 0) || 1;
  return (
    <span
      className="flex w-full overflow-hidden rounded-full bg-muted"
      style={{ height: `${height}px` }}
    >
      {segments
        .filter((s) => s.value > 0)
        .map((s) =>
          s.onClick ? (
            <button
              key={s.key}
              type="button"
              title={s.title}
              onClick={s.onClick}
              className={cn("h-full transition-[width] duration-[120ms]", toneClasses[s.tone].fill)}
              style={{ width: `${(s.value / total) * 100}%` }}
            />
          ) : (
            <span
              key={s.key}
              title={s.title}
              className={cn("h-full transition-[width] duration-[120ms]", toneClasses[s.tone].fill)}
              style={{ width: `${(s.value / total) * 100}%` }}
            />
          ),
        )}
    </span>
  );
}

export const Progress = Object.assign(ProgressRoot, { Stacked: StackedBar });
