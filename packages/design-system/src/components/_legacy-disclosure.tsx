import * as LegacyAccordionPrimitive from "@radix-ui/react-accordion";
import * as LegacyCollapsiblePrimitive from "@radix-ui/react-collapsible";
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

/* Reference material: present, addressable, closed. A LegacyCollapsible is one section that opens and
   closes; several in a LegacyCollapsible.Group know about each other: the arrows move between their
   titles, and a `single` group opens one at a time. The row is the title, flush with the body
   under it and semibold so it reads as a section, a count after it, and the chevron at the end:
   down while closed, up while open. Under the pointer the row tints, the tint reaching space.100
   past a flush title, so the title stays on the text column. Alone it is Radix LegacyCollapsible; in a
   group it is a Radix LegacyAccordion item, and the group is the accordion. */

/** The heading level a section's title takes, so a rail's sections are in the page's outline. Unsaid, the title is a plain row. */
type DisclosureHeading = 2 | 3 | 4 | 5 | 6;

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

export type LegacyCollapsibleProps = {
  /** The row's title: what is inside, as a noun. "Catalog statement", "Assessment objectives". */
  title: ReactNode;
  /** Inside a LegacyCollapsible.Group, what the group opens and closes by. Unsaid, the title when it is a string. */
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
}: LegacyCollapsibleProps) {
  return (
    <LegacyCollapsiblePrimitive.Root
      {...(open === undefined ? { defaultOpen } : { open })}
      {...(onOpenChange ? { onOpenChange } : {})}
      {...(disabled ? { disabled: true } : {})}
      className={cn("border-t border-default", className)}
    >
      <Title level={headingLevel}>
        <LegacyCollapsiblePrimitive.Trigger
          className={cn(trigger, inset ? "px-300 before:inset-x-0" : "before:-inset-x-100")}
        >
          <TriggerRow title={title} count={count} />
        </LegacyCollapsiblePrimitive.Trigger>
      </Title>
      <LegacyCollapsiblePrimitive.Content className={body}>
        <div className={cn("pb-200", inset && "px-300")}>{children}</div>
      </LegacyCollapsiblePrimitive.Content>
    </LegacyCollapsiblePrimitive.Root>
  );
}

const valueOf = (props: Pick<LegacyCollapsibleProps, "value" | "title">) =>
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
}: LegacyCollapsibleProps & { group: GroupSettings }) {
  const fallback = useId();
  const level = headingLevel ?? group.headingLevel;
  const isInset = inset ?? group.inset;
  return (
    <LegacyAccordionPrimitive.Item
      value={valueOf({ value, title }) ?? fallback}
      {...(disabled ? { disabled: true } : {})}
      className={cn("border-t border-default", className)}
    >
      <LegacyAccordionPrimitive.Header asChild>
        <Title level={level}>
          <LegacyAccordionPrimitive.Trigger
            className={cn(trigger, isInset ? "px-300 before:inset-x-0" : "before:-inset-x-100")}
          >
            <TriggerRow title={title} count={count} />
          </LegacyAccordionPrimitive.Trigger>
        </Title>
      </LegacyAccordionPrimitive.Header>
      <LegacyAccordionPrimitive.Content className={body}>
        <div className={cn("pb-200", isInset && "px-300")}>{children}</div>
      </LegacyAccordionPrimitive.Content>
    </LegacyAccordionPrimitive.Item>
  );
}

/** One section that opens and closes. Alone, Radix LegacyCollapsible underneath for aria-expanded and the keyboard, uncontrolled unless `open` is passed. Inside a LegacyCollapsible.Group, one of the group's sections, with the group's keyboard and open state. */
function LegacyCollapsibleRoot(props: LegacyCollapsibleProps) {
  const group = useContext(GroupContext);
  return group ? <InGroup group={group} {...props} /> : <Alone {...props} />;
}

export type LegacyCollapsibleGroupProps = {
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
  /** LegacyCollapsibles, two or more; one section stands alone. */
  children: ReactNode;
};

/** The sections that say `defaultOpen`, by value, so a group reads its sections the way each reads alone. */
function openByDefault(children: ReactNode): string[] {
  const open: string[] = [];
  Children.forEach(children, (child) => {
    if (!isValidElement<LegacyCollapsibleProps>(child) || child.type !== LegacyCollapsible) return;
    if (!child.props.defaultOpen) return;
    const value = valueOf(child.props);
    if (value !== undefined) open.push(value);
  });
  return open;
}

/** Several sections that know about each other: Up and Down move between the titles, Home and End go to the ends, and a `single` group opens one at a time. The rail's shape: the Inspector's groups are this, every one open. */
function LegacyCollapsibleGroup({
  type = "multiple",
  defaultValue,
  value,
  onValueChange,
  headingLevel,
  inset,
  className,
  children,
}: LegacyCollapsibleGroupProps) {
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
      <LegacyAccordionPrimitive.Root
        type="multiple"
        {...(value === undefined
          ? { defaultValue: many(initial) ?? [] }
          : { value: many(value) ?? [] })}
        {...(onValueChange ? { onValueChange } : {})}
        {...shared}
      />
    );
  }
  const one = (v: string | string[] | undefined) =>
    v === undefined ? undefined : Array.isArray(v) ? (v[0] ?? "") : v;
  return (
    <LegacyAccordionPrimitive.Root
      type="single"
      collapsible
      {...(value === undefined
        ? { defaultValue: one(initial) ?? "" }
        : { value: one(value) ?? "" })}
      {...(onValueChange ? { onValueChange } : {})}
      {...shared}
    />
  );
}

/** @deprecated Use Collapsible, or compose Collapsible.Trigger and Collapsible.Content. Retained through the next minor release. */
export const LegacyCollapsible = Object.assign(LegacyCollapsibleRoot, {
  Group: LegacyCollapsibleGroup,
});

/* ---------- the old names, kept for one release ---------- */

/** @deprecated The set is `LegacyCollapsible.Group`, `multiple` unless `type="single"` is said; `ledger/no-deprecated-name` says so. */
export type LegacyAccordionProps = LegacyCollapsibleGroupProps;

/** @deprecated A section in a group is a `LegacyCollapsible`; `ledger/no-deprecated-name` says so. */
export type LegacyAccordionItemProps = Omit<
  LegacyCollapsibleProps,
  "defaultOpen" | "open" | "onOpenChange"
> & {
  value: string;
};

function LegacyAccordionRoot({ type = "single", ...rest }: LegacyAccordionProps) {
  return <LegacyCollapsibleGroup type={type} {...rest} />;
}

function LegacyAccordionItem(props: LegacyAccordionItemProps) {
  return <LegacyCollapsibleRoot {...props} />;
}

const accordion = Object.assign(LegacyAccordionRoot, { Item: LegacyAccordionItem });

/** @deprecated `LegacyAccordion` is `LegacyCollapsible.Group` (`single` here, `multiple` there unless said) and `LegacyAccordion.Item` is `LegacyCollapsible`; `ledger/no-deprecated-name` says so. */
export const LegacyAccordion = accordion;
