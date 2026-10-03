import { useRender } from "@base-ui/react/use-render";
import { useLedgerLocale } from "../../lib/locale";
import {
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type ReactNode,
  type RefObject,
} from "react";

import { token } from "../../generated/tokens";
import { cn } from "../../lib/cn";
import { toneClasses, type Tone } from "../../components/badge";
import {
  Card,
  CardHead,
  FrameContext,
  divergingColor,
  faintEdge,
  faintStep,
  useFrame,
  useFrameReport,
  sequentialColor,
  type ChartLink,
  type ChartSize,
  type Formatter,
  type FrameReport,
  type TwinSource,
} from "./_shared";

/** One hue for how much, two for above and below, or a function that says which status tone a cell carries, from its value or its place. */
export type HeatmapScale =
  "sequential" | "diverging" | ((value: number, row: string, column: string) => Tone);

/** What was chosen on a heatmap: the cell's row, column and value. */
export type HeatmapSelection = { row: string; column: string; value: number };

type ChartHeatmapOwnProps = {
  /** The row names, top to bottom. */
  rows: string[];
  /** The column names, left to right. */
  columns: string[];
  /** The value at a row and column. `undefined` or `null` leaves the cell empty. */
  value: (row: string, column: string) => number | null | undefined;
  /** `sequential` paints how much in one hue; `diverging` paints above and below `midpoint` in two; a function says which status tone a cell carries, from its value or its row and column, and the cell prints its value. */
  scale?: HeatmapScale | undefined;
  /** The values at the ends of the scale. The data's own when unsaid. Give `Chart.Scale` the same `domain`, so the key's thresholds are the grid's. */
  domain?: readonly [number, number] | undefined;
  /** The value that reads as nothing on a diverging scale. Zero when unsaid. */
  midpoint?: number | undefined;
  /** On a sequential scale, zero takes a step of its own in `color.chart.track`, so none reads apart from a few; every other value bins as before. Give `Chart.Scale` the same `zeroStep`. */
  zeroStep?: boolean | undefined;
  /** Print the value in each cell. On for a status scale, where the tone's fill carries its text. On a colour scale a printed value sits on a surface chip; unsaid there, a Frame around the grid offers the reader a Values toggle that prints them, and the Frame's table twin carries them either way. `false` keeps them hidden and offers no toggle. */
  showValues?: boolean | undefined;
  /** The cell's height: `small` 24px, `medium` 32px, `large` 40px. `large` in the expanded Dialog. */
  size?: ChartSize | undefined;
  /** The value's format in the cells, the tooltip, the card and the table twin. The Frame's, else the kit's. */
  format?: Formatter | undefined;
  /** The grid's accessible name: it is a table. The Frame's title when unsaid. */
  label?: string | undefined;
  /** What the rows and the columns are: the corner cell, and the description a screen reader hears. */
  rowLabel?: string | undefined;
  columnLabel?: string | undefined;
  /** Draws skeleton cells in place of the values, the grid keeping its rows and columns. The Frame sets it from `state="loading"`. */
  loading?: boolean | undefined;
  /** Makes the cells buttons: called when one is clicked or chosen with Enter or Space. */
  onSelect?: ((selection: HeatmapSelection) => void) | undefined;
  /** More about the chosen cell, in a card anchored to it. The card's head (the row, the column and the value) is the kit's. */
  details?: ((selection: HeatmapSelection) => ReactNode) | undefined;
  /**
   * The link element (a router's Link, or `<a href>`) a cell opens: the register filtered to the
   * cell's row and column. The cell becomes that link, named by its place and value, so a modifier
   * or middle click opens it in a new tab; the table twin's value links to the same place. Return
   * `undefined` to leave a cell as it is. A cell that links does not also choose: `onSelect` and
   * `details` apply to the cells it returns nothing for.
   */
  link?: ((selection: HeatmapSelection) => ChartLink | undefined) | undefined;
  /** Which cells choose or link, when `onSelect`, `details` or `link` is set. Every cell with a value but zero when unsaid: a zero has nothing to open. */
  selectable?: ((selection: HeatmapSelection) => boolean) | undefined;
  className?: string | undefined;
};

/** The part's own props, and the native props and ref of the grid's box (its scroller): an `id`, `data-*` for a test, a handler. `aria-describedby` describes the table. */
export type ChartHeatmapProps = ChartHeatmapOwnProps &
  Omit<ComponentProps<"div">, keyof ChartHeatmapOwnProps | "children" | "role">;

const cellHeights: Record<ChartSize, string> = { small: "h-300", medium: "h-400", large: "h-500" };

/** A cell that opens something, a button or a link: it fills its cell, its ring drawn above its neighbours. */
const opener =
  "relative block h-full w-full cursor-pointer rounded-xsmall outline-none focus-visible:z-20 focus-visible:outline-focused";

type Paint = { style?: { backgroundColor: string } | undefined; className?: string | undefined };

/** A colour-scale step's paint: its fill, and the edge a faint step wears (`faintStep`). */
const stepPaint = (color: string, faint: boolean): Paint => ({
  style: { backgroundColor: color },
  className: faint ? faintEdge : undefined,
});

/** The sequential step a value falls in: five equal bins across [min, max]. */
const sequentialStep = (v: number, min: number, max: number) => {
  const t = max === min ? 1 : (v - min) / (max - min);
  return (Math.min(4, Math.max(0, Math.floor(t * 5))) + 1) as 1 | 2 | 3 | 4 | 5;
};

/** The diverging step a value falls in, around `midpoint`. */
const divergingStep = (v: number, min: number, max: number, midpoint: number) => {
  const half = Math.max(Math.abs(max - midpoint), Math.abs(min - midpoint)) || 1;
  const t = (v - midpoint) / half;
  return t <= -0.5
    ? "negative.bold"
    : t < -0.1
      ? "negative"
      : t <= 0.1
        ? "midpoint"
        : t < 0.5
          ? "positive"
          : "positive.bold";
};

/** The value at each step's lower edge, and the top of the last: where a sequential key's thresholds fall. */
const thresholds = (min: number, max: number) =>
  [0, 1, 2, 3, 4, 5].map((i) => min + ((max - min) * i) / 5);

/** Whether a scroller's content is wider than it: then it is a tab stop and a named region, so a keyboard can scroll it. */
function useOverflow(
  scroller: RefObject<HTMLElement | null>,
  content: RefObject<HTMLElement | null>,
) {
  const [overflows, setOverflows] = useState(false);
  useLayoutEffect(() => {
    const box = scroller.current;
    const inner = content.current;
    if (!box || !inner) return;
    const measure = () => setOverflows(box.scrollWidth > box.clientWidth + 1);
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(box);
    observer.observe(inner);
    return () => observer.disconnect();
  }, [scroller, content]);
  return overflows;
}

/**
 * The width every value column takes: the widest column heading's, 40px at least, so a long
 * heading ("Moderate") does not make its column look weighted beside a short one ("Minor").
 */
function useColumnWidth(table: RefObject<HTMLTableElement | null>, key: string) {
  const [width, setWidth] = useState<number | undefined>(undefined);
  useLayoutEffect(() => {
    const el = table.current;
    if (!el) return;
    const headings = () => Array.from(el.querySelectorAll<HTMLElement>("[data-heatmap-heading]"));
    const measure = () => {
      const widest = Math.max(0, ...headings().map((h) => h.offsetWidth));
      // The heading's own padding (space.050 each side) around its text.
      setWidth(widest ? Math.ceil(widest) + 8 : undefined);
    };
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    for (const h of headings()) observer.observe(h);
    return () => observer.disconnect();
  }, [table, key]);
  return width;
}

/** The cell a link fills: the caller's link element, with the cell's class, its name and its face. */
function CellLink({
  link,
  label,
  className,
  children,
}: {
  link: ChartLink;
  label: string;
  className: string;
  children: ReactNode;
}) {
  return useRender({
    defaultTagName: "a",
    render: link,
    props: { className, "aria-label": label, children, ...{ "data-slot": "chart-heatmap-link" } },
  });
}

/** A grid of rows by columns with a value painted in each cell: one hue for how much, two for above and below, or the status tones. A cell that chooses is a button; a cell that links is the link. */
export function ChartHeatmap({
  rows,
  columns,
  value,
  scale = "sequential",
  domain,
  midpoint = 0,
  zeroStep,
  showValues,
  size: sizeProp = "medium",
  format: formatProp,
  label,
  rowLabel,
  columnLabel,
  loading: loadingProp,
  onSelect,
  details,
  link,
  selectable,
  className,
  "aria-describedby": describedBy,
  ref: callerRef,
  ...native
}: ChartHeatmapProps) {
  const { t } = useLedgerLocale();
  const frame = useContext(FrameContext);
  const { name, format, loading, offstage, expanded } = useFrame(
    label,
    formatProp,
    undefined,
    loadingProp,
  );
  const size = expanded ? "large" : sizeProp;

  const [picked, setPicked] = useState<HeatmapSelection | null>(null);
  const anchor = useRef<HTMLButtonElement | null>(null);
  const scroller = useRef<HTMLDivElement>(null);
  // The caller's ref and the grid's own reach the same box.
  const setScroller = useCallback(
    (node: HTMLDivElement | null) => {
      scroller.current = node;
      if (typeof callerRef === "function") callerRef(node);
      else if (callerRef) callerRef.current = node;
    },
    [callerRef],
  );
  const tableRef = useRef<HTMLTableElement>(null);
  const overflows = useOverflow(scroller, tableRef);
  const columnWidth = useColumnWidth(tableRef, `${columns.join("\u0000")}|${size}`);
  const values = useMemo(
    () => rows.map((r) => columns.map((c) => value(r, c))),
    [rows, columns, value],
  );
  const [min, max] = useMemo<readonly [number, number]>(() => {
    if (domain) return domain;
    const nums = values.flat().filter((v): v is number => typeof v === "number");
    if (!nums.length) return [0, 1];
    return [Math.min(...nums), Math.max(...nums)];
  }, [values, domain]);
  const status = typeof scale === "function";
  const printed = showValues ?? (status || Boolean(frame?.values));
  const canChoose = useCallback(
    (selection: HeatmapSelection) => (selectable ? selectable(selection) : selection.value !== 0),
    [selectable],
  );
  /** The link a cell with a value opens, when `link` gives one and the cell may open anything. */
  const linkOf = useCallback(
    (selection: HeatmapSelection) => (link && canChoose(selection) ? link(selection) : undefined),
    [link, canChoose],
  );
  /** A cell's name: its row and column, then its value or "none". */
  const cellName = useCallback(
    (r: string, c: string, v: number | null | undefined) =>
      t("chartPoint", {
        category: t("chartMarkIn", { group: r, label: c }),
        values: typeof v === "number" ? format(v) : t("chartNoValue"),
      }),
    [t, format],
  );
  // The twin is the grid pivoted: a row per row, a column per column, every value printed, and a
  // cell that links in the grid links here too.
  const table = useMemo<TwinSource>(
    () => ({
      kind: "custom",
      build: ({ xLabel }) => ({
        columns: [
          { label: rowLabel ?? xLabel ?? t("chartCategory"), numeric: false },
          ...columns.map((c) => ({ label: c, numeric: true })),
        ],
        rows: rows.map((r, ri) => ({
          key: r,
          cells: [
            { text: r, csv: r },
            ...columns.map((c, ci) => {
              const v = values[ri]?.[ci];
              if (typeof v !== "number") return { text: "", csv: "" };
              const to = linkOf({ row: r, column: c, value: v });
              return {
                text: format(v),
                csv: String(v),
                ...(to ? { link: to, label: cellName(r, c, v) } : {}),
              };
            }),
          ],
        })),
      }),
    }),
    [rows, columns, values, rowLabel, t, format, linkOf, cellName],
  );
  const report = useMemo<FrameReport>(
    () => ({ format, table, values: !status && showValues === undefined }),
    [format, table, status, showValues],
  );
  useFrameReport(report);
  if (offstage) return null;
  const chooses = Boolean(onSelect || details);
  const paint = (v: number, r: string, c: string): Paint => {
    if (typeof scale === "function") return { className: toneClasses[scale(v, r, c)].subtle };
    if (scale === "diverging") {
      const step = divergingStep(v, min, max, midpoint);
      return stepPaint(divergingColor(step), faintStep(step));
    }
    if (zeroStep && v === 0) return stepPaint(token("color.chart.track"), faintStep("zero"));
    const step = sequentialStep(v, min, max);
    return stepPaint(sequentialColor(step), faintStep(step));
  };
  const choose = (selection: HeatmapSelection, el: HTMLButtonElement) => {
    onSelect?.(selection);
    if (details) {
      anchor.current = el;
      setPicked(selection);
    }
  };
  const close = () => {
    setPicked(null);
    anchor.current?.focus();
  };
  const dimensions =
    rowLabel && columnLabel ? t("chartDimensions", { rows: rowLabel, columns: columnLabel }) : "";
  const head = "h-row-header px-050 pb-050 align-bottom font-body-xsmall font-medium text-subtlest";
  // The row names hold still while the grid scrolls sideways under them.
  const sticky = "sticky start-0 z-10 bg-surface-current";
  const column = columnWidth ? { width: columnWidth, minWidth: columnWidth } : undefined;
  return (
    // Relative, so the cells' visually hidden values stay inside the scroller. The padding at the
    // end and the bottom is the focus ring's room, which the scroller would otherwise clip.
    <div
      {...native}
      ref={setScroller}
      className={cn(
        "relative overflow-x-auto pe-025 pb-050",
        overflows && "rounded-xsmall outline-none focus-visible:outline-field-focused",
        className,
      )}
      {...(overflows && name
        ? { tabIndex: 0, role: "region", "aria-label": t("tableScrollsLabel", { label: name }) }
        : {})}
    >
      <table
        ref={tableRef}
        aria-label={name ? (loading ? t("loadingLabel", { label: name }) : name) : undefined}
        aria-describedby={describedBy}
        aria-busy={loading || undefined}
        className="border-collapse"
      >
        <thead>
          <tr>
            {rowLabel ? (
              <th scope="col" className={cn(head, sticky, "text-start")}>
                {columnLabel ? (
                  <>
                    <span aria-hidden>{rowLabel}</span>
                    <span className="sr-only">{dimensions}</span>
                  </>
                ) : (
                  rowLabel
                )}
              </th>
            ) : (
              <td className={cn(head, sticky)} />
            )}
            {columns.map((c) => (
              <th key={c} scope="col" className={cn(head, "text-center")} style={column}>
                <span data-heatmap-heading="" className="whitespace-nowrap">
                  {c}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, ri) => (
            <tr key={r}>
              <th
                scope="row"
                className={cn(
                  sticky,
                  "pe-100 text-start font-body-small font-regular whitespace-nowrap text-subtle",
                )}
              >
                {r}
              </th>
              {columns.map((c, ci) => {
                const v = values[ri]?.[ci];
                const has = !loading && typeof v === "number";
                const p: Paint = has ? paint(v, r, c) : {};
                const title = cellName(r, c, has ? v : undefined);
                const chosen = picked !== null && picked.row === r && picked.column === c;
                const selection = has ? { row: r, column: c, value: v } : null;
                const to = selection ? linkOf(selection) : undefined;
                const face = (
                  <span
                    data-slot="chart-heatmap-cell"
                    data-empty={has ? undefined : ""}
                    className={cn(
                      "flex h-full w-full items-center justify-center rounded-xsmall font-body-small tabular-nums",
                      p.className,
                      // No value is an outline and no fill, dashed, so it never reads as a low one.
                      loading
                        ? "animate-pulse bg-skeleton"
                        : !has && "border border-dashed border-bold",
                      picked !== null && !chosen && "opacity-disabled",
                    )}
                    style={p.style}
                    title={loading ? undefined : title}
                  >
                    {has && printed && !status ? (
                      <span className="rounded-xsmall bg-surface px-050 text-default">
                        {format(v)}
                      </span>
                    ) : has && printed ? (
                      format(v)
                    ) : has ? (
                      <span className="sr-only">{format(v)}</span>
                    ) : null}
                  </span>
                );
                return (
                  <td key={c} className={cn("min-w-500 pb-025 pe-025", cellHeights[size])}>
                    {to ? (
                      // Links navigate: the cell is the caller's link, named by its place and value.
                      <CellLink link={to} label={title} className={opener}>
                        {face}
                      </CellLink>
                    ) : chooses && selection && canChoose(selection) ? (
                      <button
                        type="button"
                        aria-label={title}
                        // A card is a dialog: the cell says it opens one, and whether it is open.
                        aria-haspopup={details ? "dialog" : undefined}
                        aria-expanded={details ? chosen : undefined}
                        className={cn(opener, chosen && "z-20 outline-focused")}
                        onClick={(e) => choose(selection, e.currentTarget)}
                      >
                        {face}
                      </button>
                    ) : (
                      face
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      {picked && details ? (
        <Card anchor={anchor} label={name} onClose={close} refocus={() => anchor.current?.focus()}>
          <CardHead
            title={t("chartMarkIn", { group: picked.row, label: picked.column })}
            subtitle={dimensions || undefined}
            value={format(picked.value)}
          />
          {details(picked)}
        </Card>
      ) : null}
    </div>
  );
}

/** A status step on a key: the tone its cells wear, and what the tone means. */
export type ChartScaleStep = { tone: Tone; label: string };

/** A Chart.Scale takes its box's native props, `className` and `ref` too. */
export type ChartScaleProps = Omit<ComponentProps<"div">, "children"> & {
  /** Which key: the sequential or diverging ramp, or the status tones of a tone-function Heatmap. */
  scale: "sequential" | "diverging" | "status";
  /** What the low end and the high end read as: "0" and "40 findings"; "−20%" and "+20%". With `domain`, they replace the end thresholds. */
  min?: string | undefined;
  max?: string | undefined;
  /** The midpoint's word on a diverging scale: "On plan". */
  mid?: string | undefined;
  /** The Heatmap's `domain`: on a sequential key, the value at each step's edge is printed, in `format`, so the key reads as the grid is binned. */
  domain?: readonly [number, number] | undefined;
  /** The thresholds' format. The Frame's, else the kit's. */
  format?: Formatter | undefined;
  /** The Heatmap's `zeroStep`: zero's own swatch, in `color.chart.track`, before the five. */
  zeroStep?: boolean | undefined;
  /** For `scale="status"`: each tone the cells wear, with what it means, in order. */
  steps?: ChartScaleStep[] | undefined;
  className?: string | undefined;
};

/** The key for a Heatmap: the five steps of a colour scale in a row with their ends or thresholds named, or the status tones with their words. */
export function ChartScale({
  scale,
  min,
  max,
  mid,
  domain,
  format: formatProp,
  zeroStep,
  steps: statusSteps,
  className,
  ...props
}: ChartScaleProps) {
  const { format } = useFrame(undefined, formatProp, undefined);
  if (scale === "status")
    return (
      <div
        {...props}
        className={cn(
          "flex flex-wrap items-center gap-x-200 gap-y-050 self-start font-body-xsmall text-subtle",
          className,
        )}
        data-slot="chart-scale"
      >
        {statusSteps?.map((s) => (
          <span key={`${s.tone}-${s.label}`} className="inline-flex items-center gap-075">
            <span
              data-slot="chart-scale-step"
              aria-hidden
              className={cn("size-150 shrink-0 rounded-xsmall", toneClasses[s.tone].subtle)}
            />
            {s.label}
          </span>
        ))}
      </div>
    );
  // Each step's fill, and the edge a faint one wears, as the grid's cells do.
  const steps =
    scale === "diverging"
      ? (["negative.bold", "negative", "midpoint", "positive", "positive.bold"] as const).map(
          (s) => ({ color: divergingColor(s), edge: faintStep(s) ? faintEdge : undefined }),
        )
      : ([1, 2, 3, 4, 5] as const).map((s) => ({
          color: sequentialColor(s),
          edge: faintStep(s) ? faintEdge : undefined,
        }));
  const zeroEdge = faintStep("zero") ? faintEdge : undefined;
  const zero = zeroStep && scale === "sequential";
  const edges = domain && scale === "sequential" ? thresholds(domain[0], domain[1]) : null;
  const swatch = edges ? "h-100 w-400 rounded-xsmall" : "h-100 w-300 rounded-xsmall";
  const text = "font-body-xsmall tabular-nums text-subtlest";
  if (edges) {
    const first = zero ? "" : (min ?? format(edges[0] ?? 0));
    // Every label starts at its edge: each step's lower edge under the step's start, and the top
    // at the ramp's end. A box as wide as its step holds each, so a longer one runs on past it.
    const at = cn(text, "w-400 shrink-0 whitespace-nowrap");
    return (
      <div
        {...props}
        className={cn("inline-flex items-start gap-100 self-start", className)}
        data-slot="chart-scale"
      >
        {zero ? (
          <div className="flex flex-col gap-050">
            <span
              data-slot="chart-scale-step"
              aria-hidden
              className={cn(swatch, zeroEdge)}
              style={{ backgroundColor: token("color.chart.track") }}
            />
            <span className={text}>{format(0)}</span>
          </div>
        ) : null}
        <div className="flex flex-col gap-050">
          <div className="flex gap-025" aria-hidden>
            {steps.map((step, i) => (
              <span
                key={i}
                data-slot="chart-scale-step"
                className={cn(swatch, step.edge)}
                style={{ backgroundColor: step.color }}
              />
            ))}
          </div>
          <div className="flex gap-025">
            {steps.map((_, i) => (
              <span key={i} className={at}>
                {i === 0 ? first : format(edges[i] ?? 0)}
              </span>
            ))}
            <span className={cn(text, "whitespace-nowrap")}>{max ?? format(edges[5] ?? 0)}</span>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div
      {...props}
      className={cn("inline-flex flex-col gap-050 self-start", className)}
      data-slot="chart-scale"
    >
      <div className="flex gap-100" aria-hidden>
        {zero ? (
          <span
            data-slot="chart-scale-step"
            className={cn(swatch, zeroEdge)}
            style={{ backgroundColor: token("color.chart.track") }}
          />
        ) : null}
        <span className="flex gap-025">
          {steps.map((step, i) => (
            <span
              key={i}
              data-slot="chart-scale-step"
              className={cn(swatch, step.edge)}
              style={{ backgroundColor: step.color }}
            />
          ))}
        </span>
      </div>
      <div className={cn("flex justify-between gap-100", text)}>
        <span>{min ?? ""}</span>
        {mid ? <span>{mid}</span> : null}
        <span>{max ?? ""}</span>
      </div>
    </div>
  );
}
