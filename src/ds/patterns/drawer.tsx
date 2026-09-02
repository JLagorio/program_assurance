import { createPortal } from "react-dom";
import type { ReactNode } from "react";

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
  if (!open || typeof document === "undefined") return null;
  return createPortal(
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-foreground/20" onClick={onClose} aria-hidden />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === "string" ? title : undefined}
        className="absolute inset-y-0 right-0 flex w-full max-w-[420px] flex-col bg-card shadow-pop animate-slide-up"
      >
        <div className="flex items-start justify-between gap-3 border-b border-border px-4 py-3">
          <div className="min-w-0">
            <h2 className="truncate text-[14px] font-medium tracking-[-0.01em]">{title}</h2>
            {subtitle ? (
              <p className="mt-0.5 truncate text-12 text-muted-foreground">{subtitle}</p>
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
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">{children}</div>
        {footer ? (
          <div className="flex items-center justify-end gap-2 border-t border-border bg-subtle px-4 py-2.5">
            {footer}
          </div>
        ) : null}
      </aside>
    </div>,
    document.body,
  );
}

/* The small reading primitives every rail, summary and detail body had been
   re-declaring locally (nine copies of Dash, seven of ProseBlock, three of
   WrapValue and IdList, three of Fact). One definition each. */
