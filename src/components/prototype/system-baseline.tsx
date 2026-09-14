import { useId, useMemo, useRef, useState, type FormEvent } from "react";
import { useBlocker } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  Badge,
  Box,
  Button,
  Checkbox,
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
} from "@ledger/design-system";
import { useWorkspace } from "@/components/app/workspace";
import { database, requireIdentity } from "@/lib/database";
import { useRow, useRows, type Row } from "@/lib/models";

type ProfileChoice = {
  id: string;
  label: string;
  catalogId: string;
  documentId: string;
  catalogDocumentId: string;
  controlIds: string[];
};

/** The read model is shared by allocation/mapping and SSP views; no UI fallback guesses. */
export function SystemBaseline({ systemId }: { systemId: string }) {
  const workspace = useWorkspace();
  const system = useRow("systems", systemId);
  const effective = useRow("system_effective_baselines", systemId);
  const source = useRow("systems", effective.data?.source_system_id);
  const resolutions = useRows("profile_resolutions");
  const profiles = useRows("profile_revisions");
  const imports = useRows("profile_imports");
  const catalogs = useRows("catalog_revisions");
  const selections = useRows("selected_controls");
  const controls = useRows("controls");
  const [editing, setEditing] = useState(false);
  const [search, setSearch] = useState("");
  const choices = useMemo<ProfileChoice[]>(
    () =>
      (resolutions.data ?? [])
        .flatMap((resolution) => {
          const profile = profiles.data?.find(
            (row) => row.id === resolution.profile_revision_id && row.state === "published",
          );
          const imported = imports.data?.filter((row) => row.profile_revision_id === profile?.id);
          const catalog = catalogs.data?.find(
            (row) => row.id === imported?.[0]?.catalog_revision_id && row.state === "published",
          );
          if (resolution.state !== "published" || !profile || imported?.length !== 1 || !catalog)
            return [];
          const controlIds = (selections.data ?? [])
            .filter((row) => row.profile_resolution_id === resolution.id)
            .map((row) => row.control_id);
          return controlIds.length
            ? [
                {
                  id: resolution.id,
                  label: `${profile.title} · ${profile.version}`,
                  catalogId: catalog.id,
                  documentId: profile.document_revision_id,
                  catalogDocumentId: catalog.document_revision_id,
                  controlIds,
                },
              ]
            : [];
        })
        .sort((a, b) => a.label.localeCompare(b.label)),
    [resolutions.data, profiles.data, imports.data, catalogs.data, selections.data],
  );
  const currentResolution = resolutions.data?.find(
    (row) => row.id === effective.data?.profile_resolution_id,
  );
  const currentProfile = profiles.data?.find(
    (row) => row.id === currentResolution?.profile_revision_id,
  );
  const currentDocument = useRow("oscal_document_revisions", currentProfile?.document_revision_id);
  const resolutionInputs = useRows(
    "profile_resolution_inputs",
    { profile_resolution_id: currentResolution?.id ?? "00000000-0000-0000-0000-000000000000" },
    { enabled: !!currentResolution },
  );
  const selected = new Set(
    (selections.data ?? [])
      .filter((row) => row.profile_resolution_id === currentResolution?.id)
      .map((row) => row.control_id),
  );
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
  const verifiedSource =
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
  const editorSource = publishedSource ?? verifiedSource;
  const displayed = selectedControls.filter((row) =>
    `${row.code} ${row.title}`.toLowerCase().includes(search.toLowerCase()),
  );
  const queries = [
    system,
    effective,
    resolutions,
    profiles,
    imports,
    catalogs,
    selections,
    controls,
    ...(currentProfile ? [currentDocument] : []),
    ...(currentResolution ? [resolutionInputs] : []),
  ];
  const error = queries.find((query) => query.error)?.error;
  const ready = queries.every((query) => query.data !== undefined && !query.error);
  const canEdit =
    workspace.role !== "viewer" &&
    workspace.collections.some((row) => row.name === "systems" && row.can_update);
  return (
    <Stack space="space.250">
      <Inline alignBlock="center" spread="space-between" shouldWrap>
        <Stack space="space.050">
          <h2 className="font-heading-small">Control baseline</h2>
          <p className="font-body-small text-subtle">
            {effective.data?.source_label ?? "Loading baseline…"}
            {source.data ? ` · ${source.data.code} ${source.data.name}` : ""}
          </p>
        </Stack>
        {canEdit && (
          <Button
            variant="secondary"
            disabled={!ready || !system.data}
            onClick={() => setEditing(true)}
          >
            Change baseline
          </Button>
        )}
      </Inline>
      {error ? (
        <p role="alert" className="text-danger">
          {error.message}
        </p>
      ) : !ready ? (
        <p className="text-subtle">Loading control baseline…</p>
      ) : (
        <>
          {currentProfile ? (
            <>
              <Inline alignBlock="center" space="space.100" shouldWrap>
                <span className="font-body-medium font-medium">{currentProfile.title}</span>
                <Badge variant="secondary">{selectedControls.length} controls</Badge>
                {currentResolution?.state === "draft" && (
                  <Badge tone="warning" variant="secondary">
                    Draft tailored profile
                  </Badge>
                )}
                {effective.data?.inherited && <Badge variant="secondary">Inherited</Badge>}
              </Inline>
              {system.data?.baseline_rationale && (
                <p className="whitespace-pre-wrap font-body-small">
                  {system.data.baseline_rationale}
                </p>
              )}
              <Input
                aria-label="Find baseline controls"
                placeholder="Find a control by code or title"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
              <Box className="max-h-[32rem] overflow-auto rounded-medium border border-default">
                <Table>
                  <thead>
                    <Table.Row>
                      <Table.Header style={{ width: 150 }}>Control</Table.Header>
                      <Table.Header>Title</Table.Header>
                    </Table.Row>
                  </thead>
                  <tbody>
                    {displayed.map((control) => (
                      <Table.Row key={control.id}>
                        <Table.Cell>{control.code}</Table.Cell>
                        <Table.Cell className="whitespace-normal">{control.title}</Table.Cell>
                      </Table.Row>
                    ))}
                    {!displayed.length && (
                      <Table.Row>
                        <Table.Cell colSpan={2}>No matching controls.</Table.Cell>
                      </Table.Row>
                    )}
                  </tbody>
                </Table>
              </Box>
            </>
          ) : (
            <p className="font-body-small text-subtle">
              No control baseline is recorded for this system. Adopt a published profile or inherit
              an adoption from a containing system.
            </p>
          )}
        </>
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
                      <FieldLabel htmlFor={`${fieldId}-profile`}>Published profile</FieldLabel>
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
                        No published, resolved profiles with a direct catalog import are available.
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
                          Control changes create a draft OSCAL profile. Existing profile parameter
                          values are retained for selected controls.
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
