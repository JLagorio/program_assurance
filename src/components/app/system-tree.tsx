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
import { ChevronDown, ChevronRight, MoreHorizontal } from "lucide-react";
import { useState } from "react";

import {
  Badge,
  Button,
  Combobox,
  Dialog,
  DropdownMenu,
  Field,
  Grid,
  Id,
  Indicator,
  Inline,
  Input,
  Select,
  Sheet,
  Stack,
  Table,
  Textarea,
  toast,
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
  coverages,
  derivedControlTrace,
  requirementsForProgram,
  responsibilities,
  useRequirementsVersion,
  type Coverage,
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

export function SystemTree({ programId }: { programId: string }) {
  const nodes = useCompositionGraph(programId);
  useScopesVersion();
  useControlSetVersion();
  useRequirementsVersion();
  useWorkVersion();

  // Ids whose default fold state the reader has flipped.
  const [toggled, setToggled] = useState<Set<string>>(() => new Set());
  const [adding, setAdding] = useState<CompositionNode | null>(null);
  const [allocating, setAllocating] = useState<CompositionNode | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const navigate = useNavigate();

  const scopes = scopesForProgram(programId);
  const scopeByElement = new Map(scopes.map((s) => [s.element, s]));
  // Every store this reads is subscribed above, so the projection is rebuilt
  // per render; the tree is tens of rows, not thousands.
  const index = workIndex(programId);

  // A subsystem's parts start folded: the map reads at the level the
  // categorization happens, and a chevron opens the parts.
  const isOpen = (node: CompositionNode, depth: number, scope: AssessmentScope | null) => {
    const byDefault = depth === 0 || scope !== null || expandedByDefault(node);
    return toggled.has(node.id) ? !byDefault : byDefault;
  };

  const rows: (Row & { open: boolean })[] = [];
  const walk = (node: CompositionNode, depth: number) => {
    const scope = scopeByElement.get(node.id) ?? null;
    const kids = childrenOf(node.id);
    const open = isOpen(node, depth, scope);
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
    rows.push({
      node,
      depth,
      scope,
      requirements: requirements.size,
      withoutControl: withoutControl.size,
      controls: scope ? (controlSetFor(scope.id)?.total ?? 0) : reached.size,
      work: scope ? scopeWork(scope) : traceWork([...reached], index),
      children: kids.length,
      open,
    });
    if (!open) return;
    for (const child of kids) walk(child, depth + 1);
  };
  for (const root of nodes.filter((n) => n.parent === null)) walk(root, 0);

  const toggle = (id: string) =>
    setToggled((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <Stack space="space.150">
      <Table className="table-fixed">
        <colgroup>
          <col />
          <col style={{ width: "100px" }} />
          <col style={{ width: "48px" }} />
          <col style={{ width: "48px" }} />
          <col style={{ width: "48px" }} />
          <col style={{ width: "96px" }} />
          <col style={{ width: "72px" }} />
          <col style={{ width: "210px" }} />
          <col style={{ width: "180px" }} />
          <col style={{ width: "48px" }} />
        </colgroup>
        <thead>
          <Table.Row>
            <Table.Header>Element</Table.Header>
            <Table.Header>Kind</Table.Header>
            {objectives.map((o) => (
              <Table.Header key={o} title={o}>
                {o.slice(0, 1)}
              </Table.Header>
            ))}
            <Table.Header className="text-right">Requirements</Table.Header>
            <Table.Header className="text-right">Controls</Table.Header>
            <Table.Header>Work</Table.Header>
            <Table.Header>Control set</Table.Header>
            <Table.Header className="text-right"> </Table.Header>
          </Table.Row>
        </thead>
        <tbody>
          {rows.map((r) => {
            const triad = r.scope ? triadOf(r.scope) : null;
            const folded = r.children > 0 && !r.open;
            return (
              <Table.Row
                key={r.node.id}
                className="cursor-pointer"
                onClick={() => setPreview(r.node.id)}
              >
                <Table.Cell className="max-w-none">
                  <Inline
                    style={{ paddingLeft: `${r.depth * 16}px` }}
                    as="span"
                    space="space.050"
                    alignBlock="center"
                  >
                    {r.children > 0 ? (
                      <button
                        type="button"
                        aria-label={folded ? `Expand ${r.node.name}` : `Collapse ${r.node.name}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggle(r.node.id);
                        }}
                        className="flex size-250 shrink-0 items-center justify-center rounded-small text-subtle hover:bg-neutral-subtle-hovered"
                      >
                        {folded ? (
                          <ChevronRight className="size-icon-small" />
                        ) : (
                          <ChevronDown className="size-icon-small" />
                        )}
                      </button>
                    ) : (
                      <span className="size-250 shrink-0" />
                    )}
                    <span className="truncate">{r.node.name}</span>
                    {folded ? (
                      <span className="font-body-xsmall text-subtle">
                        {r.children} part{r.children === 1 ? "" : "s"}
                      </span>
                    ) : null}
                  </Inline>
                </Table.Cell>
                <Table.Cell className="truncate">{r.node.kind}</Table.Cell>
                {objectives.map((o) => (
                  <Table.Cell key={o}>
                    {triad ? (
                      <Badge size="xsmall" tone={impactTone[triad[o]]}>
                        {triad[o].slice(0, 1)}
                      </Badge>
                    ) : null}
                  </Table.Cell>
                ))}
                <Table.Cell className="tabular-nums text-right">
                  {r.requirements ? (
                    <span
                      title={r.withoutControl ? `${r.withoutControl} name no control` : undefined}
                    >
                      {r.requirements}
                      {r.withoutControl ? (
                        <span className="text-subtle"> · {r.withoutControl} own</span>
                      ) : null}
                    </span>
                  ) : (
                    <span className="text-subtle">—</span>
                  )}
                </Table.Cell>
                <Table.Cell className="tabular-nums text-right">
                  {r.controls || <span className="text-subtle">—</span>}
                </Table.Cell>
                <Table.Cell className="max-w-none">
                  <WorkBar work={r.work} />
                </Table.Cell>
                <Table.Cell className="max-w-none">
                  {r.scope ? <ControlSetCell scope={r.scope} /> : null}
                </Table.Cell>
                <Table.Cell className="max-w-none text-right">
                  <span onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu
                      align="end"
                      width={220}
                      trigger={
                        <Button
                          size="small"
                          variant="subtle"
                          aria-label={`Actions for ${r.node.name}`}
                        >
                          <MoreHorizontal className="size-icon-small" />
                        </Button>
                      }
                    >
                      {(close) => (
                        <>
                          <DropdownMenu.Item
                            onSelect={() => {
                              close();
                              setAllocating(r.node);
                            }}
                          >
                            Allocate a requirement
                          </DropdownMenu.Item>
                          <DropdownMenu.Item
                            onSelect={() => {
                              close();
                              setAdding(r.node);
                            }}
                          >
                            Add a part
                          </DropdownMenu.Item>
                          <DropdownMenu.Item
                            onSelect={() => {
                              close();
                              navigate({
                                to: "/programs/$programId/components/$componentId",
                                params: { programId, componentId: r.node.id },
                              });
                            }}
                          >
                            Open the full record
                          </DropdownMenu.Item>
                        </>
                      )}
                    </DropdownMenu>
                  </span>
                </Table.Cell>
              </Table.Row>
            );
          })}
        </tbody>
      </Table>

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

/** Three segments, no percentage: satisfied · in work · unassigned. */
function WorkBar({ work }: { work: WorkSummary }) {
  if (!work.total) return <span className="font-body-small text-subtle">—</span>;
  const pct = (n: number) => `${(n / work.total) * 100}%`;
  return (
    <Inline
      title={`${work.satisfied} satisfied · ${work.inWork} in work · ${work.unassigned} unassigned`}
      as="span"
      space="space.100"
      alignBlock="center"
    >
      <Inline
        className="h-075 overflow-hidden rounded-full bg-neutral"
        as="span"
        style={{ width: 64, flexShrink: 0 }}
      >
        <span className="bg-success-bold" style={{ width: pct(work.satisfied) }} />
        <span className="bg-information-bold" style={{ width: pct(work.inWork) }} />
      </Inline>
      <span className="tabular-nums font-body-xsmall text-subtle truncate">
        {work.satisfied}/{work.total}
        {work.unassigned ? ` · ${work.unassigned} unassigned` : ""}
      </span>
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
  return <span className="text-subtle">—</span>;
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

/* ------------------------------------------------- Allocate a requirement */

/**
 * Put one of the program's requirements on this node. The bounded claim is
 * required (`§8`): an allocation without a scope is a wish, not a
 * responsibility.
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
  useRequirementsVersion();
  const already = new Set(allocationsOn(node.id).map((a) => a.requirement));
  const options = requirementsForProgram(programId)
    .filter((r) => !already.has(r.id) && r.state !== "Rejected" && r.state !== "Retired")
    .map((r) => ({ value: r.id, label: `${r.id} · ${r.text}` }));
  const [requirement, setRequirement] = useState("");
  const [responsibility, setResponsibility] = useState<Responsibility>("Primary");
  const [coverage, setCoverage] = useState<Coverage>("Partial");
  const [scope, setScope] = useState("");
  const [rationale, setRationale] = useState("");

  const chosen = requirementsForProgram(programId).find((r) => r.id === requirement) ?? null;
  const ready = !!chosen && scope.trim().length > 0;

  const submit = () => {
    if (!chosen) return;
    addAllocation({
      requirement: chosen.id,
      target: node.id,
      targetKind: "node",
      responsibility,
      coverage,
      scope: scope.trim(),
      owner: chosen.owner,
      rationale: rationale.trim(),
    });
    toast.success(`${chosen.id} allocated`, { description: `${node.name} · ${responsibility}` });
    onClose();
  };

  return (
    <Dialog
      open
      onClose={onClose}
      title={`Allocate a requirement to ${node.name}`}
      description="The requirement keeps its other allocations; coverage is the union across every element that carries it."
      footer={
        <>
          <Button variant="subtle" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={submit} disabled={!ready}>
            Allocate
          </Button>
        </>
      }
    >
      <Stack space="space.150">
        <Field label="Requirement">
          <Combobox
            aria-label="Requirement"
            value={requirement}
            onChange={setRequirement}
            options={options}
            placeholder="Choose a requirement…"
            searchPlaceholder="Search by id or text…"
            className="w-full"
          />
        </Field>
        <Grid gap="space.150" templateColumns="repeat(2, minmax(0, 1fr))">
          <Field label="Responsibility">
            <Select
              value={responsibility}
              onValueChange={(v) => setResponsibility(v as Responsibility)}
              aria-label="Responsibility"
            >
              {responsibilities.map((r) => (
                <Select.Item key={r} value={r}>
                  {r}
                </Select.Item>
              ))}
            </Select>
          </Field>
          <Field label="Coverage">
            <Select
              value={coverage}
              onValueChange={(v) => setCoverage(v as Coverage)}
              aria-label="Coverage"
            >
              {coverages.map((c) => (
                <Select.Item key={c} value={c}>
                  {c}
                </Select.Item>
              ))}
            </Select>
          </Field>
        </Grid>
        <Field label="What this element answers" hint="The bounded claim. Required.">
          <Textarea
            value={scope}
            onChange={(e) => setScope(e.target.value)}
            placeholder="Zeroizes its own key store on the accident signal; does not cover the recorder."
          />
        </Field>
        <Field label="Why here">
          <Textarea
            value={rationale}
            onChange={(e) => setRationale(e.target.value)}
            placeholder="Holds the only non-volatile store on the bus segment."
          />
        </Field>
      </Stack>
    </Dialog>
  );
}
