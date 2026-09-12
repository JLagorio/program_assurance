import { Command as CommandPrimitive, useCommandState } from "cmdk";
import { Search } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { useLedgerLocale } from "../lib/locale";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  type DialogContentProps,
  type DialogProps,
} from "./dialog";

import { cn } from "../lib/cn";
import { Kbd } from "./kbd";
import { menuItem, menuSeparator } from "./menu";
import { Spinner } from "./spinner";

/* A list the reader filters from the keyboard: the ⌘K palette, a record picker, the search behind
   a Combobox. cmdk underneath for the filtering, the arrow keys, the typeahead and the roles; the
   kit owns the look, which is the floating list's, so a palette's row and a menu's row are one row. */

export function Command({ className, ...props }: ComponentProps<typeof CommandPrimitive>) {
  return (
    <CommandPrimitive
      data-slot="command"
      className={cn(
        "flex h-full w-full flex-col overflow-hidden rounded-xxlarge bg-surface-overlay text-default",
        className,
      )}
      {...props}
    />
  );
}

/** The field at the top: a search icon, the input, and at the end a hint, `esc` by default; `null` for none, a `CommandCount` for a picker. */
export function CommandInput({
  className,
  hint,
  ...props
}: ComponentProps<typeof CommandPrimitive.Input> & { hint?: ReactNode }) {
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
export function CommandList({ className, ...props }: ComponentProps<typeof CommandPrimitive.List>) {
  return (
    <CommandPrimitive.List
      style={{ maxHeight: 340 }}
      className={cn("overflow-y-auto overflow-x-hidden overscroll-none p-075", className)}
      {...props}
    />
  );
}

/** What the list says when nothing matches the query. cmdk shows it only then. */
export function CommandEmpty({
  className,
  ...props
}: ComponentProps<typeof CommandPrimitive.Empty>) {
  return (
    <CommandPrimitive.Empty
      className={cn("px-100 py-300 text-center font-body-small text-subtle", className)}
      {...props}
    />
  );
}

/** Place alongside CommandList while rows are fetched: the kit's Spinner and a word. cmdk marks it a progressbar named by `label`. */
export function CommandLoading({
  label,
  className,
  children,
  ...props
}: ComponentProps<typeof CommandPrimitive.Loading>) {
  const { t } = useLedgerLocale();
  return (
    <CommandPrimitive.Loading
      label={label ?? t("loading")}
      className={cn(
        "flex items-center justify-center gap-100 px-100 py-300 font-body-small text-subtle",
        className,
      )}
      {...props}
    >
      <span className="flex items-center justify-center gap-100">
        <Spinner size="small" />
        <span>{children ?? t("search")}</span>
      </span>
    </CommandPrimitive.Loading>
  );
}

/** Rows under a heading; the heading goes when every row under it is filtered out. */
export function CommandGroup({
  className,
  ...props
}: ComponentProps<typeof CommandPrimitive.Group>) {
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

/** One row: the label, an icon before it if the rows are of kinds, and children such as CommandShortcut at the end. The row under the cursor tints as a menu's does. */
export function CommandItem({
  className,
  children,
  ...props
}: ComponentProps<typeof CommandPrimitive.Item>) {
  return (
    <CommandPrimitive.Item
      className={cn(
        menuItem,
        "min-h-control-medium",
        "data-[selected=true]:bg-neutral-subtle-hovered data-[disabled=true]:pointer-events-none data-[disabled=true]:text-disabled",
        className,
      )}
      {...props}
    >
      {children}
    </CommandPrimitive.Item>
  );
}

/** A rule between groups. cmdk hides it when the groups beside it are filtered out; the role is presentational because a listbox may not contain a separator. */
export function CommandSeparator({
  className,
  ...props
}: ComponentProps<typeof CommandPrimitive.Separator>) {
  return (
    <CommandPrimitive.Separator {...props} asChild>
      <div role="presentation" className={cn(menuSeparator, className)} />
    </CommandPrimitive.Separator>
  );
}

/** The hint row under the list: keys and what they do, and the count at the end. */
export function CommandFooter({ children }: { children: ReactNode }) {
  return (
    <div className="flex shrink-0 items-center gap-150 border-t border-default bg-surface-sunken px-150 py-100 font-body-xsmall text-subtle">
      {children}
    </div>
  );
}

/** "12 matches": the live count of rows that match. Renders inside a Command, in the field's hint or the footer. */
export function CommandCount({
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

export type CommandDialogProps<Payload = unknown> = Omit<DialogProps<Payload>, "children"> & {
  title?: string | undefined;
  description?: string | undefined;
  className?: string | undefined;
  showCloseButton?: boolean | undefined;
  finalFocus?: DialogContentProps["finalFocus"];
  style?: DialogContentProps["style"];
  children: ReactNode;
};
export function CommandDialog<Payload = unknown>({
  title = "Command palette",
  description = "Search for a command to run.",
  className,
  showCloseButton = false,
  finalFocus,
  style,
  children,
  ...props
}: CommandDialogProps<Payload>) {
  return (
    <Dialog {...props}>
      <DialogContent
        className={cn("top-1000 translate-y-0", className)}
        style={
          typeof style === "function"
            ? (state) => ({ maxWidth: 560, ...style(state) })
            : { maxWidth: 560, ...style }
        }
        showCloseButton={showCloseButton}
        finalFocus={finalFocus}
      >
        <DialogHeader className="sr-only">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}
export type CommandShortcutProps = ComponentProps<"span">;
export function CommandShortcut({ className, ...props }: CommandShortcutProps) {
  return (
    <span
      data-slot="command-shortcut"
      className={cn("ms-auto shrink-0 font-body-xsmall text-subtle", className)}
      {...props}
    />
  );
}
