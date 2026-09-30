import { useId, useMemo, useRef, useState, type ComponentProps, type ReactNode } from "react";
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
  ReferenceLabels,
  References,
  Swatch,
  Tick,
  TooltipContent,
  ZeroLine,
  allIntegers,
  axisLine,
  axisTitle,
  axisWidth,
  cursorLine,
  deltaText,
  formatValue,
  grid,
  hasNegative,
  hasRefLabels,
  heights,
  labelWidth,
  marginFor,
  marker,
  niceScale,
  pinnedTicks,
  pointAnchor,
  seriesClass,
  seriesColor,
  stackExtent,
  surface,
  syncProp,
  textureFill,
  textureOf,
  tickCount,
  tickText,
  tickValue,
  useChartSurface,
  useDescribePoint,
  useFrame,
  useFrameData,
  useFrameReport,
  useMotion,
  usePicked,
  usePlotSize,
  useTimeAxis,
  useTooltipMotion,
  valueDomain,
  valueExtent,
  type Active,
  type Anchor,
  type Locate,
  type CategoryFormatter,
  type ChartBand,
  type ChartDatum,
  type ChartDomain,
  type ChartReference,
  type ChartSelection,
  type ChartSeries,
  type ChartSize,
  type Formatter,
  type FrameReport,
  type Texture,
} from "./_shared";

type ChartLineOwnProps = {
  /** Plain records, in the order they are drawn. Inside a Frame, the Frame's `data` when unsaid. */
  data?: ChartDatum[] | undefined;
  /** The key that names each datum along the category axis: a label, or a Date on a time axis. Inside a Frame, the Frame's `x` when unsaid. */
  x?: string | undefined;
  /** One entry per value key. A series' own `format` wins over the plot's. Inside a Frame, the Frame's `series` when unsaid. */
  series?: ChartSeries[] | undefined;
  /** `category` spaces the points evenly and prints their labels; `time` reads `x` as dates, spaces the points by time, and picks the ticks by the span: hours, days, months or years, in the reader's time zone (calendar days, "2026-09-04", read the same everywhere). */
  scale?: "category" | "time" | undefined;
  /** `linear` joins the points; `smooth` eases between them without overshooting. */
  curve?: "linear" | "smooth" | undefined;
  /** A marker on every point, for a series with few points. Hover shows one either way. */
  dots?: boolean | undefined;
  /** `end` prints each series' last value after its line. */
  labels?: "none" | "end" | undefined;
  /** `zero` starts the value axis at zero; `auto` crops to the data, for a trend where the change matters more than the size. */
  baseline?: "zero" | "auto" | undefined;
  /** The value axis' ends, to share a scale across charts; wins over `baseline`. A value below zero extends the axis and draws the zero line. With both ends pinned the ticks are round steps through zero. */
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
  /** The plot's height. The Frame's when unsaid, else `medium` (200px); `large` in the expanded Dialog. */
  size?: ChartSize | undefined;
  /** A height in pixels when a layout must, in place of `size`. */
  height?: number | undefined;
  /** The number format for the value axis, the tooltip, the labels and the Frame's table. The Frame's, else the kit's. */
  format?: Formatter | undefined;
  /** The format for a category. On a time axis the ticks choose their own; this formats the tooltip and the card. */
  formatX?: CategoryFormatter | undefined;
  /** Lines across the plot: a target, a limit, a milestone. */
  reference?: ChartReference[] | undefined;
  /** The plot's accessible name. Unneeded inside a Frame, which names it after its title; a plot with neither is hidden from a screen reader. */
  label?: string | undefined;
  /** Draws the plot's skeleton in place of the marks. The Frame sets it from `state="loading"`. */
  loading?: boolean | undefined;
  /** Called when a point is clicked (anywhere in its column), or Enter chooses the focused one. The selection carries no series: a point is every series at that category. With it, the plot is a tab stop whose arrow keys walk the points. */
  onSelect?: ((selection: ChartSelection) => void) | undefined;
  /** More about the chosen point, in a card anchored to it. The card's head (the category and every series' value) is the kit's. */
  details?: ((selection: ChartSelection) => ReactNode) | undefined;
  className?: string | undefined;
};

/** The part's own props, and the native props and ref of the plot's box: an `id`, `data-*` for a test, and `aria-describedby`, which describes the plot's svg. */
export type ChartLineProps = ChartLineOwnProps &
  Omit<ComponentProps<"div">, keyof ChartLineOwnProps | "children" | "role">;

type Scale = ((value: unknown) => number | undefined) & { bandwidth?: () => number };

/** The gap between a line's end and its label, and a displaced label's swatch. */
const END_GAP = 8;
const END_SWATCH = 10;

/** The widest end label the visible series print: for the right margin. */
const endLabelWidth = (
  data: ChartDatum[],
  series: ChartSeries[],
  hidden: ReadonlySet<string>,
  format: Formatter,
  stacked: boolean,
) => {
  const shown = series.filter((s) => !hidden.has(s.key));
  const widths = shown.map((s) => {
    for (let i = data.length - 1; i >= 0; i--) {
      const v = data[i]?.[s.key];
      if (typeof v === "number") return labelWidth((s.format ?? format)(v));
    }
    return 0;
  });
  // Two or more labels may be pushed off their line's end, and then carry a swatch.
  const swatch = shown.length > 1 && !stacked ? END_SWATCH : 0;
  return Math.max(0, ...widths) + swatch;
};

/**
 * The last value of every visible series, after its line, in `color.text.subtle`. Labels that would
 * collide are pushed apart by a line's height, so two series that end close still read; one pushed
 * off its line's end carries a stroke of the series' colour, so it still says whose it is. On a
 * stack each label sits on its band's top, at the running total, and prints the band's own value.
 */
function EndLabels({
  data,
  x,
  series,
  all,
  hidden,
  highlighted,
  format,
  stacked,
}: {
  data: ChartDatum[];
  x: string;
  series: ChartSeries[];
  /** Every series, for their colours. */
  all: ChartSeries[];
  hidden: ReadonlySet<string>;
  highlighted: string | null;
  format: Formatter;
  stacked?: boolean | undefined;
}) {
  const xScale = useXAxisScale() as Scale | undefined;
  const yScale = useYAxisScale() as Scale | undefined;
  const plot = usePlotArea();
  if (!xScale || !yScale || !plot) return null;
  const labels: { key: string; y: number; at: number; text: string; color: string }[] = [];
  const lastDatum = data[data.length - 1];
  let running = 0;
  for (const s of series) {
    if (hidden.has(s.key)) continue;
    let last: ChartDatum | undefined;
    if (stacked) last = lastDatum;
    else
      for (let i = data.length - 1; i >= 0; i--) {
        if (typeof data[i]?.[s.key] === "number") {
          last = data[i];
          break;
        }
      }
    const value = last?.[s.key];
    if (!last || typeof value !== "number") continue;
    // A stacked band ends at the running total, not at its own value.
    running += value;
    const px = xScale(last[x]);
    const py = yScale(stacked ? running : value);
    if (px === undefined || py === undefined) continue;
    labels.push({
      key: s.key,
      y: py,
      at: py,
      text: (s.format ?? format)(value),
      color: seriesColor(all, s),
    });
  }
  if (!labels.length) return null;
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
  const displaced = labels.some((l) => Math.abs(l.y - l.at) > 2);
  return (
    <g>
      {labels.map((l) => {
        const dim = highlighted !== null && highlighted !== l.key && "opacity-disabled";
        const cue = displaced && !stacked;
        return (
          <g key={l.key} className={cn(dim)}>
            {cue ? (
              <line
                x1={cx + END_GAP}
                x2={cx + END_GAP + 6}
                y1={l.y}
                y2={l.y}
                stroke={l.color}
                strokeWidth={2}
                strokeLinecap="round"
              />
            ) : null}
            <text
              x={cx + END_GAP + (cue ? END_SWATCH : 0)}
              y={l.y}
              dy={4}
              textAnchor="start"
              className="font-body-xsmall tabular-nums"
              fill={token("color.text.subtle")}
            >
              {l.text}
            </text>
          </g>
        );
      })}
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
      {series.map((s) => {
        if (hidden.has(s.key) || typeof datum[s.key] !== "number") return null;
        const cy = yScale(datum[s.key]);
        if (cy === undefined) return null;
        const color = seriesColor(series, s);
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
  name: string | undefined;
  titleId: string | undefined;
  describedBy: string | undefined;
  stacked?: boolean | undefined;
};

/** What Line and Area share: the choice, the card, the keyboard and its words. `rows` is what the plot draws (dates as milliseconds); `data` is the caller's. */
function useCartesian({
  data,
  rows,
  x,
  series,
  hidden,
  format,
  formatX,
  delta,
  onSelect,
  details,
  swatch,
  textures,
  name,
  titleId,
  describedBy,
  stacked,
}: Shared) {
  const { picked, pick, clear } = usePicked<ChartSelection>();
  const active = useRef<Active | null>(null);
  const locate = useRef<Locate | null>(null);
  const chooses = Boolean(onSelect || details);
  const totalKeys = useMemo(
    () => (stacked ? series.filter((s) => !hidden.has(s.key)).map((s) => s.key) : undefined),
    [stacked, series, hidden],
  );
  const describe = useDescribePoint({ data: rows, x, series, hidden, format, formatX, totalKeys });
  const a11y = useChartSurface({
    name,
    titleId,
    chooses,
    describedBy,
    count: rows.length,
    describe,
  });
  const chooseIndex = (index: number, anchor: Anchor) => {
    const datum = data[index];
    if (!datum) return;
    const selection: ChartSelection = { datum, index };
    onSelect?.(selection);
    if (details) pick(selection, anchor);
  };
  // A click anywhere in the plot chooses the category under the tooltip, which the probe tracks.
  const onClick = chooses
    ? () => {
        const a = active.current;
        if (a)
          chooseIndex(
            rows.findIndex((d) => d[x] === a.label),
            pointAnchor(a.coordinate),
          );
      }
    : undefined;
  // Enter chooses the point the keyboard is on, the one its live region said: at the tooltip when
  // the tooltip is on it, else at the point's place (a pointer may rest on another).
  const onEnter = chooses
    ? (index: number | undefined) => {
        const row = index === undefined ? undefined : rows[index];
        if (!row || index === undefined) return;
        const a = active.current;
        const at = a && a.label === row[x] ? a.coordinate : locate.current?.(row[x]);
        chooseIndex(index, pointAnchor(at));
      }
    : undefined;
  const previous = picked ? data[picked.item.index - 1] : undefined;
  const card = picked ? (
    <>
      <CardHead
        title={formatX((picked.item.datum[x] as string | number | Date | undefined) ?? "")}
        rows={series
          .filter((s) => !hidden.has(s.key))
          .map((s) => ({
            // The colour of the series' place among all of them, hidden ones included, as in the plot.
            swatch: (
              <Swatch color={seriesColor(series, s)} shape={swatch} texture={textures[s.key]} />
            ),
            label: s.label ?? s.key,
            value: formatValue(picked.item.datum[s.key], s.format ?? format, formatX),
            note:
              delta && previous
                ? deltaText(picked.item.datum[s.key], previous[s.key], s.format ?? format)
                : null,
          }))}
      />
      {details?.(picked.item)}
    </>
  ) : null;
  const clickProps = onClick ? { className: "cursor-pointer", onClick } : {};
  return { picked, clear, chooses, onEnter, clickProps, card, active, locate, a11y, totalKeys };
}

function Axes({
  x,
  time,
  domain,
  ticks,
  width,
  xLabel,
  yLabel,
  format,
  formatX,
  allCategories,
  includeHidden = true,
}: {
  x: string;
  time: ReturnType<typeof useTimeAxis>;
  domain: ReturnType<typeof valueDomain>;
  ticks: number[] | undefined;
  width: number;
  xLabel: string | undefined;
  yLabel: string | undefined;
  format: Formatter;
  formatX: CategoryFormatter;
  /** Every category's label fits its slot, so none is thinned out. */
  allCategories: boolean;
  /** A hidden series keeps its place on the scale. Off for a stack, whose scale the part sets. */
  includeHidden?: boolean | undefined;
}) {
  const valueTick = (v: unknown) => format(tickValue(v));
  const categoryTick = (v: unknown) => tickText(v, formatX, 14);
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
          // Recharts thins the ticks by the text they print; the first and the last always stay.
          interval="preserveStartEnd"
          tickFormatter={(v: number) => time.tick(Number(v))}
          tick={<Tick format={(v) => time.tick(Number(v))} />}
          axisLine={axisLine}
          tickLine={false}
          height={xLabel ? 36 : 24}
          {...(xLabel ? { label: axisTitle(xLabel, false) } : {})}
        />
      ) : (
        <XAxis
          dataKey={x}
          tickFormatter={categoryTick}
          tick={<Tick format={formatX} />}
          axisLine={axisLine}
          tickLine={false}
          height={xLabel ? 36 : 24}
          interval={allCategories ? 0 : "equidistantPreserveStart"}
          {...(xLabel ? { label: axisTitle(xLabel, false) } : {})}
        />
      )}
      <YAxis
        domain={domain}
        // The kit's own ticks all print: they are few enough, and zero is one of them.
        {...(ticks ? { ticks, interval: 0 } : {})}
        tickFormatter={valueTick}
        tick={<Tick vertical format={(v) => valueTick(v)} />}
        axisLine={false}
        tickLine={false}
        width={width}
        // A hidden series keeps its place on the scale: the axis does not jump when the legend hides one.
        includeHidden={includeHidden}
        {...(yLabel ? { label: axisTitle(yLabel, true) } : {})}
      />
    </>
  );
}

/** What a Line or an Area tells its Frame: its series under their swatch, its formats, its height and its records for the table. */
function useCategoryReport(
  data: ChartDatum[],
  x: string,
  series: ChartSeries[],
  xLabel: string | undefined,
  swatch: "line" | "square",
  format: Formatter,
  formatX: CategoryFormatter,
  size: ChartSize | undefined,
  height: number | undefined,
) {
  return useMemo<FrameReport>(
    () => ({
      series,
      swatch,
      format,
      formatX,
      height: height ?? heights[size ?? "medium"],
      table: { kind: "category", data, x, series, xLabel },
    }),
    [series, swatch, format, formatX, height, size, data, x, xLabel],
  );
}

/**
 * Whether every category label of a point axis fits its slot in a plot `width` wide, less the
 * value axis: then all print, and recharts thins none out.
 */
const categoriesFit = (labels: string[], width: number | undefined, valueAxis: number) => {
  if (!width || labels.length < 2) return false;
  const slot = (width - valueAxis - 24) / (labels.length - 1);
  return labels.every((l) => labelWidth(l) + 6 <= slot);
};

/** The category format a time axis' tooltip uses: the full date, at the unit the span needs. */
const timeFormat = (
  time: ReturnType<typeof useTimeAxis>,
  formatX: CategoryFormatter,
): CategoryFormatter =>
  time ? (v) => time.full(typeof v === "number" ? v : new Date(v).getTime()) : formatX;

/** A line per series, 2px, with a ringed marker on hover. A click in a point's column, or Enter on the focused point, chooses it. */
export function ChartLine({
  data: dataProp,
  x: xProp,
  series: seriesProp,
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
  size: sizeProp,
  height: heightProp,
  format: formatProp,
  formatX: formatXProp,
  reference,
  label,
  loading: loadingProp,
  onSelect,
  details,
  className,
  "aria-describedby": describedBy,
  ...native
}: ChartLineProps) {
  const {
    name,
    titleId,
    hidden,
    highlighted,
    format,
    formatX: fx,
    loading,
    sync,
    offstage,
  } = useFrame(label, formatProp, formatXProp, loadingProp, syncId, textureProp);
  const { data, x, series } = useFrameData(dataProp, xProp, seriesProp);
  const { size, height } = usePlotSize(sizeProp, heightProp);
  useFrameReport(useCategoryReport(data, x, series, xLabel, "line", format, fx, size, height));
  const motion = useMotion();
  const tooltipMotion = useTooltipMotion();
  const time = useTimeAxis(data, x, scale === "time");
  const rows = time ? time.rows : data;
  const formatX = timeFormat(time, fx);
  const [plotWidth, setPlotWidth] = useState<number | undefined>(undefined);
  const c = useCartesian({
    data,
    rows,
    x,
    series,
    hidden,
    format,
    formatX,
    delta,
    onSelect,
    details,
    swatch: "line",
    textures: {},
    name,
    titleId,
    describedBy,
  });
  if (offstage) return null;
  if (loading)
    return (
      <PlotSkeleton kind="line" name={name} size={size} height={height} className={className} />
    );
  const keys = series.map((s) => s.key);
  const negative = hasNegative(data, keys);
  const through =
    negative && !domain && baseline === "zero"
      ? niceScale(
          ...valueExtent(data, keys),
          tickCount(height ?? heights[size ?? "medium"]),
          allIntegers(data, keys),
        )
      : null;
  const endWidth =
    labels === "end" ? endLabelWidth(rows, series, hidden, format, false) + END_GAP : undefined;
  return (
    <Plot
      {...native}
      name={c.a11y.name}
      semantics="surface"
      walk={c.a11y.walk}
      size={size}
      height={height}
      className={className}
      card={c.card}
      anchor={c.picked?.anchor}
      onClose={c.clear}
      onEnter={c.onEnter}
      onResize={(w) => setPlotWidth(w)}
    >
      <ComposedChart
        data={rows}
        margin={{
          ...marginFor({
            endLabels: labels === "end",
            refLabels: hasRefLabels(reference, bands),
            endWidth,
          }),
          bottom: xLabel ? 12 : 0,
          left: yLabel ? 8 : 0,
        }}
        {...c.a11y.chart}
        {...syncProp(sync)}
        {...c.clickProps}
      >
        <Axes
          x={x}
          time={time}
          domain={through ? through.domain : valueDomain(domain, baseline, negative)}
          ticks={
            through
              ? through.ticks
              : pinnedTicks(
                  domain,
                  tickCount(height ?? heights[size ?? "medium"]),
                  allIntegers(data, keys),
                )
          }
          width={axisWidth(data, keys, format, through?.domain ?? domain, Boolean(yLabel))}
          xLabel={xLabel}
          yLabel={yLabel}
          format={format}
          formatX={formatX}
          allCategories={categoriesFit(
            time ? [] : rows.map((d) => tickText(d[x], formatX, 14)),
            plotWidth,
            axisWidth(data, keys, format, through?.domain ?? domain, Boolean(yLabel)),
          )}
        />
        <Tooltip
          cursor={cursorLine}
          {...tooltipMotion}
          content={
            <TooltipContent
              series={series}
              swatch="line"
              format={format}
              formatX={formatX}
              data={rows}
              x={x}
              delta={delta}
            />
          }
        />
        <Bands bands={bands} time={Boolean(time)} />
        {negative && baseline === "zero" ? <ZeroLine /> : null}
        {series.map((s) => {
          const color = seriesColor(series, s);
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
          <EndLabels
            data={rows}
            x={x}
            series={series}
            all={series}
            hidden={hidden}
            highlighted={highlighted}
            format={format}
          />
        ) : null}
        {c.picked ? (
          <ChosenMarks
            data={rows}
            x={x}
            index={c.picked.item.index}
            series={series}
            hidden={hidden}
          />
        ) : null}
        <References reference={reference} time={Boolean(time)} />
        <ReferenceLabels reference={reference} bands={bands} time={Boolean(time)} />
        {c.chooses ? <ActiveProbe target={c.active} locate={c.locate} /> : null}
      </ComposedChart>
    </Plot>
  );
}

type ChartAreaOwnProps = Omit<ChartLineOwnProps, "baseline"> & {
  /** Stack the series: parts of a whole over time. End labels sit on each band's top and print the band's value; the tooltip adds the total. */
  stacked?: boolean | undefined;
  /**
   * Ignored: an area's wash measures from zero, so its value axis always starts there. For a
   * cropped trend where the change matters more than the size, use a Line with `baseline="auto"`.
   * @deprecated An Area always starts at zero; remove the prop. Kept for one version.
   */
  baseline?: "zero" | "auto" | undefined;
};

/** The part's own props, and the native props and ref of the plot's box. */
export type ChartAreaProps = ChartAreaOwnProps &
  Omit<ComponentProps<"div">, keyof ChartAreaOwnProps | "children" | "role">;

/** A line with a wash under it, one per series; stacked when asked. Chooses a point as a Line does. The value axis starts at zero, since the wash measures from it. */
export function ChartArea({
  data: dataProp,
  x: xProp,
  series: seriesProp,
  scale = "category",
  curve = "linear",
  dots,
  labels = "none",
  baseline: _baseline,
  domain,
  bands,
  connectNulls,
  delta = false,
  stacked,
  xLabel,
  yLabel,
  texture: textureProp,
  syncId,
  size: sizeProp,
  height: heightProp,
  format: formatProp,
  formatX: formatXProp,
  reference,
  label,
  loading: loadingProp,
  onSelect,
  details,
  className,
  "aria-describedby": describedBy,
  ...native
}: ChartAreaProps) {
  const {
    name,
    titleId,
    hidden,
    highlighted,
    format,
    formatX: fx,
    loading,
    sync,
    texture,
    offstage,
  } = useFrame(label, formatProp, formatXProp, loadingProp, syncId, textureProp);
  const { data, x, series } = useFrameData(dataProp, xProp, seriesProp);
  const { size, height } = usePlotSize(sizeProp, heightProp);
  useFrameReport(useCategoryReport(data, x, series, xLabel, "square", format, fx, size, height));
  const id = useId();
  const motion = useMotion();
  const tooltipMotion = useTooltipMotion();
  const time = useTimeAxis(data, x, scale === "time");
  const rows = time ? time.rows : data;
  const formatX = timeFormat(time, fx);
  const textures: Record<string, Texture> = {};
  if (texture) series.forEach((s, i) => (textures[s.key] = textureOf(i)));
  const [plotWidth, setPlotWidth] = useState<number | undefined>(undefined);
  const c = useCartesian({
    data,
    rows,
    x,
    series,
    hidden,
    format,
    formatX,
    delta,
    onSelect,
    details,
    swatch: "square",
    textures,
    name,
    titleId,
    describedBy,
    stacked,
  });
  if (offstage) return null;
  if (loading)
    return (
      <PlotSkeleton kind="area" name={name} size={size} height={height} className={className} />
    );
  const keys = series.map((s) => s.key);
  const negative = hasNegative(data, keys);
  // Through zero, and on a stack, the axis takes round steps over every series, hidden ones
  // included: a hidden band leaves the stack, which closes up over zero, and the axis keeps its scale.
  const scaled =
    (negative || stacked) && !domain
      ? niceScale(
          ...(stacked ? stackExtent(data, keys) : valueExtent(data, keys)),
          tickCount(height ?? heights[size ?? "medium"]),
          allIntegers(data, keys),
        )
      : null;
  const through = scaled && scaled.ticks.length > 1 ? scaled : null;
  const colorOf = (s: ChartSeries) => seriesColor(series, s);
  const endWidth =
    labels === "end"
      ? endLabelWidth(rows, series, hidden, format, Boolean(stacked)) + END_GAP
      : undefined;
  return (
    <Plot
      {...native}
      name={c.a11y.name}
      semantics="surface"
      walk={c.a11y.walk}
      size={size}
      height={height}
      className={className}
      card={c.card}
      anchor={c.picked?.anchor}
      onClose={c.clear}
      onEnter={c.onEnter}
      onResize={(w) => setPlotWidth(w)}
      textures={
        texture
          ? {
              id,
              entries: series.map((s, i) => ({
                key: s.key,
                color: colorOf(s),
                texture: textureOf(i),
              })),
            }
          : undefined
      }
    >
      <ComposedChart
        data={rows}
        margin={{
          ...marginFor({
            endLabels: labels === "end",
            refLabels: hasRefLabels(reference, bands),
            endWidth,
          }),
          bottom: xLabel ? 12 : 0,
          left: yLabel ? 8 : 0,
        }}
        {...(stacked && negative ? { stackOffset: "sign" as const } : {})}
        {...c.a11y.chart}
        {...syncProp(sync)}
        {...c.clickProps}
      >
        <Axes
          x={x}
          time={time}
          domain={through ? through.domain : valueDomain(domain, "zero", negative)}
          ticks={
            through
              ? through.ticks
              : pinnedTicks(
                  domain,
                  tickCount(height ?? heights[size ?? "medium"]),
                  allIntegers(data, keys),
                )
          }
          width={axisWidth(data, keys, format, through?.domain ?? domain, Boolean(yLabel))}
          xLabel={xLabel}
          yLabel={yLabel}
          format={format}
          formatX={formatX}
          allCategories={categoriesFit(
            time ? [] : rows.map((d) => tickText(d[x], formatX, 14)),
            plotWidth,
            axisWidth(data, keys, format, through?.domain ?? domain, Boolean(yLabel)),
          )}
          includeHidden={!stacked}
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
              totalKeys={c.totalKeys}
              data={rows}
              x={x}
              delta={delta}
              textures={textures}
            />
          }
        />
        <Bands bands={bands} time={Boolean(time)} />
        {negative ? <ZeroLine /> : null}
        {series.map((s) => {
          const color = colorOf(s);
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
          <EndLabels
            data={rows}
            x={x}
            series={series}
            all={series}
            hidden={hidden}
            highlighted={highlighted}
            format={format}
            stacked={stacked}
          />
        ) : null}
        {c.picked && !stacked ? (
          <ChosenMarks
            data={rows}
            x={x}
            index={c.picked.item.index}
            series={series}
            hidden={hidden}
          />
        ) : null}
        <References reference={reference} time={Boolean(time)} />
        <ReferenceLabels reference={reference} bands={bands} time={Boolean(time)} />
        {c.chooses ? <ActiveProbe target={c.active} locate={c.locate} /> : null}
      </ComposedChart>
    </Plot>
  );
}
