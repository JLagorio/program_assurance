import { Command as CommandPrimitive, useCommandState } from "cmdk";
import { Search } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/lib/utils";

import { Kbd } from "./kbd";

/* A list you filter from the keyboard: the ⌘K palette, a record picker, the
   search behind a Combobox. cmdk underneath for filtering, arrow keys,
   typeahead and aria; the kit owns the look. Compose it: Input, List, Group,
   Item, Empty, Separator, a Footer of hints, and Dialog for the overlay form. */
function CommandRoot({ className, ...props }: ComponentProps<typeof CommandPrimitive>) {
  return (
    <CommandPrimitive
      className={cn(
        "flex h-full w-full flex-col overflow-hidden rounded-xl bg-popover text-popover-foreground",
        className,
      )}
      {...props}
    />
  );
}

function CommandInput({
  className,
  hint,
  ...props
}: ComponentProps<typeof CommandPrimitive.Input> & { hint?: ReactNode }) {
  return (
    <div className="flex h-11 shrink-0 items-center gap-2 border-b border-border px-3.5">
      <Search className="size-4 shrink-0 text-muted-foreground" />
      <CommandPrimitive.Input
        className={cn(
          "h-full w-full bg-transparent text-[13px] text-foreground outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        {...props}
      />
      {hint === undefined ? <Kbd>esc</Kbd> : hint}
    </div>
  );
}

function CommandList({ className, ...props }: ComponentProps<typeof CommandPrimitive.List>) {
  return (
    <CommandPrimitive.List
      className={cn("max-h-[340px] overflow-y-auto overflow-x-hidden p-1.5", className)}
      {...props}
    />
  );
}

function CommandEmpty({ className, ...props }: ComponentProps<typeof CommandPrimitive.Empty>) {
  return (
    <CommandPrimitive.Empty
      className={cn("px-2 py-6 text-center text-12 text-muted-foreground", className)}
      {...props}
    />
  );
}

function CommandGroup({ className, ...props }: ComponentProps<typeof CommandPrimitive.Group>) {
  return (
    <CommandPrimitive.Group
      className={cn(
        "[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:pt-2 [&_[cmdk-group-heading]]:text-11 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.06em] [&_[cmdk-group-heading]]:text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

function CommandItem({
  className,
  trailing,
  children,
  ...props
}: ComponentProps<typeof CommandPrimitive.Item> & { trailing?: ReactNode }) {
  return (
    <CommandPrimitive.Item
      className={cn(
        "flex h-8 w-full cursor-default select-none items-center gap-2 rounded-md px-2 text-left text-13 text-foreground outline-none transition-colors duration-100",
        "data-[selected=true]:bg-primary-soft data-[selected=true]:text-primary data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50",
        className,
      )}
      {...props}
    >
      <span className="flex min-w-0 flex-1 items-center gap-2">{children}</span>
      {trailing ? <span className="shrink-0 text-11 text-muted-foreground">{trailing}</span> : null}
    </CommandPrimitive.Item>
  );
}

function CommandSeparator() {
  return <CommandPrimitive.Separator className="-mx-1.5 my-1 h-px bg-border" />;
}

/** The hint row under the list: keys and what they do. */
function CommandFooter({ children }: { children: ReactNode }) {
  return (
    <div className="flex shrink-0 items-center gap-3 border-t border-border bg-subtle px-3.5 py-2 text-[11px] text-muted-foreground">
      {children}
    </div>
  );
}

/** "12 matches" — reads the live filtered count. Renders inside a Command. */
function CommandCount({ one = "match", many = "matches" }: { one?: string; many?: string }) {
  const count = useCommandState((s) => s.filtered.count);
  return (
    <span className="tnum shrink-0 text-[11px] text-muted-foreground">
      {count} {count === 1 ? one : many}
    </span>
  );
}

/* The Command as an overlay: opens over the page at the top, closes on Escape
   and the scrim. `label` names it for assistive tech. */
function CommandDialog({
  open,
  onClose,
  label,
  width = "md",
  className,
  children,
  ...props
}: Omit<ComponentProps<typeof CommandPrimitive.Dialog>, "open" | "onOpenChange" | "label"> & {
  open: boolean;
  onClose: () => void;
  label: string;
  width?: "md" | "lg";
}) {
  return (
    <CommandPrimitive.Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      label={label}
      overlayClassName="fixed inset-0 z-50 bg-foreground/25 backdrop-blur-[1px] animate-in fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0"
      contentClassName={cn(
        "fixed left-1/2 top-[12vh] z-50 w-[calc(100%-32px)] -translate-x-1/2 overflow-hidden rounded-xl border border-border bg-popover shadow-pop outline-none",
        "animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0",
        width === "lg" ? "max-w-[640px]" : "max-w-[560px]",
      )}
      className={cn("rounded-xl", className)}
      {...props}
    >
      {children}
    </CommandPrimitive.Dialog>
  );
}

export const Command = Object.assign(CommandRoot, {
  Input: CommandInput,
  List: CommandList,
  Empty: CommandEmpty,
  Group: CommandGroup,
  Item: CommandItem,
  Separator: CommandSeparator,
  Footer: CommandFooter,
  Count: CommandCount,
  Dialog: CommandDialog,
});
