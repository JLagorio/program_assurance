import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "../lib/cn";

/** The close button every overlay shares. */
export const overlayClose =
  "flex size-control-small items-center justify-center rounded-medium icon-subtle outline-none transition-colors duration-fast ease-standard hover:bg-neutral-subtle-hovered hover:icon-default focus-visible:outline-focused";

export type DialogProps = {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  footer?: ReactNode;
  /** A column of facts beside the body. */
  aside?: ReactNode;
  children: ReactNode;
  width?: "medium" | "large" | undefined;
};

const widths = { medium: 520, large: 860 } as const;

/** A focused task over the page: title, optional description, body, optional aside, footer actions. Focus moves in and back; Escape and the blanket close it. */
export function Dialog({ open, onClose, title, description, footer, aside, children, width = "medium" }: DialogProps) {
  return (
    <DialogPrimitive.Root
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-blanket data-[state=open]:animate-fade-in data-[state=closed]:animate-fade-out" />
        <div className="fixed inset-0 z-50 flex items-start justify-center p-200 sm:p-600">
          <DialogPrimitive.Content
            {...(description ? {} : { "aria-describedby": undefined })}
            style={{ maxWidth: widths[width] }}
            className="relative flex max-h-full w-full flex-col overflow-hidden rounded-xxlarge bg-surface-overlay shadow-overlay outline-none data-[state=open]:animate-enter data-[state=closed]:animate-exit"
          >
            <div className="flex shrink-0 flex-col gap-025 border-b border-default py-150 pe-600 ps-250">
              <DialogPrimitive.Title className="font-heading-xsmall text-default">{title}</DialogPrimitive.Title>
              {description ? <DialogPrimitive.Description className="font-body text-subtle">{description}</DialogPrimitive.Description> : null}
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">
              <div className={cn("grid", aside && "grid-cols-1 md:grid-cols-3")}>
                <div className={cn("px-250 py-200", aside && "md:col-span-2")}>{children}</div>
                {aside ? <div className="border-t border-default bg-surface-sunken px-250 py-200 md:border-s md:border-t-0">{aside}</div> : null}
              </div>
            </div>
            {footer ? <div className="flex shrink-0 items-center justify-end gap-100 border-t border-default bg-surface-sunken px-250 py-150">{footer}</div> : null}
            <DialogPrimitive.Close asChild>
              <button type="button" aria-label="Close" className={cn(overlayClose, "absolute end-150 top-100")}>
                <X className="size-icon-small" />
              </button>
            </DialogPrimitive.Close>
          </DialogPrimitive.Content>
        </div>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
