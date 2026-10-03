import { productRecordNoun } from "@/lib/product-records";
import { EmptyMessage, MissingRecord, ReportFailures, type QueryStatus } from "./work-common";
import { useState, type ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Absent,
  Button,
  DateTime,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLinkItem,
  DropdownMenuTrigger,
  Id,
  Inline,
  Inspector,
  KeyValue,
  PageHeader,
  Prose,
  Section,
  Shell,
  Skeleton,
  Tabs,
  TabsList,
  TabsTrigger,
  Text,
  TextLink,
  VisuallyHidden,
} from "@ledger/design-system";
import { ChevronDown } from "lucide-react";
import { useRow } from "@/lib/models";
import { useProductLookup } from "@/lib/product-items";
import type { SystemElement } from "@/lib/system-tree";
import { labelFor, type DataRecord } from "@/lib/records";
import type { SystemAssuranceRow } from "@/lib/system-assurance";
import {
  authorizationStatuses,
  componentStatuses,
  implementationStatuses,
  revisionStates,
  systemLifecycleStatuses,
} from "@/lib/status";
import { StatusBadge } from "@/components/app/status";
import { useWorkspace } from "@/components/app/workspace";
import { Page } from "@/components/app/shell";
import { ControlInspector } from "@/components/prototype/library-controls";
import { ProgramSystemsTree } from "./program-systems-tree";
import { SystemElementDialog } from "./system-element-dialog";
import { SystemControls } from "./system-baseline";
import { SystemRequirements } from "./system-requirements";
import { SystemLibrary } from "./system-library";
import { SystemEvidence } from "./system-evidence";
import { AddFromLibrary } from "./add-from-library";
import {
  ImpactLevel,
  ancestorElements,
  impactDimensions,
  impactProvenance,
} from "./system-assurance-details";
import { useSystemAssurance } from "./use-system-assurance";
import { RelationName } from "./record-tools";
import { RecordTrail, TrailLink } from "./record-trail";
import { SspAssembly } from "./ssp-assembly";
import {
  ProgramCollection,
  ProgramEditor,
  ProgramQueryState,
  RetainedTabPanels,
  type ProgramTableName,
} from "./program-shared";

/**
 * A program sub-record's Details: the rail beside the body, or below the aside breakpoint a closed
 * disclosure where it is rendered, whose row says the record's state (`summary`). A record without
 * tabs renders it right after its header; a tabbed record, first on its Overview.
 */
function RecordDetails({
  recordType,
  summary,
  children,
}: {
  /** The record type, which names the landmark: "System" is "System details". */
  recordType: "System" | "Component" | "Control";
  /** The record's state as its status badge, which the phone's closed Details row shows. */
  summary?: ReactNode | undefined;
  /** The Details rows (KeyValues), composed by the record. */
  children: ReactNode;
}) {
  return (
    <Shell.Aside label={`${recordType} details`} summary={summary}>
      <Inspector.Group title="Details">{children}</Inspector.Group>
    </Shell.Aside>
  );
}

function ProgramRecordFrame({
  programId,
  table,
  recordType,
  row,
  title,
  children,
  readOnly = false,
  renderEditor,
  collection,
  trail,
  actions,
  properties,
  summary,
  queries,
}: {
  programId: string;
  table: ProgramTableName;
  /** The record type, which names the Details rail's landmark: "System" is "System details". */
  recordType: "System" | "Component" | "Control";
  row: DataRecord;
  title: string;
  children: ReactNode;
  readOnly?: boolean;
  renderEditor?: ((onClose: () => void) => ReactNode) | undefined;
  /** The program tab that holds this record's collection: the trail's level after the program. */
  collection: { label: string; tab: "System" | "Controls" };
  /** Levels between the collection and this record, outermost first: TrailLinks to the containing elements. */
  trail?: ReactNode[] | undefined;
  /** Header actions beside Edit. */
  actions?: ReactNode;
  /** The Details rows (KeyValues) of a record without tabs, drawn right after the header. A tabbed record leaves it out and draws RecordDetails first on its Overview. */
  properties?: ReactNode;
  /** The record's state as its status badge, for the Details disclosure's row on a phone. */
  summary?: ReactNode | undefined;
  /**
   * The reads the record is drawn from, the record itself first: a failed refresh of any of them
   * is said in the page's one alert, over the record as it last loaded.
   */
  queries: QueryStatus[];
}) {
  const program = useRow("programs", programId);
  const workspace = useWorkspace();
  const [editing, setEditing] = useState(false);
  return (
    <Page>
      {/* The page is one failure region, and each of its tabs another: an outage reads as one
          alert where it happened, whose Retry reloads every failed read in it. */}
      <ProgramQueryState region>
        <ReportFailures queries={[program, ...queries]} />
        <PageHeader>
          <RecordTrail current={title}>
            <TrailLink to="/programs">Programs</TrailLink>
            <TrailLink to="/programs/$programId" params={{ programId }}>
              {program.data ? `${program.data.code} · ${program.data.name}` : "Program"}
            </TrailLink>
            <TrailLink
              to="/programs/$programId"
              params={{ programId }}
              search={{ tab: collection.tab }}
            >
              {collection.label}
            </TrailLink>
            {trail}
          </RecordTrail>
          <PageHeader.Heading>
            <PageHeader.Title>{title}</PageHeader.Title>
          </PageHeader.Heading>
          <PageHeader.Actions>
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button iconAfter={<ChevronDown />}>Actions</Button>} />
              <DropdownMenuContent align="end">
                {!readOnly &&
                  !editing &&
                  workspace.role !== "viewer" &&
                  row["state"] !== "published" && (
                    <DropdownMenuItem onClick={() => setEditing(true)}>
                      {`Edit ${productRecordNoun(table, row)}`}
                    </DropdownMenuItem>
                  )}
                {actions}
                <DropdownMenuLinkItem
                  closeOnClick
                  render={
                    <Link
                      to="/records/$collection/$recordId"
                      params={{ collection: table, recordId: row.id }}
                    />
                  }
                >
                  Inspect record
                </DropdownMenuLinkItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </PageHeader.Actions>
        </PageHeader>
        {properties !== undefined && (
          <RecordDetails recordType={recordType} summary={summary}>
            {properties}
          </RecordDetails>
        )}
        {children}
      </ProgramQueryState>
      {editing &&
        (renderEditor ? (
          renderEditor(() => setEditing(false))
        ) : (
          <ProgramEditor table={table} existing={row} onClose={() => setEditing(false)} />
        ))}
    </Page>
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
  /** The tab the address names; with no `onTabChange` the tab is local. */
  tab?: SystemTab | undefined;
  /** Puts the chosen tab in the address, as a new history entry. */
  onTabChange?: ((tab: SystemTab) => void) | undefined;
}) {
  const workspace = useWorkspace();
  const navigate = useNavigate();
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
  // Where the route keeps the tab, the address owns it: each choice is a step in the history, and
  // Back to an address without one shows Overview again.
  const requested = onTabChange ? (tab ?? "Overview") : localTab;
  const current: SystemTab = requested === "SSP" && !boundary ? "Overview" : requested;
  const select = (next: SystemTab) => {
    if (onTabChange) onTabChange(next);
    else setLocalTab(next);
  };
  const tabs = SYSTEM_TABS.filter((name) => name !== "SSP" || boundary);
  // Every member but a viewer creates systems, and row-level security decides each write: the role
  // says it, so the record does not load the record schema, which is the schema inspector's.
  const canCreate = workspace.role !== "viewer";
  const ancestors = row ? ancestorElements(row, assurance.rows) : [];
  return (
    <ProgramRecordFrame
      programId={programId}
      table="systems"
      recordType="System"
      row={system as DataRecord}
      title={system.name}
      collection={{ label: "System", tab: "System" }}
      trail={ancestors.map((ancestor) => (
        <TrailLink
          key={ancestor.id}
          to="/programs/$programId/systems/$scopeId"
          params={{ programId, scopeId: ancestor.id }}
        >
          {ancestor.name}
        </TrailLink>
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
      renderEditor={(onClose) => (
        <SystemElementDialog programId={programId} existing={system} onClose={onClose} />
      )}
      // The program's elements draw the trail's levels and the element's own row on every tab.
      queries={[query, ...assurance.queries]}
    >
      {/* Keyed by the record: its tabs' retained state ends when another record opens. */}
      <Tabs
        key={system.id}
        value={current}
        onValueChange={(value) => select(systemTab(value) ?? "Overview")}
      >
        <TabsList variant="line" aria-label="Element sections">
          {tabs.map((value) => (
            <TabsTrigger key={value} value={value}>
              {value}
            </TabsTrigger>
          ))}
        </TabsList>
        <RetainedTabPanels tabs={tabs} value={current} space="space.250">
          {(name) => (
            <>
              {name === "Overview" && (
                <>
                  {/* Kept to Overview: the panel stays mounted while another tab shows. */}
                  {current === "Overview" && (
                    <RecordDetails
                      recordType="System"
                      summary={
                        boundary ? (
                          <StatusBadge
                            statuses={authorizationStatuses}
                            value={system.authorization_status}
                          />
                        ) : undefined
                      }
                    >
                      <SystemProperties
                        programId={programId}
                        system={system}
                        row={row}
                        queries={assurance.queries}
                      />
                    </RecordDetails>
                  )}
                  <ProgramSystemsTree programId={programId} rootElementId={system.id} />
                </>
              )}
              {name === "Controls" && (
                <SystemControls
                  systemId={system.id}
                  onAddFromLibrary={(controlId) => setAddingLibrary({ controlId })}
                />
              )}
              {name === "Requirements" && (
                <SystemRequirements
                  programId={programId}
                  systemId={system.id}
                  rows={assurance.rows}
                  onAddFromLibrary={() => setAddingLibrary({ source: "requirement" })}
                />
              )}
              {name === "Library" &&
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
              {name === "Evidence" &&
                (row ? (
                  <SystemEvidence programId={programId} element={row} rows={assurance.rows} />
                ) : (
                  <ProgramQueryState queries={assurance.queries} />
                ))}
              {name === "Inventory" && (
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
              {name === "SSP" && boundary && (
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
            </>
          )}
        </RetainedTabPanels>
      </Tabs>
      {addingChild && (
        <SystemElementDialog
          programId={programId}
          parent={system}
          onClose={() => setAddingChild(false)}
          // The new element opens, so the reader lands on what they made.
          onSaved={(id) =>
            void navigate({
              to: "/programs/$programId/systems/$scopeId",
              params: { programId, scopeId: id },
            })
          }
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
  const products = useProductLookup();
  const variant = system.product_revision_id ? products.variant(system) : null;
  const productElement = system.product_element_id ? products.element(system) : null;
  return (
    <ProgramQueryState queries={[...queries, ...products.queries]}>
      <KeyValue.Group>
        <KeyValue label="Code" wrap>
          <Id>{system.code}</Id>
        </KeyValue>
        <KeyValue label="Description" wrap>
          {system.description ? <Text preserveLineBreaks>{system.description}</Text> : <Absent />}
        </KeyValue>
        {system.product_revision_id && system.is_authorization_boundary && (
          <KeyValue label="Product" wrap>
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
              <Absent label="Not available" />
            )}
          </KeyValue>
        )}
        {system.product_element_id && (
          <KeyValue label="Product element" wrap>
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
              <Absent label="Not available" />
            )}
          </KeyValue>
        )}
        <KeyValue label="Type" wrap>
          {labelFor(system.system_type)}
        </KeyValue>
        {impactDimensions.map((dimension) => (
          <KeyValue key={dimension} label={labelFor(dimension)} wrap>
            {row ? (
              <Inline space="space.075" alignBlock="center" shouldWrap>
                <ImpactLevel
                  value={row.impacts[dimension].value}
                  mixed={row.impacts[dimension].source === "mixed"}
                />
                <Text size="xsmall" color="color.text.subtle">
                  {impactProvenance(row, dimension)}
                </Text>
              </Inline>
            ) : (
              <Absent />
            )}
          </KeyValue>
        ))}
        <KeyValue label="Owner" wrap>
          <RelationName table="parties" id={system.system_owner_party_id} />
        </KeyValue>
        {!system.is_authorization_boundary && (
          <KeyValue label="Boundary" wrap>
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
          <KeyValue label="Parent" wrap>
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
            <KeyValue label="Lifecycle" wrap>
              <StatusBadge statuses={systemLifecycleStatuses} value={system.lifecycle_status} />
            </KeyValue>
            <KeyValue label="Authorization" wrap>
              <StatusBadge statuses={authorizationStatuses} value={system.authorization_status} />
            </KeyValue>
          </>
        )}
        {row?.baselineTitle && (
          <KeyValue label="Baseline" wrap>
            <Inline space="space.075" alignBlock="center" shouldWrap>
              <span>{row.baselineTitle}</span>
              {row.baselineDraft && (
                <StatusBadge statuses={revisionStates} value="draft" size="xsmall" />
              )}
            </Inline>
          </KeyValue>
        )}
      </KeyValue.Group>
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
  const record = component.data;
  const elementId = record.system_element_id ?? element.data?.system_element_id ?? null;
  return (
    <ProgramRecordFrame
      programId={programId}
      table="system_components"
      recordType="Component"
      row={record as DataRecord}
      title={record.name}
      readOnly
      collection={{ label: "System", tab: "System" }}
      summary={<StatusBadge statuses={componentStatuses} value={record.status} />}
      trail={[
        <TrailLink
          key={system.data.id}
          to="/programs/$programId/systems/$scopeId"
          params={{ programId, scopeId: system.data.id }}
        >
          {system.data.name}
        </TrailLink>,
      ]}
      properties={
        <KeyValue.Group>
          <KeyValue label="Code" wrap>
            <Id>{record.code}</Id>
          </KeyValue>
          <KeyValue label="Status" wrap>
            <StatusBadge statuses={componentStatuses} value={record.status} />
          </KeyValue>
          <KeyValue label="Type" wrap>
            {labelFor(record.component_type)}
          </KeyValue>
          <KeyValue label="Version" wrap>
            {record.version || <Absent />}
          </KeyValue>
          <KeyValue label="System" wrap>
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
          </KeyValue>
          <KeyValue label="System element" wrap>
            {elementId ? (
              <TextLink
                render={
                  <Link
                    to="/programs/$programId/systems/$scopeId"
                    params={{ programId, scopeId: elementId }}
                  />
                }
              >
                <RelationName table="systems" id={elementId} />
              </TextLink>
            ) : element.data === undefined && element.isError ? (
              // The page's alert says why; the value keeps its place, as RelationName's does.
              <Text color="color.text.subtle">Could not load</Text>
            ) : element.data === undefined ? (
              <>
                <Skeleton shape="line" width={96} />
                <VisuallyHidden>Loading</VisuallyHidden>
              </>
            ) : (
              <Absent />
            )}
          </KeyValue>
          <KeyValue label="Description" wrap>
            {record.description ? <Text preserveLineBreaks>{record.description}</Text> : <Absent />}
          </KeyValue>
        </KeyValue.Group>
      }
      queries={[component, system, element]}
    >
      <ProgramCollection
        name="component_contributions"
        section
        title="Control contributions"
        filters={{ system_component_id: componentId }}
        columns={[
          { key: "description", title: "Contribution" },
          { key: "implementation_status", title: "Implementation" },
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
      recordType="Control"
      readOnly={plan.data?.state === "published"}
      row={row as DataRecord}
      title={control.data?.title ?? "Control implementation"}
      collection={{ label: "Controls", tab: "Controls" }}
      summary={<StatusBadge statuses={implementationStatuses} value={row.implementation_status} />}
      actions={
        control.data && (
          <DropdownMenuItem onClick={() => setShowSource(true)}>
            Read control and assessment objectives
          </DropdownMenuItem>
        )
      }
      properties={
        <KeyValue.Group>
          <KeyValue label="Code">
            {control.data?.code ? <Id>{control.data.code}</Id> : <Absent />}
          </KeyValue>
          <KeyValue label="Status">
            <StatusBadge statuses={implementationStatuses} value={row.implementation_status} />
          </KeyValue>
          {/* Why the control does not apply: a fact only once the status says it does not. */}
          {(row.implementation_status === "not_applicable" || row.not_applicable_rationale) && (
            <KeyValue label="Rationale" wrap>
              {row.not_applicable_rationale ? (
                <Text preserveLineBreaks>{row.not_applicable_rationale}</Text>
              ) : (
                <Absent />
              )}
            </KeyValue>
          )}
          <KeyValue label="Updated" wrap>
            <DateTime value={row.updated_at} format="date" />
          </KeyValue>
        </KeyValue.Group>
      }
      queries={[implementation, plan, system, selected, control]}
    >
      <Section title="Implementation">
        {row.description ? (
          <Prose>{row.description}</Prose>
        ) : (
          <EmptyMessage
            compact
            title="No implementation narrative yet"
            description="The narrative says how this system meets the control."
          />
        )}
      </Section>
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
          { key: "implementation_status", title: "Implementation" },
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
