import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Command as CommandPrimitive, useCommandState } from "cmdk";
import { Search } from "lucide-react";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

import { cn } from "../lib/cn";
import { Kbd } from "./kbd";
import { menuItem, menuLabel, menuSeparator } from "./menu";

/* A list you filter from the keyboard: the ⌘K palette, a record picker, the search behind a
   Combobox. cmdk underneath for filtering, arrow keys, typeahead and aria; the kit owns the look. */

function CommandRoot({ className, ...props }: ComponentPropsWithoutRef<typeof CommandPrimitive>) {
  return (
    <CommandPrimitive
      className={cn(
        "flex h-full w-full flex-col overflow-hidden rounded-xxlarge bg-surface-overlay text-default",
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
}: ComponentPropsWithoutRef<typeof CommandPrimitive.Input> & { hint?: ReactNode }) {
  return (
    <div className="flex h-control-large shrink-0 items-center gap-100 border-b border-default px-150">
      <Search className="size-icon-medium shrink-0 icon-subtle" />
      <CommandPrimitive.Input
        className={cn(
          "h-full w-full bg-surface-overlay font-body text-default outline-none placeholder:text-subtlest disabled:cursor-not-allowed disabled:text-disabled",
          className,
        )}
        {...props}
      />
      {hint === undefined ? <Kbd>esc</Kbd> : hint}
    </div>
  );
}

function CommandList({
  className,
  ...props
}: ComponentPropsWithoutRef<typeof CommandPrimitive.List>) {
  return (
    <CommandPrimitive.List
      style={{ maxHeight: 340 }}
      className={cn("overflow-y-auto overflow-x-hidden p-075", className)}
      {...props}
    />
  );
}

function CommandEmpty({
  className,
  ...props
}: ComponentPropsWithoutRef<typeof CommandPrimitive.Empty>) {
  return (
    <CommandPrimitive.Empty
      className={cn("px-100 py-300 text-center font-body-small text-subtle", className)}
      {...props}
    />
  );
}

function CommandGroup({
  className,
  ...props
}: ComponentPropsWithoutRef<typeof CommandPrimitive.Group>) {
  return (
    <CommandPrimitive.Group
      className={cn(
        "[&_[cmdk-group-heading]]:px-100 [&_[cmdk-group-heading]]:pb-050 [&_[cmdk-group-heading]]:pt-100 [&_[cmdk-group-heading]]:font-heading-xxsmall [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:text-subtlest",
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
}: ComponentPropsWithoutRef<typeof CommandPrimitive.Item> & { trailing?: ReactNode }) {
  return (
    <CommandPrimitive.Item
      className={cn(
        menuItem,
        "h-control-medium",
        "data-[selected=true]:bg-selected data-[selected=true]:text-selected data-[disabled=true]:pointer-events-none data-[disabled=true]:text-disabled",
        className,
      )}
      {...props}
    >
      <span className="flex min-w-0 flex-1 items-center gap-100">{children}</span>
      {trailing ? <span className="shrink-0 font-body-xsmall text-subtle">{trailing}</span> : null}
    </CommandPrimitive.Item>
  );
}

/** A rule between groups. cmdk hides it when the groups beside it are filtered out; the role is presentational because a listbox may not contain a separator. */
function CommandSeparator() {
  return (
    <CommandPrimitive.Separator asChild>
      <div role="presentation" className={menuSeparator} />
    </CommandPrimitive.Separator>
  );
}

/** The hint row under the list: keys and what they do. */
function CommandFooter({ children }: { children: ReactNode }) {
  return (
    <div className="flex shrink-0 items-center gap-150 border-t border-default bg-surface-sunken px-150 py-100 font-body-xsmall text-subtle">
      {children}
    </div>
  );
}

/** "12 matches": reads the live filtered count. Renders inside a Command. */
function CommandCount({
  one = "match",
  many = "matches",
}: {
  one?: string | undefined;
  many?: string | undefined;
}) {
  const count = useCommandState((s) => s.filtered.count);
  return (
    <span className="shrink-0 font-body-xsmall text-subtle tabular-nums">
      {count} {count === 1 ? one : many}
    </span>
  );
}

const dialogWidths = { medium: 560, large: 640 } as const;

export type CommandDialogProps = Omit<ComponentPropsWithoutRef<typeof CommandPrimitive>, "label"> & {
  open: boolean;
  onClose: () => void;
  /** The dialog's name: the task, "Command palette", "Link evidence". */
  label: string;
  /** `medium` (560px) for a palette, `large` (640px) for a picker whose rows carry a meta line. */
  width?: keyof typeof dialogWidths | undefined;
};

/** The Command as an overlay: a Radix Dialog centred over the page near the top, at most `width` wide, closing on Escape and the blanket. */
function CommandDialog({
  open,
  onClose,
  label,
  width = "medium",
  className,
  children,
  ...props
}: CommandDialogProps) {
  return (
    <DialogPrimitive.Root
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-blanket data-[state=open]:animate-dim-in data-[state=closed]:animate-dim-out" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          style={{ maxWidth: dialogWidths[width] }}
          className="fixed inset-x-200 top-1000 z-50 mx-auto overflow-hidden rounded-xxlarge border border-default bg-surface-overlay shadow-overlay outline-none data-[state=open]:animate-dialog-in data-[state=closed]:animate-dialog-out"
        >
          <DialogPrimitive.Title className="sr-only">{label}</DialogPrimitive.Title>
          <CommandRoot label={label} className={className} {...props}>
            {children}
          </CommandRoot>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

export { menuLabel as commandLabel };
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
