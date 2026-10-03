import { useLedgerLocale } from "../../lib/locale";
import { useMemo, useState, type ComponentProps, type FocusEvent, type ReactNode } from "react";
import { Tooltip, Treemap } from "recharts";

import { token } from "../../generated/tokens";
import { cn } from "../../lib/cn";
import {
  CardHead,
  Plot,
  PlotSkeleton,
  Swatch,
  categoricalTone,
  chartColor,
  heights,
  overlay,
  rectAnchor,
  surface,
  truncate,
  useChartSurface,
  useFrame,
  useFrameReport,
  useMotion,
  usePicked,
  usePlotSize,
  useTooltipMotion,
  type ChartSeries,
  type ChartSize,
  type ChartTone,
  type ChartTwin,
  type Formatter,
  type FrameReport,
  type TwinSource,
} from "./_shared";

export type TreemapNodeInput = {
  name: string;
  /** What tells this node apart from another of the same name: a record's id. Its path of names when unsaid. */
  id?: string | undefined;
  /** A leaf's size. A node with children is the sum of theirs. */
  value?: number | undefined;
  /** A top-level node's tone; its children inherit it. The categorical set, in order, when unsaid. */
  tone?: ChartTone | undefined;
  children?: TreemapNodeInput[] | undefined;
};

/** What was chosen on a treemap: the tile's name and value, the top-level branch it sits in, the names on its way down (`path`, the tile's own last), and its `id` when the node has one. */
export type TreemapSelection = {
  name: string;
  value: number;
  group: string;
  path: string[];
  id?: string | undefined;
};

type ChartTreemapOwnProps = {
  data: TreemapNodeInput[];
  /** What each level of the hierarchy is called, from the top, for the table twin's headings: `["System", "Component"]`. The Frame's `xLabel` for the top level, then "Group" and "Name", when unsaid. */
  levels?: string[] | undefined;
  /** The plot's height. The Frame's when unsaid, else `medium` (200px); `large` in the expanded Dialog. */
  size?: ChartSize | undefined;
  height?: number | undefined;
  format?: Formatter | undefined;
  /** The plot's accessible name. The Frame's title when unsaid. */
  label?: string | undefined;
  /** Draws the plot's skeleton in place of the tiles. The Frame sets it from `state="loading"`. */
  loading?: boolean | undefined;
  /** Called when a tile is clicked or activated with Enter/Space: to drill into its branch, or to filter what is under the chart. */
  onSelect?: ((selection: TreemapSelection) => void) | undefined;
  /** More about the chosen tile, in a card anchored to it. The card's head (the tile, its branch and its value) is the kit's. */
  details?: ((selection: TreemapSelection) => ReactNode) | undefined;
  className?: string | undefined;
};

/** The part's own props, and the native props and ref of the plot's box: an `id`, `data-*` for a test, a handler. */
export type ChartTreemapProps = ChartTreemapOwnProps &
  Omit<ComponentProps<"div">, keyof ChartTreemapOwnProps | "children" | "role">;

type ToneNode = {
  name: string;
  value?: number | undefined;
  tone: ChartTone;
  group: string;
  path: string[];
  /** The caller's `id`. Not `id`, which recharts gives every tile of its own. */
  nodeId?: string | undefined;
  children?: ToneNode[] | undefined;
};

const pathKey = (path: string[]) => JSON.stringify(path);

/** A node's identity: its own `id`, else its path of names. What a chosen tile is matched by. */
const identity = (id: string | undefined, path: string[]) => id ?? pathKey(path);

const withTones = (
  nodes: TreemapNodeInput[],
  inherited?: ChartTone,
  group?: string,
  above: string[] = [],
): ToneNode[] =>
  nodes.map((n, i) => {
    const tone = n.tone ?? inherited ?? categoricalTone(i);
    const g = group ?? n.name;
    const path = [...above, n.name];
    return {
      name: n.name,
      value: n.value,
      tone,
      group: g,
      path,
      ...(n.id !== undefined ? { nodeId: n.id } : {}),
      ...(n.children ? { children: withTones(n.children, tone, g, path) } : {}),
    };
  });

/** The branch a tile sits in, for its tooltip and card: the names above it, from the top. */
const branchOf = (path: string[] | undefined) =>
  path && path.length > 1 ? path.slice(0, -1).join(" › ") : undefined;

type TileProps = {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  name?: string;
  value?: number;
  tone?: ChartTone;
  group?: string;
  path?: string[];
  nodeId?: string;
  depth?: number;
  children?: unknown;
};

/** A tile: the fill in its tone with a 2px surface gap, and the name on a surface chip when it fits. */
function Tile({
  x,
  y,
  width,
  height,
  name,
  value,
  tone,
  group,
  path,
  nodeId: id,
  depth,
  children,
  format,
  onChoose,
  keyboardAccessible,
  hasCard,
  highlighted,
  chosen,
  onKeyboardFocus,
}: TileProps & {
  format: Formatter;
  onChoose?: ((node: Clicked) => void) | undefined;
  keyboardAccessible: boolean;
  hasCard: boolean;
  highlighted: string | null;
  chosen: string | null;
  onKeyboardFocus: (focused: boolean) => void;
}) {
  const { t } = useLedgerLocale();
  if (x === undefined || y === undefined || !width || !height || depth === 0) return null;
  const leaf = !children || (Array.isArray(children) && children.length === 0);
  if (!leaf) return null;
  const nodeKey = identity(id, path ?? [name ?? ""]);
  const fits = width >= 64 && height >= 28;
  const text = fits ? truncate(name ?? "", Math.floor((width - 16) / 6.5)) : "";
  const place = path && path.length ? path.join(", ") : (name ?? "");
  const dim =
    (highlighted !== null && highlighted !== group && highlighted !== name) ||
    (chosen !== null && chosen !== nodeKey);
  const choose = () =>
    onChoose?.({
      name: name ?? "",
      value: value ?? 0,
      group,
      path: path ?? [name ?? ""],
      id,
      x,
      y,
      width,
      height,
    });
  // The keyboard's ring, inside the tile so no later tile paints over it and the svg's edge
  // cannot cut it: a focus-coloured band between two surface bands, whatever the tile's hue.
  const ring = (inset: number) => ({
    x: x + inset,
    y: y + inset,
    width: Math.max(0, width - inset * 2),
    height: Math.max(0, height - inset * 2),
  });
  return (
    <g
      data-chart-tile={JSON.stringify(path ?? [group ?? name, name])}
      role={keyboardAccessible ? "button" : undefined}
      tabIndex={keyboardAccessible ? 0 : undefined}
      aria-label={
        keyboardAccessible
          ? t("chartPoint", { category: place, values: value !== undefined ? format(value) : "" })
          : undefined
      }
      aria-haspopup={keyboardAccessible && hasCard ? "dialog" : undefined}
      aria-expanded={keyboardAccessible && hasCard ? chosen === nodeKey : undefined}
      onClick={onChoose ? choose : undefined}
      onFocus={
        keyboardAccessible
          ? (event: FocusEvent<SVGGElement>) =>
              onKeyboardFocus(event.currentTarget.matches(":focus-visible"))
          : undefined
      }
      onBlur={keyboardAccessible ? () => onKeyboardFocus(false) : undefined}
      onKeyDown={
        keyboardAccessible
          ? (event) => {
              if (event.key !== "Enter" && event.key !== " ") return;
              event.preventDefault();
              event.stopPropagation();
              choose();
            }
          : undefined
      }
      className={
        cn(onChoose && "group/tile cursor-pointer outline-none", dim && "opacity-disabled") ||
        undefined
      }
    >
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={2}
        fill={chartColor(tone ?? "neutral")}
        stroke={surface()}
        strokeWidth={2}
      />
      {text ? (
        <g>
          <rect
            x={x + 6}
            y={y + 6}
            width={text.length * 6.5 + 8}
            height={18}
            rx={2}
            fill={surface()}
            fillOpacity={0.92}
          />
          <text x={x + 10} y={y + 19} className="font-body-xsmall" fill={token("color.text")}>
            {text}
          </text>
        </g>
      ) : null}
      {keyboardAccessible ? (
        <g
          data-slot="chart-mark-focus"
          aria-hidden
          className="pointer-events-none opacity-0 group-focus-visible/tile:opacity-100"
        >
          <rect {...ring(4)} rx={1} fill="none" stroke={surface()} strokeWidth={2} />
          <rect
            {...ring(2)}
            rx={1}
            fill="none"
            stroke={token("color.border.focused")}
            strokeWidth={2}
          />
        </g>
      ) : null}
    </g>
  );
}

/**
 * A treemap's table twin: one row per leaf, in the tree's order, a column per level holding the
 * names on its way down (empty past a shallower leaf), then its value. Every branch the legend
 * hides stays: the table is the data.
 */
function treemapTwin(
  nodes: TreemapNodeInput[],
  heading: (level: number, depth: number) => string,
  valueLabel: string,
  format: Formatter,
): ChartTwin {
  const leaves: { path: string[]; value: number }[] = [];
  const walk = (list: TreemapNodeInput[], path: string[]) => {
    for (const n of list) {
      if (n.children?.length) walk(n.children, [...path, n.name]);
      else leaves.push({ path: [...path, n.name], value: n.value ?? 0 });
    }
  };
  walk(nodes, []);
  const depth = Math.max(1, ...leaves.map((l) => l.path.length));
  const levels = Array.from({ length: depth }, (_, i) => i);
  return {
    columns: [
      ...levels.map((i) => ({ label: heading(i, depth), numeric: false })),
      { label: valueLabel, numeric: true },
    ],
    rows: leaves.map((l, r) => ({
      key: String(r),
      cells: [
        ...levels.map((i) => ({ text: l.path[i] ?? "", csv: l.path[i] ?? "" })),
        { text: format(l.value), csv: String(l.value) },
      ],
    })),
  };
}

type Clicked = {
  name: string;
  value: number;
  group?: string | undefined;
  path: string[];
  id?: string | undefined;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
};

/** A tile's tooltip: its name, the branch it sits in, and its value, keyed by a square in its tone. */
function TreemapTooltip({
  active,
  payload,
  format,
}: {
  active?: boolean | undefined;
  payload?: { payload?: Partial<ToneNode> & { value?: number } }[] | undefined;
  format: Formatter;
}) {
  const { t } = useLedgerLocale();
  const node = payload?.[0]?.payload;
  if (!active || !node?.name) return null;
  const branch = branchOf(node.path);
  return (
    <div className={cn("min-w-0", overlay)}>
      <div className="flex items-center gap-100 pb-050 font-body-small">
        <Swatch color={chartColor(node.tone ?? "neutral")} shape="square" />
        <span className="font-medium text-default">{node.name}</span>
        {branch ? <span className="text-subtle">{branch}</span> : null}
      </div>
      {node.value !== undefined ? (
        <div className="flex items-center gap-100 font-body-small">
          <span className="min-w-0 flex-1 truncate text-subtle">{t("value")}</span>
          <span className="tabular-nums font-medium text-default">{format(node.value)}</span>
        </div>
      ) : null}
    </div>
  );
}

/** Part-to-whole with a hierarchy: a tile per leaf, sized by value, in the tone of its top-level parent. A click on a tile chooses it. */
export function ChartTreemap({
  data,
  levels,
  size: sizeProp,
  height: heightProp,
  format: formatProp,
  label,
  loading: loadingProp,
  onSelect,
  details,
  className,
  "aria-describedby": describedBy,
  ...native
}: ChartTreemapProps) {
  const { t } = useLedgerLocale();

  const {
    name: frameName,
    titleId,
    hidden,
    highlighted,
    format,
    loading,
    offstage,
  } = useFrame(label, formatProp, undefined, loadingProp);
  const chooses = Boolean(onSelect || details);
  const surfaceProps = useChartSurface({
    name: frameName,
    titleId,
    chooses,
    describedBy,
    count: 0,
    describe: () => "",
  });
  const name = surfaceProps.name;
  const { size, height } = usePlotSize(sizeProp, heightProp);
  const motion = useMotion();
  const tooltipMotion = useTooltipMotion();
  const { picked, pick, clear } = usePicked<TreemapSelection>();
  // A tile the keyboard is on: the pointer's tooltip stands down, so it cannot sit over the tile.
  const [keyboardOn, setKeyboardOn] = useState(false);
  const nodes = useMemo(() => withTones(data), [data]);
  const shown = useMemo(() => nodes.filter((n) => !hidden.has(n.name)), [nodes, hidden]);
  const legend = useMemo<ChartSeries[]>(
    () => nodes.map((n) => ({ key: n.name, label: n.name, tone: n.tone })),
    [nodes],
  );
  const table = useMemo<TwinSource>(
    () => ({
      kind: "custom",
      build: ({ xLabel }) =>
        treemapTwin(
          data,
          (i, depth) => {
            const named = levels?.[i];
            if (named) return named;
            if (depth === 1) return xLabel ?? t("chartName");
            if (i === depth - 1) return t("chartName");
            return (i === 0 ? xLabel : undefined) ?? t("chartGroup");
          },
          t("value"),
          format,
        ),
    }),
    [data, levels, t, format],
  );
  const report = useMemo<FrameReport>(
    () => ({
      series: legend,
      swatch: "square",
      format,
      height: height ?? heights[size ?? "medium"],
      table,
    }),
    [legend, format, height, size, table],
  );
  useFrameReport(report);
  if (offstage) return null;
  if (loading)
    return (
      <PlotSkeleton
        {...native}
        kind="tiles"
        name={name}
        size={size}
        height={height}
        className={className}
      />
    );
  const choose = (node: Clicked) => {
    const selection: TreemapSelection = {
      name: node.name,
      value: node.value,
      group: node.group ?? node.name,
      path: node.path,
      ...(node.id !== undefined ? { id: node.id } : {}),
    };
    onSelect?.(selection);
    if (details) pick(selection, rectAnchor(node));
  };
  const chosenKey = picked ? identity(picked.item.id, picked.item.path) : null;
  const card = picked ? (
    <>
      <CardHead
        swatch={
          <Swatch
            color={chartColor(nodes.find((n) => n.name === picked.item.group)?.tone ?? "neutral")}
            shape="square"
          />
        }
        title={picked.item.name}
        subtitle={branchOf(picked.item.path)}
        value={format(picked.item.value)}
      />
      {details?.(picked.item)}
    </>
  ) : null;
  return (
    <Plot
      {...native}
      // Choosing, the box is the named group and carries the description; else the svg does.
      aria-describedby={chooses ? describedBy : undefined}
      name={name}
      size={size}
      height={height}
      className={className}
      semantics={chooses ? "wrapper" : "surface"}
      card={card}
      anchor={picked?.anchor}
      onClose={clear}
    >
      <Treemap
        data={shown as never}
        dataKey="value"
        nameKey="name"
        aspectRatio={4 / 3}
        {...motion}
        // Its tiles are the tab stops when it chooses; otherwise the svg is an image of the data.
        {...(chooses ? {} : (surfaceProps.chart as object))}
        content={
          <Tile
            format={format}
            onChoose={chooses ? choose : undefined}
            keyboardAccessible={chooses && Boolean(name)}
            hasCard={Boolean(details)}
            highlighted={highlighted}
            chosen={chosenKey}
            onKeyboardFocus={setKeyboardOn}
          />
        }
      >
        <Tooltip
          {...tooltipMotion}
          {...(keyboardOn ? { active: false } : {})}
          content={<TreemapTooltip format={format} />}
        />
      </Treemap>
    </Plot>
  );
}
