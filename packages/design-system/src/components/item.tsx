import { useRender } from "@base-ui/react/use-render";
import { Collapsible as CollapsiblePrimitive } from "@base-ui/react/collapsible";
import { ChevronRight } from "lucide-react";
import {
  Children,
  createContext,
  Fragment,
  isValidElement,
  useContext,
  useId,
  type ComponentProps,
  type ReactElement,
  type ReactNode,
} from "react";

import { token } from "../generated/tokens";
import { cn } from "../lib/cn";
import { useLedgerLocale } from "../lib/locale";
import { headingTag, useHeadingLevel } from "../primitives/heading-level";
import { IconButton } from "./button";
import { Empty, EmptyHeader, EmptyTitle } from "./empty";
import { Count } from "./badge";
import { Id } from "./id";
import { textOf } from "./option-text";
import { Truncate, type TruncateLines } from "./truncate";

/* Every row is six cells on one grid: toggle · leading · id · body · trailing ·
   actions. A group is the grid and each row a subgrid of it, so marks, ids and dates make columns
   whatever each row carries, and what a row discloses starts under its title. The interactive element
   is the title, stretched over the row by a pseudo-element; the toggle and the actions sit beside it,
   never inside it, so a row is one link or one button with separate stops after it. */

const columns = "auto auto auto minmax(0, 1fr) auto auto";

/** Whether children render anything: arrays and fragments are looked into, so a list fed from two mapped sources that are both empty has no rows. Not exported from the package. */
export function hasRenderedChildren(children: ReactNode): boolean {
  return Children.toArray(children).some((child) =>
    isValidElement<{ children?: ReactNode }>(child) && child.type === Fragment
      ? hasRenderedChildren(child.props.children)
      : child !== "",
  );
}

export type ItemSize = "default" | "compact";

const GroupContext = createContext<{ size: ItemSize; flush: boolean } | null>(null);

export type ItemProps = Omit<ComponentProps<"li">, "id" | "title" | "onSelect"> & {
  /** Before the id, centred on the title's line: a Dot, an Avatar, an icon. A 20px slot, so the marks of a list line up. */
  leading?: ReactNode;
  /** The record's id, in its own column so a list of ids lines up. */
  id?: ReactNode;
  /** The id column's width in pixels, 72 by default (`dimension.part.itemId`). */
  idWidth?: number | undefined;
  /** The row's name, one line by default. A name that is cut shows in full in a tooltip on hover and on keyboard focus of the row. The link or button of a row is this element, stretched over the row. */
  title: ReactNode;
  /** How many lines the title keeps before its ellipsis: 1 by default, 2 or 3 for a list of long names. */
  maxTitleLines?: TruncateLines | undefined;
  /** A second line under the title, subtle: who, when, why. */
  description?: ReactNode;
  /** Inline after the title, muted: the kind, the size, the state as a word. It keeps its words while the title gives way, and is cut, with its reveal, only past half the line. */
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
  /** The row that is open beside the list: a selected fill, and `aria-current="true"` on the title's link or button, so a screen reader says which row is open. */
  isActive?: boolean | undefined;
  /** The children fold behind a chevron. A plain row opens on a click anywhere; a row that links or selects opens on the chevron. */
  isCollapsible?: boolean | undefined;
  /** Open at first, when collapsible. */
  defaultOpen?: boolean | undefined;
  /** Controlled open state, when collapsible. */
  open?: boolean | undefined;
  onOpenChange?: CollapsiblePrimitive.Root.Props["onOpenChange"] | undefined;
  className?: string | undefined;
  /** Content under the row, from the title's column to the end: a sentence, a Badge, a nested Item.Group. */
  children?: ReactNode;
};

/** One row of a list that is not a table: a milestone, a decision, an event, a linked record. Rows stack in Item.Group. */
function ItemRoot({
  leading,
  id,
  idWidth,
  title,
  maxTitleLines = 1,
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
  ...props
}: ItemProps) {
  const { t } = useLedgerLocale();
  const group = useContext(GroupContext);
  const size = group?.size ?? "default";
  const flush = group?.flush ?? false;
  const generatedTitleId = useId();
  const titleId = link?.props.id ?? generatedTitleId;
  const interactive = Boolean(link || onSelect);
  const collapsible = Boolean(isCollapsible && children);
  const clickable = interactive || collapsible;

  const idId = useId();
  const metaId = useId();
  const descriptionId = useId();
  // The id, the meta and the description tell rows with one name apart, so the row's link or
  // button carries them as its description.
  const describedBy =
    [id ? idId : null, meta ? metaId : null, description ? descriptionId : null]
      .filter(Boolean)
      .join(" ") || undefined;

  // Above the stretched overlay (z-10 within the row), so hovering the name reveals it when cut;
  // a click on it is still a click on the link or button it sits in.
  const text = (
    <Truncate
      maxLines={maxTitleLines}
      className={cn("font-body text-default", clickable && "relative z-10")}
    >
      {title}
    </Truncate>
  );
  // `static` keeps the overlay stretched over the row when the link is a positioned part (TextLink).
  // A flush row spans its card edge to edge, so its ring is drawn inside the edge, where the card's
  // clipping cannot cut its sides.
  const titleClass = cn(
    "block min-w-0 outline-none",
    clickable && "static after:absolute after:inset-0",
    clickable &&
      (flush
        ? "after:rounded-none focus-visible:after:outline-field-focused"
        : "after:rounded-medium focus-visible:after:outline-focused"),
  );
  const titleState = {
    id: titleId,
    className: titleClass,
    children: text,
    ...(interactive || collapsible ? { "aria-describedby": describedBy } : {}),
    ...(isActive ? { "aria-current": "true" as const } : {}),
  };
  const titleLink = useRender({
    defaultTagName: "a",
    render: link,
    enabled: Boolean(link),
    state: { slot: "item-link" },
    props: titleState,
  });
  const titleEl = link ? (
    titleLink
  ) : onSelect ? (
    <button
      type="button"
      {...titleState}
      onClick={onSelect}
      className={cn(titleClass, "cursor-pointer text-start")}
    />
  ) : collapsible ? (
    <CollapsiblePrimitive.Trigger
      {...titleState}
      className={cn(titleClass, "cursor-pointer text-start")}
    />
  ) : (
    <span {...titleState} />
  );

  const chevron = (
    <ChevronRight
      aria-hidden
      className="size-icon-small transition-transform duration-fast ease-standard group-data-open/item:rotate-90 motion-reduce:transition-none"
    />
  );
  // The chevron sits over the title's stretched overlay (z-10 within the row), so it opens the row
  // instead of following the link, with a 24px hit area on touch.
  // It is the kit's 20px row control, named by the title, with no tooltip of its own.
  const toggle = !collapsible ? null : interactive ? (
    <CollapsiblePrimitive.Trigger
      aria-labelledby={titleId}
      render={
        <IconButton
          label={textOf(title) || t("expand")}
          variant="subtle"
          size="xxsmall"
          isTooltipDisabled
          className="z-10"
          icon={chevron}
        />
      }
    />
  ) : (
    <span className="inline-flex size-250 shrink-0 items-center justify-center icon-subtle">
      {chevron}
    </span>
  );

  const row = (
    <div
      className={cn(
        "relative isolate col-span-full grid grid-cols-subgrid items-start",
        flush ? "px-200" : "rounded-medium px-050",
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
          <Truncate id={idId} style={{ width: idWidth ?? token("dimension.part.itemId") }}>
            <Id>{id}</Id>
          </Truncate>
        ) : null}
      </span>
      <span className="flex min-w-0 flex-col gap-025">
        <span className="flex min-h-250 items-center">
          {/* The meta keeps its words and the title gives way first; the meta is cut only past
              half the line, so a long one cannot crowd the title out. */}
          <span className="flex w-full min-w-0 items-baseline gap-100">
            {titleEl}
            {meta ? (
              <Truncate
                id={metaId}
                className="shrink-0 font-body-small text-subtle"
                style={{ maxWidth: "50%" }}
              >
                {meta}
              </Truncate>
            ) : null}
          </span>
        </span>
        {description ? (
          <span id={descriptionId} className="font-body-small text-subtle">
            {description}
          </span>
        ) : null}
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
    <CollapsiblePrimitive.Panel className={below}>{children}</CollapsiblePrimitive.Panel>
  ) : (
    <div className={below}>{children}</div>
  );

  const li = (
    <li
      {...props}
      data-slot="item"
      className={cn(
        "group/item list-none",
        group ? "col-span-full grid grid-cols-subgrid" : "grid",
        className,
      )}
      style={{ ...(group ? {} : { gridTemplateColumns: columns }), ...props.style }}
    >
      {row}
      {content}
    </li>
  );

  return collapsible ? (
    <CollapsiblePrimitive.Root
      render={li}
      {...(open === undefined ? { defaultOpen } : { open })}
      {...(onOpenChange ? { onOpenChange } : {})}
    />
  ) : (
    li
  );
}

export type ItemGroupProps = Omit<ComponentProps<"div">, "title"> & {
  /** Item rows. */
  children?: ReactNode;
  /** What to say when there are no rows: "No milestones recorded." */
  empty?: ReactNode;
  /** A heading over the rows, semibold with a rule under it: "Milestones". It names the list, and a long one wraps. The heading takes the contextual level, an h3 outside every HeadingLevelProvider. */
  title?: ReactNode;
  /** A Count after the title: how many rows. */
  count?: number | undefined;
  /** The most `count` shows before it reads as `max+`, as Count's `max`: `9999` for a count of rows. 99 unsaid. */
  countMax?: number | undefined;
  /** At the end of the heading's line: a read-out ("2 of 5 complete") or one small button. */
  trailing?: ReactNode;
  /** `compact` tightens every row from `space.100` to `space.050` above and below, for a rail. */
  size?: ItemSize | undefined;
  /** The id of a heading outside the group that names the list, when the card the list sits in draws the heading. It reaches the list, as does `aria-label`; the group's own `title` wins over both. */
  "aria-labelledby"?: string | undefined;
  /** The list's name when no heading shows it. It reaches the list, not the wrapper. */
  "aria-label"?: string | undefined;
  /**
   * The id of a heading outside the group that names it.
   * @deprecated Use `aria-labelledby`, which reaches the list; `labelledBy` is kept for one version.
   */
  labelledBy?: string | undefined;
  /** Rows run edge to edge of the card they sit in: the hairlines and the hover fill span it, the text at `space.200`. For an Item.Group inside a Card or a Related. */
  flush?: boolean | undefined;
  className?: string | undefined;
};

/** The list the rows stack in: one grid the rows share, hairlines between them, `empty` when there are none (a string is a compact Empty's title; a node is drawn as given), a heading when the list needs its own. */
export function ItemGroup({
  children,
  empty,
  title,
  count,
  countMax,
  trailing,
  size = "default",
  labelledBy,
  "aria-labelledby": ariaLabelledBy,
  "aria-label": ariaLabel,
  flush = false,
  className,
  ...props
}: ItemGroupProps) {
  const headingId = useId();
  const HeadingTag = headingTag(useHeadingLevel() ?? 3);
  const has = hasRenderedChildren(children);
  const body =
    !has && empty ? (
      <div className={cn(flush ? "px-200" : "px-050", size === "compact" ? "py-050" : "py-100")}>
        {typeof empty === "string" ? (
          <Empty size="compact">
            <EmptyHeader>
              <EmptyTitle>{empty}</EmptyTitle>
            </EmptyHeader>
          </Empty>
        ) : (
          empty
        )}
      </div>
    ) : (
      <ol
        data-slot="item-group-list"
        aria-labelledby={title ? headingId : (ariaLabelledBy ?? labelledBy)}
        aria-label={title || ariaLabelledBy || labelledBy ? undefined : ariaLabel}
        className="grid [&>li+li]:border-t [&>li+li]:border-default"
        style={{ gridTemplateColumns: columns }}
      >
        <GroupContext.Provider value={{ size, flush }}>{children}</GroupContext.Provider>
      </ol>
    );
  return (
    <div {...props} data-slot="item-group" className={className}>
      {title || trailing ? (
        <div
          className={cn(
            "flex items-center gap-100 border-b border-default pb-100",
            flush ? "px-200" : "px-050",
          )}
        >
          {title ? (
            <HeadingTag
              id={headingId}
              className="min-w-0 break-words font-heading-section text-default"
            >
              {title}
            </HeadingTag>
          ) : null}
          {count !== undefined ? <Count value={count} max={countMax} /> : null}
          {trailing ? (
            <span className="ms-auto flex shrink-0 items-center gap-100 font-body-small text-subtle tabular-nums">
              {trailing}
            </span>
          ) : null}
        </div>
      ) : null}
      {body}
    </div>
  );
}

export const Item = Object.assign(ItemRoot, { Group: ItemGroup });
