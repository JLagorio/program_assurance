import { Checkbox as CheckboxPrimitive } from "@base-ui/react/checkbox";
import { Check, Minus } from "lucide-react";

import { classes } from "../lib/base-ui";
import { choiceControl, useFieldControlState } from "./controls";

export type CheckboxProps = CheckboxPrimitive.Root.Props;

/**
 * An independent yes or no. Inside a Field it takes the label, hint and error and the Field's
 * `invalid`, `disabled` and `required`; inside a FieldSet or CheckboxGroup it follows their
 * `disabled`. `parent` inside a CheckboxGroup with `allValues` makes it the select-all box.
 */
export function Checkbox({ className, ...props }: CheckboxProps) {
  const field = useFieldControlState();
  return (
    <CheckboxPrimitive.Root
      {...props}
      data-slot="checkbox"
      disabled={props.disabled || field.disabled}
      aria-required={props["aria-required"] ?? ((props.required ?? field.required) || undefined)}
      className={classes(
        // The shared choice states: the 3:1 boundary, hover, invalid as the border with the focus
        // outline kept in the focus colour, and read-only as a sunken box with a plain tick.
        `${choiceControl} rounded-small`,
        className,
      )}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="flex items-center justify-center"
        render={(indicatorProps, state) => (
          <span {...indicatorProps}>
            {state.indeterminate ? (
              <Minus aria-hidden className="size-150" strokeWidth={2.5} />
            ) : (
              <Check aria-hidden className="size-150" strokeWidth={2.5} />
            )}
          </span>
        )}
      />
    </CheckboxPrimitive.Root>
  );
}
