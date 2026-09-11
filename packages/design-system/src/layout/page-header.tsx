import type { ComponentProps } from "react";
import { cn } from "../lib/cn";

export type PageHeaderProps = ComponentProps<"header">;

/** Page identity and navigation/actions. Record fields and editors belong in the work area or properties, never the header. */
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
    <div className={cn("col-start-2 flex shrink-0 items-center gap-100", className)} {...props} />
  );
}
export const PageHeader = Object.assign(PageHeaderRoot, { Title, Description, Actions });
