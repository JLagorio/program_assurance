import { Accordion as AccordionPrimitive } from "@base-ui/react/accordion";
import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";

import { classes } from "../lib/base-ui";
import { headingTag, useHeadingLevel } from "../primitives/heading-level";

export type AccordionProps = AccordionPrimitive.Root.Props;
export type AccordionItemProps = AccordionPrimitive.Item.Props;
export type AccordionTriggerProps = AccordionPrimitive.Trigger.Props & {
  /** Props for the heading around the trigger: a `className`, native attributes, a ref, or `render` for another element in place of the contextual level. */
  headerProps?: AccordionPrimitive.Header.Props | undefined;
  /** The mark at the end of the row, in place of the chevron that turns while the item is open; `null` for none. A custom mark shows the state itself, from the trigger's `aria-expanded` (`group-aria-expanded/accordion:`). */
  icon?: ReactNode | undefined;
};
export type AccordionContentProps = AccordionPrimitive.Panel.Props;

function Accordion({ className, ...props }: AccordionProps) {
  return (
    <AccordionPrimitive.Root
      data-slot="accordion"
      {...props}
      className={classes("flex w-full flex-col", className)}
    />
  );
}

function AccordionItem({ className, ...props }: AccordionItemProps) {
  return (
    <AccordionPrimitive.Item
      data-slot="accordion-item"
      {...props}
      className={classes("not-last:border-b not-last:border-default", className)}
    />
  );
}

/* The row tint is a ::before that reaches `space.100` before the title, so a title flush with the
   rows under it tints as a row does without moving, and the mark sits `space.100` inside the end.
   It reaches past the start only, where nothing can scroll to it, so a trigger flush with a
   scroller's end never scrolls it sideways. The title and the mark paint above it. */
const trigger =
  "group/accordion relative flex w-full min-w-0 items-start gap-100 rounded-small py-100 pe-100 text-start font-body font-semibold text-default outline-none before:absolute before:-start-100 before:end-0 before:inset-y-0 before:rounded-small before:transition-colors before:duration-fast before:ease-standard hover:before:bg-neutral-subtle-hovered focus-visible:outline-focused data-disabled:pointer-events-none data-disabled:text-disabled motion-reduce:before:transition-none";

/** The item's trigger inside its heading. The heading takes the contextual level, an h3 outside every HeadingLevelProvider; wrap the Accordion in one for another level, or pass `headerProps.render`. Props, the ref and `render` go to the trigger; `headerProps` to the heading; `icon` replaces the chevron. */
function AccordionTrigger({
  className,
  children,
  headerProps,
  icon,
  ...props
}: AccordionTriggerProps) {
  const Tag = headingTag(useHeadingLevel() ?? 3);
  const { className: headerClassName, ...header } = headerProps ?? {};
  return (
    <AccordionPrimitive.Header
      render={<Tag />}
      data-slot="accordion-header"
      {...header}
      className={classes("flex", headerClassName)}
    >
      <AccordionPrimitive.Trigger
        data-slot="accordion-trigger"
        {...props}
        className={classes(trigger, className)}
      >
        <span data-slot="accordion-trigger-title" className="relative min-w-0 break-words">
          {children}
        </span>
        {icon === undefined ? (
          <ChevronDown
            aria-hidden="true"
            data-slot="accordion-trigger-icon"
            className="relative ms-auto size-icon-small shrink-0 transition-transform duration-fast ease-standard group-aria-expanded/accordion:rotate-180 motion-reduce:transition-none"
          />
        ) : icon === null ? null : (
          <span
            aria-hidden="true"
            data-slot="accordion-trigger-icon"
            className="relative ms-auto flex shrink-0 items-center"
          >
            {icon}
          </span>
        )}
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  );
}

/** The item's content. `className` reaches the panel, which carries `data-open` and the measured `--accordion-panel-height`; the content sits in a padded box inside it. The panel clips only while it folds: settled open, a focus ring at its edge shows whole. */
function AccordionContent({ className, children, ...props }: AccordionContentProps) {
  return (
    <AccordionPrimitive.Panel
      data-slot="accordion-content"
      {...props}
      // Folds on its own measured height (motion.css), not an ancestor disclosure's.
      data-collapse-panel="accordion"
      className={classes(
        "h-(--accordion-panel-height) overflow-hidden data-open:animate-collapse-open data-closed:animate-collapse-close [&[data-open][style*='--accordion-panel-height:auto']]:overflow-visible [&[data-open][style*='--accordion-panel-height:_auto']]:overflow-visible",
        className,
      )}
    >
      <div className="pb-200">{children}</div>
    </AccordionPrimitive.Panel>
  );
}

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };
