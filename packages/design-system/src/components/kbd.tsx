import type { ReactNode } from "react";

import { cn } from "../lib/cn";

/* Reference material. None of Carbon, Base Web or Atlassian has a key cap; GitHub's Primer and
   shadcn do. A key is a <kbd> drawn as the cap; a chord is several caps in a Group. The glyphs are
   the keyboard's (⌘ ⇧ ⌥ ↵ esc), and a glyph a screen reader would not say is given its name. */

export type KbdProps = {
  /** The key as it reads on the cap: "K", "⌘", "esc", "↵". One key per cap. */
  children: ReactNode;
  /** What a screen reader says when the cap is a glyph: "Command" for ⌘, "Enter" for ↵. Letters need none. */
  label?: string | undefined;
  className?: string | undefined;
};

/** A key as it appears on the keyboard: a cap in `elevation.surface.sunken` with a hairline. */
function KbdRoot({ children, label, className }: KbdProps) {
  return (
    <kbd
      aria-label={label}
      className={cn(
        "inline-flex h-200 min-w-200 items-center justify-center rounded-xsmall border border-default bg-surface-sunken px-050 font-body-xsmall font-medium text-subtle",
        className,
      )}
    >
      {children}
    </kbd>
  );
}

export type KbdGroupProps = {
  /** The caps of one shortcut, in the order they are pressed. */
  children: ReactNode;
  className?: string | undefined;
};

/** A chord: the caps of one shortcut, `space.050` apart, read as one. */
export function KbdGroup({ children, className }: KbdGroupProps) {
  return <kbd className={cn("inline-flex items-center gap-050", className)}>{children}</kbd>;
}

export const Kbd = Object.assign(KbdRoot, { Group: KbdGroup });
