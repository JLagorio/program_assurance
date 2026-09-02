import { Check, ChevronsUpDown } from "lucide-react";
import { useState } from "react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import { Command } from "./command";
import { controlBase } from "./controls";
import { Popover } from "./popover";

export type ComboboxOption = {
  value: string;
  label: string;
  /** Extra text the filter matches but does not show. */
  keywords?: string;
  /** Right-aligned hint in the list: a kind, a count. */
  meta?: ReactNode;
  disabled?: boolean;
};

/* A Select you can type into. The trigger is the hairline control; the
   surface is a Command with the options as items. For a handful of fixed
   options use Select; for a list worth searching, this. */
export function Combobox({
  options,
  value,
  onChange,
  placeholder = "Choose…",
  searchPlaceholder = "Search…",
  empty = "Nothing matches.",
  width = 280,
  disabled,
  className,
  "aria-label": ariaLabel,
}: {
  options: ComboboxOption[];
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  empty?: ReactNode;
  width?: number;
  disabled?: boolean;
  className?: string;
  "aria-label"?: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);
  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      width={width}
      className="p-0"
      trigger={
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          aria-label={ariaLabel}
          disabled={disabled}
          className={cn(
            controlBase,
            "flex items-center justify-between gap-2 text-left",
            className,
          )}
        >
          <span className={cn("min-w-0 flex-1 truncate", !selected && "text-muted-foreground")}>
            {selected?.label ?? placeholder}
          </span>
          <ChevronsUpDown className="size-3.5 shrink-0 text-muted-foreground" />
        </button>
      }
    >
      <Command className="rounded-lg">
        <Command.Input placeholder={searchPlaceholder} hint={null} autoFocus />
        <Command.List className="max-h-[260px]">
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
              <Check
                className={cn("size-3.5 shrink-0", o.value === value ? "opacity-100" : "opacity-0")}
              />
            </Command.Item>
          ))}
        </Command.List>
      </Command>
    </Popover>
  );
}
