import { ReferenceLine, useChartWidth, usePlotArea } from "recharts";

import { token, tokenValue } from "../../generated/tokens";
import { cn } from "../../lib/cn";
import { useLedgerLocale } from "../../lib/locale";
import { fitLabel, pointStep } from "./_labels";
import { TextureSwatch, type Texture } from "./_texture";
import { toMs } from "./_time";
import type {
  CategoryFormatter,
  ChartBand,
  ChartDatum,
  ChartReference,
  ChartSeries,
  Formatter,
  SwatchShape,
} from "./_types";
import { deltaText, formatValue, truncate } from "./_values";

/* The marks every cartesian part shares: the ticks and the axis titles, the zero line, the
   swatches, the margins and the tooltip. */

let measureContext: CanvasRenderingContext2D | null | undefined;
/** A label's width in `font.body.xsmall`, measured, or estimated where there is no canvas. */
export const labelWidth = (text: string) => {
  if (measureContext === undefined && typeof document !== "undefined")
    measureContext = document.createElement("canvas").getContext("2d");
  if (!measureContext) return text.length * 6.5;
  measureContext.font = tokenValue("font.body.xsmall");
  return measureContext.measureText(text).width;
};

/** The line height of `font.body.xsmall`, for a tick's second line. */
const TICK_LINE = 13;

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

/** What a tick prints for a value: `format`'s text cut to `max` characters. Pass the same to the axis' `tickFormatter`, so recharts measures the drawn text when it thins ticks. */
export const tickText = (
  value: unknown,
  format?: ((value: string | number) => string) | undefined,
  max?: number | undefined,
) => {
  const raw = (value as string | number | undefined) ?? "";
  const text = format ? format(raw) : String(raw);
  return max === undefined ? text : truncate(text, max);
};

/**
 * An axis tick in `font.body.xsmall` and `color.text.subtlest`. With `room`, a category's width in
 * pixels, the label fits it: whole, or on `lines` lines broken at a space, each cut with an
 * ellipsis, so every category keeps a label. With `reach`, the room is how far the label may run
 * either side of its point, and a label wider than one side allows moves in from it. Without
 * either (a value or a date, which the axis thins by the text it prints), the text is whole unless
 * `max` cuts it. A cut label keeps its whole in a title. The text carries recharts' tick class, so
 * recharts measures it in the tick's font.
 */
export function Tick({
  x,
  y,
  payload,
  textAnchor,
  vertical,
  format,
  max,
  room: roomProp,
  reach,
  lines = 1,
}: {
  x?: number | string | undefined;
  y?: number | string | undefined;
  payload?: { value: string | number } | undefined;
  textAnchor?: "start" | "middle" | "end" | "inherit" | undefined;
  vertical?: boolean | undefined;
  format?: ((value: string | number) => string) | undefined;
  /** Without `room` or `reach`, the most characters the text keeps. Whole when unsaid. */
  max?: number | undefined;
  /** The category's width in pixels: the label fits it. */
  room?: number | undefined;
  /** How far, in pixels, the label may run before and after its point: the room, split unevenly at the plot's edge. */
  reach?: readonly [before: number, after: number] | undefined;
  /** With `room` or `reach`, whether a long label may take a second line. */
  lines?: 1 | 2 | undefined;
}) {
  const text = tickText(payload?.value, format);
  const room = reach ? reach[0] + reach[1] : roomProp;
  const shown =
    room !== undefined
      ? fitLabel(text, Math.max(room, 8), labelWidth, lines)
      : [max === undefined ? text : truncate(text, max)];
  const cut = shown.join(" ") !== text;
  // Centred on its point unless one side has less room than half the label: then it moves in.
  let at = x;
  if (reach && typeof x === "number") {
    const half = Math.max(0, ...shown.map(labelWidth)) / 2;
    at = x + Math.max(0, half - reach[0]) - Math.max(0, half - reach[1]);
  }
  return (
    <text
      x={at}
      y={y}
      dy={vertical ? 4 : 12}
      textAnchor={textAnchor ?? (vertical ? "end" : "middle")}
      // recharts reads the tick's font from its own tick class, to thin the ticks by the text they print.
      className="recharts-cartesian-axis-tick-value font-body-xsmall tabular-nums"
      fill={token("color.text.subtlest")}
    >
      {cut ? <title>{text}</title> : null}
      {shown.length > 1
        ? shown.map((line, i) => (
            // The first line keeps the text's own offset; the second drops a line under it.
            <tspan key={i} x={at} {...(i === 0 ? {} : { dy: TICK_LINE })}>
              {line}
            </tspan>
          ))
        : shown[0]}
    </text>
  );
}

/** The room a point axis keeps between two labels, and between a label and the svg's edge. */
const POINT_GAP = 8;
const EDGE_GAP = 2;

/**
 * A category tick on a line or an area, whose categories are points: `Tick` fitted to the slots
 * between it and the next label printed, `step` slots each way, half on either side of its point.
 * At the plot's edge the label may run past the plot to the svg's edge, and moves in from it
 * rather than past it.
 */
export function PointTick({
  count,
  step = 1,
  ...props
}: Parameters<typeof Tick>[0] & {
  /** How many categories the axis holds. */
  count: number;
  /** How many slots lie between two printed labels: 1 prints every category. */
  step?: number | undefined;
}) {
  const plot = usePlotArea();
  const chartWidth = useChartWidth();
  const x = typeof props.x === "number" ? props.x : Number(props.x);
  if (!plot || !Number.isFinite(x) || count < 1) return <Tick {...props} />;
  const slot = count > 1 ? plot.width / (count - 1) : plot.width;
  const half = Math.max(0, (step * slot - POINT_GAP) / 2);
  const end = chartWidth ?? plot.x + plot.width;
  return (
    <Tick
      {...props}
      reach={[
        Math.max(0, Math.min(half, x - EDGE_GAP)),
        Math.max(0, Math.min(half, end - x - EDGE_GAP)),
      ]}
    />
  );
}

/**
 * How a point axis prints its labels in a plot `width` pixels wide, with `before` pixels of svg
 * before the plot (the value axis) and `after` after it: every `step` slots, each given the room
 * `PointTick` gives it, on two lines when one label that can break at a space will not fit on one.
 */
export const pointLabels = (
  labels: string[],
  width: number | undefined,
  before = 0,
  after = 0,
): { step: number; lines: 1 | 2 } => {
  if (!width || width <= 0 || !labels.length) return { step: 1, lines: 1 };
  const count = labels.length;
  const slot = count > 1 ? width / (count - 1) : width;
  const step = pointStep(labels, slot, labelWidth, POINT_GAP);
  const half = Math.max(0, (step * slot - POINT_GAP) / 2);
  const end = before + width + after;
  const wraps = labels.some((label, i) => {
    if (i % step !== 0 || !/\S\s+\S/.test(label)) return false;
    // The point's place in the svg, as recharts draws it: a lone category sits mid-plot.
    const x = count > 1 ? before + i * slot : before + width / 2;
    const room =
      Math.max(0, Math.min(half, x - EDGE_GAP)) + Math.max(0, Math.min(half, end - x - EDGE_GAP));
    return labelWidth(label) > room;
  });
  return { step, lines: wraps ? 2 : 1 };
};

/**
 * A category tick on a column chart: `Tick` with the category's width as its room, from the plot's
 * width and the number of categories, so every category keeps a label at any width.
 */
export function CategoryTick({ count, ...props }: Parameters<typeof Tick>[0] & { count: number }) {
  const plot = usePlotArea();
  const room = plot && count > 0 ? plot.width / count - 4 : undefined;
  return <Tick {...props} room={room} />;
}

/** How many lines a column chart's category labels need in `width` pixels of plot: 2 when one does not fit its category whole. */
export const categoryLines = (labels: string[], width: number | undefined): 1 | 2 => {
  if (!width || !labels.length) return 1;
  const room = width / labels.length - 4;
  return labels.some((l) => labelWidth(l) > room) ? 2 : 1;
};

/** The category axis' height for one or two lines of labels, with room for a title. */
export const categoryAxisHeight = (lines: 1 | 2, titled: boolean) =>
  (lines === 2 ? 24 + TICK_LINE : 24) + (titled ? 12 : 0);

/** An axis title in `font.body.xsmall` and `color.text.subtle`. */
export const axisTitle = (value: string, vertical: boolean) => ({
  value,
  ...(vertical
    ? { angle: -90, position: "insideLeft" as const, offset: 4 }
    : { position: "insideBottom" as const, offset: -2 }),
  className: "font-body-xsmall",
  fill: token("color.text.subtle"),
});

/**
 * The key beside a name: a square for a fill, a stroke for a line, a dot for a point; a pattern
 * when the series is textured. In a forced-colours mode it keeps its colour (`data-slot="chart-swatch"`),
 * as the marks do, so a name still maps to its mark.
 */
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
        data-slot="chart-swatch"
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
      data-slot="chart-swatch"
      className={cn(
        "inline-block size-100 shrink-0",
        shape === "dot" ? "rounded-full" : "rounded-xsmall",
        hollow && "border",
      )}
      style={hollow ? { borderColor: color } : { backgroundColor: color }}
    />
  );
}

/** The plot's margin. The top grows for end labels or a labelled reference or band; the right holds the widest end label (`endWidth`). */
export const marginFor = ({
  endLabels,
  refLabels,
  horizontal,
  endWidth,
}: {
  endLabels?: boolean | undefined;
  refLabels?: boolean | undefined;
  horizontal?: boolean | undefined;
  /** The widest end label's width in pixels, when the part knows it. */
  endWidth?: number | undefined;
}) => ({
  top: endLabels || refLabels ? 16 : 8,
  right: endLabels
    ? endWidth !== undefined
      ? Math.max(12, Math.ceil(endWidth) + (horizontal ? 8 : 12))
      : horizontal
        ? 40
        : 44
    : 12,
  bottom: 0,
  left: 0,
});

export const hasRefLabels = (
  reference: ChartReference[] | undefined,
  bands?: ChartBand[] | undefined,
) =>
  Boolean(reference?.some((r) => r.label)) ||
  Boolean(bands?.some((b) => b.label && b.fromX !== undefined));

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
  totalKeys,
  data,
  x,
  delta,
  textures,
  showLabel = true,
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
  /** The keys the total sums: the stacked series. Every numeric row but the target when unsaid. */
  totalKeys?: readonly string[] | undefined;
  /** The rows and the category key, so a change from the previous point can be printed. */
  data?: ChartDatum[] | undefined;
  x?: string | undefined;
  delta?: boolean | undefined;
  /** The texture per series key, for the swatches. */
  textures?: Record<string, Texture> | undefined;
  /** Print the category above the rows. Off for a plot with no category key, whose label would be an index. */
  showLabel?: boolean | undefined;
}) {
  const { t } = useLedgerLocale();

  if (!active || !payload?.length) return null;
  const rows = payload.filter((p) => p.value !== null && p.value !== undefined);
  if (!rows.length) return null;
  const fmt = (key: string) => series.find((s) => s.key === key)?.format ?? format;
  const counted = (p: TooltipRow) => {
    const key = String(p.dataKey);
    return totalKeys ? totalKeys.includes(key) : key !== targetKey;
  };
  const summed = total ? rows.filter((p) => typeof p.value === "number" && counted(p)) : [];
  const sum = total ? summed.reduce((n, p) => n + (p.value as number), 0) : null;
  const previous =
    delta && data && x && label !== undefined
      ? data[data.findIndex((d) => d[x] === label || toMs(d[x]) === label) - 1]
      : undefined;
  return (
    <div className={cn("min-w-0", overlay)}>
      {showLabel && label !== undefined && label !== "" ? (
        <div className="pb-050 font-body-small font-medium text-default">{formatX(label)}</div>
      ) : null}
      <div className={cn("flex flex-col gap-025", sum !== null && summed.length > 1 && "pb-050")}>
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
                {formatValue(p.value, fmt(key), formatX)}
              </span>
            </div>
          );
        })}
      </div>
      {sum !== null && summed.length > 1 ? (
        <div className="flex items-center gap-100 border-t border-default pt-050 font-body-small">
          <span className="size-100 shrink-0" aria-hidden />
          <span className="min-w-0 flex-1 truncate text-subtle">{t("chartTotal")}</span>
          <span className="tabular-nums font-medium text-default">{format(sum)}</span>
        </div>
      ) : null}
    </div>
  );
}
