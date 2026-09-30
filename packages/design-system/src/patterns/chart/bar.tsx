import { useLedgerLocale } from "../../lib/locale";
import { useId, useMemo, useRef, useState, type ComponentProps, type ReactNode } from "react";
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
  useXAxisScale,
  useYAxisScale,
} from "recharts";

import { token } from "../../generated/tokens";
import {
  ActiveProbe,
  CardHead,
  CategoryTick,
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
  categoryAxisHeight,
  categoryLines,
  cursorFill,
  formatValue,
  grid,
  hasNegative,
  hasRefLabels,
  heights,
  hoveredColor,
  isRange,
  labelWidth,
  marginFor,
  marker,
  markClass,
  niceScale,
  pinnedTicks,
  pointAnchor,
  rectAnchor,
  seriesClass,
  seriesColor,
  seriesTone,
  stackExtent,
  surface,
  syncProp,
  textureFill,
  textureOf,
  tickCount,
  tickValue,
  useChartSurface,
  useDescribePoint,
  useFrame,
  useFrameData,
  useFrameReport,
  useMotion,
  usePicked,
  usePlotSize,
  useTooltipMotion,
  valueDomain,
  valueExtent,
  type Active,
  type Locate,
  type CategoryFormatter,
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

type ChartBarOwnProps = {
  /** Plain records, in the order they are drawn. Inside a Frame, the Frame's `data` when unsaid. */
  data?: ChartDatum[] | undefined;
  /** The key that names each datum along the category axis. Inside a Frame, the Frame's `x` when unsaid. */
  x?: string | undefined;
  /** One entry per value key. A series' own `format` wins over the plot's. Inside a Frame, the Frame's `series` when unsaid. */
  series?: ChartSeries[] | undefined;
  /** Stack the series in one bar per category, parts of a whole. A part below zero stacks down from zero. */
  stacked?: boolean | undefined;
  /** Categories down the side, values across: for long names, or many categories. */
  horizontal?: boolean | undefined;
  /** `end` prints each bar's value at its end, or a stack's total at the stack's end. On a column chart too narrow for every label to fit its bar's share of the category, none prints; the tooltip and the table hold them. */
  labels?: "none" | "end" | undefined;
  /** A key in each datum holding a target: drawn as a mark across the bar, so actual reads against planned. */
  target?: string | undefined;
  /** A series drawn as a line over the bars on the same axis: a cumulative, a rate, a plan. It is not part of a stack's total. */
  line?: ChartSeries | undefined;
  /** The value axis' ends, to share a scale across charts. `[0, "auto"]` when unsaid; a value below zero extends the axis below it and draws the zero line. With both ends pinned the ticks are round steps through zero. */
  domain?: ChartDomain | undefined;
  /** Titles for the axes, when the keys and the Frame's title do not say enough: the unit on the value axis. */
  xLabel?: string | undefined;
  yLabel?: string | undefined;
  /** Every series wears a pattern as well as its colour, so a stack reads in print and under colour-vision loss. The Frame's `texture` sets it for the legend too. */
  texture?: boolean | undefined;
  /** Charts with the same id share their hover. The Frame's `syncId` sets it. */
  syncId?: string | undefined;
  /** The plot's height. The Frame's when unsaid, else `medium` (200px); `large` in the expanded Dialog. */
  size?: ChartSize | undefined;
  /** A height in pixels when a layout must, in place of `size`. */
  height?: number | undefined;
  /** The number format for the value axis, the tooltip, the labels and the Frame's table. The Frame's, else the kit's. */
  format?: Formatter | undefined;
  /** The format for a category: a date, a code. */
  formatX?: CategoryFormatter | undefined;
  /** Lines across the plot: a target, a limit, a milestone. */
  reference?: ChartReference[] | undefined;
  /** The plot's accessible name. Unneeded inside a Frame, which names it after its title; a plot with neither is hidden from a screen reader. */
  label?: string | undefined;
  /** Draws the plot's skeleton in place of the marks. The Frame sets it from `state="loading"`. */
  loading?: boolean | undefined;
  /** Called when a bar is clicked, or Enter chooses the focused category: to drill down, or to filter what is under the chart. With it, the plot is a tab stop whose arrow keys walk the categories. */
  onSelect?: ((selection: ChartSelection) => void) | undefined;
  /** More about what was chosen, in a card anchored to it: facts, a link to the record. The card's head (the category, the series, the value) is the kit's. */
  details?: ((selection: ChartSelection) => ReactNode) | undefined;
  className?: string | undefined;
};

/** The part's own props, and the native props and ref of the plot's box: an `id`, `data-*` for a test, and `aria-describedby`, which describes the plot's svg. */
export type ChartBarProps = ChartBarOwnProps &
  Omit<ComponentProps<"div">, keyof ChartBarOwnProps | "children" | "role">;

type Clicked = { payload: ChartDatum; x?: number; y?: number; width?: number; height?: number };

type Scale = (
  value: unknown,
  options?: { position?: "start" | "middle" | "end" },
) => number | undefined;

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

/**
 * Each stack's total at its end, drawn from the scales rather than from a bar's label, so a part
 * of zero leaves no category without its total. A stack with a part below zero has two ends: its
 * total is in the tooltip and the table.
 */
function StackTotals({
  data,
  x,
  keys,
  format,
  horizontal,
}: {
  data: ChartDatum[];
  x: string;
  keys: string[];
  format: Formatter;
  horizontal?: boolean | undefined;
}) {
  const xScale = useXAxisScale() as Scale | undefined;
  const yScale = useYAxisScale() as Scale | undefined;
  if (!xScale || !yScale) return null;
  const category = horizontal ? yScale : xScale;
  const value = horizontal ? xScale : yScale;
  return (
    <g>
      {data.map((d, i) => {
        const parts = keys.map((k) => d[k]).filter((v): v is number => typeof v === "number");
        if (!parts.length || parts.some((v) => v < 0)) return null;
        const total = parts.reduce((n, v) => n + v, 0);
        // The middle of the category's band, where its stack stands.
        const mid = category(d[x], { position: "middle" });
        const end = value(total);
        if (mid === undefined || end === undefined) return null;
        return horizontal ? (
          <text
            key={i}
            x={end + 4}
            y={mid}
            dy={4}
            textAnchor="start"
            className="font-body-xsmall tabular-nums"
            fill={token("color.text.subtle")}
          >
            {format(total)}
          </text>
        ) : (
          <text
            key={i}
            x={mid}
            y={end - 4}
            textAnchor="middle"
            className="font-body-xsmall tabular-nums"
            fill={token("color.text.subtle")}
          >
            {format(total)}
          </text>
        );
      })}
    </g>
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
  const negative =
    typeof value === "number" ? value < 0 : isRange(value) ? value[1] < value[0] : false;
  if (horizontal) return negative ? [2, 0, 0, 2] : [0, 2, 2, 0];
  return negative ? [0, 0, 2, 2] : [2, 2, 0, 0];
};

/**
 * Bars per category; several series sit side by side, or stack. A value that is a `[from, to]`
 * pair floats, and a value below zero hangs from the zero line. A click on a bar, or Enter on the
 * focused category, chooses it: `onSelect` hears, and `details` opens a card on it. A plot that
 * chooses is one tab stop whose arrow keys walk the categories (up and down on a horizontal chart),
 * each said in a live region; one that chooses nothing is an image named by its Frame.
 */
export function ChartBar({
  data: dataProp,
  x: xProp,
  series: seriesProp,
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
}: ChartBarProps) {
  const { t } = useLedgerLocale();

  const { name, titleId, hidden, highlighted, format, formatX, loading, sync, texture, offstage } =
    useFrame(label, formatProp, formatXProp, loadingProp, syncId, textureProp);
  const { data, x, series } = useFrameData(dataProp, xProp, seriesProp);
  const { size, height } = usePlotSize(sizeProp, heightProp);
  const all = useMemo(() => (line ? [...series, line] : series), [series, line]);
  const report = useMemo<FrameReport>(
    () => ({
      series: all,
      swatch: "square",
      format,
      formatX,
      height: height ?? heights[size ?? "medium"],
      table: { kind: "category", data, x, series: all, xLabel },
    }),
    [all, format, formatX, height, size, data, x, xLabel],
  );
  useFrameReport(report);
  const id = useId();
  const motion = useMotion();
  const tooltipMotion = useTooltipMotion();
  const { picked, pick, clear } = usePicked<ChartSelection>();
  const active = useRef<Active | null>(null);
  const locate = useRef<Locate | null>(null);
  const [plotWidth, setPlotWidth] = useState<number | undefined>(undefined);
  const categoryText = (d: ChartDatum) => formatX((d[x] as string | number | undefined) ?? "");
  // A horizontal chart's category column: as wide as its longest name, 56px to 160px.
  const categoryWidth = useMemo(() => {
    const longest = Math.max(
      0,
      ...data.map((d) => labelWidth(formatX((d[x] as string | number | undefined) ?? ""))),
    );
    return Math.min(160, Math.max(56, 8 + longest));
  }, [data, x, formatX]);
  const keys = useMemo(() => series.map((s) => s.key), [series]);
  const negative = useMemo(() => hasNegative(data, keys), [data, keys]);
  const valueWidth = useMemo(
    () => axisWidth(data, keys, format, domain, Boolean(yLabel)),
    [data, keys, format, domain, yLabel],
  );
  const stackKeys = useMemo(
    () => (stacked ? series.filter((s) => !hidden.has(s.key)).map((s) => s.key) : undefined),
    [stacked, series, hidden],
  );
  const chooses = Boolean(onSelect || details);
  const describe = useDescribePoint({
    data,
    x,
    series: all,
    hidden,
    format,
    formatX,
    totalKeys: stackKeys,
    targetKey: target,
  });
  const a11y = useChartSurface({
    name,
    titleId,
    chooses,
    layout: horizontal ? "rows" : "columns",
    describedBy,
    count: data.length,
    describe,
  });
  if (offstage) return null;
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
  const colorOf = (s: ChartSeries) => seriesColor(all, s);
  const hoveredOf = (s: ChartSeries) => hoveredColor(seriesTone(all, s));
  const textures: Record<string, Texture> = {};
  if (texture) series.forEach((s, i) => (textures[s.key] = textureOf(i)));
  const fillOf = (s: ChartSeries, i: number) =>
    texture ? textureFill(id, s.key, textureOf(i), colorOf(s)) : colorOf(s);
  const fmtOf = (s: ChartSeries) => s.format ?? format;
  const choose = (selection: ChartSelection, anchor: Parameters<typeof pick>[1]) => {
    onSelect?.(selection);
    if (details) pick(selection, anchor);
  };
  // Enter chooses the category the keyboard is on, the one its live region said: at the tooltip
  // when the tooltip is on it, else at the category's place (a pointer may rest on another).
  const onEnter = chooses
    ? (index: number | undefined) => {
        const datum = index === undefined ? undefined : data[index];
        if (!datum || index === undefined) return;
        const a = active.current;
        const at = a && a.label === datum[x] ? a.coordinate : locate.current?.(datum[x]);
        choose({ datum, index }, pointAnchor(at));
      }
    : undefined;
  const card = picked ? (
    <>
      <CardHead
        {...(picked.item.series
          ? {
              swatch: (
                <Swatch
                  color={colorOf(picked.item.series)}
                  shape="square"
                  texture={textures[picked.item.series.key]}
                />
              ),
              title: picked.item.series.label ?? picked.item.series.key,
              subtitle: categoryText(picked.item.datum),
              value: formatValue(
                picked.item.datum[picked.item.series.key],
                fmtOf(picked.item.series),
              ),
            }
          : {
              title: categoryText(picked.item.datum),
              rows: all
                .filter((s) => !hidden.has(s.key))
                .map((s) => ({
                  // The colour of the series' place among all of them, hidden ones included, as in the plot.
                  swatch: (
                    <Swatch
                      color={colorOf(s)}
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
  const endLabels = labels === "end";
  const valueTicks = tickCount(height ?? heights[size ?? "medium"]);
  // The keys on the value axis beside the bars: the line and the target.
  const beside = [...(line ? [line.key] : []), ...(target ? [target] : [])];
  const whole = allIntegers(data, [...keys, ...beside]);
  // Through zero, the axis steps evenly from a round end to a round end, so zero is a tick; a bar
  // below zero with an end label needs room under it, so the axis reaches a little further down.
  // A stack takes the same round scale over every series, hidden ones included: a hidden part
  // leaves the stack, which closes up over zero, and the axis keeps its scale.
  const scaled =
    (negative || stacked) && !domain
      ? (() => {
          const [blo, bhi] = stacked ? stackExtent(data, keys) : valueExtent(data, keys);
          const [elo, ehi] = valueExtent(data, beside);
          const lo = Math.min(blo, elo);
          return niceScale(endLabels ? lo * 1.4 : lo, Math.max(bhi, ehi), valueTicks, whole);
        })()
      : null;
  const through = scaled && scaled.ticks.length > 1 ? scaled : null;
  // The value axis holds its round ends' labels as well as the data's.
  const axisW = through
    ? Math.max(valueWidth, axisWidth(data, keys, format, through.domain, Boolean(yLabel)))
    : valueWidth;
  const yDomain: ReturnType<typeof valueDomain> = through
    ? through.domain
    : valueDomain(domain, "zero", negative);
  // With a stack whose parts go either way, each part stacks from zero on its own side.
  const stackOffset = stacked && negative ? "sign" : undefined;
  const ticks = through ? through.ticks : pinnedTicks(domain, valueTicks, whole);
  // The widest end label, so the margin holds it and nothing is cut at the plot's edge.
  const endWidth = endLabels
    ? Math.max(
        0,
        ...data.flatMap((d) =>
          stacked
            ? [
                labelWidth(
                  format(
                    series.reduce((n, s) => {
                      const v = d[s.key];
                      return typeof v === "number" && v > 0 ? n + v : n;
                    }, 0),
                  ),
                ),
              ]
            : series.map((s) => labelWidth(formatValue(d[s.key], fmtOf(s)))),
        ),
      )
    : undefined;
  const margin = marginFor({
    endLabels,
    refLabels: hasRefLabels(reference),
    horizontal,
    endWidth: horizontal ? endWidth : (endWidth ?? 0) / 2,
  });
  const leftForNegative = negative && endLabels && horizontal ? Math.ceil((endWidth ?? 32) + 8) : 0;
  // On a column chart every category keeps a label: two lines when one will not fit its band.
  const plotRoom =
    plotWidth === undefined
      ? undefined
      : plotWidth - axisW - margin.right - (yLabel ? 8 : 0) - margin.left;
  const lines = horizontal ? 1 : categoryLines(data.map(categoryText), plotRoom);
  const visibleGroups = stacked ? 1 : Math.max(1, series.filter((s) => !hidden.has(s.key)).length);
  // A column chart's end labels print only when every one fits its bar's share of the category:
  // some labels and not others would read as missing values. The tooltip and the table hold them.
  const endFits =
    horizontal || plotRoom === undefined || endWidth === undefined
      ? true
      : endWidth <= plotRoom / Math.max(1, data.length) / visibleGroups - 2;
  const valueTick = (v: unknown) => format(tickValue(v));
  return (
    <Plot
      {...native}
      name={a11y.name}
      semantics="surface"
      walk={a11y.walk}
      size={size}
      height={height}
      className={className}
      card={card}
      anchor={picked?.anchor}
      onClose={clear}
      onEnter={onEnter}
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
      {/* BarChart, not ComposedChart: only it draws the tooltip's cursor as a band behind the slot. The same engine takes the line and the target marks. */}
      <BarChart
        data={data}
        layout={horizontal ? "vertical" : "horizontal"}
        margin={{
          ...margin,
          bottom: xLabel || (negative && endLabels && !horizontal) ? 12 : 0,
          left: yLabel || leftForNegative ? Math.max(yLabel ? 8 : 0, leftForNegative) : 0,
        }}
        barGap={2}
        barCategoryGap={stacked ? "35%" : "25%"}
        {...(stackOffset ? { stackOffset } : {})}
        {...a11y.chart}
        {...syncProp(sync)}
      >
        <CartesianGrid {...grid} vertical={Boolean(horizontal)} horizontal={!horizontal} />
        {horizontal ? (
          <>
            <XAxis
              type="number"
              domain={yDomain}
              // The kit's own ticks all print: they are few enough, and zero is one of them.
              {...(ticks ? { ticks, interval: 0 } : {})}
              tick={<Tick format={(v) => valueTick(v)} />}
              tickFormatter={valueTick}
              axisLine={axisLine}
              tickLine={false}
              height={yLabel ? 36 : 24}
              // A hidden series keeps its place on the scale; a stack's scale is the kit's, above.
              includeHidden={!stacked}
              {...(yLabel ? { label: axisTitle(yLabel, false) } : {})}
            />
            <YAxis
              type="category"
              dataKey={x}
              interval={0}
              tick={<Tick vertical format={formatX} room={categoryWidth - 8} />}
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
              interval={0}
              tick={<CategoryTick count={data.length} format={formatX} lines={lines} />}
              axisLine={axisLine}
              tickLine={false}
              height={categoryAxisHeight(lines, Boolean(xLabel))}
              {...(xLabel ? { label: axisTitle(xLabel, false) } : {})}
            />
            <YAxis
              domain={yDomain}
              // The kit's own ticks all print: they are few enough, and zero is one of them.
              {...(ticks ? { ticks, interval: 0 } : {})}
              tick={<Tick vertical format={(v) => valueTick(v)} />}
              tickFormatter={valueTick}
              axisLine={false}
              tickLine={false}
              width={axisW}
              // A hidden series keeps its place on the scale; a stack's scale is the kit's, above.
              includeHidden={!stacked}
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
              totalKeys={stackKeys}
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
            activeBar={{
              fill: texture ? fillOf(s, i) : hoveredOf(s),
              fillOpacity: texture ? 0.85 : 1,
            }}
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
            {endLabels && endFits && !stacked ? (
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
            name={t("target")}
            shape={<TargetMark horizontal={horizontal} />}
            isAnimationActive={false}
          />
        ) : null}
        {line ? (
          <Line
            dataKey={line.key}
            name={line.label ?? line.key}
            type="linear"
            stroke={seriesColor(all, line)}
            strokeWidth={2}
            strokeLinecap="round"
            dot={false}
            activeDot={marker(seriesColor(all, line))}
            hide={hidden.has(line.key)}
            {...seriesClass(line.key, highlighted, false)}
            {...motion}
          />
        ) : null}
        {endLabels && endFits && stacked ? (
          <StackTotals
            data={data}
            x={x}
            keys={stackKeys ?? []}
            format={format}
            horizontal={horizontal}
          />
        ) : null}
        <References reference={reference} horizontal={horizontal} />
        <ReferenceLabels reference={reference} horizontal={horizontal} />
        {chooses ? <ActiveProbe target={active} locate={locate} rows={horizontal} /> : null}
      </BarChart>
    </Plot>
  );
}
