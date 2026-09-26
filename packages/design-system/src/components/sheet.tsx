import { Dialog as Primitive } from "@base-ui/react/dialog";
import { DirectionProvider } from "@base-ui/react/direction-provider";
import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { X } from "lucide-react";
import type { ComponentProps, CSSProperties } from "react";
import { classes } from "../lib/base-ui";
import { cn } from "../lib/cn";
import { useLedgerLocale } from "../lib/locale";
import { HeadingLevelProvider } from "../primitives/heading-level";
import { Button } from "./button";
import {
  OverlayPendingContext,
  bodySlot,
  overlaySurface,
  pendingCloseRender,
  pendingOpenChange,
  useOverlayPending,
  useReadOnlyScroller,
  withStyle,
} from "./overlay";

export type SheetProps<Payload = unknown> = Primitive.Root.Props<Payload> & {
  /**
   * A save or another command is in flight. Every request to close is cancelled before
   * `onOpenChange` hears of it (Escape, the blanket, the close button, a SheetClose), the close
   * controls are disabled (the built-in close button, and a close rendered as a kit Button, stay
   * focusable with `aria-disabled`, so focus on them is kept), and the popup is
   * `aria-busy`. An imperative close through `actionsRef`, or `open={false}`, still closes: end
   * the pending state when the command settles. @default false
   */
  pending?: boolean | undefined;
};
export function Sheet<Payload = unknown>({
  pending = false,
  onOpenChange,
  disablePointerDismissal,
  ...props
}: SheetProps<Payload>) {
  const { direction } = useLedgerLocale();
  return (
    <DirectionProvider direction={direction}>
      <OverlayPendingContext.Provider value={pending}>
        <Primitive.Root
          {...props}
          disablePointerDismissal={pending || disablePointerDismissal}
          onOpenChange={pendingOpenChange(pending, onOpenChange)}
        />
      </OverlayPendingContext.Provider>
    </DirectionProvider>
  );
}
export type SheetTriggerProps<Payload = unknown> = Primitive.Trigger.Props<Payload>;
export function SheetTrigger<Payload = unknown>(props: SheetTriggerProps<Payload>) {
  return <Primitive.Trigger data-slot="sheet-trigger" {...props} />;
}
type SheetPortalProps = Primitive.Portal.Props;
function SheetPortal(props: SheetPortalProps) {
  return <Primitive.Portal {...props} />;
}
type SheetOverlayProps = Primitive.Backdrop.Props;
function SheetOverlay({ className, ...props }: SheetOverlayProps) {
  return (
    <Primitive.Backdrop
      data-slot="sheet-overlay"
      {...props}
      className={classes(
        "fixed inset-0 z-50 bg-blanket data-open:animate-dim-in data-closed:animate-dim-out",
        className,
      )}
    />
  );
}
export type SheetCloseProps = Primitive.Close.Props;
/**
 * Closes the sheet. Disabled while the Sheet is `pending`; rendered as a kit Button or IconButton
 * it stays focusable then, with `aria-disabled`, so focus on it is kept.
 */
export function SheetClose({ disabled, render, ...props }: SheetCloseProps) {
  const pending = useOverlayPending();
  return (
    <Primitive.Close
      data-slot="sheet-close"
      {...props}
      render={pendingCloseRender(render, pending)}
      disabled={pending || disabled}
    />
  );
}

/** The sheet's width steps, for a sheet at the start or end edge. Without `width` a sheet is `medium`. */
export type SheetWidth = "small" | "medium" | "large" | "xlarge" | "fullscreen";
// The kit's one place for these numbers. `large` and `xlarge` match Dialog's.
const sheetWidths: Record<Exclude<SheetWidth, "fullscreen">, number> = {
  small: 320,
  medium: 420,
  large: 760,
  xlarge: 960,
};

export type SheetContentProps = Primitive.Popup.Props & {
  /** Renders the close button at the top end. It is disabled, and keeps focus, while the Sheet is `pending`. @default true */
  showCloseButton?: boolean | undefined;
  /** The edge it slides from. `start` and `end` follow the reading direction. @default "right" */
  side?: "top" | "right" | "bottom" | "left" | "start" | "end" | undefined;
  /**
   * The width of a sheet at the start or end edge: `small` 320px for filters or a short form,
   * `medium` 420px for a form, `large` 760px for a table of about four columns, `xlarge` 960px for
   * a table beside a preview. Each is capped by the window. `fullscreen` covers the window from any
   * edge. A `style.maxWidth` still wins. @default "medium"
   */
  width?: SheetWidth | undefined;
};
const sheetMotion = {
  top: "data-open:animate-slide-in-top data-closed:animate-slide-out-top",
  bottom: "data-open:animate-slide-in-bottom data-closed:animate-slide-out-bottom",
  start: "data-open:animate-slide-in-start data-closed:animate-slide-out-start",
  end: "data-open:animate-slide-in-end data-closed:animate-slide-out-end",
};
export function SheetContent({
  className,
  children,
  dir,
  showCloseButton = true,
  side = "right",
  width,
  style,
  ...props
}: SheetContentProps) {
  const { direction, t } = useLedgerLocale();
  const pending = useOverlayPending();
  const contentDirection = dir === "rtl" || dir === "ltr" ? dir : direction;
  const physicalSide =
    side === "start"
      ? contentDirection === "rtl"
        ? "right"
        : "left"
      : side === "end"
        ? contentDirection === "rtl"
          ? "left"
          : "right"
        : side;
  // Shared slide utilities use logical edges; choose one after resolving the physical side.
  const motionSide =
    physicalSide === "left"
      ? contentDirection === "rtl"
        ? "end"
        : "start"
      : physicalSide === "right"
        ? contentDirection === "rtl"
          ? "start"
          : "end"
        : physicalSide;
  const horizontal = physicalSide === "left" || physicalSide === "right";
  const own: CSSProperties =
    width === "fullscreen"
      ? { ...overlaySurface, maxWidth: "none", height: "100dvh" }
      : {
          ...overlaySurface,
          maxWidth: horizontal ? sheetWidths[width ?? "medium"] : undefined,
        };
  return (
    <DirectionProvider direction={dir === "rtl" || dir === "ltr" ? dir : direction}>
      <SheetPortal>
        <SheetOverlay />
        <Primitive.Popup
          data-slot="sheet-content"
          data-side={physicalSide}
          dir={dir ?? direction}
          {...(width ? { "data-width": width } : {})}
          {...(pending ? { "aria-busy": true, "data-pending": "" } : {})}
          {...props}
          style={withStyle(own, style)}
          className={classes(
            cn(
              // The popup scrolls as a fallback: a SheetBody normally takes the overflow, and in a
              // short window (under 30rem) the header scrolls away with the body and the footer stays.
              "fixed z-50 flex max-h-dvh flex-col overflow-y-auto overscroll-none bg-surface-overlay text-default shadow-overlay outline-none data-[side=right]:inset-y-0 data-[side=right]:right-0 data-[side=right]:w-full data-[side=left]:inset-y-0 data-[side=left]:left-0 data-[side=left]:w-full data-[side=top]:inset-x-0 data-[side=top]:top-0 data-[side=bottom]:inset-x-0 data-[side=bottom]:bottom-0",
              sheetMotion[motionSide],
            ),
            className,
          )}
        >
          {/* The title is the sheet's h2; headings inside take the next level. */}
          <HeadingLevelProvider level={3}>{children}</HeadingLevelProvider>
          {showCloseButton && (
            <SheetClose
              aria-label={t("close")}
              render={
                <Button
                  variant="subtle"
                  size="small"
                  disabled={pending}
                  focusableWhenDisabled
                  className="absolute end-150 top-100 size-control-small p-0"
                />
              }
            >
              <X aria-hidden className="size-icon-small" />
            </SheetClose>
          )}
        </Primitive.Popup>
      </SheetPortal>
    </DirectionProvider>
  );
}
export type SheetHeaderProps = ComponentProps<"div">;
export function SheetHeader({ className, ...props }: SheetHeaderProps) {
  return (
    <div
      data-slot="sheet-header"
      className={cn(
        "flex shrink-0 flex-col gap-025 border-b border-default py-150 pe-600 ps-200",
        className,
      )}
      {...props}
    />
  );
}
export type SheetBodyProps = useRender.ComponentProps<"div">;
/**
 * The one scrolling region between SheetHeader and SheetFooter, with the sheet's inset. It takes
 * the height the header, any toolbar row and the footer leave, at least 80px, and scrolls inside
 * it; in a window under 30rem tall it grows to its content instead, so the whole sheet scrolls as
 * one with the footer held at the bottom. While it overflows with nothing to focus inside, it is a
 * tab stop so the keyboard can scroll it.
 */
export function SheetBody({ className, render, ref, ...props }: SheetBodyProps) {
  const own = useReadOnlyScroller<HTMLDivElement>();
  return useRender({
    defaultTagName: "div",
    render,
    ref: ref ? [own, ref] : own,
    props: mergeProps<"div">(props, {
      ...bodySlot("sheet-body"),
      className: cn(
        "min-h-1000 min-w-0 flex-1 overflow-y-auto overscroll-none px-200 py-150 outline-none focus-visible:outline-field-focused [@media(max-height:30rem)]:flex-auto [@media(max-height:30rem)]:shrink-0 [@media(max-height:30rem)]:overflow-visible",
        className,
      ),
    }),
  });
}
export type SheetFooterProps = ComponentProps<"div">;
export function SheetFooter({ className, ...props }: SheetFooterProps) {
  return (
    <div
      data-slot="sheet-footer"
      className={cn(
        "sticky bottom-0 z-10 flex shrink-0 flex-wrap items-center justify-end gap-100 border-t border-default bg-surface-sunken px-250 py-150",
        className,
      )}
      {...props}
    />
  );
}
export type SheetTitleProps = Primitive.Title.Props;
export function SheetTitle({ className, ...props }: SheetTitleProps) {
  return (
    <Primitive.Title
      data-slot="sheet-title"
      {...props}
      className={classes("font-heading-xsmall text-default", className)}
    />
  );
}
export type SheetDescriptionProps = Primitive.Description.Props;
export function SheetDescription({ className, ...props }: SheetDescriptionProps) {
  return (
    <Primitive.Description
      data-slot="sheet-description"
      {...props}
      className={classes("font-body text-subtle", className)}
    />
  );
}
