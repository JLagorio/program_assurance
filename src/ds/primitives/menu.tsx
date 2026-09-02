import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { useState } from "react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

const noop = () => {};

/* A list of actions or options anchored to a trigger. The trigger element opens
   and closes the menu itself (pointer, Enter, Space, ArrowDown) and carries
   aria-haspopup, aria-expanded and data-state; items take arrow keys, Home and
   End, typeahead and Escape. `toggle` in the trigger render prop is inert: it
   stays so existing triggers that wire it to onClick keep compiling. */
function MenuRoot({
  trigger,
  align = "start",
  width = 200,
  defaultOpen = false,
  children,
}: {
  trigger: (props: { open: boolean; toggle: () => void }) => ReactNode;
  align?: "start" | "end";
  width?: number;
  defaultOpen?: boolean;
  children: (close: () => void) => ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <DropdownMenu.Root open={open} onOpenChange={setOpen}>
      <DropdownMenu.Trigger asChild>{trigger({ open, toggle: noop })}</DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align={align}
          sideOffset={4}
          collisionPadding={8}
          style={{ width }}
          className={cn(
            "z-50 overflow-hidden rounded-lg border border-border bg-popover p-1 shadow-pop outline-none",
            "animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0",
          )}
        >
          {children(() => setOpen(false))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

function MenuItem({
  children,
  selected,
  onSelect,
  trailing,
}: {
  children: ReactNode;
  selected?: boolean;
  onSelect?: () => void;
  trailing?: ReactNode;
}) {
  return (
    <DropdownMenu.Item
      onSelect={() => onSelect?.()}
      className={cn(
        "flex h-7 w-full cursor-default select-none items-center gap-2 rounded-md px-2 text-left text-13 outline-none transition-colors duration-100",
        selected
          ? "bg-primary-soft text-primary"
          : "text-foreground data-[highlighted]:bg-surface-hover",
      )}
    >
      <span className="min-w-0 flex-1 truncate">{children}</span>
      {trailing ? <span className="shrink-0 text-11 text-muted-foreground">{trailing}</span> : null}
    </DropdownMenu.Item>
  );
}

function MenuLabel({ children }: { children: ReactNode }) {
  return (
    <DropdownMenu.Label className="px-2 pb-1 pt-1.5 text-11 font-medium uppercase tracking-[0.06em] text-muted-foreground">
      {children}
    </DropdownMenu.Label>
  );
}

export const Menu = Object.assign(MenuRoot, { Item: MenuItem, Label: MenuLabel });
