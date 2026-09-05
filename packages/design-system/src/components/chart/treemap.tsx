import { useMemo, type ReactNode } from "react";
import { Tooltip, Treemap } from "recharts";

import { token } from "../../generated/tokens";
import { cn } from "../../lib/cn";
import {
  CardHead,
  Plot,
  PlotSkeleton,
  Swatch,
  TooltipContent,
  categoricalTone,
  chartColor,
  plainCategory,
  rectAnchor,
  surface,
  truncate,
  useFrame,
  useMotion,
  usePicked,
  useTooltipMotion,
  type ChartSeries,
  type ChartSize,
  type ChartTone,
  type Formatter,
} from "./_shared";

export type TreemapNodeInput = {
  name: string;
  /** A leaf's size. A node with children is the sum of theirs. */
  value?: number | undefined;
  /** A top-level node's tone; its children inherit it. The categorical set, in order, when unsaid. */
  tone?: ChartTone | undefined;
  children?: TreemapNodeInput[] | undefined;
};

/** What was chosen on a treemap: the tile's name and value, and the top-level branch it sits in. */
export type TreemapSelection = { name: string; value: number; group: string };

export type ChartTreemapProps = {
  data: TreemapNodeInput[];
  size?: ChartSize | undefined;
  height?: number | undefined;
  format?: Formatter | undefined;
  label?: string | undefined;
  /** Draws the plot's skeleton in place of the tiles. The Frame sets it from `status="loading"`. */
  loading?: boolean | undefined;
  /** Called when a tile is clicked: to drill into its branch, or to filter what is under the chart. */
  onSelect?: ((selection: TreemapSelection) => void) | undefined;
  /** More about the chosen tile, in a card anchored to it. The card's head (the tile, its branch and its value) is the kit's. */
  details?: ((selection: TreemapSelection) => ReactNode) | undefined;
  className?: string | undefined;
};

type ToneNode = {
  name: string;
  value?: number | undefined;
  tone: ChartTone;
  group: string;
  children?: ToneNode[] | undefined;
};

const withTones = (nodes: TreemapNodeInput[], inherited?: ChartTone, group?: string): ToneNode[] =>
  nodes.map((n, i) => {
    const tone = n.tone ?? inherited ?? categoricalTone(i);
    const g = group ?? n.name;
    return {
      name: n.name,
      value: n.value,
      tone,
      group: g,
      ...(n.children ? { children: withTones(n.children, tone, g) } : {}),
    };
  });

type TileProps = {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  name?: string;
  value?: number;
  tone?: ChartTone;
  group?: string;
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
  depth,
  children,
  format,
  clickable,
  highlighted,
  chosen,
}: TileProps & {
  format: Formatter;
  clickable: boolean;
  highlighted: string | null;
  chosen: string | null;
}) {
  if (x === undefined || y === undefined || !width || !height || depth === 0) return null;
  const leaf = !children || (Array.isArray(children) && children.length === 0);
  if (!leaf) return null;
  const fits = width >= 64 && height >= 28;
  const text = fits ? truncate(name ?? "", Math.floor((width - 16) / 6.5)) : "";
  const title = `${name ?? ""}: ${value !== undefined ? format(value) : ""}`;
  const dim =
    (highlighted !== null && highlighted !== group && highlighted !== name) ||
    (chosen !== null && chosen !== name);
  return (
    <g className={cn(clickable && "cursor-pointer", dim && "opacity-disabled") || undefined}>
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
            <title>{title}</title>
          </text>
        </g>
      ) : (
        <title>{title}</title>
      )}
    </g>
  );
}

type Clicked = { name: string; value: number; group?: string; x?: number; y?: number; width?: number; height?: number };

/** Part-to-whole with a hierarchy: a tile per leaf, sized by value, in the tone of its top-level parent. A click on a tile chooses it. */
export function ChartTreemap({
  data,
  size,
  height,
  format: formatProp,
  label,
  loading: loadingProp,
  onSelect,
  details,
  className,
}: ChartTreemapProps) {
  const { name, hidden, highlighted, format, loading } = useFrame(
    label,
    formatProp,
    undefined,
    loadingProp,
  );
  const motion = useMotion();
  const tooltipMotion = useTooltipMotion();
  const { picked, pick, clear } = usePicked<TreemapSelection>();
  const nodes = useMemo(() => withTones(data), [data]);
  const shown = useMemo(() => nodes.filter((n) => !hidden.has(n.name)), [nodes, hidden]);
  if (loading)
    return <PlotSkeleton kind="tiles" name={name} size={size} height={height} className={className} />;
  const series: ChartSeries[] = [{ key: "value", label: "Value" }];
  const chooses = Boolean(onSelect || details);
  const content = (p: TileProps) => (
    <Tile
      {...p}
      format={format}
      clickable={chooses}
      highlighted={highlighted}
      chosen={picked?.item.name ?? null}
    />
  );
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
        subtitle={picked.item.group !== picked.item.name ? picked.item.group : undefined}
        value={format(picked.item.value)}
      />
      {details?.(picked.item)}
    </>
  ) : null;
  return (
    <Plot
      name={name}
      size={size}
      height={height}
      className={className}
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
        content={content as never}
        {...(chooses
          ? {
              onClick: (node: unknown) => {
                const n = node as Clicked;
                const selection = { name: n.name, value: n.value, group: n.group ?? n.name };
                onSelect?.(selection);
                if (details) pick(selection, rectAnchor(n));
              },
            }
          : {})}
      >
        <Tooltip
          {...tooltipMotion}
          content={
            <TooltipContent
              series={series}
              swatch="square"
              format={format}
              formatX={plainCategory}
            />
          }
        />
      </Treemap>
    </Plot>
  );
}
