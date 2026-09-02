import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/* A detail surface that slides in from an edge and leaves the page visible.
   Same behaviour as Dialog underneath: focus moves in and back, Escape and the
   scrim close it, the page behind stops scrolling. For the mobile bottom sheet
   with a drag handle, see Drawer. */
export function Sheet({
  open,
  onClose,
  title,
  subtitle,
  footer,
  side = "right",
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  subtitle?: ReactNode;
  footer?: ReactNode;
  side?: "right" | "left";
  children: ReactNode;
}) {
  return (
    <DialogPrimitive.Root
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-foreground/20 animate-in fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0" />
        <DialogPrimitive.Content
          {...(subtitle ? {} : { "aria-describedby": undefined })}
          className={cn(
            "fixed inset-y-0 z-50 flex w-full max-w-[420px] flex-col bg-card shadow-pop outline-none duration-300 ease-out animate-in data-[state=closed]:animate-out",
            side === "right"
              ? "right-0 slide-in-from-right data-[state=closed]:slide-out-to-right"
              : "left-0 slide-in-from-left data-[state=closed]:slide-out-to-left",
          )}
        >
          <div className="shrink-0 border-b border-border py-3 pl-4 pr-12">
            <DialogPrimitive.Title className="truncate text-[14px] font-medium tracking-[-0.01em]">
              {title}
            </DialogPrimitive.Title>
            {subtitle ? (
              <DialogPrimitive.Description className="mt-0.5 truncate text-12 text-muted-foreground">
                {subtitle}
              </DialogPrimitive.Description>
            ) : null}
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">{children}</div>
          {footer ? (
            <div className="flex shrink-0 items-center justify-end gap-2 border-t border-border bg-subtle px-4 py-2.5">
              {footer}
            </div>
          ) : null}
          <DialogPrimitive.Close asChild>
            <button
              type="button"
              aria-label="Close"
              className="absolute right-3 top-3 flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35"
            >
              <X className="size-3.5" />
            </button>
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
