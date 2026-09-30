import { createContext, useContext, useLayoutEffect, useMemo } from "react";

import { cn } from "../../lib/cn";
import { useLedgerLocale } from "../../lib/locale";
import { isDateOnly, timeTicks, toMs } from "./_time";
import {
  splitColumns,
  type CategoryFormatter,
  type ChartColumn,
  type ChartDatum,
  type ChartSeries,
  type ChartSize,
  type ChartTwin,
  type Formatter,
  type SwatchShape,
  type TwinColumn,
  type TwinSource,
} from "./_types";
import { columnText, formatValue, raw } from "./_values";

/* What the Frame shares with the part inside it, and what the part reports back: the name, the
   legend's state, the formats, the data and the size, and the table twin. */

const isoDate = /^\d{4}-\d{2}-\d{2}(T|$)/;

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
              ...(isDateOnly(value) ? { timeZone: "UTC" } : {}),
            })
          : String(value),
    }),
    [locale],
  );
}

/**
 * The rows of a plot on a time axis: the category as epoch milliseconds, with the ticks and formats
 * the axis needs. Ticks fall on the provider's zone; data of calendar days only ("2026-09-04") is
 * read in UTC, so a day is the same day wherever it is read.
 */
export function useTimeAxis(data: ChartDatum[], x: string, time: boolean) {
  const { locale, timeZone } = useLedgerLocale();
  return useMemo(() => {
    if (!time) return null;
    const days = data.length > 0 && data.every((d) => isDateOnly(d[x]));
    const rows = data.map((d) => ({ ...d, [x]: toMs(d[x]) }));
    const values = rows.map((r) => r[x] as number).filter((n) => Number.isFinite(n));
    const min = Math.min(...values);
    const max = Math.max(...values);
    return { rows, min, max, ...timeTicks(min, max, locale, days ? "UTC" : timeZone) };
  }, [data, x, time, locale, timeZone]);
}

/* ---------- the frame's state ---------- */

export type FrameState = {
  name: string | undefined;
  /** The id of the Frame's title, so a plot's svg is labelled by it. */
  titleId?: string | undefined;
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
  /** The table twin, an empty state or an error stands in for the plot: a part keeps reporting to the Frame and draws nothing. */
  offstage: boolean;
};

export const FrameContext = createContext<FrameState | null>(null);
export const none: ReadonlySet<string> = new Set();

/* ---------- what a part reports to its Frame ---------- */

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

/* ---------- the table twin ---------- */

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
            text: formatValue(d[s.key], s.format ?? format, formatX),
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
    /** The Frame's title element, when the plot takes its name from it. */
    titleId: label === undefined ? frame?.titleId : undefined,
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
