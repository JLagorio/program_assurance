import { useLedgerLocale } from "../../lib/locale";
import type { ComponentProps } from "react";
import {
  Area,
  Bar,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { cn } from "../../lib/cn";
import {
  InlineSizer,
  TooltipContent,
  chartColor,
  surface,
  useFrame,
  useTooltipMotion,
  type ChartDatum,
  type ChartSeries,
  type ChartTone,
  type Formatter,
} from "./_shared";

type ChartSparklineOwnProps = {
  data: ChartDatum[];
  /** The value key. */
  y: string;
  /** The category key, for the tooltip's heading. Without it the tooltip prints the value alone. */
  x?: string | undefined;
  /** `line` is a stroke; `area` adds a wash; `bars` is a column per point. */
  appearance?: "line" | "area" | "bars" | undefined;
  tone?: ChartTone | undefined;
  /** A dashed hairline at a value: last period, the target. */
  reference?: number | undefined;
  /** A ringed marker on the last point. */
  endDot?: boolean | undefined;
  /**
   * Where the scale starts. `auto`, for a line or an area, crops to the data, so a trend on a high
   * base (96% to 99%, 340 to 360) still shows; `zero`, for bars, starts at zero, since a bar's
   * length is its value. Unsaid, `auto` for a line or an area and `zero` for bars.
   */
  baseline?: "zero" | "auto" | undefined;
  /** The most it takes, in pixels: in a narrower container (a cell, a grid track, a flex row) it narrows and keeps its height. */
  width?: number | undefined;
  height?: number | undefined;
  /** The number format in the tooltip. */
  format?: Formatter | undefined;
  /** The accessible name: "Open findings, nine months". Unsaid, the sparkline is decoration beside its number. */
  label?: string | undefined;
  /** What the tooltip calls the value: "Open". The label, else "Value", when unsaid. */
  seriesLabel?: string | undefined;
  /** Draws a skeleton in the sparkline's place. The Frame sets it from `state="loading"`. */
  loading?: boolean | undefined;
  className?: string | undefined;
};

/** The part's own props, and the native props and ref of its box. */
export type ChartSparklineProps = ChartSparklineOwnProps &
  Omit<ComponentProps<"div">, keyof ChartSparklineOwnProps | "children" | "role">;

type DotProps = { cx?: number; cy?: number; index?: number };

/** Recharts' animation off: the marks draw at their place on mount and on a change of data. */
const still = { isAnimationActive: false } as const;

/**
 * A trend with no axes, for a cell or a Stat: the number beside it carries the value. Named, it
 * is an image with that name, and its tooltip follows the pointer; it is never a tab stop, since
 * its number is on the page. Unnamed, it is decoration.
 */
export function ChartSparkline({
  data,
  y,
  x,
  appearance = "line",
  tone = "brand",
  reference,
  endDot,
  baseline,
  width = 96,
  height = 24,
  format: formatProp,
  label,
  seriesLabel,
  loading: loadingProp,
  className,
  ...native
}: ChartSparklineProps) {
  const { t } = useLedgerLocale();

  const { name, format, formatX, loading, offstage } = useFrame(
    label,
    formatProp,
    undefined,
    loadingProp,
  );
  // A sparkline draws in place. It sits in rows and tiles by the dozen, where the plots' entrance
  // would be a render per animation frame for each one, and it is decoration beside its number.
  const motion = still;
  const tooltipMotion = useTooltipMotion();
  const color = chartColor(tone);
  const series: ChartSeries[] = [{ key: y, label: seriesLabel ?? label ?? t("value"), tone }];
  const last = data.length - 1;
  const fromZero = (baseline ?? (appearance === "bars" ? "zero" : "auto")) === "zero";
  if (offstage) return null;
  if (loading)
    return (
      <span
        aria-hidden
        className={cn(
          "inline-block w-fit max-w-full animate-pulse rounded-xsmall bg-skeleton align-middle",
          className,
        )}
      >
        <InlineSizer width={width} height={height} />
      </span>
    );
  const dot = endDot
    ? (p: DotProps) =>
        p.index === last && p.cx !== undefined && p.cy !== undefined ? (
          <circle cx={p.cx} cy={p.cy} r={3} fill={color} stroke={surface()} strokeWidth={2} />
        ) : (
          <g />
        )
    : false;
  const active = name ? { r: 3, strokeWidth: 2, stroke: surface(), fill: color } : false;
  return (
    <div
      {...native}
      role={name ? "img" : undefined}
      aria-label={name}
      aria-hidden={name ? undefined : true}
      data-slot="chart-sparkline"
      className={cn("relative inline-block w-fit max-w-full align-middle", className)}
    >
      <InlineSizer width={width} height={height} />
      <ResponsiveContainer
        width="100%"
        height="100%"
        initialDimension={{ width, height }}
        className="absolute inset-0"
      >
        <ComposedChart
          data={data}
          margin={{ top: 3, right: 3, bottom: 3, left: 3 }}
          barCategoryGap={1}
          accessibilityLayer={false}
          aria-hidden
        >
          <XAxis {...(x ? { dataKey: x } : {})} hide />
          <YAxis domain={fromZero ? [0, "auto"] : ["auto", "auto"]} hide />
          {name ? (
            <Tooltip
              cursor={false}
              {...tooltipMotion}
              content={
                <TooltipContent
                  series={series}
                  swatch="line"
                  format={format}
                  formatX={formatX}
                  showLabel={Boolean(x)}
                />
              }
            />
          ) : null}
          {reference !== undefined ? (
            <ReferenceLine
              y={reference}
              stroke={chartColor("neutral")}
              strokeWidth={1}
              strokeDasharray="3 2"
              ifOverflow="extendDomain"
            />
          ) : null}
          {appearance === "bars" ? (
            <Bar dataKey={y} fill={color} radius={[1, 1, 0, 0]} {...motion} />
          ) : appearance === "area" ? (
            <Area
              dataKey={y}
              type="linear"
              stroke={color}
              strokeWidth={1.5}
              strokeLinecap="round"
              fill={color}
              fillOpacity={0.12}
              dot={dot as never}
              activeDot={active}
              {...(fromZero ? {} : { baseValue: "dataMin" as const })}
              {...motion}
            />
          ) : (
            <Line
              dataKey={y}
              type="linear"
              stroke={color}
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              dot={dot as never}
              activeDot={active}
              {...motion}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
