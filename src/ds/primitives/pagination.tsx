import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

/* Which page of a long table you are on, and the way to the others. The
   range reads on the left ("51–100 of 1,391"); previous, up to seven page
   numbers with gaps, and next sit on the right. Pages are 1-based. */
export function Pagination({
  page,
  pageCount,
  onPageChange,
  total,
  pageSize,
  className,
}: {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  /** With `pageSize`, renders the row range on the left. */
  total?: number;
  pageSize?: number;
  className?: string;
}) {
  const pages = visiblePages(page, pageCount);
  const from = total !== undefined && pageSize ? (page - 1) * pageSize + 1 : null;
  const to = total !== undefined && pageSize ? Math.min(page * pageSize, total) : null;
  const num = (n: number) => n.toLocaleString();

  return (
    <nav
      aria-label="Pagination"
      className={cn(
        "flex flex-wrap items-center gap-3 text-[12px] text-muted-foreground",
        className,
      )}
    >
      {from !== null && to !== null && total !== undefined ? (
        <span className="tnum">
          {total === 0 ? "0 rows" : `${num(from)}–${num(to)} of ${num(total)}`}
        </span>
      ) : null}
      <span className="ml-auto flex items-center gap-0.5">
        <button
          type="button"
          aria-label="Previous page"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className={pageButton}
        >
          <ChevronLeft className="size-3.5" />
        </button>
        {pages.map((p, i) =>
          p === "gap" ? (
            <span key={`gap-${i}`} className="w-6 text-center">
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              aria-current={p === page ? "page" : undefined}
              onClick={() => onPageChange(p)}
              className={cn(
                pageButton,
                "tnum min-w-7 px-1.5",
                p === page && "bg-muted font-medium text-foreground",
              )}
            >
              {num(p)}
            </button>
          ),
        )}
        <button
          type="button"
          aria-label="Next page"
          disabled={page >= pageCount}
          onClick={() => onPageChange(page + 1)}
          className={pageButton}
        >
          <ChevronRight className="size-3.5" />
        </button>
      </span>
    </nav>
  );
}

const pageButton =
  "inline-flex h-7 min-w-7 items-center justify-center rounded-md text-[12px] text-muted-foreground transition-colors hover:bg-surface-hover hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35 disabled:pointer-events-none disabled:opacity-40";

/** First, last, the current page and its neighbours; gaps where pages are skipped. */
function visiblePages(page: number, count: number): (number | "gap")[] {
  if (count <= 7) return Array.from({ length: count }, (_, i) => i + 1);
  const around = new Set([1, count, page - 1, page, page + 1]);
  if (page <= 3) [2, 3, 4].forEach((p) => around.add(p));
  if (page >= count - 2) [count - 3, count - 2, count - 1].forEach((p) => around.add(p));
  const sorted = [...around].filter((p) => p >= 1 && p <= count).sort((a, b) => a - b);
  const out: (number | "gap")[] = [];
  sorted.forEach((p, i) => {
    const prev = sorted[i - 1];
    if (prev !== undefined && p - prev > 1) out.push("gap");
    out.push(p);
  });
  return out;
}
