import { Input as InputPrimitive } from "@base-ui/react/input";
import { classes } from "../lib/base-ui";
import { cn } from "../lib/cn";
import { controlBase, controlHeight, type ControlSize } from "./controls";

export type InputProps = Omit<InputPrimitive.Props, "size"> & {
  /** Medium is 32px in a form; small is 28px beside toolbar actions. */
  size?: ControlSize | undefined;
};

export function Input({ size = "medium", className, ...props }: InputProps) {
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
    />
  );
}
