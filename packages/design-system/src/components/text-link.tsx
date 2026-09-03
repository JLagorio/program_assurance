import { Slot } from "@radix-ui/react-slot";
import type { ComponentPropsWithoutRef } from "react";

import { cn } from "../lib/cn";

export type TextLinkProps = ComponentPropsWithoutRef<"a"> & {
  /** On by default: the child (a router's Link) takes the classes. `false` renders an anchor from `href`. */
  asChild?: boolean | undefined;
  /** Left unset, the link takes the surrounding size. */
  size?: "small" | "medium" | undefined;
  weight?: "regular" | "medium" | undefined;
};

const sizes = { small: "font-body-small", medium: "font-body" };
const weights = { regular: "font-regular", medium: "font-medium" };

/** Navigation that reads as text: brand colour, underline on hover, the focus outline. An action that only looks like a link is `Button variant="link"`. */
export function TextLink({ asChild = true, size, weight, className, ...rest }: TextLinkProps) {
  const Comp = asChild ? Slot : "a";
  return (
    <Comp
      className={cn(
        "rounded-xsmall text-brand underline-offset-2 outline-none transition-colors duration-fast ease-standard hover:underline focus-visible:outline-focused",
        size && sizes[size],
        weight && weights[weight],
        className,
      )}
      {...rest}
    />
  );
}
