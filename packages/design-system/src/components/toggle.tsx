import { Toggle as TogglePrimitive } from "@base-ui/react/toggle";
import { cva, type VariantProps } from "class-variance-authority";

import { classes } from "../lib/base-ui";

const toggleVariants = cva(
  "group/toggle inline-flex shrink-0 items-center justify-center gap-050 rounded-medium font-body font-medium whitespace-nowrap text-subtle outline-none transition-colors duration-fast ease-standard hover:bg-neutral-subtle-hovered hover:text-default focus-visible:outline-focused disabled:pointer-events-none disabled:text-disabled aria-invalid:outline-danger data-pressed:bg-neutral data-pressed:text-default data-pressed:hover:bg-neutral-hovered [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-icon-medium",
  {
    variants: {
      variant: {
        default: "bg-transparent",
        outline: "border border-input bg-transparent",
      },
      size: {
        default: "h-control-medium min-w-control-medium px-100",
        sm: "h-control-small min-w-control-small rounded-small px-100 font-body-small [&_svg:not([class*='size-'])]:size-icon-small",
        lg: "h-control-large min-w-control-large px-100",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export type ToggleProps<Value extends string = string> = TogglePrimitive.Props<Value> &
  VariantProps<typeof toggleVariants>;

export function Toggle<Value extends string = string>({
  className,
  variant = "default",
  size = "default",
  ...props
}: ToggleProps<Value>) {
  return (
    <TogglePrimitive
      data-slot="toggle"
      {...props}
      className={classes(toggleVariants({ variant, size }), className)}
    />
  );
}

export { toggleVariants };
