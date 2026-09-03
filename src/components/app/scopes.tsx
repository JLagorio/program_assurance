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
  Box,
  Button,
  Combobox,
  Field,
  Id,
  Indicator,
  Inline,
  Input,
  Section,
  Select,
  Sheet,
  Stack,
  Table,
  Textarea,
  toast,
} from "@ledger/design-system";
import { addCompositionNodes, nextNodeId, nodesForProgram } from "@/lib/composition";
import {
  createInitialRevision,
  currentRevision,
  initialOverlayDecisions,
  openRevision,
  revisionTone,
  useControlSetVersion,
} from "@/lib/control-set";
import { addScopes, controlSetFor, objectives, triadOf } from "@/lib/scopes";
import type { AssessmentScope, ProgramRollup } from "@/lib/scopes";

import { ProgramChanges } from "./control-set-revisions";

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
    <Stack space="space.200">
      <ProgramChanges programId={programId} />
      <Inline alignInline="end">
        <Button size="small" onClick={() => setAdding(true)}>
          <Plus className="size-icon-small" /> Add subsystem
        </Button>
      </Inline>
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
                    <Id className="text-brand">{scope.id}</Id>
                  </Link>
                </Table.Cell>
                <Table.Cell className="truncate">{scope.name}</Table.Cell>
                {objectives.map((o) => (
                  <Table.Cell key={o}>
                    <Badge size="xsmall" tone={impactTone[triad[o]]}>
                      {triad[o].slice(0, 1)}
                    </Badge>
                  </Table.Cell>
                ))}
                <Table.Cell className="tabular-nums text-right">{set?.total ?? 0}</Table.Cell>
                <Table.Cell className="tabular-nums text-right">
                  {unique || <span className="text-subtle">—</span>}
                </Table.Cell>
                <Table.Cell className="truncate">
                  {set?.overlays.map((o) => o.name).join(", ") || "—"}
                </Table.Cell>
                <Table.Cell className="max-w-none">
                  {revision ? (
                    <Link
                      to="/programs/$programId/systems/$scopeId"
                      params={{ programId, scopeId: scope.id }}
                      search={{ tab: "Control set" }}
                      className="hover:underline"
                    >
                      <Indicator tone={revisionTone[revision.state]}>
                        v{revision.number} · {revision.state}
                      </Indicator>
                    </Link>
                  ) : (
                    <span className="text-subtle">—</span>
                  )}
                </Table.Cell>
              </Table.Row>
            );
          })}
        </tbody>
      </Table>

      <Box
        className="rounded-large border border-default"
        paddingInline="space.200"
        paddingBlock="space.150"
      >
        <p className="font-body-small">
          <span className="font-medium">
            {rollup.total} controls in the program set — the union of {rollup.scopes.length} scopes,
            not the highest of them.
          </span>{" "}
          <span className="text-subtle">
            {rollup.singleScope} are required by exactly one scope. CNSSI 1253 selects per objective
            and never collapses the triad, so a scope at A=Low sheds contingency obligations while
            keeping every confidentiality control at High.
          </span>
        </p>
      </Box>

      <AddSubsystemSheet
        open={adding}
        onClose={() => setAdding(false)}
        programId={programId}
        scopes={scopes}
      />
    </Stack>
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
            variant="subtle"
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
      <Stack space="space.150">
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
      </Stack>
    </Sheet>
  );
}

/* ---------------------------------------------------- Controls tab pointer */

/** On the program's Controls tab: where each scope's control set stands, and the one place it changes. */
export function ControlSetsSummary({
  scopes,
  onOpen,
}: {
  scopes: AssessmentScope[];
  onOpen: () => void;
}) {
  useControlSetVersion();
  const open = scopes.filter((s) => openRevision(s.id)).length;
  return (
    <Section
      title="Control sets"
      description="Each scope's categorization, overlays and tailoring are frozen as a numbered revision. A change is proposed, reviewed and approved on the Systems tab; nothing here is edited in place."
      action={
        <Button size="small" variant="secondary" onClick={onOpen}>
          {open ? `Review ${open} open change${open === 1 ? "" : "s"}` : "Open Systems"}
        </Button>
      }
    >
      <dl className="grid gap-x-300 gap-y-050 pt-100 font-body-small sm:grid-cols-2 lg:grid-cols-3">
        {scopes.map((s) => {
          const rev = currentRevision(s.id);
          const set = controlSetFor(s.id);
          return (
            <Inline key={s.id} space="space.100" alignBlock="baseline">
              <dt className="min-w-0 truncate">{s.name}</dt>
              <dd className="flex shrink-0 items-center gap-100 text-subtle">
                <span className="tabular-nums">{set?.total ?? 0} controls</span>
                {rev ? (
                  <Indicator tone={revisionTone[rev.state]}>
                    v{rev.number} · {rev.state}
                  </Indicator>
                ) : null}
              </dd>
            </Inline>
          );
        })}
      </dl>
    </Section>
  );
}
