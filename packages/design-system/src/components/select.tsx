import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "../lib/cn";
import { controlBase } from "./controls";
import { menuItem, menuItemDisabled, menuItemHighlighted, menuLabel, menuMotion, menuSeparator, menuSurface } from "./menu";

export type SelectProps = {
  value?: string | undefined;
  defaultValue?: string | undefined;
  onValueChange?: ((value: string) => void) | undefined;
  placeholder?: string | undefined;
  disabled?: boolean | undefined;
  name?: string | undefined;
  "aria-label"?: string | undefined;
  /** The trigger's width in pixels, for a select that sits in a toolbar beside others. */
  width?: number | undefined;
  className?: string | undefined;
  children: ReactNode;
};

/** A choice from a short, fixed list, with options that can carry a Dot or a Badge. For a plain list, NativeSelect; for a list worth searching, Combobox. */
function SelectRoot({ value, defaultValue, onValueChange, placeholder, disabled, name, "aria-label": ariaLabel, width, className, children }: SelectProps) {
  return (
    <SelectPrimitive.Root
      {...(value === undefined ? (defaultValue === undefined ? {} : { defaultValue }) : { value })}
      {...(onValueChange ? { onValueChange } : {})}
      {...(disabled ? { disabled } : {})}
      {...(name ? { name } : {})}
    >
      <SelectPrimitive.Trigger aria-label={ariaLabel} className={cn(controlBase, "flex items-center justify-between gap-100 text-left data-[placeholder]:text-subtlest", className)} style={width === undefined ? undefined : { width }}>
        <span className="min-w-0 flex-1 truncate">
          <SelectPrimitive.Value placeholder={placeholder} />
        </span>
        <SelectPrimitive.Icon asChild>
          <ChevronDown className="size-icon-small shrink-0 icon-subtle" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          position="popper"
          sideOffset={4}
          collisionPadding={8}
          style={{ maxHeight: "var(--radix-select-content-available-height)", minWidth: "var(--radix-select-trigger-width)" }}
          className={cn(menuSurface, menuMotion)}
        >
          <SelectPrimitive.Viewport>{children}</SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}

function SelectItem({ value, disabled, className, children }: { value: string; disabled?: boolean | undefined; className?: string | undefined; children: ReactNode }) {
  return (
    <SelectPrimitive.Item value={value} {...(disabled ? { disabled } : {})} className={cn(menuItem, "relative pe-500", menuItemHighlighted, "data-[state=checked]:text-selected", menuItemDisabled, className)}>
      <span className="flex min-w-0 flex-1 items-center gap-100 truncate">
        <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
      </span>
      <SelectPrimitive.ItemIndicator className="absolute end-100 flex items-center">
        <Check className="size-icon-small" />
      </SelectPrimitive.ItemIndicator>
    </SelectPrimitive.Item>
  );
}

function SelectGroup({ label, children }: { label: ReactNode; children: ReactNode }) {
  return (
    <SelectPrimitive.Group>
      <SelectPrimitive.Label className={menuLabel}>{label}</SelectPrimitive.Label>
      {children}
    </SelectPrimitive.Group>
  );
}

function SelectSeparator() {
  return <SelectPrimitive.Separator className={menuSeparator} />;
}

export const Select = Object.assign(SelectRoot, { Item: SelectItem, Group: SelectGroup, Separator: SelectSeparator });
