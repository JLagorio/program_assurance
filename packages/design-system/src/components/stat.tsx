import type { ComponentProps, ReactNode } from "react";

import { token } from "../generated/tokens";
import { cn } from "../lib/cn";
import { toneClasses, type Tone } from "./badge";

export type StatProps = Omit<ComponentProps<"div">, "children"> & {
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

export type StatGridProps = ComponentProps<"div"> & {
  /** The most columns across, shown when the grid has room. The grid takes its columns from its own width, not the window's: each tile keeps at least 128px, so as the grid narrows six and five fold to three, every count folds to two (in a 320px panel and on a 320px phone), and it is one column below 257px. */
  cols?: 2 | 3 | 4 | 5 | 6 | undefined;
  /** `card` frames the row with a border and rounded corners; `band` runs edge to edge between two rules. */
  frame?: "card" | "band" | undefined;
  /** Stat.Tile cells. */
  children: ReactNode;
};

const isZero = (value: ReactNode) => value === 0 || value === "0";

/** One cell of a Stat.Grid: label, big tabular number, one-line note. Zero reads muted. */
export function StatTile({
  label,
  value,
  note,
  tone = "neutral",
  className,
  ...props
}: StatTileProps) {
  return (
    <div
      {...props}
      className={cn("flex flex-col gap-025 bg-surface px-200 py-150 animate-rise", className)}
    >
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
function StatRoot({ label, value, tone = "neutral", className, ...props }: StatProps) {
  return (
    <div {...props} className={cn("flex flex-col gap-050 py-100", className)}>
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

// stat.css: the columns asked for when they fit, folding in balanced steps by the grid's own width.
const gridCols: Record<2 | 3 | 4 | 5 | 6, string> = {
  2: "stat-grid-2",
  3: "stat-grid-3",
  4: "stat-grid-4",
  5: "stat-grid-5",
  6: "stat-grid-6",
};

/** A row of Stat.Tile cells separated by hairlines. `card` frames it; `band` runs edge to edge between two rules. The gutter is painted with the border token. Its columns follow its own width, so it reads the same in a page, an aside or a panel. A parent that sizes it to its content (an items-start Stack, an Inline, a popover) makes it as wide as all its tiles side by side, up to the room it has: up to `cols` tiles that is one row, but more tiles than `cols` fold into `cols` wider tiles, so give that grid a width. */
export function StatGrid({
  cols = 4,
  frame = "card",
  children,
  className,
  style,
  ...props
}: StatGridProps) {
  return (
    <div
      {...props}
      className={cn(
        "stat-grid stagger-children",
        frame === "card"
          ? "overflow-hidden rounded-large border border-default"
          : "border-y border-default",
        gridCols[cols],
        className,
      )}
      style={{ backgroundColor: token("color.border"), ...style }}
    >
      {children}
    </div>
  );
}

export const Stat = Object.assign(StatRoot, { Tile: StatTile, Grid: StatGrid });
