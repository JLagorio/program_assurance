import { Checkbox as CheckboxPrimitive } from "@base-ui/react/checkbox";
import { Check, Minus } from "lucide-react";

import { classes } from "../lib/base-ui";

export type CheckboxProps = CheckboxPrimitive.Root.Props;

export function Checkbox({ className, ...props }: CheckboxProps) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      {...props}
      aria-required={props["aria-required"] ?? (props.required || undefined)}
      className={classes(
        "peer relative flex size-200 shrink-0 items-center justify-center rounded-small border border-input bg-input text-inverse outline-none transition-colors duration-fast ease-standard after:absolute after:-inset-x-150 after:-inset-y-100 focus-visible:outline-focused aria-invalid:border-danger aria-invalid:outline-danger data-checked:border-brand data-checked:bg-brand-bold data-indeterminate:border-brand data-indeterminate:bg-brand-bold data-disabled:cursor-not-allowed data-disabled:opacity-disabled motion-reduce:transition-none",
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
