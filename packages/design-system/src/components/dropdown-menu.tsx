import { DirectionProvider, useDirection } from "@base-ui/react/direction-provider";
import { Menu as MenuPrimitive } from "@base-ui/react/menu";
import { Check, ChevronRight } from "lucide-react";
import { Children, useId, type ComponentProps, type ReactNode } from "react";

import { classes } from "../lib/base-ui";
import { cn } from "../lib/cn";
import { useLedgerLocale } from "../lib/locale";
import { Stack } from "../primitives/stack";
import {
  menuItem,
  menuItemDescription,
  menuItemDisabled,
  menuItemHighlighted,
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
    minWidth: "min(var(--available-width), max(var(--anchor-width), 128px))",
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
          className="isolate z-50 outline-none"
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
                ? (state) => ({ ...defaults, ...style(state) })
                : { ...defaults, ...style }
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

export type DropdownMenuGroupProps = MenuPrimitive.Group.Props;
export function DropdownMenuGroup(props: DropdownMenuGroupProps) {
  return <MenuPrimitive.Group {...props} data-slot="dropdown-menu-group" />;
}

export type DropdownMenuLabelProps = MenuPrimitive.GroupLabel.Props & {
  inset?: boolean | undefined;
};
export function DropdownMenuLabel({ className, inset, ...props }: DropdownMenuLabelProps) {
  return (
    <MenuPrimitive.GroupLabel
      {...props}
      data-slot="dropdown-menu-label"
      data-inset={inset}
      className={classes(cn(menuLabel, "data-inset:ps-400"), className)}
    />
  );
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
  /** @deprecated `destructive` is `danger`, the word Button and RowAction use; `ledger/no-deprecated-name` fixes it. */
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
};

/**
 * With a description, the label and the line under it share one column, between the leading
 * content (an icon, an avatar) and the trailing content (a shortcut): the leading elements before
 * the first text, the text itself, and whatever follows the last text.
 */
const isText = (node: unknown) => typeof node === "string" || typeof node === "number";

/** The label's own words, which typeahead matches, so the line under it never joins them. */
const labelText = (children: ReactNode) =>
  Children.toArray(children).filter(isText).join("").trim() || undefined;

function withDescription(children: ReactNode, line: ReactNode, id: string) {
  const nodes = Children.toArray(children);
  const first = nodes.findIndex(isText);
  const last = nodes.length - 1 - [...nodes].reverse().findIndex(isText);
  const [lead, text, trail] =
    first < 0
      ? [[], nodes, []]
      : [nodes.slice(0, first), nodes.slice(first, last + 1), nodes.slice(last + 1)];
  return (
    <>
      {lead}
      <Stack as="span" className="min-w-0 flex-1" data-slot="dropdown-menu-item-text">
        <span>{text}</span>
        {/* Hidden from the name; aria-describedby still reads it. */}
        <span
          id={id}
          aria-hidden
          data-slot="dropdown-menu-item-description"
          className={menuItemDescription}
        >
          {line}
        </span>
      </Stack>
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
  disabled,
  children,
  ...props
}: DropdownMenuItemProps) {
  const descriptionId = useId();
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
      label={props.label ?? (hasLine ? labelText(children) : undefined)}
      disabled={Boolean(disabled || reason)}
      aria-describedby={
        hasLine
          ? [props["aria-describedby"], descriptionId].filter(Boolean).join(" ")
          : props["aria-describedby"]
      }
    >
      {hasLine ? withDescription(children, line, descriptionId) : children}
    </MenuPrimitive.Item>
  );
}

// Base UI's native link part preserves navigation semantics, including modified clicks.
export type DropdownMenuLinkItemProps = MenuPrimitive.LinkItem.Props & {
  inset?: boolean | undefined;
};
export function DropdownMenuLinkItem({ className, inset, ...props }: DropdownMenuLinkItemProps) {
  return (
    <MenuPrimitive.LinkItem
      {...props}
      data-slot="dropdown-menu-link-item"
      data-inset={inset}
      className={classes(itemClasses, className)}
    />
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
      {children}
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
  const defaults = { width: "auto", minWidth: 96 };
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
      {children}
    </MenuPrimitive.CheckboxItem>
  );
}

export type DropdownMenuRadioGroupProps = MenuPrimitive.RadioGroup.Props;
export function DropdownMenuRadioGroup(props: DropdownMenuRadioGroupProps) {
  return <MenuPrimitive.RadioGroup {...props} data-slot="dropdown-menu-radio-group" />;
}

export type DropdownMenuRadioItemProps = MenuPrimitive.RadioItem.Props & {
  inset?: boolean | undefined;
};
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
        className="pointer-events-none absolute end-100 flex items-center"
        data-slot="dropdown-menu-radio-item-indicator"
      >
        <MenuPrimitive.RadioItemIndicator>
          <Check aria-hidden className="size-icon-small" />
        </MenuPrimitive.RadioItemIndicator>
      </span>
      {children}
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
export function DropdownMenuShortcut({ className, ...props }: DropdownMenuShortcutProps) {
  return (
    <span
      {...props}
      data-slot="dropdown-menu-shortcut"
      className={cn("ms-auto shrink-0 font-body-xsmall text-subtle", className)}
    />
  );
}
