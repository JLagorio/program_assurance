import { useLedgerLocale } from "../../lib/locale";
import { Popover as PopoverPrimitive } from "@base-ui/react/popover";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ComponentProps,
  type KeyboardEvent,
  type ReactNode,
  type RefObject,
} from "react";
import {
  DefaultZIndexes,
  Line,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  useActiveTooltipCoordinate,
  useActiveTooltipLabel,
  usePlotArea,
  useXAxisScale,
  useYAxisScale,
  ZIndexLayer,
} from "recharts";

import { token, tokenValue, type TokenName } from "../../generated/tokens";
import { cn } from "../../lib/cn";
import type { Tone } from "../../components/badge";
import { Popover } from "../../components/popover";

/*
 * The furniture every chart part shares, internal to this folder: the tones and the scales, the data
 * types, the Frame's context, the ticks, the swatches, the textures, the time axis, the tooltip, the
 * references and the bands, the plot wrapper with its focus ring and its details card, the motion,
 * the export helpers and the skeletons. A part is one file beside this one; nothing here is exported
 * from the package except through them.
 */

/* ---------- tones and scales ---------- */

/** A status tone, `brand`, `neutral`, or one of the six categorical hues; `categorical.7` is Other. */
export type ChartTone = Tone | "brand" | `categorical.${1 | 2 | 3 | 4 | 5 | 6 | 7}`;

/** The plot's height: `small` 120px for a rail or a cell, `medium` 200px for a section, `large` 320px for the one chart a page is about. */
export type ChartSize = "small" | "medium" | "large";

export const heights: Record<ChartSize, number> = { small: 120, medium: 200, large: 320 };

/** The var() for a chart tone, for anything recharts does not cover. */
export const chartColor = (tone: ChartTone): string => token(`color.chart.${tone}` as TokenName);

/** The tone's hovered step: one darker in light, one lighter in dark. */
export const hoveredColor = (tone: ChartTone): string =>
  token(`color.chart.${tone}.hovered` as TokenName);

/** The tone of the i-th series (from 0) when none is given: the six hues in order, then Other. */
export const categoricalTone = (i: number): ChartTone =>
  i < 6 ? (`categorical.${(i + 1) as 1 | 2 | 3 | 4 | 5 | 6}` as ChartTone) : "categorical.7";

export const sequentialColor = (step: 1 | 2 | 3 | 4 | 5) => token(`color.chart.sequential.${step}`);
export const divergingColor = (
  step: "negative.bold" | "negative" | "midpoint" | "positive" | "positive.bold",
) => token(`color.chart.diverging.${step}` as TokenName);

const compactFormat = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});
const plainFormat = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });

/** The default number format: grouped, two decimals at most, compact from ten thousand (12.4K). */
export function formatNumber(value: number): string {
  return Math.abs(value) >= 10000 ? compactFormat.format(value) : plainFormat.format(value);
}

/* ---------- data ---------- */

/** One record along the category axis. A value may be a `[from, to]` pair for a floating bar, or a Date on a time axis. */
export type ChartDatum = Record<
  string,
  string | number | Date | null | undefined | readonly [number, number]
>;

export type ChartValue = ChartDatum[string];

export type Formatter = (value: number) => string;
export type CategoryFormatter = (value: string | number | Date) => string;

export type ChartSeries = {
  /** The key in each datum. */
  key: string;
  /** What the legend, the tooltip and the table call it. Defaults to the key. */
  label?: string | undefined;
  /** The `color.chart.*` token. Defaults to the categorical set, in order. */
  tone?: ChartTone | undefined;
  /** This series' own number format, when it differs from the plot's: a rate over counts. */
  format?: Formatter | undefined;
};

/** A line across the plot: a target, a limit, a milestone. `y` is on the value axis, `x` on the category axis. */
export type ChartReference = {
  y?: number | undefined;
  x?: string | number | Date | undefined;
  /** Printed at the line's end. */
  label?: string | undefined;
  /** `neutral` when unsaid: a target is context. `danger` for a limit that must not be crossed. */
  tone?: ChartTone | undefined;
};

/** A band across the plot: between two values (`from`, `to`), or between two categories or dates (`fromX`, `toX`): the acceptable range, the plan's tolerance, an assessment window. */
export type ChartBand = {
  from?: number | undefined;
  to?: number | undefined;
  fromX?: string | number | Date | undefined;
  toX?: string | number | Date | undefined;
  label?: string | undefined;
  /** `neutral` when unsaid. */
  tone?: ChartTone | undefined;
};

/** The value axis: each end a number or `"auto"`. `[0, "auto"]` when unsaid; a plot with negative values reaches below zero. Set it on every chart of a set so they share a scale. */
export type ChartDomain = readonly [number | "auto", number | "auto"];

/** What was chosen on a cartesian plot: the record, the series when a mark was clicked (none when the whole category was chosen with Enter), and the record's index. */
/** A column for the table twin and the CSV beyond the series: a fact the plot does not draw. */
export type ChartColumn = {
  /** The key in each datum. */
  key: string;
  /** What the table calls it. Defaults to the key. */
  label?: string | undefined;
  /** How a value prints in the table. A number takes the plot's format when unsaid; text prints as it is. The CSV keeps numbers raw. */
  format?: ((value: ChartValue, datum: ChartDatum) => string) | undefined;
  /** `before` sets the column between the category and the series, for a name that belongs beside the category. After the series when unsaid. */
  place?: "before" | "after" | undefined;
};

/** The columns that sit before the series, and after. */
export const splitColumns = (columns: ChartColumn[] | undefined) => ({
  before: columns?.filter((c) => c.place === "before") ?? [],
  after: columns?.filter((c) => c.place !== "before") ?? [],
});

/** A column's text for one datum: its own format, else the plot's for a number, a range as "a–b", a date as a category. */
export function columnText(
  datum: ChartDatum,
  column: ChartColumn,
  format: Formatter,
  formatX: CategoryFormatter,
): string {
  const v = datum[column.key];
  if (column.format) return column.format(v, datum);
  if (typeof v === "number") return format(v);
  if (isRange(v)) return `${format(v[0])}–${format(v[1])}`;
  if (v instanceof Date) return formatX(v);
  return v == null ? "" : String(v);
}

export type ChartSelection = {
  datum: ChartDatum;
  series?: ChartSeries | undefined;
  index: number;
};

export const isRange = (v: unknown): v is readonly [number, number] =>
  Array.isArray(v) && v.length === 2 && typeof v[0] === "number" && typeof v[1] === "number";

export const formatValue = (v: unknown, format: Formatter): string => {
  if (typeof v === "number") return format(v);
  if (isRange(v)) return `${format(v[0])}–${format(v[1])}`;
  if (v === null || v === undefined) return "";
  if (v instanceof Date) return fullDate(v.getTime());
  return String(v);
};

const isoDate = /^\d{4}-\d{2}-\d{2}(T|$)/;

/** The default category format: a Date or an ISO date string as "4 Sep 2026", anything else as it is. */
export const formatCategory: CategoryFormatter = (v) => {
  if (v instanceof Date) return fullDate(v.getTime());
  if (typeof v === "string" && isoDate.test(v)) return fullDate(new Date(v).getTime());
  return String(v);
};

/** Whether any series in the data goes below zero, so the axis and the baseline must too. */
export const hasNegative = (data: ChartDatum[], keys: string[]) =>
  data.some((d) =>
    keys.some((k) => {
      const v = d[k];
      return typeof v === "number" ? v < 0 : isRange(v) ? v[0] < 0 || v[1] < 0 : false;
    }),
  );

type AxisEnd = number | "auto" | "dataMin" | "dataMax" | ((n: number) => number);

/** The value axis' domain: the caller's, else cropped to the data, else from zero (and through zero when the data goes below it). */
export const valueDomain = (
  domain: ChartDomain | undefined,
  baseline: "zero" | "auto",
  negative: boolean,
): [AxisEnd, AxisEnd] => {
  if (domain) return [domain[0], domain[1]];
  if (baseline === "auto") return ["auto", "auto"];
  if (negative) return [(min: number) => Math.min(0, min), (max: number) => Math.max(0, max)];
  return [0, "auto"];
};

/** A tick's value without floating-point noise, so a caller's format sees −0.75 and not −0.7500000000000001. */
export const tickValue = (v: unknown): number => Number(Number(v).toPrecision(12));

/** The value axis' width from its longest label: the extremes of the data (or the domain) formatted, 6.5px a character, 40px at least. */
export const axisWidth = (
  data: ChartDatum[],
  keys: string[],
  format: Formatter,
  domain: ChartDomain | undefined,
  titled: boolean,
): number => {
  const values = data.flatMap((d) =>
    keys.flatMap((k) => {
      const v = d[k];
      return typeof v === "number" ? [v] : isRange(v) ? [v[0], v[1]] : [];
    }),
  );
  const ends = [
    typeof domain?.[0] === "number" ? domain[0] : Math.min(0, ...values),
    typeof domain?.[1] === "number" ? domain[1] : Math.max(0, ...values),
  ];
  const longest = Math.max(1, ...ends.map((v) => format(v).length));
  return Math.min(120, Math.max(40, 10 + 6.5 * longest)) + (titled ? 12 : 0);
};

/* ---------- the time axis ---------- */

export const toMs = (v: unknown): number =>
  v instanceof Date ? v.getTime() : typeof v === "number" ? v : new Date(String(v)).getTime();

const DAY = 86_400_000;
export const fullDate = (ms: number) =>
  new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(ms);

/** Chart defaults share the provider's locale; explicit component formatters still win. */
export function useChartFormat() {
  const locale = useLedgerLocale();
  return useMemo(
    () => ({
      format: (value: number) =>
        locale.formatNumber(
          value,
          Math.abs(value) >= 10000
            ? { notation: "compact", maximumFractionDigits: 1 }
            : { maximumFractionDigits: 2 },
        ),
      category: (value: string | number | Date) =>
        value instanceof Date || (typeof value === "string" && isoDate.test(value))
          ? locale.formatDate(value instanceof Date ? value : new Date(value), {
              day: "numeric",
              month: "short",
              year: "numeric",
              ...(typeof value === "string" && value.length === 10 ? { timeZone: "UTC" } : {}),
            })
          : String(value),
    }),
    [locale],
  );
}

/** The ticks of a time axis and their labels: hours, days, months or years, by the span, at most eight, each at a unit's start. */
export function timeTicks(
  min: number,
  max: number,
  locale = "en-US",
  timeZone = "UTC",
): { ticks: number[]; tick: (ms: number) => string; full: (ms: number) => string } {
  const dateFormat = (options: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat(locale, { timeZone, ...options });
  const dayFmt = dateFormat({ day: "numeric", month: "short" });
  const monthFmt = dateFormat({ month: "short" });
  const monthYearFmt = dateFormat({ month: "short", year: "2-digit" });
  const yearFmt = dateFormat({ year: "numeric" });
  const hourFmt = dateFormat({ hour: "numeric", minute: "2-digit" });
  const fullFmt = dateFormat({ day: "numeric", month: "short", year: "numeric" });
  const fullTimeFmt = dateFormat({
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
  const fullDate = (ms: number) => fullFmt.format(ms);
  const span = Math.max(1, max - min);
  const days = span / DAY;
  const ticks: number[] = [];
  if (days <= 3) {
    const stepH = days <= 0.5 ? 1 : days <= 1 ? 3 : days <= 2 ? 6 : 12;
    const d = new Date(min);
    d.setUTCMinutes(0, 0, 0);
    d.setUTCHours(Math.ceil(d.getUTCHours() / stepH) * stepH);
    for (let t = d.getTime(); t <= max; t += stepH * 3_600_000) ticks.push(t);
    return { ticks, tick: (ms) => hourFmt.format(ms), full: (ms) => fullTimeFmt.format(ms) };
  }
  if (days <= 62) {
    const step = days <= 8 ? 1 : days <= 16 ? 2 : days <= 40 ? 7 : 14;
    const d = new Date(min);
    d.setUTCHours(0, 0, 0, 0);
    if (d.getTime() < min) d.setUTCDate(d.getUTCDate() + 1);
    for (let t = d.getTime(); t <= max; t += step * DAY) ticks.push(t);
    return { ticks, tick: (ms) => dayFmt.format(ms), full: fullDate };
  }
  if (days <= 800) {
    const months = days / 30.4;
    const step = months <= 8 ? 1 : months <= 16 ? 2 : 3;
    const d = new Date(min);
    d.setUTCHours(0, 0, 0, 0);
    d.setUTCDate(1);
    if (d.getTime() < min) d.setUTCMonth(d.getUTCMonth() + 1);
    for (; d.getTime() <= max; d.setUTCMonth(d.getUTCMonth() + step)) ticks.push(d.getTime());
    const crossesYear = new Date(min).getUTCFullYear() !== new Date(max).getUTCFullYear();
    return {
      ticks,
      tick: (ms) =>
        crossesYear && new Date(ms).getUTCMonth() === 0
          ? monthYearFmt.format(ms)
          : monthFmt.format(ms),
      full: fullDate,
    };
  }
  const years = days / 365;
  const step = years <= 8 ? 1 : years <= 16 ? 2 : 5;
  const d = new Date(min);
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCMonth(0, 1);
  if (d.getTime() < min) d.setUTCFullYear(d.getUTCFullYear() + 1);
  for (; d.getTime() <= max; d.setUTCFullYear(d.getUTCFullYear() + step)) ticks.push(d.getTime());
  return { ticks, tick: (ms) => yearFmt.format(ms), full: fullDate };
}

/** The rows of a plot on a time axis: the category as epoch milliseconds, with the ticks and formats the axis needs. */
export function useTimeAxis(data: ChartDatum[], x: string, time: boolean) {
  const { locale, timeZone } = useLedgerLocale();
  return useMemo(() => {
    if (!time) return null;
    const rows = data.map((d) => ({ ...d, [x]: toMs(d[x]) }));
    const values = rows.map((r) => r[x] as number).filter((n) => Number.isFinite(n));
    const min = Math.min(...values);
    const max = Math.max(...values);
    return { rows, min, max, ...timeTicks(min, max, locale, timeZone) };
  }, [data, x, time, locale, timeZone]);
}

/* ---------- the frame's state ---------- */

export type FrameState = {
  name: string | undefined;
  hidden: ReadonlySet<string>;
  highlighted: string | null;
  highlight: (key: string | null) => void;
  toggle: (key: string) => void;
  format: Formatter | undefined;
  formatX: CategoryFormatter | undefined;
  loading: boolean;
  /** Charts with the same id share their hover: the tooltip moves on all of them. */
  sync: string | undefined;
  /** Every series wears a pattern as well as its colour. */
  texture: boolean;
  /** The Frame's records, category key and series: what a Bar, Line or Area inside draws when it is given none. */
  data: ChartDatum[] | undefined;
  x: string | undefined;
  series: ChartSeries[] | undefined;
  /** The Frame's plot size, for a part that sets neither `size` nor `height`. */
  size: ChartSize | undefined;
  height: number | undefined;
  /** The Frame is the expanded copy in its Dialog: every plot inside draws at `large`. */
  expanded: boolean;
  /** The reader pressed Values: a colour-scale Heatmap prints its values. */
  values: boolean;
  /** The table twin stands in for the plot: a part keeps reporting to the Frame and draws nothing. */
  offstage: boolean;
};

export const FrameContext = createContext<FrameState | null>(null);
export const none: ReadonlySet<string> = new Set();

/* ---------- what a part reports to its Frame ---------- */

/** One column of a table twin: its heading, and whether it holds numbers (set to the end, tabular). */
export type TwinColumn = { label: string; numeric: boolean };

/** One row of a table twin: each cell's text in the table and its value in the CSV (numbers raw). */
export type TwinRow = { key: string; cells: { text: string; csv: string }[] };

/** The same numbers as the plot, laid out as a table: what the Frame's Table toggle shows and its CSV holds. */
export type ChartTwin = { columns: TwinColumn[]; rows: TwinRow[] };

/** What the Frame lends a kind's table builder: its category heading and its extra columns. */
export type TwinOptions = { xLabel: string | undefined; columns: ChartColumn[] | undefined };

/**
 * How a part's numbers become a table. `category` is records along a category axis (Bar, Line,
 * Area): the Frame lays it out, with its own `data`, `x`, `series`, `xLabel` and `columns` winning.
 * `custom` is a kind's own shape (points, slices, leaves, a grid), built when the table shows.
 */
export type TwinSource =
  | {
      kind: "category";
      data: ChartDatum[];
      x: string;
      series: ChartSeries[];
      xLabel?: string | undefined;
    }
  | { kind: "custom"; build: (options: TwinOptions) => ChartTwin };

/**
 * What a part tells the Frame around it, so the legend, the table twin, the CSV and the states
 * follow the plot: its keyed series and their swatch, the formats it draws with, its height, its
 * table, and whether it can print its values. The Frame's own props win over every field.
 */
export type FrameReport = {
  series?: ChartSeries[] | undefined;
  swatch?: SwatchShape | undefined;
  format?: Formatter | undefined;
  formatX?: CategoryFormatter | undefined;
  height?: number | undefined;
  table?: TwinSource | undefined;
  values?: boolean | undefined;
};

/** How a part reaches the Frame around it: `report` says what it draws; `mount` counts it in while it is mounted and returns the way out. */
export type FrameRegistry = {
  report: (report: FrameReport) => void;
  mount: () => () => void;
};

export const FrameReportContext = createContext<FrameRegistry | null>(null);

/** Two reports that would lay the Frame out the same. */
export const sameReport = (a: FrameReport, b: FrameReport) =>
  a.series === b.series &&
  a.swatch === b.swatch &&
  a.format === b.format &&
  a.formatX === b.formatX &&
  a.height === b.height &&
  a.table === b.table &&
  a.values === b.values;

/**
 * Tells the Frame around the part what it draws, before the browser paints, whenever it changes.
 * Memoize the report: a new object each render reports again. The part counts itself in while it
 * is mounted, so a part the caller removes takes its legend and table with it. Outside a Frame it
 * does nothing.
 */
export function useFrameReport(report: FrameReport) {
  const registry = useContext(FrameReportContext);
  useLayoutEffect(() => registry?.mount(), [registry]);
  useLayoutEffect(() => {
    registry?.report(report);
  }, [registry, report]);
}

const noData: ChartDatum[] = [];
const noSeries: ChartSeries[] = [];

/** The records a category part draws: its own, else the Frame's. */
export function useFrameData(
  data: ChartDatum[] | undefined,
  x: string | undefined,
  series: ChartSeries[] | undefined,
) {
  const frame = useContext(FrameContext);
  return {
    data: data ?? frame?.data ?? noData,
    x: x ?? frame?.x ?? "",
    series: series ?? frame?.series ?? noSeries,
  };
}

/**
 * The plot's size: its own `size` or `height`, else the Frame's; `large` in the expanded Dialog,
 * whatever the part says, so Expand redraws the plot at the size a page's one chart takes.
 */
export function usePlotSize(size: ChartSize | undefined, height: number | undefined) {
  const frame = useContext(FrameContext);
  if (frame?.expanded) return { size: "large" as ChartSize, height: undefined };
  if (size !== undefined || height !== undefined) return { size, height };
  return { size: frame?.size, height: frame?.height };
}

/** Whether a column of the datum holds a number anywhere, so it sits to the end. */
const numericColumn = (data: ChartDatum[], c: ChartColumn) =>
  data.some((d) => typeof d[c.key] === "number");

/** An extra column's heading, for a twin. */
export const extraColumn = (data: ChartDatum[], c: ChartColumn): TwinColumn => ({
  label: c.label ?? c.key,
  numeric: numericColumn(data, c),
});

/** An extra column's cell: its text by `columnText`, and in the CSV a number raw or the column's own format. */
export const extraCell = (
  d: ChartDatum,
  c: ChartColumn,
  format: Formatter,
  formatX: CategoryFormatter,
) => {
  const v = d[c.key];
  return {
    text: columnText(d, c, format, formatX),
    csv: typeof v === "number" || !c.format ? raw(v) : c.format(v, d),
  };
};

/** The twin of a category plot: the category, the columns before the series, a column per series, the columns after. */
export function categoryTwin({
  data,
  x,
  xLabel,
  series,
  columns,
  format,
  formatX,
}: {
  data: ChartDatum[];
  x: string;
  xLabel: string;
  series: ChartSeries[];
  columns: ChartColumn[] | undefined;
  format: Formatter;
  formatX: CategoryFormatter;
}): ChartTwin {
  const { before, after } = splitColumns(columns);
  return {
    columns: [
      { label: xLabel, numeric: false },
      ...before.map((c) => extraColumn(data, c)),
      ...series.map((s) => ({ label: s.label ?? s.key, numeric: true })),
      ...after.map((c) => extraColumn(data, c)),
    ],
    rows: data.map((d, i) => {
      const category = formatX((d[x] as string | number | Date | undefined) ?? "");
      return {
        key: String(i),
        cells: [
          { text: category, csv: category },
          ...before.map((c) => extraCell(d, c, format, formatX)),
          ...series.map((s) => ({
            text: formatValue(d[s.key], s.format ?? format),
            csv: raw(d[s.key]),
          })),
          ...after.map((c) => extraCell(d, c, format, formatX)),
        ],
      };
    }),
  };
}

/** What a plot inherits from the Frame around it: its name, the legend's state, the formats, whether it is loading, its sync and its textures, and whether it is expanded or stands aside for the table. Its data and size come from `useFrameData` and `usePlotSize`. */
export function useFrame(
  label: string | undefined,
  format: Formatter | undefined,
  formatX: CategoryFormatter | undefined,
  loading?: boolean | undefined,
  syncId?: string | undefined,
  texture?: boolean | undefined,
) {
  const defaults = useChartFormat();

  const frame = useContext(FrameContext);
  const highlighted = frame?.highlighted ?? null;
  return {
    name: label ?? frame?.name,
    hidden: frame?.hidden ?? none,
    // A series just hidden from the legend is still under the pointer; it must not dim the rest.
    highlighted: highlighted !== null && frame?.hidden.has(highlighted) ? null : highlighted,
    format: format ?? frame?.format ?? defaults.format,
    formatX: formatX ?? frame?.formatX ?? defaults.category,
    loading: loading ?? frame?.loading ?? false,
    sync: syncId ?? frame?.sync,
    texture: texture ?? frame?.texture ?? false,
    /** The table twin stands in for the plot: the part reports and draws nothing. */
    offstage: frame?.offstage ?? false,
    /** In the expanded Dialog. */
    expanded: frame?.expanded ?? false,
  };
}

/** The `syncId` prop for a recharts chart, when the plot is synced. */
export const syncProp = (sync: string | undefined) => (sync ? { syncId: sync } : {});

export const useInFrame = () => useContext(FrameContext) !== null;

/** The class a series takes from the legend: dimmed when another is highlighted, a pointer when it clicks. */
export const seriesClass = (
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

/** The class a mark takes from a choice: dimmed when another mark is chosen. */
export const markClass = (chosen: boolean | null): { className: string } | Record<never, never> =>
  chosen === false ? { className: "opacity-disabled" } : {};

/* ---------- textures ---------- */

/** A pattern a series wears as well as its colour, so a stack reads in print, under colour-vision loss and in a forced-colours mode. `solid` is none. */
export type Texture = "solid" | "hatch" | "hatch-back" | "dots" | "cross" | "lines" | "columns";

const textureOrder: Texture[] = [
  "solid",
  "hatch",
  "hatch-back",
  "dots",
  "cross",
  "lines",
  "columns",
];

/** The texture of the i-th series: the first solid, then the six patterns in order. */
export const textureOf = (i: number): Texture => textureOrder[i % textureOrder.length] ?? "solid";

/** The fill of a textured series: its pattern's url, or its colour when solid. */
export const textureFill = (id: string, key: string, texture: Texture, color: string) =>
  texture === "solid" ? color : `url(#${id}-${key})`;

function PatternMarks({ texture, color }: { texture: Texture; color: string }) {
  const stroke = { stroke: color, strokeWidth: 1.5, strokeLinecap: "round" as const };
  switch (texture) {
    case "hatch":
      return <path d="M-2,10 L10,-2 M-2,2 L2,-2 M6,10 L10,6" {...stroke} />;
    case "hatch-back":
      return <path d="M-2,-2 L10,10 M6,-2 L10,2 M-2,6 L2,10" {...stroke} />;
    case "dots":
      return <circle cx={4} cy={4} r={1.6} fill={color} />;
    case "cross":
      return <path d="M-2,10 L10,-2 M-2,-2 L10,10" {...stroke} />;
    case "lines":
      return <path d="M0,4 L8,4" {...stroke} />;
    case "columns":
      return <path d="M4,0 L4,8" {...stroke} />;
    default:
      return null;
  }
}

/** The pattern of one textured series: the colour at 30% under the marks in the colour, 8px across. */
function Pattern({ id, texture, color }: { id: string; texture: Texture; color: string }) {
  return (
    <pattern id={id} width={8} height={8} patternUnits="userSpaceOnUse">
      <rect width={8} height={8} fill={color} fillOpacity={0.3} />
      <PatternMarks texture={texture} color={color} />
    </pattern>
  );
}

/** The defs a chart needs for its textured series, inside the svg. */
export function TextureDefs({
  id,
  entries,
}: {
  id: string;
  entries: { key: string; color: string; texture: Texture }[];
}) {
  return (
    <defs>
      {entries.map((e) =>
        e.texture === "solid" ? null : (
          <Pattern key={e.key} id={`${id}-${e.key}`} texture={e.texture} color={e.color} />
        ),
      )}
    </defs>
  );
}

/** A textured swatch for a legend or a card: the pattern in its own small svg. */
export function TextureSwatch({ texture, color }: { texture: Texture; color: string }) {
  const id = useId();
  return (
    <svg aria-hidden width={12} height={12} className="shrink-0 rounded-xsmall">
      <defs>
        <Pattern id={id} texture={texture} color={color} />
      </defs>
      <rect width={12} height={12} rx={2} fill={texture === "solid" ? color : `url(#${id})`} />
    </svg>
  );
}

/* ---------- motion ---------- */

const reducedQuery = "(prefers-reduced-motion: reduce)";
const subscribeReduced = (cb: () => void) => {
  if (typeof window === "undefined") return () => {};
  const q = window.matchMedia(reducedQuery);
  q.addEventListener("change", cb);
  return () => q.removeEventListener("change", cb);
};
const readReduced = () => typeof window !== "undefined" && window.matchMedia(reducedQuery).matches;

/** Whether the reader asked for less motion. */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribeReduced, readReduced, () => false);
}

const readToken = (name: TokenName, fallback: string) => {
  if (typeof document === "undefined") return fallback;
  return tokenValue(name) || fallback;
};

/** Recharts types its easing as a few names, and parses a `cubic-bezier()` too; the token's curve is cast to pass. */
type Easing = NonNullable<ComponentProps<typeof Line>["animationEasing"]>;

export type Motion = {
  isAnimationActive: boolean;
  animationDuration: number;
  animationEasing: Easing;
  animationBegin: number;
};

/**
 * Recharts' animation props on the motion tokens: marks arrive over `motion.duration.slow` on the
 * standard curve, and a change of data moves them the same way. Under reduced motion they draw in place.
 */
export function useMotion(): Motion {
  const off = useReducedMotion();
  return useMemo(
    () => ({
      isAnimationActive: !off,
      animationDuration: parseInt(readToken("motion.duration.slow", "400ms"), 10) || 400,
      animationEasing: readToken(
        "motion.easing.standard",
        "cubic-bezier(0.2, 0, 0.2, 1)",
      ) as Easing,
      animationBegin: 0,
    }),
    [off],
  );
}

/** The tooltip follows the pointer over `motion.duration.fast`. */
export function useTooltipMotion() {
  const off = useReducedMotion();
  return useMemo(
    () => ({
      isAnimationActive: !off,
      animationDuration: parseInt(readToken("motion.duration.fast", "120ms"), 10) || 120,
      animationEasing: "ease-out" as const,
    }),
    [off],
  );
}

/* ---------- the shared furniture ---------- */

export const surface = () => token("elevation.surface");
export const grid = { stroke: token("color.border"), strokeDasharray: "0" };
export const axisLine = { stroke: token("color.border") };
export const cursorFill = { fill: token("color.background.neutral.subtle.hovered") };
export const cursorLine = { stroke: token("color.border.bold"), strokeWidth: 1 };
/** A marker: 8px across, ringed in the surface so it stays legible over a line. */
export const marker = (fill: string) => ({ r: 4, strokeWidth: 2, stroke: surface(), fill });

export const truncate = (text: string, max: number) =>
  text.length > max ? `${text.slice(0, max - 1)}…` : text;

/** The plot's margin. The top grows for end labels or a labelled reference or band, the right for end labels. */
export const marginFor = ({
  endLabels,
  refLabels,
  horizontal,
}: {
  endLabels?: boolean | undefined;
  refLabels?: boolean | undefined;
  horizontal?: boolean | undefined;
}) => ({
  top: endLabels || refLabels ? 16 : 8,
  right: endLabels ? (horizontal ? 40 : 44) : 12,
  bottom: 0,
  left: 0,
});

export const hasRefLabels = (
  reference: ChartReference[] | undefined,
  bands?: ChartBand[] | undefined,
) =>
  Boolean(reference?.some((r) => r.label)) ||
  Boolean(bands?.some((b) => b.label && b.fromX !== undefined));

/** The zero line, drawn when the data goes below zero, so the baseline still reads. */
export function ZeroLine({ horizontal }: { horizontal?: boolean | undefined }) {
  return (
    <ReferenceLine
      {...(horizontal ? { x: 0 } : { y: 0 })}
      stroke={token("color.border.bold")}
      strokeWidth={1}
    />
  );
}

/** An axis tick in `font.body.xsmall` and `color.text.subtlest`. A long category is cut with its whole in a title. */
export function Tick({
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

/** An axis title in `font.body.xsmall` and `color.text.subtle`. */
export const axisTitle = (value: string, vertical: boolean) => ({
  value,
  ...(vertical
    ? { angle: -90, position: "insideLeft" as const, offset: 4 }
    : { position: "insideBottom" as const, offset: -2 }),
  className: "font-body-xsmall",
  fill: token("color.text.subtle"),
});

export type SwatchShape = "square" | "line" | "dot";

/** The key beside a name: a square for a fill, a stroke for a line, a dot for a point; a pattern when the series is textured. */
export function Swatch({
  color,
  shape,
  hollow,
  texture,
}: {
  color: string;
  shape: SwatchShape;
  hollow?: boolean | undefined;
  texture?: Texture | undefined;
}) {
  if (texture && texture !== "solid" && !hollow && shape === "square")
    return <TextureSwatch texture={texture} color={color} />;
  if (shape === "line")
    return (
      // Hollow, the stroke is an outline, as a hollow square is: the series is hidden.
      <span
        aria-hidden
        className={cn(
          "inline-block w-150 shrink-0 rounded-xsmall",
          hollow ? "h-050 border" : "h-025",
        )}
        style={hollow ? { borderColor: color } : { backgroundColor: color }}
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

/** The overlay surface a tooltip and a details card share. */
export const overlay =
  "rounded-medium border border-default bg-surface-overlay px-150 py-100 shadow-overlay";

/** The change from the previous point, signed, in the series' format: "+3", "−2", "0". */
export const deltaText = (value: unknown, previous: unknown, format: Formatter): string | null => {
  if (typeof value !== "number" || typeof previous !== "number") return null;
  const d = value - previous;
  if (d === 0) return "±0";
  return `${d > 0 ? "+" : "−"}${format(Math.abs(d))}`;
};

/** The tooltip: the category, then every series at that point, the value leading, keyed by a swatch shaped like the mark. A stack adds its total; a trend adds each change from the point before. */
export function TooltipContent({
  active,
  payload,
  label,
  series,
  swatch,
  format,
  formatX,
  targetKey,
  total,
  data,
  x,
  delta,
  textures,
}: {
  active?: boolean | undefined;
  payload?: TooltipRow[] | undefined;
  label?: string | number | undefined;
  series: ChartSeries[];
  swatch: SwatchShape;
  format: Formatter;
  formatX: CategoryFormatter;
  targetKey?: string | undefined;
  /** Print the sum of the rows under them: for a stack, parts of a whole. */
  total?: boolean | undefined;
  /** The rows and the category key, so a change from the previous point can be printed. */
  data?: ChartDatum[] | undefined;
  x?: string | undefined;
  delta?: boolean | undefined;
  /** The texture per series key, for the swatches. */
  textures?: Record<string, Texture> | undefined;
}) {
  const { t } = useLedgerLocale();

  if (!active || !payload?.length) return null;
  const rows = payload.filter((p) => p.value !== null && p.value !== undefined);
  if (!rows.length) return null;
  const fmt = (key: string) => series.find((s) => s.key === key)?.format ?? format;
  const sum = total
    ? rows.reduce(
        (n, p) =>
          typeof p.value === "number" && String(p.dataKey) !== targetKey ? n + p.value : n,
        0,
      )
    : null;
  const previous =
    delta && data && x && label !== undefined
      ? data[data.findIndex((d) => d[x] === label || toMs(d[x]) === label) - 1]
      : undefined;
  return (
    <div className={cn("min-w-0", overlay)}>
      {label !== undefined && label !== "" ? (
        <div className="pb-050 font-body-small font-medium text-default">{formatX(label)}</div>
      ) : null}
      <div className={cn("flex flex-col gap-025", sum !== null && rows.length > 1 && "pb-050")}>
        {rows.map((p, i) => {
          const key = String(p.dataKey ?? "");
          const s = series.find((r) => r.key === key);
          const isTarget = targetKey !== undefined && key === targetKey;
          const name = isTarget ? t("target") : (s?.label ?? s?.key ?? p.name ?? key);
          const change = previous ? deltaText(p.value, previous[key], fmt(key)) : null;
          return (
            <div key={i} className="flex items-center gap-100 font-body-small">
              <Swatch
                color={isTarget ? token("color.text") : (p.color ?? "")}
                shape={isTarget ? "line" : swatch}
                texture={textures?.[key]}
              />
              <span className="min-w-0 flex-1 truncate text-subtle">{name}</span>
              {change ? <span className="tabular-nums text-subtlest">{change}</span> : null}
              <span className="tabular-nums font-medium text-default">
                {formatValue(p.value, fmt(key))}
              </span>
            </div>
          );
        })}
      </div>
      {sum !== null && rows.length > 1 ? (
        <div className="flex items-center gap-100 border-t border-default pt-050 font-body-small">
          <span className="size-100 shrink-0" aria-hidden />
          <span className="min-w-0 flex-1 truncate text-subtle">Total</span>
          <span className="tabular-nums font-medium text-default">{format(sum)}</span>
        </div>
      ) : null}
    </div>
  );
}

/** Whether a reference draws as a vertical line: on the category axis of a column chart, on the value axis of a horizontal one. */
const isVertical = (r: ChartReference, horizontal: boolean | undefined) =>
  horizontal ? r.y !== undefined : r.y === undefined;

/** Whether a band runs across categories or dates, so its label sits above the plot. */
const isAcross = (b: ChartBand) => b.fromX !== undefined || b.toX !== undefined;

let measureContext: CanvasRenderingContext2D | null | undefined;
/** A label's width in `font.body.xsmall`, measured, or estimated where there is no canvas. */
const labelWidth = (text: string) => {
  if (measureContext === undefined && typeof document !== "undefined")
    measureContext = document.createElement("canvas").getContext("2d");
  if (!measureContext) return text.length * 6.5;
  measureContext.font = tokenValue("font.body.xsmall");
  return measureContext.measureText(text).width;
};

type TopLabel = {
  key: string;
  text: string;
  /** Where it belongs: a line's x, or a band's middle. */
  at: number;
  /** The mark's extent: a line's x at both ends, a band's two ends. */
  from: number;
  to: number;
  width: number;
  weight: number;
  /** The whole text, when `text` is shortened. */
  full?: string | undefined;
};

/** The fewest characters a shortened label keeps; a label with room for fewer drops out. */
const MIN_CHARACTERS = 3;

/** The longest cut of a label, with an ellipsis and the whole kept in `full`, that `fits`; null when none that keeps `MIN_CHARACTERS` does. */
function longestCut(label: TopLabel, fits: (cut: TopLabel) => boolean): TopLabel | null {
  const full = label.full ?? label.text;
  let best: TopLabel | null = null;
  let lo = MIN_CHARACTERS;
  let hi = full.length - 1;
  while (lo <= hi) {
    const n = Math.floor((lo + hi) / 2);
    const text = `${full.slice(0, n).trimEnd()}…`;
    const cut = { ...label, text, width: labelWidth(text), full };
    if (fits(cut)) {
      best = cut;
      lo = n + 1;
    } else hi = n - 1;
  }
  return best;
}

/** A label cut with an ellipsis to at most `max` pixels, the whole kept in `full`; null when it cannot keep `MIN_CHARACTERS`. */
const shorten = (label: TopLabel, max: number): TopLabel | null =>
  label.width <= max ? label : longestCut(label, (cut) => cut.width <= max);

/**
 * Where a label's middle may sit and still read as its mark's: over its band, however wide the
 * label; or, for a line, with the line under the text or within a gap of its end (so the labels
 * of two lines close together can sit either side of them).
 */
const reach = (l: TopLabel, gap: number) =>
  l.from < l.to
    ? ([l.from, l.to] as const)
    : ([l.at - l.width / 2 - gap, l.at + l.width / 2 + gap] as const);

type Placed = { key: string; text: string; full: string | undefined; x: number };

/**
 * Where a group of labels, set left to right `gap` apart, may start and still keep every member
 * within its `reach` and the group within `[lo, hi]`: it cannot when `min` passes `max`.
 */
function groupStart(members: TopLabel[], lo: number, hi: number, gap: number) {
  let min = lo;
  let max = hi;
  let o = 0;
  for (const m of members) {
    const [a, b] = reach(m, gap);
    const inset = o + m.width / 2;
    min = Math.max(min, a - inset);
    max = Math.min(max, b - inset);
    o += m.width + gap;
  }
  return { min, max: Math.min(max, hi - Math.max(o - gap, 0)) };
}

/**
 * One pass of the row: each label keeps to where it belongs unless it would touch its neighbour;
 * then the two move apart as one group, the lighter further, as far as every member's `reach` and
 * `[lo, hi]` allow. The first group that cannot satisfy them is the conflict, with how far it
 * misses: one found later may only be in its way because it sits where it cannot.
 */
function placeRow(
  row: TopLabel[],
  lo: number,
  hi: number,
  gap: number,
): { placed: Placed[] } | { conflict: TopLabel[]; by: number } {
  type Group = { members: TopLabel[]; start: number; width: number };
  let conflict: { conflict: TopLabel[]; by: number } | null = null;
  const offsets = (g: Group) => {
    let o = 0;
    return g.members.map((m) => {
      const at = o;
      o += m.width + gap;
      return at;
    });
  };
  const place = (g: Group) => {
    const offs = offsets(g);
    const { min, max } = groupStart(g.members, lo, hi, gap);
    if (min > max + 0.5) conflict ??= { conflict: g.members, by: min - max };
    const total = g.members.reduce((n, m) => n + m.weight, 0);
    const start =
      g.members.reduce((n, m, i) => n + m.weight * (m.at - m.width / 2 - (offs[i] ?? 0)), 0) /
      total;
    g.start = Math.max(min, Math.min(start, max));
  };
  const groups: Group[] = [...row]
    .sort((a, b) => a.at - b.at)
    .map((m) => ({ members: [m], start: m.at - m.width / 2, width: m.width }));
  groups.forEach(place);
  for (let i = 1; i < groups.length;) {
    const a = groups[i - 1]!;
    const b = groups[i]!;
    if (a.start + a.width + gap <= b.start) {
      i++;
      continue;
    }
    const merged: Group = {
      members: [...a.members, ...b.members],
      start: a.start,
      width: a.width + gap + b.width,
    };
    place(merged);
    groups.splice(i - 1, 2, merged);
    i = Math.max(1, i - 1);
  }
  if (conflict) return conflict;
  return {
    placed: groups.flatMap((g) => {
      const offs = offsets(g);
      return g.members.map((m, i) => ({
        key: m.key,
        text: m.text,
        full: m.full,
        x: g.start + (offs[i] ?? 0) + m.width / 2,
      }));
    }),
  };
}

/**
 * Labels in one row that do not overlap, stay within `[lo, hi]` and stay over their marks. A
 * line's label weighs more than a band's, so it keeps closer to its line. Where the row cannot
 * hold them all, the lightest label in the way whose shortening narrows the miss (the widest of
 * equals) shortens with an ellipsis, its whole text kept for a title, until they fit; one that
 * cannot keep `MIN_CHARACTERS` drops out. Then every label shortened or dropped is offered back,
 * the heaviest first, whole or as long as the row holds it, so none gives up more than it must.
 */
function spreadLabels(labels: TopLabel[], lo: number, hi: number, gap = 8): Placed[] {
  let row = labels;
  const miss = (members: TopLabel[]) => {
    if (!members.length) return -Infinity;
    const { min, max } = groupStart(members, lo, hi, gap);
    return min - max;
  };
  // Each round takes a character from a label at least, or drops one, so the row places within
  // as many rounds as it has characters.
  const rounds = labels.reduce((n, l) => n + (l.full ?? l.text).length + 1, 1);
  for (let round = 0; round <= rounds; round++) {
    const result = placeRow(row, lo, hi, gap);
    if ("placed" in result) {
      for (const label of [...labels].sort((a, b) => b.weight - a.weight)) {
        const now = row.find((l) => l.key === label.key);
        if (now && !now.full) continue;
        // The row with this label as `l`, in the order the labels came.
        const withIt = (l: TopLabel) =>
          labels.flatMap((m) => (m.key === label.key ? [l] : row.filter((r) => r.key === m.key)));
        const holds = (l: TopLabel) => "placed" in placeRow(withIt(l), lo, hi, gap);
        const text = label.full ?? label.text;
        const whole = { ...label, text, width: labelWidth(text), full: undefined };
        const back = holds(whole) ? whole : longestCut(whole, holds);
        if (back && (!now || back.width > now.width)) row = withIt(back);
      }
      const final = placeRow(row, lo, hi, gap);
      return "placed" in final ? final.placed : result.placed;
    }
    // Only a label whose shortening, or dropping out, narrows the miss gives way: in a group held
    // between the plot's start and a line, cutting that line's label or a window's after it
    // gains nothing, and the window would give up its words for nothing.
    const { conflict, by } = result;
    const inWay = [...conflict].sort((a, b) => a.weight - b.weight || b.width - a.width);
    const narrows = inWay.filter((l) => {
      const cut = shorten(l, l.width - 0.5);
      return miss(conflict.flatMap((m) => (m === l ? (cut ? [cut] : []) : [m]))) < by - 0.01;
    });
    const [loser, rival] = narrows.length ? narrows : inWay;
    if (!loser) break;
    // By what the row misses, and no further than the next widest of its weight, so equals give
    // up alike; `shorten` takes a character at least.
    const toRival = rival?.weight === loser.weight ? loser.width - rival.width : Infinity;
    const next = shorten(loser, loser.width - Math.max(Math.min(by, toRival), 0.5));
    row = row.flatMap((l) => (l === loser ? (next ? [next] : []) : [l]));
  }
  return [];
}

/**
 * Every reference line's and band's label, in `color.text.subtlest`, drawn over the marks. Above
 * the plot, in one row: a vertical line's over its line (lines on one date share one label, joined
 * with a middle dot), and a band's across categories or dates over its middle; where two would
 * overlap in a narrow plot they move apart, each staying over its mark (a band's middle over the
 * band) and within the plot's width, clear of the axis ticks and the end labels' margin. Where the
 * row cannot hold them so, a band's shortens before a line's wherever that makes room, each only as
 * far as the row needs, with an ellipsis and its whole text as the label's title; one with no room
 * for three characters drops out. Inside the plot: a horizontal line's at its end, and a band's
 * between two values at its top end, ringed in the surface so a line that crosses one runs behind
 * the words.
 */
export function ReferenceLabels({
  reference,
  bands,
  horizontal,
  time,
}: {
  reference?: ChartReference[] | undefined;
  bands?: ChartBand[] | undefined;
  horizontal?: boolean | undefined;
  time?: boolean | undefined;
}) {
  const xScale = useXAxisScale();
  const yScale = useYAxisScale();
  const plot = usePlotArea();
  if (!xScale || !yScale || !plot) return null;
  const onTime = Boolean(time);
  const top: TopLabel[] = [];
  const inside: { key: string; text: string; y: number }[] = [];
  reference?.forEach((r, i) => {
    if (!r.label) return;
    const key = `line-${i}`;
    if (isVertical(r, horizontal)) {
      const at = xScale(horizontal ? r.y : axisValue(r.x, onTime), { position: "middle" });
      if (at !== undefined)
        top.push({
          key,
          text: r.label,
          at,
          from: at,
          to: at,
          width: labelWidth(r.label),
          weight: 3,
        });
      return;
    }
    const y = yScale(horizontal ? axisValue(r.x, onTime) : r.y, { position: "middle" });
    if (y !== undefined) inside.push({ key, text: r.label, y });
  });
  bands?.forEach((b, i) => {
    if (!b.label) return;
    const key = `band-${i}`;
    if (isAcross(b)) {
      const from =
        b.fromX === undefined ? plot.x : xScale(axisValue(b.fromX, onTime), { position: "start" });
      const to =
        b.toX === undefined
          ? plot.x + plot.width
          : xScale(axisValue(b.toX, onTime), { position: "end" });
      if (from !== undefined && to !== undefined)
        top.push({
          key,
          text: b.label,
          at: (from + to) / 2,
          from: Math.min(from, to),
          to: Math.max(from, to),
          width: labelWidth(b.label),
          weight: 1,
        });
      return;
    }
    const y = yScale(Math.max(b.from ?? 0, b.to ?? 0));
    if (y !== undefined) inside.push({ key, text: b.label, y });
  });
  if (!top.length && !inside.length) return null;
  // Lines on one category or date share one label, so neither is pushed off the line or left out.
  const row: TopLabel[] = [];
  for (const l of top) {
    const i = row.findIndex((m) => m.from === m.to && l.from === l.to && Math.abs(m.at - l.at) < 1);
    const same = row[i];
    if (!same) {
      row.push(l);
      continue;
    }
    const text = `${same.text} · ${l.text}`;
    row[i] = { ...same, key: `${same.key}+${l.key}`, text, width: labelWidth(text) };
  }
  const end = plot.x + plot.width;
  const ink = token("color.text.subtlest");
  // Over every mark, under the hover's cursor line and active dot.
  return (
    <ZIndexLayer zIndex={DefaultZIndexes.scatter + 1}>
      <g>
        {spreadLabels(row, plot.x, end).map((l) => (
          <g key={l.key}>
            {l.full ? <title>{l.full}</title> : null}
            <text
              x={l.x}
              y={plot.y - 5}
              textAnchor="middle"
              className="font-body-xsmall"
              fill={ink}
            >
              {l.text}
            </text>
          </g>
        ))}
        {inside.map((l) => (
          <text
            key={l.key}
            x={end}
            y={l.y - 4}
            textAnchor="end"
            className="font-body-xsmall"
            fill={ink}
            stroke={surface()}
            strokeWidth={3}
            strokeLinejoin="round"
            paintOrder="stroke"
          >
            {l.text}
          </text>
        ))}
      </g>
    </ZIndexLayer>
  );
}

/** A category value as recharts wants it on the axis: milliseconds on a time axis, itself otherwise. */
const axisValue = (v: string | number | Date | undefined, time: boolean) =>
  v === undefined ? undefined : time ? toMs(v) : v instanceof Date ? v.getTime() : v;

/** The reference lines, dashed in their tone. Their labels are `ReferenceLabels`', drawn over the marks. */
export function References({
  reference,
  horizontal,
  time,
}: {
  reference: ChartReference[] | undefined;
  horizontal?: boolean | undefined;
  time?: boolean | undefined;
}) {
  if (!reference?.length) return null;
  return (
    <>
      {reference.map((r, i) => {
        const stroke = chartColor(r.tone ?? "neutral");
        // On a horizontal chart the value axis is x, so a `y` reference is a vertical line.
        const onValueAxis = r.y !== undefined;
        const cat = axisValue(r.x, Boolean(time)) as string | number;
        const pos = horizontal
          ? onValueAxis
            ? { x: r.y as number }
            : { y: cat }
          : onValueAxis
            ? { y: r.y as number }
            : { x: cat };
        return (
          <ReferenceLine
            key={i}
            {...pos}
            stroke={stroke}
            strokeWidth={1}
            strokeDasharray="4 3"
            ifOverflow="extendDomain"
          />
        );
      })}
    </>
  );
}

/** The bands, a wash of their tone under the marks. Their labels are `ReferenceLabels`'. */
export function Bands({
  bands,
  time,
}: {
  bands: ChartBand[] | undefined;
  time?: boolean | undefined;
}) {
  if (!bands?.length) return null;
  return (
    <>
      {bands.map((b, i) => {
        const pos = isAcross(b)
          ? {
              x1: axisValue(b.fromX, Boolean(time)) as string | number,
              x2: axisValue(b.toX, Boolean(time)) as string | number,
            }
          : { y1: b.from ?? 0, y2: b.to ?? 0 };
        return (
          <ReferenceArea
            key={i}
            {...pos}
            fill={chartColor(b.tone ?? "neutral")}
            fillOpacity={0.1}
            stroke="none"
            ifOverflow="extendDomain"
          />
        );
      })}
    </>
  );
}

/* ---------- choosing a mark: the details card ---------- */

/** Where a chosen mark sits in the plot, in pixels, so a details card can anchor to it. */
export type Anchor = { x: number; y: number; width: number; height: number };

export type Picked<T> = { item: T; anchor: Anchor };

/** A plot's chosen mark: set by a click or by Enter on the focused plot, cleared when its card closes. */
export function usePicked<T>() {
  const [picked, setPicked] = useState<Picked<T> | null>(null);
  const pick = useCallback((item: T, anchor: Anchor) => setPicked({ item, anchor }), []);
  const clear = useCallback(() => setPicked(null), []);
  return { picked, pick, clear };
}

export const rectAnchor = (p: {
  x?: number | undefined;
  y?: number | undefined;
  width?: number | undefined;
  height?: number | undefined;
}): Anchor => ({ x: p.x ?? 0, y: p.y ?? 0, width: p.width ?? 0, height: p.height ?? 0 });

export const pointAnchor = (
  p: { x?: number | undefined; y?: number | undefined } | undefined,
  r = 4,
): Anchor => ({
  x: (p?.x ?? 0) - r,
  y: (p?.y ?? 0) - r,
  width: r * 2,
  height: r * 2,
});

/** What the keyboard has under it: the active category and where the tooltip sits. */
export type Active = {
  label: string | number | undefined;
  coordinate: { x: number; y: number } | undefined;
};

/** Inside a chart: keeps the active point in a ref, so Enter on the plot can choose it. */
export function ActiveProbe({ target }: { target: RefObject<Active | null> }) {
  const label = useActiveTooltipLabel();
  const coordinate = useActiveTooltipCoordinate();
  useEffect(() => {
    target.current =
      label === undefined || label === null
        ? null
        : { label: label as string | number, coordinate };
  });
  return null;
}

/** The card's head: what was chosen, in a swatch and a name, and its value. */
export function CardHead({
  swatch,
  title,
  subtitle,
  value,
  rows,
}: {
  swatch?: ReactNode | undefined;
  title: string;
  subtitle?: string | undefined;
  value?: string | undefined;
  /** One line per series, for a whole category; `note` is the change from the point before. */
  rows?:
    | { swatch: ReactNode; label: string; value: string; note?: string | null | undefined }[]
    | undefined;
}) {
  return (
    <div className="flex flex-col gap-025">
      <div className="flex items-center gap-075">
        {swatch}
        <span className="min-w-0 truncate font-body-small font-medium text-default">{title}</span>
      </div>
      {subtitle ? <span className="font-body-xsmall text-subtle">{subtitle}</span> : null}
      {value !== undefined ? (
        <span className="font-heading-small tabular-nums text-default">{value}</span>
      ) : null}
      {rows?.length ? (
        <div className="flex flex-col gap-025 pt-025">
          {rows.map((r, i) => (
            <div key={i} className="flex items-center gap-100 font-body-small">
              {r.swatch}
              <span className="min-w-0 flex-1 truncate text-subtle">{r.label}</span>
              {r.note ? <span className="tabular-nums text-subtlest">{r.note}</span> : null}
              <span className="tabular-nums font-medium text-default">{r.value}</span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

/** The details card: a Popover anchored to the chosen mark, closed by Escape or a click outside, focus back on the plot after. */
function Card({
  anchor,
  label,
  onClose,
  refocus,
  children,
}: {
  anchor: Anchor;
  label: string | undefined;
  onClose: () => void;
  /** Where focus goes when the card closes: back to the plot. */
  refocus: () => void;
  children: ReactNode;
}) {
  const { t, direction } = useLedgerLocale();
  const anchorRef = useRef<HTMLDivElement>(null);

  return (
    <Popover
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <div
        ref={anchorRef}
        aria-hidden
        className="pointer-events-none absolute"
        style={{ left: anchor.x, top: anchor.y, width: anchor.width, height: anchor.height }}
      />

      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Positioner
          anchor={anchorRef}
          side="top"
          align="center"
          sideOffset={6}
          collisionPadding={8}

          className="isolate z-50"
        >
          <PopoverPrimitive.Popup
            data-slot="popover-content"
            dir={direction}
            aria-label={label ? t("detailsLabel", { label }) : t("details")}
            finalFocus={() => {
              refocus();
              return false;
            }}
            className="flex flex-col gap-150 rounded-large border border-default bg-surface-overlay p-150 font-body text-default shadow-overlay outline-none data-open:animate-enter data-closed:animate-exit data-instant:animate-none motion-reduce:animate-none"
            style={{
              width: 280,
              maxWidth: "var(--available-width)",
              transformOrigin: "var(--transform-origin)",
            }}
          >
            {children}
          </PopoverPrimitive.Popup>
        </PopoverPrimitive.Positioner>
      </PopoverPrimitive.Portal>
    </Popover>
  );
}

/* ---------- the plot wrapper ---------- */

/** Recharts puts the tab stop on its svg (`role="application"`); this is it, inside a plot. */
const surfaceIn = (el: HTMLElement | null) =>
  el?.querySelector<SVGElement>(".recharts-surface[tabindex], [data-chart-tile][tabindex]") ?? null;

/**
 * The box of a chart that sits inline, drawn by an empty `<svg>`: `width` at most, `height` kept
 * (or, with `ratio`, the ratio kept), and narrower in a narrower container. Being a replaced
 * element, it asks nothing of a grid track or a flex row's minimum, so a tile scales it down as it
 * would an image, while a shrink-to-fit parent still gives it `width`. The chart itself sits over
 * it, absolutely.
 */
export function InlineSizer({
  width,
  height,
  ratio,
}: {
  width: number;
  height: number;
  ratio?: boolean | undefined;
}) {
  return (
    <svg
      aria-hidden
      width={width}
      height={height}
      viewBox={ratio ? `0 0 ${width} ${height}` : undefined}
      className={cn("block max-w-full", ratio && "h-auto")}
    />
  );
}

/**
 * The container with the kit's height. Named by `label` or by the Frame; unnamed, it is decoration
 * and not focusable. Enter on the focused plot chooses the active point when the plot can; the
 * details card for a chosen mark anchors to it here.
 */
export function Plot({
  name,
  size,
  height,
  className,
  children,
  card,
  anchor,
  onClose,
  onEnter,
  busy,
  width,
}: {
  name: string | undefined;
  size?: ChartSize | undefined;
  height?: number | undefined;
  className?: string | undefined;
  children: ReactNode;
  /** The details card for the chosen mark, and where it anchors. */
  card?: ReactNode | undefined;
  anchor?: Anchor | null | undefined;
  onClose?: (() => void) | undefined;
  /** Enter on the focused plot. */
  onEnter?: (() => void) | undefined;
  busy?: boolean | undefined;
  /**
   * The largest width in pixels for a plot that sits inline (a ring); the children then bring their
   * own container. The plot keeps `width` by `height` as its ratio and scales down to a narrower
   * container, never up, in a block, a grid track or a flex row alike.
   */
  width?: number | undefined;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const plotHeight = height ?? heights[size ?? "medium"];
  const focusedTile = useRef<SVGElement | null>(null);
  const focusedTileKey = useRef<string | null>(null);
  // Whether the plot was focused by a pointer or by the keyboard: the focus ring shows for the keyboard only.
  const [focusedBy, setFocusedBy] = useState<"pointer" | "keyboard" | null>(null);
  const refocus = useCallback(() => {
    const tile = focusedTile.current;
    if (
      tile?.isConnected &&
      ref.current?.contains(tile) &&
      tile.getAttribute("data-chart-tile") === focusedTileKey.current
    ) {
      tile.focus();
      return;
    }
    const replacement = Array.from(
      ref.current?.querySelectorAll<SVGElement>("[data-chart-tile][tabindex]") ?? [],
    ).find((candidate) => candidate.getAttribute("data-chart-tile") === focusedTileKey.current);
    (replacement ?? surfaceIn(ref.current))?.focus();
  }, []);
  useEffect(() => {
    if (focusedBy !== "keyboard" || card) return;
    // A drill-down can replace Recharts' branch DOM. Restore the same leaf after its commit,
    // provided focus was lost to the document rather than moved to another control or a card.
    const frame = requestAnimationFrame(() => {
      const plot = ref.current;
      const tile = focusedTile.current;
      if (
        plot &&
        tile &&
        (!tile.isConnected || !plot.contains(tile)) &&
        plot.ownerDocument.activeElement === plot.ownerDocument.body
      ) {
        refocus();
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [children, card, focusedBy, refocus]);
  const onKeyDownCapture = (e: KeyboardEvent<HTMLDivElement>) => {
    setFocusedBy("keyboard");
    if (!onEnter || e.key !== "Enter" || e.target !== surfaceIn(ref.current)) return;
    e.preventDefault();
    e.stopPropagation();
    onEnter();
  };
  return (
    <div
      ref={ref}
      role={name ? "group" : undefined}
      aria-label={name}
      aria-hidden={name ? undefined : true}
      aria-busy={busy || undefined}
      data-focus={focusedBy ?? undefined}
      data-chart-plot=""
      data-card={card && anchor ? "open" : undefined}
      className={cn(
        "relative",
        width === undefined ? "w-full" : "w-fit max-w-full",
        busy && "opacity-loading",
        className,
      )}
      style={width === undefined ? { height: plotHeight } : undefined}
      onFocusCapture={(event) => {
        const tile = (event.target as Element).closest<SVGElement>("[data-chart-tile]");
        if (tile) {
          focusedTile.current = tile;
          focusedTileKey.current = tile.getAttribute("data-chart-tile");
        }
      }}
      onPointerDownCapture={(event) => {
        setFocusedBy("pointer");
        const tile = (event.target as Element).closest<SVGElement>("[data-chart-tile]");
        if (tile) {
          focusedTile.current = tile;
          focusedTileKey.current = tile.getAttribute("data-chart-tile");
        }
      }}
      onKeyDownCapture={onKeyDownCapture}
      onBlur={(e) => {
        if (!ref.current?.contains(e.relatedTarget as Node | null)) setFocusedBy(null);
      }}
    >
      {width === undefined ? (
        <ResponsiveContainer
          width="100%"
          height="100%"
          initialDimension={{ width: 320, height: plotHeight }}
        >
          {children as never}
        </ResponsiveContainer>
      ) : (
        <>
          <InlineSizer width={width} height={plotHeight} ratio />
          <div className="absolute inset-0">{children}</div>
        </>
      )}
      {card && anchor ? (
        <Card anchor={anchor} label={name} onClose={() => onClose?.()} refocus={refocus}>
          {card}
        </Card>
      ) : null}
    </div>
  );
}

/* ---------- export ---------- */

const csvCell = (s: string) => (/[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);

/** A value as the CSV holds it: a number raw, a range as "a–b", nothing as empty. */
export const raw = (v: ChartValue): string =>
  typeof v === "number" ? String(v) : isRange(v) ? `${v[0]}–${v[1]}` : v == null ? "" : String(v);

/** The table twin as CSV: its headings, then a line per row, numbers raw and text as the table prints it. */
export function twinCsv(twin: ChartTwin): string {
  const head = twin.columns.map((c) => csvCell(c.label)).join(",");
  const rows = twin.rows.map((r) => r.cells.map((c) => csvCell(c.csv)).join(","));
  return [head, ...rows].join("\n");
}

/** A file name from a title: lower case, dashes, the extension. */
export const fileName = (title: string, ext: string) =>
  `${
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "chart"
  }.${ext}`;

/** Hands the reader a file. */
export function download(name: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const inlined = [
  "fill",
  "stroke",
  "stroke-width",
  "stroke-dasharray",
  "opacity",
  "fill-opacity",
  "font-family",
  "font-size",
  "font-weight",
  "letter-spacing",
  "text-anchor",
] as const;

/**
 * The plot as a PNG at twice the pixel density: the svg copied with every computed colour and font
 * inlined (the tokens are CSS variables, which an image cannot resolve), on the surface colour.
 */
export async function svgToPng(svg: SVGSVGElement, scale = 2): Promise<Blob> {
  const rect = svg.getBoundingClientRect();
  const clone = svg.cloneNode(true) as SVGSVGElement;
  const from = svg.querySelectorAll<SVGElement>("*");
  const to = clone.querySelectorAll<SVGElement>("*");
  from.forEach((el, i) => {
    const target = to[i];
    if (!target) return;
    const cs = getComputedStyle(el);
    for (const p of inlined) {
      const v = cs.getPropertyValue(p);
      if (v) target.setAttribute(p, v);
    }
    target.removeAttribute("class");
  });
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  clone.setAttribute("width", String(rect.width));
  clone.setAttribute("height", String(rect.height));
  const source = new XMLSerializer().serializeToString(clone);
  const url = URL.createObjectURL(new Blob([source], { type: "image/svg+xml;charset=utf-8" }));
  try {
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("The chart could not be drawn as an image."));
      img.src = url;
    });
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(rect.width * scale);
    canvas.height = Math.round(rect.height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("No canvas.");
    ctx.fillStyle = getComputedStyle(svg).getPropertyValue("--ds-elevation-surface") || "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.scale(scale, scale);
    ctx.drawImage(img, 0, 0);
    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("No image."))), "image/png"),
    );
  } finally {
    URL.revokeObjectURL(url);
  }
}

/* ---------- skeletons ---------- */

const pattern = [55, 80, 40, 70, 95, 60, 30, 75];
const linePath = "M0,30 L14,22 L28,26 L42,12 L56,18 L70,8 L84,14 L100,4";

/** The plot's shape in `color.skeleton` while it loads: the marks' silhouette, pulsing, at the plot's height so nothing moves when the data arrives. */
export function PlotSkeleton({
  kind,
  name,
  size,
  height,
  className,
}: {
  kind: "columns" | "bars" | "line" | "area" | "dots" | "tiles";
  name: string | undefined;
  size?: ChartSize | undefined;
  height?: number | undefined;
  className?: string | undefined;
}) {
  const { t } = useLedgerLocale();

  const h = height ?? heights[size ?? "medium"];
  return (
    <div
      role={name ? "group" : undefined}
      aria-label={name ? t("loadingLabel", { label: name }) : undefined}
      aria-busy
      aria-hidden={name ? undefined : true}
      className={cn("relative w-full animate-pulse", className)}
      style={{ height: h }}
    >
      {kind === "columns" ? (
        <div className="flex h-full items-end gap-150 border-b border-default pb-025 pe-150 ps-500">
          {pattern.map((p, i) => (
            <div
              key={i}
              className="flex-1 rounded-xsmall bg-skeleton"
              style={{ height: `${p}%` }}
            />
          ))}
        </div>
      ) : kind === "bars" ? (
        <div className="flex h-full flex-col justify-around gap-100 border-s border-default py-100 ps-025">
          {pattern.slice(0, 5).map((p, i) => (
            <div key={i} className="h-300 rounded-xsmall bg-skeleton" style={{ width: `${p}%` }} />
          ))}
        </div>
      ) : kind === "line" || kind === "area" ? (
        <div className="h-full border-b border-default pe-150 ps-500">
          <svg
            width="100%"
            height="100%"
            viewBox="0 0 100 40"
            preserveAspectRatio="none"
            aria-hidden
          >
            {kind === "area" ? (
              <path d={`${linePath} L100,40 L0,40 Z`} fill={token("color.skeleton.subtle")} />
            ) : null}
            <path
              d={linePath}
              fill="none"
              stroke={token("color.skeleton")}
              strokeWidth={2}
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        </div>
      ) : kind === "dots" ? (
        <div className="relative h-full border-b border-s border-default">
          {pattern.map((p, i) => (
            <span
              key={i}
              className="absolute size-100 rounded-full bg-skeleton"
              style={{ left: `${8 + i * 11}%`, top: `${100 - p}%` }}
            />
          ))}
        </div>
      ) : (
        <div
          className="grid h-full gap-050"
          style={{ gridTemplateColumns: "3fr 2fr 2fr", gridTemplateRows: "3fr 2fr" }}
        >
          <div className="rounded-xsmall bg-skeleton" style={{ gridRow: "1 / 3" }} />
          <div className="rounded-xsmall bg-skeleton" />
          <div className="rounded-xsmall bg-skeleton" />
          <div className="rounded-xsmall bg-skeleton" style={{ gridColumn: "2 / 4" }} />
        </div>
      )}
    </div>
  );
}
