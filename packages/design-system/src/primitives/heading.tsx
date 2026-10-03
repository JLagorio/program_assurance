import type { ComponentPropsWithoutRef, ElementType, ReactNode, Ref } from "react";

import { cn } from "../lib/cn";
import { headingTag, useHeadingLevel } from "./heading-level";
import { classFor, type HeadingColorToken, type HeadingElement } from "./tokens";

/* Heading takes a required `size` that picks the text style and a default element from h1 to h6,
   `as` to override the element, and `color` limited to `color.text`, `color.text.inverse` and
   `color.text.warning.inverse`, applied automatically inside a Box with a bold background. The
   sizes are the titles the kit draws, one font.heading token each: `page` is PageHeader.Title's,
   `overlay` the title of a Dialog, Sheet, AlertDialog or Drawer, `section` Section.Title's, and
   `display` the one size above them. Those parts render a Heading, so a title set with Heading
   matches the screen it sits in. The level is semantic, chosen by the page, separate from the
   style. Inside a HeadingLevelProvider, a titled Section or a panel's body, a Heading without `as`
   takes the contextual level instead of its size's default; `display`, a displayed number, stays a
   div. The earlier sizes `large`, `medium`, `small` and `xsmall` are aliases for one version, each
   drawn with the step that replaced it. */

const size = {
  display: "font-heading-display",
  page: "font-heading-page",
  overlay: "font-heading-overlay",
  section: "font-heading-section",
  // The earlier sizes, drawn with the steps that replaced them; `small` keeps its medium weight.
  large: "font-heading-display",
  medium: "font-heading-page",
  small: "font-heading-page font-medium",
  xsmall: "font-heading-overlay",
} as const;
const defaultTag = {
  display: "div",
  page: "h1",
  overlay: "h3",
  section: "h2",
  large: "div",
  medium: "h1",
  small: "h2",
  xsmall: "h3",
} as const;
/** A displayed number is never a heading, whatever the context says. */
const displayed = new Set<HeadingSize>(["display", "large"]);

/** A title the kit draws: `page` (PageHeader.Title, 20/26 semibold), `overlay` (an overlay's title, 15/22 medium), `section` (Section.Title, 13/18 semibold) or `display` (28/34 semibold, a figure bigger than a Stat's). */
export type HeadingSize =
  | "display"
  | "page"
  | "overlay"
  | "section"
  /** @deprecated `large` is `display`, the same style; `ledger/no-deprecated-name` fixes it. */
  | "large"
  /** @deprecated A page or record title is `page`, 20/26, what PageHeader.Title draws; `medium` draws `page` for one version, and `ledger/no-deprecated-name` fixes it. */
  | "medium"
  /** @deprecated A page or record title is `page` (20/26 semibold) and a section's title `section` (13/18 semibold); `small` draws `page` at medium weight, 20/26 medium, for one version. */
  | "small"
  /** @deprecated `xsmall` is `overlay`, the same style and element; `ledger/no-deprecated-name` fixes it. */
  | "xsmall";

export type HeadingProps = {
  /** The element, when the outline needs a level other than the contextual one. Without it a Heading takes the level from the nearest HeadingLevelProvider (or titled Section, or panel body), and outside every provider the size's default: `page` an h1, `section` an h2, `overlay` an h3, `display` a div. Level is semantic and chosen by the page; size is visual and chosen by the design. */
  as?: HeadingElement | undefined;
  ref?: Ref<HTMLElement> | undefined;
  children?: ReactNode | undefined;
  /** The title it matches: `page` (font.heading.page, 20/26 semibold: the page and record title, and a Stat's figure as a div) · `overlay` (font.heading.overlay, 15/22 medium: an overlay's title, a card's title, a group inside an overlay) · `section` (font.heading.section, 13/18 semibold: a section's title) · `display` (font.heading.display, 28/34 semibold: a figure bigger than a Stat's, or the sign-in screen's title). `large`, `medium`, `small` and `xsmall` are deprecated. */
  size: HeadingSize;
  /** `color.text` by default; `color.text.inverse` on a bold fill, which a Box with a bold background sets for you. A tone is not a heading colour. */
  color?: HeadingColorToken | undefined;
  className?: string | undefined;
} & Omit<ComponentPropsWithoutRef<"h2">, "children" | "className" | "color" | "style">;

/** A title: the size from the design, the level from the page. */
export function Heading({ as, size: s, color, className, children, ...rest }: HeadingProps) {
  const level = useHeadingLevel();
  const contextual = level !== undefined && !displayed.has(s) ? headingTag(level) : undefined;
  const Tag = (as ?? contextual ?? defaultTag[s]) as ElementType;
  return (
    <Tag className={cn(size[s], color && classFor(color), className)} {...rest}>
      {children}
    </Tag>
  );
}
