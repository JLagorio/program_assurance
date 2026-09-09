import type { ComponentProps } from "react";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { cn } from "../lib/cn";
import { useLedgerLocale } from "../lib/locale";
import { buttonVariants, type ButtonProps } from "./button";

export type PaginationProps = ComponentProps<"nav">;
export function Pagination({ className, ...props }: PaginationProps) {
  const { t } = useLedgerLocale();
  return (
    <nav
      role="navigation"
      aria-label={t("pagination")}
      data-slot="pagination"
      className={cn("mx-auto flex w-full justify-center", className)}
      {...props}
    />
  );
}
export type PaginationContentProps = ComponentProps<"ul">;
export function PaginationContent({ className, ...props }: PaginationContentProps) {
  return (
    <ul
      data-slot="pagination-content"
      className={cn("flex list-none items-center gap-025 p-0", className)}
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
      <span className="hidden sm:block">{text ?? t("previous")}</span>
    </PaginationLink>
  );
}
export type PaginationNextProps = PaginationLinkProps & { text?: string | undefined };
export function PaginationNext({ className, text, ...props }: PaginationNextProps) {
  const { t } = useLedgerLocale();
  return (
    <PaginationLink aria-label={t("nextPage")} className={cn("gap-075", className)} {...props}>
      <span className="hidden sm:block">{text ?? t("next")}</span>
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
