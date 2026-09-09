import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "../../components/button";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationEllipsis,
} from "../../components/pagination";
import { cn } from "../../lib/cn";
import { useLedgerLocale } from "../../lib/locale";

type TablePaginationProps = {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  total?: number | undefined;
  pageSize?: number | undefined;
  label?: string | undefined;
  className?: string | undefined;
};
/** Table state and row counts belong to the pattern. In-memory paging uses buttons; URL navigation uses PaginationLink. */
export function TablePagination({
  page,
  pageCount,
  onPageChange,
  total,
  pageSize,
  label,
  className,
}: TablePaginationProps) {
  const { t, formatNumber: num } = useLedgerLocale();
  const from = total !== undefined && pageSize ? (page - 1) * pageSize + 1 : null;
  const to = total !== undefined && pageSize ? Math.min(page * pageSize, total) : null;
  return (
    <div
      className={cn("flex flex-wrap items-center gap-150 font-body-small text-subtle", className)}
    >
      {from !== null && to !== null && total !== undefined && (
        <span className="tabular-nums">
          {total === 0
            ? t("zeroRows")
            : t("rowRange", { from: num(from), to: num(to), total: num(total) })}
        </span>
      )}
      <Pagination
        aria-label={label ?? t("pagination")}
        className="ms-auto w-auto"
        style={{ marginInlineEnd: 0 }}
      >
        <PaginationContent>
          <PaginationItem>
            <Button
              size="small"
              variant="subtle"
              className="size-control-small p-0"
              aria-label={t("previousPage")}
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
              iconBefore={<ChevronLeft className="rtl:rotate-180" />}
            />
          </PaginationItem>
          {visiblePages(page, pageCount).map((p, i) => (
            <PaginationItem key={p === "gap" ? `gap-${i}` : p}>
              {p === "gap" ? (
                <PaginationEllipsis />
              ) : (
                <Button
                  size="small"
                  variant={p === page ? "secondary" : "subtle"}
                  className="min-w-control-small px-075 tabular-nums"
                  aria-label={t("pageLabel", { page: num(p) })}
                  aria-current={p === page ? "page" : undefined}
                  onClick={() => onPageChange(p)}
                >
                  {num(p)}
                </Button>
              )}
            </PaginationItem>
          ))}
          <PaginationItem>
            <Button
              size="small"
              variant="subtle"
              className="size-control-small p-0"
              aria-label={t("nextPage")}
              disabled={page >= pageCount}
              onClick={() => onPageChange(page + 1)}
              iconBefore={<ChevronRight className="rtl:rotate-180" />}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
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
