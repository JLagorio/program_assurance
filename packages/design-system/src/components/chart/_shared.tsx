import * as PopoverPrimitive from "@radix-ui/react-popover";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
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
  Line,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  useActiveTooltipCoordinate,
  useActiveTooltipLabel,
} from "recharts";

import { token, tokenValue, type TokenName } from "../../generated/tokens";
import { cn } from "../../lib/cn";
import type { Tone } from "../badge";
import { menuMotion } from "../menu";

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

/** The tone's hovered step: one darker in light, one lighter in dark, as Atlassian's chart tokens. */
export const hoveredColor = (tone: ChartTone): string =>
  token(`color.chart.${tone}.hovered` as TokenName);

/** The tone of the i-th series (from 0) when none is given: the six hues in order, then Other. */
export const categoricalTone = (i: number): ChartTone =>
  i < 6 ? (`categorical.${(i + 1) as 1 | 2 | 3 | 4 | 5 | 6}` as ChartTone) : "categorical.7";

export const sequentialColor = (step: 1 | 2 | 3 | 4 | 5) =>
  token(`color.chart.sequential.${step}`);
export const divergingColor = (
  step: "negative.bold" | "negative" | "midpoint" | "positive" | "positive.bold",
) => token(`color.chart.diverging.${step}` as TokenName);

const compactFormat = new Intl.NumberFormat(undefined, {
  notation: "compact",
  maximumFractionDigits: 1,
});
const plainFormat = new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 });

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
export type ChartSelection = {
  datum: ChartDatum;
  series?: ChartSeries | undefined;
  index: number;
};

export const isRange = (v: unknown): v is readonly [number, number] =>
  Array.isArray(v) && v.length === 2 && typeof v[0] === "number" && typeof v[1] === "number";

export const formatValue = (v: unknown, format: Formatter): string => {
  if (typeof v === "number") return format(v);
  if (isRange(v)) return `${format(v[0])} to ${format(v[1])}`;
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

/** @deprecated the old name of formatCategory, kept for the parts. */
export const plainCategory = formatCategory;

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
const dayFmt = new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short" });
const monthFmt = new Intl.DateTimeFormat(undefined, { month: "short" });
const monthYearFmt = new Intl.DateTimeFormat(undefined, { month: "short", year: "2-digit" });
const yearFmt = new Intl.DateTimeFormat(undefined, { year: "numeric" });
const hourFmt = new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" });
const fullFmt = new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short", year: "numeric" });
const fullTimeFmt = new Intl.DateTimeFormat(undefined, {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

export const fullDate = (ms: number) => fullFmt.format(ms);

/** The ticks of a time axis and their labels: hours, days, months or years, by the span, at most eight, each at a unit's start. */
export function timeTicks(min: number, max: number): { ticks: number[]; tick: (ms: number) => string; full: (ms: number) => string } {
  const span = Math.max(1, max - min);
  const days = span / DAY;
  const ticks: number[] = [];
  if (days <= 3) {
    const stepH = days <= 0.5 ? 1 : days <= 1 ? 3 : days <= 2 ? 6 : 12;
    const d = new Date(min);
    d.setMinutes(0, 0, 0);
    d.setHours(Math.ceil(d.getHours() / stepH) * stepH);
    for (let t = d.getTime(); t <= max; t += stepH * 3_600_000) ticks.push(t);
    return { ticks, tick: (ms) => hourFmt.format(ms), full: (ms) => fullTimeFmt.format(ms) };
  }
  if (days <= 62) {
    const step = days <= 8 ? 1 : days <= 16 ? 2 : days <= 40 ? 7 : 14;
    const d = new Date(min);
    d.setHours(0, 0, 0, 0);
    if (d.getTime() < min) d.setDate(d.getDate() + 1);
    for (let t = d.getTime(); t <= max; t += step * DAY) ticks.push(t);
    return { ticks, tick: (ms) => dayFmt.format(ms), full: fullDate };
  }
  if (days <= 800) {
    const months = days / 30.4;
    const step = months <= 8 ? 1 : months <= 16 ? 2 : 3;
    const d = new Date(min);
    d.setHours(0, 0, 0, 0);
    d.setDate(1);
    if (d.getTime() < min) d.setMonth(d.getMonth() + 1);
    for (; d.getTime() <= max; d.setMonth(d.getMonth() + step)) ticks.push(d.getTime());
    const crossesYear = new Date(min).getFullYear() !== new Date(max).getFullYear();
    return {
      ticks,
      tick: (ms) => (crossesYear && new Date(ms).getMonth() === 0 ? monthYearFmt.format(ms) : monthFmt.format(ms)),
      full: fullDate,
    };
  }
  const years = days / 365;
  const step = years <= 8 ? 1 : years <= 16 ? 2 : 5;
  const d = new Date(min);
  d.setHours(0, 0, 0, 0);
  d.setMonth(0, 1);
  if (d.getTime() < min) d.setFullYear(d.getFullYear() + 1);
  for (; d.getTime() <= max; d.setFullYear(d.getFullYear() + step)) ticks.push(d.getTime());
  return { ticks, tick: (ms) => yearFmt.format(ms), full: fullDate };
}

/** The rows of a plot on a time axis: the category as epoch milliseconds, with the ticks and formats the axis needs. */
export function useTimeAxis(data: ChartDatum[], x: string, time: boolean) {
  return useMemo(() => {
    if (!time) return null;
    const rows = data.map((d) => ({ ...d, [x]: toMs(d[x]) }));
    const values = rows.map((r) => r[x] as number).filter((n) => Number.isFinite(n));
    const min = Math.min(...values);
    const max = Math.max(...values);
    return { rows, min, max, ...timeTicks(min, max) };
  }, [data, x, time]);
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
};

export const FrameContext = createContext<FrameState | null>(null);
export const none: ReadonlySet<string> = new Set();

/** What a plot inherits from the Frame around it: its name, the legend's state, the formats, whether it is loading, its sync and its textures. */
export function useFrame(
  label: string | undefined,
  format: Formatter | undefined,
  formatX: CategoryFormatter | undefined,
  loading?: boolean | undefined,
  syncId?: string | undefined,
  texture?: boolean | undefined,
) {
  const frame = useContext(FrameContext);
  return {
    name: label ?? frame?.name,
    hidden: frame?.hidden ?? none,
    highlighted: frame?.highlighted ?? null,
    format: format ?? frame?.format ?? formatNumber,
    formatX: formatX ?? frame?.formatX ?? formatCategory,
    loading: loading ?? frame?.loading ?? false,
    sync: syncId ?? frame?.sync,
    texture: texture ?? frame?.texture ?? false,
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

/** A recharts label prop only when there is a label to draw. */
export const labelProp = (l: ReturnType<typeof referenceLabel>) => (l ? { label: l } : {});

/* ---------- textures ---------- */

/** A pattern a series wears as well as its colour, so a stack reads in print, under colour-vision loss and in a forced-colours mode. `solid` is none. */
export type Texture = "solid" | "hatch" | "hatch-back" | "dots" | "cross" | "lines" | "columns";

const textureOrder: Texture[] = ["solid", "hatch", "hatch-back", "dots", "cross", "lines", "columns"];

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
      animationEasing: readToken("motion.easing.standard", "cubic-bezier(0.2, 0, 0.2, 1)") as Easing,
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

export const hasRefLabels = (reference: ChartReference[] | undefined, bands?: ChartBand[] | undefined) =>
  Boolean(reference?.some((r) => r.label)) || Boolean(bands?.some((b) => b.label && b.fromX !== undefined));

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
      <span
        aria-hidden
        className="inline-block h-025 w-150 shrink-0 rounded-xsmall"
        style={{ backgroundColor: color }}
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
  if (!active || !payload?.length) return null;
  const rows = payload.filter((p) => p.value !== null && p.value !== undefined);
  if (!rows.length) return null;
  const fmt = (key: string) => series.find((s) => s.key === key)?.format ?? format;
  const sum = total
    ? rows.reduce(
        (n, p) => (typeof p.value === "number" && String(p.dataKey) !== targetKey ? n + p.value : n),
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
          const name = isTarget ? "Target" : (s?.label ?? s?.key ?? p.name ?? key);
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

type ViewBox = { x: number; y: number; width: number; height: number };

const labelText = (text: string, x: number, y: number, anchor: "start" | "middle" | "end") => (
  <text x={x} y={y} textAnchor={anchor} className="font-body-xsmall" fill={token("color.text.subtlest")}>
    {text}
  </text>
);

/** A reference line's label in `color.text.subtlest`: above the plot for a vertical line, at the line's end for a horizontal one; a band's label above its middle. */
export function referenceLabel(text: string | undefined, vertical: boolean, band = false) {
  if (!text) return undefined;
  return (props: { viewBox?: ViewBox }) => {
    const v = props.viewBox ?? { x: 0, y: 0, width: 0, height: 0 };
    if (band) return labelText(text, v.x + v.width / 2, v.y - 5, "middle");
    return vertical
      ? labelText(text, v.x, v.y - 5, "middle")
      : labelText(text, v.x + v.width, v.y - 4, "end");
  };
}

/** A category value as recharts wants it on the axis: milliseconds on a time axis, itself otherwise. */
const axisValue = (v: string | number | Date | undefined, time: boolean) =>
  v === undefined ? undefined : time ? toMs(v) : v instanceof Date ? v.getTime() : v;

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
        const vertical = horizontal ? onValueAxis : !onValueAxis;
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
            {...labelProp(referenceLabel(r.label, vertical))}
          />
        );
      })}
    </>
  );
}

export function Bands({ bands, time }: { bands: ChartBand[] | undefined; time?: boolean | undefined }) {
  if (!bands?.length) return null;
  return (
    <>
      {bands.map((b, i) => {
        const across = b.fromX !== undefined || b.toX !== undefined;
        const pos = across
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
            {...labelProp(referenceLabel(b.label, false, across))}
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

export const pointAnchor = (p: { x?: number | undefined; y?: number | undefined } | undefined, r = 4): Anchor => ({
  x: (p?.x ?? 0) - r,
  y: (p?.y ?? 0) - r,
  width: r * 2,
  height: r * 2,
});

/** What the keyboard has under it: the active category and where the tooltip sits. */
export type Active = { label: string | number | undefined; coordinate: { x: number; y: number } | undefined };

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
  rows?: { swatch: ReactNode; label: string; value: string; note?: string | null | undefined }[] | undefined;
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
  return (
    <PopoverPrimitive.Root
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <PopoverPrimitive.Anchor asChild>
        <div
          aria-hidden
          className="pointer-events-none absolute"
          style={{ left: anchor.x, top: anchor.y, width: anchor.width, height: anchor.height }}
        />
      </PopoverPrimitive.Anchor>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          side="top"
          align="center"
          sideOffset={6}
          collisionPadding={8}
          aria-label={label ? `${label}, details` : "Details"}
          onCloseAutoFocus={(e) => {
            e.preventDefault();
            refocus();
          }}
          className={cn(
            "z-50 flex flex-col gap-150 rounded-large border border-default bg-surface-overlay p-150 font-body text-default shadow-overlay outline-none",
            menuMotion,
          )}
          style={{ width: 280 }}
        >
          {children}
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}

/* ---------- the plot wrapper ---------- */

/** Recharts puts the tab stop on its svg (`role="application"`); this is it, inside a plot. */
const surfaceIn = (el: HTMLElement | null) =>
  el?.querySelector<SVGElement>(".recharts-surface[tabindex]") ?? null;

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
  /** A fixed width in pixels for a plot that sits inline (a ring); the children then bring their own container. */
  width?: number | undefined;
}) {
  const ref = useRef<HTMLDivElement>(null);
  // Whether the plot was focused by a pointer or by the keyboard: the focus ring shows for the keyboard only.
  const [focusedBy, setFocusedBy] = useState<"pointer" | "keyboard" | null>(null);
  const refocus = () => surfaceIn(ref.current)?.focus();
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
      className={cn("relative", width === undefined && "w-full", busy && "opacity-loading", className)}
      style={{ height: height ?? heights[size ?? "medium"], width }}
      onPointerDownCapture={() => setFocusedBy("pointer")}
      onKeyDownCapture={onKeyDownCapture}
      onBlur={(e) => {
        if (!ref.current?.contains(e.relatedTarget as Node | null)) setFocusedBy(null);
      }}
    >
      {width === undefined ? (
        <ResponsiveContainer width="100%" height="100%">
          {children as never}
        </ResponsiveContainer>
      ) : (
        children
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

/** The table twin as CSV: the category column, then a column per series, the values unformatted and the categories formatted. */
export function toCsv(
  data: ChartDatum[],
  x: string,
  xLabel: string,
  series: ChartSeries[],
  formatX: CategoryFormatter,
): string {
  const head = [xLabel, ...series.map((s) => s.label ?? s.key)].map(csvCell).join(",");
  const rows = data.map((d) =>
    [
      formatX((d[x] as string | number | Date | undefined) ?? ""),
      ...series.map((s) => {
        const v = d[s.key];
        return typeof v === "number" ? String(v) : isRange(v) ? `${v[0]}–${v[1]}` : v == null ? "" : String(v);
      }),
    ]
      .map(csvCell)
      .join(","),
  );
  return [head, ...rows].join("\n");
}

/** A file name from a title: lower case, dashes, the extension. */
export const fileName = (title: string, ext: string) =>
  `${title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "chart"}.${ext}`;

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

const inlined = ["fill", "stroke", "stroke-width", "stroke-dasharray", "opacity", "fill-opacity", "font-family", "font-size", "font-weight", "letter-spacing", "text-anchor"] as const;

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
  const h = height ?? heights[size ?? "medium"];
  return (
    <div
      role={name ? "group" : undefined}
      aria-label={name ? `${name}, loading` : undefined}
      aria-busy
      aria-hidden={name ? undefined : true}
      className={cn("relative w-full animate-pulse", className)}
      style={{ height: h }}
    >
      {kind === "columns" ? (
        <div className="flex h-full items-end gap-150 border-b border-default pb-025 pe-150 ps-500">
          {pattern.map((p, i) => (
            <div key={i} className="flex-1 rounded-xsmall bg-skeleton" style={{ height: `${p}%` }} />
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
