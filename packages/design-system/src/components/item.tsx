import * as CollapsiblePrimitive from "@radix-ui/react-collapsible";
import { ChevronRight } from "lucide-react";
import {
  cloneElement,
  createContext,
  useContext,
  useId,
  type ReactElement,
  type ReactNode,
} from "react";

import { cn } from "../lib/cn";
import { Count } from "./badge";
import { Id } from "./id";

/* Reference material. Every row is six cells on one grid: toggle · leading · id · body · trailing ·
   actions. A group is the grid and each row a subgrid of it, so marks, ids and dates make columns
   whatever each row carries, and what a row discloses starts under its title. The interactive element
   is the title, stretched over the row by a pseudo-element; the toggle and the actions sit beside it,
   never inside it, so a row is one link or one button with separate stops after it. */

const columns = "auto auto auto minmax(0, 1fr) auto auto";

export type ItemSize = "default" | "compact";

const GroupContext = createContext<{ size: ItemSize } | null>(null);

export type ItemProps = {
  /** Before the id, centred on the title's line: a Dot, an Avatar, an icon. A 20px slot, so the marks of a list line up. */
  leading?: ReactNode;
  /** The record's id, in its own column so a list of ids lines up. */
  id?: ReactNode;
  /** The id column's width, 72 by default. */
  idWidth?: number | undefined;
  /** The row's name, one line. It truncates. The link or button of a row is this element, stretched over the row. */
  title: ReactNode;
  /** A second line under the title, subtle: who, when, why. */
  description?: ReactNode;
  /** Inline after the title, muted: the kind, the size, the state as a word. */
  meta?: ReactNode;
  /** Right-aligned value or date, tabular. */
  trailing?: ReactNode;
  /** Buttons at the end of the row, beside the row's link or button, never inside it. */
  actions?: ReactNode;
  /** A link element (a router's Link) that becomes the row's title and stretches over the row. */
  link?:
    | ReactElement<{
        id?: string | undefined;
        className?: string | undefined;
        children?: ReactNode;
      }>
    | undefined;
  /** Makes the title a button that stretches over the row. */
  onSelect?: (() => void) | undefined;
  /** The row that is open beside the list. */
  isActive?: boolean | undefined;
  /** The children fold behind a chevron. A plain row opens on a click anywhere; a row that links or selects opens on the chevron. */
  isCollapsible?: boolean | undefined;
  /** Open at first, when collapsible. */
  defaultOpen?: boolean | undefined;
  /** Controlled open state, when collapsible. */
  open?: boolean | undefined;
  onOpenChange?: ((open: boolean) => void) | undefined;
  className?: string | undefined;
  /** Content under the row, from the title's column to the end: a sentence, a Badge, a nested Item.Group. */
  children?: ReactNode;
};

/** One row of a list that is not a table: a milestone, a decision, an event, a linked record. Rows stack in Item.Group. */
function ItemRoot({
  leading,
  id,
  idWidth = 72,
  title,
  description,
  meta,
  trailing,
  actions,
  link,
  onSelect,
  isActive,
  isCollapsible,
  defaultOpen = false,
  open,
  onOpenChange,
  className,
  children,
}: ItemProps) {
  const group = useContext(GroupContext);
  const size = group?.size ?? "default";
  const titleId = useId();
  const interactive = Boolean(link || onSelect);
  const collapsible = Boolean(isCollapsible && children);
  const clickable = interactive || collapsible;

  const text = <span className="block truncate font-body text-default">{title}</span>;
  const titleClass = cn(
    "block min-w-0 outline-none",
    clickable &&
      "after:absolute after:inset-0 after:rounded-medium focus-visible:after:outline-focused",
  );
  const titleEl = link ? (
    cloneElement(link, {
      id: titleId,
      className: cn(titleClass, link.props.className),
      children: text,
    })
  ) : onSelect ? (
    <button
      type="button"
      id={titleId}
      onClick={onSelect}
      className={cn(titleClass, "cursor-pointer text-left")}
    >
      {text}
    </button>
  ) : collapsible ? (
    <CollapsiblePrimitive.Trigger
      id={titleId}
      className={cn(titleClass, "cursor-pointer text-left")}
    >
      {text}
    </CollapsiblePrimitive.Trigger>
  ) : (
    <span id={titleId} className={titleClass}>
      {text}
    </span>
  );

  const chevron = (
    <ChevronRight
      aria-hidden
      className="size-icon-small transition-transform duration-fast ease-standard group-data-[state=open]/item:rotate-90"
    />
  );
  const toggle = !collapsible ? null : interactive ? (
    <CollapsiblePrimitive.Trigger
      aria-labelledby={titleId}
      className="relative inline-flex size-250 shrink-0 items-center justify-center rounded-small icon-subtle outline-none transition-colors duration-fast ease-standard hover:bg-neutral-subtle-hovered hover:icon-default focus-visible:outline-focused"
    >
      {chevron}
    </CollapsiblePrimitive.Trigger>
  ) : (
    <span className="inline-flex size-250 shrink-0 items-center justify-center icon-subtle">
      {chevron}
    </span>
  );

  const row = (
    <div
      className={cn(
        "relative col-span-full grid grid-cols-subgrid items-start rounded-medium px-050",
        size === "compact" ? "py-050" : "py-100",
        clickable &&
          "transition-colors duration-fast ease-standard hover:bg-neutral-subtle-hovered",
        isActive && "bg-selected hover:bg-selected-hovered",
      )}
    >
      <span className={cn("flex h-250 items-center", toggle && "pe-100")}>{toggle}</span>
      <span className={cn("flex h-250 items-center justify-center", leading && "min-w-250 pe-150")}>
        {leading}
      </span>
      <span className={cn("flex h-250 items-center text-subtle", id && "pe-150")}>
        {id ? (
          <span className="block truncate" style={{ width: idWidth }}>
            <Id>{id}</Id>
          </span>
        ) : null}
      </span>
      <span className="flex min-w-0 flex-col gap-025">
        <span className="flex min-h-250 items-center">
          <span className="flex min-w-0 items-baseline gap-100">
            {titleEl}
            {meta ? (
              <span className="min-w-0 truncate font-body-small text-subtle">{meta}</span>
            ) : null}
          </span>
        </span>
        {description ? <span className="font-body-small text-subtle">{description}</span> : null}
      </span>
      <span
        className={cn(
          "flex h-250 items-center font-body-small text-subtle tabular-nums",
          trailing && "ps-150",
        )}
      >
        {trailing}
      </span>
      <span className={cn("relative flex h-250 items-center gap-050", actions && "ps-100")}>
        {actions}
      </span>
    </div>
  );

  const below = "col-start-4 col-end-7 pb-100 pt-025";
  const content = !children ? null : collapsible ? (
    <CollapsiblePrimitive.Content className={below}>{children}</CollapsiblePrimitive.Content>
  ) : (
    <div className={below}>{children}</div>
  );

  const li = (
    <li
      className={cn(
        "group/item list-none",
        group ? "col-span-full grid grid-cols-subgrid" : "grid",
        className,
      )}
      style={group ? undefined : { gridTemplateColumns: columns }}
    >
      {row}
      {content}
    </li>
  );

  return collapsible ? (
    <CollapsiblePrimitive.Root
      asChild
      {...(open === undefined ? { defaultOpen } : { open })}
      {...(onOpenChange ? { onOpenChange } : {})}
    >
      {li}
    </CollapsiblePrimitive.Root>
  ) : (
    li
  );
}

export type ItemGroupProps = {
  /** Item rows. */
  children?: ReactNode;
  /** What to say when there are no rows: "No milestones recorded." */
  empty?: ReactNode;
  /** A heading over the rows, semibold with a rule under it: "Milestones". It names the list. */
  title?: ReactNode;
  /** A Count after the title: how many rows. */
  count?: number | undefined;
  /** At the end of the heading's line: a read-out ("2 of 5 complete") or one small button. */
  trailing?: ReactNode;
  /** `compact` tightens every row from `space.100` to `space.050` above and below, for a rail. */
  size?: ItemSize | undefined;
  className?: string | undefined;
};

/** The list the rows stack in: one grid the rows share, hairlines between them, `empty` when there are none, a heading when the list needs its own. */
export function ItemGroup({
  children,
  empty,
  title,
  count,
  trailing,
  size = "default",
  className,
}: ItemGroupProps) {
  const headingId = useId();
  const has = Array.isArray(children) ? children.some(Boolean) : Boolean(children);
  const body =
    !has && empty ? (
      <p className={cn("px-050 font-body text-subtle", size === "compact" ? "py-050" : "py-100")}>
        {empty}
      </p>
    ) : (
      <ol
        aria-labelledby={title ? headingId : undefined}
        className="grid [&>li+li]:border-t [&>li+li]:border-default"
        style={{ gridTemplateColumns: columns }}
      >
        <GroupContext.Provider value={{ size }}>{children}</GroupContext.Provider>
      </ol>
    );
  if (!title && !trailing) return <div className={className}>{body}</div>;
  return (
    <div className={className}>
      <div className="flex items-center gap-100 border-b border-default px-050 pb-100">
        {title ? (
          <h3 id={headingId} className="min-w-0 truncate font-body font-semibold text-default">
            {title}
          </h3>
        ) : null}
        {count !== undefined ? <Count value={count} /> : null}
        {trailing ? (
          <span className="ms-auto flex shrink-0 items-center gap-100 font-body-small text-subtle tabular-nums">
            {trailing}
          </span>
        ) : null}
      </div>
      {body}
    </div>
  );
}

export const Item = Object.assign(ItemRoot, { Group: ItemGroup });
