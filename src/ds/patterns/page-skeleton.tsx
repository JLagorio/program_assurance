import { Skeleton } from "../primitives/skeleton";

/* What a screen looks like before its data arrives: the header's title and
   description, a tab strip, then a table's worth of rows. The router shows it
   inside the shell while a loader is pending, so only the page area pulses. */
export function PageSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div aria-busy="true" aria-label="Loading" className="space-y-6">
      <div className="space-y-2.5">
        <Skeleton className="h-5 w-[240px]" />
        <Skeleton className="h-3 w-[440px]" />
      </div>
      <div className="flex gap-5 border-b border-border pb-3">
        <Skeleton className="h-3 w-14" />
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-3 w-16" />
      </div>
      <div className="space-y-4">
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="flex items-center gap-4">
            <Skeleton className="h-3 w-[72px]" />
            <Skeleton className="h-3 flex-1" />
            <Skeleton className="h-3 w-[96px]" />
            <Skeleton className="h-3 w-[64px]" />
          </div>
        ))}
      </div>
    </div>
  );
}
