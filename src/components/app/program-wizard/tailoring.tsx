import { useId, useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import {
  Badge,
  Box,
  Button,
  Grid,
  Inline,
  Input,
  KeyValue,
  Section,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  Stack,
  Table,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  WorkPane,
} from "@ledger/design-system";
import type { ProgramWizardDraft, SystemWizardDraft } from "@/lib/program-wizard";
import {
  previewProgramTailoring,
  type ProgramTailoringPreview,
  type WizardParameterPreview,
  type WizardProfileOption,
} from "@/lib/program-wizard-reference";
import type { Row } from "@/lib/models";
import { ChoiceField, TextField } from "./fields";
import { ControlDetail } from "./control-detail";
import type { WizardResources } from "./resources";

const impacts = ["low", "moderate", "high"].map((value) => ({
  value,
  label: value[0]!.toUpperCase() + value.slice(1),
}));
function summary(system: SystemWizardDraft) {
  return [system.confidentiality, system.integrity, system.availability]
    .map((value) => (value ? value[0]!.toUpperCase() + value.slice(1) : "Unset"))
    .join(" · ");
}

export function TailoringStep({
  draft,
  onChange,
  data,
  profiles,
  previews,
}: {
  draft: ProgramWizardDraft;
  onChange: (draft: ProgramWizardDraft) => void;
  data: WizardResources;
  profiles: WizardProfileOption[];
  previews: Map<string, ProgramTailoringPreview>;
}) {
  const [selected, setSelected] = useState(draft.systems[0]?.key ?? "");
  const system = draft.systems.find((item) => item.key === selected) ?? draft.systems[0];
  if (!system) return null;
  const preview = previews.get(system.key)!;
  const patch = (values: Partial<SystemWizardDraft>) =>
    onChange({
      ...draft,
      systems: draft.systems.map((item) =>
        item.key === system.key ? { ...item, ...values } : item,
      ),
    });
  return (
    <WorkPane
      listWidth={240}
      listLabel={
        <Box className="font-heading-xxsmall uppercase text-subtle">
          Systems · {draft.systems.length}
        </Box>
      }
      list={
        <>
          {draft.systems.map((item) => {
            const result = previews.get(item.key)!;
            return (
              <WorkPane.Row
                key={item.key}
                id={item.code}
                title={item.name}
                meta={`${summary(item)} · ${item.profileResolutionId ? `${result.counts.selected} controls` : "Choose a profile"}`}
                tone={result.errors.length ? "warning" : "neutral"}
                isActive={item.key === system.key}
                onSelect={() => setSelected(item.key)}
              />
            );
          })}
        </>
      }
      detail={
        <SystemTailoring
          key={system.key}
          system={system}
          patch={patch}
          data={data}
          profiles={profiles.filter((profile) =>
            draft.availableProfileResolutionIds.includes(profile.id),
          )}
          catalogRevisionId={draft.catalogRevisionId}
          preview={preview}
        />
      }
    />
  );
}

function SystemTailoring({
  system,
  patch,
  data,
  profiles,
  catalogRevisionId,
  preview,
}: {
  system: SystemWizardDraft;
  patch: (values: Partial<SystemWizardDraft>) => void;
  data: WizardResources;
  profiles: WizardProfileOption[];
  catalogRevisionId: string;
  preview: ProgramTailoringPreview;
}) {
  const [tab, setTab] = useState("Controls");
  const [controlsOpen, setControlsOpen] = useState(false);
  const [parameterOpen, setParameterOpen] = useState(false);
  const [inspectId, setInspectId] = useState<string | null>(null);
  function changeProfile(profileResolutionId: string | null) {
    if (!profileResolutionId || system.profileResolutionId === profileResolutionId) return;
    if (
      (system.tailoring.length || system.parameters.length) &&
      !window.confirm(
        "Change the base profile? Your control decisions and parameter overrides will be retained and checked against the new base. Resolve any conflicts before creating the program.",
      )
    )
      return;
    patch({ profileResolutionId });
  }
  const selectedControls = preview.selectedControls;
  return (
    <Stack space="space.200">
      <div>
        <h2 className="font-body-large font-semibold">{system.name}</h2>
        <p className="font-body-small text-subtle">{system.code} · System boundary</p>
      </div>
      <Section title="Categorization">
        <Stack space="space.150">
          <Grid
            gap="space.150"
            templateColumns={{ base: "minmax(0,1fr)", lg: "repeat(3,minmax(0,1fr))" }}
          >
            {(["confidentiality", "integrity", "availability"] as const).map((objective) => (
              <ChoiceField
                key={objective}
                label={objective[0]!.toUpperCase() + objective.slice(1)}
                value={system[objective]}
                options={impacts}
                required
                onChange={(value) =>
                  patch({ [objective]: value as SystemWizardDraft[typeof objective] })
                }
              />
            ))}
          </Grid>
          <TextField
            label="Categorization rationale"
            value={system.categorizationRationale}
            onChange={(categorizationRationale) => patch({ categorizationRationale })}
            required
            multiline
            description="Explain the impact of a loss of confidentiality, integrity, or availability for this system."
          />
        </Stack>
      </Section>
      <Section title="Base profile">
        <ChoiceField
          label="Base profile"
          value={system.profileResolutionId}
          options={profiles.map((profile) => ({
            value: profile.id,
            label: `${profile.title} · ${profile.version} · ${profile.controlCount} controls`,
          }))}
          onChange={changeProfile}
          required
          description="This explicit published profile determines the starting control set. CIA does not select it automatically."
        />
      </Section>
      {system.profileResolutionId ? (
        <>
          <Grid gap="space.150" templateColumns="repeat(3,minmax(0,1fr))">
            <KeyValue label="Base controls">{preview.counts.base}</KeyValue>
            <KeyValue label="Included / excluded">
              {preview.counts.added} / {preview.counts.excluded}
            </KeyValue>
            <KeyValue label="Effective controls">{preview.counts.selected}</KeyValue>
          </Grid>
          {preview.errors.length ? (
            <Box className="rounded-medium border border-danger p-150" role="alert">
              <h3 className="font-body font-semibold text-danger">Resolve tailoring conflicts</h3>
              <Box as="ul" className="list-disc ps-200 font-body-small text-danger">
                {preview.errors.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </Box>
            </Box>
          ) : null}
          {preview.warnings.length ? (
            <details className="font-body-small text-subtle">
              <summary className="cursor-pointer">
                Reference notes · {preview.warnings.length}
              </summary>
              <Box as="ul" className="list-disc ps-200">
                {preview.warnings.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </Box>
            </details>
          ) : null}
          <Tabs value={tab} onValueChange={(value) => setTab(String(value))}>
            <TabsList variant="line">
              <TabsTrigger value="Controls">Controls · {preview.counts.selected}</TabsTrigger>
              <TabsTrigger value="Parameters">Parameters · {preview.counts.parameters}</TabsTrigger>
            </TabsList>
            <TabsContent value="Controls">
              <Stack space="space.200">
                <Section
                  title="Control decisions"
                  count={system.tailoring.length || null}
                  action={
                    <Button
                      size="small"
                      iconBefore={<Plus />}
                      onClick={() => {
                        setInspectId(null);
                        setControlsOpen(true);
                      }}
                    >
                      Tailor controls
                    </Button>
                  }
                >
                  {system.tailoring.length ? (
                    <Table>
                      <thead>
                        <Table.Row>
                          <Table.Header>Control</Table.Header>
                          <Table.Header>Decision</Table.Header>
                          <Table.Header>Rationale</Table.Header>
                          <Table.Header width={70}>Actions</Table.Header>
                        </Table.Row>
                      </thead>
                      <tbody>
                        {system.tailoring.map((decision) => {
                          const control = data.controls.find(
                            (item) => item.id === decision.controlId,
                          );
                          return (
                            <Table.Row key={decision.controlId}>
                              <Table.Cell>
                                <Button
                                  variant="link"
                                  onClick={() => {
                                    setInspectId(decision.controlId);
                                    setControlsOpen(true);
                                  }}
                                >
                                  {control?.code ?? "Unavailable control"}
                                </Button>
                              </Table.Cell>
                              <Table.Cell>
                                {decision.action === "include" ? "Include" : "Exclude"}
                              </Table.Cell>
                              <Table.Cell className="whitespace-normal">
                                {decision.rationale}
                              </Table.Cell>
                              <Table.Cell>
                                <Button
                                  variant="subtle"
                                  size="xsmall"
                                  aria-label={`Remove decision for ${control?.code ?? "control"}`}
                                  onClick={() =>
                                    patch({
                                      tailoring: system.tailoring.filter(
                                        (item) => item.controlId !== decision.controlId,
                                      ),
                                    })
                                  }
                                >
                                  <Trash2 className="size-150" />
                                </Button>
                              </Table.Cell>
                            </Table.Row>
                          );
                        })}
                      </tbody>
                    </Table>
                  ) : (
                    <p className="font-body-small text-subtle">
                      No manual control decisions. The effective set starts with the selected
                      profile.
                    </p>
                  )}
                </Section>
                <SelectedControlList
                  controls={selectedControls}
                  onSelect={(controlId) => {
                    setInspectId(controlId);
                    setControlsOpen(true);
                  }}
                />
              </Stack>
            </TabsContent>
            <TabsContent value="Parameters">
              <Section
                title="Parameter values"
                count={system.parameters.length ? `${system.parameters.length} overridden` : null}
                action={
                  <Button size="small" iconBefore={<Plus />} onClick={() => setParameterOpen(true)}>
                    Set parameter values
                  </Button>
                }
              >
                <p className="pb-150 font-body-small text-subtle">
                  {preview.counts.unsetParameters} parameters have no recorded value. Values can be
                  completed in the draft profile later.
                </p>
                {system.parameters.length ? (
                  <Table>
                    <thead>
                      <Table.Row>
                        <Table.Header>Parameter</Table.Header>
                        <Table.Header>Values</Table.Header>
                        <Table.Header>Rationale</Table.Header>
                        <Table.Header width={70}>Actions</Table.Header>
                      </Table.Row>
                    </thead>
                    <tbody>
                      {system.parameters.map((override) => {
                        const parameter = data.parameters.find(
                          (item) => item.id === override.parameterId,
                        );
                        return (
                          <Table.Row key={override.parameterId}>
                            <Table.Cell>
                              {parameter?.source_id ?? "Unavailable parameter"}
                            </Table.Cell>
                            <Table.Cell className="whitespace-normal">
                              {override.values.join("; ")}
                            </Table.Cell>
                            <Table.Cell className="whitespace-normal">
                              {override.rationale}
                            </Table.Cell>
                            <Table.Cell>
                              <Button
                                variant="subtle"
                                size="xsmall"
                                aria-label={`Remove override for ${parameter?.source_id ?? "parameter"}`}
                                onClick={() =>
                                  patch({
                                    parameters: system.parameters.filter(
                                      (item) => item.parameterId !== override.parameterId,
                                    ),
                                  })
                                }
                              >
                                <Trash2 className="size-150" />
                              </Button>
                            </Table.Cell>
                          </Table.Row>
                        );
                      })}
                    </tbody>
                  </Table>
                ) : (
                  <p className="font-body-small text-subtle">
                    No parameter overrides. Catalog and inherited profile values remain visible in
                    the parameter editor.
                  </p>
                )}
              </Section>
            </TabsContent>
          </Tabs>
          <ControlPicker
            key={controlsOpen ? `open-${inspectId}` : "closed"}
            open={controlsOpen}
            onClose={() => setControlsOpen(false)}
            initialControlId={inspectId}
            system={system}
            patch={patch}
            data={data}
            catalogRevisionId={catalogRevisionId}
            preview={preview}
          />
          <ParameterPicker
            key={parameterOpen ? "open" : "closed"}
            open={parameterOpen}
            onClose={() => setParameterOpen(false)}
            system={system}
            patch={patch}
            data={data}
            catalogRevisionId={catalogRevisionId}
            preview={preview}
          />
        </>
      ) : null}
    </Stack>
  );
}

function SelectedControlList({
  controls,
  onSelect,
}: {
  controls: ProgramTailoringPreview["selectedControls"];
  onSelect: (controlId: string) => void;
}) {
  const [search, setSearch] = useState("");
  const [limit, setLimit] = useState(40);
  const filtered = controls.filter((control) =>
    `${control.code} ${control.title}`.toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <Section title="Effective control set" count={String(controls.length)}>
      <Stack space="space.150">
        <Input
          aria-label="Search effective controls"
          placeholder="Find a control"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setLimit(40);
          }}
        />
        <Table>
          <thead>
            <Table.Row>
              <Table.Header width={110}>Control</Table.Header>
              <Table.Header>Title</Table.Header>
            </Table.Row>
          </thead>
          <tbody>
            {filtered.slice(0, limit).map((control) => (
              <Table.Row key={control.id}>
                <Table.Cell>
                  <Button variant="link" onClick={() => onSelect(control.id)}>
                    {control.code}
                  </Button>
                </Table.Cell>
                <Table.Cell>{control.title}</Table.Cell>
              </Table.Row>
            ))}
          </tbody>
        </Table>
        <Inline spread="space-between" alignBlock="center">
          <span className="font-body-small text-subtle">
            Showing {Math.min(limit, filtered.length)} of {filtered.length} matching controls
          </span>
          {filtered.length > limit ? (
            <Button size="small" onClick={() => setLimit((previous) => previous + 80)}>
              Show more controls
            </Button>
          ) : null}
        </Inline>
      </Stack>
    </Section>
  );
}

function ControlPicker({
  open,
  onClose,
  initialControlId,
  system,
  patch,
  data,
  catalogRevisionId,
  preview,
}: {
  open: boolean;
  onClose: () => void;
  initialControlId: string | null;
  system: SystemWizardDraft;
  patch: (values: Partial<SystemWizardDraft>) => void;
  data: WizardResources;
  catalogRevisionId: string;
  preview: ProgramTailoringPreview;
}) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string | null>("all");
  const [selected, setSelected] = useState(initialControlId);
  const [editorDirty, setEditorDirty] = useState(false);
  const selectedIds = useMemo(
    () => new Set(preview.selectedControls.map((control) => control.id)),
    [preview.selectedControls],
  );
  const controls = data.controls
    .filter((control) => control.catalog_revision_id === catalogRevisionId)
    .filter((control) =>
      `${control.code} ${control.title}`.toLowerCase().includes(search.toLowerCase()),
    )
    .filter(
      (control) =>
        filter === "all" ||
        (filter === "selected" ? selectedIds.has(control.id) : !selectedIds.has(control.id)),
    )
    .sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }));
  const control = data.controls.find((item) => item.id === selected);
  function close() {
    if (!editorDirty || window.confirm("Discard the unrecorded control rationale?")) {
      setEditorDirty(false);
      onClose();
    }
  }
  function select(controlId: string) {
    if (editorDirty && !window.confirm("Discard the unrecorded control rationale?")) return;
    setEditorDirty(false);
    setSelected(controlId);
  }
  return (
    <Sheet
      open={open}
      onOpenChange={(next, details) => {
        if (!next) {
          if (editorDirty && !window.confirm("Discard the unrecorded control rationale?")) {
            details.cancel();
            return;
          }
          setEditorDirty(false);
          onClose();
        }
      }}
    >
      <SheetContent side="end" style={{ maxWidth: 1040 }}>
        <SheetHeader>
          <SheetTitle>Tailor controls · {system.name}</SheetTitle>
          <SheetDescription>
            Inspect the source control, then record an inclusion or exclusion with its rationale.
          </SheetDescription>
        </SheetHeader>
        <Box className="min-h-0 flex-1 overflow-y-auto px-200 py-150">
          <WorkPane
            listWidth={300}
            listLabel={
              <Stack space="space.100">
                <Input
                  aria-label="Search catalog controls"
                  placeholder="Find a control"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
                <ChoiceField
                  label="Control set filter"
                  value={filter}
                  onChange={setFilter}
                  options={[
                    { value: "all", label: "All catalog controls" },
                    { value: "selected", label: "In effective set" },
                    { value: "outside", label: "Outside effective set" },
                  ]}
                />
                <span className="font-body-small text-subtle">
                  {controls.length} matching controls
                </span>
              </Stack>
            }
            list={
              <>
                {controls.map((item) => (
                  <WorkPane.Row
                    key={item.id}
                    id={item.code}
                    title={item.title}
                    meta={selectedIds.has(item.id) ? "In effective set" : "Outside effective set"}
                    isActive={item.id === selected}
                    onSelect={() => select(item.id)}
                  />
                ))}
              </>
            }
            detail={
              control ? (
                <ControlDecisionEditor
                  key={control.id}
                  control={control}
                  system={system}
                  patch={patch}
                  baseIds={preview.baseControlIds}
                  onDirty={setEditorDirty}
                />
              ) : (
                <p className="font-body-small text-subtle">
                  Select a control to inspect its statement and tailor its selection.
                </p>
              )
            }
          />
        </Box>
        <SheetFooter>
          <Button variant="primary" onClick={close}>
            Done
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function ControlDecisionEditor({
  control,
  system,
  patch,
  baseIds,
  onDirty,
}: {
  control: Row<"controls">;
  system: SystemWizardDraft;
  patch: (values: Partial<SystemWizardDraft>) => void;
  baseIds: string[];
  onDirty: (dirty: boolean) => void;
}) {
  const existing = system.tailoring.find((item) => item.controlId === control.id);
  const action = baseIds.includes(control.id) ? "exclude" : "include";
  const [rationale, setRationale] = useState(existing?.rationale ?? "");
  const [recorded, setRecorded] = useState(false);
  return (
    <Stack space="space.200">
      <Section
        title={action === "exclude" ? "Exclude from the base profile" : "Include from the catalog"}
      >
        <Stack space="space.150">
          <TextField
            label="Control decision rationale"
            value={rationale}
            onChange={(value) => {
              setRationale(value);
              setRecorded(false);
              onDirty(value !== (existing?.rationale ?? ""));
            }}
            required
            multiline
          />
          <Inline space="space.100" shouldWrap>
            <Button
              variant="primary"
              disabled={!rationale.trim()}
              onClick={() => {
                patch({
                  tailoring: [
                    ...system.tailoring.filter((item) => item.controlId !== control.id),
                    { controlId: control.id, action, rationale: rationale.trim() },
                  ],
                });
                setRecorded(true);
                onDirty(false);
              }}
            >
              {action === "exclude" ? "Record exclusion" : "Record inclusion"}
            </Button>
            {existing ? (
              <Button
                variant="subtle"
                onClick={() => {
                  patch({
                    tailoring: system.tailoring.filter((item) => item.controlId !== control.id),
                  });
                  setRationale("");
                  setRecorded(false);
                  onDirty(false);
                }}
              >
                Remove decision
              </Button>
            ) : null}
          </Inline>
          {recorded ? (
            <p role="status" className="font-body-small text-success">
              Decision added to the program draft.
            </p>
          ) : null}
        </Stack>
      </Section>
      <ControlDetail control={control} />
    </Stack>
  );
}

function ParameterPicker({
  open,
  onClose,
  system,
  patch,
  data,
  catalogRevisionId,
  preview,
}: {
  open: boolean;
  onClose: () => void;
  system: SystemWizardDraft;
  patch: (values: Partial<SystemWizardDraft>) => void;
  data: WizardResources;
  catalogRevisionId: string;
  preview: ProgramTailoringPreview;
}) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const parameters = preview.parameters.filter((item) =>
    `${item.parameter.source_id} ${item.parameter.label ?? ""}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );
  const parameter = preview.parameters.find((item) => item.parameter.id === selected);
  function canLeave() {
    return !dirty || window.confirm("Discard the unrecorded parameter override?");
  }
  function close() {
    if (canLeave()) {
      setDirty(false);
      onClose();
    }
  }
  return (
    <Sheet
      open={open}
      onOpenChange={(next, details) => {
        if (!next) {
          if (!canLeave()) {
            details.cancel();
            return;
          }
          setDirty(false);
          onClose();
        }
      }}
    >
      <SheetContent side="end" style={{ maxWidth: 1040 }}>
        <SheetHeader>
          <SheetTitle>Set parameter values · {system.name}</SheetTitle>
          <SheetDescription>
            Override a parameter used by the effective control set. Each override records its values
            and rationale.
          </SheetDescription>
        </SheetHeader>
        <Box className="min-h-0 flex-1 overflow-y-auto px-200 py-150">
          <WorkPane
            listWidth={300}
            listLabel={
              <Input
                aria-label="Search parameters"
                placeholder="Find a parameter"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            }
            list={
              <>
                {parameters.map((item) => (
                  <WorkPane.Row
                    key={item.parameter.id}
                    id={item.parameter.source_id}
                    title={item.parameter.label || "Parameter"}
                    meta={
                      item.origin === "unset"
                        ? "No recorded value"
                        : `${item.origin} · ${item.values.join("; ")}`
                    }
                    isActive={item.parameter.id === selected}
                    onSelect={() => {
                      if (canLeave()) {
                        setDirty(false);
                        setSelected(item.parameter.id);
                      }
                    }}
                  />
                ))}
              </>
            }
            detail={
              parameter ? (
                <ParameterEditor
                  key={parameter.parameter.id}
                  item={parameter}
                  system={system}
                  patch={patch}
                  data={data}
                  catalogRevisionId={catalogRevisionId}
                  onDirty={setDirty}
                />
              ) : (
                <p className="font-body-small text-subtle">
                  Select a parameter to inspect its source definition and set values.
                </p>
              )
            }
          />
        </Box>
        <SheetFooter>
          <Button variant="primary" onClick={close}>
            Done
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function ParameterEditor({
  item,
  system,
  patch,
  data,
  catalogRevisionId,
  onDirty,
}: {
  item: WizardParameterPreview;
  system: SystemWizardDraft;
  patch: (values: Partial<SystemWizardDraft>) => void;
  data: WizardResources;
  catalogRevisionId: string;
  onDirty: (dirty: boolean) => void;
}) {
  const id = useId();
  const existing = system.parameters.find((override) => override.parameterId === item.parameter.id);
  const [values, setValues] = useState(item.values.join("\n"));
  const [rationale, setRationale] = useState(existing?.rationale ?? "");
  const [error, setError] = useState("");
  const [recorded, setRecorded] = useState(false);
  const parameter = item.parameter;
  const control = data.controls.find((control) => control.id === parameter.control_id);
  function record() {
    const next = [
      ...system.parameters.filter((override) => override.parameterId !== parameter.id),
      {
        parameterId: parameter.id,
        values: values
          .split("\n")
          .map((value) => value.trim())
          .filter(Boolean),
        rationale: rationale.trim(),
      },
    ];
    const result = previewProgramTailoring(
      {
        catalogRevisionId,
        profileResolutionId: system.profileResolutionId,
        tailoring: system.tailoring,
        parameters: next,
      },
      data,
    );
    if (result.errors.length) {
      setError(result.errors.join(" "));
      return;
    }
    patch({ parameters: next });
    setError("");
    setRecorded(true);
    onDirty(false);
  }
  return (
    <Stack space="space.200">
      <div>
        <h3 id={id} className="font-body-large font-semibold">
          {parameter.source_id}
        </h3>
        <p className="font-body-small text-subtle">{parameter.label}</p>
        {control ? (
          <p className="font-body-small text-subtle">
            {control.code} · {control.title}
          </p>
        ) : null}
      </div>
      {parameter.usage ? (
        <p className="font-body-small whitespace-pre-wrap">{parameter.usage}</p>
      ) : null}
      <KeyValue label="Current source">
        {item.origin === "unset" ? "No recorded value" : item.origin}
      </KeyValue>
      {item.choices.length ? (
        <Section
          title={`Source choices${parameter.selection_count ? ` · ${parameter.selection_count.replaceAll("_", " ")}` : ""}`}
        >
          <Box as="ul" className="list-disc ps-200 font-body-small">
            {item.choices.map((choice) => (
              <li key={choice}>{choice}</li>
            ))}
          </Box>
        </Section>
      ) : null}
      {item.constraints.length ? (
        <Section title="Source constraints">
          <Stack space="space.100">
            {item.constraints.map((constraint) => (
              <p key={constraint} className="font-body-small whitespace-pre-wrap">
                {constraint}
              </p>
            ))}
          </Stack>
        </Section>
      ) : null}
      {item.guidelines.length ? (
        <Section title="Guidance">
          <Stack space="space.100">
            {item.guidelines.map((guideline) => (
              <p key={guideline} className="font-body-small whitespace-pre-wrap">
                {guideline}
              </p>
            ))}
          </Stack>
        </Section>
      ) : null}
      <TextField
        label="Parameter values"
        value={values}
        onChange={(value) => {
          setValues(value);
          setRecorded(false);
          onDirty(true);
        }}
        required
        multiline
        description="One value per line. Literal choices, when declared, must match the source."
      />
      <TextField
        label="Parameter override rationale"
        value={rationale}
        onChange={(value) => {
          setRationale(value);
          setRecorded(false);
          onDirty(true);
        }}
        required
        multiline
      />
      <Inline space="space.100">
        <Button variant="primary" disabled={!values.trim() || !rationale.trim()} onClick={record}>
          Record parameter override
        </Button>
        {existing ? (
          <Button
            variant="subtle"
            onClick={() => {
              patch({
                parameters: system.parameters.filter(
                  (override) => override.parameterId !== parameter.id,
                ),
              });
              setRecorded(false);
              onDirty(false);
              setError("");
            }}
          >
            Remove override
          </Button>
        ) : null}
      </Inline>
      {error ? (
        <p role="alert" className="font-body-small text-danger">
          {error}
        </p>
      ) : null}
      {recorded ? (
        <p role="status" className="font-body-small text-success">
          Parameter override added to the program draft.
        </p>
      ) : null}
    </Stack>
  );
}
