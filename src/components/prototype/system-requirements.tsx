import {
  RecordLink,
  RecordPreviewActions,
  RecordPreviewPanel,
  recordDestination,
  useDisplayedRecords,
} from "./record-preview";
import { RequirementRecordContent } from "./requirement-record";
import { QueryState } from "./work-common";
import { ProductCollection } from "./product-collection";
import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  Absent,
  Button,
  Checkbox,
  DataTable,
  Id,
  Inline,
  PickerSheet,
  Textarea,
  TextLink,
  Toolbar,
  defineColumns,
  toast,
  useDataTable,
} from "@ledger/design-system";
import { Library, Plus } from "lucide-react";
import { useWorkspace } from "@/components/app/workspace";
import { useModelSave, useRows, type Row } from "@/lib/models";
import { labelFor } from "@/lib/records";
import type { SystemAssuranceRow } from "@/lib/system-assurance";

type RequirementRow = {
  id: string;
  requirementId: string;
  code: string;
  name: string;
  statement: string;
  type: string;
  element: string;
  elementId: string;
  controls: number;
  rationale: string | null;
};

/** The element and everything inside it, within its authorization boundary. */
function subtreeIds(row: SystemAssuranceRow, rows: SystemAssuranceRow[]) {
  const ids = new Set([row.id]);
  const queue = [row.id];
  while (queue.length) {
    const parentId = queue.shift();
    for (const child of rows) {
      if (
        child.parent_system_id !== parentId ||
        child.boundary_system_id !== row.boundary_system_id ||
        ids.has(child.id)
      )
        continue;
      ids.add(child.id);
      queue.push(child.id);
    }
  }
  return ids;
}

/**
 * The element's Requirements tab: what is allocated to it exactly, and on request everything
 * inside it. An allocation names one element; nothing cascades. Allocating is still done from the
 * requirement's own record.
 */
export function SystemRequirements({
  programId,
  systemId,
  rows,
  onAddFromLibrary,
}: {
  programId: string;
  systemId: string;
  rows: SystemAssuranceRow[];
  /** Adopt a reusable requirement from the library and allocate it here. */
  onAddFromLibrary?: (() => void) | undefined;
}) {
  const workspace = useWorkspace();
  const [allocating, setAllocating] = useState(false);
  const requirements = useRows("engineering_requirements", { program_id: programId });
  const revisions = useRows("requirement_revisions");
  const allocations = useRows("requirement_allocations");
  const links = useRows("requirement_control_links");
  const [includeInside, setIncludeInside] = useState(false);
  const element = rows.find((row) => row.id === systemId);
  const targets = useMemo(
    () =>
      element
        ? includeInside
          ? subtreeIds(element, rows)
          : new Set([element.id])
        : new Set<string>(),
    [element, rows, includeInside],
  );
  const data = useMemo<RequirementRow[]>(() => {
    const revisionById = new Map((revisions.data ?? []).map((row) => [row.id, row]));
    const requirementById = new Map((requirements.data ?? []).map((row) => [row.id, row]));
    const elementById = new Map(rows.map((row) => [row.id, row]));
    const controlsByRevision = new Map<string, Set<string>>();
    for (const link of links.data ?? []) {
      const current = controlsByRevision.get(link.requirement_revision_id) ?? new Set<string>();
      current.add(link.control_id);
      controlsByRevision.set(link.requirement_revision_id, current);
    }
    const latestAllocated = new Map<string, Row<"requirement_allocations">>();
    for (const allocation of allocations.data ?? []) {
      if (!allocation.system_id || !targets.has(allocation.system_id)) continue;
      const revision = revisionById.get(allocation.requirement_revision_id);
      if (!revision) continue;
      const key = `${revision.engineering_requirement_id}:${allocation.system_id}`;
      const current = latestAllocated.get(key);
      const currentVersion = current
        ? (revisionById.get(current.requirement_revision_id)?.version_number ?? 0)
        : -1;
      if (revision.version_number > currentVersion) latestAllocated.set(key, allocation);
    }
    return [...latestAllocated.values()]
      .flatMap((allocation) => {
        const revision = revisionById.get(allocation.requirement_revision_id);
        const requirement = revision
          ? requirementById.get(revision.engineering_requirement_id)
          : undefined;
        const target = elementById.get(allocation.system_id!);
        if (!revision || !requirement || !target) return [];
        return [
          {
            id: allocation.id,
            requirementId: requirement.id,
            code: requirement.code,
            name: revision.title,
            statement: revision.statement,
            type: labelFor(revision.requirement_type),
            element: `${target.code} · ${target.name}`,
            elementId: target.id,
            controls: controlsByRevision.get(revision.id)?.size ?? 0,
            rationale: allocation.rationale,
          },
        ];
      })
      .sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }));
  }, [allocations.data, revisions.data, requirements.data, links.data, rows, targets]);
  const [previewId, setPreviewId] = useState<string>();
  const columns = useMemo(
    () =>
      defineColumns<RequirementRow>((c) => [
        c.id("name", {
          header: "Requirement",
          width: 180,
          priority: 0,
          preview: (row) => setPreviewId(row.id),
          active: (row) => row.id === previewId,
          hideable: false,
          cell: (row) => (
            <RecordLink
              table="engineering_requirements"
              record={{ id: row.requirementId, program_id: programId }}
            >
              {row.name}
            </RecordLink>
          ),
        }),
        c.text("code", { header: "Code", width: 130, priority: 1 }),
        c.text("statement", { header: "Statement", minWidth: 300, hideable: false }),
        c.text("element", {
          header: "Allocated to",
          width: 220,
          cell: (row) => (
            <RecordLink table="systems" record={{ id: row.elementId, program_id: programId }}>
              {row.element}
            </RecordLink>
          ),
        }),
        c.number("controls", {
          header: "Controls",
          width: 100,
          cell: (row) => (row.controls ? String(row.controls) : <Absent />),
        }),
        c.text("type", { header: "Type", width: 130 }),
        c.text("rationale", { header: "Rationale", minWidth: 200, wrap: true }),
      ]),
    [programId, previewId],
  );
  const table = useDataTable({
    columns,
    data,
    getRowId: (row) => row.id,
    label: "Allocated requirements",
    view: "live-system-requirements-v1",
    resizable: true,
    reorderable: true,
    pageSize: 25,
    initialState: { columnVisibility: { element: false, rationale: false } },
  });
  useEffect(() => {
    table.getColumn("element")?.toggleVisibility(includeInside);
  }, [table, includeInside]);
  const displayed = useDisplayedRecords(table);
  const preview = data.find((row) => row.id === previewId);
  const queries = [requirements, revisions, allocations, links];
  const error = queries.find((query) => query.error)?.error;
  const pending = queries.some((query) => query.isPending) || !element;
  const canWrite =
    workspace.role !== "viewer" &&
    !!workspace.collections.find((item) => item.name === "requirement_allocations")?.can_insert;
  const actions =
    canWrite && element ? (
      <Button
        size="small"
        variant="primary"
        iconBefore={<Plus />}
        onClick={() => setAllocating(true)}
      >
        Allocate requirements
      </Button>
    ) : onAddFromLibrary && workspace.role !== "viewer" ? (
      <Button size="small" variant="primary" onClick={onAddFromLibrary}>
        Add from library
      </Button>
    ) : undefined;
  return (
    <>
      {allocating && element && (
        <AllocateToElement
          programId={programId}
          element={element}
          allocated={
            new Set(
              (allocations.data ?? [])
                .filter((allocation) => allocation.system_id === element.id)
                .map((allocation) => allocation.requirement_revision_id),
            )
          }
          onClose={() => setAllocating(false)}
        />
      )}
      <ProductCollection
        table={table}
        empty={{
          illustration: "shield",
          title: includeInside
            ? "No requirements allocated inside"
            : "No requirements allocated here",
          description:
            "A requirement is allocated to an element from the Allocation tab of its own record.",
          action: actions,
        }}
        fill
        queries={queries}
        searchLabel="Find a requirement"
        action={actions}
        filters={
          <Button
            size="small"
            variant="subtle"
            aria-pressed={includeInside}
            onClick={() => setIncludeInside(!includeInside)}
          >
            Include everything inside
          </Button>
        }
      />
      {preview && (
        <RecordPreviewPanel
          title={preview.name}
          label="Requirement preview"
          onClose={() => setPreviewId(undefined)}
          navigation={
            <RecordPreviewActions
              table="engineering_requirements"
              record={preview}
              rows={displayed}
              onSelect={(row) => setPreviewId(row.id)}
              destination={recordDestination("engineering_requirements", {
                id: preview.requirementId,
                program_id: programId,
              })}
            />
          }
        >
          <RequirementRecordContent
            programId={programId}
            requirementId={preview.requirementId}
            preview
          />
        </RecordPreviewPanel>
      )}
    </>
  );
}

import { useDraftGuard } from "@/components/app/use-draft-guard";

type Candidate = { id: string; revisionId: string; code: string; statement: string; type: string };

/** Choose the program's requirements to allocate to this element; every checked row is one explicit allocation. */
function AllocateToElement({
  programId,
  element,
  allocated,
  onClose,
}: {
  programId: string;
  element: SystemAssuranceRow;
  allocated: Set<string>;
  onClose: () => void;
}) {
  const requirements = useRows("engineering_requirements", { program_id: programId });
  const revisions = useRows("requirement_revisions");
  const save = useModelSave("requirement_allocations");
  const [search, setSearch] = useState("");
  const [rationale, setRationale] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const candidates = useMemo<Candidate[]>(() => {
    const latest = new Map<string, Row<"requirement_revisions">>();
    for (const revision of revisions.data ?? []) {
      const current = latest.get(revision.engineering_requirement_id);
      if (!current || current.version_number < revision.version_number)
        latest.set(revision.engineering_requirement_id, revision);
    }
    return (requirements.data ?? [])
      .flatMap((requirement) => {
        const revision = latest.get(requirement.id);
        if (!revision || allocated.has(revision.id)) return [];
        return [
          {
            id: requirement.id,
            revisionId: revision.id,
            code: requirement.code,
            statement: revision.statement,
            type: labelFor(revision.requirement_type),
          },
        ];
      })
      .sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }));
  }, [requirements.data, revisions.data, allocated]);
  const shown = candidates.filter((candidate) =>
    `${candidate.code} ${candidate.statement}`.toLowerCase().includes(search.toLowerCase()),
  );
  const columns = useMemo(
    () =>
      defineColumns<Candidate>((c) => [
        c.id("code", { header: "Requirement", width: 130 }),
        c.text("statement", { header: "Statement", minWidth: 300, wrap: true }),
        c.text("type", { header: "Type", width: 120 }),
      ]),
    [],
  );
  const table = useDataTable({
    columns,
    data: shown,
    getRowId: (row) => row.id,
    label: "Requirements to allocate",
    selectable: true,
  });
  const chosen = Object.keys(table.state.rowSelection);
  const guard = useDraftGuard({ dirty: chosen.length > 0 || !!rationale, onClose });
  const [savedIds] = useState(() => new Set<string>());
  async function allocate() {
    if (!guard.start()) return;
    setBusy(true);
    setError("");
    try {
      for (const id of chosen) {
        const candidate = candidates.find((item) => item.id === id);
        if (!candidate || savedIds.has(id)) continue;
        await save.mutateAsync({
          values: {
            requirement_revision_id: candidate.revisionId,
            system_id: element.id,
            rationale: rationale.trim() || null,
          },
        });
        savedIds.add(id);
      }
      toast.add({
        title: `${chosen.length} allocated to ${element.code}`,
        type: "success",
      });
      guard.complete();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The allocation could not be saved.");
    } finally {
      setBusy(false);
      guard.finish();
    }
  }
  return (
    <PickerSheet
      open
      onClose={() => void guard.close()}
      title="Allocate requirements"
      subtitle={`${element.code} · ${element.name}`}
      search={{
        value: search,
        onChange: (value) => {
          if (!busy) setSearch(value);
        },
        placeholder: "Search requirements",
      }}
      toolbar={
        <Textarea
          autoFocus
          disabled={busy}
          aria-label="Rationale for every allocation"
          placeholder="Why these requirements are allocated here (applies to all)"
          value={rationale}
          onChange={(event) => setRationale(event.target.value)}
        />
      }
      selected={chosen.length}
      total={shown.length}
      onClear={() => {
        if (!busy) table.resetRowSelection();
      }}
      action={{
        label: busy ? "Allocating…" : `Allocate ${chosen.length} to ${element.code}`,
        onClick: () => void allocate(),
        disabled: busy || chosen.length === 0,
      }}
    >
      <fieldset disabled={busy} className="min-w-0 border-0 p-0">
        <QueryState queries={[requirements, revisions]}>
          <DataTable
            responsive
            table={table}
            empty={{
              illustration: "shield",
              title: "Every requirement is already allocated here",
              description: "Adopt a reusable requirement from the library to add another.",
            }}
          />
        </QueryState>
      </fieldset>
      {guard.confirmation}
      {error && (
        <p role="alert" className="p-200 font-body-small text-danger">
          {error}
        </p>
      )}
    </PickerSheet>
  );
}
