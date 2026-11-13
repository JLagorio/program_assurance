import { useMemo, useRef, useState } from "react";
import { FileText, Plus } from "lucide-react";
import { Absent, Button, defineColumns } from "@ledger/design-system";
import { useWorkspace } from "@/components/app/workspace";
import { productCreateLabel, productRecordNoun } from "@/lib/product-records";
import type { DataRecord } from "@/lib/records";
import { registerViews } from "@/lib/register-views";
import { serverRead, type ServerRow } from "@/lib/server-table";
import { ProductCollection } from "./product-collection";
import { useServerCollection } from "./collection-question";
import {
  RecordLink,
  RecordPreviewActions,
  RecordPreviewPanel,
  useDisplayedRecords,
  useEndOnHide,
  useOpenRecord,
} from "./record-preview";
import { EntityEditor, ModelFacts, RelationName } from "./record-tools";

/**
 * An inventory item as the System assets register reads it: every column its preview's Edit seeds
 * the form from, since the form saves a column it is not given as empty, and its system by name
 * with the program the system belongs to, which the system's link names.
 */
type AssetRow = ServerRow<
  "inventory_item_rows",
  | "id"
  | "tenant_id"
  | "system_id"
  | "composition_node_id"
  | "asset_id"
  | "name"
  | "description"
  | "serial_number"
  | "manufacturer"
  | "model"
  | "asset_owner_party_id"
  | "installed_on"
  | "retired_on"
  | "revision"
  | "updated_at"
  | "system_name"
  | "system_program_id",
  | "tenant_id"
  | "system_id"
  | "composition_node_id"
  | "asset_id"
  | "name"
  | "revision"
  | "updated_at"
>;

/** The workspace's inventory items, a page at a time from the server, newest change first. */
const assetRead = serverRead({
  source: "inventory_item_rows",
  model: "inventory_items",
  columns: [
    "id",
    "tenant_id",
    "system_id",
    "composition_node_id",
    "asset_id",
    "name",
    "description",
    "serial_number",
    "manufacturer",
    "model",
    "asset_owner_party_id",
    "installed_on",
    "retired_on",
    "revision",
    "updated_at",
    "system_name",
    "system_program_id",
  ],
  search: ["asset_id", "name", "system_name", "description"],
  fields: {
    // A-2 before A-10, as the asset ids read.
    asset_id: { sort: "asset_order", filter: false },
    // The system sorts, and is found, by its name.
    system_id: { column: "system_name", filter: false },
    name: { filter: false },
    description: { filter: false },
  },
  order: [{ column: "updated_at", ascending: false }],
});

/** The register's columns, one list for every render: stepping through the preview rebuilds none. */
const assetColumns = defineColumns<AssetRow>((c) => [
  c.text("asset_id", { header: "Asset ID" }),
  c.text("name", {
    header: "Asset",
    hideable: false,
    minWidth: 180,
    priority: 0,
    cell: (row) => (
      <RecordLink table="inventory_items" record={row}>
        {row.name}
      </RecordLink>
    ),
  }),
  c.text("system_id", {
    header: "System",
    cell: (row) =>
      row.system_name ? (
        <RecordLink
          table="systems"
          record={{ id: row.system_id, program_id: row.system_program_id }}
          peek
        >
          {row.system_name}
        </RecordLink>
      ) : (
        <Absent label="Not available" />
      ),
  }),
  c.text("description", { header: "Description" }),
]);

/** What the preview says of an asset, beside its name: the register's other columns. */
const assetFacts = [
  { key: "asset_id", label: "Asset ID" },
  {
    key: "system_id",
    label: "System",
    render: (row: DataRecord) => <RelationName table="systems" id={row["system_id"] as string} />,
  },
  { key: "description", label: "Description" },
];

const assetNoun = { one: "inventory item", other: "inventory items" };

/**
 * The workspace's system assets, read a page at a time: the server pages, sorts and searches
 * them. An asset is created and edited in the generic record form, which opens from the toolbar,
 * the empty collection and the preview.
 */
export function SystemAssetsRegister() {
  const workspace = useWorkspace();
  const openRecord = useOpenRecord();
  const [editing, setEditing] = useState<AssetRow | "new" | null>(null);
  const [selected, setSelected] = useState<AssetRow | null>(null);
  // A preview belongs to its tab: it ends when the page's tab hides this register.
  useEndOnHide(() => setSelected(null));
  // The control that opened the dialog; it takes focus back when the dialog closes.
  const opener = useRef<HTMLElement | null>(null);
  const collection = useServerCollection<AssetRow>(assetRead, {
    columns: assetColumns,
    preview: useMemo(
      () => ({ onPreview: setSelected, activeId: selected?.id ?? null }),
      [selected?.id],
    ),
    label: "system assets",
    view: registerViews.systemAssets,
    resizable: true,
    reorderable: true,
  });
  const { table } = collection;
  const displayed = useDisplayedRecords(table);
  // The preview reads the page's record, so a saved asset shows as it is now.
  const current = selected && (displayed.find((row) => row.id === selected.id) ?? selected);
  // The role says whether the reader may write; the form loads the schema it needs as it opens.
  const canAdd = workspace.role !== "viewer";
  const addLabel = productCreateLabel("inventory_items");
  const open = (next: AssetRow | "new") => {
    opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setEditing(next);
  };
  const close = (then?: () => void) => {
    setEditing(null);
    const back = opener.current;
    opener.current = null;
    requestAnimationFrame(() => {
      if (back?.isConnected) back.focus();
      // A preview opened after a save starts from the opener, so closing it comes back there.
      then?.();
    });
  };
  const add = (size: "small" | "medium") =>
    canAdd ? (
      <Button size={size} variant="primary" iconBefore={<Plus />} onClick={() => open("new")}>
        {addLabel}
      </Button>
    ) : undefined;
  return (
    <>
      {editing && (
        <EntityEditor
          key={editing === "new" ? "new" : editing.id}
          table="inventory_items"
          existing={editing === "new" ? undefined : (editing as unknown as DataRecord)}
          operationLabel={editing === "new" ? addLabel : undefined}
          onSaved={(row) => close(() => setSelected(row as unknown as AssetRow))}
          onCancel={() => close()}
        />
      )}
      {current && (
        <RecordPreviewPanel
          title={current.name}
          label="Inventory item preview"
          defaultWidth={560}
          onClose={() => setSelected(null)}
          recordActions={
            canAdd && (
              <Button size="small" variant="primary" onClick={() => open(current)}>
                Edit {productRecordNoun("inventory_items")}
              </Button>
            )
          }
          navigation={
            <RecordPreviewActions
              table="inventory_items"
              record={current}
              rows={displayed}
              onSelect={setSelected}
            />
          }
        >
          <ModelFacts
            record={current as unknown as DataRecord}
            fields={assetFacts}
            table="inventory_items"
          />
        </RecordPreviewPanel>
      )}
      <ProductCollection
        {...collection}
        fill
        noun={assetNoun}
        onRowClick={(row) => openRecord("inventory_items", row, () => setSelected(row))}
        searchLabel="Find system assets"
        action={add("small")}
        empty={{
          illustration: "records",
          title: "No system assets yet",
          description: canAdd
            ? "An asset is a hardware or software item in a system's inventory."
            : "Nothing has been recorded here yet.",
          icon: <FileText />,
          action: add("medium"),
        }}
      />
    </>
  );
}
