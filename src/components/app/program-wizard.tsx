/**
 * New program, end to end: name it, pick the framework edition, draw its
 * systems and subsystems, categorize and tailor each scope, review, create.
 *
 * `§16.1` steps 1–5 as one path. The simple case — one system, one scope,
 * M-M-M, an overlay or two — never touches the Systems step; the granular
 * case draws a tree and tailors each leaf on its own. Both end the same way:
 * every leaf becomes an assessment scope with its first control-set revision.
 */

import { useNavigate } from "@tanstack/react-router";
import { Plus, Trash2 } from "lucide-react";
import { useMemo, useReducer, useState } from "react";

import {
  AlertDialog,
  Badge,
  Button,
  Checkbox,
  Combobox,
  Field,
  Indicator,
  Input,
  KeyValue,
  RadioGroup,
  Select,
  Sheet,
  Stepper,
  Table,
  Textarea,
  Tree,
  toast,
} from "@/ds/primitives";
import { PageHeader } from "@/ds/patterns";
import { Block, Inspector, WorkPane } from "@/ds/shapes";
import {
  contestedOverlays,
  gatesFor,
  resolveDraft,
  triadLabel,
  triadOfParameters,
  type RevisionDraft,
} from "@/lib/control-set";
import { frameworks } from "@/lib/frameworks";
import type { ImpactLevel, Program } from "@/lib/grc-data";
import {
  createProgramFromDraft,
  draftKey,
  emptyDraft,
  reconcileScopes,
  refreshInheritingScopes,
  scopeDraft,
  scopeParameters,
  type DraftScope,
  type DraftSubsystem,
  type DraftSystem,
  type ProgramDraft,
} from "@/lib/program-setup";
import { objectives, type Triad } from "@/lib/scopes";
import { overlayById } from "@/lib/tailoring";

import { ControlSetSummary, RevisionGates, ScopeTailoringPane } from "./scope-tailoring";

/* -------------------------------------------------------------- Reducer */

type Action =
  | { type: "field"; patch: Partial<Omit<ProgramDraft, "systems" | "scopes" | "defaults">> }
  | { type: "system.add" }
  | { type: "system.patch"; key: string; patch: Partial<Omit<DraftSystem, "key" | "subsystems">> }
  | { type: "system.remove"; key: string }
  | { type: "subsystem.add"; systemKey: string }
  | {
      type: "subsystem.patch";
      systemKey: string;
      key: string;
      patch: Partial<Omit<DraftSubsystem, "key">>;
    }
  | { type: "subsystem.remove"; systemKey: string; key: string }
  | { type: "defaults"; patch: Partial<RevisionDraft> }
  | { type: "scope.inherit"; key: string; on: boolean }
  | { type: "scope.patch"; key: string; patch: Partial<RevisionDraft> };

function withScopes(draft: ProgramDraft): ProgramDraft {
  return { ...draft, scopes: reconcileScopes(draft) };
}

function reduce(draft: ProgramDraft, action: Action): ProgramDraft {
  switch (action.type) {
    case "field": {
      const next = { ...draft, ...action.patch };
      // A system with no name of its own is labelled after the program.
      return action.patch.name !== undefined ? withScopes(next) : next;
    }
    case "system.add":
      return withScopes({
        ...draft,
        systems: [
          ...draft.systems,
          { key: draftKey("sys"), name: "", function: "", owner: "", subsystems: [] },
        ],
      });
    case "system.patch":
      return withScopes({
        ...draft,
        systems: draft.systems.map((s) => (s.key === action.key ? { ...s, ...action.patch } : s)),
      });
    case "system.remove":
      if (draft.systems.length === 1) return draft;
      return withScopes({ ...draft, systems: draft.systems.filter((s) => s.key !== action.key) });
    case "subsystem.add":
      return withScopes({
        ...draft,
        systems: draft.systems.map((s) =>
          s.key === action.systemKey
            ? {
                ...s,
                subsystems: [
                  ...s.subsystems,
                  { key: draftKey("sub"), name: "", function: "", owner: "" },
                ],
              }
            : s,
        ),
      });
    case "subsystem.patch":
      return withScopes({
        ...draft,
        systems: draft.systems.map((s) =>
          s.key === action.systemKey
            ? {
                ...s,
                subsystems: s.subsystems.map((x) =>
                  x.key === action.key ? { ...x, ...action.patch } : x,
                ),
              }
            : s,
        ),
      });
    case "subsystem.remove":
      return withScopes({
        ...draft,
        systems: draft.systems.map((s) =>
          s.key === action.systemKey
            ? { ...s, subsystems: s.subsystems.filter((x) => x.key !== action.key) }
            : s,
        ),
      });
    case "defaults": {
      const defaults = action.patch.parameters ?? draft.defaults;
      const next = { ...draft, defaults };
      return { ...next, scopes: refreshInheritingScopes(next) };
    }
    case "scope.inherit":
      return {
        ...draft,
        scopes: draft.scopes.map((s) =>
          s.key === action.key
            ? { ...s, override: action.on ? null : { ...scopeParameters(draft, s) } }
            : s,
        ),
      };
    case "scope.patch": {
      const scope = draft.scopes.find((s) => s.key === action.key);
      if (!scope) return draft;
      const { parameters, ...rest } = action.patch;
      // One scope and no override: its categorization is the program's.
      if (parameters && scope.override === null && draft.scopes.length === 1) {
        return {
          ...draft,
          defaults: parameters,
          scopes: draft.scopes.map((s) => (s.key === action.key ? { ...s, ...rest } : s)),
        };
      }
      return {
        ...draft,
        scopes: draft.scopes.map((s) =>
          s.key === action.key
            ? { ...s, ...rest, ...(parameters ? { override: parameters } : {}) }
            : s,
        ),
      };
    }
  }
}

/* ---------------------------------------------------------------- Steps */

const steps = [
  "Program",
  "Framework",
  "Systems",
  "Categorize and tailor",
  "Review and create",
] as const;
type Step = (typeof steps)[number];

const people = ["Grace Hoppel", "Marcus Ryde", "Dana Whitlock", "Priya Raghavan", "Sarah Chen"];
const officials = ["R. Feldman", "Col. M. Ostrander", "D. Ainsley"];
const assessors = ["Whitcombe LLP", "Internal assessment team", "Unassigned"];
const environments: Program["environment"][] = [
  "AWS GovCloud",
  "AWS Commercial",
  "Azure",
  "On-premise",
];

const impactTone = { Low: "neutral", Moderate: "warning", High: "danger" } as const;

/** Highest categorization among the other scopes — what a lower one is measured against. */
function wizardCeiling(draft: ProgramDraft, scopeKey: string): Triad | null {
  const others = draft.scopes.filter((s) => s.key !== scopeKey);
  if (others.length === 0) return null;
  const rank: Record<ImpactLevel, number> = { Low: 0, Moderate: 1, High: 2 };
  const out: Triad = { Confidentiality: "Low", Integrity: "Low", Availability: "Low" };
  for (const s of others) {
    const t = triadOfParameters(scopeParameters(draft, s));
    for (const o of objectives) if (rank[t[o]] > rank[out[o]]) out[o] = t[o];
  }
  return out;
}

function scopeGates(draft: ProgramDraft, scope: DraftScope) {
  return gatesFor(scopeDraft(draft, scope), {
    inForce: null,
    ceiling: wizardCeiling(draft, scope.key),
    scopeId: null,
  });
}

/** Why the step cannot be left yet, or null. */
function stepBlocked(draft: ProgramDraft, step: Step): string | null {
  switch (step) {
    case "Program":
      return draft.name.trim() ? null : "Needs a program name";
    case "Framework":
      return frameworks.find((f) => f.id === draft.framework)?.available
        ? null
        : "Choose an edition that is in the catalog";
    case "Systems": {
      const unnamed = draft.systems.flatMap((s) =>
        s.subsystems.filter((x) => !x.name.trim()).map(() => s.name || draft.name),
      );
      if (draft.systems.length > 1 && draft.systems.some((s) => !s.name.trim())) {
        return "Every system needs a name";
      }
      return unnamed.length ? "Every subsystem needs a name" : null;
    }
    case "Categorize and tailor": {
      const failing = draft.scopes.filter((s) => scopeGates(draft, s).some((g) => !g.met));
      if (failing.length === 0) return null;
      return `${failing.map((s) => s.label).join(", ")}: ${scopeGates(draft, failing[0]!)
        .filter((g) => !g.met)
        .map((g) => g.label.toLowerCase())
        .join(", ")}`;
    }
    case "Review and create":
      return null;
  }
}

/* ---------------------------------------------------------------- Wizard */

export function ProgramWizard() {
  const navigate = useNavigate();
  const [draft, dispatch] = useReducer(reduce, undefined, emptyDraft);
  const [step, setStep] = useState<Step>("Program");
  const [confirming, setConfirming] = useState(false);
  const [creating, setCreating] = useState(false);

  const index = steps.indexOf(step);
  // The tailoring and review steps need the width; the numbers they would
  // have shown in the inspector live in their own list and tables.
  const wide = step === "Categorize and tailor" || step === "Review and create";
  const blocked = stepBlocked(draft, step);
  const earlierBlocked = steps
    .slice(0, index)
    .map((s) => stepBlocked(draft, s))
    .find(Boolean);

  const union = useMemo(() => {
    const ids = new Set<string>();
    for (const s of draft.scopes) {
      for (const c of resolveDraft(scopeDraft(draft, s)).controls) ids.add(c.control.id);
    }
    return ids.size;
  }, [draft]);

  const framework = frameworks.find((f) => f.id === draft.framework) ?? null;

  const create = () => {
    setCreating(true);
    const { program } = createProgramFromDraft(draft);
    toast.success(`${program.id} created`, {
      description: `${draft.scopes.length} scope${draft.scopes.length === 1 ? "" : "s"} · ${union} controls · revision 1 ${draft.submitOnCreate ? "pending approval" : "draft"}`,
    });
    void navigate({
      to: "/programs/$programId",
      params: { programId: program.id },
      search: { tab: "Systems" },
    });
  };

  return (
    <div className="animate-slide-up space-y-5">
      <PageHeader
        eyebrow="Programs"
        title={draft.name.trim() ? `New program · ${draft.name.trim()}` : "New program"}
        actions={
          <Button variant="ghost" onClick={() => void navigate({ to: "/programs" })}>
            Cancel
          </Button>
        }
      />

      <div
        className={
          wide
            ? "grid gap-6 lg:grid-cols-[200px_minmax(0,1fr)]"
            : "grid gap-6 lg:grid-cols-[200px_minmax(0,1fr)_272px]"
        }
      >
        <aside className="lg:sticky lg:top-[72px] lg:self-start">
          <Stepper orientation="vertical">
            {steps.map((s, i) => {
              const state = i < index ? "done" : i === index ? "current" : "upcoming";
              const reachable = i <= index || (i === index + 1 && !blocked);
              return (
                <Stepper.Item
                  key={s}
                  state={state}
                  label={s}
                  meta={
                    s === "Systems"
                      ? `${draft.scopes.length} scope${draft.scopes.length === 1 ? "" : "s"}`
                      : s === "Framework" && framework
                        ? framework.name
                        : `Step ${i + 1} of ${steps.length}`
                  }
                  first={i === 0}
                  last={i === steps.length - 1}
                  {...(reachable && i !== index ? { onSelect: () => setStep(s) } : {})}
                />
              );
            })}
          </Stepper>
        </aside>

        <div className="min-w-0 space-y-5">
          {step === "Program" ? <ProgramStep draft={draft} dispatch={dispatch} /> : null}
          {step === "Framework" ? <FrameworkStep draft={draft} dispatch={dispatch} /> : null}
          {step === "Systems" ? <SystemsStep draft={draft} dispatch={dispatch} /> : null}
          {step === "Categorize and tailor" ? (
            <TailorStep draft={draft} dispatch={dispatch} />
          ) : null}
          {step === "Review and create" ? (
            <ReviewStep draft={draft} dispatch={dispatch} union={union} />
          ) : null}

          <div className="flex items-center justify-between gap-4 border-t border-border pt-4">
            <Button
              variant="ghost"
              onClick={() =>
                index === 0 ? void navigate({ to: "/programs" }) : setStep(steps[index - 1]!)
              }
            >
              {index === 0 ? "Cancel" : "Back"}
            </Button>
            <div className="flex items-center gap-3">
              {(blocked ?? earlierBlocked) ? (
                <span className="text-[12px] text-muted-foreground">
                  {blocked ?? earlierBlocked}
                </span>
              ) : null}
              {index < steps.length - 1 ? (
                <Button
                  variant="primary"
                  disabled={!!blocked}
                  title={blocked ?? undefined}
                  onClick={() => setStep(steps[index + 1]!)}
                >
                  Continue
                </Button>
              ) : (
                <Button
                  variant="primary"
                  disabled={!!earlierBlocked || creating}
                  title={earlierBlocked ?? undefined}
                  onClick={() => setConfirming(true)}
                >
                  Create program
                </Button>
              )}
            </div>
          </div>
        </div>

        {wide ? null : <WizardInspector draft={draft} union={union} step={step} />}
      </div>

      <AlertDialog
        open={confirming}
        onClose={() => setConfirming(false)}
        onConfirm={create}
        pending={creating}
        title={`Create ${draft.name.trim() || "this program"}?`}
        confirmLabel="Create program"
        description={`Creates ${draft.name.trim()} with ${draft.scopes.length} scope${draft.scopes.length === 1 ? "" : "s"} and ${union} controls in the union. Each control set is frozen as revision 1 (${draft.submitOnCreate ? "pending approval" : "draft"}); later changes are proposed as a new revision and approved before they take effect.`}
      />
    </div>
  );
}

/* ---------------------------------------------------------- Step: program */

function ProgramStep({ draft, dispatch }: { draft: ProgramDraft; dispatch: (a: Action) => void }) {
  return (
    <Block title="Program">
      <div className="space-y-3">
        <div className="grid grid-cols-[minmax(0,1fr)_140px] gap-3">
          <Field label="Program name">
            <Input
              autoFocus
              value={draft.name}
              onChange={(e) => dispatch({ type: "field", patch: { name: e.target.value } })}
              placeholder="Autonomous aircraft"
            />
          </Field>
          <Field label="Acronym" hint="Blank derives one from the name.">
            <Input
              value={draft.acronym}
              onChange={(e) =>
                dispatch({ type: "field", patch: { acronym: e.target.value.toUpperCase() } })
              }
              placeholder="AAC"
            />
          </Field>
        </div>
        <Field label="Mission" hint="One line: what the system does and for whom.">
          <Input
            value={draft.mission}
            onChange={(e) => dispatch({ type: "field", patch: { mission: e.target.value } })}
            placeholder="Persistent ISR over the littoral, controlled from the ground segment."
          />
        </Field>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Field label="System owner">
            <Combobox
              value={draft.owner}
              onChange={(v) => dispatch({ type: "field", patch: { owner: v } })}
              options={people.map((p) => ({ value: p, label: p }))}
              placeholder="Choose an owner"
              searchPlaceholder="Search people…"
              className="w-full"
            />
          </Field>
          <Field label="Authorizing official">
            <Select
              value={draft.authorizingOfficial}
              onValueChange={(v) => dispatch({ type: "field", patch: { authorizingOfficial: v } })}
              aria-label="Authorizing official"
            >
              {officials.map((o) => (
                <Select.Item key={o} value={o}>
                  {o}
                </Select.Item>
              ))}
            </Select>
          </Field>
          <Field label="Assessor">
            <Select
              value={draft.assessor}
              onValueChange={(v) => dispatch({ type: "field", patch: { assessor: v } })}
              aria-label="Assessor"
            >
              {assessors.map((o) => (
                <Select.Item key={o} value={o}>
                  {o}
                </Select.Item>
              ))}
            </Select>
          </Field>
          <Field label="Environment">
            <Select
              value={draft.environment}
              onValueChange={(v) =>
                dispatch({ type: "field", patch: { environment: v as Program["environment"] } })
              }
              aria-label="Environment"
            >
              {environments.map((o) => (
                <Select.Item key={o} value={o}>
                  {o}
                </Select.Item>
              ))}
            </Select>
          </Field>
        </div>
      </div>
    </Block>
  );
}

/* -------------------------------------------------------- Step: framework */

function FrameworkStep({
  draft,
  dispatch,
}: {
  draft: ProgramDraft;
  dispatch: (a: Action) => void;
}) {
  return (
    <Block title="Framework edition">
      <RadioGroup
        value={draft.framework}
        onValueChange={(v) =>
          dispatch({ type: "field", patch: { framework: v as ProgramDraft["framework"] } })
        }
        className="gap-0 divide-y divide-border"
      >
        {frameworks.map((f) => (
          <div key={f.id} className="flex items-start justify-between gap-4 py-2.5">
            <RadioGroup.Item value={f.id} disabled={!f.available}>
              <span className="block">
                <span className="block text-[13px]">{f.name}</span>
                <span className="block text-[12px] text-muted-foreground">
                  {f.version} · selects under {f.policy}
                </span>
              </span>
            </RadioGroup.Item>
            <span className="shrink-0 text-right text-[12px] text-muted-foreground">
              {f.available ? (
                <span className="tnum">{f.controls} controls and enhancements</span>
              ) : (
                <Indicator tone="neutral">{f.reason}</Indicator>
              )}
            </span>
          </div>
        ))}
      </RadioGroup>
      <dl className="mt-3 grid grid-cols-[140px_1fr] gap-y-1 border-t border-border pt-3 text-[12.5px]">
        <dt className="text-muted-foreground">Selection policy</dt>
        <dd>
          CNSSI 1253 — confidentiality, integrity and availability select independently; the set is
          their union.
        </dd>
        <dt className="text-muted-foreground">Overlays</dt>
        <dd>
          CNSSI 1253 attachments and DoD overlays tailor the selection up or down; each decision is
          recorded with its rationale.
        </dd>
      </dl>
    </Block>
  );
}

/* ---------------------------------------------------------- Step: systems */

type Editing =
  { kind: "system"; key: string } | { kind: "subsystem"; systemKey: string; key: string } | null;

function SystemsStep({ draft, dispatch }: { draft: ProgramDraft; dispatch: (a: Action) => void }) {
  const [editing, setEditing] = useState<Editing>(null);
  const [expanded, setExpanded] = useState<Set<string>>(
    () => new Set(draft.systems.map((s) => s.key)),
  );
  const toggle = (key: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const target = (() => {
    if (!editing) return null;
    const system = draft.systems.find(
      (s) => s.key === (editing.kind === "system" ? editing.key : editing.systemKey),
    );
    if (!system) return null;
    if (editing.kind === "system") return { label: "System", record: system, system };
    const sub = system.subsystems.find((x) => x.key === editing.key);
    return sub ? { label: "Subsystem", record: sub, system } : null;
  })();

  const patchTarget = (patch: Partial<Omit<DraftSubsystem, "key">>) => {
    if (!editing) return;
    if (editing.kind === "system") dispatch({ type: "system.patch", key: editing.key, patch });
    else
      dispatch({ type: "subsystem.patch", systemKey: editing.systemKey, key: editing.key, patch });
  };

  return (
    <Block
      title="Systems and subsystems"
      count={`${draft.scopes.length} scope${draft.scopes.length === 1 ? "" : "s"}`}
      action={
        <Button size="sm" onClick={() => dispatch({ type: "system.add" })}>
          <Plus className="size-3.5" /> Add system
        </Button>
      }
    >
      <p className="pb-2 text-[12px] text-muted-foreground">
        A system with subsystems is categorized per subsystem; without, as one scope.
      </p>
      <Tree label="Systems">
        {draft.systems.map((system) => {
          const open = expanded.has(system.key);
          const name = system.name.trim() || draft.name.trim() || "System";
          const leaf = system.subsystems.length === 0;
          return [
            <Tree.Item
              key={system.key}
              depth={0}
              hasChildren={!leaf}
              expanded={open}
              onToggle={() => toggle(system.key)}
              selected={editing?.kind === "system" && editing.key === system.key}
              onSelect={() => setEditing({ kind: "system", key: system.key })}
              trailing={
                <>
                  {leaf ? (
                    <Badge size="xs" tone="info">
                      Scope
                    </Badge>
                  ) : (
                    <span className="text-[11.5px] text-muted-foreground">
                      {system.subsystems.length} scope{system.subsystems.length === 1 ? "" : "s"}
                    </span>
                  )}
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => {
                      dispatch({ type: "subsystem.add", systemKey: system.key });
                      setExpanded((prev) => new Set(prev).add(system.key));
                    }}
                  >
                    <Plus className="size-3" /> Subsystem
                  </Button>
                  {draft.systems.length > 1 ? (
                    <Button
                      variant="ghost"
                      size="xs"
                      aria-label={`Remove ${name}`}
                      onClick={() => dispatch({ type: "system.remove", key: system.key })}
                    >
                      <Trash2 className="size-3" />
                    </Button>
                  ) : null}
                </>
              }
            >
              <span className="truncate text-[13px]">{name}</span>
              <span className="truncate text-[11.5px] text-muted-foreground">
                {system.function.trim() || "System"}
              </span>
            </Tree.Item>,
            ...(open
              ? system.subsystems.map((sub) => (
                  <Tree.Item
                    key={sub.key}
                    depth={1}
                    selected={editing?.kind === "subsystem" && editing.key === sub.key}
                    onSelect={() =>
                      setEditing({ kind: "subsystem", systemKey: system.key, key: sub.key })
                    }
                    trailing={
                      <>
                        <Badge size="xs" tone="info">
                          Scope
                        </Badge>
                        <Button
                          variant="ghost"
                          size="xs"
                          aria-label={`Remove ${sub.name || "subsystem"}`}
                          onClick={() =>
                            dispatch({
                              type: "subsystem.remove",
                              systemKey: system.key,
                              key: sub.key,
                            })
                          }
                        >
                          <Trash2 className="size-3" />
                        </Button>
                      </>
                    }
                  >
                    <span
                      className={
                        sub.name.trim()
                          ? "truncate text-[13px]"
                          : "truncate text-[13px] text-muted-foreground"
                      }
                    >
                      {sub.name.trim() || "Unnamed subsystem"}
                    </span>
                    <span className="truncate text-[11.5px] text-muted-foreground">
                      {sub.function.trim() || "Subsystem"}
                    </span>
                  </Tree.Item>
                ))
              : []),
          ];
        })}
      </Tree>

      <Sheet
        open={target !== null}
        onClose={() => setEditing(null)}
        title={target ? `${target.label} · ${target.record.name.trim() || "Unnamed"}` : ""}
        subtitle={
          target && editing?.kind === "subsystem"
            ? `Under ${target.system.name.trim() || draft.name.trim() || "the system"}`
            : "Becomes a node in the composition tree"
        }
        footer={
          <Button variant="primary" onClick={() => setEditing(null)}>
            Done
          </Button>
        }
      >
        {target ? (
          <div className="space-y-3">
            <Field label="Name">
              <Input
                autoFocus
                value={target.record.name}
                onChange={(e) => patchTarget({ name: e.target.value })}
                placeholder={
                  editing?.kind === "system" ? draft.name.trim() || "Ground segment" : "Radar"
                }
              />
            </Field>
            <Field label="Function" hint="What it does for the mission.">
              <Textarea
                value={target.record.function}
                onChange={(e) => patchTarget({ function: e.target.value })}
                placeholder="Terrain-following radar and collision avoidance."
              />
            </Field>
            <Field label="Owner">
              <Combobox
                value={target.record.owner}
                onChange={(v) => patchTarget({ owner: v })}
                options={people.map((p) => ({ value: p, label: p }))}
                placeholder={`Inherits ${draft.owner}`}
                searchPlaceholder="Search people…"
                className="w-full"
              />
            </Field>
          </div>
        ) : null}
      </Sheet>
    </Block>
  );
}

/* ----------------------------------------------------------- Step: tailor */

const DEFAULT_KEY = "__default";

function TailorStep({ draft, dispatch }: { draft: ProgramDraft; dispatch: (a: Action) => void }) {
  const many = draft.scopes.length > 1;
  const [selected, setSelected] = useState<string>(
    many ? DEFAULT_KEY : (draft.scopes[0]?.key ?? DEFAULT_KEY),
  );
  const scope = draft.scopes.find((s) => s.key === selected) ?? null;
  const inheriting = draft.scopes.filter((s) => s.override === null).length;

  const list = (
    <div className="space-y-0.5">
      {many ? (
        <WorkPane.Row
          id="Program"
          title="Program default"
          meta={`${triadLabel(draft.defaults)} · inherited by ${inheriting} of ${draft.scopes.length}`}
          active={selected === DEFAULT_KEY}
          onSelect={() => setSelected(DEFAULT_KEY)}
        />
      ) : null}
      {draft.scopes.map((s) => {
        const set = resolveDraft(scopeDraft(draft, s));
        const gates = scopeGates(draft, s);
        const unmet = gates.filter((g) => !g.met).length;
        return (
          <WorkPane.Row
            key={s.key}
            id={triadLabel(scopeParameters(draft, s))}
            title={s.path}
            meta={`${set.total} controls${s.override ? "" : many ? " · inherits" : ""}${unmet ? ` · ${unmet} gate${unmet === 1 ? "" : "s"}` : ""}`}
            tone={unmet ? "warning" : s.override ? "info" : "neutral"}
            active={selected === s.key}
            onSelect={() => setSelected(s.key)}
          />
        );
      })}
    </div>
  );

  const detail =
    selected === DEFAULT_KEY ? (
      <div className="space-y-4">
        <div>
          <h2 className="text-[15px] font-semibold tracking-[-0.01em]">Program default</h2>
          <p className="text-[12px] text-muted-foreground">
            Every scope starts here. A scope that needs its own categorization switches inheritance
            off and is measured against the others.
          </p>
        </div>
        <ScopeTailoringPane
          draft={{ parameters: draft.defaults, overlays: [], tailoring: [], separationBasis: "" }}
          ceiling={null}
          sections={["categorization", "environment"]}
          onChange={(patch) => dispatch({ type: "defaults", patch })}
        />
      </div>
    ) : scope ? (
      <div className="space-y-4">
        <div className="space-y-3">
          <div>
            <h2 className="text-[15px] font-semibold tracking-[-0.01em]">{scope.path}</h2>
            <p className="text-[12px] text-muted-foreground">
              {scope.subsystemKey ? "Subsystem scope" : "System scope"} · CNSSI 1253{" "}
              {triadLabel(scopeParameters(draft, scope))}
            </p>
          </div>
          <RevisionGates gates={scopeGates(draft, scope)} />
        </div>
        <ScopeTailoringPane
          key={scope.key}
          draft={scopeDraft(draft, scope)}
          ceiling={wizardCeiling(draft, scope.key)}
          {...(many
            ? {
                inherits: {
                  on: scope.override === null,
                  onToggle: (on: boolean) =>
                    dispatch({ type: "scope.inherit", key: scope.key, on }),
                },
              }
            : {})}
          onChange={(patch) => dispatch({ type: "scope.patch", key: scope.key, patch })}
        />
      </div>
    ) : null;

  // The kit WorkPane's 340px list is sized for control lists; a scope list is
  // short, so the same master–detail shape at 240px leaves the pane its width.
  return (
    <div className="grid grid-cols-1 gap-0 lg:grid-cols-[240px_minmax(0,1fr)]">
      <aside className="lg:sticky lg:top-[72px] lg:max-h-[calc(100vh-140px)] lg:self-start lg:overflow-y-auto lg:border-r lg:border-border lg:pr-4">
        <div className="pb-2 text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
          Scopes · {draft.scopes.length}
        </div>
        {list}
      </aside>
      <div className="min-w-0 lg:pl-6">{detail}</div>
    </div>
  );
}

/* ----------------------------------------------------------- Step: review */

function ReviewStep({
  draft,
  dispatch,
  union,
}: {
  draft: ProgramDraft;
  dispatch: (a: Action) => void;
  union: number;
}) {
  const framework = frameworks.find((f) => f.id === draft.framework);
  const decisions = draft.scopes.flatMap((s) => [
    ...contestedOverlays(s.overlays).map((d) => ({
      scope: s,
      subject: overlayById(d.overlay)?.name ?? d.overlay,
      decision: d.applied ? "Applied against the recommendation" : "Declined a recommendation",
      rationale: d.rationale,
    })),
    ...s.tailoring.map((t) => ({
      scope: s,
      subject: t.control,
      decision: t.decision === "excluded" ? "Tailored out" : "Tailored in",
      rationale: t.rationale,
    })),
  ]);

  return (
    <div className="space-y-1">
      <Block title="Program">
        <dl className="grid grid-cols-2 gap-x-6 gap-y-0.5 lg:grid-cols-3">
          <KeyValue label="Name">{draft.name.trim()}</KeyValue>
          <KeyValue label="Owner">{draft.owner}</KeyValue>
          <KeyValue label="AO">{draft.authorizingOfficial}</KeyValue>
          <KeyValue label="Assessor">{draft.assessor}</KeyValue>
          <KeyValue label="Environment">{draft.environment}</KeyValue>
          <KeyValue label="Framework" wrap>
            {framework?.name} · {framework?.version}
          </KeyValue>
        </dl>
      </Block>

      <Block title="Scopes" count={`${draft.scopes.length} · ${union} controls in the union`}>
        <Table>
          <colgroup>
            <col />
            <col style={{ width: "90px" }} />
            <col style={{ width: "220px" }} />
            <col style={{ width: "80px" }} />
            <col style={{ width: "80px" }} />
          </colgroup>
          <thead>
            <Table.Row>
              <Table.Header>Scope</Table.Header>
              <Table.Header>C · I · A</Table.Header>
              <Table.Header>Overlays</Table.Header>
              <Table.Header className="text-right">By hand</Table.Header>
              <Table.Header className="text-right">Controls</Table.Header>
            </Table.Row>
          </thead>
          <tbody>
            {draft.scopes.map((s) => {
              const set = resolveDraft(scopeDraft(draft, s));
              const p = scopeParameters(draft, s);
              return (
                <Table.Row key={s.key}>
                  <Table.Cell className="truncate">{s.path}</Table.Cell>
                  <Table.Cell>
                    <span className="flex items-center gap-1">
                      {objectives.map((o) => (
                        <Badge key={o} size="xs" tone={impactTone[triadOfParameters(p)[o]]}>
                          {triadOfParameters(p)[o][0]}
                        </Badge>
                      ))}
                    </span>
                  </Table.Cell>
                  <Table.Cell className="truncate">
                    {set.overlays.map((o) => o.name).join(", ") || "—"}
                  </Table.Cell>
                  <Table.Cell className="tnum text-right">{s.tailoring.length || "—"}</Table.Cell>
                  <Table.Cell className="tnum text-right">{set.total}</Table.Cell>
                </Table.Row>
              );
            })}
          </tbody>
        </Table>
      </Block>

      <Block title="Decisions with a rationale" count={decisions.length || null}>
        {decisions.length ? (
          <Table>
            <colgroup>
              <col style={{ width: "150px" }} />
              <col style={{ width: "150px" }} />
              <col style={{ width: "170px" }} />
              <col />
            </colgroup>
            <thead>
              <Table.Row>
                <Table.Header>Scope</Table.Header>
                <Table.Header>Subject</Table.Header>
                <Table.Header>Decision</Table.Header>
                <Table.Header>Rationale</Table.Header>
              </Table.Row>
            </thead>
            <tbody>
              {decisions.map((d, i) => (
                <Table.Row key={i}>
                  <Table.Cell className="truncate">{d.scope.path}</Table.Cell>
                  <Table.Cell className="truncate">{d.subject}</Table.Cell>
                  <Table.Cell className="truncate">{d.decision}</Table.Cell>
                  <Table.Cell className="whitespace-normal py-2 align-top leading-[1.45]">
                    {d.rationale}
                  </Table.Cell>
                </Table.Row>
              ))}
            </tbody>
          </Table>
        ) : (
          <p className="text-[12.5px] text-muted-foreground">
            Every overlay follows the engine&apos;s recommendation and no control is tailored by
            hand.
          </p>
        )}
      </Block>

      <Block title="On create">
        <Checkbox
          checked={draft.submitOnCreate}
          onCheckedChange={(v) =>
            dispatch({ type: "field", patch: { submitOnCreate: v === true } })
          }
        >
          <span>
            <span className="block text-[13px]">Submit control sets for approval now</span>
            <span className="block text-[12px] text-muted-foreground">
              Off leaves every revision 1 as a draft the engineer submits later.
            </span>
          </span>
        </Checkbox>
      </Block>
    </div>
  );
}

/* -------------------------------------------------------------- Inspector */

function WizardInspector({
  draft,
  union,
  step,
}: {
  draft: ProgramDraft;
  union: number;
  step: Step;
}) {
  const framework = frameworks.find((f) => f.id === draft.framework);
  const tailoring = step === "Categorize and tailor" || step === "Review and create";
  return (
    <aside className="lg:sticky lg:top-[72px] lg:self-start">
      <Inspector.Group title="Program">
        <KeyValue label="Framework" wrap>
          {framework?.name ?? "—"}
        </KeyValue>
        <KeyValue label="Systems">{draft.systems.length}</KeyValue>
        <KeyValue label="Scopes">{draft.scopes.length}</KeyValue>
        <KeyValue label="Default">
          <span className="flex items-center gap-1">
            {objectives.map((o) => (
              <Badge key={o} size="xs" tone={impactTone[triadOfParameters(draft.defaults)[o]]}>
                {triadOfParameters(draft.defaults)[o][0]}
              </Badge>
            ))}
            <span className="text-[11.5px] text-muted-foreground">CNSSI 1253</span>
          </span>
        </KeyValue>
      </Inspector.Group>
      {tailoring ? (
        <Inspector.Group title={`Control set · ${union}`}>
          {draft.scopes.map((s) => {
            const set = resolveDraft(scopeDraft(draft, s));
            return (
              <KeyValue key={s.key} label={s.label}>
                <span className="tnum">{set.total}</span>
                <span className="text-muted-foreground">
                  {" "}
                  · {set.overlays.length} overlay{set.overlays.length === 1 ? "" : "s"}
                </span>
              </KeyValue>
            );
          })}
        </Inspector.Group>
      ) : null}
      {tailoring && draft.scopes.length === 1 && draft.scopes[0] ? (
        <Inspector.Group title="Summary">
          <ControlSetSummary draft={scopeDraft(draft, draft.scopes[0])} />
        </Inspector.Group>
      ) : null}
      <Inspector.Group title="Then">
        <p className="text-[12px] leading-relaxed text-muted-foreground">
          Every leaf becomes an assessment scope with revision 1 of its control set. Changing a set
          later means proposing revision 2 and having it approved.
        </p>
      </Inspector.Group>
    </aside>
  );
}
