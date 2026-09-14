import { useState, type ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Button,
  Inline,
  Inspector,
  KeyValue,
  PageHeader,
  Shell,
  Stack,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  TextLink,
} from "@ledger/design-system";
import { Pencil } from "lucide-react";
import { useRow, useRows } from "@/lib/models";
import type { SystemElement } from "@/lib/system-tree";
import { displayValue, labelFor, type DataRecord } from "@/lib/records";
import { useWorkspace } from "@/components/app/workspace";
import { ControlInspector } from "@/components/prototype/library-controls";
import { ProgramSystemsTree } from "./program-systems-tree";
import { SystemElementDialog } from "./system-element-dialog";
import { SystemBaseline } from "./system-baseline";
import { SspAssembly } from "./ssp-assembly";
import {
  ProgramCollection,
  ProgramEditor,
  ProgramQueryState,
  StatusValue,
  type ProgramTableName,
} from "./program-shared";

function ProgramRecordFrame({
  programId,
  table,
  row,
  title,
  children,
  facts,
  readOnly = false,
  renderEditor,
}: {
  programId: string;
  table: ProgramTableName;
  row: DataRecord;
  title: string;
  children: ReactNode;
  facts: string[];
  readOnly?: boolean;
  renderEditor?: ((onClose: () => void) => ReactNode) | undefined;
}) {
  const program = useRow("programs", programId);
  const workspace = useWorkspace();
  const [editing, setEditing] = useState(false);
  return (
    <>
      <Stack space="space.250">
        <PageHeader>
          <PageHeader.Lead render={<Breadcrumb />}>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink render={<Link to="/programs" />}>Programs</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink render={<Link to="/programs/$programId" params={{ programId }} />}>
                  {program.data?.code ?? "Program"}
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{title}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </PageHeader.Lead>
          <div>
            <PageHeader.Title>{title}</PageHeader.Title>
          </div>
          <PageHeader.Actions>
            {!readOnly &&
              !editing &&
              workspace.role !== "viewer" &&
              row["state"] !== "published" && (
                <Button
                  variant="secondary"
                  iconBefore={<Pencil />}
                  onClick={() => setEditing((value) => !value)}
                >
                  {editing ? "Close editor" : "Edit record"}
                </Button>
              )}
          </PageHeader.Actions>
        </PageHeader>
        {children}
        {editing &&
          (renderEditor ? (
            renderEditor(() => setEditing(false))
          ) : (
            <ProgramEditor table={table} existing={row} onClose={() => setEditing(false)} />
          ))}
      </Stack>
      <Shell.Aside label="Record properties">
        <Inspector.Group title="Properties">
          {facts.map((field) => (
            <KeyValue key={field} label={labelFor(field)} wrap>
              {["status", "state", "authorization_status", "lifecycle_status"].includes(field) ? (
                <StatusValue value={row[field]} />
              ) : (
                displayValue(row[field])
              )}
            </KeyValue>
          ))}
        </Inspector.Group>
      </Shell.Aside>
    </>
  );
}
export function ProgramSystemRecord({
  programId,
  systemId,
}: {
  programId: string;
  systemId: string;
}) {
  const query = useRow("systems", systemId);
  const componentLinks = useRows("system_component_element_links", { system_id: systemId });
  const navigate = useNavigate();
  const [tab, setTab] = useState("Overview");
  if (query.isPending || query.error)
    return <ProgramQueryState loading={query.isPending} error={query.error} />;
  if (!query.data || query.data.program_id !== programId)
    return <p role="alert">System not found in this program.</p>;
  const system = query.data as SystemElement;
  const filters = { system_id: system.id };
  return (
    <ProgramRecordFrame
      programId={programId}
      table="systems"
      row={system as DataRecord}
      title={system.name}
      renderEditor={(onClose) => (
        <SystemElementDialog programId={programId} existing={system} onClose={onClose} />
      )}
      facts={
        system.is_authorization_boundary
          ? [
              "code",
              "system_type",
              "lifecycle_status",
              "authorization_status",
              "confidentiality_impact",
              "integrity_impact",
              "availability_impact",
            ]
          : ["code", "system_type"]
      }
    >
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList variant="line">
          {(system.is_authorization_boundary
            ? [
                "Overview",
                "Composition",
                "Components",
                "Inventory",
                "Scopes",
                "Baseline",
                "Security plans",
                "SSP",
              ]
            : ["Overview", "Composition", "Baseline"]
          ).map((value) => (
            <TabsTrigger key={value} value={value}>
              {value}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value={tab}>
          <Stack space="space.250" className="pt-200">
            {tab === "Overview" && (
              <>
                <p className="whitespace-pre-wrap text-subtle">
                  {system.description ?? "No system description recorded."}
                </p>
                {system.is_authorization_boundary && (
                  <Inline space="space.200">
                    <StatusValue value={system.lifecycle_status} />
                    <StatusValue value={system.authorization_status} />
                  </Inline>
                )}
                {system.parent_system_id && (
                  <TextLink
                    render={
                      <Link
                        to="/programs/$programId/systems/$scopeId"
                        params={{ programId, scopeId: system.parent_system_id }}
                      />
                    }
                  >
                    Open parent system
                  </TextLink>
                )}
                {!system.is_authorization_boundary && (
                  <TextLink
                    render={
                      <Link
                        to="/programs/$programId/systems/$scopeId"
                        params={{ programId, scopeId: system.boundary_system_id }}
                      />
                    }
                  >
                    Open authorization boundary
                  </TextLink>
                )}
                <p className="font-body-small text-subtle">
                  {system.is_authorization_boundary
                    ? "Record composition and categorization before selecting an SSP baseline. Authorization is tracked separately from implementation and assessment."
                    : "This system element contributes within its recorded authorization boundary. Its allocated requirements remain explicit."}
                </p>
              </>
            )}
            {tab === "Composition" && (
              <ProgramSystemsTree programId={programId} rootElementId={system.id} />
            )}
            {tab === "Components" && (
              <ProgramCollection
                name="system_components"
                title="Recorded component references"
                description="Existing implementation references point to elements in the system tree."
                filters={filters}
                columns={[
                  { key: "code", title: "Component" },
                  { key: "name", title: "Name" },
                  { key: "component_type", title: "Type" },
                  { key: "status", title: "Status" },
                ]}
                canCreate={false}
                readOnly
                onSelect={(row) => {
                  const elementId = componentLinks.data?.find(
                    (link) => link.id === row.id,
                  )?.system_element_id;
                  if (elementId)
                    void navigate({
                      to: "/programs/$programId/systems/$scopeId",
                      params: { programId, scopeId: elementId },
                    });
                  else
                    void navigate({
                      to: "/programs/$programId/components/$componentId",
                      params: { programId, componentId: row.id },
                    });
                }}
              />
            )}
            {tab === "Inventory" && (
              <ProgramCollection
                name="inventory_items"
                title="Deployed inventory"
                filters={filters}
                columns={[
                  { key: "asset_id", title: "Asset" },
                  { key: "name", title: "Name" },
                  { key: "manufacturer", title: "Manufacturer" },
                  { key: "model", title: "Model" },
                  { key: "serial_number", title: "Serial number" },
                ]}
                createLabel="Add inventory item"
              />
            )}
            {tab === "Scopes" && (
              <ProgramCollection
                name="scopes"
                title="Assessment scopes"
                filters={filters}
                columns={[
                  { key: "code", title: "Scope" },
                  { key: "name", title: "Name" },
                  { key: "confidentiality_impact", title: "Confidentiality" },
                  { key: "integrity_impact", title: "Integrity" },
                  { key: "availability_impact", title: "Availability" },
                ]}
                createLabel="Add scope"
              />
            )}
            {tab === "Baseline" && (
              <>
                <SystemBaseline systemId={system.id} />
                {system.is_authorization_boundary && (
                  <ProgramCollection
                    name="configuration_baselines"
                    title="Configuration baselines"
                    filters={filters}
                    columns={[
                      { key: "name", title: "Baseline" },
                      { key: "version_number", title: "Version" },
                      { key: "state", title: "State" },
                    ]}
                    createLabel="Add baseline"
                  />
                )}
              </>
            )}
            {tab === "Security plans" && (
              <ProgramCollection
                name="ssp_revisions"
                title="Security plan revisions"
                filters={filters}
                columns={[
                  { key: "version_number", title: "Version" },
                  { key: "state", title: "State" },
                  { key: "description", title: "Description" },
                ]}
                createLabel="Add SSP revision"
              />
            )}
            {tab === "SSP" && system.is_authorization_boundary && (
              <SspAssembly programId={programId} systemId={system.id} />
            )}
          </Stack>
        </TabsContent>
      </Tabs>
    </ProgramRecordFrame>
  );
}
export function ProgramComponentRecord({
  programId,
  componentId,
}: {
  programId: string;
  componentId: string;
}) {
  const component = useRow("system_components", componentId);
  const element = useRow("system_component_element_links", componentId);
  const system = useRow("systems", component.data?.system_id);
  if (
    component.isPending ||
    (component.data && system.isPending) ||
    component.error ||
    system.error
  )
    return (
      <ProgramQueryState
        loading={component.isPending || system.isPending}
        error={component.error ?? system.error}
      />
    );
  if (!component.data || system.data?.program_id !== programId)
    return <p role="alert">Component not found in this program.</p>;
  return (
    <ProgramRecordFrame
      programId={programId}
      table="system_components"
      row={component.data as DataRecord}
      title={component.data.name}
      readOnly
      facts={["code", "component_type", "version", "status"]}
    >
      <p className="whitespace-pre-wrap text-subtle">
        {component.data.description ?? "No component description recorded."}
      </p>
      {element.data?.system_element_id && (
        <TextLink
          render={
            <Link
              to="/programs/$programId/systems/$scopeId"
              params={{ programId, scopeId: element.data.system_element_id }}
            />
          }
        >
          Open system element
        </TextLink>
      )}
      <TextLink
        render={
          <Link
            to="/programs/$programId/systems/$scopeId"
            params={{ programId, scopeId: system.data.id }}
          />
        }
      >
        {system.data.name}
      </TextLink>
      <ProgramCollection
        name="component_contributions"
        title="Control contributions"
        filters={{ system_component_id: componentId }}
        columns={[
          { key: "description", title: "Contribution" },
          {
            key: "implementation_status",
            title: "Implementation",
            render: (row) => <StatusValue value={row["implementation_status"]} />,
          },
        ]}
        createLabel="Add contribution"
      />
    </ProgramRecordFrame>
  );
}
export { ProgramRequirementRecord } from "./requirement-record";

export function ProgramControlRecord({
  programId,
  implementationId,
}: {
  programId: string;
  implementationId: string;
}) {
  const implementation = useRow("implemented_requirements", implementationId);
  const plan = useRow("ssp_revisions", implementation.data?.ssp_revision_id);
  const system = useRow("systems", plan.data?.system_id);
  const selected = useRow("selected_controls", implementation.data?.selected_control_id);
  const control = useRow("controls", selected.data?.control_id);
  const [showSource, setShowSource] = useState(false);
  const pending =
    implementation.isPending ||
    (implementation.data &&
      (plan.isPending || system.isPending || selected.isPending || control.isPending));
  const error =
    implementation.error ?? plan.error ?? system.error ?? selected.error ?? control.error;
  if (pending || error) return <ProgramQueryState loading={!!pending} error={error} />;
  if (!implementation.data || system.data?.program_id !== programId)
    return <p role="alert">Control implementation not found in this program.</p>;
  const row = implementation.data;
  return (
    <ProgramRecordFrame
      programId={programId}
      table="implemented_requirements"
      readOnly={plan.data?.state === "published"}
      row={row as DataRecord}
      title={
        control.data ? `${control.data.code} · ${control.data.title}` : "Control implementation"
      }
      facts={["implementation_status", "not_applicable_rationale", "updated_at"]}
    >
      <p className="whitespace-pre-wrap text-subtle">
        {row.description ?? "No implementation narrative recorded."}
      </p>
      {control.data && (
        <Button variant="secondary" onClick={() => setShowSource(true)}>
          Read control and assessment objectives
        </Button>
      )}
      <ProgramCollection
        name="implementation_statements"
        title="Statement implementations"
        filters={{ implemented_requirement_id: row.id }}
        initialValues={{ ssp_revision_id: row.ssp_revision_id }}
        columns={[
          { key: "description", title: "Implementation narrative" },
          { key: "updated_at", title: "Updated" },
        ]}
        canCreate={plan.data?.state === "draft"}
        readOnly={plan.data?.state === "published"}
        createLabel="Add statement implementation"
      />
      <ProgramCollection
        name="component_contributions"
        title="Component contributions"
        filters={{ implemented_requirement_id: row.id }}
        initialValues={{ ssp_revision_id: row.ssp_revision_id }}
        columns={[
          { key: "description", title: "Contribution" },
          {
            key: "implementation_status",
            title: "Implementation",
            render: (item) => <StatusValue value={item["implementation_status"]} />,
          },
        ]}
        canCreate={plan.data?.state === "draft"}
        readOnly={plan.data?.state === "published"}
        createLabel="Add component contribution"
      />
      {showSource && control.data && (
        <ControlInspector control={control.data} onClose={() => setShowSource(false)} />
      )}
    </ProgramRecordFrame>
  );
}
