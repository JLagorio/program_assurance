import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "../lib/cn";

/** The close button every overlay shares. */
export const overlayClose =
  "flex size-control-small items-center justify-center rounded-medium icon-subtle outline-none transition-colors duration-fast ease-standard hover:bg-neutral-subtle-hovered hover:icon-default focus-visible:outline-focused";

export type DialogProps = {
  /** The caller's state. A dialog is opened by an act and closed by the caller. */
  open: boolean;
  /** Called on Escape, the blanket, the close button, and Cancel. Ignored while `pending`. */
  onClose: () => void;
  /** The task, as the button that opened it says it: "Schedule assessment". */
  title: ReactNode;
  /** A line above the title: the record the task applies to, as an id or an Eyebrow. */
  eyebrow?: ReactNode;
  /** One sentence under the title, when the title does not say enough. Read as the dialog's description. */
  description?: ReactNode;
  /** The buttons: Cancel, then the verb. They stay put while the body scrolls. */
  footer?: ReactNode;
  /** A column of facts beside the body, on the sunken surface. Large dialogs only. */
  aside?: ReactNode;
  /** The task: fields, a table, prose. It scrolls; the header and the footer do not. */
  children: ReactNode;
  /** `medium` (520px) for a form; `large` (860px) for a table or an aside. */
  width?: "medium" | "large" | undefined;
  /** Holds the dialog open while the caller saves: Escape, the blanket and the close button do nothing. Pair it with `isLoading` on the verb. */
  pending?: boolean | undefined;
};

const widths = { medium: 520, large: 860 } as const;

/** A focused task over the page: title, optional description, body, optional aside, footer actions. Focus moves in and back; Escape and the blanket close it. */
export function Dialog({
  open,
  onClose,
  title,
  eyebrow,
  description,
  footer,
  aside,
  children,
  width = "medium",
  pending = false,
}: DialogProps) {
  return (
    <DialogPrimitive.Root
      open={open}
      onOpenChange={(next) => {
        if (!next && !pending) onClose();
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
              {eyebrow ? <div className="flex items-center gap-100 pb-025">{eyebrow}</div> : null}
              <DialogPrimitive.Title className="font-heading-xsmall text-default">
                {title}
              </DialogPrimitive.Title>
              {description ? (
                <DialogPrimitive.Description className="font-body text-subtle">
                  {description}
                </DialogPrimitive.Description>
              ) : null}
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">
              <div className={cn("grid", aside && "grid-cols-1 md:grid-cols-3")}>
                <div className={cn("px-250 py-200", aside && "md:col-span-2")}>{children}</div>
                {aside ? (
                  <div className="border-t border-default bg-surface-sunken px-250 py-200 md:border-s md:border-t-0">
                    {aside}
                  </div>
                ) : null}
              </div>
            </div>
            {footer ? (
              <div className="flex shrink-0 items-center justify-end gap-100 border-t border-default bg-surface-sunken px-250 py-150">
                {footer}
              </div>
            ) : null}
            <DialogPrimitive.Close asChild>
              <button
                type="button"
                aria-label="Close"
                disabled={pending}
                className={cn(overlayClose, "absolute end-150 top-100 disabled:opacity-disabled")}
              >
                <X className="size-icon-small" />
              </button>
            </DialogPrimitive.Close>
          </DialogPrimitive.Content>
        </div>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
