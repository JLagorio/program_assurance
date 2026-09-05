import * as PopoverPrimitive from "@radix-ui/react-popover";
import { useMemo, useRef, useState, type ReactNode } from "react";

import { cn } from "../../lib/cn";
import { toneClasses, type Tone } from "../badge";
import { menuMotion } from "../menu";
import {
  CardHead,
  divergingColor,
  formatNumber,
  sequentialColor,
  type ChartSize,
  type Formatter,
} from "./_shared";

/** One hue for how much, two for above and below, or a function that says which status tone a cell carries, from its value or its place. */
export type HeatmapScale =
  | "sequential"
  | "diverging"
  | ((value: number, row: string, column: string) => Tone);

/** What was chosen on a heatmap: the cell's row, column and value. */
export type HeatmapSelection = { row: string; column: string; value: number };

export type ChartHeatmapProps = {
  /** The row names, top to bottom. */
  rows: string[];
  /** The column names, left to right. */
  columns: string[];
  /** The value at a row and column. `undefined` or `null` leaves the cell empty. */
  value: (row: string, column: string) => number | null | undefined;
  /** `sequential` paints how much in one hue; `diverging` paints above and below `midpoint` in two; a function says which status tone a cell carries, from its value or its row and column, and the cell prints its value. */
  scale?: HeatmapScale | undefined;
  /** The values at the ends of the scale. The data's own when unsaid. */
  domain?: readonly [number, number] | undefined;
  /** The value that reads as nothing on a diverging scale. Zero when unsaid. */
  midpoint?: number | undefined;
  /** Print the value in each cell. On for a status scale, where the tone's fill carries its text; off for a colour scale, where the tooltip and the table carry it, and where a printed value sits on a surface chip. */
  showValues?: boolean | undefined;
  /** The cell's height: `small` 24px, `medium` 32px, `large` 40px. */
  size?: ChartSize | undefined;
  format?: Formatter | undefined;
  /** The grid's accessible name. It is a table. */
  label: string;
  /** What the rows and the columns are: the corner cell, and the description a screen reader hears. */
  rowLabel?: string | undefined;
  columnLabel?: string | undefined;
  /** Draws skeleton cells in place of the values. The Frame does not set it: a grid's shape is its own. */
  loading?: boolean | undefined;
  /** Makes the cells buttons: called when one is clicked or chosen with Enter. */
  onSelect?: ((selection: HeatmapSelection) => void) | undefined;
  /** More about the chosen cell, in a card anchored to it. The card's head (the row, the column and the value) is the kit's. */
  details?: ((selection: HeatmapSelection) => ReactNode) | undefined;
  className?: string | undefined;
};

const cellHeights: Record<ChartSize, string> = { small: "h-300", medium: "h-400", large: "h-500" };

type Paint = { style?: { backgroundColor: string } | undefined; className?: string | undefined };

/** A grid of rows by columns with a value painted in each cell: one hue for how much, two for above and below, or the status tones. A cell that chooses is a button. */
export function ChartHeatmap({
  rows,
  columns,
  value,
  scale = "sequential",
  domain,
  midpoint = 0,
  showValues,
  size = "medium",
  format = formatNumber,
  label,
  rowLabel,
  columnLabel,
  loading,
  onSelect,
  details,
  className,
}: ChartHeatmapProps) {
  const [picked, setPicked] = useState<HeatmapSelection | null>(null);
  const anchor = useRef<HTMLButtonElement | null>(null);
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
  const printed = showValues ?? status;
  const chooses = Boolean(onSelect || details);
  const paint = (v: number, r: string, c: string): Paint => {
    if (typeof scale === "function") return { className: toneClasses[scale(v, r, c)].subtle };
    if (scale === "diverging") {
      const half = Math.max(Math.abs(max - midpoint), Math.abs(min - midpoint)) || 1;
      const t = (v - midpoint) / half;
      const step =
        t <= -0.5
          ? "negative.bold"
          : t < -0.1
            ? "negative"
            : t <= 0.1
              ? "midpoint"
              : t < 0.5
                ? "positive"
                : "positive.bold";
      return { style: { backgroundColor: divergingColor(step) } };
    }
    const t = max === min ? 1 : (v - min) / (max - min);
    const step = (Math.min(4, Math.max(0, Math.floor(t * 5))) + 1) as 1 | 2 | 3 | 4 | 5;
    return { style: { backgroundColor: sequentialColor(step) } };
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
  const head = "h-row-header px-050 pb-050 align-bottom font-body-xsmall font-medium text-subtlest";
  return (
    <div className={cn("overflow-x-auto", className)}>
      <table aria-label={loading ? `${label}, loading` : label} aria-busy={loading || undefined} className="border-collapse">
        <thead>
          <tr>
            {rowLabel ? (
              <th scope="col" className={cn(head, "text-start")}>
                {rowLabel}
                {columnLabel ? <span className="sr-only">{` by ${columnLabel}`}</span> : null}
              </th>
            ) : (
              <td className={head} />
            )}
            {columns.map((c) => (
              <th key={c} scope="col" className={cn(head, "text-center")}>
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, ri) => (
            <tr key={r}>
              <th
                scope="row"
                className="pe-100 text-start font-body-small font-regular whitespace-nowrap text-subtle"
              >
                {r}
              </th>
              {columns.map((c, ci) => {
                const v = values[ri]?.[ci];
                const has = !loading && typeof v === "number";
                const p: Paint = has ? paint(v, r, c) : {};
                const title = has ? `${r}, ${c}: ${format(v)}` : `${r}, ${c}: none`;
                const chosen = picked !== null && picked.row === r && picked.column === c;
                const face = (
                  <span
                    className={cn(
                      "flex h-full w-full items-center justify-center rounded-xsmall font-body-small tabular-nums",
                      p.className,
                      loading ? "animate-pulse bg-skeleton" : !has && "bg-neutral-subtle",
                      picked !== null && !chosen && "opacity-disabled",
                    )}
                    style={p.style}
                    title={loading ? undefined : title}
                  >
                    {has && printed && !status ? (
                      <span className="rounded-xsmall bg-surface px-050 text-default">{format(v)}</span>
                    ) : has && printed ? (
                      format(v)
                    ) : has ? (
                      <span className="sr-only">{format(v)}</span>
                    ) : null}
                  </span>
                );
                return (
                  <td key={c} className={cn("min-w-500 pb-025 pe-025", cellHeights[size])}>
                    {chooses && has ? (
                      <button
                        type="button"
                        aria-pressed={chosen || undefined}
                        className={cn(
                          "block h-full w-full cursor-pointer rounded-xsmall outline-none focus-visible:outline-focused",
                          chosen && "outline-focused",
                        )}
                        onClick={(e) => choose({ row: r, column: c, value: v }, e.currentTarget)}
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
        <PopoverPrimitive.Root
          open
          onOpenChange={(open) => {
            if (!open) close();
          }}
        >
          <PopoverPrimitive.Anchor virtualRef={anchor} />
          <PopoverPrimitive.Portal>
            <PopoverPrimitive.Content
              side="top"
              align="center"
              sideOffset={6}
              collisionPadding={8}
              aria-label={`${label}, details`}
              onCloseAutoFocus={(e) => e.preventDefault()}
              className={cn(
                "z-50 flex flex-col gap-150 rounded-large border border-default bg-surface-overlay p-150 font-body text-default shadow-overlay outline-none",
                menuMotion,
              )}
              style={{ width: 280 }}
            >
              <CardHead
                title={`${picked.row}, ${picked.column}`}
                subtitle={rowLabel && columnLabel ? `${rowLabel} by ${columnLabel}` : undefined}
                value={format(picked.value)}
              />
              {details(picked)}
            </PopoverPrimitive.Content>
          </PopoverPrimitive.Portal>
        </PopoverPrimitive.Root>
      ) : null}
    </div>
  );
}

export type ChartScaleProps = {
  /** Which ramp the key shows. */
  scale: "sequential" | "diverging";
  /** What the low end and the high end read as: "0" and "40 findings"; "−20%" and "+20%". */
  min: string;
  max: string;
  /** The midpoint's word on a diverging scale: "On plan". */
  mid?: string | undefined;
  className?: string | undefined;
};

/** The key for a colour scale: the five steps in a row, the ends named. */
export function ChartScale({ scale, min, max, mid, className }: ChartScaleProps) {
  const steps =
    scale === "diverging"
      ? [
          divergingColor("negative.bold"),
          divergingColor("negative"),
          divergingColor("midpoint"),
          divergingColor("positive"),
          divergingColor("positive.bold"),
        ]
      : ([1, 2, 3, 4, 5] as const).map((s) => sequentialColor(s));
  return (
    <div className={cn("inline-flex flex-col gap-050 self-start", className)}>
      <div className="flex gap-025" aria-hidden>
        {steps.map((c, i) => (
          <span key={i} className="h-100 w-300 rounded-xsmall" style={{ backgroundColor: c }} />
        ))}
      </div>
      <div className="flex justify-between gap-100 font-body-xsmall text-subtlest">
        <span>{min}</span>
        {mid ? <span>{mid}</span> : null}
        <span>{max}</span>
      </div>
    </div>
  );
}
