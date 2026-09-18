import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Button, PageHeader, Shell, Stack, TextLink } from "@ledger/design-system";
import { Plus } from "lucide-react";
import { useRows } from "@/lib/models";
import { useWorkspace } from "@/components/app/workspace";
import { RecordPreviewActions, RecordPreviewPanel } from "@/components/prototype/record-preview";
import { productCreateLabel } from "@/lib/product-records";
import type { DataRecord } from "@/lib/records";
import {
  EntityEditor,
  ModelFacts,
  ModelTable,
  QueryState,
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
  return (
    <Stack space="space.200">
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
      <QueryState query={query}>
        <QueryState query={components}>
          <ModelTable
            model="parties"
            selectedId={preview?.id}
            onDisplayedRowsChange={setDisplayed}
            fill
            rows={(query.data ?? []) as DataRecord[]}
            columns={[
              { key: "name", label: "Organization" },
              { key: "email", label: "Contact email" },
              {
                key: "components",
                label: "Supplied components",
                render: (row) =>
                  components.data?.filter((component) => component.supplier_party_id === row.id)
                    .length,
              },
            ]}
            onPreview={setPreview}
            searchLabel="Search organizations"
            view="supplier-registry"
            empty={{
              illustration: "people",
              title: "No organizations yet",
              description:
                "Record supplier organizations, then connect them to actual component definitions. No assurance status or vendor risk score is inferred.",
              action:
                workspace.role !== "viewer" ? (
                  <Button variant="primary" iconBefore={<Plus />} onClick={() => setEditing("new")}>
                    {productCreateLabel("parties", { party_type: "organization" })}
                  </Button>
                ) : undefined,
            }}
            actions={
              workspace.role !== "viewer" && (
                <Button
                  size="small"
                  variant="primary"
                  iconBefore={<Plus />}
                  onClick={() => setEditing("new")}
                >
                  {productCreateLabel("parties", { party_type: "organization" })}
                </Button>
              )
            }
          />
        </QueryState>
      </QueryState>
      {preview && (
        <RecordPreviewPanel
          title={String(preview["name"])}
          label="Supplier preview"
          defaultWidth={560}
          onClose={() => setPreview(null)}
          recordActions={
            <Button size="small" variant="primary" onClick={() => setEditing(preview)}>
              Edit organization
            </Button>
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
          <Stack space="space.200">
            <ModelFacts record={preview} fields={["name", "email"]} />
          </Stack>
        </RecordPreviewPanel>
      )}
    </Stack>
  );
}
