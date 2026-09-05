import { cloneElement, isValidElement, type ReactElement, type ReactNode } from "react";

import { cn } from "../lib/cn";

/* An empty state is a title as a positive statement, a body that says what to do, a primary
   action and a secondary link, left-aligned as a block, replacing the element that would have
   shown; in a small container (a card, a rail, a panel) the icon sits beside the text and goes
   when space is tight, and several empties in view take tertiary buttons. Two sizes: the block that replaces a
   table, in a dashed frame so an empty region reads as a region; and the compact block inside a
   card, a rail or a panel, the icon beside the text, with no frame because the card is the frame. */

export type EmptySize = "default" | "compact";

export type EmptyProps = {
  /** What would be here, as a statement: "No findings", "No controls match". Positive where it can be: "Start by linking evidence". */
  title: string;
  /** One line: why it is empty, and what fills it. */
  description?: string | undefined;
  /** The action that fills it: one Button, secondary unless it is the page's one thing to do. */
  action?: ReactNode;
  /** A second way, as a TextLink beside the action: "Import from a file", "How evidence works". */
  secondary?: ReactNode;
  /** An icon for what would be here, in a neutral circle: above the title, or beside the text when compact. Leave it off when the space is tight. */
  icon?: ReactNode;
  /** `default`, the framed block that replaces a table or a list; `compact`, the block inside a card, a rail or a panel. */
  size?: EmptySize | undefined;
  className?: string | undefined;
};

/** Nothing here yet: a title, one line of why, and the action that fills it, in a dashed frame where a table would be or compact inside a card. */
export function Empty({
  title,
  description,
  action,
  secondary,
  icon,
  size = "default",
  className,
}: EmptyProps) {
  const compact = size === "compact";
  const glyph = isValidElement(icon)
    ? cloneElement(icon as ReactElement<{ className?: string | undefined }>, {
        className: cn(compact ? "size-icon-small" : "size-icon-medium", "shrink-0"),
      })
    : icon;
  const mark = icon ? (
    <span
      aria-hidden
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-neutral icon-subtle",
        compact ? "size-400" : "size-500",
      )}
    >
      {glyph}
    </span>
  ) : null;
  const text = (
    <>
      <p className="font-body font-medium text-default">{title}</p>
      {description ? <p className="font-body-small text-subtle">{description}</p> : null}
      {action || secondary ? (
        <div className="flex flex-wrap items-center gap-150 pt-075">
          {action}
          {secondary}
        </div>
      ) : null}
    </>
  );
  if (compact)
    return (
      <div className={cn("flex items-center gap-150", className)}>
        {mark}
        <div className="flex min-w-0 flex-col gap-025">{text}</div>
      </div>
    );
  return (
    <div
      className={cn(
        "flex flex-col items-start gap-075 rounded-large border border-dashed border-default px-200 py-300",
        className,
      )}
    >
      {mark ? <div className="pb-050">{mark}</div> : null}
      {text}
    </div>
  );
}
