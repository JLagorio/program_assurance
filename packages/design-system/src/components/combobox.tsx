import { Check, ChevronsUpDown } from "lucide-react";
import { useState } from "react";
import type { ReactNode } from "react";

import { cn } from "../lib/cn";
import { Command } from "./command";
import { controlBase, controlHeight, type ControlSize } from "./controls";
import { Popover } from "./popover";

export type ComboboxOption = {
  /** The value the Combobox reports. */
  value: string;
  /** The option's text, in the list and in the field once chosen. */
  label: string;
  /** Extra text the filter matches but does not show: an id, an alias, a role. */
  keywords?: string | undefined;
  /** A short hint at the end of the row: a kind, a count, a role. A word or two. */
  meta?: ReactNode;
  /** A choice the reader cannot make yet, kept in the list so they know it exists. */
  disabled?: boolean | undefined;
};

export type ComboboxProps = {
  /** The options, every one known before the list opens. */
  options: ComboboxOption[];
  /** The chosen value. The Combobox is always controlled. */
  value?: string | undefined;
  /** Called with the new value when the reader chooses. */
  onChange: (value: string) => void;
  /** What the field says with nothing chosen: "Choose an owner". */
  placeholder?: string | undefined;
  /** What the search box in the list says: "Search people…". */
  searchPlaceholder?: string | undefined;
  /** What the list says when nothing matches. A sentence. */
  empty?: ReactNode;
  /** `medium` (32px) in a form; `small` (28px) in a toolbar. */
  size?: ControlSize | undefined;
  /** The width in pixels of the field and its list. In a form the column sets the field and the list matches. */
  width?: number | undefined;
  /** Not available. The last resort. */
  disabled?: boolean | undefined;
  /** Open on first render; for a page that exists to make this choice, and for the docs. */
  defaultOpen?: boolean | undefined;
  /** Layout only. */
  className?: string | undefined;
  /** The name, when there is no Field around it. */
  "aria-label"?: string | undefined;
  /** Set by the Field from `error`; the border turns. */
  "aria-invalid"?: boolean | undefined;
  /** Set by the Field from `isRequired`. */
  "aria-required"?: boolean | undefined;
  /** Set by the Field: the hint or the error is the control's description. */
  "aria-describedby"?: string | undefined;
};

/** One answer from a list worth searching: people, controls, requirements. The field is the control; the list is a Command in a Popover, filtered as the reader types. */
export function Combobox({
  options,
  value,
  onChange,
  placeholder = "Choose…",
  searchPlaceholder = "Search…",
  empty = "Nothing matches.",
  size = "medium",
  width,
  disabled,
  defaultOpen = false,
  className,
  "aria-label": ariaLabel,
  "aria-invalid": ariaInvalid,
  "aria-required": ariaRequired,
  "aria-describedby": ariaDescribedby,
}: ComboboxProps) {
  const [open, setOpen] = useState(defaultOpen);
  const selected = options.find((o) => o.value === value);
  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      {...(width === undefined ? { matchTriggerWidth: true } : { width })}
      className="p-0"
      trigger={
        <button
          type="button"
          role="combobox"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-label={ariaLabel}
          aria-invalid={ariaInvalid}
          aria-required={ariaRequired}
          aria-describedby={ariaDescribedby}
          disabled={disabled}
          className={cn(
            controlBase,
            controlHeight[size],
            "flex items-center justify-between gap-100 text-left",
            className,
          )}
        >
          <span className={cn("min-w-0 flex-1 truncate", !selected && "text-subtlest")}>
            {selected?.label ?? placeholder}
          </span>
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
              <Check
                className={cn(
                  "size-icon-small shrink-0",
                  o.value === value ? "visible" : "invisible",
                )}
              />
            </Command.Item>
          ))}
        </Command.List>
      </Command>
    </Popover>
  );
}
