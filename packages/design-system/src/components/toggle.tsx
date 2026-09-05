import * as ToggleGroupPrimitive from "@radix-ui/react-toggle-group";
import * as TogglePrimitive from "@radix-ui/react-toggle";
import {
  cloneElement,
  type ComponentPropsWithoutRef,
  type ReactElement,
  type ReactNode,
} from "react";

import { cn } from "../lib/cn";
import { Count } from "./badge";
import { Tooltip } from "./tooltip";

/* A "toggle" that is a switch is Switch. This Toggle is a button with a selected state: one thing
   on or off, in place. A ToggleGroup is one of several views, exactly one on. The sizes are the Button's, so a toggle sits
   level with the buttons beside it. */

export type ToggleSize = "xsmall" | "small" | "medium";

const toggleSizes: Record<ToggleSize, string> = {
  xsmall: "h-control-xsmall min-w-control-xsmall gap-050 px-075 font-body-small",
  small: "h-control-small min-w-control-small gap-075 px-100",
  medium: "h-control-medium min-w-control-medium gap-075 px-150",
};

const toggleIcons: Record<ToggleSize, string> = {
  xsmall: "size-150 shrink-0",
  small: "size-icon-small shrink-0",
  medium: "size-icon-medium shrink-0",
};

export type ToggleProps = {
  /** On or off, controlled. */
  pressed?: boolean | undefined;
  /** On at first, when uncontrolled. */
  defaultPressed?: boolean | undefined;
  onPressedChange?: ((pressed: boolean) => void) | undefined;
  /** The accessible name when the toggle is an icon alone: "Bold", "Pin". Required then. */
  "aria-label"?: string | undefined;
  disabled?: boolean | undefined;
  /** `small` (28px) is the default, level with small buttons in a toolbar; `xsmall` (24px) for the densest chrome; `medium` (32px) beside medium controls. */
  size?: ToggleSize | undefined;
  /** An icon, passed bare; the toggle sizes it. */
  icon?: ReactElement<{ className?: string | undefined }> | undefined;
  /** The label, after the icon or alone. An icon alone needs `aria-label`. */
  children?: ReactNode;
  className?: string | undefined;
} & Omit<
  ComponentPropsWithoutRef<"button">,
  "children" | "className" | "aria-label" | "disabled" | "type"
>;

/** One thing on or off, in place: bold, a filter, a pin. The subtle button with a recessed on state. Several that share one answer are a ToggleGroup. */
export function Toggle({
  pressed,
  defaultPressed,
  onPressedChange,
  "aria-label": ariaLabel,
  disabled,
  size = "small",
  icon,
  className,
  children,
  ...rest
}: ToggleProps) {
  return (
    <TogglePrimitive.Root
      {...(pressed !== undefined ? { pressed } : {})}
      {...(defaultPressed !== undefined ? { defaultPressed } : {})}
      {...(onPressedChange ? { onPressedChange } : {})}
      {...(disabled ? { disabled } : {})}
      aria-label={ariaLabel}
      className={cn(
        "inline-flex shrink-0 select-none items-center justify-center rounded-medium font-body font-medium text-subtle outline-none transition-colors duration-fast ease-standard",
        "hover:bg-neutral-subtle-hovered hover:text-default focus-visible:outline-focused",
        "data-[state=on]:bg-neutral data-[state=on]:text-default data-[state=on]:hover:bg-neutral-hovered",
        "disabled:pointer-events-none disabled:text-disabled",
        toggleSizes[size],
        className,
      )}
      {...rest}
    >
      {icon ? cloneElement(icon, { className: cn(toggleIcons[size], icon.props.className) }) : null}
      {children}
    </TogglePrimitive.Root>
  );
}

export type ToggleGroupSize = "small" | "medium";

const groupSizes: Record<ToggleGroupSize, { root: string; item: string; icon: string }> = {
  small: {
    root: "h-control-small",
    item: "h-control-xsmall gap-075 px-100 font-body-small",
    icon: "size-icon-small shrink-0",
  },
  medium: {
    root: "h-control-medium",
    item: "h-control-small gap-075 px-150 font-body",
    icon: "size-icon-small shrink-0",
  },
};

export type ToggleGroupItem<T extends string> = {
  value: T;
  /** The view's name: a noun of one or two words. The accessible name when the item shows its icon alone. */
  label: ReactNode;
  /** An icon before the label, passed bare. */
  icon?: ReactElement<{ className?: string | undefined }> | undefined;
  /** Shows the icon alone; the label becomes the item's name and its tooltip. Every item in a group should agree. */
  isIconOnly?: boolean | undefined;
  /** After the label as a Count, the way a Tabs.Tab carries one. */
  count?: number | string | null | undefined;
  disabled?: boolean | undefined;
};

export type ToggleGroupProps<T extends string> = {
  /** The views, two to five. */
  items: ToggleGroupItem<T>[];
  /** The view that is on. Exactly one always is. */
  value: T;
  onChange: (value: T) => void;
  /** `small` (28px) is the default, for a toolbar and a section head; `medium` (32px) beside medium controls on a page header. */
  size?: ToggleGroupSize | undefined;
  /** The group's name: what is being chosen. "View", "Scope", "Period". */
  "aria-label"?: string | undefined;
  className?: string | undefined;
};

/** One of several views or modes, always exactly one on: table or board, all or open, week or month. The recessed segmented control. */
export function ToggleGroup<T extends string>({
  items,
  value,
  onChange,
  size = "small",
  "aria-label": ariaLabel,
  className,
}: ToggleGroupProps<T>) {
  const s = groupSizes[size];
  return (
    <ToggleGroupPrimitive.Root
      type="single"
      value={value}
      onValueChange={(next) => {
        if (next) onChange(next as T); // Radix reports "" when the on item is pressed again; one item stays on.
      }}
      aria-label={ariaLabel}
      className={cn(
        "inline-flex items-center gap-025 rounded-medium bg-neutral p-025",
        s.root,
        className,
      )}
    >
      {items.map((item) => {
        const control = (
          <ToggleGroupPrimitive.Item
            key={item.value}
            value={item.value}
            disabled={item.disabled}
            className={cn(
              "inline-flex items-center rounded-small font-medium outline-none transition-colors duration-fast ease-standard",
              "text-subtle hover:text-default focus-visible:outline-focused",
              "data-[state=on]:bg-surface-raised data-[state=on]:text-default data-[state=on]:shadow-raised",
              "disabled:pointer-events-none disabled:text-disabled",
              s.item,
              item.isIconOnly && "px-075",
            )}
          >
            {item.icon
              ? cloneElement(item.icon, { className: cn(s.icon, item.icon.props.className) })
              : null}
            {item.isIconOnly ? <span className="sr-only">{item.label}</span> : item.label}
            {item.count != null ? <Count value={item.count} max={9999} /> : null}
          </ToggleGroupPrimitive.Item>
        );
        return item.isIconOnly ? (
          <Tooltip key={item.value} content={item.label} delay={0}>
            {control}
          </Tooltip>
        ) : (
          control
        );
      })}
    </ToggleGroupPrimitive.Root>
  );
}
