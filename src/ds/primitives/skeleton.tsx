import { cn } from "@/lib/utils";

/* A placeholder for content that is loading. One bar by default; `lines`
   stacks several with the last one shorter, for a paragraph or a list. Size it
   with className so the layout holds still when the content lands. */
export function Skeleton({ lines, className }: { lines?: number; className?: string }) {
  if (lines && lines > 1)
    return (
      <div aria-hidden className={cn("space-y-2", className)}>
        {Array.from({ length: lines }, (_, i) => (
          <div
            key={i}
            className={cn(
              "h-3 animate-pulse rounded bg-muted",
              i === lines - 1 ? "w-2/3" : "w-full",
            )}
          />
        ))}
      </div>
    );
  return <div aria-hidden className={cn("h-3 w-full animate-pulse rounded bg-muted", className)} />;
}
