import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import type { ComponentProps } from "react";
import { cn } from "../lib/cn";
import { Heading } from "../primitives/heading";
import { headingTag, useHeadingLevel } from "../primitives/heading-level";

/** Native header props and ref; `render` sets the element. A `div` by default: the page's own header is not a banner landmark, and inside a dialog or a sheet a `header` would become one. */
export type PageHeaderProps = useRender.ComponentProps<"header">;
export type PageHeaderLeadProps = useRender.ComponentProps<"div">;
export type PageHeaderHeadingProps = ComponentProps<"div">;
export type PageHeaderTitleProps = useRender.ComponentProps<"h1">;
export type PageHeaderDescriptionProps = ComponentProps<"p">;
export type PageHeaderActionsProps = ComponentProps<"div">;

/** Page identity and navigation/actions: what names the page, then its actions at the end of the row; when the row cannot give the title its measure beside them, they take the next row. Lead spans the header; Heading holds the Title and what sits under it. Record fields and editors belong in the work area or properties, never the header. A `div`, never a landmark: the page's landmarks are the shell's; `render={<header />}` where a page wants the element. */
function PageHeaderRoot({ render, ref, className, ...props }: PageHeaderProps) {
  return useRender({
    defaultTagName: "div",
    render,
    ref,
    state: { slot: "page-header" },
    props: mergeProps<"header">(props, {
      ...{ "data-slot": "page-header" },
      className: cn("page-header flex min-w-0 flex-wrap items-start gap-150", className),
    }),
  });
}
/** A line above the title across both columns: a breadcrumb (`render={<Breadcrumb />}`) or a category. */
export function PageHeaderLead({ render, ref, className, ...props }: PageHeaderLeadProps) {
  return useRender({
    defaultTagName: "div",
    render,
    ref,
    state: { slot: "page-header-lead" },
    props: mergeProps<"div">(props, {
      ...{ "data-slot": "page-header-lead" },
      className: cn("min-w-0", className),
    }),
  });
}
/** The first column: the Title, then a Description or a line of facts. */
export function PageHeaderHeading({ className, ...props }: PageHeaderHeadingProps) {
  return <div {...props} data-slot="page-header-heading" className={cn("min-w-0", className)} />;
}
/** What names the page or the record: a Heading at `page`, 20/26 semibold, an h1 on a page. Inside a HeadingLevelProvider (a preview's body starts at 2) it takes that level, and `render` sets another element outright: `render={<h2 />}`, or a dialog's title part, which keeps the `page` size. */
export function PageHeaderTitle({ render, ref, className, ...props }: PageHeaderTitleProps) {
  const level = useHeadingLevel();
  return useRender({
    render: render ?? <Heading size="page" as={headingTag(level ?? 1)} />,
    ref,
    state: { slot: "page-header-title" },
    props: mergeProps<"h1">(props, {
      ...{ "data-slot": "page-header-title" },
      // The size's class rides along, so a title rendered as another part keeps it.
      className: cn("min-w-0 break-words font-heading-page text-default", className),
    }),
  });
}
export function PageHeaderDescription({ className, ...props }: PageHeaderDescriptionProps) {
  return (
    <p
      {...props}
      data-slot="page-header-description"
      className={cn("break-words pt-050 font-body text-subtle", className)}
    />
  );
}
/** One primary action or an Actions menu, at the end of the title's row. When the row cannot give the title its measure beside them, they take the next row, right-aligned. */
export function PageHeaderActions({ className, ...props }: PageHeaderActionsProps) {
  return (
    <div
      {...props}
      data-slot="page-header-actions"
      className={cn("flex shrink-0 flex-wrap items-center justify-end gap-100", className)}
    />
  );
}
/** Page identity and its actions, with the parts as members and, for docs and imports, by name. */
export const PageHeader = Object.assign(PageHeaderRoot, {
  Lead: PageHeaderLead,
  Heading: PageHeaderHeading,
  Title: PageHeaderTitle,
  Description: PageHeaderDescription,
  Actions: PageHeaderActions,
});
