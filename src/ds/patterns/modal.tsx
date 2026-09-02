import { createPortal } from "react-dom";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

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
  if (!open || typeof document === "undefined") return null;
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:p-10">
      <div
        className="fixed inset-0 bg-foreground/25 backdrop-blur-[1px]"
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === "string" ? title : undefined}
        className={cn(
          "relative z-10 w-full overflow-hidden rounded-xl bg-card shadow-pop",
          width === "lg" ? "max-w-[860px]" : "max-w-[520px]",
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-3.5">
          <div className="min-w-0">
            <h2 className="text-[15px] font-medium tracking-[-0.01em]">{title}</h2>
            {description ? (
              <p className="mt-0.5 text-[13px] text-muted-foreground">{description}</p>
            ) : null}
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="-mr-1 flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            ✕
          </button>
        </div>
        <div className={cn("grid", aside ? "md:grid-cols-[minmax(0,1fr)_300px]" : "")}>
          <div className="px-5 py-4">{children}</div>
          {aside ? (
            <div className="border-t border-border bg-subtle px-5 py-4 md:border-l md:border-t-0">
              {aside}
            </div>
          ) : null}
        </div>
        {footer ? (
          <div className="flex items-center justify-end gap-2 border-t border-border bg-subtle px-5 py-3">
            {footer}
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}

/* A bordered card that owns one related object type: title, count, a few
   dense rows, and a single link out to the full list. */
