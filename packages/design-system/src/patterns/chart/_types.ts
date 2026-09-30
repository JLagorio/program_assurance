import type { Tone } from "../../components/badge";

/*
 * The chart family's data shapes: what a caller hands a part, and what a part hands back when a
 * mark is chosen. No runtime imports, so the pure helpers beside it run under `node --test`.
 */

/** A status tone, `brand`, `neutral`, or one of the six categorical hues; `categorical.7` is Other. */
export type ChartTone = Tone | "brand" | `categorical.${1 | 2 | 3 | 4 | 5 | 6 | 7}`;

/** The plot's height: `small` 120px for a rail or a cell, `medium` 200px for a section, `large` 320px for the one chart a page is about. */
export type ChartSize = "small" | "medium" | "large";

export const heights: Record<ChartSize, number> = { small: 120, medium: 200, large: 320 };

/** One record along the category axis. A value may be a `[from, to]` pair for a floating bar, or a Date on a time axis. */
export type ChartDatum = Record<
  string,
  string | number | Date | null | undefined | readonly [number, number]
>;

export type ChartValue = ChartDatum[string];

export type Formatter = (value: number) => string;
export type CategoryFormatter = (value: string | number | Date) => string;

export type ChartSeries = {
  /** The key in each datum. */
  key: string;
  /** What the legend, the tooltip and the table call it. Defaults to the key. */
  label?: string | undefined;
  /** The `color.chart.*` token. Defaults to the categorical set, in order. */
  tone?: ChartTone | undefined;
  /** This series' own number format, when it differs from the plot's: a rate over counts. */
  format?: Formatter | undefined;
};

/** A line across the plot: a target, a limit, a milestone. `y` is on the value axis, `x` on the category axis. */
export type ChartReference = {
  y?: number | undefined;
  x?: string | number | Date | undefined;
  /** Printed at the line's end. */
  label?: string | undefined;
  /** `neutral` when unsaid: a target is context. `danger` for a limit that must not be crossed. */
  tone?: ChartTone | undefined;
};

/** A band across the plot: between two values (`from`, `to`), or between two categories or dates (`fromX`, `toX`): the acceptable range, the plan's tolerance, an assessment window. */
export type ChartBand = {
  from?: number | undefined;
  to?: number | undefined;
  fromX?: string | number | Date | undefined;
  toX?: string | number | Date | undefined;
  label?: string | undefined;
  /** `neutral` when unsaid. */
  tone?: ChartTone | undefined;
};

/** The value axis: each end a number or `"auto"`. `[0, "auto"]` when unsaid; a plot with negative values reaches below zero. Set it on every chart of a set so they share a scale; with both ends pinned, the ticks are round steps that include zero. */
export type ChartDomain = readonly [number | "auto", number | "auto"];

/** A column for the table twin and the CSV beyond the series: a fact the plot does not draw. */
export type ChartColumn = {
  /** The key in each datum. */
  key: string;
  /** What the table calls it. Defaults to the key. */
  label?: string | undefined;
  /** How a value prints in the table. A number takes the plot's format when unsaid; text prints as it is. The CSV keeps numbers raw. */
  format?: ((value: ChartValue, datum: ChartDatum) => string) | undefined;
  /** `before` sets the column between the category and the series, for a name that belongs beside the category. After the series when unsaid. */
  place?: "before" | "after" | undefined;
};

/** What was chosen on a cartesian plot: the record, the series when a mark was clicked (none when the whole category was chosen with Enter), and the record's index. */
export type ChartSelection = {
  datum: ChartDatum;
  series?: ChartSeries | undefined;
  index: number;
};

/** The columns that sit before the series, and after. */
export const splitColumns = (columns: ChartColumn[] | undefined) => ({
  before: columns?.filter((c) => c.place === "before") ?? [],
  after: columns?.filter((c) => c.place !== "before") ?? [],
});

/** The key beside a name: a square for a fill, a stroke for a line, a dot for a point. */
export type SwatchShape = "square" | "line" | "dot";

/* ---------- the table twin ---------- */

/** One column of a table twin: its heading, and whether it holds numbers (set to the end, tabular). */
export type TwinColumn = { label: string; numeric: boolean };

/** One row of a table twin: each cell's text in the table and its value in the CSV (numbers raw). */
export type TwinRow = { key: string; cells: { text: string; csv: string }[] };

/** The same numbers as the plot, laid out as a table: what the Frame's Table toggle shows and its CSV holds. */
export type ChartTwin = { columns: TwinColumn[]; rows: TwinRow[] };

/** What the Frame lends a kind's table builder: its category heading and its extra columns. */
export type TwinOptions = { xLabel: string | undefined; columns: ChartColumn[] | undefined };

/**
 * How a part's numbers become a table. `category` is records along a category axis (Bar, Line,
 * Area): the Frame lays it out, with its own `data`, `x`, `series`, `xLabel` and `columns` winning.
 * `custom` is a kind's own shape (points, slices, leaves, a grid), built when the table shows.
 */
export type TwinSource =
  | {
      kind: "category";
      data: ChartDatum[];
      x: string;
      series: ChartSeries[];
      xLabel?: string | undefined;
    }
  | { kind: "custom"; build: (options: TwinOptions) => ChartTwin };
