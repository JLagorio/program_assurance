/* The elements a layout primitive may render as: containers and list parts. Never an interactive
   element: a link is TextLink, a button is Button or IconButton, so the focus ring, the pressed
   face and the name come with it. Stack and Inline stop at the containers and the list parts. */

/** The elements a layout primitive renders as: a container, a landmark, a list or a list part. */
export type LayoutElement =
  | "div"
  | "span"
  | "section"
  | "article"
  | "aside"
  | "nav"
  | "header"
  | "footer"
  | "main"
  | "ul"
  | "ol"
  | "li"
  | "dl"
  | "dt"
  | "dd"
  | "fieldset"
  | "form"
  | "figure"
  | "figcaption";

/** The elements a Text renders as: a run, a paragraph, a label or a list part. Never a heading, a link or a button. */
export type TextElement =
  | "span"
  | "p"
  | "div"
  | "strong"
  | "em"
  | "small"
  | "label"
  | "legend"
  | "figcaption"
  | "dt"
  | "dd"
  | "li";

/** The elements a Heading renders as: a level, or a `div` or `span` when the outline should not have it. */
export type HeadingElement = "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "div" | "span";

/** How a primitive sizes as a flex item: `hug` is as big as its content; `fill` takes the free space. */
export type Grow = "hug" | "fill";
/** Whether a primitive gives up size when its row runs out of room: `none` keeps it. */
export type Shrink = "none";

/* `fill` grows along the parent's main axis (flex-1) and drops the automatic minimum size on both
   axes: a flex item's minimum applies only on its parent's main axis, so both are safe, and a
   truncating child inside it cuts instead of pushing the row wider than its parent. */
export const growClasses: Record<Grow, string | undefined> = {
  hug: undefined,
  fill: "flex-1 min-w-0 min-h-0",
};
export const shrinkClasses: Record<Shrink, string> = { none: "shrink-0" };

/**
 * The classes an element needs to behave as a layout box: a fieldset's minimum inline size is its
 * content's (`min-inline-size: min-content`), so a fieldset column would grow to its widest table
 * where a div stays in its frame. A group of fields is a FieldSet, which takes `disabled` and a
 * legend; `as="fieldset"` is only a grouping box.
 */
export function elementClasses(as: string): string | undefined {
  return as === "fieldset" ? "min-w-0" : undefined;
}
