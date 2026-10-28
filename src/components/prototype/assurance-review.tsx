import { useState, useRef, useSyncExternalStore, type ReactNode } from "react";
import {
  Alert,
  AlertDescription,
  Button,
  Composer,
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Inline,
  Item,
  Prose,
  Related,
  Section,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetBody,
  Stack,
  Text,
  ReviewThread,
} from "@ledger/design-system";
import { useWorkspace } from "@/components/app/workspace";
import { useDraftGuard } from "@/components/app/use-draft-guard";
import {
  useAssuranceReviewSubmit,
  useAssuranceReviewThread,
  useAssuranceReviewThreads,
  type ReviewTarget,
} from "@/lib/assurance-review";
import { QueryState } from "./work-common";

export function AssuranceReviewPaging({
  page,
  count,
  onPage,
}: {
  page: number;
  count: number;
  onPage: (page: number) => void;
}) {
  if (count <= 25) return null;
  return (
    <Inline space="space.100" shouldWrap>
      <Button size="small" variant="subtle" disabled={page === 0} onClick={() => onPage(page - 1)}>
        Previous
      </Button>
      <Text size="small">
        Page {page + 1} of {Math.ceil(count / 25)}
      </Text>
      <Button
        size="small"
        variant="subtle"
        disabled={(page + 1) * 25 >= count}
        onClick={() => onPage(page + 1)}
      >
        Next
      </Button>
    </Inline>
  );
}

/** Authored review is distinct from the requirement/evidence's canonical decision. */
export function AssuranceReviewPanel({
  target,
  title = "Review discussions",
}: {
  target: ReviewTarget;
  title?: string | undefined;
}) {
  const workspace = useWorkspace();
  const [page, setPage] = useState(0);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const threads = useAssuranceReviewThreads({ target, page });
  const command = useAssuranceReviewSubmit();
  const guard = useDraftGuard({
    dirty: Boolean(draft.trim()),
    onClose: () => {},
    description: "The review comment you were writing will be lost.",
  });
  return (
    <Section title={title}>
      <Stack space="space.200">
        {workspace.role !== "viewer" && (
          <Composer
            label="Start a review discussion"
            submitLabel="Start discussion"
            value={draft}
            onValueChange={setDraft}
            onSubmit={async (body) => {
              if (!guard.start()) return;
              try {
                await command.submit({
                  operation: "create-thread",
                  target,
                  subject: body.split(/\r?\n/)[0]!.slice(0, 240),
                  body,
                });
                setPage(0);
              } finally {
                guard.finish();
              }
            }}
            errorMessage={(error) =>
              `${error instanceof Error ? error.message : "The discussion was not posted."} Retry will not post it twice.`
            }
          />
        )}
        <QueryState queries={[threads]}>
          <Related
            title="Discussions"
            count={threads.data?.count ?? 0}
            layout="list"
            empty="No review discussions yet"
          >
            {threads.data?.rows.map((thread) => (
              <Item
                key={thread.id}
                title={thread.subject}
                meta={thread.status === "resolved" ? "Resolved" : "Open"}
                description={thread.author_name}
                onSelect={() => setThreadId(thread.id)}
              />
            ))}
          </Related>
          <AssuranceReviewPaging page={page} count={threads.data?.count ?? 0} onPage={setPage} />
        </QueryState>
        {threadId && (
          <AssuranceReviewThreadDialog threadId={threadId} onClose={() => setThreadId(null)} />
        )}
        {guard.confirmation}
      </Stack>
    </Section>
  );
}

export function AssuranceReviewThreadDialog({
  threadId,
  onClose,
  presentation = "dialog",
  navigation,
}: {
  threadId: string;
  onClose: () => void;
  presentation?: "dialog" | "inline" | "responsive" | undefined;
  navigation?:
    | {
        previous?: (() => void) | undefined;
        next?: (() => void) | undefined;
        position: number;
        total: number;
      }
    | undefined;
}) {
  const [page, setPage] = useState(0);
  const query = useAssuranceReviewThread(threadId, page);
  const [draft, setDraft] = useState("");
  const [parent, setParent] = useState<{ id: string; author: string } | null>(null);
  const command = useAssuranceReviewSubmit();
  const workspace = useWorkspace();
  const destination = useRef<(() => void) | null>(null);
  const guard = useDraftGuard({
    dirty: Boolean(draft.trim()),
    onClose: () => {
      const action = destination.current;
      destination.current = null;
      (action ?? onClose)();
    },
    description: "The reply you were writing will be lost.",
  });
  const [error, setError] = useState("");
  const thread = query.data?.thread;
  const canWrite = workspace.role !== "viewer";
  return (
    <>
      <AssuranceReviewFrame
        presentation={presentation}
        pending={guard.busy || command.isPending}
        onClose={() => {
          destination.current = null;
          void guard.close();
        }}
        title={thread?.subject ?? "Review discussion"}
      >
        <Stack space="space.200">
          {navigation && (
            <Inline shouldWrap space="space.100">
              <Button
                size="small"
                variant="subtle"
                disabled={!navigation.previous}
                onClick={() => {
                  destination.current = navigation.previous ?? null;
                  void guard.close();
                }}
              >
                Previous discussion
              </Button>
              <Text size="small">
                {navigation.position} of {navigation.total}
              </Text>
              <Button
                size="small"
                variant="subtle"
                disabled={!navigation.next}
                onClick={() => {
                  destination.current = navigation.next ?? null;
                  void guard.close();
                }}
              >
                Next discussion
              </Button>
            </Inline>
          )}
          {error && (
            <Alert role="alert" tone="danger">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <QueryState queries={[query]}>
            <ReviewThread
              historyLabel="Discussion history"
              context={thread?.target_context && <ReviewContext value={thread.target_context} />}
              status={thread ? (thread.status === "resolved" ? "Resolved" : "Open") : null}
              statusAction={
                thread && canWrite
                  ? {
                      label: thread.status === "open" ? "Resolve discussion" : "Reopen discussion",
                      pending: command.isPending,
                      onSelect: async () => {
                        if (!guard.start()) return;
                        setError("");
                        try {
                          await command.submit({
                            operation: "set-status",
                            threadId,
                            expectedRevision: thread.revision,
                            status: thread.status === "open" ? "resolved" : "open",
                          });
                          setPage(0);
                        } catch (cause) {
                          setError(
                            cause instanceof Error ? cause.message : "The status was not changed.",
                          );
                        } finally {
                          guard.finish();
                        }
                      },
                    }
                  : undefined
              }
              replyTarget={
                parent
                  ? {
                      label: `Replying to ${parent.author}`,
                      cancel: {
                        label: "Cancel reply target",
                        disabled: guard.busy,
                        onSelect: () => setParent(null),
                      },
                    }
                  : undefined
              }
              composer={
                canWrite ? (
                  <Composer
                    label="Reply to this discussion"
                    disabled={guard.busy}
                    submitLabel="Reply"
                    value={draft}
                    onValueChange={setDraft}
                    onSubmit={async (body) => {
                      if (!guard.start()) return;
                      try {
                        await command.submit({
                          operation: "reply",
                          threadId,
                          ...(parent ? { parentId: parent.id } : {}),
                          body,
                        });
                        setParent(null);
                        setPage(0);
                      } finally {
                        guard.finish();
                      }
                    }}
                    errorMessage={(cause) =>
                      `${cause instanceof Error ? cause.message : "The reply was not posted."} Retry will not post it twice.`
                    }
                  />
                ) : undefined
              }
              messages={(query.data?.messages ?? []).map((message) => ({
                id: message.id,
                author: message.author_name,
                dateTime: message.created_at,
                meta:
                  message.kind !== "comment"
                    ? message.kind === "resolved"
                      ? "Resolved"
                      : "Reopened"
                    : message.parent_id
                      ? "Reply to an earlier comment"
                      : undefined,
                body: <Prose>{message.body}</Prose>,
                reply:
                  canWrite && message.kind === "comment"
                    ? {
                        label: "Reply",
                        accessibleLabel: `Reply to ${message.author_name}`,
                        disabled: guard.busy,
                        onSelect: () => setParent({ id: message.id, author: message.author_name }),
                      }
                    : undefined,
              }))}
              footer={
                <AssuranceReviewPaging
                  page={page}
                  count={query.data?.count ?? 0}
                  onPage={setPage}
                />
              }
            />
          </QueryState>
        </Stack>
      </AssuranceReviewFrame>
      {guard.confirmation}
    </>
  );
}

function ReviewContext({ value }: { value: Record<string, unknown> }) {
  const passage =
    typeof value["selectedText"] === "string"
      ? value["selectedText"]
      : typeof value["passage"] === "string"
        ? value["passage"]
        : typeof value["value"] === "string"
          ? value["value"]
          : typeof value["statement"] === "string"
            ? value["statement"]
            : "";
  return passage ? <Prose label="Captured source context">{passage}</Prose> : null;
}
function AssuranceReviewFrame({
  presentation,
  pending,
  onClose,
  title,
  children,
}: {
  presentation: "dialog" | "inline" | "responsive";
  pending: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  const narrow = useSyncExternalStore(subscribeReviewWidth, reviewWidthSnapshot, () => false);
  if (presentation === "responsive" && narrow)
    return (
      <Sheet
        open
        pending={pending}
        onOpenChange={(open) => {
          if (!open) onClose();
        }}
      >
        <SheetContent side="bottom" initialFocus={false}>
          <SheetHeader>
            <SheetTitle>{title}</SheetTitle>
            <SheetDescription>Discussion of the selected source passage.</SheetDescription>
          </SheetHeader>
          <SheetBody>{children}</SheetBody>
        </SheetContent>
      </Sheet>
    );
  if (presentation === "inline" || presentation === "responsive")
    return (
      <Section
        title={title}
        action={
          <Button size="small" variant="subtle" onClick={onClose}>
            Close discussion
          </Button>
        }
      >
        {children}
      </Section>
    );
  return (
    <Dialog
      open
      pending={pending}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Replies and resolution are review context. They do not approve evidence or change the
            underlying record.
          </DialogDescription>
        </DialogHeader>
        <DialogBody>{children}</DialogBody>
      </DialogContent>
    </Dialog>
  );
}
/** A selection starts a discussion against an exact, server-validated source anchor. */
export function AssuranceReviewCreateDialog({
  target,
  onClose,
  onCreated,
  selectedText,
}: {
  target: ReviewTarget;
  onClose: () => void;
  onCreated?: ((threadId: string) => void) | undefined;
  selectedText?: string | undefined;
}) {
  const [draft, setDraft] = useState("");
  const command = useAssuranceReviewSubmit();
  const workspace = useWorkspace();
  const guard = useDraftGuard({
    dirty: Boolean(draft.trim()),
    onClose,
    description: "The review comment you were writing will be lost.",
  });
  return (
    <>
      <Dialog
        open
        pending={guard.busy}
        onOpenChange={(open) => {
          if (!open) void guard.close();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {target.kind === "requirement-change"
                ? "Discuss selected change"
                : "Discuss selected passage"}
            </DialogTitle>
            <DialogDescription>
              This discussion keeps its source location and captured context.
            </DialogDescription>
          </DialogHeader>
          <DialogBody>
            <Stack space="space.150">
              {selectedText && <Prose label="Selected source">{selectedText}</Prose>}
              {target.kind === "passage" && target.passage && (
                <Prose label="Selected passage">{target.passage}</Prose>
              )}
              {workspace.role !== "viewer" && (
                <Composer
                  label="Start a review discussion"
                  submitLabel="Start discussion"
                  value={draft}
                  onValueChange={setDraft}
                  onSubmit={async (body) => {
                    if (!guard.start()) return;
                    try {
                      const result = await command.submit({
                        operation: "create-thread",
                        target,
                        subject: body.split(/\r?\n/)[0]!.slice(0, 240),
                        body,
                      });
                      if ("threadId" in result) onCreated?.(result.threadId);
                      guard.complete();
                    } finally {
                      guard.finish();
                    }
                  }}
                  errorMessage={(error) =>
                    error instanceof Error ? error.message : "The discussion was not posted."
                  }
                />
              )}
            </Stack>
          </DialogBody>
        </DialogContent>
      </Dialog>
      {guard.confirmation}
    </>
  );
}

const reviewWidthSnapshot = () => window.matchMedia("(max-width: 767px)").matches;
function subscribeReviewWidth(listener: () => void) {
  const media = window.matchMedia("(max-width: 767px)");
  media.addEventListener("change", listener);
  return () => media.removeEventListener("change", listener);
}
