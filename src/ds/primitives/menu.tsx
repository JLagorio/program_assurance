import { useState } from "react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

function MenuRoot({
  trigger,
  align = "start",
  width = 200,
  children,
}: {
  trigger: (props: { open: boolean; toggle: () => void }) => ReactNode;
  align?: "start" | "end";
  width?: number;
  children: (close: () => void) => ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      {trigger({ open, toggle: () => setOpen((o) => !o) })}
      {open ? (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} aria-hidden />
          <div
            role="menu"
            style={{ width }}
            className={cn(
              "absolute top-[calc(100%+4px)] z-40 overflow-hidden rounded-lg border border-border bg-popover p-1 shadow-pop",
              align === "end" ? "right-0" : "left-0",
            )}
          >
            {children(() => setOpen(false))}
          </div>
        </>
      ) : null}
    </div>
  );
}

function MenuItem({
  children,
  selected,
  onSelect,
  trailing,
}: {
  children: ReactNode;
  selected?: boolean;
  onSelect?: () => void;
  trailing?: ReactNode;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onSelect}
      className={cn(
        "flex h-7 w-full items-center gap-2 rounded-md px-2 text-left text-13 transition-colors duration-100",
        selected ? "bg-primary-soft text-primary" : "text-foreground hover:bg-surface-hover",
      )}
    >
      <span className="min-w-0 flex-1 truncate">{children}</span>
      {trailing ? <span className="shrink-0 text-11 text-muted-foreground">{trailing}</span> : null}
    </button>
  );
}

function MenuLabel({ children }: { children: ReactNode }) {
  return (
    <div className="px-2 pb-1 pt-1.5 text-11 font-medium uppercase tracking-[0.06em] text-muted-foreground">
      {children}
    </div>
  );
}

export const Menu = Object.assign(MenuRoot, { Item: MenuItem, Label: MenuLabel });
