import { DirectionProvider, useDirection } from "@base-ui/react/direction-provider";
import { Select as SelectPrimitive } from "@base-ui/react/select";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import { useContext, useId, type ReactNode } from "react";

import { token } from "../generated/tokens";
import { classes } from "../lib/base-ui";
import { cn } from "../lib/cn";
import { useLedgerLocale } from "../lib/locale";
import {
  controlBase,
  controlHeight,
  FieldStateContext,
  useFieldControlState,
  type ControlSize,
} from "./controls";
import {
  menuChoiceSelected,
  menuItem,
  menuItemDescription,
  menuItemDisabled,
  menuItemHighlighted,
  menuLabel,
  menuSeparator,
  menuSurface,
} from "./menu";
import { joinIds, wrapText } from "./option-text";
import { scrollerArrowVariants } from "./scroller";

export type SelectProps<
  Value = unknown,
  Multiple extends boolean | undefined = false,
> = SelectPrimitive.Root.Props<Value, Multiple>;

/** Inside a Field the trigger takes the label, hint and error and the Field's `invalid`, `disabled` and `required` (announced; `required` here is the native constraint); inside a FieldSet it follows its `disabled`. Explicit props win. */
export function Select<Value, Multiple extends boolean | undefined = false>(
  props: SelectProps<Value, Multiple>,
) {
  const { direction } = useLedgerLocale();
  const field = useFieldControlState();
  return (
    <DirectionProvider direction={direction}>
      <SelectPrimitive.Root {...props} disabled={props.disabled || field.disabled} />
    </DirectionProvider>
  );
}

/** The trigger's height: the control scale Input, Combobox and the date fields share. */
export type SelectTriggerSize =
  | ControlSize
  /** @deprecated `sm` is `small`; `ledger/no-deprecated-name` fixes it. */
  | "sm"
  /** @deprecated `default` is `medium`; `ledger/no-deprecated-name` fixes it. */
  | "default";

/** The shadcn spellings the trigger still accepts, for one version. */
const legacySizes: Record<string, ControlSize> = { sm: "small", default: "medium" };

export type SelectTriggerProps = SelectPrimitive.Trigger.Props & {
  /** `medium`, 32px, by default; `small`, 28px, in a toolbar or a dense row, the same height as a small Input and Button. `sm` and `default` are the deprecated spellings of `small` and `medium`. */
  size?: SelectTriggerSize | undefined;
};
/**
 * Inside a Field the trigger fills it, as Input and Combobox do; elsewhere (a toolbar, a filter, a
 * rail) it fits its value. Either way it never grows past its container: a long value truncates.
 */
export function SelectTrigger({
  className,
  size: sizeProp = "medium",
  children,
  ...props
}: SelectTriggerProps) {
  const field = useFieldControlState();
  const inField = useContext(FieldStateContext) !== null;
  const size: ControlSize = legacySizes[sizeProp] ?? (sizeProp as ControlSize);
  return (
    <SelectPrimitive.Trigger
      {...props}
      {...(field.required && props["aria-required"] === undefined ? { "aria-required": true } : {})}
      data-slot="select-trigger"
      data-size={size}
      className={classes(
        cn(
          controlBase,
          controlHeight[size],
          inField ? "w-full" : "w-fit",
          "flex min-w-0 max-w-full items-center justify-between gap-100 text-start data-placeholder:text-subtlest data-readonly:bg-surface-sunken data-readonly:hover:bg-surface-sunken [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-icon-small",
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
      {...props}
      data-slot="select-value"
      className={classes("flex min-w-0 flex-1 items-center gap-100 truncate text-start", className)}
    />
  );
}

export type SelectContentProps = SelectPrimitive.Popup.Props &
  Pick<
    SelectPrimitive.Positioner.Props,
    "align" | "alignOffset" | "side" | "sideOffset" | "alignItemWithTrigger"
  >;
/**
 * The list opens below its trigger (above it where there is no room), starting at the trigger's
 * edge, at least as wide as the trigger and as wide as its longest option up to the measure; a
 * longer option wraps. `alignItemWithTrigger` opts into the list that opens over the trigger with
 * the chosen option on the value.
 */
export function SelectContent({
  className,
  children,
  style,
  dir,
  side = "bottom",
  sideOffset = 4,
  align = "start",
  alignOffset = 0,
  alignItemWithTrigger = false,
  ...props
}: SelectContentProps) {
  const inheritedDirection = useDirection();
  const field = useFieldControlState();
  const direction = dir === "ltr" || dir === "rtl" ? dir : inheritedDirection;
  const defaults = {
    width: "max-content",
    minWidth: `max(var(--anchor-width), ${token("dimension.part.select")})`,
    maxWidth: "min(var(--available-width), var(--ds-dimension-layout-measure))",
    maxHeight: "var(--available-height)",
    transformOrigin: "var(--transform-origin)",
  };
  return (
    <DirectionProvider direction={direction}>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Positioner
          side={side}
          sideOffset={sideOffset}
          align={align}
          alignOffset={alignOffset}
          alignItemWithTrigger={alignItemWithTrigger}
          className="isolate z-50"
        >
          <SelectPrimitive.Popup
            {...props}
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
          >
            <SelectScrollUpButton />
            <SelectPrimitive.List
              className="min-h-0 overflow-y-auto overscroll-contain"
              style={{ scrollPaddingBlock: "var(--ds-space-300)" }}
              aria-label={props["aria-label"]}
              aria-labelledby={
                props["aria-labelledby"] ?? (props["aria-label"] ? undefined : field.labelId)
              }
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
      {...props}
      data-slot="select-group"
      className={classes("scroll-my-050", className)}
    />
  );
}

export type SelectLabelProps = SelectPrimitive.GroupLabel.Props;
export function SelectLabel({ className, ...props }: SelectLabelProps) {
  return (
    <SelectPrimitive.GroupLabel
      {...props}
      data-slot="select-label"
      className={classes(menuLabel, className)}
    />
  );
}

export type SelectItemProps = SelectPrimitive.Item.Props & {
  /**
   * A second line under the option, in smaller subtle text that wraps: what tells two similar
   * options apart. It is the option's accessible description, not part of its name, and the closed
   * trigger never shows it.
   */
  description?: ReactNode | undefined;
  /**
   * Why the option cannot be chosen. It disables the option, which the arrow keys still reach and a
   * screen reader announces as unavailable, and shows the reason as the description line in place of
   * `description`, readable on the disabled row. An empty string is no reason.
   */
  disabledReason?: string | undefined;
};
export function SelectItem({
  className,
  children,
  description,
  disabledReason,
  disabled,
  "aria-describedby": describedBy,
  ...props
}: SelectItemProps) {
  const descriptionId = useId();
  const reason = disabledReason ? disabledReason : undefined;
  const line = reason ?? description;
  const hasLine = line !== undefined && line !== null && line !== false && line !== "";
  return (
    <SelectPrimitive.Item
      {...props}
      disabled={Boolean(disabled || reason)}
      aria-describedby={hasLine ? joinIds(describedBy, descriptionId) : describedBy}
      data-slot="select-item"
      className={classes(
        cn(
          menuItem,
          menuItemHighlighted,
          menuItemDisabled,
          menuChoiceSelected,
          "relative pe-400 text-start [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-icon-small",
        ),
        className,
      )}
    >
      <span className="flex min-w-0 flex-1 flex-col">
        {/* Text runs sit in their own shrinkable span, so a long unbroken value wraps in the row. */}
        <SelectPrimitive.ItemText className="flex min-w-0 items-center gap-100 whitespace-normal break-words">
          {wrapText(children)}
        </SelectPrimitive.ItemText>
        {hasLine ? (
          // Hidden from the name; aria-describedby still reads it.
          <span
            id={descriptionId}
            aria-hidden
            data-slot="select-item-description"
            className={menuItemDescription}
          >
            {line}
          </span>
        ) : null}
      </span>
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
      {...props}
      data-slot="select-separator"
      className={classes(menuSeparator, className)}
    />
  );
}

/* Base UI's Select arrows keep their engine (item stepping, touch suppression) and wear the
   Scroller arrow look, so a select and a menu scroll alike. */
const selectArrow = (edge: "start" | "end") =>
  scrollerArrowVariants({ orientation: "vertical", edge, surface: "overlay" });

export type SelectScrollUpButtonProps = SelectPrimitive.ScrollUpArrow.Props;
export function SelectScrollUpButton({ className, ...props }: SelectScrollUpButtonProps) {
  return (
    <SelectPrimitive.ScrollUpArrow
      {...props}
      data-slot="select-scroll-up-button"
      className={classes(selectArrow("start"), className)}
    >
      <ChevronUp aria-hidden />
    </SelectPrimitive.ScrollUpArrow>
  );
}

export type SelectScrollDownButtonProps = SelectPrimitive.ScrollDownArrow.Props;
export function SelectScrollDownButton({ className, ...props }: SelectScrollDownButtonProps) {
  return (
    <SelectPrimitive.ScrollDownArrow
      {...props}
      data-slot="select-scroll-down-button"
      className={classes(selectArrow("end"), className)}
    >
      <ChevronDown aria-hidden />
    </SelectPrimitive.ScrollDownArrow>
  );
}
