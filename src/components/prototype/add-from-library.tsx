import { useMemo, useRef, useState } from "react";
import {
  Badge,
  Button,
  Checkbox,
  DataTable,
  Field,
  FieldLabel,
  Id,
  Inline,
  Input,
  PickerSheet,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Stack,
  Table,
  Textarea,
  defineColumns,
  toast,
  useDataTable,
} from "@ledger/design-system";
import { useRows, type Row } from "@/lib/models";
import { labelFor } from "@/lib/records";
import {
  useAdoptBaseline,
  useAdoptRequirementDefinition,
  useApplyLibrarySource,
} from "@/lib/library-apply";
import type { SystemAssuranceRow } from "@/lib/system-assurance";
import { profileChoices, type ProfileChoice } from "./system-baseline";
import { elementTypeForComponent } from "@/lib/library-items";

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
const plural = (count: number, noun: string) => `${count} ${noun}${count === 1 ? "" : "s"}`;
const NIL = "00000000-0000-0000-0000-000000000000";

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

/**
 * The one verb for the story: choose a library item and its published version (frame one), then
 * confirm where it applies and what will be written (frame two). A profile goes through the
 * baseline command, a component definition through the apply command, a requirement definition
 * through adoption by reference.
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
  const definitions = useRows("component_definitions");
  const revisions = useRows("component_definition_revisions");
  const definedComponents = useRows("defined_components");
  const implementations = useRows("defined_component_implementations");
  const controls = useRows("controls");
  const components = useRows("system_components", { system_id: element.boundary_system_id });
  const plans = useRows("ssp_revisions", { system_id: element.boundary_system_id });
  const selections = useRows("selected_controls");
  const resolutions = useRows("profile_resolutions");
  const profiles = useRows("profile_revisions");
  const profileRecords = useRows("profiles");
  const imports = useRows("profile_imports");
  const catalogs = useRows("catalog_revisions");
  const requirementDefinitions = useRows("requirement_definitions");
  const requirementRevisions = useRows("requirement_definition_revisions");
  const apply = useApplyLibrarySource();
  const adoptBaseline = useAdoptBaseline();
  const adoptRequirement = useAdoptRequirementDefinition();
  const [source, setSource] = useState<Source>(initialSource ?? "component");
  const [frame, setFrame] = useState<"choose" | "confirm">("choose");
  const [search, setSearch] = useState("");
  const [chosenId, setChosenId] = useState<string | null>(null);
  const [scope, setScope] = useState<"element" | "inside">("element");
  const [excluded, setExcluded] = useState<Set<string>>(new Set());
  const [replaceAdoption, setReplaceAdoption] = useState<Set<string>>(new Set());
  const [rationale, setRationale] = useState("");
  const [asElement, setAsElement] = useState(true);
  const [elementSpecs, setElementSpecs] = useState<Record<string, { code: string; name: string }>>(
    {},
  );
  const [error, setError] = useState("");
  const requestId = useRef(crypto.randomUUID());
  const plan = [...(plans.data ?? [])]
    .filter((row) => row.state === "draft")
    .sort((a, b) => b.version_number - a.version_number)[0];
  const planControls = useMemo(
    () =>
      new Set(
        (selections.data ?? [])
          .filter((row) => row.profile_resolution_id === (plan?.profile_resolution_id ?? NIL))
          .map((row) => row.control_id),
      ),
    [selections.data, plan?.profile_resolution_id],
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
  const items = useMemo<Item[]>(() => {
    if (source === "profile")
      return choices.map((choice) => ({
        id: choice.id,
        code: choice.label,
        name: choice.title,
        detail: `${choice.controlIds.length} controls`,
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
    const latest = new Map<string, Row<"component_definition_revisions">>();
    for (const revision of revisions.data ?? []) {
      if (revision.state !== "published") continue;
      const current = latest.get(revision.component_definition_id);
      if (!current || current.version_number < revision.version_number)
        latest.set(revision.component_definition_id, revision);
    }
    return (definedComponents.data ?? [])
      .flatMap((defined) => {
        const revision = (revisions.data ?? []).find(
          (row) => row.id === defined.component_definition_revision_id,
        );
        const definition = definitions.data?.find(
          (row) => row.id === revision?.component_definition_id,
        );
        if (!revision || !definition || latest.get(definition.id)?.id !== revision.id) return [];
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
    definedComponents.data,
    implementations.data,
    requirementDefinitions.data,
    requirementRevisions.data,
    controlId,
  ]);
  const shown = useMemo(
    () =>
      items.filter((item) =>
        `${item.code} ${item.name} ${item.detail}`.toLowerCase().includes(search.toLowerCase()),
      ),
    [items, search],
  );
  const chosen = items.find((item) => item.id === chosenId) ?? null;
  const columns = useMemo(
    () =>
      defineColumns<Item>((c) => [
        c.id("code", {
          header: source === "requirement" ? "Requirement" : "Item",
          width: 150,
          active: (row) => row.id === chosenId,
          cell: (row) => <Id>{row.code}</Id>,
        }),
        c.text("name", { header: "Name", minWidth: 200, hideable: false }),
        c.text("detail", { header: "Detail", minWidth: 200, wrap: true }),
        c.text("category", { header: "Category", width: 160 }),
        c.text("version", { header: "Version", width: 90 }),
        ...(source === "component" ? [c.number("claims", { header: "Controls", width: 96 })] : []),
      ]),
    [source, chosenId],
  );
  const table = useDataTable({
    columns,
    data: shown,
    getRowId: (row) => row.id,
    label: "Library items",
    view: `add-from-library-${source}`,
  });
  const targets = useMemo(
    () => (scope === "inside" ? [element, ...inside(element, rows)] : [element]),
    [scope, element, rows],
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
  const busy = apply.isPending || adoptBaseline.isPending || adoptRequirement.isPending;
  async function submit() {
    if (!chosen) return;
    setError("");
    try {
      if (source === "component") {
        const result = await apply.mutateAsync({
          programId,
          requestId: requestId.current,
          selection: {
            sourceRevisionId: chosen.revisionId,
            definedComponentId: chosen.definedComponentId!,
            targets: targets.map((target) => {
              const element = asElement ? elementSpec(target) : null;
              return {
                systemId: target.id,
                expectedRevision: Number(target.revision),
                // As an element, the instance carries the element's own code and name.
                code: element ? element.code.trim() : `${chosen.definitionCode}-${target.code}`,
                name: element
                  ? element.name.trim()
                  : (chosen.detail.split(" · ")[0] ?? chosen.name),
                createElement: element,
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
        toast.add({
          title: `${chosen.name} applied`,
          type: "success",
          description: `${plural(result.targets.filter((t) => t.state === "accepted").length, "element")}, ${plural(seeded, "narrative")} seeded${made ? `, ${plural(made, "element")} created` : ""}.`,
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
          description: `${plural(result.allocations, "element")} allocated.`,
        });
      }
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The library item could not be applied.");
    }
  }
  const needsRationale = source !== "requirement" && !rationale.trim();
  const elementType = elementTypeForComponent(chosen?.componentType ?? "other");
  const elementSpec = (target: SystemAssuranceRow) =>
    elementSpecs[target.id] ?? {
      code: `${target.code}-${chosen?.definitionCode ?? "component"}`.toUpperCase(),
      name: chosen?.detail.split(" · ")[0] ?? chosen?.name ?? "Component",
    };
  const elementSpecsMissing =
    source === "component" &&
    asElement &&
    targets.some((target) => !elementSpec(target).code.trim() || !elementSpec(target).name.trim());
  return (
    <PickerSheet
      open
      onClose={onClose}
      {...(frame === "confirm" ? { onBack: () => setFrame("choose") } : {})}
      title={frame === "choose" ? "Add from library" : `Apply ${chosen?.name ?? ""}`}
      subtitle={
        frame === "choose"
          ? `${element.code} · ${element.name}${controlId ? " · one control" : ""}`
          : `${targets.length} element${targets.length === 1 ? "" : "s"} · version ${chosen?.version ?? ""}`
      }
      width={880}
      {...(frame === "choose"
        ? {
            search: { value: search, onChange: setSearch, placeholder: "Search the library" },
            filters: controlId ? undefined : (
              <Select
                value={source}
                onValueChange={(value) => {
                  setSource((value as Source) ?? "component");
                  setChosenId(null);
                }}
              >
                <SelectTrigger aria-label="Source" size="sm">
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
            ),
          }
        : {})}
      selected={chosen ? 1 : 0}
      total={frame === "choose" ? shown.length : undefined}
      action={
        frame === "choose"
          ? { label: "Continue", onClick: () => setFrame("confirm"), disabled: !chosen }
          : {
              label: busy
                ? "Applying…"
                : source === "requirement"
                  ? `Adopt and allocate to ${targets.length}`
                  : `Apply to ${source === "component" ? willWrite : targets.length}`,
              onClick: () => void submit(),
              disabled:
                busy ||
                needsRationale ||
                elementSpecsMissing ||
                (source === "component" && willWrite === 0),
            }
      }
    >
      {frame === "choose" ? (
        <DataTable
          table={table}
          state={
            [
              definitions,
              revisions,
              definedComponents,
              implementations,
              requirementDefinitions,
            ].some((query) => query.isPending)
              ? "loading"
              : "ready"
          }
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
      ) : (
        <Stack space="space.250" className="p-200">
          <Field>
            <FieldLabel htmlFor="add-from-library-scope">Apply to</FieldLabel>
            <Select
              value={scope}
              onValueChange={(value) => setScope(value === "inside" ? "inside" : "element")}
            >
              <SelectTrigger id="add-from-library-scope">
                <SelectValue>
                  {scope === "element" ? "This element" : "This element and everything inside"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="element">This element</SelectItem>
                <SelectItem value="inside" disabled={inside(element, rows).length === 0}>
                  This element and everything inside
                </SelectItem>
              </SelectContent>
            </Select>
          </Field>
          {source === "component" && (
            <Stack space="space.150">
              <label className="flex items-center gap-075 font-body-small">
                <Checkbox
                  checked={asElement}
                  onCheckedChange={(checked) => setAsElement(checked === true)}
                />
                Create as a child element under each target, carrying the component
              </label>
              {asElement && (
                <Table aria-label="Elements to create">
                  <thead>
                    <Table.Row>
                      <Table.Header width={140}>Under</Table.Header>
                      <Table.Header width={200}>Element code</Table.Header>
                      <Table.Header>Element name</Table.Header>
                      <Table.Header width={120}>Type</Table.Header>
                    </Table.Row>
                  </thead>
                  <tbody>
                    {targets.map((target) => {
                      const spec = elementSpec(target);
                      return (
                        <Table.Row key={target.id}>
                          <Table.Cell>{target.code}</Table.Cell>
                          <Table.Cell>
                            <Input
                              aria-label={`Element code under ${target.code}`}
                              value={spec.code}
                              onChange={(event) =>
                                setElementSpecs((previous) => ({
                                  ...previous,
                                  [target.id]: { ...spec, code: event.target.value },
                                }))
                              }
                            />
                          </Table.Cell>
                          <Table.Cell>
                            <Input
                              aria-label={`Element name under ${target.code}`}
                              value={spec.name}
                              onChange={(event) =>
                                setElementSpecs((previous) => ({
                                  ...previous,
                                  [target.id]: { ...spec, name: event.target.value },
                                }))
                              }
                            />
                          </Table.Cell>
                          <Table.Cell>{labelFor(elementType)}</Table.Cell>
                        </Table.Row>
                      );
                    })}
                  </tbody>
                </Table>
              )}
              <p className="font-body-small text-subtle">
                {plan
                  ? `Narratives are seeded into SSP revision ${plan.version_number} of the boundary for controls in its selection. Untick a cell to leave that control to the element.`
                  : "The boundary has no draft SSP revision, so component instances are recorded but no narrative can be seeded."}
              </p>
              <div className="overflow-x-auto">
                <Table aria-label="What will be written">
                  <thead>
                    <Table.Row>
                      <Table.Header width={220}>Control</Table.Header>
                      <Table.Header width={110}>Coverage</Table.Header>
                      {targets.map((target) => (
                        <Table.Header key={target.id} width={170}>
                          {target.code}
                        </Table.Header>
                      ))}
                    </Table.Row>
                  </thead>
                  <tbody>
                    {claims.map(({ implementation, control }) => (
                      <Table.Row key={implementation.id}>
                        <Table.Cell className="whitespace-normal">
                          <span className="font-medium">{control?.code ?? "Control"}</span>{" "}
                          <span className="text-subtle">{control?.title}</span>
                        </Table.Cell>
                        <Table.Cell>
                          <Badge
                            variant="secondary"
                            size="xsmall"
                            tone={implementation.coverage === "full" ? "success" : "warning"}
                          >
                            {labelFor(implementation.coverage)}
                          </Badge>
                        </Table.Cell>
                        {targets.map((target) => {
                          const state = cellState(target, implementation.control_id!);
                          const key = cellKey(target.id, implementation.control_id!);
                          return (
                            <Table.Cell key={target.id}>
                              {state === "seed" ? (
                                <label className="flex items-center gap-075 font-body-small">
                                  <Checkbox
                                    aria-label={`Seed ${control?.code ?? "control"} on ${target.code}`}
                                    checked={!excluded.has(key)}
                                    onCheckedChange={(checked) =>
                                      setExcluded((previous) => {
                                        const next = new Set(previous);
                                        if (checked) next.delete(key);
                                        else next.add(key);
                                        return next;
                                      })
                                    }
                                  />
                                  {excluded.has(key) ? "Excluded" : "Will seed"}
                                </label>
                              ) : (
                                <span className="font-body-small text-subtle">
                                  {state === "already_applied"
                                    ? "Already applied"
                                    : state === "no_ssp"
                                      ? "No draft SSP"
                                      : "Not in baseline"}
                                </span>
                              )}
                            </Table.Cell>
                          );
                        })}
                      </Table.Row>
                    ))}
                    {!claims.length && (
                      <Table.Row>
                        <Table.Cell colSpan={2 + targets.length}>
                          This component has no control claims; the instance is recorded without
                          narratives.
                        </Table.Cell>
                      </Table.Row>
                    )}
                  </tbody>
                </Table>
              </div>
            </Stack>
          )}
          {source === "profile" && (
            <Stack space="space.100">
              <p className="font-body-small text-subtle">
                {element.name} adopts the profile as its baseline. Elements inside inherit it unless
                they carry their own adoption; tick those to replace it.
              </p>
              {targets.slice(1).map((target) => {
                const own = target.effectiveBaseline?.source_label === "Explicit system adoption";
                return (
                  <Inline key={target.id} space="space.100" alignBlock="center">
                    <span className="font-body-small">
                      {target.code} · {target.name}
                    </span>
                    {own ? (
                      <label className="flex items-center gap-075 font-body-small">
                        <Checkbox
                          checked={replaceAdoption.has(target.id)}
                          onCheckedChange={(checked) =>
                            setReplaceAdoption((previous) => {
                              const next = new Set(previous);
                              if (checked) next.add(target.id);
                              else next.delete(target.id);
                              return next;
                            })
                          }
                        />
                        Replace its own adoption ({target.baselineTitle ?? "baseline"})
                      </label>
                    ) : (
                      <span className="font-body-small text-subtle">Inherits</span>
                    )}
                  </Inline>
                );
              })}
            </Stack>
          )}
          {source === "requirement" && (
            <p className="font-body-small text-subtle">
              One program requirement is created from this definition, or reused when the program
              already adopted this revision, and allocated to {targets.length} element
              {targets.length === 1 ? "" : "s"}.
            </p>
          )}
          <Field>
            <FieldLabel htmlFor="add-from-library-rationale">
              {source === "requirement" ? "Rationale (optional)" : "Rationale"}
            </FieldLabel>
            <Textarea
              id="add-from-library-rationale"
              value={rationale}
              onChange={(event) => setRationale(event.target.value)}
              placeholder="Why this library item applies here"
            />
          </Field>
          {error && (
            <p role="alert" className="font-body-small text-danger">
              {error}
            </p>
          )}
          <Inline>
            <Button variant="subtle" size="small" onClick={() => setFrame("choose")}>
              Choose a different item
            </Button>
          </Inline>
        </Stack>
      )}
    </PickerSheet>
  );
}
