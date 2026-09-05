import { type ReactNode } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Sector, Tooltip, type PieSectorDataItem } from "recharts";

import { token } from "../../generated/tokens";
import { cn } from "../../lib/cn";
import {
  CardHead,
  Plot,
  Swatch,
  TooltipContent,
  categoricalTone,
  chartColor,
  markClass,
  plainCategory,
  rectAnchor,
  seriesClass,
  surface,
  useFrame,
  useMotion,
  usePicked,
  useTooltipMotion,
  type ChartSeries,
  type ChartTone,
  type Formatter,
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
  /** Diameter in pixels. */
  size?: number | undefined;
  /** The ring's thickness in pixels. */
  thickness?: number | undefined;
  /** The number format in the tooltip. */
  format?: Formatter | undefined;
  /** The ring's accessible name. Unneeded inside a Frame. */
  name?: string | undefined;
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
  size = 120,
  thickness = 12,
  format: formatProp,
  name: nameProp,
  loading: loadingProp,
  onSelect,
  details,
  className,
}: ChartDonutProps) {
  const { name, hidden, highlighted, format, loading } = useFrame(
    nameProp,
    formatProp,
    undefined,
    loadingProp,
  );
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
  const cy = half ? outer : "50%";
  const chooses = Boolean(onSelect || details);
  if (loading)
    return (
      <div
        role={name ? "group" : undefined}
        aria-label={name ? `${name}, loading` : undefined}
        aria-busy
        aria-hidden={name ? undefined : true}
        className={cn("relative inline-block shrink-0 animate-pulse", className)}
        style={{ width: size, height: boxHeight }}
      >
        <svg width={size} height={boxHeight} aria-hidden>
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
            color={chartColor(picked.item.slice.tone ?? categoricalTone(slices.indexOf(picked.item.slice)))}
            shape="square"
          />
        }
        title={picked.item.slice.label}
        subtitle={`${Math.round(picked.item.share * 100)}% of ${format(total)}`}
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
        <ResponsiveContainer width="100%" height="100%">
          <PieChart
            margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
            accessibilityLayer={Boolean(name)}
              >
            <Pie
              data={[{ key: "track", value: 1 }]}
              dataKey="value"
              cx="50%"
              cy={cy}
              innerRadius={inner}
              outerRadius={outer}
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
              innerRadius={inner}
              outerRadius={outer}
              stroke={surface()}
              strokeWidth={shown.length > 1 ? 2 : 0}
              activeShape={(p: PieSectorDataItem) => (
                <Sector
                  {...defined({
                    cx: p.cx,
                    cy: p.cy,
                    innerRadius: p.innerRadius,
                    outerRadius: (p.outerRadius ?? outer) + 2,
                    startAngle: p.startAngle,
                    endAngle: p.endAngle,
                    fill: p.fill,
                    stroke: p.stroke,
                    strokeWidth: p.strokeWidth,
                    className: p.className,
                  })}
                />
              )}
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
                  fill={chartColor(s.tone ?? categoricalTone(slices.indexOf(s)))}
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
                  formatX={plainCategory}
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
