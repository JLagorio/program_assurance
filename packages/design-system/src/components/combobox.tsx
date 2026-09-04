import { Check, ChevronsUpDown } from "lucide-react";
import { useState } from "react";
import type { ReactNode } from "react";

import { cn } from "../lib/cn";
import { Command } from "./command";
import { controlBase, controlHeight } from "./controls";
import { Popover } from "./popover";

export type ComboboxOption = {
  value: string;
  label: string;
  /** Extra text the filter matches but does not show. */
  keywords?: string | undefined;
  /** Right-aligned hint in the list: a kind, a count. */
  meta?: ReactNode;
  disabled?: boolean | undefined;
};

export type ComboboxProps = {
  options: ComboboxOption[];
  value?: string | undefined;
  onChange: (value: string) => void;
  placeholder?: string | undefined;
  searchPlaceholder?: string | undefined;
  empty?: ReactNode;
  width?: number | undefined;
  disabled?: boolean | undefined;
  className?: string | undefined;
  "aria-label"?: string | undefined;
};

/** A Select you can type into. The trigger is the hairline control; the surface is a Command with the options as items. */
export function Combobox({ options, value, onChange, placeholder = "Choose…", searchPlaceholder = "Search…", empty = "Nothing matches.", width = 280, disabled, className, "aria-label": ariaLabel }: ComboboxProps) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);
  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      width={width}
      className="p-0"
      trigger={
        <button type="button" role="combobox" aria-expanded={open} aria-label={ariaLabel} disabled={disabled} className={cn(controlBase, controlHeight.medium, "flex items-center justify-between gap-100 text-left", className)}>
          <span className={cn("min-w-0 flex-1 truncate", !selected && "text-subtlest")}>{selected?.label ?? placeholder}</span>
          <ChevronsUpDown className="size-icon-small shrink-0 icon-subtle" />
        </button>
      }
    >
      <Command className="rounded-large">
        <Command.Input placeholder={searchPlaceholder} hint={null} autoFocus />
        <Command.List style={{ maxHeight: 260 }}>
          <Command.Empty>{empty}</Command.Empty>
          {options.map((o) => (
            <Command.Item
              key={o.value}
              value={`${o.label} ${o.value} ${o.keywords ?? ""}`}
              {...(o.disabled ? { disabled: true } : {})}
              onSelect={() => {
                onChange(o.value);
                setOpen(false);
              }}
              trailing={o.meta}
            >
              <span className="min-w-0 flex-1 truncate">{o.label}</span>
              <Check className={cn("size-icon-small shrink-0", o.value === value ? "visible" : "invisible")} />
            </Command.Item>
          ))}
        </Command.List>
      </Command>
    </Popover>
  );
}
