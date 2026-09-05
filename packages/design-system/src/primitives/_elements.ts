/* The elements a layout primitive may render as: containers and list parts. Never an interactive
   element: a link is TextLink, a button is Button or IconButton, so the focus ring, the pressed
   face and the name come with it. Atlassian's Box says the same ("cannot be an `a`, use Anchor;
   cannot be a `button`, use Pressable"); its Stack and Inline stop at div, span, ul, ol, li, dl. */

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
