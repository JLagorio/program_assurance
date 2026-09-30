import type { ComponentProps } from "react";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { token } from "../generated/tokens";
import { cn } from "../lib/cn";
import { useLedgerLocale } from "../lib/locale";
import { buttonVariants, type ButtonProps } from "./button";

export type PaginationProps = ComponentProps<"nav">;
/* The width at which Previous and Next show their words: the `@sm` container size,
   `dimension.container.sm`. */
const wordsFit = token("dimension.container.sm");
/** The navigation region. It spans its container, and when it holds Previous and Next it measures
    itself: their words show where the pagination has room, not where the window does. At the end
    of a row, give it the rest of the row (`min-w-0 flex-1 justify-end`). Sized to its content
    (`w-auto`, an `auto` grid column) a pagination with words is 384px whatever its links need, so
    a longer list wraps inside it. */
export function Pagination({ className, style, ...props }: PaginationProps) {
  const { t } = useLedgerLocale();
  return (
    <nav
      aria-label={t("pagination")}
      {...props}
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
    />
  );
}
export type PaginationContentProps = ComponentProps<"ul">;
export function PaginationContent({ className, ...props }: PaginationContentProps) {
  return (
    <ul
      {...props}
      data-slot="pagination-content"
      className={cn("flex list-none flex-wrap items-center justify-center gap-025 p-0", className)}
    />
  );
}
export type PaginationItemProps = ComponentProps<"li">;
/* The current page is marked by its own state, `aria-current="page"`, whether it is a link or a
   button in the item: a semibold label in the default text colour over a 2px bar in the selected
   colour, drawn on ::after so it never changes the item's size. The bar is the cue that does not
   depend on a fill, 3:1 on every surface in both modes; forced colours paint the item as
   Highlight (forced-colors.css). */
const currentPage =
  "*:aria-[current=page]:relative *:aria-[current=page]:font-semibold *:aria-[current=page]:text-default *:aria-[current=page]:after:pointer-events-none *:aria-[current=page]:after:absolute *:aria-[current=page]:after:inset-x-075 *:aria-[current=page]:after:bottom-0 *:aria-[current=page]:after:h-025 *:aria-[current=page]:after:rounded-full *:aria-[current=page]:after:bg-selected-bold";
export function PaginationItem({ className, ...props }: PaginationItemProps) {
  return <li {...props} data-slot="pagination-item" className={cn(currentPage, className)} />;
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
  // Navigation keeps native link semantics and shares only Button's styling recipe. The current
  // page takes its mark from PaginationItem, keyed on aria-current, not from a raised fill.
  return (
    <a
      aria-current={isActive ? "page" : undefined}
      {...props}
      data-slot="pagination-link"
      data-active={isActive}
      className={buttonVariants({
        variant: "subtle",
        size,
        className: cn("min-w-control-small px-075 tabular-nums", className),
      })}
    />
  );
}
export type PaginationPreviousProps = PaginationLinkProps & {
  /** The visible word in place of "Previous", such as "Older". It also names the link. */
  text?: string | undefined;
};
export function PaginationPrevious({ className, text, ...props }: PaginationPreviousProps) {
  const { t } = useLedgerLocale();
  // A caller's word names the link too, so what a reader sees is what a speech user says.
  return (
    <PaginationLink
      aria-label={text ?? t("previousPage")}
      className={cn("gap-075", className)}
      {...props}
    >
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
export type PaginationNextProps = PaginationLinkProps & {
  /** The visible word in place of "Next", such as "Newer". It also names the link. */
  text?: string | undefined;
};
export function PaginationNext({ className, text, ...props }: PaginationNextProps) {
  const { t } = useLedgerLocale();
  return (
    <PaginationLink
      aria-label={text ?? t("nextPage")}
      className={cn("gap-075", className)}
      {...props}
    >
      <span data-slot="pagination-label" className="hidden whitespace-nowrap @sm/pagination:block">
        {text ?? t("next")}
      </span>
      <ChevronRight aria-hidden data-icon="inline-end" className="size-icon-small rtl:rotate-180" />
    </PaginationLink>
  );
}
export type PaginationEllipsisProps = ComponentProps<"span">;
/** The pages skipped between two links: an ellipsis a screen reader reads as "More pages". */
export function PaginationEllipsis({ className, ...props }: PaginationEllipsisProps) {
  const { t } = useLedgerLocale();
  return (
    <span
      {...props}
      data-slot="pagination-ellipsis"
      className={cn("flex size-control-small items-center justify-center text-subtle", className)}
    >
      <MoreHorizontal aria-hidden className="size-icon-small" />
      <span className="sr-only">{t("morePages")}</span>
    </span>
  );
}
