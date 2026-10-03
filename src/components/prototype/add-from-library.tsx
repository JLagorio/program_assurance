import { useEffect, useId, useMemo, useRef, useState, type FormEvent } from "react";
import { AlertCircle } from "lucide-react";
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Box,
  Button,
  Checkbox,
  CheckboxGroup,
  CheckboxGroupSelectAll,
  DataTable,
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  ErrorSummary,
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  FieldLegend,
  FieldSet,
  Grid,
  Id,
  PickerSheet,
  RadioGroup,
  RadioGroupItem,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Stack,
  Text,
  defineColumns,
  toast,
  useDataTable,
  useLedgerLocale,
  VisuallyHidden,
} from "@ledger/design-system";
import { TextField } from "@/components/app/fields";
import { useFormFeedback, type FormIssue } from "@/components/app/form-feedback";
import { useDraftGuard } from "@/components/app/use-draft-guard";
import { useSelectedControls } from "@/lib/control-reads";
import { idSet, useRows, type Row } from "@/lib/models";
import { labelFor } from "@/lib/records";
import {
  useAdoptBaseline,
  useAdoptRequirementDefinition,
  useApplyLibrarySource,
} from "@/lib/library-apply";
import type { SystemAssuranceRow } from "@/lib/system-assurance";
import { elementTypeForComponent } from "@/lib/library-items";
import { profileChoices, type ProfileChoice } from "./system-baseline";
import { ProductCollection } from "./product-collection";
import { QueryState } from "./work-common";

type Source = "component" | "profile" | "requirement";
const sourceLabels: Record<Source, string> = {
  component: "Component definition",
  profile: "Profile (control baseline)",
  requirement: "Requirement definition",
};
type Item = {
  id: string;
  code: string;
  name: string;
  detail: string;
  category: string;
  version: string;
  claims: number;
  revisionId: string;
  definedComponentId: string | null;
  componentType: string | null;
  definitionCode: string;
  profile: ProfileChoice | null;
};
type CellState = "seed" | "not_in_baseline" | "no_ssp" | "already_applied";
const cellStateLabels: Record<Exclude<CellState, "seed">, string> = {
  already_applied: "Already applied",
  no_ssp: "No draft SSP",
  not_in_baseline: "Not in baseline",
};
const elements = { one: "{count} element", other: "{count} elements" };

/** Everything inside the element, within its boundary, nearest first. */
function inside(element: SystemAssuranceRow, rows: SystemAssuranceRow[]) {
  const out: SystemAssuranceRow[] = [];
  const queue = [element.id];
  const seen = new Set([element.id]);
  while (queue.length) {
    const parentId = queue.shift();
    for (const child of rows) {
      if (
        child.parent_system_id !== parentId ||
        child.boundary_system_id !== element.boundary_system_id ||
        seen.has(child.id)
      )
        continue;
      seen.add(child.id);
      out.push(child);
      queue.push(child.id);
    }
  }
  return out.sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }));
}

/** The control that opened the flow, read as it first renders, so focus can go back there. */
function currentOpener(): HTMLElement | null {
  if (typeof document === "undefined") return null;
  const active = document.activeElement;
  if (!(active instanceof HTMLElement) || active === document.body) return null;
  if (active.closest('[role="menu"]'))
    return document.querySelector<HTMLElement>('[aria-haspopup="menu"][aria-expanded="true"]');
  return active;
}

/**
 * The one verb for the story: choose a library item and its published version (frame one), then
 * confirm where it applies and what will be written (frame two). Back returns to the choice with
 * everything entered kept. A profile goes through the baseline command, a component definition
 * through the apply command, a requirement definition through adoption by reference.
 */
export function AddFromLibrary({
  programId,
  element,
  rows,
  controlId,
  initialSource,
  onClose,
}: {
  programId: string;
  element: SystemAssuranceRow;
  rows: SystemAssuranceRow[];
  /** Pin the target to one control: only component definitions covering it, only that claim. */
  controlId?: string | undefined;
  /** Open on a source other than component definitions. */
  initialSource?: "component" | "profile" | "requirement" | undefined;
  onClose: () => void;
}) {
  const [source, setSource] = useState<Source>(initialSource ?? "component");
  const [chosenId, setChosenId] = useState<string | null>(null);
  // Each source reads its own choices, and only once the reader turns to it.
  const component = { enabled: source === "component" };
  const profile = { enabled: source === "profile" };
  const requirement = { enabled: source === "requirement" };
  const definitions = useRows("component_definitions", undefined, component);
  // Only published versions are ever added, so no draft is read.
  const revisions = useRows("component_definition_revisions", { state: "published" }, component);
  // Each definition's latest published version is the one a program adds, so only its content is
  // read: its components and their control claims, never every version's.
  const latestPublished = useMemo(() => {
    if (!revisions.data) return undefined;
    const latest = new Map<string, Row<"component_definition_revisions">>();
    for (const revision of revisions.data) {
      if (revision.state !== "published") continue;
      const current = latest.get(revision.component_definition_id);
      if (!current || current.version_number < revision.version_number)
        latest.set(revision.component_definition_id, revision);
    }
    return latest;
  }, [revisions.data]);
  const latestIds = useMemo(
    () => (latestPublished ? idSet([...latestPublished.values()].map((row) => row.id)) : undefined),
    [latestPublished],
  );
  const content = { enabled: source === "component" && latestIds !== undefined };
  const definedComponents = useRows(
    "defined_components",
    { component_definition_revision_id: latestIds ?? [] },
    content,
  );
  const implementations = useRows(
    "defined_component_implementations",
    { component_definition_revision_id: latestIds ?? [] },
    content,
  );
  // Only the controls the chosen component claims, by what the confirm frame names them.
  const controls = useRows(
    "controls",
    {
      id: idSet(
        implementations.data
          ?.filter((row) => row.defined_component_id === chosenId)
          .map((row) => row.control_id),
      ),
    },
    {
      columns: ["id", "code", "title"],
      enabled: source === "component" && !!chosenId && implementations.isSuccess,
    },
  );
  const components = useRows("system_components", { system_id: element.boundary_system_id });
  const plans = useRows("ssp_revisions", { system_id: element.boundary_system_id });
  // A profile can be adopted only when every hop of its chain is published (profileChoices), so
  // only published resolutions, profile versions and catalog editions are read, and only the
  // imports of those versions.
  const resolutions = useRows("profile_resolutions", { state: "published" }, profile);
  const profiles = useRows("profile_revisions", { state: "published" }, profile);
  const profileRecords = useRows("profiles", undefined, profile);
  const imports = useRows(
    "profile_imports",
    { profile_revision_id: idSet(profiles.data?.map((row) => row.id)) },
    { enabled: source === "profile" && profiles.isSuccess },
  );
  const catalogs = useRows("catalog_revisions", { state: "published" }, profile);
  // The published resolutions' selections, to list the profiles; the boundary's own for the claims.
  const published = useMemo(
    () => resolutions.data?.filter((row) => row.state === "published").map((row) => row.id),
    [resolutions.data],
  );
  const selections = useSelectedControls(published, {
    ...profile,
    columns: ["id", "profile_resolution_id", "control_id"],
  });
  const requirementDefinitions = useRows("requirement_definitions", undefined, requirement);
  // Only published versions are adopted, so no draft is read.
  const requirementRevisions = useRows(
    "requirement_definition_revisions",
    { state: "published" },
    requirement,
  );
  const apply = useApplyLibrarySource();
  const adoptBaseline = useAdoptBaseline();
  const adoptRequirement = useAdoptRequirementDefinition();
  const { formatPlural } = useLedgerLocale();
  const [frame, setFrame] = useState<"choose" | "confirm">("choose");
  const [scope, setScope] = useState<"element" | "inside">("element");
  const [excluded, setExcluded] = useState<Set<string>>(new Set());
  const [replaceAdoption, setReplaceAdoption] = useState<Set<string>>(new Set());
  const [rationale, setRationale] = useState("");
  const [asElement, setAsElement] = useState(true);
  const [elementSpecs, setElementSpecs] = useState<Record<string, { code: string; name: string }>>(
    {},
  );
  const [failure, setFailure] = useState<string | null>(null);
  const requestId = useRef(crypto.randomUUID());
  const formId = useId();
  const [opener] = useState(currentOpener);
  // Moving between the frames hands focus to the next one instead of back to the opener.
  const toConfirm = useRef(false);
  const toChoose = useRef(false);
  const scopeItems = useRef<Partial<Record<"element" | "inside", HTMLElement | null>>>({});
  const submitRef = useRef<HTMLButtonElement>(null);
  const failureRef = useRef<HTMLDivElement>(null);
  const feedback = useFormFeedback<string>();
  const guard = useDraftGuard({
    dirty:
      !!chosenId ||
      !!rationale ||
      Object.keys(elementSpecs).length > 0 ||
      excluded.size > 0 ||
      replaceAdoption.size > 0,
    onClose,
    description: "The library item you chose and what you entered will be lost.",
  });
  const plan = [...(plans.data ?? [])]
    .filter((row) => row.state === "draft")
    .sort((a, b) => b.version_number - a.version_number)[0];
  // Which controls the draft SSP's resolution selects: only their ids.
  const planSelections = useSelectedControls(
    plan?.profile_resolution_id ? [plan.profile_resolution_id] : undefined,
    { columns: ["id", "control_id"] },
  );
  const planControls = useMemo(
    () => new Set((planSelections.data ?? []).map((row) => row.control_id)),
    [planSelections.data],
  );
  const choices = useMemo(
    () =>
      profileChoices({
        resolutions: resolutions.data ?? [],
        profiles: profiles.data ?? [],
        profileRecords: profileRecords.data ?? [],
        imports: imports.data ?? [],
        catalogs: catalogs.data ?? [],
        selections: selections.data ?? [],
      }),
    [
      resolutions.data,
      profiles.data,
      profileRecords.data,
      imports.data,
      catalogs.data,
      selections.data,
    ],
  );
  // Exactly the queries each source's choices come from, so the list never reads as empty early.
  const sourceQueries =
    source === "profile"
      ? [resolutions, profiles, profileRecords, imports, catalogs, selections]
      : source === "requirement"
        ? [requirementDefinitions, requirementRevisions]
        : [definitions, revisions, definedComponents, implementations];
  // The footer never counts "0 of 0" while the choices load or after they fail.
  const sourceState = sourceQueries.some((query) => query.isError && query.data === undefined)
    ? "error"
    : sourceQueries.some((query) => query.data === undefined)
      ? "loading"
      : "ready";
  const items = useMemo<Item[]>(() => {
    if (source === "profile")
      return choices.map((choice) => ({
        id: choice.id,
        code: choice.label,
        name: choice.title,
        detail: formatPlural(choice.controlIds.length, {
          one: "{count} control",
          other: "{count} controls",
        }),
        category: "Profile",
        version: choice.version,
        claims: choice.controlIds.length,
        revisionId: choice.id,
        definedComponentId: null,
        componentType: null,
        definitionCode: choice.label,
        profile: choice,
      }));
    if (source === "requirement") {
      const latest = new Map<string, Row<"requirement_definition_revisions">>();
      for (const revision of requirementRevisions.data ?? []) {
        if (revision.state !== "published") continue;
        const current = latest.get(revision.requirement_definition_id);
        if (!current || current.version_number < revision.version_number)
          latest.set(revision.requirement_definition_id, revision);
      }
      return (requirementDefinitions.data ?? [])
        .flatMap((definition) => {
          const revision = latest.get(definition.id);
          return revision
            ? [
                {
                  id: revision.id,
                  code: definition.code,
                  name: definition.title,
                  detail: revision.statement,
                  category: labelFor(revision.requirement_type),
                  version: String(revision.version_number),
                  claims: 0,
                  revisionId: revision.id,
                  definedComponentId: null,
                  componentType: null,
                  definitionCode: definition.code,
                  profile: null,
                },
              ]
            : [];
        })
        .sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }));
    }
    return (definedComponents.data ?? [])
      .flatMap((defined) => {
        const revision = (revisions.data ?? []).find(
          (row) => row.id === defined.component_definition_revision_id,
        );
        const definition = definitions.data?.find(
          (row) => row.id === revision?.component_definition_id,
        );
        if (!revision || !definition || latestPublished?.get(definition.id)?.id !== revision.id)
          return [];
        const claims = (implementations.data ?? []).filter(
          (row) => row.defined_component_id === defined.id && row.control_id,
        );
        if (controlId && !claims.some((row) => row.control_id === controlId)) return [];
        return [
          {
            id: defined.id,
            code: definition.code,
            name: definition.name,
            detail: `${defined.name} · ${labelFor(defined.component_type)}`,
            category: labelFor(definition.category),
            version: String(revision.version_number),
            claims: claims.length,
            revisionId: revision.id,
            definedComponentId: defined.id,
            componentType: defined.component_type,
            definitionCode: definition.code,
            profile: null,
          },
        ];
      })
      .sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }));
  }, [
    source,
    choices,
    definitions.data,
    revisions.data,
    latestPublished,
    definedComponents.data,
    implementations.data,
    requirementDefinitions.data,
    requirementRevisions.data,
    controlId,
    formatPlural,
  ]);
  const chosen = items.find((item) => item.id === chosenId) ?? null;
  const columns = useMemo(
    () =>
      defineColumns<Item>((c) => [
        c.id("code", {
          header: source === "requirement" ? "Requirement" : "Item",
          width: 150,
          priority: 1,
          cell: (row) => <Id>{row.code}</Id>,
        }),
        c.text("name", { header: "Name", minWidth: 200, priority: 0, hideable: false }),
        c.text("detail", { header: "Detail", minWidth: 200, wrap: true }),
        c.text("category", { header: "Category", width: 160 }),
        c.text("version", { header: "Version", width: 90 }),
        ...(source === "component" ? [c.number("claims", { header: "Controls", width: 110 })] : []),
      ]),
    [source],
  );
  // The picker's search filters this table, so a search that misses says so, with Clear filters.
  const table = useDataTable({
    columns,
    data: items,
    getRowId: (row) => row.id,
    rowLabel: (row) => `${row.code} ${row.name}`,
    label: "Library items",
    view: `add-from-library-${source}`,
    // One item at a time: a radio per row, no select-all.
    selectable: "single",
    value: chosenId,
    onValueChange: setChosenId,
  });
  const insideRows = useMemo(() => inside(element, rows), [element, rows]);
  const targets = useMemo(
    () => (scope === "inside" ? [element, ...insideRows] : [element]),
    [scope, element, insideRows],
  );
  const claims = useMemo(
    () =>
      chosen?.definedComponentId
        ? (implementations.data ?? [])
            .filter(
              (row) =>
                row.defined_component_id === chosen.definedComponentId &&
                row.control_id &&
                (!controlId || row.control_id === controlId),
            )
            .map((row) => ({
              implementation: row,
              control: controls.data?.find((control) => control.id === row.control_id),
            }))
            .sort((a, b) =>
              (a.control?.code ?? "").localeCompare(b.control?.code ?? "", undefined, {
                numeric: true,
              }),
            )
        : [],
    [chosen, implementations.data, controls.data, controlId],
  );
  const alreadyApplied = (target: SystemAssuranceRow) =>
    !!chosen?.definedComponentId &&
    (components.data ?? []).some(
      (component) =>
        component.defined_component_id === chosen.definedComponentId &&
        (asElement && source === "component"
          ? rows.some(
              (row) => row.id === component.system_element_id && row.parent_system_id === target.id,
            )
          : (component.system_element_id ?? component.system_id) === target.id),
    );
  const cellState = (target: SystemAssuranceRow, controlIdOfClaim: string): CellState =>
    alreadyApplied(target)
      ? "already_applied"
      : !plan
        ? "no_ssp"
        : planControls.has(controlIdOfClaim)
          ? "seed"
          : "not_in_baseline";
  const cellKey = (targetId: string, claimControlId: string) => `${targetId}:${claimControlId}`;
  const willWrite = targets.filter((target) => !alreadyApplied(target)).length;
  const busy = guard.busy;
  // What the confirm frame reads, so it never states a negative before its data arrives.
  const confirmQueries =
    source === "component"
      ? [
          plans,
          components,
          controls,
          implementations,
          ...(plan?.profile_resolution_id ? [planSelections] : []),
        ]
      : [];
  const confirmReady = confirmQueries.every((query) => query.data !== undefined);
  const needsRationale = source !== "requirement" && !rationale.trim();
  const elementType = elementTypeForComponent(chosen?.componentType ?? "other");
  // "New subsystem under …", and "New element under …" for a type with no better word than other.
  const elementWord = elementType === "other" ? "element" : labelFor(elementType).toLowerCase();
  const elementSpec = (target: SystemAssuranceRow) =>
    elementSpecs[target.id] ?? {
      code: `${target.code}-${chosen?.definitionCode ?? "component"}`.toUpperCase(),
      name: chosen?.detail.split(" · ")[0] ?? chosen?.name ?? "Component",
    };
  // Every problem with the entry, in the order the fields appear.
  const issues: FormIssue<string>[] = [
    ...(source === "component" && asElement
      ? targets.flatMap((target) => {
          const spec = elementSpec(target);
          return [
            ...(spec.code.trim()
              ? []
              : [
                  {
                    field: `code:${target.id}`,
                    message: `Enter a code for the element under ${target.code}.`,
                  },
                ]),
            ...(spec.name.trim()
              ? []
              : [
                  {
                    field: `name:${target.id}`,
                    message: `Enter a name for the element under ${target.code}.`,
                  },
                ]),
          ];
        })
      : []),
    ...(needsRationale
      ? [{ field: "rationale", message: "Explain why this library item applies here." }]
      : []),
  ];
  const errors = new Map(
    feedback.submitted ? issues.map((issue) => [issue.field, issue.message] as const) : [],
  );
  const unavailable = !confirmReady
    ? confirmQueries.some((query) => query.isError)
      ? "Retry loading what will be written first."
      : "Wait for what will be written to load."
    : source === "component" && willWrite === 0
      ? "Every target already has this component."
      : undefined;
  useEffect(() => {
    if (failure) failureRef.current?.scrollIntoView({ block: "nearest" });
  }, [failure]);
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!chosen || busy || unavailable) return;
    setFailure(null);
    if (!feedback.report(issues)) return;
    submitRef.current?.focus();
    if (!guard.start()) return;
    try {
      if (source === "component") {
        const result = await apply.mutateAsync({
          programId,
          requestId: requestId.current,
          selection: {
            sourceRevisionId: chosen.revisionId,
            definedComponentId: chosen.definedComponentId!,
            targets: targets.map((target) => {
              const created = asElement ? elementSpec(target) : null;
              return {
                systemId: target.id,
                expectedRevision: Number(target.revision),
                // As an element, the instance carries the element's own code and name.
                code: created ? created.code.trim() : `${chosen.definitionCode}-${target.code}`,
                name: created
                  ? created.name.trim()
                  : (chosen.detail.split(" · ")[0] ?? chosen.name),
                createElement: created,
              };
            }),
            controlIds: controlId ? [controlId] : null,
            excluded: [...excluded].map((key) => {
              const [systemId, claimControlId] = key.split(":");
              return { systemId: systemId!, controlId: claimControlId! };
            }),
            includeDescendants: scope === "inside",
            rationale,
          },
        });
        const seeded = result.targets.reduce((sum, target) => sum + (target.accepted ?? 0), 0);
        const made = result.targets.filter((t) => t.state === "accepted" && t.elementId).length;
        const accepted = result.targets.filter((t) => t.state === "accepted").length;
        toast.add({
          title: `${chosen.name} applied`,
          type: "success",
          description: `${formatPlural(accepted, elements)}, ${formatPlural(seeded, { one: "{count} narrative", other: "{count} narratives" })} seeded${made ? `, ${formatPlural(made, elements)} created` : ""}.`,
        });
      } else if (source === "profile" && chosen.profile) {
        let first = true;
        for (const target of targets) {
          const own = target.effectiveBaseline?.source_label === "Explicit system adoption";
          if (first) {
            await adoptBaseline.mutateAsync({
              systemId: target.id,
              expectedRevision: Number(target.revision),
              requestId: `${requestId.current.slice(0, -4)}${(0).toString(16).padStart(4, "0")}`,
              selection: {
                mode: "adopt",
                catalogRevisionId: chosen.profile.catalogId,
                profileResolutionId: chosen.profile.id,
                controlIds: [...chosen.profile.controlIds].sort(),
                rationale,
              },
            });
            first = false;
          } else if (own && replaceAdoption.has(target.id)) {
            await adoptBaseline.mutateAsync({
              systemId: target.id,
              expectedRevision: Number(target.revision),
              requestId: crypto.randomUUID(),
              selection: { mode: "inherit" },
            });
          }
        }
        toast.add({
          title: `${chosen.name} applied`,
          type: "success",
          description: `${element.name} adopts the profile; the elements inside inherit it.`,
        });
      } else {
        const result = await adoptRequirement.mutateAsync({
          programId,
          requestId: requestId.current,
          selection: {
            definitionRevisionId: chosen.revisionId,
            targets: targets.map((target) => ({ systemId: target.id })),
            rationale: rationale.trim() || null,
          },
        });
        toast.add({
          title: `${chosen.code} ${result.created ? "adopted" : "allocated"}`,
          type: "success",
          description: `${formatPlural(result.allocations, elements)} allocated.`,
        });
      }
      guard.finish();
      guard.complete();
    } catch (cause) {
      setFailure(
        `${cause instanceof Error ? cause.message : "The request failed."} Your choices are kept, and adding it again will not apply it twice.`,
      );
      guard.finish();
    }
  }
  const claimRows = claims.flatMap(({ implementation, control }) =>
    targets.map((target) => ({
      id: cellKey(target.id, implementation.control_id!),
      target,
      implementation,
      control,
      name: control ? `${control.code} · ${control.title}` : "Control",
      targetName: `${target.code} · ${target.name}`,
      coverage: labelFor(implementation.coverage),
      state: cellState(target, implementation.control_id!),
    })),
  );
  // A review in control order, each control's targets together: the headings do not sort.
  const claimColumns = defineColumns<(typeof claimRows)[number]>((c) => [
    // Plain text: a link here would leave the draft this dialog holds.
    c.text("name", {
      header: "Control",
      priority: 0,
      minWidth: 180,
      hideable: false,
      sortable: false,
    }),
    c.text("targetName", {
      header: "Target",
      priority: 2,
      minWidth: 160,
      wrap: true,
      sortable: false,
    }),
    c.text("coverage", { header: "Coverage", priority: 3, width: 110, sortable: false }),
    // The decision the reader makes here stays in the row longest after the control's name.
    c.text("state", {
      header: "Result",
      priority: 1,
      minWidth: 120,
      sortable: false,
      cell: (row) =>
        row.state === "seed" ? (
          // One stable name that starts with the visible label (WCAG 2.5.3); the box says whether.
          <Field orientation="horizontal">
            <Checkbox
              checked={!excluded.has(row.id)}
              onCheckedChange={(checked) =>
                setExcluded((previous) => {
                  const next = new Set(previous);
                  if (checked) next.delete(row.id);
                  else next.add(row.id);
                  return next;
                })
              }
            />
            <FieldLabel>
              Seed
              <VisuallyHidden>
                {` ${row.control?.code ?? "control"} on ${row.target.code}`}
              </VisuallyHidden>
            </FieldLabel>
          </Field>
        ) : (
          cellStateLabels[row.state]
        ),
    }),
  ]);
  const claimTable = useDataTable({
    columns: claimColumns,
    data: claimRows,
    getRowId: (row) => row.id,
    rowLabel: (row) => `${row.control?.code ?? "Control"} on ${row.target.code}`,
    label: "What will be written",
    // A review inside a dialog has no columns to manage: no Columns, no heading menu to hide one.
    pinnable: false,
    hideable: false,
  });
  const ownAdopters = targets
    .slice(1)
    .filter((target) => target.effectiveBaseline?.source_label === "Explicit system adoption");
  const inheritors = targets
    .slice(1)
    .filter((target) => target.effectiveBaseline?.source_label !== "Explicit system adoption");
  const back = () => {
    if (busy) return;
    toChoose.current = true;
    toConfirm.current = false;
    setFailure(null);
    setFrame("choose");
  };
  if (frame === "confirm")
    return (
      <Dialog
        open
        pending={busy}
        onOpenChange={(open, details) => {
          if (open) return;
          details.cancel();
          void guard.close();
        }}
      >
        <DialogContent
          width="xlarge"
          initialFocus={() => scopeItems.current[scope] ?? feedback.node("rationale") ?? true}
          finalFocus={() => (toChoose.current ? false : opener?.isConnected ? opener : true)}
        >
          <DialogHeader>
            <DialogTitle>Add from library</DialogTitle>
            <DialogDescription>
              {chosen?.name} · {formatPlural(targets.length, elements)} · version {chosen?.version}
            </DialogDescription>
          </DialogHeader>
          <DialogBody>
            <QueryState queries={confirmQueries}>
              <form id={formId} noValidate onSubmit={(event) => void submit(event)}>
                <Stack space="space.250">
                  {failure ? (
                    <Alert ref={failureRef} variant="destructive" role="alert">
                      <AlertCircle aria-hidden />
                      <AlertTitle>The library item was not applied</AlertTitle>
                      <AlertDescription>{failure}</AlertDescription>
                    </Alert>
                  ) : null}
                  <ErrorSummary issues={feedback.summary} focusKey={feedback.attempts} />
                  <FieldSet disabled={busy}>
                    <Stack space="space.250">
                      <FieldSet>
                        <FieldLegend variant="label">Apply to</FieldLegend>
                        <RadioGroup
                          value={scope}
                          onValueChange={(value) =>
                            setScope(value === "inside" ? "inside" : "element")
                          }
                        >
                          <Field orientation="horizontal">
                            <RadioGroupItem
                              value="element"
                              ref={(node: HTMLElement | null) => {
                                scopeItems.current.element = node;
                              }}
                            />
                            <FieldLabel>
                              This element ({element.code} · {element.name})
                            </FieldLabel>
                          </Field>
                          <Field orientation="horizontal" disabled={insideRows.length === 0}>
                            <RadioGroupItem
                              value="inside"
                              ref={(node: HTMLElement | null) => {
                                scopeItems.current.inside = node;
                              }}
                            />
                            <FieldContent>
                              <FieldLabel>This element and everything inside</FieldLabel>
                              <FieldDescription>
                                {insideRows.length
                                  ? `${formatPlural(insideRows.length, elements)} inside ${element.code}.`
                                  : `${element.code} has nothing inside it.`}
                              </FieldDescription>
                            </FieldContent>
                          </Field>
                        </RadioGroup>
                      </FieldSet>
                      {source === "component" && (
                        <Stack space="space.200">
                          <Field orientation="horizontal">
                            <Checkbox
                              checked={asElement}
                              onCheckedChange={(checked) => setAsElement(checked === true)}
                            />
                            <FieldLabel>
                              Create as a child element under each target, carrying the component
                            </FieldLabel>
                          </Field>
                          {asElement &&
                            targets.map((target) => {
                              const spec = elementSpec(target);
                              return (
                                <FieldSet key={target.id}>
                                  <FieldLegend variant="label">
                                    New {elementWord} under {target.code} · {target.name}
                                  </FieldLegend>
                                  <Grid
                                    gap="space.150"
                                    templateColumns={{
                                      base: "minmax(0,1fr)",
                                      sm: "repeat(2,minmax(0,1fr))",
                                    }}
                                  >
                                    <TextField
                                      label={`Element code under ${target.code}`}
                                      value={spec.code}
                                      required
                                      onChange={(code) =>
                                        setElementSpecs((previous) => ({
                                          ...previous,
                                          [target.id]: { ...spec, code },
                                        }))
                                      }
                                      error={errors.get(`code:${target.id}`)}
                                      controlRef={feedback.ref(`code:${target.id}`)}
                                    />
                                    <TextField
                                      label={`Element name under ${target.code}`}
                                      value={spec.name}
                                      required
                                      onChange={(name) =>
                                        setElementSpecs((previous) => ({
                                          ...previous,
                                          [target.id]: { ...spec, name },
                                        }))
                                      }
                                      error={errors.get(`name:${target.id}`)}
                                      controlRef={feedback.ref(`name:${target.id}`)}
                                    />
                                  </Grid>
                                </FieldSet>
                              );
                            })}
                          {plan ? (
                            <Text as="p" size="small" color="color.text.subtle">
                              Narratives are seeded into SSP revision {plan.version_number} of the
                              boundary for controls in its selection. Untick Seed to leave that
                              control to the element.
                            </Text>
                          ) : (
                            <Alert tone="warning" role="status">
                              <AlertDescription>
                                The boundary has no draft SSP revision, so component instances are
                                recorded but no narrative can be seeded.
                              </AlertDescription>
                            </Alert>
                          )}
                          {/* A review inside the dialog: search only. The claims stay in control
                              order, each control's targets together. */}
                          <ProductCollection
                            table={claimTable}
                            compact
                            sort={false}
                            keepQuestion={false}
                            searchLabel="Find control applications"
                            empty={{
                              illustration: "shield",
                              title: "No control claims",
                              description:
                                "The component can still be added without seeding a control narrative.",
                            }}
                          />
                        </Stack>
                      )}
                      {source === "profile" && (
                        <Stack space="space.150">
                          <Text as="p" size="small" color="color.text.subtle">
                            {element.name} adopts the profile as its baseline. Elements inside
                            inherit it unless they carry their own adoption.
                          </Text>
                          {ownAdopters.length ? (
                            <CheckboxGroup
                              value={[...replaceAdoption]}
                              onValueChange={(value) => setReplaceAdoption(new Set(value))}
                              allValues={ownAdopters.map((target) => target.id)}
                            >
                              <FieldLegend variant="label">
                                Replace their own baseline with this profile
                              </FieldLegend>
                              {ownAdopters.length > 1 ? (
                                <CheckboxGroupSelectAll>
                                  Every element with its own baseline
                                </CheckboxGroupSelectAll>
                              ) : null}
                              <Box
                                paddingInlineStart={
                                  ownAdopters.length > 1 ? "space.300" : undefined
                                }
                              >
                                <Stack space="space.100">
                                  {ownAdopters.map((target) => (
                                    <Field key={target.id} orientation="horizontal">
                                      <Checkbox value={target.id} />
                                      <FieldContent>
                                        <FieldLabel>
                                          {target.code} · {target.name}
                                        </FieldLabel>
                                        <FieldDescription>
                                          Adopts {target.baselineTitle ?? "its own baseline"} now.
                                        </FieldDescription>
                                      </FieldContent>
                                    </Field>
                                  ))}
                                </Stack>
                              </Box>
                            </CheckboxGroup>
                          ) : null}
                          {inheritors.length ? (
                            <Text as="p" size="small" color="color.text.subtle">
                              {formatPlural(inheritors.length, {
                                one: "{count} element inside inherits it",
                                other: "{count} elements inside inherit it",
                              })}
                              : {inheritors.map((target) => target.code).join(", ")}.
                            </Text>
                          ) : null}
                        </Stack>
                      )}
                      {source === "requirement" && (
                        <Text as="p" size="small" color="color.text.subtle">
                          One program requirement is created from this definition, or reused when
                          the program already adopted this revision, and allocated to{" "}
                          {formatPlural(targets.length, elements)}.
                        </Text>
                      )}
                      <TextField
                        label="Rationale"
                        value={rationale}
                        onChange={setRationale}
                        multiline
                        required={source !== "requirement"}
                        placeholder="Why this library item applies here"
                        error={errors.get("rationale")}
                        controlRef={feedback.ref("rationale")}
                      />
                    </Stack>
                  </FieldSet>
                </Stack>
              </form>
            </QueryState>
          </DialogBody>
          <DialogFooter>
            <Button variant="subtle" onClick={back}>
              Back
            </Button>
            <DialogClose render={<Button variant="subtle" />}>Cancel</DialogClose>
            <Button
              ref={submitRef}
              variant="primary"
              type="submit"
              form={formId}
              isLoading={busy}
              disabledReason={unavailable}
            >
              Add from library
            </Button>
          </DialogFooter>
        </DialogContent>
        {guard.confirmation}
      </Dialog>
    );
  return (
    <PickerSheet
      finalFocus={() => !toConfirm.current}
      open
      onClose={() => void guard.close()}
      title="Add from library"
      subtitle={`${element.code} · ${element.name}`}
      width="xlarge"
      table={table}
      state={sourceState}
      search={{ placeholder: "Find a library item" }}
      filters={
        controlId ? undefined : (
          <Select
            value={source}
            onValueChange={(value) => {
              setSource((value as Source) ?? "component");
              setChosenId(null);
            }}
          >
            <SelectTrigger aria-label="Source" size="small">
              <SelectValue>{sourceLabels[source]}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(sourceLabels) as Source[]).map((key) => (
                <SelectItem key={key} value={key}>
                  {sourceLabels[key]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )
      }
      summary={chosen ? `${chosen.code} · ${chosen.name}` : undefined}
      action={{
        label: "Continue",
        onClick: () => {
          toConfirm.current = true;
          toChoose.current = false;
          setFrame("confirm");
        },
        disabled: !chosen,
      }}
    >
      <QueryState queries={sourceQueries}>
        <DataTable
          responsive
          table={table}
          onRowClick={(row) => setChosenId(row.id)}
          empty={{
            illustration: "records",
            title: "Nothing published to apply",
            description:
              source === "component"
                ? controlId
                  ? "No published component definition covers this control."
                  : "Publish a component definition version in the library first."
                : source === "profile"
                  ? "No published, resolved profile is available."
                  : "Publish a requirement definition in the library first.",
          }}
        />
      </QueryState>
      {guard.confirmation}
    </PickerSheet>
  );
}
