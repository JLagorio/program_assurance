import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";
import type { ReactNode } from "react";

import { Button } from "./button";
import { Spinner } from "./spinner";

export type AlertDialogProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: ReactNode;
  description?: ReactNode;
  confirmLabel?: string | undefined;
  cancelLabel?: string | undefined;
  tone?: "primary" | "danger" | undefined;
  /** Holds the dialog open with the confirm button busy while the caller saves. */
  pending?: boolean | undefined;
  children?: ReactNode;
};

/** A decision that needs a word before it happens. No close button, no outside click: the two buttons are the only way out. */
export function AlertDialog({ open, onClose, onConfirm, title, description, confirmLabel = "Confirm", cancelLabel = "Cancel", tone = "primary", pending = false, children }: AlertDialogProps) {
  return (
    <AlertDialogPrimitive.Root
      open={open}
      onOpenChange={(next) => {
        if (!next && !pending) onClose();
      }}
    >
      <AlertDialogPrimitive.Portal>
        <AlertDialogPrimitive.Overlay className="fixed inset-0 z-50 bg-blanket data-[state=open]:animate-fade-in data-[state=closed]:animate-fade-out" />
        <div className="fixed inset-0 z-50 flex items-start justify-center p-200 sm:pt-1000">
          <AlertDialogPrimitive.Content
            {...(description ? {} : { "aria-describedby": undefined })}
            style={{ maxWidth: 440 }}
            className="relative w-full overflow-hidden rounded-xxlarge bg-surface-overlay shadow-overlay outline-none data-[state=open]:animate-enter data-[state=closed]:animate-exit"
          >
            <div className="flex flex-col gap-100 px-250 py-200">
              <AlertDialogPrimitive.Title className="font-heading-xsmall text-default">{title}</AlertDialogPrimitive.Title>
              {description ? <AlertDialogPrimitive.Description className="font-body text-subtle">{description}</AlertDialogPrimitive.Description> : null}
              {children ? <div className="font-body text-default">{children}</div> : null}
            </div>
            <div className="flex items-center justify-end gap-100 border-t border-default bg-surface-sunken px-250 py-150">
              <AlertDialogPrimitive.Cancel asChild>
                <Button variant="subtle" disabled={pending}>
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
                  {pending ? <Spinner className="icon-inverse" /> : null}
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
