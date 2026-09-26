import { MoreHorizontal } from "lucide-react";
import { useCallback, type ReactNode } from "react";
import {
  DataTable,
  Toolbar,
  IconButton,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  Stack,
  useTableQuery,
  type DataTableInstance,
  type DataTableProps,
} from "@ledger/design-system";
import { QueryState, type QueryStatus } from "./work-common";

/** The product collection contract: domain adapters own columns and relationships;
 * this composition owns loading recovery, the toolbar and the table's empty region. */
export type ProductCollectionProps<T extends { id: string }> = Omit<
  DataTableProps<T>,
  "toolbar" | "state" | "error" | "responsive"
> & {
  /** The queries the rows come from. While one loads with no rows yet, the toolbar stays and the
   * rows are skeletons; a failed refresh keeps the rows under one alert; a failure with no rows is
   * the alert and Retry alone. */
  queries?: QueryStatus[];
  searchLabel?: string | undefined;
  /** Saved views, as a DataTable.Presets menu. Leave it out when the collection has none. */
  views?: ReactNode;
  filters?: ReactNode;
  action?: ReactNode;
  commands?: { label: string; onSelect: () => void; disabled?: boolean }[] | undefined;
  /** The sort as a toolbar menu, for rows whose columns fold into More fields. On unless the
   * collection's order is its meaning. */
  sort?: boolean | undefined;
  /** Keep the reader's question (search, sort, filters, page) for this tab's session, under the
   * table's `view` or this key, so it survives opening a record and coming back. Off (`false`) for
   * a table in a dialog, a sheet or a picker, whose question ends with the task. */
  keepQuestion?: boolean | string | undefined;
};

/** A query is loading while it fetches with nothing to show. A disabled query (TanStack keeps it
 * pending with an idle fetch status, as when it waits on another that failed) is not loading. */
function isLoading(query: QueryStatus) {
  if (!query.isPending || query.data !== undefined) return false;
  const { fetchStatus } = query as QueryStatus & { fetchStatus?: unknown };
  return fetchStatus !== "idle";
}

/** Keeps the question in session storage; a component, so the caller can leave it out. */
function KeepQuestion<T extends { id: string }>({
  table,
  storageKey,
}: {
  table: DataTableInstance<T>;
  storageKey?: string;
}) {
  useTableQuery(table, { storage: "session", ...(storageKey ? { key: storageKey } : {}) });
  return null;
}

export function ProductCollection<T extends { id: string }>({
  queries = [],
  searchLabel = "Search records",
  views,
  filters,
  action,
  commands,
  empty,
  sort = true,
  keepQuestion = true,
  ...props
}: ProductCollectionProps<T>) {
  const { table } = props;
  // A stable handler, so the toolbar's measuring effect does not restart on every render.
  const onSearch = useCallback((value: string) => table.setGlobalFilter(value), [table]);
  const failed = queries.filter((query) => query.isError);
  const failedWithoutRows = failed.some((query) => query.data === undefined);
  const loading = !failedWithoutRows && queries.some(isLoading);
  // A failure with nothing to show: the alert and Retry, no empty table under it.
  if (failedWithoutRows) return <QueryState queries={queries} />;
  const collection = (
    <DataTable
      {...props}
      responsive
      state={loading ? "loading" : "ready"}
      empty={{
        ...empty,
        illustration: empty?.illustration ?? "records",
        title: empty?.title ?? "No records yet",
        description:
          empty?.description ??
          (empty?.action || action
            ? "Create a record to start this collection."
            : "Records will appear here when available."),
        action: empty?.action ?? action,
      }}
      toolbar={
        <Toolbar
          search={String(table.state.globalFilter ?? "")}
          onSearch={onSearch}
          placeholder={searchLabel}
          views={views}
          filters={filters}
          actions={action}
        >
          {sort && <DataTable.Sort table={table} />}
          <DataTable.Columns table={table} />
          <DataTable.Settings table={table} />
          {!!commands?.length && (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <IconButton
                    label="Collection actions"
                    icon={<MoreHorizontal />}
                    size="small"
                    variant="secondary"
                  />
                }
              />
              <DropdownMenuContent align="end">
                {commands.map((command) => (
                  <DropdownMenuItem
                    key={command.label}
                    disabled={command.disabled}
                    onClick={command.onSelect}
                  >
                    {command.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </Toolbar>
      }
    />
  );
  const keeper = keepQuestion !== false && (
    <KeepQuestion
      table={table}
      {...(typeof keepQuestion === "string" ? { storageKey: keepQuestion } : {})}
    />
  );
  // A failed refresh keeps the rows the reader has, under one alert with Retry. The table keeps its
  // place among the siblings, so an alert that comes and goes never remounts it; the Stack spaces
  // the alert from the toolbar wherever the collection sits (a tab panel is not a stack).
  return (
    <Stack space="space.150">
      {failed.length > 0 && <QueryState queries={failed} />}
      {keeper}
      {collection}
    </Stack>
  );
}
