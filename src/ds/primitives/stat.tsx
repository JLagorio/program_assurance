import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import { toneClasses } from "./tone";
import type { Tone } from "./tone";

/** One cell of a `Tiles` grid: label, big tabular number, one-line note. Zero reads muted. */
function Tile({
  label,
  value,
  note,
  tone = "neutral",
}: {
  label: string;
  value: ReactNode;
  note?: string;
  tone?: Tone;
}) {
  return (
    <div className="bg-background px-4 py-3">
      <div className="text-[12px] text-muted-foreground">{label}</div>
      <div
        className={cn(
          "tnum mt-0.5 text-[20px] font-semibold tracking-[-0.02em]",
          value === 0 ? "text-muted-foreground" : tone === "neutral" ? "" : toneClasses[tone].text,
        )}
      >
        {value}
      </div>
      {note ? (
        <div className="mt-0.5 text-[12px] leading-snug text-muted-foreground">{note}</div>
      ) : null}
    </div>
  );
}

/** Bare number over its label, for an unframed summary row. */
function StatRoot({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: ReactNode;
  tone?: Tone;
}) {
  return (
    <div className="border-b border-border-subtle py-2 last:border-0 md:border-0">
      <div
        className={cn(
          "tnum text-20 font-semibold leading-none",
          tone === "neutral" ? "text-foreground" : toneClasses[tone].text,
        )}
      >
        {value}
      </div>
      <div className="mt-1 text-12 text-muted-foreground">{label}</div>
    </div>
  );
}

export const Stat = Object.assign(StatRoot, { Tile, Grid: Tiles });

const tileCols: Record<2 | 3 | 4 | 5 | 6, string> = {
  2: "sm:grid-cols-2",
  3: "sm:grid-cols-3",
  4: "sm:grid-cols-4",
  5: "md:grid-cols-5",
  6: "sm:grid-cols-3 lg:grid-cols-6",
};

/**
 * A row of `Tile` cells separated by hairlines. `card` frames it as a rounded
 * card (ingestion, baseline summaries); `band` runs it edge to edge between
 * two rules (phase readiness).
 */
export function Tiles({
  cols = 4,
  frame = "card",
  children,
  className,
}: {
  cols?: 2 | 3 | 4 | 5 | 6;
  frame?: "card" | "band";
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-px bg-border",
        frame === "card"
          ? "overflow-hidden rounded-lg border border-border"
          : "border-y border-border",
        tileCols[cols],
        className,
      )}
    >
      {children}
    </div>
  );
}
