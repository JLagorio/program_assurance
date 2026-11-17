// From the product pattern contract (docs/guides/product-patterns.md), moved here on
// 2026-11-16 when the contract was cut to its rules: what holds for this screen alone, and the
// full wording of rules the contract now states in fewer words.
//
// A standalone register is one `PageHeader` with the name in `PageHeader.Heading` /
// `PageHeader.Title`, followed by a frameless `DataTable` with `fill`. Nothing else: no sentence
// under the title, no `Section` around the only table, no create button in the page header (the
// toolbar carries it). Reference: WorkTable (src/components/prototype/work-table.tsx). All product
// collections compose ProductCollection (src/components/prototype/product-collection.tsx); domain
// adapters retain their typed columns and relationships, and delegate the toolbar, query recovery,
// responsive table and empty region to it.
//
// Pass the collection's queries as `queries` rather than wrapping it in `QueryState`: a first load
// keeps the toolbar over skeleton rows, a failed refresh keeps the rows under one alert with Retry,
// and a page, search or filter on its way over the last one's rows (a query that keeps its previous
// data) keeps them under the table's busy state. ProductCollection draws `DataTable.Sort` and keeps
// the reader's question (search, sort, filters, page) in the address, its parameters named after
// the table's `view` (`risk-register.q`, `risk-register.filters`), so Back, a reload and a shared
// link ask it again and two collections on one page keep their own. The tab's session remembers it
// too, so a register reached with no question in the address asks the last one it asked and writes
// it back. A link that opens a register on a question builds its search with `questionSearch` from
// collection-question, naming a view from register-views, and a route's own navigation (a tab
// change) merges over the current search rather than replacing it. A collection inside a dialog,
// sheet or picker passes `keepQuestion={false}`, since its question ends with the task and stays
// out of the address, and one whose order is its meaning passes `sort={false}`.
//
// The toolbar is the kit `Toolbar`: search first, saved views in `views`, filters in `filters` with
// the count of applied filters in `activeFilters` (`table.state.columnFilters.length`, which
// ProductCollection passes), Columns and Settings as its children, and one small primary in
// `actions`. A register, and a tab whose only content is a collection, keeps that small primary. In
// a record body or a preview that holds collections under Section headings, each collection's
// create action is a small secondary, and the page header or the preview's record header keeps the
// surface's one primary:
//
// ProductCollection draws a `compact` collection's create action, in its toolbar and its empty
// state, as a secondary unsaid (`actionVariant`), and a headed EntitySection, a `section`
// ProgramCollection and a compact AssessmentTable are compact. A create drawn where
// ProductCollection cannot reach it, such as a menu trigger's `render`, is written
// `variant="secondary"`.
//
// Reference: the program's Schedule tab in program-workspace.
//
// The search says Find and the collection, as its placeholder and its name (Find risks, Find
// assessment findings); ProductCollection writes it from the collection's noun when the caller
// names none.
//
// A compact collection in a preview whose task asks nothing of a search (an evidence artifact's
// Versions) passes `search={false}` and keeps its create action.
//
// A register that holds the records of several programs draws a Program column and a Program
// filter, by the program's name (`useProgramOptions` in program-filter), and leaves both out inside
// a program. Optional collection commands such as Export belong in the labelled Collection actions
// overflow beside Columns and Settings.
//
// This is the recommended home for secondary collection operations: the primary still creates the
// record, and export remains available without a second visible toolbar action.
//
// When a collection has a second way to create its record, the primary is a `ButtonGroup`: the one
// create action, then a labelled icon menu for the other paths ("More ways to create a system" in
// ProgramSystemsTree (src/components/prototype/program-systems-tree.tsx)); a single path stays a
// plain small primary.
//
// Omit a capability the collection or the reader's role has no use for. Never rebuild the row with
// an `Inline` or a second wrapper.
//
// A register whose records a reader acts on several at once is `selectable`, for a reader who may
// edit, and hands its verbs to ProductCollection as `selection`: while rows are chosen the table's
// `DataTable.SelectionBar` takes the toolbar's place with the count, the verbs as small Buttons and
// Clear, so the rows stay where they were. The checkbox alone chooses a row; its name and its row
// click still open it. The verbs act on every chosen row, the ones on other pages too. On a
// server-paged register, once the page is chosen and the question finds more, the bar offers the
// whole result as a second, explicit step (Select all 62 risks), read through `useServerResult`. A
// viewer sees no checkbox and no verb.
//
// Columns come from `defineColumns` by kind. A date is `c.date` with the raw value at its kind's
// width; formatting never becomes the sort value. A person (an owner, a sponsor, a reviewer) is
// `c.person`, or `kind: "person"` on a ModelTable, EntitySection or ProgramCollection column, which
// reads the people's names once and sorts, filters and searches by them; several values in one cell
// (assignees, types) are a `c.list`, or `items` on a ProgramCollection column, whose filter lists
// each value once, never an array joined into a text column. The record's name is a `TextLink`
// rendering a router `Link` to its record page, through `RecordLink` in record-preview; in a table
// the kit draws a row's name in the text colour at medium weight, underlined under the pointer,
// whether it is a link or a button that opens a preview, so a register's colour stays with its
// statuses and a screen adds no colour or weight to a name; a record with no stored name links as
// "Unnamed <noun>", never as a missing value. A name never leads into the schema inspector:
// `recordDestination` gives a record's page, or nothing. A record with no page of its own (an
// observation, an organization, a CCI, a procedure, an ATT&CK technique, a link row) is named by a
// link-styled `Button` that opens its preview, and its row click does the same.
//
// Inside a Dialog or a Sheet, where no preview can open beside the task, the name is plain text. A
// row click goes where the name goes, through `useOpenRecord`. A revision opens the record it is a
// version of: an evidence version its artifact at that version, a risk assessment its risk's
// Assessments.
//
// A name that needs the record's kind, a mark or a second line takes `icon`, `badge` and
// `description` on its column (Ledger's `Table.Name`), never an `Inline` or a `Stack` in `cell`.
//
// A row click follows the name's destination and is never the only opener.
//
// Buttons act; links navigate.
//
// A tab whose only content is a collection starts with its toolbar and table, after the tab's row
// of views where it has one. The tab already names the collection: do not repeat its heading or put
// explanatory prose above it. Multiple distinct collections in a record body use `Section`
// headings, h2, or h3 under a dialog title; never a second page h1. A title no kit part draws is a
// `Heading` at the size it matches (`page` for a page or record title, `section` for a section's,
// `overlay` inside an overlay), never a raw `h1`–`h6` with type classes. Authored descriptions
// belong in labelled record properties. A Section's description is an instruction or an authored
// definition, never a computed sentence: a count is the Section's `count` (`countMax={9999}` for
// rows), and progress is a labelled `Progress` whose value says the count (Gates completed, 14 of
// 19), as on the Lifecycle timeline in program-timeline.
//
// Other provenance, counts and derivation belong in a collapsed Details section; genuine warnings,
// missing prerequisites and instructions inside a picker or form remain visible where they affect
// the task. A shared adapter carries table and data rules only, never a copy of a kit part;
// headings are an explicit decision of the caller (`Section`, `showHeading`, or `section` for a
// domain collection), and default to absent; a new adapter needs a domain responsibility beyond
// renaming the table's props.
//
// Record collections use `DataTable` even when embedded: component Structure and Program uses,
// product Variants, and requirement Adopted by follow this shape. Three named uses keep the kit
// `Table`: component/product version history selects the current version with an explicit button, a
// profile's Source imports describes its ordered lineage and selection rules, and a control's Cyber
// resiliency lists the techniques it supports in the order Table E-1 prints them, strongest first,
// one line a technique with its approaches, each row opening in place onto NIST's guidance for
// them. A fourth is the Layers take of the program's Cyber resiliency view, techniques by baseline
// layer with a number and a `Tally` a cell, in the framework's order and the stack's. These are
// version-selection, definition and derivation lists, not collection previews. Preserve their
// meaningful order; do not add search, sorting or an eye merely to resemble a register. This
// exception depends on the task, not an assumed small row count.
//
// Every product DataTable is responsive, which is the DataTable's default: product code never
// writes `responsive={false}`, and a DataTable that takes a prop spread writes `responsive` after
// it.
//
// Give the primary name `priority: 0` and a readable width/minimum (usually 180–220px); lower
// numbers stay in the row longer. An unsized name takes the spare width, and a register's column
// that says one thing on every row of its result (three rows or more; a date by its day) folds into
// More fields and gives the name its width (ProductCollection's `fold`). No field disappears:
// resize must not change stored column visibility, filters, sorting, selection, preview state or
// export. Do not solve narrow tables with a page overflow rule or a smaller font. Reference:
// ProgramSystemsTree (src/components/prototype/program-systems-tree.tsx).
//
// A collection that pages takes 25 rows a page through `useCollectionTable` in collection-question
// (ModelTable, EntitySection and ProgramCollection do it unsaid), and another `pageSize` only where
// its task needs one. One that can hold more than about 200 rows pages or sets `virtualize` on its
// table, in a dialog, a sheet or a picker as on a page. Never draw every row at once.
//
// It is `useServerCollection` in collection-question over a `serverRead` from server-table, spread
// into ProductCollection (`<ProductCollection {...collection} />`).
//
// A collection that stays small, a record's own collection under a few hundred rows, keeps client
// paging. Reference: the catalog's CCIs in catalog.
//
// Every empty collection supplies an illustration, a title, a one-line explanation and the same
// create action as its toolbar, under the same role check. A filtered result with nothing in it
// uses the table's built-in Clear filters unless the collection needs different copy. Empty data
// and an empty filter result are different states.

import { CollectionSavedViews } from "./saved-views";
import { Inbox, MoreHorizontal } from "lucide-react";
import {
  Children,
  Fragment,
  cloneElement,
  isValidElement,
  useCallback,
  useEffect,
  useMemo,
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
  useLedgerLocale,
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
  /**
   * The verbs for the chosen rows (Assign owner), as small Buttons. While rows are chosen the
   * table's selection bar takes the toolbar's place and draws them beside the count and Clear, so
   * the rows stay where they were. They act on every chosen row, the ones on other pages too. Give
   * the table `selectable` for a reader who may run them, and leave both off for one who may not.
   */
  selection?: ReactNode;
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

/** A register folds a column once its result holds this many rows: two share a value by chance. */
const FOLD_FROM_ROWS = 3;

/** A cell's value as the reader reads it, to compare rows by: an empty value is none. */
function sameness(value: unknown): string {
  if (value === null || value === undefined || value === "") return "";
  if (Array.isArray(value) && value.length === 0) return "";
  return JSON.stringify(value);
}

/**
 * The columns of a register whose every row says one thing: the same value, or none, on each row
 * of its result (every row a client table's search and filters leave, a server register's page),
 * once it holds three rows. A date says its day in the reader's zone, so a column of one day's
 * moments folds. Such a column tells no row from another: the table puts it in each row's More
 * fields and gives its width to the name. Only a column whose value is its cell's is weighed: the
 * row's name, its actions, a column the reader pinned and a custom cell never fold.
 */
function useFoldedColumns<T extends { id: string }>(table: DataTableInstance<T>, on: boolean) {
  const { formatDate } = useLedgerLocale();
  // The row model's own list, which keeps its identity while the result does.
  const rows = table.getPrePaginatedRowModel().rows;
  const columns = table.getVisibleLeafColumns();
  // The columns the reader pinned keep their place: a pin says the reader wants the column there.
  const { start, end } = table.state.columnPinning;
  const pinned = [...(start ?? []), ...(end ?? [])].join(" ");
  return useMemo(() => {
    const held = new Set(pinned.split(" "));
    if (!on || rows.length < FOLD_FROM_ROWS) return undefined;
    const day = (value: unknown) => {
      if (typeof value !== "string" || /^\d{4}-\d{2}-\d{2}$/.test(value)) return sameness(value);
      const moment = new Date(value);
      return Number.isNaN(moment.getTime())
        ? sameness(value)
        : formatDate(moment, { year: "numeric", month: "numeric", day: "numeric" });
    };
    const folded = columns
      .filter((column) => {
        const meta = column.columnDef.meta;
        if (!meta || !column.accessorFn || held.has(column.id)) return false;
        if (meta.priority === 0 || ["id", "actions", "custom"].includes(meta.kind)) return false;
        const read = meta.kind === "date" ? day : sameness;
        // The accessor, not the row's cached value: a column whose values arrive in a later read
        // (a name read after the rows) keeps the value the row first cached until the data changes.
        const accessor = column.accessorFn;
        const first = read(accessor(rows[0]!.original, rows[0]!.index));
        return rows.every((row) => read(accessor(row.original, row.index)) === first);
      })
      .map((column) => column.id);
    return folded.length ? folded : undefined;
  }, [on, rows, columns, pinned, formatDate]);
}

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
  selection,
  empty: drawnEmpty,
  sort = true,
  keepQuestion = true,
  compact = false,
  actionVariant = compact ? "secondary" : "primary",
  loadingRows,
  ...props
}: ProductCollectionProps<T>) {
  const { table } = props;
  // A register gives the width of a column that says one thing on every row to the names.
  const fold = useFoldedColumns(table, !compact);
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const namedViewScope =
    !compact &&
    keepQuestion !== false &&
    (typeof keepQuestion === "string" ? keepQuestion : table.options.meta?.view);
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
  const hasToolbar =
    search || views || Children.toArray(filters).length > 0 || action || displayControls;
  // While rows are chosen the selection bar takes the toolbar's slot, so the rows stay in place.
  const choosing = !!selection && Object.values(table.state.rowSelection).some(Boolean);
  const collection = (
    <DataTable
      {...props}
      {...(compact ? { loadingRows: loadingRows ?? 3 } : loadingRows ? { loadingRows } : {})}
      fold={fold}
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
        choosing ? (
          <DataTable.SelectionBar table={table} actions={selection} />
        ) : hasToolbar ? (
          <Toolbar
            {...(search
              ? {
                  search: String(table.state.globalFilter ?? ""),
                  onSearch,
                  placeholder,
                }
              : {})}
            views={
              <>
                {views}
                {namedViewScope && (
                  <CollectionSavedViews table={table} scope={`${pathname}:${namedViewScope}`} />
                )}
              </>
            }
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
        ) : undefined
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
