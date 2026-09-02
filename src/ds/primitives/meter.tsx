import { cn } from "@/lib/utils";

import { toneClasses } from "./tone";
import type { Tone } from "./tone";

function MeterRoot({ value, tone = "info" }: { value: number; tone?: Tone }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
      <div
        className={cn("h-full rounded-full", toneClasses[tone].fill)}
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
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

export const Meter = Object.assign(MeterRoot, { Stacked: StackedBar });
