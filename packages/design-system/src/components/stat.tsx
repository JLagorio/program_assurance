import type { ReactNode } from "react";

import { token } from "../generated/tokens";
import { cn } from "../lib/cn";
import { toneClasses, type Tone } from "./badge";

export type StatProps = {
  /** What the number counts, in small subtle text: "Open findings". */
  label: string;
  /** The number, or a short string such as "80%" or "41/80". Zero reads muted. */
  value: ReactNode;
  /** A colour only when the number is a status: overdue in `danger`, verified in `success`. Most numbers stay `neutral`. */
  tone?: Tone | undefined;
};

export type StatTileProps = StatProps & {
  /** One line under the number: what it is out of, the oldest, the next. */
  note?: string | undefined;
};

export type StatGridProps = {
  /** Columns from the small breakpoint up, two below it. Six is three on a small screen. */
  cols?: 2 | 3 | 4 | 5 | 6 | undefined;
  /** `card` frames the row with a border and rounded corners; `band` runs edge to edge between two rules. */
  frame?: "card" | "band" | undefined;
  /** Stat.Tile cells. */
  children: ReactNode;
  className?: string | undefined;
};

const isZero = (value: ReactNode) => value === 0 || value === "0";

/** One cell of a Stat.Grid: label, big tabular number, one-line note. Zero reads muted. */
export function StatTile({ label, value, note, tone = "neutral" }: StatTileProps) {
  return (
    <div className="flex flex-col gap-025 bg-surface px-200 py-150">
      <div className="font-body-small text-subtle">{label}</div>
      <div
        className={cn(
          "font-heading-small font-semibold tabular-nums",
          isZero(value)
            ? "text-subtlest"
            : tone === "neutral"
              ? "text-default"
              : toneClasses[tone].text,
        )}
      >
        {value}
      </div>
      {note ? <div className="font-body-small text-subtle">{note}</div> : null}
    </div>
  );
}

/** Bare number over its label, for an unframed summary row. */
function StatRoot({ label, value, tone = "neutral" }: StatProps) {
  return (
    <div className="flex flex-col gap-050 py-100">
      <div
        className={cn(
          "font-heading-small font-semibold tabular-nums",
          isZero(value)
            ? "text-subtlest"
            : tone === "neutral"
              ? "text-default"
              : toneClasses[tone].text,
        )}
      >
        {value}
      </div>
      <div className="font-body-small text-subtle">{label}</div>
    </div>
  );
}

const gridCols: Record<2 | 3 | 4 | 5 | 6, string> = {
  2: "sm:grid-cols-2",
  3: "sm:grid-cols-3",
  4: "sm:grid-cols-4",
  5: "md:grid-cols-5",
  6: "sm:grid-cols-3 lg:grid-cols-6",
};

/** A row of Stat.Tile cells separated by hairlines. `card` frames it; `band` runs edge to edge between two rules. The gutter is painted with the border token. */
export function StatGrid({ cols = 4, frame = "card", children, className }: StatGridProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-px",
        frame === "card"
          ? "overflow-hidden rounded-large border border-default"
          : "border-y border-default",
        gridCols[cols],
        className,
      )}
      style={{ backgroundColor: token("color.border") }}
    >
      {children}
    </div>
  );
}

/** @deprecated The name is `Stat.Grid`; `ledger/no-deprecated-name` says so. */
export const Tiles = StatGrid;

export const Stat = Object.assign(StatRoot, { Tile: StatTile, Grid: StatGrid });
