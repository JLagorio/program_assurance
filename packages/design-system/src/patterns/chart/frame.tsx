import { useRender } from "@base-ui/react/use-render";
import { ChartNoAxesColumn, Download, Hash, Maximize2, Table2, X } from "lucide-react";
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
import { downloadText } from "../../lib/download";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../components/dialog";

import { cn } from "../../lib/cn";
import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertIcon,
  AlertTitle,
} from "../../components/alert";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "../../components/breadcrumb";
import { Button, IconButton } from "../../components/button";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../components/dropdown-menu";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "../../components/empty";
import { Skeleton } from "../../components/skeleton";
import { Spinner } from "../../components/spinner";
import { Table } from "../../components/table";
import { Toggle } from "../../components/toggle";
import { headingTag, useHeadingLevel, type HeadingLevel } from "../../primitives/heading-level";
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

/** Swatch and label per series. Inside a Frame the items are toggle buttons: a mouse hover or keyboard focus dims the other series, and a click hides or shows its own; a hidden series' swatch hollows. */
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
      <ul
        data-slot="chart-legend"
        className={cn("flex flex-wrap items-center gap-x-200 gap-y-050", className)}
      >
        {items.map((it) => (
          <li key={it.key} className="flex items-center gap-075 font-body-small text-subtle">
            <Swatch color={it.color} shape={swatch} texture={it.texture} />
            {it.label}
          </li>
        ))}
      </ul>
    );
  return (
    <ul
      data-slot="chart-legend"
      className={cn("flex flex-wrap items-center gap-x-100 gap-y-050", className)}
    >
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

/** Whether the plot is drawn, loading, refreshing, empty or failed. */
export type ChartFrameState = "ready" | "loading" | "refreshing" | "empty" | "error";

export type ChartFrameProps = Omit<ComponentProps<"figure">, "title" | "children"> & {
  /** What the chart shows, as a noun phrase: "Coverage by control family". It names the plot to a screen reader. */
  title: string;
  /**
   * The title's heading level, so a dashboard's charts are in the page's outline. Unsaid, the level
   * the surrounding HeadingLevelProvider or titled Section gives, and plain text outside every one.
   */
  titleLevel?: HeadingLevel | undefined;
  /** One line under the title: the period, the unit, the source. With `summary`, the figure's description. */
  description?: ReactNode | undefined;
  /** One sentence for a screen reader that says what the chart shows: "Open findings fell from 14 in January to 5 in September." Part of the figure's description. Not shown. */
  summary?: string | undefined;
  /** The levels drilled into so far, from the top: `[{ label: "All families", onSelect }, { label: "AC" }]`. A Breadcrumb under the title; every crumb but the last goes back. */
  path?: ChartCrumb[] | undefined;
  /** The series, for the legend and the table, and for a Bar, Line or Area inside that is given none. Unsaid, the legend keys what the part inside draws: its series, its groups, its slices or its branches. */
  series?: ChartSeries[] | undefined;
  /** Where the legend sits. `top` when there are two or more series, `none` for one: the title names it. At a narrow width the header wraps, the tools stay on the title's row and the legend starts on the next. */
  legend?: "top" | "bottom" | "none" | undefined;
  /** The legend's swatch: a square for bars and areas, a stroke for lines, a dot for points. Unsaid, the part inside says which. */
  swatch?: SwatchShape | undefined;
  /** Every series wears a pattern as well as its colour, in the plot and in the legend: for print, colour-vision loss and forced colours. */
  texture?: boolean | undefined;
  /** Charts with the same id share their hover: the tooltip moves on all of them. For small multiples. */
  syncId?: string | undefined;
  /** Controls at the end of the header: a range, a filter. A retry belongs beside the error, in `onRetry`. */
  actions?: ReactNode | undefined;
  /** The files the reader can take away, as a Download menu in the header: the table twin as a CSV for a spreadsheet, the plot as a PNG at twice the pixel density with the title and the legend above it. */
  download?: ("csv" | "png")[] | undefined;
  /** An Expand button in the header that opens the same chart in a large Dialog, the plot redrawn at `large`. */
  expandable?: boolean | undefined;
  /** `loading` draws the plot's skeleton at its height; `refreshing` keeps the last plot, dimmed, with a spinner in the header; `empty` and `error` say so in the plot's place. The same word as DataTable's `state`. With `ready` and `data` that has no records, the Frame says it is empty. */
  state?: ChartFrameState | undefined;
  /**
   * The plot's state, under its old name. `state` wins when both are set.
   * @deprecated Use `state`, the name DataTable uses; `ledger/no-deprecated-name` fixes it.
   */
  status?: ChartFrameState | undefined;
  /** What an empty or failed plot says. "Nothing to show yet" and "The chart could not load" when unsaid. */
  statusTitle?: string | undefined;
  statusText?: string | undefined;
  /** A failed plot's Try again, beside its message, as DataTable's error has. */
  onRetry?: (() => void) | undefined;
  /** An action beside an empty or failed plot's message: the create action, Clear filters. */
  statusAction?: ReactNode | undefined;
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

/** The svg a PNG is drawn from: a part's marked surface, else recharts' own. */
const imageSource = (figure: HTMLElement | null) =>
  figure?.querySelector<SVGSVGElement>("svg[data-chart-surface], svg.recharts-surface") ?? null;

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
  const contextLevel = useHeadingLevel();

  const {
    title,
    titleLevel,
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
    state: stateProp,
    status: statusProp,
    statusTitle,
    statusText,
    onRetry,
    statusAction,
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
  const [canImage, setCanImage] = useState(true);
  const [imageFailed, setImageFailed] = useState(false);
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
  const given: ChartFrameState = stateProp ?? statusProp ?? "ready";
  // A part the caller removes takes its legend, its table and its CSV with it; while the Frame
  // stands an empty or failed message in for the plot, the part stays mounted and drawing nothing.
  const report = parts > 0 || given === "empty" || given === "error" ? lastReport : null;
  const source = report?.table;
  // Ready with records that hold nothing: an empty chart says so, rather than drawing bare axes.
  const noRecords =
    given === "ready" &&
    (data !== undefined ? data.length === 0 : source?.kind === "category" && !source.data.length);
  const status: ChartFrameState = noRecords ? "empty" : given;
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
  const standIn = status === "empty" || status === "error";
  const titleId = `${id}-title`;
  const state = useMemo<FrameState>(
    () => ({
      name: title,
      titleId,
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
      offstage: (showTable && showing) || standIn,
    }),
    [
      title,
      titleId,
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
      standIn,
    ],
  );
  const legendAt = legend ?? (series && series.length > 1 ? "top" : "none");
  // The table and the CSV print what the plot prints: the part's formats, else the Frame's.
  const twinFormat = report?.format ?? format;
  const twinFormatX = report?.formatX ?? formatX ?? defaultCategory;
  const category =
    data && x && seriesProp?.length
      ? { data, x, series: seriesProp }
      : source?.kind === "category"
        ? { data: data ?? source.data, x: x ?? source.x, series: seriesProp ?? source.series }
        : null;
  const twin = category ? category.series.length > 0 : Boolean(source);
  /** The twin: every series for the CSV; on screen, the series the legend shows. */
  const buildTwin = (onScreen: boolean): ChartTwin | null => {
    if (category) {
      const shown = onScreen ? category.series.filter((s) => !hidden.has(s.key)) : category.series;
      return categoryTwin({
        ...category,
        series: shown.length ? shown : category.series,
        xLabel: xLabel ?? (source?.kind === "category" ? source.xLabel : undefined) ?? category.x,
        columns,
        format: twinFormat,
        formatX: twinFormatX,
      });
    }
    if (source?.kind === "custom") return source.build({ xLabel, columns });
    return null;
  };
  const plotHeight = height ?? (size ? heights[size] : (report?.height ?? heights.medium));
  const csv = downloads?.includes("csv") && twin;
  const png = downloads?.includes("png");
  const valuesToggle = Boolean(report?.values);
  const saveCsv = () => {
    const table = buildTwin(false);
    if (!table) return;
    // A byte order mark, so a spreadsheet reads accented and non-Latin names as they are.
    downloadText(twinCsv(table), fileName(title, "csv"), {
      type: "text/csv;charset=utf-8",
      bom: true,
    });
  };
  const savePng = async () => {
    setImageFailed(false);
    const root = figure.current;
    const svg = imageSource(root);
    if (!root || !svg) {
      setCanImage(false);
      return;
    }
    const titleEl = root.querySelector(`[id="${titleId}"]`);
    const descriptionEl = root.querySelector(`[id="${id}-description"]`);
    const legendEl = root.querySelector('[data-slot="chart-legend"]');
    try {
      const blob = await svgToPng(svg, 2, {
        ...(titleEl ? { title: { text: title, element: titleEl } } : {}),
        ...(descriptionEl?.textContent
          ? { description: { text: descriptionEl.textContent, element: descriptionEl } }
          : {}),
        ...(legendEl && series && legendAt !== "none"
          ? {
              legend: {
                element: legendEl,
                keys: series
                  .map((s, i) => ({
                    key: s.key,
                    label: s.label ?? s.key,
                    color: chartColor(s.tone ?? categoricalTone(i)),
                    shape: swatch,
                  }))
                  .filter((k) => !hidden.has(k.key)),
              },
            }
          : {}),
      });
      download(fileName(title, "png"), blob);
    } catch {
      setImageFailed(true);
    }
  };
  const tools = csv || png || expandable || twin || valuesToggle;
  const shownTwin = twin && showTable && showing ? buildTwin(true) : null;
  const level = inDialog ? undefined : (titleLevel ?? contextLevel);
  const describedBy = [
    description && !inDialog ? `${id}-description` : null,
    summary ? `${id}-summary` : null,
  ]
    .filter(Boolean)
    .join(" ");
  const frameElement = useRender({
    defaultTagName: "figure",
    ref: figure,
    // Keep the caller's DOM ids, ref and handlers on the original figure only.
    render: (
      <figure
        aria-labelledby={titleId}
        {...(describedBy ? { "aria-describedby": describedBy } : {})}
        className={cn("flex min-w-0 flex-col gap-150", className)}
        {...(!inDialog ? figureProps : {})}
        data-slot="chart-frame"
        data-state={status}
      >
        <div
          data-slot="chart-frame-header"
          className="flex flex-wrap items-start justify-between gap-x-200 gap-y-100"
        >
          <figcaption data-slot="chart-frame-caption" className="flex min-w-0 flex-col gap-025">
            <span className={cn("flex items-center gap-100", inDialog && "sr-only")}>
              {level ? (
                (() => {
                  const Heading = headingTag(level);
                  return (
                    <Heading id={titleId} className="font-body font-medium text-default">
                      {title}
                    </Heading>
                  );
                })()
              ) : (
                <span id={titleId} className="font-body font-medium text-default">
                  {title}
                </span>
              )}
              {status === "refreshing" ? <Spinner size="small" label={t("refreshing")} /> : null}
            </span>
            {description && !inDialog ? (
              <span id={`${id}-description`} className="font-body-small text-subtle">
                {description}
              </span>
            ) : null}
            {summary ? (
              // The figure's description only: not read again in the caption's flow.
              <span id={`${id}-summary`} hidden>
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
          {(legendAt === "top" && series) || actions ? (
            <div
              data-slot="chart-frame-extras"
              className="flex min-w-0 flex-wrap items-center justify-end gap-150"
            >
              {legendAt === "top" && series ? (
                <ChartLegend series={series} swatch={swatch} />
              ) : null}
              {actions}
            </div>
          ) : null}
          {tools ? (
            <span data-slot="chart-frame-tools" className="flex flex-wrap items-center gap-050">
              {valuesToggle ? (
                <Toggle size="sm" pressed={values} onPressedChange={setValues} disabled={!showing}>
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
                <DropdownMenu
                  onOpenChange={(open) => {
                    if (open) setCanImage(Boolean(imageSource(figure.current)));
                  }}
                >
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
                  <DropdownMenuContent align="end">
                    {csv ? (
                      <DropdownMenuItem onClick={saveCsv}>{t("downloadCsv")}</DropdownMenuItem>
                    ) : null}
                    {png ? (
                      <DropdownMenuItem
                        onClick={() => void savePng()}
                        disabled={showTable || !canImage}
                        // The table stands in for the plot, so there is no image until the chart shows again.
                        {...(showTable
                          ? { disabledReason: t("chartImageInTable") }
                          : !canImage
                            ? { disabledReason: t("chartNoImage") }
                            : {})}
                      >
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
        {imageFailed ? (
          <Alert tone="danger" role="alert">
            <AlertIcon />
            <AlertDescription>{t("chartImageFailed")}</AlertDescription>
            <AlertAction>
              <IconButton
                label={t("close")}
                icon={<X />}
                variant="subtle"
                size="small"
                onClick={() => setImageFailed(false)}
              />
            </AlertAction>
          </Alert>
        ) : null}
        {loading ? (
          children || <Skeleton className="rounded-large" style={{ height: plotHeight }} />
        ) : standIn ? (
          <>
            {/* The part stays, drawing nothing, so the Frame still hears when its records change. */}
            <div hidden>{children}</div>
            <div
              data-slot="chart-status"
              className="flex flex-col items-center justify-center"
              style={{ minHeight: plotHeight }}
            >
              {status === "error" ? (
                <Alert tone="danger" role="alert" className="w-full">
                  <AlertIcon />
                  <AlertTitle>{statusTitle ?? t("chartError")}</AlertTitle>
                  {statusText ? <AlertDescription>{statusText}</AlertDescription> : null}
                  {onRetry || statusAction ? (
                    <AlertAction>
                      {onRetry ? (
                        <Button size="small" variant="secondary" onClick={onRetry}>
                          {t("retry")}
                        </Button>
                      ) : null}
                      {statusAction}
                    </AlertAction>
                  ) : null}
                </Alert>
              ) : (
                <Empty size="compact">
                  <EmptyMedia variant="icon" aria-hidden>
                    <ChartNoAxesColumn />
                  </EmptyMedia>
                  <EmptyHeader>
                    <EmptyTitle>{statusTitle ?? t("nothingToShow")}</EmptyTitle>
                    {statusText ? <EmptyDescription>{statusText}</EmptyDescription> : null}
                  </EmptyHeader>
                  {statusAction ? <EmptyContent>{statusAction}</EmptyContent> : null}
                </Empty>
              )}
            </div>
          </>
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
            <DialogContent width="xlarge" className="top-200 translate-y-0 sm:top-600">
              <DialogHeader>
                <DialogTitle>{title}</DialogTitle>
                <DialogDescription>{description}</DialogDescription>
              </DialogHeader>
              <DialogBody>
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
              </DialogBody>
            </DialogContent>
          </Dialog>
        ) : null}
      </FrameReportContext.Provider>
    </FrameContext.Provider>
  );
}

/** The twin as a Table: the category heads each row (`th scope="row"`), and each cell keeps its full width, so the table sizes to its content and scrolls in its own frame past the Frame's width, rather than clipping a word or a value. */
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
                  rowHeader={i === 0}
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
