import { type ComponentProps } from "react";
import { classes } from "../lib/base-ui";
import { cn } from "../lib/cn";
import { Button, type ButtonProps } from "./button";
import { Input, type InputProps } from "./input";
import { Textarea, type TextareaProps } from "./textarea";

export type InputGroupProps = ComponentProps<"div">;
export function InputGroup({ className, ...props }: InputGroupProps) {
  return (
    <div
      data-slot="input-group"
      role="group"
      className={cn(
        "group/input-group relative flex h-control-medium w-full min-w-0 items-center rounded-medium border border-input bg-input transition-colors duration-fast ease-standard outline-none hover:bg-input-hovered",
        "has-[[data-size=small]]:h-control-small has-[[data-slot=input-group-control]:focus-visible]:bg-input-pressed has-[[data-slot=input-group-control]:focus-visible]:border-focused has-[[data-slot=input-group-control]:focus-visible]:outline-focused has-[[data-slot=input-group-control][aria-invalid=true]]:border-danger has-[[data-slot=input-group-control][aria-invalid=true]:focus-visible]:border-danger has-[[data-slot=input-group-control]:disabled]:border-disabled has-[[data-slot=input-group-control]:disabled]:bg-disabled has-[[data-slot=input-group-control][readonly]]:bg-surface-sunken has-[[data-slot=input-group-control][readonly]]:hover:bg-surface-sunken",
        "has-[>textarea]:h-auto has-[>[data-align=block-start]]:h-auto has-[>[data-align=block-start]]:flex-col has-[>[data-align=block-end]]:h-auto has-[>[data-align=block-end]]:flex-col",
        className,
      )}
      {...props}
    />
  );
}

export type InputGroupAddonProps = ComponentProps<"div"> & {
  align?: "inline-start" | "inline-end" | "block-start" | "block-end" | undefined;
};
const alignments = {
  "inline-start": "order-first ps-100",
  "inline-end": "order-last pe-100",
  "block-start": "order-first w-full justify-start px-100 pt-075",
  "block-end": "order-last w-full justify-start px-100 pb-075",
};
export function InputGroupAddon({
  className,
  align = "inline-start",
  onClick,
  ...props
}: InputGroupAddonProps) {
  return (
    <div
      role="group"
      data-slot="input-group-addon"
      data-align={align}
      className={cn(
        "flex shrink-0 cursor-text items-center justify-center gap-075 font-body-small text-subtle select-none [&>svg]:size-icon-small [&>svg]:shrink-0",
        alignments[align],
        className,
      )}
      onClick={(event) => {
        onClick?.(event);
        if (
          event.defaultPrevented ||
          (event.target as HTMLElement).closest("button, a, input, textarea, select, [role=button]")
        )
          return;
        event.currentTarget.parentElement?.querySelector<HTMLElement>("input, textarea")?.focus();
      }}
      {...props}
    />
  );
}

export type InputGroupButtonProps = Omit<ButtonProps, "size"> & {
  size?: "xs" | "sm" | "icon-xs" | "icon-sm" | undefined;
};
export function InputGroupButton({
  className,
  type = "button",
  variant = "subtle",
  size = "xs",
  ...props
}: InputGroupButtonProps) {
  return (
    <Button
      type={type}
      variant={variant}
      size={size === "sm" || size === "icon-sm" ? "small" : "xsmall"}
      data-size={size}
      className={classes(
        cn(
          "shrink-0 shadow-none",
          size === "icon-xs" && "size-control-xsmall p-0",
          size === "icon-sm" && "size-control-small p-0",
        ),
        className,
      )}
      {...props}
    />
  );
}
export type InputGroupTextProps = ComponentProps<"span">;
export function InputGroupText({ className, ...props }: InputGroupTextProps) {
  return (
    <span
      data-slot="input-group-text"
      className={cn(
        "flex items-center gap-075 font-body-small text-subtle [&_svg]:pointer-events-none [&_svg]:size-icon-small",
        className,
      )}
      {...props}
    />
  );
}
const groupControl =
  "flex-1 rounded-none border-0 bg-transparent shadow-none outline-none hover:bg-transparent focus-visible:bg-transparent focus-visible:outline-none disabled:bg-transparent [&[readonly]]:bg-transparent [&[readonly]]:hover:bg-transparent";
export function InputGroupInput({ className, ...props }: InputProps) {
  return (
    <Input
      data-slot="input-group-control"
      className={classes(cn(groupControl, "h-full"), className)}
      {...props}
    />
  );
}
export function InputGroupTextarea({ className, ...props }: TextareaProps) {
  return (
    <Textarea
      data-slot="input-group-control"
      className={cn(groupControl, "resize-none", className)}
      {...props}
    />
  );
}
