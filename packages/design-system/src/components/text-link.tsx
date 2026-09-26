import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";

import { cn } from "../lib/cn";

export type TextLinkProps = useRender.ComponentProps<"a"> & {
  /** Left unset, the link takes the surrounding size. */
  size?: "small" | "medium" | undefined;
  weight?: "regular" | "medium" | undefined;
};

const sizes = { small: "font-body-small", medium: "font-body" };
const weights = { regular: "font-regular", medium: "font-medium" };

/* Where a pointer is coarse, ::before is a hit area at least 24px tall across the link's own width,
   never wider: the shared band, touch-target-block. A link that wraps is split into fragments whose
   positioning box runs from its first word to its last, so the band stays on the link where a
   centred square (touch-target) would land on the words beside it; on a link that carries both,
   as Related's title does, the band wins. A link in a sentence takes no area at all: its words are
   the target (WCAG 2.5.8's inline exception), and a taller area would reach the lines above and
   below. */
const touchArea = "touch-target-block data-in-text:before:content-none";

/** Marks a link whose parent has text of its own beside it: a link in a sentence. Read once, when the link mounts. */
function markInText(node: HTMLElement | null) {
  if (!node?.parentNode) return;
  const inText = Array.from(node.parentNode.childNodes).some(
    (sibling) => sibling.nodeType === Node.TEXT_NODE && Boolean(sibling.textContent?.trim()),
  );
  node.toggleAttribute("data-in-text", inText);
}

/** A native anchor; compose a router link with render. Actions use Button variant="link". */
export function TextLink({ render, size, weight, className, ...props }: TextLinkProps) {
  return useRender({
    defaultTagName: "a",
    render,
    ref: markInText,
    state: { slot: "text-link" },
    props: mergeProps<"a">(
      {
        className: cn(
          // A link in a sentence is underlined at rest, since its colour against the text beside it is
          // 2.0:1 in dark mode (WCAG 1.4.1); a link standing alone underlines on hover.
          "relative rounded-xsmall text-brand underline-offset-2 outline-none transition-colors duration-fast ease-standard hover:underline data-in-text:underline focus-visible:outline-focused",
          touchArea,
          size && sizes[size],
          weight && weights[weight],
          className,
        ),
      },
      props,
    ),
  });
}
