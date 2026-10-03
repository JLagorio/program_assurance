import { Dialog as Primitive } from "@base-ui/react/dialog";
import { DirectionProvider } from "@base-ui/react/direction-provider";
import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { X } from "lucide-react";
import { useMemo, useRef, type ComponentProps, type CSSProperties } from "react";
import { classes } from "../lib/base-ui";
import { cn } from "../lib/cn";
import { useLedgerLocale } from "../lib/locale";
import { Heading } from "../primitives/heading";
import { HeadingLevelProvider } from "../primitives/heading-level";
import { Button, IconButton } from "./button";
import {
  OverlayPendingContext,
  OverlayRootContext,
  bodySlot,
  dialogFrame,
  dialogRoom,
  focusPastClose,
  overlaySurface,
  pendingCloseRender,
  pendingOpenChange,
  useBlanketPress,
  useFooterClearance,
  useOpener,
  useOpenerFocus,
  useOverlayPending,
  useReadOnlyScroller,
  withStyle,
} from "./overlay";

export type DialogProps<Payload = unknown> = Primitive.Root.Props<Payload> & {
  /**
   * A save or another command is in flight. Every request to close is cancelled before
   * `onOpenChange` hears of it (Escape, the blanket, the close button, a DialogClose), the close
   * controls are disabled (the built-in close button, and a close rendered as a kit Button, stay
   * focusable with `aria-disabled`, so focus on them is kept), and the popup is
   * `aria-busy`. An imperative close through `actionsRef`, or `open={false}`, still closes: end
   * the pending state when the command settles. It does not disable the form; wrap the fields in
   * `<FieldSet disabled={pending}>` and give the submit button `isLoading`. @default false
   */
  pending?: boolean | undefined;
};
export function Dialog<Payload = unknown>({
  pending = false,
  onOpenChange,
  disablePointerDismissal,
  ...props
}: DialogProps<Payload>) {
  const { direction } = useLedgerLocale();
  const opener = useOpener(props.open);
  const holdsBlanket = pending || Boolean(disablePointerDismissal);
  const root = useMemo(() => ({ opener, holdsBlanket }), [opener, holdsBlanket]);
  return (
    <DirectionProvider direction={direction}>
      <OverlayRootContext.Provider value={root}>
        <OverlayPendingContext.Provider value={pending}>
          <Primitive.Root
            {...props}
            disablePointerDismissal={pending || disablePointerDismissal}
            onOpenChange={pendingOpenChange(pending, onOpenChange)}
          />
        </OverlayPendingContext.Provider>
      </OverlayRootContext.Provider>
    </DirectionProvider>
  );
}
export type DialogTriggerProps<Payload = unknown> = Primitive.Trigger.Props<Payload>;
export function DialogTrigger<Payload = unknown>(props: DialogTriggerProps<Payload>) {
  return <Primitive.Trigger {...props} data-slot="dialog-trigger" />;
}
export type DialogPortalProps = Primitive.Portal.Props;
export function DialogPortal(props: DialogPortalProps) {
  return <Primitive.Portal {...props} />;
}
export type DialogOverlayProps = Primitive.Backdrop.Props;
/**
 * The blanket. While a press on it leaves the dialog open (`pending`, `disablePointerDismissal`),
 * the press keeps focus where the reader has it instead of dropping it to the page.
 */
export function DialogOverlay({ className, onMouseDown, ...props }: DialogOverlayProps) {
  const press = useBlanketPress();
  return (
    <Primitive.Backdrop
      {...props}
      data-slot="dialog-overlay"
      onMouseDown={(event) => {
        press?.(event);
        onMouseDown?.(event);
      }}
      className={classes(
        "fixed inset-0 z-overlay bg-blanket data-open:animate-dim-in data-closed:animate-dim-out",
        className,
      )}
    />
  );
}
export type DialogCloseProps = Primitive.Close.Props;
/**
 * Closes the dialog. Disabled while the Dialog is `pending`; rendered as a kit Button or IconButton
 * it stays focusable then, with `aria-disabled`, so focus on it is kept.
 */
export function DialogClose({ disabled, render, ...props }: DialogCloseProps) {
  const pending = useOverlayPending();
  return (
    <Primitive.Close
      {...props}
      data-slot="dialog-close"
      render={pendingCloseRender(render, pending)}
      disabled={pending || disabled}
    />
  );
}

/** The dialog's width steps. Without `width` a dialog is `medium`. */
export type DialogWidth = "small" | "medium" | "large" | "xlarge" | "fullscreen";
/**
 * The alert dialog's width steps: Dialog's `small` and `medium`, and `xsmall` below them for a
 * one-line question. Without `width` an alert dialog is `small`.
 */
export type AlertDialogWidth = "xsmall" | "small" | "medium";
// The kit's one place for the dialog widths, Dialog's steps and AlertDialog's, so one word is one
// width in both. Every step keeps the frame's `space.200` gutter on each side of the window
// (overlay.tsx).
const dialogWidths: Record<DialogWidth | AlertDialogWidth, CSSProperties> = {
  xsmall: { maxWidth: 320 },
  small: { maxWidth: 400 },
  medium: { maxWidth: 520 },
  large: { maxWidth: 760 },
  xlarge: { maxWidth: 960 },
  fullscreen: { maxWidth: "none", height: dialogRoom("100dvh") },
};
/** Package-internal: AlertDialogContent reads the same steps. */
export { dialogWidths };

export type DialogContentProps = Primitive.Popup.Props & {
  /**
   * Renders the close button at the top end, first in the Tab order as it is drawn. It is disabled,
   * and keeps focus, while the Dialog is `pending`. @default true
   */
  showCloseButton?: boolean | undefined;
  /**
   * The popup's width: `small` 400px for a short question, `medium` 520px for a form of a few
   * fields, `large` 760px for a form in two columns or a table, `xlarge` 960px for a table beside
   * a preview, `fullscreen` for a task that needs the whole window. Every step keeps a `space.200`
   * gutter on each side, so it narrows to the window less the gutter. A `style.maxWidth` still
   * wins. @default "medium"
   */
  width?: DialogWidth | undefined;
};
export function DialogContent({
  className,
  children,
  dir,
  showCloseButton = true,
  width,
  style,
  initialFocus,
  finalFocus,
  ...props
}: DialogContentProps) {
  const { direction, t } = useLedgerLocale();
  const pending = useOverlayPending();
  const closeRef = useRef<HTMLButtonElement>(null);
  const returnFocus = useOpenerFocus();
  const own = { ...overlaySurface, ...dialogFrame, ...dialogWidths[width ?? "medium"] };
  return (
    <DirectionProvider direction={dir === "rtl" || dir === "ltr" ? dir : direction}>
      <DialogPortal>
        <DialogOverlay />
        <Primitive.Popup
          dir={dir ?? direction}
          {...(width ? { "data-width": width } : {})}
          {...(pending ? { "aria-busy": true, "data-pending": "" } : {})}
          {...props}
          data-slot="dialog-content"
          // With the close button first in the DOM, the first field still takes focus by default.
          initialFocus={
            initialFocus === undefined && showCloseButton ? focusPastClose(closeRef) : initialFocus
          }
          finalFocus={finalFocus === undefined ? returnFocus : finalFocus}
          style={withStyle(own, style)}
          className={classes(
            // The popup scrolls as a fallback: a DialogBody normally takes the overflow, and in a
            // short window (under 30rem) the header scrolls away with the body and the footer stays.
            "fixed left-1/2 top-1/2 z-overlay flex -translate-x-1/2 -translate-y-1/2 flex-col overflow-y-auto overscroll-none rounded-xxlarge bg-surface-overlay text-default shadow-overlay outline-none data-open:animate-dialog-in data-closed:animate-dialog-out",
            className,
          )}
        >
          {/* First in the DOM, so Tab reaches it where it is drawn, before the body. */}
          {showCloseButton && (
            <DialogClose
              ref={closeRef}
              render={
                <IconButton
                  label={t("close")}
                  icon={<X />}
                  variant="subtle"
                  isTooltipDisabled
                  disabled={pending}
                  focusableWhenDisabled
                  className="absolute end-150 top-100 z-10"
                />
              }
            />
          )}
          {/* The title is the dialog's h2; headings inside take the next level. */}
          <HeadingLevelProvider level={3}>{children}</HeadingLevelProvider>
        </Primitive.Popup>
      </DialogPortal>
    </DirectionProvider>
  );
}
export type DialogHeaderProps = ComponentProps<"div">;
export function DialogHeader({ className, ...props }: DialogHeaderProps) {
  return (
    <div
      {...props}
      data-slot="dialog-header"
      className={cn(
        "flex shrink-0 flex-col gap-025 border-b border-default py-150 pe-600 ps-250",
        className,
      )}
    />
  );
}
export type DialogBodyProps = useRender.ComponentProps<"div">;
/**
 * The one scrolling region between DialogHeader and DialogFooter, with the dialog's inset. It
 * takes the height the header and footer leave, at least 80px, and scrolls inside it; in a window
 * under 30rem tall it grows to its content instead, so the whole popup scrolls as one with the
 * footer held at the bottom. While it overflows with nothing to focus inside, it is a tab stop so
 * the keyboard can scroll it. A form can sit inside it, with the submit button in the footer
 * joined to it through `form`.
 */
export function DialogBody({ className, render, ref, ...props }: DialogBodyProps) {
  const own = useReadOnlyScroller<HTMLDivElement>();
  return useRender({
    defaultTagName: "div",
    render,
    ref: ref ? [own, ref] : own,
    props: mergeProps<"div">(props, {
      ...bodySlot("dialog-body"),
      className: cn(
        "min-h-1000 min-w-0 flex-1 overflow-y-auto overscroll-none p-250 outline-none focus-visible:outline-field-focused",
        className,
      ),
    }),
  });
}
export type DialogFooterProps = ComponentProps<"div"> & {
  /**
   * Adds a subtle Close button before the children, where Cancel goes, disabled while the Dialog
   * is `pending`. @default false
   */
  showCloseButton?: boolean | undefined;
};
/**
 * The action row, held at the bottom. When the whole popup scrolls (a window under 30rem tall), a
 * control that takes focus scrolls clear of it rather than under it.
 */
export function DialogFooter({
  className,
  children,
  showCloseButton = false,
  ref,
  ...props
}: DialogFooterProps) {
  const { t } = useLedgerLocale();
  const clearance = useFooterClearance(ref);
  return (
    <div
      {...props}
      data-slot="dialog-footer"
      className={cn(
        "sticky bottom-0 z-10 flex shrink-0 flex-wrap items-center justify-end gap-100 border-t border-default bg-surface-current px-250 py-150",
        className,
      )}
      ref={clearance}
    >
      {showCloseButton && (
        <DialogClose render={<Button variant="subtle" />}>{t("close")}</DialogClose>
      )}
      {children}
    </div>
  );
}
export type DialogTitleProps = Primitive.Title.Props;
/**
 * The dialog's title, its h2: a Heading at `overlay`, 15/22 medium. A PageHeader.Title renders as
 * it through `render`, keeping its own size, and the composing part's `data-slot` names the element,
 * as Button's does: the slot comes before the caller's props.
 */
export function DialogTitle({ className, ...props }: DialogTitleProps) {
  return (
    <Primitive.Title
      data-slot="dialog-title"
      render={<Heading size="overlay" as="h2" />}
      {...props}
      className={classes("font-heading-overlay text-default break-words", className)}
    />
  );
}
export type DialogDescriptionProps = Primitive.Description.Props;
export function DialogDescription({ className, ...props }: DialogDescriptionProps) {
  return (
    <Primitive.Description
      data-slot="dialog-description"
      {...props}
      className={classes("font-body text-subtle break-words", className)}
    />
  );
}
