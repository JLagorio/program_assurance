import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ComponentProps,
  type KeyboardEvent,
  type ReactNode,
  type RefObject,
} from "react";
import {
  ResponsiveContainer,
  useActiveTooltipCoordinate,
  useActiveTooltipLabel,
  usePlotArea,
  useXAxisScale,
  useYAxisScale,
} from "recharts";

import { token } from "../../generated/tokens";
import { cn } from "../../lib/cn";
import { useLedgerLocale } from "../../lib/locale";
import { Card, type Anchor } from "./_card";
import { PlotTextureDefs, type TextureEntry } from "./_texture";
import {
  heights,
  type CategoryFormatter,
  type ChartDatum,
  type ChartSeries,
  type ChartSize,
  type Formatter,
} from "./_types";
import { formatValue } from "./_values";

/* The plot wrapper: the box at the kit's height, the svg's name and role, the keyboard walk and
   what it says, the focus ring, the details card, and the skeleton. */

/** What the tooltip is on: the active category and where the tooltip sits. */
export type Active = {
  label: string | number | undefined;
  coordinate: { x: number; y: number } | undefined;
};

/** Where a category sits in the plot: the middle of its band or its point along the category axis, the middle of the plot across it. */
export type Locate = (value: unknown) => { x: number; y: number } | undefined;

/**
 * Inside a chart: keeps the active point in a ref, so a click on the plot can choose it, and,
 * with `locate`, where any category sits, so a card opened by Enter anchors to the category the
 * keyboard is on even when the tooltip is elsewhere (a pointer resting on another). `rows`: the
 * categories run down the side.
 */
export function ActiveProbe({
  target,
  locate,
  rows,
}: {
  target: RefObject<Active | null>;
  locate?: RefObject<Locate | null> | undefined;
  rows?: boolean | undefined;
}) {
  const label = useActiveTooltipLabel();
  const coordinate = useActiveTooltipCoordinate();
  const xScale = useXAxisScale();
  const yScale = useYAxisScale();
  const plot = usePlotArea();
  useEffect(() => {
    target.current =
      label === undefined || label === null
        ? null
        : { label: label as string | number, coordinate };
    if (locate)
      locate.current = (value) => {
        const at = (rows ? yScale : xScale)?.(value, { position: "middle" });
        if (!plot || at === undefined || !Number.isFinite(at)) return undefined;
        return rows
          ? { x: plot.x + plot.width / 2, y: at }
          : { x: at, y: plot.y + plot.height / 2 };
      };
  });
  return null;
}

/**
 * The tab stop inside a plot: the svg a part marks with `data-chart-surface` (a Bar, a Line, an
 * Area), recharts' own svg (`role="application"`) for a part that does not, or a focusable tile.
 */
const surfaceIn = (el: HTMLElement | null) =>
  el?.querySelector<SVGElement>(
    "[data-chart-surface][tabindex], .recharts-surface[tabindex], [data-chart-tile][tabindex]",
  ) ?? null;

/** How the arrow keys walk a category plot: along the columns (left and right) or down the rows of a horizontal chart. */
export type WalkLayout = "columns" | "rows";

/** The keyboard walk a Plot runs over its categories, from `useChartSurface`. */
export type PlotWalk = {
  layout: WalkLayout;
  /** How many categories there are. */
  count: number;
  /** What the live region says of the category at an index: its name and every visible value. */
  describe: (index: number) => string;
  /** The id and the text of the keys' description, which the svg is described by. */
  hintId: string;
  hint: string;
};

const warned = new Set<string>();
/** A composition mistake said once in the console, never thrown: the plot still renders. */
function useWarnOnce(when: boolean, message: string) {
  useEffect(() => {
    if (!when || warned.has(message)) return;
    warned.add(message);
    console.warn(message);
  }, [when, message]);
}

/**
 * How a category part's svg is named and reached, to spread on its recharts chart. A plot that
 * chooses (`onSelect` or `details`) is one tab stop, `role="application"` with the role
 * description "chart", named by the Frame's title or `label`, described by its keys; the arrow
 * keys walk its categories, Home and End go to either end, Enter and Space choose, and each step is
 * said in a polite live region. A named plot that chooses nothing is `role="img"` with no tab stop,
 * and the table twin carries its numbers. An unnamed one is decoration; one that chooses anyway is
 * named "Chart", with a warning in development, so the keyboard still reaches it.
 */
export function useChartSurface({
  name,
  titleId,
  chooses,
  layout = "columns",
  describedBy,
  count,
  describe,
}: {
  name: string | undefined;
  titleId?: string | undefined;
  chooses: boolean;
  layout?: WalkLayout | undefined;
  describedBy?: string | undefined;
  count: number;
  describe: (index: number) => string;
}) {
  const { t } = useLedgerLocale();
  const hintId = useId();
  const fallback = chooses && !name && !titleId;
  useWarnOnce(
    fallback,
    "Ledger Chart: a plot with onSelect or details needs a name. Put it in a Chart.Frame or give it a label, so a keyboard and a screen reader know what it chooses.",
  );
  const label = name ?? (fallback ? t("chartUnnamed") : undefined);
  const labelling = titleId ? { "aria-labelledby": titleId } : { "aria-label": label };
  const chart: Record<string, unknown> = chooses
    ? {
        accessibilityLayer: true,
        role: "application",
        tabIndex: 0,
        "aria-roledescription": t("chartRole"),
        ...labelling,
        "aria-describedby": [describedBy, hintId].filter(Boolean).join(" "),
        "data-chart-surface": "",
      }
    : label || titleId
      ? {
          accessibilityLayer: false,
          role: "img",
          ...labelling,
          ...(describedBy ? { "aria-describedby": describedBy } : {}),
          "data-chart-surface": "",
        }
      : { accessibilityLayer: false, "data-chart-surface": "" };
  const walk: PlotWalk | undefined = chooses
    ? {
        layout,
        count,
        describe,
        hintId,
        hint: t(layout === "rows" ? "chartKeysRows" : "chartKeysColumns"),
      }
    : undefined;
  return { chart, walk, name: label, labelled: Boolean(label || titleId) };
}

/**
 * The words for one category, for the live region: "AU: Satisfied 18, Partial 4, total 26". Each
 * visible series in its format, then the total of `totalKeys` when there is more than one.
 */
export function useDescribePoint({
  data,
  x,
  series,
  hidden,
  format,
  formatX,
  totalKeys,
  targetKey,
}: {
  data: ChartDatum[];
  x: string;
  series: ChartSeries[];
  hidden: ReadonlySet<string>;
  format: Formatter;
  formatX: CategoryFormatter;
  totalKeys?: readonly string[] | undefined;
  /** A key holding each category's target, said after the values. */
  targetKey?: string | undefined;
}) {
  const { t } = useLedgerLocale();
  return useCallback(
    (index: number) => {
      const datum = data[index];
      if (!datum) return "";
      const shown = series.filter((s) => !hidden.has(s.key));
      const values = shown
        .filter((s) => datum[s.key] !== null && datum[s.key] !== undefined)
        .map((s) =>
          t("chartSeriesValue", {
            label: s.label ?? s.key,
            value: formatValue(datum[s.key], s.format ?? format, formatX),
          }),
        );
      const counted = totalKeys ? shown.filter((s) => totalKeys.includes(s.key)) : [];
      if (counted.length > 1) {
        const sum = counted.reduce((n, s) => {
          const v = datum[s.key];
          return typeof v === "number" ? n + v : n;
        }, 0);
        values.push(t("chartTotalValue", { value: format(sum) }));
      }
      const target = targetKey === undefined ? undefined : datum[targetKey];
      if (target !== null && target !== undefined)
        values.push(
          t("chartSeriesValue", {
            label: t("target"),
            value: formatValue(target, format, formatX),
          }),
        );
      return t("chartPoint", {
        category: formatX((datum[x] as string | number | Date | undefined) ?? ""),
        values: values.join(", "),
      });
    },
    [data, x, series, hidden, format, formatX, totalKeys, targetKey, t],
  );
}

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

export type PlotProps = Omit<ComponentProps<"div">, "children" | "role"> & {
  name: string | undefined;
  size?: ChartSize | undefined;
  height?: number | undefined;
  className?: string | undefined;
  children: ReactNode;
  /** The details card for the chosen mark, and where it anchors. */
  card?: ReactNode | undefined;
  anchor?: Anchor | null | undefined;
  onClose?: (() => void) | undefined;
  /**
   * Enter or Space on the focused plot. With a `walk`, it hears the index of the category the
   * keyboard is on, the one the live region last said, whatever the tooltip shows.
   */
  onEnter?: ((index: number | undefined) => void) | undefined;
  /**
   * The largest width in pixels for a plot that sits inline (a ring); the children then bring their
   * own container. The plot keeps `width` by `height` as its ratio and scales down to a narrower
   * container, never up, in a block, a grid track or a flex row alike.
   */
  width?: number | undefined;
  /**
   * Where the plot's name lives. `wrapper`, the default: the box is a group named `name`, and
   * hidden from a screen reader without one. `surface`: the chart's svg carries the name and the
   * role (`useChartSurface`), and the box is plain, hidden only when nothing is named.
   */
  semantics?: "wrapper" | "surface" | undefined;
  /** The keyboard walk over the categories, from `useChartSurface`. */
  walk?: PlotWalk | undefined;
  /** The patterns of textured series: drawn once beside the chart, so every fill that points at them paints. */
  textures?: { id: string; entries: TextureEntry[] } | undefined;
  /** The plot's measured size, as it changes. */
  onResize?: ((width: number, height: number) => void) | undefined;
};

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
  width,
  semantics = "wrapper",
  walk,
  textures,
  onResize,
  onKeyDownCapture: callerKeyDown,
  onKeyDown: callerKeyDownBubble,
  onFocusCapture: callerFocus,
  onPointerDownCapture: callerPointerDown,
  onBlur: callerBlur,
  onFocus: callerFocusBubble,
  style,
  ref: callerRef,
  ...native
}: PlotProps) {
  const ref = useRef<HTMLDivElement>(null);
  // The caller's ref and the plot's own reach the same element.
  const setRef = useCallback(
    (node: HTMLDivElement | null) => {
      ref.current = node;
      if (typeof callerRef === "function") callerRef(node);
      else if (callerRef) callerRef.current = node;
    },
    [callerRef],
  );
  const plotHeight = height ?? heights[size ?? "medium"];
  const focusedTile = useRef<SVGElement | null>(null);
  const focusedTileKey = useRef<string | null>(null);
  // Whether the plot was focused by a pointer or by the keyboard: the focus ring shows for the keyboard only.
  const [focusedBy, setFocusedBy] = useState<"pointer" | "keyboard" | null>(null);
  // The category the keyboard is on, as recharts counts it: it starts at the first on focus and
  // moves only by the keys the plot sends it.
  const keyIndex = useRef<number | null>(null);
  const replaying = useRef(false);
  const [live, setLive] = useState("");
  const count = walk?.count ?? 0;
  useEffect(() => {
    if (keyIndex.current !== null && count > 0 && keyIndex.current > count - 1)
      keyIndex.current = count - 1;
  }, [count]);
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
  const say = (index: number) => {
    if (walk) setLive(walk.describe(index));
  };
  /**
   * Sends recharts `steps` of its own keys, forward (+1) or back (−1) one category each. Recharts
   * moves one category per ArrowRight or ArrowLeft, and on a horizontal chart it reads them the
   * other way round; the plot sends the key that goes the way the reader asked.
   */
  const send = (surface: SVGElement, steps: number, direction: 1 | -1) => {
    if (!walk || steps <= 0) return;
    const rows = walk.layout === "rows";
    const key =
      direction > 0 ? (rows ? "ArrowLeft" : "ArrowRight") : rows ? "ArrowRight" : "ArrowLeft";
    replaying.current = true;
    try {
      for (let i = 0; i < steps; i++)
        surface.dispatchEvent(
          new globalThis.KeyboardEvent("keydown", { key, bubbles: true, cancelable: true }),
        );
    } finally {
      replaying.current = false;
    }
  };
  /**
   * Back on a plot focus left, recharts keeps its category but hides its tooltip. The plot walks it
   * to the first category and on to the one the keyboard is on, so the tooltip shows where the
   * live region says it is. A plot of one category has nowhere to walk: Enter still chooses it.
   */
  const resume = (surface: SVGElement, at: number) => {
    if (!walk || walk.count < 2) return;
    const last = walk.count - 1;
    send(surface, last, -1);
    if (at === last) send(surface, last, 1);
    else {
      send(surface, at + 1, 1);
      send(surface, 1, -1);
    }
  };
  const onKeyDownCapture = (e: KeyboardEvent<HTMLDivElement>) => {
    // The plot's own keys, sent on to recharts below, pass through untouched.
    if (replaying.current) return;
    callerKeyDown?.(e);
    setFocusedBy("keyboard");
    const surface = surfaceIn(ref.current);
    if (e.target !== surface) return;
    if (onEnter && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      e.stopPropagation();
      onEnter(walk ? (keyIndex.current ?? 0) : undefined);
      return;
    }
    if (!walk || !surface || walk.count === 0) return;
    const rows = walk.layout === "rows";
    const at = keyIndex.current ?? 0;
    const last = walk.count - 1;
    let to: number;
    if (e.key === "ArrowRight" || (rows && e.key === "ArrowDown")) to = Math.min(at + 1, last);
    else if (e.key === "ArrowLeft" || (rows && e.key === "ArrowUp")) to = Math.max(at - 1, 0);
    else if (e.key === "Home") to = 0;
    else if (e.key === "End") to = last;
    else return;
    e.preventDefault();
    e.stopPropagation();
    // Once per category, so Right, Down, Home and End all land where they say.
    send(surface, Math.abs(to - at), to > at ? 1 : -1);
    keyIndex.current = to;
    say(to);
  };
  const described = semantics === "surface";
  const labelled = described ? Boolean(name) || Boolean(walk) : Boolean(name);
  return (
    <div
      {...native}
      ref={setRef}
      role={!described && name ? "group" : undefined}
      aria-label={!described ? name : undefined}
      aria-hidden={labelled ? undefined : true}
      data-focus={focusedBy ?? undefined}
      data-chart-plot=""
      data-card={card && anchor ? "open" : undefined}
      className={cn("relative", width === undefined ? "w-full" : "w-fit max-w-full", className)}
      style={width === undefined ? { height: plotHeight, ...style } : style}
      onFocusCapture={(event) => {
        callerFocus?.(event);
        const tile = (event.target as Element).closest<SVGElement>("[data-chart-tile]");
        if (tile) {
          focusedTile.current = tile;
          focusedTileKey.current = tile.getAttribute("data-chart-tile");
        }
      }}
      onFocus={(event) => {
        callerFocusBubble?.(event);
        // Reached by the keyboard, the walk says where it stands, from the first category the
        // first time, and the tooltip shows there too, also on a plot a click focused before.
        const target = event.target as Element;
        const surface = surfaceIn(ref.current);
        if (walk && surface && target === surface && target.matches(":focus-visible")) {
          keyIndex.current ??= 0;
          resume(surface, keyIndex.current);
          say(keyIndex.current);
        }
      }}
      onPointerDownCapture={(event) => {
        callerPointerDown?.(event);
        setFocusedBy("pointer");
        const tile = (event.target as Element).closest<SVGElement>("[data-chart-tile]");
        if (tile) {
          focusedTile.current = tile;
          focusedTileKey.current = tile.getAttribute("data-chart-tile");
        }
      }}
      onKeyDownCapture={onKeyDownCapture}
      onKeyDown={(e) => {
        // The keys the plot sends recharts end here, once recharts has moved: the page around the
        // plot, and the caller, hear only the reader's own keys.
        if (replaying.current) {
          e.stopPropagation();
          return;
        }
        callerKeyDownBubble?.(e);
      }}
      onBlur={(e) => {
        callerBlur?.(e);
        if (!ref.current?.contains(e.relatedTarget as Node | null)) setFocusedBy(null);
      }}
    >
      {textures ? <PlotTextureDefs id={textures.id} entries={textures.entries} /> : null}
      {width === undefined ? (
        <ResponsiveContainer
          width="100%"
          height="100%"
          initialDimension={{ width: 320, height: plotHeight }}
          {...(onResize ? { onResize } : {})}
        >
          {children as never}
        </ResponsiveContainer>
      ) : (
        <>
          <InlineSizer width={width} height={plotHeight} ratio />
          <div className="absolute inset-0">{children}</div>
        </>
      )}
      {walk ? (
        <>
          <span id={walk.hintId} hidden>
            {walk.hint}
          </span>
          {/* One persistent region, written only when the keyboard moves, so each step is heard once. */}
          <span className="sr-only" aria-live="polite" aria-atomic="true" data-slot="chart-live">
            {live}
          </span>
        </>
      ) : null}
      {card && anchor ? (
        <Card anchor={anchor} label={name} onClose={() => onClose?.()} refocus={refocus}>
          {card}
        </Card>
      ) : null}
    </div>
  );
}

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
