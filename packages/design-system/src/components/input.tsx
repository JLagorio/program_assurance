import { Input as InputPrimitive } from "@base-ui/react/input";
import { classes } from "../lib/base-ui";
import { cn } from "../lib/cn";
import { controlBase, controlHeight, useFieldControlState, type ControlSize } from "./controls";

export type InputProps = Omit<InputPrimitive.Props, "size"> & {
  /** Medium is 32px in a form; small is 28px beside toolbar actions. */
  size?: ControlSize | undefined;
};

/** One line of text. Inside a Field it takes the label, hint and error ids and the Field's `invalid`, `disabled` and `required` (announced; native `required` stays on the Input); explicit props still win. */
export function Input({ size = "medium", className, ...props }: InputProps) {
  const field = useFieldControlState();
  return (
    <InputPrimitive
      data-slot="input"
      data-size={size}
      className={classes(
        cn(
          controlBase,
          controlHeight[size],
          "min-w-0 file:inline-flex file:border-0 file:bg-transparent file:font-medium file:text-default [&::-webkit-search-cancel-button]:appearance-none",
        ),
        className,
      )}
      {...props}
      {...(field.required && props["aria-required"] === undefined ? { "aria-required": true } : {})}
    />
  );
}
