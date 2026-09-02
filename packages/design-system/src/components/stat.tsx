import type { ReactNode } from "react";

import { token } from "../generated/tokens";
import { cn } from "../lib/cn";
import { toneClasses, type Tone } from "./badge";

/** One cell of a Tiles grid: label, big tabular number, one-line note. Zero reads muted. */
function Tile({ label, value, note, tone = "neutral" }: { label: string; value: ReactNode; note?: string | undefined; tone?: Tone | undefined }) {
  return (
    <div className="flex flex-col gap-025 bg-surface px-200 py-150">
      <div className="font-body-small text-subtle">{label}</div>
      <div className={cn("font-heading-small font-semibold tabular-nums", value === 0 ? "text-subtlest" : tone === "neutral" ? "text-default" : toneClasses[tone].text)}>{value}</div>
      {note ? <div className="font-body-small text-subtle">{note}</div> : null}
    </div>
  );
}

/** Bare number over its label, for an unframed summary row. */
function StatRoot({ label, value, tone = "neutral" }: { label: string; value: ReactNode; tone?: Tone | undefined }) {
  return (
    <div className="flex flex-col gap-050 py-100">
      <div className={cn("font-heading-small font-semibold tabular-nums", tone === "neutral" ? "text-default" : toneClasses[tone].text)}>{value}</div>
      <div className="font-body-small text-subtle">{label}</div>
    </div>
  );
}

const tileCols: Record<2 | 3 | 4 | 5 | 6, string> = {
  2: "sm:grid-cols-2",
  3: "sm:grid-cols-3",
  4: "sm:grid-cols-4",
  5: "md:grid-cols-5",
  6: "sm:grid-cols-3 lg:grid-cols-6",
};

/** A row of Tile cells separated by hairlines. `card` frames it; `band` runs edge to edge between two rules. The gutter is painted with the border token. */
export function Tiles({ cols = 4, frame = "card", children, className }: { cols?: 2 | 3 | 4 | 5 | 6 | undefined; frame?: "card" | "band" | undefined; children: ReactNode; className?: string | undefined }) {
  return (
    <div
      className={cn("grid grid-cols-2 gap-px", frame === "card" ? "overflow-hidden rounded-large border border-default" : "border-y border-default", tileCols[cols], className)}
      style={{ backgroundColor: token("color.border") }}
    >
      {children}
    </div>
  );
}

export const Stat = Object.assign(StatRoot, { Tile, Grid: Tiles });
