import { ChevronLeft, PanelRight, X } from "lucide-react";
import type { ReactNode } from "react";

import { IconButton } from "../components/button";
import { Tooltip } from "../components/tooltip";
import { cn } from "../lib/cn";

export type PanelProps = {
  /** What is shown: the object when the panel shows it ("Details", "Comments"), the action when it completes one ("Edit settings"). */
  title: ReactNode;
  /** An icon or a small mark before the title. */
  icon?: ReactNode;
  /** Back to the panel's previous view; only after a link inside the panel opened a new one. */
  onBack?: (() => void) | undefined;
  /** Up to two icon buttons before the close: expand, open in a new tab, more. */
  actions?: ReactNode;
  onClose: () => void;
  /** A row under the header that stays put: a status, a breadcrumb, the name of the object when the title is an action. */
  subheader?: ReactNode;
  /** Actions pinned to the bottom, right-aligned: Cancel, then the primary. */
  footer?: ReactNode;
  className?: string | undefined;
  children: ReactNode;
};

/**
 * The surface inside the shell's Panel area: a header that names what is shown, the body, an
 * optional footer. The area scrolls; the header and the footer stay put. What goes in the body is
 * the product's: the record's rail on demand (an Inspector with `sticky` off), a thread, a form.
 * The peek is not a panel; it is a Sheet over the nav.
 */
function PanelRoot({
  title,
  icon,
  onBack,
  actions,
  onClose,
  subheader,
  footer,
  className,
  children,
}: PanelProps) {
  return (
    <div className={cn("flex min-h-full flex-col", className)}>
      <div className="sticky top-0 z-10 shrink-0 bg-surface">
        <div
          className={cn(
            "flex items-center gap-050 border-b border-default py-075 pe-100",
            onBack ? "ps-100" : "ps-300",
          )}
        >
          {onBack ? (
            <IconButton label="Back" variant="subtle" onClick={onBack}>
              <ChevronLeft className="size-icon-medium" />
            </IconButton>
          ) : null}
          {icon ? <span className="flex shrink-0 items-center">{icon}</span> : null}
          <h2 className="min-w-0 flex-1 truncate font-body font-medium text-default">{title}</h2>
          {actions ? <div className="flex shrink-0 items-center gap-025">{actions}</div> : null}
          <IconButton label="Close" variant="subtle" onClick={onClose}>
            <X className="size-icon-medium" />
          </IconButton>
        </div>
        {subheader ? (
          <div className="border-b border-default px-300 py-100 font-body-small text-subtle">
            {subheader}
          </div>
        ) : null}
      </div>
      <div className="flex-1 px-300 py-200">{children}</div>
      {footer ? (
        <div className="sticky bottom-0 flex shrink-0 items-center justify-end gap-100 border-t border-default bg-surface px-300 py-100">
          {footer}
        </div>
      ) : null}
    </div>
  );
}

/** The button that opens the panel, in the record header's actions or a toolbar: the same place on every page, selected while the panel is open. */
function PanelTrigger({
  isOpen,
  onClick,
  label = "Details",
}: {
  isOpen: boolean;
  onClick: () => void;
  label?: string | undefined;
}) {
  return (
    <Tooltip content={label}>
      <IconButton
        label={label}
        variant="subtle"
        isSelected={isOpen}
        aria-expanded={isOpen}
        onClick={onClick}
      >
        <PanelRight className="size-icon-medium" />
      </IconButton>
    </Tooltip>
  );
}

export const Panel = Object.assign(PanelRoot, { Trigger: PanelTrigger });
