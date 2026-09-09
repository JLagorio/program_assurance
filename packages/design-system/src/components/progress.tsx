import { Progress as Primitive } from "@base-ui/react/progress";
import { createContext, useContext } from "react";
import { classes } from "../lib/base-ui";
import { cn } from "../lib/cn";
import { useLedgerLocale } from "../lib/locale";
import { toneClasses, type Tone } from "./badge";

export type ProgressSize = "small" | "medium" | "large";
const sizes: Record<ProgressSize, string> = { small: "h-050", medium: "h-075", large: "h-100" };
const ProgressContext = createContext<{ tone: Tone; size: ProgressSize }>({
  tone: "information",
  size: "medium",
});
export type ProgressProps = Primitive.Root.Props & {
  tone?: Tone | undefined;
  size?: ProgressSize | undefined;
};
export function Progress({
  className,
  children,
  tone = "information",
  size = "medium",
  locale,
  ...props
}: ProgressProps) {
  const ledger = useLedgerLocale();
  return (
    <ProgressContext.Provider value={{ tone, size }}>
      <Primitive.Root
        data-slot="progress"
        locale={locale ?? ledger.locale}
        {...props}
        className={classes("flex w-full flex-wrap items-center gap-100", className)}
      >
        {children}
        <ProgressTrack>
          <ProgressIndicator />
        </ProgressTrack>
      </Primitive.Root>
    </ProgressContext.Provider>
  );
}
export type ProgressTrackProps = Primitive.Track.Props;
export function ProgressTrack({ className, ...props }: ProgressTrackProps) {
  const { size } = useContext(ProgressContext);
  return (
    <Primitive.Track
      data-slot="progress-track"
      {...props}
      className={classes(
        cn(
          "relative flex w-full items-center overflow-hidden rounded-full bg-neutral",
          sizes[size],
        ),
        className,
      )}
    />
  );
}
export type ProgressIndicatorProps = Primitive.Indicator.Props;
export function ProgressIndicator({ className, ...props }: ProgressIndicatorProps) {
  const { tone } = useContext(ProgressContext);
  return (
    <Primitive.Indicator
      data-slot="progress-indicator"
      {...props}
      className={classes(
        cn(
          "h-full rounded-full transition-all duration-fast ease-standard motion-reduce:transition-none data-indeterminate:w-full data-indeterminate:animate-pulse motion-reduce:animate-none",
          toneClasses[tone].fill,
        ),
        className,
      )}
    />
  );
}
export type ProgressLabelProps = Primitive.Label.Props;
export function ProgressLabel({ className, ...props }: ProgressLabelProps) {
  return (
    <Primitive.Label
      data-slot="progress-label"
      {...props}
      className={classes("font-body-small font-medium", className)}
    />
  );
}
export type ProgressValueProps = Primitive.Value.Props;
export function ProgressValue({ className, ...props }: ProgressValueProps) {
  return (
    <Primitive.Value
      data-slot="progress-value"
      {...props}
      className={classes("ms-auto font-body-small tabular-nums text-subtle", className)}
    />
  );
}

export type StackedSegment = {
  key: string;
  /** The segment's count; it is drawn as its share of the total of all segments. Zero is skipped. */
  value: number;
  tone: Tone;
  /** `hatched` is what is not known or not covered: a hole in the record, drawn in the tone's icon colour over the track, never a flat fill. */
  appearance?: "solid" | "hatched" | undefined;
  /** What the segment is, with its count ("41 verified"): the tooltip, the button's name, and a line of the bar's description. An interactive segment falls back to its key when no title is supplied; prefer a descriptive title. */
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
            aria-label={s.title || s.key}
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
