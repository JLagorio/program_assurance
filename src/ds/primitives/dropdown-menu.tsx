import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { useState } from "react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

const noop = () => {};

/* A list of actions or options anchored to a trigger. The trigger is one
   element (a Button, usually); it opens and closes the menu itself (pointer,
   Enter, Space, ArrowDown) and carries aria-haspopup, aria-expanded and
   data-state. Items take arrow keys, Home and End, typeahead and Escape, and
   the menu closes when an item is chosen.

   `trigger` and `children` also accept the older render-prop forms —
   `trigger={({ open }) => …}` and `{(close) => …}` — so existing call sites
   keep compiling. `toggle` in the trigger render prop is inert. */
function DropdownMenuRoot({
  trigger,
  align = "start",
  width = 200,
  defaultOpen = false,
  children,
}: {
  trigger: ReactNode | ((props: { open: boolean; toggle: () => void }) => ReactNode);
  align?: "start" | "end";
  width?: number;
  defaultOpen?: boolean;
  children: ReactNode | ((close: () => void) => ReactNode);
}) {
  const [open, setOpen] = useState(defaultOpen);
  const close = () => setOpen(false);
  return (
    <DropdownMenuPrimitive.Root open={open} onOpenChange={setOpen}>
      <DropdownMenuPrimitive.Trigger asChild>
        {typeof trigger === "function" ? trigger({ open, toggle: noop }) : trigger}
      </DropdownMenuPrimitive.Trigger>
      <DropdownMenuPrimitive.Portal>
        <DropdownMenuPrimitive.Content
          align={align}
          sideOffset={4}
          collisionPadding={8}
          style={{ width }}
          className={cn(
            "z-50 overflow-hidden rounded-lg border border-border bg-popover p-1 shadow-pop outline-none",
            "animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0",
          )}
        >
          {typeof children === "function" ? children(close) : children}
        </DropdownMenuPrimitive.Content>
      </DropdownMenuPrimitive.Portal>
    </DropdownMenuPrimitive.Root>
  );
}

function DropdownMenuItem({
  children,
  selected,
  disabled,
  onSelect,
  trailing,
}: {
  children: ReactNode;
  selected?: boolean;
  disabled?: boolean;
  onSelect?: () => void;
  trailing?: ReactNode;
}) {
  return (
    <DropdownMenuPrimitive.Item
      {...(disabled ? { disabled } : {})}
      onSelect={() => onSelect?.()}
      className={cn(
        "flex h-7 w-full cursor-default select-none items-center gap-2 rounded-md px-2 text-left text-13 outline-none transition-colors duration-100",
        selected
          ? "bg-primary-soft text-primary"
          : "text-foreground data-[highlighted]:bg-surface-hover",
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      )}
    >
      <span className="min-w-0 flex-1 truncate">{children}</span>
      {trailing ? <span className="shrink-0 text-11 text-muted-foreground">{trailing}</span> : null}
    </DropdownMenuPrimitive.Item>
  );
}

function DropdownMenuLabel({ children }: { children: ReactNode }) {
  return (
    <DropdownMenuPrimitive.Label className="px-2 pb-1 pt-1.5 text-11 font-medium uppercase tracking-[0.06em] text-muted-foreground">
      {children}
    </DropdownMenuPrimitive.Label>
  );
}

function DropdownMenuSeparator() {
  return <DropdownMenuPrimitive.Separator className="-mx-1 my-1 h-px bg-border" />;
}

export const DropdownMenu = Object.assign(DropdownMenuRoot, {
  Item: DropdownMenuItem,
  Label: DropdownMenuLabel,
  Separator: DropdownMenuSeparator,
});
