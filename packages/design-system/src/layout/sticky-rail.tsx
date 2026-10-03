import type { ComponentProps } from "react";

import { cn } from "../lib/cn";

export type StickyRailProps = ComponentProps<"div"> & {
  /** The breakpoint it sticks from. `lg` for a rail the page's Grid puts beside the content from the large breakpoint (`templateColumns={{ lg: … }}`) and stacks above it below, where it stays in the flow. Without it the rail always sticks. */
  from?: "lg" | undefined;
};

/**
 * A column of a page's grid that stays in view under the shell's header while the page scrolls,
 * at most the window's height under it: a wizard's steps beside its form. It stops `space.300`
 * under the banner and the top nav (the shell's `--shell-top`); in a scroller of its own, a dialog's
 * body or a panel, under the top the scroller gives it (`--rail-top`, `--rail-max-height`). It
 * renders one `div`, forwards its native props and its ref, and shrinks in its track (`min-w-0`).
 * A record's Details are the Shell's Aside, not a sticky rail.
 */
export function StickyRail({ from, className, ...props }: StickyRailProps) {
  return (
    <div {...props} data-slot="sticky-rail" data-from={from} className={cn("min-w-0", className)} />
  );
}
