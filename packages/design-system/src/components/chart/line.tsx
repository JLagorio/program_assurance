import { useId, useRef, type ReactNode } from "react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  Tooltip,
  XAxis,
  YAxis,
  usePlotArea,
  useXAxisScale,
  useYAxisScale,
} from "recharts";

import { token } from "../../generated/tokens";
import { cn } from "../../lib/cn";
import {
  ActiveProbe,
  Bands,
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
  cursorLine,
  deltaText,
  formatValue,
  grid,
  hasNegative,
  hasRefLabels,
  marginFor,
  marker,
  pointAnchor,
  seriesClass,
  surface,
  syncProp,
  textureFill,
  textureOf,
  tickValue,
  useFrame,
  useMotion,
  usePicked,
  useTimeAxis,
  useTooltipMotion,
  valueDomain,
  type Active,
  type Anchor,
  type CategoryFormatter,
  type ChartBand,
  type ChartDatum,
  type ChartDomain,
  type ChartReference,
  type ChartSelection,
  type ChartSeries,
  type ChartSize,
  type Formatter,
  type Texture,
} from "./_shared";

export type ChartLineProps = {
  /** Plain records, in the order they are drawn. */
  data: ChartDatum[];
  /** The key that names each datum along the category axis: a label, or a Date on a time axis. */
  x: string;
  /** One entry per value key. A series' own `format` wins over the plot's. */
  series: ChartSeries[];
  /** `category` spaces the points evenly and prints their labels; `time` reads `x` as dates, spaces the points by time, and picks the ticks by the span: hours, days, months or years. */
  scale?: "category" | "time" | undefined;
  /** `linear` joins the points; `smooth` eases between them without overshooting. */
  curve?: "linear" | "smooth" | undefined;
  /** A marker on every point, for a series with few points. Hover shows one either way. */
  dots?: boolean | undefined;
  /** `end` prints each series' last value after its line. */
  labels?: "none" | "end" | undefined;
  /** `zero` starts the value axis at zero; `auto` crops to the data, for a trend where the change matters more than the size. */
  baseline?: "zero" | "auto" | undefined;
  /** The value axis' ends, to share a scale across charts; wins over `baseline`. A value below zero extends the axis and draws the zero line. */
  domain?: ChartDomain | undefined;
  /** Bands across the plot: between two values (the acceptable range) or two categories or dates (an assessment window). */
  bands?: ChartBand[] | undefined;
  /** Join across a missing value. Off, a gap says the data was not there. */
  connectNulls?: boolean | undefined;
  /** Print each series' change from the point before in the tooltip and the card: "+3". */
  delta?: boolean | undefined;
  /** Titles for the axes, when the keys and the Frame's title do not say enough: the unit on the value axis. */
  xLabel?: string | undefined;
  yLabel?: string | undefined;
  /** Every series wears a pattern in its wash as well as its colour (an Area; a Line's stroke stays solid). The Frame's `texture` sets it. */
  texture?: boolean | undefined;
  /** Charts with the same id share their hover. The Frame's `syncId` sets it. */
  syncId?: string | undefined;
  /** The plot's height. `medium` (200px) when unsaid. */
  size?: ChartSize | undefined;
  /** A height in pixels when a layout must, in place of `size`. */
  height?: number | undefined;
  /** The number format for the value axis, the tooltip and the labels. The Frame's, else the kit's. */
  format?: Formatter | undefined;
  /** The format for a category. On a time axis the ticks choose their own; this formats the tooltip and the card. */
  formatX?: CategoryFormatter | undefined;
  /** Lines across the plot: a target, a limit, a milestone. */
  reference?: ChartReference[] | undefined;
  /** The plot's accessible name. Unneeded inside a Frame, which names it after its title; a plot with neither is hidden from a screen reader. */
  label?: string | undefined;
  /** Draws the plot's skeleton in place of the marks. The Frame sets it from `status="loading"`. */
  loading?: boolean | undefined;
  /** Called when a point is clicked (anywhere in its column), or Enter chooses the focused one. The selection carries no series: a point is every series at that category. */
  onSelect?: ((selection: ChartSelection) => void) | undefined;
  /** More about the chosen point, in a card anchored to it. The card's head (the category and every series' value) is the kit's. */
  details?: ((selection: ChartSelection) => ReactNode) | undefined;
  className?: string | undefined;
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
    labels.push({ key: s.key, y: py, text: (s.format ?? format)(value) });
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

/** The chosen point: a ring in the series colour on every series at that category. */
function ChosenMarks({
  data,
  x,
  index,
  series,
  hidden,
}: {
  data: ChartDatum[];
  x: string;
  index: number;
  series: ChartSeries[];
  hidden: ReadonlySet<string>;
}) {
  const xScale = useXAxisScale() as Scale | undefined;
  const yScale = useYAxisScale() as Scale | undefined;
  const datum = data[index];
  if (!xScale || !yScale || !datum) return null;
  const cx = (xScale(datum[x]) ?? 0) + (xScale.bandwidth?.() ?? 0) / 2;
  return (
    <g>
      {series.map((s, i) => {
        if (hidden.has(s.key) || typeof datum[s.key] !== "number") return null;
        const cy = yScale(datum[s.key]);
        if (cy === undefined) return null;
        const color = chartColor(s.tone ?? categoricalTone(i));
        return (
          <g key={s.key}>
            <circle cx={cx} cy={cy} r={8} fill={color} fillOpacity={0.2} />
            <circle cx={cx} cy={cy} r={4} fill={color} stroke={surface()} strokeWidth={2} />
          </g>
        );
      })}
    </g>
  );
}

type Shared = {
  data: ChartDatum[];
  rows: ChartDatum[];
  x: string;
  series: ChartSeries[];
  hidden: ReadonlySet<string>;
  format: Formatter;
  formatX: CategoryFormatter;
  delta: boolean;
  onSelect: ChartLineProps["onSelect"];
  details: ChartLineProps["details"];
  swatch: "line" | "square";
  textures: Record<string, Texture>;
};

/** What Line and Area share: the choice, the card, the keyboard. `rows` is what the plot draws (dates as milliseconds); `data` is the caller's. */
function useCartesian({ data, rows, x, series, hidden, format, formatX, delta, onSelect, details, swatch, textures }: Shared) {
  const { picked, pick, clear } = usePicked<ChartSelection>();
  const active = useRef<Active | null>(null);
  const chooses = Boolean(onSelect || details);
  const chooseAt = (label: string | number | undefined, anchor: Anchor) => {
    if (label === undefined) return;
    const index = rows.findIndex((d) => d[x] === label);
    const datum = data[index];
    if (!datum) return;
    const selection: ChartSelection = { datum, index };
    onSelect?.(selection);
    if (details) pick(selection, anchor);
  };
  // A click anywhere in the plot chooses the category under the tooltip, which the probe tracks for
  // the pointer as well as the keyboard.
  const onEnter = chooses
    ? () => {
        const a = active.current;
        if (a) chooseAt(a.label, pointAnchor(a.coordinate));
      }
    : undefined;
  const previous = picked ? data[picked.item.index - 1] : undefined;
  const card = picked ? (
    <>
      <CardHead
        title={formatX((picked.item.datum[x] as string | number | Date | undefined) ?? "")}
        rows={series
          .filter((s) => !hidden.has(s.key))
          .map((s, i) => ({
            swatch: <Swatch color={chartColor(s.tone ?? categoricalTone(i))} shape={swatch} texture={textures[s.key]} />,
            label: s.label ?? s.key,
            value: formatValue(picked.item.datum[s.key], s.format ?? format),
            note: delta && previous ? deltaText(picked.item.datum[s.key], previous[s.key], s.format ?? format) : null,
          }))}
      />
      {details?.(picked.item)}
    </>
  ) : null;
  const clickProps = onEnter ? { className: "cursor-pointer", onClick: onEnter } : {};
  return { picked, clear, chooses, onEnter, clickProps, card, active };
}

function Axes({
  x,
  time,
  domain,
  width,
  xLabel,
  yLabel,
  format,
  formatX,
}: {
  x: string;
  time: ReturnType<typeof useTimeAxis>;
  domain: ReturnType<typeof valueDomain>;
  width: number;
  xLabel: string | undefined;
  yLabel: string | undefined;
  format: Formatter;
  formatX: CategoryFormatter;
}) {
  return (
    <>
      <CartesianGrid {...grid} vertical={false} />
      {time ? (
        <XAxis
          type="number"
          dataKey={x}
          scale="time"
          domain={["dataMin", "dataMax"]}
          ticks={time.ticks}
          tick={<Tick format={(v) => time.tick(Number(v))} />}
          axisLine={axisLine}
          tickLine={false}
          height={xLabel ? 36 : 24}
          {...(xLabel ? { label: axisTitle(xLabel, false) } : {})}
        />
      ) : (
        <XAxis
          dataKey={x}
          tick={<Tick format={formatX} />}
          axisLine={axisLine}
          tickLine={false}
          height={xLabel ? 36 : 24}
          interval="equidistantPreserveStart"
          {...(xLabel ? { label: axisTitle(xLabel, false) } : {})}
        />
      )}
      <YAxis
        domain={domain}
        tick={<Tick vertical format={(v) => format(tickValue(v))} />}
        axisLine={false}
        tickLine={false}
        width={width}
        {...(yLabel ? { label: axisTitle(yLabel, true) } : {})}
      />
    </>
  );
}

/** The category format a time axis' tooltip uses: the full date, at the unit the span needs. */
const timeFormat = (time: ReturnType<typeof useTimeAxis>, formatX: CategoryFormatter): CategoryFormatter =>
  time ? (v) => time.full(typeof v === "number" ? v : new Date(v).getTime()) : formatX;

/** A line per series, 2px, with a ringed marker on hover. A click in a point's column, or Enter on the focused point, chooses it. */
export function ChartLine({
  data,
  x,
  series,
  scale = "category",
  curve = "linear",
  dots,
  labels = "none",
  baseline = "zero",
  domain,
  bands,
  connectNulls,
  delta = false,
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
}: ChartLineProps) {
  const { name, hidden, highlighted, format, formatX: fx, loading, sync } = useFrame(
    label,
    formatProp,
    formatXProp,
    loadingProp,
    syncId,
    textureProp,
  );
  const motion = useMotion();
  const tooltipMotion = useTooltipMotion();
  const time = useTimeAxis(data, x, scale === "time");
  const rows = time ? time.rows : data;
  const formatX = timeFormat(time, fx);
  const c = useCartesian({ data, rows, x, series, hidden, format, formatX, delta, onSelect, details, swatch: "line", textures: {} });
  if (loading)
    return <PlotSkeleton kind="line" name={name} size={size} height={height} className={className} />;
  const negative = hasNegative(data, series.map((s) => s.key));
  return (
    <Plot
      name={name}
      size={size}
      height={height}
      className={className}
      card={c.card}
      anchor={c.picked?.anchor}
      onClose={c.clear}
      onEnter={c.onEnter}
    >
      <ComposedChart
        data={rows}
        margin={{
          ...marginFor({ endLabels: labels === "end", refLabels: hasRefLabels(reference, bands) }),
          bottom: xLabel ? 12 : 0,
          left: yLabel ? 8 : 0,
        }}
        accessibilityLayer={Boolean(name)}
        {...syncProp(sync)}
        {...c.clickProps}
      >
        <Axes
          x={x}
          time={time}
          domain={valueDomain(domain, baseline, negative)}
          width={axisWidth(data, series.map((s) => s.key), format, domain, Boolean(yLabel))}
          xLabel={xLabel}
          yLabel={yLabel}
          format={format}
          formatX={formatX}
        />
        <Tooltip
          cursor={cursorLine}
          {...tooltipMotion}
          content={
            <TooltipContent series={series} swatch="line" format={format} formatX={formatX} data={rows} x={x} delta={delta} />
          }
        />
        <Bands bands={bands} time={Boolean(time)} />
        {negative && baseline === "zero" ? <ZeroLine /> : null}
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
              activeDot={marker(color)}
              connectNulls={Boolean(connectNulls)}
              hide={hidden.has(s.key)}
              {...seriesClass(s.key, highlighted, false)}
              {...motion}
            />
          );
        })}
        {labels === "end" ? (
          <EndLabels data={rows} x={x} series={series} hidden={hidden} highlighted={highlighted} format={format} />
        ) : null}
        {c.picked ? (
          <ChosenMarks data={rows} x={x} index={c.picked.item.index} series={series} hidden={hidden} />
        ) : null}
        <References reference={reference} time={Boolean(time)} />
        {c.chooses ? <ActiveProbe target={c.active} /> : null}
      </ComposedChart>
    </Plot>
  );
}

export type ChartAreaProps = ChartLineProps & {
  /** Stack the series: parts of a whole over time. */
  stacked?: boolean | undefined;
};

/** A line with a wash under it, one per series; stacked when asked. Chooses a point as a Line does. */
export function ChartArea({
  data,
  x,
  series,
  scale = "category",
  curve = "linear",
  dots,
  labels = "none",
  baseline = "zero",
  domain,
  bands,
  connectNulls,
  delta = false,
  stacked,
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
}: ChartAreaProps) {
  const { name, hidden, highlighted, format, formatX: fx, loading, sync, texture } = useFrame(
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
  const time = useTimeAxis(data, x, scale === "time");
  const rows = time ? time.rows : data;
  const formatX = timeFormat(time, fx);
  const textures: Record<string, Texture> = {};
  if (texture) series.forEach((s, i) => (textures[s.key] = textureOf(i)));
  const c = useCartesian({ data, rows, x, series, hidden, format, formatX, delta, onSelect, details, swatch: "square", textures });
  if (loading)
    return <PlotSkeleton kind="area" name={name} size={size} height={height} className={className} />;
  const negative = hasNegative(data, series.map((s) => s.key));
  const colorOf = (s: ChartSeries, i: number) => chartColor(s.tone ?? categoricalTone(i));
  return (
    <Plot
      name={name}
      size={size}
      height={height}
      className={className}
      card={c.card}
      anchor={c.picked?.anchor}
      onClose={c.clear}
      onEnter={c.onEnter}
    >
      <ComposedChart
        data={rows}
        margin={{
          ...marginFor({ endLabels: labels === "end", refLabels: hasRefLabels(reference, bands) }),
          bottom: xLabel ? 12 : 0,
          left: yLabel ? 8 : 0,
        }}
        accessibilityLayer={Boolean(name)}
        {...syncProp(sync)}
        {...c.clickProps}
      >
        {texture ? (
          <TextureDefs id={id} entries={series.map((s, i) => ({ key: s.key, color: colorOf(s, i), texture: textureOf(i) }))} />
        ) : null}
        <Axes
          x={x}
          time={time}
          domain={valueDomain(domain, baseline, negative)}
          width={axisWidth(data, series.map((s) => s.key), format, domain, Boolean(yLabel))}
          xLabel={xLabel}
          yLabel={yLabel}
          format={format}
          formatX={formatX}
        />
        <Tooltip
          cursor={cursorLine}
          {...tooltipMotion}
          content={
            <TooltipContent
              series={series}
              swatch="square"
              format={format}
              formatX={formatX}
              total={Boolean(stacked)}
              data={rows}
              x={x}
              delta={delta}
              textures={textures}
            />
          }
        />
        <Bands bands={bands} time={Boolean(time)} />
        {negative && baseline === "zero" ? <ZeroLine /> : null}
        {series.map((s, i) => {
          const color = colorOf(s, i);
          const t = textures[s.key];
          return (
            <Area
              key={s.key}
              dataKey={s.key}
              name={s.label ?? s.key}
              type={curve === "smooth" ? "monotone" : "linear"}
              stroke={color}
              fill={t && t !== "solid" ? textureFill(id, s.key, t, color) : color}
              fillOpacity={t && t !== "solid" ? 1 : 0.12}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              dot={dots ? marker(color) : false}
              activeDot={marker(color)}
              connectNulls={Boolean(connectNulls)}
              hide={hidden.has(s.key)}
              {...seriesClass(s.key, highlighted, false)}
              {...motion}
              {...(stacked ? { stackId: "stack" } : {})}
            />
          );
        })}
        {labels === "end" ? (
          <EndLabels data={rows} x={x} series={series} hidden={hidden} highlighted={highlighted} format={format} />
        ) : null}
        {c.picked && !stacked ? (
          <ChosenMarks data={rows} x={x} index={c.picked.item.index} series={series} hidden={hidden} />
        ) : null}
        <References reference={reference} time={Boolean(time)} />
        {c.chooses ? <ActiveProbe target={c.active} /> : null}
      </ComposedChart>
    </Plot>
  );
}
