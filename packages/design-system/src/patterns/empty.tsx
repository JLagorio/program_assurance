import type { ReactNode } from "react";

/* Reference material. Carbon's empty state is an optional image, a title as a positive statement,
   a body that says what to do, a primary action and a secondary link, left-aligned as a block,
   replacing the element that would have shown; Atlassian's is the same with three actions. This
   is that without the image: a dashed frame, so an empty region is visibly a region and not
   content the eye skips. */

export type EmptyProps = {
  /** What would be here, as a statement: "No findings", "No controls match". Positive where it can be: "Start by linking evidence". */
  title: string;
  /** One line: why it is empty, and what fills it. */
  description?: string | undefined;
  /** The action that fills it: one Button, secondary unless it is the page's one thing to do. */
  action?: ReactNode;
  /** A second way, as a TextLink beside the action: "Import from a file", "How evidence works". */
  secondary?: ReactNode;
};

/** Nothing here yet: a dashed frame with a title, one line of why, and the action that fills it. */
export function Empty({ title, description, action, secondary }: EmptyProps) {
  return (
    <div className="flex flex-col items-start gap-075 rounded-large border border-dashed border-default px-200 py-300">
      <p className="font-body font-medium text-default">{title}</p>
      {description ? <p className="font-body-small text-subtle">{description}</p> : null}
      {action || secondary ? (
        <div className="flex flex-wrap items-center gap-150 pt-075">
          {action}
          {secondary}
        </div>
      ) : null}
    </div>
  );
}
