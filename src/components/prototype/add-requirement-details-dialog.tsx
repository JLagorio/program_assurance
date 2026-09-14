import { useId, useRef, useState, type FormEvent } from "react";
import { useBlocker } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
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
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Stack,
  Textarea,
} from "@ledger/design-system";
import { useWorkspace } from "@/components/app/workspace";
import { useModelSave, useRow, useRows } from "@/lib/models";
import { database, requireIdentity } from "@/lib/database";
import { labelFor } from "@/lib/records";

type Fields = {
  title: string;
  statement: string;
  acceptanceCriteria: string;
  rationale: string;
  requirementType: string;
  ownerPartyId: string | null;
};

/** Adds authored content to an existing requirement identity without exposing storage lifecycle fields. */
export function AddRequirementDetailsDialog({
  programId,
  requirementId,
  onClose,
  onSaved,
}: {
  programId: string;
  requirementId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const workspace = useWorkspace();
  const requirement = useRow("engineering_requirements", requirementId);
  const parties = useRows("parties");
  const create = useModelSave("requirement_revisions");
  const cache = useQueryClient();
  const fieldId = useId();
  const [contentId] = useState(() => crypto.randomUUID());
  const [fields, setFields] = useState<Fields>({
    title: "",
    statement: "",
    acceptanceCriteria: "",
    rationale: "",
    requirementType: "",
    ownerPartyId: null,
  });
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const inFlight = useRef(false);
  const bypassClose = useRef(false);
  const collection = workspace.collections.find((item) => item.name === "requirement_revisions");
  const types =
    collection?.columns.find((column) => column.name === "requirement_type")?.choices ?? [];
  const owners = (parties.data ?? [])
    .filter((party) => party.tenant_id === workspace.tenantId)
    .map((party) => ({ id: party.id, label: party.name }))
    .sort((a, b) => a.label.localeCompare(b.label));
  const canWrite =
    workspace.role !== "viewer" &&
    !!collection?.can_insert &&
    requirement.data?.program_id === programId;
  const change = <K extends keyof Fields>(field: K, value: Fields[K]) => {
    setFields((previous) => ({ ...previous, [field]: value }));
    setDirty(true);
  };
  const close = () => {
    if (inFlight.current) return;
    if (!dirty || window.confirm("Discard your unsaved requirement details?")) {
      bypassClose.current = true;
      onClose();
    }
  };
  useBlocker({
    shouldBlockFn: () =>
      inFlight.current ||
      (dirty &&
        !bypassClose.current &&
        !window.confirm("Discard your unsaved requirement details?")),
    enableBeforeUnload: () => !bypassClose.current && (dirty || inFlight.current),
  });

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!canWrite || inFlight.current) return;
    if (
      !fields.title.trim() ||
      !fields.statement.trim() ||
      !fields.acceptanceCriteria.trim() ||
      !types.includes(fields.requirementType)
    ) {
      setError("Add a title, requirement type, statement, and acceptance criteria.");
      return;
    }
    if (fields.ownerPartyId && !owners.some((owner) => owner.id === fields.ownerPartyId)) {
      setError("Choose an available owner.");
      return;
    }
    inFlight.current = true;
    setBusy(true);
    setError("");
    const authored = {
      engineering_requirement_id: requirementId,
      title: fields.title.trim(),
      statement: fields.statement.trim(),
      acceptance_criteria: fields.acceptanceCriteria.trim(),
      rationale: fields.rationale.trim() || null,
      requirement_type: fields.requirementType,
      owner_party_id: fields.ownerPartyId,
    };
    try {
      const token = await requireIdentity(workspace);
      // A stable row ID makes retrying an uncertain response safe without creating a second record.
      const { data: existing, error: lookupError } = await database()
        .from("requirement_revisions")
        .select()
        .eq("id", contentId)
        .eq("tenant_id", workspace.tenantId)
        .setHeader("Authorization", `Bearer ${token}`)
        .maybeSingle();
      if (lookupError) throw new Error(lookupError.message);
      if (existing) {
        if (
          !Object.entries(authored).every(
            ([key, value]) => existing[key as keyof typeof existing] === value,
          )
        )
          throw new Error(
            "These requirement details were already saved with different values. Your current draft has been retained.",
          );
        await cache.invalidateQueries({
          queryKey: ["models", workspace.tenantId, "requirement_revisions"],
        });
      } else {
        await create.mutateAsync({
          values: {
            ...authored,
            id: contentId,
            tenant_id: workspace.tenantId,
            version_number: 1,
            state: "draft",
          },
        });
      }
      await requireIdentity(workspace);
      bypassClose.current = true;
      setDirty(false);
      inFlight.current = false;
      onSaved();
      onClose();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "The requirement details could not be saved.",
      );
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
      <DialogContent style={{ maxWidth: 760 }} showCloseButton={!busy}>
        <DialogHeader>
          <DialogTitle>Add requirement details</DialogTitle>
          <DialogDescription>{requirement.data?.code}</DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(event) => void submit(event)}
          className="flex min-h-0 flex-1 flex-col"
          aria-busy={busy}
        >
          <Box padding="space.250" className="min-h-0 flex-1 overflow-y-auto">
            <fieldset disabled={busy || !canWrite} className="min-w-0">
              <Stack space="space.200">
                <Field>
                  <FieldLabel htmlFor={`${fieldId}-title`}>Title</FieldLabel>
                  <Input
                    id={`${fieldId}-title`}
                    value={fields.title}
                    required
                    onChange={(event) => change("title", event.target.value)}
                  />
                </Field>
                <Field>
                  <FieldLabel id={`${fieldId}-type-label`} htmlFor={`${fieldId}-type`}>
                    Requirement type
                  </FieldLabel>
                  <Select
                    value={fields.requirementType || null}
                    onValueChange={(value) => change("requirementType", String(value ?? ""))}
                    disabled={busy}
                  >
                    <SelectTrigger
                      id={`${fieldId}-type`}
                      aria-labelledby={`${fieldId}-type-label`}
                      aria-required="true"
                    >
                      <SelectValue placeholder="Choose requirement type">
                        {fields.requirementType ? labelFor(fields.requirementType) : undefined}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {types.map((type) => (
                        <SelectItem key={type} value={type}>
                          {labelFor(type)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field>
                  <FieldLabel id={`${fieldId}-owner-label`} htmlFor={`${fieldId}-owner`}>
                    Owner
                  </FieldLabel>
                  <Combobox
                    items={owners}
                    value={owners.find((owner) => owner.id === fields.ownerPartyId) ?? null}
                    isItemEqualToValue={(item, value) => item.id === value.id}
                    filter={(item, search) =>
                      item.label.toLowerCase().includes(search.toLowerCase())
                    }
                    onValueChange={(item) => change("ownerPartyId", item?.id ?? null)}
                    disabled={busy || parties.isPending || !!parties.error}
                  >
                    <ComboboxInput
                      id={`${fieldId}-owner`}
                      aria-labelledby={`${fieldId}-owner-label`}
                      placeholder="Choose owner (optional)"
                      showClear
                    />
                    <ComboboxContent>
                      <ComboboxEmpty>No matching owners.</ComboboxEmpty>
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
                {(
                  [
                    ["statement", "Statement"],
                    ["acceptanceCriteria", "Acceptance criteria"],
                    ["rationale", "Rationale"],
                  ] as const
                ).map(([field, label]) => (
                  <Field key={field}>
                    <FieldLabel htmlFor={`${fieldId}-${field}`}>{label}</FieldLabel>
                    <Textarea
                      id={`${fieldId}-${field}`}
                      rows={4}
                      required={field !== "rationale"}
                      value={fields[field]}
                      onChange={(event) => change(field, event.target.value)}
                    />
                  </Field>
                ))}
                {error && (
                  <p role="alert" className="text-danger">
                    {error}
                  </p>
                )}
                {parties.error && (
                  <p role="alert" className="text-danger">
                    Owners could not be loaded: {parties.error.message}
                  </p>
                )}
              </Stack>
            </fieldset>
          </Box>
          <DialogFooter>
            <Button type="button" variant="secondary" disabled={busy} onClick={close}>
              Cancel
            </Button>
            <Button type="submit" disabled={busy || !canWrite}>
              {busy ? "Saving…" : "Save requirement details"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
