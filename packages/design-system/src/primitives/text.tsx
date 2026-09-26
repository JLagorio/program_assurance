import type { ComponentPropsWithoutRef, ElementType, ReactNode, Ref } from "react";

// The one import above the primitives' layer: a clamped Text reveals its full text the way a
// Truncate does, through the kit's Tooltip, rather than keeping a second copy of the reveal here.
import { Truncate } from "../components/truncate";
import { cn } from "../lib/cn";
import { classFor, type TextColorToken, type TextElement } from "./tokens";

/* Text: `as` from the text elements; `size`, `weight`, `color` (inverse automatically inside a
   Box with a bold background, inherited when nested), `align`, `maxLines`, `preserveLineBreaks`.
   The rules hold: running text neutral, colour functional, semibold for a heading and not a
   paragraph. No `style`. */

const size = {
  large: "font-body-large",
  medium: "font-body",
  small: "font-body-small",
  xsmall: "font-body-xsmall",
} as const;
const weight = {
  regular: "font-regular",
  medium: "font-medium",
  semibold: "font-semibold",
} as const;
const align = { start: "text-start", center: "text-center", end: "text-end" } as const;
type MaxLines = 1 | 2 | 3;
const inlineElements = new Set<TextElement>(["span", "strong", "em", "small", "label"]);

export type TextProps = {
  /** The element: a `span` by default; `p` for a paragraph; `label`, `dt`, `dd`, `li`, `legend`, `figcaption`, `strong`, `em`, `small`, `div`. Never a heading, a link or a button. */
  as?: TextElement | undefined;
  /** The associated control's DOM id when `as="label"`. */
  htmlFor?: string | undefined;
  ref?: Ref<HTMLElement> | undefined;
  children?: ReactNode | undefined;
  /** font.body.large · font.body · font.body.small · font.body.xsmall */
  size?: keyof typeof size | undefined;
  weight?: keyof typeof weight | undefined;
  /** A color.text token. Defaults to inheriting: the page's text colour, or the inverse a bold Box sets. */
  color?: TextColorToken | undefined;
  align?: keyof typeof align | undefined;
  /**
   * Clamp to this many lines with an ellipsis. While the text is cut, hovering it, or focusing
   * the link or button it sits in with the keyboard, shows the whole in a tooltip; a `title` of
   * your own replaces the tooltip.
   */
  maxLines?: MaxLines | undefined;
  /**
   * Keeps the line breaks and spaces typed into authored text (a comment, a statement, a note)
   * instead of running it into one line: `white-space: pre-wrap`. A one-line clamp keeps none.
   */
  preserveLineBreaks?: boolean | undefined;
  className?: string | undefined;
} & Omit<ComponentPropsWithoutRef<"span">, "children" | "className" | "color" | "style">;

/** Body text. The size is a composite type token, so family, size, leading and tracking always agree. */
export function Text({
  as = "span",
  size: s,
  weight: w,
  color,
  align: a,
  maxLines: m,
  preserveLineBreaks,
  className,
  children,
  ...rest
}: TextProps) {
  // An assertion, not an annotation: `const Tag: ElementType = as` would narrow to the literal union
  // and JSX would then check the ref against every element in it.
  const Tag = as as ElementType;
  const classes = cn(
    // A one-line clamp needs a box to cut: an inline run (a span in a link, say) becomes a block.
    m === 1 && inlineElements.has(as) && "block",
    s && size[s],
    w && weight[w],
    color && classFor(color),
    a && align[a],
    preserveLineBreaks && m !== 1 && "whitespace-pre-wrap",
    className,
  );
  if (m)
    return (
      <Truncate {...rest} maxLines={m} render={<Tag />} className={classes}>
        {children}
      </Truncate>
    );
  return (
    <Tag className={classes} {...rest}>
      {children}
    </Tag>
  );
}
