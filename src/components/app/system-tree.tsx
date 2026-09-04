import { useNavigate, useSearch } from "@tanstack/react-router";
import { MoreHorizontal } from "lucide-react";
import { useMemo, useState } from "react";

import {
  Absent,
  Badge,
  Button,
  Combobox,
  DropdownMenu,
  Field,
  IconButton,
  Indicator,
  Inline,
  Input,
  Progress,
  Select,
  Sheet,
  Stack,
  Table,
  Text,
  Textarea,
  toast,
  useRequired,
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

import { AllocateRequirementsSheet } from "./allocate-picker";
import { ElementHover } from "./glances";
import { NodePreviewSheet } from "./node-preview";
import { suspectAllocationsUnder, useLinkCurrencyVersion } from "@/lib/link-currency";
import { allocationsOn, derivedControlTrace, useRequirementsVersion } from "@/lib/requirements";
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
  useLinkCurrencyVersion();
  useWorkVersion();

  // Ids whose default fold state the reader has flipped.
  const [toggled, setToggled] = useState<Set<string>>(() => new Set());
  const [adding, setAdding] = useState<CompositionNode | null>(null);
  const [allocating, setAllocating] = useState<CompositionNode | null>(null);
  const navigate = useNavigate({ from: "/programs/$programId" });
  // The peek stack lives in the URL: the sheet's back chevron and the browser's back agree.
  const { peek } = useSearch({ from: "/programs/$programId" });
  const stack = useMemo(() => (peek ? peek.split(",").filter(Boolean) : []), [peek]);
  const preview = stack[stack.length - 1] ?? null;
  const setStack = (next: string[]) =>
    void navigate({
      search: (prev) => ({ ...prev, peek: next.length ? next.join(",") : undefined }),
    });

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
      <Table role="treegrid">
        <thead>
          <Table.Row>
            <Table.Header>Element</Table.Header>
            <Table.Header width={100}>Kind</Table.Header>
            {objectives.map((o) => (
              <Table.Header key={o} title={o} width={48}>
                {o.slice(0, 1)}
              </Table.Header>
            ))}
            <Table.Header width={96} className="text-right">
              Requirements
            </Table.Header>
            <Table.Header width={72} className="text-right">
              Controls
            </Table.Header>
            <Table.Header width={210}>Work</Table.Header>
            <Table.Header width={180}>Control set</Table.Header>
            <Table.Header width={48} className="text-right">
              {" "}
            </Table.Header>
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
                aria-level={r.depth + 1}
                aria-expanded={r.children > 0 ? r.open : undefined}
                onClick={() => setStack([r.node.id])}
              >
                <Table.Tree
                  depth={r.depth}
                  hasChildren={r.children > 0}
                  expanded={!folded}
                  onToggle={() => toggle(r.node.id)}
                  label={r.node.name}
                  hint={
                    folded ? (
                      <Text size="xsmall" color="color.text.subtle">
                        {r.children} part{r.children === 1 ? "" : "s"}
                      </Text>
                    ) : null
                  }
                >
                  <ElementHover nodeId={r.node.id}>
                    <span
                      tabIndex={0}
                      className="rounded-xsmall outline-none focus-visible:outline-focused"
                    >
                      {r.node.name}
                    </span>
                  </ElementHover>
                </Table.Tree>
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
                        <Text color="color.text.subtle"> · {r.withoutControl} own</Text>
                      ) : null}
                    </span>
                  ) : (
                    <Absent />
                  )}
                </Table.Cell>
                <Table.Cell className="tabular-nums text-right">
                  {r.controls || <Absent />}
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
                        <IconButton
                          size="small"
                          variant="subtle"
                          label={`Actions for ${r.node.name}`}
                          icon={<MoreHorizontal />}
                        />
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
        <AllocateRequirementsSheet
          open
          programId={programId}
          node={allocating}
          onClose={() => setAllocating(null)}
        />
      ) : null}
      <NodePreviewSheet
        programId={programId}
        nodeId={preview}
        onClose={() => setStack([])}
        onSelect={(id) => setStack([...stack, id])}
        onBack={stack.length > 1 ? () => setStack(stack.slice(0, -1)) : undefined}
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
  const req = useRequired({ name });

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
    if (!req.check()) return;
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
          <Button variant="primary" onClick={create} disabled={!parent}>
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
        <Field isRequired error={req.errorFor("name")} label="Name">
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
