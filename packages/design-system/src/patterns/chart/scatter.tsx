import { useLedgerLocale } from "../../lib/locale";
import { useContext, useMemo, type KeyboardEvent, type ReactNode } from "react";
import { CartesianGrid, Scatter, ScatterChart, Tooltip, XAxis, YAxis, ZAxis } from "recharts";

import { token } from "../../generated/tokens";
import { Button } from "../../components/button";
import { cn } from "../../lib/cn";
import {
  CardHead,
  FrameContext,
  Plot,
  PlotSkeleton,
  ReferenceLabels,
  References,
  Swatch,
  Tick,
  axisLine,
  axisTitle,
  axisWidth,
  categoricalTone,
  chartColor,
  extraCell,
  extraColumn,
  formatValue,
  grid,
  heights,
  overlay,
  pinnedTicks,
  raw,
  rectAnchor,
  seriesClass,
  splitColumns,
  surface,
  tickValue,
  useChartSurface,
  useFrame,
  useFrameReport,
  useMotion,
  usePicked,
  usePlotSize,
  useTooltipMotion,
  type CategoryFormatter,
  type ChartColumn,
  type ChartDatum,
  type ChartDomain,
  type ChartReference,
  type ChartSeries,
  type ChartSize,
  type ChartTone,
  type ChartTwin,
  type Formatter,
  type FrameReport,
  type TwinSource,
} from "./_shared";

export type ChartScatterGroup = {
  /** The value of `groupBy` that puts a datum in this group. */
  key: string;
  label?: string | undefined;
  tone?: ChartTone | undefined;
};

/** What was chosen on a scatter: the record, its group, and its index in the data. */
export type ScatterSelection = {
  datum: ChartDatum;
  group?: ChartScatterGroup | undefined;
  index: number;
};

export type ChartScatterProps = {
  data: ChartDatum[];
  /** The key on the horizontal axis. */
  x: string;
  /** The key on the vertical axis. */
  y: string;
  /** A key whose value sizes the point: a bubble. Area, not radius, so twice the value is twice the ink. */
  z?: string | undefined;
  /** The key that names a point in the tooltip, the card, the table and its button. */
  nameKey?: string | undefined;
  /**
   * The key that names a point.
   * @deprecated Use `nameKey`: on every other plot `name` and `label` name the plot. `ledger/no-deprecated-name` fixes it.
   */
  name?: string | undefined;
  /** The key that puts each point in a group, and the groups with their tones. At most three, so any two points stay apart. */
  groupBy?: string | undefined;
  groups?: ChartScatterGroup[] | undefined;
  /** The tone of every point when there are no groups. */
  tone?: ChartTone | undefined;
  /** Lines across the plot: a limit on either axis, or both for quadrants. */
  reference?: ChartReference[] | undefined;
  /** Axis titles, when the keys do not say enough. They head the table twin's axis columns too. */
  xLabel?: string | undefined;
  yLabel?: string | undefined;
  /** What `z` is called in the tooltip, the card and the table twin: "Exposure". The key when unsaid. */
  zLabel?: string | undefined;
  /** Each axis' ends: a number or `"auto"`. The data's, rounded, when unsaid. With both ends pinned, the ticks are round steps across them. */
  xDomain?: ChartDomain | undefined;
  yDomain?: ChartDomain | undefined;
  /** The ticks on each axis, when round steps are not the right ones. */
  xTicks?: readonly number[] | undefined;
  yTicks?: readonly number[] | undefined;
  /** The plot's height. The Frame's when unsaid, else `medium` (200px); `large` in the expanded Dialog. */
  size?: ChartSize | undefined;
  height?: number | undefined;
  /** The number format of every axis that has none of its own: the ticks, the tooltip, the card and the table. */
  format?: Formatter | undefined;
  /** The horizontal axis' format, in its ticks, the tooltip, the card and the table. `format` when unsaid. */
  formatX?: CategoryFormatter | undefined;
  /** The vertical axis' format. `format` when unsaid. */
  formatY?: Formatter | undefined;
  /** `z`'s format. `format` when unsaid. */
  formatZ?: Formatter | undefined;
  /** The plot's accessible name. The Frame's title when unsaid. */
  label?: string | undefined;
  /** Draws the plot's skeleton in place of the points. The Frame sets it from `state="loading"`. */
  loading?: boolean | undefined;
  /** Called when a point is clicked, or activated with Enter or Space. */
  onSelect?: ((selection: ScatterSelection) => void) | undefined;
  /** More about the chosen point, in a card anchored to it. The card's head (the point's name, its group and each axis) is the kit's. */
  details?: ((selection: ScatterSelection) => ReactNode) | undefined;
  className?: string | undefined;
};

type Axis = { key: string; label: string; format: (v: unknown) => string };

/** A point, 8px across and ringed, with a hit area three times its size. A bubble's area follows `z`. */
function Point({
  cx,
  cy,
  fill,
  size,
  payload,
  bubble,
  clickable,
  chosen,
  focusable,
  describe,
  hasCard,
  onChoose,
}: {
  cx?: number | undefined;
  cy?: number | undefined;
  fill?: string | undefined;
  size?: number | undefined;
  payload?: ChartDatum | undefined;
  /** Sized by `z`. Recharts gives every point a size; only a bubble's means anything. */
  bubble?: boolean | undefined;
  clickable?: boolean | undefined;
  chosen?: ChartDatum | undefined;
  focusable?: boolean | undefined;
  describe?: ((datum: ChartDatum) => string) | undefined;
  hasCard?: boolean | undefined;
  onChoose?:
    ((datum: ChartDatum, at: { cx: number; cy: number; size?: number }) => void) | undefined;
}) {
  if (cx === undefined || cy === undefined) return null;
  const r = bubble && size ? Math.max(4, Math.sqrt(size / Math.PI)) : 4;
  const dim = chosen !== undefined && chosen !== payload;
  const keys =
    focusable && payload && onChoose
      ? {
          role: "button",
          tabIndex: 0,
          "aria-label": describe?.(payload),
          "aria-haspopup": hasCard ? ("dialog" as const) : undefined,
          "aria-expanded": hasCard ? chosen === payload : undefined,
          "data-chart-tile": describe?.(payload),
          onKeyDown: (event: KeyboardEvent<SVGGElement>) => {
            if (event.key !== "Enter" && event.key !== " ") return;
            event.preventDefault();
            event.stopPropagation();
            onChoose(payload, { cx, cy, ...(size !== undefined ? { size } : {}) });
          },
        }
      : {};
  return (
    <g
      {...keys}
      className={
        cn(
          clickable && "cursor-pointer",
          focusable && "group/point outline-none",
          dim && "opacity-disabled",
        ) || undefined
      }
    >
      <circle cx={cx} cy={cy} r={Math.max(12, r + 6)} fill="transparent" />
      {chosen === payload ? (
        <circle cx={cx} cy={cy} r={r + 4} fill={fill} fillOpacity={0.2} />
      ) : null}
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill={fill}
        fillOpacity={bubble ? 0.7 : 1}
        stroke={surface()}
        strokeWidth={2}
      />
      {focusable ? (
        // The keyboard's ring: a focus-coloured circle outside the point's own surface ring.
        <circle
          data-slot="chart-mark-focus"
          cx={cx}
          cy={cy}
          r={r + 3}
          fill="none"
          stroke={token("color.border.focused")}
          strokeWidth={2}
          className="pointer-events-none opacity-0 group-focus-visible/point:opacity-100"
        />
      ) : null}
    </g>
  );
}

type Group = {
  key: string;
  label: string;
  tone: ChartTone;
  rows: ChartDatum[];
  source?: ChartScatterGroup | undefined;
};
type Clicked = { payload: ChartDatum; cx?: number; cy?: number; size?: number };

/** A point per datum on two value axes, in groups of a tone; a bubble when `z` sizes them. A click on a point chooses it. */
export function ChartScatter({
  data,
  x,
  y,
  z,
  nameKey: nameKeyProp,
  name: legacyNameKey,
  groupBy,
  groups,
  tone = "brand",
  reference,
  xLabel,
  yLabel,
  zLabel,
  xDomain,
  yDomain,
  xTicks,
  yTicks,
  size: sizeProp,
  height: heightProp,
  format: formatProp,
  formatX: formatXProp,
  formatY,
  formatZ,
  label,
  loading: loadingProp,
  onSelect,
  details,
  className,
}: ChartScatterProps) {
  const { t } = useLedgerLocale();
  const nameKey = nameKeyProp ?? legacyNameKey;

  const {
    name: frameName,
    titleId,
    hidden,
    highlighted,
    format,
    formatX: frameFormatX,
    loading,
    offstage,
  } = useFrame(label, formatProp, formatXProp, loadingProp);
  const chooses = Boolean(onSelect || details);
  const surfaceProps = useChartSurface({
    name: frameName,
    titleId,
    chooses,
    count: 0,
    describe: () => "",
  });
  const name = surfaceProps.name;
  const { size, height } = usePlotSize(sizeProp, heightProp);
  const motion = useMotion();
  const tooltipMotion = useTooltipMotion();
  const { picked, pick, clear } = usePicked<ScatterSelection>();
  // Each axis in its own format: x in `formatX` when one is given (the caller's or the Frame's),
  // else in `format` as y and z are, so a tick, the tooltip, the card and the table agree.
  const frame = useContext(FrameContext);
  const xFormat = formatXProp ?? frame?.formatX;
  const axes = useMemo<Axis[]>(() => {
    const number = (f: Formatter) => (v: unknown) => formatValue(v, f);
    return [
      {
        key: x,
        label: xLabel ?? x,
        format: (v: unknown) =>
          xFormat && (typeof v === "number" || typeof v === "string" || v instanceof Date)
            ? xFormat(v)
            : formatValue(v, format),
      },
      { key: y, label: yLabel ?? y, format: number(formatY ?? format) },
      ...(z ? [{ key: z, label: zLabel ?? z, format: number(formatZ ?? format) }] : []),
    ];
  }, [x, y, z, xLabel, yLabel, zLabel, xFormat, format, formatY, formatZ]);
  const sets = useMemo<Group[]>(() => {
    if (groupBy && groups?.length)
      return groups.map((g, i) => ({
        key: g.key,
        label: g.label ?? g.key,
        tone: g.tone ?? categoricalTone(i),
        rows: data.filter((d) => String(d[groupBy]) === g.key),
        source: g,
      }));
    return [{ key: "all", label: t("points"), tone, rows: data }];
  }, [data, groupBy, groups, tone, t]);
  const grouped = Boolean(groupBy && groups?.length);
  const legend = useMemo<ChartSeries[] | undefined>(
    () => (grouped ? sets.map((s) => ({ key: s.key, label: s.label, tone: s.tone })) : undefined),
    [grouped, sets],
  );
  const table = useMemo<TwinSource>(
    () => ({
      kind: "custom",
      build: ({ columns }) =>
        scatterTwin({
          data,
          sets,
          grouped,
          axes,
          nameKey,
          nameLabel: t("point"),
          groupLabel: t("chartGroup"),
          columns,
          format,
          formatX: frameFormatX,
        }),
    }),
    [data, sets, grouped, axes, nameKey, t, format, frameFormatX],
  );
  const report = useMemo<FrameReport>(
    () => ({
      series: legend,
      swatch: "dot",
      format,
      formatX: frameFormatX,
      height: height ?? heights[size ?? "medium"],
      table,
    }),
    [legend, format, frameFormatX, height, size, table],
  );
  useFrameReport(report);
  if (offstage) return null;
  if (loading)
    return (
      <PlotSkeleton kind="dots" name={name} size={size} height={height} className={className} />
    );
  // The points drawn: in a group the legend shows. Others at the same place share its tooltip and card.
  const drawn = sets.filter((s) => !hidden.has(s.key)).flatMap((s) => s.rows);
  const groupOf = (datum: ChartDatum) =>
    groupBy ? sets.find((s) => s.key === String(datum[groupBy])) : sets[0];
  const titleOf = (datum: ChartDatum) => (nameKey ? String(datum[nameKey] ?? "") : t("point"));
  const coincident = (datum: ChartDatum) =>
    drawn.filter((d) => d !== datum && d[x] === datum[x] && d[y] === datum[y]);
  const describe = (datum: ChartDatum) => {
    const group = grouped ? groupOf(datum)?.label : undefined;
    const title = titleOf(datum);
    return t("chartPoint", {
      category: group ? t("chartMarkIn", { group: title, label: group }) : title,
      values: axes
        .flatMap((a) => {
          const v = datum[a.key];
          return v === undefined || v === null
            ? []
            : [t("chartSeriesValue", { label: a.label, value: a.format(v) })];
        })
        .join(", "),
    });
  };
  const axisRows = (datum: ChartDatum) =>
    axes.flatMap((a) => {
      const v = datum[a.key];
      if (v === undefined || v === null) return [];
      return [
        {
          swatch: <span className="size-100 shrink-0" aria-hidden />,
          label: a.label,
          value: a.format(v),
        },
      ];
    });
  const choose = (datum: ChartDatum, at: { cx?: number; cy?: number; size?: number }) => {
    const selection: ScatterSelection = {
      datum,
      group: groupOf(datum)?.source,
      index: data.indexOf(datum),
    };
    onSelect?.(selection);
    const r = z && at.size ? Math.max(4, Math.sqrt(at.size / Math.PI)) : 4;
    if (details)
      pick(
        selection,
        rectAnchor({
          x: (at.cx ?? 0) - r,
          y: (at.cy ?? 0) - r,
          width: r * 2,
          height: r * 2,
        }),
      );
  };
  const others = picked ? coincident(picked.item.datum) : [];
  const card = picked ? (
    <>
      <CardHead
        swatch={
          <Swatch
            color={chartColor(sets.find((s) => s.source === picked.item.group)?.tone ?? tone)}
            shape="dot"
          />
        }
        title={titleOf(picked.item.datum)}
        subtitle={
          picked.item.group ? (picked.item.group.label ?? picked.item.group.key) : undefined
        }
        rows={axisRows(picked.item.datum)}
      />
      {others.length ? (
        // Points that share this one's place: one click away, since only the top one takes a pointer.
        <div className="flex flex-col gap-050">
          <span className="font-body-xsmall text-subtle">{t("chartAlsoHere")}</span>
          <div className="flex flex-wrap gap-050">
            {others.map((d, i) => (
              <Button
                key={i}
                size="small"
                variant="subtle"
                onClick={() =>
                  choose(d, {
                    cx: picked.anchor.x + picked.anchor.width / 2,
                    cy: picked.anchor.y + picked.anchor.height / 2,
                  })
                }
              >
                {titleOf(d)}
              </Button>
            ))}
          </div>
        </div>
      ) : null}
      {details?.(picked.item)}
    </>
  ) : null;
  const ends = (domain: ChartDomain | undefined) =>
    domain ? { domain: [domain[0], domain[1]] as [number | "auto", number | "auto"] } : {};
  const ticksOf = (ticks: readonly number[] | undefined, domain: ChartDomain | undefined) => {
    const list = ticks ? [...ticks] : pinnedTicks(domain);
    return list ? { ticks: list, interval: 0 as const } : {};
  };
  const yWidth = axisWidth(data, [y], formatY ?? format, yDomain, Boolean(yLabel));
  return (
    <Plot
      name={name}
      size={size}
      height={height}
      className={className}
      semantics={chooses ? "wrapper" : "surface"}
      card={card}
      anchor={picked?.anchor}
      onClose={clear}
    >
      <ScatterChart
        margin={{ top: 12, right: 16, bottom: xLabel ? 16 : 0, left: yLabel ? 8 : 0 }}
        // Its points are the tab stops when it chooses; otherwise the svg is an image of the data.
        {...(chooses ? { accessibilityLayer: false } : surfaceProps.chart)}
      >
        <CartesianGrid {...grid} />
        <XAxis
          type="number"
          dataKey={x}
          name={xLabel ?? x}
          tick={<Tick format={(v) => axes[0]?.format(tickValue(v)) ?? String(v)} />}
          axisLine={axisLine}
          tickLine={false}
          height={xLabel ? 36 : 24}
          {...ends(xDomain)}
          {...ticksOf(xTicks, xDomain)}
          {...(xLabel ? { label: axisTitle(xLabel, false) } : {})}
        />
        <YAxis
          type="number"
          dataKey={y}
          name={yLabel ?? y}
          tick={<Tick vertical format={(v) => (formatY ?? format)(tickValue(v))} />}
          axisLine={false}
          tickLine={false}
          width={yWidth}
          {...ends(yDomain)}
          {...ticksOf(yTicks, yDomain)}
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
              groupKey={groupBy}
              groupLabel={(v) => sets.find((s) => s.key === v)?.label}
              others={(d) => coincident(d).map(titleOf)}
              alsoHere={t("chartAlsoHere")}
            />
          }
        />
        {sets.map((s) => (
          <Scatter
            key={s.key}
            name={s.label}
            data={s.rows}
            fill={chartColor(s.tone)}
            shape={
              <Point
                bubble={Boolean(z)}
                clickable={chooses}
                chosen={picked?.item.datum}
                focusable={chooses && Boolean(name)}
                describe={describe}
                hasCard={Boolean(details)}
                onChoose={choose}
              />
            }
            hide={hidden.has(s.key)}
            {...seriesClass(s.key, highlighted, false)}
            {...motion}
            {...(chooses
              ? {
                  onClick: (item: unknown) => {
                    const c = item as Clicked;
                    choose(c.payload, c);
                  },
                }
              : {})}
          />
        ))}
        <References reference={reference} />
        <ReferenceLabels reference={reference} />
      </ScatterChart>
    </Plot>
  );
}

/**
 * A scatter's table twin: one row per point drawn, in the data's order. The point's name and its
 * group lead, then the Frame's columns placed before, a column per axis, and the columns after. The
 * legend's groups are a column of words, not a column each.
 */
function scatterTwin({
  data,
  sets,
  grouped,
  axes,
  nameKey,
  nameLabel,
  groupLabel,
  columns,
  format,
  formatX,
}: {
  data: ChartDatum[];
  sets: Group[];
  grouped: boolean;
  axes: Axis[];
  nameKey: string | undefined;
  nameLabel: string;
  groupLabel: string;
  columns: ChartColumn[] | undefined;
  format: Formatter;
  formatX: CategoryFormatter;
}): ChartTwin {
  // Each drawn point's group, looked up once: a point in no group is not drawn, so not a row.
  const groupOf = new Map<ChartDatum, string>();
  if (grouped) for (const s of sets) for (const d of s.rows) groupOf.set(d, s.label);
  const rows = grouped ? data.filter((d) => groupOf.has(d)) : data;
  const { before, after } = splitColumns(columns);
  return {
    columns: [
      ...(nameKey ? [{ label: nameLabel, numeric: false }] : []),
      ...(grouped ? [{ label: groupLabel, numeric: false }] : []),
      ...before.map((c) => extraColumn(rows, c)),
      ...axes.map((a) => ({ label: a.label, numeric: true })),
      ...after.map((c) => extraColumn(rows, c)),
    ],
    rows: rows.map((d, i) => {
      const title = nameKey ? String(d[nameKey] ?? "") : "";
      const group = groupOf.get(d) ?? "";
      return {
        key: String(i),
        cells: [
          ...(nameKey ? [{ text: title, csv: title }] : []),
          ...(grouped ? [{ text: group, csv: group }] : []),
          ...before.map((c) => extraCell(d, c, format, formatX)),
          ...axes.map((a) => {
            const v = d[a.key];
            return { text: a.format(v), csv: raw(v) };
          }),
          ...after.map((c) => extraCell(d, c, format, formatX)),
        ],
      };
    }),
  };
}

/** A point's tooltip: its name and group, then each axis as name and value, then any other point at the same place. */
function ScatterTooltip({
  active,
  payload,
  axes,
  nameKey,
  groupKey,
  groupLabel,
  others,
  alsoHere,
}: {
  active?: boolean | undefined;
  payload?: { payload?: ChartDatum; color?: string }[] | undefined;
  axes: Axis[];
  nameKey?: string | undefined;
  groupKey?: string | undefined;
  groupLabel: (v: string) => string | undefined;
  others: (datum: ChartDatum) => string[];
  alsoHere: string;
}) {
  const first = payload?.[0];
  const datum = first?.payload;
  if (!active || !datum) return null;
  const title = nameKey ? datum[nameKey] : undefined;
  const group = groupKey ? groupLabel(String(datum[groupKey])) : undefined;
  const here = others(datum);
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
      {axes.map((a) => {
        const v = datum[a.key];
        if (v === undefined || v === null) return null;
        return (
          <div key={a.key} className="flex items-center gap-100 font-body-small">
            <span className="min-w-0 flex-1 truncate text-subtle">{a.label}</span>
            <span className="tabular-nums font-medium text-default">{a.format(v)}</span>
          </div>
        );
      })}
      {here.length ? (
        <div className="flex flex-col gap-025 pt-050 font-body-small">
          <span className="text-subtle">{alsoHere}</span>
          <span className="text-default">{here.join(", ")}</span>
        </div>
      ) : null}
    </div>
  );
}
