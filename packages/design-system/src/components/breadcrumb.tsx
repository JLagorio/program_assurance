import * as React from "react";
import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { cn } from "../lib/cn";
import { ChevronRightIcon, MoreHorizontalIcon } from "lucide-react";

/** Native navigation props and ref. Compose the ordered list explicitly. */
export type BreadcrumbProps = React.ComponentProps<"nav">;
/** Native list-item props and ref. Compose a link or current page inside the item. */
export type BreadcrumbItemProps = React.ComponentProps<"li">;

/** The navigation landmark; the caller owns the list, items, and separators. */
function Breadcrumb({ className, ...props }: BreadcrumbProps) {
  return (
    <nav aria-label="breadcrumb" data-slot="breadcrumb" className={cn(className)} {...props} />
  );
}

/** The ordered list. Long trails wrap by default. */
function BreadcrumbList({ className, ...props }: React.ComponentProps<"ol">) {
  return (
    <ol
      data-slot="breadcrumb-list"
      className={cn(
        "flex flex-wrap items-center gap-075 font-body-small break-words text-subtle",
        className,
      )}
      {...props}
    />
  );
}

/** A list item containing a link, current page, or composed control. */
function BreadcrumbItem({ className, ...props }: BreadcrumbItemProps) {
  return (
    <li
      data-slot="breadcrumb-item"
      className={cn("inline-flex items-center gap-050", className)}
      {...props}
    />
  );
}

/** An anchor by default. Use Base UI render to compose a router link or custom element. */
function BreadcrumbLink({ className, render, ...props }: useRender.ComponentProps<"a">) {
  return useRender({
    defaultTagName: "a",
    props: mergeProps<"a">(
      {
        className: cn(
          "rounded-xsmall outline-none transition-colors duration-fast ease-standard hover:text-default focus-visible:outline-focused",
          className,
        ),
      },
      props,
    ),
    render,
    state: {
      slot: "breadcrumb-link",
    },
  });
}

/** The current page, announced as a disabled link and omitted from the tab order. */
function BreadcrumbPage({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="breadcrumb-page"
      role="link"
      aria-disabled="true"
      aria-current="page"
      className={cn("font-regular text-default", className)}
      {...props}
    />
  );
}

/** A decorative chevron by default; children replace the separator. */
function BreadcrumbSeparator({ children, className, ...props }: React.ComponentProps<"li">) {
  return (
    <li
      data-slot="breadcrumb-separator"
      role="presentation"
      aria-hidden="true"
      className={cn("[&>svg]:size-icon-small", className)}
      {...props}
    >
      {children ?? <ChevronRightIcon />}
    </li>
  );
}

/** A decorative collapsed-path indicator. Name its surrounding control when interactive. */
function BreadcrumbEllipsis({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="breadcrumb-ellipsis"
      role="presentation"
      aria-hidden="true"
      className={cn(
        "flex size-250 items-center justify-center [&>svg]:size-icon-medium",
        className,
      )}
      {...props}
    >
      <MoreHorizontalIcon />
      <span className="sr-only">More</span>
    </span>
  );
}

export {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
};
