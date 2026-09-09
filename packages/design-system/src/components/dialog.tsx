import { Dialog as Primitive } from "@base-ui/react/dialog";
import { DirectionProvider } from "@base-ui/react/direction-provider";
import { X } from "lucide-react";
import type { ComponentProps } from "react";
import { classes } from "../lib/base-ui";
import { cn } from "../lib/cn";
import { useLedgerLocale } from "../lib/locale";
import { Button } from "./button";

export type DialogProps<Payload = unknown> = Primitive.Root.Props<Payload>;
export function Dialog<Payload = unknown>(props: DialogProps<Payload>) {
  const { direction } = useLedgerLocale();
  return (
    <DirectionProvider direction={direction}>
      <Primitive.Root {...props} />
    </DirectionProvider>
  );
}
export type DialogTriggerProps<Payload = unknown> = Primitive.Trigger.Props<Payload>;
export function DialogTrigger<Payload = unknown>(props: DialogTriggerProps<Payload>) {
  return <Primitive.Trigger data-slot="dialog-trigger" {...props} />;
}
export type DialogPortalProps = Primitive.Portal.Props;
export function DialogPortal(props: DialogPortalProps) {
  return <Primitive.Portal {...props} />;
}
export type DialogOverlayProps = Primitive.Backdrop.Props;
export function DialogOverlay({ className, ...props }: DialogOverlayProps) {
  return (
    <Primitive.Backdrop
      data-slot="dialog-overlay"
      {...props}
      className={classes(
        "fixed inset-0 z-50 bg-blanket data-open:animate-dim-in data-closed:animate-dim-out",
        className,
      )}
    />
  );
}
export type DialogCloseProps = Primitive.Close.Props;
export function DialogClose(props: DialogCloseProps) {
  return <Primitive.Close data-slot="dialog-close" {...props} />;
}
export type DialogContentProps = Primitive.Popup.Props & { showCloseButton?: boolean | undefined };
export function DialogContent({
  className,
  children,
  dir,
  showCloseButton = true,
  ...props
}: DialogContentProps) {
  const { direction, t } = useLedgerLocale();
  return (
    <DirectionProvider direction={dir === "rtl" || dir === "ltr" ? dir : direction}>
      <DialogPortal>
        <DialogOverlay />
        <Primitive.Popup
          data-slot="dialog-content"
          dir={dir ?? direction}
          {...props}
          className={classes(
            "fixed left-1/2 top-1/2 z-50 flex max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-[520px] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-xxlarge bg-surface-overlay text-default shadow-overlay outline-none data-open:animate-dialog-in data-closed:animate-dialog-out",
            className,
          )}
        >
          {children}
          {showCloseButton && (
            <DialogClose
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
            </DialogClose>
          )}
        </Primitive.Popup>
      </DialogPortal>
    </DirectionProvider>
  );
}
export type DialogHeaderProps = ComponentProps<"div">;
export function DialogHeader({ className, ...props }: DialogHeaderProps) {
  return (
    <div
      data-slot="dialog-header"
      className={cn(
        "flex shrink-0 flex-col gap-025 border-b border-default py-150 pe-600 ps-250",
        className,
      )}
      {...props}
    />
  );
}
export type DialogFooterProps = ComponentProps<"div"> & { showCloseButton?: boolean | undefined };
export function DialogFooter({
  className,
  children,
  showCloseButton = false,
  ...props
}: DialogFooterProps) {
  const { t } = useLedgerLocale();
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "flex shrink-0 flex-wrap items-center justify-end gap-100 border-t border-default bg-surface-sunken px-250 py-150",
        className,
      )}
      {...props}
    >
      {children}
      {showCloseButton && (
        <DialogClose render={<Button variant="subtle" />}>{t("close")}</DialogClose>
      )}
    </div>
  );
}
export type DialogTitleProps = Primitive.Title.Props;
export function DialogTitle({ className, ...props }: DialogTitleProps) {
  return (
    <Primitive.Title
      data-slot="dialog-title"
      {...props}
      className={classes("font-heading-xsmall text-default", className)}
    />
  );
}
export type DialogDescriptionProps = Primitive.Description.Props;
export function DialogDescription({ className, ...props }: DialogDescriptionProps) {
  return (
    <Primitive.Description
      data-slot="dialog-description"
      {...props}
      className={classes("font-body text-subtle", className)}
    />
  );
}
