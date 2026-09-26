import type { ProductConfigurationItem } from "@/lib/product-items";
import {
  DataTable,
  Id,
  Inline,
  PickerSheet,
  defineColumns,
  useDataTable,
} from "@ledger/design-system";
import { useMemo, useRef, useState } from "react";

type ProductConfigurationRow = ProductConfigurationItem & {
  elementCount: number;
  /** The configuration's name then its code: what the column shows, sorts and searches. */
  configuration: string;
};

const columns = defineColumns<ProductConfigurationRow>((c) => [
  c.id("productCode", {
    header: "Product",
    width: 140,
    cell: (row) => <Id>{row.productCode}</Id>,
  }),
  c.text("productName", { header: "Name", priority: 0, minWidth: 180, hideable: false }),
  c.text("configuration", {
    header: "Configuration",
    minWidth: 160,
    cell: (row) => (
      <Inline space="space.075" alignBlock="baseline" shouldWrap>
        {row.configurationName}
        <Id>{row.configurationCode}</Id>
      </Inline>
    ),
  }),
  c.number("version", { header: "Version", width: 90 }),
  c.number("elementCount", { header: "Elements", width: 96 }),
  c.number("libraryCount", { header: "Library components", width: 150 }),
  c.text("configurationDescription", { header: "Description", minWidth: 200, wrap: true }),
]);

/** Choose one published product version and one of its configurations to create a variant from. */
export function ProductConfigurationPicker({
  open,
  items,
  pending = false,
  title = "From a product",
  actionLabel,
  defaultChosenId = null,
  onPick,
  onClose,
}: {
  open: boolean;
  items: ProductConfigurationItem[];
  pending?: boolean | undefined;
  /** The operation, in the words of the trigger that opened the sheet. */
  title?: string | undefined;
  /** The primary's words, when it repeats the operation; otherwise it names the chosen configuration. */
  actionLabel?: string | undefined;
  /** The configuration chosen before, when the reader comes Back to the sheet. */
  defaultChosenId?: string | null | undefined;
  onPick: (item: ProductConfigurationItem) => void;
  onClose: () => void;
}) {
  const handingOff = useRef(false);
  const [chosenId, setChosenId] = useState<string | null>(defaultChosenId);
  // Every published configuration goes to the table; the sheet's search narrows it through the
  // table's own filter, so a search that finds nothing says so and offers Clear filters.
  const rows = useMemo(
    () =>
      items.map((item) => ({
        ...item,
        elementCount: item.elements.length,
        configuration: `${item.configurationName} ${item.configurationCode}`,
      })),
    [items],
  );
  const chosen = items.find((item) => item.id === chosenId) ?? null;
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
    data: rows,
    getRowId: (row) => row.id,
    rowLabel: (row) => `${row.productName} · ${row.configurationName}`,
    label: "Product configurations",
    view: "product-configuration-picker",
  });
  return (
    <PickerSheet
      open={open}
      finalFocus={() => !handingOff.current}
      onClose={onClose}
      title={title}
      subtitle="A published version and one of its configurations"
      width="xlarge"
      table={table}
      search={{ placeholder: "Search products" }}
      summary={chosen ? `${chosen.productName} · ${chosen.configurationName} chosen` : undefined}
      action={{
        label:
          actionLabel ??
          (chosen ? `Add ${chosen.productName} · ${chosen.configurationName}` : "Add system"),
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
