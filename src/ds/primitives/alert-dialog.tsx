import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import { Button } from "./button";
import { Spinner } from "./spinner";

/* A decision that needs a word before it happens: accept a risk, delete a
   record, submit a package. Unlike Dialog it has no close button and does not
   close on an outside click; the two buttons are the only way out. `pending`
   holds it open with the confirm button busy while the caller saves. */
export function AlertDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "primary",
  pending = false,
  children,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: ReactNode;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "primary" | "danger";
  pending?: boolean;
  children?: ReactNode;
}) {
  return (
    <AlertDialogPrimitive.Root
      open={open}
      onOpenChange={(next) => {
        if (!next && !pending) onClose();
      }}
    >
      <AlertDialogPrimitive.Portal>
        <AlertDialogPrimitive.Overlay className="fixed inset-0 z-50 bg-foreground/25 backdrop-blur-[1px] animate-in fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0" />
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:pt-[18vh]">
          <AlertDialogPrimitive.Content
            {...(description ? {} : { "aria-describedby": undefined })}
            className={cn(
              "relative w-full max-w-[440px] overflow-hidden rounded-xl bg-card shadow-pop outline-none",
              "animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0",
            )}
          >
            <div className="px-5 pb-4 pt-4">
              <AlertDialogPrimitive.Title className="text-[15px] font-medium tracking-[-0.01em]">
                {title}
              </AlertDialogPrimitive.Title>
              {description ? (
                <AlertDialogPrimitive.Description className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
                  {description}
                </AlertDialogPrimitive.Description>
              ) : null}
              {children ? <div className="mt-3 text-[13px]">{children}</div> : null}
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-border bg-subtle px-5 py-3">
              <AlertDialogPrimitive.Cancel asChild>
                <Button variant="ghost" disabled={pending}>
                  {cancelLabel}
                </Button>
              </AlertDialogPrimitive.Cancel>
              <AlertDialogPrimitive.Action asChild>
                <Button
                  variant={tone === "danger" ? "danger" : "primary"}
                  disabled={pending}
                  onClick={(e) => {
                    e.preventDefault();
                    if (!pending) onConfirm();
                  }}
                >
                  {pending ? <Spinner className="text-primary-foreground" /> : null}
                  {confirmLabel}
                </Button>
              </AlertDialogPrimitive.Action>
            </div>
          </AlertDialogPrimitive.Content>
        </div>
      </AlertDialogPrimitive.Portal>
    </AlertDialogPrimitive.Root>
  );
}
