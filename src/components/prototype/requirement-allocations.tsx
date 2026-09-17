import { useConfirmation, discardChanges } from "@/components/app/confirmation";
import { useMemo, useRef, useState } from "react";
import { Link, useBlocker } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  Box,
  Button,
  DataTable,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Field,
  FieldLabel,
  Inline,
  Stack,
  Table,
  Textarea,
  TextLink,
  Toolbar,
  defineColumns,
  useDataTable,
} from "@ledger/design-system";
import { Plus } from "lucide-react";
import { useWorkspace } from "@/components/app/workspace";
import { database, requireIdentity } from "@/lib/database";
import { useModelSave, useRow, useRows, type Row } from "@/lib/models";
import { labelFor } from "@/lib/records";
import { systemPath, systemTree, type SystemElement, type SystemTreeNode } from "@/lib/system-tree";
import { RelationName } from "./record-tools";

type Allocation = Row<"requirement_allocations"> & { system_id: string | null };

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
  const identity = useRow("engineering_requirements", requirementId);
  const content = useRow("requirement_revisions", contentId);
  const allocations = useRows("requirement_allocations", { requirement_revision_id: contentId });
  const systems = useRows("systems", { program_id: programId });
  const [adding, setAdding] = useState(false);
  const queries = [identity, content, allocations, systems];
  const error = queries.find((query) => query.error)?.error;
  const ready = queries.every((query) => query.data !== undefined && !query.error);
  const valid =
    identity.data?.program_id === programId &&
    content.data?.engineering_requirement_id === requirementId;
  const canWrite =
    !readOnly &&
    workspace.role !== "viewer" &&
    identity.data?.tenant_id === workspace.tenantId &&
    !!workspace.collections.find((item) => item.name === "requirement_allocations")?.can_insert &&
    valid;
  const elements = (systems.data ?? []) as SystemElement[];
  const rows = (allocations.data ?? []) as Allocation[];
  return (
    <Stack space="space.200">
      <Inline alignBlock="center" spread="space-between" space="space.150">
        <h2 className="font-heading-small">Requirement allocations</h2>
        {canWrite && (
          <Button
            size="small"
            variant="primary"
            iconBefore={<Plus />}
            disabled={!ready || !elements.length}
            onClick={() => setAdding(true)}
          >
            Allocate requirement
          </Button>
        )}
      </Inline>
      {error ? (
        <p role="alert" className="text-danger">
          {error.message}
        </p>
      ) : !ready ? (
        <p role="status">Loading requirement allocations…</p>
      ) : !valid ? (
        <p role="alert">Requirement not found in this program.</p>
      ) : (
        <>
          {!elements.length && (
            <p role="status" className="font-body-small text-subtle">
              Add a system to this program before allocating the requirement.
            </p>
          )}
          {rows.length ? (
            <div className="overflow-x-auto">
              <Table aria-label="Requirement allocations">
                <thead>
                  <Table.Row>
                    <Table.Header>Allocated to</Table.Header>
                    <Table.Header>Target type</Table.Header>
                    <Table.Header>Rationale</Table.Header>
                  </Table.Row>
                </thead>
                <tbody>
                  {rows.map((allocation) => {
                    const systemId = allocation.system_id ?? allocation.composition_node_id;
                    const system = elements.find((element) => element.id === systemId);
                    return (
                      <Table.Row key={allocation.id}>
                        <Table.Cell className="whitespace-normal">
                          {system ? (
                            <Stack space="space.025">
                              <TextLink
                                render={
                                  <Link
                                    to="/programs/$programId/systems/$scopeId"
                                    params={{ programId, scopeId: system.id }}
                                  />
                                }
                              >
                                {system.code} · {system.name}
                              </TextLink>
                              {system.parent_system_id && (
                                <span className="font-body-xsmall text-subtle">
                                  {systemPath(elements, system.parent_system_id)}
                                </span>
                              )}
                            </Stack>
                          ) : systemId ? (
                            "System unavailable"
                          ) : allocation.provider_capability_id ? (
                            <RelationName
                              table="provider_capabilities"
                              id={allocation.provider_capability_id}
                            />
                          ) : allocation.security_process_id ? (
                            <RelationName
                              table="security_processes"
                              id={allocation.security_process_id}
                            />
                          ) : (
                            "Target unavailable"
                          )}
                        </Table.Cell>
                        <Table.Cell>
                          {system
                            ? labelFor(system.system_type)
                            : systemId
                              ? "System element"
                              : allocation.provider_capability_id
                                ? "Provider capability"
                                : "Security process"}
                        </Table.Cell>
                        <Table.Cell className="whitespace-normal">
                          {allocation.rationale ?? "Not recorded"}
                        </Table.Cell>
                      </Table.Row>
                    );
                  })}
                </tbody>
              </Table>
            </div>
          ) : (
            <p className="text-subtle">No requirement allocations recorded.</p>
          )}
        </>
      )}
      {adding && (
        <AllocateRequirementDialog
          contentId={contentId}
          requirementCode={identity.data?.code ?? "Requirement"}
          systems={elements}
          allocations={rows}
          canWrite={canWrite && ready}
          onClose={() => setAdding(false)}
        />
      )}
    </Stack>
  );
}

type Choice = SystemTreeNode<SystemElement & { typeLabel: string; path: string }>;
type Submission = { targets: { id: string; systemId: string }[]; rationale: string | null };

/** Every checked row is an explicit allocation. No tree selection cascades to descendants. */
export function AllocateRequirementDialog({
  contentId,
  requirementCode,
  systems,
  allocations,
  canWrite,
  onClose,
}: {
  contentId: string;
  requirementCode: string;
  systems: SystemElement[];
  allocations: Allocation[];
  canWrite: boolean;
  onClose: () => void;
}) {
  const { confirm, confirmation } = useConfirmation();
  const workspace = useWorkspace();
  const save = useModelSave("requirement_allocations");
  const cache = useQueryClient();
  const [alreadyAllocated] = useState(
    () => new Set(allocations.flatMap((row) => row.system_id ?? row.composition_node_id ?? [])),
  );
  const [selection, setSelection] = useState<Record<string, true>>({});
  const [rationale, setRationale] = useState("");
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [savedCount, setSavedCount] = useState(0);
  const inFlight = useRef(false);
  const bypassClose = useRef(false);
  const selectedIds = Object.keys(selection).filter((id) => selection[id]);
  const dirty = !!selectedIds.length || !!rationale || submission !== null;
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
        c.id("code", { header: "System", width: 170, hideable: false }),
        c.text("name", { header: "Name", minWidth: 250, hideable: false }),
        c.text("typeLabel", { header: "Type", width: 150 }),
        c.custom("allocated", {
          header: "Allocation",
          width: 160,
          cell: (row) => (alreadyAllocated.has(row.id) ? "Already allocated" : ""),
        }),
      ]),
    [alreadyAllocated],
  );
  const table = useDataTable({
    columns,
    data: rows,
    getRowId: (row) => row.id,
    label: "Systems available for allocation",
    tree: { children: (row) => row.children, label: (row) => row.code, initialExpanded: true },
    selectable: (row) => !alreadyAllocated.has(row.id),
    enableSubRowSelection: false,
    state: { rowSelection: selection },
    onRowSelectionChange: setSelection,
  });
  const close = async () => {
    if (inFlight.current) return;
    if (
      !dirty ||
      (await confirm(
        discardChanges(
          submission
            ? "Close this allocation attempt? Any allocations already saved will remain recorded."
            : "Discard your unsaved allocation choices?",
        ),
      ))
    ) {
      bypassClose.current = true;
      onClose();
    }
  };
  useBlocker({
    shouldBlockFn: async () =>
      inFlight.current ||
      (dirty &&
        !bypassClose.current &&
        !(await confirm(
          discardChanges(
            submission
              ? "Leave this allocation attempt? Any saved allocations remain recorded."
              : "Discard your unsaved allocation choices?",
          ),
        ))),
    enableBeforeUnload: () => !bypassClose.current && (dirty || inFlight.current),
  });
  async function submit() {
    if (!canWrite || inFlight.current) return;
    const request = submission ?? {
      targets: selectedIds.map((systemId) => ({ id: crypto.randomUUID(), systemId })),
      rationale: rationale.trim() || null,
    };
    if (
      !request.targets.length ||
      request.targets.some((target) => !systems.some((system) => system.id === target.systemId))
    ) {
      setError("Choose an available system from this program.");
      return;
    }
    setSubmission(request);
    inFlight.current = true;
    setBusy(true);
    setError("");
    let confirmed = 0;
    try {
      const token = await requireIdentity(workspace);
      for (const target of request.targets) {
        const authored = {
          requirement_revision_id: contentId,
          system_id: target.systemId,
          rationale: request.rationale,
        };
        const { data: existing, error: lookupError } = await database()
          .from("requirement_allocations")
          .select()
          .eq("tenant_id", workspace.tenantId)
          .eq("id", target.id)
          .setHeader("Authorization", `Bearer ${token}`)
          .maybeSingle();
        if (lookupError) throw new Error(lookupError.message);
        if (existing) {
          if (
            !Object.entries(authored).every(
              ([key, value]) => (existing as Record<string, unknown>)[key] === value,
            )
          )
            throw new Error(
              "An allocation changed after this save attempt. Your submitted choices are retained for review.",
            );
        } else
          await save.mutateAsync({
            values: { ...authored, id: target.id, tenant_id: workspace.tenantId },
          });
        confirmed += 1;
        setSavedCount(confirmed);
      }
      await cache.invalidateQueries({
        queryKey: ["models", workspace.tenantId, "requirement_allocations"],
      });
      await requireIdentity(workspace);
      bypassClose.current = true;
      inFlight.current = false;
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The allocations could not be saved.");
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }
  return (
    <Dialog
      open
      onOpenChange={(open, details) => {
        if (!open) {
          details.cancel();
          close();
        }
      }}
    >
      <DialogContent style={{ maxWidth: 1120 }} showCloseButton={!busy}>
        <DialogHeader>
          <DialogTitle>Allocate requirement</DialogTitle>
          <DialogDescription>
            {requirementCode} · Select each responsible system or nested element.
          </DialogDescription>
        </DialogHeader>
        <form
          noValidate
          className="flex min-h-0 flex-1 flex-col"
          onSubmit={(event) => {
            event.preventDefault();
            void submit();
          }}
        >
          <Box padding="space.200" className="min-h-0 flex-1 overflow-y-auto">
            <Stack space="space.200">
              <p className="font-body-small text-subtle">
                Each checked row receives its own allocation. Selecting a parent leaves its children
                unselected.
              </p>
              <fieldset disabled={busy || !!submission || !canWrite} className="min-w-0">
                <Stack space="space.200">
                  <DataTable
                    responsive
                    table={table}
                    toolbar={
                      <Toolbar
                        search={String(table.state.globalFilter ?? "")}
                        onSearch={(value) => table.setGlobalFilter(value)}
                        placeholder="Find a system to allocate"
                      />
                    }
                  />
                  <Field>
                    <FieldLabel htmlFor="allocation-rationale">Rationale (optional)</FieldLabel>
                    <Textarea
                      id="allocation-rationale"
                      value={rationale}
                      onChange={(event) => setRationale(event.target.value)}
                      rows={3}
                    />
                  </Field>
                </Stack>
              </fieldset>
              {error && (
                <p role="alert" className="text-danger">
                  {error}
                </p>
              )}
              {submission && !busy && error && (
                <p className="font-body-small text-subtle">
                  {savedCount} of {submission.targets.length} allocations confirmed. Retry checks
                  the same records before saving; submitted choices are retained.
                </p>
              )}
            </Stack>
          </Box>
          <DialogFooter>
            <span className="mr-auto font-body-small">{selectedIds.length} selected</span>
            <Button type="button" variant="subtle" disabled={busy} onClick={close}>
              Cancel
            </Button>
            <Button variant="primary" disabled={busy || !canWrite} type="submit">
              {busy
                ? "Allocating…"
                : submission
                  ? "Retry allocation"
                  : `Allocate to ${selectedIds.length} system${selectedIds.length === 1 ? "" : "s"}`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
      {confirmation}
    </Dialog>
  );
}
