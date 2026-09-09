import { AlertDialog as Primitive } from "@base-ui/react/alert-dialog";
import { DirectionProvider } from "@base-ui/react/direction-provider";
import type { ComponentProps } from "react";
import { classes } from "../lib/base-ui";
import { cn } from "../lib/cn";
import { useLedgerLocale } from "../lib/locale";
import { Button, type ButtonProps } from "./button";

export type AlertDialogProps<Payload = unknown> = Primitive.Root.Props<Payload>;
export function AlertDialog<Payload = unknown>(props: AlertDialogProps<Payload>) {
  const { direction } = useLedgerLocale();
  return (
    <DirectionProvider direction={direction}>
      <Primitive.Root {...props} />
    </DirectionProvider>
  );
}
export type AlertDialogTriggerProps<Payload = unknown> = Primitive.Trigger.Props<Payload>;
export function AlertDialogTrigger<Payload = unknown>(props: AlertDialogTriggerProps<Payload>) {
  return <Primitive.Trigger data-slot="alert-dialog-trigger" {...props} />;
}
export type AlertDialogPortalProps = Primitive.Portal.Props;
export function AlertDialogPortal(props: AlertDialogPortalProps) {
  return <Primitive.Portal {...props} />;
}
export type AlertDialogOverlayProps = Primitive.Backdrop.Props;
export function AlertDialogOverlay({ className, ...props }: AlertDialogOverlayProps) {
  return (
    <Primitive.Backdrop
      data-slot="alert-dialog-overlay"
      {...props}
      className={classes(
        "fixed inset-0 z-50 bg-blanket data-open:animate-dim-in data-closed:animate-dim-out",
        className,
      )}
    />
  );
}
export type AlertDialogContentProps = Primitive.Popup.Props & {
  size?: "default" | "sm" | undefined;
};
export function AlertDialogContent({
  className,
  size = "default",
  dir,
  ...props
}: AlertDialogContentProps) {
  const { direction } = useLedgerLocale();
  return (
    <DirectionProvider direction={dir === "rtl" || dir === "ltr" ? dir : direction}>
      <AlertDialogPortal>
        <AlertDialogOverlay />
        <Primitive.Popup
          data-slot="alert-dialog-content"
          data-size={size}
          dir={dir ?? direction}
          {...props}
          className={classes(
            "group/alert-dialog-content fixed left-1/2 top-1/2 z-50 flex max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-[440px] -translate-x-1/2 -translate-y-1/2 flex-col overflow-y-auto rounded-xxlarge bg-surface-overlay text-default shadow-overlay outline-none data-[size=sm]:max-w-[320px] data-open:animate-dialog-in data-closed:animate-dialog-out",
            className,
          )}
        />
      </AlertDialogPortal>
    </DirectionProvider>
  );
}
export type AlertDialogActionProps = ButtonProps;
export function AlertDialogAction(props: AlertDialogActionProps) {
  return <Button data-slot="alert-dialog-action" variant="primary" {...props} />;
}
export type AlertDialogCancelProps = Primitive.Close.Props & Pick<ButtonProps, "variant" | "size">;
export function AlertDialogCancel({ variant = "subtle", size, ...props }: AlertDialogCancelProps) {
  return (
    <Primitive.Close
      data-slot="alert-dialog-cancel"
      render={<Button variant={variant} size={size} />}
      {...props}
    />
  );
}
export type AlertDialogMediaProps = ComponentProps<"div">;
export function AlertDialogMedia({ className, ...props }: AlertDialogMediaProps) {
  return (
    <div
      data-slot="alert-dialog-media"
      className={cn(
        "inline-flex size-500 items-center justify-center rounded-medium bg-neutral [&_svg]:size-icon-medium",
        className,
      )}
      {...props}
    />
  );
}
export type AlertDialogHeaderProps = ComponentProps<"div">;
export function AlertDialogHeader({ className, ...props }: AlertDialogHeaderProps) {
  return (
    <div
      data-slot="alert-dialog-header"
      className={cn("flex flex-col gap-100 px-250 py-200", className)}
      {...props}
    />
  );
}
export type AlertDialogFooterProps = ComponentProps<"div">;
export function AlertDialogFooter({ className, ...props }: AlertDialogFooterProps) {
  return (
    <div
      data-slot="alert-dialog-footer"
      className={cn(
        "flex shrink-0 flex-wrap items-center justify-end gap-100 border-t border-default bg-surface-sunken px-250 py-150",
        className,
      )}
      {...props}
    />
  );
}
export type AlertDialogTitleProps = Primitive.Title.Props;
export function AlertDialogTitle({ className, ...props }: AlertDialogTitleProps) {
  return (
    <Primitive.Title
      data-slot="alert-dialog-title"
      {...props}
      className={classes("font-heading-xsmall text-default", className)}
    />
  );
}
export type AlertDialogDescriptionProps = Primitive.Description.Props;
export function AlertDialogDescription({ className, ...props }: AlertDialogDescriptionProps) {
  return (
    <Primitive.Description
      data-slot="alert-dialog-description"
      {...props}
      className={classes("font-body text-subtle", className)}
    />
  );
}
