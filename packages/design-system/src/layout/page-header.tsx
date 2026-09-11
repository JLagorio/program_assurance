import type { ComponentProps } from "react";
import { cn } from "../lib/cn";

export type PageHeaderProps = ComponentProps<"header">;

/** Page identity and actions. Breadcrumbs, metadata and workflow controls are composed by the route. */
function PageHeaderRoot({ className, ...props }: PageHeaderProps) {
  return (
    <header className={cn("page-header grid min-w-0 items-start gap-150", className)} {...props} />
  );
}
function Title({ className, ...props }: ComponentProps<"h1">) {
  return (
    <h1
      className={cn("min-w-0 break-words font-heading-small font-semibold text-default", className)}
      {...props}
    />
  );
}
function Description({ className, ...props }: ComponentProps<"p">) {
  return <p className={cn("pt-050 font-body text-subtle", className)} {...props} />;
}
function Actions({ className, ...props }: ComponentProps<"div">) {
  return (
    <div className={cn("flex max-w-full flex-wrap items-center gap-100", className)} {...props} />
  );
}
export const PageHeader = Object.assign(PageHeaderRoot, { Title, Description, Actions });
