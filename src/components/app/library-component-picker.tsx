import type { LibraryComponentItem } from "@/lib/library-items";
import { DataTable, Id, PickerSheet, defineColumns, useDataTable } from "@ledger/design-system";
import { useMemo, useRef, useState } from "react";

/** Choose one published component definition from the library, at its latest published version. */
export function LibraryComponentPicker({
  open,
  parentLabel,
  items,
  pending = false,
  onPick,
  onClose,
}: {
  open: boolean;
  parentLabel: string;
  items: LibraryComponentItem[];
  pending?: boolean | undefined;
  onPick: (item: LibraryComponentItem) => void;
  onClose: () => void;
}) {
  const handingOff = useRef(false);
  const [search, setSearch] = useState("");
  const [chosenId, setChosenId] = useState<string | null>(null);
  const shown = useMemo(
    () =>
      items.filter((item) =>
        `${item.definitionCode} ${item.definitionName} ${item.componentName} ${item.category}`
          .toLowerCase()
          .includes(search.toLowerCase()),
      ),
    [items, search],
  );
  const chosen = items.find((item) => item.id === chosenId) ?? null;
  const columns = useMemo(
    () =>
      defineColumns<LibraryComponentItem>((c) => [
        c.id("definitionCode", {
          header: "Item",
          width: 150,
          cell: (row) => <Id>{row.definitionCode}</Id>,
        }),
        c.text("definitionName", { header: "Name", priority: 0, minWidth: 200, hideable: false }),
        c.text("detail", { header: "Component", minWidth: 200, wrap: true }),
        c.text("category", { header: "Category", width: 160 }),
        c.text("version", { header: "Version", width: 90 }),
        c.number("claimControlIds", {
          header: "Controls",
          width: 96,
          cell: (row) => String(row.claimControlIds.length),
        }),
      ]),
    [],
  );
  const table = useDataTable({
    columns,
    selectable: true,
    enableMultiRowSelection: false,
    state: { rowSelection: chosenId ? { [chosenId]: true } : {} },
    onRowSelectionChange: (update) => {
      const next =
        typeof update === "function" ? update(chosenId ? { [chosenId]: true } : {}) : update;
      setChosenId(Object.keys(next).find((id) => next[id]) ?? null);
    },
    data: shown,
    getRowId: (row) => row.id,
    label: "Library components",
    view: "library-component-picker",
  });
  return (
    <PickerSheet
      open={open}
      finalFocus={() => !handingOff.current}
      onClose={onClose}
      title="Add from library"
      subtitle={`Under ${parentLabel}`}
      width={880}
      search={{ value: search, onChange: setSearch, placeholder: "Search the library" }}
      selected={chosen ? 1 : 0}
      total={shown.length}
      action={{
        label: chosen ? `Add ${chosen.componentName} under ${parentLabel}` : "Add component",
        onClick: () => {
          if (chosen) {
            handingOff.current = true;
            onPick(chosen);
          }
        },
        disabled: !chosen,
      }}
    >
      <DataTable
        responsive
        table={table}
        state={pending ? "loading" : "ready"}
        onRowClick={(row) => setChosenId(row.id)}
        empty={{
          illustration: "records",
          title: "Nothing published to add",
          description: "Publish a component definition version in the library first.",
        }}
      />
    </PickerSheet>
  );
}
