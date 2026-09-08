import type { ReactNode } from "react";

import { Checkbox, Item, type ItemProps } from "../components";
import { cn } from "../lib/cn";
import { Box } from "../primitives";

export type TaskRowProps = Pick<
  ItemProps,
  "meta" | "actions" | "link" | "onSelect" | "className"
> & {
  /** The action to complete. Plain text also provides the default checkbox name. */
  title: string;
  /** Caller-owned completion, independent of the product's status vocabulary. */
  completed?: boolean | undefined;
  /** Requests completion or reopening. Omit for a row without a completion control. */
  onCompletedChange?: ((completed: boolean) => void) | undefined;
  /** Localized accessible name of the current completion action. Defaults to Complete/Reopen plus the title. */
  completionLabel?: string | undefined;
  /** Localized completed-state text for assistive technology when no checkbox is rendered. */
  completedLabel?: string | undefined;
  /** Disables only the completion control, for example while the caller persists a change. */
  completionDisabled?: boolean | undefined;
  /** Rendered owner content, such as Person or Avatar; no person data model is imposed. */
  assignee?: ReactNode;
  /** Rendered due-date content. The caller decides wording, formatting and overdue styling. */
  due?: ReactNode;
  /** Machine-readable timestamp for due; without it, due is plain content rather than a time element. */
  dueDateTime?: string | undefined;
  /** Caller-rendered status, such as a Badge. No waiting/blocked state taxonomy is built in. */
  status?: ReactNode;
};

/** A completion row with independent navigation/actions and caller-owned status content. */
export function TaskRow({
  title,
  completed = false,
  onCompletedChange,
  completionLabel,
  completedLabel = "Completed",
  completionDisabled = false,
  assignee,
  due,
  dueDateTime,
  status,
  ...itemProps
}: TaskRowProps) {
  return (
    <Item
      {...itemProps}
      leading={
        onCompletedChange ? (
          <Checkbox
            checked={completed}
            disabled={completionDisabled}
            onCheckedChange={onCompletedChange}
            aria-label={completionLabel ?? `${completed ? "Reopen" : "Complete"}: ${title}`}
            className="z-10"
          />
        ) : undefined
      }
      title={
        <Box as="span" className={cn(completed && "line-through text-subtle")}>
          {title}
          {completed && !onCompletedChange ? (
            <Box as="span" className="sr-only">
              {" "}
              — {completedLabel}
            </Box>
          ) : null}
        </Box>
      }
      trailing={
        assignee != null || due != null || status != null ? (
          <Box as="span" className="flex items-center gap-150">
            {assignee}
            {due != null ? (
              <Box as="span" className="shrink-0 font-body-small tabular-nums">
                {dueDateTime ? <time dateTime={dueDateTime}>{due}</time> : due}
              </Box>
            ) : null}
            {status}
          </Box>
        ) : undefined
      }
    />
  );
}
