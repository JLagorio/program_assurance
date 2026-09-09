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

/** A native anchor; compose a router link with render. Actions use Button variant="link". */
export function TextLink({ render, size, weight, className, ...props }: TextLinkProps) {
  return useRender({
    defaultTagName: "a",
    render,
    state: { slot: "text-link" },
    props: mergeProps<"a">(
      {
        className: cn(
          "rounded-xsmall text-brand underline-offset-2 outline-none transition-colors duration-fast ease-standard hover:underline focus-visible:outline-focused",
          size && sizes[size],
          weight && weights[weight],
          className,
        ),
      },
      props,
    ),
  });
}
