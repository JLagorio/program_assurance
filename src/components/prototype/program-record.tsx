import { productRecordNoun } from "@/lib/product-records";
import { EmptyMessage, MissingRecord, type QueryStatus } from "./work-common";
import { Fragment, useState, type ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Absent,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  Badge,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Button,
  Id,
  Inline,
  Inspector,
  KeyValue,
  PageHeader,
  Section,
  Shell,
  Stack,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  TextLink,
} from "@ledger/design-system";
import { Library, Pencil, Plus } from "lucide-react";
import { useRow, useRows } from "@/lib/models";
import { useProductLookup } from "@/lib/product-items";
import type { SystemElement } from "@/lib/system-tree";
import { displayValue, labelFor, type DataRecord } from "@/lib/records";
import type { SystemAssuranceRow } from "@/lib/system-assurance";
import { useWorkspace } from "@/components/app/workspace";
import { ControlInspector } from "@/components/prototype/library-controls";
import { ProgramSystemsTree } from "./program-systems-tree";
import { SystemElementDialog } from "./system-element-dialog";
import { SystemControls } from "./system-baseline";
import { SystemRequirements } from "./system-requirements";
import { SystemLibrary } from "./system-library";
import { SystemEvidence } from "./system-evidence";
import { AddFromLibrary } from "./add-from-library";
import {
  ImpactBadge,
  ancestorElements,
  impactDimensions,
  impactProvenance,
} from "./system-assurance-details";
import { useSystemAssurance } from "./use-system-assurance";
import { RelationName } from "./record-tools";
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
  facts = [],
  readOnly = false,
  renderEditor,
  trail,
  actions,
  properties,
  showProperties = true,
}: {
  programId: string;
  table: ProgramTableName;
  row: DataRecord;
  title: string;
  children: ReactNode;
  /** Rail facts drawn generically from the row; `properties` replaces them. */
  facts?: string[];
  readOnly?: boolean;
  renderEditor?: ((onClose: () => void) => ReactNode) | undefined;
  /** Crumbs between the program and this record: the containing elements. */
  trail?: ReactNode;
  /** Header actions beside Edit. */
  actions?: ReactNode;
  /** The rail's Properties group, composed by the record. */
  properties?: ReactNode;
  showProperties?: boolean;
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
                  {program.data?.name ?? "Program"}
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              {trail}
              <BreadcrumbItem>
                <BreadcrumbPage>{title}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </PageHeader.Lead>
          <PageHeader.Heading>
            <PageHeader.Title>{title}</PageHeader.Title>
          </PageHeader.Heading>
          <PageHeader.Actions>
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button>Actions</Button>} />
              <DropdownMenuContent align="end">
                {actions}
                <DropdownMenuItem
                  render={
                    <Link
                      to="/records/$collection/$recordId"
                      params={{ collection: table, recordId: row.id }}
                    />
                  }
                >
                  Inspect record
                </DropdownMenuItem>
                {!readOnly &&
                  !editing &&
                  workspace.role !== "viewer" &&
                  row["state"] !== "published" && (
                    <DropdownMenuItem onClick={() => setEditing((value) => !value)}>
                      {`Edit ${productRecordNoun(table, row)}`}
                    </DropdownMenuItem>
                  )}
              </DropdownMenuContent>
            </DropdownMenu>
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
      {showProperties && (
        <Shell.Aside label="Record details">
          <Inspector.Group title="Details">
            {properties ??
              facts.map((field) => (
                <KeyValue key={field} label={labelFor(field)} wrap>
                  {["status", "state", "authorization_status", "lifecycle_status"].includes(
                    field,
                  ) ? (
                    <StatusValue value={row[field]} />
                  ) : row[field] == null || row[field] === "" ? (
                    <Absent />
                  ) : (
                    displayValue(row[field])
                  )}
                </KeyValue>
              ))}
          </Inspector.Group>
        </Shell.Aside>
      )}
    </>
  );
}
export const SYSTEM_TABS = [
  "Overview",
  "Controls",
  "Requirements",
  "Library",
  "Evidence",
  "Inventory",
  "SSP",
] as const;
export type SystemTab = (typeof SYSTEM_TABS)[number];
/** The tab in the URL; the retired tab names land where their content went. */
export function systemTab(value: unknown): SystemTab | undefined {
  const retired: Record<string, SystemTab> = {
    Composition: "Overview",
    Baseline: "Controls",
    Components: "Library",
    "Security plans": "SSP",
  };
  return SYSTEM_TABS.find((tab) => tab === value) ?? retired[String(value)];
}
/** One anatomy at every level of the tree; the SSP is the only boundary-only tab. */
export function ProgramSystemRecord({
  programId,
  systemId,
  tab,
  onTabChange,
}: {
  programId: string;
  systemId: string;
  tab?: SystemTab | undefined;
  onTabChange?: ((tab: SystemTab) => void) | undefined;
}) {
  const workspace = useWorkspace();
  const query = useRow("systems", systemId);
  const assurance = useSystemAssurance(programId);
  const [localTab, setLocalTab] = useState<SystemTab>("Overview");
  const [addingChild, setAddingChild] = useState(false);
  const [addingLibrary, setAddingLibrary] = useState<{
    controlId?: string;
    source?: "component" | "profile" | "requirement";
  } | null>(null);
  if (query.data === undefined && (query.isPending || query.error))
    return <ProgramQueryState queries={[query]} />;
  if (!query.data || query.data.program_id !== programId)
    return (
      <MissingRecord
        backTo="/programs"
        kind="System"
        description="This record is unavailable in this program."
      />
    );
  const system = query.data as SystemElement;
  const row = assurance.rows.find((element) => element.id === system.id);
  const boundary = system.is_authorization_boundary;
  const requested = tab ?? localTab;
  const current: SystemTab = requested === "SSP" && !boundary ? "Overview" : requested;
  const select = (next: SystemTab) => {
    setLocalTab(next);
    onTabChange?.(next);
  };
  const tabs = SYSTEM_TABS.filter((name) => name !== "SSP" || boundary);
  const canCreate =
    workspace.role !== "viewer" &&
    !!workspace.collections.find((item) => item.name === "systems")?.can_insert;
  const ancestors = row ? ancestorElements(row, assurance.rows) : [];
  return (
    <ProgramRecordFrame
      programId={programId}
      table="systems"
      row={system as DataRecord}
      title={system.name}
      showProperties={current === "Overview"}
      trail={ancestors.map((ancestor) => (
        <Fragment key={ancestor.id}>
          <BreadcrumbItem>
            <BreadcrumbLink
              render={
                <Link
                  to="/programs/$programId/systems/$scopeId"
                  params={{ programId, scopeId: ancestor.id }}
                />
              }
            >
              {ancestor.name}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
        </Fragment>
      ))}
      actions={
        <>
          {workspace.role !== "viewer" && row && (
            <DropdownMenuItem onClick={() => setAddingLibrary({})}>
              Add from library
            </DropdownMenuItem>
          )}
          {canCreate && (
            <DropdownMenuItem onClick={() => setAddingChild(true)}>Create system</DropdownMenuItem>
          )}
        </>
      }
      properties={
        <SystemProperties
          programId={programId}
          system={system}
          row={row}
          queries={assurance.queries}
        />
      }
      renderEditor={(onClose) => (
        <SystemElementDialog programId={programId} existing={system} onClose={onClose} />
      )}
    >
      <ProgramQueryState queries={[query]} />
      <Tabs value={current} onValueChange={(value) => select(systemTab(value) ?? "Overview")}>
        <TabsList variant="line" aria-label="Element sections">
          {tabs.map((value) => (
            <TabsTrigger key={value} value={value}>
              {value}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value={current}>
          <Stack space="space.250" className="pt-200">
            {current === "Overview" && (
              <ProgramSystemsTree programId={programId} rootElementId={system.id} />
            )}
            {current === "Controls" && (
              <SystemControls
                systemId={system.id}
                onAddFromLibrary={(controlId) => setAddingLibrary({ controlId })}
              />
            )}
            {current === "Requirements" && (
              <SystemRequirements
                programId={programId}
                systemId={system.id}
                rows={assurance.rows}
                onAddFromLibrary={() => setAddingLibrary({ source: "requirement" })}
              />
            )}
            {current === "Library" &&
              (row ? (
                <SystemLibrary
                  programId={programId}
                  element={row}
                  rows={assurance.rows}
                  onAddFromLibrary={() => setAddingLibrary({})}
                />
              ) : (
                <ProgramQueryState queries={assurance.queries} />
              ))}
            {current === "Evidence" &&
              (row ? (
                <SystemEvidence programId={programId} element={row} rows={assurance.rows} />
              ) : (
                <ProgramQueryState queries={assurance.queries} />
              ))}
            {current === "Inventory" && (
              <ProgramCollection
                name="inventory_items"
                fill
                title="Deployed inventory"
                filters={boundary ? { system_id: system.id } : { composition_node_id: system.id }}
                initialValues={{
                  system_id: system.boundary_system_id,
                  composition_node_id: boundary ? null : system.id,
                }}
                columns={[
                  { key: "asset_id", title: "Asset" },
                  { key: "name", title: "Name" },
                  { key: "manufacturer", title: "Manufacturer" },
                  { key: "model", title: "Model" },
                  { key: "serial_number", title: "Serial number" },
                ]}
              />
            )}
            {current === "SSP" && boundary && (
              <>
                <SspAssembly programId={programId} systemId={system.id} />
                <ProgramCollection
                  name="ssp_revisions"
                  section
                  title="Security plan revisions"
                  filters={{ system_id: system.id }}
                  columns={[
                    { key: "version_number", title: "Version" },
                    { key: "state", title: "State" },
                    { key: "description", title: "Description" },
                  ]}
                />
              </>
            )}
          </Stack>
        </TabsContent>
      </Tabs>
      {addingChild && (
        <SystemElementDialog
          programId={programId}
          parent={system}
          onClose={() => setAddingChild(false)}
        />
      )}
      {addingLibrary && row && (
        <AddFromLibrary
          programId={programId}
          element={row}
          rows={assurance.rows}
          controlId={addingLibrary.controlId}
          initialSource={addingLibrary.source}
          onClose={() => setAddingLibrary(null)}
        />
      )}
    </ProgramRecordFrame>
  );
}

/** The rail: facts as badges and links, never enum values. */
function SystemProperties({
  programId,
  system,
  row,
  queries,
}: {
  programId: string;
  system: SystemElement;
  row: SystemAssuranceRow | undefined;
  queries: QueryStatus[];
}) {
  const width = 112;
  const products = useProductLookup();
  const variant = system.product_revision_id ? products.variant(system) : null;
  const productElement = system.product_element_id ? products.element(system) : null;
  return (
    <ProgramQueryState queries={[...queries, ...products.queries]}>
      <KeyValue label="Code" labelWidth={width} wrap>
        <Id>{system.code}</Id>
      </KeyValue>
      <KeyValue label="Description" labelWidth={width} wrap>
        <span className="whitespace-pre-wrap">{system.description || <Absent />}</span>
      </KeyValue>
      {system.product_revision_id && system.is_authorization_boundary && (
        <KeyValue label="Product" labelWidth={width} wrap>
          {variant ? (
            <TextLink
              render={
                <Link
                  to="/library/products/$productKey"
                  params={{ productKey: variant.product.id }}
                  search={{ version: variant.revision.id }}
                />
              }
            >
              {variant.label}
            </TextLink>
          ) : (
            <Absent />
          )}
        </KeyValue>
      )}
      {system.product_element_id && (
        <KeyValue label="Product element" labelWidth={width} wrap>
          {productElement ? (
            <TextLink
              render={
                <Link
                  to="/library/products/$productKey"
                  params={{ productKey: productElement.product.id }}
                  search={{ version: productElement.revision.id }}
                />
              }
            >
              {productElement.label}
            </TextLink>
          ) : (
            <Absent />
          )}
        </KeyValue>
      )}
      <KeyValue label="Type" labelWidth={width} wrap>
        {labelFor(system.system_type)}
      </KeyValue>
      {impactDimensions.map((dimension) => (
        <KeyValue key={dimension} label={labelFor(dimension)} labelWidth={width} wrap>
          {row ? (
            <Inline space="space.075" alignBlock="center" shouldWrap>
              <ImpactBadge
                value={row.impacts[dimension].value}
                mixed={row.impacts[dimension].source === "mixed"}
              />
              <span className="font-body-xsmall text-subtle">
                {impactProvenance(row, dimension)}
              </span>
            </Inline>
          ) : (
            <Absent />
          )}
        </KeyValue>
      ))}
      <KeyValue label="Owner" labelWidth={width} wrap>
        {system.system_owner_party_id ? (
          <RelationName table="parties" id={system.system_owner_party_id} />
        ) : (
          <Absent />
        )}
      </KeyValue>
      {!system.is_authorization_boundary && (
        <KeyValue label="Boundary" labelWidth={width} wrap>
          <TextLink
            render={
              <Link
                to="/programs/$programId/systems/$scopeId"
                params={{ programId, scopeId: system.boundary_system_id }}
              />
            }
          >
            <RelationName table="systems" id={system.boundary_system_id} />
          </TextLink>
        </KeyValue>
      )}
      {system.parent_system_id && (
        <KeyValue label="Parent" labelWidth={width} wrap>
          <TextLink
            render={
              <Link
                to="/programs/$programId/systems/$scopeId"
                params={{ programId, scopeId: system.parent_system_id }}
              />
            }
          >
            <RelationName table="systems" id={system.parent_system_id} />
          </TextLink>
        </KeyValue>
      )}
      {system.is_authorization_boundary && (
        <>
          <KeyValue label="Lifecycle" labelWidth={width} wrap>
            <StatusValue value={system.lifecycle_status} />
          </KeyValue>
          <KeyValue label="Authorization" labelWidth={width} wrap>
            <StatusValue value={system.authorization_status} />
          </KeyValue>
        </>
      )}
      {row?.baselineTitle && (
        <KeyValue label="Baseline" labelWidth={width} wrap>
          <Inline space="space.075" alignBlock="center" shouldWrap>
            <span>{row.baselineTitle}</span>
            {row.baselineDraft && (
              <Badge tone="warning" variant="secondary" size="xsmall">
                Draft
              </Badge>
            )}
          </Inline>
        </KeyValue>
      )}
    </ProgramQueryState>
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
    (component.data === undefined || (component.data && system.data === undefined)) &&
    (component.isPending || system.isPending || component.error || system.error)
  )
    return <ProgramQueryState queries={[component, system]} />;
  if (!component.data || system.data?.program_id !== programId)
    return (
      <MissingRecord
        backTo="/programs"
        kind="Component"
        description="This record is unavailable in this program."
      />
    );
  return (
    <ProgramRecordFrame
      programId={programId}
      table="system_components"
      row={component.data as DataRecord}
      title={component.data.name}
      readOnly
      facts={["code", "description", "component_type", "version", "status"]}
    >
      <ProgramQueryState queries={[component, system, element]} />
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
        section
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
  if (
    (pending || error) &&
    [implementation, plan, system, selected, control].some((query) => query.data === undefined)
  )
    return <ProgramQueryState queries={[implementation, plan, system, selected, control]} />;
  if (!implementation.data || system.data?.program_id !== programId)
    return (
      <MissingRecord
        backTo="/programs"
        kind="Control implementation"
        description="This record is unavailable in this program."
      />
    );
  const row = implementation.data;
  return (
    <ProgramRecordFrame
      programId={programId}
      table="implemented_requirements"
      readOnly={plan.data?.state === "published"}
      row={row as DataRecord}
      title={control.data?.title ?? "Control implementation"}
      properties={
        <>
          <KeyValue label="Code">
            {control.data?.code ? <Id>{control.data.code}</Id> : <Absent />}
          </KeyValue>
          <KeyValue label="Status">
            <StatusValue value={row["implementation_status"]} />
          </KeyValue>
          <KeyValue label="Not applicable rationale" wrap>
            {row["not_applicable_rationale"] || <Absent />}
          </KeyValue>
          <KeyValue label="Updated">{String(row["updated_at"] ?? "") || <Absent />}</KeyValue>
        </>
      }
    >
      <Section title="Implementation">
        <p className="whitespace-pre-wrap">{row.description ?? <Absent />}</p>
      </Section>
      {control.data && (
        <Button variant="secondary" onClick={() => setShowSource(true)}>
          Read control and assessment objectives
        </Button>
      )}
      <ProgramCollection
        name="implementation_statements"
        section
        title="Statement implementations"
        filters={{ implemented_requirement_id: row.id }}
        initialValues={{ ssp_revision_id: row.ssp_revision_id }}
        columns={[
          { key: "description", title: "Implementation narrative" },
          { key: "updated_at", title: "Updated" },
        ]}
        canCreate={plan.data?.state === "draft"}
        readOnly={plan.data?.state === "published"}
      />
      <ProgramCollection
        name="component_contributions"
        section
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
      />
      {showSource && control.data && (
        <ControlInspector
          task="Control source inspection"
          control={control.data}
          onClose={() => setShowSource(false)}
        />
      )}
    </ProgramRecordFrame>
  );
}
