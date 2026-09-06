import * as Primitive from "@radix-ui/react-collapsible";
import type { ComponentProps } from "react";

import { cn } from "../lib/cn";

/** An independent boolean disclosure. Native props and ref target the root; ancestry never changes state ownership. */
export type CollapsibleProps = ComponentProps<typeof Primitive.Root>;
/** Native button props and ref target the trigger. asChild composes one ref-capable button, such as Button. */
export type CollapsibleTriggerProps = ComponentProps<typeof Primitive.Trigger>;
/** Native props and ref target the content. forceMount preserves child state while closed content remains hidden and unfocusable. */
export type CollapsibleContentProps = ComponentProps<typeof Primitive.Content>;

function CollapsibleRoot(props: CollapsibleProps) {
  return <Primitive.Root data-slot="collapsible" {...props} />;
}

function CollapsibleTrigger({ className, ...props }: CollapsibleTriggerProps) {
  return (
    <Primitive.Trigger
      data-slot="collapsible-trigger"
      className={cn(
        "rounded-small outline-none focus-visible:outline-focused disabled:pointer-events-none disabled:text-disabled",
        className,
      )}
      {...props}
    />
  );
}

function CollapsibleContent({ className, forceMount, ...props }: CollapsibleContentProps) {
  return (
    <Primitive.Content
      data-slot="collapsible-content"
      {...(forceMount ? { forceMount: true } : {})}
      className={cn(
        "overflow-hidden data-[state=open]:animate-collapse-open data-[state=closed]:animate-collapse-close",
        forceMount && "data-[state=closed]:hidden",
        className,
      )}
      {...props}
    />
  );
}

/** One disclosure, with caller-composed trigger and content. Use Accordion for a coordinated set. */
export const Collapsible = Object.assign(CollapsibleRoot, {
  Trigger: CollapsibleTrigger,
  Content: CollapsibleContent,
});
