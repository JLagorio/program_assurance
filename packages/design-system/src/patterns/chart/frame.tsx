import { useRender } from "@base-ui/react/use-render";
import { Download, Hash, Maximize2, Table2 } from "lucide-react";
import {
  Fragment,
  useCallback,
  useContext,
  useId,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import { useLedgerLocale } from "../../lib/locale";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../components/dialog";

import { cn } from "../../lib/cn";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "../../components/breadcrumb";
import { IconButton } from "../../components/button";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../components/dropdown-menu";
import { Skeleton } from "../../components/skeleton";
import { Spinner } from "../../components/spinner";
import { Table } from "../../components/table";
import { Toggle } from "../../components/toggle";
import {
  FrameContext,
  FrameReportContext,
  Swatch,
  categoricalTone,
  categoryTwin,
  chartColor,
  download,
  fileName,
  heights,
  none,
  sameReport,
  svgToPng,
  textureOf,
  twinCsv,
  useChartFormat,
  type CategoryFormatter,
  type ChartColumn,
  type ChartDatum,
  type ChartSeries,
  type ChartSize,
  type ChartTwin,
  type Formatter,
  type FrameRegistry,
  type FrameReport,
  type FrameState,
  type SwatchShape,
} from "./_shared";

/* ---------- legend ---------- */

export type ChartLegendProps = {
  series: ChartSeries[];
  /** A square for bars and areas, a stroke for lines, a dot for points. */
  swatch?: SwatchShape | undefined;
  /** The swatches carry each series' pattern. The Frame's `texture` sets it. */
  texture?: boolean | undefined;
  className?: string | undefined;
};

/** Swatch and label per series. Inside a Frame the items are toggle buttons: a mouse hover or keyboard focus dims the other series, and a click hides or shows its own. */
export function ChartLegend({ series, swatch = "square", texture, className }: ChartLegendProps) {
  const frame = useContext(FrameContext);
  const textured = texture ?? frame?.texture ?? false;
  const items = series.map((s, i) => ({
    key: s.key,
    label: s.label ?? s.key,
    color: chartColor(s.tone ?? categoricalTone(i)),
    texture: textured ? textureOf(i) : undefined,
  }));
  if (!frame)
    return (
      <ul className={cn("flex flex-wrap items-center gap-x-200 gap-y-050", className)}>
        {items.map((it) => (
          <li key={it.key} className="flex items-center gap-075 font-body-small text-subtle">
            <Swatch color={it.color} shape={swatch} texture={it.texture} />
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
              onPointerEnter={(e) => {
                // A mouse only: a tap sends no leave, and would leave the rest dimmed.
                if (e.pointerType === "mouse") frame.highlight(it.key);
              }}
              onPointerLeave={(e) => {
                if (e.pointerType === "mouse") frame.highlight(null);
              }}
              onFocus={(e) => {
                // Keyboard focus highlights, as hover does; focus a dialog hands over on opening must not dim the rest.
                if (e.currentTarget.matches(":focus-visible")) frame.highlight(it.key);
              }}
              onBlur={() => frame.highlight(null)}
              onClick={() => frame.toggle(it.key)}
            >
              <Swatch color={it.color} shape={swatch} hollow={off} texture={it.texture} />
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

export type ChartFrameProps = Omit<ComponentProps<"figure">, "title" | "children"> & {
  /** What the chart shows, as a noun phrase: "Coverage by control family". It names the plot to a screen reader. */
  title: string;
  /** One line under the title: the period, the unit, the source. */
  description?: ReactNode | undefined;
  /** One sentence for a screen reader that says what the chart shows: "Open findings fell from 14 in January to 5 in September." The figure's description. Not shown. */
  summary?: string | undefined;
  /** The levels drilled into so far, from the top: `[{ label: "All families", onSelect }, { label: "AC" }]`. A Breadcrumb under the title; every crumb but the last goes back. */
  path?: ChartCrumb[] | undefined;
  /** The series, for the legend and the table, and for a Bar, Line or Area inside that is given none. Unsaid, the legend keys what the part inside draws: its series, its groups, its slices or its branches. */
  series?: ChartSeries[] | undefined;
  /** Where the legend sits. `top` when there are two or more series, `none` for one: the title names it. At a narrow width the header wraps and the legend drops under the title. */
  legend?: "top" | "bottom" | "none" | undefined;
  /** The legend's swatch: a square for bars and areas, a stroke for lines, a dot for points. Unsaid, the part inside says which. */
  swatch?: SwatchShape | undefined;
  /** Every series wears a pattern as well as its colour, in the plot and in the legend: for print, colour-vision loss and forced colours. */
  texture?: boolean | undefined;
  /** Charts with the same id share their hover: the tooltip moves on all of them. For small multiples. */
  syncId?: string | undefined;
  /** Controls at the end of the header: a range, a filter, a Retry. */
  actions?: ReactNode | undefined;
  /** The files the reader can take away, as a Download menu in the header: the table twin as CSV, the plot as a PNG at twice the pixel density. */
  download?: ("csv" | "png")[] | undefined;
  /** An Expand button in the header that opens the same chart in a large Dialog, the plot redrawn at `large`. */
  expandable?: boolean | undefined;
  /** `loading` draws the plot's skeleton at its height; `refreshing` keeps the last plot, dimmed, with a spinner in the header; `empty` and `error` say so in the plot's place. */
  status?: "ready" | "loading" | "refreshing" | "empty" | "error" | undefined;
  /** What an empty or failed plot says. "Nothing to show yet" and "The chart could not load" when unsaid. */
  statusTitle?: string | undefined;
  statusText?: string | undefined;
  /** The records and the category key: what a Bar, Line or Area inside draws when it is given none, and what the table twin and the CSV lay out. Unsaid, the twin takes the part's own: every kind has one, one toggle away. */
  data?: ChartDatum[] | undefined;
  x?: string | undefined;
  /** What the table calls the category column: "Month", "Family"; for a Donut its slices, for a Treemap its top level. The part's axis title, else the key, when unsaid. */
  xLabel?: string | undefined;
  /** Columns for the table twin and the CSV beyond the series, each a key in the datum: a name beside the category (`place: "before"`), a total, a share, an owner after the series. Facts the plot does not draw, so the twin is the record's table and not only the plot's. A Scatter's twin takes them too, beside its point columns. */
  columns?: ChartColumn[] | undefined;
  /** The number format the plot, the tooltip and the table share. A part's own `format` wins in the plot, and the table follows it. */
  format?: Formatter | undefined;
  formatX?: CategoryFormatter | undefined;
  /** The plot's height: the part inside takes it when it sets neither `size` nor `height`, and the states stand in at it. */
  size?: ChartSize | undefined;
  height?: number | undefined;
  /** The plot. */
  children: ReactNode;
  className?: string | undefined;
};

type ChartViewState = {
  hidden: ReadonlySet<string>;
  setHidden: Dispatch<SetStateAction<ReadonlySet<string>>>;
  showTable: boolean;
  setShowTable: Dispatch<SetStateAction<boolean>>;
  values: boolean;
  setValues: Dispatch<SetStateAction<boolean>>;
};

/** The expanded Dialog's greatest width, in pixels: room for the plot at `large`. */
const EXPANDED_WIDTH = 860;

/**
 * The figure around a plot: title, description, the drill-down's path, legend, actions, the states,
 * the Download menu, the Expand button, and the same numbers as a Table one toggle away. The part
 * inside takes the Frame's data, size and format when it sets none, and tells the Frame what it
 * draws, so the legend, the twin and the CSV follow the plot; the Frame's own props win.
 */
export function ChartFrame(props: ChartFrameProps) {
  const [hidden, setHidden] = useState<ReadonlySet<string>>(none);
  const [showTable, setShowTable] = useState(false);
  const [values, setValues] = useState(false);
  return (
    <ChartFrameView
      {...props}
      view={{ hidden, setHidden, showTable, setShowTable, values, setValues }}
    />
  );
}

/** The expanded figure shares its reader state with the original, while keeping separate DOM ids. */
function ChartFrameView({
  view,
  inDialog = false,
  ...props
}: ChartFrameProps & { view: ChartViewState; inDialog?: boolean | undefined }) {
  const { t } = useLedgerLocale();
  const { format: defaultFormat, category: defaultCategory } = useChartFormat();

  const {
    title,
    description,
    summary,
    path,
    series: seriesProp,
    legend,
    swatch: swatchProp,
    texture = false,
    syncId,
    actions,
    download: downloads,
    expandable,
    status = "ready",
    statusTitle,
    statusText,
    data,
    x,
    xLabel,
    columns,
    format = defaultFormat,
    formatX,
    size,
    height,
    children,
    className,
    ...figureProps
  } = props;
  const id = useId();
  const figure = useRef<HTMLElement>(null);
  const { hidden, setHidden, showTable, setShowTable, values, setValues } = view;
  const [highlighted, setHighlighted] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  // What the part inside draws, and how many parts are mounted to say so.
  const [lastReport, setReport] = useState<FrameReport | null>(null);
  const [parts, setParts] = useState(0);
  const registry = useMemo<FrameRegistry>(
    () => ({
      report: (next) => setReport((prev) => (prev && sameReport(prev, next) ? prev : next)),
      mount: () => {
        setParts((n) => n + 1);
        return () => setParts((n) => n - 1);
      },
    }),
    [],
  );
  // An empty or failed plot is set aside by the Frame and keeps its last report, so the header does
  // not shift; a part the caller removes takes its legend, its table and its CSV with it.
  const report = parts > 0 || status === "empty" || status === "error" ? lastReport : null;
  const series = seriesProp ?? report?.series;
  const swatch = swatchProp ?? report?.swatch ?? "square";
  // The legend's keys, as one string, so the toggle changes only when they do.
  const legendKeys = series?.map((s) => s.key).join("\u0000") ?? "";
  const toggle = useCallback(
    (key: string) =>
      setHidden((prev) => {
        const keys = legendKeys ? new Set(legendKeys.split("\u0000")) : null;
        // A key the legend no longer holds (the series changed) is no longer hidden.
        const next = new Set(keys ? [...prev].filter((k) => keys.has(k)) : prev);
        if (next.has(key)) next.delete(key);
        else next.add(key);
        // Hiding the last visible series would leave nothing; that click shows everything again.
        if (keys && next.size >= keys.size) next.clear();
        return next;
      }),
    [legendKeys, setHidden],
  );
  const loading = status === "loading";
  const showing = status === "ready" || status === "refreshing";
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
      sync: syncId,
      texture,
      data,
      x,
      series: seriesProp,
      size,
      height,
      expanded: inDialog,
      values,
      offstage: showTable && showing,
    }),
    [
      title,
      hidden,
      highlighted,
      toggle,
      format,
      formatX,
      loading,
      syncId,
      texture,
      data,
      x,
      seriesProp,
      size,
      height,
      inDialog,
      values,
      showTable,
      showing,
    ],
  );
  const legendAt = legend ?? (series && series.length > 1 ? "top" : "none");
  // The table and the CSV print what the plot prints: the part's formats, else the Frame's.
  const twinFormat = report?.format ?? format;
  const twinFormatX = report?.formatX ?? formatX ?? defaultCategory;
  const source = report?.table;
  const category =
    data && x && seriesProp?.length
      ? { data, x, series: seriesProp }
      : source?.kind === "category"
        ? { data: data ?? source.data, x: x ?? source.x, series: seriesProp ?? source.series }
        : null;
  const twin = category ? category.series.length > 0 : Boolean(source);
  const buildTwin = (): ChartTwin | null => {
    if (category)
      return categoryTwin({
        ...category,
        xLabel: xLabel ?? (source?.kind === "category" ? source.xLabel : undefined) ?? category.x,
        columns,
        format: twinFormat,
        formatX: twinFormatX,
      });
    if (source?.kind === "custom") return source.build({ xLabel, columns });
    return null;
  };
  const plotHeight = height ?? (size ? heights[size] : (report?.height ?? heights.medium));
  const csv = downloads?.includes("csv") && twin;
  const png = downloads?.includes("png");
  const valuesToggle = Boolean(report?.values);
  const saveCsv = () => {
    const table = buildTwin();
    if (!table) return;
    download(
      fileName(title, "csv"),
      new Blob([twinCsv(table)], {
        type: "text/csv;charset=utf-8",
      }),
    );
  };
  const savePng = async () => {
    const svg = figure.current?.querySelector<SVGSVGElement>("svg.recharts-surface");
    if (!svg) return;
    download(fileName(title, "png"), await svgToPng(svg));
  };
  const tools = csv || png || expandable || twin || valuesToggle;
  const shownTwin = twin && showTable && showing ? buildTwin() : null;
  const frameElement = useRender({
    defaultTagName: "figure",
    ref: figure,
    // Keep the caller's DOM ids, ref and handlers on the original figure only.
    render: (
      <figure
        aria-labelledby={id}
        {...(summary ? { "aria-describedby": `${id}-summary` } : {})}
        className={cn("flex min-w-0 flex-col gap-150", className)}
        {...(!inDialog ? figureProps : {})}
      >
        <div className="flex flex-wrap items-start justify-between gap-x-200 gap-y-100">
          <figcaption className="flex min-w-0 flex-col gap-025" style={{ flex: "1 1 200px" }}>
            <span className={cn("flex items-center gap-100", inDialog && "sr-only")}>
              <span id={id} className="font-body font-medium text-default">
                {title}
              </span>
              {status === "refreshing" ? <Spinner size="small" label={t("refreshing")} /> : null}
            </span>
            {description && !inDialog ? (
              <span className="font-body-small text-subtle">{description}</span>
            ) : null}
            {summary ? (
              <span id={`${id}-summary`} className="sr-only">
                {summary}
              </span>
            ) : null}
            {path?.length ? (
              <Breadcrumb aria-label={t("chartPath")} className="pt-025">
                <BreadcrumbList>
                  {path.map((c, i) => (
                    <Fragment key={i}>
                      {i > 0 ? <BreadcrumbSeparator /> : null}
                      <BreadcrumbItem>
                        {i === path.length - 1 ? (
                          <BreadcrumbPage>{c.label}</BreadcrumbPage>
                        ) : c.onSelect ? (
                          <BreadcrumbLink render={<button type="button" onClick={c.onSelect} />}>
                            {c.label}
                          </BreadcrumbLink>
                        ) : (
                          <span>{c.label}</span>
                        )}
                      </BreadcrumbItem>
                    </Fragment>
                  ))}
                </BreadcrumbList>
              </Breadcrumb>
            ) : null}
          </figcaption>
          {legendAt === "top" || actions || tools ? (
            <div className="flex min-w-0 flex-wrap items-center justify-end gap-150">
              {legendAt === "top" && series ? (
                <ChartLegend series={series} swatch={swatch} />
              ) : null}
              {actions}
              {tools ? (
                <span className="flex flex-wrap items-center gap-050">
                  {valuesToggle ? (
                    <Toggle
                      size="sm"
                      pressed={values}
                      onPressedChange={setValues}
                      disabled={!showing}
                    >
                      <Hash className="size-icon-small" aria-hidden />
                      {t("chartValues")}
                    </Toggle>
                  ) : null}
                  {twin ? (
                    // Its name stays "Table"; `aria-pressed` says whether the table shows.
                    <Toggle
                      size="sm"
                      pressed={showTable}
                      onPressedChange={setShowTable}
                      disabled={!showing}
                    >
                      <Table2 className="size-icon-small" aria-hidden />
                      {t("chartTable")}
                    </Toggle>
                  ) : null}
                  {csv || png ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <IconButton
                            label={t("download")}
                            icon={<Download />}
                            variant="subtle"
                            size="small"
                            disabled={!showing}
                          />
                        }
                      />
                      <DropdownMenuContent align="end" style={{ width: 200 }}>
                        {csv ? (
                          <DropdownMenuItem onClick={saveCsv}>{t("downloadCsv")}</DropdownMenuItem>
                        ) : null}
                        {png ? (
                          <DropdownMenuItem onClick={() => void savePng()} disabled={showTable}>
                            {t("downloadPng")}
                          </DropdownMenuItem>
                        ) : null}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : null}
                  {expandable ? (
                    <IconButton
                      label={t("expand")}
                      icon={<Maximize2 />}
                      variant="subtle"
                      size="small"
                      disabled={!showing}
                      onClick={() => setExpanded(true)}
                    />
                  ) : null}
                </span>
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
              {statusTitle ?? (status === "error" ? t("chartError") : t("nothingToShow"))}
            </span>
            {statusText ? <span className="font-body-small text-subtle">{statusText}</span> : null}
          </div>
        ) : showTable ? (
          // The table stands in for the plot. The part stays, drawing nothing, so the twin follows its data.
          <div hidden>{children}</div>
        ) : status === "refreshing" ? (
          <div aria-busy className="opacity-loading">
            {children}
          </div>
        ) : (
          children
        )}
        {showing && legendAt === "bottom" && series ? (
          <ChartLegend series={series} swatch={swatch} />
        ) : null}
        {shownTwin ? (
          <TwinTable twin={shownTwin} label={t("tableLabel", { label: title })} />
        ) : null}
      </figure>
    ),
  });
  return (
    <FrameContext.Provider value={state}>
      <FrameReportContext.Provider value={registry}>
        {frameElement}
        {expandable ? (
          <Dialog
            open={expanded}
            onOpenChange={(next) => {
              if (!next) {
                setExpanded(false);
              }
            }}
          >
            <DialogContent
              style={{ maxWidth: EXPANDED_WIDTH }}
              className="top-200 translate-y-0 sm:top-600"
            >
              <DialogHeader>
                <DialogTitle>{title}</DialogTitle>
                <DialogDescription>{description}</DialogDescription>
              </DialogHeader>
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-none px-250 py-200">
                {expanded ? (
                  <ChartFrameView
                    {...props}
                    view={view}
                    inDialog
                    expandable={false}
                    size="large"
                    height={undefined}
                    className={undefined}
                  />
                ) : null}
              </div>
            </DialogContent>
          </Dialog>
        ) : null}
      </FrameReportContext.Provider>
    </FrameContext.Provider>
  );
}

/** The twin as a Table: each cell keeps its full width, so the table sizes to its content and scrolls in its own frame past the Frame's width, rather than clipping a word or a value. */
function TwinTable({ twin, label }: { twin: ChartTwin; label: string }) {
  return (
    <div>
      <Table label={label}>
        <thead>
          <tr>
            {twin.columns.map((c, i) => (
              <Table.Header key={i} className={cn(c.numeric && "text-end")}>
                {c.label}
              </Table.Header>
            ))}
          </tr>
        </thead>
        <tbody>
          {twin.rows.map((r) => (
            <Table.Row key={r.key} isStatic>
              {r.cells.map((cell, i) => (
                <Table.Cell
                  key={i}
                  className={cn("max-w-none", twin.columns[i]?.numeric && "text-end tabular-nums")}
                >
                  {cell.text}
                </Table.Cell>
              ))}
            </Table.Row>
          ))}
        </tbody>
      </Table>
    </div>
  );
}
