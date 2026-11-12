import type { ComponentProps, CSSProperties } from "react";

import { cn } from "../lib/cn";

/* Tally: how much of a whole, and in which states. It is a TileMap's marks counted into one bar,
   so it takes the same tones and fills and one key explains both. The stylesheet is
   src/styles/tally.css. */

/** A segment's colour: a chart tone, or a step of the one-hue scale. The same names a TileMap mark takes. */
export type TallyTone =
  | "neutral"
  | "brand"
  | "information"
  | "success"
  | "warning"
  | "danger"
  | "sequential.1"
  | "sequential.2"
  | "sequential.3"
  | "sequential.4"
  | "sequential.5";

/** How a segment carries its tone: filled, hollow, or `empty`, the track's own colour. */
export type TallyFill = "solid" | "outline" | "empty";

/** The bar's thickness: 4px, 6px, 8px and 12px. */
export type TallySize = "small" | "medium" | "large" | "xlarge";

export type TallySegment = {
  /** Unique in the tally. */
  key: string;
  /** The segment's count: it is drawn as its share of `total`. */
  value: number;
  /** @default "neutral" */
  tone?: TallyTone | undefined;
  /** `outline` is hollow in the tone, for what was there and is not now; `empty` is the track's own colour. @default "solid" */
  fill?: TallyFill | undefined;
  /** What the segment is, with its count ("61 in baseline"): its title under the pointer, and a part of the tally's name. */
  label?: string | undefined;
};

export type TallyProps = Omit<ComponentProps<"span">, "children"> & {
  /** The segments in order, from the start. */
  segments: readonly TallySegment[];
  /** The whole the segments are shares of. Their sum when unsaid; where it is larger, the rest is the empty track. */
  total?: number | undefined;
  /** `small` is 4px, under a name; `medium` 6px; `large` 8px; `xlarge` 12px, a table cell whose reading is the bar. @default "medium" */
  size?: TallySize | undefined;
  /** The bar's own length as a share of its box, from 0 to 1: a row's total against the largest in its column, so the bars of a column compare. @default 1 */
  scale?: number | undefined;
  /** `danger` draws the unfilled track as a hollow danger outline: a tally that holds nothing where something is expected. @default "neutral" */
  tone?: "neutral" | "danger" | undefined;
  /** The tally's accessible name ("Coverage of Adaptive Response"). With it the tally is an image named by it and its segments' labels; without it the tally is decorative, and the number beside it carries the value. */
  label?: string | undefined;
};

/** A share as a percentage the stylesheet can ease between. */
const share = (value: number, whole: number) =>
  `${Math.round((Math.max(0, value) / whole) * 100000) / 1000}%`;

/**
 * A thin bar of segments, each its share of a total: how many of a group's items are in each
 * state. The states are a TileMap's (a tone, and a fill that is solid, hollow or empty), so one
 * `TileMap.Key` explains a map's marks and a tally's segments. A segment eases to its new share
 * when its value changes, unless motion is reduced. For how far a task has gone use Progress; for
 * parts of a whole in the status tones, ProgressStacked. The span's native props and ref reach
 * the tally's box.
 */
export function Tally({
  segments,
  total,
  size = "medium",
  scale,
  tone = "neutral",
  label,
  className,
  ...props
}: TallyProps) {
  const sum = segments.reduce((all, segment) => all + Math.max(0, segment.value), 0);
  const whole = Math.max(total ?? 0, sum) || 1;
  const labels = segments
    .filter((segment) => segment.value > 0 && segment.label)
    .map((segment) => segment.label)
    .join(", ");
  const named = label
    ? { role: "img", "aria-label": labels ? `${label}: ${labels}` : label }
    : { "aria-hidden": true };
  const length: CSSProperties | undefined =
    scale === undefined ? undefined : { inlineSize: share(Math.min(1, scale), 1) };
  return (
    <span
      {...named}
      {...props}
      data-slot="tally"
      data-size={size}
      data-tone={tone}
      className={cn(className)}
    >
      <span data-slot="tally-track" style={length}>
        {/* A segment of nothing keeps its place at no width, so it eases in when it gains a value. */}
        {segments.map((segment) => (
          <span
            key={segment.key}
            data-slot="tally-segment"
            data-tone={segment.tone ?? "neutral"}
            data-fill={segment.fill ?? "solid"}
            title={segment.value > 0 ? segment.label : undefined}
            style={{ inlineSize: share(segment.value, whole) }}
          />
        ))}
      </span>
    </span>
  );
}
