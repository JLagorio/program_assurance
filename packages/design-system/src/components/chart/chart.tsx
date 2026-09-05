import { ChartBar } from "./bar";
import { ChartDonut } from "./donut";
import { ChartFrame, ChartLegend } from "./frame";
import { ChartHeatmap, ChartScale } from "./heatmap";
import { ChartArea, ChartLine } from "./line";
import { ChartScatter } from "./scatter";
import { ChartSparkline } from "./sparkline";
import { ChartTreemap } from "./treemap";

/**
 * Charts on the chart tokens. `Chart` is the Frame: the figure that names a plot, keys it, holds its
 * states and lays the same numbers out as a table. Each kind of plot is its own part, one file each:
 * bars, lines, areas, a ring, a sparkline, points, tiles and a grid. Recharts draws; the kit decides
 * the paint, the marks, the grid, the tooltip, the legend and the motion, so a chart reads like the
 * rest of the page in both modes.
 */
export const Chart = Object.assign(ChartFrame, {
  Frame: ChartFrame,
  Bar: ChartBar,
  Line: ChartLine,
  Area: ChartArea,
  Donut: ChartDonut,
  Sparkline: ChartSparkline,
  Scatter: ChartScatter,
  Treemap: ChartTreemap,
  Heatmap: ChartHeatmap,
  Scale: ChartScale,
  Legend: ChartLegend,
});
