import type { ComponentPropsWithoutRef, ElementType, ReactNode, Ref } from "react";

import { cn } from "../lib/cn";
import { classFor, type HeadingColorToken, type HeadingElement } from "./tokens";

/* Reference material. Atlassian's Heading takes a required `size` (xxlarge to xxsmall) that picks
   the text style and a default element from h1 to h6, `as` to override the element, and `color`
   limited to `color.text`, `color.text.inverse` and `color.text.warning.inverse`, applied
   automatically inside a Box with a bold background. Carbon's rule: the productive headings are
   fixed sizes, and the level is semantic, chosen by the page, separate from the style. Base Web's
   Heading components take `as` and `color`. Here: four sizes on font.heading, the default element
   by size, the same three colours, and no `style`. */

const size = { large: "font-heading-large", medium: "font-heading-medium", small: "font-heading-small", xsmall: "font-heading-xsmall" } as const;
const defaultTag = { large: "div", medium: "h1", small: "h2", xsmall: "h3" } as const;

export type HeadingProps = {
  /** The element, when the page's outline needs a level other than the size's default. Level is semantic and chosen by the page; size is visual and chosen by the design. */
  as?: HeadingElement | undefined;
  ref?: Ref<HTMLElement> | undefined;
  children?: ReactNode | undefined;
  /** font.heading.large (a displayed number, as a div) · medium (page titles, h1) · small (section headings, h2) · xsmall (dialog and card titles, h3) */
  size: keyof typeof size;
  /** `color.text` by default; `color.text.inverse` on a bold fill, which a Box with a bold background sets for you. A tone is not a heading colour. */
  color?: HeadingColorToken | undefined;
  className?: string | undefined;
} & Omit<ComponentPropsWithoutRef<"h2">, "children" | "className" | "color" | "style">;

/** A title: the size from the design, the level from the page. */
export function Heading({ as, size: s, color, className, children, ...rest }: HeadingProps) {
  const Tag = (as ?? defaultTag[s]) as ElementType;
  return (
    <Tag className={cn(size[s], color && classFor(color), className)} {...rest}>
      {children}
    </Tag>
  );
}
