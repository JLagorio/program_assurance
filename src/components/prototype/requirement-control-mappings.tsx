import { ProductCollection } from "./product-collection";
import { RecordLink, useDisplayedRecords, useRemovalFocus } from "./record-preview";
import { RecordSummaryPreview } from "./record-summary-preview";
import { QueryState, MissingRecord } from "./work-common";
import { useConfirmation } from "@/components/app/confirmation";
import { useDraftGuard } from "@/components/app/use-draft-guard";
import { ChoiceField, TextField } from "@/components/app/fields";
import { useFormFeedback, type FormIssue } from "@/components/app/form-feedback";
import { useEffect, useId, useMemo, useRef, useState, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
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
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
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
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
  FieldSet,
  IconButton,
  Prose,
  Stack,
  Text,
  toast,
} from "@ledger/design-system";
import { useWorkspace } from "@/components/app/workspace";
import { database, requireIdentity } from "@/lib/database";
import { useModelSave, useRow, useRows, type Row } from "@/lib/models";
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
type ExistingMapping = {
  link: Row<"requirement_control_links">;
  control?: ControlChoice | undefined;
  part?: Row<"control_parts"> | undefined;
};

/** Load the complete ancestry of existing targets, including invalid legacy mappings. */
function useMappingParts(ids: string[]) {
  const workspace = useWorkspace();
  return useQuery({
    queryKey: ["requirement-mapping-parts", workspace.tenantId, ids],
    retry: false,
    queryFn: async ({ signal }) => {
      if (!ids.length) return [] as Row<"control_parts">[];
      const token = await requireIdentity(workspace);
      const targets: Row<"control_parts">[] = [];
      for (let offset = 0; offset < ids.length; offset += 100) {
        const { data, error } = await database()
          .from("control_parts")
          .select()
          .in("id", ids.slice(offset, offset + 100))
          .setHeader("Authorization", `Bearer ${token}`)
          .abortSignal(signal);
        if (error) throw new Error(error.message);
        targets.push(...data);
      }
      const controlIds = [...new Set(targets.flatMap((part) => part.control_id ?? []))];
      const parts = new Map(targets.map((part) => [part.id, part]));
      for (let offset = 0; offset < controlIds.length; offset += 100) {
        for (let page = 0; ; page += 1000) {
          const { data, error } = await database()
            .from("control_parts")
            .select()
            .in("control_id", controlIds.slice(offset, offset + 100))
            .order("id")
            .range(page, page + 999)
            .setHeader("Authorization", `Bearer ${token}`)
            .abortSignal(signal);
          if (error) throw new Error(error.message);
          data.forEach((part) => parts.set(part.id, part));
          if (data.length < 1000) break;
        }
      }
      return [...parts.values()];
    },
  });
}

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
  const controls = useRows("controls");
  const systems = useRows("systems", { program_id: programId });
  const baselines = useRows("system_effective_baselines");
  const allocations = useRows("requirement_allocations", { requirement_revision_id: contentId });
  const selections = useRows("selected_controls");
  const targetIds = useMemo(
    () => (links.data ?? []).flatMap((link) => link.control_part_id ?? []).sort(),
    [links.data],
  );
  const parts = useMappingParts(targetIds);
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
    selections,
    parts,
  ];
  const ready = queries.every((query) => query.data !== undefined && !query.error);
  const valid =
    identity.data?.program_id === programId &&
    content.data?.engineering_requirement_id === requirementId;
  const collection = workspace.collections.find(
    (item) => item.name === "requirement_control_links",
  );
  const writer = !readOnly && workspace.role !== "viewer" && valid;
  const writable = writer && !!collection?.can_insert;
  const canEdit = writer && !!collection?.can_update;
  const canRemove = writer && !!collection?.can_delete;
  const requirementCode = identity.data?.code ?? "Requirement";
  const sourceText = context.allocated
    ? "Choose an allocated system and a control from its effective profile."
    : "Allocate this requirement to a system before adding a system control mapping.";
  const [previewId, setPreviewId] = useState<string>();
  const rows = useMemo(
    () =>
      (links.data ?? []).map((link) => {
        const control = controls.data?.find((row) => row.id === link.control_id);
        const part = parts.data?.find((row) => row.id === link.control_part_id);
        const system = systems.data?.find((row) => row.id === link.system_id);
        const selection = selections.data?.find((row) => row.id === link.selected_control_id);
        const baseline = baselines.data?.find((row) => row.system_id === link.system_id);
        return {
          ...link,
          name: control ? `${control.code} · ${control.title}` : "Control unavailable",
          control,
          part,
          coverage: !link.control_part_id
            ? "Whole control"
            : (part?.source_id ?? part?.title ?? "Target unavailable"),
          systemName: system ? `${system.code} · ${system.name}` : "Catalog reference",
          needsReview:
            !!link.control_part_id && (!part || !isControlStatement(part, parts.data ?? [])),
          outdated:
            !!link.system_id &&
            selection?.profile_resolution_id !== baseline?.profile_resolution_id,
        };
      }),
    [links.data, controls.data, parts.data, systems.data, selections.data, baselines.data],
  );
  type MappingRow = (typeof rows)[number];
  const focus = useRemovalFocus(rows);
  const edit = (row: MappingRow) =>
    setEditing({
      link: row,
      part: row.part,
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
          preview: (row) => setPreviewId(row.id),
          active: (row) => row.id === previewId,
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
                <Text as="p" size="small" className="whitespace-pre-wrap">
                  {row.part.prose}
                </Text>
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
    [previewId, canEdit, canRemove, requirementCode],
  );
  const table = useDataTable({
    columns,
    data: rows,
    getRowId: (row) => row.id,
    rowLabel: (row) => row.name,
    label: "Requirement control mappings",
    view: "requirement-control-mappings",
    resizable: true,
    reorderable: true,
  });
  const displayed = useDisplayedRecords(table);
  const preview = rows.find((row) => row.id === previewId);
  const unavailable = !ready
    ? "The control mappings are still loading."
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
              render: (row) =>
                row.rationale ? <Prose>{row.rationale}</Prose> : <Absent label="Not recorded" />,
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
          selections={selections.data ?? []}
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
  selections: Row<"selected_controls">[];
  links: Row<"requirement_control_links">[];
  canWrite: boolean;
  sourceText: string;
  initial?: ExistingMapping | undefined;
  onClose: () => void;
}) {
  const workspace = useWorkspace();
  const save = useModelSave("requirement_control_links");
  const formId = useId();
  const feedback = useFormFeedback<MappingField>();
  const [open, setOpen] = useState(true);
  const [mappingId] = useState(() => initial?.link.id ?? crypto.randomUUID());
  const [controlId, setControlId] = useState(initial?.control?.id ?? "");
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
    .sort(
      (a, b) =>
        a.ordinal - b.ordinal ||
        (a.source_id ?? "").localeCompare(b.source_id ?? "", undefined, { numeric: true }),
    )
    .map((part) => ({
      id: part.id,
      label: `${part.source_id ?? part.title ?? labelFor(part.name)} · ${part.prose}`,
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
      const token = await requireIdentity(workspace);
      const { data: existing, error: lookupError } = await database()
        .from("requirement_control_links")
        .select()
        .eq("tenant_id", workspace.tenantId)
        .eq("id", mappingId)
        .setHeader("Authorization", `Bearer ${token}`)
        .maybeSingle();
      if (lookupError) throw new Error(lookupError.message);
      if (existing) {
        const matches = Object.entries(authored).every(
          ([key, value]) => existing[key as keyof typeof existing] === value,
        );
        if (!matches) {
          if (!initial || existing.revision !== initial.link.revision)
            throw new Error(
              "This mapping changed in another session. Your draft is retained; reopen the mapping to load its current values.",
            );
          await save.mutateAsync({
            values: authored,
            id: mappingId,
            revision: initial.link.revision,
          });
        }
      } else if (initial)
        throw new Error("This mapping is no longer available. Your draft is retained.");
      else
        await save.mutateAsync({
          values: { ...authored, id: mappingId, tenant_id: workspace.tenantId },
        });
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
                      ? (initial.part?.source_id ?? "Target unavailable")
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
                  <Field invalid={errors.has("control") ? true : undefined} required>
                    <FieldLabel>Control</FieldLabel>
                    <Combobox
                      items={availableControls}
                      value={displayedControl}
                      isItemEqualToValue={(item, value) => item.id === value.id}
                      filter={(item, search) =>
                        item.label
                          .toLowerCase()
                          .replace(/[^a-z0-9]/g, "")
                          .includes(search.toLowerCase().replace(/[^a-z0-9]/g, ""))
                      }
                      onValueChange={(item) => {
                        setTargetDirty(true);
                        setControlId(item?.id ?? "");
                        setPartId("");
                        changed();
                      }}
                      autoHighlight
                    >
                      <ComboboxInput
                        ref={feedback.ref("control")}
                        placeholder="Find a control by code or title"
                        showClear
                      />
                      <ComboboxContent>
                        <ComboboxEmpty>
                          No matching controls in this system's profile.
                        </ComboboxEmpty>
                        <ComboboxList>
                          {(item: ControlChoice) => (
                            <ComboboxItem key={item.id} value={item}>
                              {item.label}
                            </ComboboxItem>
                          )}
                        </ComboboxList>
                      </ComboboxContent>
                    </Combobox>
                    {errors.has("control") ? (
                      <FieldError>{errors.get("control")}</FieldError>
                    ) : null}
                  </Field>
                  <Field
                    invalid={errors.has("statement") ? true : undefined}
                    disabled={!chosenControl || parts.isPending || !!parts.error}
                  >
                    <FieldLabel>Statement or item</FieldLabel>
                    <Combobox
                      items={statements}
                      value={chosenPart ?? null}
                      isItemEqualToValue={(item, value) => item.id === value.id}
                      filter={(item, search) =>
                        item.label.toLowerCase().includes(search.toLowerCase())
                      }
                      onValueChange={(item) => {
                        setTargetDirty(true);
                        setPartId(item?.id ?? "");
                        changed();
                      }}
                    >
                      <ComboboxInput
                        ref={feedback.ref("statement")}
                        placeholder={
                          controlId && parts.isPending ? "Loading statements…" : "Whole control"
                        }
                        showClear
                      />
                      <ComboboxContent>
                        <ComboboxEmpty>No matching statement prose for this control.</ComboboxEmpty>
                        <ComboboxList>
                          {(item: (typeof statements)[number]) => (
                            <ComboboxItem
                              key={item.id}
                              value={item}
                              className="items-start whitespace-normal"
                            >
                              <span>
                                <span className="font-medium">
                                  {item.part.source_id ??
                                    item.part.title ??
                                    labelFor(item.part.name)}
                                </span>
                                <span className="block whitespace-pre-wrap font-body-small">
                                  {item.part.prose}
                                </span>
                              </span>
                            </ComboboxItem>
                          )}
                        </ComboboxList>
                      </ComboboxContent>
                    </Combobox>
                    <FieldDescription>
                      {chosenPart ? (
                        <span className="whitespace-pre-wrap">{chosenPart.part.prose}</span>
                      ) : chosenControl && parts.isSuccess && !statements.length ? (
                        "This control has no recorded statement prose, so the mapping covers the whole control."
                      ) : (
                        "Leave it empty to map the whole control, or choose an item to narrow the coverage."
                      )}
                    </FieldDescription>
                    {errors.has("statement") ? (
                      <FieldError>{errors.get("statement")}</FieldError>
                    ) : null}
                  </Field>
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
                    maxLength={10000}
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
