import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import type { ComponentProps } from "react";
import { cn } from "../lib/cn";

export type PageHeaderProps = ComponentProps<"header">;
export type PageHeaderLeadProps = useRender.ComponentProps<"div">;
export type PageHeaderHeadingProps = ComponentProps<"div">;
export type PageHeaderTitleProps = ComponentProps<"h1">;
export type PageHeaderDescriptionProps = ComponentProps<"p">;
export type PageHeaderActionsProps = ComponentProps<"div">;

/** Page identity and navigation/actions: two columns, what names the page on the left and its actions on the right. Lead spans both; Heading holds the Title and what sits under it. Record fields and editors belong in the work area or properties, never the header. */
function PageHeaderRoot({ className, ...props }: PageHeaderProps) {
  return (
    <header
      {...props}
      data-slot="page-header"
      className={cn("page-header grid min-w-0 items-start gap-150", className)}
    />
  );
}
/** A line above the title across both columns: a breadcrumb (`render={<Breadcrumb />}`) or a category. */
export function Lead({ render, ref, className, ...props }: PageHeaderLeadProps) {
  return useRender({
    defaultTagName: "div",
    render,
    ref,
    state: { slot: "page-header-lead" },
    props: mergeProps<"div">(props, {
      ...{ "data-slot": "page-header-lead" },
      className: cn("col-span-full min-w-0", className),
    }),
  });
}
/** The first column: the Title, then a Description or a line of facts. */
export function Heading({ className, ...props }: PageHeaderHeadingProps) {
  return <div {...props} data-slot="page-header-heading" className={cn("min-w-0", className)} />;
}
export function Title({ className, ...props }: PageHeaderTitleProps) {
  return (
    <h1
      {...props}
      data-slot="page-header-title"
      className={cn("min-w-0 break-words font-heading-small font-semibold text-default", className)}
    />
  );
}
export function Description({ className, ...props }: PageHeaderDescriptionProps) {
  return (
    <p
      {...props}
      data-slot="page-header-description"
      className={cn("pt-050 font-body text-subtle", className)}
    />
  );
}
/** The second column: one primary action or an Actions menu, beside the title at every width. */
export function Actions({ className, ...props }: PageHeaderActionsProps) {
  return (
    <div
      {...props}
      data-slot="page-header-actions"
      className={cn("col-start-2 flex shrink-0 items-center gap-100", className)}
    />
  );
}
export const PageHeader = Object.assign(PageHeaderRoot, {
  Lead,
  Heading,
  Title,
  Description,
  Actions,
});
