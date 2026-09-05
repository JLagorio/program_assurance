import { Skeleton } from "../components/skeleton";

/* Reference material. Carbon draws a skeleton per component and says a page loads progressively;
   this is the one page skeleton the router shows before any route's data: the head of an index
   (a title, a line), its tab strip, and a table's worth of rows, in the Skeleton's shapes so the
   real page lands on the same lines. */

export type PageSkeletonProps = {
  /** How many table rows to draw, 8 by default: about a screen. */
  rows?: number | undefined;
};

/** What a screen looks like before its data arrives: a title and a line, a tab strip, then a table's worth of rows. */
export function PageSkeleton({ rows = 8 }: PageSkeletonProps) {
  return (
    <div role="status" aria-busy="true" aria-label="Loading" className="flex flex-col gap-300">
      <div className="flex flex-col gap-150">
        <Skeleton shape="heading" width={240} />
        <Skeleton width={440} />
      </div>
      <div className="flex gap-250 border-b border-default pb-150">
        <Skeleton width={48} />
        <Skeleton width={80} />
        <Skeleton width={64} />
        <Skeleton width={48} />
      </div>
      <div className="flex flex-col gap-200">
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="flex items-center gap-200">
            <Skeleton width={72} />
            <Skeleton className="flex-1" />
            <Skeleton width={96} />
            <Skeleton width={64} />
          </div>
        ))}
      </div>
    </div>
  );
}
