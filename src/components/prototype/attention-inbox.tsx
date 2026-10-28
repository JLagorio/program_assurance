import { useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  Alert,
  AlertDescription,
  Badge,
  Button,
  DateTime,
  Field,
  FieldLabel,
  Inline,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Stack,
  Text,
  TextLink,
  defineColumns,
  useDataTable,
} from "@ledger/design-system";
import { useWorkspace } from "@/components/app/workspace";
import { database, requireIdentity } from "@/lib/database";
import {
  acknowledgeAttention,
  AttentionConflict,
  createAttentionIntent,
  type AttentionIntent,
  attentionHref,
  readAttention,
  type AttentionFilter,
  type AttentionItem,
} from "@/lib/attention";
import { AssuranceReviewThreadDialog } from "./assurance-review";
import { ProductCollection } from "./product-collection";

type AttentionRow = AttentionItem & { id: string };
type AttentionAttempt = { intent: AttentionIntent; item: AttentionItem; undo: boolean };
export function AttentionInbox() {
  const workspace = useWorkspace();
  const cache = useQueryClient();
  const [filter, setFilter] = useState<AttentionFilter>("open");
  const [page, setPage] = useState(0);
  const [pending, setPending] = useState(false);
  const activeAttempt = useRef<AttentionAttempt | null>(null);
  const [failure, setFailure] = useState<{ message: string; conflict: boolean }>();
  const [retry, setRetry] = useState<AttentionAttempt | null>(null);
  const [last, setLast] = useState<{
    item: AttentionItem;
    previous: AttentionItem["state"];
  } | null>(null);
  const [thread, setThread] = useState<string | null>(null);
  const key = ["attention", workspace.tenantId, workspace.userId];
  const context = async () => ({ ...workspace, token: await requireIdentity(workspace) });
  const query = useQuery({
    queryKey: [...key, filter, page],
    queryFn: async () => readAttention(database(), await context(), filter, page),
    refetchInterval: 30000,
  });
  async function submit(attempt: AttentionAttempt) {
    if (activeAttempt.current) return;
    activeAttempt.current = attempt;
    setPending(true);
    setFailure(undefined);
    setRetry(null);
    try {
      const result = await acknowledgeAttention(database(), await context(), attempt.intent);
      if (attempt.undo) setLast(null);
      else if (result.changed) {
        setLast({
          item: { ...attempt.item, state: result.state, ack_version: result.version },
          previous: result.previousState,
        });
      }
      await cache.invalidateQueries({ queryKey: key });
    } catch (error) {
      const conflict = error instanceof AttentionConflict;
      setFailure({
        message: error instanceof Error ? error.message : "The acknowledgment was not saved.",
        conflict,
      });
      // A failed response may already have committed. Never allocate a replacement request ID.
      setRetry(conflict ? null : attempt);
    } finally {
      activeAttempt.current = null;
      setPending(false);
    }
  }
  function act(item: AttentionItem, state: "seen" | "done" | null, undo = false, observe = false) {
    if (activeAttempt.current || retry || failure) return;
    if (observe && item.state !== null) return;
    void submit({
      intent: createAttentionIntent(workspace, item, state, observe ? "observe" : "set-state"),
      item,
      undo,
    });
  }
  async function reload() {
    if (activeAttempt.current) return;
    setPending(true);
    try {
      await query.refetch({ throwOnError: true });
      setFailure(undefined);
      setRetry(null);
      setLast(null);
    } catch (error) {
      setFailure({
        message: error instanceof Error ? error.message : "Attention could not be reloaded.",
        conflict: true,
      });
    } finally {
      setPending(false);
    }
  }
  const actionBlocked = pending || !!failure || !!retry;
  const rows = useMemo(
    () => query.data?.rows.map((item) => ({ ...item, id: item.item_key })) ?? [],
    [query.data],
  );
  const columns = defineColumns<AttentionRow>((c) => [
    c.text("title", {
      header: "Needs attention",
      hideable: false,
      cell: (row) =>
        row.kind === "review" ? (
          <Button
            variant="subtle"
            onClick={() => {
              setThread(row.item_key.slice("review:".length));
              act(row, "seen", false, true);
            }}
          >
            {row.title}
          </Button>
        ) : (
          <TextLink
            render={
              <Link
                to={attentionHref(row) as never}
                onClick={() => act(row, "seen", false, true)}
              />
            }
          >
            {row.title}
          </TextLink>
        ),
    }),
    c.text("reason", { header: "Reason" }),
    c.text("state", {
      header: "Attention",
      cell: (row) => (
        <Badge tone={row.state === null ? "information" : "neutral"}>
          {row.state === "done" ? "Done" : row.state === "seen" ? "Seen" : "Unread"}
        </Badge>
      ),
    }),
    c.text("updated_at", { header: "Changed", cell: (row) => <DateTime value={row.updated_at} /> }),
    c.actions((row) => [
      {
        label: row.state === "done" ? "Restore" : "Done",
        disabled: actionBlocked,
        onSelect: () => void act(row, row.state === "done" ? null : "done"),
      },
    ]),
  ]);
  const table = useDataTable({
    data: rows,
    columns,
    getRowId: (row) => row.id,
    label: "Attention inbox",
    pageSize: undefined,
  });
  return (
    <Stack>
      <Text color="color.text.subtle">
        Review discussions, changed evidence, mappings needing review and assigned tasks. Done
        acknowledges the version shown here.
      </Text>
      <Field>
        <FieldLabel>Show attention</FieldLabel>
        <Select
          value={filter}
          onValueChange={(value) => {
            setFilter((value ?? "open") as AttentionFilter);
            setPage(0);
          }}
        >
          <SelectTrigger>
            <SelectValue>
              {{ open: "Open", unread: "Unread", done: "Done", all: "All" }[filter]}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="unread">Unread</SelectItem>
            <SelectItem value="done">Done</SelectItem>
            <SelectItem value="all">All</SelectItem>
          </SelectContent>
        </Select>
      </Field>
      {failure && (
        <Alert tone="danger">
          <AlertDescription>{failure.message}</AlertDescription>
          {retry && (
            <Button
              size="small"
              variant="subtle"
              disabled={pending}
              onClick={() => void submit(retry)}
            >
              Retry
            </Button>
          )}
          {failure.conflict && (
            <Button size="small" variant="subtle" disabled={pending} onClick={() => void reload()}>
              Reload attention
            </Button>
          )}
        </Alert>
      )}
      {last && (
        <Alert tone="information">
          <AlertDescription>Attention updated for {last.item.title}.</AlertDescription>
          <Button
            size="small"
            variant="subtle"
            disabled={actionBlocked}
            onClick={() => act(last.item, last.previous, true)}
          >
            Undo
          </Button>
        </Alert>
      )}
      <ProductCollection
        table={table}
        queries={[query]}
        search={false}
        sort={false}
        keepQuestion={false}
        empty={{
          title: "Nothing needs attention",
          description: "New review work and changed supporting records will appear here.",
        }}
      />
      <Inline spread="space-between" shouldWrap>
        <Text color="color.text.subtle">
          {query.data?.count ?? 0} items · Page {page + 1}
        </Text>
        <Inline>
          <Button
            size="small"
            disabled={page === 0 || query.isFetching}
            onClick={() => setPage(page - 1)}
          >
            Previous
          </Button>
          <Button
            size="small"
            disabled={!query.data || (page + 1) * 25 >= query.data.count || query.isFetching}
            onClick={() => setPage(page + 1)}
          >
            Next
          </Button>
        </Inline>
      </Inline>
      {thread && <AssuranceReviewThreadDialog threadId={thread} onClose={() => setThread(null)} />}
    </Stack>
  );
}
