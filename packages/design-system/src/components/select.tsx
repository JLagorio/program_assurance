import { DirectionProvider, useDirection } from "@base-ui/react/direction-provider";
import { Select as SelectPrimitive } from "@base-ui/react/select";
import { Check, ChevronDown, ChevronUp } from "lucide-react";

import { classes } from "../lib/base-ui";
import { cn } from "../lib/cn";
import { useLedgerLocale } from "../lib/locale";
import { useOverlayContainer } from "./_overlay-focus";
import { controlBase, controlHeight } from "./controls";
import {
  menuItem,
  menuItemDisabled,
  menuItemHighlighted,
  menuLabel,
  menuSeparator,
  menuSurface,
} from "./menu";

export type SelectProps<
  Value = unknown,
  Multiple extends boolean | undefined = false,
> = SelectPrimitive.Root.Props<Value, Multiple>;

export function Select<Value, Multiple extends boolean | undefined = false>(
  props: SelectProps<Value, Multiple>,
) {
  const { direction } = useLedgerLocale();
  return (
    <DirectionProvider direction={direction}>
      <SelectPrimitive.Root {...props} />
    </DirectionProvider>
  );
}

export type SelectTriggerProps = SelectPrimitive.Trigger.Props & {
  size?: "sm" | "default" | undefined;
};
export function SelectTrigger({
  className,
  size = "default",
  children,
  ...props
}: SelectTriggerProps) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      data-size={size}
      {...props}
      className={classes(
        cn(
          controlBase,
          controlHeight[size === "sm" ? "small" : "medium"],
          "flex w-fit items-center justify-between gap-100 text-start data-placeholder:text-subtlest data-readonly:bg-surface-sunken data-readonly:hover:bg-surface-sunken [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-icon-small",
        ),
        className,
      )}
    >
      {children}
      <SelectPrimitive.Icon
        render={<ChevronDown aria-hidden className="icon-subtle" />}
        children={null}
      />
    </SelectPrimitive.Trigger>
  );
}

export type SelectValueProps = SelectPrimitive.Value.Props;
export function SelectValue({ className, ...props }: SelectValueProps) {
  return (
    <SelectPrimitive.Value
      data-slot="select-value"
      className={classes("flex min-w-0 flex-1 items-center gap-100 truncate text-start", className)}
      {...props}
    />
  );
}

export type SelectContentProps = SelectPrimitive.Popup.Props &
  Pick<
    SelectPrimitive.Positioner.Props,
    "align" | "alignOffset" | "side" | "sideOffset" | "alignItemWithTrigger"
  >;
export function SelectContent({
  className,
  children,
  style,
  dir,
  side = "bottom",
  sideOffset = 4,
  align = "center",
  alignOffset = 0,
  alignItemWithTrigger = true,
  ...props
}: SelectContentProps) {
  const inheritedDirection = useDirection();
  const direction = dir === "ltr" || dir === "rtl" ? dir : inheritedDirection;
  const portal = useOverlayContainer();
  const defaults = {
    width: "var(--anchor-width)",
    minWidth: 144,
    maxWidth: "var(--available-width)",
    maxHeight: "var(--available-height)",
    transformOrigin: "var(--transform-origin)",
  };
  return (
    <DirectionProvider direction={direction}>
      <span hidden ref={portal.ref} />
      <SelectPrimitive.Portal container={portal.container}>
        <SelectPrimitive.Positioner
          side={side}
          sideOffset={sideOffset}
          align={align}
          alignOffset={alignOffset}
          alignItemWithTrigger={alignItemWithTrigger}
          positionMethod={portal.container ? "fixed" : undefined}
          className="isolate z-50"
        >
          <SelectPrimitive.Popup
            data-slot="select-content"
            data-align-trigger={alignItemWithTrigger}
            dir={dir ?? direction}
            className={classes(
              cn(
                menuSurface,
                "relative flex flex-col overflow-x-hidden overflow-y-auto data-open:animate-enter data-closed:animate-exit data-[align-trigger=true]:animate-none motion-reduce:animate-none",
              ),
              className,
            )}
            style={
              typeof style === "function"
                ? (state) => ({ ...defaults, ...style(state) })
                : { ...defaults, ...style }
            }
            {...props}
          >
            <SelectScrollUpButton />
            <SelectPrimitive.List
              className="min-h-0 overflow-y-auto overscroll-contain"
              aria-label={props["aria-label"]}
              aria-labelledby={props["aria-labelledby"]}
            >
              {children}
            </SelectPrimitive.List>
            <SelectScrollDownButton />
          </SelectPrimitive.Popup>
        </SelectPrimitive.Positioner>
      </SelectPrimitive.Portal>
    </DirectionProvider>
  );
}

export type SelectGroupProps = SelectPrimitive.Group.Props;
export function SelectGroup({ className, ...props }: SelectGroupProps) {
  return (
    <SelectPrimitive.Group
      data-slot="select-group"
      className={classes("scroll-my-050", className)}
      {...props}
    />
  );
}

export type SelectLabelProps = SelectPrimitive.GroupLabel.Props;
export function SelectLabel({ className, ...props }: SelectLabelProps) {
  return (
    <SelectPrimitive.GroupLabel
      data-slot="select-label"
      className={classes(menuLabel, className)}
      {...props}
    />
  );
}

export type SelectItemProps = SelectPrimitive.Item.Props;
export function SelectItem({ className, children, ...props }: SelectItemProps) {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={classes(
        cn(
          menuItem,
          menuItemHighlighted,
          menuItemDisabled,
          "relative pe-500 text-start data-selected:text-selected [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-icon-small",
        ),
        className,
      )}
      {...props}
    >
      <SelectPrimitive.ItemText className="flex min-w-0 flex-1 items-center gap-100 truncate">
        {children}
      </SelectPrimitive.ItemText>
      <SelectPrimitive.ItemIndicator
        render={<span className="pointer-events-none absolute end-100 flex items-center" />}
      >
        <Check aria-hidden className="size-icon-small" />
      </SelectPrimitive.ItemIndicator>
    </SelectPrimitive.Item>
  );
}

export type SelectSeparatorProps = SelectPrimitive.Separator.Props;
export function SelectSeparator({ className, ...props }: SelectSeparatorProps) {
  return (
    <SelectPrimitive.Separator
      data-slot="select-separator"
      className={classes(menuSeparator, className)}
      {...props}
    />
  );
}

export type SelectScrollUpButtonProps = SelectPrimitive.ScrollUpArrow.Props;
export function SelectScrollUpButton({ className, ...props }: SelectScrollUpButtonProps) {
  return (
    <SelectPrimitive.ScrollUpArrow
      data-slot="select-scroll-up-button"
      className={classes(
        "top-0 z-10 flex w-full cursor-default items-center justify-center bg-surface-overlay py-050",
        className,
      )}
      {...props}
    >
      <ChevronUp aria-hidden className="size-icon-small" />
    </SelectPrimitive.ScrollUpArrow>
  );
}

export type SelectScrollDownButtonProps = SelectPrimitive.ScrollDownArrow.Props;
export function SelectScrollDownButton({ className, ...props }: SelectScrollDownButtonProps) {
  return (
    <SelectPrimitive.ScrollDownArrow
      data-slot="select-scroll-down-button"
      className={classes(
        "bottom-0 z-10 flex w-full cursor-default items-center justify-center bg-surface-overlay py-050",
        className,
      )}
      {...props}
    >
      <ChevronDown aria-hidden className="size-icon-small" />
    </SelectPrimitive.ScrollDownArrow>
  );
}
