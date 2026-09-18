import { ControlInspector } from "@/components/prototype/library-controls";
import { ProductCollection } from "@/components/prototype/product-collection";
import {
  RecordLink,
  RecordPreviewActions,
  RecordPreviewPanel,
  recordDestination,
  useDisplayedRecords,
} from "@/components/prototype/record-preview";
import { useRows } from "@/lib/models";
import type { ParameterOverride, TailoringDecision } from "@/lib/program-wizard";
import {
  previewProgramTailoring,
  type ProgramTailoringPreview,
  type WizardControl,
} from "@/lib/program-wizard-reference";
import {
  Box,
  Button,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  DataTable,
  Fact,
  KeyValue,
  Section,
  Stack,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  defineColumns,
  useDataTable,
  type Preset,
} from "@ledger/design-system";
import { useNavigate } from "@tanstack/react-router";
import { ChevronDown, Plus } from "lucide-react";
import { useMemo, useState } from "react";
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
  const navigate = useNavigate();
  const allControls = useRows("controls");
  const [previewControl, setPreviewControl] = useState<string | null>(null);
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
        c.id("code", {
          header: "Control",
          width: 120,
          hideable: false,
          preview: (row) => setPreviewControl(row.id),
          active: (row) => row.id === previewControl,
        }),
        c.text("title", {
          header: "Title",
          minWidth: 220,
          priority: 0,
          hideable: false,
          cell: (row) => (
            <RecordLink table="controls" record={row}>
              {row.title}
            </RecordLink>
          ),
        }),
        c.text("family", { header: "Family", width: 100 }),
        c.status("source", {
          header: "Source",
          width: 130,
          tone: (row) => (row.source === "Tailored in" ? "success" : "neutral"),
        }),
      ]),
    [previewControl],
  );
  const table = useDataTable({
    columns,
    data: effective,
    getRowId: (row) => row.id,
    label: "Effective control set",
    view: "profile-tailoring-effective-v1",
    pageSize: 50,
  });
  const displayed = useDisplayedRecords(table);
  const displayedControls = displayed.flatMap((row) => {
    const control = allControls.data?.find((control) => control.id === row.id);
    return control ? [control] : [];
  });
  const inspected = allControls.data?.find((control) => control.id === previewControl);
  const open = (controlId: string | null) => {
    setInspectId(controlId);
    setControlsOpen(true);
  };
  const removeDecision = (controlId: string) =>
    setDecisions(decisions.filter((item) => item.controlId !== controlId));
  return (
    <Stack space="space.200">
      <Collapsible>
        <CollapsibleTrigger
          render={
            <Button variant="subtle" size="small" iconAfter={<ChevronDown />}>
              Details
            </Button>
          }
        />
        <CollapsibleContent>
          <Fact.Group>
            <Fact label="Base">{preview.counts.base}</Fact>
            <Fact label="Tailored out">{preview.counts.excluded}</Fact>
            <Fact label="Tailored in">{preview.counts.added}</Fact>
            <Fact label="Effective">{preview.counts.selected}</Fact>
            <Fact label="Parameters overridden">{parameters.length}</Fact>
          </Fact.Group>
        </CollapsibleContent>
      </Collapsible>
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
          <FamilyTable families={preview.families} />
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
                    Tailor controls
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
              <ProductCollection
                table={table}
                onRowClick={(row) => void navigate(recordDestination("controls", row))}
                views={<DataTable.Presets table={table} presets={presets} variant="menu" />}
                empty={{
                  illustration: "shield",
                  title: "No controls in the effective set",
                  description: "Choose a base profile with a recorded selection.",
                }}
                fill
                searchLabel="Find a control"
              />
            </Section>
          </Stack>
        </TabsContent>
        <TabsContent value="Parameters">
          <ParameterTable
            parameters={parameters}
            data={data}
            editable={editable}
            onOpen={() => setParameterOpen(true)}
            onRemove={(parameterId) =>
              setParameters(parameters.filter((item) => item.parameterId !== parameterId))
            }
          />
        </TabsContent>
      </Tabs>
      {inspected && (
        <ControlInspector
          control={inspected}
          records={displayedControls}
          onSelect={(control) => setPreviewControl(control.id)}
          onClose={() => setPreviewControl(null)}
        />
      )}
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
  const navigate = useNavigate();
  const items = rows.map(({ decision, control }) => ({
    id: decision.controlId,
    code: control?.code ?? "Unavailable control",
    title: control?.title ?? "Unavailable control",
    rationale: decision.rationale,
  }));
  const [selected, setSelected] = useState<(typeof items)[number] | null>(null);
  const columns = defineColumns<(typeof items)[number]>((c) => [
    c.id("code", {
      header: "Control",
      width: 120,
      preview: setSelected,
      active: (row) => row.id === selected?.id,
    }),
    c.text("title", {
      header: "Title",
      minWidth: 220,
      priority: 0,
      hideable: false,
      cell: (row) => (
        <RecordLink table="controls" record={row}>
          {row.title}
        </RecordLink>
      ),
    }),
    c.text("rationale", { header: "Rationale", width: 360, wrap: true }),
    ...(editable
      ? [
          c.actions((row) => [
            { label: "Tailor controls", onSelect: () => onOpen(row.id) },
            { label: "Remove decision", onSelect: () => onRemove(row.id) },
          ]),
        ]
      : []),
  ]);
  const table = useDataTable({
    data: items,
    columns,
    getRowId: (row) => row.id,
    label: title,
    view: `profile-decisions-${title}`,
  });
  const displayed = useDisplayedRecords(table);
  return (
    <Section title={title} count={count || null}>
      <ProductCollection
        table={table}
        searchLabel="Find a tailored control"
        action={action}
        onRowClick={(row) => void navigate(recordDestination("controls", row))}
        empty={{ illustration: "shield", title: emptyTitle, description: emptyDescription }}
      />
      {selected && (
        <RecordPreviewPanel
          title={selected.title}
          label="Tailoring decision preview"
          onClose={() => setSelected(null)}
          navigation={
            <RecordPreviewActions
              table="controls"
              record={selected}
              rows={displayed}
              onSelect={setSelected}
            />
          }
          recordActions={
            editable ? (
              <Button size="small" variant="primary" onClick={() => onOpen(selected.id)}>
                Tailor controls
              </Button>
            ) : undefined
          }
        >
          <KeyValue label="Control">{selected.code}</KeyValue>
          <KeyValue label="Rationale" wrap>
            {selected.rationale}
          </KeyValue>
        </RecordPreviewPanel>
      )}
    </Section>
  );
}

function FamilyTable({ families }: { families: ProgramTailoringPreview["families"] }) {
  const rows = families.map((family) => ({ ...family, id: family.groupId ?? family.sourceId }));
  const columns = defineColumns<(typeof rows)[number]>((c) => [
    c.text("title", {
      header: "Family",
      priority: 0,
      minWidth: 220,
      hideable: false,
      cell: (row) =>
        row.groupId ? (
          <RecordLink table="catalog_groups" record={{ id: row.groupId }}>
            {row.sourceId.toUpperCase()} · {row.title}
          </RecordLink>
        ) : (
          row.title
        ),
    }),
    c.number("base", { header: "Base", width: 80 }),
    c.number("out", { header: "Out", width: 80 }),
    c.number("in", { header: "In", width: 80 }),
    c.number("effective", { header: "Effective", width: 100 }),
  ]);
  const table = useDataTable({
    data: rows,
    columns,
    getRowId: (row) => row.id,
    label: "Controls by family",
    view: "profile-family-summary",
  });
  return (
    <ProductCollection
      table={table}
      searchLabel="Find a control family"
      empty={{
        illustration: "shield",
        title: "No control families",
        description: "Choose a base profile to see its control families.",
      }}
    />
  );
}

function ParameterTable({
  parameters,
  data,
  editable,
  onOpen,
  onRemove,
}: {
  parameters: ParameterOverride[];
  data: ReferenceData;
  editable: boolean;
  onOpen: () => void;
  onRemove: (id: string) => void;
}) {
  const navigate = useNavigate();
  const rows = parameters.map((override) => {
    const parameter = data.parameters.find((item) => item.id === override.parameterId);
    const control = data.controls.find((item) => item.id === parameter?.control_id);
    return {
      id: override.parameterId,
      name: parameter?.source_id ?? "Unavailable parameter",
      control: control?.code ?? "Unavailable control",
      values: override.values.join("; "),
      rationale: override.rationale,
    };
  });
  const [selected, setSelected] = useState<(typeof rows)[number] | null>(null);
  const columns = defineColumns<(typeof rows)[number]>((c) => [
    c.id("id", {
      header: "ID",
      width: 120,
      preview: setSelected,
      active: (row) => row.id === selected?.id,
    }),
    c.text("name", {
      header: "Parameter",
      priority: 0,
      minWidth: 220,
      hideable: false,
      cell: (row) => (
        <RecordLink table="parameters" record={row}>
          {row.name}
        </RecordLink>
      ),
    }),
    c.text("control", { header: "Control", width: 120 }),
    c.text("values", { header: "Values", wrap: true }),
    c.text("rationale", { header: "Rationale", wrap: true }),
    ...(editable
      ? [
          c.actions((row) => [
            { label: "Set parameter values", onSelect: onOpen },
            { label: "Remove override", onSelect: () => onRemove(row.id) },
          ]),
        ]
      : []),
  ]);
  const table = useDataTable({
    data: rows,
    columns,
    getRowId: (row) => row.id,
    label: "Parameter overrides",
    view: "profile-parameter-overrides",
  });
  const displayed = useDisplayedRecords(table);
  return (
    <>
      <ProductCollection
        table={table}
        fill
        searchLabel="Find a parameter override"
        onRowClick={(row) => void navigate(recordDestination("parameters", row))}
        action={
          <Button size="small" variant="primary" onClick={onOpen}>
            {editable ? "Set parameter values" : "Inspect parameters"}
          </Button>
        }
        empty={{
          illustration: "records",
          title: "No parameter overrides",
          description: "Catalog defaults and the base profile's values stay in effect.",
        }}
      />
      {selected && (
        <RecordPreviewPanel
          title={selected.name}
          label="Parameter override preview"
          onClose={() => setSelected(null)}
          navigation={
            <RecordPreviewActions
              table="parameters"
              record={selected}
              rows={displayed}
              onSelect={setSelected}
            />
          }
          recordActions={
            editable ? (
              <Button size="small" variant="primary" onClick={onOpen}>
                Set parameter values
              </Button>
            ) : undefined
          }
        >
          <KeyValue label="Control">{selected.control}</KeyValue>
          <KeyValue label="Values" wrap>
            {selected.values}
          </KeyValue>
          <KeyValue label="Rationale" wrap>
            {selected.rationale}
          </KeyValue>
        </RecordPreviewPanel>
      )}
    </>
  );
}
