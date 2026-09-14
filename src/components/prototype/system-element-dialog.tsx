import { useId, useRef, useState, type FormEvent } from "react";
import { useBlocker } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  Box,
  Button,
  Checkbox,
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
import { database, requireIdentity } from "@/lib/database";
import { useModelSave, useRows } from "@/lib/models";
import { labelFor } from "@/lib/records";
import type { SystemElement } from "@/lib/system-tree";

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
  onClose: () => void;
  onSaved?: ((systemId: string) => void) | undefined;
}) {
  const workspace = useWorkspace();
  const parties = useRows("parties");
  const save = useModelSave("systems");
  const cache = useQueryClient();
  const fieldId = useId();
  const [baseline] = useState(existing);
  const [id] = useState(() => existing?.id ?? crypto.randomUUID());
  const [code, setCode] = useState(existing?.code ?? "");
  const [name, setName] = useState(existing?.name ?? "");
  const [type, setType] = useState(existing?.system_type ?? "");
  const [description, setDescription] = useState(existing?.description ?? "");
  const [ownerId, setOwnerId] = useState(existing?.system_owner_party_id ?? null);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const inFlight = useRef(false);
  const bypassClose = useRef(false);
  const collection = workspace.collections.find((item) => item.name === "systems");
  const types = collection?.columns.find((column) => column.name === "system_type")?.choices ?? [];
  const owners = (parties.data ?? [])
    .filter((party) => party.tenant_id === workspace.tenantId)
    .map((party) => ({ id: party.id, label: party.name }))
    .sort((a, b) => a.label.localeCompare(b.label));
  const canWrite =
    workspace.role !== "viewer" &&
    !!(baseline ? collection?.can_update : collection?.can_insert) &&
    (!baseline ||
      (baseline.tenant_id === workspace.tenantId && baseline.program_id === programId)) &&
    (!parent || (parent.tenant_id === workspace.tenantId && parent.program_id === programId));
  const close = () => {
    if (inFlight.current) return;
    if (!dirty || window.confirm("Discard your unsaved system details?")) {
      bypassClose.current = true;
      onClose();
    }
  };
  useBlocker({
    shouldBlockFn: () =>
      inFlight.current ||
      (dirty && !bypassClose.current && !window.confirm("Discard your unsaved system details?")),
    enableBeforeUnload: () => !bypassClose.current && (dirty || inFlight.current),
  });
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!canWrite || inFlight.current) return;
    if (!code.trim() || !name.trim() || !types.includes(type)) {
      setError("Enter a code and name, and choose a system type.");
      return;
    }
    if (ownerId && !owners.some((owner) => owner.id === ownerId)) {
      setError("Choose an available owner.");
      return;
    }
    inFlight.current = true;
    setBusy(true);
    setError("");
    const authored = {
      code: code.trim(),
      name: name.trim(),
      description: description.trim() || null,
      system_type: type,
      system_owner_party_id: ownerId,
    };
    const created = {
      ...authored,
      program_id: programId,
      parent_system_id: parent?.id ?? null,
      is_authorization_boundary: !parent,
    };
    try {
      const token = await requireIdentity(workspace);
      const { data: stored, error: lookupError } = await database()
        .from("systems")
        .select()
        .eq("id", id)
        .eq("tenant_id", workspace.tenantId)
        .setHeader("Authorization", `Bearer ${token}`)
        .maybeSingle();
      if (lookupError) throw new Error(lookupError.message);
      if (stored) {
        const expected = baseline ? authored : created;
        const matches = Object.entries(expected).every(
          ([key, value]) => (stored as Record<string, unknown>)[key] === value,
        );
        if (!matches) {
          if (!baseline || stored.revision !== baseline.revision)
            throw new Error(
              "This system changed in another session. Your draft is retained; reopen it to load the current details.",
            );
          await save.mutateAsync({ id, revision: baseline.revision, values: authored });
        }
        await cache.invalidateQueries({ queryKey: ["models", workspace.tenantId, "systems"] });
        await cache.invalidateQueries({ queryKey: ["model", workspace.tenantId, "systems"] });
      } else if (baseline)
        throw new Error("This system is no longer available. Your draft is retained.");
      else await save.mutateAsync({ values: { ...created, id, tenant_id: workspace.tenantId } });
      await requireIdentity(workspace);
      bypassClose.current = true;
      inFlight.current = false;
      onSaved?.(id);
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The system could not be saved.");
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
      <DialogContent style={{ maxWidth: 720 }} showCloseButton={!busy}>
        <DialogHeader>
          <DialogTitle>
            {baseline ? "Edit system" : parent ? "Add child system" : "Add system"}
          </DialogTitle>
          <DialogDescription>
            {baseline
              ? `${baseline.code} · ${baseline.name}`
              : parent
                ? `Under ${parent.code} · ${parent.name}`
                : "Define a system in this program."}
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(event) => void submit(event)}
          className="flex min-h-0 flex-1 flex-col"
          aria-busy={busy}
          onChange={() => setDirty(true)}
        >
          <Box padding="space.250" className="min-h-0 flex-1 overflow-y-auto">
            <fieldset disabled={busy || !canWrite} className="min-w-0">
              <Stack space="space.200">
                <Field>
                  <FieldLabel htmlFor={`${fieldId}-code`}>Code</FieldLabel>
                  <Input
                    id={`${fieldId}-code`}
                    value={code}
                    onChange={(event) => setCode(event.target.value)}
                    required
                    maxLength={100}
                    autoFocus
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor={`${fieldId}-name`}>Name</FieldLabel>
                  <Input
                    id={`${fieldId}-name`}
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    required
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor={`${fieldId}-type`}>System type</FieldLabel>
                  <Select
                    value={type}
                    onValueChange={(value) => {
                      if (value) {
                        setType(value);
                        setDirty(true);
                      }
                    }}
                    disabled={busy || !canWrite}
                  >
                    <SelectTrigger id={`${fieldId}-type`}>
                      <SelectValue placeholder="Choose a type">
                        {type ? labelFor(type) : undefined}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {types.map((value) => (
                        <SelectItem key={value} value={value}>
                          {labelFor(value)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field>
                  <FieldLabel htmlFor={`${fieldId}-description`}>Description</FieldLabel>
                  <Textarea
                    id={`${fieldId}-description`}
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    rows={4}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor={`${fieldId}-owner`}>System owner (optional)</FieldLabel>
                  <Combobox
                    items={owners}
                    value={owners.find((owner) => owner.id === ownerId) ?? null}
                    isItemEqualToValue={(item, value) => item.id === value.id}
                    filter={(item, search) =>
                      item.label.toLowerCase().includes(search.toLowerCase())
                    }
                    onValueChange={(owner) => {
                      setOwnerId(owner?.id ?? null);
                      setDirty(true);
                    }}
                    disabled={busy || !canWrite || parties.isPending || !!parties.error}
                  >
                    <ComboboxInput id={`${fieldId}-owner`} placeholder="Unassigned" showClear />
                    <ComboboxContent>
                      <ComboboxEmpty>No matching owners.</ComboboxEmpty>
                      <ComboboxList>
                        {(owner) => (
                          <ComboboxItem key={owner.id} value={owner}>
                            {owner.label}
                          </ComboboxItem>
                        )}
                      </ComboboxList>
                    </ComboboxContent>
                  </Combobox>
                </Field>
                {!baseline && !parent && (
                  <label className="flex items-center gap-100">
                    <Checkbox checked disabled />
                    Authorization boundary
                  </label>
                )}
                {parent && (
                  <p className="font-body-small text-subtle">
                    This element belongs to its parent’s authorization boundary. Creating it does
                    not create a separate baseline or security plan.
                  </p>
                )}
                {(error || parties.error) && (
                  <p role="alert" className="text-danger">
                    {error || parties.error?.message}
                  </p>
                )}
              </Stack>
            </fieldset>
          </Box>
          <DialogFooter>
            <Button type="button" variant="secondary" disabled={busy} onClick={close}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={busy || !canWrite}>
              {busy
                ? "Saving…"
                : baseline
                  ? "Save system"
                  : parent
                    ? "Add child system"
                    : "Add system"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
