import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Button, PageHeader, Shell, Stack, TextLink } from "@ledger/design-system";
import { Plus } from "lucide-react";
import { useRows } from "@/lib/models";
import { useWorkspace } from "@/components/app/workspace";
import type { DataRecord } from "@/lib/records";
import {
  EntityEditor,
  ModelFacts,
  ModelTable,
  QueryState,
} from "@/components/prototype/record-tools";
export const Route = createFileRoute("/vendors")({ component: Suppliers });
function Suppliers() {
  const workspace = useWorkspace(),
    query = useRows("parties", { party_type: "organization" }),
    components = useRows("defined_components");
  const [editing, setEditing] = useState<DataRecord | "new" | null>(null),
    [preview, setPreview] = useState<DataRecord | null>(null);
  return (
    <Stack space="space.200">
      <PageHeader>
        <PageHeader.Title>Supplier registry</PageHeader.Title>
        <PageHeader.Description>
          Organization records and the component definitions they supply.
        </PageHeader.Description>
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
            onOpen={setPreview}
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
                    Add organization
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
                  Add organization
                </Button>
              )
            }
          />
        </QueryState>
      </QueryState>
      {preview && (
        <Shell.Panel title={String(preview["name"])} onClose={() => setPreview(null)}>
          <Stack space="space.200">
            <ModelFacts record={preview} fields={["name", "email"]} />
            <Button onClick={() => setEditing(preview)}>Edit organization</Button>
            <TextLink render={<Link to="/library/components" />}>
              Review supplied component definitions
            </TextLink>
          </Stack>
        </Shell.Panel>
      )}
    </Stack>
  );
}
