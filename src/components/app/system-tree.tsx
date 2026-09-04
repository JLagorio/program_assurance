/**
 * The System tab's spine: the system as built, broken down into subsystems and
 * components, and against every node what it owes — the requirements
 * allocated to it, the controls those requirements reach, how far the work on
 * those controls has got, and (for a categorized node) the control set in
 * force. The node record is one click away and is where the work happens;
 * this is the map.
 *
 * Nothing here stores a control-to-node edge. Controls "reached" come from
 * `derivedControlTrace` (allocation → requirement → derivation), and a
 * System or Subsystem node's controls are its scope's control set.
 */

import { useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";

import {
  Absent,
  Badge,
  Button,
  Box,
  Combobox,
  DataTable,
  Editable,
  Field,
  Indicator,
  Inline,
  Input,
  NativeSelect,
  PickerSheet,
  Progress,
  Select,
  Sheet,
  Stack,
  Table,
  Text,
  Textarea,
  defineColumns,
  toast,
  useDataTable,
} from "@ledger/design-system";
import {
  addCompositionNodes,
  childrenOf,
  descendantsOf,
  nextNodeId,
  useCompositionGraph,
  type CompositionNode,
  type NodeClass,
  type NodeKind,
} from "@/lib/composition";
import {
  createInitialRevision,
  inForceRevision,
  initialOverlayDecisions,
  openRevision,
  revisionTone,
  useControlSetVersion,
} from "@/lib/control-set";
import { positionOf, useWorkVersion, workForScope } from "@/lib/control-work";
import { workIndex } from "@/lib/control-board";

import { NodePreviewSheet } from "./node-preview";
import {
  addAllocation,
  allocationsOn,
  coverageTone,
  coverages,
  derivedControlTrace,
  requirementStateTone,
  requirementsForProgram,
  responsibilities,
  responsibilityTone,
  useRequirementsVersion,
  type Coverage,
  type Requirement,
  type Responsibility,
} from "@/lib/requirements";
import {
  addScopes,
  controlSetFor,
  objectives,
  scopesForProgram,
  triadOf,
  useScopesVersion,
  type AssessmentScope,
} from "@/lib/scopes";

const impactTone = { Low: "neutral", Moderate: "warning", High: "danger" } as const;

const people = ["Grace Hoppel", "Marcus Ryde", "Dana Whitlock", "Priya Raghavan", "Sarah Chen"];

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
  requirements: number;
  withoutControl: number;
  controls: number;
  work: WorkSummary;
  children: number;
};

/* ------------------------------------------------------------------ Tree */

/** A node's row, with its parts under it: the projection the tree draws. */
type TreeRow = Row & { parts: TreeRow[] };

export function SystemTree({ programId }: { programId: string }) {
  const nodes = useCompositionGraph(programId);
  const scopesVersion = useScopesVersion();
  const controlSetVersion = useControlSetVersion();
  const requirementsVersion = useRequirementsVersion();
  const workVersion = useWorkVersion();

  const [adding, setAdding] = useState<CompositionNode | null>(null);
  const [allocating, setAllocating] = useState<CompositionNode | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const navigate = useNavigate();

  const scopes = scopesForProgram(programId);

  // The projection: every node with what it owes, its parts under it. Rebuilt when a store changes,
  // and the tree's open rows survive that because the table keeps them by node id.
  const rows = useMemo(() => {
    const scopeByElement = new Map(scopes.map((s) => [s.element, s]));
    const index = workIndex(programId);
    const build = (node: CompositionNode, depth: number): TreeRow => {
      const scope = scopeByElement.get(node.id) ?? null;
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
      return {
        node,
        depth,
        scope,
        requirements: requirements.size,
        withoutControl: withoutControl.size,
        controls: scope ? (controlSetFor(scope.id)?.total ?? 0) : reached.size,
        work: scope ? scopeWork(scope) : traceWork([...reached], index),
        children: kids.length,
        parts: kids.map((k) => build(k, depth + 1)),
      };
    };
    return nodes.filter((n) => n.parent === null).map((n) => build(n, 0));
    // the stores this reads are subscribed through their versions
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes, programId, scopesVersion, controlSetVersion, requirementsVersion, workVersion]);

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
        c.custom("element", { header: "Element", cell: (r) => r.node.name }),
        c.custom("kind", { header: "Kind", width: 100, cell: (r) => r.node.kind }),
        ...objectives.map((o) =>
          c.custom(o, {
            header: o.slice(0, 1),
            width: 48,
            cell: (r) => {
              const triad = r.scope ? triadOf(r.scope) : null;
              return triad ? (
                <Badge size="xsmall" tone={impactTone[triad[o]]}>
                  {triad[o].slice(0, 1)}
                </Badge>
              ) : null;
            },
          }),
        ),
        c.custom("requirements", {
          header: "Requirements",
          width: 110,
          align: "end",
          cell: (r) =>
            r.requirements ? (
              <span title={r.withoutControl ? `${r.withoutControl} name no control` : undefined}>
                {r.requirements}
                {r.withoutControl ? (
                  <Text color="color.text.subtle"> · {r.withoutControl} own</Text>
                ) : null}
              </span>
            ) : (
              <Absent />
            ),
        }),
        c.custom("controls", {
          header: "Controls",
          width: 80,
          align: "end",
          cell: (r) => r.controls || <Absent />,
        }),
        c.custom("work", { header: "Work", width: 210, cell: (r) => <WorkBar work={r.work} /> }),
        c.custom("controlSet", {
          header: "Control set",
          width: 180,
          cell: (r) => (r.scope ? <ControlSetCell scope={r.scope} /> : null),
        }),
        c.actions((r) => [
          { label: "Allocate a requirement", onSelect: () => setAllocating(r.node) },
          { label: "Add a part", onSelect: () => setAdding(r.node) },
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

  return (
    <Stack space="space.150">
      <DataTable table={table} onRowClick={(r) => setPreview(r.node.id)} />

      <AddNodeSheet
        open={adding !== null}
        onClose={() => setAdding(null)}
        programId={programId}
        parent={adding}
        scopes={scopes}
      />
      {allocating ? (
        <AllocateToNodeDialog
          programId={programId}
          node={allocating}
          onClose={() => setAllocating(null)}
        />
      ) : null}
      <NodePreviewSheet
        programId={programId}
        nodeId={preview}
        onClose={() => setPreview(null)}
        onSelect={setPreview}
      />
    </Stack>
  );
}

/** Enclaves and subsystems open by default; hardware and software parts fold. */
function expandedByDefault(node: CompositionNode): boolean {
  return node.kind === "System" || node.kind === "Subsystem" || node.kind === "Enclave";
}

function scopeWork(scope: AssessmentScope): WorkSummary {
  const total = controlSetFor(scope.id)?.total ?? 0;
  const records = workForScope(scope.id);
  const satisfied = records.filter((w) => w.assessment === "Satisfied").length;
  const inWork = records.filter((w) => w.owner && w.assessment !== "Satisfied").length;
  return { total, satisfied, inWork, unassigned: Math.max(0, total - satisfied - inWork) };
}

function traceWork(
  controls: string[],
  index: Map<string, ReturnType<typeof workIndex> extends Map<string, infer W> ? W : never>,
): WorkSummary {
  let satisfied = 0;
  let inWork = 0;
  for (const c of controls) {
    const w = index.get(c);
    const position = w ? positionOf(w) : "Unassigned";
    if (position === "Satisfied") satisfied += 1;
    else if (position !== "Unassigned") inWork += 1;
  }
  return {
    total: controls.length,
    satisfied,
    inWork,
    unassigned: controls.length - satisfied - inWork,
  };
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
        <Progress.Stacked
          height={6}
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
        />
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
  if (open) {
    return (
      <Indicator tone={revisionTone[open.state]}>
        v{open.number} {open.state.toLowerCase()}
      </Indicator>
    );
  }
  if (inForce) return <Indicator tone="success">v{inForce.number} in force</Indicator>;
  return <Absent />;
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
  scopes,
}: {
  open: boolean;
  onClose: () => void;
  programId: string;
  parent: CompositionNode | null;
  scopes: AssessmentScope[];
}) {
  const [name, setName] = useState("");
  const [kind, setKind] = useState<NodeKind>("Subsystem");
  const [note, setNote] = useState("");
  const [owner, setOwner] = useState("");
  const [basis, setBasis] = useState("");

  const chosen = addableKinds.find((k) => k.kind === kind) ?? addableKinds[0]!;
  const isScope = kind === "Subsystem" || kind === "Enclave";
  const basisScope = scopes.find((s) => s.id === basis) ?? scopes[0] ?? null;

  const reset = () => {
    setName("");
    setKind("Subsystem");
    setNote("");
    setOwner("");
    setBasis("");
  };

  const create = () => {
    if (!name.trim() || !parent) return;
    const [node] = addCompositionNodes([
      {
        id: nextNodeId(),
        name: name.trim(),
        kind: chosen.kind,
        class: chosen.class,
        parent: parent.id,
        program: programId,
        note: note.trim(),
      },
    ]);
    if (!node) return;
    if (isScope && basisScope) {
      const [scope] = addScopes([
        {
          program: programId,
          element: node.id,
          name: name.trim(),
          owner: owner || basisScope.owner,
          mission: note.trim() || `${name.trim()} subsystem.`,
          independentlyAuthorized: false,
          parameters: { ...basisScope.parameters },
          separationBasis: `Categorized as ${basisScope.name} until its own boundary is demonstrated.`,
        },
      ]);
      if (scope) {
        const rev = createInitialRevision({
          program: programId,
          scope: scope.id,
          parameters: { ...basisScope.parameters },
          overlays: initialOverlayDecisions(basisScope.parameters),
          tailoring: [],
          separationBasis: scope.separationBasis,
          reason: `Subsystem added under ${parent.name}`,
          submit: false,
        });
        toast.success(`${scope.id} created`, {
          description: `${name.trim()} · categorized as ${basisScope.name} · v${rev.number} draft`,
        });
      }
    } else {
      toast.success(`${node.id} added`, { description: `${name.trim()} under ${parent.name}` });
    }
    reset();
    onClose();
  };

  return (
    <Sheet
      open={open}
      onClose={() => {
        reset();
        onClose();
      }}
      title={parent ? `Add under ${parent.name}` : "Add an element"}
      subtitle={
        isScope
          ? "A node in the tree, a scope of its own, and revision 1 of its control set."
          : "A part of the system. It inherits the obligations of the subsystem that contains it."
      }
      footer={
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
          <Button variant="primary" onClick={create} disabled={!name.trim() || !parent}>
            Add {kind.toLowerCase()}
          </Button>
        </>
      }
    >
      <Stack space="space.150">
        <Field label="Kind">
          <Select value={kind} onValueChange={(v) => setKind(v as NodeKind)} aria-label="Kind">
            {addableKinds.map((k) => (
              <Select.Item key={k.kind} value={k.kind}>
                {k.kind} · {k.class}
              </Select.Item>
            ))}
          </Select>
        </Field>
        <Field label="Name">
          <Input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={isScope ? "Flight computer" : "Mission data bus controller"}
          />
        </Field>
        <Field label={isScope ? "Function" : "Note"} hint="What it does for the mission.">
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Flight control laws, actuator command, and the mission data bus."
          />
        </Field>
        {isScope ? (
          <>
            <Field label="Owner">
              <Combobox
                value={owner}
                onChange={setOwner}
                options={people.map((p) => ({ value: p, label: p }))}
                placeholder={basisScope ? `Inherits ${basisScope.owner}` : "Choose an owner"}
                searchPlaceholder="Search people…"
                className="w-full"
              />
            </Field>
            <Field
              label="Start from the categorization of"
              hint="Copied into revision 1 as a draft; change it on the scope's Control set tab before submitting."
            >
              <Select
                value={basisScope?.id ?? ""}
                onValueChange={setBasis}
                aria-label="Basis scope"
              >
                {scopes.map((s) => (
                  <Select.Item key={s.id} value={s.id}>
                    {s.name} · {triadOf(s).Confidentiality[0]}-{triadOf(s).Integrity[0]}-
                    {triadOf(s).Availability[0]}
                  </Select.Item>
                ))}
              </Select>
            </Field>
          </>
        ) : null}
      </Stack>
    </Sheet>
  );
}

/* ------------------------------------------------ Allocate requirements */

/** What every allocation carries (`§8`): the bounded claim is required. */
type AllocationFields = { responsibility: Responsibility; coverage: Coverage; scope: string };
type ChosenRow = Requirement & AllocationFields;

const defaultFields: AllocationFields = {
  responsibility: "Primary",
  coverage: "Partial",
  scope: "",
};

const candidateColumns = defineColumns<Requirement>((c) => [
  c.id("id", { header: "Requirement", width: 110 }),
  c.text("text", { header: "Shall statement", sortable: false }),
  c.text("type", { header: "Type", width: 130 }),
  c.status("state", { header: "State", width: 110, tone: (r) => requirementStateTone[r.state] }),
]);

/**
 * Put the program's requirements on this node, many at a time. Frame one
 * chooses from the table; frame two fills in responsibility, coverage and the
 * bounded claim for each, because an allocation without a scope is a wish,
 * not a responsibility (`§8`).
 */
export function AllocateToNodeDialog({
  programId,
  node,
  onClose,
}: {
  programId: string;
  node: CompositionNode;
  onClose: () => void;
}) {
  const version = useRequirementsVersion();
  const [frame, setFrame] = useState<"choose" | "details">("choose");
  const [fields, setFields] = useState<Record<string, AllocationFields>>({});
  const [claim, setClaim] = useState("");

  const allocated = allocationsOn(node.id).length;
  const candidates = useMemo(() => {
    const already = new Set(allocationsOn(node.id).map((a) => a.requirement));
    return requirementsForProgram(programId).filter(
      (r) => !already.has(r.id) && r.state !== "Rejected" && r.state !== "Retired",
    );
    // the store is subscribed through its version
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [programId, node.id, version]);

  // The selection is kept by row id, so it survives the search and the facets.
  const choose = useDataTable({
    columns: candidateColumns,
    data: candidates,
    getRowId: (r) => r.id,
    selectable: true,
    label: "Requirements",
    initialState: { sorting: [{ id: "id", desc: false }] },
  });
  const chosenIds = Object.keys(choose.state.rowSelection);
  const chosen = new Set(chosenIds);
  const fieldOf = (id: string): AllocationFields => fields[id] ?? defaultFields;
  const setField = (id: string, patch: Partial<AllocationFields>) =>
    setFields((f) => ({ ...f, [id]: { ...(f[id] ?? defaultFields), ...patch } }));
  const applyAll = (patch: Partial<AllocationFields>) =>
    setFields((f) =>
      Object.fromEntries(chosenIds.map((id) => [id, { ...(f[id] ?? defaultFields), ...patch }])),
    );
  const rows: ChosenRow[] = candidates
    .filter((r) => chosen.has(r.id))
    .map((r) => ({ ...r, ...fieldOf(r.id) }));
  const withoutClaim = rows.filter((r) => !r.scope.trim()).length;

  const detailColumns = useMemo(
    () =>
      defineColumns<ChosenRow>((c) => [
        c.id("id", { header: "Requirement", width: 110, sortable: false }),
        c.text("text", { header: "Shall statement", sortable: false }),
        c.status("responsibility", {
          header: "Responsibility",
          width: 140,
          sortable: false,
          tone: (r) => responsibilityTone[r.responsibility],
          editable: {
            options: responsibilities,
            onChange: (row, next) => setField(row.id, { responsibility: next as Responsibility }),
            save: async () => undefined,
          },
        }),
        c.status("coverage", {
          header: "Coverage",
          width: 120,
          sortable: false,
          tone: (r) => coverageTone[r.coverage],
          editable: {
            options: coverages,
            onChange: (row, next) => setField(row.id, { coverage: next as Coverage }),
            save: async () => undefined,
          },
        }),
        c.text("scope", {
          header: "What this element answers",
          sortable: false,
          editable: {
            onChange: (row, next) => setField(row.id, { scope: next }),
            save: async () => undefined,
          },
          // drawn by hand for the placeholder; `editable` above keeps the grid semantics
          cell: (r) => (
            <Editable.Text
              value={r.scope}
              placeholder="The bounded claim"
              onChange={(next) => setField(r.id, { scope: next })}
              save={async () => undefined}
            />
          ),
        }),
        c.custom("apply", {
          header: "",
          width: 120,
          align: "end",
          cell: (r) => (
            <Button
              variant="link"
              size="small"
              onClick={() => choose.getRow(r.id).toggleSelected(false)}
            >
              Does not apply
            </Button>
          ),
        }),
      ]),
    [choose],
  );
  const details = useDataTable({
    columns: detailColumns,
    data: rows,
    getRowId: (r) => r.id,
    label: "Chosen requirements",
  });

  const submit = () => {
    for (const r of rows) {
      addAllocation({
        requirement: r.id,
        target: node.id,
        targetKind: "node",
        responsibility: r.responsibility,
        coverage: r.coverage,
        scope: r.scope.trim(),
        owner: r.owner,
        rationale: "",
      });
    }
    toast.success(`${rows.length} allocated to ${node.name}`, {
      description: rows.map((r) => r.id).join(", "),
    });
    onClose();
  };

  if (frame === "choose") {
    return (
      <PickerSheet
        open
        onClose={onClose}
        width={900}
        title={`Allocate requirements to ${node.name}`}
        subtitle={`${node.name} · ${allocated} allocated · coverage is the union across every element that carries a requirement`}
        search={{
          value: String(choose.state.globalFilter ?? ""),
          onChange: (v) => choose.setGlobalFilter(v),
          placeholder: "Search by id or text",
        }}
        filters={
          <>
            <DataTable.Filter table={choose} column="type" />
            <DataTable.Filter table={choose} column="state" />
          </>
        }
        selected={chosen.size}
        total={choose.getRowCount()}
        onClear={() => choose.resetRowSelection()}
        action={{ label: `Continue with ${chosen.size}`, onClick: () => setFrame("details") }}
      >
        <DataTable
          table={choose}
          onRowClick={(r) => choose.getRow(r.id).toggleSelected()}
          className="rounded-none border-0"
          empty={{
            title: "No requirements match",
            description: "Clear the search or a filter, or every requirement is already here.",
          }}
        />
      </PickerSheet>
    );
  }

  return (
    <PickerSheet
      open
      onClose={onClose}
      onBack={() => setFrame("choose")}
      width={900}
      title={`Allocate requirements to ${node.name}`}
      subtitle={`${node.name} · responsibility, coverage and the bounded claim for each`}
      toolbar={
        <Inline space="space.150" alignBlock="center" shouldWrap>
          <Text size="small" color="color.text.subtle">
            Apply to all
          </Text>
          <Box style={{ width: 140 }}>
            <NativeSelect
              aria-label="Responsibility for all"
              className="[&>select]:h-control-small"
              defaultValue=""
              onChange={(e) =>
                e.target.value && applyAll({ responsibility: e.target.value as Responsibility })
              }
            >
              <option value="">Responsibility</option>
              {responsibilities.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </NativeSelect>
          </Box>
          <Box style={{ width: 120 }}>
            <NativeSelect
              aria-label="Coverage for all"
              className="[&>select]:h-control-small"
              defaultValue=""
              onChange={(e) => e.target.value && applyAll({ coverage: e.target.value as Coverage })}
            >
              <option value="">Coverage</option>
              {coverages.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </NativeSelect>
          </Box>
          <Box style={{ width: 260 }}>
            <Input
              aria-label="Claim for all"
              className="h-control-small"
              value={claim}
              onChange={(e) => setClaim(e.target.value)}
              placeholder="One claim for every row"
            />
          </Box>
          <Button size="small" disabled={!claim.trim()} onClick={() => applyAll({ scope: claim })}>
            Apply claim
          </Button>
          {withoutClaim ? (
            <Text size="small" color="color.text.subtle">
              {withoutClaim} still need a claim
            </Text>
          ) : null}
        </Inline>
      }
      selected={chosen.size}
      action={{
        label: `Allocate ${chosen.size} to ${node.name}`,
        onClick: submit,
        disabled: withoutClaim > 0,
      }}
    >
      <DataTable table={details} className="rounded-none border-0" />
    </PickerSheet>
  );
}
