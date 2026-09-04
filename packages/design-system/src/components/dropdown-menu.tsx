import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { useState } from "react";
import type { ReactNode } from "react";

import { cn } from "../lib/cn";
import {
  menuItem,
  menuItemDisabled,
  menuItemHighlighted,
  menuItemSelected,
  menuLabel,
  menuMotion,
  menuSeparator,
  menuSurface,
} from "./menu";

export type DropdownMenuProps = {
  /** One element, usually a Button. It opens and closes the menu and carries the aria. The render form receives `open`; `toggle` is inert and kept for older call sites. */
  trigger: ReactNode | ((props: { open: boolean; toggle: () => void }) => ReactNode);
  align?: "start" | "end" | undefined;
  width?: number | undefined;
  defaultOpen?: boolean | undefined;
  children: ReactNode | ((close: () => void) => ReactNode);
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

/** `closeOnSelect: false` keeps the menu open, for a list of toggles (which columns to show). */
function DropdownMenuItem({
  children,
  isSelected,
  disabled,
  onSelect,
  trailing,
  closeOnSelect = true,
}: {
  children: ReactNode;
  isSelected?: boolean | undefined;
  disabled?: boolean | undefined;
  onSelect?: (() => void) | undefined;
  trailing?: ReactNode;
  closeOnSelect?: boolean | undefined;
}) {
  return (
    <DropdownMenuPrimitive.Item
      {...(disabled ? { disabled } : {})}
      onSelect={(e) => {
        if (!closeOnSelect) e.preventDefault();
        onSelect?.();
      }}
      className={cn(
        menuItem,
        isSelected ? menuItemSelected : menuItemHighlighted,
        menuItemDisabled,
      )}
    >
      <span className="min-w-0 flex-1 truncate">{children}</span>
      {trailing ? <span className="shrink-0 font-body-xsmall text-subtle">{trailing}</span> : null}
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
