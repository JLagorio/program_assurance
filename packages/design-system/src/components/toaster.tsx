import { Toast as ToastPrimitive } from "@base-ui/react/toast";
import type { ToastManager, ToastManagerAddOptions } from "@base-ui/react/toast";
import { CircleAlert, CircleCheck, Info, TriangleAlert, X } from "lucide-react";

import { classes } from "../lib/base-ui";
import { useLedgerLocale } from "../lib/locale";
import { Button } from "./button";
import { Spinner } from "./spinner";

export const createToastManager = ToastPrimitive.createToastManager;
export const useToastManager = ToastPrimitive.useToastManager;
export const toast: ToastManager = createToastManager();
export type ToastOptions<Data extends object = Record<string, unknown>> =
  ToastManagerAddOptions<Data>;
export type ToasterProps = ToastPrimitive.Provider.Props;

export function ToastProvider(props: ToastPrimitive.Provider.Props) {
  return <ToastPrimitive.Provider {...props} />;
}

export function ToastPortal(props: ToastPrimitive.Portal.Props) {
  return <ToastPrimitive.Portal data-slot="toast-portal" {...props} />;
}

/** Native viewport props and ref, including custom placement, direction and accessible name. */
export function ToastViewport({ className, ...props }: ToastPrimitive.Viewport.Props) {
  const { t, direction } = useLedgerLocale();
  return (
    <ToastPrimitive.Viewport
      data-slot="toast-viewport"
      aria-label={t("notifications")}
      dir={direction}
      className={classes("toast-viewport pointer-events-none fixed outline-none", className)}
      {...props}
    />
  );
}

export function Toast({ className, ...props }: ToastPrimitive.Root.Props) {
  return (
    <ToastPrimitive.Root
      data-slot="toast"
      className={classes(
        "toast-root pointer-events-auto absolute bottom-0 right-0 w-full origin-bottom rounded-large border border-default bg-surface-overlay font-body text-default shadow-overlay outline-none select-none focus-visible:outline-focused",
        className,
      )}
      {...props}
    />
  );
}

export function ToastContent({ className, ...props }: ToastPrimitive.Content.Props) {
  return (
    <ToastPrimitive.Content
      data-slot="toast-content"
      className={classes(
        "flex h-full items-center gap-100 overflow-hidden p-150 transition-opacity duration-moderate ease-standard data-behind:opacity-0 data-expanded:opacity-100 motion-reduce:transition-none",
        className,
      )}
      {...props}
    />
  );
}

export function ToastTitle({ className, ...props }: ToastPrimitive.Title.Props) {
  return (
    <ToastPrimitive.Title
      data-slot="toast-title"
      className={classes("font-medium", className)}
      {...props}
    />
  );
}

export function ToastDescription({ className, ...props }: ToastPrimitive.Description.Props) {
  return (
    <ToastPrimitive.Description
      data-slot="toast-description"
      className={classes("font-body-small text-subtle", className)}
      {...props}
    />
  );
}

/** Native actionProps supply the label and handler. Close explicitly when the action should dismiss. */
export function ToastAction({
  className,
  render = <Button variant="secondary" size="small" />,
  ...props
}: ToastPrimitive.Action.Props) {
  return (
    <ToastPrimitive.Action
      data-slot="toast-action"
      render={render}
      className={classes("shrink-0", className)}
      {...props}
    />
  );
}

export function ToastClose({
  className,
  children,
  render = <Button variant="subtle" size="small" />,
  ...props
}: ToastPrimitive.Close.Props) {
  const { t } = useLedgerLocale();
  return (
    <ToastPrimitive.Close
      data-slot="toast-close"
      aria-label={t("close")}
      render={render}
      className={classes("size-300 shrink-0 p-0", className)}
      {...props}
    >
      {children ?? <X aria-hidden className="size-icon-small" />}
    </ToastPrimitive.Close>
  );
}

const icons = {
  success: <CircleCheck aria-hidden className="size-icon-medium icon-success" />,
  error: <CircleAlert aria-hidden className="size-icon-medium icon-danger" />,
  warning: <TriangleAlert aria-hidden className="size-icon-medium icon-warning" />,
  info: <Info aria-hidden className="size-icon-medium icon-information" />,
  loading: <Spinner size="medium" isDecorative />,
};

function ToastList() {
  const { toasts } = useToastManager();
  return toasts.map((item) => (
    <Toast key={item.id} toast={item}>
      <ToastContent>
        {item.type && item.type in icons ? (
          <span className="shrink-0">{icons[item.type as keyof typeof icons]}</span>
        ) : null}
        <div className="flex min-w-0 flex-1 flex-col gap-025 break-words">
          <ToastTitle />
          <ToastDescription />
        </div>
        <ToastAction />
        <ToastClose />
      </ToastContent>
    </Toast>
  ));
}

/** Mount once near the root. Native manager API, with Ledger's four-second timeout and four visible toasts. */
export function Toaster({
  children,
  toastManager = toast,
  timeout = 4000,
  limit = 4,
  ...props
}: ToasterProps) {
  return (
    <ToastProvider toastManager={toastManager} timeout={timeout} limit={limit} {...props}>
      {children}
      <ToastPortal>
        <ToastViewport>
          <ToastList />
        </ToastViewport>
      </ToastPortal>
    </ToastProvider>
  );
}
