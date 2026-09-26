import { ProductCollection } from "./product-collection";
import {
  RecordLink,
  recordDestination,
  useDisplayedRecords,
  useRemovalFocus,
} from "./record-preview";
import { RecordSummaryPreview } from "./record-summary-preview";
import { QueryState, MissingRecord } from "./work-common";
import { useConfirmation } from "@/components/app/confirmation";
import { useDraftGuard } from "@/components/app/use-draft-guard";
import { TextField } from "@/components/app/fields";
import { useEffect, useId, useMemo, useRef, useState, type FormEvent } from "react";
import { useNavigate } from "@tanstack/react-router";
import { AlertCircle, MoreHorizontal, Plus } from "lucide-react";
import {
  Absent,
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  DataTable,
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  FieldSet,
  IconButton,
  PickerSheet,
  Prose,
  Stack,
  Text,
  defineColumns,
  toast,
  useDataTable,
} from "@ledger/design-system";
import { useWorkspace } from "@/components/app/workspace";
import { useModelSave, useRow, useRows, type Row } from "@/lib/models";
import { labelFor } from "@/lib/records";
import { useAllocateRequirement, useRemoveRequirementLink } from "@/lib/requirement-links";
import { systemPath, systemTree, type SystemElement, type SystemTreeNode } from "@/lib/system-tree";

type Allocation = Row<"requirement_allocations">;
type AllocationRow = Allocation & {
  systemId: string | null;
  system: SystemElement | undefined;
  name: string;
  targetType: string;
  /** The control mappings recorded for this system on this revision; they go with the allocation. */
  mappings: Row<"requirement_control_links">[];
};

const plural = (count: number, one: string, many = `${one}s`) =>
  `${count} ${count === 1 ? one : many}`;

export function RequirementAllocations({
  programId,
  requirementId,
  contentId,
  readOnly = false,
}: {
  programId: string;
  requirementId: string;
  contentId: string;
  readOnly?: boolean;
}) {
  const workspace = useWorkspace();
  const navigate = useNavigate();
  const identity = useRow("engineering_requirements", requirementId);
  const content = useRow("requirement_revisions", contentId);
  const allocations = useRows("requirement_allocations", { requirement_revision_id: contentId });
  const mappings = useRows("requirement_control_links", { requirement_revision_id: contentId });
  const systems = useRows("systems", { program_id: programId });
  const remove = useRemoveRequirementLink();
  const { confirm, confirmation } = useConfirmation();
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<AllocationRow | null>(null);
  const queries = [identity, content, allocations, mappings, systems];
  const ready = queries.every((query) => query.data !== undefined && !query.error);
  const valid =
    identity.data?.program_id === programId &&
    content.data?.engineering_requirement_id === requirementId;
  const collection = workspace.collections.find((item) => item.name === "requirement_allocations");
  const writer =
    !readOnly &&
    workspace.role !== "viewer" &&
    identity.data?.tenant_id === workspace.tenantId &&
    valid;
  const canWrite = writer && !!collection?.can_insert;
  const canEdit = writer && !!collection?.can_update;
  const canRemove = writer && !!collection?.can_delete;
  const requirementCode = identity.data?.code ?? "Requirement";
  const elements = useMemo(() => (systems.data ?? []) as SystemElement[], [systems.data]);
  const rows = useMemo<AllocationRow[]>(
    () =>
      (allocations.data ?? []).map((allocation) => {
        const systemId = allocation.system_id ?? allocation.composition_node_id;
        const system = elements.find((element) => element.id === systemId);
        return {
          ...allocation,
          systemId,
          system,
          name: system
            ? `${system.code} · ${system.name}`
            : systemId
              ? "System unavailable"
              : allocation.provider_capability_id
                ? "Provider capability"
                : "Security process",
          targetType: system
            ? labelFor(system.system_type)
            : systemId
              ? "System"
              : allocation.provider_capability_id
                ? "Provider capability"
                : "Security process",
          mappings: systemId
            ? (mappings.data ?? []).filter((mapping) => mapping.system_id === systemId)
            : [],
        };
      }),
    [allocations.data, mappings.data, elements],
  );
  const [previewId, setPreviewId] = useState<string>();
  const focus = useRemovalFocus(rows);
  /** The allocation's name opens what it names, the system's record; the eye previews the allocation. */
  const systemLink = (row: AllocationRow) =>
    row.system ? recordDestination("systems", { id: row.system.id, program_id: programId }) : null;
  async function removeAllocation(row: AllocationRow) {
    const count = row.mappings.length;
    const removed = await confirm({
      title: "Remove allocation?",
      description: count
        ? `${row.name} will no longer be responsible for ${requirementCode}. Its ${plural(count, "control mapping")} for this system will be removed with it.`
        : `${row.name} will no longer be responsible for ${requirementCode}. The allocation's rationale is removed with it.`,
      confirmLabel: "Remove allocation",
      variant: "danger",
      failureTitle: "The allocation was not removed",
      action: () => {
        focus.removed(row.id);
        return remove.mutateAsync({
          table: "requirement_allocations",
          id: row.id,
          revision: row.revision,
          mappings: row.mappings.map((mapping) => ({
            id: mapping.id,
            revision: mapping.revision,
          })),
        });
      },
    });
    if (!removed) return;
    setPreviewId((current) => (current === row.id ? undefined : current));
    toast.add({
      type: "success",
      title: "Allocation removed",
      description: count
        ? `${requirementCode} is no longer allocated to ${row.name}, and ${plural(count, "control mapping")} went with it.`
        : `${requirementCode} is no longer allocated to ${row.name}.`,
    });
  }
  const columns = useMemo(
    () =>
      defineColumns<AllocationRow>((c) => [
        c.id("name", {
          header: "Allocated to",
          minWidth: 200,
          priority: 0,
          preview: (row) => setPreviewId(row.id),
          active: (row) => row.id === previewId,
          cell: (row) =>
            row.system ? (
              <RecordLink table="systems" record={{ id: row.system.id, program_id: programId }}>
                {row.name}
              </RecordLink>
            ) : (
              row.name
            ),
        }),
        c.text("targetType", { header: "Target type", width: 160 }),
        c.text("rationale", { header: "Rationale", minWidth: 200, wrap: true }),
        ...(canEdit || canRemove
          ? [
              c.actions((row: AllocationRow) => [
                ...(canEdit ? [{ label: "Edit allocation", onSelect: () => setEditing(row) }] : []),
                ...(canRemove
                  ? [
                      {
                        label: "Remove allocation",
                        tone: "danger" as const,
                        onSelect: () => void removeAllocation(row),
                      },
                    ]
                  : []),
              ]),
            ]
          : []),
      ]),
    // removeAllocation reads the current rows through its arguments.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [previewId, canEdit, canRemove, programId, requirementCode],
  );
  const table = useDataTable({
    columns,
    data: rows,
    getRowId: (row) => row.id,
    rowLabel: (row) => row.name,
    label: "Requirement allocations",
    view: "requirement-allocations",
    resizable: true,
    reorderable: true,
  });
  const displayed = useDisplayedRecords(table);
  const preview = rows.find((row) => row.id === previewId);
  const unavailable = !elements.length
    ? "Create a system in this program before allocating the requirement."
    : !ready
      ? "The allocations are still loading."
      : undefined;
  const action = canWrite ? (
    <Button
      ref={(node: HTMLButtonElement | null) => {
        focus.target.current = node;
      }}
      size="small"
      variant="primary"
      iconBefore={<Plus />}
      disabledReason={unavailable}
      onClick={() => setAdding(true)}
    >
      Allocate requirement
    </Button>
  ) : undefined;
  return (
    <Stack space="space.200">
      <QueryState queries={[identity, content]}>
        {valid ? (
          <ProductCollection
            fill
            table={table}
            queries={queries}
            searchLabel="Find an allocation"
            action={action}
            onRowClick={(row) => {
              const destination = systemLink(row);
              if (destination) void navigate(destination);
              else setPreviewId(row.id);
            }}
            empty={{
              illustration: "tree",
              title: "No allocations yet",
              description: elements.length
                ? "Allocate this requirement to a system to record its responsibility."
                : "Create a system in this program before allocating the requirement.",
            }}
          />
        ) : (
          <MissingRecord inline kind="Requirement" backTo="/programs" />
        )}
      </QueryState>
      {preview && (
        <RecordSummaryPreview
          model="requirement_allocations"
          record={preview}
          rows={displayed}
          onSelect={(row) => setPreviewId(row.id)}
          onClose={() => setPreviewId(undefined)}
          // The name is the system the allocation names, and opens it, as the row's name does; no
          // property repeats it.
          title={
            preview.system ? (
              <RecordLink table="systems" record={{ id: preview.system.id, program_id: programId }}>
                {preview.name}
              </RecordLink>
            ) : (
              preview.name
            )
          }
          fields={[
            { key: "targetType", label: "Target type" },
            {
              key: "rationale",
              label: "Rationale",
              render: (row) =>
                row.rationale ? <Prose>{row.rationale}</Prose> : <Absent label="Not recorded" />,
            },
          ]}
          recordActions={
            canEdit || canRemove ? (
              <AllocationActions
                onEdit={canEdit ? () => setEditing(preview) : undefined}
                onRemove={canRemove ? () => void removeAllocation(preview) : undefined}
              />
            ) : undefined
          }
        />
      )}
      {adding && (
        <AllocateRequirementSheet
          contentId={contentId}
          requirementCode={requirementCode}
          requirementTitle={content.data?.title}
          systems={elements}
          allocations={rows}
          onClose={() => setAdding(false)}
        />
      )}
      {editing && (
        <EditAllocationDialog
          key={editing.id}
          allocation={editing}
          onClose={() => setEditing(null)}
        />
      )}
      {confirmation}
    </Stack>
  );
}

/** The preview's record commands: Edit allocation, and Remove allocation behind the overflow. */
function AllocationActions({
  onEdit,
  onRemove,
}: {
  onEdit?: (() => void) | undefined;
  onRemove?: (() => void) | undefined;
}) {
  const menu = onRemove ? (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <IconButton
            size="small"
            variant="subtle"
            label="Allocation actions"
            icon={<MoreHorizontal />}
          />
        }
      />
      <DropdownMenuContent align="end">
        <DropdownMenuItem variant="danger" onClick={onRemove}>
          Remove allocation
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ) : null;
  if (!onEdit) return menu;
  return (
    <>
      <Button size="small" variant="primary" onClick={onEdit}>
        Edit allocation
      </Button>
      {menu}
    </>
  );
}

type Choice = SystemTreeNode<SystemElement & { typeLabel: string; path: string }>;

/**
 * Choosing the systems a requirement is allocated to: every checked row is an explicit
 * allocation, and choosing a parent leaves its children unchosen. One rationale applies to all,
 * and the allocations are written together.
 */
function AllocateRequirementSheet({
  contentId,
  requirementCode,
  requirementTitle,
  systems,
  allocations,
  onClose,
}: {
  contentId: string;
  requirementCode: string;
  requirementTitle?: string | undefined;
  systems: SystemElement[];
  allocations: AllocationRow[];
  onClose: () => void;
}) {
  const allocate = useAllocateRequirement();
  const [alreadyAllocated] = useState(
    () => new Set(allocations.flatMap((row) => row.systemId ?? [])),
  );
  const [selection, setSelection] = useState<Record<string, true>>({});
  const [rationale, setRationale] = useState("");
  const [error, setError] = useState<string | null>(null);
  // One id per system for the whole session, so a retry after an uncertain response is the same write.
  const ids = useRef(new Map<string, string>());
  const chosen = Object.keys(selection).filter((id) => selection[id]);
  const guard = useDraftGuard({
    dirty: chosen.length > 0 || !!rationale.trim(),
    onClose,
    description: "The systems you chose and the rationale will be lost.",
  });
  const rows = useMemo(
    () =>
      systemTree(
        [...systems]
          .sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }))
          .map((system) => ({
            ...system,
            typeLabel: labelFor(system.system_type),
            path: systemPath(systems, system.id),
          })),
      ),
    [systems],
  );
  const columns = useMemo(
    () =>
      defineColumns<Choice>((c) => [
        c.id("code", { header: "System", width: 150, priority: 1, hideable: false }),
        c.text("name", {
          header: "Name",
          minWidth: 200,
          priority: 0,
          hideable: false,
          cell: (row) =>
            alreadyAllocated.has(row.id) ? (
              <Stack space="space.025">
                <span>{row.name}</span>
                <Text size="small" color="color.text.subtle">
                  Already allocated
                </Text>
              </Stack>
            ) : (
              row.name
            ),
        }),
        c.text("typeLabel", { header: "Type", width: 150, priority: 2 }),
      ]),
    [alreadyAllocated],
  );
  const table = useDataTable({
    columns,
    data: rows,
    getRowId: (row) => row.id,
    rowLabel: (row) => `${row.code} · ${row.name}`,
    label: "Systems available for allocation",
    tree: { children: (row) => row.children, label: (row) => row.code, initialExpanded: true },
    selectable: (row) => !alreadyAllocated.has(row.id),
    enableSubRowSelection: false,
    state: { rowSelection: selection },
    onRowSelectionChange: setSelection,
  });
  const names = (list: string[]) =>
    list
      .map((id) => systems.find((system) => system.id === id)?.code)
      .filter(Boolean)
      .join(", ");
  async function submit() {
    if (!chosen.length || guard.busy) return;
    setError(null);
    if (!guard.start()) return;
    const targets = chosen.map((systemId) => {
      let id = ids.current.get(systemId);
      if (!id) {
        id = crypto.randomUUID();
        ids.current.set(systemId, id);
      }
      return { id, systemId };
    });
    try {
      await allocate.mutateAsync({
        requirementRevisionId: contentId,
        targets,
        rationale: rationale.trim() || null,
      });
      guard.finish();
      toast.add({
        type: "success",
        title: `Allocated to ${plural(targets.length, "system")}`,
        description: `${requirementCode} is allocated to ${names(chosen)}.`,
      });
      guard.complete();
    } catch (cause) {
      setError(
        `${cause instanceof Error ? cause.message : "The allocations could not be saved."} Your choices are kept; allocating again will not duplicate them.`,
      );
      guard.finish();
    }
  }
  return (
    <PickerSheet
      open
      onClose={() => void guard.close()}
      title="Allocate requirement"
      subtitle={requirementTitle ? `${requirementCode} · ${requirementTitle}` : requirementCode}
      table={table}
      search={{ placeholder: "Find a system to allocate" }}
      toolbar={
        <TextField
          label="Rationale"
          value={rationale}
          onChange={setRationale}
          multiline
          rows={2}
          maxLength={10000}
          description="Why these systems are responsible. It applies to every system you choose."
        />
      }
      pending={guard.busy}
      error={error}
      action={{
        label: chosen.length
          ? `Allocate to ${plural(chosen.length, "system")}`
          : "Allocate to systems",
        onClick: () => void submit(),
      }}
    >
      <DataTable
        responsive
        table={table}
        empty={{
          illustration: "tree",
          title: "No systems in this program",
          description: "Create a system in this program before allocating the requirement.",
        }}
      />
      {guard.confirmation}
    </PickerSheet>
  );
}

/** An allocation's rationale is the one thing about it that changes; a new target is a new allocation. */
function EditAllocationDialog({
  allocation,
  onClose,
}: {
  allocation: AllocationRow;
  /** Called once the dialog has finished closing; a saved rationale shows in the table and preview. */
  onClose: () => void;
}) {
  const formId = useId();
  const save = useModelSave("requirement_allocations");
  const [open, setOpen] = useState(true);
  const [rationale, setRationale] = useState(allocation.rationale ?? "");
  const [failure, setFailure] = useState<string | null>(null);
  const saved = useRef(false);
  const submitRef = useRef<HTMLButtonElement>(null);
  const rationaleRef = useRef<HTMLElement | null>(null);
  const failureRef = useRef<HTMLDivElement>(null);
  const guard = useDraftGuard({
    dirty: rationale !== (allocation.rationale ?? ""),
    onClose: () => setOpen(false),
    description: "The rationale you entered will be lost.",
  });
  useEffect(() => {
    if (failure) failureRef.current?.scrollIntoView({ block: "nearest" });
  }, [failure]);
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (guard.busy) return;
    setFailure(null);
    submitRef.current?.focus();
    if (!guard.start()) return;
    try {
      await save.mutateAsync({
        id: allocation.id,
        revision: allocation.revision,
        values: { rationale: rationale.trim() || null },
      });
      saved.current = true;
      guard.finish();
      guard.complete();
    } catch (cause) {
      setFailure(
        `${cause instanceof Error ? cause.message : "The allocation could not be saved."} Your rationale is kept.`,
      );
      guard.finish();
    }
  }
  return (
    <Dialog
      open={open}
      pending={guard.busy}
      onOpenChange={(next, details) => {
        if (next) return;
        details.cancel();
        void guard.close();
      }}
      onOpenChangeComplete={(next) => {
        if (next) return;
        if (saved.current)
          toast.add({ type: "success", title: "Allocation edited", description: allocation.name });
        onClose();
      }}
    >
      <DialogContent width="medium" initialFocus={() => rationaleRef.current ?? true}>
        <DialogHeader>
          <DialogTitle>Edit allocation</DialogTitle>
          <DialogDescription>{allocation.name}</DialogDescription>
        </DialogHeader>
        <DialogBody>
          <form id={formId} noValidate onSubmit={(event) => void submit(event)}>
            <Stack space="space.200">
              {failure ? (
                <Alert ref={failureRef} variant="destructive" role="alert">
                  <AlertCircle aria-hidden />
                  <AlertTitle>The allocation was not edited</AlertTitle>
                  <AlertDescription>{failure}</AlertDescription>
                </Alert>
              ) : null}
              <FieldSet disabled={guard.busy}>
                <TextField
                  label="Rationale"
                  value={rationale}
                  onChange={setRationale}
                  multiline
                  rows={4}
                  maxLength={10000}
                  description="Why this system is responsible for the requirement."
                  controlRef={rationaleRef}
                />
              </FieldSet>
            </Stack>
          </form>
        </DialogBody>
        <DialogFooter>
          <DialogClose render={<Button variant="subtle" />}>Cancel</DialogClose>
          <Button
            ref={submitRef}
            type="submit"
            form={formId}
            variant="primary"
            isLoading={guard.busy}
          >
            Edit allocation
          </Button>
        </DialogFooter>
      </DialogContent>
      {guard.confirmation}
    </Dialog>
  );
}
