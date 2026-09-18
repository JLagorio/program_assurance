import type { ComponentProps } from "react";
import { Skeleton } from "../components/skeleton";
import { cn } from "../lib/cn";
import { useLedgerLocale } from "../lib/locale";

/* A page loads progressively, and a section that loads on its own draws its own Skeleton; this is
   the one page skeleton the router shows before any route's data: the head of an index
   (a title, a line), its tab strip, and a table's worth of rows, in the Skeleton's shapes so the
   real page lands on the same lines. */

export type PageSkeletonProps = ComponentProps<"div"> & {
  /** How many table rows to draw, 8 by default: about a screen. */
  rows?: number | undefined;
};

/** What a screen looks like before its data arrives: a title and a line, a tab strip, then a table's worth of rows. */
export function PageSkeleton({ rows = 8, className, ...props }: PageSkeletonProps) {
  const { t } = useLedgerLocale();
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label={t("loading")}
      {...props}
      data-slot="page-skeleton"
      className={cn("flex flex-col gap-300", className)}
    >
      <div className="flex flex-col gap-150">
        <Skeleton shape="heading" width="min(240px, 60%)" />
        <Skeleton width="min(440px, 100%)" />
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
            <Skeleton width={72} className="shrink" />
            <Skeleton className="flex-1" />
            <Skeleton width={96} className="shrink" />
            <Skeleton width={64} className="shrink" />
          </div>
        ))}
      </div>
    </div>
  );
}
