// From the product pattern contract (docs/guides/product-patterns.md), moved here on
// 2026-11-16 when the contract was cut to its rules: what holds for this screen alone, and the
// full wording of rules the contract now states in fewer words.
//
// The one verb so far is Assign owner, `useOwnerAssignment` in assign-owner: a Dialog titled Assign
// owner with one required Owner field, a person or an organization, which says how many records are
// chosen and that the owner replaces any they have now. It applies in one request,
// `assign_record_owner` through owner-assign: every chosen record takes the owner or none does, and
// a record that already holds it is left as it is, so sending it again changes nothing. A toast
// says how many took it, the selection clears and focus goes to the table's select-all. A register
// that assigns owners draws an Owner column (`c.person`) and an Owner filter, the last of its
// filters, whose values are every person and organization by name and then No owner with how many
// records of the whole register nobody owns (`useOwnerOptions`), so they are one choice away; it
// adds no saved view for them, which would take the filters' place in the row. Its read reaches the
// column by the owner's name (`ownerField`). Reference: the risk register in assurance-views;
// operational issues, evidence and a program's Requirements do the same. A requirement's owner is
// on its details, which take it at their next revision, and each change is an entry of the
// requirement's edit history, as an edit of its owner is; a requirement whose details are not
// recorded takes no owner, so its row cannot be chosen and Select all leaves it out.

import { useMemo, useRef, useState, type ReactNode } from "react";
import {
  Button,
  toast,
  useLedgerLocale,
  type DataTableInstance,
  type FilterOption,
  type Preset,
} from "@ledger/design-system";
import { causeText } from "@/components/app/sentence";
import { useRows } from "@/lib/models";
import { NO_OWNER, noOwnerFilter, type OwnedCollection } from "@/lib/owner-assign";
import type { ServerRead, ServerResultQuestion } from "@/lib/server-table";
import { AssignOwnerDialog } from "./assign-owner-dialog";
import { useServerPresetCounts } from "./collection-question";

type Noun = { one: string; other: string };

/** The chosen rows' ids: every one the reader chose, the ones on other pages too. */
const chosenIds = (selection: Record<string, boolean>) =>
  Object.keys(selection).filter((id) => selection[id]);

/**
 * The Owner filter's values: every person and organization by name, then No owner with how many
 * records of the whole collection nobody owns (no count while it is not known).
 */
export function ownerFilterOptions(
  names: readonly string[],
  unowned: number | undefined,
): FilterOption[] {
  return [
    ...[...new Set(names)].sort((a, b) => a.localeCompare(b)).map((value) => ({ value })),
    { value: NO_OWNER, ...(unowned === undefined ? {} : { count: unowned }) },
  ];
}

/**
 * The Owner filter's values on a server-paged register: every person and organization by name,
 * since one page's rows are not every owner there is, then No owner with how many records of the
 * whole register nobody owns. `column` is the Owner column's id in the register's table.
 */
export function useOwnerOptions(read: ServerRead, column = "owner_party_id"): FilterOption[] {
  const parties = useRows("parties", {}, { columns: ["id", "name"] });
  const unowned = useMemo<Preset[]>(
    () => [{ id: "none", label: NO_OWNER, filters: noOwnerFilter(column) }],
    [column],
  );
  const count = useServerPresetCounts(read, unowned)["none"];
  return useMemo(
    () =>
      ownerFilterOptions(
        (parties.data ?? []).map((party) => party.name),
        count,
      ),
    [parties.data, count],
  );
}

/** A read row's id, when it has one: the whole-result read answers rows of any register. */
const rowId = (row: unknown): string[] => {
  const id = typeof row === "object" && row !== null ? (row as { id?: unknown }).id : undefined;
  return typeof id === "string" ? [id] : [];
};

/** The table's select-all, which stays when the selection bar goes: where focus lands then. */
function selectAllOf(from: HTMLElement | null): HTMLElement | null {
  let scope = from?.parentElement ?? null;
  while (scope && !scope.querySelector("table")) scope = scope.parentElement;
  return scope?.querySelector<HTMLElement>('thead [role="checkbox"]') ?? null;
}

/**
 * Assign owner, the verb a register offers while rows are chosen. Hand `selection` to
 * ProductCollection, which draws it in the selection bar, and render `dialog` beside the
 * collection: the Dialog outlives the bar, which goes once the owner is assigned and the
 * selection cleared. Give the table `selectable` only for a reader who may edit. With no
 * `collection` (a collection that assigns no owner) both are empty.
 *
 * A server-paged register passes `result`, its whole-result read: once the page is chosen and the
 * register holds more, the bar offers every record the question finds as a second, explicit step.
 * A register whose rows cannot all take an owner (a requirement with no details) leaves those out
 * of what its `result` answers, as its `selectable` leaves them out of the page.
 */
export function useOwnerAssignment<T extends { id: string }>({
  table,
  collection,
  noun,
  result,
}: {
  table: DataTableInstance<T>;
  collection: OwnedCollection | undefined;
  noun: Noun;
  result?: ((question: ServerResultQuestion) => Promise<readonly unknown[]>) | undefined;
}): { selection: ReactNode; dialog: ReactNode } {
  const { formatNumber } = useLedgerLocale();
  const opener = useRef<HTMLButtonElement>(null);
  // Where focus goes when the Dialog closes: its opener, or the select-all once the bar is gone.
  const returnTo = useRef<HTMLElement | null>(null);
  const [assigning, setAssigning] = useState<readonly string[] | null>(null);
  const [reading, setReading] = useState(false);
  const ids = chosenIds(table.state.rowSelection);
  const total = table.getRowCount();
  const offerAll =
    !!result &&
    table.options.manualPagination === true &&
    table.getIsAllPageRowsSelected() &&
    total > ids.length;
  const chooseAll = () => {
    if (!result || reading) return;
    setReading(true);
    result({
      search: String(table.state.globalFilter ?? ""),
      sorting: table.state.sorting,
      filters: table.state.columnFilters,
    })
      .then((rows) => {
        table.setRowSelection(Object.fromEntries(rows.flatMap(rowId).map((id) => [id, true])));
        // The offer goes once it is taken: the next step keeps the focus.
        opener.current?.focus();
      })
      .catch((cause: unknown) =>
        toast.add({
          type: "error",
          title: `The ${noun.other} were not selected`,
          description: causeText(cause, "Try again."),
        }),
      )
      .finally(() => setReading(false));
  };
  if (!collection) return { selection: null, dialog: null };
  const selection = (
    <>
      {offerAll ? (
        <Button variant="link" size="small" isLoading={reading} onClick={chooseAll}>
          Select all {formatNumber(total)} {noun.other}
        </Button>
      ) : null}
      <Button
        ref={opener}
        size="small"
        onClick={() => {
          returnTo.current = opener.current;
          setAssigning(ids);
        }}
      >
        Assign owner
      </Button>
    </>
  );
  const dialog = assigning ? (
    <AssignOwnerDialog
      collection={collection}
      noun={noun}
      recordIds={assigning}
      finalFocus={returnTo}
      onAssigned={() => {
        // The bar goes with the selection, and the opener with it: focus goes to the select-all.
        returnTo.current = selectAllOf(opener.current);
        table.resetRowSelection();
      }}
      onClose={() => setAssigning(null)}
    />
  ) : null;
  return { selection, dialog };
}
