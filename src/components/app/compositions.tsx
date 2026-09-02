/**
 * Compositions.
 *
 * Tier two of the library. A primitive (`ui.tsx`) is one element with one
 * job; a shape (`shapes.tsx`) is a whole screen region. A composition sits
 * between: several primitives assembled with a data contract so the same
 * read-out looks the same on every screen. Anything here must already have
 * been built by hand at least twice in `components/app`.
 */

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/* ----------------------------------------------------------------- Tiles */

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
