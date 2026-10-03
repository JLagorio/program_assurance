import { createContext, useContext, useMemo, type ComponentProps } from "react";
import { Drawer as Primitive } from "@base-ui/react/drawer";
import { DirectionProvider } from "@base-ui/react/direction-provider";
import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { classes } from "../lib/base-ui";
import { cn } from "../lib/cn";
import { useLedgerLocale } from "../lib/locale";
import { Heading } from "../primitives/heading";
import { HeadingLevelProvider } from "../primitives/heading-level";
import {
  bodySlot,
  overlaySurface,
  useFooterClearance,
  useReadOnlyScroller,
  withStyle,
} from "./overlay";

type DrawerContextValue = {
  hasSnapPoints: boolean;
  modal: Primitive.Root.Props["modal"];
  showSwipeHandle: boolean;
  swipeDirection: NonNullable<Primitive.Root.Props["swipeDirection"]>;
};
const DrawerContext = createContext<DrawerContextValue | null>(null);

export type DrawerProps<Payload = unknown> = Primitive.Root.Props<Payload> & {
  showSwipeHandle?: boolean | undefined;
};
export function Drawer<Payload = unknown>({
  modal = true,
  showSwipeHandle = false,
  snapPoints,
  swipeDirection = "down",
  ...props
}: DrawerProps<Payload>) {
  const { direction } = useLedgerLocale();
  const hasSnapPoints = Boolean(snapPoints?.length);
  const context = useMemo(
    () => ({ hasSnapPoints, modal, showSwipeHandle, swipeDirection }),
    [hasSnapPoints, modal, showSwipeHandle, swipeDirection],
  );
  return (
    <DirectionProvider direction={direction}>
      <DrawerContext.Provider value={context}>
        <Primitive.Root
          modal={modal}
          snapPoints={snapPoints}
          swipeDirection={swipeDirection}
          {...props}
        />
      </DrawerContext.Provider>
    </DirectionProvider>
  );
}
export type DrawerTriggerProps<Payload = unknown> = Primitive.Trigger.Props<Payload>;
export function DrawerTrigger<Payload = unknown>(props: DrawerTriggerProps<Payload>) {
  return <Primitive.Trigger {...props} data-slot="drawer-trigger" />;
}
export type DrawerPortalProps = Primitive.Portal.Props;
export function DrawerPortal(props: DrawerPortalProps) {
  return <Primitive.Portal {...props} />;
}
export type DrawerCloseProps = Primitive.Close.Props;
export function DrawerClose(props: DrawerCloseProps) {
  return <Primitive.Close {...props} data-slot="drawer-close" />;
}
export type DrawerOverlayProps = Primitive.Backdrop.Props;
export function DrawerOverlay({ className, ...props }: DrawerOverlayProps) {
  return (
    <Primitive.Backdrop
      className={classes(
        "drawer-overlay fixed inset-0 z-overlay min-h-dvh bg-blanket select-none",
        className,
      )}
      {...props}
      data-slot="drawer-overlay"
    />
  );
}
export type DrawerSwipeHandleProps = ComponentProps<"div">;
export function DrawerSwipeHandle({ className, ...props }: DrawerSwipeHandleProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "drawer-swipe-handle relative z-10 flex shrink-0 cursor-grab active:cursor-grabbing",
        className,
      )}
      {...props}
      data-slot="drawer-swipe-handle"
    />
  );
}
/** The drawer's width steps. Without `width` a drawer is `medium`. */
export type DrawerWidth = "small" | "medium" | "large";

export type DrawerContentProps = Primitive.Popup.Props & {
  /**
   * How wide the drawer grows: `small` 320px, `medium` 384px, `large` 760px, at the default text
   * size (`dimension.part.drawerSmall`, `.drawer`, `.drawerLarge`). A side drawer takes it within
   * 75% of the window. A bottom or top drawer takes it, centred, on a window from `sm` (640px) up,
   * and runs edge to edge on a phone. @default "medium"
   */
  width?: DrawerWidth | undefined;
};
/**
 * The drawer itself: the portal, the modal overlay, Base UI's viewport and popup and the
 * text-selectable content region, inside Base UI's VirtualKeyboardProvider, which keeps a focused
 * field in a bottom drawer clear of a phone's software keyboard by scrolling the drawer's body.
 */
export function DrawerContent({
  className,
  children,
  dir,
  style,
  width,
  ...props
}: DrawerContentProps) {
  const context = useContext(DrawerContext);
  const { direction } = useLedgerLocale();
  if (!context) throw new Error("DrawerContent must be used within a Drawer.");
  const { hasSnapPoints, modal, showSwipeHandle, swipeDirection } = context;
  const swipeAxis = swipeDirection === "down" || swipeDirection === "up" ? "y" : "x";
  return (
    <DirectionProvider direction={dir === "rtl" || dir === "ltr" ? dir : direction}>
      <Primitive.VirtualKeyboardProvider>
        <DrawerPortal>
          {modal === true && <DrawerOverlay data-snap-points={hasSnapPoints ? "" : undefined} />}
          <Primitive.Viewport
            data-slot="drawer-viewport"
            data-modal={modal}
            className="pointer-events-none fixed inset-0 z-overlay select-none data-[modal=true]:pointer-events-auto"
          >
            <Primitive.Popup
              data-swipe-axis={swipeAxis}
              data-snap-points={hasSnapPoints ? "" : undefined}
              data-width={width ?? "medium"}
              dir={dir ?? direction}
              className={classes(
                "drawer-popup group/drawer-popup pointer-events-auto fixed z-overlay flex min-h-0 flex-col bg-surface-overlay font-body text-default shadow-overlay outline-none select-none data-[swipe-direction=down]:rounded-t-xxlarge data-[swipe-direction=up]:rounded-b-xxlarge data-[swipe-direction=left]:rounded-r-xxlarge data-[swipe-direction=right]:rounded-l-xxlarge",
                className,
              )}
              {...props}
              data-slot="drawer-popup"
              style={withStyle(overlaySurface, style)}
            >
              {showSwipeHandle && <DrawerSwipeHandle />}
              <Primitive.Content
                data-slot="drawer-content"
                // Scrolls as a fallback: a DrawerBody normally takes the overflow, and in a short
                // window (under 30rem) the header scrolls away with the body and the footer stays.
                className="drawer-content flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain select-text"
              >
                {/* The title is the drawer's h2; headings inside take the next level. */}
                <HeadingLevelProvider level={3}>{children}</HeadingLevelProvider>
              </Primitive.Content>
            </Primitive.Popup>
          </Primitive.Viewport>
        </DrawerPortal>
      </Primitive.VirtualKeyboardProvider>
    </DirectionProvider>
  );
}
export type DrawerHeaderProps = ComponentProps<"div">;
export function DrawerHeader({ className, ...props }: DrawerHeaderProps) {
  return (
    <div
      className={cn(
        "flex shrink-0 flex-col gap-025 border-b border-default px-250 py-150",
        className,
      )}
      {...props}
      data-slot="drawer-header"
    />
  );
}
export type DrawerBodyProps = useRender.ComponentProps<"div">;
/**
 * The one scrolling region between DrawerHeader and DrawerFooter, with the drawer's inset. It
 * takes the height the header and footer leave, at least 80px, and scrolls inside it; Base UI lets
 * a swipe that starts in it scroll it, and dismiss once it is at its edge. In a window under 30rem
 * tall it grows to its content instead, so the drawer scrolls as one with the footer held at the
 * bottom. While it overflows with nothing to focus inside, it is a tab stop so the keyboard can
 * scroll it.
 */
export function DrawerBody({ className, render, ref, ...props }: DrawerBodyProps) {
  const own = useReadOnlyScroller<HTMLDivElement>();
  return useRender({
    defaultTagName: "div",
    render,
    ref: ref ? [own, ref] : own,
    props: mergeProps<"div">(props, {
      ...bodySlot("drawer-body"),
      className: cn(
        "min-h-1000 min-w-0 flex-1 overflow-y-auto overscroll-contain p-250 outline-none focus-visible:outline-field-focused",
        className,
      ),
    }),
  });
}
export type DrawerFooterProps = ComponentProps<"div">;
/**
 * The action row, held at the bottom. When the whole drawer scrolls (a window under 30rem tall),
 * a control that takes focus scrolls clear of it rather than under it.
 */
export function DrawerFooter({ className, ref, ...props }: DrawerFooterProps) {
  const clearance = useFooterClearance(ref);
  return (
    <div
      className={cn(
        "sticky bottom-0 z-10 mt-auto flex shrink-0 flex-wrap items-center justify-end gap-100 border-t border-default bg-surface-current px-250 py-150",
        className,
      )}
      {...props}
      data-slot="drawer-footer"
      ref={clearance}
    />
  );
}
export type DrawerTitleProps = Primitive.Title.Props;
/**
 * The drawer's title, its h2: a Heading at `overlay`, 15/22 medium. A PageHeader.Title renders as
 * it through `render`, keeping its own size, and the composing part's `data-slot` names the element,
 * as Button's does: the slot comes before the caller's props.
 */
export function DrawerTitle({ className, ...props }: DrawerTitleProps) {
  return (
    <Primitive.Title
      data-slot="drawer-title"
      render={<Heading size="overlay" as="h2" />}
      {...props}
      className={classes("font-heading-overlay text-default break-words", className)}
    />
  );
}
export type DrawerDescriptionProps = Primitive.Description.Props;
export function DrawerDescription({ className, ...props }: DrawerDescriptionProps) {
  return (
    <Primitive.Description
      data-slot="drawer-description"
      className={classes("font-body text-subtle break-words", className)}
      {...props}
    />
  );
}
