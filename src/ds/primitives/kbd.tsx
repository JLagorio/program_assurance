import type { ReactNode } from "react";

export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="inline-flex h-4 min-w-4 items-center justify-center rounded border border-border-subtle bg-surface-2 px-1 font-sans text-[10px] font-medium text-muted-foreground">
      {children}
    </kbd>
  );
}

/* Small, keyboard-dismissible dropdown. No portal — anchored to trigger. */
