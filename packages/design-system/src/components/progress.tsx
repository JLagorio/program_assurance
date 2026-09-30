import { Progress as Primitive } from "@base-ui/react/progress";
import { createContext, useContext, type ComponentProps } from "react";
import { classes } from "../lib/base-ui";
import { token } from "../generated/tokens";
import { cn } from "../lib/cn";
import { useLedgerLocale } from "../lib/locale";
import { toneClasses, type Tone } from "./badge";

export type ProgressSize = "small" | "medium" | "large";
const sizes: Record<ProgressSize, string> = { small: "h-050", medium: "h-075", large: "h-100" };

/* A bar is a non-text element, so its fill holds 3:1 against the track. The bold fills do, except
   warning's, a light orange made to carry dark text; a warning bar takes the chart's warning,
   the colour a warning bar in a chart has. */
const barFill: Record<Tone, string> = {
  ...(Object.fromEntries(Object.entries(toneClasses).map(([t, c]) => [t, c.fill])) as Record<
    Tone,
    string
  >),
  warning: "bg-chart-warning",
};
/* The stripes of an indeterminate bar: the tone's icon colour, and a darker grey than the neutral
   icon for the neutral tone, so they read against the track. */
const stripes: Record<Tone, string> = {
  ...(Object.fromEntries(Object.entries(toneClasses).map(([t, c]) => [t, c.icon])) as Record<
    Tone,
    string
  >),
  neutral: "icon-subtle",
};

const ProgressContext = createContext<{ tone: Tone; size: ProgressSize }>({
  tone: "information",
  size: "medium",
});
export type ProgressProps = Primitive.Root.Props & {
  tone?: Tone | undefined;
  size?: ProgressSize | undefined;
};
/**
 * How far a task has gone: a progressbar. `value={null}` is a wait whose length is unknown, drawn
 * as a hatched bar the width of the track whose stripes move, never as a full one. A quantity that
 * is not a task's completion (coverage, a share of controls) is ProgressStacked, or a number in words.
 */
export function Progress({
  className,
  children,
  tone = "information",
  size = "medium",
  locale,
  getAriaValueText,
  ...props
}: ProgressProps) {
  const ledger = useLedgerLocale();
  return (
    <ProgressContext.Provider value={{ tone, size }}>
      <Primitive.Root
        locale={locale ?? ledger.locale}
        getAriaValueText={
          getAriaValueText ??
          ((formatted, value) =>
            value === null || !Number.isFinite(value)
              ? ledger.t("progressIndeterminate")
              : formatted)
        }
        {...props}
        data-slot="progress"
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
      {...props}
      data-slot="progress-track"
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
/** The fill. Indeterminate, it is the hatched bar (motion.css draws the stripes, which stand still under reduced motion). */
export function ProgressIndicator({ className, ...props }: ProgressIndicatorProps) {
  const { tone } = useContext(ProgressContext);
  return (
    <Primitive.Indicator
      {...props}
      data-slot="progress-indicator"
      className={classes(
        cn(
          "h-full rounded-full transition-all duration-fast ease-standard motion-reduce:transition-none data-indeterminate:w-full",
          barFill[tone],
          stripes[tone],
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
      {...props}
      data-slot="progress-label"
      className={classes("font-body-small font-medium", className)}
    />
  );
}
export type ProgressValueProps = Primitive.Value.Props;
export function ProgressValue({ className, ...props }: ProgressValueProps) {
  return (
    <Primitive.Value
      {...props}
      data-slot="progress-value"
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

export type ProgressStackedProps = Omit<ComponentProps<"span">, "children"> & {
  /** The segments in order. Each is its share of the total; a zero-value segment is skipped. */
  segments: StackedSegment[];
  /** `small` is 4px, in a cell or beside a name; `medium` 6px, in a row; `large` 8px, the default, a coverage band. */
  size?: ProgressSize | undefined;
  /** The accessible name of the whole bar ("Control coverage"). With it the bar is an image described by its segments' titles, or a group of buttons when the segments click, where a segment that does not click is read as its title; without it the bar is decorative and the numbers beside it carry the values. */
  label?: string | undefined;
};

/* A hatch of hairlines: a gap of `space.025`, then a line `border.width` wide, the same 2px and 1px
   they always were. */
const hatch = {
  backgroundImage: `repeating-linear-gradient(135deg, transparent 0 ${token("space.025")}, currentColor ${token("space.025")} calc(${token("space.025")} + ${token("border.width")}))`,
} as const;
/* The bar does not clip its segments, so a focused segment's ring shows whole around it; the end
   segments carry the bar's rounding instead. */
const segmentClass = (s: StackedSegment) =>
  cn(
    "h-full transition-colors duration-fast ease-standard first:rounded-s-full last:rounded-e-full motion-reduce:transition-none",
    s.appearance === "hatched" ? toneClasses[s.tone].icon : barFill[s.tone],
  );
const segmentStyle = (s: StackedSegment, total: number) => ({
  width: `${(s.value / total) * 100}%`,
  ...(s.appearance === "hatched" ? hatch : {}),
});

/** Segmented proportional bar. One primitive for every coverage read-out. Native span props and the ref reach the bar. */
export function ProgressStacked({
  segments,
  size = "large",
  label,
  className,
  ...props
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
      {...props}
      data-slot="progress-stacked"
      className={cn("relative flex w-full rounded-full bg-neutral", sizes[size], className)}
    >
      {shown.map((s) =>
        s.onClick ? (
          <button
            key={s.key}
            data-slot="progress-segment"
            data-appearance={s.appearance}
            type="button"
            title={s.title}
            aria-label={s.title || s.key}
            onClick={s.onClick}
            // A 24px band on a coarse pointer, across the segment's own width, so neighbours never overlap.
            className={cn(
              segmentClass(s),
              "relative touch-target-block outline-none focus-visible:z-10 focus-visible:outline-focused",
            )}
            style={segmentStyle(s, total)}
          />
        ) : (
          <span
            key={s.key}
            data-slot="progress-segment"
            data-appearance={s.appearance}
            title={s.title}
            className={segmentClass(s)}
            style={segmentStyle(s, total)}
          >
            {/* In a group of buttons the segment that does not click is read as its title, so no part of the breakdown is lost. */}
            {clicks && s.title ? <span className="sr-only">{s.title}</span> : null}
          </span>
        ),
      )}
    </span>
  );
}
