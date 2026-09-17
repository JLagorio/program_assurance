import { useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Columns3, Plus } from "lucide-react";
import {
  Absent,
  Button,
  DataTable,
  Id,
  Shell,
  Stack,
  Table,
  Text,
  TextLink,
  Toolbar,
  defineColumns,
  useDataTable,
  type Preset,
} from "@ledger/design-system";
import { useWorkspace } from "@/components/app/workspace";
import { database, requireIdentity } from "@/lib/database";
import { useRows, type Row } from "@/lib/models";
import { labelFor } from "@/lib/records";
import { isControlStatement } from "@/lib/requirement-control-mappings";
import {
  requirementIdentityLinks,
  requirementTree,
  type RequirementTreeNode,
} from "@/lib/requirement-tree";
import { ProgramEditor } from "./program-shared";
import { RecordPreviewActions, RecordPreviewPanel } from "./record-preview";
import { RequirementRecordContent, type RequirementTab } from "./requirement-record";

type Allocation = { id: string; name: string; kind: string; rationale: string | null };
type RequirementView = {
  id: string;
  code: string;
  revisionId: string | null;
  name: string;
  statement: string;
  requirementType: string | null;
  owner: string | null;
  allocations: Allocation[];
  controlSources: { id: string; label: string; relationship: string; needsReview: boolean }[];
  allocation: "Allocated" | "Unallocated" | "Details not recorded";
  controlMapping: "Control linked" | "No control linked" | "Details not recorded" | "Needs review";
};
type RequirementNode = RequirementTreeNode<RequirementView>;

const presets: Preset[] = [
  { id: "all", label: "All requirements" },
  {
    id: "unallocated",
    label: "Unallocated",
    filters: [{ id: "allocation", value: ["Unallocated"] }],
  },
  {
    id: "control-linked",
    label: "Control linked",
    filters: [{ id: "controlMapping", value: ["Control linked"] }],
  },
  {
    id: "no-control",
    label: "No control linked",
    filters: [{ id: "controlMapping", value: ["No control linked"] }],
  },
];

/** Fetch only the reference statements these requirements actually link to. */
function useControlStatements(ids: string[], enabled: boolean) {
  const workspace = useWorkspace();
  return useQuery({
    queryKey: ["requirement-control-statements", workspace.tenantId, ids],
    enabled,
    retry: false,
    queryFn: async ({ signal }) => {
      const token = await requireIdentity(workspace);
      const records: Row<"control_parts">[] = [];
      for (let offset = 0; offset < ids.length; offset += 100) {
        const { data, error } = await database()
          .from("control_parts")
          .select("*")
          .in("id", ids.slice(offset, offset + 100))
          .setHeader("Authorization", `Bearer ${token}`)
          .abortSignal(signal);
        if (error) throw new Error(error.message);
        records.push(...data);
      }
      const seen = new Set(records.map((record) => record.id));
      let parents = records.flatMap((record) => record.parent_part_id ?? []);
      while (parents.length) {
        const missing = [...new Set(parents)].filter((id) => !seen.has(id));
        if (!missing.length) break;
        missing.forEach((id) => seen.add(id));
        parents = [];
        for (let offset = 0; offset < missing.length; offset += 100) {
          const { data, error } = await database()
            .from("control_parts")
            .select()
            .in("id", missing.slice(offset, offset + 100))
            .setHeader("Authorization", `Bearer ${token}`)
            .abortSignal(signal);
          if (error) throw new Error(error.message);
          records.push(...data);
          parents.push(...data.flatMap((record) => record.parent_part_id ?? []));
        }
      }
      return records;
    },
  });
}

function AllocationsDetail({ row }: { row: RequirementNode }) {
  return (
    <Table aria-label={`${row.code} allocations`}>
      <thead>
        <Table.Row>
          <Table.Header>Allocated to</Table.Header>
          <Table.Header width={160}>Target type</Table.Header>
          <Table.Header>Rationale</Table.Header>
        </Table.Row>
      </thead>
      <tbody>
        {row.allocations.map((allocation) => (
          <Table.Row key={allocation.id}>
            <Table.Cell>{allocation.name}</Table.Cell>
            <Table.Cell>{allocation.kind}</Table.Cell>
            <Table.Cell className="whitespace-normal">
              {allocation.rationale ?? <Absent />}
            </Table.Cell>
          </Table.Row>
        ))}
      </tbody>
    </Table>
  );
}

export function RequirementsTable({
  programId,
  previewId,
  previewTab,
  onPreview,
  onPreviewTabChange,
  fill,
}: {
  programId: string;
  previewId?: string | undefined;
  previewTab?: RequirementTab | undefined;
  onPreview?: ((id: string | undefined) => void) | undefined;
  onPreviewTabChange?: ((tab: RequirementTab) => void) | undefined;
  /** The register is the page's one block: it takes the rest of the window. */
  fill?: boolean | undefined;
}) {
  const workspace = useWorkspace();
  const navigate = useNavigate();
  const requirements = useRows("engineering_requirements", { program_id: programId });
  const revisions = useRows("requirement_revisions");
  const allocations = useRows("requirement_allocations");
  const decompositions = useRows("requirement_decompositions");
  const controlLinks = useRows("requirement_control_links");
  const controls = useRows("controls");
  const systems = useRows("systems", { program_id: programId });
  const providers = useRows("provider_capabilities");
  const processes = useRows("security_processes", { program_id: programId });
  const parties = useRows("parties");
  const [adding, setAdding] = useState(false);
  const [localPreviewId, setLocalPreviewId] = useState<string>();
  const [localTab, setLocalTab] = useState<RequirementTab>("Overview");
  const selectedId = onPreview ? previewId : localPreviewId;
  const selectedTab = onPreviewTabChange ? (previewTab ?? "Overview") : localTab;
  const openPreview = onPreview ?? setLocalPreviewId;
  const changePreviewTab = onPreviewTabChange ?? setLocalTab;
  const previewRef = useRef({ selectedId, openPreview });
  previewRef.current = { selectedId, openPreview };

  const latest = useMemo(() => {
    const values = new Map<string, Row<"requirement_revisions">>();
    for (const revision of revisions.data ?? []) {
      const current = values.get(revision.engineering_requirement_id);
      if (!current || current.version_number < revision.version_number)
        values.set(revision.engineering_requirement_id, revision);
    }
    return values;
  }, [revisions.data]);
  const activeRevisionIds = useMemo(
    () =>
      new Set(
        (requirements.data ?? []).flatMap((row) => {
          const revision = latest.get(row.id);
          return revision ? [revision.id] : [];
        }),
      ),
    [requirements.data, latest],
  );
  const partIds = useMemo(
    () =>
      [
        ...new Set(
          (controlLinks.data ?? [])
            .filter((link) => activeRevisionIds.has(link.requirement_revision_id))
            .flatMap((link) => link.control_part_id ?? []),
        ),
      ].sort(),
    [controlLinks.data, activeRevisionIds],
  );
  const statements = useControlStatements(
    partIds,
    controlLinks.isSuccess && revisions.isSuccess && requirements.isSuccess,
  );
  const projection = useMemo(() => {
    const systemById = new Map((systems.data ?? []).map((row) => [row.id, row]));
    const providerById = new Map((providers.data ?? []).map((row) => [row.id, row]));
    const processById = new Map((processes.data ?? []).map((row) => [row.id, row]));
    const partyById = new Map((parties.data ?? []).map((row) => [row.id, row]));
    const statementById = new Map((statements.data ?? []).map((row) => [row.id, row]));
    const controlById = new Map((controls.data ?? []).map((row) => [row.id, row]));
    const rows: RequirementView[] = (requirements.data ?? [])
      .map<RequirementView>((requirement) => {
        const revision = latest.get(requirement.id);
        const targetRows = (allocations.data ?? [])
          .filter((row) => row.requirement_revision_id === revision?.id)
          .map((row) => {
            const systemId =
              (row as typeof row & { system_id?: string | null }).system_id ??
              row.composition_node_id;
            const target = systemId
              ? systemById.get(systemId)
              : row.provider_capability_id
                ? providerById.get(row.provider_capability_id)
                : row.security_process_id
                  ? processById.get(row.security_process_id)
                  : undefined;
            return {
              id: row.id,
              name: target ? `${target.code} · ${target.name}` : "Target unavailable",
              kind: systemId
                ? "System element"
                : row.provider_capability_id
                  ? "Provider capability"
                  : "Security process",
              rationale: row.rationale,
            };
          });
        const sources = (controlLinks.data ?? [])
          .filter((link) => link.requirement_revision_id === revision?.id)
          .map((link) => {
            const statement = link.control_part_id
              ? statementById.get(link.control_part_id)
              : undefined;
            const control = controlById.get(link.control_id);
            const needsReview =
              !!link.control_part_id &&
              (!statement || !isControlStatement(statement, statements.data ?? []));
            return {
              id: link.id,
              label: control ? `${control.code} · ${control.title}` : "Control unavailable",
              relationship: needsReview
                ? `Needs review · ${statement ? labelFor(statement.name) : "Target unavailable"}`
                : labelFor(link.relationship_type),
              needsReview,
            };
          });
        return {
          id: requirement.id,
          code: requirement.code,
          revisionId: revision?.id ?? null,
          name: revision?.title ?? requirement.code,
          statement: revision?.statement ?? "Details not recorded",
          requirementType: revision ? labelFor(revision.requirement_type) : null,
          owner: revision?.owner_party_id
            ? (partyById.get(revision.owner_party_id)?.name ?? "Owner unavailable")
            : null,
          allocations: targetRows,
          controlSources: sources,
          allocation: targetRows.length
            ? "Allocated"
            : revision
              ? "Unallocated"
              : "Details not recorded",
          controlMapping: sources.some((source) => source.needsReview)
            ? "Needs review"
            : sources.length
              ? "Control linked"
              : revision
                ? "No control linked"
                : "Details not recorded",
        };
      })
      .sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }));
    return {
      ...requirementTree(
        rows,
        requirementIdentityLinks(decompositions.data ?? [], revisions.data ?? []),
      ),
      byId: new Map(rows.map((row) => [row.id, row])),
    };
  }, [
    requirements.data,
    revisions.data,
    latest,
    allocations.data,
    controlLinks.data,
    controls.data,
    decompositions.data,
    systems.data,
    providers.data,
    processes.data,
    parties.data,
    statements.data,
  ]);

  const columns = useMemo(
    () =>
      defineColumns<RequirementNode>((c) => [
        c.id("code", {
          header: "Requirement",
          width: 152,
          priority: 1,
          pin: "start",
          hideable: false,
          preview: (row) => previewRef.current.openPreview(row.id),
          active: (row) => row.id === previewRef.current.selectedId,
          cell: (row) => (
            <TextLink
              render={
                <Link
                  to="/programs/$programId/requirements/$requirementId"
                  params={{ programId, requirementId: row.id }}
                />
              }
            >
              <Id>{row.code}</Id>
            </TextLink>
          ),
        }),
        c.text("statement", {
          header: "Overview",
          minWidth: 200,
          priority: 0,
          hideable: false,
          cell: (row) => (
            <TextLink
              render={
                <Link
                  to="/programs/$programId/requirements/$requirementId"
                  params={{ programId, requirementId: row.id }}
                />
              }
            >
              {row.statement}
            </TextLink>
          ),
        }),
        c.list("allocatedTo", {
          header: "Allocated to",
          width: 240,
          opens: "detail",
          items: (row) =>
            row.allocations.map((item) => ({ key: item.id, label: item.name, meta: item.kind })),
          empty: (row) => (
            <Text size="small" color="color.text.subtle">
              {row.allocation}
            </Text>
          ),
        }),
        c.list("controlSources", {
          header: "Linked controls",
          width: 220,
          items: (row) =>
            row.controlSources.map((source) => ({
              key: source.id,
              label: source.label,
              meta: source.relationship,
            })),
          empty: (row) => (
            <Text size="small" color="color.text.subtle">
              {row.controlMapping}
            </Text>
          ),
        }),
        c.text("requirementType", { header: "Type", width: 140 }),
        c.text("owner", { header: "Owner", width: 160 }),
        c.text("allocation", { header: "Allocation", width: 150 }),
        c.text("controlMapping", { header: "Control mapping", width: 160 }),
      ]),
    [programId],
  );
  const table = useDataTable({
    columns,
    data: projection.rows,
    getRowId: (row) => row.id,
    label: "Engineering requirements",
    view: "live-requirements-workspace",
    resizable: true,
    reorderable: true,
    pageSize: 25,
    tree: {
      children: (row) => row.parts,
      label: (row) => row.code,
      hint: (_, count) => (
        <Text size="xsmall" color="color.text.subtle">
          {count} part{count === 1 ? "" : "s"}
        </Text>
      ),
      initialExpanded: true,
    },
    detailColumn: false,
    detail: (row) => <AllocationsDetail row={row} />,
    initialState: {
      columnVisibility: {
        allocation: false,
        controlMapping: false,
        owner: false,
        requirementType: false,
      },
    },
  });
  const visibleRows = table
    .getRowModel()
    .rows.filter((row) => !row.getIsGrouped())
    .map((row) => row.original);
  const selectedIndex = visibleRows.findIndex((row) => row.id === selectedId);
  const queries = [
    requirements,
    revisions,
    allocations,
    decompositions,
    controlLinks,
    controls,
    systems,
    providers,
    processes,
    parties,
    statements,
  ];
  const error = queries.find((query) => query.error)?.error;
  const loading = queries.some((query) => query.isPending);
  const canCreate =
    workspace.role !== "viewer" &&
    workspace.collections.some(
      (collection) => collection.name === "engineering_requirements" && collection.can_insert,
    );
  const newRequirement = canCreate ? (
    <Button size="small" variant="primary" iconBefore={<Plus />} onClick={() => setAdding(true)}>
      Create engineering requirement
    </Button>
  ) : null;
  return (
    <>
      <Stack space="space.150">
        {!loading && !error && projection.unstructuredCount > 0 && (
          <p role="status" className="font-body-small text-subtle">
            Some requirements have multiple parents or circular relationships. They remain listed
            separately so every requirement stays visible.
          </p>
        )}
        <DataTable
          responsive
          table={table}
          fill={fill}
          onRowClick={(row) =>
            void navigate({
              to: "/programs/$programId/requirements/$requirementId",
              params: { programId, requirementId: row.id },
            })
          }
          state={error ? "error" : loading ? "loading" : "ready"}
          error={error instanceof Error ? error.message : "Requirements could not be loaded."}
          empty={{
            illustration: "shield",
            title: "No requirements yet",
            description: "Create the first engineering requirement for this program.",
            action: newRequirement,
          }}
          toolbar={
            <Toolbar
              search={String(table.state.globalFilter ?? "")}
              onSearch={(value) => table.setGlobalFilter(value)}
              placeholder="Find a requirement"
              views={
                <DataTable.Presets
                  table={table}
                  presets={presets}
                  variant="menu"
                  aria-label="Saved views"
                />
              }
              actions={newRequirement}
              filters={
                <>
                  <DataTable.Filter table={table} column="allocation" />
                  <DataTable.Filter table={table} column="controlMapping" />
                </>
              }
            >
              <DataTable.Columns table={table}>
                <Button size="small" iconBefore={<Columns3 />}>
                  Columns
                </Button>
              </DataTable.Columns>
              <DataTable.Settings table={table} />
            </Toolbar>
          }
        />
      </Stack>
      {adding && (
        <ProgramEditor
          table="engineering_requirements"
          initialValues={{ program_id: programId }}
          onClose={() => setAdding(false)}
          onSaved={(row) =>
            void navigate({
              to: "/programs/$programId/requirements/$requirementId",
              params: { programId, requirementId: row.id },
            })
          }
        />
      )}
      {selectedId && (
        <RecordPreviewPanel
          title={projection.byId.get(selectedId)?.name ?? "Requirement"}
          label="Requirement preview"
          defaultWidth={640}
          onClose={() => openPreview(undefined)}
          navigation={
            <RecordPreviewActions
              table="engineering_requirements"
              record={{ id: selectedId, program_id: programId }}
              rows={visibleRows}
              onSelect={(row) => openPreview(row.id)}
              openLink={
                <Link
                  to="/programs/$programId/requirements/$requirementId"
                  params={{ programId, requirementId: selectedId }}
                  search={{ tab: selectedTab }}
                  target="_blank"
                  rel="noopener noreferrer"
                />
              }
            />
          }
        >
          <RequirementRecordContent
            key={`${programId}/${selectedId}`}
            programId={programId}
            requirementId={selectedId}
            tab={selectedTab}
            onTabChange={changePreviewTab}
            preview
          />
        </RecordPreviewPanel>
      )}
    </>
  );
}
