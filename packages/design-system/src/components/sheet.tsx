import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "../lib/cn";
import { overlayClose } from "./dialog";

export type SheetProps = {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  subtitle?: ReactNode;
  /** A row above the title: an Eyebrow, an id. */
  eyebrow?: ReactNode;
  footer?: ReactNode;
  side?: "end" | "start" | undefined;
  width?: number | undefined;
  children: ReactNode;
};

/** A detail surface that slides in from an edge and leaves the page visible. For the bottom sheet with a drag handle, Drawer. */
export function Sheet({
  open,
  onClose,
  title,
  subtitle,
  eyebrow,
  footer,
  side = "end",
  width = 420,
  children,
}: SheetProps) {
  return (
    <DialogPrimitive.Root
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-blanket data-[state=open]:animate-fade-in data-[state=closed]:animate-fade-out" />
        <DialogPrimitive.Content
          {...(subtitle ? {} : { "aria-describedby": undefined })}
          style={{ maxWidth: width }}
          className={cn(
            "fixed inset-y-0 z-50 flex w-full flex-col bg-surface-overlay shadow-overlay outline-none",
            side === "end"
              ? "end-0 data-[state=open]:animate-slide-in-end data-[state=closed]:animate-slide-out-end"
              : "start-0 data-[state=open]:animate-slide-in-start data-[state=closed]:animate-slide-out-start",
          )}
        >
          <div className="flex shrink-0 flex-col gap-025 border-b border-default py-150 pe-600 ps-200">
            {eyebrow ? <div className="flex items-center gap-100 pb-025">{eyebrow}</div> : null}
            <DialogPrimitive.Title className="truncate font-heading-xsmall text-default">
              {title}
            </DialogPrimitive.Title>
            {subtitle ? (
              <DialogPrimitive.Description className="truncate font-body-small text-subtle">
                {subtitle}
              </DialogPrimitive.Description>
            ) : null}
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-200 py-150">{children}</div>
          {footer ? (
            <div className="flex shrink-0 items-center justify-end gap-100 border-t border-default bg-surface-sunken px-200 py-100">
              {footer}
            </div>
          ) : null}
          <DialogPrimitive.Close asChild>
            <button
              type="button"
              aria-label="Close"
              className={cn(overlayClose, "absolute end-150 top-150")}
            >
              <X className="size-icon-small" />
            </button>
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
