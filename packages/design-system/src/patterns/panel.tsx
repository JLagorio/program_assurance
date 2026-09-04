import { ChevronLeft, PanelRight, X } from "lucide-react";
import type { ReactNode } from "react";

import { IconButton } from "../components/button";
import { cn } from "../lib/cn";
import { PanelContext } from "../lib/panel-context";

export type PanelProps = {
  /** What is shown: the object when the panel shows it ("Comments"), the action when it completes one ("Edit settings"). A record's rail has no title; it is the record's. */
  title?: ReactNode;
  /** An icon or a small mark before the title. */
  icon?: ReactNode;
  /** Back to the panel's previous view; only after a link inside the panel opened a new one. */
  onBack?: (() => void) | undefined;
  /** Up to two icon buttons before the close: expand, open in a new tab, more. */
  actions?: ReactNode;
  /** A close, for a panel the reader opened and may dismiss. A record's rail has none: it is always there. */
  onClose?: (() => void) | undefined;
  /** A row under the header that stays put: a status, a breadcrumb, the name of the object when the title is an action. */
  subheader?: ReactNode;
  /** Actions pinned to the bottom, right-aligned: Cancel, then the primary. */
  footer?: ReactNode;
  /** The body without padding, for content whose rules run edge to edge: the record's rail. The Inspector insets itself. */
  flush?: boolean | undefined;
  className?: string | undefined;
  children: ReactNode;
};

/**
 * The surface inside the shell's Panel area: an optional header that names what is shown, the
 * body, an optional footer. The area scrolls; the header and the footer stay put. Two uses. The
 * record's rail, details and related information, is always there on a record and is never
 * dismissed: no title, no close, `flush`, an Inspector inside that runs edge to edge. A panel the reader opens, a
 * thread, a form, has a title, a close and a Panel.Trigger. The peek is neither; it is a Sheet
 * over the nav.
 */
function PanelRoot({
  title,
  icon,
  onBack,
  actions,
  onClose,
  subheader,
  footer,
  flush = false,
  className,
  children,
}: PanelProps) {
  const hasHeader = title || icon || onBack || actions || onClose;
  return (
    <div className={cn("flex min-h-full flex-col", className)}>
      {hasHeader ? (
        <div className="sticky top-0 z-10 shrink-0 bg-surface">
          <div
            className={cn(
              "flex items-center gap-050 border-b border-default py-075 pe-100",
              onBack ? "ps-100" : "ps-300",
            )}
          >
            {onBack ? (
              <IconButton label="Back" variant="subtle" onClick={onBack} icon={<ChevronLeft />} />
            ) : null}
            {icon ? <span className="flex shrink-0 items-center">{icon}</span> : null}
            <h2 className="min-w-0 flex-1 truncate font-body font-medium text-default">{title}</h2>
            {actions ? <div className="flex shrink-0 items-center gap-025">{actions}</div> : null}
            {onClose ? (
              <IconButton label="Close" variant="subtle" onClick={onClose} icon={<X />} />
            ) : null}
          </div>
          {subheader ? (
            <div className="border-b border-default px-300 py-100 font-body-small text-subtle">
              {subheader}
            </div>
          ) : null}
        </div>
      ) : null}
      <PanelContext.Provider value={{ flush }}>
        <div className={cn("flex-1", !flush && "px-300 py-200")}>{children}</div>
      </PanelContext.Provider>
      {footer ? (
        <div className="sticky bottom-0 flex shrink-0 items-center justify-end gap-100 border-t border-default bg-surface px-300 py-100">
          {footer}
        </div>
      ) : null}
    </div>
  );
}

/** The button that opens a dismissible panel, in a toolbar or a header: the same place on every page, selected while the panel is open. The record's rail has no trigger. */
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
    <IconButton
      label={label}
      variant="subtle"
      isSelected={isOpen}
      aria-expanded={isOpen}
      onClick={onClick}
      icon={<PanelRight />}
    />
  );
}

export const Panel = Object.assign(PanelRoot, { Trigger: PanelTrigger });
