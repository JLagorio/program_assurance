import { Inbox, MoreHorizontal } from "lucide-react";
import {
  Children,
  cloneElement,
  isValidElement,
  useCallback,
  useState,
  type ReactNode,
} from "react";
import {
  Button,
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
  /**
   * A collection of a few rows beside other content: a section of a record body, a preview's
   * collection, one of several collections on a tab. Its empty is one short row beside
   * `empty.icon` (an inbox unsaid) with the small create action, a first load draws three skeleton
   * rows, and the toolbar keeps the search, the views, the filters, the create action and the
   * commands. Sort shows once there are two rows to order, since a narrow frame folds columns
   * into More fields; Columns shows once the reader hides a column from its heading's menu, and
   * stays; Settings is left out. A register, or a tab whose only content is the collection,
   * leaves it off.
   */
  compact?: boolean | undefined;
};

/** A query is loading while it fetches with nothing to show. A disabled query (TanStack keeps it
 * pending with an idle fetch status, as when it waits on another that failed) is not loading. */
function isLoading(query: QueryStatus) {
  if (!query.isPending || query.data !== undefined) return false;
  const { fetchStatus } = query as QueryStatus & { fetchStatus?: unknown };
  return fetchStatus !== "idle";
}

/**
 * The create action at the size of the empty that holds it: the toolbar's small Button becomes
 * medium in a collection's centred first-record empty, as Empty's own action is. Anything else
 * (a split button, a menu) is drawn as given.
 */
function heroSized(action: ReactNode): ReactNode {
  if (!isValidElement<{ size?: unknown }>(action) || action.type !== Button) return action;
  return action.props.size === "small" ? cloneElement(action, { size: "medium" }) : action;
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
  compact = false,
  loadingRows,
  ...props
}: ProductCollectionProps<T>) {
  const { table } = props;
  // A stable handler, so the toolbar's measuring effect does not restart on every render.
  const onSearch = useCallback((value: string) => table.setGlobalFilter(value), [table]);
  // Once a compact collection has offered Columns it keeps it, so bringing the last hidden column
  // back never takes the menu, and focus, from under the reader.
  const [columnsOffered, setColumnsOffered] = useState(false);
  const failed = queries.filter((query) => query.isError);
  const failedWithoutRows = failed.some((query) => query.data === undefined);
  const loading = !failedWithoutRows && queries.some(isLoading);
  // A failure with nothing to show: the alert and Retry, no empty table under it.
  if (failedWithoutRows) return <QueryState queries={queries} />;
  const createAction = empty?.action ?? action;
  // Columns offers only what can be hidden: with nothing to hide it is left out. A compact
  // collection offers it from the moment the reader hides a column from its heading's menu.
  const hideable = table.getAllLeafColumns().filter((column) => column.getCanHide());
  const anyHidden = hideable.some((column) => !column.getIsVisible());
  if (compact && anyHidden && !columnsOffered) setColumnsOffered(true);
  const showColumns = hideable.length > 0 && (!compact || anyHidden || columnsOffered);
  // The sort menu is how a folded column is sorted, so a compact collection keeps it whenever it
  // holds rows to order; one row has no order to choose.
  const showSort = sort && (!compact || table.getCoreRowModel().rows.length > 1);
  // With none of them the toolbar gets no children at all, so it draws no empty More.
  const displayControls = showSort || showColumns || !compact || !!commands?.length;
  const collection = (
    <DataTable
      {...props}
      {...(compact ? { loadingRows: loadingRows ?? 3 } : loadingRows ? { loadingRows } : {})}
      responsive
      state={loading ? "loading" : "ready"}
      empty={{
        ...empty,
        illustration: empty?.illustration ?? "records",
        title: empty?.title ?? "No records yet",
        description:
          empty?.description ??
          (createAction
            ? "Create a record to start this collection."
            : "Records will appear here when available."),
        action: compact ? createAction : heroSized(createAction),
        ...(compact ? { size: "compact" as const, icon: empty?.icon ?? <Inbox /> } : {}),
      }}
      toolbar={
        <Toolbar
          search={String(table.state.globalFilter ?? "")}
          onSearch={onSearch}
          placeholder={searchLabel}
          views={views}
          // An empty list of chips is no filters, so a narrow row draws no empty More.
          filters={Children.toArray(filters).length ? filters : undefined}
          actions={action}
        >
          {displayControls ? (
            <>
              {showSort && <DataTable.Sort table={table} />}
              {showColumns && <DataTable.Columns table={table} />}
              {!compact && <DataTable.Settings table={table} />}
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
            </>
          ) : null}
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
