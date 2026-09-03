import type { ReactNode } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { token } from "../generated/tokens";
import { cn } from "../lib/cn";
import type { Tone } from "./badge";

/*
 * Charts on the chart tokens. Every series is a `color.chart.*` token: a status tone when the series
 * carries a status (satisfied, overdue), `brand` for the one series the reader is asked to look at,
 * `neutral` for context, and the categorical set when categories carry no status. Recharts draws;
 * the kit decides the paint, the type, the grid and the tooltip, so a chart reads like the rest of
 * the page in both modes.
 */

export type ChartTone = Tone | "brand" | `categorical.${1 | 2 | 3 | 4 | 5 | 6 | 7 | 8}`;

/** The var() for a chart tone. */
export const chartColor = (tone: ChartTone): string =>
  token(`color.chart.${tone}` as Parameters<typeof token>[0]);

const categorical = (i: number): ChartTone =>
  `categorical.${((i % 8) + 1) as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8}`;

export type ChartDatum = Record<string, string | number | null | undefined>;

export type ChartSeries = {
  /** The key in each datum. */
  key: string;
  /** What the legend and tooltip call it. Defaults to the key. */
  label?: string | undefined;
  /** Defaults to the categorical set, in order. */
  tone?: ChartTone | undefined;
};

const grid = { stroke: token("color.border"), strokeDasharray: "0" };
const axisLine = { stroke: token("color.border") };

function Tick({
  x,
  y,
  payload,
  textAnchor,
  vertical,
}: {
  x?: number;
  y?: number;
  payload?: { value: string | number };
  textAnchor?: "start" | "middle" | "end" | "inherit";
  vertical?: boolean;
}) {
  return (
    <text
      x={x}
      y={y}
      dy={vertical ? 4 : 12}
      textAnchor={textAnchor ?? (vertical ? "end" : "middle")}
      className="font-body-xsmall"
      fill={token("color.text.subtlest")}
    >
      {payload?.value}
    </text>
  );
}

function TooltipContent({
  active,
  payload,
  label,
  series,
}: {
  active?: boolean;
  payload?: { name?: string; value?: number | string; dataKey?: string | number; color?: string }[];
  label?: string | number;
  series: ChartSeries[];
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-medium border border-default bg-surface-overlay px-150 py-100 shadow-overlay">
      {label !== undefined ? (
        <div className="pb-050 font-body-small font-medium text-default">{label}</div>
      ) : null}
      {payload.map((p, i) => {
        const s = series.find((x) => x.key === p.dataKey);
        return (
          <div key={i} className="flex items-center gap-100 font-body-small text-subtle">
            <span
              className="inline-block size-100 rounded-full"
              style={{ backgroundColor: p.color }}
            />
            <span className="min-w-0 flex-1 truncate">{s?.label ?? s?.key ?? p.name}</span>
            <span className="tabular-nums text-default">{p.value}</span>
          </div>
        );
      })}
    </div>
  );
}

type FrameProps = {
  data: ChartDatum[];
  /** The key that names each datum along the category axis. */
  x: string;
  series: ChartSeries[];
  height?: number | undefined;
  className?: string | undefined;
};

/** The ResponsiveContainer with the kit's height. Children are a recharts chart. */
function Frame({
  height = 200,
  className,
  children,
}: {
  height?: number | undefined;
  className?: string | undefined;
  children: ReactNode;
}) {
  return (
    <div className={cn("w-full", className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        {children as never}
      </ResponsiveContainer>
    </div>
  );
}

const toneOf = (s: ChartSeries, i: number) => s.tone ?? categorical(i);

/** Bars per category; several series sit side by side, or stack. */
function Bars({
  data,
  x,
  series,
  stacked,
  horizontal,
  height,
  className,
}: FrameProps & { stacked?: boolean | undefined; horizontal?: boolean | undefined }) {
  return (
    <Frame height={height} className={className}>
      <BarChart
        data={data}
        layout={horizontal ? "vertical" : "horizontal"}
        margin={{ top: 4, right: 8, bottom: 0, left: 0 }}
        barCategoryGap={stacked ? "30%" : "20%"}
      >
        <CartesianGrid {...grid} vertical={Boolean(horizontal)} horizontal={!horizontal} />
        {horizontal ? (
          <>
            <XAxis type="number" tick={<Tick />} axisLine={axisLine} tickLine={false} />
            <YAxis
              type="category"
              dataKey={x}
              tick={<Tick vertical />}
              axisLine={false}
              tickLine={false}
              width={96}
            />
          </>
        ) : (
          <>
            <XAxis dataKey={x} tick={<Tick />} axisLine={axisLine} tickLine={false} />
            <YAxis tick={<Tick vertical />} axisLine={false} tickLine={false} width={32} />
          </>
        )}
        <Tooltip
          cursor={{ fill: token("color.background.neutral.subtle.hovered") }}
          content={<TooltipContent series={series} />}
        />
        {series.map((s, i) => (
          <Bar
            key={s.key}
            dataKey={s.key}
            name={s.label ?? s.key}
            fill={chartColor(toneOf(s, i))}
            {...(stacked ? { stackId: "stack" } : {})}
            radius={stacked ? 0 : 2}
            maxBarSize={28}
          />
        ))}
      </BarChart>
    </Frame>
  );
}

/** A line per series. */
function Lines({ data, x, series, height, className }: FrameProps) {
  return (
    <Frame height={height} className={className}>
      <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
        <CartesianGrid {...grid} vertical={false} />
        <XAxis dataKey={x} tick={<Tick />} axisLine={axisLine} tickLine={false} />
        <YAxis tick={<Tick vertical />} axisLine={false} tickLine={false} width={32} />
        <Tooltip
          cursor={{ stroke: token("color.border.bold") }}
          content={<TooltipContent series={series} />}
        />
        {series.map((s, i) => (
          <Line
            key={s.key}
            type="monotone"
            dataKey={s.key}
            name={s.label ?? s.key}
            stroke={chartColor(toneOf(s, i))}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 3, strokeWidth: 0 }}
            isAnimationActive={false}
          />
        ))}
      </LineChart>
    </Frame>
  );
}

/** A filled line per series; stacked when asked. */
function Areas({
  data,
  x,
  series,
  stacked,
  height,
  className,
}: FrameProps & { stacked?: boolean | undefined }) {
  return (
    <Frame height={height} className={className}>
      <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
        <CartesianGrid {...grid} vertical={false} />
        <XAxis dataKey={x} tick={<Tick />} axisLine={axisLine} tickLine={false} />
        <YAxis tick={<Tick vertical />} axisLine={false} tickLine={false} width={32} />
        <Tooltip
          cursor={{ stroke: token("color.border.bold") }}
          content={<TooltipContent series={series} />}
        />
        {series.map((s, i) => {
          const c = chartColor(toneOf(s, i));
          return (
            <Area
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.label ?? s.key}
              stroke={c}
              fill={c}
              fillOpacity={0.16}
              strokeWidth={2}
              {...(stacked ? { stackId: "stack" } : {})}
              isAnimationActive={false}
            />
          );
        })}
      </AreaChart>
    </Frame>
  );
}

export type DonutSlice = {
  key: string;
  label: string;
  value: number;
  tone?: ChartTone | undefined;
};

/** A ring of slices with a number in the middle. The track is the whole; the slices are the parts. */
function Donut({
  slices,
  label,
  size = 120,
  thickness = 12,
  className,
}: {
  slices: DonutSlice[];
  label?: ReactNode;
  size?: number | undefined;
  thickness?: number | undefined;
  className?: string | undefined;
}) {
  const total = slices.reduce((n, s) => n + s.value, 0);
  const series: ChartSeries[] = slices.map((s) => ({ key: s.key, label: s.label }));
  return (
    <div
      className={cn("relative inline-block shrink-0", className)}
      style={{ width: size, height: size }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
          <Pie
            data={[{ key: "track", value: 1 }]}
            dataKey="value"
            innerRadius={size / 2 - thickness}
            outerRadius={size / 2}
            fill={token("color.chart.track")}
            stroke="none"
            isAnimationActive={false}
          />
          <Pie
            data={slices}
            dataKey="value"
            nameKey="label"
            innerRadius={size / 2 - thickness}
            outerRadius={size / 2}
            stroke="none"
            paddingAngle={slices.length > 1 ? 1 : 0}
            isAnimationActive={false}
          >
            {slices.map((s, i) => (
              <Cell key={s.key} fill={chartColor(s.tone ?? categorical(i))} />
            ))}
          </Pie>
          <Tooltip content={<TooltipContent series={series} />} />
        </PieChart>
      </ResponsiveContainer>
      {label !== undefined ? (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="tabular-nums font-heading-xsmall text-default">{label}</span>
          {typeof label !== "string" || label !== String(total) ? null : null}
        </div>
      ) : null}
    </div>
  );
}

/** A line with no axes, for a cell or a stat. */
function Sparkline({
  data,
  y,
  tone = "brand",
  width = 96,
  height = 24,
  className,
}: {
  data: ChartDatum[];
  y: string;
  tone?: ChartTone | undefined;
  width?: number | undefined;
  height?: number | undefined;
  className?: string | undefined;
}) {
  return (
    <div className={cn("inline-block align-middle", className)} style={{ width, height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
          <Line
            type="monotone"
            dataKey={y}
            stroke={chartColor(tone)}
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Swatch and label per series, inline. */
function Legend({ series, className }: { series: ChartSeries[]; className?: string | undefined }) {
  return (
    <ul className={cn("flex flex-wrap items-center gap-x-200 gap-y-050", className)}>
      {series.map((s, i) => (
        <li key={s.key} className="flex items-center gap-075 font-body-small text-subtle">
          <span
            className="inline-block size-100 rounded-xsmall"
            style={{ backgroundColor: chartColor(toneOf(s, i)) }}
          />
          {s.label ?? s.key}
        </li>
      ))}
    </ul>
  );
}

export const Chart = { Bar: Bars, Line: Lines, Area: Areas, Donut, Sparkline, Legend };
