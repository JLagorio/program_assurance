import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import { controlBase } from "./controls";

/* A choice from a short, fixed list, with options that can carry a Dot or a
   Badge. Radix underneath for typeahead, arrow keys and aria; the trigger is
   the hairline control. For a plain list the browser's own NativeSelect is
   lighter; for a list worth searching, Combobox. */
function SelectRoot({
  value,
  defaultValue,
  onValueChange,
  placeholder,
  disabled,
  name,
  "aria-label": ariaLabel,
  className,
  children,
}: {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  name?: string;
  "aria-label"?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <SelectPrimitive.Root
      {...(value === undefined ? (defaultValue === undefined ? {} : { defaultValue }) : { value })}
      {...(onValueChange ? { onValueChange } : {})}
      {...(disabled ? { disabled } : {})}
      {...(name ? { name } : {})}
    >
      <SelectPrimitive.Trigger
        aria-label={ariaLabel}
        className={cn(
          controlBase,
          "flex items-center justify-between gap-2 text-left data-[placeholder]:text-muted-foreground",
          className,
        )}
      >
        <span className="min-w-0 flex-1 truncate">
          <SelectPrimitive.Value placeholder={placeholder} />
        </span>
        <SelectPrimitive.Icon asChild>
          <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          position="popper"
          sideOffset={4}
          collisionPadding={8}
          className={cn(
            "z-50 max-h-[var(--radix-select-content-available-height)] min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-lg border border-border bg-popover p-1 shadow-pop",
            "animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0",
          )}
        >
          <SelectPrimitive.Viewport>{children}</SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}

function SelectItem({
  value,
  disabled,
  className,
  children,
}: {
  value: string;
  disabled?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <SelectPrimitive.Item
      value={value}
      {...(disabled ? { disabled } : {})}
      className={cn(
        "relative flex h-7 w-full cursor-default select-none items-center rounded-md pl-2 pr-7 text-13 text-foreground outline-none transition-colors duration-100",
        "data-[highlighted]:bg-surface-hover data-[state=checked]:text-primary data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className,
      )}
    >
      <span className="flex min-w-0 flex-1 items-center gap-2 truncate">
        <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
      </span>
      <SelectPrimitive.ItemIndicator className="absolute right-2 flex items-center">
        <Check className="size-3.5" />
      </SelectPrimitive.ItemIndicator>
    </SelectPrimitive.Item>
  );
}

function SelectGroup({ label, children }: { label: ReactNode; children: ReactNode }) {
  return (
    <SelectPrimitive.Group>
      <SelectPrimitive.Label className="px-2 pb-1 pt-1.5 text-11 font-medium uppercase tracking-[0.06em] text-muted-foreground">
        {label}
      </SelectPrimitive.Label>
      {children}
    </SelectPrimitive.Group>
  );
}

function SelectSeparator() {
  return <SelectPrimitive.Separator className="-mx-1 my-1 h-px bg-border" />;
}

export const Select = Object.assign(SelectRoot, {
  Item: SelectItem,
  Group: SelectGroup,
  Separator: SelectSeparator,
});
