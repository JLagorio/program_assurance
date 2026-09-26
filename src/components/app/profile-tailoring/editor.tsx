import { useConfirmation } from "@/components/app/confirmation";
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
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  DataTable,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Fact,
  IconButton,
  Id,
  Icon,
  KeyValue,
  List,
  Prose,
  Section,
  Stack,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  TextLink,
  VisuallyHidden,
  defineColumns,
  useDataTable,
  type Preset,
} from "@ledger/design-system";
import { Link, useNavigate } from "@tanstack/react-router";
import { AlertCircle, ExternalLink, MoreHorizontal, Plus } from "lucide-react";
import { useId, useMemo, useRef, useState, type ComponentProps, type ReactNode } from "react";
import { ControlPicker } from "./control-picker";
import { parameterName } from "./names";
import { ParameterPicker } from "./parameter-picker";
import { focusAfterConfirmation } from "./reveal-detail";
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
 * A record's name in a tailoring collection. On a saved profile it is the record link. In a draft
 * (the program wizard) it opens the record in a new tab and says so, so reading a control never
 * leaves the draft; the row opens the preview instead of navigating.
 */
function TailoringLink({
  table,
  record,
  inDraft,
  children,
}: {
  table: ComponentProps<typeof RecordLink>["table"];
  record: ComponentProps<typeof RecordLink>["record"];
  inDraft: boolean;
  children: ReactNode;
}) {
  if (!inDraft)
    return (
      <RecordLink table={table} record={record}>
        {children}
      </RecordLink>
    );
  return (
    <TextLink
      render={
        <Link
          {...recordDestination(table, record)}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(event) => event.stopPropagation()}
        />
      }
    >
      {children}
      <VisuallyHidden> (opens in a new tab)</VisuallyHidden>{" "}
      <Icon color="color.icon.subtle">
        <ExternalLink />
      </Icon>
    </TextLink>
  );
}

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
}: {
  catalogRevisionId: string;
  baseResolutionId: string;
  decisions: TailoringDecision[];
  parameters: ParameterOverride[];
  onChange?: ((next: ProfileTailoringValue) => void) | undefined;
  readOnly?: boolean | undefined;
  data: ReferenceData;
  preview?: ProgramTailoringPreview | undefined;
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
  const { confirm, confirmation } = useConfirmation();
  const [previewControl, setPreviewControl] = useState<string | null>(null);
  const [tab, setTab] = useState("Controls");
  // Each opening is a new session of the dialog: its search, filter and choice start afresh. The
  // key changes only on open, so closing runs the dialog's exit and focus return.
  const [controlsSession, setControlsSession] = useState(0);
  const [controlsOpen, setControlsOpen] = useState(false);
  const [parameterSession, setParameterSession] = useState(0);
  const [parameterOpen, setParameterOpen] = useState(false);
  const [inspectId, setInspectId] = useState<string | null>(null);
  const [inspectParameterId, setInspectParameterId] = useState<string | null>(null);
  // A dialog opened from a collection's primary returns focus to that primary. It moves between the
  // empty state and the toolbar once the first row is recorded, so it is found again on close.
  const openerId = useId();
  const fromPrimary = useRef<"controls" | "parameters" | null>(null);
  const visiblePrimary = (kind: "controls" | "parameters") =>
    [
      ...document.querySelectorAll<HTMLElement>(`[data-tailoring-primary="${openerId}-${kind}"]`),
    ].find((element) => element.getClientRects().length > 0) ?? null;
  const primaryFocus = (kind: "controls" | "parameters") => () =>
    fromPrimary.current === kind ? (visiblePrimary(kind) ?? true) : true;
  const editable = !readOnly && !!onChange;
  // In the wizard the question ends with the draft; on a saved profile it is kept for the session.
  const keep = (table: string) =>
    editable ? false : `profile-tailoring:${baseResolutionId}:${table}`;
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
            <TailoringLink table="controls" record={row} inDraft={editable}>
              {row.title}
            </TailoringLink>
          ),
        }),
        c.text("family", { header: "Family", width: 100 }),
        c.status("source", {
          header: "Source",
          width: 130,
          tone: (row) => (row.source === "Tailored in" ? "success" : "neutral"),
        }),
      ]),
    [previewControl, editable],
  );
  const table = useDataTable({
    columns,
    data: effective,
    getRowId: (row) => row.id,
    rowLabel: (row) => row.code,
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
  const openControls = (controlId: string | null, viaPrimary = false) => {
    fromPrimary.current = viaPrimary ? "controls" : null;
    setInspectId(controlId);
    setControlsSession((session) => session + 1);
    setControlsOpen(true);
  };
  const openParameters = (parameterId: string | null, viaPrimary = false) => {
    fromPrimary.current = viaPrimary ? "parameters" : null;
    setInspectParameterId(parameterId);
    setParameterSession((session) => session + 1);
    setParameterOpen(true);
  };
  async function removeDecision(controlId: string) {
    const code = controlById.get(controlId)?.code ?? "The control";
    if (
      await confirm({
        title: "Remove this decision?",
        description: `${code} returns to what the base profile selects, and its rationale is discarded from the draft.`,
        confirmLabel: "Remove decision",
        variant: "danger",
      })
    ) {
      setDecisions(decisions.filter((item) => item.controlId !== controlId));
      // The row, the menu that asked and any preview of it go; the collection's primary takes focus.
      focusAfterConfirmation(() => visiblePrimary("controls"));
    }
  }
  async function removeOverride(parameterId: string) {
    const name =
      data.parameters.find((item) => item.id === parameterId)?.source_id ?? "The parameter";
    if (
      await confirm({
        title: "Remove this override?",
        description: `${name} returns to the value the base profile or the catalog sets, and the override's rationale is discarded from the draft.`,
        confirmLabel: "Remove override",
        variant: "danger",
      })
    ) {
      setParameters(parameters.filter((item) => item.parameterId !== parameterId));
      focusAfterConfirmation(() => visiblePrimary("parameters"));
    }
  }
  return (
    <Stack space="space.200">
      <Section title="Details" isCollapsible>
        <Stack space="space.200">
          <Fact.Group>
            <Fact label="Base">{preview.counts.base}</Fact>
            <Fact label="Tailored out">{preview.counts.excluded}</Fact>
            <Fact label="Tailored in">{preview.counts.added}</Fact>
            <Fact label="Effective">{preview.counts.selected}</Fact>
            <Fact label="Parameters overridden">{parameters.length}</Fact>
          </Fact.Group>
          <Section title="By family" count={String(preview.families.length)}>
            <FamilyTable families={preview.families} inDraft={editable} keep={keep("family")} />
          </Section>
        </Stack>
      </Section>
      {preview.errors.length ? (
        <Alert variant="destructive" role={editable ? "alert" : "status"}>
          <AlertCircle aria-hidden />
          <AlertTitle>Resolve tailoring conflicts</AlertTitle>
          <AlertDescription>
            <List>
              {preview.errors.map((error) => (
                <List.Item key={error}>{error}</List.Item>
              ))}
            </List>
          </AlertDescription>
        </Alert>
      ) : null}
      {preview.warnings.length ? (
        <Section title="Reference notes" count={String(preview.warnings.length)} isCollapsible>
          <List>
            {preview.warnings.map((warning) => (
              <List.Item key={warning}>{warning}</List.Item>
            ))}
          </List>
        </Section>
      ) : null}
      <Tabs value={tab} onValueChange={(value) => setTab(String(value))}>
        <TabsList variant="line" aria-label="Profile tailoring views">
          <TabsTrigger value="Controls">Controls · {preview.counts.selected}</TabsTrigger>
          <TabsTrigger value="Parameters">Parameters · {preview.counts.parameters}</TabsTrigger>
        </TabsList>
        <TabsContent value="Controls">
          <Stack space="space.200">
            <DecisionTable
              title="Tailored out"
              rows={outRows}
              editable={editable}
              keep={keep("out")}
              onOpen={openControls}
              onRemove={removeDecision}
              emptyTitle="Nothing tailored out"
              emptyDescription="Every control the base profile selects stays in."
              action={
                editable ? (
                  <Button
                    size="small"
                    iconBefore={<Plus />}
                    data-tailoring-primary={`${openerId}-controls`}
                    onClick={() => openControls(null, true)}
                  >
                    Tailor controls
                  </Button>
                ) : null
              }
            />
            <DecisionTable
              title="Tailored in"
              rows={inRows}
              editable={editable}
              keep={keep("in")}
              onOpen={openControls}
              onRemove={removeDecision}
              emptyTitle="Nothing tailored in"
              emptyDescription="No control is added from the catalog beyond the base profile."
            />
            <Section title="Effective control set" count={String(preview.counts.selected)}>
              <ProductCollection
                table={table}
                keepQuestion={keep("effective")}
                onRowClick={(row) =>
                  editable
                    ? setPreviewControl(row.id)
                    : void navigate(recordDestination("controls", row))
                }
                views={<DataTable.Presets table={table} presets={presets} variant="menu" />}
                empty={{
                  illustration: "shield",
                  title: "No controls in the effective set",
                  description: "Choose a base profile with a recorded selection.",
                }}
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
            keep={keep("parameters")}
            onOpen={openParameters}
            primaryId={`${openerId}-parameters`}
            onRemove={removeOverride}
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
        key={`controls-${controlsSession}`}
        open={controlsOpen}
        onClose={() => setControlsOpen(false)}
        initialControlId={inspectId}
        finalFocus={primaryFocus("controls")}
        decisions={decisions}
        onChange={setDecisions}
        readOnly={!editable}
        baseControlIds={preview.baseControlIds}
        selectedControlIds={selectedIds}
        catalogRevisionId={catalogRevisionId}
        data={data}
      />
      <ParameterPicker
        key={`parameters-${parameterSession}`}
        open={parameterOpen}
        onClose={() => setParameterOpen(false)}
        initialParameterId={inspectParameterId}
        finalFocus={primaryFocus("parameters")}
        decisions={decisions}
        parameters={parameters}
        onChange={setParameters}
        readOnly={!editable}
        catalogRevisionId={catalogRevisionId}
        baseResolutionId={baseResolutionId}
        data={data}
        preview={preview}
      />
      {confirmation}
    </Stack>
  );
}

/** The overflow for a preview's other record actions, beside its one primary. */
function MoreActions({ label, children }: { label: string; children: ReactNode }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <IconButton icon={<MoreHorizontal />} label={label} size="small" variant="subtle" />
        }
      />
      <DropdownMenuContent align="end">{children}</DropdownMenuContent>
    </DropdownMenu>
  );
}

function DecisionTable({
  title,
  rows,
  editable,
  keep,
  onOpen,
  onRemove,
  emptyTitle,
  emptyDescription,
  action,
}: {
  title: string;
  rows: { decision: TailoringDecision; control: WizardControl | undefined }[];
  editable: boolean;
  keep: string | false;
  onOpen: (controlId: string) => void;
  onRemove: (controlId: string) => void;
  emptyTitle: string;
  emptyDescription: string;
  action?: ReactNode;
}) {
  const navigate = useNavigate();
  const items = rows.map(({ decision, control }) => ({
    id: decision.controlId,
    code: control?.code ?? "Unavailable control",
    title: control?.title ?? "Unavailable control",
    rationale: decision.rationale,
  }));
  // The preview follows the decision: once it is removed, from here or from the dialog, it closes.
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = items.find((item) => item.id === selectedId) ?? null;
  const setSelected = (row: { id: string } | null) => setSelectedId(row?.id ?? null);
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
        <TailoringLink table="controls" record={row} inDraft={editable}>
          {row.title}
        </TailoringLink>
      ),
    }),
    c.text("rationale", { header: "Rationale", width: 360, wrap: true }),
    ...(editable
      ? [
          c.actions((row) => [
            { label: "Edit decision", onSelect: () => onOpen(row.id) },
            { label: "Remove decision", onSelect: () => onRemove(row.id), tone: "danger" as const },
          ]),
        ]
      : []),
  ]);
  const table = useDataTable({
    data: items,
    columns,
    getRowId: (row) => row.id,
    rowLabel: (row) => row.code,
    label: title,
    view: `profile-decisions-${title}`,
  });
  const displayed = useDisplayedRecords(table);
  return (
    <Section title={title} count={items.length ? String(items.length) : null}>
      <ProductCollection
        table={table}
        keepQuestion={keep}
        searchLabel="Find a tailored control"
        action={action}
        onRowClick={(row) =>
          editable ? setSelected(row) : void navigate(recordDestination("controls", row))
        }
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
              <>
                <Button size="small" variant="primary" onClick={() => onOpen(selected.id)}>
                  Edit decision
                </Button>
                <MoreActions label="More decision actions">
                  <DropdownMenuItem variant="danger" onClick={() => onRemove(selected.id)}>
                    Remove decision
                  </DropdownMenuItem>
                </MoreActions>
              </>
            ) : undefined
          }
        >
          <KeyValue.Group>
            <KeyValue label="Control">
              <Id>{selected.code}</Id>
            </KeyValue>
            <KeyValue label="Decision">{title}</KeyValue>
            <KeyValue label="Rationale" wrap>
              <Prose>{selected.rationale}</Prose>
            </KeyValue>
          </KeyValue.Group>
        </RecordPreviewPanel>
      )}
    </Section>
  );
}

function FamilyTable({
  families,
  inDraft,
  keep,
}: {
  families: ProgramTailoringPreview["families"];
  inDraft: boolean;
  keep: string | false;
}) {
  const rows = families.map((family) => ({ ...family, id: family.groupId ?? family.sourceId }));
  const columns = defineColumns<(typeof rows)[number]>((c) => [
    c.text("title", {
      header: "Family",
      priority: 0,
      minWidth: 220,
      hideable: false,
      cell: (row) =>
        row.groupId ? (
          <TailoringLink table="catalog_groups" record={{ id: row.groupId }} inDraft={inDraft}>
            {row.sourceId.toUpperCase()} · {row.title}
          </TailoringLink>
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
    rowLabel: (row) => row.title,
    label: "Controls by family",
    view: "profile-family-summary",
  });
  return (
    <ProductCollection
      table={table}
      keepQuestion={keep}
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
  keep,
  onOpen,
  onRemove,
  primaryId,
}: {
  parameters: ParameterOverride[];
  data: ReferenceData;
  editable: boolean;
  keep: string | false;
  onOpen: (parameterId: string | null, viaPrimary?: boolean) => void;
  /** Marks the toolbar's primary, so the dialog it opens can return focus to it. */
  primaryId: string;
  onRemove: (id: string) => void;
}) {
  const navigate = useNavigate();
  const rows = parameters.map((override) => {
    const parameter = data.parameters.find((item) => item.id === override.parameterId);
    const control = data.controls.find((item) => item.id === parameter?.control_id);
    return {
      id: override.parameterId,
      code: parameter?.source_id ?? "Unavailable parameter",
      name: parameter
        ? parameterName(
            parameter,
            data.parameterChoices
              .filter((choice) => choice.parameter_id === parameter.id)
              .sort((a, b) => a.ordinal - b.ordinal)
              .map((choice) => choice.value),
          )
        : "Unavailable parameter",
      control: control?.code ?? "Unavailable control",
      values: override.values.join("; "),
      rationale: override.rationale,
    };
  });
  // The preview follows the override: once it is removed, from here or from the dialog, it closes.
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = rows.find((row) => row.id === selectedId) ?? null;
  const setSelected = (row: { id: string } | null) => setSelectedId(row?.id ?? null);
  const columns = defineColumns<(typeof rows)[number]>((c) => [
    c.id("code", {
      header: "ID",
      width: 150,
      preview: setSelected,
      active: (row) => row.id === selected?.id,
    }),
    c.text("name", {
      header: "Parameter",
      priority: 0,
      minWidth: 200,
      hideable: false,
      cell: (row) => (
        <TailoringLink table="parameters" record={row} inDraft={editable}>
          {row.name}
        </TailoringLink>
      ),
    }),
    c.text("control", { header: "Control", width: 120 }),
    c.text("values", { header: "Values", wrap: true }),
    c.text("rationale", { header: "Rationale", wrap: true }),
    ...(editable
      ? [
          c.actions((row) => [
            { label: "Edit override", onSelect: () => onOpen(row.id) },
            { label: "Remove override", onSelect: () => onRemove(row.id), tone: "danger" as const },
          ]),
        ]
      : []),
  ]);
  const table = useDataTable({
    data: rows,
    columns,
    getRowId: (row) => row.id,
    rowLabel: (row) => row.code,
    label: "Parameter overrides",
    view: "profile-parameter-overrides",
  });
  const displayed = useDisplayedRecords(table);
  return (
    <>
      <ProductCollection
        table={table}
        keepQuestion={keep}
        searchLabel="Find a parameter override"
        onRowClick={(row) =>
          editable ? setSelected(row) : void navigate(recordDestination("parameters", row))
        }
        action={
          <Button
            size="small"
            variant="primary"
            data-tailoring-primary={primaryId}
            onClick={() => onOpen(null, true)}
          >
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
              <>
                <Button size="small" variant="primary" onClick={() => onOpen(selected.id)}>
                  Edit override
                </Button>
                <MoreActions label="More override actions">
                  <DropdownMenuItem variant="danger" onClick={() => onRemove(selected.id)}>
                    Remove override
                  </DropdownMenuItem>
                </MoreActions>
              </>
            ) : undefined
          }
        >
          <KeyValue.Group>
            <KeyValue label="ID">
              <Id>{selected.code}</Id>
            </KeyValue>
            <KeyValue label="Control">
              <Id>{selected.control}</Id>
            </KeyValue>
            <KeyValue label="Values" wrap>
              {selected.values}
            </KeyValue>
            <KeyValue label="Rationale" wrap>
              <Prose>{selected.rationale}</Prose>
            </KeyValue>
          </KeyValue.Group>
        </RecordPreviewPanel>
      )}
    </>
  );
}
