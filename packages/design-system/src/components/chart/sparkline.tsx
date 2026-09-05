import { Area, Bar, ComposedChart, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { cn } from "../../lib/cn";
import {
  TooltipContent,
  chartColor,
  plainCategory,
  surface,
  useFrame,
  useMotion,
  useTooltipMotion,
  type ChartDatum,
  type ChartSeries,
  type ChartTone,
  type Formatter,
} from "./_shared";

export type ChartSparklineProps = {
  data: ChartDatum[];
  /** The value key. */
  y: string;
  /** The category key, for the tooltip. Index order when unsaid. */
  x?: string | undefined;
  /** `line` is a stroke; `area` adds a wash; `bars` is a column per point. */
  appearance?: "line" | "area" | "bars" | undefined;
  tone?: ChartTone | undefined;
  /** A dashed hairline at a value: last period, the target. */
  reference?: number | undefined;
  /** A ringed marker on the last point. */
  endDot?: boolean | undefined;
  width?: number | undefined;
  height?: number | undefined;
  /** The number format in the tooltip. */
  format?: Formatter | undefined;
  /** The accessible name: "Open findings, nine months". Unsaid, the sparkline is decoration beside its number. */
  label?: string | undefined;
  /** Draws a skeleton in the sparkline's place. The Frame sets it from `status="loading"`. */
  loading?: boolean | undefined;
  className?: string | undefined;
};

type DotProps = { cx?: number; cy?: number; index?: number };

/** A trend with no axes, for a cell or a Stat: the number beside it carries the value. */
export function ChartSparkline({
  data,
  y,
  x,
  appearance = "line",
  tone = "brand",
  reference,
  endDot,
  width = 96,
  height = 24,
  format: formatProp,
  label,
  loading: loadingProp,
  className,
}: ChartSparklineProps) {
  const { name, format, loading } = useFrame(label, formatProp, undefined, loadingProp);
  const motion = useMotion();
  const tooltipMotion = useTooltipMotion();
  const color = chartColor(tone);
  const series: ChartSeries[] = [{ key: y, label: "Value", tone }];
  const last = data.length - 1;
  if (loading)
    return (
      <span
        aria-hidden
        className={cn("inline-block animate-pulse rounded-xsmall bg-skeleton align-middle", className)}
        style={{ width, height }}
      />
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
      role={name ? "group" : undefined}
      aria-label={name}
      aria-hidden={name ? undefined : true}
      className={cn("inline-block align-middle", className)}
      style={{ width, height }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={data}
          margin={{ top: 3, right: 3, bottom: 3, left: 3 }}
          barCategoryGap={1}
          accessibilityLayer={Boolean(name)}
        >
          <XAxis {...(x ? { dataKey: x } : {})} hide />
          <YAxis domain={[0, "auto"]} hide />
          {name ? (
            <Tooltip
              cursor={false}
              {...tooltipMotion}
              content={
                <TooltipContent
                  series={series}
                  swatch="line"
                  format={format}
                  formatX={plainCategory}
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
