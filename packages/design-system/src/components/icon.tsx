import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import type { ReactNode } from "react";

import { cn } from "../lib/cn";
import { classFor, type ClassToken } from "../primitives/tokens";

/* Icon: a glyph with its size, its colour and its name decided in one place. With a `label` it
   is an image with that name, for a mark that stands for something on its own (a boundary, a
   met check, a warning). Without one it is decoration beside a word and hidden from assistive
   technology. Lucide's `size` and `aria-*` stay untouched on the glyph; the wrapper owns them. */

const sizes = {
  small: "size-icon-small [&_svg]:size-icon-small",
  medium: "size-icon-medium [&_svg]:size-icon-medium",
} as const;

/** The icon colour tokens: `color.icon` beside content text, `.subtle` beside subtle text, a tone's for a status mark. */
export type IconColorToken = Extract<ClassToken, "color.icon" | `color.icon.${string}`>;

export type IconSize = keyof typeof sizes;

export type IconProps = Omit<useRender.ComponentProps<"span">, "children" | "color"> & {
  /** The glyph, passed bare: `<Shield />`. The wrapper sizes and colours it. */
  children: ReactNode;
  /**
   * What the icon means when it stands for something on its own: "Authorization boundary",
   * "Met", "Overdue". The icon becomes an image with this name. Without it the icon is
   * decoration beside a word, hidden from assistive technology. The name is the value, not the
   * glyph: "Met", not "Check".
   */
  label?: string | undefined;
  /** `dimension.icon.small` (14px, beside body text; the default) or `.medium` (16px, standing alone or beside a heading). */
  size?: IconSize | undefined;
  /** A `color.icon` token. Defaults to inheriting the colour of the text around it. */
  color?: IconColorToken | undefined;
};

/** A glyph on the icon tokens: named with `label` when it stands for something, hidden when it only decorates a word. */
export function Icon({ label, size = "small", color, className, render, ref, ...props }: IconProps) {
  const named = Boolean(label);
  return useRender({
    defaultTagName: "span",
    render,
    ref,
    state: { slot: "icon" },
    props: mergeProps<"span">(props, {
      ...{ "data-slot": "icon" },
      role: named ? "img" : undefined,
      "aria-label": named ? label : undefined,
      "aria-hidden": named ? undefined : true,
      className: cn(
        "inline-flex shrink-0 items-center justify-center [&_svg]:shrink-0",
        sizes[size],
        color && classFor(color),
        className,
      ),
    }),
  });
}
