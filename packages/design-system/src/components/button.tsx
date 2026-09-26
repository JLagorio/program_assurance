import { Button as ButtonPrimitive } from "@base-ui/react/button";
import {
  cloneElement,
  isValidElement,
  useCallback,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type DOMAttributes,
  type FocusEvent,
  type ReactElement,
  type ReactNode,
  type Ref,
  type RefObject,
  type SyntheticEvent,
} from "react";

import { classes } from "../lib/base-ui";
import { cn } from "../lib/cn";
import { Stack } from "../primitives/stack";
import { Spinner } from "./spinner";
import { Tooltip, TooltipContent, TooltipTrigger, type TooltipProps } from "./tooltip";

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
    "bg-neutral-subtle text-subtle hover:bg-neutral-subtle-hovered hover:text-default active:bg-neutral-subtle-pressed aria-expanded:bg-neutral-subtle-pressed aria-expanded:text-default data-[disabled]:not-data-[loading]:bg-neutral-subtle data-[disabled]:not-data-[loading]:text-disabled",
  danger:
    "bg-danger-bold text-inverse hover:bg-danger-bold-hovered active:bg-danger-bold-pressed aria-expanded:bg-danger-bold-pressed data-[disabled]:not-data-[loading]:bg-disabled data-[disabled]:not-data-[loading]:text-disabled",
  // A link-styled action is only as tall as its text; on a touch screen it takes a 24px hit area.
  link: "relative touch-target text-brand underline-offset-2 hover:underline data-[disabled]:not-data-[loading]:text-disabled data-[disabled]:not-data-[loading]:no-underline",
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
    /**
     * Why the action is unavailable, for an action that truly cannot run. The button is disabled
     * but stays in the tab order with `aria-disabled`, so the reader can reach it and learn why: the
     * reason shows in a tooltip on hover, on keyboard focus and on a tap, and is the button's
     * accessible description. It disables the button by itself and keeps it focusable even with
     * `disabled`. An empty string is no reason. Prefer an enabled action that explains on use, such
     * as a submit that reports what is missing.
     */
    disabledReason?: string | undefined;
  };

type TooltipOpenChange = NonNullable<TooltipProps["onOpenChange"]>;

/** Joins a caller's `aria-describedby` with the part's own description, keeping both. */
function describedBy(own: string | undefined, added: string | undefined) {
  return [own, added].filter(Boolean).join(" ") || undefined;
}

/**
 * Package-internal: keeps focus on a control whose reason comes or goes while it has focus. The
 * reason's tooltip wraps the control in a different tree, which remounts it; the outgoing control
 * notes that it had focus (its layout cleanup runs while it is still in the document) and the
 * incoming one takes it back in the same commit, so focus never falls to the page. `carry` belongs
 * to the part that stays mounted. Returns the ref to put on the control's element.
 */
export function useCarriedFocus(carry: RefObject<boolean> | undefined) {
  const node = useRef<HTMLElement | null>(null);
  useLayoutEffect(() => {
    if (!carry) return undefined;
    if (carry.current) {
      carry.current = false;
      node.current?.focus({ preventScroll: true });
    }
    return () => {
      const element = node.current;
      carry.current = element !== null && element.ownerDocument.activeElement === element;
    };
  }, [carry]);
  return node;
}

/** Puts one element in both a caller's ref and the part's own. */
function useJoinedRef<T>(own: RefObject<T | null>, theirs: Ref<T> | undefined) {
  return useCallback(
    (element: T | null) => {
      own.current = element;
      if (typeof theirs === "function") {
        // A React 19 ref cleanup replaces the call with null, so it has to clear ours too.
        const cleanup = theirs(element);
        return typeof cleanup === "function"
          ? () => {
              own.current = null;
              cleanup();
            }
          : undefined;
      }
      if (theirs) theirs.current = element;
      return undefined;
    },
    [own, theirs],
  );
}

/**
 * The tooltip a control with a disabled reason carries. It opens on hover and keyboard focus, as
 * any tooltip does, and on a tap or a pen press, which a tooltip alone never sees, so the reason is
 * never hover-only. A tap outside or Escape closes it. Package-internal: Button, IconButton,
 * LinkButton and LinkIconButton share it.
 */
export function ReasonTooltip({
  trigger,
  children,
  onOpenChange,
}: {
  trigger: ReactElement;
  children: ReactNode;
  onOpenChange?: TooltipOpenChange | undefined;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Tooltip
      open={open}
      onOpenChange={(next, details) => {
        onOpenChange?.(next, details);
        if (!details.isCanceled) setOpen(next);
      }}
    >
      <TooltipTrigger
        render={trigger}
        closeOnClick={false}
        onPointerUp={(event) => {
          if (event.pointerType !== "mouse") setOpen(true);
        }}
      />
      <TooltipContent>{children}</TooltipContent>
    </Tooltip>
  );
}

/** A tooltip that names an icon-only control and, when it is unavailable, says why. */
export function labelAndReason(label: string, reason: string) {
  return (
    <Stack as="span" alignInline="start">
      <span className="font-medium">{label}</span>
      <span>{reason}</span>
    </Stack>
  );
}

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

/** Package-internal: marks an icon decorative and tags its side, for Button and LinkButton. */
export function decorativeIcon(icon: ReactElement, position: "inline-start" | "inline-end") {
  return cloneElement(
    icon as ReactElement<{
      "aria-hidden"?: boolean;
      "data-icon"?: string;
    }>,
    { "aria-hidden": true, "data-icon": position },
  );
}

/** Package-internal: the smaller inset on the side that holds an icon, for Button and LinkButton. */
export function iconInsets({
  variant,
  size,
  hasIconBefore,
  hasIconAfter,
}: {
  variant: ButtonVariant;
  size: ButtonSize;
  hasIconBefore: boolean;
  hasIconAfter: boolean;
}) {
  if (variant === "link") return undefined;
  return cn(
    hasIconBefore && (size === "xsmall" ? "ps-075" : "ps-100"),
    hasIconAfter && (size === "xsmall" ? "pe-075" : "pe-100"),
  );
}

/** The button itself, without the tooltip a disabled reason adds. */
function ButtonBase({
  variant = "secondary",
  size = "medium",
  iconBefore,
  iconAfter,
  isLoading,
  isSelected,
  isFullWidth,
  disabled = false,
  focusableWhenDisabled,
  disabledReason,
  className,
  children,
  render,
  carry,
  ref,
  ...props
}: ButtonProps & { carry?: RefObject<boolean> | undefined }) {
  const reasonId = useId();
  const joinedRef = useJoinedRef(useCarriedFocus(carry), ref);
  const reason = disabledReason ? disabledReason : undefined;
  const blocked = Boolean(disabled || isLoading || reason);
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
      {/* The description is hidden: the name leaves it out, aria-describedby still reads it. */}
      {reason ? (
        <span id={reasonId} data-slot="button-disabled-reason" hidden>
          {reason}
        </span>
      ) : null}
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
      ref={joinedRef}
      aria-describedby={describedBy(props["aria-describedby"], reason && reasonId)}
      disabled={blocked}
      focusableWhenDisabled={
        reason !== undefined || (focusableWhenDisabled ?? Boolean(isLoading && !disabled))
      }
      className={classes(
        cn(
          buttonVariants({ variant, size, isSelected, isFullWidth }),
          iconInsets({
            variant,
            size,
            hasIconBefore: Boolean(iconBefore || isLoading),
            hasIconAfter: Boolean(iconAfter),
          }),
          isLoading && "cursor-progress",
          reason && !isLoading && "cursor-not-allowed",
        ),
        className,
      )}
      render={composedRender}
    >
      {contents}
    </ButtonPrimitive>
  );
}

/**
 * A Base UI action button with Ledger styling and a focus-preserving loading state. With
 * `disabledReason` it stays focusable and says why it is unavailable.
 */
export function Button({
  variant = "secondary",
  size = "medium",
  disabled = false,
  ...props
}: ButtonProps) {
  const carry = useRef(false);
  const button = (
    <ButtonBase variant={variant} size={size} disabled={disabled} carry={carry} {...props} />
  );
  return props.disabledReason ? (
    <ReasonTooltip trigger={button}>{props.disabledReason}</ReasonTooltip>
  ) : (
    button
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
  /** Keep the accessible name while omitting the tooltip. A `disabledReason` still shows its own. */
  isTooltipDisabled?: boolean | undefined;
};

/** The popup a focused element sits in: a menu, a listbox, a dialog. */
const popupOf = (node: EventTarget | null) =>
  node instanceof Element
    ? node.closest('[role="menu"], [role="listbox"], [role="dialog"], [role="alertdialog"]')
    : null;

/**
 * Tells focus that comes back to a button from the popup it opened apart from focus that arrives.
 * Focus leaves for the popup while the button is expanded (or, for a hand-made trigger with
 * aria-haspopup, into a popup), and never for a dialog, menu or listbox that also holds the button:
 * a disclosure expanded inside a dialog moves focus within that dialog, not into a popup. It comes
 * back from that popup, or from nowhere because the popup's focused element went with it. Arriving
 * by Tab or a click is not a return.
 */
function useFocusReturn() {
  const leftFor = useRef<{ popup: Element | null } | null>(null);
  const returning = useRef(false);
  return {
    returning,
    onBlurCapture: (event: FocusEvent<HTMLElement>) => {
      const button = event.currentTarget;
      const popup = popupOf(event.relatedTarget);
      const ownContainer = popup?.contains(button) ?? false;
      const opened =
        !ownContainer &&
        (button.getAttribute("aria-expanded") === "true" ||
          (button.hasAttribute("aria-haspopup") && popup !== null));
      returning.current = false;
      leftFor.current = opened ? { popup } : null;
    },
    onFocusCapture: (event: FocusEvent<HTMLElement>) => {
      const left = leftFor.current;
      const from = event.relatedTarget;
      leftFor.current = null;
      returning.current =
        left !== null &&
        (!(from instanceof Node) || !from.isConnected || Boolean(left.popup?.contains(from)));
    },
  };
}

/**
 * A square Button with a required accessible name and optional tooltip. The tooltip opens on hover
 * and on focus that arrives; focus that comes back from a popup the button opened (a menu closed
 * with Escape or by choosing, a dialog closed) leaves it shut, so the next Escape reaches whatever
 * holds the button. With `disabledReason` the tooltip names the action and says why it is
 * unavailable, and it also opens on a tap.
 */
export function IconButton({
  label,
  icon,
  size = "small",
  isTooltipDisabled,
  className,
  ...props
}: IconButtonProps) {
  const focusReturn = useFocusReturn();
  const carry = useRef(false);
  const { onBlurCapture, onFocusCapture } = props;
  const reason = props.disabledReason ? props.disabledReason : undefined;
  // A reason always gets its tooltip, even when the label's is suppressed.
  const hasTooltip = !isTooltipDisabled || reason !== undefined;
  const cancelOnReturn: TooltipOpenChange = (open, details) => {
    if (open && details.reason === "trigger-focus" && focusReturn.returning.current)
      details.cancel();
  };
  const button = (
    <ButtonBase
      data-slot="icon-button"
      aria-label={label}
      iconBefore={icon}
      size={size}
      {...props}
      carry={carry}
      onBlurCapture={(event) => {
        onBlurCapture?.(event);
        if (hasTooltip) focusReturn.onBlurCapture(event);
      }}
      onFocusCapture={(event) => {
        onFocusCapture?.(event);
        if (hasTooltip) focusReturn.onFocusCapture(event);
      }}
      className={classes(
        cn(
          // A row or tree that sizes the button down to 20px still gets a 24px hit area on touch.
          "relative shrink-0 touch-target p-0",
          size === "medium" ? "size-control-medium [&>svg]:size-icon-medium" : "size-control-small",
        ),
        className,
      )}
    />
  );
  if (reason !== undefined)
    return (
      <ReasonTooltip trigger={button} onOpenChange={cancelOnReturn}>
        {isTooltipDisabled ? reason : labelAndReason(label, reason)}
      </ReasonTooltip>
    );
  return isTooltipDisabled ? (
    button
  ) : (
    <Tooltip onOpenChange={cancelOnReturn}>
      <TooltipTrigger render={button} />
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
