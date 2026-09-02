import { cn } from "@/lib/utils";

/* A hairline between siblings. Horizontal spans its container; vertical
   stretches to the height of the flex row it sits in. */
export function Separator({
  orientation = "horizontal",
  className,
}: {
  orientation?: "horizontal" | "vertical";
  className?: string;
}) {
  return (
    <div
      role="separator"
      aria-orientation={orientation}
      className={cn(
        "shrink-0 bg-border",
        orientation === "vertical" ? "w-px self-stretch" : "h-px w-full",
        className,
      )}
    />
  );
}
