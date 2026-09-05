import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { Check } from "lucide-react";
import { useState } from "react";
import type { ReactNode } from "react";

import { cn } from "../lib/cn";
import {
  menuItem,
  menuItemDisabled,
  menuItemHighlighted,
  menuLabel,
  menuMotion,
  menuSeparator,
  menuSurface,
} from "./menu";

export type DropdownMenuProps = {
  /** One element, usually a Button or an IconButton. It opens and closes the menu and carries the aria. The render form receives `open`; `toggle` is inert and kept for older call sites. */
  trigger: ReactNode | ((props: { open: boolean; toggle: () => void }) => ReactNode);
  /** `start` by default: the menu's edge flush with the trigger's. `end` for a kebab at the end of a row. */
  align?: "start" | "end" | undefined;
  /** The menu's width in pixels. 200 by default. */
  width?: number | undefined;
  /** Starts open. For a story. */
  defaultOpen?: boolean | undefined;
  /** Items, labels and separators; or a function of `close`, for an item that opens something else. */
  children: ReactNode | ((close: () => void) => ReactNode);
};

export type DropdownMenuItemProps = {
  /** The verb, or the option. */
  children: ReactNode;
  /** The item is the current choice: a menuitemcheckbox with the check at the end, as Select draws it. */
  isSelected?: boolean | undefined;
  disabled?: boolean | undefined;
  onSelect?: (() => void) | undefined;
  /** After the label: a Kbd, a count, a muted word. */
  trailing?: ReactNode;
  /** `false` keeps the menu open, for a list of toggles (which columns to show). */
  closeOnSelect?: boolean | undefined;
  /** `danger` for an action that removes or closes something; it sits last, under a separator. */
  tone?: "danger" | undefined;
};

/** A list of actions or options anchored to a trigger. Items take arrow keys, Home and End, typeahead and Escape; the menu closes when an item is chosen. */
function DropdownMenuRoot({
  trigger,
  align = "start",
  width = 200,
  defaultOpen = false,
  children,
}: DropdownMenuProps) {
  const [open, setOpen] = useState(defaultOpen);
  const close = () => setOpen(false);
  return (
    <DropdownMenuPrimitive.Root open={open} onOpenChange={setOpen}>
      <DropdownMenuPrimitive.Trigger asChild>
        {typeof trigger === "function" ? trigger({ open, toggle: () => undefined }) : trigger}
      </DropdownMenuPrimitive.Trigger>
      <DropdownMenuPrimitive.Portal>
        <DropdownMenuPrimitive.Content
          align={align}
          sideOffset={4}
          collisionPadding={8}
          style={{ width }}
          className={cn(menuSurface, menuMotion)}
        >
          {typeof children === "function" ? children(close) : children}
        </DropdownMenuPrimitive.Content>
      </DropdownMenuPrimitive.Portal>
    </DropdownMenuPrimitive.Root>
  );
}

/** One row of the menu. With `isSelected` it is a menuitemcheckbox and says so; with `tone="danger"` it is red. */
function DropdownMenuItem({
  children,
  isSelected,
  disabled,
  onSelect,
  trailing,
  closeOnSelect = true,
  tone,
}: DropdownMenuItemProps) {
  const className = cn(
    menuItem,
    menuItemHighlighted,
    menuItemDisabled,
    tone === "danger" && "text-danger data-[highlighted]:bg-danger",
    isSelected !== undefined && "relative pe-500 data-[state=checked]:text-selected",
  );
  const body = (
    <>
      <span className="min-w-0 flex-1 truncate">{children}</span>
      {trailing ? <span className="shrink-0 font-body-xsmall text-subtle">{trailing}</span> : null}
    </>
  );
  const select = (e: Event) => {
    if (!closeOnSelect) e.preventDefault();
    onSelect?.();
  };
  return isSelected !== undefined ? (
    <DropdownMenuPrimitive.CheckboxItem
      checked={isSelected}
      {...(disabled ? { disabled } : {})}
      onSelect={select}
      className={className}
    >
      {body}
      <DropdownMenuPrimitive.ItemIndicator className="absolute end-100 flex items-center">
        <Check className="size-icon-small" />
      </DropdownMenuPrimitive.ItemIndicator>
    </DropdownMenuPrimitive.CheckboxItem>
  ) : (
    <DropdownMenuPrimitive.Item
      {...(disabled ? { disabled } : {})}
      onSelect={select}
      className={className}
    >
      {body}
    </DropdownMenuPrimitive.Item>
  );
}

function DropdownMenuLabel({ children }: { children: ReactNode }) {
  return (
    <DropdownMenuPrimitive.Label className={menuLabel}>{children}</DropdownMenuPrimitive.Label>
  );
}

function DropdownMenuSeparator() {
  return <DropdownMenuPrimitive.Separator className={menuSeparator} />;
}

export const DropdownMenu = Object.assign(DropdownMenuRoot, {
  Item: DropdownMenuItem,
  Label: DropdownMenuLabel,
  Separator: DropdownMenuSeparator,
});
