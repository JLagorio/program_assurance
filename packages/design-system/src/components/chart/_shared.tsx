import * as PopoverPrimitive from "@radix-ui/react-popover";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
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
 * types, the Frame's context, the ticks, the swatches, the tooltip, the references and the bands, the
 * plot wrapper with its focus ring and its details card, the motion, and the skeletons. A part is one
 * file beside this one; nothing here is exported from the package except through them.
 */

/* ---------- tones and scales ---------- */

/** A status tone, `brand`, `neutral`, or one of the six categorical hues; `categorical.7` is Other. */
export type ChartTone = Tone | "brand" | `categorical.${1 | 2 | 3 | 4 | 5 | 6 | 7}`;

/** The plot's height: `small` 120px for a rail or a cell, `medium` 200px for a section, `large` 320px for the one chart a page is about. */
export type ChartSize = "small" | "medium" | "large";

export const heights: Record<ChartSize, number> = { small: 120, medium: 200, large: 320 };

/** The var() for a chart tone, for anything recharts does not cover. */
export const chartColor = (tone: ChartTone): string => token(`color.chart.${tone}` as TokenName);

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

/** One record along the category axis. A value may be a `[from, to]` pair for a floating bar. */
export type ChartDatum = Record<
  string,
  string | number | null | undefined | readonly [number, number]
>;

export type ChartSeries = {
  /** The key in each datum. */
  key: string;
  /** What the legend, the tooltip and the table call it. Defaults to the key. */
  label?: string | undefined;
  /** The `color.chart.*` token. Defaults to the categorical set, in order. */
  tone?: ChartTone | undefined;
};

/** A line across the plot: a target, a limit, a milestone. `y` is on the value axis, `x` on the category axis. */
export type ChartReference = {
  y?: number | undefined;
  x?: string | number | undefined;
  /** Printed at the line's end. */
  label?: string | undefined;
  /** `neutral` when unsaid: a target is context. `danger` for a limit that must not be crossed. */
  tone?: ChartTone | undefined;
};

/** A band between two values: the acceptable range, the plan's tolerance. */
export type ChartBand = {
  from: number;
  to: number;
  label?: string | undefined;
  /** `neutral` when unsaid. */
  tone?: ChartTone | undefined;
};

/** What was chosen on a cartesian plot: the record, the series when a mark was clicked (none when the whole category was chosen with Enter), and the record's index. */
export type ChartSelection = {
  datum: ChartDatum;
  series?: ChartSeries | undefined;
  index: number;
};

export type Formatter = (value: number) => string;
export type CategoryFormatter = (value: string | number) => string;

export const isRange = (v: unknown): v is readonly [number, number] =>
  Array.isArray(v) && v.length === 2 && typeof v[0] === "number" && typeof v[1] === "number";

export const formatValue = (v: unknown, format: Formatter): string => {
  if (typeof v === "number") return format(v);
  if (isRange(v)) return `${format(v[0])} to ${format(v[1])}`;
  if (v === null || v === undefined) return "";
  return String(v);
};

export const plainCategory: CategoryFormatter = (v) => String(v);

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
};

export const FrameContext = createContext<FrameState | null>(null);
export const none: ReadonlySet<string> = new Set();

/** What a plot inherits from the Frame around it: its name, the legend's state, the formats, whether it is loading. */
export function useFrame(
  label: string | undefined,
  format: Formatter | undefined,
  formatX: CategoryFormatter | undefined,
  loading?: boolean | undefined,
) {
  const frame = useContext(FrameContext);
  return {
    name: label ?? frame?.name,
    hidden: frame?.hidden ?? none,
    highlighted: frame?.highlighted ?? null,
    format: format ?? frame?.format ?? formatNumber,
    formatX: formatX ?? frame?.formatX ?? plainCategory,
    loading: loading ?? frame?.loading ?? false,
  };
}

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

/** The plot's margin. The top grows for end labels or a labelled reference, the right for end labels. */
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

export const hasRefLabels = (reference: ChartReference[] | undefined) =>
  Boolean(reference?.some((r) => r.label));

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

/** The key beside a name: a square for a fill, a stroke for a line, a dot for a point. */
export function Swatch({
  color,
  shape,
  hollow,
}: {
  color: string;
  shape: SwatchShape;
  hollow?: boolean | undefined;
}) {
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

/** The tooltip: the category, then every series at that point, the value leading, keyed by a swatch shaped like the mark. A stack adds its total. */
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
}) {
  if (!active || !payload?.length) return null;
  const rows = payload.filter((p) => p.value !== null && p.value !== undefined);
  if (!rows.length) return null;
  const sum = total
    ? rows.reduce((n, p) => (typeof p.value === "number" && String(p.dataKey) !== targetKey ? n + p.value : n), 0)
    : null;
  return (
    <div className={cn("min-w-0", overlay)}>
      {label !== undefined && label !== "" ? (
        <div className="pb-050 font-body-small font-medium text-default">{formatX(label)}</div>
      ) : null}
      <div className={cn("flex flex-col gap-025", sum !== null && rows.length > 1 && "pb-050")}>
        {rows.map((p, i) => {
          const key = String(p.dataKey ?? "");
          const s = series.find((x) => x.key === key);
          const isTarget = targetKey !== undefined && key === targetKey;
          const name = isTarget ? "Target" : (s?.label ?? s?.key ?? p.name ?? key);
          return (
            <div key={i} className="flex items-center gap-100 font-body-small">
              <Swatch
                color={isTarget ? token("color.text") : (p.color ?? "")}
                shape={isTarget ? "line" : swatch}
              />
              <span className="min-w-0 flex-1 truncate text-subtle">{name}</span>
              <span className="tabular-nums font-medium text-default">
                {formatValue(p.value, format)}
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

/** A reference line's label in `color.text.subtlest`: above the plot for a vertical line, at the line's end for a horizontal one. */
export function referenceLabel(text: string | undefined, vertical: boolean) {
  if (!text) return undefined;
  return (props: { viewBox?: ViewBox }) => {
    const v = props.viewBox ?? { x: 0, y: 0, width: 0, height: 0 };
    return vertical ? (
      <text
        x={v.x}
        y={v.y - 5}
        textAnchor="middle"
        className="font-body-xsmall"
        fill={token("color.text.subtlest")}
      >
        {text}
      </text>
    ) : (
      <text
        x={v.x + v.width}
        y={v.y - 4}
        textAnchor="end"
        className="font-body-xsmall"
        fill={token("color.text.subtlest")}
      >
        {text}
      </text>
    );
  };
}

export function References({
  reference,
  horizontal,
}: {
  reference: ChartReference[] | undefined;
  horizontal?: boolean | undefined;
}) {
  if (!reference?.length) return null;
  return (
    <>
      {reference.map((r, i) => {
        const stroke = chartColor(r.tone ?? "neutral");
        // On a horizontal chart the value axis is x, so a `y` reference is a vertical line.
        const onValueAxis = r.y !== undefined;
        const vertical = horizontal ? onValueAxis : !onValueAxis;
        const pos = horizontal
          ? onValueAxis
            ? { x: r.y as number }
            : { y: r.x as string | number }
          : onValueAxis
            ? { y: r.y as number }
            : { x: r.x as string | number };
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

export function Bands({ bands }: { bands: ChartBand[] | undefined }) {
  if (!bands?.length) return null;
  return (
    <>
      {bands.map((b, i) => (
        <ReferenceArea
          key={i}
          y1={b.from}
          y2={b.to}
          fill={chartColor(b.tone ?? "neutral")}
          fillOpacity={0.1}
          stroke="none"
          ifOverflow="extendDomain"
          {...labelProp(referenceLabel(b.label, false))}
        />
      ))}
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
  /** One line per series, for a whole category. */
  rows?: { swatch: ReactNode; label: string; value: string }[] | undefined;
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
