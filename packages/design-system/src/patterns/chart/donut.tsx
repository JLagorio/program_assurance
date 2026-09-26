import { useLedgerLocale } from "../../lib/locale";
import { useId, useMemo, type ReactNode } from "react";
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Sector,
  Tooltip,
  type PieSectorDataItem,
} from "recharts";

import { token } from "../../generated/tokens";
import { cn } from "../../lib/cn";
import {
  CardHead,
  Plot,
  Swatch,
  TextureDefs,
  TooltipContent,
  categoricalTone,
  chartColor,
  heights,
  hoveredColor,
  markClass,
  rectAnchor,
  seriesClass,
  surface,
  textureFill,
  textureOf,
  useFrame,
  useFrameReport,
  useMotion,
  usePicked,
  useTooltipMotion,
  type ChartSeries,
  type ChartTone,
  type Formatter,
  type FrameReport,
  type Texture,
  type TwinSource,
} from "./_shared";

export type DonutSlice = {
  key: string;
  label: string;
  value: number;
  tone?: ChartTone | undefined;
};

/** What was chosen on a ring: the slice, its share of the whole, and its index. */
export type DonutSelection = { slice: DonutSlice; share: number; index: number };

export type ChartDonutProps = {
  /** The parts, in order from the top, clockwise. */
  slices: DonutSlice[];
  /** The number in the middle: the total, the share, the one that matters. */
  label?: ReactNode | undefined;
  /** One word under the number: what it counts. */
  caption?: string | undefined;
  /** `full` is a ring; `half` is a gauge, open at the bottom, the label at its base. */
  arc?: "full" | "half" | undefined;
  /** The largest diameter in pixels. In a narrower container the ring scales down, keeping its proportions; the number keeps its type size. In the expanded Dialog it draws at 320px, the `large` plot's height, at least. */
  size?: number | undefined;
  /** The ring's thickness in pixels at `size`; it scales with the ring. */
  thickness?: number | undefined;
  /** The number format in the tooltip. */
  format?: Formatter | undefined;
  /** The ring's accessible name. Unneeded inside a Frame. */
  name?: string | undefined;
  /** Every slice wears a pattern as well as its colour. The Frame's `texture` sets it. */
  texture?: boolean | undefined;
  /** Draws the ring's skeleton in place of the slices. The Frame sets it from `status="loading"`. */
  loading?: boolean | undefined;
  /** Called when a slice is clicked. */
  onSelect?: ((selection: DonutSelection) => void) | undefined;
  /** More about the chosen slice, in a card anchored to it. The card's head (the slice, its value and its share) is the kit's. */
  details?: ((selection: DonutSelection) => ReactNode) | undefined;
  className?: string | undefined;
};

type Sector = {
  cx?: number;
  cy?: number;
  midAngle?: number;
  innerRadius?: number;
  outerRadius?: number;
};

const RADIAN = Math.PI / 180;

/** The keys with a value, so an optional prop is absent rather than `undefined`. */
const defined = <T extends object>(o: T) =>
  Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined)) as {
    [K in keyof T]: Exclude<T[K], undefined>;
  };

/** A ring of slices on a `color.chart.track` with a number in the middle; or half a ring, a gauge. A click on a slice chooses it. */
export function ChartDonut({
  slices,
  label,
  caption,
  arc = "full",
  size: sizeProp = 120,
  thickness: thicknessProp = 12,
  format: formatProp,
  name: nameProp,
  texture: textureProp,
  loading: loadingProp,
  onSelect,
  details,
  className,
}: ChartDonutProps) {
  const { t, formatNumber } = useLedgerLocale();

  const { name, hidden, highlighted, format, formatX, loading, texture, offstage, expanded } =
    useFrame(nameProp, formatProp, undefined, loadingProp, undefined, textureProp);
  // Expanded, the ring takes the room the Dialog gives a plot, thickness in proportion.
  const grow = expanded ? Math.max(1, heights.large / sizeProp) : 1;
  const size = sizeProp * grow;
  const thickness = thicknessProp * grow;
  const id = useId();
  const motion = useMotion();
  const tooltipMotion = useTooltipMotion();
  const { picked, pick, clear } = usePicked<DonutSelection>();
  const series: ChartSeries[] = slices.map((s) => ({ key: s.key, label: s.label }));
  const shown = slices.filter((s) => !hidden.has(s.key));
  const total = shown.reduce((n, s) => n + s.value, 0);
  const half = arc === "half";
  const outer = size / 2;
  const inner = outer - thickness;
  const boxHeight = half ? outer + 4 : size;
  const angles = half ? { startAngle: 180, endAngle: 0 } : { startAngle: 90, endAngle: -270 };
  // `size` is the largest the ring gets: in a narrower container (a block, a grid track or a flex
  // row) the box keeps its ratio and the geometry is given in shares of the box (Recharts reads
  // radii against half the box's shorter side), so the ring and its thickness scale together, as
  // through a viewBox.
  const maxRadius = Math.min(size, boxHeight) / 2;
  const share = (px: number) => `${(px / maxRadius) * 100}%`;
  const radii = { innerRadius: share(inner), outerRadius: share(outer) };
  const cy = half ? `${(outer / boxHeight) * 100}%` : "50%";
  const chooses = Boolean(onSelect || details);
  const toneOf = (s: DonutSlice) => s.tone ?? categoricalTone(slices.indexOf(s));
  const textures: Record<string, Texture> = {};
  if (texture) slices.forEach((s, i) => (textures[s.key] = textureOf(i)));
  const fillOf = (s: DonutSlice) =>
    texture
      ? textureFill(id, s.key, textureOf(slices.indexOf(s)), chartColor(toneOf(s)))
      : chartColor(toneOf(s));
  const legend = useMemo<ChartSeries[]>(
    () =>
      slices.map((s, i) => ({ key: s.key, label: s.label, tone: s.tone ?? categoricalTone(i) })),
    [slices],
  );
  const table = useMemo<TwinSource>(
    () => ({
      kind: "custom",
      build: ({ xLabel }) => {
        // Every slice's share of the whole, whichever the legend hides: the table is the data.
        const whole = slices.reduce((n, s) => n + s.value, 0);
        return {
          columns: [
            { label: xLabel ?? t("chartCategory"), numeric: false },
            { label: t("value"), numeric: true },
            { label: t("chartShare"), numeric: true },
          ],
          rows: slices.map((s) => {
            const part = whole ? s.value / whole : 0;
            return {
              key: s.key,
              cells: [
                { text: s.label, csv: s.label },
                { text: format(s.value), csv: String(s.value) },
                {
                  text: formatNumber(part, { style: "percent", maximumFractionDigits: 0 }),
                  csv: String(Number(part.toFixed(4))),
                },
              ],
            };
          }),
        };
      },
    }),
    [slices, t, format, formatNumber],
  );
  const report = useMemo<FrameReport>(
    () => ({ series: legend, swatch: "square", format, height: boxHeight, table }),
    [legend, format, boxHeight, table],
  );
  useFrameReport(report);
  if (offstage) return null;
  if (loading)
    return (
      <div
        role={name ? "group" : undefined}
        aria-label={name ? t("loadingLabel", { label: name }) : undefined}
        aria-busy
        aria-hidden={name ? undefined : true}
        className={cn("relative inline-block w-fit max-w-full shrink-0 animate-pulse", className)}
      >
        {/* Sized as the loaded ring's box is, so nothing moves when the slices arrive. */}
        <svg
          viewBox={`0 0 ${size} ${boxHeight}`}
          width={size}
          height={boxHeight}
          className="block h-auto max-w-full"
          aria-hidden
        >
          <circle
            cx={outer}
            cy={outer}
            r={outer - thickness / 2}
            fill="none"
            stroke={token("color.skeleton")}
            strokeWidth={thickness}
          />
        </svg>
      </div>
    );
  const card = picked ? (
    <>
      <CardHead
        swatch={
          <Swatch
            color={chartColor(toneOf(picked.item.slice))}
            shape="square"
            texture={textures[picked.item.slice.key]}
          />
        }
        title={picked.item.slice.label}
        subtitle={t("shareOfTotal", {
          share: formatNumber(picked.item.share, { style: "percent", maximumFractionDigits: 0 }),
          total: format(total),
        })}
        value={format(picked.item.slice.value)}
      />
      {details?.(picked.item)}
    </>
  ) : null;
  return (
    <Plot
      name={name}
      width={size}
      height={boxHeight}
      className={cn("inline-block shrink-0", className)}
      card={card}
      anchor={picked?.anchor}
      onClose={clear}
    >
      <>
        <ResponsiveContainer
          width="100%"
          height="100%"
          initialDimension={{ width: size, height: boxHeight }}
        >
          <PieChart
            margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
            accessibilityLayer={Boolean(name)}
          >
            <Pie
              data={[{ key: "track", value: 1 }]}
              dataKey="value"
              cx="50%"
              cy={cy}
              {...radii}
              fill={token("color.chart.track")}
              stroke="none"
              isAnimationActive={false}
              {...angles}
            />
            <Pie
              data={shown}
              dataKey="value"
              nameKey="label"
              cx="50%"
              cy={cy}
              {...radii}
              stroke={surface()}
              strokeWidth={shown.length > 1 ? 2 : 0}
              activeShape={(p: PieSectorDataItem) => {
                const slice = shown.find((s) => s.label === (p as { name?: string }).name);
                return (
                  <Sector
                    {...defined({
                      cx: p.cx,
                      cy: p.cy,
                      innerRadius: p.innerRadius,
                      outerRadius: (p.outerRadius ?? outer) + 2,
                      startAngle: p.startAngle,
                      endAngle: p.endAngle,
                      fill: slice && !texture ? hoveredColor(toneOf(slice)) : p.fill,
                      stroke: p.stroke,
                      strokeWidth: p.strokeWidth,
                      className: p.className,
                    })}
                  />
                );
              }}
              {...motion}
              {...angles}
              {...(chooses
                ? {
                    onClick: (item: unknown, index: number) => {
                      const s = shown[index];
                      if (!s) return;
                      const sec = item as Sector;
                      const r = ((sec.innerRadius ?? inner) + (sec.outerRadius ?? outer)) / 2;
                      const a = -(sec.midAngle ?? 0) * RADIAN;
                      const selection = { slice: s, share: total ? s.value / total : 0, index };
                      onSelect?.(selection);
                      if (details)
                        pick(
                          selection,
                          rectAnchor({
                            x: (sec.cx ?? outer) + r * Math.cos(a) - 4,
                            y: (sec.cy ?? outer) + r * Math.sin(a) - 4,
                            width: 8,
                            height: 8,
                          }),
                        );
                    },
                  }
                : {})}
            >
              {shown.map((s, i) => (
                <Cell
                  key={s.key}
                  fill={fillOf(s)}
                  {...seriesClass(s.key, highlighted, chooses)}
                  {...(picked ? markClass(picked.item.index === i) : {})}
                />
              ))}
            </Pie>
            <Tooltip
              {...tooltipMotion}
              content={
                <TooltipContent
                  series={series}
                  swatch="square"
                  format={format}
                  formatX={formatX}
                  textures={textures}
                />
              }
            />
          </PieChart>
        </ResponsiveContainer>
        {label !== undefined || caption ? (
          <div
            className={cn(
              "pointer-events-none absolute inset-x-0 flex flex-col items-center text-center",
              half ? "bottom-0" : "inset-y-0 justify-center",
            )}
          >
            {label !== undefined ? (
              <span className="font-heading-xsmall text-default">{label}</span>
            ) : null}
            {caption ? <span className="font-body-xsmall text-subtle">{caption}</span> : null}
          </div>
        ) : null}
      </>
    </Plot>
  );
}
