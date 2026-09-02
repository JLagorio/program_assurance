import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { ReactNode } from "react";

/* A detail surface that slides in from the right and leaves the page visible.
   Same behaviour as Modal underneath: focus moves in and back, Escape and the
   scrim close it, the page behind stops scrolling. */
export function Drawer({
  open,
  onClose,
  title,
  subtitle,
  footer,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  subtitle?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-foreground/20 animate-in fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0" />
        <Dialog.Content
          {...(subtitle ? {} : { "aria-describedby": undefined })}
          className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[420px] flex-col bg-card shadow-pop outline-none animate-in slide-in-from-right duration-300 ease-out data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right"
        >
          <div className="shrink-0 border-b border-border py-3 pl-4 pr-12">
            <Dialog.Title className="truncate text-[14px] font-medium tracking-[-0.01em]">
              {title}
            </Dialog.Title>
            {subtitle ? (
              <Dialog.Description className="mt-0.5 truncate text-12 text-muted-foreground">
                {subtitle}
              </Dialog.Description>
            ) : null}
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">{children}</div>
          {footer ? (
            <div className="flex shrink-0 items-center justify-end gap-2 border-t border-border bg-subtle px-4 py-2.5">
              {footer}
            </div>
          ) : null}
          <Dialog.Close asChild>
            <button
              type="button"
              aria-label="Close"
              className="absolute right-3 top-3 flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35"
            >
              <X className="size-3.5" />
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
