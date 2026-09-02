/**
 * The systems view: every assessment scope inside one authorization boundary,
 * what each one's categorization actually costs it in controls, and where its
 * control set stands. A subsystem is added here: it becomes a node in the
 * composition tree, a scope with its own categorization, and a first
 * control-set revision.
 */

import { Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useMemo, useState } from "react";

import {
  Badge,
  Button,
  Combobox,
  Field,
  Id,
  Indicator,
  Input,
  Select,
  Sheet,
  Table,
  Textarea,
  toast,
} from "@/ds/primitives";
import { addCompositionNodes, nextNodeId, nodesForProgram } from "@/lib/composition";
import {
  createInitialRevision,
  currentRevision,
  initialOverlayDecisions,
  revisionTone,
  useControlSetVersion,
} from "@/lib/control-set";
import { addScopes, controlSetFor, objectives, triadOf } from "@/lib/scopes";
import type { AssessmentScope, ProgramRollup } from "@/lib/scopes";

const impactTone = { Low: "neutral", Moderate: "warning", High: "danger" } as const;

const people = ["Grace Hoppel", "Marcus Ryde", "Dana Whitlock", "Priya Raghavan", "Sarah Chen"];

export function ScopeTable({
  scopes,
  rollup,
  programId,
}: {
  scopes: AssessmentScope[];
  rollup: ProgramRollup;
  programId: string;
}) {
  useControlSetVersion();
  const [adding, setAdding] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setAdding(true)}>
          <Plus className="size-3.5" /> Add subsystem
        </Button>
      </div>
      <Table>
        <colgroup>
          <col style={{ width: "104px" }} />
          <col />
          <col style={{ width: "62px" }} />
          <col style={{ width: "62px" }} />
          <col style={{ width: "62px" }} />
          <col style={{ width: "86px" }} />
          <col style={{ width: "76px" }} />
          <col style={{ width: "190px" }} />
          <col style={{ width: "170px" }} />
        </colgroup>
        <thead>
          <Table.Row>
            <Table.Header>Scope</Table.Header>
            <Table.Header>Name</Table.Header>
            {objectives.map((o) => (
              <Table.Header key={o} title={o}>
                {o.slice(0, 1)}
              </Table.Header>
            ))}
            <Table.Header className="text-right">Controls</Table.Header>
            <Table.Header className="text-right">Only here</Table.Header>
            <Table.Header>Overlays</Table.Header>
            <Table.Header>Control set</Table.Header>
          </Table.Row>
        </thead>
        <tbody>
          {scopes.map((scope) => {
            const set = controlSetFor(scope.id);
            const triad = triadOf(scope);
            const revision = currentRevision(scope.id);
            const unique = set
              ? set.controls.filter(
                  (c) =>
                    rollup.controls.find((r) => r.control.id === c.control.id)?.scopes.length === 1,
                ).length
              : 0;
            return (
              <Table.Row key={scope.id} title={scope.mission}>
                <Table.Cell className="max-w-none">
                  <Link
                    to="/programs/$programId/systems/$scopeId"
                    params={{ programId, scopeId: scope.id }}
                    search={{ tab: undefined }}
                    className="hover:underline"
                  >
                    <Id className="text-primary">{scope.id}</Id>
                  </Link>
                </Table.Cell>
                <Table.Cell className="truncate">{scope.name}</Table.Cell>
                {objectives.map((o) => (
                  <Table.Cell key={o}>
                    <Badge size="xs" tone={impactTone[triad[o]]}>
                      {triad[o].slice(0, 1)}
                    </Badge>
                  </Table.Cell>
                ))}
                <Table.Cell className="tnum text-right">{set?.total ?? 0}</Table.Cell>
                <Table.Cell className="tnum text-right">
                  {unique || <span className="text-muted-foreground">—</span>}
                </Table.Cell>
                <Table.Cell className="truncate">
                  {set?.overlays.map((o) => o.name).join(", ") || "—"}
                </Table.Cell>
                <Table.Cell className="max-w-none">
                  {revision ? (
                    <Link
                      to="/programs/$programId/systems/$scopeId"
                      params={{ programId, scopeId: scope.id }}
                      search={{ tab: "Revisions" }}
                      className="hover:underline"
                    >
                      <Indicator tone={revisionTone[revision.state]}>
                        v{revision.number} · {revision.state}
                      </Indicator>
                    </Link>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </Table.Cell>
              </Table.Row>
            );
          })}
        </tbody>
      </Table>

      <div className="rounded-lg border border-border px-4 py-3">
        <p className="text-[12.5px]">
          <span className="font-medium">
            {rollup.total} controls in the program set — the union of {rollup.scopes.length} scopes,
            not the highest of them.
          </span>{" "}
          <span className="text-muted-foreground">
            {rollup.singleScope} are required by exactly one scope. CNSSI 1253 selects per objective
            and never collapses the triad, so a scope at A=Low sheds contingency obligations while
            keeping every confidentiality control at High.
          </span>
        </p>
      </div>

      <AddSubsystemSheet
        open={adding}
        onClose={() => setAdding(false)}
        programId={programId}
        scopes={scopes}
      />
    </div>
  );
}

/* --------------------------------------------------------- Add subsystem */

function AddSubsystemSheet({
  open,
  onClose,
  programId,
  scopes,
}: {
  open: boolean;
  onClose: () => void;
  programId: string;
  scopes: AssessmentScope[];
}) {
  const parents = useMemo(
    () => nodesForProgram(programId).filter((n) => n.kind === "System" || n.kind === "Subsystem"),
    // The composition graph is read once per open; a new node re-opens the sheet.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [programId, open],
  );
  const [name, setName] = useState("");
  const [mission, setMission] = useState("");
  const [owner, setOwner] = useState("");
  const [parent, setParent] = useState<string>("");
  const [basis, setBasis] = useState<string>("");

  const parentId = parent || parents.find((n) => n.parent === null)?.id || parents[0]?.id || "";
  const basisScope = scopes.find((s) => s.id === basis) ?? scopes[0] ?? null;

  const reset = () => {
    setName("");
    setMission("");
    setOwner("");
    setParent("");
    setBasis("");
  };

  const create = () => {
    if (!name.trim() || !parentId || !basisScope) return;
    const [node] = addCompositionNodes([
      {
        id: nextNodeId(),
        name: name.trim(),
        kind: "Subsystem",
        class: "System",
        parent: parentId,
        program: programId,
        note: mission.trim(),
      },
    ]);
    if (!node) return;
    const [scope] = addScopes([
      {
        program: programId,
        element: node.id,
        name: name.trim(),
        owner: owner || basisScope.owner,
        mission: mission.trim() || `${name.trim()} subsystem.`,
        independentlyAuthorized: false,
        parameters: { ...basisScope.parameters },
        separationBasis: `Categorized as ${basisScope.name} until its own boundary is demonstrated.`,
      },
    ]);
    if (!scope) return;
    const rev = createInitialRevision({
      program: programId,
      scope: scope.id,
      parameters: { ...basisScope.parameters },
      overlays: initialOverlayDecisions(basisScope.parameters),
      tailoring: [],
      separationBasis: scope.separationBasis,
      reason: `Subsystem added under ${parents.find((n) => n.id === parentId)?.name ?? parentId}`,
      submit: false,
    });
    toast.success(`${scope.id} created`, {
      description: `${name.trim()} · categorized as ${basisScope.name} · v${rev.number} draft`,
    });
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
      title="Add a subsystem"
      subtitle="A node in the tree, a scope of its own, and revision 1 of its control set."
      footer={
        <>
          <Button
            variant="ghost"
            onClick={() => {
              reset();
              onClose();
            }}
          >
            Cancel
          </Button>
          <Button variant="primary" onClick={create} disabled={!name.trim() || !basisScope}>
            Add subsystem
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <Field label="Name">
          <Input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Flight computer"
          />
        </Field>
        <Field label="Under">
          <Select value={parentId} onValueChange={setParent} aria-label="Parent element">
            {parents.map((n) => (
              <Select.Item key={n.id} value={n.id}>
                {n.name} · {n.kind}
              </Select.Item>
            ))}
          </Select>
        </Field>
        <Field label="Function" hint="What it does for the mission.">
          <Textarea
            value={mission}
            onChange={(e) => setMission(e.target.value)}
            placeholder="Flight control laws, actuator command, and the mission data bus."
          />
        </Field>
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
          hint="Copied into revision 1 as a draft; change it on the Revisions tab before submitting."
        >
          <Select value={basisScope?.id ?? ""} onValueChange={setBasis} aria-label="Basis scope">
            {scopes.map((s) => (
              <Select.Item key={s.id} value={s.id}>
                {s.name} · {triadOf(s).Confidentiality[0]}-{triadOf(s).Integrity[0]}-
                {triadOf(s).Availability[0]}
              </Select.Item>
            ))}
          </Select>
        </Field>
      </div>
    </Sheet>
  );
}
