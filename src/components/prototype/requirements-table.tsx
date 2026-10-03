import { ProductCollection } from "./product-collection";
import { useServerCollection, useServerPresetCounts } from "./collection-question";
import { useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import {
  Absent,
  Alert,
  AlertDescription,
  Button,
  DataTable,
  Id,
  Person,
  Stack,
  Text,
  defineColumns,
  useDataTable,
  type Preset,
} from "@ledger/design-system";
import { useWorkspace } from "@/components/app/workspace";
import { labelFor } from "@/lib/records";
import { requirementTypes } from "@/lib/requirement-edit";
import type { RequirementTreeNode } from "@/lib/requirement-tree";
import { serverRead, useServerRows, type ServerRow } from "@/lib/server-table";
import { ProgramEditor } from "./program-shared";
import {
  RecordLink,
  RecordPreviewActions,
  RecordPreviewPanel,
  useDisplayedRecords,
} from "./record-preview";
import { RequirementRecordContent, type RequirementTab } from "./requirement-record";

type Allocation = {
  id: string;
  name: string;
  kind: string;
  rationale: string | null;
  /** The allocated system, whose record the allocation's name opens. */
  systemId: string | null;
};
type ControlSource = { id: string; label: string; relationship: string; needsReview: boolean };
type RequirementView = {
  id: string;
  code: string;
  revisionId: string | null;
  /** The latest revision's title, else the code: a requirement with no details recorded. */
  name: string;
  /** `null` for a requirement with no details recorded. */
  statement: string | null;
  requirementType: string | null;
  /** The owner's name; `null` with no owner recorded, or when the owner is not in the workspace. */
  owner: string | null;
  ownerMissing: boolean;
  allocations: Allocation[];
  controlSources: ControlSource[];
  allocation: string;
  controlMapping: string;
};
type RequirementNode = RequirementTreeNode<RequirementView>;

/**
 * A requirement as the program's requirement view gives it: its latest revision's fields, its
 * owner by name, its allocations and linked controls, their states, and the requirements above it.
 */
type RequirementRow = ServerRow<
  "program_requirement_rows",
  | "id"
  | "code"
  | "revision_id"
  | "title"
  | "statement"
  | "requirement_type"
  | "owner_party_id"
  | "owner_name"
  | "allocation"
  | "control_mapping"
  | "allocations"
  | "control_sources"
  | "ancestors",
  "code" | "allocation" | "control_mapping" | "allocations" | "control_sources" | "ancestors"
>;

/** The words a requirement type reads as, so the search finds a requirement by them. */
const requirementTypeLabels = Object.fromEntries(
  requirementTypes.map((type) => [type, { label: labelFor(type) }]),
);

/** The models the view derives a requirement's row from: a write to any marks the pages stale. */
const requirementModels = [
  "requirement_revisions",
  "requirement_allocations",
  "requirement_control_links",
  "requirement_decompositions",
] as const;

/**
 * A program's requirements, a page at a time from the server: top-down through each requirement
 * tree in code order (a requirement's parts right after it), with every field the rows draw
 * derived on the server, where the search, the sort and the filters reach them too.
 */
const requirementRead = (programId: string) =>
  serverRead({
    source: "program_requirement_rows",
    model: "engineering_requirements",
    models: requirementModels,
    columns: [
      "id",
      "code",
      "revision_id",
      "title",
      "statement",
      "requirement_type",
      "owner_party_id",
      "owner_name",
      "allocation",
      "control_mapping",
      "allocations",
      "control_sources",
      "ancestors",
    ],
    scope: { program_id: programId },
    search: ["code", "title", "statement", "owner_name", "allocated_to", "linked_controls"],
    fields: {
      code: { sort: "code_order", filter: false },
      name: { column: "title", filter: false },
      allocatedTo: { column: "allocated_to", filter: false },
      controlSources: { column: "linked_controls", filter: false },
      requirementType: { column: "requirement_type", labels: requirementTypeLabels },
      owner: { column: "owner_name" },
      controlMapping: { column: "control_mapping" },
    },
    order: [{ column: "tree_order" }],
  });

/** Whether any of the program's requirements has several parents or sits in a cycle: a count. */
const unstructuredRead = (programId: string) =>
  serverRead({
    source: "program_requirement_rows",
    model: "engineering_requirements",
    models: requirementModels,
    columns: ["id"],
    scope: { program_id: programId, unstructured: true },
  });
const countOnly = { pageIndex: 0, pageSize: 1 };

/** A JSON list's objects, whatever else it holds. */
const objects = (value: unknown) =>
  (Array.isArray(value) ? value : []).filter(
    (item): item is Record<string, unknown> =>
      !!item && typeof item === "object" && !Array.isArray(item),
  );
const text = (value: unknown) => (typeof value === "string" ? value : null);

/** One requirement as the table draws it. */
function requirementView(row: RequirementRow): RequirementView {
  return {
    id: row.id,
    code: row.code,
    revisionId: row.revision_id,
    name: row.title ?? row.code,
    statement: row.statement,
    requirementType: row.requirement_type ? labelFor(row.requirement_type) : null,
    owner: row.owner_name,
    ownerMissing: !!row.owner_party_id && !row.owner_name,
    allocations: objects(row.allocations).map((item) => ({
      id: String(item["id"]),
      name: text(item["name"]) ?? "Target unavailable",
      kind: text(item["kind"]) ?? "",
      rationale: text(item["rationale"]),
      systemId: text(item["system_id"]),
    })),
    controlSources: objects(row.control_sources).map((item) => {
      const needsReview = item["needs_review"] === true;
      const part = text(item["part_name"]);
      return {
        id: String(item["id"]),
        label: text(item["label"]) ?? "Control unavailable",
        relationship: needsReview
          ? `Needs review · ${part ? labelFor(part) : "Target unavailable"}`
          : labelFor(text(item["relationship_type"]) ?? ""),
        needsReview,
      };
    }),
    allocation: row.allocation,
    controlMapping: row.control_mapping,
  };
}

/**
 * The page's requirements as the table draws them. In the tree's own order each nests under the
 * nearest requirement above it on the page, so the tree read top-down is the page as the server
 * ordered it; a part whose parent is on an earlier page, or that a search or a filter leaves on its
 * own, starts a row of its own. In an order the reader chose, each requirement is a row of its own.
 */
function requirementNodes(rows: RequirementRow[], { sorted }: { sorted: boolean }) {
  const nodes = new Map<string, RequirementNode>();
  const top: RequirementNode[] = [];
  for (const row of rows) {
    const node: RequirementNode = { ...requirementView(row), parts: [] };
    const holder = sorted
      ? undefined
      : [...row.ancestors]
          .reverse()
          .map((id) => nodes.get(id))
          .find((found) => found !== undefined);
    if (holder) holder.parts.push(node);
    else top.push(node);
    nodes.set(row.id, node);
  }
  return top;
}

const requirementParts = (row: RequirementNode) => row.parts;
const requirementCode = (row: RequirementNode) => row.code;
const partsHint = (_: RequirementNode, count: number) => (
  <Text size="xsmall" color="color.text.subtle">
    {count} part{count === 1 ? "" : "s"}
  </Text>
);
/** The states a filter offers: the server's rows are one page, so their values are not all. */
const allocationOptions = ["Allocated", "Unallocated", "Details not recorded"].map((value) => ({
  value,
}));
const controlMappingOptions = [
  "Control linked",
  "No control linked",
  "Needs review",
  "Details not recorded",
].map((value) => ({ value }));

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

function AllocationsDetail({ row, programId }: { row: RequirementNode; programId: string }) {
  const columns = useMemo(
    () =>
      defineColumns<Allocation>((c) => [
        c.id("name", {
          header: "Allocated to",
          priority: 0,
          minWidth: 180,
          // The name opens what it names: the allocated system's record.
          cell: (allocation) =>
            allocation.systemId ? (
              <RecordLink
                table="systems"
                record={{ id: allocation.systemId, program_id: programId }}
              >
                {allocation.name}
              </RecordLink>
            ) : (
              allocation.name
            ),
        }),
        c.text("kind", { header: "Target type", width: 160 }),
        c.text("rationale", { header: "Rationale", minWidth: 200, wrap: true }),
      ]),
    [programId],
  );
  const table = useDataTable({
    columns,
    data: row.allocations,
    getRowId: (allocation) => allocation.id,
    label: `${row.code} allocations`,
  });
  return (
    <ProductCollection
      table={table}
      compact
      keepQuestion={false}
      searchLabel="Find an allocation"
      empty={{
        illustration: "tree",
        title: "No allocations yet",
        description: "Allocate this requirement to a system to record its responsibility.",
      }}
    />
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
  const [adding, setAdding] = useState(false);
  const [localPreviewId, setLocalPreviewId] = useState<string>();
  const [localTab, setLocalTab] = useState<RequirementTab>("Overview");
  const selectedId = onPreview ? previewId : localPreviewId;
  const selectedTab = onPreviewTabChange ? (previewTab ?? "Overview") : localTab;
  const openPreview = onPreview ?? setLocalPreviewId;
  const changePreviewTab = onPreviewTabChange ?? setLocalTab;
  // The preview is the table's, so opening or stepping through it never rebuilds the columns; the
  // handler is read when the eye is pressed, whichever opener the caller passes.
  const opener = useRef(openPreview);
  opener.current = openPreview;
  const tablePreview = useMemo(
    () => ({
      onPreview: (row: RequirementNode) => opener.current(row.id),
      activeId: selectedId ?? null,
    }),
    [selectedId],
  );
  const read = useMemo(() => requirementRead(programId), [programId]);
  // Whether any requirement stands outside the tree, which the notice above the table says.
  const unstructured = useServerRows(
    useMemo(() => unstructuredRead(programId), [programId]),
    countOnly,
  );

  const columns = useMemo(
    () =>
      defineColumns<RequirementNode>((c) => [
        c.id("code", {
          header: "Requirement",
          width: 152,
          priority: 1,
          pin: "start",
          hideable: false,
          // The name is the row's one link; the code is its identifier.
          cell: (row) => <Id>{row.code}</Id>,
        }),
        c.text("name", {
          header: "Requirement name",
          minWidth: 200,
          priority: 0,
          hideable: false,
          cell: (row) => (
            <RecordLink
              table="engineering_requirements"
              record={{ id: row.id, program_id: programId }}
            >
              {row.name}
            </RecordLink>
          ),
        }),
        c.text("statement", {
          header: "Statement",
          minWidth: 200,
          cell: (row) => row.statement ?? <Absent label="Details not recorded" />,
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
        c.text("requirementType", {
          header: "Type",
          width: 140,
          cell: (row) => row.requirementType ?? <Absent />,
        }),
        c.person("owner", {
          header: "Owner",
          cell: (row) =>
            row.owner ? (
              <Person name={row.owner} />
            ) : (
              <Absent label={row.ownerMissing ? "Not available" : "Not recorded"} />
            ),
        }),
        c.text("allocation", { header: "Allocation", width: 150 }),
        c.text("controlMapping", { header: "Control mapping", width: 160 }),
      ]),
    [programId],
  );
  const collection = useServerCollection<RequirementNode, RequirementRow>(read, {
    columns,
    rows: requirementNodes,
    getRowId: (row) => row.id,
    preview: tablePreview,
    // The eye and the row's announcements name the requirement, not only its code.
    rowLabel: (row) => `${row.code} · ${row.name}`,
    label: "Engineering requirements",
    view: "live-requirements-workspace",
    resizable: true,
    reorderable: true,
    tree: {
      children: requirementParts,
      label: requirementCode,
      hint: partsHint,
      initialExpanded: true,
    },
    detailColumn: false,
    detail: (row) => <AllocationsDetail row={row} programId={programId} />,
    initialState: {
      columnVisibility: {
        allocation: false,
        controlMapping: false,
        owner: false,
        requirementType: false,
      },
    },
  });
  const { table } = collection;
  const visibleRows = useDisplayedRecords(table);
  const presetCounts = useServerPresetCounts(read, presets);
  // Every member but a viewer writes requirements, and row-level security decides each write: the
  // role says it, so the tab does not load the record schema, which is the schema inspector's.
  const canCreate = workspace.role !== "viewer";
  const newRequirement = canCreate ? (
    <Button size="small" variant="primary" iconBefore={<Plus />} onClick={() => setAdding(true)}>
      Create engineering requirement
    </Button>
  ) : null;
  return (
    <>
      <Stack space="space.150">
        {(unstructured.data?.count ?? 0) > 0 && (
          <Alert role="status">
            <AlertDescription>
              Some requirements have multiple parents or circular relationships. They remain listed
              separately so every requirement stays visible.
            </AlertDescription>
          </Alert>
        )}
        <ProductCollection
          {...collection}
          fill={fill}
          onRowClick={(row) =>
            void navigate({
              to: "/programs/$programId/requirements/$requirementId",
              params: { programId, requirementId: row.id },
            })
          }
          empty={{
            illustration: "shield",
            title: "No requirements yet",
            description: "Create the first engineering requirement for this program.",
            action: newRequirement,
          }}
          searchLabel="Find a requirement"
          views={
            <DataTable.Presets
              table={table}
              presets={presets}
              counts={presetCounts}
              variant="menu"
              aria-label="Saved views"
            />
          }
          action={newRequirement}
          filters={
            <>
              <DataTable.Filter table={table} column="allocation" options={allocationOptions} />
              <DataTable.Filter
                table={table}
                column="controlMapping"
                options={controlMappingOptions}
              />
            </>
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
        <RequirementRecordContent
          key={`${programId}/${selectedId}`}
          programId={programId}
          requirementId={selectedId}
          tab={selectedTab}
          onTabChange={changePreviewTab}
          preview
          // The preview's header and its record actions are the record's own, so the page and
          // the preview name the requirement, and gate its edit, the same way.
          renderFrame={({ content, title, actions }) => (
            <RecordPreviewPanel
              title={title}
              label="Requirement preview"
              recordActions={actions ?? undefined}
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
              {content}
            </RecordPreviewPanel>
          )}
        />
      )}
    </>
  );
}
