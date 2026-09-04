import { Skeleton } from "../components/skeleton";

/** What a screen looks like before its data arrives: a title and a line, a tab strip, then a table's worth of rows. */
export function PageSkeleton({ rows = 8 }: { rows?: number | undefined }) {
  return (
    <div role="status" aria-busy="true" aria-label="Loading" className="flex flex-col gap-300">
      <div className="flex flex-col gap-150">
        <Skeleton className="h-250" style={{ width: 240 }} />
        <Skeleton style={{ width: 440 }} />
      </div>
      <div className="flex gap-250 border-b border-default pb-150">
        <Skeleton className="w-600" />
        <Skeleton className="w-1000" />
        <Skeleton className="w-800" />
        <Skeleton className="w-600" />
      </div>
      <div className="flex flex-col gap-200">
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="flex items-center gap-200">
            <Skeleton style={{ width: 72 }} />
            <Skeleton className="flex-1" />
            <Skeleton style={{ width: 96 }} />
            <Skeleton style={{ width: 64 }} />
          </div>
        ))}
      </div>
    </div>
  );
}
