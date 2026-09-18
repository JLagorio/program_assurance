import type { ProductConfigurationItem } from "@/lib/product-items";
import { DataTable, Id, PickerSheet, defineColumns, useDataTable } from "@ledger/design-system";
import { useMemo, useRef, useState } from "react";

/** Choose one published product version and one of its configurations to create a variant from. */
export function ProductConfigurationPicker({
  open,
  items,
  pending = false,
  onPick,
  onClose,
}: {
  open: boolean;
  items: ProductConfigurationItem[];
  pending?: boolean | undefined;
  onPick: (item: ProductConfigurationItem) => void;
  onClose: () => void;
}) {
  const handingOff = useRef(false);
  const [search, setSearch] = useState("");
  const [chosenId, setChosenId] = useState<string | null>(null);
  const shown = useMemo(
    () =>
      items.filter((item) =>
        `${item.productCode} ${item.productName} ${item.configurationCode} ${item.configurationName}`
          .toLowerCase()
          .includes(search.toLowerCase()),
      ),
    [items, search],
  );
  const chosen = items.find((item) => item.id === chosenId) ?? null;
  const columns = useMemo(
    () =>
      defineColumns<ProductConfigurationItem>((c) => [
        c.id("productCode", {
          header: "Product",
          width: 140,
          cell: (row) => <Id>{row.productCode}</Id>,
        }),
        c.text("productName", { header: "Name", priority: 0, minWidth: 180, hideable: false }),
        c.text("configurationName", { header: "Configuration", minWidth: 160 }),
        c.number("version", { header: "Version", width: 90 }),
        c.number("elements", {
          header: "Elements",
          width: 96,
          cell: (row) => String(row.elements.length),
        }),
        c.number("libraryCount", { header: "Library components", width: 150 }),
        c.text("configurationDescription", { header: "Description", minWidth: 200, wrap: true }),
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
    label: "Product configurations",
    view: "product-configuration-picker",
  });
  return (
    <PickerSheet
      open={open}
      finalFocus={() => !handingOff.current}
      onClose={onClose}
      title="From a product"
      subtitle="A published version and one of its configurations"
      width={880}
      search={{ value: search, onChange: setSearch, placeholder: "Search products" }}
      selected={chosen ? 1 : 0}
      total={shown.length}
      action={{
        label: chosen ? `Add ${chosen.productName} · ${chosen.configurationName}` : "Add system",
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
          description:
            "Publish a product version with at least one active configuration in the library first.",
        }}
      />
    </PickerSheet>
  );
}
