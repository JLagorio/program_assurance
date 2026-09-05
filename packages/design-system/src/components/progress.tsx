import * as ProgressPrimitive from "@radix-ui/react-progress";

import { cn } from "../lib/cn";
import { toneClasses, type Tone } from "./badge";

export type ProgressSize = "small" | "medium" | "large";

/** The bar's height: 4, 6 or 8px, on the space scale. */
const sizes: Record<ProgressSize, string> = { small: "h-050", medium: "h-075", large: "h-100" };

export type ProgressProps = {
  /** 0 to 100. Anything outside is clamped. */
  value: number;
  /** The fill's colour, from the tone table. `information` is the default: a bar that is not a status is blue. */
  tone?: Tone | undefined;
  /** The accessible name, what is being measured ("Assessment progress"). With it the bar is a progressbar; without it the bar is decorative and the number beside it carries the value. */
  label?: string | undefined;
  /** `small` is 4px, in a cell or beside a name; `medium` 6px, the default; `large` 8px, a band. */
  size?: ProgressSize | undefined;
  /** The value after the bar, "64%", in small subtle text at a fixed minimum width so a column of bars lines up. */
  showValue?: boolean | undefined;
  /** What the read-out says instead of the percentage ("41 of 80", "64% complete"). It is also the bar's `aria-valuetext`. */
  valueText?: string | undefined;
  className?: string | undefined;
};

/**
 * One value out of 100 as a thin bar. Radix underneath for the role and aria-valuenow. With `label`
 * it is a named progressbar; without one it is decorative, hidden from assistive technology, and the
 * number beside it carries the value.
 */
function ProgressRoot({
  value,
  tone = "information",
  label,
  size = "medium",
  showValue,
  valueText,
  className,
}: ProgressProps) {
  const clamped = Math.max(0, Math.min(100, value));
  const bar = (
    <ProgressPrimitive.Root
      value={clamped}
      aria-label={label}
      aria-valuetext={label ? valueText : undefined}
      aria-hidden={label ? undefined : true}
      className={cn(
        "w-full overflow-hidden rounded-full bg-neutral",
        sizes[size],
        showValue && "min-w-0 flex-1",
        className,
      )}
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
  if (!showValue) return bar;
  return (
    <span className="flex w-full items-center gap-100">
      {bar}
      <span className="min-w-500 shrink-0 text-end font-body-small tabular-nums text-subtle">
        {valueText ?? `${Math.round(clamped)}%`}
      </span>
    </span>
  );
}

export type StackedSegment = {
  key: string;
  /** The segment's count; it is drawn as its share of the total of all segments. Zero is skipped. */
  value: number;
  tone: Tone;
  /** `hatched` is what is not known or not covered: a hole in the record, drawn in the tone's icon colour over the track, never a flat fill. */
  appearance?: "solid" | "hatched" | undefined;
  /** What the segment is, with its count ("41 verified"): the tooltip, the button's name, and a line of the bar's description. */
  title?: string | undefined;
  /** Makes the segment a button, for a bar that filters what is under it. */
  onClick?: (() => void) | undefined;
};

export type ProgressStackedProps = {
  /** The segments in order. Each is its share of the total; a zero-value segment is skipped. */
  segments: StackedSegment[];
  /** `small` is 4px, in a cell or beside a name; `medium` 6px, in a row; `large` 8px, the default, a coverage band. */
  size?: ProgressSize | undefined;
  /** The accessible name of the whole bar ("Control coverage"). With it the bar is an image described by its segments' titles, or a group of buttons when the segments click; without it the bar is decorative and the numbers beside it carry the values. */
  label?: string | undefined;
  className?: string | undefined;
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
export function ProgressStacked({
  segments,
  size = "large",
  label,
  className,
}: ProgressStackedProps) {
  const total = segments.reduce((a, s) => a + Math.max(0, s.value), 0) || 1;
  const shown = segments.filter((s) => s.value > 0);
  const clicks = shown.some((s) => s.onClick);
  const titles = shown
    .map((s) => s.title)
    .filter(Boolean)
    .join(", ");
  const a11y = clicks
    ? { role: "group", "aria-label": label }
    : label
      ? { role: "img", "aria-label": titles ? `${label}: ${titles}` : label }
      : { "aria-hidden": true };
  return (
    <span
      {...a11y}
      className={cn("flex w-full overflow-hidden rounded-full bg-neutral", sizes[size], className)}
    >
      {shown.map((s) =>
        s.onClick ? (
          <button
            key={s.key}
            type="button"
            title={s.title}
            aria-label={s.title}
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

export const Progress = Object.assign(ProgressRoot, { Stacked: ProgressStacked });
