import { DirectionProvider } from "@base-ui/react/direction-provider";
import { Radio as RadioPrimitive } from "@base-ui/react/radio";
import { RadioGroup as RadioGroupPrimitive } from "@base-ui/react/radio-group";

import { classes } from "../lib/base-ui";
import { useLedgerLocale } from "../lib/locale";
import { choiceControl, useFieldControlState } from "./controls";

export type RadioGroupProps<Value = unknown> = RadioGroupPrimitive.Props<Value>;

/**
 * One answer from visible choices. Inside a FieldSet its legend names the group; inside a Field
 * it takes the hint and error and the Field's `invalid`, `disabled` and `required`. Setting
 * `aria-invalid` on the group marks every item.
 */
export function RadioGroup<Value = unknown>({ className, dir, ...props }: RadioGroupProps<Value>) {
  const { direction } = useLedgerLocale();
  const field = useFieldControlState();
  return (
    <DirectionProvider direction={dir === "ltr" || dir === "rtl" ? dir : direction}>
      <RadioGroupPrimitive
        dir={dir ?? direction}
        {...props}
        data-slot="radio-group"
        disabled={props.disabled || field.disabled}
        aria-required={props["aria-required"] ?? ((props.required ?? field.required) || undefined)}
        className={classes("group/radio-group grid w-full gap-100", className)}
      />
    </DirectionProvider>
  );
}

export type RadioGroupItemProps<Value = unknown> = RadioPrimitive.Root.Props<Value>;

export function RadioGroupItem<Value = unknown>({
  className,
  ...props
}: RadioGroupItemProps<Value>) {
  const field = useFieldControlState();
  return (
    <RadioPrimitive.Root
      {...props}
      data-slot="radio-group-item"
      disabled={props.disabled || field.disabled}
      className={classes(
        // The shared choice states (see Checkbox). Invalid comes from the item or its group; a
        // read-only chosen item keeps a dark dot on the sunken circle instead of the brand fill.
        `${choiceControl} group/radio-group-item rounded-full group-aria-invalid/radio-group:border-danger`,
        className,
      )}
    >
      <RadioPrimitive.Indicator
        data-slot="radio-group-indicator"
        className="flex size-200 items-center justify-center"
      >
        <span className="absolute top-1/2 left-1/2 size-100 -translate-x-1/2 -translate-y-1/2 rounded-full bg-surface group-data-readonly/radio-group-item:bg-neutral-bold" />
      </RadioPrimitive.Indicator>
    </RadioPrimitive.Root>
  );
}
