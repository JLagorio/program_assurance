import type {
  CategoryFormatter,
  ChartColumn,
  ChartDatum,
  ChartDomain,
  ChartValue,
  Formatter,
} from "./_types";

/*
 * Values on the value axis and in the text a plot prints: a value's text, the axis' domain and
 * its ticks, the axis' width, a change from the point before. No runtime imports, so `node --test` covers them.
 */

/** Whether a value is a `[from, to]` pair: a floating bar. */
export const isRange = (v: unknown): v is readonly [number, number] =>
  Array.isArray(v) && v.length === 2 && typeof v[0] === "number" && typeof v[1] === "number";

/** A day as ISO 8601, for a Date printed with no category format to hand. */
const isoDay = (d: Date) => d.toISOString().slice(0, 10);

/** A value's text: a number in `format`, a range as "a–b", a Date as a category (`formatX`), nothing as empty. */
export const formatValue = (
  v: unknown,
  format: Formatter,
  formatX?: CategoryFormatter | undefined,
): string => {
  if (typeof v === "number") return format(v);
  if (isRange(v)) return `${format(v[0])}–${format(v[1])}`;
  if (v === null || v === undefined) return "";
  if (v instanceof Date) return formatX ? formatX(v) : isoDay(v);
  return String(v);
};

/** A column's text for one datum: its own format, else the plot's for a number, a range as "a–b", a date as a category. */
export function columnText(
  datum: ChartDatum,
  column: ChartColumn,
  format: Formatter,
  formatX: CategoryFormatter,
): string {
  const v = datum[column.key];
  if (column.format) return column.format(v, datum);
  return formatValue(v, format, formatX);
}

/** A value as the CSV holds it: a number raw, a range as "a–b", nothing as empty. */
export const raw = (v: ChartValue): string =>
  typeof v === "number"
    ? String(v)
    : isRange(v)
      ? `${v[0]}–${v[1]}`
      : v == null
        ? ""
        : v instanceof Date
          ? v.toISOString()
          : String(v);

/** Whether any series in the data goes below zero, so the axis and the baseline must too. */
export const hasNegative = (data: ChartDatum[], keys: string[]) =>
  data.some((d) =>
    keys.some((k) => {
      const v = d[k];
      return typeof v === "number" ? v < 0 : isRange(v) ? v[0] < 0 || v[1] < 0 : false;
    }),
  );

export type AxisEnd = number | "auto" | "dataMin" | "dataMax" | ((n: number) => number);

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
export const tickValue = (v: unknown): number => Number(Number(v).toPrecision(12)) || 0;

/**
 * A round step for about `rough` a tick: 1, 2, 2.5 or 5 times a power of ten, the first at least
 * `rough`. With `integer`, never a fraction: counts step by 1, 2, 5, 10.
 */
const niceStep = (rough: number, integer: boolean) => {
  const power = 10 ** Math.floor(Math.log10(rough));
  const steps = [1, 2, 2.5, 5, 10]
    .map((m) => m * power)
    .filter((s) => !integer || Number.isInteger(s));
  const step = steps.find((s) => s >= rough - 1e-12) ?? rough;
  return integer && !Number.isInteger(step) ? Math.max(1, Math.ceil(step)) : step;
};

/**
 * Round ticks across `[min, max]`: a round step that gives about `count` ticks, and every tick a
 * multiple of it, so zero is a tick whenever the range crosses it. `integer` keeps the step whole.
 */
export function niceTicks(min: number, max: number, count = 5, integer = false): number[] {
  if (!Number.isFinite(min) || !Number.isFinite(max)) return [];
  if (max <= min) return [tickValue(min)];
  const step = niceStep((max - min) / Math.max(1, count - 1), integer);
  const ticks: number[] = [];
  const first = Math.ceil(min / step - 1e-9);
  for (let n = first; n * step <= max + step * 1e-9; n++) ticks.push(tickValue(n * step));
  return ticks;
}

/**
 * A value axis through zero that nobody pinned: `[lo, hi]` widened to round steps, with its ticks,
 * so the zero line every bar hangs from is a tick and the steps are even.
 */
export function niceScale(
  lo: number,
  hi: number,
  count = 5,
  integer = false,
): { domain: [number, number]; ticks: number[] } {
  if (!Number.isFinite(lo) || !Number.isFinite(hi) || hi <= lo)
    return { domain: [lo, hi], ticks: [] };
  const step = niceStep((hi - lo) / Math.max(1, count - 1), integer);
  const from = tickValue(Math.floor(lo / step + 1e-9) * step);
  const to = tickValue(Math.ceil(hi / step - 1e-9) * step);
  const ticks: number[] = [];
  for (let n = Math.round(from / step); n * step <= to + step * 1e-9; n++)
    ticks.push(tickValue(n * step));
  return { domain: [from, to], ticks };
}

/** Whether every value under `keys` is a whole number, so the axis steps by whole numbers. */
export const allIntegers = (data: ChartDatum[], keys: string[]) =>
  data.every((d) =>
    keys.every((k) => {
      const v = d[k];
      return typeof v === "number"
        ? Number.isInteger(v)
        : isRange(v)
          ? Number.isInteger(v[0]) && Number.isInteger(v[1])
          : true;
    }),
  );

/** The extent of the values under `keys`, zero included. */
export const valueExtent = (data: ChartDatum[], keys: string[]): [number, number] => {
  let lo = 0;
  let hi = 0;
  for (const d of data)
    for (const k of keys) {
      const v = d[k];
      const values = typeof v === "number" ? [v] : isRange(v) ? [v[0], v[1]] : [];
      for (const n of values) {
        lo = Math.min(lo, n);
        hi = Math.max(hi, n);
      }
    }
  return [lo, hi];
};

/** The extent of a stack: each category's parts above zero summed, and below zero summed. */
export const stackExtent = (data: ChartDatum[], keys: string[]): [number, number] => {
  let lo = 0;
  let hi = 0;
  for (const d of data) {
    let up = 0;
    let down = 0;
    for (const k of keys) {
      const v = d[k];
      if (typeof v === "number") {
        if (v > 0) up += v;
        else down += v;
      }
    }
    lo = Math.min(lo, down);
    hi = Math.max(hi, up);
  }
  return [lo, hi];
};

/** The ticks of a value axis whose two ends the caller pinned; recharts' own for any other domain. */
export const pinnedTicks = (
  domain: ChartDomain | undefined,
  count = 5,
  integer = false,
): number[] | undefined =>
  domain && typeof domain[0] === "number" && typeof domain[1] === "number"
    ? niceTicks(domain[0], domain[1], count, integer)
    : undefined;

/** How many value ticks a plot of `height` pixels takes: five, six for the one chart a page is about. */
export const tickCount = (height: number) => (height >= 280 ? 6 : 5);

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

/** A text cut to `max` characters, the last an ellipsis. */
export const truncate = (text: string, max: number) =>
  text.length > max ? `${text.slice(0, max - 1)}…` : text;

/** The change from the previous point, signed, in the series' format: "+3", "−2", "±0". */
export const deltaText = (value: unknown, previous: unknown, format: Formatter): string | null => {
  if (typeof value !== "number" || typeof previous !== "number") return null;
  const d = value - previous;
  if (d === 0) return "±0";
  return `${d > 0 ? "+" : "−"}${format(Math.abs(d))}`;
};
