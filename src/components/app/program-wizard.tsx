import {
  contestedOverlays,
  gatesFor,
  resolveDraft,
  triadLabel,
  triadOfParameters,
  type RevisionDraft,
} from "@/lib/control-set";
import { frameworks } from "@/lib/frameworks";
import { type ImpactLevel, type Program } from "@/lib/grc-data";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Badge,
  Box,
  Button,
  Checkbox,
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  Field,
  FieldDescription,
  FieldLabel,
  Grid,
  Indicator,
  Inline,
  Input,
  Inspector,
  KeyValue,
  PageHeader,
  RadioGroup,
  RadioGroupItem,
  Section,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  Stack,
  Stepper,
  Table,
  Textarea,
  toast,
  Tree,
  WorkPane,
} from "@ledger/design-system";
import { useNavigate } from "@tanstack/react-router";
import { Plus, Trash2 } from "lucide-react";
import { useId, useMemo, useReducer, useRef, useState } from "react";
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
  const alertCancelRef = useRef<HTMLButtonElement>(null);

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
    try {
      const { program } = createProgramFromDraft(draft);
      toast.add({
        title: `${program.id} created`,
        type: "success",
        description: `${draft.scopes.length} scope${draft.scopes.length === 1 ? "" : "s"} · ${union} controls · revision 1 ${draft.submitOnCreate ? "pending approval" : "draft"}`,
      });
      void navigate({
        to: "/programs/$programId",
        params: { programId: program.id },
        search: { tab: "System" },
      });
    } catch (error) {
      toast.add({
        title: "Program could not be created",
        type: "error",
        timeout: 8000,
        description:
          error instanceof Error ? error.message : "Check browser storage and try again.",
      });
    } finally {
      setCreating(false);
    }
  };

  return (
    <Stack className="animate-rise" space="space.250">
      <PageHeader>
        <div className="col-span-full font-body text-subtle">{"Programs"}</div>
        <div className="min-w-0">
          <PageHeader.Title>
            {draft.name.trim() ? `New program · ${draft.name.trim()}` : "New program"}
          </PageHeader.Title>
        </div>
        <PageHeader.Actions>
          <Button variant="subtle" onClick={() => void navigate({ to: "/programs" })}>
            Cancel
          </Button>
        </PageHeader.Actions>
      </PageHeader>

      <Grid
        gap="space.300"
        templateColumns={
          wide ? { lg: "200px minmax(0, 1fr)" } : { lg: "200px minmax(0, 1fr) 272px" }
        }
      >
        <aside className="lg:sticky-rail">
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
                  {...(reachable && i !== index ? { onSelect: () => setStep(s) } : {})}
                />
              );
            })}
          </Stepper>
        </aside>

        <Stack className="min-w-0" space="space.250">
          {step === "Program" ? <ProgramStep draft={draft} dispatch={dispatch} /> : null}
          {step === "Framework" ? <FrameworkStep draft={draft} dispatch={dispatch} /> : null}
          {step === "Systems" ? <SystemsStep draft={draft} dispatch={dispatch} /> : null}
          {step === "Categorize and tailor" ? (
            <TailorStep draft={draft} dispatch={dispatch} />
          ) : null}
          {step === "Review and create" ? (
            <ReviewStep draft={draft} dispatch={dispatch} union={union} />
          ) : null}

          <Inline
            className="border-t border-default pt-200"
            space="space.200"
            alignBlock="center"
            spread="space-between"
          >
            <Button
              variant="subtle"
              onClick={() =>
                index === 0 ? void navigate({ to: "/programs" }) : setStep(steps[index - 1]!)
              }
            >
              {index === 0 ? "Cancel" : "Back"}
            </Button>
            <Inline space="space.150" alignBlock="center">
              {(blocked ?? earlierBlocked) ? (
                <span className="font-body-small text-subtle">{blocked ?? earlierBlocked}</span>
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
            </Inline>
          </Inline>
        </Stack>

        {wide ? null : <WizardInspector draft={draft} union={union} step={step} />}
      </Grid>

      <AlertDialog
        open={confirming}
        onOpenChange={(next, details) => {
          if (!next) {
            if (creating) {
              details.cancel();
              return;
            }
            setConfirming(false);
          }
        }}
      >
        <AlertDialogContent
          initialFocus={alertCancelRef}
          className="top-200 translate-y-0 sm:top-1000"
        >
          <AlertDialogHeader>
            <AlertDialogTitle>{`Create ${draft.name.trim() || "this program"}?`}</AlertDialogTitle>
            <AlertDialogDescription>{`Creates ${draft.name.trim()} with ${draft.scopes.length} scope${draft.scopes.length === 1 ? "" : "s"} and ${union} controls in the union. Each control set is frozen as revision 1 (${draft.submitOnCreate ? "pending approval" : "draft"}); later changes are proposed as a new revision and approved before they take effect.`}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel ref={alertCancelRef} disabled={creating}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              variant="primary"
              isLoading={creating}
              onClick={() => {
                if (creating) return;
                create();
              }}
            >
              Create program
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Stack>
  );
}

/* ---------------------------------------------------------- Step: program */

function ProgramStep({ draft, dispatch }: { draft: ProgramDraft; dispatch: (a: Action) => void }) {
  const fieldId = useId();

  const authorizingOfficialItems = officials.map((o) => ({ value: o, label: o }));
  const assessorItems = assessors.map((o) => ({ value: o, label: o }));
  const environmentItems = environments.map((o) => ({ value: o, label: o }));
  const ownerItems = people.map((p) => ({ value: p, label: p }));
  return (
    <Section title="Program">
      <Stack space="space.150">
        <Grid gap="space.150" templateColumns="minmax(0,1fr) 140px">
          <Field>
            <FieldLabel
              id={`${fieldId}-program-name-1-label`}
              htmlFor={`${fieldId}-program-name-1`}
            >
              {"Program name"}
              <span aria-hidden="true" className="text-danger">
                {" "}
                *
              </span>
            </FieldLabel>
            <Input
              id={`${fieldId}-program-name-1`}
              aria-labelledby={`${fieldId}-program-name-1-label`}
              aria-required={true}
              autoFocus
              value={draft.name}
              onChange={(e) => dispatch({ type: "field", patch: { name: e.target.value } })}
              placeholder="Autonomous aircraft"
            />
          </Field>
          <Field>
            <FieldLabel id={`${fieldId}-acronym-2-label`} htmlFor={`${fieldId}-acronym-2`}>
              {"Acronym"}
            </FieldLabel>
            <Input
              id={`${fieldId}-acronym-2`}
              aria-labelledby={`${fieldId}-acronym-2-label`}
              aria-describedby={`${fieldId}-acronym-2-message`}
              value={draft.acronym}
              onChange={(e) =>
                dispatch({ type: "field", patch: { acronym: e.target.value.toUpperCase() } })
              }
              placeholder="AAC"
            />
            <FieldDescription id={`${fieldId}-acronym-2-message`}>
              {"Blank derives one from the name."}
            </FieldDescription>
          </Field>
        </Grid>
        <Field>
          <FieldLabel id={`${fieldId}-mission-3-label`} htmlFor={`${fieldId}-mission-3`}>
            {"Mission"}
          </FieldLabel>
          <Input
            id={`${fieldId}-mission-3`}
            aria-labelledby={`${fieldId}-mission-3-label`}
            aria-describedby={`${fieldId}-mission-3-message`}
            value={draft.mission}
            onChange={(e) => dispatch({ type: "field", patch: { mission: e.target.value } })}
            placeholder="Persistent ISR over the littoral, controlled from the ground segment."
          />
          <FieldDescription id={`${fieldId}-mission-3-message`}>
            {"One line: what the system does and for whom."}
          </FieldDescription>
        </Field>
        <Grid
          gap="space.150"
          templateColumns={{ base: "repeat(2, minmax(0, 1fr))", lg: "repeat(4, minmax(0, 1fr))" }}
        >
          <Field>
            <FieldLabel
              id={`${fieldId}-system-owner-4-label`}
              htmlFor={`${fieldId}-system-owner-4`}
            >
              {"System owner"}
            </FieldLabel>
            <div className={"w-full"}>
              <Combobox<(typeof ownerItems)[number]>
                items={ownerItems}

                isItemEqualToValue={(item, selected) => item.value === selected.value}
                filter={(item, query) =>
                  [item.label, item.value, "keywords" in item ? item.keywords : ""]
                    .join(" ")
                    .toLocaleLowerCase()
                    .includes(query.toLocaleLowerCase())
                }
                value={ownerItems.find((item) => item.value === draft.owner) ?? null}
                onValueChange={(item) => {
                  const v = item?.value ?? "";
                  return dispatch({ type: "field", patch: { owner: v } });
                }}
              >
                <ComboboxInput
                  id={`${fieldId}-system-owner-4`}
                  aria-labelledby={`${fieldId}-system-owner-4-label`}
                  placeholder="Choose an owner"
                />
                <ComboboxContent>
                  <ComboboxEmpty>{"No matches."}</ComboboxEmpty>
                  <ComboboxList aria-labelledby={`${fieldId}-system-owner-4-label`}>
                    {(item) => (
                      <ComboboxItem
                        key={item.value}
                        value={item}
                        disabled={"disabled" in item && Boolean(item.disabled)}
                      >
                        <span className="min-w-0 flex-1">{item.label}</span>
                        {"meta" in item && item.meta ? (
                          <span className="text-subtle font-body-small">{String(item.meta)}</span>
                        ) : null}
                      </ComboboxItem>
                    )}
                  </ComboboxList>
                </ComboboxContent>
              </Combobox>
            </div>
          </Field>
          <Field>
            <FieldLabel
              id={`${fieldId}-authorizing-official-5-label`}
              htmlFor={`${fieldId}-authorizing-official-5`}
            >
              {"Authorizing official"}
            </FieldLabel>
            <Select<string>
              items={authorizingOfficialItems}
              value={draft.authorizingOfficial}
              onValueChange={(value) => {
                if (value === null) return;
                return dispatch({ type: "field", patch: { authorizingOfficial: value } });
              }}
            >
              <SelectTrigger
                id={`${fieldId}-authorizing-official-5`}
                className="w-full"
                aria-label="Authorizing official"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent aria-labelledby={`${fieldId}-authorizing-official-5-label`}>
                {authorizingOfficialItems.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel id={`${fieldId}-assessor-6-label`} htmlFor={`${fieldId}-assessor-6`}>
              {"Assessor"}
            </FieldLabel>
            <Select<string>
              items={assessorItems}
              value={draft.assessor}
              onValueChange={(value) => {
                if (value === null) return;
                return dispatch({ type: "field", patch: { assessor: value } });
              }}
            >
              <SelectTrigger id={`${fieldId}-assessor-6`} className="w-full" aria-label="Assessor">
                <SelectValue />
              </SelectTrigger>
              <SelectContent aria-labelledby={`${fieldId}-assessor-6-label`}>
                {assessorItems.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel id={`${fieldId}-environment-7-label`} htmlFor={`${fieldId}-environment-7`}>
              {"Environment"}
            </FieldLabel>
            <Select<string>
              items={environmentItems}
              value={draft.environment}
              onValueChange={(value) => {
                if (value === null) return;
                return dispatch({
                  type: "field",
                  patch: { environment: value as Program["environment"] },
                });
              }}
            >
              <SelectTrigger
                id={`${fieldId}-environment-7`}
                className="w-full"
                aria-label="Environment"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent aria-labelledby={`${fieldId}-environment-7-label`}>
                {environmentItems.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </Grid>
      </Stack>
    </Section>
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
  const frameworkId = useId();
  return (
    <Section title="Framework edition">
      <RadioGroup<ProgramDraft["framework"]>
        aria-label="Framework edition"
        value={draft.framework}
        onValueChange={(framework) => dispatch({ type: "field", patch: { framework } })}
        className="gap-0 divide-y"
      >
        {frameworks.map((f) => (
          <Inline
            key={f.id}
            className="py-100"
            space="space.200"
            alignBlock="start"
            spread="space-between"
          >
            <label className="group inline-flex items-start gap-100 font-body text-default has-[:disabled]:cursor-not-allowed has-[:disabled]:text-disabled">
              <RadioGroupItem
                value={f.id}
                disabled={!f.available}
                aria-labelledby={`${frameworkId}-${f.id}-label`}
                aria-describedby={`${frameworkId}-${f.id}-description`}
              />
              <Stack as="span" className="min-w-0">
                <span id={`${frameworkId}-${f.id}-label`} className="select-none">
                  {f.name}
                </span>
                <span
                  id={`${frameworkId}-${f.id}-description`}
                  className="font-body-small text-subtle group-has-[:disabled]:text-disabled"
                >
                  {f.version} · selects under {f.policy}
                </span>
              </Stack>
            </label>
            <span className="shrink-0 text-right font-body-small text-subtle">
              {f.available ? (
                <span className="tabular-nums">{f.controls} controls and enhancements</span>
              ) : (
                <Indicator tone="neutral">{f.reason}</Indicator>
              )}
            </span>
          </Inline>
        ))}
      </RadioGroup>
      <dl
        className="pt-150 grid gap-y-050 border-t border-default font-body-small"
        style={{ gridTemplateColumns: "140px 1fr" }}
      >
        <dt className="text-subtle">Selection policy</dt>
        <dd>
          CNSSI 1253 — confidentiality, integrity and availability select independently; the set is
          their union.
        </dd>
        <dt className="text-subtle">Overlays</dt>
        <dd>
          CNSSI 1253 attachments and DoD overlays tailor the selection up or down; each decision is
          recorded with its rationale.
        </dd>
      </dl>
    </Section>
  );
}

/* ---------------------------------------------------------- Step: systems */

type Editing =
  { kind: "system"; key: string } | { kind: "subsystem"; systemKey: string; key: string } | null;

function SystemsStep({ draft, dispatch }: { draft: ProgramDraft; dispatch: (a: Action) => void }) {
  const fieldId = useId();

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

  const ownerItems2 = people.map((p) => ({ value: p, label: p }));
  return (
    <Section
      title="Systems and subsystems"
      count={`${draft.scopes.length} scope${draft.scopes.length === 1 ? "" : "s"}`}
      action={
        <Button size="small" onClick={() => dispatch({ type: "system.add" })} iconBefore={<Plus />}>
          Add system
        </Button>
      }
    >
      <p className="pb-100 font-body-small text-subtle">
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
              isSelected={editing?.kind === "system" && editing.key === system.key}
              onSelect={() => setEditing({ kind: "system", key: system.key })}
              trailing={
                <>
                  {leaf ? (
                    <Badge variant="secondary" size="xsmall" tone="information">
                      Scope
                    </Badge>
                  ) : (
                    <span className="font-body-xsmall text-subtle">
                      {system.subsystems.length} scope{system.subsystems.length === 1 ? "" : "s"}
                    </span>
                  )}
                  <Button
                    variant="subtle"
                    size="xsmall"
                    onClick={() => {
                      dispatch({ type: "subsystem.add", systemKey: system.key });
                      setExpanded((prev) => new Set(prev).add(system.key));
                    }}
                  >
                    <Plus className="size-150" /> Subsystem
                  </Button>
                  {draft.systems.length > 1 ? (
                    <Button
                      variant="subtle"
                      size="xsmall"
                      aria-label={`Remove ${name}`}
                      onClick={() => dispatch({ type: "system.remove", key: system.key })}
                    >
                      <Trash2 className="size-150" />
                    </Button>
                  ) : null}
                </>
              }
            >
              <span className="truncate font-body">{name}</span>
              <span className="truncate font-body-xsmall text-subtle">
                {system.function.trim() || "System"}
              </span>
            </Tree.Item>,
            ...(open
              ? system.subsystems.map((sub) => (
                  <Tree.Item
                    key={sub.key}
                    depth={1}
                    isSelected={editing?.kind === "subsystem" && editing.key === sub.key}
                    onSelect={() =>
                      setEditing({ kind: "subsystem", systemKey: system.key, key: sub.key })
                    }
                    trailing={
                      <>
                        <Badge variant="secondary" size="xsmall" tone="information">
                          Scope
                        </Badge>
                        <Button
                          variant="subtle"
                          size="xsmall"
                          aria-label={`Remove ${sub.name || "subsystem"}`}
                          onClick={() =>
                            dispatch({
                              type: "subsystem.remove",
                              systemKey: system.key,
                              key: sub.key,
                            })
                          }
                        >
                          <Trash2 className="size-150" />
                        </Button>
                      </>
                    }
                  >
                    <span
                      className={
                        sub.name.trim() ? "truncate font-body" : "truncate font-body text-subtle"
                      }
                    >
                      {sub.name.trim() || "Unnamed subsystem"}
                    </span>
                    <span className="truncate font-body-xsmall text-subtle">
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
        onOpenChange={(next) => {
          if (!next) {
            setEditing(null);
          }
        }}
      >
        <SheetContent side="end" style={{ maxWidth: 420 }}>
          <SheetHeader>
            <Box className="flex items-start gap-100">
              <Box className="flex min-w-0 flex-1 flex-col gap-025">
                <SheetTitle>
                  {target ? `${target.label} · ${target.record.name.trim() || "Unnamed"}` : ""}
                </SheetTitle>
                <SheetDescription>
                  {target && editing?.kind === "subsystem"
                    ? `Under ${target.system.name.trim() || draft.name.trim() || "the system"}`
                    : "Becomes a node in the composition tree"}
                </SheetDescription>
              </Box>
            </Box>
          </SheetHeader>
          <Box className="min-h-0 flex-1 overflow-y-auto overscroll-none px-200 py-150">
            {target ? (
              <Stack space="space.150">
                <Field>
                  <FieldLabel id={`${fieldId}-name-8-label`} htmlFor={`${fieldId}-name-8`}>
                    {"Name"}
                    <span aria-hidden="true" className="text-danger">
                      {" "}
                      *
                    </span>
                  </FieldLabel>
                  <Input
                    id={`${fieldId}-name-8`}
                    aria-labelledby={`${fieldId}-name-8-label`}
                    aria-required={true}
                    autoFocus
                    value={target.record.name}
                    onChange={(e) => patchTarget({ name: e.target.value })}
                    placeholder={
                      editing?.kind === "system" ? draft.name.trim() || "Ground segment" : "Radar"
                    }
                  />
                </Field>
                <Field>
                  <FieldLabel id={`${fieldId}-function-9-label`} htmlFor={`${fieldId}-function-9`}>
                    {"Function"}
                  </FieldLabel>
                  <Textarea
                    id={`${fieldId}-function-9`}
                    aria-labelledby={`${fieldId}-function-9-label`}
                    aria-describedby={`${fieldId}-function-9-message`}
                    value={target.record.function}
                    onChange={(e) => patchTarget({ function: e.target.value })}
                    placeholder="Terrain-following radar and collision avoidance."
                  />
                  <FieldDescription id={`${fieldId}-function-9-message`}>
                    {"What it does for the mission."}
                  </FieldDescription>
                </Field>
                <Field>
                  <FieldLabel id={`${fieldId}-owner-10-label`} htmlFor={`${fieldId}-owner-10`}>
                    {"Owner"}
                  </FieldLabel>
                  <div className={"w-full"}>
                    <Combobox<(typeof ownerItems2)[number]>
                      items={ownerItems2}

                      isItemEqualToValue={(item, selected) => item.value === selected.value}
                      filter={(item, query) =>
                        [item.label, item.value, "keywords" in item ? item.keywords : ""]
                          .join(" ")
                          .toLocaleLowerCase()
                          .includes(query.toLocaleLowerCase())
                      }
                      value={ownerItems2.find((item) => item.value === target.record.owner) ?? null}
                      onValueChange={(item) => {
                        const v = item?.value ?? "";
                        return patchTarget({ owner: v });
                      }}
                    >
                      <ComboboxInput
                        id={`${fieldId}-owner-10`}
                        aria-labelledby={`${fieldId}-owner-10-label`}
                        placeholder={`Inherits ${draft.owner}`}
                      />
                      <ComboboxContent>
                        <ComboboxEmpty>{"No matches."}</ComboboxEmpty>
                        <ComboboxList aria-labelledby={`${fieldId}-owner-10-label`}>
                          {(item) => (
                            <ComboboxItem
                              key={item.value}
                              value={item}
                              disabled={"disabled" in item && Boolean(item.disabled)}
                            >
                              <span className="min-w-0 flex-1">{item.label}</span>
                              {"meta" in item && item.meta ? (
                                <span className="text-subtle font-body-small">
                                  {String(item.meta)}
                                </span>
                              ) : null}
                            </ComboboxItem>
                          )}
                        </ComboboxList>
                      </ComboboxContent>
                    </Combobox>
                  </div>
                </Field>
              </Stack>
            ) : null}
          </Box>
          <SheetFooter>
            <Button variant="primary" onClick={() => setEditing(null)}>
              Done
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </Section>
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
    <>
      {many ? (
        <WorkPane.Row
          id="Program"
          title="Program default"
          meta={`${triadLabel(draft.defaults)} · inherited by ${inheriting} of ${draft.scopes.length}`}
          isActive={selected === DEFAULT_KEY}
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
            tone={unmet ? "warning" : s.override ? "information" : "neutral"}
            isActive={selected === s.key}
            onSelect={() => setSelected(s.key)}
          />
        );
      })}
    </>
  );

  const detail =
    selected === DEFAULT_KEY ? (
      <Stack space="space.200">
        <div>
          <h2 className="font-body-large font-semibold">Program default</h2>
          <p className="font-body-small text-subtle">
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
      </Stack>
    ) : scope ? (
      <Stack space="space.200">
        <Stack space="space.150">
          <div>
            <h2 className="font-body-large font-semibold">{scope.path}</h2>
            <p className="font-body-small text-subtle">
              {scope.subsystemKey ? "Subsystem scope" : "System scope"} · CNSSI 1253{" "}
              {triadLabel(scopeParameters(draft, scope))}
            </p>
          </div>
          <RevisionGates gates={scopeGates(draft, scope)} />
        </Stack>
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
      </Stack>
    ) : null;

  // A scope list is short, so the WorkPane's list column is 240px instead of the 340px a
  // control list takes.
  return (
    <WorkPane
      listWidth={240}
      listLabel={
        <Box className="font-heading-xxsmall uppercase text-subtle">
          Scopes · {draft.scopes.length}
        </Box>
      }
      list={list}
      detail={detail}
    />
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
  const submitId = useId();
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
    <Stack space="space.050">
      <Section title="Program">
        <Grid
          templateColumns={{ base: "repeat(2, minmax(0, 1fr))", lg: "repeat(3, minmax(0, 1fr))" }}
          columnGap="space.300"
          rowGap="space.025"
        >
          <KeyValue label="Name">{draft.name.trim()}</KeyValue>
          <KeyValue label="Owner">{draft.owner}</KeyValue>
          <KeyValue label="AO">{draft.authorizingOfficial}</KeyValue>
          <KeyValue label="Assessor">{draft.assessor}</KeyValue>
          <KeyValue label="Environment">{draft.environment}</KeyValue>
          <KeyValue label="Framework" wrap>
            {framework?.name} · {framework?.version}
          </KeyValue>
        </Grid>
      </Section>

      <Section title="Scopes" count={`${draft.scopes.length} · ${union} controls in the union`}>
        <Table>
          <thead>
            <Table.Row>
              <Table.Header>Scope</Table.Header>
              <Table.Header width={90}>C · I · A</Table.Header>
              <Table.Header width={220}>Overlays</Table.Header>
              <Table.Header width={80} className="text-right">
                By hand
              </Table.Header>
              <Table.Header width={80} className="text-right">
                Controls
              </Table.Header>
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
                    <Inline as="span" space="space.050" alignBlock="center">
                      {objectives.map((o) => (
                        <Badge
                          variant="secondary"
                          key={o}
                          size="xsmall"
                          tone={impactTone[triadOfParameters(p)[o]]}
                        >
                          {triadOfParameters(p)[o][0]}
                        </Badge>
                      ))}
                    </Inline>
                  </Table.Cell>
                  <Table.Cell className="truncate">
                    {set.overlays.map((o) => o.name).join(", ") || "—"}
                  </Table.Cell>
                  <Table.Cell className="tabular-nums text-right">
                    {s.tailoring.length || "—"}
                  </Table.Cell>
                  <Table.Cell className="tabular-nums text-right">{set.total}</Table.Cell>
                </Table.Row>
              );
            })}
          </tbody>
        </Table>
      </Section>

      <Section title="Decisions with a rationale" count={decisions.length || null}>
        {decisions.length ? (
          <Table>
            <thead>
              <Table.Row>
                <Table.Header width={150}>Scope</Table.Header>
                <Table.Header width={150}>Subject</Table.Header>
                <Table.Header width={170}>Decision</Table.Header>
                <Table.Header>Rationale</Table.Header>
              </Table.Row>
            </thead>
            <tbody>
              {decisions.map((d, i) => (
                <Table.Row key={i}>
                  <Table.Cell className="truncate">{d.scope.path}</Table.Cell>
                  <Table.Cell className="truncate">{d.subject}</Table.Cell>
                  <Table.Cell className="truncate">{d.decision}</Table.Cell>
                  <Table.Cell className="whitespace-normal py-100 align-top">
                    {d.rationale}
                  </Table.Cell>
                </Table.Row>
              ))}
            </tbody>
          </Table>
        ) : (
          <p className="font-body-small text-subtle">
            Every overlay follows the engine&apos;s recommendation and no control is tailored by
            hand.
          </p>
        )}
      </Section>

      <Section title="On create">
        <label className="inline-flex items-start gap-100 font-body text-default">
          <Checkbox
            checked={draft.submitOnCreate}
            aria-labelledby={`${submitId}-label`}
            aria-describedby={`${submitId}-description`}
            onCheckedChange={(submitOnCreate) =>
              dispatch({ type: "field", patch: { submitOnCreate } })
            }
          />
          <Stack as="span" className="min-w-0">
            <span id={`${submitId}-label`} className="select-none">
              Submit control sets for approval now
            </span>
            <span id={`${submitId}-description`} className="font-body-small text-subtle">
              Off leaves every revision 1 as a draft the engineer submits later.
            </span>
          </Stack>
        </label>
      </Section>
    </Stack>
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
    <aside className="lg:sticky-rail">
      <Inspector.Group title="Program">
        <KeyValue label="Framework" wrap>
          {framework?.name ?? "—"}
        </KeyValue>
        <KeyValue label="Systems">{draft.systems.length}</KeyValue>
        <KeyValue label="Scopes">{draft.scopes.length}</KeyValue>
        <KeyValue label="Default">
          <Inline as="span" space="space.050" alignBlock="center">
            {objectives.map((o) => (
              <Badge
                variant="secondary"
                key={o}
                size="xsmall"
                tone={impactTone[triadOfParameters(draft.defaults)[o]]}
              >
                {triadOfParameters(draft.defaults)[o][0]}
              </Badge>
            ))}
            <span className="font-body-xsmall text-subtle">CNSSI 1253</span>
          </Inline>
        </KeyValue>
      </Inspector.Group>
      {tailoring ? (
        <Inspector.Group title={`Control set · ${union}`}>
          {draft.scopes.map((s) => {
            const set = resolveDraft(scopeDraft(draft, s));
            return (
              <KeyValue key={s.key} label={s.label}>
                <span className="tabular-nums">{set.total}</span>
                <span className="text-subtle">
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
        <p className="font-body-small text-subtle">
          Every leaf becomes an assessment scope with revision 1 of its control set. Changing a set
          later means proposing revision 2 and having it approved.
        </p>
      </Inspector.Group>
    </aside>
  );
}
