import { useMemo, useRef, type ReactNode } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Line,
  Scatter,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { token } from "../../generated/tokens";
import {
  ActiveProbe,
  CardHead,
  Plot,
  PlotSkeleton,
  References,
  Swatch,
  Tick,
  TooltipContent,
  axisLine,
  axisTitle,
  categoricalTone,
  chartColor,
  cursorFill,
  formatValue,
  grid,
  hasRefLabels,
  isRange,
  marginFor,
  marker,
  markClass,
  pointAnchor,
  rectAnchor,
  seriesClass,
  surface,
  truncate,
  useFrame,
  useMotion,
  usePicked,
  useTooltipMotion,
  type Active,
  type CategoryFormatter,
  type ChartDatum,
  type ChartReference,
  type ChartSelection,
  type ChartSeries,
  type ChartSize,
  type Formatter,
} from "./_shared";

export type ChartBarProps = {
  /** Plain records, in the order they are drawn. */
  data: ChartDatum[];
  /** The key that names each datum along the category axis. */
  x: string;
  /** One entry per value key. */
  series: ChartSeries[];
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
  /** Titles for the axes, when the keys and the Frame's title do not say enough: the unit on the value axis. */
  xLabel?: string | undefined;
  yLabel?: string | undefined;
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
  /** Draws the plot's skeleton in place of the marks. The Frame sets it from `status="loading"`. */
  loading?: boolean | undefined;
  /** Called when a bar is clicked, or Enter chooses the focused category: to drill down, or to filter what is under the chart. */
  onSelect?: ((selection: ChartSelection) => void) | undefined;
  /** More about what was chosen, in a card anchored to it: facts, a link to the record. The card's head (the category, the series, the value) is the kit's. */
  details?: ((selection: ChartSelection) => ReactNode) | undefined;
  className?: string | undefined;
};

type Clicked = { payload: ChartDatum; x?: number; y?: number; width?: number; height?: number };

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

/**
 * Bars per category; several series sit side by side, or stack. A value that is a `[from, to]`
 * pair floats. A click on a bar, or Enter on the focused category, chooses it: `onSelect` hears,
 * and `details` opens a card on it.
 */
export function ChartBar({
  data,
  x,
  series,
  stacked,
  horizontal,
  labels = "none",
  target,
  line,
  xLabel,
  yLabel,
  size,
  height,
  format: formatProp,
  formatX: formatXProp,
  reference,
  label,
  loading: loadingProp,
  onSelect,
  details,
  className,
}: ChartBarProps) {
  const { name, hidden, highlighted, format, formatX, loading } = useFrame(
    label,
    formatProp,
    formatXProp,
    loadingProp,
  );
  const motion = useMotion();
  const tooltipMotion = useTooltipMotion();
  const { picked, pick, clear } = usePicked<ChartSelection>();
  const active = useRef<Active | null>(null);
  const categoryWidth = useMemo(() => {
    const longest = Math.max(
      0,
      ...data.map((d) => truncate(formatX((d[x] as string | number | undefined) ?? ""), 18).length),
    );
    return Math.min(160, Math.max(56, 8 + 6.5 * longest));
  }, [data, x, formatX]);
  if (loading)
    return (
      <PlotSkeleton
        kind={horizontal ? "bars" : "columns"}
        name={name}
        size={size}
        height={height}
        className={className}
      />
    );
  const all = line ? [...series, line] : series;
  const lineTone = line ? (line.tone ?? categoricalTone(series.length)) : "brand";
  const chooses = Boolean(onSelect || details);
  const choose = (selection: ChartSelection, anchor: Parameters<typeof pick>[1]) => {
    onSelect?.(selection);
    if (details) pick(selection, anchor);
  };
  const onEnter = chooses
    ? () => {
        const a = active.current;
        if (!a) return;
        const index = data.findIndex((d) => d[x] === a.label);
        const datum = data[index];
        if (!datum) return;
        choose({ datum, index }, pointAnchor(a.coordinate));
      }
    : undefined;
  const card = picked ? (
    <>
      <CardHead
        {...(picked.item.series
          ? {
              swatch: (
                <Swatch
                  color={chartColor(
                    picked.item.series.tone ?? categoricalTone(series.indexOf(picked.item.series)),
                  )}
                  shape="square"
                />
              ),
              title: picked.item.series.label ?? picked.item.series.key,
              subtitle: formatX((picked.item.datum[x] as string | number | undefined) ?? ""),
              value: formatValue(picked.item.datum[picked.item.series.key], format),
            }
          : {
              title: formatX((picked.item.datum[x] as string | number | undefined) ?? ""),
              rows: all
                .filter((s) => !hidden.has(s.key))
                .map((s, i) => ({
                  swatch: (
                    <Swatch
                      color={chartColor(s.tone ?? categoricalTone(i))}
                      shape={s === line ? "line" : "square"}
                    />
                  ),
                  label: s.label ?? s.key,
                  value: formatValue(picked.item.datum[s.key], format),
                })),
            })}
      />
      {details?.(picked.item)}
    </>
  ) : null;
  const dimmed = (i: number) => (picked ? picked.item.index === i : null);
  return (
    <Plot
      name={name}
      size={size}
      height={height}
      className={className}
      card={card}
      anchor={picked?.anchor}
      onClose={clear}
      onEnter={onEnter}
    >
      {/* BarChart, not ComposedChart: only it draws the tooltip's cursor as a band behind the slot. The same engine takes the line and the target marks. */}
      <BarChart
        data={data}
        layout={horizontal ? "vertical" : "horizontal"}
        margin={{
          ...marginFor({ endLabels: labels === "end", refLabels: hasRefLabels(reference), horizontal }),
          bottom: xLabel ? 12 : 0,
          left: yLabel ? 8 : 0,
        }}
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
              height={yLabel ? 36 : 24}
              {...(yLabel ? { label: axisTitle(yLabel, false) } : {})}
            />
            <YAxis
              type="category"
              dataKey={x}
              tick={<Tick vertical format={formatX} max={18} />}
              axisLine={false}
              tickLine={false}
              width={categoryWidth + (xLabel ? 12 : 0)}
              {...(xLabel ? { label: axisTitle(xLabel, true) } : {})}
            />
          </>
        ) : (
          <>
            <XAxis
              dataKey={x}
              tick={<Tick format={formatX} />}
              axisLine={axisLine}
              tickLine={false}
              height={xLabel ? 36 : 24}
              interval="equidistantPreserveStart"
              {...(xLabel ? { label: axisTitle(xLabel, false) } : {})}
            />
            <YAxis
              domain={[0, "auto"]}
              tick={<Tick vertical format={(v) => format(Number(v))} />}
              axisLine={false}
              tickLine={false}
              width={yLabel ? 52 : 40}
              {...(yLabel ? { label: axisTitle(yLabel, true) } : {})}
            />
          </>
        )}
        <Tooltip
          cursor={cursorFill}
          {...tooltipMotion}
          content={
            <TooltipContent
              series={all}
              swatch="square"
              format={format}
              formatX={formatX}
              targetKey={target}
              total={Boolean(stacked)}
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
              {...seriesClass(s.key, highlighted, chooses)}
              activeBar={{ fillOpacity: 0.8 }}
              {...motion}
              {...(stacked ? { stackId: "stack" } : {})}
              {...(chooses
                ? {
                    onClick: (item: unknown, index: number) => {
                      const c = item as Clicked;
                      choose({ datum: c.payload, series: s, index }, rectAnchor(c));
                    },
                  }
                : {})}
            >
              {data.map((_, j) => (
                <Cell key={j} {...markClass(dimmed(j))} />
              ))}
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
            {...motion}
          />
        ) : null}
        <References reference={reference} horizontal={horizontal} />
        {chooses ? <ActiveProbe target={active} /> : null}
      </BarChart>
    </Plot>
  );
}
