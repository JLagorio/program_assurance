import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "../lib/cn";

const pageButton =
  "inline-flex h-control-small items-center justify-center rounded-medium font-body-small text-subtle outline-none transition-colors duration-fast ease-standard hover:bg-neutral-subtle-hovered hover:text-default focus-visible:outline-focused disabled:pointer-events-none disabled:text-disabled";

export type PaginationProps = {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  /** With `pageSize`, renders the row range on the left. */
  total?: number | undefined;
  pageSize?: number | undefined;
  className?: string | undefined;
};

/** Which page of a long table you are on, and the way to the others. Pages are 1-based. */
export function Pagination({ page, pageCount, onPageChange, total, pageSize, className }: PaginationProps) {
  const pages = visiblePages(page, pageCount);
  const from = total !== undefined && pageSize ? (page - 1) * pageSize + 1 : null;
  const to = total !== undefined && pageSize ? Math.min(page * pageSize, total) : null;
  const num = (n: number) => n.toLocaleString();
  return (
    <nav aria-label="Pagination" className={cn("flex flex-wrap items-center gap-150 font-body-small text-subtle", className)}>
      {from !== null && to !== null && total !== undefined ? <span className="tabular-nums">{total === 0 ? "0 rows" : `${num(from)}–${num(to)} of ${num(total)}`}</span> : null}
      <span className="ms-auto flex items-center gap-025">
        <button type="button" aria-label="Previous page" disabled={page <= 1} onClick={() => onPageChange(page - 1)} className={cn(pageButton, "size-control-small")}>
          <ChevronLeft className="size-icon-small" />
        </button>
        {pages.map((p, i) =>
          p === "gap" ? (
            <span key={`gap-${i}`} className="w-300 text-center">
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              aria-current={p === page ? "page" : undefined}
              onClick={() => onPageChange(p)}
              className={cn(pageButton, "min-w-control-small px-075 tabular-nums", p === page && "bg-neutral font-medium text-default")}
            >
              {num(p)}
            </button>
          ),
        )}
        <button type="button" aria-label="Next page" disabled={page >= pageCount} onClick={() => onPageChange(page + 1)} className={cn(pageButton, "size-control-small")}>
          <ChevronRight className="size-icon-small" />
        </button>
      </span>
    </nav>
  );
}

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
