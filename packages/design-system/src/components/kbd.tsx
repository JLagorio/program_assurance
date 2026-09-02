import type { ReactNode } from "react";

/** A key or a shortcut, as it appears on the keyboard. */
export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="inline-flex h-200 min-w-200 items-center justify-center rounded-xsmall border border-default bg-surface-sunken px-050 font-body-xsmall font-medium text-subtle">
      {children}
    </kbd>
  );
}
