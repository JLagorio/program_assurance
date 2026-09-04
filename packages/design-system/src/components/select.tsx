import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "../lib/cn";
import { controlBase, controlHeight, type ControlSize } from "./controls";
import {
  menuItem,
  menuItemDisabled,
  menuItemHighlighted,
  menuLabel,
  menuMotion,
  menuSeparator,
  menuSurface,
} from "./menu";

export type SelectProps = {
  /** The chosen value, controlled; pair it with `onValueChange`. */
  value?: string | undefined;
  /** The starting value when uncontrolled. */
  defaultValue?: string | undefined;
  /** Called with the new value when the reader chooses. */
  onValueChange?: ((value: string) => void) | undefined;
  /** What the field says with nothing chosen: "Choose a status". Never the label. */
  placeholder?: string | undefined;
  /** `medium` (32px) in a form; `small` (28px) in a toolbar, beside small Buttons. */
  size?: ControlSize | undefined;
  /** Not available. The last resort: a value the reader cannot change here is shown as text. */
  disabled?: boolean | undefined;
  /** The form field's name; a hidden input carries the value on submit. */
  name?: string | undefined;
  /** The name, when there is no Field around it. */
  "aria-label"?: string | undefined;
  /** Set by the Field from `error`; the border turns. */
  "aria-invalid"?: boolean | undefined;
  /** Set by the Field from `isRequired`. */
  "aria-required"?: boolean | undefined;
  /** Set by the Field: the hint or the error is the control's description. */
  "aria-describedby"?: string | undefined;
  /** The trigger's width in pixels, for a select in a toolbar beside others. In a form the column sets it. */
  width?: number | undefined;
  /** Layout only. */
  className?: string | undefined;
  /** `Select.Item`s, in `Select.Group`s with a `Select.Separator` between when the list has sections. */
  children: ReactNode;
};

/** One answer from a short, fixed list whose options mean more than their words: a status with its Dot, a kind with its Badge. For plain words, NativeSelect; for a list worth searching, Combobox. */
function SelectRoot({
  value,
  defaultValue,
  onValueChange,
  placeholder,
  size = "medium",
  disabled,
  name,
  "aria-label": ariaLabel,
  "aria-invalid": ariaInvalid,
  "aria-required": ariaRequired,
  "aria-describedby": ariaDescribedby,
  width,
  className,
  children,
}: SelectProps) {
  return (
    <SelectPrimitive.Root
      {...(value === undefined ? (defaultValue === undefined ? {} : { defaultValue }) : { value })}
      {...(onValueChange ? { onValueChange } : {})}
      {...(disabled ? { disabled } : {})}
      {...(name ? { name } : {})}
    >
      <SelectPrimitive.Trigger
        aria-label={ariaLabel}
        aria-invalid={ariaInvalid}
        aria-required={ariaRequired}
        aria-describedby={ariaDescribedby}
        className={cn(
          controlBase,
          controlHeight[size],
          "flex items-center justify-between gap-100 text-left data-[placeholder]:text-subtlest",
          className,
        )}
        style={width === undefined ? undefined : { width }}
      >
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
          style={{
            maxHeight: "var(--radix-select-content-available-height)",
            minWidth: "var(--radix-select-trigger-width)",
          }}
          className={cn(menuSurface, menuMotion)}
        >
          <SelectPrimitive.Viewport>{children}</SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}

export type SelectItemProps = {
  /** The value the Select reports. */
  value: string;
  /** A choice the reader cannot make yet, kept in the list so they know it exists. */
  disabled?: boolean | undefined;
  /** Layout only. */
  className?: string | undefined;
  /** The option's text, with a Dot or a Badge before it when the option is a status or a kind. */
  children: ReactNode;
};

function SelectItem({ value, disabled, className, children }: SelectItemProps) {
  return (
    <SelectPrimitive.Item
      value={value}
      {...(disabled ? { disabled } : {})}
      className={cn(
        menuItem,
        "relative pe-500",
        menuItemHighlighted,
        "data-[state=checked]:text-selected",
        menuItemDisabled,
        className,
      )}
    >
      <span className="flex min-w-0 flex-1 items-center gap-100 truncate">
        <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
      </span>
      <SelectPrimitive.ItemIndicator className="absolute end-100 flex items-center">
        <Check className="size-icon-small" />
      </SelectPrimitive.ItemIndicator>
    </SelectPrimitive.Item>
  );
}

export type SelectGroupProps = {
  /** The section's heading in the list, in the eyebrow style. */
  label: ReactNode;
  children: ReactNode;
};

function SelectGroup({ label, children }: SelectGroupProps) {
  return (
    <SelectPrimitive.Group>
      <SelectPrimitive.Label className={menuLabel}>{label}</SelectPrimitive.Label>
      {children}
    </SelectPrimitive.Group>
  );
}

/** A hairline between groups. */
function SelectSeparator() {
  return <SelectPrimitive.Separator className={menuSeparator} />;
}

export const Select = Object.assign(SelectRoot, {
  Item: SelectItem,
  Group: SelectGroup,
  Separator: SelectSeparator,
});
