import { createContext, useContext, useMemo, type ComponentProps } from "react";
import { Drawer as Primitive } from "@base-ui/react/drawer";
import { DirectionProvider } from "@base-ui/react/direction-provider";
import { classes } from "../lib/base-ui";
import { cn } from "../lib/cn";
import { useLedgerLocale } from "../lib/locale";

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
  return <Primitive.Trigger data-slot="drawer-trigger" {...props} />;
}
export type DrawerPortalProps = Primitive.Portal.Props;
export function DrawerPortal(props: DrawerPortalProps) {
  return <Primitive.Portal {...props} />;
}
export type DrawerCloseProps = Primitive.Close.Props;
export function DrawerClose(props: DrawerCloseProps) {
  return <Primitive.Close data-slot="drawer-close" {...props} />;
}
export type DrawerOverlayProps = Primitive.Backdrop.Props;
export function DrawerOverlay({ className, ...props }: DrawerOverlayProps) {
  return (
    <Primitive.Backdrop
      data-slot="drawer-overlay"
      className={classes(
        "drawer-overlay fixed inset-0 z-50 min-h-dvh bg-blanket select-none",
        className,
      )}
      {...props}
    />
  );
}
export type DrawerSwipeHandleProps = ComponentProps<"div">;
export function DrawerSwipeHandle({ className, ...props }: DrawerSwipeHandleProps) {
  return (
    <div
      data-slot="drawer-swipe-handle"
      aria-hidden="true"
      className={cn(
        "drawer-swipe-handle relative z-10 flex shrink-0 cursor-grab active:cursor-grabbing",
        className,
      )}
      {...props}
    />
  );
}
export type DrawerContentProps = Primitive.Popup.Props;
export function DrawerContent({ className, children, dir, ...props }: DrawerContentProps) {
  const context = useContext(DrawerContext);
  const { direction } = useLedgerLocale();
  if (!context) throw new Error("DrawerContent must be used within a Drawer.");
  const { hasSnapPoints, modal, showSwipeHandle, swipeDirection } = context;
  const swipeAxis = swipeDirection === "down" || swipeDirection === "up" ? "y" : "x";
  return (
    <DirectionProvider direction={dir === "rtl" || dir === "ltr" ? dir : direction}>
      <DrawerPortal>
        {modal === true && <DrawerOverlay data-snap-points={hasSnapPoints ? "" : undefined} />}
        <Primitive.Viewport
          data-slot="drawer-viewport"
          data-modal={modal}
          className="pointer-events-none fixed inset-0 z-50 select-none data-[modal=true]:pointer-events-auto"
        >
          <Primitive.Popup
            data-slot="drawer-popup"
            data-swipe-axis={swipeAxis}
            data-snap-points={hasSnapPoints ? "" : undefined}
            dir={dir ?? direction}
            className={classes(
              "drawer-popup group/drawer-popup pointer-events-auto fixed z-50 flex min-h-0 flex-col bg-surface-overlay font-body text-default shadow-overlay outline-none select-none data-[swipe-direction=down]:rounded-t-xxlarge data-[swipe-direction=up]:rounded-b-xxlarge data-[swipe-direction=left]:rounded-r-xxlarge data-[swipe-direction=right]:rounded-l-xxlarge",
              className,
            )}
            {...props}
          >
            {showSwipeHandle && <DrawerSwipeHandle />}
            <Primitive.Content
              data-slot="drawer-content"
              className="drawer-content flex min-h-0 flex-1 flex-col overflow-hidden overscroll-contain select-text"
            >
              {children}
            </Primitive.Content>
          </Primitive.Popup>
        </Primitive.Viewport>
      </DrawerPortal>
    </DirectionProvider>
  );
}
export type DrawerHeaderProps = ComponentProps<"div">;
export function DrawerHeader({ className, ...props }: DrawerHeaderProps) {
  return (
    <div
      data-slot="drawer-header"
      className={cn(
        "flex shrink-0 flex-col gap-025 border-b border-default px-250 py-150",
        className,
      )}
      {...props}
    />
  );
}
export type DrawerFooterProps = ComponentProps<"div">;
export function DrawerFooter({ className, ...props }: DrawerFooterProps) {
  return (
    <div
      data-slot="drawer-footer"
      className={cn(
        "mt-auto flex shrink-0 flex-wrap items-center justify-end gap-100 border-t border-default bg-surface-sunken px-250 py-150",
        className,
      )}
      {...props}
    />
  );
}
export type DrawerTitleProps = Primitive.Title.Props;
export function DrawerTitle({ className, ...props }: DrawerTitleProps) {
  return (
    <Primitive.Title
      data-slot="drawer-title"
      className={classes("font-heading-xsmall text-default", className)}
      {...props}
    />
  );
}
export type DrawerDescriptionProps = Primitive.Description.Props;
export function DrawerDescription({ className, ...props }: DrawerDescriptionProps) {
  return (
    <Primitive.Description
      data-slot="drawer-description"
      className={classes("font-body text-subtle", className)}
      {...props}
    />
  );
}
