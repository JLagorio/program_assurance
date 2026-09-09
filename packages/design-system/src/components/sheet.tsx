import { Dialog as Primitive } from "@base-ui/react/dialog";
import { DirectionProvider } from "@base-ui/react/direction-provider";
import { X } from "lucide-react";
import type { ComponentProps } from "react";
import { classes } from "../lib/base-ui";
import { cn } from "../lib/cn";
import { useLedgerLocale } from "../lib/locale";
import { Button } from "./button";

export type SheetProps<Payload = unknown> = Primitive.Root.Props<Payload>;
export function Sheet<Payload = unknown>(props: SheetProps<Payload>) {
  const { direction } = useLedgerLocale();
  return (
    <DirectionProvider direction={direction}>
      <Primitive.Root {...props} />
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
export function SheetClose(props: SheetCloseProps) {
  return <Primitive.Close data-slot="sheet-close" {...props} />;
}
export type SheetContentProps = Primitive.Popup.Props & {
  showCloseButton?: boolean | undefined;
  side?: "top" | "right" | "bottom" | "left" | "start" | "end" | undefined;
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
  style,
  ...props
}: SheetContentProps) {
  const { direction, t } = useLedgerLocale();
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
  return (
    <DirectionProvider direction={dir === "rtl" || dir === "ltr" ? dir : direction}>
      <SheetPortal>
        <SheetOverlay />
        <Primitive.Popup
          data-slot="sheet-content"
          data-side={physicalSide}
          dir={dir ?? direction}
          {...props}
          style={
            typeof style === "function"
              ? (state) => ({
                  maxWidth: physicalSide === "left" || physicalSide === "right" ? 420 : undefined,
                  ...style(state),
                })
              : {
                  maxWidth: physicalSide === "left" || physicalSide === "right" ? 420 : undefined,
                  ...style,
                }
          }
          className={classes(
            cn(
              "fixed z-50 flex max-h-dvh flex-col overflow-hidden bg-surface-overlay text-default shadow-overlay outline-none data-[side=right]:inset-y-0 data-[side=right]:right-0 data-[side=right]:w-full data-[side=left]:inset-y-0 data-[side=left]:left-0 data-[side=left]:w-full data-[side=top]:inset-x-0 data-[side=top]:top-0 data-[side=bottom]:inset-x-0 data-[side=bottom]:bottom-0",
              sheetMotion[motionSide],
            ),
            className,
          )}
        >
          {children}
          {showCloseButton && (
            <SheetClose
              aria-label={t("close")}
              render={
                <Button
                  variant="subtle"
                  size="small"
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
export type SheetFooterProps = ComponentProps<"div">;
export function SheetFooter({ className, ...props }: SheetFooterProps) {
  return (
    <div
      data-slot="sheet-footer"
      className={cn(
        "flex shrink-0 flex-wrap items-center justify-end gap-100 border-t border-default bg-surface-sunken px-250 py-150",
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
