import { ProductCollection } from "./product-collection";
import { useEffect, useId, useMemo, useRef, useState, type FormEvent } from "react";
import {
  Absent,
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Button,
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
  Inline,
  KeyValue,
  Prose,
  RadioGroup,
  RadioGroupItem,
  Section,
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
  type Preset,
} from "@ledger/design-system";
import { ChoiceField, TextField } from "@/components/app/fields";
import { useFormFeedback, type FormIssue } from "@/components/app/form-feedback";
import { StatusBadge } from "@/components/app/status";
import { useDraftGuard } from "@/components/app/use-draft-guard";
import { useWorkspace } from "@/components/app/workspace";
import { useSelectedControls } from "@/lib/control-reads";
import { useAdoptSystemBaseline, type BaselineSelection } from "@/lib/system-baseline";
import { idSet, useRow, useRows, type Row } from "@/lib/models";
import {
  implementationStatuses,
  recordedImplementationStatuses,
  revisionStates,
  type StatusVocabulary,
} from "@/lib/status";
import { resolutionChain } from "@/lib/profile-chain";
import { ControlInspector } from "./library-controls";
import { RecordLink, useDisplayedRecords } from "./record-preview";
import { useCollectionTable } from "./collection-question";
import { EmptyMessage } from "./work-common";

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
  /** What each resolution selects: only its id and control are read. */
  selections: Pick<Row<"selected_controls">, "profile_resolution_id" | "control_id">[];
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

type ControlSource = "profile" | "added" | "excluded";

/** Where a control in the effective set came from, against the base profile it is tailored from. */
const controlSources: StatusVocabulary<ControlSource> = {
  profile: { label: "From profile", tone: "neutral", rank: 0 },
  added: { label: "Added here", tone: "success", rank: 1 },
  excluded: { label: "Excluded here", tone: "warning", rank: 2 },
};

/** What the Controls tab and its preview read of a control: never its stored properties. */
const baselineControlColumns = [
  "id",
  "code",
  "title",
  "source_id",
  "status",
  "catalog_revision_id",
] as const;
type BaselineControl = Pick<Row<"controls">, (typeof baselineControlColumns)[number]>;

type ControlRow = {
  id: string;
  code: string;
  title: string;
  source: ControlSource;
  rationale: string | null;
  /** The stored implementation status, or `unrecorded` where the boundary SSP has none yet. */
  implementation: string;
  requirements: number;
  control: BaselineControl;
  selectionId: string | undefined;
};

const presets: Preset[] = [
  { id: "all", label: "All controls" },
  {
    id: "changed",
    label: "Changed here",
    filters: [{ id: "source", value: ["added", "excluded"] }],
  },
  {
    id: "unimplemented",
    label: "No implementation",
    filters: [{ id: "implementation", value: ["unrecorded"] }],
  },
];

const NIL = "00000000-0000-0000-0000-000000000000";

type BaselineMode = "adopt" | "inherit";

/** The element's current baseline, as the dialog names it before anything changes. */
type BaselineSummary = {
  title: string | undefined;
  source: string;
  count: number;
  state: string | null | undefined;
  layeredOn: string | undefined;
};

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
  const { formatNumber } = useLedgerLocale();
  const system = useRow("systems", systemId);
  const effective = useRow("system_effective_baselines", systemId);
  const source = useRow("systems", effective.data?.source_system_id);
  const resolutions = useRows("profile_resolutions");
  const profiles = useRows("profile_revisions");
  const profileRecords = useRows("profiles");
  const imports = useRows("profile_imports");
  const catalogs = useRows("catalog_revisions");
  // What the published profiles select (the choices, and the base a tailoring is measured
  // against) and what the element's own resolution selects: never every profile's selections.
  const selections = useSelectedControls(
    resolutions.isSuccess && effective.isSuccess
      ? resolutions.data
          .filter(
            (row) => row.state === "published" || row.id === effective.data?.profile_resolution_id,
          )
          .map((row) => row.id)
      : undefined,
    { columns: ["id", "profile_resolution_id", "control_id"] },
  );
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
  // What the element's own resolution selects, kept while its selections are: the sorted controls,
  // the rows and the table's memoized body rows stay put across a render that changes neither.
  const currentResolutionId = currentResolution?.id;
  const { selected, selectionIdByControl } = useMemo(() => {
    const current = (selections.data ?? []).filter(
      (row) => row.profile_resolution_id === currentResolutionId,
    );
    return {
      selected: new Set(current.map((row) => row.control_id)),
      selectionIdByControl: new Map(current.map((row) => [row.control_id, row.id])),
    };
  }, [selections.data, currentResolutionId]);
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
  // A layered resolution names its base; what differs from that base is what changed here.
  const overlayBase = currentResolution?.base_profile_resolution_id
    ? choices.find((choice) => choice.id === currentResolution.base_profile_resolution_id)
    : undefined;
  // The controls the rows name: the element's selection, and the base's (an excluded one too).
  const controls = useRows(
    "controls",
    {
      id: idSet([
        ...selected,
        ...(overlayBase?.controlIds ?? []),
        ...(lineageSource?.controlIds ?? []),
      ]),
    },
    { columns: baselineControlColumns, enabled: selections.isSuccess, keepPrevious: true },
  );
  const selectedControls = useMemo(
    () => (controls.data ?? []).filter((row) => selected.has(row.id)).sort(controlOrder),
    [controls.data, selected],
  );
  const pins = new Set((resolutionInputs.data ?? []).map((row) => row.document_revision_id));
  const draftImports = (imports.data ?? []).filter(
    (row) => row.profile_revision_id === currentProfile?.id,
  );
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
    const exclusionRationale = (control: BaselineControl) =>
      excludeRules.find((rule) => {
        const definition = rule.definition as { "with-ids"?: unknown } | null;
        const ids = definition?.["with-ids"];
        return Array.isArray(ids) && ids.includes(control.source_id);
      })?.rationale ?? null;
    const toRow = (control: BaselineControl, sourceKind: ControlSource): ControlRow => ({
      id: control.id,
      code: control.code,
      title: control.title,
      source: sourceKind,
      rationale:
        sourceKind === "excluded"
          ? exclusionRationale(control)
          : sourceKind === "added"
            ? (system.data?.baseline_rationale ?? null)
            : null,
      implementation: implementationByControl.get(control.id) ?? "unrecorded",
      requirements: revisionsByControl.get(control.id)?.size ?? 0,
      control,
      selectionId: selectionIdByControl.get(control.id),
    });
    return [
      ...selectedControls.map((control) =>
        toRow(control, verifiedSource && !base.has(control.id) ? "added" : "profile"),
      ),
      ...(verifiedSource
        ? [...base]
            .filter((id) => !selected.has(id))
            .flatMap((id) => {
              const control = controlById.get(id);
              return control ? [toRow(control, "excluded")] : [];
            })
            .sort((a, b) => controlOrder(a.control, b.control))
        : []),
    ];
  }, [
    controls.data,
    selections.data,
    implementations.data,
    links.data,
    rules.data,
    verifiedSource,
    selected,
    selectedControls,
    selectionIdByControl,
    system.data?.baseline_rationale,
  ]);
  // The caller's handler is read when the row action runs, so a parent that renders a new function
  // (a tab change on the system record) keeps the columns and every memoized row.
  const addFromLibrary = useRef(onAddFromLibrary);
  addFromLibrary.current = onAddFromLibrary;
  const canAddFromLibrary = !!onAddFromLibrary;
  const columns = useMemo(
    () =>
      defineColumns<ControlRow>((c) => [
        c.id("code", {
          header: "Control",
          width: 120,
          priority: 1,
          hideable: false,
        }),
        c.text("title", {
          header: "Title",
          minWidth: 180,
          priority: 0,
          hideable: false,
          cell: (row) => (
            <RecordLink table="controls" record={row}>
              {row.title}
            </RecordLink>
          ),
        }),
        c.status("source", { header: "Source", width: 140, statuses: controlSources }),
        c.status("implementation", {
          header: "Implementation",
          width: 150,
          // The SSP register's vocabulary: a control nobody has implemented yet is `unrecorded`.
          statuses: recordedImplementationStatuses,
          cell: (row) =>
            row.implementation === "unrecorded" ? (
              <Absent />
            ) : (
              <StatusBadge statuses={implementationStatuses} value={row.implementation} />
            ),
        }),
        c.number("requirements", {
          header: "Requirements",
          width: 124,
          cell: (row) =>
            row.requirements ? String(row.requirements) : <Absent label="None mapped" />,
        }),
        // Why a control was added or excluded: a column the reader can show, and More fields.
        c.text("rationale", { header: "Rationale", minWidth: 200, wrap: true }),
        ...(canAddFromLibrary
          ? [
              c.actions((row) =>
                row.source === "excluded"
                  ? []
                  : [
                      {
                        label: "Add from library…",
                        onSelect: () => addFromLibrary.current?.(row.id),
                      },
                    ],
              ),
            ]
          : []),
      ]),
    [canAddFromLibrary],
  );
  // The preview is the table's, so opening or stepping through it never rebuilds the columns.
  const inspectedId = inspected?.id ?? null;
  const tablePreview = useMemo(
    () => ({ onPreview: (row: ControlRow) => setInspected(row), activeId: inspectedId }),
    [inspectedId],
  );
  // A product collection's page, 25 rows, kept while the rows keep their values.
  const table = useCollectionTable({
    columns,
    preview: tablePreview,
    data: rows,
    getRowId: (row) => row.id,
    rowLabel: (row) => row.code,
    label: "Controls",
    // v2: Source and Implementation filter on stored values, so earlier saved questions do not apply.
    view: "live-system-controls-v2",
    resizable: true,
    reorderable: true,
    initialState: { columnVisibility: { rationale: false } },
  });
  const displayed = useDisplayedRecords(table);
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
  const ready = queries.every((query) => query.data !== undefined && !query.error);
  // Every member but a viewer changes a system's baseline, and row-level security decides each
  // write: the role says it, without the record schema, which is the schema inspector's.
  const canEdit = !readOnly && workspace.role !== "viewer";
  const sourceText = effective.data?.inherited
    ? `Inherited from ${source.data ? `${source.data.code} · ${source.data.name}` : "a containing element"}`
    : effective.data?.source_label === "Explicit system adoption"
      ? "Applied here"
      : (effective.data?.source_label ?? "");
  // An element that adopts nothing itself inherits: the dialog starts where the element is.
  const explicit = effective.data?.source_label === "Explicit system adoption";
  const initialMode: BaselineMode =
    explicit || !effective.data?.profile_resolution_id ? "adopt" : "inherit";
  const state = currentResolution?.state ?? currentProfile?.state;
  const changeBaseline = canEdit ? (
    <Button
      size="small"
      variant="primary"
      disabledReason={!ready || !system.data ? "The baseline is still loading." : undefined}
      onClick={() => setEditing(true)}
    >
      Change control baseline
    </Button>
  ) : null;
  return (
    <Stack space="space.200">
      {/* Provenance above the register, so the fill table stays the tab's last block. */}
      {currentProfile && (
        <Section title="Baseline details" isCollapsible>
          <KeyValue.Group labelWidth="auto">
            <KeyValue label="Profile" wrap>
              {currentTitle}
            </KeyValue>
            <KeyValue label="Source" wrap>
              {sourceText || <Absent />}
            </KeyValue>
            <KeyValue label="Selected controls">{formatNumber(selectedControls.length)}</KeyValue>
            <KeyValue label="State">
              <StatusBadge statuses={revisionStates} value={state} />
            </KeyValue>
            {overlayBase && (
              <KeyValue label="Layered on" wrap>
                {overlayBase.title}
              </KeyValue>
            )}
            {system.data?.baseline_rationale && (
              <KeyValue label="Tailoring rationale" wrap>
                <Prose>{system.data.baseline_rationale}</Prose>
              </KeyValue>
            )}
          </KeyValue.Group>
        </Section>
      )}
      <ProductCollection
        table={table}
        empty={{
          illustration: "shield",
          title: "No baseline yet",
          description:
            "Adopt a published profile here, or inherit the baseline of a containing element.",
          action: changeBaseline,
        }}
        fill
        queries={queries}
        searchLabel="Find a control"
        views={<DataTable.Presets table={table} presets={presets} variant="menu" />}
        action={changeBaseline}
      />
      {inspected && (
        // Not keyed by the control: previous and next keep the panel, its tab and the reader's focus.
        <ControlInspector
          control={inspected.control}
          {...(inspected.selectionId ? { selectionId: inspected.selectionId } : {})}
          records={displayed.map((row) => row.control)}
          onSelect={(control) => {
            const next = displayed.find((row) => row.control.id === control.id);
            if (next) setInspected(next);
          }}
          onClose={() => setInspected(null)}
        />
      )}
      {editing && system.data && (
        <BaselineDialog
          system={system.data}
          choices={choices}
          initialMode={initialMode}
          initialProfileId={editorSource?.id ?? null}
          initialControlIds={editorSource ? [...selected] : []}
          current={
            currentProfile
              ? {
                  title: currentTitle,
                  source: sourceText,
                  count: selectedControls.length,
                  state,
                  layeredOn: overlayBase?.title,
                }
              : null
          }
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

/** One collator for every comparison: `localeCompare` with options builds one per call. */
const codeCollator = new Intl.Collator(undefined, { numeric: true });

/** Controls in code order, numbers by value: AC-2 before AC-10. */
function controlOrder(a: Pick<Row<"controls">, "code">, b: Pick<Row<"controls">, "code">) {
  return codeCollator.compare(a.code, b.code);
}

/** The dialog's fields in the order they appear, which is the order their issues are listed in. */
type BaselineField = "profile" | "controls" | "rationale";
type PickerFilter = "all" | "selected" | "changed";
/** A catalog control in the picker, as the reader sees it: where it stands against the base. */
type PickerRow = { id: string; code: string; title: string; selection: string };
const pickerFilters: { value: PickerFilter; label: string }[] = [
  { value: "all", label: "All catalog controls" },
  { value: "selected", label: "Selected controls" },
  { value: "changed", label: "Changed controls" },
];

function BaselineDialog({
  system: initialSystem,
  choices,
  initialMode,
  initialProfileId,
  initialControlIds,
  current,
  canWrite,
  onClose,
}: {
  system: Row<"systems">;
  choices: ProfileChoice[];
  /** Where the element is today: adopting a profile itself, or inheriting. */
  initialMode: BaselineMode;
  initialProfileId: string | null;
  initialControlIds: string[];
  /** The element's baseline before anything changes, or null when it has none. */
  current: BaselineSummary | null;
  canWrite: boolean;
  /** Called once the dialog has finished closing. */
  onClose: () => void;
}) {
  const { formatNumber } = useLedgerLocale();
  const adopt = useAdoptSystemBaseline();
  const formId = useId();
  // Keep the opening snapshot for CAS even when a background refetch updates the record.
  const [system] = useState(initialSystem);
  const initial = choices.find((choice) => choice.id === initialProfileId);
  const [open, setOpen] = useState(true);
  const [mode, setMode] = useState<BaselineMode>(initialMode);
  const [profileId, setProfileId] = useState<string | null>(initial?.id ?? null);
  const [picked, setPicked] = useState(() => new Set(initialControlIds));
  const [rationale, setRationale] = useState(system.baseline_rationale ?? "");
  const [filter, setFilter] = useState<PickerFilter>("all");
  const [dirty, setDirty] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const receipt = useRef<{ key: string; id: string } | null>(null);
  const adoptRef = useRef<HTMLButtonElement>(null);
  const inheritRef = useRef<HTMLButtonElement>(null);
  const submitRef = useRef<HTMLButtonElement>(null);
  const failureRef = useRef<HTMLDivElement>(null);
  const feedback = useFormFeedback<BaselineField>();
  const guard = useDraftGuard({
    dirty,
    onClose: () => setOpen(false),
    description: "The baseline choices you made will be lost.",
  });
  const chosen = choices.find((choice) => choice.id === profileId);
  const base = useMemo(() => new Set(chosen?.controlIds ?? []), [chosen]);
  const added = [...picked].filter((id) => !base.has(id)).length;
  const removed = [...base].filter((id) => !picked.has(id)).length;
  const tailored = added + removed > 0;
  // The chosen profile's catalog, read when it is chosen: the controls the reader tailors from.
  // Another catalog's controls load under skeleton rows, never as an empty list.
  const catalog = useRows(
    "controls",
    { catalog_revision_id: chosen?.catalogId ?? NIL },
    { columns: ["id", "code", "title", "catalog_revision_id"], enabled: !!chosen },
  );
  const catalogControls = useMemo(
    () =>
      (catalog.data ?? [])
        .filter((control) => control.catalog_revision_id === chosen?.catalogId)
        .sort(controlOrder),
    [catalog.data, chosen?.catalogId],
  );
  // The selection filter narrows the rows before the table; the table's own search does the rest.
  // Each row carries only what the reader sees, so the search never matches a control's uuid.
  const shown = useMemo<PickerRow[]>(
    () =>
      catalogControls.flatMap((control) => {
        const isPicked = picked.has(control.id);
        const inBase = base.has(control.id);
        if (filter === "selected" && !isPicked) return [];
        if (filter === "changed" && isPicked === inBase) return [];
        return [
          {
            id: control.id,
            code: control.code,
            title: control.title,
            selection:
              isPicked !== inBase
                ? isPicked
                  ? "Added"
                  : "Removed"
                : inBase
                  ? "From profile"
                  : "Available",
          },
        ];
      }),
    [catalogControls, filter, picked, base],
  );
  const pickerColumns = useMemo(
    () =>
      defineColumns<PickerRow>((c) => [
        c.id("code", { header: "Control", width: 130, priority: 1 }),
        c.text("title", { header: "Title", priority: 0, minWidth: 180, wrap: true }),
        c.text("selection", { header: "Selection", width: 150, priority: 2, sortable: false }),
      ]),
    [],
  );
  const rowSelection = useMemo(
    () => Object.fromEntries([...picked].map((id) => [id, true as const])),
    [picked],
  );
  const pickerTable = useDataTable({
    columns: pickerColumns,
    data: shown,
    getRowId: (row) => row.id,
    rowLabel: (row) => row.code,
    label: "Controls to tailor",
    selectable: canWrite,
    // A catalog holds about 1,200 controls: only the rows in view are drawn.
    virtualize: true,
    state: { rowSelection },
    onRowSelectionChange: (next) => {
      const changed = typeof next === "function" ? next(rowSelection) : next;
      setPicked(new Set(Object.keys(changed).filter((id) => changed[id])));
      setDirty(true);
    },
  });
  const issues: FormIssue<BaselineField>[] =
    mode === "inherit"
      ? []
      : [
          ...(!chosen
            ? [
                {
                  field: "profile" as const,
                  message: choices.length
                    ? "Choose the profile to adopt."
                    : "No published profile can be adopted yet. Publish a resolved profile first.",
                },
              ]
            : []),
          ...(chosen && !picked.size
            ? [
                {
                  field: "controls" as const,
                  message: "Choose at least one control, or reset to the profile's controls.",
                },
              ]
            : []),
          ...(chosen && tailored && !rationale.trim()
            ? [
                {
                  field: "rationale" as const,
                  message: "Explain why the controls differ from the profile.",
                },
              ]
            : []),
        ];
  // Validate on submit, then on change: each field's error follows the value once submitted.
  const errors = new Map(
    feedback.submitted ? issues.map((issue) => [issue.field, issue.message] as const) : [],
  );
  const primaryLabel = mode === "inherit" ? "Use inherited baseline" : "Change control baseline";

  useEffect(() => {
    if (failure) failureRef.current?.scrollIntoView({ block: "nearest" });
  }, [failure]);

  async function chooseProfile(value: string | null) {
    if (value === profileId) return;
    const next = choices.find((choice) => choice.id === value);
    if (
      chosen &&
      tailored &&
      !(await guard.confirm({
        title: "Change the base profile?",
        description: `The ${added + removed} tailored ${added + removed === 1 ? "change" : "changes"} to ${chosen.title} will be replaced by the controls of ${next?.title ?? "the profile you chose"}. The rationale is kept.`,
        confirmLabel: "Change base profile",
        cancelLabel: "Keep my changes",
        variant: "primary",
      }))
    )
      return;
    setProfileId(value);
    setPicked(new Set(next?.controlIds ?? []));
    setFilter("all");
    setDirty(true);
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (guard.busy || !canWrite) return;
    setFailure(null);
    if (!feedback.report(issues)) return;
    const selection: BaselineSelection =
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
    // The fields lock while the save runs; the primary stays focusable while it loads.
    submitRef.current?.focus();
    if (!guard.start()) return;
    try {
      // The dialog closes once Postgres confirms; every list refreshes behind it.
      await adopt.mutateAsync({
        systemId: system.id,
        expectedRevision: system.revision,
        requestId: receipt.current.id,
        selection,
      });
      toast.add({
        type: "success",
        title: mode === "inherit" ? "Inherited baseline in use" : "Control baseline changed",
        description: `${system.code} · ${system.name}`,
      });
      guard.finish();
      guard.complete();
    } catch (cause) {
      const message = (cause instanceof Error ? cause.message : "The request failed.").replace(
        /[.!?]?$/,
        ".",
      );
      // The conflict message already says the choices are kept; say it once.
      setFailure(
        /kept/.test(message)
          ? message
          : `${message} Your choices are kept, and saving again will not apply the change twice.`,
      );
      guard.finish();
    }
  }
  const pickerEmpty =
    filter === "selected"
      ? {
          title: "No controls selected",
          description: "Choose controls from the whole catalog.",
        }
      : {
          title: "Nothing changed from the profile",
          description: "Every selected control comes from the base profile.",
        };
  return (
    <Dialog
      open={open}
      pending={guard.busy}
      onOpenChange={(next, details) => {
        if (next) return;
        details.cancel();
        void guard.close();
      }}
      onOpenChangeComplete={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogContent
        width="xlarge"
        initialFocus={() =>
          (initialMode === "inherit" ? inheritRef.current : adoptRef.current) ?? true
        }
      >
        <DialogHeader>
          <DialogTitle>Change control baseline</DialogTitle>
          <DialogDescription>
            {system.code} · {system.name}
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          <form id={formId} noValidate onSubmit={(event) => void submit(event)}>
            <Stack space="space.250">
              {failure ? (
                <Alert ref={failureRef} variant="destructive" role="alert">
                  <AlertIcon />
                  <AlertTitle>The baseline was not changed</AlertTitle>
                  <AlertDescription>{failure}</AlertDescription>
                </Alert>
              ) : null}
              {!canWrite ? (
                <Alert role="note">
                  <AlertDescription>
                    An editor, admin, or owner can change the control baseline.
                  </AlertDescription>
                </Alert>
              ) : null}
              <Section title="Current baseline">
                {current ? (
                  <KeyValue.Group labelWidth="wide">
                    <KeyValue label="Profile" wrap>
                      {current.title ?? <Absent />}
                    </KeyValue>
                    <KeyValue label="Source" wrap>
                      {current.source || <Absent />}
                    </KeyValue>
                    <KeyValue label="Selected controls">{formatNumber(current.count)}</KeyValue>
                    <KeyValue label="State">
                      <StatusBadge statuses={revisionStates} value={current.state} />
                    </KeyValue>
                    {current.layeredOn && (
                      <KeyValue label="Layered on" wrap>
                        {current.layeredOn}
                      </KeyValue>
                    )}
                  </KeyValue.Group>
                ) : (
                  <EmptyMessage
                    compact
                    title="No baseline yet"
                    description="This system adopts no profile and inherits none."
                  />
                )}
              </Section>
              <ErrorSummary issues={feedback.summary} focusKey={feedback.attempts} />
              <FieldSet disabled={guard.busy || !canWrite}>
                <Stack space="space.250">
                  <Field>
                    <FieldSet>
                      <FieldLegend variant="label">Baseline source</FieldLegend>
                      <RadioGroup<BaselineMode>
                        value={mode}
                        onValueChange={(value) => {
                          setMode(value);
                          setDirty(true);
                        }}
                      >
                        <Field orientation="horizontal">
                          <RadioGroupItem ref={adoptRef} value="adopt" />
                          <FieldContent>
                            <FieldLabel>Adopt a profile and tailor its controls</FieldLabel>
                            <FieldDescription>
                              Control changes publish an OSCAL profile layered on the base you
                              choose. Its parameter values are inherited for selected controls.
                            </FieldDescription>
                          </FieldContent>
                        </Field>
                        <Field orientation="horizontal">
                          <RadioGroupItem ref={inheritRef} value="inherit" />
                          <FieldContent>
                            <FieldLabel>Use the inherited or boundary baseline</FieldLabel>
                            <FieldDescription>
                              Removes this system’s own adoption. It uses the nearest containing
                              system’s adoption within its authorization boundary, or the boundary’s
                              recorded SSP baseline.
                            </FieldDescription>
                          </FieldContent>
                        </Field>
                      </RadioGroup>
                    </FieldSet>
                  </Field>
                  {mode === "adopt" && (
                    <>
                      <ChoiceField
                        label="Base profile"
                        required
                        value={profileId}
                        options={choices.map((choice) => ({
                          value: choice.id,
                          label: choice.label,
                        }))}
                        onChange={(value) => void chooseProfile(value)}
                        placeholder="Choose a published profile"
                        description={
                          choices.length
                            ? undefined
                            : "No published, resolved profiles are available."
                        }
                        error={errors.get("profile")}
                        controlRef={feedback.ref("profile")}
                      />
                      {chosen && (
                        <Stack space="space.100">
                          <Inline alignBlock="center" spread="space-between" shouldWrap>
                            <Text as="p" size="small">
                              {formatNumber(picked.size)} selected · {formatNumber(added)} added ·{" "}
                              {formatNumber(removed)} removed
                            </Text>
                            <Button
                              ref={feedback.ref("controls")}
                              variant="subtle"
                              size="small"
                              aria-describedby={
                                errors.has("controls") ? `${formId}-controls-error` : undefined
                              }
                              onClick={() => {
                                setPicked(new Set(chosen.controlIds));
                                setDirty(true);
                              }}
                            >
                              Reset to profile controls
                            </Button>
                          </Inline>
                          {errors.has("controls") && (
                            <Text
                              as="p"
                              size="small"
                              color="color.text.danger"
                              id={`${formId}-controls-error`}
                            >
                              {errors.get("controls")}
                            </Text>
                          )}
                          <ProductCollection
                            table={pickerTable}
                            queries={[catalog]}
                            searchLabel="Find controls to tailor"
                            maxHeight={320}
                            keepQuestion={false}
                            narrowed={filter !== "all"}
                            filters={
                              <Select<PickerFilter>
                                items={pickerFilters}
                                value={filter}
                                onValueChange={(value) => setFilter(value ?? "all")}
                              >
                                <SelectTrigger aria-label="Controls shown">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {pickerFilters.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                      {option.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            }
                            empty={{
                              illustration: "search",
                              title: "No controls in this catalog",
                              description: "The profile's catalog has no controls to choose from.",
                              // Only when the Select alone leaves nothing: a search miss inside
                              // it keeps the table's own Nothing matches and Clear filters.
                              ...(filter !== "all" && shown.length === 0
                                ? {
                                    filtered: {
                                      ...pickerEmpty,
                                      action: (
                                        <Button size="small" onClick={() => setFilter("all")}>
                                          Show all catalog controls
                                        </Button>
                                      ),
                                    },
                                  }
                                : {}),
                            }}
                          />
                        </Stack>
                      )}
                      <TextField
                        label={tailored ? "Tailoring rationale" : "Adoption rationale"}
                        required={tailored}
                        multiline
                        value={rationale}
                        onChange={(value) => {
                          setRationale(value);
                          setDirty(true);
                        }}
                        description="Why this control baseline fits the system."
                        error={errors.get("rationale")}
                        controlRef={feedback.ref("rationale")}
                      />
                    </>
                  )}
                </Stack>
              </FieldSet>
            </Stack>
          </form>
        </DialogBody>
        <DialogFooter>
          <DialogClose render={<Button variant="subtle" />}>Cancel</DialogClose>
          <Button
            ref={submitRef}
            type="submit"
            form={formId}
            variant="primary"
            isLoading={guard.busy}
            disabledReason={
              canWrite ? undefined : "An editor, admin, or owner can change the control baseline."
            }
          >
            {primaryLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
      {guard.confirmation}
    </Dialog>
  );
}
