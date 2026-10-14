import { useEffect, useMemo, useRef, type ComponentPropsWithRef } from "react";

import { Absent } from "../components/typography";
import { Alert, AlertAction, AlertDescription, AlertTitle } from "../components/alert";
import { Button } from "../components/button";
import { Diff } from "../components/diff";
import { cn } from "../lib/cn";
import { Stack, Text } from "../primitives";
import { DataTable, defineColumns, useDataTable } from "./data-table";
import { Toolbar } from "./toolbar";

/** One proposed field change. Its stable id belongs to the proposal, not its visible row position. */
export type ReviewChange = {
  id: string;
  record: string;
  field: string;
  before: string;
  after: string;
  /** An actionable validation or concurrency issue. The host decides whether it blocks applying. */
  issue?: string | undefined;
};

export type ChangeReviewProps = Omit<ComponentPropsWithRef<"div">, "children"> & {
  /** The complete proposed set, in the order the reader should review it. Never a server page. */
  changes: readonly ReviewChange[];
  /** The table's accessible name. */
  label?: string | undefined;
  /** Keeps the review available and marks the region busy while its host applies or refreshes. */
  pending?: boolean | undefined;
  /** A failed attempt keeps every proposed change visible below this message. */
  error?: string | undefined;
  onRetry?: (() => void) | undefined;
  /** Reports a change when its full comparison is opened, including by keyboard or touch. */
  onInspect?: ((id: string) => void) | undefined;
};

function ChangeComparison({
  change,
  onInspect,
}: {
  change: ReviewChange;
  onInspect: ChangeReviewProps["onInspect"];
}) {
  const notify = useRef(onInspect);
  notify.current = onInspect;
  const announced = useRef<string | null>(null);
  useEffect(() => {
    if (announced.current === change.id) return;
    announced.current = change.id;
    notify.current?.(change.id);
  }, [change.id]);
  return (
    <Stack space="space.100">
      {change.issue ? (
        <Text size="small" color="color.text.danger">
          {change.issue}
        </Text>
      ) : null}
      <Diff
        before={change.before}
        after={change.after}
        beforeLabel="Recorded"
        afterLabel="Proposed"
        label={`${change.record} · ${change.field}`}
        layout="side-by-side"
      />
    </Stack>
  );
}

/**
 * A readonly, searchable review of proposed changes. Its host owns validation, persistence and
 * the Apply/Cancel decision. Each row discloses a complete text comparison without another overlay.
 */
export function ChangeReview({
  changes,
  label = "Proposed changes",
  pending = false,
  error,
  onRetry,
  onInspect,
  className,
  ...props
}: ChangeReviewProps) {
  const hasIssues = changes.some((change) => Boolean(change.issue));
  const columns = useMemo(
    () =>
      defineColumns<ReviewChange>((c) => [
        c.text("record", {
          header: "Record",
          priority: 0,
          minWidth: 160,
          sortable: false,
        }),
        c.text("field", { header: "Field", priority: 1, width: 150, sortable: false }),
        c.text("before", {
          header: "Recorded",
          priority: 3,
          minWidth: 180,
          sortable: false,
          cell: (change) => change.before || <Absent label="Empty value" />,
        }),
        c.text("after", {
          header: "Proposed",
          priority: 2,
          minWidth: 180,
          sortable: false,
          cell: (change) => change.after || <Absent label="Empty value" />,
        }),
        ...(hasIssues
          ? [
              c.text("issue", {
                header: "Issue",
                priority: 2,
                minWidth: 200,
                wrap: true,
                sortable: false,
                cell: (change) =>
                  change.issue ? (
                    <Text size="small" color="color.text.danger">
                      {change.issue}
                    </Text>
                  ) : (
                    <Absent label="No issue" />
                  ),
              }),
            ]
          : []),
      ]),
    [hasIssues],
  );
  const table = useDataTable({
    columns,
    data: changes,
    getRowId: (change) => change.id,
    rowLabel: (change) => `${change.record} · ${change.field}`,
    label,
    pageSize: 25,
    pageSizes: [25],
    pinnable: false,
    hideable: false,
    detail: (change) => <ChangeComparison change={change} onInspect={onInspect} />,
  });
  return (
    <div
      {...props}
      data-slot="change-review"
      aria-busy={pending || props["aria-busy"] || undefined}
      className={cn("min-w-0", className)}
    >
      <Stack space="space.150">
        {error ? (
          <Alert tone="danger">
            <AlertTitle>The changes could not be applied</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
            {onRetry ? (
              <AlertAction>
                <Button size="small" onClick={onRetry} isLoading={pending}>
                  Retry
                </Button>
              </AlertAction>
            ) : null}
          </Alert>
        ) : null}
        <DataTable
          table={table}
          responsive
          noun={{ one: "change", other: "changes" }}
          state={pending ? "refreshing" : "ready"}
          toolbar={
            <Toolbar
              search={String(table.state.globalFilter ?? "")}
              onSearch={(value) => table.setGlobalFilter(value)}
              placeholder="Find a change"
            />
          }
          empty={{
            illustration: "records",
            title: "No proposed changes",
            description: "Changes will appear here when a value differs from its recorded value.",
            size: "compact",
          }}
        />
      </Stack>
    </div>
  );
}
