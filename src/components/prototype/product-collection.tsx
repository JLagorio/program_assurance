import { Inbox, MoreHorizontal } from "lucide-react";
import {
  Children,
  Fragment,
  cloneElement,
  isValidElement,
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useNavigate, useRouter, useRouterState } from "@tanstack/react-router";
import {
  DataTable,
  Toolbar,
  IconButton,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  Stack,
  Text,
  tableQueryFromSearch,
  tableQueryKey,
  tableQueryParamNames,
  tableQueryToSearch,
  tableQueryToString,
  useTableQuery,
  type DataTableInstance,
  type DataTableProps,
  type TableQueryParams,
} from "@ledger/design-system";
import { questionPrefix, rememberedQuestion, routerParams } from "./collection-question";
import { QueryState, type QueryStatus } from "./work-common";
import { useRegionFailures } from "./failure-region";

/** The product collection contract: domain adapters own columns and relationships;
 * this composition owns loading recovery, the toolbar and the table's empty region. A register
 * the server pages (`useServerCollection` in collection-question) spreads its table, its read
 * and its question key in (`<ProductCollection {...collection} … />`): the toolbar, the empties,
 * the recovery and the busy state are the same, and the address's question is the read's. */
export type ProductCollectionProps<T extends { id: string }> = Omit<
  DataTableProps<T>,
  "toolbar" | "state" | "error" | "responsive"
> & {
  /** The queries the rows come from. While one loads with no rows yet, the toolbar stays and the
   * rows are skeletons; a failed refresh keeps the rows under one alert; a failure with no rows is
   * the alert and Retry alone. Inside a failure region (a record page, a tab panel: QueryState's
   * `region`) the region's one alert says it, and a collection with no rows says "Could not load". */
  queries?: QueryStatus[];
  /** The search's placeholder and name: "Find" and the collection's noun ("Find risks") unsaid. */
  searchLabel?: string | undefined;
  /**
   * The search field. On unless the task has no question to ask of the rows: a preview's few
   * versions, whose toolbar keeps the create action and nothing else it does not need.
   */
  search?: boolean | undefined;
  /** Saved views, as a DataTable.Presets menu. Leave it out when the collection has none. */
  views?: ReactNode;
  filters?: ReactNode;
  /** The create action, small, at the toolbar's end; the empty collection offers the same. */
  action?: ReactNode;
  /**
   * The create action's weight. `primary` on a register, or on a tab whose only content is the
   * collection: the surface's one small primary. `secondary` for a collection among others under a
   * Section heading in a record body or a preview, where the page header (or the preview's record
   * header) keeps the surface's one primary: the toolbar's action and the empty's are drawn as small
   * secondaries, whatever variant the caller drew them in. Unsaid, it follows `compact`: a compact
   * collection sits beside other content, so it is `secondary`; any other is `primary`.
   */
  actionVariant?: "primary" | "secondary" | undefined;
  commands?: { label: string; onSelect: () => void; disabled?: boolean }[] | undefined;
  /** The sort as a toolbar menu, for rows whose columns fold into More fields. On unless the
   * collection's order is its meaning. */
  sort?: boolean | undefined;
  /**
   * Keep the reader's question (search, sort, filters, page) in the address, its parameters named
   * after the table's `view` or this key (`risk-register.q`, `risk-register.filters`,
   * `risk-register.sort`, `risk-register.page`), so two collections on one page keep their own.
   * Back, Forward, a reload and a shared link ask it again, and `questionSearch` builds a link that
   * opens the collection on a question. This tab's session remembers it too: a collection reached
   * with no question in the address (from the navigation, after a tab change) asks the last one it
   * asked, and writes it back to the address. Without a `view` or a key nothing is kept. Off
   * (`false`) for a table in a dialog, a sheet or a picker, whose question ends with the task.
   */
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
 * Keeps the question in the address, with this tab's session as the fallback; a component, so the
 * caller can leave it out. The address holds the question; a collection reached without one asks
 * the question it last asked in this tab and writes it back to the address.
 */
function KeepQuestion<T extends { id: string }>({
  table,
  questionKey,
}: {
  table: DataTableInstance<T>;
  questionKey: string;
}) {
  const navigate = useNavigate();
  const router = useRouter();
  const prefix = questionPrefix(questionKey);
  // The address of the page the collection is drawn on. While a link to another page loads, the
  // router's location is already that page's: the collection neither reads it nor writes to it.
  const shown = useRouterState({ select: (state) => state.resolvedLocation ?? state.location });
  const address = shown.search as Record<string, unknown>;
  const page = shown.pathname;
  const inAddress = Object.values(tableQueryParamNames({ prefix })).some(
    (name) => Object.prototype.hasOwnProperty.call(address, name) && address[name] !== undefined,
  );
  // The address's question in its canonical form, so the effects compare it by value.
  const asked = tableQueryToString(tableQueryFromSearch(address, { prefix }));
  const [remembered, setRemembered] = useState(() => rememberedQuestion(questionKey));
  const remember = useCallback(
    (question: string) => {
      setRemembered(question);
      try {
        if (question) sessionStorage.setItem(tableQueryKey(questionKey), question);
        else sessionStorage.removeItem(tableQueryKey(questionKey));
      } catch {
        // storage unavailable: the address alone keeps the question
      }
    },
    [questionKey],
  );
  // Writes the question's parameters over the route's search, in place: no history entry, no
  // scroll, and no draft guard to ask, since the reader stays on the page. Once the reader has
  // followed a link away, the question stays with this page and is not written onto the next.
  const write = useCallback(
    (params: TableQueryParams) => {
      if (router.latestLocation.pathname !== page) return;
      void navigate({
        // The router types a search by the routes that declare one; these parameters are the
        // collection's own, kept beside whatever the route declares.
        search: ((current: Record<string, unknown>) => ({
          ...current,
          ...routerParams(params, prefix),
        })) as never,
        replace: true,
        resetScroll: false,
        ignoreBlocker: true,
      });
    },
    [navigate, router, page, prefix],
  );
  useTableQuery(table, {
    search: inAddress ? address : tableQueryToString(tableQueryFromSearch(remembered), { prefix }),
    prefix,
    onSearchChange: (params) => {
      remember(tableQueryToString(tableQueryFromSearch(params, { prefix })));
      write(params);
    },
  });
  // A question that arrives in the address (Back, Forward, a link) is the one to remember.
  useEffect(() => {
    if (inAddress) remember(asked);
  }, [inAddress, asked, remember]);
  // Reached with no question in the address, the collection asks the one it remembers and puts it
  // there, so the address can be shared and Back finds it.
  useEffect(() => {
    if (!inAddress && remembered)
      write(tableQueryToSearch(tableQueryFromSearch(remembered), { prefix }));
  }, [inAddress, remembered, write, prefix]);
  return null;
}

/**
 * The create action drawn as a small secondary: each Button or LinkButton the caller drew as the
 * primary, inside a fragment too. Nothing left (a `false` for a viewer) is no action.
 */
function asSecondary(node: ReactNode): ReactNode {
  const drawn = Children.map(node, (child): ReactNode => {
    if (!isValidElement<{ variant?: unknown; children?: ReactNode }>(child)) return child;
    if (child.type === Fragment) return cloneElement(child, {}, asSecondary(child.props.children));
    return child.props.variant === "primary"
      ? cloneElement(child, { variant: "secondary" })
      : child;
  });
  return drawn?.length ? drawn : undefined;
}

export function ProductCollection<T extends { id: string }>({
  queries = [],
  searchLabel,
  search = true,
  views,
  filters,
  action: drawnAction,
  commands,
  empty: drawnEmpty,
  sort = true,
  keepQuestion = true,
  compact = false,
  actionVariant = compact ? "secondary" : "primary",
  loadingRows,
  ...props
}: ProductCollectionProps<T>) {
  const { table } = props;
  const secondary = actionVariant === "secondary";
  const action = secondary ? asSecondary(drawnAction) : drawnAction;
  const empty =
    secondary && drawnEmpty?.action
      ? { ...drawnEmpty, action: asSecondary(drawnEmpty.action) }
      : drawnEmpty;
  // A stable handler, so the toolbar's measuring effect does not restart on every render.
  const onSearch = useCallback((value: string) => table.setGlobalFilter(value), [table]);
  // Once a compact collection has offered Columns it keeps it, so bringing the last hidden column
  // back never takes the menu, and focus, from under the reader.
  const [columnsOffered, setColumnsOffered] = useState(false);
  const failed = queries.filter((query) => query.isError);
  const failedWithoutRows = failed.some((query) => query.data === undefined);
  const loading = !failedWithoutRows && queries.some(isLoading);
  // A page, search or filter on its way over the last one's rows: busy, not the answer yet.
  const refreshing = !loading && queries.some((query) => query.isPlaceholderData === true);
  // Inside a failure region, the region's one alert says this collection's failure.
  const [held, probe] = useRegionFailures(failed);
  const placeholder = searchLabel ?? `Find ${props.noun?.other ?? "records"}`;
  // A failure with nothing to show: the alert and Retry, no empty table under it. In a region,
  // whose alert says why and retries, the collection's place says only that it did not load.
  if (failedWithoutRows)
    return (
      <>
        <span hidden ref={probe} />
        {held ? (
          <Text color="color.text.subtle">
            Could not load{props.noun ? ` ${props.noun.other}` : ""}
          </Text>
        ) : (
          <QueryState queries={queries} />
        )}
      </>
    );
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
      state={loading ? "loading" : refreshing ? "refreshing" : "ready"}
      empty={{
        ...empty,
        illustration: empty?.illustration ?? "records",
        title: empty?.title ?? "No records yet",
        description:
          empty?.description ??
          (createAction
            ? "Create a record to start this collection."
            : "Records will appear here when available."),
        // The toolbar's small create action as it is: a centred first-record empty draws it medium.
        action: createAction,
        ...(compact ? { size: "compact" as const, icon: empty?.icon ?? <Inbox /> } : {}),
      }}
      toolbar={
        <Toolbar
          {...(search
            ? {
                search: String(table.state.globalFilter ?? ""),
                onSearch,
                placeholder,
              }
            : {})}
          views={views}
          // An empty list of chips is no filters, so a narrow row draws no empty More.
          filters={Children.toArray(filters).length ? filters : undefined}
          // Folded into More on a phone or beside a panel, the filters still say how many apply.
          activeFilters={table.state.columnFilters.length}
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
  const questionKey =
    keepQuestion === false
      ? undefined
      : typeof keepQuestion === "string"
        ? keepQuestion
        : table.options.meta?.view;
  const keeper = questionKey ? <KeepQuestion table={table} questionKey={questionKey} /> : null;
  // A failed refresh keeps the rows the reader has, under one alert with Retry. The table keeps its
  // place among the siblings, so an alert that comes and goes never remounts it; the Stack spaces
  // the alert from the toolbar wherever the collection sits (a tab panel is not a stack).
  return (
    <Stack space="space.150">
      <span hidden ref={probe} />
      {failed.length > 0 && !held && <QueryState queries={failed} />}
      {keeper}
      {collection}
    </Stack>
  );
}
