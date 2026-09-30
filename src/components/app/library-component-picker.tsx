import type { LibraryComponentItem } from "@/lib/library-items";
import { DataTable, Id, PickerSheet, defineColumns, useDataTable } from "@ledger/design-system";
import { useMemo, useRef, useState } from "react";

type LibraryComponentRow = LibraryComponentItem & { controlCount: number };

const columns = defineColumns<LibraryComponentRow>((c) => [
  c.id("definitionCode", {
    header: "Item",
    width: 150,
    cell: (row) => <Id>{row.definitionCode}</Id>,
  }),
  c.text("definitionName", { header: "Name", priority: 0, minWidth: 200, hideable: false }),
  c.text("detail", { header: "Component", minWidth: 200, wrap: true }),
  c.text("category", { header: "Category", width: 160 }),
  c.text("version", { header: "Version", width: 90 }),
  c.number("controlCount", { header: "Controls", width: 96 }),
]);

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
  const [chosenId, setChosenId] = useState<string | null>(null);
  // The whole library goes to the table; the sheet's search narrows it through the table's own
  // filter, so a search that finds nothing says so and offers Clear filters.
  const rows = useMemo(
    () => items.map((item) => ({ ...item, controlCount: item.claimControlIds.length })),
    [items],
  );
  const chosen = items.find((item) => item.id === chosenId) ?? null;
  const table = useDataTable({
    columns,
    // One record: a radio per row, and a click on the row chooses it.
    selectable: "single",
    value: chosenId,
    onValueChange: setChosenId,
    data: rows,
    getRowId: (row) => row.id,
    rowLabel: (row) => `${row.definitionCode} · ${row.definitionName}`,
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
      width="xlarge"
      table={table}
      search={{ placeholder: "Search the library" }}
      // The primary repeats the trigger and the title; the footer names the choice, the subtitle
      // where it goes, so the label stays short enough for one line on a phone.
      action={{
        label: "Add from library",
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
        empty={{
          illustration: "records",
          title: "Nothing published to add",
          description: "Publish a component definition version in the library first.",
        }}
      />
    </PickerSheet>
  );
}
