import { Slot } from "@radix-ui/react-slot";
import { ChevronRight } from "lucide-react";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

import { cn } from "../lib/cn";

export type BreadcrumbProps = {
  /** Breadcrumb.Item children, from the highest level down to the page. */
  children: ReactNode;
  className?: string | undefined;
};

/** Where you are. Every item but the last is a link back up the record tree; the last is the page itself. One line: a crumb truncates rather than wraps. */
function BreadcrumbRoot({ className, children }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className={cn("min-w-0", className)}>
      <ol className="flex items-center gap-050 font-body-small text-subtle">{children}</ol>
    </nav>
  );
}

export type BreadcrumbItemProps = {
  /** The page itself: not a link, reads in the default colour, and `aria-current="page"`. */
  isCurrent?: boolean | undefined;
  /** The child (a router's Link) takes the item's classes. Without it the item is a button, for a crumb that changes state in place. */
  asChild?: boolean | undefined;
  /** The record's name as its title reads, or the level's name: "Programs", "Atlas payments platform". */
  children: ReactNode;
  className?: string | undefined;
} & Omit<ComponentPropsWithoutRef<"button">, "children" | "className">;

export function BreadcrumbItem({
  isCurrent,
  asChild,
  className,
  children,
  type,
  ...rest
}: BreadcrumbItemProps) {
  const Comp = asChild ? Slot : isCurrent ? "span" : "button";
  return (
    <li className="group/crumb flex min-w-0 items-center gap-050">
      <ChevronRight
        aria-hidden
        className="size-150 shrink-0 icon-subtlest group-first/crumb:hidden"
      />
      <Comp
        aria-current={isCurrent ? "page" : undefined}
        type={asChild || isCurrent ? undefined : (type ?? "button")}
        className={cn(
          "truncate rounded-xsmall outline-none focus-visible:outline-focused",
          isCurrent
            ? "font-medium text-default"
            : "text-subtle transition-colors duration-fast ease-standard hover:text-default",
          className,
        )}
        {...rest}
      >
        {children}
      </Comp>
    </li>
  );
}

export const Breadcrumb = Object.assign(BreadcrumbRoot, { Item: BreadcrumbItem });
