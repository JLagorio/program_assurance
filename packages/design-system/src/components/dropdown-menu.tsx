import { DirectionProvider, useDirection } from "@base-ui/react/direction-provider";
import { Menu as MenuPrimitive } from "@base-ui/react/menu";
import { Check, ChevronRight, Circle } from "lucide-react";
import {
  Children,
  createContext,
  useContext,
  useEffect,
  useId,
  type ComponentProps,
  type CSSProperties,
  type PointerEvent,
  type ReactNode,
} from "react";

import { token } from "../generated/tokens";
import { classes } from "../lib/base-ui";
import { cn } from "../lib/cn";
import { useLedgerLocale } from "../lib/locale";
import { Stack } from "../primitives/stack";
import { KbdShortcut, useFormatShortcut } from "./kbd";
import {
  menuItem,
  menuItemDescription,
  menuItemDisabled,
  menuItemHighlighted,
  menuItemLabel,
  menuLabel,
  menuSeparator,
  menuSurface,
} from "./menu";
import { Scroller, ScrollerArrow, ScrollerViewport } from "./scroller";

export type DropdownMenuProps<Payload = unknown> = MenuPrimitive.Root.Props<Payload>;
export function DropdownMenu<Payload = unknown>(props: DropdownMenuProps<Payload>) {
  const { direction } = useLedgerLocale();
  return (
    <DirectionProvider direction={direction}>
      <MenuPrimitive.Root {...props} />
    </DirectionProvider>
  );
}

export type DropdownMenuPortalProps = MenuPrimitive.Portal.Props;
export function DropdownMenuPortal(props: DropdownMenuPortalProps) {
  return <MenuPrimitive.Portal {...props} data-slot="dropdown-menu-portal" />;
}

export type DropdownMenuTriggerProps<Payload = unknown> = MenuPrimitive.Trigger.Props<Payload>;
export function DropdownMenuTrigger<Payload = unknown>(props: DropdownMenuTriggerProps<Payload>) {
  return <MenuPrimitive.Trigger {...props} data-slot="dropdown-menu-trigger" />;
}

export type DropdownMenuContentProps = MenuPrimitive.Popup.Props &
  Pick<MenuPrimitive.Positioner.Props, "align" | "alignOffset" | "side" | "sideOffset">;
export function DropdownMenuContent(props: DropdownMenuContentProps) {
  return <MenuContent {...props} slot="dropdown-menu-content" />;
}

/**
 * A caller's minimum width never pushes the menu past the window's edge: CSS lets `min-width` win
 * over `max-width`, so a length is capped at the available width. A keyword is left as it is.
 */
function withinWindow(value: CSSProperties["minWidth"]) {
  if (typeof value === "number") return `min(var(--available-width), ${value}px)`;
  if (typeof value === "string" && !/^[a-z-]+$/i.test(value))
    return `min(var(--available-width), ${value})`;
  return value;
}

function sized<Style extends CSSProperties | undefined>(defaults: CSSProperties, style: Style) {
  const merged: CSSProperties = { ...defaults, ...style };
  if (style?.minWidth !== undefined) merged.minWidth = withinWindow(style.minWidth);
  return merged;
}

/** The popup a menu and a submenu share; `slot` names which it is, after the caller's props. */
function MenuContent({
  slot,
  align = "start",
  alignOffset = 0,
  side = "bottom",
  sideOffset = 4,
  className,
  style,
  dir,
  children,
  ...props
}: DropdownMenuContentProps & { slot: string }) {
  const inheritedDirection = useDirection();
  const direction = dir === "ltr" || dir === "rtl" ? dir : inheritedDirection;
  const defaults = {
    width: "max-content",
    minWidth: `min(var(--available-width), max(var(--anchor-width), ${token("dimension.part.menu")}))`,
    maxWidth: "var(--available-width)",
    maxHeight: "var(--available-height)",
    transformOrigin: "var(--transform-origin)",
  };
  return (
    <DirectionProvider direction={direction}>
      <DropdownMenuPortal>
        <MenuPrimitive.Positioner
          align={align}
          alignOffset={alignOffset}
          side={side}
          sideOffset={sideOffset}
          className="isolate z-overlay outline-none"
        >
          <MenuPrimitive.Popup
            {...props}
            data-slot={slot}
            dir={dir ?? direction}
            className={classes(
              cn(
                menuSurface,
                "flex flex-col data-open:animate-enter data-closed:animate-exit data-instant:animate-none motion-reduce:animate-none",
              ),
              className,
            )}
            style={
              typeof style === "function"
                ? (state) => sized(defaults, style(state))
                : sized(defaults, style)
            }
          >
            <Scroller orientation="vertical" surface="overlay">
              <ScrollerViewport className="overscroll-contain">{children}</ScrollerViewport>
              <ScrollerArrow edge="start" />
              <ScrollerArrow edge="end" />
            </Scroller>
          </MenuPrimitive.Popup>
        </MenuPrimitive.Positioner>
      </DropdownMenuPortal>
    </DirectionProvider>
  );
}

/** Whether a Label sits inside a group it can name: a Group or a RadioGroup. */
const InGroup = createContext(false);

export type DropdownMenuGroupProps = MenuPrimitive.Group.Props;
export function DropdownMenuGroup(props: DropdownMenuGroupProps) {
  return (
    <InGroup.Provider value>
      <MenuPrimitive.Group {...props} data-slot="dropdown-menu-group" />
    </InGroup.Provider>
  );
}

const warned = new Set<string>();

export type DropdownMenuLabelProps = MenuPrimitive.GroupLabel.Props & {
  inset?: boolean | undefined;
};
/**
 * The heading of a Group, which it names. Outside a Group or a RadioGroup it has nothing to name:
 * it still renders, in a group of its own, and says so once in the console.
 */
export function DropdownMenuLabel({ className, inset, ...props }: DropdownMenuLabelProps) {
  const inGroup = useContext(InGroup);
  useEffect(() => {
    if (inGroup) return;
    const message =
      "Ledger: a DropdownMenuLabel outside a DropdownMenuGroup or DropdownMenuRadioGroup names nothing. Put it first inside the Group of the items it names.";
    if (warned.has(message)) return;
    warned.add(message);
    console.warn(message);
  }, [inGroup]);
  const label = (
    <MenuPrimitive.GroupLabel
      {...props}
      data-slot="dropdown-menu-label"
      data-inset={inset}
      className={classes(cn(menuLabel, "data-inset:ps-400"), className)}
    />
  );
  return inGroup ? label : <MenuPrimitive.Group>{label}</MenuPrimitive.Group>;
}

const itemClasses = cn(
  menuItem,
  menuItemHighlighted,
  menuItemDisabled,
  "relative whitespace-nowrap text-start data-inset:ps-400 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-icon-small",
);
/** A menu item's treatment. `danger` is an action that destroys or cannot be undone, as on Button. */
export type DropdownMenuItemVariant =
  | "default"
  | "danger"
  /** @deprecated `destructive` is `danger`, the word Button and RowAction use; write `danger`. */
  | "destructive";

export type DropdownMenuItemProps = MenuPrimitive.Item.Props & {
  inset?: boolean | undefined;
  /** `danger` paints an action that destroys or cannot be undone in the danger colour, as Button's `danger` does; put it last, after a separator, and confirm it. `destructive` is its deprecated spelling. */
  variant?: DropdownMenuItemVariant | undefined;
  /**
   * A second line under the label, in smaller subtle text that wraps: what tells two similar
   * actions apart, or a prerequisite. It is the item's accessible description, not part of its
   * name. Keep it to a short phrase.
   */
  description?: ReactNode | undefined;
  /**
   * Why the action is unavailable. It disables the item, which the arrow keys still reach and a
   * screen reader announces as unavailable, and shows the reason as the item's description line in
   * place of `description`. The reason stays readable on the disabled row. An empty string is no
   * reason.
   */
  disabledReason?: string | undefined;
  /**
   * The keys that run the same action from the page, written once for every platform: "Mod+E",
   * "Shift+D". They are drawn at the end of the item in the platform's glyphs and given to the item
   * as `aria-keyshortcuts`, so its name stays the label. Binding the keys stays with the caller.
   */
  shortcut?: string | undefined;
};

const isText = (node: unknown) => typeof node === "string" || typeof node === "number";

/** The label's own words, which typeahead matches, so the line under it never joins them. */
const labelText = (children: ReactNode) =>
  Children.toArray(children).filter(isText).join("").trim() || undefined;

/**
 * The children around their words: the leading content before the first text (an icon, an
 * avatar), the text itself, and whatever follows the last text (a shortcut, a count).
 */
function split(children: ReactNode) {
  const nodes = Children.toArray(children);
  const first = nodes.findIndex(isText);
  if (first < 0) return undefined;
  const last = nodes.length - 1 - [...nodes].reverse().findIndex(isText);
  return {
    lead: nodes.slice(0, first),
    text: nodes.slice(first, last + 1),
    trail: nodes.slice(last + 1),
  };
}

/** A label the menu's edge cuts short shows its whole text to a pointer resting on it. */
function revealWhole(event: PointerEvent<HTMLElement>) {
  const label = event.currentTarget;
  if (label.scrollWidth > label.clientWidth + 1) label.title = label.textContent ?? "";
  else label.removeAttribute("title");
}

function ItemLabel({ children }: { children: ReactNode }) {
  return (
    <span
      data-slot="dropdown-menu-item-label"
      className={menuItemLabel}
      onPointerEnter={revealWhole}
    >
      {children}
    </span>
  );
}

/**
 * An item's content: its words in one label that ends in an ellipsis where the menu meets the
 * window's edge, and, with a description, the label and the line under it in one column between
 * the leading content and the trailing content.
 */
function itemContent(children: ReactNode, line?: { node: ReactNode; id: string }) {
  const parts = split(children);
  if (!parts && !line) return children;
  const { lead, text, trail } = parts ?? { lead: [], text: Children.toArray(children), trail: [] };
  const label = parts ? <ItemLabel>{text}</ItemLabel> : <span>{text}</span>;
  return (
    <>
      {lead}
      {line ? (
        <Stack as="span" className="min-w-0 flex-1" data-slot="dropdown-menu-item-text">
          {label}
          {/* Hidden from the name; aria-describedby still reads it. */}
          <span
            id={line.id}
            aria-hidden
            data-slot="dropdown-menu-item-description"
            className={menuItemDescription}
          >
            {line.node}
          </span>
        </Stack>
      ) : (
        label
      )}
      {trail}
    </>
  );
}

export function DropdownMenuItem({
  className,
  inset,
  variant: variantProp = "default",
  description,
  disabledReason,
  shortcut,
  disabled,
  children,
  ...props
}: DropdownMenuItemProps) {
  const descriptionId = useId();
  const format = useFormatShortcut();
  const variant = variantProp === "destructive" ? "danger" : variantProp;
  const reason = disabledReason ? disabledReason : undefined;
  const line = reason ?? description;
  const hasLine = line !== undefined && line !== null && line !== false && line !== "";
  return (
    <MenuPrimitive.Item
      {...props}
      data-slot="dropdown-menu-item"
      data-inset={inset}
      data-variant={variant}
      className={classes(
        cn(
          itemClasses,
          // A disabled danger item fades like any other: the danger colour says it would run.
          "data-[variant=danger]:not-data-[disabled]:text-danger data-[variant=danger]:not-data-[disabled]:data-highlighted:bg-danger",
        ),
        className,
      )}
      label={props.label ?? (hasLine || shortcut ? labelText(children) : undefined)}
      disabled={Boolean(disabled || reason)}
      aria-describedby={
        hasLine
          ? [props["aria-describedby"], descriptionId].filter(Boolean).join(" ")
          : props["aria-describedby"]
      }
      aria-keyshortcuts={
        props["aria-keyshortcuts"] ?? (shortcut ? format(shortcut, "aria") : undefined)
      }
    >
      {itemContent(children, hasLine ? { node: line, id: descriptionId } : undefined)}
      {shortcut ? (
        <DropdownMenuShortcut>
          <KbdShortcut keys={shortcut} />
        </DropdownMenuShortcut>
      ) : null}
    </MenuPrimitive.Item>
  );
}

// Base UI's native link part preserves navigation semantics, including modified clicks.
export type DropdownMenuLinkItemProps = MenuPrimitive.LinkItem.Props & {
  inset?: boolean | undefined;
};
export function DropdownMenuLinkItem({
  className,
  inset,
  children,
  ...props
}: DropdownMenuLinkItemProps) {
  return (
    <MenuPrimitive.LinkItem
      {...props}
      data-slot="dropdown-menu-link-item"
      data-inset={inset}
      className={classes(itemClasses, className)}
    >
      {itemContent(children)}
    </MenuPrimitive.LinkItem>
  );
}

export type DropdownMenuSubProps = MenuPrimitive.SubmenuRoot.Props;
export function DropdownMenuSub(props: DropdownMenuSubProps) {
  return <MenuPrimitive.SubmenuRoot {...props} />;
}

export type DropdownMenuSubTriggerProps = MenuPrimitive.SubmenuTrigger.Props & {
  inset?: boolean | undefined;
};
export function DropdownMenuSubTrigger({
  className,
  inset,
  children,
  ...props
}: DropdownMenuSubTriggerProps) {
  return (
    <MenuPrimitive.SubmenuTrigger
      {...props}
      data-slot="dropdown-menu-sub-trigger"
      data-inset={inset}
      className={classes(cn(itemClasses, "data-popup-open:bg-neutral-subtle-hovered"), className)}
    >
      {itemContent(children)}
      <ChevronRight aria-hidden className="ms-auto rtl:rotate-180" />
    </MenuPrimitive.SubmenuTrigger>
  );
}

export type DropdownMenuSubContentProps = DropdownMenuContentProps;
export function DropdownMenuSubContent({
  align = "start",
  alignOffset = -3,
  side = "inline-end",
  sideOffset = 0,
  style,
  ...props
}: DropdownMenuSubContentProps) {
  const defaults = { width: "auto", minWidth: token("dimension.part.submenu") };
  return (
    <MenuContent
      {...props}
      slot="dropdown-menu-sub-content"
      align={align}
      alignOffset={alignOffset}
      side={side}
      sideOffset={sideOffset}
      style={
        typeof style === "function"
          ? (state) => ({ ...defaults, ...style(state) })
          : { ...defaults, ...style }
      }
    />
  );
}

export type DropdownMenuCheckboxItemProps = MenuPrimitive.CheckboxItem.Props & {
  inset?: boolean | undefined;
};
/** An option that is on or off, with a check at the end while it is on. Keep checkbox items in a labelled Group of their own, apart from actions, so an unchecked one does not read as an action. */
export function DropdownMenuCheckboxItem({
  className,
  children,
  inset,
  ...props
}: DropdownMenuCheckboxItemProps) {
  return (
    <MenuPrimitive.CheckboxItem
      {...props}
      data-slot="dropdown-menu-checkbox-item"
      data-inset={inset}
      className={classes(cn(itemClasses, "pe-500 data-checked:text-selected"), className)}
    >
      <span
        className="pointer-events-none absolute end-100 flex items-center"
        data-slot="dropdown-menu-checkbox-item-indicator"
      >
        <MenuPrimitive.CheckboxItemIndicator>
          <Check aria-hidden className="size-icon-small" />
        </MenuPrimitive.CheckboxItemIndicator>
      </span>
      {itemContent(children)}
    </MenuPrimitive.CheckboxItem>
  );
}

export type DropdownMenuRadioGroupProps = MenuPrimitive.RadioGroup.Props;
export function DropdownMenuRadioGroup(props: DropdownMenuRadioGroupProps) {
  return (
    <InGroup.Provider value>
      <MenuPrimitive.RadioGroup {...props} data-slot="dropdown-menu-radio-group" />
    </InGroup.Provider>
  );
}

export type DropdownMenuRadioItemProps = MenuPrimitive.RadioItem.Props & {
  inset?: boolean | undefined;
};
/** One of a RadioGroup's exclusive options, with a dot at the end on the chosen one: a check is a CheckboxItem's, which is on or off by itself. */
export function DropdownMenuRadioItem({
  className,
  children,
  inset,
  ...props
}: DropdownMenuRadioItemProps) {
  return (
    <MenuPrimitive.RadioItem
      {...props}
      data-slot="dropdown-menu-radio-item"
      data-inset={inset}
      className={classes(cn(itemClasses, "pe-500 data-checked:text-selected"), className)}
    >
      <span
        className="pointer-events-none absolute end-100 flex size-icon-small items-center justify-center"
        data-slot="dropdown-menu-radio-item-indicator"
      >
        <MenuPrimitive.RadioItemIndicator className="flex items-center">
          <Circle aria-hidden className="size-100 fill-current" />
        </MenuPrimitive.RadioItemIndicator>
      </span>
      {itemContent(children)}
    </MenuPrimitive.RadioItem>
  );
}

export type DropdownMenuSeparatorProps = MenuPrimitive.Separator.Props;
export function DropdownMenuSeparator({ className, ...props }: DropdownMenuSeparatorProps) {
  return (
    <MenuPrimitive.Separator
      {...props}
      data-slot="dropdown-menu-separator"
      className={classes(menuSeparator, className)}
    />
  );
}

export type DropdownMenuShortcutProps = ComponentProps<"span">;
/**
 * A shortcut's keys at the end of an item, hidden from assistive technology so the item's name is
 * its label: the item's `shortcut` prop draws one and says it as `aria-keyshortcuts`. Content at
 * the end that is not a shortcut, such as a count, passes `aria-hidden={false}`.
 */
export function DropdownMenuShortcut({ className, ...props }: DropdownMenuShortcutProps) {
  return (
    <span
      aria-hidden="true"
      {...props}
      data-slot="dropdown-menu-shortcut"
      className={cn("ms-auto shrink-0 font-body-xsmall text-subtle", className)}
    />
  );
}
