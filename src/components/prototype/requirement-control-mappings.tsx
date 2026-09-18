import { ProductCollection } from "./product-collection";
import { RecordLink, useDisplayedRecords } from "./record-preview";
import { RecordSummaryPreview } from "./record-summary-preview";
import { QueryState, MissingRecord } from "./work-common";
import { useConfirmation, discardChanges } from "@/components/app/confirmation";
import { useId, useMemo, useRef, useState, type FormEvent } from "react";
import { useBlocker } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  defineColumns,
  useDataTable,
  Badge,
  Box,
  Button,
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Field,
  FieldLabel,
  Inline,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Stack,
  Table,
  Textarea,
} from "@ledger/design-system";
import { Plus } from "lucide-react";
import { useWorkspace } from "@/components/app/workspace";
import { database, requireIdentity } from "@/lib/database";
import { useModelSave, useRow, useRows, type Row } from "@/lib/models";
import {
  isControlStatement,
  requirementMappingBaselines,
  type MappingBaseline,
} from "@/lib/requirement-control-mappings";
import { labelFor } from "@/lib/records";

const relationships = [
  { value: "maps_to", label: "Maps to" },
  { value: "derived_from", label: "Derived from" },
  { value: "satisfies", label: "Satisfies" },
] as const;
type Relationship = (typeof relationships)[number]["value"];
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
  const error = queries.find((query) => query.error)?.error;
  const ready = queries.every((query) => query.data !== undefined && !query.error);
  const valid =
    identity.data?.program_id === programId &&
    content.data?.engineering_requirement_id === requirementId;
  const collection = workspace.collections.find(
    (item) => item.name === "requirement_control_links",
  );
  const writable = !readOnly && workspace.role !== "viewer" && !!collection?.can_insert && valid;
  const canEdit = !readOnly && workspace.role !== "viewer" && !!collection?.can_update && valid;
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
  const columns = useMemo(
    () =>
      defineColumns<(typeof rows)[number]>((c) => [
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
                <p className="whitespace-pre-wrap font-body-small">{row.part.prose}</p>
              )}
              {row.needsReview && (
                <>
                  <Badge tone="warning" variant="secondary">
                    Needs review
                  </Badge>
                  <p className="font-body-small text-subtle">
                    This mapping points to an unavailable or non-statement target. Review its
                    control coverage.
                  </p>
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
          cell: (row) =>
            relationships.find((item) => item.value === row.relationship_type)?.label ??
            labelFor(row.relationship_type),
        }),
        c.text("rationale", { header: "Rationale", minWidth: 200, wrap: true }),
        ...(canEdit
          ? [
              c.actions((row) => [
                {
                  label: "Edit mapping",
                  onSelect: () =>
                    setEditing({
                      link: row,
                      part: row.part,
                      control: row.control ? { id: row.control.id, label: row.name } : undefined,
                    }),
                },
              ]),
            ]
          : []),
      ]),
    [previewId, canEdit],
  );
  const table = useDataTable({
    columns,
    data: rows,
    getRowId: (row) => row.id,
    label: "Requirement control mappings",
    view: "requirement-control-mappings",
    resizable: true,
    reorderable: true,
  });
  const displayed = useDisplayedRecords(table);
  const preview = rows.find((row) => row.id === previewId);
  const action = writable ? (
    <Button
      size="small"
      variant="primary"
      iconBefore={<Plus />}
      disabled={!ready || !context.sources.length}
      onClick={() => setAdding(true)}
    >
      Map control
    </Button>
  ) : undefined;
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
          <MissingRecord kind="Requirement" backTo="/programs" />
        )}
      </QueryState>
      {preview && (
        <RecordSummaryPreview
          model="requirement_control_links"
          readOnly={!canEdit || !ready}
          onEdit={() =>
            setEditing({
              link: preview,
              part: preview.part,
              control: preview.control
                ? { id: preview.control.id, label: preview.name }
                : undefined,
            })
          }
          record={preview}
          rows={displayed}
          onSelect={(row) => setPreviewId(row.id)}
          onClose={() => setPreviewId(undefined)}
          fields={[
            { key: "name", label: "Control" },
            { key: "coverage" },
            { key: "systemName", label: "System" },
            { key: "relationship_type" },
            { key: "rationale" },
          ]}
        />
      )}
      {(adding || editing) && (
        <MappingDialog
          key={editing?.link.id ?? "new"}
          contentId={contentId}
          requirementCode={identity.data?.code ?? "Requirement"}
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
    </Stack>
  );
}

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
  const { confirm, confirmation } = useConfirmation();
  const workspace = useWorkspace();
  const save = useModelSave("requirement_control_links");
  const cache = useQueryClient();
  const fieldId = useId();
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
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const inFlight = useRef(false);
  const bypassClose = useRef(false);
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
  const close = async () => {
    if (inFlight.current) return;
    if (!dirty || (await confirm(discardChanges("Discard this unsaved control mapping?")))) {
      bypassClose.current = true;
      onClose();
    }
  };
  useBlocker({
    shouldBlockFn: async () =>
      inFlight.current ||
      (dirty &&
        !bypassClose.current &&
        !(await confirm(discardChanges("Discard this unsaved control mapping?")))),
    enableBeforeUnload: () => !bypassClose.current && (dirty || inFlight.current),
  });
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (inFlight.current || !canWrite) return;
    if (
      (!preserveTarget &&
        (!chosenSystem ||
          !chosenControl ||
          !selectedControl ||
          (partId && (!chosenPart || parts.error)))) ||
      duplicate
    ) {
      setError(
        duplicate
          ? "This control target already has that relationship for this system."
          : "Choose an allocated system and an available control. The statement is optional.",
      );
      return;
    }
    inFlight.current = true;
    setBusy(true);
    setError("");
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
        await cache.invalidateQueries({
          queryKey: ["models", workspace.tenantId, "requirement_control_links"],
        });
      } else if (initial)
        throw new Error("This mapping is no longer available. Your draft is retained.");
      else
        await save.mutateAsync({
          values: { ...authored, id: mappingId, tenant_id: workspace.tenantId },
        });
      await requireIdentity(workspace);
      bypassClose.current = true;
      inFlight.current = false;
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The control mapping could not be saved.");
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
      <DialogContent style={{ maxWidth: 820 }} showCloseButton={!busy}>
        <DialogHeader>
          <DialogTitle>{initial ? "Edit control mapping" : "Map control"}</DialogTitle>
          <DialogDescription>{requirementCode}</DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(event) => void submit(event)}
          className="flex min-h-0 flex-1 flex-col"
          aria-busy={busy}
        >
          <Box padding="space.250" className="min-h-0 flex-1 overflow-y-auto">
            <fieldset disabled={busy || !canWrite} className="min-w-0">
              <Stack space="space.200">
                <p className="font-body-small text-subtle">{sourceText}</p>
                <Field>
                  <FieldLabel htmlFor={`${fieldId}-system`}>System</FieldLabel>
                  <Select
                    value={systemId}
                    onValueChange={(value) => {
                      setTargetDirty(true);
                      setSystemId(value ?? "");
                      setControlId("");
                      setPartId("");
                      setDirty(true);
                    }}
                    disabled={busy || !canWrite}
                  >
                    <SelectTrigger autoFocus id={`${fieldId}-system`}>
                      <SelectValue
                        placeholder={
                          initial && !systemId ? "Catalog reference" : "Choose an allocated system"
                        }
                      >
                        {chosenSystem?.systemName}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {sources.map((source) => (
                        <SelectItem key={source.systemId} value={source.systemId}>
                          {source.systemName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                {chosenSystem && (
                  <p className="font-body-small text-subtle">
                    {chosenSystem.inherited ? "Inherited profile" : "System profile"} ·{" "}
                    {chosenSystem.source}
                  </p>
                )}
                <Field>
                  <FieldLabel htmlFor={`${fieldId}-control`}>Control</FieldLabel>
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
                      setDirty(true);
                    }}
                    disabled={busy || !canWrite}
                  >
                    <ComboboxInput
                      id={`${fieldId}-control`}
                      placeholder="Find a control by code or title"
                      showClear
                    />
                    <ComboboxContent>
                      <ComboboxEmpty>No matching controls in these system baselines.</ComboboxEmpty>
                      <ComboboxList>
                        {(item) => (
                          <ComboboxItem key={item.id} value={item}>
                            {item.label}
                          </ComboboxItem>
                        )}
                      </ComboboxList>
                    </ComboboxContent>
                  </Combobox>
                </Field>
                {initial && (!chosenControl || (!!partId && !chosenPart)) && (
                  <p role="status" className="font-body-small text-subtle">
                    Recorded target: {initial.control?.label ?? "Control unavailable"} —{" "}
                    {initial.link.control_part_id
                      ? (initial.part?.source_id ?? "Target unavailable")
                      : "Whole control"}
                    . Choose a system and a control from its effective profile to update this
                    mapping.
                  </p>
                )}
                <Field>
                  <FieldLabel htmlFor={`${fieldId}-statement`}>
                    Statement or item (optional)
                  </FieldLabel>
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
                      setDirty(true);
                    }}
                    disabled={
                      busy || !canWrite || !chosenControl || parts.isPending || !!parts.error
                    }
                  >
                    <ComboboxInput
                      id={`${fieldId}-statement`}
                      placeholder={
                        controlId && parts.isPending
                          ? "Loading statements…"
                          : "Whole control — select an item to narrow coverage"
                      }
                      showClear
                    />
                    <ComboboxContent>
                      <ComboboxEmpty>No matching statement prose for this control.</ComboboxEmpty>
                      <ComboboxList>
                        {(item) => (
                          <ComboboxItem
                            key={item.id}
                            value={item}
                            className="items-start whitespace-normal"
                          >
                            <span>
                              <span className="font-medium">
                                {item.part.source_id ?? item.part.title ?? labelFor(item.part.name)}
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
                </Field>
                {chosenPart && (
                  <Box padding="space.150" className="rounded-medium border">
                    <p className="whitespace-pre-wrap font-body-small">{chosenPart.part.prose}</p>
                  </Box>
                )}
                {chosenControl && parts.isSuccess && !statements.length && (
                  <p role="status" className="font-body-small text-subtle">
                    This control has no recorded statement prose. The mapping will cover the whole
                    control.
                  </p>
                )}
                <Field>
                  <FieldLabel htmlFor={`${fieldId}-relationship`}>Relationship</FieldLabel>
                  <Select
                    value={relationship}
                    onValueChange={(value) => {
                      if (relationships.some((item) => item.value === value)) {
                        setRelationship(value as Relationship);
                        setDirty(true);
                      }
                    }}
                    disabled={busy || !canWrite}
                  >
                    <SelectTrigger id={`${fieldId}-relationship`}>
                      <SelectValue>
                        {relationships.find((item) => item.value === relationship)?.label}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {relationships.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field>
                  <FieldLabel htmlFor={`${fieldId}-rationale`}>Rationale (optional)</FieldLabel>
                  <Textarea
                    id={`${fieldId}-rationale`}
                    rows={3}
                    value={rationale}
                    onChange={(event) => {
                      setRationale(event.target.value);
                      setDirty(true);
                    }}
                  />
                </Field>
                <p className="font-body-small text-subtle">
                  This records traceability to the system’s selected control. Implementation
                  narratives and evidence are recorded separately in its SSP.
                </p>
                {duplicate && (
                  <p role="status" className="font-body-small text-subtle">
                    This control target already has that relationship for this system.
                  </p>
                )}
                {(error || parts.error) && (
                  <p role="alert" className="text-danger">
                    {error || parts.error?.message}
                  </p>
                )}
              </Stack>
            </fieldset>
          </Box>
          <DialogFooter>
            <Button type="button" variant="subtle" disabled={busy} onClick={close}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={busy || !canWrite}>
              {initial ? "Edit control mapping" : "Map control"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
      {confirmation}
    </Dialog>
  );
}
