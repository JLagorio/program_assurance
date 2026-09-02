import { cn } from "../lib/cn";

/** A hairline between siblings. Horizontal spans its container; vertical stretches to the height of the flex row it sits in. */
export function Separator({ orientation = "horizontal", className }: { orientation?: "horizontal" | "vertical" | undefined; className?: string | undefined }) {
  return (
    <div
      role="separator"
      aria-orientation={orientation}
      className={cn("shrink-0 border-default", orientation === "vertical" ? "w-0 self-stretch border-s" : "h-0 w-full border-t", className)}
    />
  );
}
