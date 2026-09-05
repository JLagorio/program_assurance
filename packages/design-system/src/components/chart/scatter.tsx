import { useMemo, type ReactNode } from "react";
import { CartesianGrid, Scatter, ScatterChart, Tooltip, XAxis, YAxis, ZAxis } from "recharts";

import { cn } from "../../lib/cn";
import {
  CardHead,
  Plot,
  PlotSkeleton,
  References,
  Swatch,
  Tick,
  axisLine,
  axisTitle,
  categoricalTone,
  chartColor,
  formatValue,
  grid,
  overlay,
  rectAnchor,
  seriesClass,
  surface,
  useFrame,
  useMotion,
  usePicked,
  useTooltipMotion,
  type CategoryFormatter,
  type ChartDatum,
  type ChartReference,
  type ChartSeries,
  type ChartSize,
  type ChartTone,
  type Formatter,
} from "./_shared";

export type ChartScatterGroup = {
  /** The value of `groupBy` that puts a datum in this group. */
  key: string;
  label?: string | undefined;
  tone?: ChartTone | undefined;
};

/** What was chosen on a scatter: the record, its group, and its index in the data. */
export type ScatterSelection = { datum: ChartDatum; group?: ChartScatterGroup | undefined; index: number };

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
  /** Draws the plot's skeleton in place of the points. The Frame sets it from `status="loading"`. */
  loading?: boolean | undefined;
  /** Called when a point is clicked. */
  onSelect?: ((selection: ScatterSelection) => void) | undefined;
  /** More about the chosen point, in a card anchored to it. The card's head (the point's name, its group and each axis) is the kit's. */
  details?: ((selection: ScatterSelection) => ReactNode) | undefined;
  className?: string | undefined;
};

/** A point, 8px across and ringed, with a hit area three times its size. A bubble's area follows `z`. */
function Point({
  cx,
  cy,
  fill,
  size,
  payload,
  clickable,
  chosen,
}: {
  cx?: number | undefined;
  cy?: number | undefined;
  fill?: string | undefined;
  size?: number | undefined;
  payload?: ChartDatum | undefined;
  clickable?: boolean | undefined;
  chosen?: ChartDatum | undefined;
}) {
  if (cx === undefined || cy === undefined) return null;
  const r = size ? Math.max(4, Math.sqrt(size / Math.PI)) : 4;
  const dim = chosen !== undefined && chosen !== payload;
  return (
    <g className={cn(clickable && "cursor-pointer", dim && "opacity-disabled") || undefined}>
      <circle cx={cx} cy={cy} r={Math.max(12, r + 6)} fill="transparent" />
      {chosen === payload ? <circle cx={cx} cy={cy} r={r + 4} fill={fill} fillOpacity={0.2} /> : null}
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

type Group = { key: string; label: string; tone: ChartTone; rows: ChartDatum[]; source?: ChartScatterGroup | undefined };
type Clicked = { payload: ChartDatum; cx?: number; cy?: number; size?: number };

/** A point per datum on two value axes, in groups of a tone; a bubble when `z` sizes them. A click on a point chooses it. */
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
  loading: loadingProp,
  onSelect,
  details,
  className,
}: ChartScatterProps) {
  const { name, hidden, highlighted, format, formatX, loading } = useFrame(
    label,
    formatProp,
    formatXProp,
    loadingProp,
  );
  const motion = useMotion();
  const tooltipMotion = useTooltipMotion();
  const { picked, pick, clear } = usePicked<ScatterSelection>();
  const sets = useMemo<Group[]>(() => {
    if (groupBy && groups?.length)
      return groups.map((g, i) => ({
        key: g.key,
        label: g.label ?? g.key,
        tone: g.tone ?? categoricalTone(i),
        rows: data.filter((d) => String(d[groupBy]) === g.key),
        source: g,
      }));
    return [{ key: "all", label: "Points", tone, rows: data }];
  }, [data, groupBy, groups, tone]);
  if (loading)
    return <PlotSkeleton kind="dots" name={name} size={size} height={height} className={className} />;
  const axes: ChartSeries[] = [
    { key: x, label: xLabel ?? x },
    { key: y, label: yLabel ?? y },
    ...(z ? [{ key: z, label: z }] : []),
  ];
  const chooses = Boolean(onSelect || details);
  const axisRows = (datum: ChartDatum) =>
    axes.flatMap((s, i) => {
      const v = datum[s.key];
      if (v === undefined || v === null) return [];
      return [
        {
          swatch: <span className="size-100 shrink-0" aria-hidden />,
          label: s.label ?? s.key,
          value: i === 0 && typeof v === "string" ? formatX(v) : formatValue(v, format),
        },
      ];
    });
  const card = picked ? (
    <>
      <CardHead
        swatch={
          <Swatch
            color={chartColor(sets.find((s) => s.source === picked.item.group)?.tone ?? tone)}
            shape="dot"
          />
        }
        title={nameKey ? String(picked.item.datum[nameKey] ?? "") : "Point"}
        subtitle={picked.item.group ? (picked.item.group.label ?? picked.item.group.key) : undefined}
        rows={axisRows(picked.item.datum)}
      />
      {details?.(picked.item)}
    </>
  ) : null;
  return (
    <Plot
      name={name}
      size={size}
      height={height}
      className={className}
      card={card}
      anchor={picked?.anchor}
      onClose={clear}
    >
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
          {...tooltipMotion}
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
            shape={<Point clickable={chooses} chosen={picked?.item.datum} />}
            hide={hidden.has(s.key)}
            {...seriesClass(s.key, highlighted, false)}
            {...motion}
            {...(chooses
              ? {
                  onClick: (item: unknown) => {
                    const c = item as Clicked;
                    const selection: ScatterSelection = {
                      datum: c.payload,
                      group: s.source,
                      index: data.indexOf(c.payload),
                    };
                    onSelect?.(selection);
                    const r = c.size ? Math.max(4, Math.sqrt(c.size / Math.PI)) : 4;
                    if (details)
                      pick(
                        selection,
                        rectAnchor({ x: (c.cx ?? 0) - r, y: (c.cy ?? 0) - r, width: r * 2, height: r * 2 }),
                      );
                  },
                }
              : {})}
          />
        ))}
        <References reference={reference} />
      </ScatterChart>
    </Plot>
  );
}

/** A point's tooltip: its name and group, then each axis as name and value. */
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
    <div className={cn("min-w-0", overlay)}>
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
            <span className="min-w-0 flex-1 truncate text-subtle">{s.label ?? s.key}</span>
            <span className="tabular-nums font-medium text-default">
              {i === 0 && typeof v === "string" ? formatX(v) : formatValue(v, format)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
