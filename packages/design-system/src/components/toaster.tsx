import { CircleAlert, CircleCheck, Info, TriangleAlert, X } from "lucide-react";
import type { ComponentProps } from "react";
import { Toaster as Sonner, toast as sonnerToast, type ExternalToast } from "sonner";

import { Spinner } from "./spinner";
import { cn } from "../lib/cn";
import { useLedgerLocale } from "../lib/locale";

/* Feedback after an act: "Evidence linked", "Could not save". A toast is a card at the bottom
   right that says what happened and goes; it is never a question and never a record's state. One
   Toaster near the root, then `toast.success(...)` from anywhere. sonner underneath for the stack,
   the timer, the swipe and the live region; the kit owns the look and the defaults. */

/** Default classes for Sonner's native parts. */
const toastClasses = {
  toast:
    "relative flex w-full items-start gap-100 rounded-large border border-default bg-surface-overlay px-150 py-150 font-body text-default shadow-overlay outline-none focus-visible:outline-focused",
  icon: "flex h-250 shrink-0 items-center",
  content: "flex min-w-0 flex-1 flex-col gap-025",
  title: "font-medium",
  description: "font-body-small text-subtle",
  actionButton:
    "ms-100 h-control-xsmall shrink-0 self-center rounded-medium bg-brand-bold px-100 font-body-small font-medium text-inverse outline-none hover:bg-brand-bold-hovered focus-visible:outline-focused",
  cancelButton:
    "ms-100 h-control-xsmall shrink-0 self-center rounded-medium px-100 font-body-small font-medium text-subtle outline-none hover:bg-neutral-subtle-hovered hover:text-default focus-visible:outline-focused",
  closeButton:
    "order-last -me-050 -mt-050 flex size-300 shrink-0 items-center justify-center rounded-medium text-subtle outline-none hover:bg-neutral-subtle-hovered hover:text-default focus-visible:outline-focused",
} as const;

/** The mark for each kind, `dimension.icon.medium` in the tone's icon colour. */
const toastIcons = {
  success: <CircleCheck aria-hidden className="size-icon-medium icon-success" />,
  error: <CircleAlert aria-hidden className="size-icon-medium icon-danger" />,
  warning: <TriangleAlert aria-hidden className="size-icon-medium icon-warning" />,
  info: <Info aria-hidden className="size-icon-medium icon-information" />,
  loading: <Spinner size="medium" label="Working" />,
  close: <X aria-hidden className="size-icon-small" />,
} as const;

export type ToasterProps = ComponentProps<typeof Sonner>;

/** The stack. Render one near the root; the toasts find it. */
export function Toaster({
  position = "bottom-right",
  expand = false,
  closeButton = false,
  icons,
  toastOptions,
  className,
  ...props
}: ToasterProps) {
  const { t, direction } = useLedgerLocale();
  return (
    <Sonner
      position={position}
      dir={direction}
      expand={expand}
      closeButton={closeButton}
      gap={8}
      offset={16}
      visibleToasts={4}
      containerAriaLabel={t("notifications")}
      // Sonner's mobile width:100% plus both offsets can overflow an RTL left stack.
      // Use its native offsets to bound the stack; each toast fills the available width.
      className={cn(
        "max-sm:left-(--mobile-offset-left)! max-sm:right-(--mobile-offset-right)! max-sm:w-auto!",
        className,
      )}
      icons={{ ...toastIcons, loading: <Spinner size="medium" label={t("loading")} />, ...icons }}
      toastOptions={{
        unstyled: true,
        closeButtonAriaLabel: t("close"),
        ...toastOptions,
        style: {
          width: "100%",
          transitionDuration: "var(--ds-motion-duration-moderate)",
          ...toastOptions?.style,
        },
        classNames: { ...toastClasses, ...toastOptions?.classNames },
      }}
      {...props}
    />
  );
}

type Message = Parameters<typeof sonnerToast>[0];

/** Explicit public adapter: preserve Sonner's generic promise result without leaking inferred private names. */
export type Toast = ((message: Message, data?: ExternalToast) => ReturnType<typeof sonnerToast>) &
  Pick<
    typeof sonnerToast,
    | "success"
    | "info"
    | "warning"
    | "error"
    | "loading"
    | "promise"
    | "message"
    | "custom"
    | "dismiss"
  >;
export type ToastOptions = ExternalToast;

/** Fires a toast. The kinds are sonner's with the kit's defaults: `error` stays eight seconds and carries a close; the rest go in four. `loading` and `promise` stay until they settle. */
export const toast: Toast = Object.assign(
  (message: Message, data?: ExternalToast) => sonnerToast(message, data),
  {
    success: sonnerToast.success,
    info: sonnerToast.info,
    warning: sonnerToast.warning,
    error: (message: Message, data?: ExternalToast) =>
      sonnerToast.error(message, { duration: 8000, closeButton: true, ...data }),
    loading: sonnerToast.loading,
    promise: sonnerToast.promise,
    message: sonnerToast.message,
    custom: sonnerToast.custom,
    dismiss: sonnerToast.dismiss,
  },
);
