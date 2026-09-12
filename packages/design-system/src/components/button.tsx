import { Button as ButtonPrimitive } from "@base-ui/react/button";
import {
  cloneElement,
  isValidElement,
  type DOMAttributes,
  type ReactElement,
  type ReactNode,
  type SyntheticEvent,
} from "react";

import { classes } from "../lib/base-ui";
import { cn } from "../lib/cn";
import { Spinner } from "./spinner";
import { Tooltip, TooltipContent, TooltipTrigger } from "./tooltip";

export type ButtonVariant = "primary" | "secondary" | "subtle" | "danger" | "link";
export type ButtonSize = "xsmall" | "small" | "medium";

type ButtonStyleProps = {
  /** Secondary is the default; primary emphasizes the main action. */
  variant?: ButtonVariant | undefined;
  /** Medium is 32px, small 28px and xsmall 24px. Link treatment has natural height. */
  size?: ButtonSize | undefined;
  /** Paint the selected state and, on Button, set aria-pressed. */
  isSelected?: boolean | undefined;
  /** Fill the available width. */
  isFullWidth?: boolean | undefined;
};

const base =
  "inline-flex select-none items-center justify-center gap-075 whitespace-nowrap rounded-medium font-body font-medium transition-colors duration-fast ease-standard focus-visible:outline-focused disabled:pointer-events-none [&>svg]:size-icon-small [&>svg]:shrink-0";

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-brand-bold text-inverse hover:bg-brand-bold-hovered active:bg-brand-bold-pressed aria-expanded:bg-brand-bold-pressed data-[disabled]:not-data-[loading]:bg-disabled data-[disabled]:not-data-[loading]:text-disabled",
  secondary:
    "bg-surface-raised text-default shadow-raised hover:bg-surface-raised-hovered active:bg-surface-raised-pressed aria-expanded:bg-surface-raised-pressed data-[disabled]:not-data-[loading]:bg-disabled data-[disabled]:not-data-[loading]:text-disabled data-[disabled]:not-data-[loading]:shadow-none",
  subtle:
    "bg-neutral-subtle text-subtle hover:bg-neutral-subtle-hovered hover:text-default active:bg-neutral-subtle-pressed aria-expanded:bg-neutral-subtle-pressed aria-expanded:text-default data-[disabled]:not-data-[loading]:text-disabled",
  danger:
    "bg-danger-bold text-inverse hover:bg-danger-bold-hovered active:bg-danger-bold-pressed aria-expanded:bg-danger-bold-pressed data-[disabled]:not-data-[loading]:bg-disabled data-[disabled]:not-data-[loading]:text-disabled",
  link: "text-brand underline-offset-2 hover:underline data-[disabled]:not-data-[loading]:text-disabled",
};

const sizes: Record<ButtonSize, string> = {
  xsmall: "h-control-xsmall gap-050 px-100 font-body-small",
  small: "h-control-small px-150",
  medium: "h-control-medium px-150",
};

/** Shared styling for Button and real navigation links. Does not add interaction or ARIA. */
export function buttonVariants({
  variant = "secondary",
  size = "medium",
  isSelected,
  isFullWidth,
  className,
}: ButtonStyleProps & { className?: string | undefined } = {}) {
  return cn(
    base,
    variants[variant],
    variant === "link" ? "h-auto px-0" : sizes[size],
    isSelected &&
      "bg-selected text-selected hover:bg-selected-hovered active:bg-selected-pressed shadow-none",
    isFullWidth && "w-full",
    className,
  );
}

export type ButtonProps = ButtonPrimitive.Props &
  ButtonStyleProps & {
    /** Decorative leading icon, replaced by a spinner while loading. */
    iconBefore?: ReactElement | undefined;
    /** Decorative trailing icon. */
    iconAfter?: ReactElement | undefined;
    /** Block activation and show a spinner while keeping focus unless explicitly disabled. */
    isLoading?: boolean | undefined;
  };

// Render props merge child handlers before the primitive's handlers. Capture must block
// activation before that merge can run a child's action. Custom targets must forward props.
function guardActivation<Props extends DOMAttributes<HTMLElement>>(props: Props): Props {
  const guard =
    <Event extends SyntheticEvent<HTMLElement>>(handler?: (event: Event) => void) =>
    (event: Event) => {
      if ("key" in event && event.key !== "Enter" && event.key !== " ") {
        handler?.(event);
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      (event as Event & { preventBaseUIHandler?: () => void }).preventBaseUIHandler?.();
    };
  return {
    ...props,
    onClickCapture: guard(props.onClickCapture),
    onKeyDownCapture: guard(props.onKeyDownCapture),
    onKeyUpCapture: guard(props.onKeyUpCapture),
  };
}

function decorativeIcon(icon: ReactElement, position: "inline-start" | "inline-end") {
  return cloneElement(
    icon as ReactElement<{
      "aria-hidden"?: boolean;
      "data-icon"?: string;
    }>,
    { "aria-hidden": true, "data-icon": position },
  );
}

/** A Base UI action button with Ledger styling and a focus-preserving loading state. */
export function Button({
  variant = "secondary",
  size = "medium",
  iconBefore,
  iconAfter,
  isLoading,
  isSelected,
  isFullWidth,
  disabled = false,
  focusableWhenDisabled,
  className,
  children,
  render,
  ...props
}: ButtonProps) {
  const blocked = Boolean(disabled || isLoading);
  const element = isValidElement<{ children?: ReactNode }>(render) ? render : undefined;
  const content = children === undefined ? element?.props.children : children;
  const contents = (
    <>
      {isLoading ? (
        <Spinner
          data-icon="inline-start"
          isDecorative
          appearance={
            !isSelected && (variant === "primary" || variant === "danger") ? "inverse" : "subtle"
          }
        />
      ) : iconBefore ? (
        decorativeIcon(iconBefore, "inline-start")
      ) : null}
      {content}
      {iconAfter ? decorativeIcon(iconAfter, "inline-end") : null}
    </>
  );
  const composedRender: ButtonProps["render"] = element
    ? cloneElement(element, {
        ...(blocked ? guardActivation(element.props) : element.props),
        children: contents,
      })
    : typeof render === "function" && blocked
      ? (renderProps, state) => {
          const result = render(renderProps, state) as ReactElement<DOMAttributes<HTMLElement>>;
          return cloneElement(result, guardActivation(result.props));
        }
      : render;

  return (
    <ButtonPrimitive
      data-slot="button"
      data-loading={isLoading && !disabled ? "" : undefined}
      aria-pressed={isSelected}
      aria-busy={isLoading || undefined}
      {...(blocked ? guardActivation(props) : props)}
      disabled={blocked}
      focusableWhenDisabled={focusableWhenDisabled ?? Boolean(isLoading && !disabled)}
      className={classes(
        cn(
          buttonVariants({ variant, size, isSelected, isFullWidth }),
          variant !== "link" &&
            (iconBefore || isLoading) &&
            (size === "xsmall" ? "ps-075" : "ps-100"),
          variant !== "link" && iconAfter && (size === "xsmall" ? "pe-075" : "pe-100"),
          isLoading && "cursor-progress",
        ),
        className,
      )}
      render={composedRender}
    >
      {contents}
    </ButtonPrimitive>
  );
}

export type IconButtonProps = Omit<
  ButtonProps,
  "children" | "iconBefore" | "iconAfter" | "isFullWidth" | "aria-label" | "variant" | "size"
> & {
  /** Accessible action name, also used by the tooltip. */
  label: string;
  /** Decorative icon, replaced by a spinner while loading. */
  icon: ReactElement;
  variant?: "primary" | "secondary" | "subtle" | undefined;
  /** Small is 28px; medium is 32px with a larger icon. */
  size?: "small" | "medium" | undefined;
  /** Keep the accessible name while omitting the tooltip. */
  isTooltipDisabled?: boolean | undefined;
};

/** A square Button with a required accessible name and optional tooltip. */
export function IconButton({
  label,
  icon,
  size = "small",
  isTooltipDisabled,
  className,
  ...props
}: IconButtonProps) {
  const button = (
    <Button
      data-slot="icon-button"
      aria-label={label}
      iconBefore={icon}
      size={size}
      {...props}
      className={classes(
        cn(
          "shrink-0 px-0",
          size === "medium" ? "size-control-medium [&>svg]:size-icon-medium" : "size-control-small",
        ),
        className,
      )}
    />
  );
  return isTooltipDisabled ? (
    button
  ) : (
    <Tooltip>
      <TooltipTrigger render={button} />
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
