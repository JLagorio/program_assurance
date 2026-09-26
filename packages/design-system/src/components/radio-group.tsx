import { DirectionProvider } from "@base-ui/react/direction-provider";
import { Radio as RadioPrimitive } from "@base-ui/react/radio";
import { RadioGroup as RadioGroupPrimitive } from "@base-ui/react/radio-group";

import { classes } from "../lib/base-ui";
import { useLedgerLocale } from "../lib/locale";
import { useFieldControlState } from "./controls";

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
        data-slot="radio-group"
        dir={dir ?? direction}
        {...props}
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
      data-slot="radio-group-item"
      {...props}
      disabled={props.disabled || field.disabled}
      className={classes(
        // The boundary is color.border.bold, 3:1 against every surface (WCAG 1.4.11). Invalid is the
        // border, from the item or its group; the focus outline keeps the focus colour.
        "group/radio-group-item peer relative flex size-200 shrink-0 items-center justify-center rounded-full border border-bold bg-input outline-none after:absolute after:-inset-x-150 after:-inset-y-100 focus-visible:outline-focused aria-invalid:border-danger group-aria-invalid/radio-group:border-danger data-checked:border-brand data-checked:bg-brand-bold data-checked:text-inverse data-disabled:cursor-not-allowed data-disabled:opacity-disabled",
        className,
      )}
    >
      <RadioPrimitive.Indicator
        data-slot="radio-group-indicator"
        className="flex size-200 items-center justify-center"
      >
        <span className="absolute top-1/2 left-1/2 size-100 -translate-x-1/2 -translate-y-1/2 rounded-full bg-surface" />
      </RadioPrimitive.Indicator>
    </RadioPrimitive.Root>
  );
}
