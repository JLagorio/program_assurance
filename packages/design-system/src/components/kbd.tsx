import type { ComponentProps } from "react";

import { cn } from "../lib/cn";

/* A key is a <kbd> drawn as the cap; a chord is several caps in a Group. The glyphs are
   the keyboard's (⌘ ⇧ ⌥ ↵ esc), and a glyph a screen reader would not say is given its name. */

export type KbdProps = ComponentProps<"kbd"> & {
  /** A glyph's spoken name, such as "Command" for ⌘. Explicit aria-label takes precedence. */
  label?: string | undefined;
};

/** A key as it appears on the keyboard: a cap in `elevation.surface.sunken` with a hairline. */
function KbdRoot({ label, className, ...props }: KbdProps) {
  return (
    <kbd
      data-slot="kbd"
      aria-label={label}
      className={cn(
        "inline-flex h-200 min-w-200 items-center justify-center rounded-xsmall border border-default bg-surface-sunken px-050 font-body-xsmall font-medium text-subtle",
        className,
      )}
      {...props}
    />
  );
}

export type KbdGroupProps = ComponentProps<"kbd">;

/** A chord: the caps of one shortcut, `space.050` apart. */
export function KbdGroup({ className, ...props }: KbdGroupProps) {
  return (
    <kbd
      data-slot="kbd-group"
      className={cn("inline-flex items-center gap-050", className)}
      {...props}
    />
  );
}

export const Kbd = Object.assign(KbdRoot, { Group: KbdGroup });
