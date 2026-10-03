import { AlertDialog as Primitive } from "@base-ui/react/alert-dialog";
import { DirectionProvider } from "@base-ui/react/direction-provider";
import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { useMemo, type ComponentProps } from "react";
import { classes } from "../lib/base-ui";
import { cn } from "../lib/cn";
import { useLedgerLocale } from "../lib/locale";
import { Heading } from "../primitives/heading";
import { HeadingLevelProvider } from "../primitives/heading-level";
import { Button, type ButtonProps } from "./button";
import { dialogWidths, type AlertDialogWidth } from "./dialog";
import {
  OverlayPendingContext,
  OverlayRootContext,
  bodySlot,
  dialogFrame,
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

export type AlertDialogProps<Payload = unknown> = Primitive.Root.Props<Payload> & {
  /**
   * The decision's command is in flight. Escape and AlertDialogCancel are cancelled before
   * `onOpenChange` hears of them, Cancel is disabled and the popup is `aria-busy`. Give the Action
   * `isLoading`, and close when the command succeeds (`open={false}`); on a failure, end the
   * pending state and say what went wrong inside the dialog. @default false
   */
  pending?: boolean | undefined;
};
export function AlertDialog<Payload = unknown>({
  pending = false,
  onOpenChange,
  ...props
}: AlertDialogProps<Payload>) {
  const { direction } = useLedgerLocale();
  const opener = useOpener(props.open);
  // The blanket never dismisses an alert dialog, so a press on it always keeps focus.
  const root = useMemo(() => ({ opener, holdsBlanket: true }), [opener]);
  return (
    <DirectionProvider direction={direction}>
      <OverlayRootContext.Provider value={root}>
        <OverlayPendingContext.Provider value={pending}>
          <Primitive.Root {...props} onOpenChange={pendingOpenChange(pending, onOpenChange)} />
        </OverlayPendingContext.Provider>
      </OverlayRootContext.Provider>
    </DirectionProvider>
  );
}
export type AlertDialogTriggerProps<Payload = unknown> = Primitive.Trigger.Props<Payload>;
export function AlertDialogTrigger<Payload = unknown>(props: AlertDialogTriggerProps<Payload>) {
  return <Primitive.Trigger {...props} data-slot="alert-dialog-trigger" />;
}
export type AlertDialogPortalProps = Primitive.Portal.Props;
export function AlertDialogPortal(props: AlertDialogPortalProps) {
  return <Primitive.Portal {...props} />;
}
export type AlertDialogOverlayProps = Primitive.Backdrop.Props;
/** The blanket. A press on it never dismisses the dialog, and keeps focus where the reader has it. */
export function AlertDialogOverlay({ className, onMouseDown, ...props }: AlertDialogOverlayProps) {
  const press = useBlanketPress();
  return (
    <Primitive.Backdrop
      {...props}
      data-slot="alert-dialog-overlay"
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
/** The deprecated `size` spellings and the steps they are. */
const sizeWidths: Record<"default" | "sm", AlertDialogWidth> = { default: "small", sm: "xsmall" };

export type { AlertDialogWidth };
export type AlertDialogContentProps = Primitive.Popup.Props & {
  /**
   * The popup's width, on Dialog's steps: `small` 400px for a question and its consequence,
   * `xsmall` 320px for a one-line question, `medium` 520px for a decision whose AlertDialogBody
   * lists what it affects. Every step keeps a `space.200` gutter on each side, so it narrows to
   * the window less the gutter. A `style.maxWidth` still wins. @default "small"
   */
  width?: AlertDialogWidth | undefined;
  /**
   * @deprecated Use `width`: `size="sm"` is `width="xsmall"` and `size="default"` is
   * `width="small"`. `width` wins when both are set.
   */
  size?: "default" | "sm" | undefined;
};
export function AlertDialogContent({
  className,
  children,
  width,
  size,
  dir,
  style,
  finalFocus,
  ...props
}: AlertDialogContentProps) {
  const { direction } = useLedgerLocale();
  const pending = useOverlayPending();
  const returnFocus = useOpenerFocus();
  const step = width ?? (size ? sizeWidths[size] : "small");
  const own = { ...overlaySurface, ...dialogFrame, ...dialogWidths[step] };
  return (
    <DirectionProvider direction={dir === "rtl" || dir === "ltr" ? dir : direction}>
      <AlertDialogPortal>
        <AlertDialogOverlay />
        <Primitive.Popup
          data-width={step}
          dir={dir ?? direction}
          {...(pending ? { "aria-busy": true, "data-pending": "" } : {})}
          {...props}
          data-slot="alert-dialog-content"
          finalFocus={finalFocus === undefined ? returnFocus : finalFocus}
          style={withStyle(own, style)}
          className={classes(
            "group/alert-dialog-content fixed left-1/2 top-1/2 z-overlay flex -translate-x-1/2 -translate-y-1/2 flex-col overflow-y-auto overscroll-none rounded-xxlarge bg-surface-overlay text-default shadow-overlay outline-none data-open:animate-dialog-in data-closed:animate-dialog-out",
            className,
          )}
        >
          {/* The title is the dialog's h2; headings inside take the next level. */}
          <HeadingLevelProvider level={3}>{children}</HeadingLevelProvider>
        </Primitive.Popup>
      </AlertDialogPortal>
    </DirectionProvider>
  );
}
export type AlertDialogActionProps = ButtonProps;
export function AlertDialogAction(props: AlertDialogActionProps) {
  return <Button variant="primary" {...props} data-slot="alert-dialog-action" />;
}
export type AlertDialogCancelProps = Primitive.Close.Props & Pick<ButtonProps, "variant" | "size">;
/**
 * The safe answer, a subtle Button that closes the dialog. Disabled while the AlertDialog is
 * `pending`, and still focusable then (`aria-disabled`), since it is where focus starts. An
 * AlertDialogAction that needs no command renders as it (`render={<AlertDialogCancel />}`), so the
 * composing part's `data-slot` names the element: the slot comes before the caller's props.
 */
export function AlertDialogCancel({
  variant = "subtle",
  size,
  disabled,
  render,
  ...props
}: AlertDialogCancelProps) {
  const pending = useOverlayPending();
  return (
    <Primitive.Close
      data-slot="alert-dialog-cancel"
      {...props}
      render={pendingCloseRender(render ?? <Button variant={variant} size={size} />, pending)}
      disabled={pending || disabled}
    />
  );
}
export type AlertDialogMediaProps = ComponentProps<"div">;
export function AlertDialogMedia({ className, ...props }: AlertDialogMediaProps) {
  return (
    <div
      {...props}
      data-slot="alert-dialog-media"
      className={cn(
        "inline-flex size-500 items-center justify-center rounded-medium bg-neutral [&_svg]:size-icon-medium",
        className,
      )}
    />
  );
}
export type AlertDialogHeaderProps = ComponentProps<"div">;
export function AlertDialogHeader({ className, ...props }: AlertDialogHeaderProps) {
  return (
    <div
      {...props}
      data-slot="alert-dialog-header"
      className={cn("flex flex-col gap-100 px-250 py-200", className)}
    />
  );
}
export type AlertDialogBodyProps = useRender.ComponentProps<"div">;
/**
 * What the decision affects, when one line of Description is not enough: the records a delete
 * removes, a field for a reason. It follows the header with the header's inline inset and no
 * divider, takes the height the header and footer leave, at least 80px, and scrolls, so the
 * footer's answers stay in view; in a window under 30rem tall the whole popup scrolls instead,
 * with the footer held at the bottom. While it overflows with nothing to focus inside, it is a tab
 * stop so the keyboard can scroll it.
 */
export function AlertDialogBody({ className, render, ref, ...props }: AlertDialogBodyProps) {
  const own = useReadOnlyScroller<HTMLDivElement>();
  return useRender({
    defaultTagName: "div",
    render,
    ref: ref ? [own, ref] : own,
    props: mergeProps<"div">(props, {
      ...bodySlot("alert-dialog-body"),
      className: cn(
        "min-h-1000 min-w-0 flex-1 overflow-y-auto overscroll-none px-250 pb-200 font-body outline-none focus-visible:outline-field-focused",
        className,
      ),
    }),
  });
}
export type AlertDialogFooterProps = ComponentProps<"div">;
/**
 * The answers, held at the bottom. When the whole popup scrolls (a window under 30rem tall), a
 * control that takes focus scrolls clear of them rather than under them.
 */
export function AlertDialogFooter({ className, ref, ...props }: AlertDialogFooterProps) {
  const clearance = useFooterClearance(ref);
  return (
    <div
      {...props}
      data-slot="alert-dialog-footer"
      className={cn(
        "sticky bottom-0 z-10 flex shrink-0 flex-wrap items-center justify-end gap-100 border-t border-default bg-surface-current px-250 py-150",
        className,
      )}
      ref={clearance}
    />
  );
}
export type AlertDialogTitleProps = Primitive.Title.Props;
/**
 * The alert dialog's title, its h2: a Heading at `overlay`, 15/22 medium. Another title part renders
 * as it through `render`, keeping its own size, and the composing part's `data-slot` names the
 * element, as Button's does: the slot comes before the caller's props.
 */
export function AlertDialogTitle({ className, ...props }: AlertDialogTitleProps) {
  return (
    <Primitive.Title
      data-slot="alert-dialog-title"
      render={<Heading size="overlay" as="h2" />}
      {...props}
      className={classes("font-heading-overlay text-default break-words", className)}
    />
  );
}
export type AlertDialogDescriptionProps = Primitive.Description.Props;
export function AlertDialogDescription({ className, ...props }: AlertDialogDescriptionProps) {
  return (
    <Primitive.Description
      data-slot="alert-dialog-description"
      {...props}
      className={classes("font-body text-subtle break-words", className)}
    />
  );
}
