import { useWorkspace } from "@/components/app/workspace";
import { useModelSave, useRow, useRows, type Row } from "@/lib/models";
import { labelFor, type DataRecord } from "@/lib/records";
import {
  Absent,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Button,
  Count,
  DataTable,
  defineColumns,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Id,
  Inspector,
  KeyValue,
  PageHeader,
  Section,
  Shell,
  Stack,
  Table,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  TextLink,
  useDataTable,
} from "@ledger/design-system";
import { Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ControlInspector } from "./library-controls";
import { LibraryEditor, LibraryLoading, LibrarySelect } from "./library-shared";
import { canAuthorLibrary, downloadLibraryRecords } from "./library-utils";
import { ProductCollection } from "./product-collection";
import { recordDestination, RecordLink, useDisplayedRecords } from "./record-preview";
import { RecordSummaryPreview } from "./record-summary-preview";
import { EmptyMessage, MissingRecord } from "./work-common";
import { displayDate } from "./work-format";

export function ComponentLibraryIndex() {
  const navigate = useNavigate();
  const workspace = useWorkspace();
  const definitions = useRows("component_definitions");
  const revisions = useRows("component_definition_revisions");
  const components = useRows("defined_components");
  const claims = useRows("defined_component_implementations");
  const [creating, setCreating] = useState(false);
  const [selected, setSelected] = useState<Row<"component_definitions"> | null>(null);
  const rows = useMemo(
    () =>
      (definitions.data ?? []).map((definition) => {
        const revision = (revisions.data ?? [])
          .filter((item) => item.component_definition_id === definition.id)
          .sort((a, b) => b.version_number - a.version_number)[0];
        return {
          ...definition,
          categoryLabel: labelFor(definition.category),
          version: revision ? String(revision.version_number) : "No revisions",
          status: revision?.state ?? "No revisions",
          types:
            [
              ...new Set(
                components.data
                  ?.filter((item) => item.component_definition_revision_id === revision?.id)
                  .map((item) => item.component_type),
              ),
            ].join(", ") || "Not defined",
          controls: new Set(
            claims.data
              ?.filter((claim) => claim.component_definition_revision_id === revision?.id)
              .map((claim) => claim.control_id),
          ).size,
        };
      }),
    [definitions.data, revisions.data, components.data, claims.data],
  );
  const columns = useMemo(
    () =>
      defineColumns<(typeof rows)[number]>((c) => [
        c.id("code", {
          header: "ID",
          width: 150,
          preview: setSelected,
          active: (row) => row.id === selected?.id,
        }),
        c.text("name", {
          header: "Component definition",
          hideable: false,
          priority: 0,
          width: 220,
          cell: (row) => (
            <RecordLink table="component_definitions" record={row}>
              {row.name}
            </RecordLink>
          ),
        }),
        c.text("types", { header: "Type", width: 170 }),
        c.text("categoryLabel", { header: "Category", width: 180 }),
        c.text("version", { header: "Version", width: 110 }),
        c.number("controls", { header: "Controls", width: 100 }),
        c.status("status", { header: "State", width: 130, tone: () => "neutral" }),
      ]),
    [selected?.id],
  );
  const table = useDataTable({
    data: rows,
    columns,
    getRowId: (row) => row.id,
    label: "Reusable component library",
    view: "live-component-library",
    resizable: true,
    reorderable: true,
  });
  const displayed = useDisplayedRecords(table);
  return (
    <Stack space="space.200" className="animate-rise">
      <PageHeader>
        <PageHeader.Heading>
          <PageHeader.Title>Components</PageHeader.Title>
        </PageHeader.Heading>
      </PageHeader>
      {creating && (
        <LibraryEditor
          table="component_definitions"
          onClose={() => setCreating(false)}
          onSaved={(record) => {
            void navigate({
              to: "/library/components/$componentKey",
              params: { componentKey: record.id },
            });
          }}
        />
      )}
      <LibraryLoading queries={[definitions, revisions, components, claims]}>
        <ProductCollection
          commands={[
            {
              label: "Export recorded JSON",
              disabled: !definitions.data || !revisions.data || !components.data || !claims.data,
              onSelect: () =>
                downloadLibraryRecords("component-library.json", {
                  definitions: definitions.data,
                  revisions: revisions.data,
                  components: components.data,
                  implementations: claims.data,
                }),
            },
          ]}
          table={table}
          fill
          onRowClick={(row) => {
            void navigate({
              to: "/library/components/$componentKey",
              params: { componentKey: row.id },
            });
          }}
          empty={{
            action: canAuthorLibrary(workspace.role) ? (
              <Button size="small" variant="primary" onClick={() => setCreating(true)}>
                Create component
              </Button>
            ) : undefined,
            illustration: "tree",
            title: "No reusable components",
            description:
              "Create a component definition, then add its versioned implementation content.",
          }}
          searchLabel="Find components"
          filters={
            <>
              <DataTable.Filter table={table} column="categoryLabel" />
              <DataTable.Filter table={table} column="types" />
              <DataTable.Filter table={table} column="status" />
            </>
          }
          action={
            <>
              <>
                {canAuthorLibrary(workspace.role) && (
                  <Button size="small" variant="primary" onClick={() => setCreating(true)}>
                    Create component
                  </Button>
                )}
              </>
            </>
          }
        />
      </LibraryLoading>
      {selected && (
        <RecordSummaryPreview
          model="component_definitions"
          fields={[
            { key: "code", label: "Code" },
            { key: "categoryLabel", label: "Category" },
            { key: "description", label: "Description" },
            { key: "version", label: "Latest version" },
            { key: "status", label: "State" },
            { key: "types", label: "Types" },
            { key: "controls", label: "Controls" },
          ]}
          record={selected}
          rows={displayed}
          onSelect={setSelected}
          onClose={() => setSelected(null)}
        />
      )}
    </Stack>
  );
}

export function ComponentLibraryRecord({
  id,
  initialVersion,
}: {
  id: string;
  initialVersion?: string;
}) {
  const definition = useRow("component_definitions", id);
  const revisions = useRows("component_definition_revisions", { component_definition_id: id });
  const publish = useModelSave("component_definition_revisions");
  const createRevision = useModelSave("component_definition_revisions");
  const workspace = useWorkspace();
  const [selectedVersion, setSelectedVersion] = useState(initialVersion ?? "");
  const [editDefinition, setEditDefinition] = useState(false);
  const [error, setError] = useState("");
  const versions = [...(revisions.data ?? [])].sort((a, b) => b.version_number - a.version_number);
  const current =
    versions.find(
      (revision) =>
        revision.id === selectedVersion || String(revision.version_number) === selectedVersion,
    ) ?? versions[0];
  const publishContent = useRows(
    "defined_components",
    current ? { component_definition_revision_id: current.id } : {},
    { enabled: !!current },
  );
  const editable = canAuthorLibrary(workspace.role);
  async function newRevision() {
    setError("");
    try {
      const row = await createRevision.mutateAsync({
        values: {
          component_definition_id: id,
          version_number: Math.max(0, ...versions.map((revision) => revision.version_number)) + 1,
        },
      });
      setSelectedVersion(row.id);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not create a revision.");
    }
  }
  async function publishVersion() {
    if (!current || publish.isPending) return;
    setError("");
    try {
      await publish.mutateAsync({
        id: current.id,
        revision: current.revision,
        values: { state: "published" },
      });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not publish this version.");
    }
  }
  if (!definition.data)
    return (
      <LibraryLoading queries={[definition, revisions]}>
        <MissingRecord backTo="/library/components" kind="Component" />
      </LibraryLoading>
    );
  return (
    <LibraryLoading queries={[definition, revisions]}>
      <Stack space="space.200" className="animate-rise">
        <PageHeader>
          <PageHeader.Lead render={<Breadcrumb />}>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink render={<Link to="/library/components" />}>
                  Components
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{definition.data?.name}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </PageHeader.Lead>
          <PageHeader.Heading>
            <PageHeader.Title>{definition.data?.name}</PageHeader.Title>
          </PageHeader.Heading>
          {editable && definition.data && (
            <PageHeader.Actions>
              <DropdownMenu>
                <DropdownMenuTrigger render={<Button>Actions</Button>} />
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setEditDefinition(true)}>
                    Edit component
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    disabled={createRevision.isPending}
                    onClick={() => void newRevision()}
                  >
                    Create component version
                  </DropdownMenuItem>
                  {current?.state === "draft" && (
                    <DropdownMenuItem
                      disabled={publish.isPending || !publishContent.data?.length}
                      onClick={() => void publishVersion()}
                    >
                      Publish version
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </PageHeader.Actions>
          )}
        </PageHeader>
        {error && (
          <p role="alert" className="text-danger">
            {error}
          </p>
        )}
        {editDefinition && definition.data && (
          <LibraryEditor
            table="component_definitions"
            existing={definition.data}
            onClose={() => setEditDefinition(false)}
          />
        )}
        {current ? (
          <ComponentRevision
            key={current.id}
            definition={definition.data}
            revision={current}
            versions={versions}
            onVersion={setSelectedVersion}
            editable={editable}
          />
        ) : (
          <EmptyMessage title="No component versions have been authored" />
        )}
      </Stack>
    </LibraryLoading>
  );
}

function ComponentRevision({
  definition,
  revision,
  versions,
  onVersion,
  editable,
}: {
  definition: Row<"component_definitions">;
  revision: Row<"component_definition_revisions">;
  versions: Row<"component_definition_revisions">[];
  onVersion: (id: string) => void;
  editable: boolean;
}) {
  const navigate = useNavigate();
  const components = useRows("defined_components", {
    component_definition_revision_id: revision.id,
  });
  const implementations = useRows("defined_component_implementations", {
    component_definition_revision_id: revision.id,
  });
  const controls = useRows("controls");
  const uses = useRows("system_components");
  const systems = useRows("systems");
  const programs = useRows("programs");
  const [structurePreview, setStructurePreview] = useState<Row<"defined_components"> | null>(null);
  const [usePreview, setUsePreview] = useState<Row<"system_components"> | null>(null);
  const [tab, setTab] = useState("Overview");
  const [edit, setEdit] = useState<{ table: string; row?: DataRecord } | null>(null);
  const [inspected, setInspected] = useState<Row<"controls"> | null>(null);
  const [error, setError] = useState("");
  const canEdit = editable && revision.state === "draft";
  const componentIds = new Set(components.data?.map((component) => component.id));
  const currentUses = (uses.data ?? []).filter(
    (use) => use.defined_component_id && componentIds.has(use.defined_component_id),
  );
  const claimRows = useMemo(
    () =>
      (implementations.data ?? []).map((claim) => ({
        ...claim,
        code:
          controls.data?.find((control) => control.id === claim.control_id)?.code ??
          claim.control_id,
        title:
          controls.data?.find((control) => control.id === claim.control_id)?.title ??
          "Not recorded",
        component:
          components.data?.find((component) => component.id === claim.defined_component_id)?.name ??
          "Not recorded",
      })),
    [implementations.data, controls.data, components.data],
  );
  const columns = useMemo(
    () =>
      defineColumns<(typeof claimRows)[number]>((c) => [
        c.id("code", {
          header: "Control",
          width: 130,
          preview: (claim) =>
            setInspected(controls.data?.find((control) => control.id === claim.control_id) ?? null),
          active: (claim) => claim.control_id === inspected?.id,
        }),
        c.text("title", {
          header: "Title",
          priority: 0,
          minWidth: 220,
          cell: (row) => (
            <RecordLink table="defined_component_implementations" record={row}>
              {row.title}
            </RecordLink>
          ),
        }),
        c.text("component", { header: "Component", width: 180 }),
        c.text("description", { header: "Implementation" }),
        c.text("coverage", {
          header: "Coverage",
          width: 110,
          cell: (row) => labelFor(row.coverage),
        }),
        c.status("implementation_status", {
          header: "Implementation state",
          width: 170,
          tone: () => "neutral",
        }),
        c.actions((row) => [
          {
            label: "Read control",
            onSelect: () =>
              setInspected(controls.data?.find((control) => control.id === row.control_id) ?? null),
          },
          ...(canEdit
            ? [
                {
                  label: "Edit control implementation",
                  onSelect: () => setEdit({ table: "defined_component_implementations", row }),
                },
              ]
            : []),
        ]),
      ]),
    [canEdit, controls.data, inspected?.id],
  );
  const table = useDataTable({
    data: claimRows,
    columns,
    getRowId: (row) => row.id,
    label: "Reusable control implementations",
    view: "live-component-controls",
    resizable: true,
  });
  const displayedClaims = useDisplayedRecords(table);
  const displayedControls = [
    ...new Map(
      displayedClaims.flatMap((claim) => {
        const control = controls.data?.find((record) => record.id === claim.control_id);
        return control ? [[control.id, control] as const] : [];
      }),
    ).values(),
  ];

  const structureColumns = useMemo(
    () =>
      defineColumns<Row<"defined_components">>((c) => [
        c.id("id", {
          header: "ID",
          width: 150,
          preview: setStructurePreview,
          active: (row) => row.id === structurePreview?.id,
        }),
        c.text("name", {
          header: "Component",
          hideable: false,
          priority: 0,
          minWidth: 220,
          cell: (row) => (
            <RecordLink table="defined_components" record={row}>
              {row.name}
            </RecordLink>
          ),
        }),
        c.text("component_type", { header: "Type", width: 150 }),
        c.text("description", { header: "Description", wrap: true }),
        ...(canEdit
          ? [
              c.actions((row) => [
                {
                  label: "Edit component",
                  onSelect: () => setEdit({ table: "defined_components", row }),
                },
              ]),
            ]
          : []),
      ]),
    [canEdit, structurePreview?.id],
  );
  const structureTable = useDataTable({
    data: components.data ?? [],
    columns: structureColumns,
    getRowId: (row) => row.id,
    label: "Component structure",
    view: "component-definition-structure",
    resizable: true,
    reorderable: true,
  });
  const useRowsForTable = useMemo(() => {
    const ids = new Set(components.data?.map((component) => component.id));
    return (uses.data ?? [])
      .filter((use) => use.defined_component_id && ids.has(use.defined_component_id))
      .map((use) => {
        const system = systems.data?.find((item) => item.id === use.system_id);
        const program = programs.data?.find((item) => item.id === system?.program_id);
        return {
          ...use,
          program_id: program?.id ?? null,
          programName: program?.name ?? null,
          systemName: system?.name ?? null,
        };
      });
  }, [components.data, uses.data, systems.data, programs.data]);
  const useColumns = useMemo(
    () =>
      defineColumns<(typeof useRowsForTable)[number]>((c) => [
        c.id("id", {
          header: "ID",
          width: 150,
          preview: setUsePreview,
          active: (row) => row.id === usePreview?.id,
        }),
        c.text("name", {
          header: "Component instance",
          hideable: false,
          priority: 0,
          minWidth: 220,
          cell: (row) => (
            <RecordLink table="system_components" record={row}>
              {row.name}
            </RecordLink>
          ),
        }),
        c.text("programName", {
          header: "Program",
          cell: (row) =>
            row.program_id ? (
              <TextLink
                render={<Link to="/programs/$programId" params={{ programId: row.program_id }} />}
              >
                {row.programName}
              </TextLink>
            ) : (
              <Absent />
            ),
        }),
        c.text("systemName", {
          header: "System",
          cell: (row) =>
            row.program_id ? (
              <TextLink
                render={
                  <Link
                    to="/programs/$programId/systems/$scopeId"
                    params={{ programId: row.program_id, scopeId: row.system_id }}
                  />
                }
              >
                {row.systemName || <Absent />}
              </TextLink>
            ) : (
              <Absent />
            ),
        }),
        c.text("version", { header: "Version", width: 120 }),
      ]),
    [usePreview?.id],
  );
  const usesTable = useDataTable({
    data: useRowsForTable,
    columns: useColumns,
    getRowId: (row) => row.id,
    label: "Program component uses",
    view: "component-definition-program-uses",
    resizable: true,
    reorderable: true,
  });
  const displayedStructure = useDisplayedRecords(structureTable);
  const displayedUses = useDisplayedRecords(usesTable);
  const createComponentAction = canEdit ? (
    <Button size="small" variant="primary" onClick={() => setEdit({ table: "defined_components" })}>
      Create component
    </Button>
  ) : undefined;

  return (
    <Stack space="space.200">
      {error && (
        <p role="alert" className="text-danger">
          {error}
        </p>
      )}
      {edit && (
        <LibraryEditor
          table={edit.table}
          initialValues={{ component_definition_revision_id: revision.id }}
          {...(edit.row ? { existing: edit.row } : {})}
          onClose={() => setEdit(null)}
        />
      )}
      <Tabs value={tab} onValueChange={(value) => setTab(String(value))} className="contents">
        <TabsList variant="line" aria-label="Component sections">
          {[
            "Overview",
            "Controls",
            "Structure",
            "Requirements",
            "Evidence",
            "Versions",
            "Programs",
          ].map((name) => (
            <TabsTrigger key={name} value={name}>
              {name}
              {name === "Controls" && implementations.data && (
                <Count
                  value={new Set(implementations.data.map((claim) => claim.control_id)).size}
                  max={99999}
                />
              )}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value={tab} className="contents">
          <LibraryLoading
            queries={[components, implementations, controls, uses, systems, programs]}
          >
            {tab === "Overview" && (
              <Section title="Description">
                <p>{definition.description || <Absent />}</p>
              </Section>
            )}
            {tab === "Controls" && (
              <Stack space="space.200">
                <ProductCollection
                  action={
                    canEdit && (
                      <>
                        <Button
                          size="small"
                          variant="primary"
                          disabled={!components.data?.length}
                          onClick={() => setEdit({ table: "defined_component_implementations" })}
                        >
                          Create control implementation
                        </Button>
                      </>
                    )
                  }
                  table={table}
                  onRowClick={(claim) =>
                    void navigate(recordDestination("defined_component_implementations", claim))
                  }
                  empty={{
                    illustration: "shield",
                    title: "No implementation claims",
                    description:
                      "Add a component in Structure, then author its control implementation.",
                  }}
                  fill
                  searchLabel="Find control implementations"
                  filters={
                    <>
                      <DataTable.Filter table={table} column="component" />
                      <DataTable.Filter table={table} column="implementation_status" />
                    </>
                  }
                />
              </Stack>
            )}
            {tab === "Structure" && (
              <ProductCollection
                table={structureTable}
                fill
                onRowClick={(row) => void navigate(recordDestination("defined_components", row))}
                empty={{
                  illustration: "tree",
                  title: "No components yet",
                  description:
                    "Create a component to author this version's reusable implementation content.",
                  action: createComponentAction,
                }}
                searchLabel="Find components"
                filters={<DataTable.Filter table={structureTable} column="component_type" />}
                action={createComponentAction}
              />
            )}
            {tab === "Versions" && (
              <Table>
                <thead>
                  <tr>
                    <Table.Header>Version</Table.Header>
                    <Table.Header>State</Table.Header>
                    <Table.Header>Published</Table.Header>
                    <Table.Header>Actions</Table.Header>
                  </tr>
                </thead>
                <tbody>
                  {versions.map((version) => (
                    <Table.Row key={version.id}>
                      <Table.Cell>{version.version_number}</Table.Cell>
                      <Table.Cell>{version.state}</Table.Cell>
                      <Table.Cell>
                        {version.published_at ? displayDate(version.published_at) : "Not published"}
                      </Table.Cell>
                      <Table.Cell>
                        <Button variant="subtle" size="small" onClick={() => onVersion(version.id)}>
                          Open version
                        </Button>
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </tbody>
              </Table>
            )}
            {tab === "Programs" && (
              <ProductCollection
                table={usesTable}
                fill
                onRowClick={(row) => void navigate(recordDestination("system_components", row))}
                empty={{
                  illustration: "tree",
                  title: "No program uses yet",
                  description:
                    "Add this component version from a system's library to record its use.",
                }}
                searchLabel="Find component instances"
                filters={<DataTable.Filter table={usesTable} column="programName" />}
              />
            )}
            {(tab === "Requirements" || tab === "Evidence") && (
              <ComponentTraceability key={tab} kind={tab} uses={currentUses} />
            )}
          </LibraryLoading>
        </TabsContent>
      </Tabs>
      {tab === "Overview" && (
        <Shell.Aside label="Component details">
          <Inspector.Group title="Details">
            <KeyValue label="Code">
              <Id>{definition.code}</Id>
            </KeyValue>
            <LibrarySelect
              label="Version"
              value={revision.id}
              options={versions.map((version) => ({
                value: version.id,
                label: `${version.version_number} · ${version.state}`,
              }))}
              onChange={onVersion}
            />
            <KeyValue label="State">{revision.state}</KeyValue>
            <KeyValue label="Published">
              {revision.published_at ? displayDate(revision.published_at) : "Not published"}
            </KeyValue>
            <KeyValue label="Components">{components.data?.length ?? "Loading…"}</KeyValue>
            <KeyValue label="System uses">
              {uses.data && components.data ? currentUses.length : "Loading…"}
            </KeyValue>
            {revision.remarks && (
              <KeyValue label="Remarks" wrap>
                {revision.remarks}
              </KeyValue>
            )}
            {revision.effective_from && (
              <KeyValue label="Effective from">{displayDate(revision.effective_from)}</KeyValue>
            )}
            {revision.review_due && (
              <KeyValue label="Review due">{displayDate(revision.review_due)}</KeyValue>
            )}
            {revision.conditions && (
              <KeyValue label="Conditions" wrap>
                {revision.conditions}
              </KeyValue>
            )}
            {revision.consumer_responsibilities && (
              <KeyValue label="Consumer responsibilities" wrap>
                {revision.consumer_responsibilities}
              </KeyValue>
            )}
          </Inspector.Group>
        </Shell.Aside>
      )}
      {structurePreview && (
        <RecordSummaryPreview
          model="defined_components"
          readOnly={!canEdit}
          onEdit={() => setEdit({ table: "defined_components", row: structurePreview })}
          fields={[
            { key: "component_type", label: "Type" },
            { key: "description", label: "Description" },
          ]}
          record={structurePreview}
          rows={displayedStructure}
          onSelect={setStructurePreview}
          onClose={() => setStructurePreview(null)}
        />
      )}
      {usePreview && (
        <RecordSummaryPreview
          model="system_components"
          fields={[
            { key: "version", label: "Version" },
            { key: "description", label: "Description" },
            { key: "programName", label: "Program" },
            { key: "systemName", label: "System" },
          ]}
          record={usePreview}
          rows={displayedUses}
          onSelect={setUsePreview}
          onClose={() => setUsePreview(null)}
        />
      )}
      {inspected && (
        <ControlInspector
          control={inspected}
          records={displayedControls}
          onSelect={setInspected}
          onClose={() => setInspected(null)}
        />
      )}
    </Stack>
  );
}

function ComponentTraceability({
  kind,
  uses,
}: {
  kind: "Requirements" | "Evidence";
  uses: Row<"system_components">[];
}) {
  const contributions = useRows("component_contributions");
  const requirementLinks = useRows("requirement_implementations");
  const requirements = useRows("requirement_revisions");
  const evidenceLinks = useRows("implementation_evidence");
  const evidence = useRows("evidence_versions");
  const artifacts = useRows("evidence_artifacts");
  const useIds = new Set(uses.map((use) => use.id));
  const relevant = (contributions.data ?? []).filter((contribution) =>
    useIds.has(contribution.system_component_id),
  );
  const contributionIds = new Set(relevant.map((contribution) => contribution.id));
  const requirementIds = new Set(
    requirementLinks.data
      ?.filter(
        (link) =>
          !!link.component_contribution_id && contributionIds.has(link.component_contribution_id),
      )
      .map((link) => link.requirement_revision_id),
  );
  const statementIds = new Set(
    relevant.flatMap((contribution) => contribution.implementation_statement_id ?? []),
  );
  const evidenceIds = new Set(
    evidenceLinks.data
      ?.filter(
        (link) =>
          (!!link.implementation_statement_id &&
            statementIds.has(link.implementation_statement_id)) ||
          (!!link.component_contribution_id && contributionIds.has(link.component_contribution_id)),
      )
      .map((link) => link.evidence_version_id),
  );
  const matchingRequirements = (requirements.data ?? []).filter((requirement) =>
    requirementIds.has(requirement.id),
  );
  const matchingEvidence = (evidence.data ?? []).filter((version) => evidenceIds.has(version.id));
  return (
    <LibraryLoading
      queries={[contributions, requirementLinks, requirements, evidenceLinks, evidence, artifacts]}
    >
      <Stack space="space.200">
        {kind === "Requirements" ? (
          matchingRequirements.length ? (
            matchingRequirements.map((requirement) => (
              <Inspector.Group key={requirement.id} title={requirement.title}>
                <KeyValue label="Version">{requirement.version_number}</KeyValue>
                <KeyValue label="State">{requirement.state}</KeyValue>
                <p className="font-body-small">{requirement.statement}</p>
              </Inspector.Group>
            ))
          ) : (
            <EmptyMessage title="No requirements have been linked through these system implementations" />
          )
        ) : matchingEvidence.length ? (
          matchingEvidence.map((version) => (
            <Inspector.Group
              key={version.id}
              title={
                artifacts.data?.find((artifact) => artifact.id === version.artifact_id)?.title ??
                version.id
              }
            >
              <KeyValue label="Version">{version.version_number}</KeyValue>
              <KeyValue label="State">{version.state}</KeyValue>
              <KeyValue label="Location" wrap>
                {version.external_uri ? (
                  <TextLink href={version.external_uri} target="_blank" rel="noreferrer">
                    {version.external_uri}
                  </TextLink>
                ) : (
                  (version.storage_object_name ?? <Absent />)
                )}
              </KeyValue>
            </Inspector.Group>
          ))
        ) : (
          <EmptyMessage title="No evidence has been linked through these system implementations" />
        )}
      </Stack>
    </LibraryLoading>
  );
}
