import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { Signature } from "lucide-react";
import {
  Children,
  cloneElement,
  createElement,
  isValidElement,
  useCallback,
  useEffect,
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

import { announce } from "../lib/announce";
import { classes } from "../lib/base-ui";
import { cn } from "../lib/cn";
import { useLedgerLocale } from "../lib/locale";
import { takesText } from "../lib/text-entry";
import { Stack } from "../primitives/stack";
import { VisuallyHidden } from "../primitives/visually-hidden";
import { getModifierKey, useFormatShortcut } from "./kbd";
import { Spinner } from "./spinner";
import { Tooltip, TooltipContent, TooltipTrigger, type TooltipProps } from "./tooltip";
import { Truncate } from "./truncate";

export type ButtonVariant = "primary" | "secondary" | "subtle" | "danger" | "link";
export type ButtonSize = "xsmall" | "small" | "medium" | "large";

type ButtonStyleProps = {
  /** Secondary is the default; primary emphasizes the main action. */
  variant?: ButtonVariant | undefined;
  /**
   * Medium is 32px, small 28px and xsmall 24px; large is 36px, for a record's action slot.
   * `variant="link"` ignores it: a link-styled action is as tall as its text.
   */
  size?: ButtonSize | undefined;
  /** Paint the selected state and, on Button, set aria-pressed. */
  isSelected?: boolean | undefined;
  /** Fill the available width. */
  isFullWidth?: boolean | undefined;
};

const base =
  "inline-flex select-none items-center justify-center gap-075 rounded-medium font-body font-medium transition-colors duration-fast ease-standard focus-visible:outline-focused disabled:pointer-events-none [&>svg]:size-icon-small [&>svg]:shrink-0";

// A bounded button keeps its label on one line: a label that needs two is a sentence.
const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-brand-bold text-inverse hover:bg-brand-bold-hovered active:bg-brand-bold-pressed aria-expanded:bg-brand-bold-pressed data-[disabled]:not-data-[loading]:bg-disabled data-[disabled]:not-data-[loading]:text-disabled whitespace-nowrap",
  secondary:
    "bg-surface-raised text-default shadow-raised hover:bg-surface-raised-hovered active:bg-surface-raised-pressed aria-expanded:bg-surface-raised-pressed data-[disabled]:not-data-[loading]:bg-disabled data-[disabled]:not-data-[loading]:text-disabled data-[disabled]:not-data-[loading]:shadow-none whitespace-nowrap",
  subtle:
    "bg-neutral-subtle text-subtle hover:bg-neutral-subtle-hovered hover:text-default active:bg-neutral-subtle-pressed aria-expanded:bg-neutral-subtle-pressed aria-expanded:text-default data-[disabled]:not-data-[loading]:bg-neutral-subtle data-[disabled]:not-data-[loading]:text-disabled whitespace-nowrap",
  danger:
    "bg-danger-bold text-inverse hover:bg-danger-bold-hovered active:bg-danger-bold-pressed aria-expanded:bg-danger-bold-pressed data-[disabled]:not-data-[loading]:bg-disabled data-[disabled]:not-data-[loading]:text-disabled whitespace-nowrap",
  // A link-styled action is only as tall as its text; on a touch screen it takes a 24px hit area.
  // It sets no white-space, so it wraps like the text around it, as a TextLink does: in a value or
  // a sentence its label goes on to the next line whole, its lines from the start, and in a table
  // cell that cuts its value it stays on one line, as the cell's text does.
  link: "relative touch-target text-start text-brand underline-offset-2 hover:underline data-[disabled]:not-data-[loading]:text-disabled data-[disabled]:not-data-[loading]:no-underline",
};

const sizes: Record<ButtonSize, string> = {
  xsmall: "h-control-xsmall gap-050 px-100 font-body-small",
  small: "h-control-small px-150",
  medium: "h-control-medium px-150",
  large: "h-control-large px-200",
};

/* A signature reads as a signature, never as the page's next act: the ink fill (neutral.bold, the
   text colour's own fill) where an act is the brand's, at the 36px size, with the signer's name.
   It is laid over whatever variant and size the button was given, so it is the whole look: the
   height and insets (the start inset for its mark), the type, the fill, its states, and the room to
   narrow so a cut label gives way before the signer. */
const signLook =
  "h-control-large px-200 ps-150 gap-075 font-body bg-neutral-bold text-inverse shadow-none hover:bg-neutral-bold-hovered hover:no-underline active:bg-neutral-bold-pressed aria-expanded:bg-neutral-bold-pressed data-[disabled]:not-data-[loading]:bg-disabled data-[disabled]:not-data-[loading]:text-disabled whitespace-nowrap min-w-0 max-w-full";

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
    /**
     * Block activation and show a spinner while keeping focus unless explicitly disabled. The
     * button keeps its width and its name: the spinner takes the leading icon's place, else the
     * trailing icon's, else it sits over the label, which keeps its space.
     */
    isLoading?: boolean | undefined;
    /**
     * What the pending work is, said once through the page's polite live region when loading
     * starts, such as "Saving requirement revision". `aria-busy` alone is not announced by the
     * major screen readers. Leave it out when something else on the page already says it.
     */
    loadingLabel?: string | undefined;
    /**
     * Why the action is unavailable, for an action that truly cannot run. The button is disabled
     * but stays in the tab order with `aria-disabled`, so the reader can reach it and learn why: the
     * reason shows in a tooltip on hover, on keyboard focus and on a tap, and is the button's
     * accessible description. It disables the button by itself and keeps it focusable even with
     * `disabled`. An empty string is no reason. Prefer an enabled action that explains on use, such
     * as a submit that reports what is missing.
     */
    disabledReason?: string | undefined;
    /**
     * For a slot narrower than the label, such as a rail, a card's footer or a table cell: the button
     * narrows to its container and cuts the label with an ellipsis, its icons whole. The whole label
     * stays the accessible name and shows in a tooltip on hover and keyboard focus while it is cut.
     * Write labels short enough not to need it; this is for the slot that cannot grow.
     */
    truncate?: boolean | undefined;
    /**
     * What a press means, where it is more than an act. `sign` records the reader's signature: the
     * button is drawn in ink, at the 36px size, with a signature mark before the label and the
     * signer's name after it, and Command+Enter (Control+Enter off Apple platforms) presses it from
     * anywhere on the page, never a bare Enter. In a slot narrower than it the label gives way with
     * an ellipsis and the signer stays whole. `variant`, `size`, `isSelected`, `truncate` and the
     * icons do not apply to it. One a page.
     */
    intent?: "sign" | undefined;
    /** With `intent="sign"`, who signs: the reader, by name ("R. Calloway"), drawn after the label and read with it. */
    signer?: string | undefined;
  };

type TooltipOpenChange = NonNullable<TooltipProps["onOpenChange"]>;

/** The words a Button shows as text: its string and number children, ignoring elements. */
function visibleText(content: ReactNode) {
  const words: string[] = [];
  Children.forEach(content, (child) => {
    if (typeof child === "string" || typeof child === "number") words.push(String(child));
  });
  return words.join(" ").replace(/\s+/g, " ").trim();
}

const warned = new Set<string>();
/**
 * An `aria-label` that leaves out the button's visible words breaks Label in Name (WCAG 2.5.3): a
 * speech-input user says what they see and nothing answers. Said once per label, never thrown.
 */
function useLabelInName(label: unknown, shown: string) {
  useEffect(() => {
    if (typeof label !== "string" || !shown) return;
    const fold = (text: string) => text.replace(/\s+/g, " ").trim().toLocaleLowerCase();
    if (fold(label).includes(fold(shown))) return;
    const message = `Ledger: the Button labelled "${label}" shows "${shown}", which its aria-label leaves out. Speech input says the visible words (WCAG 2.5.3, Label in Name): drop aria-label, or add context with aria-describedby.`;
    if (warned.has(message)) return;
    warned.add(message);
    console.warn(message);
  }, [label, shown]);
}

/** Says `label` through the polite live region when loading starts, not when it mounts loading. */
function useLoadingAnnouncement(isLoading: boolean, label: string | undefined) {
  const was = useRef(isLoading);
  useEffect(() => {
    if (isLoading && !was.current && label) announce(label);
    was.current = isLoading;
  }, [isLoading, label]);
}

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

type KeyHandler = DOMAttributes<HTMLElement>["onKeyDown"];

/*
 * Base UI's focusable disabled button prevents the default of every key but Tab, Escape included,
 * and a Shell.Panel or the side nav overlay leaves an Escape whose default is prevented to whatever
 * handled it, so Escape on an unavailable, loading or reasoned button never closed the surface
 * around it. Escape activates nothing, so the button's Base UI key handlers skip it: the
 * render element's own handler runs first (it is merged last) and stops them for Escape.
 */
function keepEscape(handler: KeyHandler): NonNullable<KeyHandler> {
  return (event) => {
    handler?.(event);
    if (event.key === "Escape")
      (event as typeof event & { preventBaseUIHandler?: () => void }).preventBaseUIHandler?.();
  };
}

/** The same for a render function's merged handlers, which run as one: Escape skips them. */
function withoutEscape(handler: KeyHandler): NonNullable<KeyHandler> {
  return (event) => {
    if (event.key !== "Escape") handler?.(event);
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
    // The 36px step keeps a wider inset beside its icon, after the default one it replaces.
    hasIconBefore && size === "large" && "ps-150",
    hasIconAfter && size === "large" && "pe-150",
  );
}

/** The keys that press a sign Button from anywhere on the page: Command+Enter, Control+Enter
    off Apple platforms. */
const SIGN_SHORTCUT = "Mod+Enter";
const OPEN_DIALOG = '[role="dialog"][data-open], [role="alertdialog"][data-open]';
/** A checkbox, a radio or a switch cancels Enter itself, since Enter never toggles one: the keys
    still sign from it. */
const TOGGLE = "[role='checkbox'], [role='radio'], [role='switch']";
/** The sign buttons mounted and able to run, in the order they became able. */
const signers: HTMLElement[] = [];

/** A sign button answers while it is shown and no open dialog sits over it: the topmost holds
    it, or none is open. */
function answers(button: HTMLElement) {
  if (!button.isConnected || button.getClientRects().length === 0) return false;
  const open = button.ownerDocument.querySelectorAll(OPEN_DIALOG);
  const top = open[open.length - 1];
  return !top || top.contains(button);
}

/**
 * Presses a sign button on Command+Enter (Control+Enter off Apple platforms) from anywhere on the
 * page: never a bare Enter, never with another modifier held, never on a repeat or while text is
 * composed, never once another handler has taken the key, never from a field that takes text (its
 * own Command+Enter wins), and never over a dialog that does not hold the button. Of the sign
 * buttons that could answer, the one that became able last does, so one press signs once: a
 * confirmation's sign over the page's.
 */
function useSignShortcut(node: RefObject<HTMLElement | null>, active: boolean) {
  useEffect(() => {
    const button = node.current;
    if (!active || !button) return undefined;
    signers.push(button);
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Enter" || event.repeat || event.isComposing) return;
      // A handler that took the key keeps it; a toggle's own cancel of Enter is not taking it.
      const target = event.target instanceof Element ? event.target : null;
      if (event.defaultPrevented && !target?.closest(TOGGLE)) return;
      const apple = getModifierKey() === "meta";
      const held = apple ? event.metaKey && !event.ctrlKey : event.ctrlKey && !event.metaKey;
      if (!held || event.altKey || event.shiftKey || takesText(event.target)) return;
      if (signers.filter(answers).at(-1) !== button) return;
      event.preventDefault();
      button.click();
    };
    const doc = button.ownerDocument;
    doc.addEventListener("keydown", onKey);
    return () => {
      doc.removeEventListener("keydown", onKey);
      const index = signers.indexOf(button);
      if (index >= 0) signers.splice(index, 1);
    };
  }, [node, active]);
}

/** A signature names its signer: said once in development, never thrown. */
function useSignerNamed(sign: boolean, signer: string | undefined) {
  useEffect(() => {
    if (!sign || signer) return;
    const message =
      'Ledger: a Button with intent="sign" names who signs in `signer`, drawn after its label.';
    if (warned.has(message)) return;
    warned.add(message);
    console.warn(message);
  }, [sign, signer]);
}

/** The button itself, without the tooltip a disabled reason adds. */
function ButtonBase({
  variant = "secondary",
  size = "medium",
  iconBefore,
  iconAfter,
  isLoading,
  loadingLabel,
  isSelected,
  isFullWidth,
  disabled = false,
  focusableWhenDisabled,
  disabledReason,
  truncate = false,
  className,
  children,
  render,
  carry,
  intent,
  signer,
  ref,
  ...props
}: ButtonProps & { carry?: RefObject<boolean> | undefined }) {
  const reasonId = useId();
  const node = useCarriedFocus(carry);
  const joinedRef = useJoinedRef(node, ref);
  const { t } = useLedgerLocale();
  const format = useFormatShortcut();
  // A signature has one look: ink, 36px, its mark first and the signer last. In a slot narrower
  // than it the label gives way with an ellipsis, as `truncate` cuts it, and the signer never does.
  // The variant, the size and the icons the caller gave are left for its look (signLook).
  const sign = intent === "sign";
  // The look a press wears: the sign's own, else the variant's (what buttonVariants draws).
  const look = sign ? "sign" : variant;
  const leading = sign ? <Signature /> : iconBefore;
  const trailing = sign ? undefined : iconAfter;
  const cut = sign || truncate;
  const reason = disabledReason ? disabledReason : undefined;
  const blocked = Boolean(disabled || isLoading || reason);
  useSignShortcut(node, sign && !blocked);
  useSignerNamed(sign, signer);
  const element = isValidElement<{ children?: ReactNode }>(render) ? render : undefined;
  const content = children === undefined ? element?.props.children : children;
  useLabelInName(props["aria-label"], visibleText(content));
  useLoadingAnnouncement(Boolean(isLoading), loadingLabel);
  // The signer, after a rule, read after the label in the locale's words ("as R. Calloway").
  const [readBefore = "", readAfter = ""] = t("buttonSigner").split("{signer}");
  const signed =
    sign && signer ? (
      <span
        data-slot="button-signer"
        className="shrink-0 border-s border-inverse ps-150 font-regular"
      >
        {readBefore ? <VisuallyHidden>{readBefore}</VisuallyHidden> : null}
        {signer}
        {readAfter ? <VisuallyHidden>{readAfter}</VisuallyHidden> : null}
      </span>
    ) : null;
  // Where the spinner goes, so the button never changes width: the leading icon's place, else the
  // trailing icon's, else over the label, which keeps its space (and the name) but not its ink.
  const spinnerAt = !isLoading ? undefined : leading ? "start" : trailing ? "end" : "over";
  // The spinner takes the text colour, so it follows the variant and forced colours alike.
  const spinner = (side: "inline-start" | "inline-end") => (
    <Spinner data-icon={side} isDecorative appearance="inherit" />
  );
  // A truncating label: the text gives way with an ellipsis and the whole of it shows while it is
  // cut. With a disabled reason the reason's tooltip names the action instead, so only one shows.
  const hasLabel = content !== undefined && content !== null && content !== false && content !== "";
  const label =
    cut && hasLabel ? (
      reason ? (
        <span className="min-w-0 truncate">{content}</span>
      ) : (
        <Truncate>{content}</Truncate>
      )
    ) : (
      content
    );
  const contents = (
    <>
      {spinnerAt === "start"
        ? spinner("inline-start")
        : leading
          ? decorativeIcon(leading, "inline-start")
          : null}
      {spinnerAt === "over" ? (
        <span
          data-slot="button-loading-label"
          className={cn(
            "inline-flex items-center opacity-0",
            size === "xsmall" ? "gap-050" : "gap-075",
            truncate && "min-w-0",
          )}
        >
          {label}
        </span>
      ) : (
        label
      )}
      {signed}
      {spinnerAt === "end"
        ? spinner("inline-end")
        : trailing
          ? decorativeIcon(trailing, "inline-end")
          : null}
      {spinnerAt === "over" ? (
        <span
          aria-hidden
          data-slot="button-loading-spinner"
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
        >
          <Spinner isDecorative appearance="inherit" className="size-icon-small" />
        </span>
      ) : null}
      {/* The description is hidden: the name leaves it out, aria-describedby still reads it. */}
      {reason ? (
        <span id={reasonId} data-slot="button-disabled-reason" hidden>
          {reason}
        </span>
      ) : null}
    </>
  );
  // Blocked but still in the tab order: aria-disabled rather than native disabled. Only while
  // blocked, so an enabled button that may become unavailable carries no aria-disabled="false",
  // and it keeps focus when it does, since it never turns native disabled.
  const focusable =
    blocked && (reason !== undefined || (focusableWhenDisabled ?? Boolean(isLoading && !disabled)));
  const composedRender: ButtonProps["render"] = element
    ? cloneElement(element, {
        ...(blocked ? guardActivation(element.props) : element.props),
        ...(focusable
          ? { onKeyDown: keepEscape((element.props as DOMAttributes<HTMLElement>).onKeyDown) }
          : {}),
        children: contents,
      })
    : typeof render === "function" && blocked
      ? (renderProps, state) => {
          const result = render(renderProps, state) as ReactElement<DOMAttributes<HTMLElement>>;
          return cloneElement(result, {
            ...guardActivation(result.props),
            ...(focusable ? { onKeyDown: withoutEscape(result.props.onKeyDown) } : {}),
          });
        }
      : render === undefined && focusable
        ? // The same button Base UI would render, with the handler that lets Escape through.
          createElement("button", { onKeyDown: keepEscape(undefined) })
        : render;

  return (
    <ButtonPrimitive
      data-slot="button"
      data-loading={isLoading && !disabled ? "" : undefined}
      aria-pressed={sign ? undefined : isSelected}
      aria-busy={isLoading || undefined}
      {...(blocked ? guardActivation(props) : props)}
      {...(sign ? { "aria-keyshortcuts": format(SIGN_SHORTCUT, "aria") } : {})}
      data-button-variant={look}
      ref={joinedRef}
      aria-describedby={describedBy(props["aria-describedby"], reason && reasonId)}
      disabled={blocked}
      focusableWhenDisabled={focusable}
      className={classes(
        cn(
          buttonVariants({ variant, size, isSelected, isFullWidth }),
          iconInsets({
            variant,
            size,
            hasIconBefore: Boolean(iconBefore),
            hasIconAfter: Boolean(iconAfter),
          }),
          spinnerAt === "over" && "relative",
          truncate && "min-w-0 max-w-full",
          isLoading && "cursor-progress",
          reason && !isLoading && "cursor-not-allowed",
          look === "sign" && signLook,
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
  // A truncated label may be cut, so the reason's tooltip names the action as well.
  const shown = props.truncate ? visibleText(props.children) : "";
  return props.disabledReason ? (
    <ReasonTooltip trigger={button}>
      {shown ? labelAndReason(shown, props.disabledReason) : props.disabledReason}
    </ReasonTooltip>
  ) : (
    button
  );
}

/** The square sizes of an icon-only control: Button's four, and the 20px row control. */
export type IconButtonSize = "xxsmall" | "xsmall" | ButtonSize;

/**
 * Package-internal: an icon-only control's square, for IconButton and LinkIconButton. `xxsmall` is
 * the 20px row control (a table's disclosure or row action, a tree's twisty, a row's chevron),
 * with the small radius the row's other controls use.
 */
export function squareSize(size: IconButtonSize) {
  return {
    // Base UI's button box sizes on Button's scale; xxsmall is xsmall's box drawn smaller.
    base: size === "xxsmall" ? ("xsmall" as const) : size,
    className: {
      xxsmall: "size-250 rounded-small",
      xsmall: "size-control-xsmall",
      small: "size-control-small",
      medium: "size-control-medium [&>svg]:size-icon-medium",
      large: "size-control-large [&>svg]:size-icon-medium",
    }[size],
  };
}

export type IconButtonProps = Omit<
  ButtonProps,
  | "children"
  | "iconBefore"
  | "iconAfter"
  | "isFullWidth"
  | "aria-label"
  | "variant"
  | "size"
  | "truncate"
  | "intent"
  | "signer"
> & {
  /** Accessible action name, also used by the tooltip. */
  label: string;
  /** Decorative icon, replaced by a spinner while loading. */
  icon: ReactElement;
  variant?: "primary" | "secondary" | "subtle" | undefined;
  /**
   * Small is 28px, the default; medium 32px with a larger icon; large 36px, beside a large Button
   * in a record's action slot; xsmall 24px, beside an xsmall Button; xxsmall 20px, the row control
   * in a table, tree or list row. Where any pointer is coarse each takes a hit area of at least 24px.
   */
  size?: IconButtonSize | undefined;
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
  const square = squareSize(size);
  const button = (
    <ButtonBase
      data-slot="icon-button"
      aria-label={label}
      iconBefore={icon}
      size={square.base}
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
        // A row or tree that sizes the button down to 20px still gets a 24px hit area on touch.
        cn("relative shrink-0 touch-target p-0", square.className),
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
