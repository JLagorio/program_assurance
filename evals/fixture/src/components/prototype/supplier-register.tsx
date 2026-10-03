import {
  Badge,
  Button,
  DataTable,
  PageHeader,
  Stack,
  Toolbar,
  defineColumns,
  useDataTable,
} from "@ledger/design-system";
import { Plus } from "lucide-react";
import { useState } from "react";

/** A supplier as the register shows it. The caller loads the rows; the screen never invents them. */
export type Supplier = {
  id: string;
  name: string;
  status: "active" | "on-hold";
  /** When the supplier was last reviewed, as an ISO date; null when it never was. */
  reviewedAt: string | null;
};

const columns = defineColumns<Supplier>((c) => [
  c.text("name", { header: "Supplier", minWidth: 200, priority: 0, hideable: false }),
  c.text("status", {
    header: "Status",
    width: 120,
    priority: 1,
    cell: (row) =>
      row.status === "active" ? (
        <Badge tone="success">Active</Badge>
      ) : (
        <Badge tone="warning">On hold</Badge>
      ),
  }),
  c.date("reviewedAt", { header: "Last review", priority: 2 }),
]);

/**
 * A standalone register: one page header with the name, then a frameless table that fills the
 * window. The toolbar carries the search and the one small primary; the empty state repeats it.
 */
export function SupplierRegister({
  suppliers,
  onCreate,
}: {
  suppliers: Supplier[];
  onCreate: () => void;
}) {
  const [search, setSearch] = useState("");
  const table = useDataTable({
    columns,
    data: suppliers,
    getRowId: (row) => row.id,
    label: "Suppliers",
  });
  const create = (
    <Button variant="primary" size="small" iconBefore={<Plus />} onClick={onCreate}>
      Create organization
    </Button>
  );
  return (
    <Stack space="space.150">
      <PageHeader>
        <PageHeader.Heading>
          <PageHeader.Title>Suppliers</PageHeader.Title>
        </PageHeader.Heading>
      </PageHeader>
      <DataTable
        responsive
        fill
        table={table}
        empty={{
          illustration: "records",
          title: "No suppliers yet",
          description: "Create an organization to start the supplier register.",
          action: create,
        }}
        toolbar={
          <Toolbar
            search={search}
            onSearch={(value) => {
              setSearch(value);
              table.setGlobalFilter(value);
            }}
            placeholder="Find a supplier"
            actions={create}
          />
        }
      />
    </Stack>
  );
}
