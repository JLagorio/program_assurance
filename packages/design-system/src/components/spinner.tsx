import { Loader2 } from "lucide-react";

import { cn } from "../lib/cn";

/** Something is in flight. Subtle by default; `small` beside text, `medium` on its own. */
export function Spinner({ size = "small", label = "Loading", className }: { size?: "small" | "medium" | undefined; label?: string | undefined; className?: string | undefined }) {
  return <Loader2 role="status" aria-label={label} className={cn("shrink-0 animate-spin icon-subtle", size === "small" ? "size-150" : "size-200", className)} />;
}
