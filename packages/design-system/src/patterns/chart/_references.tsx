import {
  DefaultZIndexes,
  ReferenceArea,
  ReferenceLine,
  usePlotArea,
  useXAxisScale,
  useYAxisScale,
  ZIndexLayer,
} from "recharts";

import { token } from "../../generated/tokens";
import { spreadLabels, type TopLabel } from "./_labels";
import { labelWidth } from "./_marks";
import { toMs } from "./_time";
import { chartColor, surface } from "./_tones";
import type { ChartBand, ChartReference } from "./_types";

/* Reference lines and bands, and their labels. */

/** Whether a reference draws as a vertical line: on the category axis of a column chart, on the value axis of a horizontal one. */
const isVertical = (r: ChartReference, horizontal: boolean | undefined) =>
  horizontal ? r.y !== undefined : r.y === undefined;

/** Whether a band runs across categories or dates, so its label sits above the plot. */
const isAcross = (b: ChartBand) => b.fromX !== undefined || b.toX !== undefined;

/** A category value as recharts wants it on the axis: milliseconds on a time axis, itself otherwise. */
const axisValue = (v: string | number | Date | undefined, time: boolean) =>
  v === undefined ? undefined : time ? toMs(v) : v instanceof Date ? v.getTime() : v;

/**
 * Every reference line's and band's label, in `color.text.subtlest`, drawn over the marks. Above
 * the plot, in one row: a vertical line's over its line (lines on one date share one label, joined
 * with a middle dot), and a band's across categories or dates over its middle; where two would
 * overlap in a narrow plot they move apart, each staying over its mark (a band's middle over the
 * band) and within the plot's width, clear of the axis ticks and the end labels' margin. Where the
 * row cannot hold them so, a band's shortens before a line's wherever that makes room, each only as
 * far as the row needs, with an ellipsis and its whole text as the label's title; one with no room
 * for three characters drops out. Inside the plot: a horizontal line's at its end, and a band's
 * between two values at its top end, ringed in the surface so a line that crosses one runs behind
 * the words.
 */
export function ReferenceLabels({
  reference,
  bands,
  horizontal,
  time,
}: {
  reference?: ChartReference[] | undefined;
  bands?: ChartBand[] | undefined;
  horizontal?: boolean | undefined;
  time?: boolean | undefined;
}) {
  const xScale = useXAxisScale();
  const yScale = useYAxisScale();
  const plot = usePlotArea();
  if (!xScale || !yScale || !plot) return null;
  const onTime = Boolean(time);
  const top: TopLabel[] = [];
  const inside: { key: string; text: string; y: number }[] = [];
  reference?.forEach((r, i) => {
    if (!r.label) return;
    const key = `line-${i}`;
    if (isVertical(r, horizontal)) {
      const at = xScale(horizontal ? r.y : axisValue(r.x, onTime), { position: "middle" });
      if (at !== undefined)
        top.push({
          key,
          text: r.label,
          at,
          from: at,
          to: at,
          width: labelWidth(r.label),
          weight: 3,
        });
      return;
    }
    const y = yScale(horizontal ? axisValue(r.x, onTime) : r.y, { position: "middle" });
    if (y !== undefined) inside.push({ key, text: r.label, y });
  });
  bands?.forEach((b, i) => {
    if (!b.label) return;
    const key = `band-${i}`;
    if (isAcross(b)) {
      const from =
        b.fromX === undefined ? plot.x : xScale(axisValue(b.fromX, onTime), { position: "start" });
      const to =
        b.toX === undefined
          ? plot.x + plot.width
          : xScale(axisValue(b.toX, onTime), { position: "end" });
      if (from !== undefined && to !== undefined)
        top.push({
          key,
          text: b.label,
          at: (from + to) / 2,
          from: Math.min(from, to),
          to: Math.max(from, to),
          width: labelWidth(b.label),
          weight: 1,
        });
      return;
    }
    const y = yScale(Math.max(b.from ?? 0, b.to ?? 0));
    if (y !== undefined) inside.push({ key, text: b.label, y });
  });
  if (!top.length && !inside.length) return null;
  // Lines on one category or date share one label, so neither is pushed off the line or left out.
  const row: TopLabel[] = [];
  for (const l of top) {
    const i = row.findIndex((m) => m.from === m.to && l.from === l.to && Math.abs(m.at - l.at) < 1);
    const same = row[i];
    if (!same) {
      row.push(l);
      continue;
    }
    const text = `${same.text} · ${l.text}`;
    row[i] = { ...same, key: `${same.key}+${l.key}`, text, width: labelWidth(text) };
  }
  const end = plot.x + plot.width;
  const ink = token("color.text.subtlest");
  // Over every mark, under the hover's cursor line and active dot.
  return (
    <ZIndexLayer zIndex={DefaultZIndexes.scatter + 1}>
      <g>
        {spreadLabels(row, plot.x, end, 8, labelWidth).map((l) => (
          <g key={l.key}>
            {l.full ? <title>{l.full}</title> : null}
            <text
              x={l.x}
              y={plot.y - 5}
              textAnchor="middle"
              className="font-body-xsmall"
              fill={ink}
            >
              {l.text}
            </text>
          </g>
        ))}
        {inside.map((l) => (
          <text
            key={l.key}
            x={end}
            y={l.y - 4}
            textAnchor="end"
            className="font-body-xsmall"
            fill={ink}
            stroke={surface()}
            strokeWidth={3}
            strokeLinejoin="round"
            paintOrder="stroke"
          >
            {l.text}
          </text>
        ))}
      </g>
    </ZIndexLayer>
  );
}

/** The reference lines, dashed in their tone. Their labels are `ReferenceLabels`', drawn over the marks. */
export function References({
  reference,
  horizontal,
  time,
}: {
  reference: ChartReference[] | undefined;
  horizontal?: boolean | undefined;
  time?: boolean | undefined;
}) {
  if (!reference?.length) return null;
  return (
    <>
      {reference.map((r, i) => {
        const stroke = chartColor(r.tone ?? "neutral");
        // On a horizontal chart the value axis is x, so a `y` reference is a vertical line.
        const onValueAxis = r.y !== undefined;
        const cat = axisValue(r.x, Boolean(time)) as string | number;
        const pos = horizontal
          ? onValueAxis
            ? { x: r.y as number }
            : { y: cat }
          : onValueAxis
            ? { y: r.y as number }
            : { x: cat };
        return (
          <ReferenceLine
            key={i}
            {...pos}
            stroke={stroke}
            strokeWidth={1}
            strokeDasharray="4 3"
            ifOverflow="extendDomain"
          />
        );
      })}
    </>
  );
}

/** The bands, a wash of their tone under the marks. Their labels are `ReferenceLabels`'. */
export function Bands({
  bands,
  time,
}: {
  bands: ChartBand[] | undefined;
  time?: boolean | undefined;
}) {
  if (!bands?.length) return null;
  return (
    <>
      {bands.map((b, i) => {
        const pos = isAcross(b)
          ? {
              x1: axisValue(b.fromX, Boolean(time)) as string | number,
              x2: axisValue(b.toX, Boolean(time)) as string | number,
            }
          : { y1: b.from ?? 0, y2: b.to ?? 0 };
        return (
          <ReferenceArea
            key={i}
            {...pos}
            fill={chartColor(b.tone ?? "neutral")}
            fillOpacity={0.1}
            stroke="none"
            ifOverflow="extendDomain"
          />
        );
      })}
    </>
  );
}
