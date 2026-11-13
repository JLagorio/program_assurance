import { token, type TokenName } from "../../generated/tokens";
import type { ChartSeries, ChartTone } from "./_types";

/* The chart tokens as the parts paint them: a tone's colour, its hovered step, the scales, and
   the grid, axis, cursor and marker furniture. Each token is written out by its name, never built
   from a template, so a search for a token finds where it is painted; the types hold each map to
   the tokens, one name for every tone and step. */

/** Each tone's colour. */
const toneColors = {
  neutral: "color.chart.neutral",
  information: "color.chart.information",
  success: "color.chart.success",
  warning: "color.chart.warning",
  danger: "color.chart.danger",
  brand: "color.chart.brand",
  "categorical.1": "color.chart.categorical.1",
  "categorical.2": "color.chart.categorical.2",
  "categorical.3": "color.chart.categorical.3",
  "categorical.4": "color.chart.categorical.4",
  "categorical.5": "color.chart.categorical.5",
  "categorical.6": "color.chart.categorical.6",
  "categorical.7": "color.chart.categorical.7",
} as const satisfies { [Tone in ChartTone]: `color.chart.${Tone}` & TokenName };

/** Each tone's hovered step. */
const hoveredColors = {
  neutral: "color.chart.neutral.hovered",
  information: "color.chart.information.hovered",
  success: "color.chart.success.hovered",
  warning: "color.chart.warning.hovered",
  danger: "color.chart.danger.hovered",
  brand: "color.chart.brand.hovered",
  "categorical.1": "color.chart.categorical.1.hovered",
  "categorical.2": "color.chart.categorical.2.hovered",
  "categorical.3": "color.chart.categorical.3.hovered",
  "categorical.4": "color.chart.categorical.4.hovered",
  "categorical.5": "color.chart.categorical.5.hovered",
  "categorical.6": "color.chart.categorical.6.hovered",
  "categorical.7": "color.chart.categorical.7.hovered",
} as const satisfies { [Tone in ChartTone]: `color.chart.${Tone}.hovered` & TokenName };

/** The var() for a chart tone, for anything recharts does not cover. */
export const chartColor = (tone: ChartTone): string => token(toneColors[tone]);

/** The tone's hovered step: one darker in light, one lighter in dark. */
export const hoveredColor = (tone: ChartTone): string => token(hoveredColors[tone]);

/** The six categorical hues, in the order series take them. */
const hues = [
  "categorical.1",
  "categorical.2",
  "categorical.3",
  "categorical.4",
  "categorical.5",
  "categorical.6",
] as const satisfies readonly ChartTone[];

/** The tone of the i-th series (from 0) when none is given: the six hues in order, then Other. */
export const categoricalTone = (i: number): ChartTone => hues[i] ?? "categorical.7";

/**
 * A series' tone: its own, else the categorical hue of its place among `all`, the series the plot
 * was given, before any is hidden. The plot, the tooltip, the legend and the card all ask here, so
 * a hidden series never shifts the others' colours.
 */
export const seriesTone = (all: readonly ChartSeries[], s: ChartSeries): ChartTone => {
  const i = all.indexOf(s);
  return s.tone ?? categoricalTone(i < 0 ? all.findIndex((a) => a.key === s.key) : i);
};

/** The colour of `seriesTone`. */
export const seriesColor = (all: readonly ChartSeries[], s: ChartSeries): string =>
  chartColor(seriesTone(all, s));

type SequentialStepOf<Name> = Name extends `color.chart.sequential.${infer Step extends number}`
  ? Step
  : never;
type DivergingStepOf<Name> = Name extends `color.chart.diverging.${infer Step}` ? Step : never;
/** A sequential scale's step, 1 near zero to 5: one for each `color.chart.sequential.*` token. */
export type SequentialStep = SequentialStepOf<TokenName>;
/** A diverging scale's step, from `negative.bold` through `midpoint` to `positive.bold`: one for each `color.chart.diverging.*` token. */
export type DivergingStep = DivergingStepOf<TokenName>;

const sequentialColors = {
  1: "color.chart.sequential.1",
  2: "color.chart.sequential.2",
  3: "color.chart.sequential.3",
  4: "color.chart.sequential.4",
  5: "color.chart.sequential.5",
} as const satisfies { [Step in SequentialStep]: `color.chart.sequential.${Step}` & TokenName };

const divergingColors = {
  "negative.bold": "color.chart.diverging.negative.bold",
  negative: "color.chart.diverging.negative",
  midpoint: "color.chart.diverging.midpoint",
  positive: "color.chart.diverging.positive",
  "positive.bold": "color.chart.diverging.positive.bold",
} as const satisfies { [Step in DivergingStep]: `color.chart.diverging.${Step}` & TokenName };

export const sequentialColor = (step: SequentialStep) => token(sequentialColors[step]);
export const divergingColor = (step: DivergingStep) => token(divergingColors[step]);

/**
 * The scale steps that sit close to the surface: under 3:1 on it in light, in dark or in both
 * (`sequential.1` to `3`, the three middle diverging steps, and zero's `color.chart.track`). A
 * Heatmap cell or a key's swatch in one wears a `color.border.bold` edge, which holds 3:1 on every
 * surface, so it stands apart from the page and from an empty cell whatever its fill.
 */
export const faintStep = (step: SequentialStep | DivergingStep | "zero") =>
  step === "zero" ||
  step === 1 ||
  step === 2 ||
  step === 3 ||
  step === "negative" ||
  step === "midpoint" ||
  step === "positive";

/** The edge a faint step wears: see `faintStep`. */
export const faintEdge = "border border-bold";

const compactFormat = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});
const plainFormat = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });

/**
 * The chart's number format in en-US: grouped, two decimals at most, compact from ten thousand (12.4K).
 * @deprecated A chart formats in the reader's locale; use `useLedgerLocale().formatNumber`, which the parts use. Kept for one version.
 */
export function formatNumber(value: number): string {
  return Math.abs(value) >= 10000 ? compactFormat.format(value) : plainFormat.format(value);
}

/** The surface the plot sits on (a Card, a Dialog, the page), for the gaps between stacked marks, a marker's ring and a label's halo. */
export const surface = () => token("utility.elevation.surface.current");
export const grid = { stroke: token("color.border"), strokeDasharray: "0" };
export const axisLine = { stroke: token("color.border") };
export const cursorFill = { fill: token("color.background.neutral.subtle.hovered") };
export const cursorLine = { stroke: token("color.border.bold"), strokeWidth: 1 };
/** A marker: 8px across, ringed in the surface so it stays legible over a line. */
export const marker = (fill: string) => ({ r: 4, strokeWidth: 2, stroke: surface(), fill });
