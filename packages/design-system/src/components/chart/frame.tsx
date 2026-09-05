import { Table2 } from "lucide-react";
import { useCallback, useContext, useId, useMemo, useState, type ReactNode } from "react";

import { cn } from "../../lib/cn";
import { Breadcrumb } from "../breadcrumb";
import { Skeleton } from "../skeleton";
import { Spinner } from "../spinner";
import { Table } from "../table";
import { Toggle } from "../toggle";
import {
  FrameContext,
  Swatch,
  categoricalTone,
  chartColor,
  formatNumber,
  formatValue,
  heights,
  none,
  plainCategory,
  type CategoryFormatter,
  type ChartDatum,
  type ChartSeries,
  type ChartSize,
  type Formatter,
  type FrameState,
  type SwatchShape,
} from "./_shared";

/* ---------- legend ---------- */

export type ChartLegendProps = {
  series: ChartSeries[];
  /** A square for bars and areas, a stroke for lines, a dot for points. */
  swatch?: SwatchShape | undefined;
  className?: string | undefined;
};

/** Swatch and label per series. Inside a Frame the items are buttons: hover dims the other series, click isolates one. */
export function ChartLegend({ series, swatch = "square", className }: ChartLegendProps) {
  const frame = useContext(FrameContext);
  const items = series.map((s, i) => ({
    key: s.key,
    label: s.label ?? s.key,
    color: chartColor(s.tone ?? categoricalTone(i)),
  }));
  if (!frame)
    return (
      <ul className={cn("flex flex-wrap items-center gap-x-200 gap-y-050", className)}>
        {items.map((it) => (
          <li key={it.key} className="flex items-center gap-075 font-body-small text-subtle">
            <Swatch color={it.color} shape={swatch} />
            {it.label}
          </li>
        ))}
      </ul>
    );
  return (
    <ul className={cn("flex flex-wrap items-center gap-x-100 gap-y-050", className)}>
      {items.map((it) => {
        const off = frame.hidden.has(it.key);
        return (
          <li key={it.key}>
            <button
              type="button"
              aria-pressed={!off}
              className={cn(
                "flex h-control-xsmall items-center gap-075 rounded-small px-050 font-body-small text-subtle outline-none transition-colors duration-fast ease-standard",
                "hover:bg-neutral-subtle-hovered hover:text-default focus-visible:outline-focused",
                off && "text-subtlest",
              )}
              onMouseEnter={() => frame.highlight(it.key)}
              onMouseLeave={() => frame.highlight(null)}
              onFocus={() => frame.highlight(it.key)}
              onBlur={() => frame.highlight(null)}
              onClick={() => frame.toggle(it.key)}
            >
              <Swatch color={it.color} shape={swatch} hollow={off} />
              {it.label}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

/* ---------- frame ---------- */

/** One level of a drill-down: what the chart showed, and the way back to it. */
export type ChartCrumb = {
  label: string;
  /** Goes back to this level. The last crumb is the current level and takes none. */
  onSelect?: (() => void) | undefined;
};

export type ChartFrameProps = {
  /** What the chart shows, as a noun phrase: "Coverage by control family". It names the plot to a screen reader. */
  title: string;
  /** One line under the title: the period, the unit, the source. */
  description?: ReactNode | undefined;
  /** The levels drilled into so far, from the top: `[{ label: "All families", onSelect }, { label: "AC" }]`. A Breadcrumb under the title; every crumb but the last goes back. */
  path?: ChartCrumb[] | undefined;
  /** The series, for the legend and the table. */
  series?: ChartSeries[] | undefined;
  /** Where the legend sits. `top` when there are two or more series, `none` for one: the title names it. */
  legend?: "top" | "bottom" | "none" | undefined;
  /** The legend's swatch: a square for bars and areas, a stroke for lines, a dot for points. */
  swatch?: SwatchShape | undefined;
  /** Controls at the end of the header: a range, a filter, an export. */
  actions?: ReactNode | undefined;
  /** `loading` draws the plot's skeleton at its height; `refreshing` keeps the last plot, dimmed, with a spinner in the header; `empty` and `error` say so in the plot's place. */
  status?: "ready" | "loading" | "refreshing" | "empty" | "error" | undefined;
  /** What an empty or failed plot says. "Nothing to show yet" and "The chart could not load" when unsaid. */
  statusTitle?: string | undefined;
  statusText?: string | undefined;
  /** The records and the category key, so the Frame can lay the same numbers out as a Table, one toggle away. */
  data?: ChartDatum[] | undefined;
  x?: string | undefined;
  /** What the table calls the category column: "Month", "Family". The key when unsaid. */
  xLabel?: string | undefined;
  /** The number format the plot, the tooltip and the table share. */
  format?: Formatter | undefined;
  formatX?: CategoryFormatter | undefined;
  /** The plot's height, for the states that stand in for it. */
  size?: ChartSize | undefined;
  height?: number | undefined;
  /** The plot. */
  children: ReactNode;
  className?: string | undefined;
};

/**
 * The figure around a plot: title, description, the drill-down's path, legend, actions, the states,
 * and the same numbers as a Table one toggle away. The legend inside it highlights and isolates series;
 * while it loads, the plot inside draws its own skeleton.
 */
export function ChartFrame({
  title,
  description,
  path,
  series,
  legend,
  swatch = "square",
  actions,
  status = "ready",
  statusTitle,
  statusText,
  data,
  x,
  xLabel,
  format = formatNumber,
  formatX,
  size = "medium",
  height,
  children,
  className,
}: ChartFrameProps) {
  const id = useId();
  const [hidden, setHidden] = useState<ReadonlySet<string>>(none);
  const [highlighted, setHighlighted] = useState<string | null>(null);
  const [showTable, setShowTable] = useState(false);
  const toggle = useCallback(
    (key: string) =>
      setHidden((prev) => {
        const next = new Set(prev);
        if (next.has(key)) next.delete(key);
        else next.add(key);
        // Hiding the last visible series would leave nothing; that click shows everything again.
        if (series && next.size >= series.length) next.clear();
        return next;
      }),
    [series],
  );
  const loading = status === "loading";
  const state = useMemo<FrameState>(
    () => ({
      name: title,
      hidden,
      highlighted,
      highlight: setHighlighted,
      toggle,
      format,
      formatX,
      loading,
    }),
    [title, hidden, highlighted, toggle, format, formatX, loading],
  );
  const legendAt = legend ?? (series && series.length > 1 ? "top" : "none");
  const twin = Boolean(data && x && series?.length);
  const plotHeight = height ?? heights[size];
  const fx = formatX ?? plainCategory;
  const showing = status === "ready" || status === "refreshing";
  return (
    <FrameContext.Provider value={state}>
      <figure aria-labelledby={id} className={cn("flex min-w-0 flex-col gap-150", className)}>
        <div className="flex items-start justify-between gap-200">
          <figcaption className="flex min-w-0 flex-col gap-025">
            <span className="flex items-center gap-100">
              <span id={id} className="font-body font-medium text-default">
                {title}
              </span>
              {status === "refreshing" ? <Spinner size="small" label="Refreshing" /> : null}
            </span>
            {description ? (
              <span className="font-body-small text-subtle">{description}</span>
            ) : null}
            {path?.length ? (
              <Breadcrumb className="pt-025">
                {path.map((c, i) => (
                  <Breadcrumb.Item
                    key={i}
                    isCurrent={i === path.length - 1}
                    {...(c.onSelect && i !== path.length - 1 ? { onClick: c.onSelect } : {})}
                  >
                    {c.label}
                  </Breadcrumb.Item>
                ))}
              </Breadcrumb>
            ) : null}
          </figcaption>
          {legendAt === "top" || actions || twin ? (
            <div className="flex shrink-0 flex-wrap items-center justify-end gap-150">
              {legendAt === "top" && series ? <ChartLegend series={series} swatch={swatch} /> : null}
              {actions}
              {twin ? (
                <Toggle
                  size="small"
                  pressed={showTable}
                  onPressedChange={setShowTable}
                  disabled={!showing}
                  aria-label={showTable ? "Show as chart" : "Show as table"}
                >
                  <Table2 className="size-icon-small" />
                  Table
                </Toggle>
              ) : null}
            </div>
          ) : null}
        </div>
        {loading ? (
          children || <Skeleton className="rounded-large" style={{ height: plotHeight }} />
        ) : status === "empty" || status === "error" ? (
          <div
            role="status"
            className="flex flex-col items-start justify-center gap-025 rounded-large border border-dashed border-default px-200"
            style={{ height: plotHeight }}
          >
            <span
              className={cn(
                "font-body font-medium",
                status === "error" ? "text-danger" : "text-default",
              )}
            >
              {statusTitle ??
                (status === "error" ? "The chart could not load" : "Nothing to show yet")}
            </span>
            {statusText ? <span className="font-body-small text-subtle">{statusText}</span> : null}
          </div>
        ) : showTable ? null : status === "refreshing" ? (
          <div aria-busy className="opacity-loading">
            {children}
          </div>
        ) : (
          children
        )}
        {showing && legendAt === "bottom" && series ? (
          <ChartLegend series={series} swatch={swatch} />
        ) : null}
        {twin && showTable && showing && data && x && series ? (
          <div>
            <Table label={`${title}, as a table`}>
              <thead>
                <tr>
                  <Table.Header>{xLabel ?? x}</Table.Header>
                  {series.map((s) => (
                    <Table.Header key={s.key} className="text-end">
                      {s.label ?? s.key}
                    </Table.Header>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((d, i) => (
                  <Table.Row key={i} isStatic>
                    <Table.Cell>{fx((d[x] as string | number | undefined) ?? "")}</Table.Cell>
                    {series.map((s) => (
                      <Table.Cell key={s.key} className="text-end tabular-nums">
                        {formatValue(d[s.key], format)}
                      </Table.Cell>
                    ))}
                  </Table.Row>
                ))}
              </tbody>
            </Table>
          </div>
        ) : null}
      </figure>
    </FrameContext.Provider>
  );
}
