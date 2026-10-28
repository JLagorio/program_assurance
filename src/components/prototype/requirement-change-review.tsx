import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useRouterState } from "@tanstack/react-router";
import {
  Button,
  Diff,
  Inline,
  Stack,
  Text,
  type DiffAnnotation,
  type DiffSelection,
} from "@ledger/design-system";
import { useWorkspace } from "@/components/app/workspace";
import { StatusBadge } from "@/components/app/status";
import {
  useAssuranceReviewThreads,
  type ReviewTarget,
  type ReviewThread,
} from "@/lib/assurance-review";
import { reviewStatuses } from "@/lib/status";
import {
  AssuranceReviewCreateDialog,
  AssuranceReviewPaging,
  AssuranceReviewThreadDialog,
} from "./assurance-review";
import { QueryState } from "./work-common";

type ChangeTarget = Extract<ReviewTarget, { kind: "requirement-change" }>;
/** Match the Diff and server anchor contract, including an empty source having no lines. */
function sourceLines(text: string) {
  return text === ""
    ? []
    : text
        .replace(/\r\n|\r/g, "\n")
        .replace(/\n$/, "")
        .split("\n");
}
/** The edit event owns the historical text; annotations never follow later requirement edits. */
export function RequirementChangeReview({
  recordId,
  editId,
  field,
  label,
  before,
  after,
  summary,
}: {
  recordId: string;
  editId: string;
  field: ChangeTarget["field"];
  label: string;
  before: string;
  after: string;
  /** Scalar fields keep their readable value comparison instead of a paragraph Diff. */
  summary?: ReactNode;
}) {
  const workspace = useWorkspace();
  const [page, setPage] = useState(0);
  const [selection, setSelection] = useState<DiffSelection | null>(null);
  const [creating, setCreating] = useState<ChangeTarget | null>(null);
  const [threadId, setThreadId] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const search = useRouterState({
    select: (state) => state.location.search as Record<string, unknown>,
  });
  const deepLink = search["edit"] === editId && search["field"] === field;
  const side = search["side"] === "before" ? "before" : "after";
  const start = Number(search["startLine"] ?? 1);
  const end = Number(search["endLine"] ?? start);
  const threads = useAssuranceReviewThreads({
    targetScope: { kind: "requirement-change", recordId, editId, field },
    page,
  });
  const linkedSelection = useMemo<DiffSelection | null>(() => {
    if (!deepLink) return null;
    const lines = sourceLines(side === "before" ? before : after);
    if (
      !Number.isInteger(start) ||
      !Number.isInteger(end) ||
      start < 1 ||
      end < start ||
      end > lines.length
    )
      return null;
    return { side, startLine: start, endLine: end, text: lines.slice(start - 1, end).join("\n") };
  }, [deepLink, side, start, end, before, after]);
  useEffect(() => {
    // A new address must never retain a highlight from a different or invalid source range.
    setSelection(linkedSelection);
  }, [linkedSelection, deepLink, side, start, end]);
  useEffect(() => {
    if (!deepLink || selection !== linkedSelection) return;
    // Selection expands folded Diff rows on the next render. Scroll the actual visible line,
    // including the stacked side-by-side view, rather than centering the entire long comparison.
    const frame = requestAnimationFrame(() => {
      const root = ref.current;
      if (!root || root.closest("[hidden]")) return;
      const selected = Array.from(
        root.querySelectorAll<HTMLElement>('[data-selected="true"]'),
      ).find((node) => node.getClientRects().length > 0);
      (selected ?? root).scrollIntoView({ block: "center", inline: "nearest" });
      (selected?.closest<HTMLElement>('[data-slot="diff-change"]') ?? root).focus({
        preventScroll: true,
      });
    });
    return () => cancelAnimationFrame(frame);
  }, [deepLink, side, start, end, selection, linkedSelection]);
  const begin = (next: DiffSelection) => {
    setSelection(next);
    setCreating({
      kind: "requirement-change",
      recordId,
      editId,
      field,
      side: next.side,
      startLine: next.startLine,
      endLine: next.endLine,
    });
  };
  const open = useCallback(
    (thread: ReviewThread) => {
      const target = thread.target;
      if (target.kind === "requirement-change" && target.startLine && target.endLine) {
        const text = sourceLines(target.side === "before" ? before : after);
        setSelection({
          side: target.side,
          startLine: target.startLine,
          endLine: target.endLine,
          text: text.slice(target.startLine - 1, target.endLine).join("\n"),
        });
      }
      setThreadId(thread.id);
    },
    [before, after],
  );
  const discussion = useCallback(
    (thread: ReviewThread) => (
      <Inline key={thread.id} space="space.100" shouldWrap>
        <StatusBadge statuses={reviewStatuses} value={thread.status} />
        <Text>{thread.subject}</Text>
        {summary !== undefined && thread.target.kind === "requirement-change" && (
          <Text size="small" color="color.text.subtle">
            {thread.target.side === "before" ? "Before this edit" : "After this edit"}
          </Text>
        )}
        <Button
          size="small"
          variant="subtle"
          aria-label={`Open discussion: ${thread.subject}`}
          onClick={() => open(thread)}
        >
          Open discussion
        </Button>
      </Inline>
    ),
    [open, summary],
  );
  const annotations = useMemo<DiffAnnotation[]>(
    () =>
      (threads.data?.rows ?? []).flatMap((thread) => {
        const target = thread.target;
        if (target.kind !== "requirement-change" || !target.startLine || !target.endLine) return [];
        return [
          {
            id: thread.id,
            side: target.side,
            startLine: target.startLine,
            endLine: target.endLine,
            content: discussion(thread),
          },
        ];
      }),
    [threads.data, discussion],
  );
  const scalarSide = after !== "" ? "after" : "before";
  const scalarLines = sourceLines(scalarSide === "after" ? after : before);
  return (
    <Stack space="space.150">
      {summary !== undefined ? (
        <Stack
          ref={ref}
          tabIndex={-1}
          role="group"
          aria-label={`${label}, before and after this edit`}
          space="space.100"
        >
          {summary}
          {workspace.role !== "viewer" && scalarLines.length > 0 && (
            <Inline>
              <Button
                size="small"
                variant="subtle"
                aria-label={`Discuss ${label.toLowerCase()} change`}
                onClick={() =>
                  begin({ side: scalarSide, startLine: 1, endLine: 1, text: scalarLines[0]! })
                }
              >
                Discuss change
              </Button>
            </Inline>
          )}
          {(threads.data?.rows ?? []).map(discussion)}
        </Stack>
      ) : (
        <Diff
          ref={ref}
          tabIndex={-1}
          controls
          lineNumbers
          before={before}
          after={after}
          beforeLabel="Before this edit"
          afterLabel="After this edit"
          label={`${label}, before and after this edit`}
          selection={selection}
          annotations={annotations}
          onSelectLines={workspace.role === "viewer" ? undefined : begin}
        />
      )}
      <QueryState queries={[threads]}>
        {!!threads.data?.count && (
          <>
            <Text size="small">
              {threads.data.count} discussions on this edit
              {summary === undefined ? " · shown at their original lines" : ""}
            </Text>
            <AssuranceReviewPaging page={page} count={threads.data.count} onPage={setPage} />
          </>
        )}
      </QueryState>
      {creating && (
        <AssuranceReviewCreateDialog
          target={creating}
          selectedText={selection?.text}
          onClose={() => setCreating(null)}
          onCreated={(id) => {
            setCreating(null);
            setThreadId(id);
            setPage(0);
          }}
        />
      )}
      {threadId && (
        <AssuranceReviewThreadDialog threadId={threadId} onClose={() => setThreadId(null)} />
      )}
    </Stack>
  );
}
