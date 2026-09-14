import { useId, useRef, useState, type FormEvent } from "react";
import { useBlocker } from "@tanstack/react-router";
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
  FieldDescription,
  FieldLabel,
  Grid,
  Input,
  KeyValue,
  Stack,
  Textarea,
} from "@ledger/design-system";
import { useWorkspace } from "@/components/app/workspace";
import { useRows } from "@/lib/models";
import { labelFor } from "@/lib/records";
import {
  createEvidenceSchema,
  useCreateEvidence,
  type CreateEvidenceInput,
  type CreateEvidenceResult,
} from "@/lib/evidence-create";

type Option = { value: string; label: string };
function EvidenceChoice({
  label,
  value,
  options,
  onChange,
  required = false,
  disabled = false,
  description,
}: {
  label: string;
  value: string | null;
  options: Option[];
  onChange: (value: string | null) => void;
  required?: boolean;
  disabled?: boolean;
  description?: string | undefined;
}) {
  const id = useId();
  return (
    <Field>
      <FieldLabel id={`${id}-label`} htmlFor={id}>
        {label}
        {required ? (
          <span aria-hidden="true" className="text-danger">
            {" "}
            *
          </span>
        ) : null}
      </FieldLabel>
      <Combobox<Option>
        items={options}
        value={options.find((option) => option.value === value) ?? null}
        isItemEqualToValue={(item, selected) => item.value === selected.value}
        filter={(item, search) =>
          item.label.toLocaleLowerCase().includes(search.toLocaleLowerCase())
        }
        onValueChange={(item) => onChange(item?.value ?? null)}
        disabled={disabled}
      >
        <ComboboxInput
          id={id}
          aria-labelledby={`${id}-label`}
          aria-required={required}
          aria-describedby={description ? `${id}-help` : undefined}
          placeholder={required ? "Choose…" : "Choose (optional)…"}
          showClear={!required}
        />
        <ComboboxContent>
          <ComboboxEmpty>No matching records.</ComboboxEmpty>
          <ComboboxList>
            {(item) => (
              <ComboboxItem key={item.value} value={item}>
                {item.label}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
      {description ? <FieldDescription id={`${id}-help`}>{description}</FieldDescription> : null}
    </Field>
  );
}

export function CreateEvidenceDialog({
  programId,
  onClose,
  onCreated,
}: {
  programId?: string | undefined;
  onClose: () => void;
  onCreated?: ((result: CreateEvidenceResult) => void | Promise<void>) | undefined;
}) {
  const workspace = useWorkspace();
  const id = useId();
  const [requestId] = useState(() => crypto.randomUUID());
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<CreateEvidenceInput["artifactKind"] | null>(null);
  const [chosenProgram, setChosenProgram] = useState<string | null>(programId ?? null);
  const [scope, setScope] = useState<string | null>(null);
  const [owner, setOwner] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [externalUri, setExternalUri] = useState("");
  const [collected, setCollected] = useState("");
  const [provenance, setProvenance] = useState("");
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState<CreateEvidenceResult | null>(null);
  const inFlight = useRef(false);
  const bypassBlock = useRef(false);
  const effectiveProgramId = programId ?? chosenProgram;
  const programs = useRows("programs");
  const parties = useRows("parties");
  const systems = useRows("systems", effectiveProgramId ? { program_id: effectiveProgramId } : {}, {
    enabled: !!effectiveProgramId,
  });
  const scopes = useRows("scopes", {}, { enabled: !!effectiveProgramId });
  const create = useCreateEvidence();
  const queries = [programs, parties, ...(effectiveProgramId ? [systems, scopes] : [])];
  const loadError = queries.find((query) => query.error)?.error;
  const ready = queries.every((query) => query.data !== undefined);
  const contextProgram = programs.data?.find((program) => program.id === effectiveProgramId);
  const availableScopes = (scopes.data ?? []).filter((row) =>
    systems.data?.some(
      (system) => system.id === row.system_id && system.program_id === effectiveProgramId,
    ),
  );
  const invalidContext = !!effectiveProgramId && ready && !contextProgram;
  const validScope = !scope || availableScopes.some((row) => row.id === scope);
  const writable = workspace.role !== "viewer";
  const kinds =
    workspace.collections
      .find((collection) => collection.name === "evidence_artifacts")
      ?.columns.find((column) => column.name === "artifact_kind")?.choices ?? [];
  useBlocker({
    shouldBlockFn: () =>
      !bypassBlock.current &&
      (inFlight.current || (dirty && !window.confirm("Discard this unsaved evidence?"))),
    enableBeforeUnload: () => !bypassBlock.current && (dirty || inFlight.current),
  });
  function changed() {
    setDirty(true);
    setError("");
  }
  function close() {
    if (inFlight.current) return;
    if (!dirty || window.confirm("Discard this unsaved evidence?")) {
      bypassBlock.current = true;
      onClose();
    }
  }
  function chooseProgram(value: string | null) {
    if (value === chosenProgram) return;
    if (
      scope &&
      !window.confirm(
        "Changing the program clears the scope selection. The other evidence details will be kept.",
      )
    )
      return;
    setChosenProgram(value);
    setScope(null);
    changed();
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (inFlight.current || saved || !writable) return;
    if (!ready || loadError || invalidContext || !validScope) {
      setError("Load and choose valid workspace records before adding evidence.");
      return;
    }
    let collectedAt: string | null = null;
    if (collected) {
      const date = new Date(collected);
      if (!Number.isFinite(date.getTime())) {
        setError("Enter a valid collection date and time.");
        return;
      }
      collectedAt = date.toISOString();
    }
    const parsed = createEvidenceSchema.safeParse({
      title,
      artifactKind: kind,
      programId: effectiveProgramId,
      scopeId: scope,
      ownerPartyId: owner,
      description,
      externalUri,
      collectedAt,
      provenance,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Complete the evidence details.");
      return;
    }
    inFlight.current = true;
    setBusy(true);
    setError("");
    let committed = false;
    try {
      const result = await create.mutateAsync({ requestId, values: parsed.data });
      committed = true;
      setSaved(result);
      setDirty(false);
      bypassBlock.current = true;
      await onCreated?.(result);
      onClose();
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Evidence could not be added.";
      setError(
        committed
          ? `Evidence was created, but its preview could not be opened. ${message}`
          : message,
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
      <DialogContent style={{ maxWidth: 660 }} showCloseButton={!busy}>
        <DialogHeader>
          <DialogTitle>New evidence</DialogTitle>
          <DialogDescription>
            Describe the artifact and its first draft version. You can upload a file after saving.
          </DialogDescription>
        </DialogHeader>
        <Box className="min-h-0 flex-1 overflow-y-auto" padding="space.250">
          <form id={`${id}-form`} noValidate onSubmit={(event) => void submit(event)}>
            <Stack space="space.200">
              {loadError ? (
                <Stack space="space.100">
                  <p role="alert" className="text-danger">
                    {loadError.message}
                  </p>
                  <Button
                    size="small"
                    onClick={() =>
                      void Promise.all(
                        queries.filter((query) => query.error).map((query) => query.refetch()),
                      )
                    }
                  >
                    Retry loading choices
                  </Button>
                </Stack>
              ) : null}
              {!ready ? (
                <p role="status" className="text-subtle">
                  Loading workspace records…
                </p>
              ) : null}
              {invalidContext ? (
                <p role="alert" className="text-danger">
                  The selected program is unavailable. Close this dialog and reload the record.
                </p>
              ) : null}
              {!writable ? (
                <p role="alert" className="text-subtle">
                  An editor, admin, or owner can add evidence.
                </p>
              ) : null}
              <fieldset disabled={busy || !writable || !!saved} className="min-w-0 border-0 p-0">
                <Stack space="space.150">
                  <Field>
                    <FieldLabel htmlFor={`${id}-title`}>
                      Artifact title
                      <span aria-hidden="true" className="text-danger">
                        {" "}
                        *
                      </span>
                    </FieldLabel>
                    <Input
                      id={`${id}-title`}
                      aria-required
                      value={title}
                      onChange={(event) => {
                        setTitle(event.target.value);
                        changed();
                      }}
                      maxLength={1000}
                      autoFocus
                    />
                  </Field>
                  <Grid
                    gap="space.150"
                    templateColumns={{ base: "minmax(0,1fr)", sm: "repeat(2,minmax(0,1fr))" }}
                  >
                    <EvidenceChoice
                      label="Kind"
                      required
                      value={kind}
                      options={kinds.map((value) => ({ value, label: labelFor(value) }))}
                      onChange={(value) => {
                        setKind(value as CreateEvidenceInput["artifactKind"] | null);
                        changed();
                      }}
                    />
                    <EvidenceChoice
                      label="Owner"
                      value={owner}
                      options={(parties.data ?? []).map((party) => ({
                        value: party.id,
                        label: party.name,
                      }))}
                      disabled={!parties.data}
                      onChange={(value) => {
                        setOwner(value);
                        changed();
                      }}
                    />
                    {programId ? (
                      <KeyValue label="Program" wrap>
                        {contextProgram?.name ??
                          (programs.isPending ? "Loading…" : "Unavailable program")}
                      </KeyValue>
                    ) : (
                      <EvidenceChoice
                        label="Program"
                        value={chosenProgram}
                        options={(programs.data ?? []).map((program) => ({
                          value: program.id,
                          label: `${program.code} · ${program.name}`,
                        }))}
                        disabled={!programs.data}
                        onChange={chooseProgram}
                      />
                    )}
                    <EvidenceChoice
                      label="Scope"
                      value={scope}
                      options={availableScopes.map((row) => ({
                        value: row.id,
                        label: `${row.code} · ${row.name}`,
                      }))}
                      disabled={!effectiveProgramId || !scopes.data || !systems.data}
                      description={
                        !effectiveProgramId
                          ? "Choose a program to select one of its scopes."
                          : undefined
                      }
                      onChange={(value) => {
                        setScope(value);
                        changed();
                      }}
                    />
                  </Grid>
                  <Field>
                    <FieldLabel htmlFor={`${id}-description`}>Description</FieldLabel>
                    <Textarea
                      id={`${id}-description`}
                      value={description}
                      maxLength={10000}
                      onChange={(event) => {
                        setDescription(event.target.value);
                        changed();
                      }}
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor={`${id}-uri`}>External reference</FieldLabel>
                    <Input
                      id={`${id}-uri`}
                      value={externalUri}
                      maxLength={4000}
                      onChange={(event) => {
                        setExternalUri(event.target.value);
                        changed();
                      }}
                      aria-describedby={`${id}-uri-help`}
                    />
                    <FieldDescription id={`${id}-uri-help`}>
                      An HTTP, HTTPS, or URN reference, if the artifact already exists elsewhere.
                    </FieldDescription>
                  </Field>
                  <Field>
                    <FieldLabel htmlFor={`${id}-collected`}>Collected date and time</FieldLabel>
                    <Input
                      id={`${id}-collected`}
                      type="datetime-local"
                      value={collected}
                      onChange={(event) => {
                        setCollected(event.target.value);
                        changed();
                      }}
                      aria-describedby={`${id}-collected-help`}
                    />
                    <FieldDescription id={`${id}-collected-help`}>
                      Optional. Uses your local timezone.
                    </FieldDescription>
                  </Field>
                  <Field>
                    <FieldLabel htmlFor={`${id}-provenance`}>Provenance</FieldLabel>
                    <Textarea
                      id={`${id}-provenance`}
                      value={provenance}
                      maxLength={10000}
                      onChange={(event) => {
                        setProvenance(event.target.value);
                        changed();
                      }}
                      aria-describedby={`${id}-provenance-help`}
                    />
                    <FieldDescription id={`${id}-provenance-help`}>
                      Record how this evidence was obtained, if known.
                    </FieldDescription>
                  </Field>
                </Stack>
              </fieldset>
              {error ? (
                <Box role="alert" className="font-body-small text-danger">
                  <p>{error}</p>
                  {!saved ? (
                    <p className="pt-100">
                      Your details are retained. Retrying the same request will not create duplicate
                      evidence.
                    </p>
                  ) : null}
                </Box>
              ) : null}
            </Stack>
          </form>
        </Box>
        <DialogFooter>
          <Button variant="subtle" disabled={busy} onClick={close}>
            {saved ? "Close" : "Cancel"}
          </Button>
          {!saved ? (
            <Button
              type="submit"
              form={`${id}-form`}
              variant="primary"
              isLoading={busy}
              disabled={
                busy || !writable || !ready || !!loadError || invalidContext || !kinds.length
              }
            >
              Create evidence
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
