import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Command as CommandPrimitive, useCommandState } from "cmdk";
import { Search } from "lucide-react";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

import { cn } from "../lib/cn";
import { Kbd } from "./kbd";
import { menuItem, menuSeparator } from "./menu";
import { Spinner } from "./spinner";

/* A list the reader filters from the keyboard: the ⌘K palette, a record picker, the search behind
   a Combobox. cmdk underneath for the filtering, the arrow keys, the typeahead and the roles; the
   kit owns the look, which is the floating list's, so a palette's row and a menu's row are one row. */

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

/** The field at the top: a search icon, the input, and at the end a hint, `esc` by default; `null` for none, a `Command.Count` for a picker. */
function CommandInput({
  className,
  hint,
  ...props
}: ComponentPropsWithoutRef<typeof CommandPrimitive.Input> & { hint?: ReactNode }) {
  return (
    <div className="flex h-control-large shrink-0 items-center gap-100 border-b border-default px-150">
      <Search aria-hidden className="size-icon-medium shrink-0 icon-subtle" />
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

/** The rows, scrolling inside themselves past 340px; pass `style` for another cap. */
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

/** What the list says when nothing matches the query. cmdk shows it only then. */
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

/** The row shown while the rows are fetched: the kit's Spinner and a word. cmdk marks it a progressbar named by `label`. */
function CommandLoading({
  label = "Loading",
  className,
  children = "Searching…",
  ...props
}: ComponentPropsWithoutRef<typeof CommandPrimitive.Loading>) {
  return (
    <CommandPrimitive.Loading
      label={label}
      className={cn(
        "flex items-center justify-center gap-100 px-100 py-300 font-body-small text-subtle",
        className,
      )}
      {...props}
    >
      <span className="flex items-center justify-center gap-100">
        <Spinner size="small" />
        <span>{children}</span>
      </span>
    </CommandPrimitive.Loading>
  );
}

/** Rows under a heading; the heading goes when every row under it is filtered out. */
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

/** One row: the label, an icon before it if the rows are of kinds, and `trailing` at the end for a shortcut, a hint or a state. The row under the cursor tints as a menu's does. */
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
        "data-[selected=true]:bg-neutral-subtle-hovered data-[disabled=true]:pointer-events-none data-[disabled=true]:text-disabled",
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

/** The hint row under the list: keys and what they do, and the count at the end. */
function CommandFooter({ children }: { children: ReactNode }) {
  return (
    <div className="flex shrink-0 items-center gap-150 border-t border-default bg-surface-sunken px-150 py-100 font-body-xsmall text-subtle">
      {children}
    </div>
  );
}

/** "12 matches": the live count of rows that match. Renders inside a Command, in the field's hint or the footer. */
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

export type CommandDialogProps = Omit<
  ComponentPropsWithoutRef<typeof CommandPrimitive>,
  "label"
> & {
  open: boolean;
  onClose: () => void;
  /** The dialog's name: the task, "Command palette", "Link evidence". */
  label: string;
  /** `medium` (560px) for a palette, `large` (640px) for a picker whose rows carry a meta line. */
  width?: keyof typeof dialogWidths | undefined;
};

/** The Command as an overlay: a dialog near the top of the page, at most `width` wide, gone on Escape, the blanket or a choice. */
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

export const Command = Object.assign(CommandRoot, {
  Input: CommandInput,
  List: CommandList,
  Empty: CommandEmpty,
  Loading: CommandLoading,
  Group: CommandGroup,
  Item: CommandItem,
  Separator: CommandSeparator,
  Footer: CommandFooter,
  Count: CommandCount,
  Dialog: CommandDialog,
});
