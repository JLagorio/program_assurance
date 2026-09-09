import { useRecordForm } from "@/lib/record-form";
import {
  Absent,
  Badge,
  Box,
  Button,
  DataTable,
  defineColumns,
  Field,
  Indicator,
  Inline,
  Input,
  NativeSelect,
  ProgressStacked,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  Stack,
  Text,
  Textarea,
  TextLink,
  toast,
  useDataTable,
} from "@ledger/design-system";
import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState, type SetStateAction } from "react";

import {
  childrenOf,
  descendantsOf,
  nextNodeId,
  useCompositionGraph,
  type CompositionNode,
  type NodeClass,
  type NodeKind,
} from "@/lib/composition";
import {
  createCompositionNode,
  moveCompositionNode,
  updateCompositionNode,
  validCompositionParents,
} from "@/lib/composition-store";
import {
  inForceRevision,
  openRevision,
  revisionTone,
  useControlSetVersion,
} from "@/lib/control-set";
import { useWorkVersion, workForScope } from "@/lib/control-work";
import { programControlRows, programControlScopes } from "@/lib/program-controls";
import { closestProgramScope, resolveProgramElement } from "@/lib/program-scope";

import { suspectAllocationsUnder, useLinkCurrencyVersion } from "@/lib/link-currency";
import { allocationsOn, derivedControlTrace, useRequirementsVersion } from "@/lib/requirements";
import {
  controlSetFor,
  objectives,
  scopesForProgram,
  triadOf,
  useScopesVersion,
  type AssessmentScope,
} from "@/lib/scopes";
import { AllocateRequirementsSheet } from "./allocate-picker";
import { ElementHover } from "./glances";
import { NodePreviewSheet } from "./node-preview";

const impactTone = { Low: "neutral", Moderate: "warning", High: "danger" } as const;

/** Kinds a user can add by hand, with the class each implies. */
const addableKinds: { kind: NodeKind; class: NodeClass }[] = [
  { kind: "Subsystem", class: "System" },
  { kind: "Enclave", class: "System" },
  { kind: "Chassis", class: "Hardware" },
  { kind: "Board", class: "Hardware" },
  { kind: "Chip", class: "Hardware" },
  { kind: "Peripheral", class: "Hardware" },
  { kind: "Bootloader", class: "Firmware" },
  { kind: "Firmware image", class: "Firmware" },
  { kind: "Operating system", class: "Software" },
  { kind: "Hypervisor", class: "Software" },
  { kind: "Container image", class: "Software" },
  { kind: "Runtime", class: "Software" },
  { kind: "Application", class: "Software" },
  { kind: "Service", class: "Software" },
  { kind: "Package", class: "Software" },
  { kind: "Library", class: "Software" },
];

type WorkSummary = { total: number; satisfied: number; inWork: number; unassigned: number };

type Row = {
  node: CompositionNode;
  depth: number;
  scope: AssessmentScope | null;
  owner: string;
  requirements: number;
  withoutControl: number;
  controls: number;
  work: WorkSummary;
  children: number;
};

/** A node's row, with its parts under it: the projection the tree draws. */
type TreeRow = Row & { parts: TreeRow[] };

/* ------------------------------------------------------------------ Tree */

export function SystemTree({
  programId,
  elementId,
}: {
  programId: string;
  elementId?: string | undefined;
}) {
  const nodes = useCompositionGraph(programId);
  const scopesVersion = useScopesVersion();
  const controlSetVersion = useControlSetVersion();
  const requirementsVersion = useRequirementsVersion();
  const linkCurrencyVersion = useLinkCurrencyVersion();
  const workVersion = useWorkVersion();

  const [adding, setAdding] = useState<{
    parent: CompositionNode;
    kind: NodeKind;
  } | null>(null);
  const [editing, setEditing] = useState<CompositionNode | null>(null);
  const [moving, setMoving] = useState<CompositionNode | null>(null);
  const [allocating, setAllocating] = useState<CompositionNode | null>(null);
  const navigate = useNavigate({ from: "/programs/$programId" });
  // The peek stack lives in the URL: the sheet's back chevron and the browser's back agree.
  const { peek } = useSearch({ from: "/programs/$programId" });
  const stack = peek ? peek.split(",").filter((id) => resolveProgramElement(programId, id)) : [];
  const preview = stack[stack.length - 1] ?? null;
  const setStack = (next: string[]) =>
    void navigate({
      search: (prev) => ({ ...prev, peek: next.length ? next.join(",") : undefined }),
    });

  const scopes = scopesForProgram(programId);

  // The projection: every node with what it owes, its parts under it. Rebuilt when a store changes,
  // and the tree's open rows survive that because the table keeps them by node id.
  const rows = useMemo(() => {
    const scopeByElement = new Map(scopes.map((s) => [s.element, s]));
    const build = (node: CompositionNode, depth: number): TreeRow => {
      const scope = scopeByElement.get(node.id) ?? null;
      const effectiveScope = scope ?? closestProgramScope(programId, node.id);
      const kids = childrenOf(node.id);
      // What a node owes is the union over its subtree: a requirement allocated
      // to a board inside a subsystem is that subsystem's obligation too, and a
      // folded row must not read as empty.
      const subtree = [node, ...descendantsOf(node.id)];
      const requirements = new Set<string>();
      const withoutControl = new Set<string>();
      const reached = new Set<string>();
      for (const n of subtree) {
        for (const a of allocationsOn(n.id)) requirements.add(a.requirement);
        const trace = derivedControlTrace(n.id);
        for (const r of trace.withoutControl) withoutControl.add(r.id);
        for (const c of trace.controls) reached.add(c);
      }
      const applicableScopes = programControlScopes(programId, node.id);
      const controls = applicableScopes.length
        ? new Set(
            applicableScopes.flatMap(
              (item) => controlSetFor(item.id)?.controls.map((row) => row.control.id) ?? [],
            ),
          ).size
        : reached.size;
      const subtreeIds = new Set(subtree.map((item) => item.id));
      const aggregateRows =
        !scope && applicableScopes.some((item) => subtreeIds.has(item.element))
          ? programControlRows(programId, node.id)
          : [];
      const satisfied = aggregateRows.filter((row) => row.assessment === "Satisfied").length;
      const inWork = aggregateRows.filter(
        (row) => row.assessment !== "Satisfied" && row.owner !== "Unassigned",
      ).length;
      return {
        node,
        depth,
        scope,
        owner: effectiveScope?.owner || "Unassigned",
        requirements: requirements.size,
        withoutControl: withoutControl.size,
        controls,
        work: scope
          ? scopeWork(scope)
          : { total: controls, satisfied, inWork, unassigned: controls - satisfied - inWork },
        children: kids.length,
        parts: kids.map((k) => build(k, depth + 1)),
      };
    };
    const selected = resolveProgramElement(programId, elementId);
    return (selected ? [selected] : nodes.filter((n) => n.parent === null)).map((n) => build(n, 0));
    // the stores this reads are subscribed through their versions
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    nodes,
    programId,
    elementId,
    scopesVersion,
    controlSetVersion,
    requirementsVersion,
    linkCurrencyVersion,
    workVersion,
  ]);

  // A subsystem's parts start folded: the map reads at the level the
  // categorization happens, and a chevron opens the parts.
  const initialExpanded = useMemo(() => {
    const open: string[] = [];
    const walk = (r: TreeRow) => {
      if (r.depth === 0 || r.scope !== null || expandedByDefault(r.node)) open.push(r.node.id);
      r.parts.forEach(walk);
    };
    rows.forEach(walk);
    return open;
    // the first render decides; the table keeps the reader's changes after that
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const columns = useMemo(
    () =>
      defineColumns<TreeRow>((c) => [
        c.custom("element", {
          header: "Element",
          width: 280,
          minWidth: 240,
          hideable: false,
          cell: (r) => (
            <ElementHover nodeId={r.node.id}>
              <span
                tabIndex={0}
                className="rounded-xsmall outline-none focus-visible:outline-focused"
              >
                {r.node.name}
              </span>
            </ElementHover>
          ),
        }),
        c.custom("kind", { header: "Kind", width: 100, cell: (r) => r.node.kind }),
        c.custom("owner", {
          header: "Owner",
          width: 160,
          cell: (r) => r.owner,
          text: (r) => r.owner,
        }),
        ...objectives.map((o) =>
          c.custom(o, {
            header: o.slice(0, 1),
            width: 48,
            cell: (r) => {
              const triad = r.scope ? triadOf(r.scope) : null;
              return triad ? (
                <Badge variant="secondary" size="xsmall" tone={impactTone[triad[o]]}>
                  {triad[o].slice(0, 1)}
                </Badge>
              ) : null;
            },
          }),
        ),
        c.custom("requirements", {
          header: "Allocated requirements",
          width: 170,
          align: "end",
          cell: (r) =>
            r.requirements ? (
              <TextLink>
                <Link
                  to="/programs/$programId"
                  params={{ programId }}
                  search={(prev) => ({
                    ...prev,
                    tab: "Requirements",
                    element: r.node.id,
                    peek: undefined,
                  })}
                  onClick={(event) => event.stopPropagation()}
                  aria-label={`View ${r.requirements} allocated requirements for ${r.node.name}`}
                  title={
                    r.withoutControl
                      ? `${r.withoutControl} requirements have no control mapping`
                      : undefined
                  }
                >
                  {r.requirements}
                </Link>
              </TextLink>
            ) : (
              <Absent />
            ),
        }),
        c.custom("controls", {
          header: "Applicable controls",
          width: 150,
          align: "end",
          cell: (r) =>
            r.controls ? (
              <TextLink>
                <Link
                  to="/programs/$programId"
                  params={{ programId }}
                  search={(prev) => ({
                    ...prev,
                    tab: "Controls",
                    element: r.node.id,
                    peek: undefined,
                  })}
                  onClick={(event) => event.stopPropagation()}
                  aria-label={`View ${r.controls} applicable controls for ${r.node.name}`}
                >
                  {r.controls}
                </Link>
              </TextLink>
            ) : (
              <Absent />
            ),
        }),
        c.custom("work", { header: "Work", width: 210, cell: (r) => <WorkBar work={r.work} /> }),
        c.custom("controlSet", {
          header: "Control set",
          width: 180,
          cell: (r) =>
            r.scope ? (
              <Link
                to="/programs/$programId/components/$componentId"
                params={{ programId, componentId: r.node.id }}
                search={{ tab: "Control set" }}
                onClick={(event) => event.stopPropagation()}
                aria-label={`Manage control set for ${r.node.name}`}
              >
                <ControlSetCell scope={r.scope} />
              </Link>
            ) : null,
        }),
        c.custom("edit", {
          header: "",
          width: 136,
          hideable: false,
          cell: (r) => (
            <Inline space="space.050" alignBlock="center">
              <Button
                size="small"
                variant="subtle"
                aria-label={`Edit ${r.node.name}`}
                onClick={(event) => {
                  event.stopPropagation();
                  setEditing(r.node);
                }}
              >
                Edit
              </Button>
              {r.node.parent ? (
                <Button
                  size="small"
                  variant="subtle"
                  aria-label={`Move ${r.node.name}`}
                  onClick={(event) => {
                    event.stopPropagation();
                    setMoving(r.node);
                  }}
                >
                  Move
                </Button>
              ) : null}
            </Inline>
          ),
        }),
        c.actions((r) => [
          {
            label: "View controls",
            onSelect: () =>
              void navigate({
                search: (prev) => ({
                  ...prev,
                  tab: "Controls",
                  element: r.node.id,
                  peek: undefined,
                }),
              }),
          },
          {
            label: "View requirements",
            onSelect: () =>
              void navigate({
                search: (prev) => ({
                  ...prev,
                  tab: "Requirements",
                  element: r.node.id,
                  peek: undefined,
                }),
              }),
          },
          ...(r.scope
            ? [
                {
                  label: "Manage control set",
                  onSelect: () =>
                    void navigate({
                      to: "/programs/$programId/components/$componentId",
                      params: { programId, componentId: r.node.id },
                      search: { tab: "Control set" },
                    }),
                },
              ]
            : []),
          { label: "Allocate a requirement", onSelect: () => setAllocating(r.node) },
          {
            label: "Add component",
            onSelect: () => setAdding({ parent: r.node, kind: "Chassis" }),
          },
          {
            label: "Open the full record",
            onSelect: () =>
              void navigate({
                to: "/programs/$programId/components/$componentId",
                params: { programId, componentId: r.node.id },
              }),
          },
        ]),
      ]),
    [navigate, programId],
  );

  const table = useDataTable({
    columns,
    data: rows,
    getRowId: (r) => r.node.id,
    label: "System",
    view: "program-system-tree",
    initialState: {
      columnVisibility: {
        Confidentiality: false,
        Integrity: false,
        Availability: false,
        work: false,
        controlSet: false,
      },
    },
    tree: {
      children: (r) => r.parts,
      label: (r) => r.node.name,
      hint: (_, n) => (
        <Text size="xsmall" color="color.text.subtle">
          {n} part{n === 1 ? "" : "s"}
        </Text>
      ),
      initialExpanded,
    },
  });

  // A newly selected subtree opens at its root; other disclosure choices remain intact.
  const expandedSelection = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (expandedSelection.current === elementId) return;
    expandedSelection.current = elementId;
    if (elementId)
      table.setExpanded((current) => (current === true ? true : { ...current, [elementId]: true }));
  }, [elementId, table]);

  return (
    <Stack space="space.150">
      <DataTable
        table={table}
        onRowClick={(r) => setStack([r.node.id])}
        toolbar={
          <Inline space="space.100" alignBlock="center" shouldWrap className="w-full">
            <Button
              size="small"
              variant="primary"
              disabled={!nodes.some((node) => node.parent === null)}
              onClick={() => {
                const parent = nodes.find((node) => node.parent === null);
                if (parent) setAdding({ parent, kind: "Subsystem" });
              }}
            >
              Add subsystem
            </Button>
            <Button
              size="small"
              variant="secondary"
              disabled={!nodes.length}
              onClick={() => {
                const parent =
                  nodes.find((node) => node.kind === "Subsystem") ??
                  nodes.find((node) => node.parent === null);
                if (parent) setAdding({ parent, kind: "Chassis" });
              }}
            >
              Add component
            </Button>
            <Inline className="ml-auto" space="space.100" alignBlock="center">
              <DataTable.Columns table={table} />
              <DataTable.Settings table={table} />
            </Inline>
          </Inline>
        }
      />

      {adding ? (
        <AddNodeSheet
          open
          onClose={() => setAdding(null)}
          programId={programId}
          parent={adding.parent}
          initialKind={adding.kind}
          onCreated={(node) => {
            if (node.parent)
              table.setExpanded((current) =>
                current === true ? true : { ...current, [node.parent!]: true },
              );
          }}
        />
      ) : null}
      {editing ? (
        <EditNodeSheet node={editing} programId={programId} onClose={() => setEditing(null)} />
      ) : null}
      {moving ? (
        <MoveNodeSheet
          node={moving}
          programId={programId}
          onClose={() => setMoving(null)}
          onMoved={(parentId) =>
            table.setExpanded((current) =>
              current === true ? true : { ...current, [parentId]: true },
            )
          }
        />
      ) : null}
      {allocating ? (
        <AllocateRequirementsSheet
          open
          programId={programId}
          node={allocating}
          onClose={() => setAllocating(null)}
        />
      ) : null}
      <NodePreviewSheet
        programId={programId}
        nodeId={editing || moving ? null : preview}
        onClose={() => setStack([])}
        onSelect={(id) => setStack([...stack, id])}
        onBack={stack.length > 1 ? () => setStack(stack.slice(0, -1)) : undefined}
        onEdit={setEditing}
        onMove={setMoving}
      />
    </Stack>
  );
}

/** Enclaves and subsystems open by default; hardware and software parts fold. */
function expandedByDefault(node: CompositionNode): boolean {
  return node.kind === "System" || node.kind === "Subsystem" || node.kind === "Enclave";
}

function scopeWork(scope: AssessmentScope): WorkSummary {
  const controls = new Set(controlSetFor(scope.id)?.controls.map((row) => row.control.id) ?? []);
  const total = controls.size;
  const records = workForScope(scope.id).filter((work) => controls.has(work.control));
  const satisfied = records.filter((w) => w.assessment === "Satisfied").length;
  const inWork = records.filter((w) => w.owner && w.assessment !== "Satisfied").length;
  return { total, satisfied, inWork, unassigned: Math.max(0, total - satisfied - inWork) };
}

/** Three segments, no percentage: satisfied · in work · unassigned. The kit's stacked bar. */
function WorkBar({ work }: { work: WorkSummary }) {
  if (!work.total) return <Absent />;
  return (
    <Inline
      title={`${work.satisfied} satisfied · ${work.inWork} in work · ${work.unassigned} unassigned`}
      as="span"
      space="space.100"
      alignBlock="center"
    >
      <span className="shrink-0" style={{ width: 64 }}>
        <ProgressStacked
          size="medium"
          segments={[
            {
              key: "satisfied",
              value: work.satisfied,
              tone: "success",
              title: `${work.satisfied} satisfied`,
            },
            {
              key: "in-work",
              value: work.inWork,
              tone: "information",
              title: `${work.inWork} in work`,
            },
            {
              key: "unassigned",
              value: work.unassigned,
              tone: "neutral",
              title: `${work.unassigned} unassigned`,
            },
          ]}
        ></ProgressStacked>
      </span>
      <Text size="xsmall" color="color.text.subtle" maxLines={1} className="tabular-nums">
        {work.satisfied}/{work.total}
        {work.unassigned ? ` · ${work.unassigned} unassigned` : ""}
      </Text>
    </Inline>
  );
}

function ControlSetCell({ scope }: { scope: AssessmentScope }) {
  const open = openRevision(scope.id);
  const inForce = inForceRevision(scope.id);
  const suspect = suspectAllocationsUnder([
    scope.element,
    ...descendantsOf(scope.element).map((n) => n.id),
  ]);
  const flag = suspect ? <Indicator tone="warning">{suspect} suspect</Indicator> : null;
  if (open) {
    return (
      <Inline as="span" space="space.100" alignBlock="center">
        <Indicator tone={revisionTone[open.state]}>
          v{open.number} {open.state.toLowerCase()}
        </Indicator>
        {flag}
      </Inline>
    );
  }
  if (inForce)
    return (
      <Inline as="span" space="space.100" alignBlock="center">
        <Indicator tone="success">v{inForce.number} in force</Indicator>
        {flag}
      </Inline>
    );
  return flag ?? <Absent />;
}

function EditNodeSheet({
  node,
  programId,
  onClose,
}: {
  node: CompositionNode;
  programId: string;
  onClose: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const { form, values, formId, formRef, isSubmitting } = useRecordForm(
    { name: node.name, supplier: node.supplier, version: node.version, note: node.note },
    (value) => ({ name: value.name }),
  );
  const save = () =>
    form.handleSubmit({
      save: () => {
        if (node.program !== programId) return;
        try {
          updateCompositionNode(node.id, {
            name: values.name.trim(),
            supplier: values.supplier.trim(),
            version: values.version.trim(),
            note: values.note.trim(),
          });
          toast.success("Element updated", { description: values.name.trim() });
          onClose();
        } catch (cause) {
          setError(cause instanceof Error ? cause.message : "Could not update this element.");
        }
      },
    });
  return (
    <Sheet
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <SheetContent side="end" style={{ maxWidth: 420 }}>
        <SheetHeader>
          <SheetTitle>Edit element</SheetTitle>
          <SheetDescription>
            {node.id} · {node.kind}
          </SheetDescription>
        </SheetHeader>
        <Box className="min-h-0 flex-1 overflow-y-auto overscroll-none px-200 py-150">
          <form
            id={formId}
            ref={formRef}
            noValidate
            onSubmit={(event) => {
              event.preventDefault();
              void save();
            }}
          >
            <Stack space="space.150">
              {error ? (
                <Text color="color.text.danger" role="alert">
                  {error}
                </Text>
              ) : null}
              {(["name", "supplier", "version", "note"] as const).map((key) => (
                <form.Field key={key} name={key}>
                  {(field) => (
                    <Field
                      label={key[0]!.toUpperCase() + key.slice(1)}
                      isRequired={key === "name"}
                      error={
                        field.state.meta.isTouched && !field.state.meta.isValid
                          ? [...new Set(field.state.meta.errors)].join(" ")
                          : undefined
                      }
                    >
                      {key === "note" ? (
                        <Textarea
                          name={field.name}
                          value={field.state.value}
                          onChange={(event) => field.handleChange(event.target.value)}
                          onBlur={field.handleBlur}
                        />
                      ) : (
                        <Input
                          autoFocus={key === "name"}
                          name={field.name}
                          value={field.state.value}
                          onChange={(event) => field.handleChange(event.target.value)}
                          onBlur={field.handleBlur}
                        />
                      )}
                    </Field>
                  )}
                </form.Field>
              ))}
            </Stack>
          </form>
        </Box>
        <SheetFooter>
          <Button variant="subtle" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" form={formId} disabled={isSubmitting}>
            Save changes
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function MoveNodeSheet({
  node,
  programId,
  onClose,
  onMoved,
}: {
  node: CompositionNode;
  programId: string;
  onClose: () => void;
  onMoved: (parentId: string) => void;
}) {
  const nodes = useCompositionGraph(programId);
  const parents = validCompositionParents(node.id).filter((parent) => parent.program === programId);
  const [error, setError] = useState<string | null>(null);
  const { form, values, formId, formRef, isSubmitting } = useRecordForm(
    { parentId: node.parent ?? "" },
    (value) => ({ parentId: value.parentId }),
  );
  const move = () =>
    form.handleSubmit({
      save: () => {
        if (node.program !== programId) return;
        try {
          moveCompositionNode(node.id, values.parentId);
          onMoved(values.parentId);
          toast.success("Element moved", { description: node.name });
          onClose();
        } catch (cause) {
          setError(cause instanceof Error ? cause.message : "Could not move this element.");
        }
      },
    });
  return (
    <Sheet
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <SheetContent side="end" style={{ maxWidth: 420 }}>
        <SheetHeader>
          <SheetTitle>Move {node.name}</SheetTitle>
          <SheetDescription>
            Current parent: {nodes.find((item) => item.id === node.parent)?.name ?? "—"}
          </SheetDescription>
        </SheetHeader>
        <Box className="min-h-0 flex-1 overflow-y-auto overscroll-none px-200 py-150">
          <form
            id={formId}
            ref={formRef}
            noValidate
            onSubmit={(event) => {
              event.preventDefault();
              void move();
            }}
          >
            <Stack space="space.150">
              {error ? (
                <Text color="color.text.danger" role="alert">
                  {error}
                </Text>
              ) : null}
              <form.Field name="parentId">
                {(field) => (
                  <Field label="New parent" isRequired>
                    <NativeSelect
                      aria-label="New parent"
                      name={field.name}
                      value={field.state.value}
                      onChange={(event) => field.handleChange(event.target.value)}
                      onBlur={field.handleBlur}
                    >
                      {parents.map((parent) => (
                        <option key={parent.id} value={parent.id}>
                          {parent.name} · {parent.kind}
                        </option>
                      ))}
                    </NativeSelect>
                  </Field>
                )}
              </form.Field>
            </Stack>
          </form>
        </Box>
        <SheetFooter>
          <Button variant="subtle" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            type="submit"
            form={formId}
            disabled={
              isSubmitting ||
              !parents.some((parent) => parent.id === values.parentId) ||
              values.parentId === node.parent
            }
          >
            Move element
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

/* --------------------------------------------------------- Add a node */

/**
 * A node under a chosen parent. A Subsystem also becomes a scope with its own
 * categorization and revision 1 of its control set; a part inherits its
 * nearest categorized ancestor's obligations through containment.
 */
export function AddNodeSheet({
  open,
  onClose,
  programId,
  parent,
  initialKind = "Subsystem",
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  programId: string;
  parent: CompositionNode | null;
  initialKind?: NodeKind;
  onCreated?: (node: CompositionNode) => void;
}) {
  const nodes = useCompositionGraph(programId);
  const [error, setError] = useState<string | null>(null);
  const { form, values, setValue, formId, formRef } = useRecordForm(
    {
      name: "",
      kind: initialKind,
      parentId: parent?.id ?? "",
      note: "",
      owner: "",
    },
    (value) => ({ name: value.name, parentId: value.parentId }),
  );
  const { name, kind, note, owner, parentId } = values;
  const selectedParent = nodes.find((node) => node.id === parentId) ?? null;
  const setName = useCallback(
    (value: SetStateAction<typeof name>) => setValue("name", value),
    [setValue],
  );
  const setKind = useCallback(
    (value: SetStateAction<typeof kind>) => setValue("kind", value),
    [setValue],
  );
  const setNote = useCallback(
    (value: SetStateAction<typeof note>) => setValue("note", value),
    [setValue],
  );
  const setOwner = useCallback(
    (value: SetStateAction<typeof owner>) => setValue("owner", value),
    [setValue],
  );
  const chosen = addableKinds.find((k) => k.kind === kind) ?? addableKinds[0]!;
  const isScope = kind === "Subsystem" || kind === "Enclave";
  const basisScope = selectedParent ? closestProgramScope(programId, selectedParent.id) : undefined;

  const reset = () => {
    setName("");
    setKind(initialKind);
    setNote("");
    setOwner("");
  };

  const create = () => {
    return form.handleSubmit({
      save: () => {
        if (!name.trim() || !selectedParent) return;
        try {
          const node = createCompositionNode(
            {
              id: nextNodeId(),
              name: name.trim(),
              kind: chosen.kind,
              class: chosen.class,
              parent: selectedParent.id,
              program: programId,
              note: note.trim(),
            },
            {
              ...(basisScope ? { basisScopeId: basisScope.id } : {}),
              ...(owner ? { owner } : {}),
            },
          );
          if (!node) return;
          toast.success(`${node.id} added`, {
            description: `${name.trim()} under ${selectedParent.name}`,
          });
          onCreated?.(node);
          reset();
          onClose();
        } catch (cause) {
          setError(cause instanceof Error ? cause.message : "Could not add this element.");
        }
      },
    });
  };

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          reset();
          onClose();
        }
      }}
    >
      <SheetContent side="end" style={{ maxWidth: 420 }}>
        <SheetHeader>
          <SheetTitle>{isScope ? "Add subsystem" : "Add component"}</SheetTitle>
          <SheetDescription>Choose where it belongs.</SheetDescription>
        </SheetHeader>
        <Box className="min-h-0 flex-1 overflow-y-auto overscroll-none px-200 py-150">
          <form
            id={formId + "-1"}
            ref={formRef}
            noValidate
            onSubmit={(event) => {
              event.preventDefault();
              void create();
            }}
          >
            <Stack space="space.150">
              {error ? (
                <Text color="color.text.danger" role="alert">
                  {error}
                </Text>
              ) : null}
              <form.Field name="parentId">
                {(field) => (
                  <Field
                    label="Parent"
                    isRequired
                    error={
                      field.state.meta.isTouched && !field.state.meta.isValid
                        ? [...new Set(field.state.meta.errors)].join(" ")
                        : undefined
                    }
                  >
                    <NativeSelect
                      value={field.state.value}
                      onChange={(event) => field.handleChange(event.target.value)}
                      aria-label="Parent"
                      name={field.name}
                      onBlur={field.handleBlur}
                    >
                      {nodes.map((node) => (
                        <option key={node.id} value={node.id}>
                          {node.name} · {node.kind}
                        </option>
                      ))}
                    </NativeSelect>
                  </Field>
                )}
              </form.Field>
              <form.Field name="kind">
                {(field) => (
                  <Field
                    label="Kind"
                    error={
                      field.state.meta.isTouched && !field.state.meta.isValid
                        ? [...new Set(field.state.meta.errors)].join(" ")
                        : undefined
                    }
                  >
                    <NativeSelect
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value as NodeKind)}
                      aria-label="Kind"
                      name={field.name}
                      onBlur={field.handleBlur}
                    >
                      {addableKinds.map((k) => (
                        <option key={k.kind} value={k.kind}>
                          {k.kind} · {k.class}
                        </option>
                      ))}
                    </NativeSelect>
                  </Field>
                )}
              </form.Field>
              <form.Field name="name">
                {(field) => (
                  <Field
                    isRequired
                    error={
                      field.state.meta.isTouched && !field.state.meta.isValid
                        ? [...new Set(field.state.meta.errors)].join(" ")
                        : undefined
                    }
                    label="Name"
                  >
                    <Input
                      autoFocus
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder={isScope ? "Flight computer" : "Mission data bus controller"}
                      name={field.name}
                      onBlur={field.handleBlur}
                    />
                  </Field>
                )}
              </form.Field>
              <form.Field name="note">
                {(field) => (
                  <Field
                    label={isScope ? "Function" : "Note"}
                    error={
                      field.state.meta.isTouched && !field.state.meta.isValid
                        ? [...new Set(field.state.meta.errors)].join(" ")
                        : undefined
                    }
                  >
                    <Textarea
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="Flight control laws, actuator command, and the mission data bus."
                      name={field.name}
                      onBlur={field.handleBlur}
                    />
                  </Field>
                )}
              </form.Field>
              {basisScope ? (
                <form.Field name="owner">
                  {(field) => (
                    <Field
                      label="Owner"
                      error={
                        field.state.meta.isTouched && !field.state.meta.isValid
                          ? [...new Set(field.state.meta.errors)].join(" ")
                          : undefined
                      }
                    >
                      <Input
                        value={field.state.value}
                        onChange={(event) => field.handleChange(event.target.value)}
                        placeholder="Name or team"
                        name={field.name}
                        onBlur={field.handleBlur}
                      />
                    </Field>
                  )}
                </form.Field>
              ) : null}
              <Field
                label="Starting control set"
                hint={
                  basisScope ? "Review and tailor the draft on the Control set tab." : undefined
                }
              >
                <Text>
                  {basisScope
                    ? `${basisScope.name} · ${controlSetFor(basisScope.id)?.total ?? 0} controls`
                    : "No parent control set"}
                </Text>
              </Field>
            </Stack>
          </form>
        </Box>
        <SheetFooter>
          <>
            <Button
              variant="subtle"
              onClick={() => {
                reset();
                onClose();
              }}
            >
              Cancel
            </Button>
            <Button variant="primary" type="submit" form={formId + "-1"} disabled={!selectedParent}>
              {isScope ? "Add subsystem" : "Add component"}
            </Button>
          </>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
