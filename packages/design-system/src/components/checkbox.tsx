import { Checkbox as CheckboxPrimitive } from "@base-ui/react/checkbox";
import { Check, Minus } from "lucide-react";

import { classes } from "../lib/base-ui";
import { useFieldControlState } from "./controls";

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
      data-slot="checkbox"
      {...props}
      disabled={props.disabled || field.disabled}
      aria-required={props["aria-required"] ?? ((props.required ?? field.required) || undefined)}
      className={classes(
        // The boundary is color.border.bold, 3:1 against every surface, so an unticked box can be
        // seen (WCAG 1.4.11). Invalid is the border; the focus outline stays the focus colour, so a
        // focused invalid box still shows where focus is.
        "peer relative flex size-200 shrink-0 items-center justify-center rounded-small border border-bold bg-input text-inverse outline-none transition-colors duration-fast ease-standard after:absolute after:-inset-x-150 after:-inset-y-100 focus-visible:outline-focused aria-invalid:border-danger data-checked:border-brand data-checked:bg-brand-bold data-indeterminate:border-brand data-indeterminate:bg-brand-bold data-disabled:cursor-not-allowed data-disabled:opacity-disabled motion-reduce:transition-none",
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
