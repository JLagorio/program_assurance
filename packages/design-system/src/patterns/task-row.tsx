import { Checkbox, Item, type ItemProps } from "../components";
import { type ComponentProps, type ReactNode } from "react";
import { cn } from "../lib/cn";
import { useLedgerLocale } from "../lib/locale";
import { Box, VisuallyHidden } from "../primitives";

/** A TaskRow takes its row's native props and `ref` too. `id` is left out, since an Item's `id` is a record's id, not the element's. */
export type TaskRowProps = Omit<ComponentProps<"li">, "id" | "title" | "onSelect" | "children"> &
  Pick<ItemProps, "meta" | "actions" | "link" | "onSelect" | "className"> & {
    /** The action to complete. Plain text also provides the default checkbox name. */
    title: string;
    /** Caller-owned completion, independent of the product's status vocabulary. */
    completed?: boolean | undefined;
    /** Requests completion or reopening. Omit for a row without a completion control. */
    onCompletedChange?: ((completed: boolean) => void) | undefined;
    /** The completion checkbox's accessible name, the title by default. It names the task, not the next action, so it stays the same as the row is completed and reopened; the checked state says which. */
    completionLabel?: string | undefined;
    /** What a screen reader hears for a completed row without a checkbox, so the strike-through is not the only cue: a sentence with `{title}` where the title goes, the locale's "{title}, completed" by default. Words without `{title}` ("Done") are said after the title. */
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
  completedLabel,
  completionDisabled = false,
  assignee,
  due,
  dueDateTime,
  status,
  ...itemProps
}: TaskRowProps) {
  const { t } = useLedgerLocale();
  // A completed row without a checkbox says so in words: the drawn title, then the rest of the
  // locale's sentence ("{title}, completed"), spoken and not drawn.
  const sentence =
    completedLabel === undefined
      ? t("taskRowCompleted")
      : completedLabel.includes("{title}")
        ? completedLabel
        : `{title} — ${completedLabel}`;
  const [before = "", after = ""] = sentence.split("{title}");
  const spokenState = completed && !onCompletedChange;
  return (
    <Item
      {...itemProps}
      leading={
        onCompletedChange ? (
          <Checkbox
            checked={completed}
            disabled={completionDisabled}
            onCheckedChange={onCompletedChange}
            aria-label={completionLabel ?? title}
            className="z-10"
          />
        ) : undefined
      }
      title={
        <Box as="span" className={cn(completed && "line-through text-subtle")}>
          {spokenState && before ? <VisuallyHidden>{before}</VisuallyHidden> : null}
          {title}
          {spokenState && after ? <VisuallyHidden>{after}</VisuallyHidden> : null}
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
