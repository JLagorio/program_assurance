import {
  RecordLink,
  RecordPreviewActions,
  RecordPreviewPanel,
  recordDestination,
  useDisplayedRecords,
  useEndOnHide,
  useRemovalFocus,
} from "./record-preview";
import { RequirementRecordContent } from "./requirement-record";
import { QueryState } from "./work-common";
import { ProductCollection } from "./product-collection";
import { useCollectionTable } from "./collection-question";
import { useMemo, useRef, useState } from "react";
import {
  Absent,
  Button,
  DataTable,
  FilterChip,
  PickerSheet,
  defineColumns,
  toast,
  useDataTable,
  useLedgerLocale,
} from "@ledger/design-system";
import { Plus } from "lucide-react";
import { useConfirmation } from "@/components/app/confirmation";
import { TextField } from "@/components/app/fields";
import { useDraftGuard } from "@/components/app/use-draft-guard";
import { useWorkspace } from "@/components/app/workspace";
import { useRows, type Row } from "@/lib/models";
import { labelFor } from "@/lib/records";
import { useAllocateRequirementsToSystem, useRemoveRequirementLink } from "@/lib/requirement-links";
import { programRequirementScope } from "@/lib/requirement-reads";
import type { SystemAssuranceRow } from "@/lib/system-assurance";

type RequirementRow = {
  id: string;
  /** The allocation's revision, which a removal is checked against. */
  revision: number;
  requirementId: string;
  code: string;
  name: string;
  statement: string;
  type: string;
  element: string;
  elementId: string;
  controls: number;
  rationale: string | null;
  /** The control mappings recorded for this element on this revision; they go with the allocation. */
  mappings: { id: string; revision: number }[];
};

const plural = (count: number, one: string, many = `${one}s`) =>
  `${count} ${count === 1 ? one : many}`;

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
 * inside it. An allocation names one element; nothing cascades.
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
  const { formatNumber } = useLedgerLocale();
  const [allocating, setAllocating] = useState(false);
  // The program's requirement records only, scoped on the server through their requirement.
  const requirements = useRows(
    "engineering_requirements",
    programRequirementScope(programId, "engineering_requirements"),
  );
  const revisions = useRows(
    "requirement_revisions",
    programRequirementScope(programId, "requirement_revisions"),
  );
  const allocations = useRows(
    "requirement_allocations",
    programRequirementScope(programId, "requirement_allocations"),
  );
  const links = useRows(
    "requirement_control_links",
    programRequirementScope(programId, "requirement_control_links"),
  );
  const [includeInside, setIncludeInside] = useState(false);
  const element = rows.find((row) => row.id === systemId);
  // Everything inside, always: the element's own rows are a narrowing of it, so the table can tell
  // "nothing allocated here" from "nothing allocated here or inside".
  const subtree = useMemo(
    () => (element ? subtreeIds(element, rows) : new Set<string>()),
    [element, rows],
  );
  const hasInside = subtree.size > 1;
  const inside = useMemo<RequirementRow[]>(() => {
    const revisionById = new Map((revisions.data ?? []).map((row) => [row.id, row]));
    const requirementById = new Map((requirements.data ?? []).map((row) => [row.id, row]));
    const elementById = new Map(rows.map((row) => [row.id, row]));
    const controlsByRevision = new Map<string, Set<string>>();
    const mappingsBySystem = new Map<string, { id: string; revision: number }[]>();
    for (const link of links.data ?? []) {
      const current = controlsByRevision.get(link.requirement_revision_id) ?? new Set<string>();
      current.add(link.control_id);
      controlsByRevision.set(link.requirement_revision_id, current);
      if (!link.system_id) continue;
      const key = `${link.requirement_revision_id}:${link.system_id}`;
      mappingsBySystem.set(key, [
        ...(mappingsBySystem.get(key) ?? []),
        { id: link.id, revision: link.revision },
      ]);
    }
    const latestAllocated = new Map<string, Row<"requirement_allocations">>();
    for (const allocation of allocations.data ?? []) {
      if (!allocation.system_id || !subtree.has(allocation.system_id)) continue;
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
            revision: allocation.revision,
            requirementId: requirement.id,
            code: requirement.code,
            name: revision.title,
            statement: revision.statement,
            type: labelFor(revision.requirement_type),
            element: `${target.code} · ${target.name}`,
            elementId: target.id,
            controls: controlsByRevision.get(revision.id)?.size ?? 0,
            rationale: allocation.rationale,
            mappings: mappingsBySystem.get(`${revision.id}:${target.id}`) ?? [],
          },
        ];
      })
      .sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }));
  }, [allocations.data, revisions.data, requirements.data, links.data, rows, subtree]);
  const data = useMemo(
    () => (includeInside ? inside : inside.filter((row) => row.elementId === systemId)),
    [includeInside, inside, systemId],
  );
  const [previewId, setPreviewId] = useState<string>();
  // The preview belongs to the tab: choosing another ends it, and coming back does not reopen it.
  useEndOnHide(() => setPreviewId(undefined));
  // Every member but a viewer allocates and removes allocations, and row-level security decides
  // each write: the role says it, so the tab does not load the record schema.
  const canWrite = workspace.role !== "viewer";
  const canRemove = canWrite;
  const remove = useRemoveRequirementLink();
  const { confirm, confirmation } = useConfirmation();
  const focus = useRemovalFocus(data);
  // The row menu calls the current render's removal, so the columns need not change with it.
  const removeRow = useRef<(row: RequirementRow) => void>(() => {});
  const columns = useMemo(
    () =>
      defineColumns<RequirementRow>((c) => [
        c.id("name", {
          header: "Requirement",
          width: 180,
          priority: 0,
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
        // Where each row is allocated says something only when the rows come from inside too.
        ...(includeInside
          ? [
              c.text("element", {
                header: "Allocated to",
                width: 220,
                cell: (row) => (
                  <RecordLink table="systems" record={{ id: row.elementId, program_id: programId }}>
                    {row.element}
                  </RecordLink>
                ),
              }),
            ]
          : []),
        c.number("controls", {
          header: "Controls",
          width: 100,
          cell: (row) => (row.controls ? String(row.controls) : <Absent label="None mapped" />),
        }),
        c.text("type", { header: "Type", width: 130 }),
        c.text("rationale", { header: "Rationale", minWidth: 200, wrap: true }),
        ...(canRemove
          ? [
              c.actions((row: RequirementRow) => [
                {
                  label: "Remove allocation",
                  tone: "danger" as const,
                  onSelect: () => removeRow.current(row),
                },
              ]),
            ]
          : []),
      ]),
    [programId, includeInside, canRemove],
  );
  // The preview is the table's, so opening or stepping through it never rebuilds the columns.
  const tablePreview = useMemo(
    () => ({
      onPreview: (row: RequirementRow) => setPreviewId(row.id),
      activeId: previewId ?? null,
    }),
    [previewId],
  );
  const table = useCollectionTable({
    columns,
    data,
    getRowId: (row) => row.id,
    preview: tablePreview,
    rowLabel: (row) => row.code,
    label: "Allocated requirements",
    // v2: the Allocated to column now shows by default with everything inside, instead of being
    // switched on and off in the reader's saved layout.
    view: "live-system-requirements-v2",
    resizable: true,
    reorderable: true,
    initialState: { columnVisibility: { rationale: false } },
  });
  const displayed = useDisplayedRecords(table);
  const preview = data.find((row) => row.id === previewId);
  const queries = [requirements, revisions, allocations, links];
  const canAdopt = !!onAddFromLibrary && workspace.role !== "viewer";
  async function removeAllocation(row: RequirementRow) {
    const count = row.mappings.length;
    const removed = await confirm({
      title: "Remove allocation?",
      description: count
        ? `${row.element} will no longer be responsible for ${row.code}. Its ${plural(count, "control mapping")} for this system will be removed with it.`
        : `${row.element} will no longer be responsible for ${row.code}. The allocation's rationale is removed with it.`,
      confirmLabel: "Remove allocation",
      variant: "danger",
      failureTitle: "The allocation was not removed",
      action: () => {
        focus.removed(row.id);
        return remove.mutateAsync({
          table: "requirement_allocations",
          id: row.id,
          revision: row.revision,
          mappings: row.mappings,
        });
      },
    });
    if (!removed) return;
    if (previewId === row.id) setPreviewId(undefined);
    toast.add({
      type: "success",
      title: "Allocation removed",
      description: count
        ? `${row.code} is no longer allocated to ${row.element}, and ${plural(count, "control mapping")} went with it.`
        : `${row.code} is no longer allocated to ${row.element}.`,
    });
  }
  removeRow.current = (row) => void removeAllocation(row);
  const actions =
    canWrite && element ? (
      <Button
        // A removal takes its row and the menu that asked; focus comes back here.
        ref={(node: HTMLButtonElement | null) => {
          focus.target.current = node;
        }}
        size="small"
        variant="primary"
        iconBefore={<Plus />}
        onClick={() => setAllocating(true)}
      >
        Allocate requirements
      </Button>
    ) : canAdopt ? (
      <Button size="small" variant="primary" onClick={onAddFromLibrary}>
        Add from library
      </Button>
    ) : undefined;
  const hiddenInside = inside.length - inside.filter((row) => row.elementId === systemId).length;
  // The scope's own words only when the scope alone leaves nothing: with rows of its own, a search
  // or filter that matches none keeps the table's Nothing matches and Clear filters.
  const scopeEmpties = !includeInside && hiddenInside > 0 && data.length === 0;
  // The allocations already recorded here, which the picker leaves out.
  const allocatedHere = useMemo(
    () =>
      new Set(
        (allocations.data ?? [])
          .filter((allocation) => allocation.system_id === systemId)
          .map((allocation) => allocation.requirement_revision_id),
      ),
    [allocations.data, systemId],
  );
  return (
    <>
      {allocating && element && (
        <AllocateToElement
          programId={programId}
          element={element}
          allocated={allocatedHere}
          onClose={() => setAllocating(false)}
        />
      )}
      <ProductCollection
        table={table}
        empty={{
          illustration: "shield",
          title: includeInside
            ? "No requirements allocated here or inside"
            : "No requirements allocated here",
          description:
            canWrite && element
              ? "Allocate the program's requirements to this element to start this collection."
              : canAdopt
                ? "Adopt a reusable requirement from the library to allocate it here."
                : "Nothing has been allocated to this element yet.",
          action: actions,
          ...(scopeEmpties
            ? {
                filtered: {
                  title: "Nothing allocated to this element itself",
                  description: `${formatNumber(hiddenInside)} ${hiddenInside === 1 ? "allocation is" : "allocations are"} recorded on elements inside it.`,
                  action: (
                    <Button size="small" onClick={() => setIncludeInside(true)}>
                      Include everything inside
                    </Button>
                  ),
                },
              }
            : {}),
        }}
        fill
        queries={queries}
        // Without the elements inside, the rows are a narrowing: nothing left keeps the toolbar.
        narrowed={!includeInside && hiddenInside > 0}
        searchLabel="Find a requirement"
        action={actions}
        filters={
          hasInside ? (
            <FilterChip
              label="Everything inside"
              isActive={includeInside}
              onClick={() => setIncludeInside(!includeInside)}
            />
          ) : undefined
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
      {confirmation}
    </>
  );
}

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
  const requirements = useRows(
    "engineering_requirements",
    programRequirementScope(programId, "engineering_requirements"),
  );
  const revisions = useRows(
    "requirement_revisions",
    programRequirementScope(programId, "requirement_revisions"),
  );
  const allocate = useAllocateRequirementsToSystem();
  const { t, formatNumber } = useLedgerLocale();
  const [rationale, setRationale] = useState("");
  const [error, setError] = useState<string>();
  const rationaleRef = useRef<HTMLElement | null>(null);
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
  const columns = useMemo(
    () =>
      defineColumns<Candidate>((c) => [
        c.id("code", { header: "Requirement", width: 130, priority: 1 }),
        // The statement is what the reader chooses by, so it stays in the row on a phone.
        c.text("statement", { header: "Statement", minWidth: 200, priority: 0, wrap: true }),
        c.text("type", { header: "Type", width: 120, priority: 2 }),
      ]),
    [],
  );
  // The whole collection: the sheet's search filters the table, so a miss is "Nothing matches".
  const table = useDataTable({
    columns,
    data: candidates,
    getRowId: (row) => row.id,
    rowLabel: (row) => row.code,
    label: "Requirements to allocate",
    selectable: true,
    pageSize: 50,
  });
  const chosen = Object.keys(table.state.rowSelection).filter((id) => table.state.rowSelection[id]);
  const guard = useDraftGuard({
    dirty: chosen.length > 0 || !!rationale,
    onClose,
    description: "The requirements you chose and the rationale will be lost.",
  });
  // Each allocation's id is chosen once, so a retry after a lost answer adds only the rest.
  const allocationIds = useRef(new Map<string, string>());
  const attempted = useRef(false);
  // The header's checkbox chooses the page; once it has, the footer offers every row on offer.
  const onOffer = table.getRowCount();
  const offerRest =
    table.getIsAllPageRowsSelected() &&
    !table.getIsAllRowsSelected() &&
    onOffer > table.getRowModel().rows.length;
  async function allocateChosen() {
    if (!guard.start()) return;
    setError(undefined);
    const targets = chosen.flatMap((id) => {
      const candidate = candidates.find((item) => item.id === id);
      if (!candidate) return [];
      const allocationId = allocationIds.current.get(id) ?? crypto.randomUUID();
      allocationIds.current.set(id, allocationId);
      return [{ id: allocationId, requirementRevisionId: candidate.revisionId }];
    });
    const retry = attempted.current;
    attempted.current = true;
    try {
      // One request for every chosen requirement: all of them are allocated, or none.
      await allocate.mutateAsync({
        systemId: element.id,
        targets,
        rationale: rationale.trim() || null,
        retry,
      });
      toast.add({
        title: `${formatNumber(targets.length)} allocated to ${element.code}`,
        type: "success",
      });
      guard.finish();
      guard.complete();
    } catch (cause) {
      // One write: a refusal saved none of them, and a retry after a lost answer adds only the rest.
      setError(
        `${(cause instanceof Error ? cause.message : "The allocation could not be saved.").replace(/[.!?]?$/, ".")} Your choice and rationale are kept; allocating again will not duplicate them.`,
      );
      guard.finish();
    }
  }
  return (
    <PickerSheet
      open
      onClose={() => void guard.close()}
      title="Allocate requirements"
      subtitle={`${element.code} · ${element.name}`}
      table={table}
      search={{ placeholder: "Find requirements to allocate" }}
      initialFocus={() => rationaleRef.current ?? true}
      toolbar={
        <TextField
          label="Rationale for every allocation"
          description="Why these requirements are allocated here. It applies to each one."
          multiline
          rows={2}
          value={rationale}
          onChange={setRationale}
          controlRef={rationaleRef}
        />
      }
      pending={guard.busy}
      error={error}
      secondary={
        offerRest ? (
          <Button variant="secondary" onClick={() => table.toggleAllRowsSelected(true)}>
            {t("selectAllCount", { count: formatNumber(onOffer) })}
          </Button>
        ) : undefined
      }
      action={{
        label: `Allocate ${formatNumber(chosen.length)} to ${element.code}`,
        onClick: () => void allocateChosen(),
        disabled: chosen.length === 0,
      }}
    >
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
      {guard.confirmation}
    </PickerSheet>
  );
}
