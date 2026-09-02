import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/* A focused task over the page: title, optional description, body, optional
   aside of facts, footer actions. Focus moves in on open and back on close;
   Escape and the scrim close it; the page behind stops scrolling. Header and
   footer stay put while a long body scrolls. */
export function Modal({
  open,
  onClose,
  title,
  description,
  footer,
  aside,
  children,
  width = "md",
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  footer?: ReactNode;
  aside?: ReactNode;
  children: ReactNode;
  width?: "md" | "lg";
}) {
  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-foreground/25 backdrop-blur-[1px] animate-in fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0" />
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:p-10">
          <Dialog.Content
            {...(description ? {} : { "aria-describedby": undefined })}
            className={cn(
              "relative flex max-h-full w-full flex-col overflow-hidden rounded-xl bg-card shadow-pop outline-none",
              "animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
              width === "lg" ? "max-w-[860px]" : "max-w-[520px]",
            )}
          >
            <div className="shrink-0 border-b border-border py-3.5 pl-5 pr-14">
              <Dialog.Title className="text-[15px] font-medium tracking-[-0.01em]">
                {title}
              </Dialog.Title>
              {description ? (
                <Dialog.Description className="mt-0.5 text-[13px] text-muted-foreground">
                  {description}
                </Dialog.Description>
              ) : null}
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">
              <div className={cn("grid", aside ? "md:grid-cols-[minmax(0,1fr)_300px]" : "")}>
                <div className="px-5 py-4">{children}</div>
                {aside ? (
                  <div className="border-t border-border bg-subtle px-5 py-4 md:border-l md:border-t-0">
                    {aside}
                  </div>
                ) : null}
              </div>
            </div>
            {footer ? (
              <div className="flex shrink-0 items-center justify-end gap-2 border-t border-border bg-subtle px-5 py-3">
                {footer}
              </div>
            ) : null}
            <Dialog.Close asChild>
              <button
                type="button"
                aria-label="Close"
                className="absolute right-4 top-3 flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35"
              >
                <X className="size-3.5" />
              </button>
            </Dialog.Close>
          </Dialog.Content>
        </div>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
