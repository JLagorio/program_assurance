import * as Primitive from "@radix-ui/react-accordion";
import { ChevronDown } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";

import { cn } from "../lib/cn";
import { useLedgerLocale } from "../lib/locale";

/** Single mode uses a string; multiple mode uses a string array. Values are stable item IDs, never inferred from labels. */
export type AccordionProps = ComponentProps<typeof Primitive.Root>;
/** A required stable value identifies this item, independently of its label or position. DOM props and ref target the item. */
export type AccordionItemProps = ComponentProps<typeof Primitive.Item>;
/** A semantic h3 by default. Use asChild with an h2–h6 to match the surrounding outline. */
export type AccordionHeaderProps = ComponentProps<typeof Primitive.Header>;
export type AccordionTriggerProps = ComponentProps<typeof Primitive.Trigger> & {
  /** Decorative trailing indicator; null removes it. Keep interactive actions outside the trigger and heading. */
  indicator?: ReactNode;
};
/** DOM props and ref target the content. forceMount retains child state; closed retained content stays hidden and out of the tab order. */
export type AccordionContentProps = ComponentProps<typeof Primitive.Content>;

function AccordionRoot({ dir, ...props }: AccordionProps) {
  const locale = useLedgerLocale();
  return <Primitive.Root data-slot="accordion" dir={dir ?? locale.direction} {...props} />;
}

function AccordionItem(props: AccordionItemProps) {
  return <Primitive.Item data-slot="accordion-item" {...props} />;
}

function AccordionHeader({ className, ...props }: AccordionHeaderProps) {
  return (
    <Primitive.Header data-slot="accordion-header" className={cn("flex", className)} {...props} />
  );
}

function AccordionTrigger({
  className,
  children,
  indicator,
  asChild,
  ...props
}: AccordionTriggerProps) {
  return (
    <Primitive.Trigger
      data-slot="accordion-trigger"
      {...(asChild === undefined ? {} : { asChild })}
      className={cn(
        "group/accordion flex w-full min-w-0 items-start gap-100 rounded-small py-100 text-start font-body font-semibold text-default outline-none focus-visible:outline-focused hover:bg-neutral-subtle-hovered disabled:pointer-events-none disabled:text-disabled",
        className,
      )}
      {...props}
    >
      {asChild ? (
        children
      ) : (
        <>
          {children}
          {indicator === undefined ? (
            <ChevronDown
              aria-hidden="true"
              className="ms-auto size-icon-small shrink-0 transition-transform duration-fast ease-standard group-data-[state=open]/accordion:rotate-180"
            />
          ) : (
            indicator
          )}
        </>
      )}
    </Primitive.Trigger>
  );
}

function AccordionContent({ className, forceMount, ...props }: AccordionContentProps) {
  return (
    <Primitive.Content
      data-slot="accordion-content"
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

/** Coordinated disclosures. The root alone owns selection; compound children may be wrapped or rendered by other components. */
export const Accordion = Object.assign(AccordionRoot, {
  Item: AccordionItem,
  Header: AccordionHeader,
  Trigger: AccordionTrigger,
  Content: AccordionContent,
});
