import { type ComponentProps, type ReactElement } from "react";
import { classes } from "../lib/base-ui";
import { cn } from "../lib/cn";
import { Button, type ButtonProps } from "./button";
import { Input, type InputProps } from "./input";
import { Textarea, type TextareaProps } from "./textarea";

export type InputGroupProps = ComponentProps<"div">;
/**
 * The field's frame. Squeezed below its addons' width it clips at its own edge rather than paint
 * over its neighbours, and a keyboard hint (a Kbd in an InputGroupText) steps aside below 256px so
 * the input keeps the room. A group with a hint is a size container, so give it a definite width.
 * It is a `group` only when `aria-label` or `aria-labelledby` names it. A part that composes it
 * names itself through `data-slot` (SearchField, TimeField).
 */
export function InputGroup({ className, role, ...props }: InputGroupProps) {
  // A group only when it is named: an unnamed group around one control says nothing. That holds
  // for a group role a composing part hands in too, such as Base UI's Combobox input group.
  const named = props["aria-label"] !== undefined || props["aria-labelledby"] !== undefined;
  const ownRole = named ? (role ?? "group") : role === "group" ? undefined : role;
  return (
    <div
      data-slot="input-group"
      {...props}
      role={ownRole}
      className={cn(
        "group/input-group relative flex h-control-medium w-full min-w-0 items-center overflow-x-clip rounded-medium border border-input bg-input transition-colors duration-fast ease-standard outline-none hover:bg-input-hovered has-[kbd]:@container/input-group",
        // The group takes the height of the control in it: an Input, a Combobox input or a
        // SelectTrigger at `size="small"`.
        "has-[>[data-size=small]]:h-control-small has-[[data-slot=input-group-control]:focus-visible]:bg-input-pressed has-[[data-slot=input-group-control]:focus-visible]:border-focused has-[[data-slot=input-group-control]:focus-visible]:outline-field-focused has-[[data-slot=input-group-control][aria-invalid=true]]:border-danger has-[[data-slot=input-group-control][aria-invalid=true]:focus-visible]:border-danger has-[[data-slot=input-group-control][aria-invalid=true]:focus-visible]:outline-field-danger has-[[data-slot=input-group-control]:disabled]:border-disabled has-[[data-slot=input-group-control]:disabled]:bg-disabled has-[[data-slot=input-group-control][readonly]]:border-dashed has-[[data-slot=input-group-control][readonly]]:bg-surface-sunken has-[[data-slot=input-group-control][readonly]]:hover:bg-surface-sunken",
        "has-[>textarea]:h-auto has-[>[data-align=block-start]]:h-auto has-[>[data-align=block-start]]:flex-col has-[>[data-align=block-end]]:h-auto has-[>[data-align=block-end]]:flex-col",
        className,
      )}
    />
  );
}

export type InputGroupAddonProps = ComponentProps<"div"> & {
  align?: "inline-start" | "inline-end" | "block-start" | "block-end" | undefined;
};
const alignments = {
  "inline-start": "order-first whitespace-nowrap ps-100",
  "inline-end": "order-last whitespace-nowrap pe-100",
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
      {...props}
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
    />
  );
}

/**
 * InputGroupButton's height: `xsmall` 24px (the default) or `small` 28px, Button's steps.
 */
export type InputGroupButtonSize =
  | "xsmall"
  | "small"
  /** @deprecated `xs` is `xsmall`, kept for one version. */
  | "xs"
  /** @deprecated `sm` is `small`, kept for one version. */
  | "sm"
  /** @deprecated `icon-xs` is `size="xsmall"` with `icon` and `label`, kept for one version. */
  | "icon-xs"
  /** @deprecated `icon-sm` is `size="small"` with `icon` and `label`, kept for one version. */
  | "icon-sm";

type InputGroupButtonSizeProps = {
  /**
   * `xsmall` 24px by default, `small` 28px. `xs` and `sm` are the deprecated spellings of `xsmall`
   * and `small`; `icon-xs` and `icon-sm` are the deprecated square forms, which `icon` and `label`
   * replace.
   */
  size?: InputGroupButtonSize | undefined;
};

/** A button with a visible label. */
export type InputGroupTextButtonProps = Omit<ButtonProps, "size"> &
  InputGroupButtonSizeProps & {
    icon?: undefined;
    label?: undefined;
  };

/** An icon alone: a square button that `label` names. */
export type InputGroupIconButtonProps = Omit<
  ButtonProps,
  "size" | "children" | "iconBefore" | "iconAfter" | "aria-label" | "isFullWidth" | "truncate"
> &
  InputGroupButtonSizeProps & {
    /** The decorative icon of an icon-only button. The button is square and `label` names it. */
    icon: ReactElement;
    /** The accessible name of an icon-only button, required with `icon`. */
    label: string;
  };

export type InputGroupButtonProps = InputGroupTextButtonProps | InputGroupIconButtonProps;

const inputGroupButtonSizes: Record<InputGroupButtonSize, "xsmall" | "small"> = {
  xsmall: "xsmall",
  small: "small",
  xs: "xsmall",
  sm: "small",
  "icon-xs": "xsmall",
  "icon-sm": "small",
};

/**
 * A button inside an InputGroupAddon: a clear, a copy, a submit. With `icon` and `label` it is an
 * icon-only square that `label` names; without, it shows its children as its label.
 */
export function InputGroupButton({
  className,
  type = "button",
  variant = "subtle",
  size: sizeProp = "xsmall",
  icon,
  label,
  ...props
}: InputGroupButtonProps) {
  const size = inputGroupButtonSizes[sizeProp] ?? "xsmall";
  const square = icon !== undefined || sizeProp === "icon-xs" || sizeProp === "icon-sm";
  return (
    <Button
      type={type}
      variant={variant}
      data-slot="input-group-button"
      data-size={size}
      {...(props as ButtonProps)}
      size={size}
      {...(icon !== undefined ? { iconBefore: icon, "aria-label": label } : {})}
      className={classes(
        cn(
          "shrink-0 shadow-none",
          square &&
            cn(
              "relative touch-target p-0",
              size === "small" ? "size-control-small" : "size-control-xsmall",
            ),
        ),
        className,
      )}
    />
  );
}
export type InputGroupTextProps = ComponentProps<"span">;
/** A unit, a prefix or a hint beside the control. Units stay at every width; a keyboard hint (a Kbd inside) hides while the group is narrower than 256px. */
export function InputGroupText({ className, ...props }: InputGroupTextProps) {
  return (
    <span
      data-slot="input-group-text"
      className={cn(
        "flex items-center gap-075 font-body-small text-subtle has-[kbd]:hidden @3xs/input-group:has-[kbd]:flex [&_svg]:pointer-events-none [&_svg]:size-icon-small",
        className,
      )}
      {...props}
    />
  );
}
const groupControl =
  "flex-1 rounded-none border-0 bg-transparent shadow-none outline-none hover:bg-transparent focus-visible:bg-transparent focus-visible:outline-none aria-[invalid=true]:focus-visible:outline-none disabled:bg-transparent [&[readonly]]:bg-transparent [&[readonly]]:hover:bg-transparent";
export function InputGroupInput({ className, ...props }: InputProps) {
  return (
    <Input
      {...props}
      data-slot="input-group-control"
      className={classes(cn(groupControl, "h-full"), className)}
    />
  );
}
/** A textarea in the group's frame. It takes `autoResize` and `maxRows`; a `characterLimit` count belongs under a plain Textarea, outside the frame. */
export type InputGroupTextareaProps = Omit<TextareaProps, "characterLimit">;
export function InputGroupTextarea({ className, ...props }: InputGroupTextareaProps) {
  return (
    <Textarea
      {...props}
      data-slot="input-group-control"
      className={classes(cn(groupControl, "resize-none"), className)}
    />
  );
}
