import type { ComponentProps, ReactNode } from "react";
import { Button } from "../components/button";
import { Timeline } from "../components/timeline";
import { cn } from "../lib/cn";
import { Text } from "../primitives/text";

/** A host-owned command. Its promise, errors and authorization stay with the host. */
export type ReviewThreadAction = {
  label: string;
  accessibleLabel?: string | undefined;
  onSelect: () => void;
  disabled?: boolean | undefined;
  pending?: boolean | undefined;
};

/** One comment or status event, ordered and paged by the host. */
export type ReviewThreadEntry = {
  id: string;
  author: ReactNode;
  /** ISO date or instant; Timeline formats it using the reader's Ledger locale. */
  dateTime?: string | undefined;
  /** Parent-comment context or a status-event description. */
  meta?: ReactNode;
  /** Usually Prose. Ledger does not interpret or sanitize arbitrary HTML. */
  body: ReactNode;
  /** Omit when this entry cannot be replied to. */
  reply?: ReviewThreadAction | undefined;
};

export type ReviewThreadProps = Omit<ComponentProps<"div">, "children"> & {
  /** Accessible name of the message timeline. */
  historyLabel: string;
  /** Localized current state, such as "Open" or "Resolved". */
  status: ReactNode;
  /** Resolve or reopen command; omitted for readers without that permission. */
  statusAction?: ReviewThreadAction | undefined;
  /** Immutable quoted source context, supplied and validated by the application. */
  context?: ReactNode;
  /** Controlled Composer, including its own pending, failure and retry behavior. */
  composer?: ReactNode;
  /** The selected parent comment; changing it never changes the composer's draft. */
  replyTarget?: { label: ReactNode; cancel: ReviewThreadAction } | undefined;
  /** Comment and event entries in display order. */
  messages: readonly ReviewThreadEntry[];
  /** Host-owned empty state, shown instead of the timeline when no entries exist. */
  empty?: ReactNode;
  /** Pagination or other history navigation; does not alter the composer. */
  footer?: ReactNode;
};

/** A discussion's reusable presentation; identity, writes, permissions and drafts remain controlled. */
export function ReviewThread({
  historyLabel,
  status,
  statusAction,
  context,
  composer,
  replyTarget,
  messages,
  empty,
  footer,
  className,
  ...props
}: ReviewThreadProps) {
  return (
    <div
      {...props}
      className={cn("flex min-w-0 flex-col gap-200", className)}
      data-slot="review-thread"
    >
      {context}
      <div className="flex flex-wrap items-center gap-100">
        <Text weight="medium" role="status">
          {status}
        </Text>
        {statusAction && <ThreadAction action={statusAction} variant="secondary" />}
      </div>
      {composer && (
        <div className="flex min-w-0 flex-col gap-100">
          {replyTarget && (
            <div className="flex flex-wrap items-center gap-100" aria-live="polite">
              <Text size="small">{replyTarget.label}</Text>
              <ThreadAction action={replyTarget.cancel} />
            </div>
          )}
          {composer}
        </div>
      )}
      {messages.length || !empty ? (
        <Timeline label={historyLabel} wrap>
          {messages.map((message) => (
            <Timeline.Item
              key={message.id}
              title={message.author}
              dateTime={message.dateTime}
              meta={message.meta}
            >
              <span className="flex min-w-0 flex-col items-start gap-100">
                {message.body}
                {message.reply && <ThreadAction action={message.reply} />}
              </span>
            </Timeline.Item>
          ))}
        </Timeline>
      ) : (
        empty
      )}
      {footer}
    </div>
  );
}

function ThreadAction({
  action,
  variant = "subtle",
}: {
  action: ReviewThreadAction;
  variant?: "subtle" | "secondary" | undefined;
}) {
  return (
    <Button
      size="small"
      variant={variant}
      aria-label={action.accessibleLabel}
      isLoading={action.pending}
      disabled={action.disabled}
      onClick={action.onSelect}
    >
      {action.label}
    </Button>
  );
}
