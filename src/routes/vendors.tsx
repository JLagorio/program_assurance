import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Button, PageHeader } from "@ledger/design-system";
import { Plus } from "lucide-react";
import { useRows } from "@/lib/models";
import { Page } from "@/components/app/shell";
import { useWorkspace } from "@/components/app/workspace";
import { RecordPreviewActions, RecordPreviewPanel } from "@/components/prototype/record-preview";
import { productCreateLabel } from "@/lib/product-records";
import type { DataRecord } from "@/lib/records";
import {
  EntityEditor,
  ModelFacts,
  ModelTable,
  type DisplayColumn,
} from "@/components/prototype/record-tools";
export const Route = createFileRoute("/vendors")({
  component: Suppliers,
  head: () => ({ meta: [{ title: "Suppliers — Program Assurance" }] }),
});
function Suppliers() {
  const workspace = useWorkspace(),
    query = useRows("parties", { party_type: "organization" }),
    components = useRows("defined_components");
  const [editing, setEditing] = useState<DataRecord | "new" | null>(null),
    [preview, setPreview] = useState<DataRecord | null>(null);
  const [displayed, setDisplayed] = useState<DataRecord[]>([]);
  const canEdit = workspace.role !== "viewer";
  const createLabel = productCreateLabel("parties", { party_type: "organization" });
  // A trigger stays enabled while its dialog is open; a second press opens nothing new.
  const edit = (target: DataRecord | "new") => setEditing((current) => current ?? target);
  const columns: DisplayColumn[] = [
    { key: "name", label: "Organization" },
    { key: "email", label: "Contact email" },
    {
      key: "components",
      label: "Supplied components",
      kind: "number",
      width: 190,
      // The count joins the row, so it sorts, searches and exports with the rest.
      value: (row) =>
        components.data?.filter((component) => component.supplier_party_id === row.id).length ?? 0,
    },
  ];
  return (
    <Page>
      <PageHeader>
        <PageHeader.Heading>
          <PageHeader.Title>Suppliers</PageHeader.Title>
        </PageHeader.Heading>
      </PageHeader>
      {editing && (
        <EntityEditor
          table="parties"
          existing={editing === "new" ? undefined : editing}
          initialValues={{ party_type: "organization" }}
          onCancel={() => setEditing(null)}
        />
      )}
      <ModelTable
        model="parties"
        queries={[query, components]}
        selectedId={preview?.id}
        onDisplayedRowsChange={setDisplayed}
        fill
        rows={(query.data ?? []) as DataRecord[]}
        columns={columns}
        onPreview={setPreview}
        searchLabel="Search organizations"
        noun={{ one: "organization", other: "organizations" }}
        view="supplier-registry"
        empty={{
          illustration: "people",
          title: "No organizations yet",
          description:
            "Record supplier organizations, then connect them to actual component definitions. No assurance status or vendor risk score is inferred.",
          action: canEdit ? (
            <Button variant="primary" iconBefore={<Plus />} onClick={() => edit("new")}>
              {createLabel}
            </Button>
          ) : undefined,
        }}
        actions={
          canEdit ? (
            <Button
              size="small"
              variant="primary"
              iconBefore={<Plus />}
              onClick={() => edit("new")}
            >
              {createLabel}
            </Button>
          ) : undefined
        }
      />
      {preview && (
        <RecordPreviewPanel
          title={String(preview["name"])}
          label="Organization preview"
          defaultWidth={560}
          onClose={() => setPreview(null)}
          recordActions={
            canEdit ? (
              <Button size="small" variant="primary" onClick={() => edit(preview)}>
                Edit organization
              </Button>
            ) : undefined
          }
          navigation={
            <RecordPreviewActions
              table="parties"
              record={preview}
              rows={displayed}
              onSelect={setPreview}
            />
          }
        >
          <ModelFacts
            table="parties"
            record={preview}
            // The facts use the column's words; a long label widens the label column.
            fields={columns.slice(1)}
          />
        </RecordPreviewPanel>
      )}
    </Page>
  );
}
