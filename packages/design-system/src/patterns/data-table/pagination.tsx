import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ComponentPropsWithRef } from "react";
import { Button, IconButton } from "../../components/button";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationEllipsis,
} from "../../components/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/select";
import { cn } from "../../lib/cn";
import { useLedgerLocale } from "../../lib/locale";

/** The native props of the pager's `div`, which draws its own content. */
export type TablePaginationProps = Omit<ComponentPropsWithRef<"div">, "children"> & {
  /** The page shown, from 1. */
  page: number;
  /** How many pages there are; at least 1. */
  pageCount: number;
  /** Called with the page the reader asks for. The caller owns the page and says it back through `page`. */
  onPageChange: (page: number) => void;
  /** Every row across the pages. With `pageSize` it draws the range: "21–40 of 1,391", or "No rows". */
  total?: number | undefined;
  /** Rows per page: the range reads it, and so does Rows per page. */
  pageSize?: number | undefined;
  /** The sizes the reader can choose from; the choice shows when there is more than one and `onPageSizeChange` is given. */
  pageSizes?: number[] | undefined;
  /** Called with the size the reader chooses under Rows per page. */
  onPageSizeChange?: ((size: number) => void) | undefined;
  /** The navigation's name, after the table: "Findings pagination". "Pagination" unsaid. */
  label?: string | undefined;
  className?: string | undefined;
};
/**
 * The pager under a table that pages in memory: the row range, then Rows per page, then the pages
 * as buttons at the end. The caller owns the page, the size and the counts; DataTable draws one
 * when it pages. At the first or last page the arrow stays focusable with `aria-disabled`. For a
 * pager of URLs, compose Pagination with PaginationLink instead. The `div`'s native props,
 * `className` and `ref` reach its root.
 */
export function TablePagination({
  page,
  pageCount,
  onPageChange,
  total,
  pageSize,
  pageSizes,
  onPageSizeChange,
  label,
  className,
  ...props
}: TablePaginationProps) {
  const { t, formatNumber: num } = useLedgerLocale();
  const from = total !== undefined && pageSize ? (page - 1) * pageSize + 1 : null;
  const to = total !== undefined && pageSize ? Math.min(page * pageSize, total) : null;
  return (
    <div
      {...props}
      className={cn("flex flex-wrap items-center gap-150 font-body-small text-subtle", className)}
      data-slot="table-pagination"
    >
      {from !== null && to !== null && total !== undefined && (
        <span className="tabular-nums">
          {total === 0
            ? t("zeroRows")
            : from > total
              ? t("rowRangePastEnd", { total: num(total) })
              : t("rowRange", { from: num(from), to: num(to), total: num(total) })}
        </span>
      )}
      {pageSizes && pageSizes.length > 1 && onPageSizeChange && pageSize !== undefined ? (
        <Select<number>
          value={pageSize}
          onValueChange={(value) => {
            if (typeof value === "number") onPageSizeChange(value);
          }}
          items={pageSizes.map((size) => ({
            value: size,
            label: t("perPage", { count: num(size) }),
          }))}
        >
          <SelectTrigger size="small" aria-label={t("rowsPerPage")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent alignItemWithTrigger={false} aria-label={t("rowsPerPage")}>
            {pageSizes.map((size) => (
              <SelectItem key={size} value={size} label={t("perPage", { count: num(size) })}>
                {t("perPage", { count: num(size) })}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : null}
      <Pagination
        aria-label={label ?? t("pagination")}
        className="ms-auto w-auto"
        style={{ marginInlineEnd: 0 }}
      >
        <PaginationContent>
          <PaginationItem>
            {/* At the first or last page the arrow stays focusable (aria-disabled), so a reader
                who pressed Next to the end keeps their place instead of falling to the page. */}
            <IconButton
              variant="subtle"
              label={t("previousPage")}
              isTooltipDisabled
              disabled={page <= 1}
              focusableWhenDisabled
              onClick={() => onPageChange(page - 1)}
              icon={<ChevronLeft className="rtl:rotate-180" />}
            />
          </PaginationItem>
          {visiblePages(page, pageCount).map((p, i) => (
            <PaginationItem key={p === "gap" ? `gap-${i}` : p}>
              {p === "gap" ? (
                <PaginationEllipsis />
              ) : (
                // Every page is subtle; PaginationItem marks the one with aria-current="page" (a
                // semibold figure over the selected bar), not a raised fill.
                <Button
                  size="small"
                  variant="subtle"
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
            <IconButton
              variant="subtle"
              label={t("nextPage")}
              isTooltipDisabled
              disabled={page >= pageCount}
              focusableWhenDisabled
              onClick={() => onPageChange(page + 1)}
              icon={<ChevronRight className="rtl:rotate-180" />}
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
