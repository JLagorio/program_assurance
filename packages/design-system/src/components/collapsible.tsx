import { Collapsible as Primitive } from "@base-ui/react/collapsible";
import { ChevronDown } from "lucide-react";
import { classes } from "../lib/base-ui";
import { headingTag, useHeadingLevel } from "../primitives/heading-level";

export type CollapsibleProps = Primitive.Root.Props;
export type CollapsibleTriggerProps = Primitive.Trigger.Props;
export type CollapsibleContentProps = Primitive.Panel.Props;
/** The trigger's props: native button props, the ref, `render` and Base UI's state classes. The children are the title. */
export type CollapsibleHeaderProps = Primitive.Trigger.Props;
export function Collapsible(props: CollapsibleProps) {
  return <Primitive.Root data-slot="collapsible" {...props} />;
}
export function CollapsibleTrigger({ className, ...props }: CollapsibleTriggerProps) {
  return (
    <Primitive.Trigger
      data-slot="collapsible-trigger"
      {...props}
      className={classes(
        "rounded-small outline-none focus-visible:outline-focused data-disabled:pointer-events-none data-disabled:text-disabled",
        className,
      )}
    />
  );
}

/* The disclosure trigger's look, shared by CollapsibleHeader and a collapsible Section: the title
   at the start, a chevron at the end that turns while the panel is open (Base UI sets
   `data-panel-open` on the trigger; `data-open` is the Root's), the row tint under the pointer,
   the focus ring, and no movement under reduced motion. The tint is a ::before that reaches
   `space.100` before the title, so a title flush with the rows under it tints as a row does
   without moving, and the chevron sits `space.100` inside the end. It reaches past the start only,
   where nothing can scroll to it, so a trigger flush with a scroller's end never scrolls it
   sideways. The title and the chevron are positioned so they paint above it. */
const disclosureTrigger =
  "group/disclosure relative flex w-full min-w-0 items-center gap-100 rounded-small py-100 pe-100 text-start outline-none before:absolute before:-start-100 before:end-0 before:inset-y-0 before:rounded-small before:transition-colors before:duration-fast before:ease-standard hover:before:bg-neutral-subtle-hovered focus-visible:outline-focused data-disabled:pointer-events-none data-disabled:text-disabled motion-reduce:before:transition-none";

/** The trigger with its title and chevron, without the heading around it. For the kit's own disclosures (a collapsible Section puts it inside Section.Title); products use CollapsibleHeader. */
export function DisclosureTrigger({ className, children, ...props }: CollapsibleTriggerProps) {
  return (
    <Primitive.Trigger
      data-slot="collapsible-header-trigger"
      {...props}
      className={classes(disclosureTrigger, className)}
    >
      <span data-slot="collapsible-header-title" className="relative min-w-0 break-words">
        {children}
      </span>
      <ChevronDown
        aria-hidden="true"
        data-slot="collapsible-header-icon"
        className="relative ms-auto size-icon-small shrink-0 transition-transform duration-fast ease-standard group-data-panel-open/disclosure:rotate-180 motion-reduce:transition-none"
      />
    </Primitive.Trigger>
  );
}

/** A disclosure's header: the trigger inside a heading at the contextual level (an h3 outside every HeadingLevelProvider, as Accordion's), the title at the start and a chevron at the end that turns while the content is open. Props, the ref and `render` go to the trigger; for another level, wrap it in a HeadingLevelProvider. In a flex row it grows, so an action can sit after it. */
export function CollapsibleHeader(props: CollapsibleHeaderProps) {
  const Tag = headingTag(useHeadingLevel() ?? 3);
  return (
    <Tag
      data-slot="collapsible-header"
      className="flex min-w-0 grow font-body font-semibold text-default"
    >
      <DisclosureTrigger {...props} />
    </Tag>
  );
}

/* The content clips only while it folds. Base UI writes the measured height in pixels for the
   length of the fold and `auto` once the content has settled open, so an open panel stops clipping
   and a focus ring at its edge (a link, a button, a table's first cell) shows whole. React writes
   the inline style with a space after the colon, and server-rendered HTML without one. The fold
   reads the panel's own measured height (`data-collapse-panel`, motion.css), so a Collapsible
   inside an open Accordion item eases instead of taking the item's `auto`. */
export function CollapsibleContent({ className, ...props }: CollapsibleContentProps) {
  return (
    <Primitive.Panel
      data-slot="collapsible-content"
      {...props}
      data-collapse-panel="collapsible"
      className={classes(
        "h-(--collapsible-panel-height) overflow-hidden data-open:animate-collapse-open data-closed:animate-collapse-close [&[hidden]:not([hidden=until-found])]:hidden [&[data-open][style*='--collapsible-panel-height:auto']]:overflow-visible [&[data-open][style*='--collapsible-panel-height:_auto']]:overflow-visible",
        className,
      )}
    />
  );
}
