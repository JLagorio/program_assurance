import { ControlProse, controlProseText, useControlPlaceholders } from "./library-controls";
import { ProductCollection } from "./product-collection";
import { RecordLink, useDisplayedRecords, useRemovalFocus, useEndOnHide } from "./record-preview";
import { RecordSummaryPreview } from "./record-summary-preview";
import { QueryState, MissingRecord } from "./work-common";
import { useConfirmation } from "@/components/app/confirmation";
import { useDraftGuard } from "@/components/app/use-draft-guard";
import { ChoiceField, ComboboxField, TextField } from "@/components/app/fields";
import { useFormFeedback, type FormIssue } from "@/components/app/form-feedback";
import { useEffect, useId, useMemo, useRef, useState, type FormEvent } from "react";
import { AlertCircle, MoreHorizontal, Plus } from "lucide-react";
import {
  defineColumns,
  useDataTable,
  Absent,
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
  Badge,
  Button,
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  ErrorSummary,
  FieldSet,
  IconButton,
  Prose,
  Stack,
  Text,
  toast,
} from "@ledger/design-system";
import { useWorkspace } from "@/components/app/workspace";
import { requireIdentity } from "@/lib/database";
import { useMappingParts, useSelectedControls } from "@/lib/control-reads";
import { idSet, useRow, useRows, type Row } from "@/lib/models";
import { SaveOnceConflict, useSaveOnce } from "@/lib/save-once";
import {
  isControlStatement,
  requirementMappingBaselines,
  type MappingBaseline,
} from "@/lib/requirement-control-mappings";
import { useRemoveRequirementLink } from "@/lib/requirement-links";
import { labelFor } from "@/lib/records";

const relationships = [
  { value: "maps_to", label: "Maps to" },
  { value: "derived_from", label: "Derived from" },
  { value: "satisfies", label: "Satisfies" },
] as const;
type Relationship = (typeof relationships)[number]["value"];
const relationshipLabel = (value: string) =>
  relationships.find((item) => item.value === value)?.label ?? labelFor(value);
type ControlChoice = { id: string; label: string };

/** An OSCAL property's value by name, such as a part's `label` ("a."). */
const propValue = (props: unknown, name: string) => {
  if (!Array.isArray(props)) return undefined;
  const prop: unknown = props.find(
    (item: unknown) => !!item && typeof item === "object" && "name" in item && item.name === name,
  );
  return prop && typeof prop === "object" && "value" in prop && typeof prop.value === "string"
    ? prop.value
    : undefined;
};

/** A part and the parts above it that are loaded, from the top of the control down. */
function ancestry(part: Row<"control_parts">, parts: readonly Row<"control_parts">[]) {
  const chain: Row<"control_parts">[] = [];
  let current: Row<"control_parts"> | undefined = part;
  for (let depth = 0; current && depth < 8; depth++) {
    chain.unshift(current);
    const parentId: string | null = current.parent_part_id;
    current = parentId ? parts.find((item) => item.id === parentId) : undefined;
  }
  return chain;
}

/**
 * A statement part as the catalog numbers it: its labels from the top ("a.", then "a.1."), or its
 * title or kind ("Statement") when it has none. Never the part's source id.
 */
function partName(part: Row<"control_parts">, parts: readonly Row<"control_parts">[]) {
  const labels = ancestry(part, parts).flatMap((item) => propValue(item.props, "label") ?? []);
  return labels.length ? labels.join("") : (part.title ?? labelFor(part.name));
}

/**
 * The catalog's reading order: each part's position under every part above it, so an item's
 * sub-items follow it ("d.", "d.1.", "d.2.", then "e.") rather than other items' sub-items.
 */
function byReadingOrder(parts: readonly Row<"control_parts">[]) {
  const places = new Map(
    parts.map((part) => [part.id, ancestry(part, parts).map((item) => item.ordinal)]),
  );
  return (a: Row<"control_parts">, b: Row<"control_parts">) => {
    const first = places.get(a.id) ?? [];
    const second = places.get(b.id) ?? [];
    for (let index = 0; index < Math.max(first.length, second.length); index++) {
      // A part comes before the parts under it.
      const difference = (first[index] ?? -1) - (second[index] ?? -1);
      if (difference) return difference;
    }
    return (a.source_id ?? "").localeCompare(b.source_id ?? "", undefined, { numeric: true });
  };
}
/** What a mapping reads of a selected control: its profile and its control. */
const selectionColumns = ["id", "profile_resolution_id", "control_id"] as const;
type Selection = Pick<Row<"selected_controls">, (typeof selectionColumns)[number]>;

type ExistingMapping = {
  link: Row<"requirement_control_links">;
  control?: ControlChoice | undefined;
  part?: Row<"control_parts"> | undefined;
  /** The recorded part's control's parts, which number it. */
  parts?: readonly Row<"control_parts">[] | undefined;
};

export function RequirementControlMappings({
  programId,
  requirementId,
  contentId,
  readOnly = false,
}: {
  programId: string;
  requirementId: string;
  contentId: string;
  readOnly?: boolean;
}) {
  const workspace = useWorkspace();
  const identity = useRow("engineering_requirements", requirementId);
  const content = useRow("requirement_revisions", contentId);
  const links = useRows("requirement_control_links", { requirement_revision_id: contentId });
  const systems = useRows("systems", { program_id: programId });
  const systemIds = useMemo(() => idSet(systems.data?.map((row) => row.id)), [systems.data]);
  const baselines = useRows(
    "system_effective_baselines",
    { system_id: systemIds },
    { enabled: systems.isSuccess },
  );
  const allocations = useRows("requirement_allocations", { requirement_revision_id: contentId });
  // The selections the mappings record, to tell whether each is still in its system's profile.
  const recorded = useRows(
    "selected_controls",
    { id: idSet(links.data?.map((link) => link.selected_control_id)) },
    { columns: selectionColumns, enabled: links.isSuccess },
  );
  const targetIds = useMemo(
    () => (links.data ?? []).flatMap((link) => link.control_part_id ?? []).sort(),
    [links.data],
  );
  const parts = useMappingParts(targetIds);
  // The parameters and choices of the mapped controls alone, whose statements the rows quote.
  const placeholders = useControlPlaceholders(
    useMemo(() => ({ controlIds: links.data?.map((link) => link.control_id) }), [links.data]),
  );
  const remove = useRemoveRequirementLink();
  const { confirm, confirmation } = useConfirmation();
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<ExistingMapping | null>(null);
  const context = useMemo(
    () =>
      requirementMappingBaselines({
        systems: systems.data ?? [],
        baselines: baselines.data ?? [],
        allocations: allocations.data ?? [],
      }),
    [systems.data, baselines.data, allocations.data],
  );
  // What each allocated system's profile selects: the controls a new mapping chooses from.
  const offered = useSelectedControls(
    systems.isSuccess && baselines.isSuccess && allocations.isSuccess
      ? context.sources.map((source) => source.resolutionId)
      : undefined,
    { columns: selectionColumns },
  );
  // The controls a mapping names or may name: the recorded ones and the allocated profiles'.
  const controls = useRows(
    "controls",
    {
      id: idSet([
        ...(links.data ?? []).map((link) => link.control_id),
        ...(offered.data ?? []).map((row) => row.control_id),
      ]),
    },
    { columns: ["id", "code", "title"], enabled: links.isSuccess && offered.isSuccess },
  );
  const choices = useMemo<ControlChoice[]>(
    () =>
      (controls.data ?? [])
        .map((control) => ({ id: control.id, label: `${control.code} · ${control.title}` }))
        .sort((a, b) => a.label.localeCompare(b.label, undefined, { numeric: true })),
    [controls.data],
  );
  const queries = [
    identity,
    content,
    links,
    controls,
    systems,
    baselines,
    allocations,
    recorded,
    offered,
    parts,
  ];
  const ready = queries.every((query) => query.data !== undefined && !query.error);
  const valid =
    identity.data?.program_id === programId &&
    content.data?.engineering_requirement_id === requirementId;
  // Every member but a viewer maps the workspace's own requirements, and row-level security
  // decides each write: the role says it, so the tab does not load the record schema.
  const writer = !readOnly && workspace.role !== "viewer" && valid;
  const writable = writer;
  const canEdit = writer;
  const canRemove = writer;
  const requirementCode = identity.data?.code ?? "Requirement";
  const sourceText = context.allocated
    ? "Choose an allocated system and a control from its effective profile."
    : "Allocate this requirement to a system before adding a system control mapping.";
  const [previewId, setPreviewId] = useState<string>();
  // A preview belongs to its tab: it ends when the record's tab hides this collection.
  useEndOnHide(() => setPreviewId(undefined));
  const rows = useMemo(
    () =>
      (links.data ?? []).map((link) => {
        const control = controls.data?.find((row) => row.id === link.control_id);
        const part = parts.data?.find((row) => row.id === link.control_part_id);
        const system = systems.data?.find((row) => row.id === link.system_id);
        const selection = recorded.data?.find((row) => row.id === link.selected_control_id);
        const baseline = baselines.data?.find((row) => row.system_id === link.system_id);
        return {
          ...link,
          name: control ? `${control.code} · ${control.title}` : "Control unavailable",
          control,
          part,
          coverage: !link.control_part_id
            ? "Whole control"
            : part
              ? partName(part, parts.data ?? [])
              : "Target unavailable",
          systemName: system ? `${system.code} · ${system.name}` : "Catalog reference",
          needsReview:
            !!link.control_part_id && (!part || !isControlStatement(part, parts.data ?? [])),
          outdated:
            !!link.system_id &&
            selection?.profile_resolution_id !== baseline?.profile_resolution_id,
        };
      }),
    [links.data, controls.data, parts.data, systems.data, recorded.data, baselines.data],
  );
  type MappingRow = (typeof rows)[number];
  const focus = useRemovalFocus(rows);
  const edit = (row: MappingRow) =>
    setEditing({
      link: row,
      part: row.part,
      parts: parts.data,
      control: row.control ? { id: row.control.id, label: row.name } : undefined,
    });
  async function removeMapping(row: MappingRow) {
    const where = row.system_id ? ` on ${row.systemName}` : "";
    const removed = await confirm({
      title: "Remove control mapping?",
      description: `${requirementCode} will no longer record that it ${relationshipLabel(row.relationship_type).toLowerCase()} ${row.name}${where}. The mapping's rationale is removed with it.`,
      confirmLabel: "Remove control mapping",
      variant: "danger",
      failureTitle: "The control mapping was not removed",
      action: () => {
        focus.removed(row.id);
        return remove.mutateAsync({
          table: "requirement_control_links",
          id: row.id,
          revision: row.revision,
        });
      },
    });
    if (!removed) return;
    setPreviewId((current) => (current === row.id ? undefined : current));
    toast.add({
      type: "success",
      title: "Control mapping removed",
      description: `${requirementCode} no longer maps to ${row.name}${where}.`,
    });
  }
  const columns = useMemo(
    () =>
      defineColumns<MappingRow>((c) => [
        c.id("name", {
          header: "Control",
          priority: 0,
          minWidth: 200,
          cell: (row) => (
            <RecordLink table="requirement_control_links" record={row}>
              {row.name}
            </RecordLink>
          ),
        }),
        c.text("coverage", {
          header: "Coverage",
          minWidth: 200,
          cell: (row) => (
            <Stack space="space.050">
              <span>{row.coverage}</span>
              {row.part?.prose && (
                <ControlProse
                  text={row.part.prose}
                  controlId={row.part.control_id}
                  placeholders={placeholders}
                  size="small"
                  as="p"
                />
              )}
              {row.needsReview && (
                <>
                  <Badge tone="warning" variant="secondary">
                    Needs review
                  </Badge>
                  <Text as="p" size="small" color="color.text.subtle">
                    This mapping points to an unavailable or non-statement target. Review its
                    control coverage.
                  </Text>
                </>
              )}
            </Stack>
          ),
        }),
        c.text("systemName", {
          header: "System",
          minWidth: 180,
          cell: (row) => (
            <Stack space="space.050">
              <span>{row.systemName}</span>
              {row.outdated && (
                <Badge tone="warning" variant="secondary">
                  Earlier profile selection
                </Badge>
              )}
            </Stack>
          ),
        }),
        c.text("relationship_type", {
          header: "Relationship",
          width: 150,
          cell: (row) => relationshipLabel(row.relationship_type),
        }),
        c.text("rationale", { header: "Rationale", minWidth: 200, wrap: true }),
        ...(canEdit || canRemove
          ? [
              c.actions((row: MappingRow) => [
                ...(canEdit ? [{ label: "Edit control mapping", onSelect: () => edit(row) }] : []),
                ...(canRemove
                  ? [
                      {
                        label: "Remove control mapping",
                        tone: "danger" as const,
                        onSelect: () => void removeMapping(row),
                      },
                    ]
                  : []),
              ]),
            ]
          : []),
      ]),
    // edit and removeMapping read the row they are given.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [canEdit, canRemove, requirementCode, placeholders],
  );
  // The preview is the table's, so opening or stepping through it never rebuilds the columns.
  const tablePreview = useMemo(
    () => ({ onPreview: (row: MappingRow) => setPreviewId(row.id), activeId: previewId ?? null }),
    [previewId],
  );
  const table = useDataTable({
    columns,
    data: rows,
    getRowId: (row) => row.id,
    preview: tablePreview,
    rowLabel: (row) => row.name,
    label: "Requirement control mappings",
    view: "requirement-control-mappings",
    resizable: true,
    reorderable: true,
  });
  const displayed = useDisplayedRecords(table);
  const preview = rows.find((row) => row.id === previewId);
  const unavailable = !ready
    ? queries.some((query) => query.isError)
      ? "The control mappings could not be loaded. Retry loading them first."
      : "The control mappings are still loading."
    : !context.sources.length
      ? context.allocated
        ? "Adopt a resolved profile on an allocated system before mapping a control."
        : "Allocate this requirement to a system before mapping a control."
      : undefined;
  const action = writable ? (
    <Button
      ref={(node: HTMLButtonElement | null) => {
        focus.target.current = node;
      }}
      size="small"
      variant="primary"
      iconBefore={<Plus />}
      disabledReason={unavailable}
      onClick={() => setAdding(true)}
    >
      Map control
    </Button>
  ) : undefined;
  const previewEditable = canEdit && ready;
  return (
    <Stack space="space.200">
      <QueryState queries={[identity, content]}>
        {valid ? (
          <ProductCollection
            fill
            table={table}
            queries={queries}
            searchLabel="Find a control mapping"
            action={action}
            empty={{
              illustration: "shield",
              title: "No control mappings yet",
              description: context.sources.length
                ? "Map a control to record how this requirement supports it."
                : context.allocated
                  ? "Adopt a resolved profile on an allocated system before mapping a control."
                  : "Allocate this requirement to a system before mapping a control.",
            }}
          />
        ) : (
          <MissingRecord inline kind="Requirement" backTo="/programs" />
        )}
      </QueryState>
      {preview && (
        <RecordSummaryPreview
          model="requirement_control_links"
          record={preview}
          rows={displayed}
          onSelect={(row) => setPreviewId(row.id)}
          onClose={() => setPreviewId(undefined)}
          fields={[
            { key: "coverage" },
            { key: "systemName", label: "System" },
            {
              key: "relationship_type",
              label: "Relationship",
              render: (row) => relationshipLabel(row.relationship_type),
            },
            {
              key: "rationale",
              render: (row) => (row.rationale ? <Prose>{row.rationale}</Prose> : <Absent />),
            },
          ]}
          recordActions={
            previewEditable || canRemove ? (
              <>
                {previewEditable ? (
                  <Button size="small" variant="primary" onClick={() => edit(preview)}>
                    Edit control mapping
                  </Button>
                ) : null}
                {canRemove ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <IconButton
                          size="small"
                          variant="subtle"
                          label="Control mapping actions"
                          icon={<MoreHorizontal />}
                        />
                      }
                    />
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        variant="danger"
                        onClick={() => void removeMapping(preview)}
                      >
                        Remove control mapping
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : null}
              </>
            ) : undefined
          }
        />
      )}
      {(adding || editing) && (
        <MappingDialog
          key={editing?.link.id ?? "new"}
          contentId={contentId}
          requirementCode={requirementCode}
          choices={choices}
          sources={context.sources}
          selections={offered.data ?? []}
          links={links.data ?? []}
          canWrite={!!(editing ? canEdit : writable) && ready}
          initial={editing ?? undefined}
          sourceText={sourceText}
          onClose={() => {
            setAdding(false);
            setEditing(null);
          }}
        />
      )}
      {confirmation}
    </Stack>
  );
}

/** The most a mapping's rationale may hold. */
const RATIONALE_LIMIT = 10000;
/** The form's fields in the order they appear, which is the order their issues are listed in. */
const mappingFields = ["system", "control", "statement", "relationship", "rationale"] as const;
type MappingField = (typeof mappingFields)[number];

function MappingDialog({
  contentId,
  requirementCode,
  choices,
  sources,
  selections,
  links,
  canWrite,
  sourceText,
  initial,
  onClose,
}: {
  contentId: string;
  requirementCode: string;
  choices: ControlChoice[];
  sources: MappingBaseline[];
  selections: Selection[];
  links: Row<"requirement_control_links">[];
  canWrite: boolean;
  sourceText: string;
  initial?: ExistingMapping | undefined;
  onClose: () => void;
}) {
  const workspace = useWorkspace();
  // The mapping's id is chosen once, so saving again after an uncertain answer never duplicates it.
  const save = useSaveOnce("requirement_control_links");
  const formId = useId();
  const feedback = useFormFeedback<MappingField>();
  const [open, setOpen] = useState(true);
  const [mappingId] = useState(() => initial?.link.id ?? crypto.randomUUID());
  const [controlId, setControlId] = useState(initial?.control?.id ?? "");
  // The parameters and choices of the chosen control alone, whose statements the form quotes.
  const placeholders = useControlPlaceholders(
    useMemo(() => ({ controlIds: controlId ? [controlId] : [] }), [controlId]),
  );
  const [systemId, setSystemId] = useState(
    initial ? (initial.link.system_id ?? "") : sources.length === 1 ? sources[0]!.systemId : "",
  );
  const [partId, setPartId] = useState(initial?.link.control_part_id ?? "");
  const [relationship, setRelationship] = useState<Relationship>(
    (initial?.link.relationship_type as Relationship) ?? "maps_to",
  );
  const [rationale, setRationale] = useState(initial?.link.rationale ?? "");
  const [dirty, setDirty] = useState(false);
  const [targetDirty, setTargetDirty] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const saved = useRef(false);
  const submitRef = useRef<HTMLButtonElement>(null);
  const failureRef = useRef<HTMLDivElement>(null);
  const guard = useDraftGuard({
    dirty,
    onClose: () => setOpen(false),
    description: initial
      ? "The changes you made to this control mapping will be lost."
      : "The control mapping you started will be lost.",
  });
  const parts = useRows("control_parts", { control_id: controlId }, { enabled: !!controlId });
  const statements = (parts.data ?? [])
    .filter((part) => isControlStatement(part, parts.data ?? []))
    .sort(byReadingOrder(parts.data ?? []))
    .map((part) => ({
      id: part.id,
      name: partName(part, parts.data ?? []),
      part,
    }));
  const preserveTarget = !!initial && !targetDirty;
  const chosenSystem = sources.find((source) => source.systemId === systemId);
  const selected = selections.filter(
    (row) => row.profile_resolution_id === chosenSystem?.resolutionId,
  );
  const availableControls = choices.filter((choice) =>
    selected.some((row) => row.control_id === choice.id),
  );
  const chosenControl = availableControls.find((choice) => choice.id === controlId);
  const selectedControl = selected.find((row) => row.control_id === controlId);
  const displayedControl =
    chosenControl ?? (initial?.control?.id === controlId ? initial.control : null);
  // The recorded control stays named while it is not in the chosen system's profile; choosing it
  // again still asks for one from the profile.
  const controlOptions = [
    ...availableControls.map((choice) => ({ value: choice.id, label: choice.label })),
    ...(displayedControl && !chosenControl
      ? [
          {
            value: displayedControl.id,
            label: displayedControl.label,
            detail: "Recorded; not in this system's profile",
          },
        ]
      : []),
  ];
  const chosenPart = statements.find((statement) => statement.id === partId);
  const duplicate = links.some(
    (link) =>
      link.id !== mappingId &&
      link.control_id === controlId &&
      link.system_id === (systemId || null) &&
      link.control_part_id === (partId || null) &&
      link.relationship_type === relationship,
  );
  // Every issue with the values, in field order. A recorded target that was not changed is kept.
  const issues: FormIssue<MappingField>[] = [
    ...(!preserveTarget && !chosenSystem
      ? [{ field: "system" as const, message: "Choose an allocated system." }]
      : []),
    ...(!preserveTarget && (!chosenControl || !selectedControl)
      ? [
          {
            field: "control" as const,
            message: "Choose a control from the system's effective profile.",
          },
        ]
      : []),
    ...(!preserveTarget && partId && !chosenPart && !parts.error
      ? [
          {
            field: "statement" as const,
            message: "Choose a statement of this control, or clear it to map the whole control.",
          },
        ]
      : []),
    ...(duplicate
      ? [
          {
            field: "relationship" as const,
            message: "This control target already has that relationship for this system.",
          },
        ]
      : []),
    ...(rationale.length > RATIONALE_LIMIT
      ? [
          {
            field: "rationale" as const,
            message: "Shorten the rationale to 10,000 characters or fewer.",
          },
        ]
      : []),
  ];
  const errors = new Map(
    feedback.submitted ? issues.map((issue) => [issue.field, issue.message] as const) : [],
  );
  const unavailable = canWrite
    ? undefined
    : "An editor, admin, or owner can change the control mappings once they have loaded.";
  const changed = () => setDirty(true);
  useEffect(() => {
    if (failure) failureRef.current?.scrollIntoView({ block: "nearest" });
  }, [failure]);
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (guard.busy || !canWrite) return;
    setFailure(null);
    if (!feedback.report(issues)) return;
    submitRef.current?.focus();
    if (!guard.start()) return;
    const authored = {
      requirement_revision_id: contentId,
      control_id: preserveTarget ? initial!.link.control_id : controlId,
      control_part_id: preserveTarget ? initial!.link.control_part_id : partId || null,
      system_id: preserveTarget ? initial!.link.system_id : systemId,
      selected_control_id: preserveTarget ? initial!.link.selected_control_id : selectedControl!.id,
      relationship_type: relationship,
      rationale: rationale.trim() || null,
    };
    try {
      try {
        await save.mutateAsync({
          id: mappingId,
          values: authored,
          revision: initial?.link.revision,
        });
      } catch (cause) {
        if (cause instanceof SaveOnceConflict)
          throw new Error(
            cause.reason === "missing"
              ? "This mapping is no longer available. Your draft is retained."
              : "This mapping changed in another session. Your draft is retained; reopen the mapping to load its current values.",
          );
        throw cause;
      }
      await requireIdentity(workspace);
      saved.current = true;
      guard.finish();
      guard.complete();
    } catch (cause) {
      setFailure(
        `${cause instanceof Error ? cause.message : "The control mapping could not be saved."} Your choices are kept, and saving again will not make a duplicate.`,
      );
      guard.finish();
    }
  }
  const targetName = displayedControl?.label ?? initial?.control?.label ?? "the chosen control";
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
        if (next) return;
        if (saved.current)
          toast.add({
            type: "success",
            title: initial ? "Control mapping edited" : "Control mapped",
            description: `${requirementCode} ${relationshipLabel(relationship).toLowerCase()} ${targetName}.`,
          });
        onClose();
      }}
    >
      <DialogContent width="large" initialFocus={() => feedback.node("system") ?? true}>
        <DialogHeader>
          <DialogTitle>{initial ? "Edit control mapping" : "Map control"}</DialogTitle>
          <DialogDescription>
            {requirementCode} · {sourceText}
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          <form id={formId} noValidate onSubmit={(event) => void submit(event)}>
            <Stack space="space.200">
              {!canWrite ? (
                <Alert role="note">
                  <AlertDescription>{unavailable}</AlertDescription>
                </Alert>
              ) : null}
              {parts.error ? (
                <Alert variant="destructive" role="alert">
                  <AlertCircle aria-hidden />
                  <AlertTitle>The control's statements could not be loaded</AlertTitle>
                  <AlertDescription>{parts.error.message}</AlertDescription>
                  <AlertAction>
                    <Button size="small" onClick={() => void parts.refetch()}>
                      Retry loading statements
                    </Button>
                  </AlertAction>
                </Alert>
              ) : null}
              {failure ? (
                <Alert ref={failureRef} variant="destructive" role="alert">
                  <AlertCircle aria-hidden />
                  <AlertTitle>
                    {initial ? "The control mapping was not edited" : "The control was not mapped"}
                  </AlertTitle>
                  <AlertDescription>{failure}</AlertDescription>
                </Alert>
              ) : null}
              {initial && (!chosenControl || (!!partId && !chosenPart)) ? (
                <Alert role="note">
                  <AlertDescription>
                    Recorded target: {initial.control?.label ?? "Control unavailable"} —{" "}
                    {initial.link.control_part_id
                      ? initial.part
                        ? partName(initial.part, initial.parts ?? [])
                        : "Target unavailable"
                      : "Whole control"}
                    . Choose a system and a control from its effective profile to change it.
                  </AlertDescription>
                </Alert>
              ) : null}
              <ErrorSummary issues={feedback.summary} focusKey={feedback.attempts} />
              <FieldSet disabled={guard.busy || !canWrite}>
                <Stack space="space.200">
                  <ChoiceField
                    label="System"
                    value={systemId || null}
                    options={sources.map((source) => ({
                      value: source.systemId,
                      label: source.systemName,
                    }))}
                    onChange={(value) => {
                      setTargetDirty(true);
                      setSystemId(value ?? "");
                      setControlId("");
                      setPartId("");
                      changed();
                    }}
                    required
                    placeholder={
                      initial && !systemId ? "Catalog reference" : "Choose an allocated system"
                    }
                    description={
                      chosenSystem
                        ? `${chosenSystem.inherited ? "Inherited profile" : "System profile"} · ${chosenSystem.source}`
                        : undefined
                    }
                    error={errors.get("system")}
                    controlRef={feedback.ref("system")}
                  />
                  <ComboboxField
                    label="Control"
                    value={controlId || null}
                    options={controlOptions}
                    onChange={(value) => {
                      setTargetDirty(true);
                      setControlId(value ?? "");
                      setPartId("");
                      changed();
                    }}
                    required
                    placeholder="Find a control by code or title"
                    noun="controls"
                    emptyMessage="No matching controls in this system's profile."
                    error={errors.get("control")}
                    controlRef={feedback.ref("control")}
                  />
                  <ComboboxField
                    label="Statement or item"
                    value={partId || null}
                    options={statements.map((statement) => ({
                      value: statement.id,
                      label: statement.name,
                      detail: statement.part.prose
                        ? controlProseText(statement.part.prose, controlId, placeholders)
                        : statement.part.prose,
                    }))}
                    onChange={(value) => {
                      setTargetDirty(true);
                      setPartId(value ?? "");
                      changed();
                    }}
                    readOnly={!chosenControl}
                    placeholder="Whole control"
                    noun="statements"
                    emptyMessage="No matching statement prose for this control."
                    loading={!!controlId && parts.isPending && parts.fetchStatus !== "idle"}
                    loadError={parts.error ? parts.error.message : undefined}
                    onRetry={() => void parts.refetch()}
                    description={
                      chosenPart ? (
                        <ControlProse
                          text={chosenPart.part.prose ?? ""}
                          controlId={controlId}
                          placeholders={placeholders}
                        />
                      ) : !chosenControl ? (
                        "Choose a control first. Its statements and items narrow the coverage."
                      ) : parts.isSuccess && !statements.length ? (
                        "This control has no recorded statement prose, so the mapping covers the whole control."
                      ) : (
                        "Leave it empty to map the whole control, or choose an item to narrow the coverage."
                      )
                    }
                    error={errors.get("statement")}
                    controlRef={feedback.ref("statement")}
                  />
                  <ChoiceField
                    label="Relationship"
                    value={relationship}
                    options={relationships.map((item) => ({
                      value: item.value,
                      label: item.label,
                    }))}
                    onChange={(value) => {
                      if (relationships.some((item) => item.value === value)) {
                        setRelationship(value as Relationship);
                        changed();
                      }
                    }}
                    required
                    error={errors.get("relationship")}
                    controlRef={feedback.ref("relationship")}
                  />
                  <TextField
                    label="Rationale"
                    value={rationale}
                    onChange={(value) => {
                      setRationale(value);
                      changed();
                    }}
                    multiline
                    rows={3}
                    characterLimit={RATIONALE_LIMIT}
                    error={errors.get("rationale")}
                    controlRef={feedback.ref("rationale")}
                  />
                  <Text as="p" size="small" color="color.text.subtle">
                    This records traceability to the system’s selected control. Implementation
                    narratives and evidence are recorded separately in its SSP.
                  </Text>
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
            disabledReason={unavailable}
          >
            {initial ? "Edit control mapping" : "Map control"}
          </Button>
        </DialogFooter>
      </DialogContent>
      {guard.confirmation}
    </Dialog>
  );
}
