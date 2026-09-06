import { Slot, Slottable } from "@radix-ui/react-slot";
import {
  cloneElement,
  isValidElement,
  type ComponentPropsWithoutRef,
  type DOMAttributes,
  type ElementType,
  type HTMLAttributes,
  type MouseEvent,
  type ReactElement,
  type ReactNode,
  type Ref,
  type SyntheticEvent,
} from "react";

import { cn } from "../lib/cn";
import { Spinner } from "./spinner";
import { Tooltip } from "./tooltip";

/**
 * A button starts an action. The recipe: a fill per variant with hovered and pressed tokens,
 * disabled as its own tokens rather than an opacity, one focus outline. Primary is the brand bold
 * fill with a flat face; secondary is the raised surface with the raised shadow (the
 * hairline-and-soft-drop button). Navigation that reads as text is TextLink, not a Button.
 */

export type ButtonVariant = "primary" | "secondary" | "subtle" | "danger" | "link";
export type ButtonSize = "xsmall" | "small" | "medium";

const base =
  "inline-flex select-none items-center justify-center gap-075 whitespace-nowrap rounded-medium font-body font-medium transition-colors duration-fast ease-standard focus-visible:outline-focused disabled:pointer-events-none";

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-brand-bold text-inverse hover:bg-brand-bold-hovered active:bg-brand-bold-pressed disabled:bg-disabled disabled:text-disabled",
  secondary:
    "bg-surface-raised text-default shadow-raised hover:bg-surface-raised-hovered active:bg-surface-raised-pressed disabled:bg-disabled disabled:text-disabled disabled:shadow-none",
  subtle:
    "bg-neutral-subtle text-subtle hover:bg-neutral-subtle-hovered hover:text-default active:bg-neutral-subtle-pressed disabled:text-disabled",
  danger:
    "bg-danger-bold text-inverse hover:bg-danger-bold-hovered active:bg-danger-bold-pressed disabled:bg-disabled disabled:text-disabled",
  link: "text-brand underline-offset-2 hover:underline disabled:text-disabled",
};

const sizes: Record<ButtonSize, string> = {
  xsmall: "h-control-xsmall px-100 font-body-small",
  small: "h-control-small px-150",
  medium: "h-control-medium px-150",
};

const selected =
  "bg-selected text-selected hover:bg-selected-hovered active:bg-selected-pressed shadow-none";
const iconSlot = "size-icon-small shrink-0";
const onBold = (variant: ButtonVariant, isSelected: boolean | undefined) =>
  !isSelected && (variant === "primary" || variant === "danger");

type ButtonElementProps =
  | ({
      asChild?: false | undefined;
      ref?: Ref<HTMLButtonElement> | undefined;
    } & DOMAttributes<HTMLButtonElement>)
  | ({
      /** Render a single child that forwards its ref and event props to its DOM element. */
      asChild: true;
      ref?: Ref<HTMLElement> | undefined;
    } & DOMAttributes<HTMLElement>);

/** Guard before Radix's child-first event merge, including keyboard activation and custom children. */
function guardedChild(children: ReactNode, blocked: boolean, disabled: boolean | undefined) {
  if (!isValidElement<HTMLAttributes<HTMLElement>>(children)) return children;
  const props = children.props;
  const stop = (event: SyntheticEvent<HTMLElement>) => {
    if (!blocked || ("key" in event && event.key !== "Enter" && event.key !== " ")) return false;
    event.preventDefault();
    event.stopPropagation();
    return true;
  };
  return cloneElement(children, {
    ...(blocked ? { "aria-disabled": true } : {}),
    ...(disabled ? { tabIndex: -1 } : {}),
    onClick: (event) => {
      if (!stop(event)) props.onClick?.(event);
    },
    onClickCapture: (event) => {
      if (!stop(event)) props.onClickCapture?.(event);
    },
    onKeyDown: (event) => {
      if (!stop(event)) props.onKeyDown?.(event);
    },
    onKeyDownCapture: (event) => {
      if (!stop(event)) props.onKeyDownCapture?.(event);
    },
  });
}

export type ButtonProps = {
  /** The emphasis. `secondary` is the default; at most one `primary` per view. */
  variant?: ButtonVariant | undefined;
  /** `medium` (32px) for forms and pages, `small` (28px) for toolbars, rows and rails, `xsmall` (24px) for the densest chrome. `link` has no size. */
  size?: ButtonSize | undefined;
  /** An icon before the label. Pass the element bare; the button sizes it. */
  iconBefore?: ReactElement | undefined;
  /** An icon after the label: a chevron for a menu, an arrow for a step. Pass the element bare. */
  iconAfter?: ReactElement | undefined;
  /** The action is in flight: a spinner takes the icon's place, the label stays, clicks are ignored and focus is kept. */
  isLoading?: boolean | undefined;
  /** The button is the current choice: a filter applied, a view chosen. Sets `aria-pressed` and paints the selected role. */
  isSelected?: boolean | undefined;
  /** Fills the container: a sheet's footer, a narrow form. */
  isFullWidth?: boolean | undefined;
  /** The visible label, or a single ref-forwarding element when asChild is true. */
  children?: ReactNode;
  className?: string | undefined;
} & ButtonElementProps &
  Omit<
    ComponentPropsWithoutRef<"button">,
    "children" | "className" | keyof DOMAttributes<HTMLElement>
  >;

export function Button({
  variant = "secondary",
  size = "medium",
  iconBefore,
  iconAfter,
  isLoading,
  isSelected,
  isFullWidth,
  asChild,
  disabled,
  className,
  type,
  onClick,
  children,
  ...rest
}: ButtonProps) {
  const Comp = (asChild ? Slot : "button") as ElementType;
  return (
    <Comp
      className={cn(
        base,
        variants[variant],
        variant === "link" ? "h-auto px-0" : sizes[size],
        isSelected && selected,
        isFullWidth && "w-full",
        isLoading && "cursor-progress",
        className,
      )}
      aria-pressed={isSelected}
      aria-busy={isLoading || undefined}
      aria-disabled={isLoading || disabled || undefined}
      disabled={asChild ? undefined : disabled}
      tabIndex={asChild && disabled ? -1 : undefined}
      type={asChild ? undefined : (type ?? "button")}
      onClick={(e: MouseEvent<HTMLElement>) => {
        if (isLoading || disabled) {
          e.preventDefault();
          return;
        }
        if (asChild) onClick?.(e);
        else onClick?.(e as MouseEvent<HTMLButtonElement>);
      }}
      {...rest}
    >
      {isLoading ? (
        <Spinner
          isDecorative
          className={cn(iconSlot, onBold(variant, isSelected) && "icon-inverse")}
        />
      ) : iconBefore ? (
        <Slot className={iconSlot} aria-hidden>
          {iconBefore}
        </Slot>
      ) : null}
      <Slottable>
        {asChild ? guardedChild(children, Boolean(isLoading || disabled), disabled) : children}
      </Slottable>
      {iconAfter ? (
        <Slot className={iconSlot} aria-hidden>
          {iconAfter}
        </Slot>
      ) : null}
    </Comp>
  );
}

export type IconButtonProps = {
  /** The accessible name and the tooltip. Required: the icon has no text. */
  label: string;
  /** The icon, passed bare; the button sizes it. */
  icon: ReactElement;
  /** `secondary` is the raised button; `subtle` sits in toolbars and rows; `primary` is the bold fill, for the chevron of a primary split button. */
  variant?: "primary" | "secondary" | "subtle" | undefined;
  /** `small` (28px) is the default, for toolbars and rows; `medium` (32px) sits beside medium controls. */
  size?: "small" | "medium" | undefined;
  /** Hides the tooltip where the label is already visible beside the button. The accessible name stays. */
  isTooltipDisabled?: boolean | undefined;
  /** The action is in flight: a spinner takes the icon's place, clicks are ignored and focus is kept. */
  isLoading?: boolean | undefined;
  /** The button is the current choice. Sets `aria-pressed` and paints the selected role. */
  isSelected?: boolean | undefined;
  /** A single ref-forwarding element when asChild is true; the icon goes inside it. */
  children?: ReactNode;
  className?: string | undefined;
} & ButtonElementProps &
  Omit<
    ComponentPropsWithoutRef<"button">,
    "children" | "className" | "aria-label" | keyof DOMAttributes<HTMLElement>
  >;

const iconButtonSizes = { small: "size-control-small", medium: "size-control-medium" } as const;
const iconButtonIcons = {
  small: "size-icon-small shrink-0",
  medium: "size-icon-medium shrink-0",
} as const;

/** A square button holding one icon. `label` is its accessible name and its tooltip. */
export function IconButton({
  label,
  icon,
  variant = "secondary",
  size = "small",
  isTooltipDisabled,
  isLoading,
  isSelected,
  asChild,
  disabled,
  className,
  type,
  onClick,
  children,
  ...rest
}: IconButtonProps) {
  const Comp = (asChild ? Slot : "button") as ElementType;
  const button = (
    <Comp
      className={cn(
        base,
        variants[variant],
        "shrink-0 px-0",
        iconButtonSizes[size],
        isSelected && selected,
        isLoading && "cursor-progress",
        className,
      )}
      aria-label={label}
      aria-pressed={isSelected}
      aria-busy={isLoading || undefined}
      aria-disabled={isLoading || disabled || undefined}
      disabled={asChild ? undefined : disabled}
      tabIndex={asChild && disabled ? -1 : undefined}
      type={asChild ? undefined : (type ?? "button")}
      onClick={(e: MouseEvent<HTMLElement>) => {
        if (isLoading || disabled) {
          e.preventDefault();
          return;
        }
        if (asChild) onClick?.(e);
        else onClick?.(e as MouseEvent<HTMLButtonElement>);
      }}
      {...rest}
    >
      <Slottable>
        {asChild ? guardedChild(children, Boolean(isLoading || disabled), disabled) : children}
      </Slottable>
      {isLoading ? (
        <Spinner
          isDecorative
          className={cn(iconButtonIcons[size], onBold(variant, isSelected) && "icon-inverse")}
        />
      ) : (
        <Slot className={iconButtonIcons[size]} aria-hidden>
          {icon}
        </Slot>
      )}
    </Comp>
  );
  return isTooltipDisabled ? button : <Tooltip content={label}>{button}</Tooltip>;
}
