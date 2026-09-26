import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";

import { cn } from "../lib/cn";

/* List: bulleted and numbered lists on one inset and two spacings. The marker hangs in the inset,
   so the item's text lines up with the text above the list; a numbered list takes a wider inset
   for two-digit numbers. The inset is logical, so it sits on the right in a right-to-left locale. */

const spacings = { tight: "gap-025", loose: "gap-100" } as const;

export type ListSpacing = keyof typeof spacings;

export type ListProps = useRender.ComponentProps<"ul"> & {
  /** Numbers the items (`ol`) instead of bulleting them (`ul`): steps, a ranked order, an order the text refers to. */
  ordered?: boolean | undefined;
  /** The space between items: `tight` (the default) for short lines such as validation messages, `loose` for items that are sentences or wrap. */
  spacing?: ListSpacing | undefined;
  /** The number of the first item of an ordered list. */
  start?: number | undefined;
};

export type ListItemProps = useRender.ComponentProps<"li">;

/** A bulleted or numbered list: `ordered` for numbers, `spacing` tight or loose. Items are List.Item. */
function ListRoot({
  ordered = false,
  spacing = "tight",
  start,
  className,
  render,
  ref,
  ...props
}: ListProps) {
  return useRender({
    defaultTagName: ordered ? "ol" : "ul",
    render,
    ref,
    state: { slot: "list" },
    props: mergeProps<"ul">(props, {
      ...{ "data-slot": "list", "data-spacing": spacing },
      ...(ordered && start !== undefined ? { start } : {}),
      className: cn(
        "flex flex-col",
        ordered ? "list-decimal ps-300" : "list-disc ps-200",
        spacings[spacing],
        className,
      ),
    }),
  });
}

/** One item of a List: text, or inline content with a TextLink. A nested List goes inside it. */
export function ListItem({ className, render, ref, ...props }: ListItemProps) {
  return useRender({
    defaultTagName: "li",
    render,
    ref,
    state: { slot: "list-item" },
    props: mergeProps<"li">(props, {
      ...{ "data-slot": "list-item" },
      className: cn("min-w-0 break-words ps-025", className),
    }),
  });
}

export const List = Object.assign(ListRoot, { Item: ListItem });
