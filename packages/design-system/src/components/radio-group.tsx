import { DirectionProvider } from "@base-ui/react/direction-provider";
import { Radio as RadioPrimitive } from "@base-ui/react/radio";
import { RadioGroup as RadioGroupPrimitive } from "@base-ui/react/radio-group";

import { classes } from "../lib/base-ui";
import { useLedgerLocale } from "../lib/locale";
import { useFieldControl } from "./controls";

export type RadioGroupProps<Value = unknown> = RadioGroupPrimitive.Props<Value>;

export function RadioGroup<Value = unknown>({ className, dir, ...props }: RadioGroupProps<Value>) {
  const { direction } = useLedgerLocale();
  const bound = useFieldControl(props, true);
  return (
    <DirectionProvider direction={dir === "ltr" || dir === "rtl" ? dir : direction}>
      <RadioGroupPrimitive
        data-slot="radio-group"
        dir={dir ?? direction}
        {...bound}
        aria-required={bound["aria-required"] ?? (props.required || undefined)}
        className={classes("grid w-full gap-100", className)}
      />
    </DirectionProvider>
  );
}

export type RadioGroupItemProps<Value = unknown> = RadioPrimitive.Root.Props<Value>;

export function RadioGroupItem<Value = unknown>({
  className,
  ...props
}: RadioGroupItemProps<Value>) {
  return (
    <RadioPrimitive.Root
      data-slot="radio-group-item"
      {...props}
      className={classes(
        "group/radio-group-item peer relative flex size-200 shrink-0 items-center justify-center rounded-full border border-input bg-input outline-none after:absolute after:-inset-x-150 after:-inset-y-100 focus-visible:outline-focused aria-invalid:border-danger aria-invalid:outline-danger data-checked:border-brand data-checked:bg-brand-bold data-checked:text-inverse data-disabled:cursor-not-allowed data-disabled:opacity-disabled",
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
