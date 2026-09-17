import { useMemo, useState } from "react";
import { ChevronDown, Plus, Trash2 } from "lucide-react";
import {
  Box,
  Button,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  DataTable,
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
  Fact,
  IconButton,
  Section,
  Stack,
  Table,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Toolbar,
  defineColumns,
  useDataTable,
  type Preset,
} from "@ledger/design-system";
import type { ParameterOverride, TailoringDecision } from "@/lib/program-wizard";
import {
  previewProgramTailoring,
  type ProgramTailoringPreview,
  type WizardControl,
} from "@/lib/program-wizard-reference";
import { ControlPicker } from "./control-picker";
import { ParameterPicker } from "./parameter-picker";
import type { ReferenceData } from "./use-reference-data";

export type ProfileTailoringValue = {
  tailoring: TailoringDecision[];
  parameters: ParameterOverride[];
};
type EffectiveRow = {
  id: string;
  code: string;
  title: string;
  family: string;
  source: "From base" | "Tailored in";
};
const presets: Preset[] = [
  { id: "all", label: "All controls" },
  { id: "base", label: "From base", filters: [{ id: "source", value: ["From base"] }] },
  { id: "added", label: "Tailored in", filters: [{ id: "source", value: ["Tailored in"] }] },
];

/**
 * A profile's tailoring against its base, the OSCAL way: what is tailored out of the base profile,
 * what is tailored in from the catalog, the parameter overrides, and the effective set that results.
 * The wizard edits a program overlay with it; the profile page reads a saved overlay with it.
 */
export function ProfileTailoringEditor({
  catalogRevisionId,
  baseResolutionId,
  decisions,
  parameters,
  onChange,
  readOnly = false,
  data,
  preview: given,
  title,
}: {
  catalogRevisionId: string;
  baseResolutionId: string;
  decisions: TailoringDecision[];
  parameters: ParameterOverride[];
  onChange?: ((next: ProfileTailoringValue) => void) | undefined;
  readOnly?: boolean | undefined;
  data: ReferenceData;
  preview?: ProgramTailoringPreview | undefined;
  /** Names the sheets: "Tailor controls · <title>". */
  title: string;
}) {
  const preview = useMemo(
    () =>
      given ??
      previewProgramTailoring(
        { catalogRevisionId, baseResolutionId, tailoring: decisions, parameters },
        data,
      ),
    [given, catalogRevisionId, baseResolutionId, decisions, parameters, data],
  );
  const [tab, setTab] = useState("Controls");
  const [controlsOpen, setControlsOpen] = useState(false);
  const [parameterOpen, setParameterOpen] = useState(false);
  const [inspectId, setInspectId] = useState<string | null>(null);
  const editable = !readOnly && !!onChange;
  const setDecisions = (tailoring: TailoringDecision[]) => onChange?.({ tailoring, parameters });
  const setParameters = (next: ParameterOverride[]) =>
    onChange?.({ tailoring: decisions, parameters: next });
  const controlById = useMemo(
    () => new Map(data.controls.map((control) => [control.id, control])),
    [data.controls],
  );
  const familyOf = useMemo(() => {
    const groups = new Map(data.catalogGroups.map((group) => [group.id, group]));
    return (control: WizardControl | undefined) => {
      let cursor = control?.group_id ?? null;
      const seen = new Set<string>();
      while (cursor && !seen.has(cursor)) {
        seen.add(cursor);
        const group = groups.get(cursor);
        if (!group?.parent_group_id) return group?.source_id?.toUpperCase() ?? "—";
        cursor = group.parent_group_id;
      }
      return "—";
    };
  }, [data.catalogGroups]);
  const decisionRows = (action: TailoringDecision["action"]) =>
    decisions
      .filter((decision) => decision.action === action)
      .map((decision) => ({ decision, control: controlById.get(decision.controlId) }))
      .sort((a, b) =>
        (a.control?.code ?? "").localeCompare(b.control?.code ?? "", undefined, { numeric: true }),
      );
  const outRows = decisionRows("exclude");
  const inRows = decisionRows("include");
  const added = useMemo(() => new Set(preview.addedControlIds), [preview.addedControlIds]);
  const selectedIds = useMemo(
    () => new Set(preview.selectedControls.map((control) => control.id)),
    [preview.selectedControls],
  );
  const effective = useMemo<EffectiveRow[]>(
    () =>
      preview.selectedControls.map((control) => ({
        id: control.id,
        code: control.code,
        title: control.title,
        family: familyOf(control),
        source: added.has(control.id) ? "Tailored in" : "From base",
      })),
    [preview.selectedControls, added, familyOf],
  );
  const columns = useMemo(
    () =>
      defineColumns<EffectiveRow>((c) => [
        c.id("code", { header: "Control", width: 120, hideable: false }),
        c.text("title", { header: "Title", minWidth: 260, hideable: false }),
        c.text("family", { header: "Family", width: 100 }),
        c.status("source", {
          header: "Source",
          width: 130,
          tone: (row) => (row.source === "Tailored in" ? "success" : "neutral"),
        }),
      ]),
    [],
  );
  const table = useDataTable({
    columns,
    data: effective,
    getRowId: (row) => row.id,
    label: "Effective control set",
    view: "profile-tailoring-effective-v1",
    pageSize: 50,
  });
  const open = (controlId: string | null) => {
    setInspectId(controlId);
    setControlsOpen(true);
  };
  const removeDecision = (controlId: string) =>
    setDecisions(decisions.filter((item) => item.controlId !== controlId));
  return (
    <Stack space="space.200">
      <Fact.Group>
        <Fact label="Base">{preview.counts.base}</Fact>
        <Fact label="Tailored out">{preview.counts.excluded}</Fact>
        <Fact label="Tailored in">{preview.counts.added}</Fact>
        <Fact label="Effective">{preview.counts.selected}</Fact>
        <Fact label="Parameters overridden">{parameters.length}</Fact>
      </Fact.Group>
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
          <summary className="cursor-pointer">Reference notes · {preview.warnings.length}</summary>
          <Box as="ul" className="list-disc ps-200">
            {preview.warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </Box>
        </details>
      ) : null}
      <Collapsible>
        <CollapsibleTrigger
          render={
            <Button variant="subtle" size="small" iconAfter={<ChevronDown />}>
              By family · {preview.families.length}
            </Button>
          }
        />
        <CollapsibleContent>
          <Table>
            <thead>
              <Table.Row>
                <Table.Header>Family</Table.Header>
                <Table.Header className="text-right">Base</Table.Header>
                <Table.Header className="text-right">Out</Table.Header>
                <Table.Header className="text-right">In</Table.Header>
                <Table.Header className="text-right">Effective</Table.Header>
              </Table.Row>
            </thead>
            <tbody>
              {preview.families.map((family) => (
                <Table.Row key={family.groupId ?? family.sourceId}>
                  <Table.Cell>
                    <span className="font-medium">{family.sourceId.toUpperCase()}</span>{" "}
                    <span className="text-subtle">{family.title}</span>
                  </Table.Cell>
                  <Table.Cell className="text-right tabular-nums">{family.base}</Table.Cell>
                  <Table.Cell className="text-right tabular-nums">{family.out || ""}</Table.Cell>
                  <Table.Cell className="text-right tabular-nums">{family.in || ""}</Table.Cell>
                  <Table.Cell className="text-right tabular-nums">{family.effective}</Table.Cell>
                </Table.Row>
              ))}
            </tbody>
          </Table>
        </CollapsibleContent>
      </Collapsible>
      <Tabs value={tab} onValueChange={(value) => setTab(String(value))}>
        <TabsList variant="line" aria-label="Profile tailoring views">
          <TabsTrigger value="Controls">Controls · {preview.counts.selected}</TabsTrigger>
          <TabsTrigger value="Parameters">Parameters · {preview.counts.parameters}</TabsTrigger>
        </TabsList>
        <TabsContent value="Controls">
          <Stack space="space.200">
            <DecisionTable
              title="Tailored out"
              count={outRows.length}
              rows={outRows}
              editable={editable}
              onOpen={open}
              onRemove={removeDecision}
              emptyTitle="Nothing tailored out"
              emptyDescription="Every control the base profile selects stays in."
              action={
                editable ? (
                  <Button size="small" iconBefore={<Plus />} onClick={() => open(null)}>
                    Tailor controls…
                  </Button>
                ) : null
              }
            />
            <DecisionTable
              title="Tailored in"
              count={inRows.length}
              rows={inRows}
              editable={editable}
              onOpen={open}
              onRemove={removeDecision}
              emptyTitle="Nothing tailored in"
              emptyDescription="No control is added from the catalog beyond the base profile."
            />
            <Section title="Effective control set" count={preview.counts.selected}>
              <DataTable
                responsive
                table={table}
                onRowClick={(row) => open(row.id)}
                empty={{
                  illustration: "shield",
                  title: "No controls in the effective set",
                  description: "Choose a base profile with a recorded selection.",
                }}
                toolbar={
                  <Toolbar
                    search={String(table.state.globalFilter ?? "")}
                    onSearch={(value) => table.setGlobalFilter(value)}
                    placeholder="Find a control"
                  >
                    <DataTable.Presets table={table} presets={presets} variant="menu" />
                    <DataTable.Columns table={table} />
                    <DataTable.Settings table={table} />
                  </Toolbar>
                }
              />
            </Section>
          </Stack>
        </TabsContent>
        <TabsContent value="Parameters">
          <Section
            title="Parameter overrides"
            count={parameters.length || null}
            action={
              editable ? (
                <Button size="small" iconBefore={<Plus />} onClick={() => setParameterOpen(true)}>
                  Set parameter values…
                </Button>
              ) : (
                <Button size="small" variant="subtle" onClick={() => setParameterOpen(true)}>
                  Inspect parameters
                </Button>
              )
            }
          >
            <p className="pb-150 font-body-small text-subtle">
              {preview.counts.unsetParameters} of {preview.counts.parameters} parameters have no
              recorded value. Values can be completed later.
            </p>
            {parameters.length ? (
              <Table>
                <thead>
                  <Table.Row>
                    <Table.Header>Parameter</Table.Header>
                    <Table.Header>Control</Table.Header>
                    <Table.Header>Values</Table.Header>
                    <Table.Header>Rationale</Table.Header>
                    {editable ? <Table.Header width={56}>Actions</Table.Header> : null}
                  </Table.Row>
                </thead>
                <tbody>
                  {parameters.map((override) => {
                    const parameter = data.parameters.find(
                      (item) => item.id === override.parameterId,
                    );
                    const control = controlById.get(parameter?.control_id ?? "");
                    return (
                      <Table.Row key={override.parameterId}>
                        <Table.Cell>{parameter?.source_id ?? "Unavailable parameter"}</Table.Cell>
                        <Table.Cell>{control?.code ?? "—"}</Table.Cell>
                        <Table.Cell className="whitespace-normal">
                          {override.values.join("; ")}
                        </Table.Cell>
                        <Table.Cell className="whitespace-normal">{override.rationale}</Table.Cell>
                        {editable ? (
                          <Table.Cell>
                            <IconButton
                              variant="subtle"
                              size="small"
                              icon={<Trash2 />}
                              label={`Remove override for ${parameter?.source_id ?? "parameter"}`}
                              onClick={() =>
                                setParameters(
                                  parameters.filter(
                                    (item) => item.parameterId !== override.parameterId,
                                  ),
                                )
                              }
                            />
                          </Table.Cell>
                        ) : null}
                      </Table.Row>
                    );
                  })}
                </tbody>
              </Table>
            ) : (
              <Empty size="compact">
                <EmptyHeader>
                  <EmptyTitle>No parameter overrides</EmptyTitle>
                  <EmptyDescription>
                    Catalog defaults and the base profile's values stay in effect.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            )}
          </Section>
        </TabsContent>
      </Tabs>
      <ControlPicker
        key={controlsOpen ? `open-${inspectId}` : "closed"}
        open={controlsOpen}
        onClose={() => setControlsOpen(false)}
        initialControlId={inspectId}
        title={title}
        decisions={decisions}
        onChange={setDecisions}
        readOnly={!editable}
        baseControlIds={preview.baseControlIds}
        selectedControlIds={selectedIds}
        catalogRevisionId={catalogRevisionId}
        data={data}
      />
      <ParameterPicker
        key={parameterOpen ? "open" : "closed"}
        open={parameterOpen}
        onClose={() => setParameterOpen(false)}
        title={title}
        decisions={decisions}
        parameters={parameters}
        onChange={setParameters}
        readOnly={!editable}
        catalogRevisionId={catalogRevisionId}
        baseResolutionId={baseResolutionId}
        data={data}
        preview={preview}
      />
    </Stack>
  );
}

function DecisionTable({
  title,
  count,
  rows,
  editable,
  onOpen,
  onRemove,
  emptyTitle,
  emptyDescription,
  action,
}: {
  title: string;
  count: number;
  rows: { decision: TailoringDecision; control: WizardControl | undefined }[];
  editable: boolean;
  onOpen: (controlId: string) => void;
  onRemove: (controlId: string) => void;
  emptyTitle: string;
  emptyDescription: string;
  action?: React.ReactNode;
}) {
  return (
    <Section title={title} count={count || null} action={action}>
      {rows.length ? (
        <Table>
          <thead>
            <Table.Row>
              <Table.Header width={120}>Control</Table.Header>
              <Table.Header>Title</Table.Header>
              <Table.Header>Rationale</Table.Header>
              {editable ? <Table.Header width={56}>Actions</Table.Header> : null}
            </Table.Row>
          </thead>
          <tbody>
            {rows.map(({ decision, control }) => (
              <Table.Row key={decision.controlId}>
                <Table.Cell>
                  <Button variant="link" onClick={() => onOpen(decision.controlId)}>
                    {control?.code ?? "Unavailable control"}
                  </Button>
                </Table.Cell>
                <Table.Cell className="whitespace-normal">{control?.title}</Table.Cell>
                <Table.Cell className="whitespace-normal">{decision.rationale}</Table.Cell>
                {editable ? (
                  <Table.Cell>
                    <IconButton
                      variant="subtle"
                      size="small"
                      icon={<Trash2 />}
                      label={`Remove decision for ${control?.code ?? "control"}`}
                      onClick={() => onRemove(decision.controlId)}
                    />
                  </Table.Cell>
                ) : null}
              </Table.Row>
            ))}
          </tbody>
        </Table>
      ) : (
        <Empty size="compact">
          <EmptyHeader>
            <EmptyTitle>{emptyTitle}</EmptyTitle>
            <EmptyDescription>{emptyDescription}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    </Section>
  );
}
