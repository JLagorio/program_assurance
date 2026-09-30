import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import {
  cloneElement,
  isValidElement,
  useId,
  useRef,
  type MouseEvent,
  type ReactElement,
  type ReactNode,
  type RefObject,
} from "react";

import { cn } from "../lib/cn";
import {
  ReasonTooltip,
  buttonVariants,
  decorativeIcon,
  iconInsets,
  labelAndReason,
  squareSize,
  useCarriedFocus,
  type ButtonSize,
  type IconButtonSize,
} from "./button";
import { Tooltip, TooltipContent, TooltipTrigger } from "./tooltip";

/* Navigation that looks like a button. It is an anchor, never a Base UI Button: a link keeps its
   href, its middle click and its open-in-new-tab, and Base UI's native-button check never sees it.
   A router link comes in through `render`, as it does for TextLink. */

export type LinkButtonVariant = "primary" | "secondary" | "subtle" | "danger";

export type LinkButtonProps = useRender.ComponentProps<"a"> & {
  /** Secondary is the default; primary emphasizes the main destination. A link in text is TextLink. */
  variant?: LinkButtonVariant | undefined;
  /** Medium is 32px, small 28px and xsmall 24px, as on Button. */
  size?: ButtonSize | undefined;
  /** Fill the available width. */
  isFullWidth?: boolean | undefined;
  /** Decorative leading icon. */
  iconBefore?: ReactElement | undefined;
  /** Decorative trailing icon, such as an arrow or an external-link mark. */
  iconAfter?: ReactElement | undefined;
  /**
   * Why the destination is unavailable. The link loses its href and stays in the tab order as a
   * disabled link (`role="link"`, `aria-disabled`); the reason shows in a tooltip on hover, on
   * keyboard focus and on a tap, and is the link's accessible description. While it is set, a
   * `render` element is not rendered, only its children, so a router link cannot navigate. An
   * empty string is no reason.
   */
  disabledReason?: string | undefined;
};

/** Stops a click and a middle click from reaching the link or its router while it is unavailable. */
const stop = (event: MouseEvent<HTMLElement>) => {
  event.preventDefault();
  event.stopPropagation();
};

const iconOnly = (size: IconButtonSize, className: string | undefined) =>
  // A row or tree that sizes the link down to 20px still gets a 24px hit area on touch.
  cn("relative shrink-0 touch-target p-0", squareSize(size).className, className);

/** The anchor itself, without the tooltip a disabled reason adds. */
function LinkButtonBase({
  variant = "secondary",
  size = "medium",
  isFullWidth,
  iconBefore,
  iconAfter,
  disabledReason,
  render,
  className,
  children,
  carry,
  ...props
}: LinkButtonProps & { carry?: RefObject<boolean> | undefined }) {
  const reasonId = useId();
  const carriedRef = useCarriedFocus(carry);
  const reason = disabledReason ? disabledReason : undefined;
  const element = isValidElement<{ children?: ReactNode }>(render) ? render : undefined;
  const content = children === undefined ? element?.props.children : children;
  const contents = (
    <>
      {iconBefore ? decorativeIcon(iconBefore, "inline-start") : null}
      {content}
      {iconAfter ? decorativeIcon(iconAfter, "inline-end") : null}
      {/* The description is hidden: the name leaves it out, aria-describedby still reads it. */}
      {reason ? (
        <span id={reasonId} data-slot="link-button-disabled-reason" hidden>
          {reason}
        </span>
      ) : null}
    </>
  );
  // A render element's own children would win the merge, so the composed contents replace them.
  const composedRender = reason
    ? undefined
    : element
      ? cloneElement(element, { children: contents })
      : render;
  return useRender({
    defaultTagName: "a",
    render: composedRender,
    ref: carriedRef,
    state: { slot: "link-button" },
    props: mergeProps<"a">(
      {
        // A data attribute goes in through a spread, which the anchor's prop type does not check.
        ...{ "data-button-variant": variant },
        className: cn(
          buttonVariants({ variant, size, isFullWidth }),
          iconInsets({
            variant,
            size,
            hasIconBefore: Boolean(iconBefore),
            hasIconAfter: Boolean(iconAfter),
          }),
          reason && "cursor-not-allowed",
          className,
        ),
      },
      props,
      {
        children: contents,
        ...(reason
          ? {
              href: undefined,
              role: "link",
              tabIndex: 0,
              "aria-disabled": true,
              "data-disabled": "",
              "aria-describedby": [props["aria-describedby"], reasonId].filter(Boolean).join(" "),
              onClickCapture: stop,
              onAuxClickCapture: stop,
            }
          : {}),
      },
    ),
  });
}

/**
 * Navigation with Button's look: an anchor, or a router link through `render`, with Button's
 * variants, sizes, icon slots and insets. Use Button for an action and TextLink for a link in text.
 */
export function LinkButton({ variant = "secondary", size = "medium", ...props }: LinkButtonProps) {
  const carry = useRef(false);
  const link = <LinkButtonBase variant={variant} size={size} carry={carry} {...props} />;
  return props.disabledReason ? (
    <ReasonTooltip trigger={link}>{props.disabledReason}</ReasonTooltip>
  ) : (
    link
  );
}

export type LinkIconButtonProps = Omit<
  LinkButtonProps,
  "children" | "iconBefore" | "iconAfter" | "isFullWidth" | "aria-label" | "variant" | "size"
> & {
  /** The destination's accessible name, also used by the tooltip. */
  label: string;
  /** Decorative icon. */
  icon: ReactElement;
  variant?: "primary" | "secondary" | "subtle" | undefined;
  /** As on IconButton: small 28px (the default), medium 32px, xsmall 24px and xxsmall 20px, the row control. */
  size?: IconButtonSize | undefined;
  /** Keep the accessible name while omitting the tooltip. A `disabledReason` still shows its own. */
  isTooltipDisabled?: boolean | undefined;
};

/**
 * A square LinkButton with a required accessible name and a tooltip: a destination shown as an
 * icon, such as a record opened in a new tab. An icon-only action is IconButton.
 */
export function LinkIconButton({
  label,
  icon,
  size = "small",
  isTooltipDisabled,
  className,
  ...props
}: LinkIconButtonProps) {
  const reason = props.disabledReason ? props.disabledReason : undefined;
  const carry = useRef(false);
  const link = (
    <LinkButtonBase
      data-slot="link-icon-button"
      aria-label={label}
      iconBefore={icon}
      size={squareSize(size).base}
      {...props}
      carry={carry}
      className={iconOnly(size, className)}
    />
  );
  if (reason !== undefined)
    return (
      <ReasonTooltip trigger={link}>
        {isTooltipDisabled ? reason : labelAndReason(label, reason)}
      </ReasonTooltip>
    );
  return isTooltipDisabled ? (
    link
  ) : (
    <Tooltip>
      <TooltipTrigger render={link} />
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
