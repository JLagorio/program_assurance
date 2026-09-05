import * as AccordionPrimitive from "@radix-ui/react-accordion";
import * as CollapsiblePrimitive from "@radix-ui/react-collapsible";
import { ChevronDown } from "lucide-react";
import {
  Children,
  createContext,
  isValidElement,
  useContext,
  useId,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from "react";

import { cn } from "../lib/cn";
import { Count } from "./badge";

/* Reference material: present, addressable, closed. A Collapsible is one section that opens and
   closes; several in a Collapsible.Group know about each other: the arrows move between their
   titles, and a `single` group opens one at a time. The row is the title, flush with the body
   under it and semibold so it reads as a section, a count after it, and the chevron at the end:
   down while closed, up while open. Under the pointer the row tints, the tint reaching space.100
   past a flush title, so the title stays on the text column. Alone it is Radix Collapsible; in a
   group it is a Radix Accordion item, and the group is the accordion. */

/** The heading level a section's title takes, so a rail's sections are in the page's outline. Unsaid, the title is a plain row. */
export type DisclosureHeading = 2 | 3 | 4 | 5 | 6;

type GroupSettings = {
  headingLevel: DisclosureHeading | undefined;
  inset: boolean | undefined;
};

const GroupContext = createContext<GroupSettings | null>(null);

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

const body =
  "overflow-hidden data-[state=open]:animate-collapse-open data-[state=closed]:animate-collapse-close";

export type CollapsibleProps = {
  /** The row's title: what is inside, as a noun. "Catalog statement", "Assessment objectives". */
  title: ReactNode;
  /** Inside a Collapsible.Group, what the group opens and closes by. Unsaid, the title when it is a string. */
  value?: string | undefined;
  /** A Count after the title: how many are inside. Zero, null and undefined show nothing. */
  count?: number | string | null | undefined;
  /** Open at first. Closed is the default: reference is closed. In a group, the group reads it. */
  defaultOpen?: boolean | undefined;
  /** The open state, with `onOpenChange`, when the caller holds it. Alone only: a group holds its sections' state in `value`. */
  open?: boolean | undefined;
  /** Called with the next state when the reader toggles the row. Alone only. */
  onOpenChange?: ((open: boolean) => void) | undefined;
  /** The title as a heading of this level, so the section is in the page's outline: 3 under a Section's heading, 2 on a rail of its own. In a group, the group's level unless said here. */
  headingLevel?: DisclosureHeading | undefined;
  /** A section the reader cannot open. Rare: prefer the row open with an Empty inside that says why. */
  disabled?: boolean | undefined;
  /** The trigger and the body inset by space.300, for a surface whose rules run edge to edge: a Card, a Panel. Flush is the default, for a rail or a page. In a group, the group's setting unless said here. */
  inset?: boolean | undefined;
  className?: string | undefined;
  /** The body: Text, KeyValue rows, a list. Never the record's work. */
  children: ReactNode;
};

function Alone({
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
      <CollapsiblePrimitive.Content className={body}>
        <div className={cn("pb-200", inset && "px-300")}>{children}</div>
      </CollapsiblePrimitive.Content>
    </CollapsiblePrimitive.Root>
  );
}

const valueOf = (props: Pick<CollapsibleProps, "value" | "title">) =>
  props.value ?? (typeof props.title === "string" ? props.title : undefined);

function InGroup({
  group,
  title,
  value,
  count,
  headingLevel,
  disabled,
  inset,
  className,
  children,
}: CollapsibleProps & { group: GroupSettings }) {
  const fallback = useId();
  const level = headingLevel ?? group.headingLevel;
  const isInset = inset ?? group.inset;
  return (
    <AccordionPrimitive.Item
      value={valueOf({ value, title }) ?? fallback}
      {...(disabled ? { disabled: true } : {})}
      className={cn("border-t border-default", className)}
    >
      <AccordionPrimitive.Header asChild>
        <Title level={level}>
          <AccordionPrimitive.Trigger
            className={cn(trigger, isInset ? "px-300 before:inset-x-0" : "before:-inset-x-100")}
          >
            <TriggerRow title={title} count={count} />
          </AccordionPrimitive.Trigger>
        </Title>
      </AccordionPrimitive.Header>
      <AccordionPrimitive.Content className={body}>
        <div className={cn("pb-200", isInset && "px-300")}>{children}</div>
      </AccordionPrimitive.Content>
    </AccordionPrimitive.Item>
  );
}

/** One section that opens and closes. Alone, Radix Collapsible underneath for aria-expanded and the keyboard, uncontrolled unless `open` is passed. Inside a Collapsible.Group, one of the group's sections, with the group's keyboard and open state. */
function CollapsibleRoot(props: CollapsibleProps) {
  const group = useContext(GroupContext);
  return group ? <InGroup group={group} {...props} /> : <Alone {...props} />;
}

export type CollapsibleGroupProps = {
  /** `multiple`, the default: each section opens on its own and the arrows move between them, for reference the reader compares. `single`: one at a time, and the open one can close, for a set the reader takes one by one. */
  type?: "single" | "multiple" | undefined;
  /** The sections open at first, by value, when uncontrolled. Unsaid, the sections that say `defaultOpen`. */
  defaultValue?: string | string[] | undefined;
  /** The open section, or sections for `multiple`, with `onValueChange`, when the caller holds them. */
  value?: string | string[] | undefined;
  /** Called with the open section, or sections for `multiple`, when the reader toggles a row. */
  onValueChange?: ((value: string | string[]) => void) | undefined;
  /** Every section's title as a heading of this level, so the set is in the page's outline. */
  headingLevel?: DisclosureHeading | undefined;
  /** Every section inset by space.300, for a surface whose rules run edge to edge. */
  inset?: boolean | undefined;
  className?: string | undefined;
  /** Collapsibles, two or more; one section stands alone. */
  children: ReactNode;
};

/** The sections that say `defaultOpen`, by value, so a group reads its sections the way each reads alone. */
function openByDefault(children: ReactNode): string[] {
  const open: string[] = [];
  Children.forEach(children, (child) => {
    if (!isValidElement<CollapsibleProps>(child) || child.type !== Collapsible) return;
    if (!child.props.defaultOpen) return;
    const value = valueOf(child.props);
    if (value !== undefined) open.push(value);
  });
  return open;
}

/** Several sections that know about each other: Up and Down move between the titles, Home and End go to the ends, and a `single` group opens one at a time. The rail's shape: the Inspector's groups are this, every one open. */
function CollapsibleGroup({
  type = "multiple",
  defaultValue,
  value,
  onValueChange,
  headingLevel,
  inset,
  className,
  children,
}: CollapsibleGroupProps) {
  const settings: GroupSettings = { headingLevel, inset };
  const shared = {
    className: cn("border-b border-default", className),
    children: <GroupContext.Provider value={settings}>{children}</GroupContext.Provider>,
  };
  const initial = defaultValue ?? openByDefault(children);
  if (type === "multiple") {
    const many = (v: string | string[] | undefined) =>
      v === undefined ? undefined : Array.isArray(v) ? v : [v];
    return (
      <AccordionPrimitive.Root
        type="multiple"
        {...(value === undefined ? { defaultValue: many(initial) ?? [] } : { value: many(value) ?? [] })}
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
      {...(value === undefined ? { defaultValue: one(initial) ?? "" } : { value: one(value) ?? "" })}
      {...(onValueChange ? { onValueChange } : {})}
      {...shared}
    />
  );
}

export const Collapsible = Object.assign(CollapsibleRoot, { Group: CollapsibleGroup });

/* ---------- the old names, kept for one release ---------- */

/** @deprecated The set is `Collapsible.Group`, `multiple` unless `type="single"` is said; `ledger/no-deprecated-name` says so. */
export type AccordionProps = CollapsibleGroupProps;

/** @deprecated A section in a group is a `Collapsible`; `ledger/no-deprecated-name` says so. */
export type AccordionItemProps = Omit<CollapsibleProps, "defaultOpen" | "open" | "onOpenChange"> & {
  value: string;
};

function AccordionRoot({ type = "single", ...rest }: AccordionProps) {
  return <CollapsibleGroup type={type} {...rest} />;
}

function AccordionItem(props: AccordionItemProps) {
  return <CollapsibleRoot {...props} />;
}

const accordion = Object.assign(AccordionRoot, { Item: AccordionItem });

/** @deprecated `Accordion` is `Collapsible.Group` (`single` here, `multiple` there unless said) and `Accordion.Item` is `Collapsible`; `ledger/no-deprecated-name` says so. */
export const Accordion = accordion;
