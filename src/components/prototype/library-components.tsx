import { StatusBadge } from "@/components/app/status";
import { Page } from "@/components/app/shell";
import { useWorkspace } from "@/components/app/workspace";
import { useRow, useRows, type Row } from "@/lib/models";
import { productCreateLabel, productRecordNoun } from "@/lib/product-records";
import { labelFor, type DataRecord, type RecordValue } from "@/lib/records";
import { implementationStatuses, revisionStates, statusLabel } from "@/lib/status";
import {
  Absent,
  Button,
  Count,
  DataTable,
  DateTime,
  defineColumns,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Id,
  Inspector,
  KeyValue,
  PageHeader,
  Prose,
  Shell,
  Stack,
  Tabs,
  TabsList,
  TabsTrigger,
  Text,
  TextLink,
  toast,
  useDataTable,
  useLedgerLocale,
} from "@ledger/design-system";
import { Link, useNavigate } from "@tanstack/react-router";
import { ChevronDown, Plus } from "lucide-react";
import { useMemo, useRef, useState, type RefObject } from "react";
import { ControlInspector, type ControlSummary } from "./library-controls";
import { LibrarySelect, QueryValue, VersionHistory } from "./library-shared";
import {
  canAuthorLibrary,
  downloadLibraryRecords,
  nextVersionNumber,
  usePublishVersion,
  useVersionFocus,
  type VersionChoice,
} from "./library-utils";
import { ProductCollection } from "./product-collection";
import { ProductRecordDialog } from "./product-record-dialog";
import { RetainedTabPanels } from "./program-shared";
import { recordDestination, RecordLink, useDisplayedRecords, useEndOnHide } from "./record-preview";
import { RecordSummaryPreview } from "./record-summary-preview";
import { RecordTrail, TrailLink } from "./record-trail";
import { EmptyMessage, MissingRecord, QueryState } from "./work-common";

/** A definition with what its latest version says. */
type ComponentRow = Row<"component_definitions"> & {
  categoryLabel: string;
  version: number | null;
  status: string | null;
  types: string | null;
  controls: number;
};

const componentLabel = productCreateLabel("component_definitions");

export function ComponentLibraryIndex() {
  const navigate = useNavigate();
  const workspace = useWorkspace();
  const definitions = useRows("component_definitions");
  const revisions = useRows("component_definition_revisions");
  const components = useRows("defined_components");
  const claims = useRows("defined_component_implementations");
  const [creating, setCreating] = useState(false);
  const [selected, setSelected] = useState<ComponentRow | null>(null);
  const rows = useMemo(
    () =>
      (definitions.data ?? []).map((definition): ComponentRow => {
        const revision = (revisions.data ?? [])
          .filter((item) => item.component_definition_id === definition.id)
          .sort((a, b) => b.version_number - a.version_number)[0];
        const types = [
          ...new Set(
            (components.data ?? [])
              .filter((item) => item.component_definition_revision_id === revision?.id)
              .map((item) => labelFor(item.component_type)),
          ),
        ];
        return {
          ...definition,
          categoryLabel: labelFor(definition.category),
          version: revision?.version_number ?? null,
          status: revision?.state ?? null,
          types: types.join(", ") || null,
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
      defineColumns<ComponentRow>((c) => [
        c.id("code", {
          header: "ID",
          width: 150,
          priority: 1,
          preview: setSelected,
          active: (row) => row.id === selected?.id,
        }),
        c.text("name", {
          header: "Component definition",
          hideable: false,
          priority: 0,
          minWidth: 200,
          cell: (row) => (
            <RecordLink table="component_definitions" record={row}>
              {row.name}
            </RecordLink>
          ),
        }),
        c.text("types", { header: "Type", width: 170 }),
        c.text("categoryLabel", { header: "Category", width: 180 }),
        c.number("version", { header: "Latest version", width: 140 }),
        c.number("controls", { header: "Controls", width: 100 }),
        c.status("status", { header: "State", width: 130, statuses: revisionStates }),
      ]),
    [selected?.id],
  );
  const table = useDataTable({
    data: rows,
    columns,
    getRowId: (row) => row.id,
    // The row's controls are named by code and name, also once a narrow frame folds the ID.
    rowLabel: (row) => `${row.code} · ${row.name}`,
    label: "Reusable component library",
    view: "live-component-library",
    resizable: true,
    reorderable: true,
  });
  const displayed = useDisplayedRecords(table);
  const canCreate = canAuthorLibrary(workspace.role);
  const create = (size: "small" | "medium") => (
    <Button size={size} variant="primary" iconBefore={<Plus />} onClick={() => setCreating(true)}>
      {componentLabel}
    </Button>
  );
  return (
    <Page>
      <PageHeader>
        <PageHeader.Heading>
          <PageHeader.Title>Components</PageHeader.Title>
        </PageHeader.Heading>
      </PageHeader>
      {creating && (
        <ProductRecordDialog
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
        queries={[definitions, revisions, components, claims]}
        fill
        onRowClick={(row) => {
          void navigate({
            to: "/library/components/$componentKey",
            params: { componentKey: row.id },
          });
        }}
        empty={{
          action: canCreate ? create("medium") : undefined,
          illustration: "tree",
          title: "No reusable components",
          description: canCreate
            ? "Create a component definition, then add its versioned implementation content."
            : "Component definitions an editor creates here appear in this library.",
        }}
        searchLabel="Find components"
        filters={
          <>
            <DataTable.Filter table={table} column="categoryLabel" />
            <DataTable.Filter table={table} column="types" />
            <DataTable.Filter table={table} column="status" />
          </>
        }
        action={canCreate ? create("small") : undefined}
      />
      {selected && (
        <RecordSummaryPreview
          model="component_definitions"
          fields={[
            { key: "code", label: "Code", render: (row) => <Id>{row.code}</Id> },
            { key: "categoryLabel", label: "Category" },
            {
              key: "description",
              label: "Description",
              render: (row) => row.description || <Absent label="Not recorded" />,
            },
            {
              key: "version",
              label: "Latest version",
              render: (row) => row.version ?? <Absent label="No versions" />,
            },
            {
              key: "status",
              label: "State",
              render: (row) => (
                <StatusBadge
                  statuses={revisionStates}
                  value={row.status}
                  absentLabel="No versions"
                />
              ),
            },
            {
              key: "types",
              label: "Types",
              render: (row) => row.types ?? <Absent label="None defined" />,
            },
            { key: "controls", label: "Controls" },
          ]}
          record={rows.find((row) => row.id === selected.id) ?? selected}
          rows={displayed}
          onSelect={setSelected}
          onClose={() => setSelected(null)}
        />
      )}
    </Page>
  );
}

type EditTarget = {
  table:
    | "component_definitions"
    | "component_definition_revisions"
    | "defined_components"
    | "defined_component_implementations";
  existing?: DataRecord | undefined;
  initialValues?: Record<string, RecordValue> | undefined;
  onSaved?: ((record: DataRecord) => void) | undefined;
};

export function ComponentLibraryRecord({
  id,
  initialVersion,
  tab: routeTab,
  onTabChange,
}: {
  id: string;
  initialVersion?: string;
  /** The open tab, when the route keeps it in the address; otherwise the record keeps its own. */
  tab?: ComponentTab | undefined;
  onTabChange?: ((tab: ComponentTab) => void) | undefined;
}) {
  const navigate = useNavigate();
  // Above the version, so choosing another version keeps the reader on the tab they are reading.
  const [ownTab, setOwnTab] = useState<ComponentTab>("Overview");
  const tab = routeTab ?? ownTab;
  function changeTab(next: ComponentTab) {
    setOwnTab(next);
    onTabChange?.(next);
  }
  const definition = useRow("component_definitions", id);
  const revisions = useRows("component_definition_revisions", { component_definition_id: id });
  const workspace = useWorkspace();
  const publishing = usePublishVersion(
    "component_definition_revisions",
    "Programs can add it from the library once it is published.",
  );
  const [selectedVersion, setSelectedVersion] = useState(initialVersion ?? "");
  // Which control chose the version, so the new version's page gives focus to its twin.
  const versionChoice = useRef<VersionChoice | null>(null);
  const [edit, setEdit] = useState<EditTarget | null>(null);
  const versions = useMemo(
    () => [...(revisions.data ?? [])].sort((a, b) => b.version_number - a.version_number),
    [revisions.data],
  );
  const current =
    versions.find(
      (revision) =>
        revision.id === selectedVersion || String(revision.version_number) === selectedVersion,
    ) ?? versions[0];
  // The same query ComponentRevision reads for Structure, so publishing knows what is in it.
  const content = useRows(
    "defined_components",
    current ? { component_definition_revision_id: current.id } : {},
    { enabled: !!current },
  );
  const editable = canAuthorLibrary(workspace.role);
  function selectVersion(versionId: string) {
    setSelectedVersion(versionId);
    // The version is part of the address, so a reload, Back or a shared link keeps it.
    void navigate({
      to: "/library/components/$componentKey",
      params: { componentKey: id },
      search: (previous) => ({ ...previous, version: versionId }),
      replace: true,
    });
  }
  function createVersion() {
    const next = nextVersionNumber(versions);
    setEdit({
      table: "component_definition_revisions",
      initialValues: { component_definition_id: id, version_number: next },
      onSaved: (record) => {
        selectVersion(record.id);
        toast.add({
          title: `Version ${String(record["version_number"] ?? next)} created`,
          type: "success",
        });
      },
    });
  }
  // Publishing needs content: a version with no components publishes nothing a program can use.
  const publishReason =
    content.data === undefined
      ? content.isError
        ? "This version's content could not be loaded."
        : "This version's content is still loading."
      : content.data.length
        ? undefined
        : "Add a component in Structure before publishing this version.";
  if (!definition.data)
    return (
      <QueryState queries={[definition]}>
        <MissingRecord backTo="/library/components" kind="Component" />
      </QueryState>
    );
  const record = definition.data;
  return (
    <Page>
      <PageHeader>
        <RecordTrail current={record.name}>
          <TrailLink to="/library/components">Components</TrailLink>
        </RecordTrail>
        <PageHeader.Heading>
          <PageHeader.Title>{record.name}</PageHeader.Title>
        </PageHeader.Heading>
        {editable && (
          <PageHeader.Actions>
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button iconAfter={<ChevronDown />}>Actions</Button>} />
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() =>
                    setEdit({
                      table: "component_definitions",
                      existing: record as unknown as DataRecord,
                    })
                  }
                >
                  Edit component
                </DropdownMenuItem>
                <DropdownMenuItem
                  {...(revisions.data
                    ? {}
                    : {
                        disabledReason: revisions.isError
                          ? "The versions could not be loaded."
                          : "The versions are still loading.",
                      })}
                  onClick={createVersion}
                >
                  Create component version
                </DropdownMenuItem>
                {current?.state === "draft" && (
                  <>
                    <DropdownMenuItem
                      onClick={() =>
                        setEdit({
                          table: "component_definition_revisions",
                          existing: current as unknown as DataRecord,
                        })
                      }
                    >
                      Edit component version
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      {...(publishReason ? { disabledReason: publishReason } : {})}
                      onClick={() => void publishing.publish(current)}
                    >
                      Publish version
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            {publishing.confirmation}
          </PageHeader.Actions>
        )}
      </PageHeader>
      {edit && (
        <ProductRecordDialog
          table={edit.table}
          existing={edit.existing}
          initialValues={edit.initialValues}
          onSaved={edit.onSaved}
          onClose={() => setEdit(null)}
        />
      )}
      <QueryState queries={[revisions]}>
        {current ? (
          <ComponentRevision
            key={current.id}
            definition={record}
            revision={current}
            versions={versions}
            onVersion={selectVersion}
            versionChoice={versionChoice}
            editable={editable}
            tab={tab}
            onTab={changeTab}
          />
        ) : (
          <EmptyMessage
            illustration="tree"
            title="No versions yet"
            description={
              editable
                ? "Create the first version, then add its components and their control implementations. Programs add a version once it is published."
                : "An editor authors this component's versions; programs add a version once it is published."
            }
            action={
              editable ? (
                <Button variant="primary" iconBefore={<Plus />} onClick={createVersion}>
                  Create component version
                </Button>
              ) : undefined
            }
          />
        )}
      </QueryState>
    </Page>
  );
}

const componentTabs = [
  "Overview",
  "Controls",
  "Structure",
  "Requirements",
  "Evidence",
  "Versions",
  "Programs",
] as const;
export type ComponentTab = (typeof componentTabs)[number];

type ClaimRow = Row<"defined_component_implementations"> & {
  code: string | null;
  title: string;
  component: string | null;
  coverageLabel: string | null;
};

function ComponentRevision({
  definition,
  revision,
  versions,
  onVersion,
  versionChoice,
  editable,
  tab,
  onTab,
}: {
  definition: Row<"component_definitions">;
  revision: Row<"component_definition_revisions">;
  versions: Row<"component_definition_revisions">[];
  onVersion: (id: string) => void;
  /** Where the last version choice came from, which this page's focus reads once it is drawn. */
  versionChoice: RefObject<VersionChoice | null>;
  editable: boolean;
  tab: ComponentTab;
  onTab: (tab: ComponentTab) => void;
}) {
  const navigate = useNavigate();
  const locale = useLedgerLocale();
  const versionFocus = useVersionFocus(versionChoice);
  const components = useRows("defined_components", {
    component_definition_revision_id: revision.id,
  });
  const implementations = useRows("defined_component_implementations", {
    component_definition_revision_id: revision.id,
  });
  const controls = useRows(
    "controls",
    {},
    { columns: ["id", "code", "title", "source_id", "status"], enabled: tab === "Controls" },
  );
  const uses = useRows("system_components");
  const systems = useRows("systems", {}, { columns: ["id", "name", "program_id"] });
  const programs = useRows("programs", {}, { columns: ["id", "name"] });
  const [structurePreview, setStructurePreview] = useState<Row<"defined_components"> | null>(null);
  const [usePreview, setUsePreview] = useState<Row<"system_components"> | null>(null);
  const [claimPreview, setClaimPreview] = useState<ClaimRow | null>(null);
  const [edit, setEdit] = useState<EditTarget | null>(null);
  const [inspected, setInspected] = useState<ControlSummary | null>(null);
  const [readingControl, setReadingControl] = useState<ControlSummary | null>(null);
  // A preview belongs to the tab it was opened from: choosing another tab ends it.
  const [previewTab, setPreviewTab] = useState(tab);
  if (previewTab !== tab) {
    setPreviewTab(tab);
    setStructurePreview(null);
    setUsePreview(null);
    setClaimPreview(null);
    setInspected(null);
    setReadingControl(null);
  }
  const canEdit = editable && revision.state === "draft";
  const componentIds = useMemo(
    () => new Set(components.data?.map((component) => component.id)),
    [components.data],
  );
  const currentUses = useMemo(
    () =>
      (uses.data ?? []).filter(
        (use) => use.defined_component_id && componentIds.has(use.defined_component_id),
      ),
    [uses.data, componentIds],
  );
  const controlById = useMemo(
    () => new Map((controls.data ?? []).map((control) => [control.id, control])),
    [controls.data],
  );
  const claimRows = useMemo(
    () =>
      (implementations.data ?? []).map((claim): ClaimRow => {
        const control = claim.control_id ? controlById.get(claim.control_id) : undefined;
        return {
          ...claim,
          code: control?.code ?? null,
          title: control?.title ?? "Control",
          component:
            components.data?.find((component) => component.id === claim.defined_component_id)
              ?.name ?? null,
          coverageLabel: claim.coverage ? labelFor(claim.coverage) : null,
        };
      }),
    [implementations.data, controlById, components.data],
  );
  const implementationLabel = productCreateLabel("defined_component_implementations");
  const columns = useMemo(
    () =>
      defineColumns<ClaimRow>((c) => [
        c.id("code", {
          header: "Control",
          width: 130,
          priority: 1,
          // The eye previews the row: this component's implementation of the control.
          preview: setClaimPreview,
          active: (claim) => claim.id === claimPreview?.id,
        }),
        c.text("title", {
          header: "Title",
          hideable: false,
          priority: 0,
          minWidth: 220,
          cell: (row) => (
            <RecordLink table="defined_component_implementations" record={row}>
              {row.title}
            </RecordLink>
          ),
        }),
        c.text("component", { header: "Component", width: 180 }),
        c.text("description", { header: "Implementation", minWidth: 220 }),
        c.text("coverageLabel", { header: "Coverage", width: 110 }),
        c.status("implementation_status", {
          header: "Implementation status",
          width: 200,
          statuses: implementationStatuses,
        }),
        c.actions((row) => [
          {
            label: "Read control",
            onSelect: () =>
              setInspected((row.control_id && controlById.get(row.control_id)) || null),
          },
          ...(canEdit
            ? [
                {
                  label: "Edit control implementation",
                  onSelect: () =>
                    setEdit({
                      table: "defined_component_implementations",
                      existing: row as unknown as DataRecord,
                    }),
                },
              ]
            : []),
        ]),
      ]),
    [canEdit, controlById, claimPreview?.id],
  );
  const table = useDataTable({
    data: claimRows,
    columns,
    getRowId: (row) => row.id,
    rowLabel: (row) => (row.code ? `${row.code} ${row.title}` : row.title),
    label: "Reusable control implementations",
    view: "live-component-controls",
    resizable: true,
  });
  const displayedClaims = useDisplayedRecords(table);
  const displayedControls = useMemo(
    () => [
      ...new Map(
        displayedClaims.flatMap((claim) => {
          const control = claim.control_id ? controlById.get(claim.control_id) : undefined;
          return control ? [[control.id, control] as const] : [];
        }),
      ).values(),
    ],
    [displayedClaims, controlById],
  );

  const structureRows = useMemo(
    () =>
      (components.data ?? []).map((component) => ({
        ...component,
        typeLabel: labelFor(component.component_type),
      })),
    [components.data],
  );
  const definedLabel = productCreateLabel("defined_components");
  const structureColumns = useMemo(
    () =>
      defineColumns<(typeof structureRows)[number]>((c) => [
        c.id("name", {
          header: "Component",
          hideable: false,
          priority: 0,
          minWidth: 200,
          preview: setStructurePreview,
          active: (row) => row.id === structurePreview?.id,
          cell: (row) => (
            <RecordLink table="defined_components" record={row}>
              {row.name}
            </RecordLink>
          ),
        }),
        c.text("typeLabel", { header: "Type", width: 150 }),
        c.text("description", { header: "Description", wrap: true }),
        ...(canEdit
          ? [
              c.actions((row) => [
                {
                  label: `Edit ${productRecordNoun("defined_components")}`,
                  onSelect: () =>
                    setEdit({
                      table: "defined_components",
                      existing: row as unknown as DataRecord,
                    }),
                },
              ]),
            ]
          : []),
      ]),
    [canEdit, structurePreview?.id],
  );
  const structureTable = useDataTable({
    data: structureRows,
    columns: structureColumns,
    getRowId: (row) => row.id,
    rowLabel: (row) => row.name,
    label: "Component structure",
    view: "component-definition-structure",
    resizable: true,
    reorderable: true,
  });
  const useRowsForTable = useMemo(() => {
    const systemById = new Map((systems.data ?? []).map((system) => [system.id, system]));
    const programById = new Map((programs.data ?? []).map((program) => [program.id, program]));
    return currentUses.map((use) => {
      const system = systemById.get(use.system_id);
      const program = system?.program_id ? programById.get(system.program_id) : undefined;
      return {
        ...use,
        program_id: program?.id ?? null,
        programName: program?.name ?? null,
        systemName: system?.name ?? null,
      };
    });
  }, [currentUses, systems.data, programs.data]);
  const useColumns = useMemo(
    () =>
      defineColumns<(typeof useRowsForTable)[number]>((c) => [
        c.id("code", {
          header: "ID",
          width: 150,
          priority: 1,
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
            row.program_id && row.programName ? (
              <TextLink
                render={<Link to="/programs/$programId" params={{ programId: row.program_id }} />}
              >
                {row.programName}
              </TextLink>
            ) : (
              <Absent label="Not available" />
            ),
        }),
        c.text("systemName", {
          header: "System",
          cell: (row) =>
            row.program_id && row.systemName ? (
              <TextLink
                render={
                  <Link
                    to="/programs/$programId/systems/$scopeId"
                    params={{ programId: row.program_id, scopeId: row.system_id }}
                  />
                }
              >
                {row.systemName}
              </TextLink>
            ) : (
              <Absent label="Not available" />
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
    rowLabel: (row) => row.name,
    label: "Program component uses",
    view: "component-definition-program-uses",
    resizable: true,
    reorderable: true,
  });
  const displayedStructure = useDisplayedRecords(structureTable);
  const displayedUses = useDisplayedRecords(usesTable);
  const createComponentAction = (size: "small" | "medium") =>
    canEdit ? (
      <Button
        size={size}
        variant="primary"
        iconBefore={<Plus />}
        onClick={() => setEdit({ table: "defined_components" })}
      >
        {definedLabel}
      </Button>
    ) : undefined;
  const noComponents = components.data !== undefined && components.data.length === 0;
  const createImplementationAction = (size: "small" | "medium") =>
    canEdit ? (
      <Button
        size={size}
        variant="primary"
        iconBefore={<Plus />}
        {...(components.data === undefined
          ? { disabledReason: "This version's components are still loading." }
          : noComponents
            ? { disabledReason: "Add a component in Structure first." }
            : {})}
        onClick={() => setEdit({ table: "defined_component_implementations" })}
      >
        {implementationLabel}
      </Button>
    ) : undefined;
  const authored: [string, string | null][] = [
    ["Conditions", revision.conditions],
    ["Consumer responsibilities", revision.consumer_responsibilities],
    ["Remarks", revision.remarks],
  ];

  return (
    <Stack space="space.200">
      {edit && (
        <ProductRecordDialog
          table={edit.table}
          initialValues={edit.initialValues ?? { component_definition_revision_id: revision.id }}
          existing={edit.existing}
          onSaved={edit.onSaved}
          onClose={() => setEdit(null)}
        />
      )}
      <Tabs value={tab} onValueChange={(value) => onTab(value as ComponentTab)}>
        <TabsList variant="line" aria-label="Component sections">
          {componentTabs.map((name) => (
            <TabsTrigger key={name} value={name}>
              {name}
              {name === "Controls" && implementations.data && (
                <Count
                  value={new Set(implementations.data.map((claim) => claim.control_id)).size}
                  max={9999}
                />
              )}
            </TabsTrigger>
          ))}
        </TabsList>
        {/* Each tab keeps its panel once drawn, so a register keeps its rows, question and place. */}
        <RetainedTabPanels tabs={componentTabs} value={tab} space="space.200">
          {(name) => {
            switch (name) {
              case "Overview":
                return (
                  <Stack space="space.200" className="max-w-layout-measure">
                    <Prose label="Description">
                      {definition.description || <Absent label="Not recorded" />}
                    </Prose>
                    {authored.map(([label, text]) =>
                      text ? (
                        <Prose key={label} label={label}>
                          {text}
                        </Prose>
                      ) : null,
                    )}
                  </Stack>
                );
              case "Controls":
                return (
                  <ProductCollection
                    action={createImplementationAction("small")}
                    table={table}
                    queries={[implementations, controls, components]}
                    onRowClick={(claim) =>
                      void navigate(recordDestination("defined_component_implementations", claim))
                    }
                    empty={{
                      illustration: "shield",
                      title: "No control implementations",
                      description: canEdit
                        ? noComponents
                          ? "Add a component in Structure, then author its control implementations."
                          : "Author how this version's components implement their controls."
                        : "The control implementations authored for this version appear here.",
                      action: createImplementationAction("medium"),
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
                );
              case "Structure":
                return (
                  <ProductCollection
                    table={structureTable}
                    queries={[components]}
                    fill
                    onRowClick={(row) =>
                      void navigate(recordDestination("defined_components", row))
                    }
                    empty={{
                      illustration: "tree",
                      title: "No components yet",
                      description: canEdit
                        ? "Create a component to author this version's reusable implementation content."
                        : "The components this version defines appear here.",
                      action: createComponentAction("medium"),
                    }}
                    searchLabel="Find components"
                    filters={<DataTable.Filter table={structureTable} column="typeLabel" />}
                    action={createComponentAction("small")}
                  />
                );
              case "Versions":
                return (
                  <VersionHistory
                    label="Component versions"
                    versions={versions}
                    shownId={revision.id}
                    shownRef={versionFocus.shown}
                    onVersion={(id) => {
                      versionChoice.current = "history";
                      onVersion(id);
                    }}
                  />
                );
              case "Programs":
                return (
                  <ProductCollection
                    table={usesTable}
                    queries={[components, uses, systems, programs]}
                    fill
                    onRowClick={(row) => void navigate(recordDestination("system_components", row))}
                    empty={{
                      illustration: "tree",
                      title: "No program uses yet",
                      description:
                        "A program's use appears here once it adds this component version from the library.",
                    }}
                    searchLabel="Find component instances"
                    filters={<DataTable.Filter table={usesTable} column="programName" />}
                  />
                );
              case "Requirements":
              case "Evidence":
                return (
                  <QueryState queries={[components, uses]}>
                    <ComponentTraceability kind={name} uses={currentUses} />
                  </QueryState>
                );
            }
          }}
        </RetainedTabPanels>
      </Tabs>
      {tab === "Overview" && (
        <Shell.Aside label="Component details">
          <Stack space="space.200">
            <Inspector.Group title="Details">
              <KeyValue.Group layout="columns">
                <KeyValue label="Code">
                  <Id>{definition.code}</Id>
                </KeyValue>
                <KeyValue label="Category" wrap>
                  {labelFor(definition.category)}
                </KeyValue>
                <KeyValue label="Version">
                  {versions.length > 1 ? (
                    <LibrarySelect
                      inline
                      label="Version"
                      value={revision.id}
                      options={versions.map((version) => ({
                        value: version.id,
                        label: `${version.version_number} · ${statusLabel(revisionStates, version.state)}`,
                      }))}
                      triggerRef={versionFocus.select}
                      onChange={(id) => {
                        versionChoice.current = "select";
                        onVersion(id);
                      }}
                    />
                  ) : (
                    revision.version_number
                  )}
                </KeyValue>
                <KeyValue label="State">
                  <StatusBadge statuses={revisionStates} value={revision.state} />
                </KeyValue>
                <KeyValue label="Published">
                  <DateTime
                    value={revision.published_at}
                    format="date"
                    absentLabel="Not published"
                  />
                </KeyValue>
                {revision.effective_from && (
                  <KeyValue label="Effective from">
                    <DateTime value={revision.effective_from} format="date" />
                  </KeyValue>
                )}
                {revision.review_due && (
                  <KeyValue label="Review due">
                    <DateTime value={revision.review_due} format="date" />
                  </KeyValue>
                )}
                <KeyValue label="Components">
                  <QueryValue queries={[components]}>
                    {() => locale.formatNumber(components.data?.length ?? 0)}
                  </QueryValue>
                </KeyValue>
                <KeyValue label="System uses">
                  <QueryValue queries={[components, uses]}>
                    {() => locale.formatNumber(currentUses.length)}
                  </QueryValue>
                </KeyValue>
              </KeyValue.Group>
            </Inspector.Group>
          </Stack>
        </Shell.Aside>
      )}
      {structurePreview && (
        <RecordSummaryPreview
          model="defined_components"
          readOnly={!canEdit}
          onEdit={() =>
            setEdit({
              table: "defined_components",
              existing: structurePreview as unknown as DataRecord,
            })
          }
          fields={[
            {
              key: "component_type",
              label: "Type",
              render: (row) => labelFor(row.component_type),
            },
            {
              key: "description",
              label: "Description",
              render: (row) => row.description || <Absent label="Not recorded" />,
            },
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
            {
              key: "version",
              label: "Version",
              render: (row) => row.version || <Absent label="Not recorded" />,
            },
            {
              key: "description",
              label: "Description",
              render: (row) => row.description || <Absent label="Not recorded" />,
            },
            {
              key: "programName",
              label: "Program",
              render: (row) =>
                useRowsForTable.find((item) => item.id === row.id)?.programName ?? (
                  <Absent label="Not available" />
                ),
            },
            {
              key: "systemName",
              label: "System",
              render: (row) =>
                useRowsForTable.find((item) => item.id === row.id)?.systemName ?? (
                  <Absent label="Not available" />
                ),
            },
          ]}
          record={usePreview}
          rows={displayedUses}
          onSelect={setUsePreview}
          onClose={() => setUsePreview(null)}
        />
      )}
      {claimPreview && (
        <RecordSummaryPreview
          model="defined_component_implementations"
          readOnly={!canEdit}
          onEdit={() =>
            setEdit({
              table: "defined_component_implementations",
              existing: claimPreview as unknown as DataRecord,
            })
          }
          fields={[
            {
              key: "code",
              label: "Control",
              render: (row) => {
                const control = row.control_id ? controlById.get(row.control_id) : undefined;
                return control ? (
                  <Button variant="link" onClick={() => setReadingControl(control)}>
                    {control.code} · {control.title}
                  </Button>
                ) : (
                  <Absent label="Not available" />
                );
              },
            },
            {
              key: "component",
              label: "Component",
              render: (row) => row.component ?? <Absent label="Not recorded" />,
            },
            {
              key: "implementation_status",
              label: "Status",
              render: (row) => (
                <StatusBadge statuses={implementationStatuses} value={row.implementation_status} />
              ),
            },
            {
              key: "coverageLabel",
              label: "Coverage",
              render: (row) => row.coverageLabel ?? <Absent label="Not recorded" />,
            },
            {
              key: "description",
              label: "Implementation",
              render: (row) => row.description || <Absent label="Not recorded" />,
            },
            ...(claimPreview.consumer_responsibility
              ? [{ key: "consumer_responsibility", label: "Consumer responsibility" }]
              : []),
          ]}
          record={claimPreview}
          rows={displayedClaims}
          onSelect={setClaimPreview}
          onClose={() => {
            setReadingControl(null);
            setClaimPreview(null);
          }}
        >
          {readingControl && (
            <ControlInspector
              control={readingControl}
              task="Control preview"
              onClose={() => setReadingControl(null)}
            />
          )}
        </RecordSummaryPreview>
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

/**
 * What a component version's program uses trace to: the requirements and the evidence linked
 * through their implementation contributions. Derived, so the reader opens a row's record to
 * change it; nothing is created here.
 */
function ComponentTraceability({
  kind,
  uses,
}: {
  kind: "Requirements" | "Evidence";
  uses: Row<"system_components">[];
}) {
  const navigate = useNavigate();
  const contributions = useRows(
    "component_contributions",
    {},
    { columns: ["id", "system_component_id", "implementation_statement_id"] },
  );
  const requirementLinks = useRows(
    "requirement_implementations",
    {},
    {
      columns: ["id", "requirement_revision_id", "component_contribution_id"],
      enabled: kind === "Requirements",
    },
  );
  const requirements = useRows("requirement_revisions", {}, { enabled: kind === "Requirements" });
  const engineering = useRows(
    "engineering_requirements",
    {},
    { columns: ["id", "code", "program_id"], enabled: kind === "Requirements" },
  );
  const evidenceLinks = useRows(
    "implementation_evidence",
    {},
    {
      columns: [
        "id",
        "evidence_version_id",
        "implementation_statement_id",
        "component_contribution_id",
      ],
      enabled: kind === "Evidence",
    },
  );
  const evidence = useRows("evidence_versions", {}, { enabled: kind === "Evidence" });
  const artifacts = useRows(
    "evidence_artifacts",
    {},
    { columns: ["id", "title", "program_id"], enabled: kind === "Evidence" },
  );
  const [requirementPreview, setRequirementPreview] = useState<RequirementLine | null>(null);
  const [evidencePreview, setEvidencePreview] = useState<EvidenceLine | null>(null);
  // A preview belongs to its tab: it ends when the tab hides this collection.
  useEndOnHide(() => {
    setRequirementPreview(null);
    setEvidencePreview(null);
  });
  const relevant = useMemo(() => {
    const useIds = new Set(uses.map((use) => use.id));
    return (contributions.data ?? []).filter((row) => useIds.has(row.system_component_id));
  }, [uses, contributions.data]);
  const requirementRows = useMemo((): RequirementLine[] => {
    const contributionIds = new Set(relevant.map((row) => row.id));
    const linked = new Set(
      (requirementLinks.data ?? [])
        .filter(
          (link) =>
            !!link.component_contribution_id && contributionIds.has(link.component_contribution_id),
        )
        .map((link) => link.requirement_revision_id),
    );
    const byId = new Map((engineering.data ?? []).map((row) => [row.id, row]));
    return (requirements.data ?? [])
      .filter((row) => linked.has(row.id))
      .map((row) => {
        const requirement = byId.get(row.engineering_requirement_id);
        return {
          ...row,
          // The line opens the requirement, whose record page carries its revisions.
          requirementId: row.engineering_requirement_id,
          code: requirement?.code ?? null,
          program_id: requirement?.program_id ?? null,
        };
      });
  }, [relevant, requirementLinks.data, requirements.data, engineering.data]);
  const evidenceRows = useMemo((): EvidenceLine[] => {
    const contributionIds = new Set(relevant.map((row) => row.id));
    const statementIds = new Set(relevant.flatMap((row) => row.implementation_statement_id ?? []));
    const linked = new Set(
      (evidenceLinks.data ?? [])
        .filter(
          (link) =>
            (!!link.implementation_statement_id &&
              statementIds.has(link.implementation_statement_id)) ||
            (!!link.component_contribution_id &&
              contributionIds.has(link.component_contribution_id)),
        )
        .map((link) => link.evidence_version_id),
    );
    const byId = new Map((artifacts.data ?? []).map((row) => [row.id, row]));
    return (evidence.data ?? [])
      .filter((row) => linked.has(row.id))
      .map((row) => ({ ...row, title: byId.get(row.artifact_id)?.title ?? "Evidence artifact" }));
  }, [relevant, evidenceLinks.data, evidence.data, artifacts.data]);
  const requirementColumns = useMemo(
    () =>
      defineColumns<RequirementLine>((c) => [
        c.id("code", {
          header: "Requirement",
          width: 150,
          priority: 1,
          preview: setRequirementPreview,
          active: (row) => row.id === requirementPreview?.id,
        }),
        c.text("title", {
          header: "Title",
          hideable: false,
          priority: 0,
          minWidth: 220,
          cell: (row) => (
            <RecordLink
              table="engineering_requirements"
              record={{ id: row.requirementId, program_id: row.program_id }}
            >
              {row.title}
            </RecordLink>
          ),
        }),
        c.number("version_number", { header: "Revision", width: 110 }),
        c.status("state", { header: "State", width: 130, statuses: revisionStates }),
      ]),
    [requirementPreview?.id],
  );
  const requirementTable = useDataTable({
    data: requirementRows,
    columns: requirementColumns,
    getRowId: (row) => row.id,
    label: "Requirements traced to this component",
    view: "component-definition-requirements",
    resizable: true,
  });
  const displayedRequirements = useDisplayedRecords(requirementTable);
  const evidenceColumns = useMemo(
    () =>
      defineColumns<EvidenceLine>((c) => [
        c.text("title", {
          header: "Evidence artifact",
          hideable: false,
          priority: 0,
          minWidth: 220,
          cell: (row) => (
            <RecordLink table="evidence_artifacts" record={{ id: row.artifact_id }}>
              {row.title}
            </RecordLink>
          ),
        }),
        c.id("version_number", {
          header: "Version",
          width: 110,
          priority: 1,
          preview: setEvidencePreview,
          active: (row) => row.id === evidencePreview?.id,
        }),
        c.status("state", { header: "State", width: 130, statuses: revisionStates }),
        c.date("collected_at", { header: "Collected", width: 120 }),
      ]),
    [evidencePreview?.id],
  );
  const evidenceTable = useDataTable({
    data: evidenceRows,
    columns: evidenceColumns,
    getRowId: (row) => row.id,
    rowLabel: (row) => `${row.title} version ${row.version_number}`,
    label: "Evidence traced to this component",
    view: "component-definition-evidence",
    resizable: true,
  });
  const displayedEvidence = useDisplayedRecords(evidenceTable);
  const derived =
    "Links appear here when a program that uses this component version links them to its implementation.";
  return kind === "Requirements" ? (
    <>
      <ProductCollection
        table={requirementTable}
        queries={[contributions, requirementLinks, requirements, engineering]}
        fill
        onRowClick={(row) =>
          void navigate(
            recordDestination("engineering_requirements", {
              id: row.requirementId,
              program_id: row.program_id,
            }),
          )
        }
        empty={{
          illustration: "shield",
          title: "No requirements traced yet",
          description: derived,
        }}
        searchLabel="Find requirements"
        filters={<DataTable.Filter table={requirementTable} column="state" />}
      />
      {requirementPreview && (
        <RecordSummaryPreview
          model="requirement_revisions"
          readOnly
          fields={[
            {
              key: "code",
              label: "Requirement",
              render: (row) => (row.code ? <Id>{row.code}</Id> : <Absent label="Not recorded" />),
            },
            { key: "version_number", label: "Revision" },
            {
              key: "state",
              label: "State",
              render: (row) => <StatusBadge statuses={revisionStates} value={row.state} />,
            },
            {
              key: "statement",
              label: "Statement",
              render: (row) => row.statement || <Absent label="Not recorded" />,
            },
          ]}
          record={requirementPreview}
          rows={displayedRequirements}
          onSelect={setRequirementPreview}
          onClose={() => setRequirementPreview(null)}
        />
      )}
    </>
  ) : (
    <>
      <ProductCollection
        table={evidenceTable}
        queries={[contributions, evidenceLinks, evidence, artifacts]}
        fill
        onRowClick={(row) =>
          void navigate(recordDestination("evidence_artifacts", { id: row.artifact_id }))
        }
        empty={{
          illustration: "document",
          title: "No evidence traced yet",
          description: derived,
        }}
        searchLabel="Find evidence"
        filters={<DataTable.Filter table={evidenceTable} column="state" />}
      />
      {evidencePreview && (
        <RecordSummaryPreview
          model="evidence_versions"
          readOnly
          fields={[
            { key: "version_number", label: "Version" },
            {
              key: "state",
              label: "State",
              render: (row) => <StatusBadge statuses={revisionStates} value={row.state} />,
            },
            {
              key: "collected_at",
              label: "Collected",
              render: (row) => <DateTime value={row.collected_at} absentLabel="Not recorded" />,
            },
            {
              key: "location",
              label: "Location",
              render: (row) => <EvidenceLocation version={row} />,
            },
          ]}
          record={evidencePreview}
          rows={displayedEvidence}
          onSelect={setEvidencePreview}
          onClose={() => setEvidencePreview(null)}
        />
      )}
    </>
  );
}

type RequirementLine = Row<"requirement_revisions"> & {
  requirementId: string;
  code: string | null;
  program_id: string | null;
};
type EvidenceLine = Row<"evidence_versions"> & { title: string };

/** Where an evidence version is held: its external address, in a new tab, or the stored file. */
function EvidenceLocation({ version }: { version: Row<"evidence_versions"> }) {
  if (version.external_uri && /^https?:\/\//.test(version.external_uri))
    return (
      <TextLink href={version.external_uri} newTab className="break-all">
        {version.external_uri}
      </TextLink>
    );
  if (version.external_uri) return <Id>{version.external_uri}</Id>;
  if (version.storage_object_name) return <Text>{version.storage_object_name}</Text>;
  return <Absent label="No file or address" />;
}
