import { useId, useMemo, useRef, type ReactNode } from "react";
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
  TextureDefs,
  Tick,
  TooltipContent,
  ZeroLine,
  axisLine,
  axisTitle,
  axisWidth,
  categoricalTone,
  chartColor,
  cursorFill,
  formatValue,
  grid,
  hasNegative,
  hasRefLabels,
  hoveredColor,
  isRange,
  marginFor,
  marker,
  markClass,
  pointAnchor,
  rectAnchor,
  seriesClass,
  surface,
  syncProp,
  textureFill,
  textureOf,
  tickValue,
  truncate,
  useFrame,
  useMotion,
  usePicked,
  useTooltipMotion,
  valueDomain,
  type Active,
  type CategoryFormatter,
  type ChartDatum,
  type ChartDomain,
  type ChartReference,
  type ChartSelection,
  type ChartSeries,
  type ChartSize,
  type Formatter,
  type Texture,
} from "./_shared";

export type ChartBarProps = {
  /** Plain records, in the order they are drawn. */
  data: ChartDatum[];
  /** The key that names each datum along the category axis. */
  x: string;
  /** One entry per value key. A series' own `format` wins over the plot's. */
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
  /** The value axis' ends, to share a scale across charts. `[0, "auto"]` when unsaid; a value below zero extends the axis below it and draws the zero line. */
  domain?: ChartDomain | undefined;
  /** Titles for the axes, when the keys and the Frame's title do not say enough: the unit on the value axis. */
  xLabel?: string | undefined;
  yLabel?: string | undefined;
  /** Every series wears a pattern as well as its colour, so a stack reads in print and under colour-vision loss. The Frame's `texture` sets it for the legend too. */
  texture?: boolean | undefined;
  /** Charts with the same id share their hover. The Frame's `syncId` sets it. */
  syncId?: string | undefined;
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

/** The value at a bar's end, in `color.text.subtle`, outside the bar; under a bar that goes below zero. */
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
  const negative = typeof value === "number" ? value < 0 : value[1] < 0;
  const text = formatValue(value, format);
  // Recharts hands a bar below zero a negative height (or width); the label sits past the data end either way.
  const top = Math.min(ny, ny + h);
  const bottom = Math.max(ny, ny + h);
  const left = Math.min(nx, nx + w);
  const right = Math.max(nx, nx + w);
  return horizontal ? (
    <text
      x={negative ? left - 4 : right + 4}
      y={(top + bottom) / 2}
      dy={4}
      textAnchor={negative ? "end" : "start"}
      className="font-body-xsmall tabular-nums"
      fill={token("color.text.subtle")}
    >
      {text}
    </text>
  ) : (
    <text
      x={(left + right) / 2}
      y={negative ? bottom + 12 : top - 4}
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

type Radius = [number, number, number, number];

/** The rounded end is the data end: the top of a positive bar, the bottom of a negative one, the far end of a horizontal one. */
const radiusFor = (value: unknown, stacked: boolean, horizontal: boolean): Radius => {
  if (stacked) return [0, 0, 0, 0];
  const negative = typeof value === "number" ? value < 0 : isRange(value) ? value[1] < value[0] : false;
  if (horizontal) return negative ? [2, 0, 0, 2] : [0, 2, 2, 0];
  return negative ? [0, 0, 2, 2] : [2, 2, 0, 0];
};

/**
 * Bars per category; several series sit side by side, or stack. A value that is a `[from, to]`
 * pair floats, and a value below zero hangs from the zero line. A click on a bar, or Enter on the
 * focused category, chooses it: `onSelect` hears, and `details` opens a card on it.
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
  domain,
  xLabel,
  yLabel,
  texture: textureProp,
  syncId,
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
  const { name, hidden, highlighted, format, formatX, loading, sync, texture } = useFrame(
    label,
    formatProp,
    formatXProp,
    loadingProp,
    syncId,
    textureProp,
  );
  const id = useId();
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
  const negative = useMemo(() => hasNegative(data, series.map((s) => s.key)), [data, series]);
  const valueWidth = useMemo(
    () => axisWidth(data, series.map((s) => s.key), format, domain, Boolean(yLabel)),
    [data, series, format, domain, yLabel],
  );
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
  const colorOf = (s: ChartSeries, i: number) => chartColor(s.tone ?? categoricalTone(i));
  const hoveredOf = (s: ChartSeries, i: number) => hoveredColor(s.tone ?? categoricalTone(i));
  const textures: Record<string, Texture> = {};
  if (texture) series.forEach((s, i) => (textures[s.key] = textureOf(i)));
  const fillOf = (s: ChartSeries, i: number) =>
    texture ? textureFill(id, s.key, textureOf(i), colorOf(s, i)) : colorOf(s, i);
  const fmtOf = (s: ChartSeries) => s.format ?? format;
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
                  color={colorOf(picked.item.series, series.indexOf(picked.item.series))}
                  shape="square"
                  texture={textures[picked.item.series.key]}
                />
              ),
              title: picked.item.series.label ?? picked.item.series.key,
              subtitle: formatX((picked.item.datum[x] as string | number | undefined) ?? ""),
              value: formatValue(picked.item.datum[picked.item.series.key], fmtOf(picked.item.series)),
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
                      texture={textures[s.key]}
                    />
                  ),
                  label: s.label ?? s.key,
                  value: formatValue(picked.item.datum[s.key], fmtOf(s)),
                })),
            })}
      />
      {details?.(picked.item)}
    </>
  ) : null;
  const dimmed = (i: number) => (picked ? picked.item.index === i : null);
  // A bar below zero with an end label needs room under it, so the axis reaches a little further down.
  const yDomain: ReturnType<typeof valueDomain> =
    negative && labels === "end" && !domain
      ? [(min: number) => Math.min(0, Math.floor(min * 1.4)), (max: number) => Math.max(0, max)]
      : valueDomain(domain, "zero", negative);
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
          bottom: xLabel || (negative && labels === "end" && !horizontal) ? 12 : 0,
          left: yLabel || (negative && labels === "end" && horizontal) ? 8 : 0,
          ...(negative && labels === "end" && horizontal ? { left: 40 } : {}),
        }}
        barGap={2}
        barCategoryGap={stacked ? "35%" : "25%"}
        accessibilityLayer={Boolean(name)}
        {...syncProp(sync)}
      >
        {texture ? (
          <TextureDefs
            id={id}
            entries={series.map((s, i) => ({ key: s.key, color: colorOf(s, i), texture: textureOf(i) }))}
          />
        ) : null}
        <CartesianGrid {...grid} vertical={Boolean(horizontal)} horizontal={!horizontal} />
        {horizontal ? (
          <>
            <XAxis
              type="number"
              domain={yDomain}
              tick={<Tick format={(v) => format(tickValue(v))} />}
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
              domain={yDomain}
              tick={<Tick vertical format={(v) => format(tickValue(v))} />}
              axisLine={false}
              tickLine={false}
              width={valueWidth}
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
              textures={textures}
            />
          }
        />
        {negative ? <ZeroLine horizontal={horizontal} /> : null}
        {series.map((s, i) => (
          <Bar
            key={s.key}
            dataKey={s.key}
            name={s.label ?? s.key}
            fill={fillOf(s, i)}
            stroke={stacked ? surface() : "none"}
            strokeWidth={stacked ? 2 : 0}
            maxBarSize={24}
            hide={hidden.has(s.key)}
            {...seriesClass(s.key, highlighted, chooses)}
            activeBar={{ fill: texture ? fillOf(s, i) : hoveredOf(s, i), fillOpacity: texture ? 0.85 : 1 }}
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
            {data.map((d, j) => (
              <Cell
                key={j}
                radius={radiusFor(d[s.key], Boolean(stacked), Boolean(horizontal)) as never}
                {...markClass(dimmed(j))}
              />
            ))}
            {labels === "end" && !stacked ? (
              <LabelList
                dataKey={s.key}
                content={<EndLabel horizontal={horizontal} format={fmtOf(s)} />}
              />
            ) : null}
          </Bar>
        ))}
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
