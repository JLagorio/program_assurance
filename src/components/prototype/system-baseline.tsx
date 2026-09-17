import { useId, useMemo, useRef, useState, type FormEvent } from "react";
import { useBlocker } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  Absent,
  Badge,
  Box,
  Button,
  Checkbox,
  DataTable,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Field,
  FieldLabel,
  Inline,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Stack,
  Table,
  Textarea,
  Toolbar,
  defineColumns,
  useDataTable,
  type Preset,
  type Tone,
} from "@ledger/design-system";
import { useWorkspace } from "@/components/app/workspace";
import { database, requireIdentity } from "@/lib/database";
import { useRow, useRows, type Row } from "@/lib/models";
import { labelFor } from "@/lib/records";
import { resolutionChain } from "@/lib/profile-chain";
import { ControlInspector } from "./library-controls";

export type ProfileChoice = {
  id: string;
  /** The option text: the short name, its version, and the base it is tailored from. */
  label: string;
  /** The profile's short name (the stable `profiles.title`); the document's own title is `documentTitle`. */
  title: string;
  documentTitle: string;
  version: string;
  catalogId: string;
  documentId: string;
  catalogDocumentId: string;
  controlIds: string[];
  /** A reference profile on its catalog, or an overlay layered on another profile. */
  kind: "reference" | "overlay";
  baseLabel: string | null;
  depth: number;
};

/** Published, resolved profiles whose import chain ends at one catalog: the ones an element can adopt. */
export function profileChoices(input: {
  resolutions: Row<"profile_resolutions">[];
  profiles: Row<"profile_revisions">[];
  /** The stable profile records, whose `title` is the short name shown for every revision. */
  profileRecords: Row<"profiles">[];
  imports: Row<"profile_imports">[];
  catalogs: Row<"catalog_revisions">[];
  selections: Row<"selected_controls">[];
}): ProfileChoice[] {
  return input.resolutions
    .flatMap((resolution) => {
      if (resolution.state !== "published") return [];
      const profile = input.profiles.find(
        (row) => row.id === resolution.profile_revision_id && row.state === "published",
      );
      const chain = resolutionChain(resolution.id, {
        resolutions: input.resolutions,
        profiles: input.profiles,
        profileRecords: input.profileRecords,
        imports: input.imports,
        catalogs: input.catalogs,
      });
      const catalog = input.catalogs.find(
        (row) => row.id === chain.catalogRevisionId && row.state === "published",
      );
      if (!profile || chain.errors.length || !catalog) return [];
      const controlIds = input.selections
        .filter((row) => row.profile_resolution_id === resolution.id)
        .map((row) => row.control_id);
      // The chain's first hop is this resolution; its title is the short name.
      const title = chain.hops[0]?.title ?? profile.title;
      const base = chain.hops[1];
      return controlIds.length
        ? [
            {
              id: resolution.id,
              label: `${title} · ${profile.version}${base ? ` · tailored from ${base.title}` : ""}`,
              title,
              documentTitle: profile.title,
              version: profile.version,
              catalogId: catalog.id,
              documentId: profile.document_revision_id,
              catalogDocumentId: catalog.document_revision_id,
              controlIds,
              kind: chain.kind,
              baseLabel: base ? `${base.title} · ${base.version}` : null,
              depth: chain.hops.length - 1,
            },
          ]
        : [];
    })
    .sort((a, b) => a.label.localeCompare(b.label));
}

type ControlSource = "From profile" | "Added here" | "Excluded here";
type ControlRow = {
  id: string;
  code: string;
  title: string;
  source: ControlSource;
  rationale: string | null;
  implementation: string;
  requirements: number;
  control: Row<"controls">;
  selectionId: string | undefined;
};

const presets: Preset[] = [
  { id: "all", label: "All controls" },
  {
    id: "changed",
    label: "Changed here",
    filters: [{ id: "source", value: ["Added here", "Excluded here"] }],
  },
  {
    id: "unimplemented",
    label: "No implementation",
    filters: [{ id: "implementation", value: ["Not recorded"] }],
  },
];

const NIL = "00000000-0000-0000-0000-000000000000";

function implementationTone(value: string): Tone {
  const text = value.toLowerCase();
  if (text.startsWith("implemented")) return "success";
  if (text.startsWith("partial")) return "warning";
  if (text.startsWith("planned")) return "information";
  return "neutral";
}

/**
 * The element's Controls tab: the baseline it works from and the effective set, with where each
 * control came from, the boundary SSP's implementation of it, and the requirements mapped to it
 * here. The read model is shared by allocation/mapping and SSP views; no UI fallback guesses.
 */
export function SystemControls({
  systemId,
  readOnly = false,
  onAddFromLibrary,
}: {
  systemId: string;
  readOnly?: boolean | undefined;
  /** Add from library with the target pinned to this control. */
  onAddFromLibrary?: ((controlId: string) => void) | undefined;
}) {
  const workspace = useWorkspace();
  const system = useRow("systems", systemId);
  const effective = useRow("system_effective_baselines", systemId);
  const source = useRow("systems", effective.data?.source_system_id);
  const resolutions = useRows("profile_resolutions");
  const profiles = useRows("profile_revisions");
  const profileRecords = useRows("profiles");
  const imports = useRows("profile_imports");
  const catalogs = useRows("catalog_revisions");
  const selections = useRows("selected_controls");
  const controls = useRows("controls");
  const links = useRows("requirement_control_links", { system_id: systemId });
  const plans = useRows(
    "ssp_revisions",
    { system_id: system.data?.boundary_system_id ?? NIL },
    { enabled: !!system.data },
  );
  const plan = [...(plans.data ?? [])].sort((a, b) => b.version_number - a.version_number)[0];
  const implementations = useRows(
    "implemented_requirements",
    { ssp_revision_id: plan?.id ?? NIL },
    { enabled: !!plan },
  );
  const [editing, setEditing] = useState(false);
  const [inspected, setInspected] = useState<ControlRow | null>(null);
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
  const currentResolution = resolutions.data?.find(
    (row) => row.id === effective.data?.profile_resolution_id,
  );
  const currentProfile = profiles.data?.find(
    (row) => row.id === currentResolution?.profile_revision_id,
  );
  // The effective revision may be a draft overlay absent from `choices`, so name it by its own record.
  const currentTitle = currentProfile
    ? (profileRecords.data?.find((row) => row.id === currentProfile.profile_id)?.title ??
      currentProfile.title)
    : undefined;
  const currentDocument = useRow("oscal_document_revisions", currentProfile?.document_revision_id);
  const resolutionInputs = useRows(
    "profile_resolution_inputs",
    { profile_resolution_id: currentResolution?.id ?? NIL },
    { enabled: !!currentResolution },
  );
  const rules = useRows(
    "profile_rules",
    { profile_revision_id: currentProfile?.id ?? NIL },
    { enabled: !!currentProfile },
  );
  const currentSelections = (selections.data ?? []).filter(
    (row) => row.profile_resolution_id === currentResolution?.id,
  );
  const selected = new Set(currentSelections.map((row) => row.control_id));
  const selectionIdByControl = new Map(currentSelections.map((row) => [row.control_id, row.id]));
  const selectedControls = (controls.data ?? [])
    .filter((row) => selected.has(row.id))
    .sort(controlOrder);
  const publishedSource = choices.find((choice) => choice.id === currentResolution?.id);
  const metadataBase = recordedBaseResolution(currentDocument.data?.metadata);
  const original = currentDocument.data?.original_content;
  const profileBody =
    original && typeof original === "object" && !Array.isArray(original)
      ? original["profile"]
      : null;
  const originalMetadata =
    profileBody && typeof profileBody === "object" && !Array.isArray(profileBody)
      ? profileBody["metadata"]
      : null;
  const lineageSource = choices.find(
    (choice) =>
      choice.id === metadataBase && metadataBase === recordedBaseResolution(originalMetadata),
  );
  const pins = new Set((resolutionInputs.data ?? []).map((row) => row.document_revision_id));
  const draftImports = (imports.data ?? []).filter(
    (row) => row.profile_revision_id === currentProfile?.id,
  );
  // A layered resolution names its base; what differs from that base is what changed here.
  const overlayBase = currentResolution?.base_profile_resolution_id
    ? choices.find((choice) => choice.id === currentResolution.base_profile_resolution_id)
    : undefined;
  const legacyDraftSource =
    currentResolution?.state === "draft" &&
    currentProfile?.state === "draft" &&
    lineageSource &&
    pins.has(currentProfile.document_revision_id) &&
    pins.has(lineageSource.documentId) &&
    pins.has(lineageSource.catalogDocumentId) &&
    draftImports.length === 1 &&
    draftImports[0]?.catalog_revision_id === lineageSource.catalogId &&
    selected.size > 0 &&
    selectedControls.length === selected.size &&
    selectedControls.every((control) => control.catalog_revision_id === lineageSource.catalogId)
      ? lineageSource
      : undefined;
  const verifiedSource = overlayBase ?? legacyDraftSource;
  const editorSource = overlayBase ?? publishedSource ?? verifiedSource;
  const rows = useMemo<ControlRow[]>(() => {
    const controlById = new Map((controls.data ?? []).map((row) => [row.id, row]));
    const selectionControl = new Map(
      (selections.data ?? []).map((row) => [row.id, row.control_id]),
    );
    const implementationByControl = new Map<string, string>();
    for (const implementation of implementations.data ?? []) {
      const controlId = selectionControl.get(implementation.selected_control_id);
      if (controlId) implementationByControl.set(controlId, implementation.implementation_status);
    }
    const revisionsByControl = new Map<string, Set<string>>();
    for (const link of links.data ?? []) {
      const current = revisionsByControl.get(link.control_id) ?? new Set<string>();
      current.add(link.requirement_revision_id);
      revisionsByControl.set(link.control_id, current);
    }
    const base = new Set(verifiedSource?.controlIds ?? []);
    const excludeRules = (rules.data ?? []).filter((rule) => rule.kind === "exclude");
    const exclusionRationale = (control: Row<"controls">) =>
      excludeRules.find((rule) => {
        const definition = rule.definition as { "with-ids"?: unknown } | null;
        const ids = definition?.["with-ids"];
        return Array.isArray(ids) && ids.includes(control.source_id);
      })?.rationale ?? null;
    const toRow = (control: Row<"controls">, sourceKind: ControlSource): ControlRow => ({
      id: control.id,
      code: control.code,
      title: control.title,
      source: sourceKind,
      rationale:
        sourceKind === "Excluded here"
          ? exclusionRationale(control)
          : sourceKind === "Added here"
            ? (system.data?.baseline_rationale ?? null)
            : null,
      implementation: implementationByControl.get(control.id) ?? "Not recorded",
      requirements: revisionsByControl.get(control.id)?.size ?? 0,
      control,
      selectionId: selectionIdByControl.get(control.id),
    });
    return [
      ...selectedControls.map((control) =>
        toRow(control, verifiedSource && !base.has(control.id) ? "Added here" : "From profile"),
      ),
      ...(verifiedSource
        ? [...base]
            .filter((id) => !selected.has(id))
            .flatMap((id) => {
              const control = controlById.get(id);
              return control ? [toRow(control, "Excluded here")] : [];
            })
            .sort((a, b) => controlOrder(a.control, b.control))
        : []),
    ];
    // The selection identity map and the selected list derive from the same queries.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    controls.data,
    selections.data,
    implementations.data,
    links.data,
    rules.data,
    verifiedSource,
    currentResolution?.id,
    system.data?.baseline_rationale,
  ]);
  const columns = useMemo(
    () =>
      defineColumns<ControlRow>((c) => [
        c.id("code", { header: "Control", width: 120, hideable: false }),
        c.text("title", { header: "Title", minWidth: 260, hideable: false }),
        c.status("source", {
          header: "Source",
          width: 140,
          tone: (row) =>
            row.source === "Added here"
              ? "success"
              : row.source === "Excluded here"
                ? "warning"
                : "neutral",
          cell: (row) => (
            <span title={row.rationale ?? undefined}>
              <Badge
                variant="secondary"
                tone={
                  row.source === "Added here"
                    ? "success"
                    : row.source === "Excluded here"
                      ? "warning"
                      : "neutral"
                }
              >
                {row.source}
              </Badge>
            </span>
          ),
        }),
        c.status("implementation", {
          header: "Implementation",
          width: 150,
          tone: (row) => implementationTone(row.implementation),
          cell: (row) =>
            row.implementation === "Not recorded" ? (
              <Absent />
            ) : (
              <Badge variant="secondary" tone={implementationTone(row.implementation)}>
                {labelFor(row.implementation)}
              </Badge>
            ),
        }),
        c.number("requirements", {
          header: "Requirements",
          width: 124,
          cell: (row) => (row.requirements ? String(row.requirements) : <Absent />),
        }),
        c.text("rationale", { header: "Rationale", minWidth: 200, wrap: true }),
        ...(onAddFromLibrary
          ? [
              c.actions((row) =>
                row.source === "Excluded here"
                  ? []
                  : [{ label: "Add from library…", onSelect: () => onAddFromLibrary(row.id) }],
              ),
            ]
          : []),
      ]),
    [onAddFromLibrary],
  );
  const table = useDataTable({
    columns,
    data: rows,
    getRowId: (row) => row.id,
    label: "Controls",
    view: "live-system-controls-v1",
    resizable: true,
    reorderable: true,
    pageSize: 50,
    initialState: { columnVisibility: { rationale: false } },
  });
  const queries = [
    system,
    effective,
    resolutions,
    profiles,
    profileRecords,
    imports,
    catalogs,
    selections,
    controls,
    links,
    plans,
    ...(plan ? [implementations] : []),
    ...(currentProfile ? [currentDocument, rules] : []),
    ...(currentResolution ? [resolutionInputs] : []),
  ];
  const error = queries.find((query) => query.error)?.error;
  const ready = queries.every((query) => query.data !== undefined && !query.error);
  const canEdit =
    !readOnly &&
    workspace.role !== "viewer" &&
    workspace.collections.some((row) => row.name === "systems" && row.can_update);
  const sourceText = effective.data?.inherited
    ? `Inherited from ${source.data ? `${source.data.code} · ${source.data.name}` : "a containing element"}`
    : effective.data?.source_label === "Explicit system adoption"
      ? "Applied here"
      : (effective.data?.source_label ?? "");
  const changeBaseline = canEdit ? (
    <Button
      size="small"
      variant="secondary"
      disabled={!ready || !system.data}
      onClick={() => setEditing(true)}
    >
      Change baseline
    </Button>
  ) : null;
  return (
    <Stack space="space.200">
      <Stack space="space.050">
        <Inline alignBlock="center" space="space.100" shouldWrap>
          <span className="font-body-medium font-medium">
            {currentTitle ?? (ready ? "No baseline" : "Loading baseline…")}
          </span>
          {currentProfile && <span className="font-body-small text-subtle">{sourceText}</span>}
          {currentProfile && (
            <Badge variant="secondary" size="xsmall">
              {selectedControls.length} controls
            </Badge>
          )}
          {overlayBase && (
            <Badge tone="information" variant="secondary" size="xsmall">
              Layered on {overlayBase.title}
            </Badge>
          )}
          {currentResolution?.state === "draft" && (
            <Badge tone="warning" variant="secondary" size="xsmall">
              Draft tailored profile
            </Badge>
          )}
        </Inline>
        {system.data?.baseline_rationale && (
          <p className="whitespace-pre-wrap font-body-small text-subtle">
            {system.data.baseline_rationale}
          </p>
        )}
      </Stack>
      <DataTable
        table={table}
        state={error ? "error" : !ready ? "loading" : "ready"}
        error={error?.message}
        onRowClick={(row) => setInspected(row)}
        empty={{
          illustration: "shield",
          title: "No baseline yet",
          description:
            "Adopt a published profile here, or inherit the baseline of a containing element.",
          action: changeBaseline,
        }}
        toolbar={
          <Toolbar
            search={String(table.state.globalFilter ?? "")}
            onSearch={(value) => table.setGlobalFilter(value)}
            placeholder="Find a control"
            actions={changeBaseline}
          >
            <DataTable.Presets table={table} presets={presets} variant="menu" />
            <DataTable.Columns table={table} />
            <DataTable.Settings table={table} />
          </Toolbar>
        }
      />
      {inspected && (
        <ControlInspector
          key={inspected.id}
          control={inspected.control}
          {...(inspected.selectionId ? { selectionId: inspected.selectionId } : {})}
          onClose={() => setInspected(null)}
        />
      )}
      {editing && system.data && (
        <BaselineDialog
          system={system.data}
          choices={choices}
          controls={controls.data ?? []}
          initialProfileId={editorSource?.id ?? null}
          initialControlIds={editorSource ? [...selected] : []}
          canWrite={canEdit}
          onClose={() => setEditing(false)}
        />
      )}
    </Stack>
  );
}

function recordedBaseResolution(metadata: unknown): string | undefined {
  if (
    !metadata ||
    typeof metadata !== "object" ||
    !("props" in metadata) ||
    !Array.isArray(metadata.props)
  )
    return undefined;
  const references = metadata.props.filter(
    (prop: unknown): prop is { name: string; ns: string; value: string } =>
      !!prop &&
      typeof prop === "object" &&
      "name" in prop &&
      prop.name === "base-resolution-id" &&
      "ns" in prop &&
      prop.ns === "urn:program-assurance:profile-authoring" &&
      "value" in prop &&
      typeof prop.value === "string",
  );
  return references.length === 1 ? references[0]?.value : undefined;
}

function controlOrder(a: Row<"controls">, b: Row<"controls">) {
  return a.code.localeCompare(b.code, undefined, { numeric: true });
}

function BaselineDialog({
  system: initialSystem,
  choices,
  controls,
  initialProfileId,
  initialControlIds,
  canWrite,
  onClose,
}: {
  system: Row<"systems">;
  choices: ProfileChoice[];
  controls: Row<"controls">[];
  initialProfileId: string | null;
  initialControlIds: string[];
  canWrite: boolean;
  onClose: () => void;
}) {
  const workspace = useWorkspace();
  const cache = useQueryClient();
  const fieldId = useId();
  // Keep the opening snapshot for CAS even when a background refetch updates the record.
  const [system] = useState(initialSystem);
  const initial = choices.find((choice) => choice.id === initialProfileId);
  const [mode, setMode] = useState<"adopt" | "inherit">("adopt");
  const [profileId, setProfileId] = useState(initial?.id ?? "");
  const [picked, setPicked] = useState(() => new Set(initialControlIds));
  const [rationale, setRationale] = useState(system.baseline_rationale ?? "");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const inFlight = useRef(false);
  const bypass = useRef(false);
  const receipt = useRef<{ key: string; id: string } | null>(null);
  const chosen = choices.find((choice) => choice.id === profileId);
  const base = new Set(chosen?.controlIds ?? []);
  const added = [...picked].filter((id) => !base.has(id)).length;
  const removed = [...base].filter((id) => !picked.has(id)).length;
  const catalogControls = controls
    .filter((control) => control.catalog_revision_id === chosen?.catalogId)
    .sort(controlOrder);
  const shown = catalogControls.filter(
    (control) =>
      `${control.code} ${control.title}`.toLowerCase().includes(search.toLowerCase()) &&
      (filter === "all" ||
        (filter === "selected" && picked.has(control.id)) ||
        (filter === "changed" && picked.has(control.id) !== base.has(control.id))),
  );
  const close = () => {
    if (inFlight.current) return;
    if (!dirty || window.confirm("Discard this unsaved baseline selection?")) {
      bypass.current = true;
      onClose();
    }
  };
  useBlocker({
    shouldBlockFn: () =>
      inFlight.current ||
      (dirty && !bypass.current && !window.confirm("Discard this unsaved baseline selection?")),
    enableBeforeUnload: () => !bypass.current && (dirty || inFlight.current),
  });
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (inFlight.current || !canWrite) return;
    if (
      mode === "adopt" &&
      (!chosen || !picked.size || ((added || removed) && !rationale.trim()))
    ) {
      setError("Choose a profile, at least one control, and a rationale for tailoring.");
      return;
    }
    const selection =
      mode === "inherit"
        ? { mode }
        : {
            mode,
            catalogRevisionId: chosen!.catalogId,
            profileResolutionId: chosen!.id,
            controlIds: [...picked].sort(),
            rationale: rationale.trim(),
          };
    const key = JSON.stringify(selection);
    if (receipt.current?.key !== key) receipt.current = { key, id: crypto.randomUUID() };
    inFlight.current = true;
    setBusy(true);
    setError("");
    try {
      const token = await requireIdentity(workspace);
      const result = await database()
        .rpc("adopt_system_baseline", {
          p_tenant_id: workspace.tenantId,
          p_system_id: system.id,
          p_expected_revision: system.revision,
          p_request_id: receipt.current!.id,
          p_selection: selection,
        })
        .setHeader("Authorization", `Bearer ${token}`);
      if (result.error)
        throw new Error(
          result.error.code === "PT409"
            ? "This system changed in another session. Your choices are retained; reopen the dialog to load the current system."
            : result.error.message,
        );
      // Descendant inheritance and all profile readers depend on the committed command.
      await Promise.all(
        ["models", "model", "records", "record", "reference-options"].map((prefix) =>
          cache.invalidateQueries({ queryKey: [prefix, workspace.tenantId] }),
        ),
      );
      bypass.current = true;
      inFlight.current = false;
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The baseline could not be saved.");
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }
  return (
    <Dialog
      open
      onOpenChange={(open, details) => {
        if (!open) {
          details.cancel();
          close();
        }
      }}
    >
      <DialogContent style={{ maxWidth: 960 }} showCloseButton={!busy}>
        <DialogHeader>
          <DialogTitle>Change control baseline</DialogTitle>
          <DialogDescription>
            {system.code} · {system.name}
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(event) => void submit(event)}
          className="flex min-h-0 flex-1 flex-col"
          aria-busy={busy}
        >
          <Box padding="space.250" className="min-h-0 flex-1 overflow-y-auto">
            <fieldset disabled={busy || !canWrite}>
              <Stack space="space.200">
                <Field>
                  <FieldLabel htmlFor={`${fieldId}-mode`}>Baseline source</FieldLabel>
                  <Select
                    value={mode}
                    onValueChange={(value) => {
                      setMode(value === "inherit" ? "inherit" : "adopt");
                      setDirty(true);
                    }}
                  >
                    <SelectTrigger id={`${fieldId}-mode`}>
                      <SelectValue>
                        {mode === "adopt"
                          ? "Adopt a profile and tailor controls"
                          : "Use inherited or boundary baseline"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="adopt">Adopt a profile and tailor controls</SelectItem>
                      <SelectItem value="inherit">Use inherited or boundary baseline</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                {mode === "inherit" ? (
                  <p className="font-body-small text-subtle">
                    Remove this system’s explicit adoption. It will use the nearest containing
                    system’s adoption within its authorization boundary, or the boundary’s recorded
                    SSP baseline.
                  </p>
                ) : (
                  <>
                    <Field>
                      <FieldLabel htmlFor={`${fieldId}-profile`}>Base profile</FieldLabel>
                      <Select
                        value={profileId}
                        onValueChange={(value) => {
                          const next = choices.find((choice) => choice.id === value);
                          setProfileId(value ?? "");
                          setPicked(new Set(next?.controlIds ?? []));
                          setDirty(true);
                        }}
                      >
                        <SelectTrigger id={`${fieldId}-profile`}>
                          <SelectValue placeholder="Choose a published profile">
                            {chosen?.label}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {choices.map((choice) => (
                            <SelectItem key={choice.id} value={choice.id}>
                              {choice.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                    {!choices.length && (
                      <p className="font-body-small text-subtle">
                        No published, resolved profiles are available.
                      </p>
                    )}
                    {chosen && (
                      <>
                        <Inline alignBlock="center" spread="space-between" shouldWrap>
                          <p className="font-body-small">
                            {picked.size} selected · {added} added · {removed} removed
                          </p>
                          <Button
                            variant="subtle"
                            size="small"
                            onClick={() => {
                              setPicked(new Set(chosen.controlIds));
                              setDirty(true);
                            }}
                          >
                            Reset to profile controls
                          </Button>
                        </Inline>
                        <p className="font-body-small text-subtle">
                          Control changes publish an OSCAL profile layered on this base. Its
                          parameter values are inherited for selected controls.
                        </p>
                        <Inline space="space.150">
                          <Input
                            className="flex-1"
                            aria-label="Find controls to tailor"
                            placeholder="Find a control by code or title"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                          />
                          <Select
                            value={filter}
                            onValueChange={(value) => setFilter(value ?? "all")}
                          >
                            <SelectTrigger aria-label="Control selection filter">
                              <SelectValue>
                                {filter === "all"
                                  ? "All catalog controls"
                                  : filter === "selected"
                                    ? "Selected controls"
                                    : "Changed controls"}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All catalog controls</SelectItem>
                              <SelectItem value="selected">Selected controls</SelectItem>
                              <SelectItem value="changed">Changed controls</SelectItem>
                            </SelectContent>
                          </Select>
                        </Inline>
                        <Box className="max-h-[20rem] overflow-auto rounded-medium border border-default">
                          <Table>
                            <thead>
                              <Table.Row>
                                <Table.Header style={{ width: 64 }}>Select</Table.Header>
                                <Table.Header style={{ width: 150 }}>Control</Table.Header>
                                <Table.Header>Title</Table.Header>
                                <Table.Header style={{ width: 120 }}>Selection</Table.Header>
                              </Table.Row>
                            </thead>
                            <tbody>
                              {shown.map((control) => (
                                <Table.Row key={control.id}>
                                  <Table.Cell>
                                    <Checkbox
                                      aria-label={`Include ${control.code}`}
                                      checked={picked.has(control.id)}
                                      onCheckedChange={(checked) => {
                                        setPicked((previous) => {
                                          const next = new Set(previous);
                                          if (checked) next.add(control.id);
                                          else next.delete(control.id);
                                          return next;
                                        });
                                        setDirty(true);
                                      }}
                                    />
                                  </Table.Cell>
                                  <Table.Cell>{control.code}</Table.Cell>
                                  <Table.Cell className="whitespace-normal">
                                    {control.title}
                                  </Table.Cell>
                                  <Table.Cell>
                                    {picked.has(control.id) !== base.has(control.id) ? (
                                      <Badge
                                        tone={picked.has(control.id) ? "success" : "warning"}
                                        variant="secondary"
                                      >
                                        {picked.has(control.id) ? "Added" : "Removed"}
                                      </Badge>
                                    ) : base.has(control.id) ? (
                                      "From profile"
                                    ) : (
                                      "Available"
                                    )}
                                  </Table.Cell>
                                </Table.Row>
                              ))}
                              {!shown.length && (
                                <Table.Row>
                                  <Table.Cell colSpan={4}>No matching controls.</Table.Cell>
                                </Table.Row>
                              )}
                            </tbody>
                          </Table>
                        </Box>
                      </>
                    )}
                    <Field>
                      <FieldLabel htmlFor={`${fieldId}-rationale`}>
                        {added || removed ? "Tailoring rationale" : "Adoption rationale (optional)"}
                      </FieldLabel>
                      <Textarea
                        id={`${fieldId}-rationale`}
                        value={rationale}
                        required={!!(added || removed)}
                        onChange={(event) => {
                          setRationale(event.target.value);
                          setDirty(true);
                        }}
                        placeholder="Explain why this control baseline fits the system"
                      />
                    </Field>
                  </>
                )}
                {error && (
                  <p role="alert" className="font-body-small text-danger">
                    {error}
                  </p>
                )}
              </Stack>
            </fieldset>
          </Box>
          <DialogFooter>
            <Button variant="subtle" disabled={busy} onClick={close}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={busy || !canWrite || (mode === "adopt" && (!chosen || !picked.size))}
            >
              {busy ? "Saving…" : mode === "inherit" ? "Use inherited baseline" : "Save baseline"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
