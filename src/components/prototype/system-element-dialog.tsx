import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Button,
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  ErrorSummary,
  FieldSet,
  Grid,
  Stack,
  Text,
  toast,
} from "@ledger/design-system";
import { ChoiceField, PartyField, TextField } from "@/components/app/fields";
import { useFormFeedback, type FormIssue } from "@/components/app/form-feedback";
import { useDraftGuard } from "@/components/app/use-draft-guard";
import { useWorkspace } from "@/components/app/workspace";
import { useCollection, useColumnChoices } from "@/lib/collections";
import { useRows } from "@/lib/models";
import { SaveOnceConflict, useSaveOnce } from "@/lib/save-once";
import { labelFor } from "@/lib/records";
import { impactLevels } from "@/lib/status";
import type { SystemElement } from "@/lib/system-tree";

const impactFields = [
  { name: "confidentiality_impact", label: "Confidentiality impact" },
  { name: "integrity_impact", label: "Integrity impact" },
  { name: "availability_impact", label: "Availability impact" },
] as const;
type ImpactField = (typeof impactFields)[number]["name"];
const impactOptions = Object.entries(impactLevels).map(([value, entry]) => ({
  value,
  label: entry.label,
}));

/** The form's fields in the order they appear, which is the order their issues are listed in. */
const elementFields = ["code", "name", "type", "description", "owner"] as const;
type ElementField = (typeof elementFields)[number];
/** The longest code the form takes: a count shows near it, and a longer one is a field error, never cut. */
const CODE_LIMIT = 100;
const codeTooLong = `Use at most ${CODE_LIMIT} characters for the code.`;

/** Focused authoring for a canonical system identity; containment and boundary edits stay separate. */
export function SystemElementDialog({
  programId,
  parent,
  existing,
  onClose,
  onSaved,
}: {
  programId: string;
  parent?: SystemElement | undefined;
  existing?: SystemElement | undefined;
  /** Called once the dialog has finished closing, after `onSaved` when the system was saved. */
  onClose: () => void;
  /** The saved system's id, once the dialog has closed: open its preview or its record. */
  onSaved?: ((systemId: string) => void) | undefined;
}) {
  const workspace = useWorkspace();
  const parties = useRows("parties");
  // The system's id is chosen once, so saving again after an uncertain answer never duplicates it.
  const save = useSaveOnce("systems");
  const formId = useId();
  const [baseline] = useState(existing);
  const [id] = useState(() => existing?.id ?? crypto.randomUUID());
  const [open, setOpen] = useState(true);
  const [code, setCode] = useState(existing?.code ?? "");
  const [name, setName] = useState(existing?.name ?? "");
  const [type, setType] = useState<string | null>(existing?.system_type ?? null);
  const [description, setDescription] = useState(existing?.description ?? "");
  const [ownerId, setOwnerId] = useState<string | null>(existing?.system_owner_party_id ?? null);
  const [impacts, setImpacts] = useState<Record<ImpactField, string | null>>({
    confidentiality_impact: existing?.confidentiality_impact ?? null,
    integrity_impact: existing?.integrity_impact ?? null,
    availability_impact: existing?.availability_impact ?? null,
  });
  const [categorizationRationale, setCategorizationRationale] = useState(
    existing?.categorization_rationale ?? "",
  );
  const [dirty, setDirty] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const saved = useRef(false);
  const submitRef = useRef<HTMLButtonElement>(null);
  const failureRef = useRef<HTMLDivElement>(null);
  const feedback = useFormFeedback<ElementField>();
  const operation = baseline ? "Edit system" : "Create system";
  const guard = useDraftGuard({
    dirty,
    onClose: () => setOpen(false),
    description: baseline
      ? "The changes to this system will be lost."
      : "The system details you entered will be lost.",
  });
  const schema = useCollection("systems");
  const collection = schema.data;
  const types = useColumnChoices("systems", "system_type").data ?? [];
  const owners = (parties.data ?? []).filter((party) => party.tenant_id === workspace.tenantId);
  const canWrite =
    workspace.role !== "viewer" &&
    !!(baseline ? collection?.can_update : collection?.can_insert) &&
    (!baseline ||
      (baseline.tenant_id === workspace.tenantId && baseline.program_id === programId)) &&
    (!parent || (parent.tenant_id === workspace.tenantId && parent.program_id === programId));
  const issues: FormIssue<ElementField>[] = [
    ...(!code.trim()
      ? [{ field: "code" as const, message: "Enter a code for the system." }]
      : code.trim().length > CODE_LIMIT
        ? [{ field: "code" as const, message: codeTooLong }]
        : []),
    ...(!name.trim() ? [{ field: "name" as const, message: "Enter a name for the system." }] : []),
    ...(!type || !types.includes(type)
      ? [{ field: "type" as const, message: "Choose a system type." }]
      : []),
    ...(ownerId && parties.data && !owners.some((owner) => owner.id === ownerId)
      ? [{ field: "owner" as const, message: "Choose an owner in this workspace." }]
      : []),
  ];
  // Validate on submit, then on change: each field's error follows the value once submitted.
  const errors = new Map(
    feedback.submitted ? issues.map((issue) => [issue.field, issue.message] as const) : [],
  );
  // While the schema says what the role may do, the primary waits, loading, and nothing is refused.
  const deciding = workspace.role !== "viewer" && schema.isPending;
  const unavailable =
    canWrite || deciding
      ? undefined
      : baseline
        ? "An editor, admin, or owner of this program can edit its systems."
        : "An editor, admin, or owner of this program can create systems.";

  useEffect(() => {
    if (failure) failureRef.current?.scrollIntoView({ block: "nearest" });
  }, [failure]);

  function changed() {
    setDirty(true);
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (guard.busy || !canWrite) return;
    setFailure(null);
    if (!feedback.report(issues) || !type) return;
    // The fields lock while the save runs; the primary stays focusable while it loads.
    submitRef.current?.focus();
    if (!guard.start()) return;
    const authored = {
      code: code.trim(),
      name: name.trim(),
      description: description.trim() || null,
      system_type: type,
      system_owner_party_id: ownerId,
      ...impacts,
      categorization_rationale: categorizationRationale.trim() || null,
    };
    const created = {
      ...authored,
      program_id: programId,
      parent_system_id: parent?.id ?? null,
      is_authorization_boundary: !parent,
    };
    try {
      try {
        // A retry that finds the write already applied writes nothing and still refreshes the lists.
        await save.mutateAsync(
          baseline
            ? { id, values: authored, revision: baseline.revision }
            : { id, values: created },
        );
      } catch (cause) {
        if (cause instanceof SaveOnceConflict)
          throw new Error(
            cause.reason === "missing"
              ? "This system is no longer available. Your details are kept."
              : "This system changed in another session. Your details are kept; close the dialog and open it again to load the current details.",
          );
        throw cause;
      }
      saved.current = true;
      toast.add({
        type: "success",
        title: baseline ? "System updated" : "System created",
        description: `${authored.code} · ${authored.name}`,
      });
      guard.finish();
      guard.complete();
    } catch (cause) {
      const message = (cause instanceof Error ? cause.message : "The request failed.").replace(
        /[.!?]?$/,
        ".",
      );
      // The conflict messages already say the details are kept; say it once.
      const next = /kept/.test(message)
        ? ""
        : baseline
          ? " Your changes are kept, so you can try again."
          : " Your details are kept, and saving again will not create a second system.";
      setFailure(`${message}${next}`);
      guard.finish();
    }
  }
  function closed() {
    if (saved.current) onSaved?.(id);
    onClose();
  }
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
        if (!next) closed();
      }}
    >
      <DialogContent width="large" initialFocus={() => feedback.node("code") ?? true}>
        <DialogHeader>
          <DialogTitle>{operation}</DialogTitle>
          <DialogDescription>
            {baseline
              ? `${baseline.code} · ${baseline.name}`
              : parent
                ? `Under ${parent.code} · ${parent.name}`
                : "Define a system in this program."}
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          <form id={formId} noValidate onSubmit={(event) => void submit(event)}>
            <Stack space="space.200">
              {parties.error ? (
                <Alert variant="destructive" role="alert">
                  <AlertIcon />
                  <AlertTitle>The owners could not be loaded</AlertTitle>
                  <AlertDescription>{parties.error.message}</AlertDescription>
                  <AlertAction>
                    <Button size="small" onClick={() => void parties.refetch()}>
                      Retry loading owners
                    </Button>
                  </AlertAction>
                </Alert>
              ) : null}
              {unavailable ? (
                <Alert role="note">
                  <AlertDescription>{unavailable}</AlertDescription>
                </Alert>
              ) : null}
              {failure ? (
                <Alert ref={failureRef} variant="destructive" role="alert">
                  <AlertIcon />
                  <AlertTitle>
                    {baseline ? "The system was not saved" : "The system was not created"}
                  </AlertTitle>
                  <AlertDescription>{failure}</AlertDescription>
                </Alert>
              ) : null}
              <ErrorSummary issues={feedback.summary} focusKey={feedback.attempts} />
              <FieldSet disabled={guard.busy || !canWrite}>
                <Stack space="space.200">
                  <Grid
                    gap="space.200"
                    templateColumns={{ base: "minmax(0,1fr)", sm: "minmax(0,1fr) minmax(0,2fr)" }}
                  >
                    <TextField
                      label="Code"
                      required
                      characterLimit={CODE_LIMIT}
                      value={code}
                      onChange={(value) => {
                        setCode(value);
                        changed();
                      }}
                      error={errors.get("code")}
                      controlRef={feedback.ref("code")}
                    />
                    <TextField
                      label="Name"
                      required
                      value={name}
                      onChange={(value) => {
                        setName(value);
                        changed();
                      }}
                      error={errors.get("name")}
                      controlRef={feedback.ref("name")}
                    />
                  </Grid>
                  <ChoiceField
                    label="System type"
                    required
                    value={type}
                    options={types.map((value) => ({ value, label: labelFor(value) }))}
                    onChange={(value) => {
                      setType(value);
                      changed();
                    }}
                    placeholder="Choose a type"
                    error={errors.get("type")}
                    controlRef={feedback.ref("type")}
                  />
                  <TextField
                    label="Description"
                    multiline
                    rows={4}
                    value={description}
                    onChange={(value) => {
                      setDescription(value);
                      changed();
                    }}
                    controlRef={feedback.ref("description")}
                  />
                  <PartyField
                    label="System owner"
                    value={ownerId}
                    parties={owners}
                    disabled={!parties.data}
                    placeholder="Unassigned"
                    onChange={(value) => {
                      setOwnerId(value);
                      changed();
                    }}
                    error={errors.get("owner")}
                    controlRef={feedback.ref("owner")}
                  />
                  <Grid
                    gap="space.150"
                    templateColumns={{ base: "minmax(0, 1fr)", sm: "repeat(3, minmax(0, 1fr))" }}
                  >
                    {impactFields.map((field) => (
                      <ChoiceField
                        key={field.name}
                        label={field.label}
                        value={impacts[field.name]}
                        options={impactOptions}
                        emptyOption="Not categorized"
                        placeholder="Not categorized"
                        onChange={(value) => {
                          setImpacts((current) => ({ ...current, [field.name]: value }));
                          changed();
                        }}
                      />
                    ))}
                  </Grid>
                  <TextField
                    label="Categorization rationale"
                    multiline
                    rows={3}
                    value={categorizationRationale}
                    onChange={(value) => {
                      setCategorizationRationale(value);
                      changed();
                    }}
                  />
                  {!baseline && (
                    <Text as="p" size="small" color="color.text.subtle">
                      {parent
                        ? "This element belongs to its parent’s authorization boundary. Creating it does not create a separate baseline or security plan."
                        : "A top-level system is its own authorization boundary, with its own baseline and security plan."}
                    </Text>
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
            isLoading={guard.busy || deciding}
            disabledReason={unavailable}
          >
            {operation}
          </Button>
        </DialogFooter>
      </DialogContent>
      {guard.confirmation}
    </Dialog>
  );
}
