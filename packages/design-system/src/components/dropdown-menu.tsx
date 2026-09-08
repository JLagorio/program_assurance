import { DirectionProvider, useDirection } from "@base-ui/react/direction-provider";
import { Menu as MenuPrimitive } from "@base-ui/react/menu";
import { Check, ChevronRight } from "lucide-react";
import type { ComponentProps } from "react";

import { classes } from "../lib/base-ui";
import { cn } from "../lib/cn";
import { useLedgerLocale } from "../lib/locale";
import { useOverlayContainer } from "./_overlay-focus";
import {
  menuItem,
  menuItemDisabled,
  menuItemHighlighted,
  menuLabel,
  menuSeparator,
  menuSurface,
} from "./menu";

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
  return <MenuPrimitive.Portal data-slot="dropdown-menu-portal" {...props} />;
}

export type DropdownMenuTriggerProps<Payload = unknown> = MenuPrimitive.Trigger.Props<Payload>;
export function DropdownMenuTrigger<Payload = unknown>(props: DropdownMenuTriggerProps<Payload>) {
  return <MenuPrimitive.Trigger data-slot="dropdown-menu-trigger" {...props} />;
}

export type DropdownMenuContentProps = MenuPrimitive.Popup.Props &
  Pick<MenuPrimitive.Positioner.Props, "align" | "alignOffset" | "side" | "sideOffset">;
export function DropdownMenuContent({
  align = "start",
  alignOffset = 0,
  side = "bottom",
  sideOffset = 4,
  className,
  style,
  dir,
  ...props
}: DropdownMenuContentProps) {
  const inheritedDirection = useDirection();
  const direction = dir === "ltr" || dir === "rtl" ? dir : inheritedDirection;
  const portal = useOverlayContainer();
  const defaults = {
    width: "var(--anchor-width)",
    minWidth: 128,
    maxWidth: "var(--available-width)",
    maxHeight: "var(--available-height)",
    transformOrigin: "var(--transform-origin)",
  };
  return (
    <DirectionProvider direction={direction}>
      <span hidden ref={portal.ref} />
      <DropdownMenuPortal container={portal.container}>
        <MenuPrimitive.Positioner
          align={align}
          alignOffset={alignOffset}
          side={side}
          sideOffset={sideOffset}
          positionMethod={portal.container ? "fixed" : undefined}
          className="isolate z-50 outline-none"
        >
          <MenuPrimitive.Popup
            data-slot="dropdown-menu-content"
            dir={dir ?? direction}
            className={classes(
              cn(
                menuSurface,
                "overflow-x-hidden overflow-y-auto data-open:animate-enter data-closed:animate-exit data-instant:animate-none motion-reduce:animate-none",
              ),
              className,
            )}
            style={
              typeof style === "function"
                ? (state) => ({ ...defaults, ...style(state) })
                : { ...defaults, ...style }
            }
            {...props}
          />
        </MenuPrimitive.Positioner>
      </DropdownMenuPortal>
    </DirectionProvider>
  );
}

export type DropdownMenuGroupProps = MenuPrimitive.Group.Props;
export function DropdownMenuGroup(props: DropdownMenuGroupProps) {
  return <MenuPrimitive.Group data-slot="dropdown-menu-group" {...props} />;
}

export type DropdownMenuLabelProps = MenuPrimitive.GroupLabel.Props & {
  inset?: boolean | undefined;
};
export function DropdownMenuLabel({ className, inset, ...props }: DropdownMenuLabelProps) {
  return (
    <MenuPrimitive.GroupLabel
      data-slot="dropdown-menu-label"
      data-inset={inset}
      className={classes(cn(menuLabel, "data-inset:ps-400"), className)}
      {...props}
    />
  );
}

const itemClasses = cn(
  menuItem,
  menuItemHighlighted,
  menuItemDisabled,
  "relative text-start data-inset:ps-400 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-icon-small",
);
export type DropdownMenuItemProps = MenuPrimitive.Item.Props & {
  inset?: boolean | undefined;
  variant?: "default" | "destructive" | undefined;
};
export function DropdownMenuItem({
  className,
  inset,
  variant = "default",
  ...props
}: DropdownMenuItemProps) {
  return (
    <MenuPrimitive.Item
      data-slot="dropdown-menu-item"
      data-inset={inset}
      data-variant={variant}
      className={classes(
        cn(
          itemClasses,
          "data-[variant=destructive]:text-danger data-[variant=destructive]:data-highlighted:bg-danger",
        ),
        className,
      )}
      {...props}
    />
  );
}

// Base UI's native link part preserves navigation semantics, including modified clicks.
export type DropdownMenuLinkItemProps = MenuPrimitive.LinkItem.Props & {
  inset?: boolean | undefined;
};
export function DropdownMenuLinkItem({ className, inset, ...props }: DropdownMenuLinkItemProps) {
  return (
    <MenuPrimitive.LinkItem
      data-slot="dropdown-menu-link-item"
      data-inset={inset}
      className={classes(itemClasses, className)}
      {...props}
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
      data-slot="dropdown-menu-sub-trigger"
      data-inset={inset}
      className={classes(cn(itemClasses, "data-popup-open:bg-neutral-subtle-hovered"), className)}
      {...props}
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
    <DropdownMenuContent
      data-slot="dropdown-menu-sub-content"
      align={align}
      alignOffset={alignOffset}
      side={side}
      sideOffset={sideOffset}
      style={
        typeof style === "function"
          ? (state) => ({ ...defaults, ...style(state) })
          : { ...defaults, ...style }
      }
      {...props}
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
      data-slot="dropdown-menu-checkbox-item"
      data-inset={inset}
      className={classes(cn(itemClasses, "pe-500 data-checked:text-selected"), className)}
      {...props}
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
  return <MenuPrimitive.RadioGroup data-slot="dropdown-menu-radio-group" {...props} />;
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
      data-slot="dropdown-menu-radio-item"
      data-inset={inset}
      className={classes(cn(itemClasses, "pe-500 data-checked:text-selected"), className)}
      {...props}
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
      data-slot="dropdown-menu-separator"
      className={classes(menuSeparator, className)}
      {...props}
    />
  );
}

export type DropdownMenuShortcutProps = ComponentProps<"span">;
export function DropdownMenuShortcut({ className, ...props }: DropdownMenuShortcutProps) {
  return (
    <span
      data-slot="dropdown-menu-shortcut"
      className={cn("ms-auto shrink-0 font-body-xsmall text-subtle", className)}
      {...props}
    />
  );
}
