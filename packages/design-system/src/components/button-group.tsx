import type { ComponentProps } from "react";
import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { cva, type VariantProps } from "class-variance-authority";
import { classes } from "../lib/base-ui";
import { cn } from "../lib/cn";
import { Separator } from "./separator";

export const buttonGroupVariants = cva(
  "flex w-fit items-stretch *:focus-visible:relative *:focus-visible:z-10 has-[>[data-slot=button-group]]:gap-100 [&>[data-slot=select-trigger]:not([class*='w-'])]:w-fit [&>input]:flex-1",
  {
    variants: {
      orientation: {
        horizontal:
          "*:data-slot:rounded-e-none [&>[data-slot]:not(:has(~[data-slot]))]:rounded-e-medium! [&>[data-slot]~[data-slot]]:rounded-s-none [&>[data-slot]~[data-slot]]:border-s-0",
        vertical:
          "flex-col [&>[data-slot]]:w-full *:data-slot:rounded-b-none [&>[data-slot]:not(:has(~[data-slot]))]:rounded-b-medium! [&>[data-slot]~[data-slot]]:rounded-t-none [&>[data-slot]~[data-slot]]:border-t-0",
      },
    },
    defaultVariants: { orientation: "horizontal" },
  },
);

export type ButtonGroupProps = ComponentProps<"div"> & VariantProps<typeof buttonGroupVariants>;
export function ButtonGroup({ className, orientation = "horizontal", ...props }: ButtonGroupProps) {
  return (
    <div
      role="group"
      data-slot="button-group"
      data-orientation={orientation}
      className={cn(buttonGroupVariants({ orientation }), className)}
      {...props}
    />
  );
}

export type ButtonGroupTextProps = useRender.ComponentProps<"div">;
export function ButtonGroupText({ className, render, ...props }: ButtonGroupTextProps) {
  return useRender({
    defaultTagName: "div",
    props: mergeProps<"div">(
      {
        className: cn(
          "flex items-center gap-100 rounded-medium border border-input bg-surface-sunken px-150 font-body-small font-medium text-subtle [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-icon-medium",
          className,
        ),
      },
      props,
    ),
    render,
    state: { slot: "button-group-text" },
  });
}

export type ButtonGroupSeparatorProps = ComponentProps<typeof Separator>;
export function ButtonGroupSeparator({
  className,
  orientation = "vertical",
  ...props
}: ButtonGroupSeparatorProps) {
  return (
    <Separator
      data-slot="button-group-separator"
      orientation={orientation}
      className={classes(
        "relative self-stretch data-horizontal:w-auto data-horizontal:border-t! data-vertical:h-auto data-vertical:border-s!",
        className,
      )}
      {...props}
    />
  );
}
