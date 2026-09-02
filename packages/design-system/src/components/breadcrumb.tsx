import { Slot } from "@radix-ui/react-slot";
import { ChevronRight } from "lucide-react";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

import { cn } from "../lib/cn";

/** Where you are. Every item but the last is a link back up the record tree; the last is the page itself. */
function BreadcrumbRoot({ className, children }: { className?: string | undefined; children: ReactNode }) {
  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className="flex flex-wrap items-center gap-050 font-body-small text-subtle">{children}</ol>
    </nav>
  );
}

export type BreadcrumbItemProps = {
  /** The page itself: not a link, reads in the default colour. */
  isCurrent?: boolean | undefined;
  /** The child (a router's Link) takes the item's classes. */
  asChild?: boolean | undefined;
  children: ReactNode;
  className?: string | undefined;
} & Omit<ComponentPropsWithoutRef<"button">, "children" | "className">;

function BreadcrumbItem({ isCurrent, asChild, className, children, type, ...rest }: BreadcrumbItemProps) {
  const Comp = asChild ? Slot : isCurrent ? "span" : "button";
  return (
    <li className="group/crumb flex min-w-0 items-center gap-050">
      <ChevronRight aria-hidden className="size-150 shrink-0 icon-subtlest group-first/crumb:hidden" />
      <Comp
        aria-current={isCurrent ? "page" : undefined}
        type={asChild || isCurrent ? undefined : (type ?? "button")}
        className={cn("truncate rounded-xsmall outline-none focus-visible:outline-focused", isCurrent ? "font-medium text-default" : "text-subtle transition-colors duration-fast ease-standard hover:text-default", className)}
        {...rest}
      >
        {children}
      </Comp>
    </li>
  );
}

export const Breadcrumb = Object.assign(BreadcrumbRoot, { Item: BreadcrumbItem });
