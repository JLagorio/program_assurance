import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

/** Something is in flight. Muted by default; size-3 inline beside text, size-4 on its own. */
export function Spinner({
  size = "sm",
  label = "Loading",
  className,
}: {
  size?: "sm" | "md";
  label?: string;
  className?: string;
}) {
  return (
    <Loader2
      role="status"
      aria-label={label}
      className={cn(
        "shrink-0 animate-spin text-muted-foreground",
        size === "sm" ? "size-3" : "size-4",
        className,
      )}
    />
  );
}
