import * as AccordionPrimitive from "@radix-ui/react-accordion";
import * as CollapsiblePrimitive from "@radix-ui/react-collapsible";
import { ChevronDown } from "lucide-react";
import { createContext, useContext, type ComponentPropsWithoutRef, type ReactNode } from "react";

import { cn } from "../lib/cn";
import { Count } from "./badge";

/* Reference material: present, addressable, closed. Collapsible is one section; Accordion is
   several that know about each other. Both share one trigger row so a page can mix them. The row
   is the title, flush with the body under it and semibold so it reads as a section, a count after
   it, and the chevron at the end: down while closed, up while open. Under the pointer the row
   tints, the tint reaching space.100 past a flush title as Carbon's flush accordion does, so the
   title stays on the text column. */

/** The heading level a disclosure's title takes, so a rail's sections are in the page's outline. Unsaid, the title is a plain row. */
export type DisclosureHeading = 2 | 3 | 4 | 5 | 6;

const trigger =
  "group/disclosure relative flex w-full items-center gap-100 rounded-small py-100 text-left outline-none focus-visible:outline-focused before:absolute before:inset-y-0 before:rounded-small before:transition-colors before:duration-fast before:ease-standard hover:before:bg-neutral-subtle-hovered active:before:bg-neutral-subtle-pressed disabled:pointer-events-none";

function Title({
  level,
  children,
  ...rest
}: {
  level: DisclosureHeading | undefined;
  children: ReactNode;
} & ComponentPropsWithoutRef<"div">) {
  const Tag = level ? (`h${level}` as const) : "div";
  return <Tag {...rest}>{children}</Tag>;
}

function TriggerRow({
  title,
  count,
}: {
  title: ReactNode;
  count?: number | string | null | undefined;
}) {
  return (
    <>
      <span className="relative min-w-0 truncate font-body font-semibold text-default group-disabled/disclosure:text-disabled">
        {title}
      </span>
      {count !== undefined && count !== null && count !== 0 ? (
        <Count className="relative" value={count} />
      ) : null}
      <ChevronDown className="relative ms-auto size-icon-small shrink-0 icon-subtle transition-transform duration-fast ease-standard group-data-[state=open]/disclosure:rotate-180 group-disabled/disclosure:icon-disabled" />
    </>
  );
}

export type CollapsibleProps = {
  /** The row's title: what is inside, as a noun. "Catalog statement", "Assessment objectives". */
  title: ReactNode;
  /** A Count after the title: how many are inside. Zero, null and undefined show nothing. */
  count?: number | string | null | undefined;
  /** Open at first, when uncontrolled. Closed is the default: reference is closed. */
  defaultOpen?: boolean | undefined;
  /** The open state, with `onOpenChange`, when the caller holds it. */
  open?: boolean | undefined;
  /** Called with the next state when the reader toggles the row. */
  onOpenChange?: ((open: boolean) => void) | undefined;
  /** The title as a heading of this level, so the section is in the page's outline: 3 under a Section's heading, 2 on a rail of its own. */
  headingLevel?: DisclosureHeading | undefined;
  /** A section the reader cannot open. Rare: prefer the row open with an Empty inside that says why. */
  disabled?: boolean | undefined;
  /** The trigger and the body inset by space.300, for a surface whose rules run edge to edge: a Card, a Panel. Flush is the default, for a rail or a page. */
  inset?: boolean | undefined;
  className?: string | undefined;
  /** The body: Text, KeyValue rows, a list. Never the record's work. */
  children: ReactNode;
};

/** One section that opens and closes. Radix underneath for aria-expanded and the keyboard; uncontrolled unless `open` is passed. */
export function Collapsible({
  title,
  count,
  defaultOpen = false,
  open,
  onOpenChange,
  headingLevel,
  disabled,
  inset,
  className,
  children,
}: CollapsibleProps) {
  return (
    <CollapsiblePrimitive.Root
      {...(open === undefined ? { defaultOpen } : { open })}
      {...(onOpenChange ? { onOpenChange } : {})}
      {...(disabled ? { disabled: true } : {})}
      className={cn("border-t border-default", className)}
    >
      <Title level={headingLevel}>
        <CollapsiblePrimitive.Trigger
          className={cn(trigger, inset ? "px-300 before:inset-x-0" : "before:-inset-x-100")}
        >
          <TriggerRow title={title} count={count} />
        </CollapsiblePrimitive.Trigger>
      </Title>
      <CollapsiblePrimitive.Content className="overflow-hidden data-[state=open]:animate-collapse-open data-[state=closed]:animate-collapse-close">
        <div className={cn("pb-200", inset && "px-300")}>{children}</div>
      </CollapsiblePrimitive.Content>
    </CollapsiblePrimitive.Root>
  );
}

const AccordionHeading = createContext<DisclosureHeading | undefined>(undefined);

export type AccordionProps = {
  /** `single`, the default, opens one at a time and lets the open one close: a set the reader takes one by one. `multiple` is independent sections with one keyboard model: reference the reader compares. */
  type?: "single" | "multiple" | undefined;
  /** The item open at first, when uncontrolled; several for `multiple`. Unsaid, every item is closed. */
  defaultValue?: string | string[] | undefined;
  /** The open item or items, with `onValueChange`, when the caller holds them. */
  value?: string | string[] | undefined;
  /** Called with the open item, or items for `multiple`, when the reader toggles a row. */
  onValueChange?: ((value: string | string[]) => void) | undefined;
  /** The level every item's title takes as a heading, so the set is in the page's outline. Unsaid, the titles are plain rows. */
  headingLevel?: DisclosureHeading | undefined;
  className?: string | undefined;
  /** Accordion.Items, two or more; one section is a Collapsible. */
  children: ReactNode;
};

function AccordionRoot({
  type = "single",
  defaultValue,
  value,
  onValueChange,
  headingLevel,
  className,
  children,
}: AccordionProps) {
  const shared = {
    className: cn("border-b border-default", className),
    children: <AccordionHeading.Provider value={headingLevel}>{children}</AccordionHeading.Provider>,
  };
  if (type === "multiple") {
    const many = (v: string | string[] | undefined) =>
      v === undefined ? undefined : Array.isArray(v) ? v : [v];
    return (
      <AccordionPrimitive.Root
        type="multiple"
        {...(value === undefined
          ? { defaultValue: many(defaultValue) ?? [] }
          : { value: many(value) ?? [] })}
        {...(onValueChange ? { onValueChange } : {})}
        {...shared}
      />
    );
  }
  const one = (v: string | string[] | undefined) =>
    v === undefined ? undefined : Array.isArray(v) ? (v[0] ?? "") : v;
  return (
    <AccordionPrimitive.Root
      type="single"
      collapsible
      {...(value === undefined
        ? { defaultValue: one(defaultValue) ?? "" }
        : { value: one(value) ?? "" })}
      {...(onValueChange ? { onValueChange } : {})}
      {...shared}
    />
  );
}

export type AccordionItemProps = {
  /** The item's value: what the Accordion opens and closes by. */
  value: string;
  /** The row's title: what is inside, as a noun. */
  title: ReactNode;
  /** A Count after the title: how many are inside. Zero, null and undefined show nothing. */
  count?: number | string | null | undefined;
  /** A section the reader cannot open. Rare: prefer the row open with an Empty inside that says why. */
  disabled?: boolean | undefined;
  /** The trigger and the body inset by space.300, for a surface whose rules run edge to edge. */
  inset?: boolean | undefined;
  className?: string | undefined;
  /** The body: Text, KeyValue rows, a list. */
  children: ReactNode;
};

function AccordionItem({
  value,
  title,
  count,
  disabled,
  inset,
  className,
  children,
}: AccordionItemProps) {
  const level = useContext(AccordionHeading);
  return (
    <AccordionPrimitive.Item
      value={value}
      {...(disabled ? { disabled: true } : {})}
      className={cn("border-t border-default", className)}
    >
      <AccordionPrimitive.Header asChild>
        <Title level={level}>
          <AccordionPrimitive.Trigger
            className={cn(trigger, inset ? "px-300 before:inset-x-0" : "before:-inset-x-100")}
          >
            <TriggerRow title={title} count={count} />
          </AccordionPrimitive.Trigger>
        </Title>
      </AccordionPrimitive.Header>
      <AccordionPrimitive.Content className="overflow-hidden data-[state=open]:animate-collapse-open data-[state=closed]:animate-collapse-close">
        <div className={cn("pb-200", inset && "px-300")}>{children}</div>
      </AccordionPrimitive.Content>
    </AccordionPrimitive.Item>
  );
}

export const Accordion = Object.assign(AccordionRoot, { Item: AccordionItem });
