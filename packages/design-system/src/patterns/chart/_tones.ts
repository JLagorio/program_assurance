import { token, type TokenName } from "../../generated/tokens";
import type { ChartSeries, ChartTone } from "./_types";

/* The chart tokens as the parts paint them: a tone's colour, its hovered step, the scales, and
   the grid, axis, cursor and marker furniture. */

/** The var() for a chart tone, for anything recharts does not cover. */
export const chartColor = (tone: ChartTone): string => token(`color.chart.${tone}` as TokenName);

/** The tone's hovered step: one darker in light, one lighter in dark. */
export const hoveredColor = (tone: ChartTone): string =>
  token(`color.chart.${tone}.hovered` as TokenName);

/** The tone of the i-th series (from 0) when none is given: the six hues in order, then Other. */
export const categoricalTone = (i: number): ChartTone =>
  i < 6 ? (`categorical.${(i + 1) as 1 | 2 | 3 | 4 | 5 | 6}` as ChartTone) : "categorical.7";

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

export const sequentialColor = (step: 1 | 2 | 3 | 4 | 5) => token(`color.chart.sequential.${step}`);
export const divergingColor = (
  step: "negative.bold" | "negative" | "midpoint" | "positive" | "positive.bold",
) => token(`color.chart.diverging.${step}` as TokenName);

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
