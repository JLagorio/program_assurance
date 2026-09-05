import { Table2 } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useId,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  Area,
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  LabelList,
  Line,
  Pie,
  PieChart,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  Treemap,
  XAxis,
  YAxis,
  ZAxis,
  usePlotArea,
  useXAxisScale,
  useYAxisScale,
} from "recharts";

import { token, type TokenName } from "../generated/tokens";
import { cn } from "../lib/cn";
import { toneClasses, type Tone } from "./badge";
import { Skeleton } from "./skeleton";
import { Table } from "./table";
import { Toggle } from "./toggle";

/**
 * Charts on the chart tokens. Recharts draws; the kit decides the paint, the marks, the grid, the
 * tooltip and the legend, so a chart reads like the rest of the page in both modes. Every series
 * is a `color.chart.*` token: a status tone when the series carries a status, `brand` for the one
 * series the reader is asked to look at, `neutral` for context, and the categorical set, in order,
 * when categories carry no status. Charts do not animate: the data is the point.
 */

/* ---------- tones and scales ---------- */

/** A status tone, `brand`, `neutral`, or one of the six categorical hues; `categorical.7` is Other. */
export type ChartTone = Tone | "brand" | `categorical.${1 | 2 | 3 | 4 | 5 | 6 | 7}`;

/** The plot's height: `small` 120px for a rail or a cell, `medium` 200px for a section, `large` 320px for the one chart a page is about. */
export type ChartSize = "small" | "medium" | "large";

const heights: Record<ChartSize, number> = { small: 120, medium: 200, large: 320 };

/** The var() for a chart tone, for anything recharts does not cover. */
export const chartColor = (tone: ChartTone): string => token(`color.chart.${tone}` as TokenName);

/** The tone of the i-th series (from 0) when none is given: the six hues in order, then Other. */
export const categoricalTone = (i: number): ChartTone =>
  i < 6 ? (`categorical.${(i + 1) as 1 | 2 | 3 | 4 | 5 | 6}` as ChartTone) : "categorical.7";

const sequentialColor = (step: 1 | 2 | 3 | 4 | 5) => token(`color.chart.sequential.${step}`);
const divergingColor = (
  step: "negative.bold" | "negative" | "midpoint" | "positive" | "positive.bold",
) => token(`color.chart.diverging.${step}` as TokenName);

const compactFormat = new Intl.NumberFormat(undefined, {
  notation: "compact",
  maximumFractionDigits: 1,
});
const plainFormat = new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 });

/** The default number format: grouped, two decimals at most, compact from ten thousand (12.4K). */
export function formatNumber(value: number): string {
  return Math.abs(value) >= 10000 ? compactFormat.format(value) : plainFormat.format(value);
}

/* ---------- data ---------- */

/** One record along the category axis. A value may be a `[from, to]` pair for a floating bar. */
export type ChartDatum = Record<
  string,
  string | number | null | undefined | readonly [number, number]
>;

export type ChartSeries = {
  /** The key in each datum. */
  key: string;
  /** What the legend, the tooltip and the table call it. Defaults to the key. */
  label?: string | undefined;
  /** The `color.chart.*` token. Defaults to the categorical set, in order. */
  tone?: ChartTone | undefined;
};

/** A line across the plot: a target, a limit, a milestone. `y` is on the value axis, `x` on the category axis. */
export type ChartReference = {
  y?: number | undefined;
  x?: string | number | undefined;
  /** Printed at the line's end. */
  label?: string | undefined;
  /** `neutral` when unsaid: a target is context. `danger` for a limit that must not be crossed. */
  tone?: ChartTone | undefined;
};

/** A band between two values: the acceptable range, the plan's tolerance. */
export type ChartBand = {
  from: number;
  to: number;
  label?: string | undefined;
  /** `neutral` when unsaid. */
  tone?: ChartTone | undefined;
};

type Formatter = (value: number) => string;
type CategoryFormatter = (value: string | number) => string;

const isRange = (v: unknown): v is readonly [number, number] =>
  Array.isArray(v) && v.length === 2 && typeof v[0] === "number" && typeof v[1] === "number";

const formatValue = (v: unknown, format: Formatter): string => {
  if (typeof v === "number") return format(v);
  if (isRange(v)) return `${format(v[0])} to ${format(v[1])}`;
  if (v === null || v === undefined) return "";
  return String(v);
};

/* ---------- the frame's state ---------- */

type FrameState = {
  name: string | undefined;
  hidden: ReadonlySet<string>;
  highlighted: string | null;
  highlight: (key: string | null) => void;
  toggle: (key: string) => void;
  format: Formatter | undefined;
  formatX: CategoryFormatter | undefined;
};

const FrameContext = createContext<FrameState | null>(null);
const none: ReadonlySet<string> = new Set();
const plainCategory: CategoryFormatter = (v) => String(v);

/** What a plot inherits from the Frame around it: its name, the legend's state, the formats. */
function useFrame(
  label: string | undefined,
  format: Formatter | undefined,
  formatX: CategoryFormatter | undefined,
) {
  const frame = useContext(FrameContext);
  return {
    name: label ?? frame?.name,
    hidden: frame?.hidden ?? none,
    highlighted: frame?.highlighted ?? null,
    format: format ?? frame?.format ?? formatNumber,
    formatX: formatX ?? frame?.formatX ?? plainCategory,
  };
}

/** The class a series takes from the legend: dimmed when another is highlighted, a pointer when it clicks. */
const seriesClass = (
  key: string,
  highlighted: string | null,
  clickable: boolean,
): { className: string } | Record<never, never> => {
  const c = cn(
    highlighted !== null && highlighted !== key && "opacity-disabled",
    clickable && "cursor-pointer",
  );
  return c ? { className: c } : {};
};

/** A recharts label prop only when there is a label to draw. */
const labelProp = (l: ReturnType<typeof referenceLabel>) => (l ? { label: l } : {});

/* ---------- the shared furniture ---------- */

const surface = () => token("elevation.surface");
const grid = { stroke: token("color.border"), strokeDasharray: "0" };
const axisLine = { stroke: token("color.border") };
const cursorFill = { fill: token("color.background.neutral.subtle.hovered") };
const cursorLine = { stroke: token("color.border.bold"), strokeWidth: 1 };
/** A marker: 8px across, ringed in the surface so it stays legible over a line. */
const marker = (fill: string) => ({ r: 4, strokeWidth: 2, stroke: surface(), fill });

const truncate = (text: string, max: number) =>
  text.length > max ? `${text.slice(0, max - 1)}…` : text;

/** An axis tick in `font.body.xsmall` and `color.text.subtlest`. A long category is cut with its whole in a title. */
function Tick({
  x,
  y,
  payload,
  textAnchor,
  vertical,
  format,
  max = 14,
}: {
  x?: number | string | undefined;
  y?: number | string | undefined;
  payload?: { value: string | number } | undefined;
  textAnchor?: "start" | "middle" | "end" | "inherit" | undefined;
  vertical?: boolean | undefined;
  format?: ((value: string | number) => string) | undefined;
  max?: number | undefined;
}) {
  const raw = payload?.value ?? "";
  const text = format ? format(raw) : String(raw);
  const shown = truncate(text, max);
  return (
    <text
      x={x}
      y={y}
      dy={vertical ? 4 : 12}
      textAnchor={textAnchor ?? (vertical ? "end" : "middle")}
      className="font-body-xsmall tabular-nums"
      fill={token("color.text.subtlest")}
    >
      {shown !== text ? <title>{text}</title> : null}
      {shown}
    </text>
  );
}

/** The key beside a name: a square for a fill, a stroke for a line, a dot for a point. */
function Swatch({
  color,
  shape,
  hollow,
}: {
  color: string;
  shape: "square" | "line" | "dot";
  hollow?: boolean | undefined;
}) {
  if (shape === "line")
    return (
      <span
        aria-hidden
        className="inline-block h-025 w-150 shrink-0 rounded-xsmall"
        style={{ backgroundColor: color }}
      />
    );
  return (
    <span
      aria-hidden
      className={cn(
        "inline-block size-100 shrink-0",
        shape === "dot" ? "rounded-full" : "rounded-xsmall",
        hollow && "border",
      )}
      style={hollow ? { borderColor: color } : { backgroundColor: color }}
    />
  );
}

type TooltipRow = {
  name?: string | undefined;
  value?: unknown;
  dataKey?: string | number | undefined;
  color?: string | undefined;
  payload?: unknown;
};

/** The tooltip: the value leads, the series follows, keyed by a swatch shaped like the mark. */
function TooltipContent({
  active,
  payload,
  label,
  series,
  swatch,
  format,
  formatX,
  targetKey,
}: {
  active?: boolean | undefined;
  payload?: TooltipRow[] | undefined;
  label?: string | number | undefined;
  series: ChartSeries[];
  swatch: "square" | "line" | "dot";
  format: Formatter;
  formatX: CategoryFormatter;
  targetKey?: string | undefined;
}) {
  if (!active || !payload?.length) return null;
  const rows = payload.filter((p) => p.value !== null && p.value !== undefined);
  if (!rows.length) return null;
  return (
    <div className="min-w-0 rounded-medium border border-default bg-surface-overlay px-150 py-100 shadow-overlay">
      {label !== undefined && label !== "" ? (
        <div className="pb-050 font-body-small text-subtle">{formatX(label)}</div>
      ) : null}
      {rows.map((p, i) => {
        const key = String(p.dataKey ?? "");
        const s = series.find((x) => x.key === key);
        const isTarget = targetKey !== undefined && key === targetKey;
        const name = isTarget ? "Target" : (s?.label ?? s?.key ?? p.name ?? key);
        return (
          <div key={i} className="flex items-center gap-100 font-body-small">
            <Swatch
              color={isTarget ? token("color.text") : (p.color ?? "")}
              shape={isTarget ? "line" : swatch}
            />
            <span className="tabular-nums font-medium text-default">
              {formatValue(p.value, format)}
            </span>
            <span className="min-w-0 truncate text-subtle">{name}</span>
          </div>
        );
      })}
    </div>
  );
}

type ViewBox = { x: number; y: number; width: number; height: number };

/** A reference line's label, at the line's end in `color.text.subtlest`. */
function referenceLabel(text: string | undefined, vertical: boolean) {
  if (!text) return undefined;
  return (props: { viewBox?: ViewBox }) => {
    const v = props.viewBox ?? { x: 0, y: 0, width: 0, height: 0 };
    return vertical ? (
      <text
        x={v.x + 4}
        y={v.y + 10}
        textAnchor="start"
        className="font-body-xsmall"
        fill={token("color.text.subtlest")}
      >
        {text}
      </text>
    ) : (
      <text
        x={v.x + v.width}
        y={v.y - 4}
        textAnchor="end"
        className="font-body-xsmall"
        fill={token("color.text.subtlest")}
      >
        {text}
      </text>
    );
  };
}

function References({
  reference,
  horizontal,
}: {
  reference: ChartReference[] | undefined;
  horizontal?: boolean | undefined;
}) {
  if (!reference?.length) return null;
  return (
    <>
      {reference.map((r, i) => {
        const stroke = chartColor(r.tone ?? "neutral");
        // On a horizontal chart the value axis is x, so a `y` reference is a vertical line.
        const onValueAxis = r.y !== undefined;
        const vertical = horizontal ? onValueAxis : !onValueAxis;
        const pos = horizontal
          ? onValueAxis
            ? { x: r.y as number }
            : { y: r.x as string | number }
          : onValueAxis
            ? { y: r.y as number }
            : { x: r.x as string | number };
        return (
          <ReferenceLine
            key={i}
            {...pos}
            stroke={stroke}
            strokeWidth={1}
            strokeDasharray="4 3"
            ifOverflow="extendDomain"
            {...labelProp(referenceLabel(r.label, vertical))}
          />
        );
      })}
    </>
  );
}

function Bands({ bands }: { bands: ChartBand[] | undefined }) {
  if (!bands?.length) return null;
  return (
    <>
      {bands.map((b, i) => (
        <ReferenceArea
          key={i}
          y1={b.from}
          y2={b.to}
          fill={chartColor(b.tone ?? "neutral")}
          fillOpacity={0.1}
          stroke="none"
          ifOverflow="extendDomain"
          {...labelProp(referenceLabel(b.label, false))}
        />
      ))}
    </>
  );
}

/** The value at a bar's end, in `color.text.subtle`, outside the bar. */
function EndLabel({
  x,
  y,
  width,
  height,
  value,
  horizontal,
  format,
}: {
  x?: number | string | undefined;
  y?: number | string | undefined;
  width?: number | string | undefined;
  height?: number | string | undefined;
  value?: unknown;
  horizontal?: boolean | undefined;
  format: Formatter;
}) {
  if (typeof value !== "number" && !isRange(value)) return null;
  const nx = Number(x ?? 0);
  const ny = Number(y ?? 0);
  const w = Number(width ?? 0);
  const h = Number(height ?? 0);
  const text = formatValue(value, format);
  return horizontal ? (
    <text
      x={nx + w + 4}
      y={ny + h / 2}
      dy={4}
      textAnchor="start"
      className="font-body-xsmall tabular-nums"
      fill={token("color.text.subtle")}
    >
      {text}
    </text>
  ) : (
    <text
      x={nx + w / 2}
      y={ny - 4}
      textAnchor="middle"
      className="font-body-xsmall tabular-nums"
      fill={token("color.text.subtle")}
    >
      {text}
    </text>
  );
}

/** A target: a mark in ink across the bar, so the bar reads against it. */
function TargetMark({
  cx,
  cy,
  horizontal,
}: {
  cx?: number | undefined;
  cy?: number | undefined;
  horizontal?: boolean | undefined;
}) {
  if (cx === undefined || cy === undefined) return null;
  return horizontal ? (
    <line x1={cx} x2={cx} y1={cy - 12} y2={cy + 12} stroke={token("color.text")} strokeWidth={2} />
  ) : (
    <line x1={cx - 12} x2={cx + 12} y1={cy} y2={cy} stroke={token("color.text")} strokeWidth={2} />
  );
}

/** The container with the kit's height. Named by `label` or by the Frame; unnamed, it is decoration and not focusable. */
function Plot({
  name,
  size,
  height,
  className,
  children,
}: {
  name: string | undefined;
  size?: ChartSize | undefined;
  height?: number | undefined;
  className?: string | undefined;
  children: ReactNode;
}) {
  return (
    <div
      role={name ? "group" : undefined}
      aria-label={name}
      aria-hidden={name ? undefined : true}
      className={cn("w-full", className)}
      style={{ height: height ?? heights[size ?? "medium"] }}
    >
      <ResponsiveContainer width="100%" height="100%">
        {children as never}
      </ResponsiveContainer>
    </div>
  );
}

/** What every cartesian plot takes. */
type PlotProps = {
  /** Plain records, in the order they are drawn. */
  data: ChartDatum[];
  /** The key that names each datum along the category axis. */
  x: string;
  /** One entry per value key. */
  series: ChartSeries[];
  /** The plot's height. `medium` (200px) when unsaid. */
  size?: ChartSize | undefined;
  /** A height in pixels when a layout must, in place of `size`. */
  height?: number | undefined;
  /** The number format for the value axis, the tooltip and the labels. The Frame's, else the kit's. */
  format?: Formatter | undefined;
  /** The format for a category: a date, a code. */
  formatX?: CategoryFormatter | undefined;
  /** Lines across the plot: a target, a limit, a milestone. */
  reference?: ChartReference[] | undefined;
  /** The plot's accessible name. Unneeded inside a Frame, which names it after its title; a plot with neither is hidden from a screen reader. */
  label?: string | undefined;
  /** Makes the marks clickable: the datum and the series clicked, to filter what is under the chart. */
  onSelect?: ((datum: ChartDatum, series: ChartSeries) => void) | undefined;
  className?: string | undefined;
};

const margin = { top: 8, right: 12, bottom: 0, left: 0 };

type Clicked = { payload: ChartDatum };

/* ---------- bars ---------- */

export type ChartBarProps = PlotProps & {
  /** Stack the series in one bar per category, parts of a whole. */
  stacked?: boolean | undefined;
  /** Categories down the side, values across: for long names, or many categories. */
  horizontal?: boolean | undefined;
  /** `end` prints each bar's value at its end. For a chart with a few bars and no stacking. */
  labels?: "none" | "end" | undefined;
  /** A key in each datum holding a target: drawn as a mark across the bar, so actual reads against planned. */
  target?: string | undefined;
  /** A series drawn as a line over the bars on the same axis: a cumulative, a rate, a plan. */
  line?: ChartSeries | undefined;
};

/** Bars per category; several series sit side by side, or stack. A value that is a `[from, to]` pair floats. */
export function ChartBar({
  data,
  x,
  series,
  stacked,
  horizontal,
  labels = "none",
  target,
  line,
  size,
  height,
  format: formatProp,
  formatX: formatXProp,
  reference,
  label,
  onSelect,
  className,
}: ChartBarProps) {
  const { name, hidden, highlighted, format, formatX } = useFrame(label, formatProp, formatXProp);
  const categoryWidth = useMemo(() => {
    const longest = Math.max(
      0,
      ...data.map((d) => truncate(formatX((d[x] as string | number | undefined) ?? ""), 18).length),
    );
    return Math.min(160, Math.max(56, 8 + 6.5 * longest));
  }, [data, x, formatX]);
  const all = line ? [...series, line] : series;
  const lineTone = line ? (line.tone ?? categoricalTone(series.length)) : "brand";
  return (
    <Plot name={name} size={size} height={height} className={className}>
      <ComposedChart
        data={data}
        layout={horizontal ? "vertical" : "horizontal"}
        margin={labels === "end" ? { ...margin, top: 16, right: horizontal ? 40 : 12 } : margin}
        barGap={2}
        barCategoryGap={stacked ? "35%" : "25%"}
        accessibilityLayer={Boolean(name)}
      >
        <CartesianGrid {...grid} vertical={Boolean(horizontal)} horizontal={!horizontal} />
        {horizontal ? (
          <>
            <XAxis
              type="number"
              domain={[0, "auto"]}
              tick={<Tick format={(v) => format(Number(v))} />}
              axisLine={axisLine}
              tickLine={false}
              height={24}
            />
            <YAxis
              type="category"
              dataKey={x}
              tick={<Tick vertical format={formatX} max={18} />}
              axisLine={false}
              tickLine={false}
              width={categoryWidth}
            />
          </>
        ) : (
          <>
            <XAxis
              dataKey={x}
              tick={<Tick format={formatX} />}
              axisLine={axisLine}
              tickLine={false}
              height={24}
              interval="equidistantPreserveStart"
            />
            <YAxis
              domain={[0, "auto"]}
              tick={<Tick vertical format={(v) => format(Number(v))} />}
              axisLine={false}
              tickLine={false}
              width={40}
            />
          </>
        )}
        <Tooltip
          cursor={cursorFill}
          isAnimationActive={false}
          content={
            <TooltipContent
              series={all}
              swatch="square"
              format={format}
              formatX={formatX}
              targetKey={target}
            />
          }
        />
        {series.map((s, i) => {
          const color = chartColor(s.tone ?? categoricalTone(i));
          const radius: [number, number, number, number] = stacked
            ? [0, 0, 0, 0]
            : horizontal
              ? [0, 2, 2, 0]
              : [2, 2, 0, 0];
          return (
            <Bar
              key={s.key}
              dataKey={s.key}
              name={s.label ?? s.key}
              fill={color}
              stroke={stacked ? surface() : "none"}
              strokeWidth={stacked ? 2 : 0}
              radius={radius}
              maxBarSize={24}
              hide={hidden.has(s.key)}
              {...seriesClass(s.key, highlighted, Boolean(onSelect))}
              activeBar={{ fillOpacity: 0.8 }}
              isAnimationActive={false}
              {...(stacked ? { stackId: "stack" } : {})}
              {...(onSelect
                ? { onClick: (item: unknown) => onSelect((item as Clicked).payload, s) }
                : {})}
            >
              {labels === "end" && !stacked ? (
                <LabelList
                  dataKey={s.key}
                  content={<EndLabel horizontal={horizontal} format={format} />}
                />
              ) : null}
            </Bar>
          );
        })}
        {target ? (
          <Scatter
            dataKey={target}
            name="Target"
            shape={<TargetMark horizontal={horizontal} />}
            isAnimationActive={false}
          />
        ) : null}
        {line ? (
          <Line
            dataKey={line.key}
            name={line.label ?? line.key}
            type="linear"
            stroke={chartColor(lineTone)}
            strokeWidth={2}
            strokeLinecap="round"
            dot={false}
            activeDot={marker(chartColor(lineTone))}
            hide={hidden.has(line.key)}
            {...seriesClass(line.key, highlighted, false)}
            isAnimationActive={false}
          />
        ) : null}
        <References reference={reference} horizontal={horizontal} />
      </ComposedChart>
    </Plot>
  );
}

/* ---------- lines and areas ---------- */

export type ChartLineProps = PlotProps & {
  /** `linear` joins the points; `smooth` eases between them without overshooting. */
  curve?: "linear" | "smooth" | undefined;
  /** A marker on every point, for a series with few points. Hover shows one either way. */
  dots?: boolean | undefined;
  /** `end` prints each series' last value after its line. */
  labels?: "none" | "end" | undefined;
  /** `zero` starts the value axis at zero; `auto` crops to the data, for a trend where the change matters more than the size. */
  baseline?: "zero" | "auto" | undefined;
  /** Bands across the plot: the acceptable range, the plan's tolerance. */
  bands?: ChartBand[] | undefined;
  /** Join across a missing value. Off, a gap says the data was not there. */
  connectNulls?: boolean | undefined;
};

type Scale = ((value: unknown) => number | undefined) & { bandwidth?: () => number };

/**
 * The last value of every visible series, after its line, in `color.text.subtle`. Labels that would
 * collide are pushed apart by a line's height, so two series that end close still read.
 */
function EndLabels({
  data,
  x,
  series,
  hidden,
  highlighted,
  format,
}: {
  data: ChartDatum[];
  x: string;
  series: ChartSeries[];
  hidden: ReadonlySet<string>;
  highlighted: string | null;
  format: Formatter;
}) {
  const xScale = useXAxisScale() as Scale | undefined;
  const yScale = useYAxisScale() as Scale | undefined;
  const plot = usePlotArea();
  if (!xScale || !yScale || !plot) return null;
  const labels: { key: string; y: number; text: string }[] = [];
  for (const s of series) {
    if (hidden.has(s.key)) continue;
    let last: ChartDatum | undefined;
    for (let i = data.length - 1; i >= 0; i--) {
      if (typeof data[i]?.[s.key] === "number") {
        last = data[i];
        break;
      }
    }
    if (!last) continue;
    const value = last[s.key] as number;
    const px = xScale(last[x]);
    const py = yScale(value);
    if (px === undefined || py === undefined) continue;
    labels.push({ key: s.key, y: py, text: format(value) });
  }
  if (!labels.length) return null;
  const lastDatum = data[data.length - 1];
  const cx = (xScale(lastDatum?.[x]) ?? plot.x + plot.width) + (xScale.bandwidth?.() ?? 0) / 2;
  labels.sort((a, b) => a.y - b.y);
  const step = 12;
  for (let i = 1; i < labels.length; i++) {
    const prev = labels[i - 1];
    const cur = labels[i];
    if (prev && cur && cur.y - prev.y < step) cur.y = prev.y + step;
  }
  const bottom = plot.y + plot.height;
  const overflow = (labels[labels.length - 1]?.y ?? 0) - bottom;
  if (overflow > 0) for (const l of labels) l.y -= overflow;
  return (
    <g>
      {labels.map((l) => (
        <text
          key={l.key}
          x={cx + 8}
          y={l.y}
          dy={4}
          textAnchor="start"
          className={cn(
            "font-body-xsmall tabular-nums",
            highlighted !== null && highlighted !== l.key && "opacity-disabled",
          )}
          fill={token("color.text.subtle")}
        >
          {l.text}
        </text>
      ))}
    </g>
  );
}

/** A line per series, 2px, with a ringed marker on hover. */
export function ChartLine({
  data,
  x,
  series,
  curve = "linear",
  dots,
  labels = "none",
  baseline = "zero",
  bands,
  connectNulls,
  size,
  height,
  format: formatProp,
  formatX: formatXProp,
  reference,
  label,
  onSelect,
  className,
}: ChartLineProps) {
  const { name, hidden, highlighted, format, formatX } = useFrame(label, formatProp, formatXProp);
  return (
    <Plot name={name} size={size} height={height} className={className}>
      <ComposedChart
        data={data}
        margin={labels === "end" ? { ...margin, right: 44 } : margin}
        accessibilityLayer={Boolean(name)}
      >
        <CartesianGrid {...grid} vertical={false} />
        <XAxis
          dataKey={x}
          tick={<Tick format={formatX} />}
          axisLine={axisLine}
          tickLine={false}
          height={24}
          interval="equidistantPreserveStart"
        />
        <YAxis
          domain={baseline === "auto" ? ["auto", "auto"] : [0, "auto"]}
          tick={<Tick vertical format={(v) => format(Number(v))} />}
          axisLine={false}
          tickLine={false}
          width={40}
        />
        <Tooltip
          cursor={cursorLine}
          isAnimationActive={false}
          content={
            <TooltipContent series={series} swatch="line" format={format} formatX={formatX} />
          }
        />
        <Bands bands={bands} />
        {series.map((s, i) => {
          const color = chartColor(s.tone ?? categoricalTone(i));
          return (
            <Line
              key={s.key}
              dataKey={s.key}
              name={s.label ?? s.key}
              type={curve === "smooth" ? "monotone" : "linear"}
              stroke={color}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              dot={dots ? marker(color) : false}
              activeDot={{
                ...marker(color),
                ...(onSelect
                  ? {
                      onClick: (_e: unknown, item: unknown) =>
                        onSelect((item as Clicked).payload, s),
                    }
                  : {}),
              }}
              connectNulls={Boolean(connectNulls)}
              hide={hidden.has(s.key)}
              {...seriesClass(s.key, highlighted, false)}
              isAnimationActive={false}
            >
            </Line>
          );
        })}
        {labels === "end" ? (
          <EndLabels
            data={data}
            x={x}
            series={series}
            hidden={hidden}
            highlighted={highlighted}
            format={format}
          />
        ) : null}
        <References reference={reference} />
      </ComposedChart>
    </Plot>
  );
}

export type ChartAreaProps = ChartLineProps & {
  /** Stack the series: parts of a whole over time. */
  stacked?: boolean | undefined;
};

/** A line with a wash under it, one per series; stacked when asked. */
export function ChartArea({
  data,
  x,
  series,
  curve = "linear",
  dots,
  labels = "none",
  baseline = "zero",
  bands,
  connectNulls,
  stacked,
  size,
  height,
  format: formatProp,
  formatX: formatXProp,
  reference,
  label,
  className,
}: ChartAreaProps) {
  const { name, hidden, highlighted, format, formatX } = useFrame(label, formatProp, formatXProp);
  return (
    <Plot name={name} size={size} height={height} className={className}>
      <ComposedChart
        data={data}
        margin={labels === "end" ? { ...margin, right: 44 } : margin}
        accessibilityLayer={Boolean(name)}
      >
        <CartesianGrid {...grid} vertical={false} />
        <XAxis
          dataKey={x}
          tick={<Tick format={formatX} />}
          axisLine={axisLine}
          tickLine={false}
          height={24}
          interval="equidistantPreserveStart"
        />
        <YAxis
          domain={baseline === "auto" ? ["auto", "auto"] : [0, "auto"]}
          tick={<Tick vertical format={(v) => format(Number(v))} />}
          axisLine={false}
          tickLine={false}
          width={40}
        />
        <Tooltip
          cursor={cursorLine}
          isAnimationActive={false}
          content={
            <TooltipContent series={series} swatch="square" format={format} formatX={formatX} />
          }
        />
        <Bands bands={bands} />
        {series.map((s, i) => {
          const color = chartColor(s.tone ?? categoricalTone(i));
          return (
            <Area
              key={s.key}
              dataKey={s.key}
              name={s.label ?? s.key}
              type={curve === "smooth" ? "monotone" : "linear"}
              stroke={color}
              fill={color}
              fillOpacity={0.12}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              dot={dots ? marker(color) : false}
              activeDot={marker(color)}
              connectNulls={Boolean(connectNulls)}
              hide={hidden.has(s.key)}
              {...seriesClass(s.key, highlighted, false)}
              isAnimationActive={false}
              {...(stacked ? { stackId: "stack" } : {})}
            >
            </Area>
          );
        })}
        {labels === "end" ? (
          <EndLabels
            data={data}
            x={x}
            series={series}
            hidden={hidden}
            highlighted={highlighted}
            format={format}
          />
        ) : null}
        <References reference={reference} />
      </ComposedChart>
    </Plot>
  );
}

/* ---------- donut ---------- */

export type DonutSlice = {
  key: string;
  label: string;
  value: number;
  tone?: ChartTone | undefined;
};

export type ChartDonutProps = {
  /** The parts, in order from the top, clockwise. */
  slices: DonutSlice[];
  /** The number in the middle: the total, the share, the one that matters. */
  label?: ReactNode | undefined;
  /** One word under the number: what it counts. */
  caption?: string | undefined;
  /** `full` is a ring; `half` is a gauge, open at the bottom, the label at its base. */
  arc?: "full" | "half" | undefined;
  /** Diameter in pixels. */
  size?: number | undefined;
  /** The ring's thickness in pixels. */
  thickness?: number | undefined;
  /** The number format in the tooltip. */
  format?: Formatter | undefined;
  /** The ring's accessible name. Unneeded inside a Frame. */
  name?: string | undefined;
  /** Makes the slices clickable. */
  onSelect?: ((slice: DonutSlice) => void) | undefined;
  className?: string | undefined;
};

/** A ring of slices on a `color.chart.track` with a number in the middle; or half a ring, a gauge. */
export function ChartDonut({
  slices,
  label,
  caption,
  arc = "full",
  size = 120,
  thickness = 12,
  format: formatProp,
  name: nameProp,
  onSelect,
  className,
}: ChartDonutProps) {
  const { name, hidden, highlighted, format } = useFrame(nameProp, formatProp, undefined);
  const series: ChartSeries[] = slices.map((s) => ({ key: s.key, label: s.label }));
  const shown = slices.filter((s) => !hidden.has(s.key));
  const half = arc === "half";
  const outer = size / 2;
  const inner = outer - thickness;
  const boxHeight = half ? outer + 4 : size;
  const angles = half ? { startAngle: 180, endAngle: 0 } : { startAngle: 90, endAngle: -270 };
  const cy = half ? outer : "50%";
  return (
    <div
      role={name ? "group" : undefined}
      aria-label={name}
      aria-hidden={name ? undefined : true}
      className={cn("relative inline-block shrink-0", className)}
      style={{ width: size, height: boxHeight }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <PieChart
          margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
          accessibilityLayer={Boolean(name)}
        >
          <Pie
            data={[{ key: "track", value: 1 }]}
            dataKey="value"
            cx="50%"
            cy={cy}
            innerRadius={inner}
            outerRadius={outer}
            fill={token("color.chart.track")}
            stroke="none"
            isAnimationActive={false}
            {...angles}
          />
          <Pie
            data={shown}
            dataKey="value"
            nameKey="label"
            cx="50%"
            cy={cy}
            innerRadius={inner}
            outerRadius={outer}
            stroke={surface()}
            strokeWidth={shown.length > 1 ? 2 : 0}
            isAnimationActive={false}
            {...angles}
            {...(onSelect
              ? {
                  onClick: (_item: unknown, index: number) => {
                    const s = shown[index];
                    if (s) onSelect(s);
                  },
                }
              : {})}
          >
            {shown.map((s) => (
              <Cell
                key={s.key}
                fill={chartColor(s.tone ?? categoricalTone(slices.indexOf(s)))}
                {...seriesClass(s.key, highlighted, Boolean(onSelect))}
              />
            ))}
          </Pie>
          <Tooltip
            isAnimationActive={false}
            content={
              <TooltipContent
                series={series}
                swatch="square"
                format={format}
                formatX={plainCategory}
              />
            }
          />
        </PieChart>
      </ResponsiveContainer>
      {label !== undefined || caption ? (
        <div
          className={cn(
            "pointer-events-none absolute inset-x-0 flex flex-col items-center text-center",
            half ? "bottom-0" : "inset-y-0 justify-center",
          )}
        >
          {label !== undefined ? (
            <span className="font-heading-xsmall text-default">{label}</span>
          ) : null}
          {caption ? <span className="font-body-xsmall text-subtle">{caption}</span> : null}
        </div>
      ) : null}
    </div>
  );
}

/* ---------- sparkline ---------- */

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
  className,
}: ChartSparklineProps) {
  const { name, format } = useFrame(label, formatProp, undefined);
  const color = chartColor(tone);
  const series: ChartSeries[] = [{ key: y, label: "Value", tone }];
  const last = data.length - 1;
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
              isAnimationActive={false}
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
            <Bar dataKey={y} fill={color} radius={[1, 1, 0, 0]} isAnimationActive={false} />
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
              isAnimationActive={false}
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
              isAnimationActive={false}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ---------- scatter ---------- */

export type ChartScatterGroup = {
  /** The value of `groupBy` that puts a datum in this group. */
  key: string;
  label?: string | undefined;
  tone?: ChartTone | undefined;
};

export type ChartScatterProps = {
  data: ChartDatum[];
  /** The key on the horizontal axis. */
  x: string;
  /** The key on the vertical axis. */
  y: string;
  /** A key whose value sizes the point: a bubble. Area, not radius, so twice the value is twice the ink. */
  z?: string | undefined;
  /** The key that names a point in the tooltip. */
  name?: string | undefined;
  /** The key that puts each point in a group, and the groups with their tones. At most three, so any two points stay apart. */
  groupBy?: string | undefined;
  groups?: ChartScatterGroup[] | undefined;
  /** The tone of every point when there are no groups. */
  tone?: ChartTone | undefined;
  /** Lines across the plot: a limit on either axis, or both for quadrants. */
  reference?: ChartReference[] | undefined;
  /** Axis titles, when the keys do not say enough. */
  xLabel?: string | undefined;
  yLabel?: string | undefined;
  size?: ChartSize | undefined;
  height?: number | undefined;
  format?: Formatter | undefined;
  formatX?: CategoryFormatter | undefined;
  label?: string | undefined;
  /** Makes the points clickable. */
  onSelect?: ((datum: ChartDatum) => void) | undefined;
  className?: string | undefined;
};

/** A point, 8px across and ringed, with a hit area three times its size. A bubble's area follows `z`. */
function Point({
  cx,
  cy,
  fill,
  size,
  clickable,
}: {
  cx?: number | undefined;
  cy?: number | undefined;
  fill?: string | undefined;
  size?: number | undefined;
  clickable?: boolean | undefined;
}) {
  if (cx === undefined || cy === undefined) return null;
  const r = size ? Math.max(4, Math.sqrt(size / Math.PI)) : 4;
  return (
    <g className={clickable ? "cursor-pointer" : undefined}>
      <circle cx={cx} cy={cy} r={Math.max(12, r + 6)} fill="transparent" />
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill={fill}
        fillOpacity={size ? 0.7 : 1}
        stroke={surface()}
        strokeWidth={2}
      />
    </g>
  );
}

type Group = { key: string; label: string; tone: ChartTone; rows: ChartDatum[] };

/** A point per datum on two value axes, in groups of a tone; a bubble when `z` sizes them. */
export function ChartScatter({
  data,
  x,
  y,
  z,
  name: nameKey,
  groupBy,
  groups,
  tone = "brand",
  reference,
  xLabel,
  yLabel,
  size,
  height,
  format: formatProp,
  formatX: formatXProp,
  label,
  onSelect,
  className,
}: ChartScatterProps) {
  const { name, hidden, highlighted, format, formatX } = useFrame(label, formatProp, formatXProp);
  const sets = useMemo<Group[]>(() => {
    if (groupBy && groups?.length)
      return groups.map((g, i) => ({
        key: g.key,
        label: g.label ?? g.key,
        tone: g.tone ?? categoricalTone(i),
        rows: data.filter((d) => String(d[groupBy]) === g.key),
      }));
    return [{ key: "all", label: "Points", tone, rows: data }];
  }, [data, groupBy, groups, tone]);
  const axes: ChartSeries[] = [
    { key: x, label: xLabel ?? x },
    { key: y, label: yLabel ?? y },
    ...(z ? [{ key: z, label: z }] : []),
  ];
  const axisTitle = (value: string, vertical: boolean) => ({
    value,
    ...(vertical ? { angle: -90, position: "insideLeft" as const } : { position: "insideBottom" as const, offset: -2 }),
    className: "font-body-xsmall",
    fill: token("color.text.subtle"),
  });
  return (
    <Plot name={name} size={size} height={height} className={className}>
      <ScatterChart
        margin={{ top: 12, right: 16, bottom: xLabel ? 16 : 0, left: yLabel ? 8 : 0 }}
        accessibilityLayer={Boolean(name)}
      >
        <CartesianGrid {...grid} />
        <XAxis
          type="number"
          dataKey={x}
          name={xLabel ?? x}
          tick={<Tick format={(v) => formatX(v)} />}
          axisLine={axisLine}
          tickLine={false}
          height={xLabel ? 36 : 24}
          {...(xLabel ? { label: axisTitle(xLabel, false) } : {})}
        />
        <YAxis
          type="number"
          dataKey={y}
          name={yLabel ?? y}
          tick={<Tick vertical format={(v) => format(Number(v))} />}
          axisLine={false}
          tickLine={false}
          width={yLabel ? 52 : 40}
          {...(yLabel ? { label: axisTitle(yLabel, true) } : {})}
        />
        {z ? <ZAxis type="number" dataKey={z} range={[64, 900]} /> : null}
        <Tooltip
          cursor={false}
          isAnimationActive={false}
          content={
            <ScatterTooltip
              axes={axes}
              nameKey={nameKey}
              format={format}
              formatX={formatX}
              groupKey={groupBy}
              groupLabel={(v) => sets.find((s) => s.key === v)?.label}
            />
          }
        />
        {sets.map((s) => (
          <Scatter
            key={s.key}
            name={s.label}
            data={s.rows}
            fill={chartColor(s.tone)}
            shape={<Point clickable={Boolean(onSelect)} />}
            hide={hidden.has(s.key)}
            {...seriesClass(s.key, highlighted, false)}
            isAnimationActive={false}
            {...(onSelect
              ? { onClick: (item: unknown) => onSelect((item as Clicked).payload) }
              : {})}
          />
        ))}
        <References reference={reference} />
      </ScatterChart>
    </Plot>
  );
}

/** A point's tooltip: its name and group, then each axis as value and name. */
function ScatterTooltip({
  active,
  payload,
  axes,
  nameKey,
  format,
  formatX,
  groupKey,
  groupLabel,
}: {
  active?: boolean | undefined;
  payload?: { payload?: ChartDatum; color?: string }[] | undefined;
  axes: ChartSeries[];
  nameKey?: string | undefined;
  format: Formatter;
  formatX: CategoryFormatter;
  groupKey?: string | undefined;
  groupLabel: (v: string) => string | undefined;
}) {
  const first = payload?.[0];
  const datum = first?.payload;
  if (!active || !datum) return null;
  const title = nameKey ? datum[nameKey] : undefined;
  const group = groupKey ? groupLabel(String(datum[groupKey])) : undefined;
  return (
    <div className="min-w-0 rounded-medium border border-default bg-surface-overlay px-150 py-100 shadow-overlay">
      {title !== undefined || group ? (
        <div className="flex items-center gap-100 pb-050 font-body-small">
          <Swatch color={first?.color ?? ""} shape="dot" />
          {title !== undefined ? (
            <span className="font-medium text-default">{String(title)}</span>
          ) : null}
          {group ? <span className="text-subtle">{group}</span> : null}
        </div>
      ) : null}
      {axes.map((s, i) => {
        const v = datum[s.key];
        if (v === undefined || v === null) return null;
        return (
          <div key={s.key} className="flex items-center gap-100 font-body-small">
            <span className="tabular-nums font-medium text-default">
              {i === 0 && typeof v === "string" ? formatX(v) : formatValue(v, format)}
            </span>
            <span className="min-w-0 truncate text-subtle">{s.label ?? s.key}</span>
          </div>
        );
      })}
    </div>
  );
}

/* ---------- treemap ---------- */

export type TreemapNodeInput = {
  name: string;
  /** A leaf's size. A node with children is the sum of theirs. */
  value?: number | undefined;
  /** A top-level node's tone; its children inherit it. The categorical set, in order, when unsaid. */
  tone?: ChartTone | undefined;
  children?: TreemapNodeInput[] | undefined;
};

export type ChartTreemapProps = {
  data: TreemapNodeInput[];
  size?: ChartSize | undefined;
  height?: number | undefined;
  format?: Formatter | undefined;
  label?: string | undefined;
  /** Makes the tiles clickable: the tile's name and value. */
  onSelect?: ((node: { name: string; value: number }) => void) | undefined;
  className?: string | undefined;
};

type ToneNode = {
  name: string;
  value?: number | undefined;
  tone: ChartTone;
  group: string;
  children?: ToneNode[] | undefined;
};

const withTones = (nodes: TreemapNodeInput[], inherited?: ChartTone, group?: string): ToneNode[] =>
  nodes.map((n, i) => {
    const tone = n.tone ?? inherited ?? categoricalTone(i);
    const g = group ?? n.name;
    return {
      name: n.name,
      value: n.value,
      tone,
      group: g,
      ...(n.children ? { children: withTones(n.children, tone, g) } : {}),
    };
  });

type TileProps = {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  name?: string;
  value?: number;
  tone?: ChartTone;
  group?: string;
  depth?: number;
  children?: unknown;
};

/** A tile: the fill in its tone with a 2px surface gap, and the name on a surface chip when it fits. */
function Tile({
  x,
  y,
  width,
  height,
  name,
  value,
  tone,
  group,
  depth,
  children,
  format,
  clickable,
  highlighted,
}: TileProps & { format: Formatter; clickable: boolean; highlighted: string | null }) {
  if (x === undefined || y === undefined || !width || !height || depth === 0) return null;
  const leaf = !children || (Array.isArray(children) && children.length === 0);
  if (!leaf) return null;
  const fits = width >= 64 && height >= 28;
  const text = fits ? truncate(name ?? "", Math.floor((width - 16) / 6.5)) : "";
  const title = `${name ?? ""}: ${value !== undefined ? format(value) : ""}`;
  const dim = highlighted !== null && highlighted !== group && highlighted !== name;
  return (
    <g className={cn(clickable && "cursor-pointer", dim && "opacity-disabled") || undefined}>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={2}
        fill={chartColor(tone ?? "neutral")}
        stroke={surface()}
        strokeWidth={2}
      />
      {text ? (
        <g>
          <rect
            x={x + 6}
            y={y + 6}
            width={text.length * 6.5 + 8}
            height={18}
            rx={2}
            fill={surface()}
            fillOpacity={0.92}
          />
          <text x={x + 10} y={y + 19} className="font-body-xsmall" fill={token("color.text")}>
            {text}
            <title>{title}</title>
          </text>
        </g>
      ) : (
        <title>{title}</title>
      )}
    </g>
  );
}

/** Part-to-whole with a hierarchy: a tile per leaf, sized by value, in the tone of its top-level parent. */
export function ChartTreemap({
  data,
  size,
  height,
  format: formatProp,
  label,
  onSelect,
  className,
}: ChartTreemapProps) {
  const { name, hidden, highlighted, format } = useFrame(label, formatProp, undefined);
  const nodes = useMemo(() => withTones(data), [data]);
  const shown = useMemo(() => nodes.filter((n) => !hidden.has(n.name)), [nodes, hidden]);
  const series: ChartSeries[] = [{ key: "value", label: "Value" }];
  const content = (p: TileProps) => (
    <Tile {...p} format={format} clickable={Boolean(onSelect)} highlighted={highlighted} />
  );
  return (
    <Plot name={name} size={size} height={height} className={className}>
      <Treemap
        data={shown as never}
        dataKey="value"
        nameKey="name"
        aspectRatio={4 / 3}
        isAnimationActive={false}
        content={content as never}
        {...(onSelect
          ? {
              onClick: (node: { name: string; value: number }) =>
                onSelect({ name: node.name, value: node.value }),
            }
          : {})}
      >
        <Tooltip
          isAnimationActive={false}
          content={
            <TooltipContent
              series={series}
              swatch="square"
              format={format}
              formatX={plainCategory}
            />
          }
        />
      </Treemap>
    </Plot>
  );
}

/* ---------- heatmap ---------- */

/** One hue for how much, two for above and below, or a function that says which status tone a cell carries, from its value or its place. */
export type HeatmapScale =
  | "sequential"
  | "diverging"
  | ((value: number, row: string, column: string) => Tone);

export type ChartHeatmapProps = {
  /** The row names, top to bottom. */
  rows: string[];
  /** The column names, left to right. */
  columns: string[];
  /** The value at a row and column. `undefined` or `null` leaves the cell empty. */
  value: (row: string, column: string) => number | null | undefined;
  /** `sequential` paints how much in one hue; `diverging` paints above and below `midpoint` in two; a function says which status tone a cell carries, from its value or its row and column, and the cell prints its value. */
  scale?: HeatmapScale | undefined;
  /** The values at the ends of the scale. The data's own when unsaid. */
  domain?: readonly [number, number] | undefined;
  /** The value that reads as nothing on a diverging scale. Zero when unsaid. */
  midpoint?: number | undefined;
  /** Print the value in each cell. On for a status scale, where the tone's fill carries its text; off for a colour scale, where the tooltip and the table carry it. */
  showValues?: boolean | undefined;
  /** The cell's height: `small` 24px, `medium` 32px, `large` 40px. */
  size?: ChartSize | undefined;
  format?: Formatter | undefined;
  /** The grid's accessible name. It is a table. */
  label: string;
  /** What the rows and the columns are: the corner cell, and the description a screen reader hears. */
  rowLabel?: string | undefined;
  columnLabel?: string | undefined;
  /** Makes the cells clickable. */
  onSelect?: ((row: string, column: string, value: number) => void) | undefined;
  className?: string | undefined;
};

const cellHeights: Record<ChartSize, string> = { small: "h-300", medium: "h-400", large: "h-500" };

type Paint = { style?: { backgroundColor: string } | undefined; className?: string | undefined };

/** A grid of rows by columns with a value painted in each cell: one hue for how much, two for above and below, or the status tones. */
export function ChartHeatmap({
  rows,
  columns,
  value,
  scale = "sequential",
  domain,
  midpoint = 0,
  showValues,
  size = "medium",
  format = formatNumber,
  label,
  rowLabel,
  columnLabel,
  onSelect,
  className,
}: ChartHeatmapProps) {
  const values = useMemo(
    () => rows.map((r) => columns.map((c) => value(r, c))),
    [rows, columns, value],
  );
  const [min, max] = useMemo<readonly [number, number]>(() => {
    if (domain) return domain;
    const nums = values.flat().filter((v): v is number => typeof v === "number");
    if (!nums.length) return [0, 1];
    return [Math.min(...nums), Math.max(...nums)];
  }, [values, domain]);
  const status = typeof scale === "function";
  const printed = showValues ?? status;
  const paint = (v: number, r: string, c: string): Paint => {
    if (typeof scale === "function") return { className: toneClasses[scale(v, r, c)].subtle };
    if (scale === "diverging") {
      const half = Math.max(Math.abs(max - midpoint), Math.abs(min - midpoint)) || 1;
      const t = (v - midpoint) / half;
      const step =
        t <= -0.5
          ? "negative.bold"
          : t < -0.1
            ? "negative"
            : t <= 0.1
              ? "midpoint"
              : t < 0.5
                ? "positive"
                : "positive.bold";
      return { style: { backgroundColor: divergingColor(step) } };
    }
    const t = max === min ? 1 : (v - min) / (max - min);
    const step = (Math.min(4, Math.max(0, Math.floor(t * 5))) + 1) as 1 | 2 | 3 | 4 | 5;
    return { style: { backgroundColor: sequentialColor(step) } };
  };
  const head = "h-row-header px-050 pb-050 align-bottom font-body-xsmall font-medium text-subtlest";
  return (
    <div className={cn("overflow-x-auto", className)}>
      <table aria-label={label} className="border-collapse">
        <thead>
          <tr>
            {rowLabel ? (
              <th scope="col" className={cn(head, "text-start")}>
                {rowLabel}
                {columnLabel ? <span className="sr-only">{` by ${columnLabel}`}</span> : null}
              </th>
            ) : (
              <td className={head} />
            )}
            {columns.map((c) => (
              <th key={c} scope="col" className={cn(head, "text-center")}>
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, ri) => (
            <tr key={r}>
              <th
                scope="row"
                className="pe-100 text-start font-body-small font-regular whitespace-nowrap text-subtle"
              >
                {r}
              </th>
              {columns.map((c, ci) => {
                const v = values[ri]?.[ci];
                const has = typeof v === "number";
                const p: Paint = has ? paint(v, r, c) : {};
                const title = has ? `${r}, ${c}: ${format(v)}` : `${r}, ${c}: none`;
                const face = (
                  <span
                    className={cn(
                      "flex h-full w-full items-center justify-center rounded-xsmall font-body-small tabular-nums",
                      p.className,
                      !has && "bg-neutral-subtle",
                    )}
                    style={p.style}
                    title={title}
                  >
                    {has && printed ? (
                      format(v)
                    ) : has ? (
                      <span className="sr-only">{format(v)}</span>
                    ) : null}
                  </span>
                );
                return (
                  <td key={c} className={cn("min-w-500 pb-025 pe-025", cellHeights[size])}>
                    {onSelect && has ? (
                      <button
                        type="button"
                        className="block h-full w-full cursor-pointer rounded-xsmall outline-none focus-visible:outline-focused"
                        onClick={() => onSelect(r, c, v)}
                      >
                        {face}
                      </button>
                    ) : (
                      face
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export type ChartScaleProps = {
  /** Which ramp the key shows. */
  scale: "sequential" | "diverging";
  /** What the low end and the high end read as: "0" and "40 findings"; "−20%" and "+20%". */
  min: string;
  max: string;
  /** The midpoint's word on a diverging scale: "On plan". */
  mid?: string | undefined;
  className?: string | undefined;
};

/** The key for a colour scale: the five steps in a row, the ends named. */
export function ChartScale({ scale, min, max, mid, className }: ChartScaleProps) {
  const steps =
    scale === "diverging"
      ? [
          divergingColor("negative.bold"),
          divergingColor("negative"),
          divergingColor("midpoint"),
          divergingColor("positive"),
          divergingColor("positive.bold"),
        ]
      : ([1, 2, 3, 4, 5] as const).map((s) => sequentialColor(s));
  return (
    <div className={cn("inline-flex flex-col gap-050 self-start", className)}>
      <div className="flex gap-025" aria-hidden>
        {steps.map((c, i) => (
          <span key={i} className="h-100 w-300 rounded-xsmall" style={{ backgroundColor: c }} />
        ))}
      </div>
      <div className="flex justify-between gap-100 font-body-xsmall text-subtlest">
        <span>{min}</span>
        {mid ? <span>{mid}</span> : null}
        <span>{max}</span>
      </div>
    </div>
  );
}

/* ---------- legend ---------- */

export type ChartLegendProps = {
  series: ChartSeries[];
  /** A square for bars and areas, a stroke for lines, a dot for points. */
  swatch?: "square" | "line" | "dot" | undefined;
  className?: string | undefined;
};

/** Swatch and label per series. Inside a Frame the items are buttons: hover dims the other series, click isolates one. */
export function ChartLegend({ series, swatch = "square", className }: ChartLegendProps) {
  const frame = useContext(FrameContext);
  const items = series.map((s, i) => ({
    key: s.key,
    label: s.label ?? s.key,
    color: chartColor(s.tone ?? categoricalTone(i)),
  }));
  if (!frame)
    return (
      <ul className={cn("flex flex-wrap items-center gap-x-200 gap-y-050", className)}>
        {items.map((it) => (
          <li key={it.key} className="flex items-center gap-075 font-body-small text-subtle">
            <Swatch color={it.color} shape={swatch} />
            {it.label}
          </li>
        ))}
      </ul>
    );
  return (
    <ul className={cn("flex flex-wrap items-center gap-x-100 gap-y-050", className)}>
      {items.map((it) => {
        const off = frame.hidden.has(it.key);
        return (
          <li key={it.key}>
            <button
              type="button"
              aria-pressed={!off}
              className={cn(
                "flex h-control-xsmall items-center gap-075 rounded-small px-050 font-body-small text-subtle outline-none transition-colors duration-fast ease-standard",
                "hover:bg-neutral-subtle-hovered hover:text-default focus-visible:outline-focused",
                off && "text-subtlest",
              )}
              onMouseEnter={() => frame.highlight(it.key)}
              onMouseLeave={() => frame.highlight(null)}
              onFocus={() => frame.highlight(it.key)}
              onBlur={() => frame.highlight(null)}
              onClick={() => frame.toggle(it.key)}
            >
              <Swatch color={it.color} shape={swatch} hollow={off} />
              {it.label}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

/* ---------- frame ---------- */

export type ChartFrameProps = {
  /** What the chart shows, as a noun phrase: "Coverage by control family". It names the plot to a screen reader. */
  title: string;
  /** One line under the title: the period, the unit, the source. */
  description?: ReactNode | undefined;
  /** The series, for the legend and the table. */
  series?: ChartSeries[] | undefined;
  /** Where the legend sits. `top` when there are two or more series, `none` for one: the title names it. */
  legend?: "top" | "bottom" | "none" | undefined;
  /** The legend's swatch: a square for bars and areas, a stroke for lines, a dot for points. */
  swatch?: "square" | "line" | "dot" | undefined;
  /** Controls at the end of the header: a range, a filter, an export. */
  actions?: ReactNode | undefined;
  /** `loading` holds the plot's space with a Skeleton; `empty` and `error` say so in it. */
  status?: "ready" | "loading" | "empty" | "error" | undefined;
  /** What an empty or failed plot says. "Nothing to show yet" and "The chart could not load" when unsaid. */
  statusTitle?: string | undefined;
  statusText?: string | undefined;
  /** The records and the category key, so the Frame can lay the same numbers out as a Table, one toggle away. */
  data?: ChartDatum[] | undefined;
  x?: string | undefined;
  /** What the table calls the category column: "Month", "Family". The key when unsaid. */
  xLabel?: string | undefined;
  /** The number format the plot, the tooltip and the table share. */
  format?: Formatter | undefined;
  formatX?: CategoryFormatter | undefined;
  /** The plot's height, for the states that stand in for it. */
  size?: ChartSize | undefined;
  height?: number | undefined;
  /** The plot. */
  children: ReactNode;
  className?: string | undefined;
};

/** The figure around a plot: title, description, legend, actions, the states, and the same numbers as a Table one toggle away. The legend inside it highlights and isolates series. */
export function ChartFrame({
  title,
  description,
  series,
  legend,
  swatch = "square",
  actions,
  status = "ready",
  statusTitle,
  statusText,
  data,
  x,
  xLabel,
  format = formatNumber,
  formatX,
  size = "medium",
  height,
  children,
  className,
}: ChartFrameProps) {
  const id = useId();
  const [hidden, setHidden] = useState<ReadonlySet<string>>(none);
  const [highlighted, setHighlighted] = useState<string | null>(null);
  const [showTable, setShowTable] = useState(false);
  const toggle = useCallback(
    (key: string) =>
      setHidden((prev) => {
        const next = new Set(prev);
        if (next.has(key)) next.delete(key);
        else next.add(key);
        // Hiding the last visible series would leave nothing; that click shows everything again.
        if (series && next.size >= series.length) next.clear();
        return next;
      }),
    [series],
  );
  const state = useMemo<FrameState>(
    () => ({
      name: title,
      hidden,
      highlighted,
      highlight: setHighlighted,
      toggle,
      format,
      formatX,
    }),
    [title, hidden, highlighted, toggle, format, formatX],
  );
  const legendAt = legend ?? (series && series.length > 1 ? "top" : "none");
  const twin = Boolean(data && x && series?.length);
  const plotHeight = height ?? heights[size];
  const fx = formatX ?? plainCategory;
  return (
    <FrameContext.Provider value={state}>
      <figure aria-labelledby={id} className={cn("flex min-w-0 flex-col gap-150", className)}>
        <div className="flex items-start justify-between gap-200">
          <figcaption className="flex min-w-0 flex-col gap-025">
            <span id={id} className="font-body font-medium text-default">
              {title}
            </span>
            {description ? (
              <span className="font-body-small text-subtle">{description}</span>
            ) : null}
          </figcaption>
          {legendAt === "top" || actions || twin ? (
            <div className="flex shrink-0 flex-wrap items-center justify-end gap-150">
              {legendAt === "top" && series ? <ChartLegend series={series} swatch={swatch} /> : null}
              {actions}
              {twin ? (
                <Toggle
                  size="small"
                  pressed={showTable}
                  onPressedChange={setShowTable}
                  aria-label={showTable ? "Show as chart" : "Show as table"}
                >
                  <Table2 className="size-icon-small" />
                  Table
                </Toggle>
              ) : null}
            </div>
          ) : null}
        </div>
        {status === "loading" ? (
          <Skeleton className="rounded-large" style={{ height: plotHeight }} />
        ) : status === "empty" || status === "error" ? (
          <div
            role="status"
            className="flex flex-col items-start justify-center gap-025 rounded-large border border-dashed border-default px-200"
            style={{ height: plotHeight }}
          >
            <span
              className={cn(
                "font-body font-medium",
                status === "error" ? "text-danger" : "text-default",
              )}
            >
              {statusTitle ??
                (status === "error" ? "The chart could not load" : "Nothing to show yet")}
            </span>
            {statusText ? <span className="font-body-small text-subtle">{statusText}</span> : null}
          </div>
        ) : showTable ? null : (
          children
        )}
        {status === "ready" && legendAt === "bottom" && series ? (
          <ChartLegend series={series} swatch={swatch} />
        ) : null}
        {twin && showTable && status === "ready" && data && x && series ? (
          <div>
            <Table label={`${title}, as a table`}>
              <thead>
                <tr>
                  <Table.Header>{xLabel ?? x}</Table.Header>
                  {series.map((s) => (
                    <Table.Header key={s.key} className="text-end">
                      {s.label ?? s.key}
                    </Table.Header>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((d, i) => (
                  <Table.Row key={i} isStatic>
                    <Table.Cell>{fx((d[x] as string | number | undefined) ?? "")}</Table.Cell>
                    {series.map((s) => (
                      <Table.Cell key={s.key} className="text-end tabular-nums">
                        {formatValue(d[s.key], format)}
                      </Table.Cell>
                    ))}
                  </Table.Row>
                ))}
              </tbody>
            </Table>
          </div>
        ) : null}
      </figure>
    </FrameContext.Provider>
  );
}

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
