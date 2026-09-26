import type { ComponentProps } from "react";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { cn } from "../lib/cn";
import { useLedgerLocale } from "../lib/locale";
import { buttonVariants, type ButtonProps } from "./button";

export type PaginationProps = ComponentProps<"nav">;
/* The width at which Previous and Next show their words: Tailwind's `@sm` container size. */
const wordsFit = "24rem";
/** The navigation region. It spans its container, and when it holds Previous and Next it measures
    itself: their words show where the pagination has room, not where the window does. At the end
    of a row, give it the rest of the row (`min-w-0 flex-1 justify-end`). Sized to its content
    (`w-auto`, an `auto` grid column) a pagination with words is 384px whatever its links need, so
    a longer list wraps inside it. */
export function Pagination({ className, style, ...props }: PaginationProps) {
  const { t } = useLedgerLocale();
  return (
    <nav
      role="navigation"
      aria-label={t("pagination")}
      data-slot="pagination"
      className={cn(
        // Only a pagination with words is a container: a pager of icon buttons (the DataTable's)
        // has nothing to measure for. A container does not measure its content, so where it is
        // sized to its content it is the words' threshold wide (contain-intrinsic-inline-size)
        // rather than nothing, whatever its list needs, and min-w-0 lets a row or a grid track
        // narrower than that still shrink it to arrows.
        "mx-auto flex w-full justify-center has-data-[slot=pagination-label]:@container/pagination has-data-[slot=pagination-label]:min-w-0",
        className,
      )}
      // Acts only under the container's size containment, so the icon-only pager ignores it.
      style={{ containIntrinsicInlineSize: wordsFit, ...style }}
      {...props}
    />
  );
}
export type PaginationContentProps = ComponentProps<"ul">;
export function PaginationContent({ className, ...props }: PaginationContentProps) {
  return (
    <ul
      data-slot="pagination-content"
      className={cn("flex list-none flex-wrap items-center justify-center gap-025 p-0", className)}
      {...props}
    />
  );
}
export type PaginationItemProps = ComponentProps<"li">;
export function PaginationItem(props: PaginationItemProps) {
  return <li data-slot="pagination-item" {...props} />;
}
export type PaginationLinkProps = ComponentProps<"a"> &
  Pick<ButtonProps, "size"> & { isActive?: boolean | undefined };
export function PaginationLink({
  className,
  isActive,
  size = "small",
  ...props
}: PaginationLinkProps) {
  // Base UI 1.7 Button imposes role=button and Space activation on rendered anchors.
  // Navigation keeps native link semantics and shares only Button's styling recipe.
  return (
    <a
      aria-current={isActive ? "page" : undefined}
      data-slot="pagination-link"
      data-active={isActive}
      className={buttonVariants({
        variant: isActive ? "secondary" : "subtle",
        size,
        className: cn("min-w-control-small px-075 tabular-nums", className),
      })}
      {...props}
    />
  );
}
export type PaginationPreviousProps = PaginationLinkProps & { text?: string | undefined };
export function PaginationPrevious({ className, text, ...props }: PaginationPreviousProps) {
  const { t } = useLedgerLocale();
  return (
    <PaginationLink aria-label={t("previousPage")} className={cn("gap-075", className)} {...props}>
      <ChevronLeft
        aria-hidden
        data-icon="inline-start"
        className="size-icon-small rtl:rotate-180"
      />
      <span data-slot="pagination-label" className="hidden whitespace-nowrap @sm/pagination:block">
        {text ?? t("previous")}
      </span>
    </PaginationLink>
  );
}
export type PaginationNextProps = PaginationLinkProps & { text?: string | undefined };
export function PaginationNext({ className, text, ...props }: PaginationNextProps) {
  const { t } = useLedgerLocale();
  return (
    <PaginationLink aria-label={t("nextPage")} className={cn("gap-075", className)} {...props}>
      <span data-slot="pagination-label" className="hidden whitespace-nowrap @sm/pagination:block">
        {text ?? t("next")}
      </span>
      <ChevronRight aria-hidden data-icon="inline-end" className="size-icon-small rtl:rotate-180" />
    </PaginationLink>
  );
}
export type PaginationEllipsisProps = ComponentProps<"span">;
export function PaginationEllipsis({ className, ...props }: PaginationEllipsisProps) {
  return (
    <span
      aria-hidden
      data-slot="pagination-ellipsis"
      className={cn("flex size-control-small items-center justify-center text-subtle", className)}
      {...props}
    >
      <MoreHorizontal className="size-icon-small" />
    </span>
  );
}
