import { Accordion as AccordionPrimitive } from "@base-ui/react/accordion";
import { ChevronDown } from "lucide-react";

import { cn } from "../lib/cn";
import { headingTag, useHeadingLevel } from "../primitives/heading-level";

export type AccordionProps = AccordionPrimitive.Root.Props;
export type AccordionItemProps = AccordionPrimitive.Item.Props;
export type AccordionTriggerProps = AccordionPrimitive.Trigger.Props;
export type AccordionContentProps = AccordionPrimitive.Panel.Props;

function Accordion({ className, ...props }: AccordionProps) {
  return (
    <AccordionPrimitive.Root
      data-slot="accordion"
      className={cn("flex w-full flex-col", className)}
      {...props}
    />
  );
}

function AccordionItem({ className, ...props }: AccordionItemProps) {
  return (
    <AccordionPrimitive.Item
      data-slot="accordion-item"
      className={cn("not-last:border-b not-last:border-default", className)}
      {...props}
    />
  );
}

/** The item's trigger inside its heading. The heading takes the contextual level, an h3 outside every HeadingLevelProvider; wrap the Accordion in one for another level. Props, the ref and `render` go to the trigger. */
function AccordionTrigger({ className, children, ...props }: AccordionTriggerProps) {
  const Tag = headingTag(useHeadingLevel() ?? 3);
  return (
    <AccordionPrimitive.Header render={<Tag />} className="flex">
      <AccordionPrimitive.Trigger
        data-slot="accordion-trigger"
        className={cn(
          "group/accordion flex w-full min-w-0 items-start gap-100 rounded-small py-100 text-start font-body font-semibold text-default outline-none transition-colors duration-fast ease-standard hover:bg-neutral-subtle-hovered focus-visible:outline-focused data-disabled:pointer-events-none data-disabled:text-disabled",
          className,
        )}
        {...props}
      >
        {children}
        <ChevronDown
          aria-hidden="true"
          data-slot="accordion-trigger-icon"
          className="ms-auto size-icon-small shrink-0 transition-transform duration-fast ease-standard group-aria-expanded/accordion:rotate-180"
        />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  );
}

function AccordionContent({ className, children, ...props }: AccordionContentProps) {
  return (
    <AccordionPrimitive.Panel
      data-slot="accordion-content"
      // Clips only while it folds: once open, Base UI writes the height as `auto` and a focus ring at the edge shows whole.
      className="h-(--accordion-panel-height) overflow-hidden data-open:animate-collapse-open data-closed:animate-collapse-close [&[data-open][style*='--accordion-panel-height:auto']]:overflow-visible [&[data-open][style*='--accordion-panel-height:_auto']]:overflow-visible"
      {...props}
    >
      <div className={cn("pb-200", className)}>{children}</div>
    </AccordionPrimitive.Panel>
  );
}

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };
