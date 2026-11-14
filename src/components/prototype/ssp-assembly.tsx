import { useProgramBaselines } from "@/lib/baseline-reads";
import { RecordSummaryPreview } from "./record-summary-preview";
import { ProductCollection } from "./product-collection";
import { useCollectionTable } from "./collection-question";
import { useCallback, useMemo, useRef, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import {
  RecordLink,
  RecordPreviewActions,
  RecordPreviewPanel,
  recordDestination,
  useDisplayedRecords,
  useEndOnHide,
  useOpenRecord,
} from "./record-preview";
import { EmptyMessage, QueryState, ReportFailures, type QueryStatus } from "./work-common";
import {
  Absent,
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  DataTable,
  DateTime,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyIllustration,
  EmptyMedia,
  EmptyTitle,
  IconButton,
  KeyValue,
  List,
  Prose,
  Section,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
  Stack,
  Text,
  TextLink,
  VisuallyHidden,
  defineColumns,
  useDataTable,
} from "@ledger/design-system";
import { FileText, ListChecks, MoreHorizontal, TriangleAlert } from "lucide-react";
import { StatusBadge } from "@/components/app/status";
import { useWorkspace } from "@/components/app/workspace";
import { useRows, type Row } from "@/lib/models";
import type { DataRecord } from "@/lib/records";
import {
  assembleSspControl,
  useSspControlDetail,
  useSspControlRows,
  type SspControlAssembly,
  type SspStatement,
} from "@/lib/ssp-assembly";
import {
  controlStatuses,
  implementationStatuses,
  recordedImplementationStatuses,
  revisionStates,
  statusLabel,
} from "@/lib/status";
import { useProgramControlStatus, type ControlStatus } from "@/lib/control-status";
import { EvidenceVersionDetails } from "./evidence-version-details";
import { ProductRecordDialog } from "./product-record-dialog";
import type { ProgramTableName } from "./program-shared";

type Editor = {
  table: ProgramTableName;
  existing?: DataRecord;
  initialValues?: Record<string, unknown>;
  description: string;
};

/**
 * What the tab reads of the program's systems, once for the boundary picker, the boundary checks
 * and an element's path in a control's preview.
 */
const SYSTEM_COLUMNS = [
  "id",
  "code",
  "name",
  "program_id",
  "boundary_system_id",
  "parent_system_id",
  "is_authorization_boundary",
] as const;
type ProgramSystem = Pick<Row<"systems">, (typeof SYSTEM_COLUMNS)[number]>;
/** What the tab reads of a boundary's SSP revisions: the revision picker and what a register scopes by. */
const PLAN_COLUMNS = [
  "id",
  "system_id",
  "profile_resolution_id",
  "version_number",
  "state",
] as const;
type Plan = Pick<Row<"ssp_revisions">, (typeof PLAN_COLUMNS)[number]>;

/** A picker whose choice redraws the region it sits in (the boundary, the SSP revision): `arm`
 * runs with the choice, and the picker drawn for the new choice takes focus, so the reader stays
 * on the control they used instead of falling to the page. `node` is the picker now drawn. */
function useFollowFocus() {
  const node = useRef<HTMLElement | null>(null);
  const armed = useRef(false);
  const ref = useCallback((element: HTMLElement | null) => {
    node.current = element;
    if (!element || !armed.current) return;
    armed.current = false;
    element.focus();
  }, []);
  const arm = useCallback(() => {
    armed.current = true;
  }, []);
  return { ref, node, arm };
}

/** The program's Controls tab: one authorization boundary's SSP assembly. `fill` while the
 * register is the tab's one block; off where another block follows it. */
export function ProgramSspAssembly({
  programId,
  fill = true,
}: {
  programId: string;
  fill?: boolean | undefined;
}) {
  const systems = useRows("systems", { program_id: programId }, { columns: SYSTEM_COLUMNS });
  const [chosen, setChosen] = useState<string>();
  // Another boundary is another assembly, drawn afresh; its picker takes the focus back.
  const boundaryPicker = useFollowFocus();
  // Only a first load with nothing to show waits here. A failed refresh keeps the assembly, its
  // preview and an open draft mounted; the table's alert says what failed.
  if (systems.data === undefined) return <QueryState queries={[systems]} />;
  const boundaries = systems.data.filter((system) => system.is_authorization_boundary);
  const boundary = boundaries.find((system) => system.id === chosen) ?? boundaries[0];
  if (!boundary)
    return (
      <QueryState queries={[systems]}>
        <Empty>
          <EmptyMedia aria-hidden>
            <EmptyIllustration kind="tree" />
          </EmptyMedia>
          <EmptyHeader>
            <EmptyTitle>No authorization boundary yet</EmptyTitle>
            <EmptyDescription>
              Create an authorization boundary in the system tree to assemble its control
              implementations.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <OpenSystems programId={programId} />
          </EmptyContent>
        </Empty>
      </QueryState>
    );
  return (
    <SspAssembly
      key={boundary.id}
      programId={programId}
      systemId={boundary.id}
      fill={fill}
      scope={
        boundaries.length > 1 ? (
          <Select
            value={boundary.id}
            onValueChange={(value) => {
              if (!value || value === boundary.id) return;
              boundaryPicker.arm();
              setChosen(value);
            }}
          >
            <SelectTrigger
              ref={boundaryPicker.ref}
              size="small"
              aria-label="Authorization boundary"
            >
              <SelectValue>
                {boundary.code} · {boundary.name}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {boundaries.map((system) => (
                <SelectItem key={system.id} value={system.id}>
                  {system.code} · {system.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : undefined
      }
    />
  );
}

function OpenSystems({ programId }: { programId: string }) {
  return (
    <TextLink
      render={<Link to="/programs/$programId" params={{ programId }} search={{ tab: "System" }} />}
    >
      Open systems
    </TextLink>
  );
}

/** A control's row: the register's line for it, named by its code and title together. */
type ControlRow = {
  /** The baseline's selection of the control. */
  id: string;
  controlId: string;
  code: string;
  title: string;
  name: string;
  /** The control's recorded implementation in this SSP, which its name opens; none yet, none. */
  implementationId: string | null;
  /** The implementation's status; `unrecorded` while there is none. */
  status: string;
  narrative: "Recorded" | "Not recorded";
  contributionCount: number;
  requirementCount: number;
  evidenceCount: number;
  /** Where the program's control baseline gets the control: the reference baseline or a layer. */
  origin: string | null;
  /** Where the program stands on the control; none for a control outside its control baseline. */
  controlStatus: ControlStatus | null;
};

/** Boundary SSP assembly. Every selected control is visible, even before anyone
 * has authored its implementation. The selected plan retains its exact baseline.
 * The editors live here, above every loading and error branch, so a failed refresh
 * never takes an open draft away. `scope` is a control that chooses the boundary;
 * `fill` makes the register fill the window when it is the tab's one block. */
export function SspAssembly({
  programId,
  systemId,
  fill = false,
  scope,
}: {
  programId: string;
  systemId: string;
  fill?: boolean | undefined;
  scope?: ReactNode;
}) {
  const workspace = useWorkspace();
  // The program's systems, the boundary among them: one read with the boundary picker's.
  const systems = useRows("systems", { program_id: programId }, { columns: SYSTEM_COLUMNS });
  const plans = useRows("ssp_revisions", { system_id: systemId }, { columns: PLAN_COLUMNS });
  const [chosenId, setChosenId] = useState<string>();
  const [creating, setCreating] = useState(false);
  const [editor, setEditor] = useState<Editor>();
  // Another revision is another register, drawn afresh; its picker takes the focus back.
  const revisionPicker = useFollowFocus();
  // Whether the open Create SSP revision dialog has saved: its opener leaves with the empty.
  const created = useRef(false);
  const ordered = [...(plans.data ?? [])].sort((a, b) => b.version_number - a.version_number);
  const plan = ordered.find((item) => item.id === chosenId) ?? ordered[0];
  const loaded = systems.data !== undefined && plans.data !== undefined;
  const system = systems.data?.find((row) => row.id === systemId);
  const boundary = !!system && system.is_authorization_boundary;
  let body: ReactNode;
  if (!loaded) body = <QueryState queries={[plans, systems]} />;
  else if (!boundary)
    body = (
      <Stack space="space.200">
        {scope}
        <QueryState queries={[plans, systems]}>
          <Empty>
            <EmptyMedia aria-hidden>
              <EmptyIllustration kind="search" />
            </EmptyMedia>
            <EmptyHeader>
              <EmptyTitle>Authorization boundary unavailable</EmptyTitle>
              <EmptyDescription>
                Choose an authorization boundary in this program to read its SSP.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <OpenSystems programId={programId} />
            </EmptyContent>
          </Empty>
        </QueryState>
      </Stack>
    );
  else if (plan)
    body = (
      <SspAssemblyPlan
        key={plan.id}
        programId={programId}
        plan={plan}
        systems={systems.data ?? []}
        fill={fill}
        context={[plans, systems]}
        onEdit={setEditor}
        views={
          <>
            {scope}
            <Select
              value={plan.id}
              onValueChange={(value) => {
                if (!value || value === plan.id) return;
                revisionPicker.arm();
                setChosenId(value);
              }}
            >
              <SelectTrigger ref={revisionPicker.ref} size="small" aria-label="SSP revision">
                <SelectValue>
                  SSP {plan.version_number} · {statusLabel(revisionStates, plan.state)}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {ordered.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    SSP {item.version_number} · {statusLabel(revisionStates, item.state)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </>
        }
      />
    );
  else
    body = (
      <Stack space="space.200">
        {scope}
        <QueryState queries={[plans, systems]}>
          <Empty>
            <EmptyMedia aria-hidden>
              <EmptyIllustration kind="document" />
            </EmptyMedia>
            <EmptyHeader>
              <EmptyTitle>No SSP recorded</EmptyTitle>
              <EmptyDescription>
                Create a system security plan with an explicit resolved baseline to assemble its
                control implementations.
              </EmptyDescription>
            </EmptyHeader>
            {workspace.role !== "viewer" && (
              <EmptyContent>
                <Button
                  variant="primary"
                  onClick={() => {
                    created.current = false;
                    setCreating(true);
                  }}
                >
                  Create SSP revision
                </Button>
              </EmptyContent>
            )}
          </Empty>
        </QueryState>
      </Stack>
    );
  return (
    <>
      {body}
      {creating && (
        <ProductRecordDialog
          table="ssp_revisions"
          description="Create a system security plan with an explicit resolved baseline."
          initialValues={{ system_id: systemId }}
          onClose={() => setCreating(false)}
          // The empty and its Create button leave once the SSP exists, so a saved SSP sends focus
          // to its register's revision picker: at once when it is drawn, or as soon as it is.
          // Cancel returns to the Create button.
          onSaved={async (row) => {
            created.current = true;
            setChosenId(row.id);
            await plans.refetch();
          }}
          finalFocus={() => {
            if (!created.current) return true;
            const picker = revisionPicker.node.current;
            if (picker?.isConnected) return picker;
            revisionPicker.arm();
            return false;
          }}
        />
      )}
      {editor && <ProductRecordDialog {...editor} onClose={() => setEditor(undefined)} />}
    </>
  );
}

function SspAssemblyPlan({
  programId,
  plan,
  systems,
  views,
  fill,
  context,
  onEdit,
}: {
  programId: string;
  plan: Plan;
  /** The program's systems: the boundary's name, and an element's path in a control's preview. */
  systems: readonly ProgramSystem[];
  /** The controls that choose what the register shows (the boundary, the SSP revision). */
  views: ReactNode;
  fill: boolean;
  /** The queries the plan itself came from, so their failed refresh is announced with the rest. */
  context: QueryStatus[];
  /** Opens an editor, which returns focus to the control that opened it. */
  onEdit: (editor: Editor) => void;
}) {
  const workspace = useWorkspace();
  // One read for the register: every control the SSP's stored baseline selects, each with what
  // stands behind it counted on the server, and what the tab says of the SSP as a whole.
  const register = useSspControlRows(plan.id);
  const [selectedId, setSelectedId] = useState<string>();
  const [evidenceId, setEvidenceId] = useState<string>();
  useEndOnHide(() => {
    setSelectedId(undefined);
    setEvidenceId(undefined);
  });
  const openRecord = useOpenRecord();
  // Each control is named by its code and title together ("AC-2(1) Automated system account
  // management"), so the code never folds away from a title that repeats across families.
  // Where the program's baseline gets each control, by the catalog control: the program's stack
  // is read once, and a program with no recorded baseline shows no Origin column.
  const { baselines } = useProgramBaselines(programId);
  const origins = useMemo(() => {
    const map = new Map<string, string>();
    for (const baseline of baselines) {
      const titles = new Map(baseline.derivation.layers.map((layer) => [layer.key, layer.title]));
      for (const [controlId, origin] of baseline.derivation.origins)
        if (!map.has(controlId))
          map.set(
            controlId,
            origin.layerKey ? (titles.get(origin.layerKey) ?? "A layer") : "Baseline",
          );
    }
    return map;
  }, [baselines]);
  const hasBaseline = baselines.length > 0;
  // Where the program stands on each control of its control baseline, by the catalog control: the
  // one read the Overview and the Control status view draw. The column shows once it answers.
  const controlStatus = useProgramControlStatus(programId);
  const standings = useMemo(
    () => new Map(controlStatus.data?.controls.map((control) => [control.id, control.status])),
    [controlStatus.data],
  );
  const hasStatus = controlStatus.data?.baseline === true;
  const controlRows = useMemo<ControlRow[]>(
    () =>
      (register.data?.rows ?? []).map((row) => {
        const code = row.code ?? "Reference unavailable";
        const title = row.title ?? "Control unavailable";
        return {
          id: row.id,
          controlId: row.controlId,
          code,
          title,
          name: `${code} ${title}`,
          implementationId: row.implementationId,
          status: row.implementationStatus ?? "unrecorded",
          narrative: row.narrative ? "Recorded" : "Not recorded",
          contributionCount: row.contributions,
          requirementCount: row.requirements,
          evidenceCount: row.evidence,
          origin: origins.get(row.controlId) ?? null,
          controlStatus: standings.get(row.controlId) ?? null,
        };
      }),
    [register.data, origins, standings],
  );
  const selected = controlRows.find((row) => row.id === selectedId);
  // The previewed control's records, read as its preview opens: what stands behind it, assembled
  // under the register's rules. Another control's never stand in for them while they load.
  const detail = useSspControlDetail(plan.id, selected?.id);
  const assembly = useMemo(
    () =>
      detail.data && detail.data.selection.id === selected?.id
        ? assembleSspControl(detail.data, { plan, systems })
        : undefined,
    [detail.data, plan, systems, selected?.id],
  );
  const editable = plan.state === "draft" && workspace.role !== "viewer";
  // A control with an implementation opens its control record. One without has no page of its
  // own: its name, its row and the eye open its preview, where the implementation is created.
  const controlRecord = useCallback(
    (row: ControlRow) =>
      row.implementationId ? { id: row.implementationId, program_id: programId } : null,
    [programId],
  );
  const openPreview = useCallback((row: ControlRow) => {
    setSelectedId(row.id);
    setEvidenceId(undefined);
  }, []);
  const selectedRecord = selected ? controlRecord(selected) : null;
  const columns = useMemo(
    () =>
      defineColumns<ControlRow>((c) => [
        c.id("name", {
          header: "Control",
          minWidth: 240,
          priority: 0,
          hideable: false,
          cell: (row) => {
            const record = controlRecord(row);
            return record ? (
              <RecordLink table="implemented_requirements" record={record}>
                {row.name}
              </RecordLink>
            ) : (
              <Button
                variant="link"
                truncate
                onClick={(event) => {
                  // The row's own click would open it a second time.
                  event.stopPropagation();
                  openPreview(row);
                }}
              >
                {row.name}
              </Button>
            );
          },
        }),
        c.status("status", {
          header: "Recorded implementation",
          width: 212,
          statuses: recordedImplementationStatuses,
          cell: (row) =>
            row.implementationId ? (
              <StatusBadge statuses={implementationStatuses} value={row.status} />
            ) : (
              <Absent />
            ),
        }),
        ...(hasStatus
          ? [
              c.status("controlStatus", {
                header: "Control status",
                width: 200,
                statuses: controlStatuses,
                cell: (row) => (
                  <StatusBadge
                    statuses={controlStatuses}
                    value={row.controlStatus}
                    absentLabel="Not in the program baseline"
                  />
                ),
              }),
            ]
          : []),
        ...(hasBaseline
          ? [
              c.text("origin", {
                header: "Origin",
                width: 220,
                cell: (row) => row.origin ?? <Absent label="Not in the program baseline" />,
              }),
            ]
          : []),
        c.text("narrative", { header: "Control narrative", width: 160 }),
        c.number("contributionCount", { header: "Contributions", width: 140 }),
        c.number("requirementCount", { header: "Requirements", width: 130 }),
        c.number("evidenceCount", { header: "Evidence", width: 105 }),
      ]),
    [controlRecord, openPreview, hasBaseline, hasStatus],
  );
  // Each preview is its table's, so opening or stepping through one never rebuilds the columns.
  const controlPreview = useMemo(
    () => ({ onPreview: openPreview, activeId: selectedId ?? null }),
    [openPreview, selectedId],
  );
  const table = useCollectionTable({
    columns,
    data: controlRows,
    getRowId: (row) => row.id,
    preview: controlPreview,
    label: "SSP control assembly",
    // v2: the code is part of the control's name, no longer a column of its own.
    view: "ssp-control-assembly-v2",
    resizable: true,
  });
  const displayedRows = useDisplayedRecords(table);
  const [requirementPreviewId, setRequirementPreviewId] = useState<string>();
  const requirementRows = useMemo(
    () =>
      (assembly?.requirements ?? []).map((support) => ({
        ...support.content,
        code: support.requirement.code,
        requirement: support.requirement,
        descriptions: support.descriptions,
        rationales: support.rationale,
      })),
    [assembly],
  );
  const requirementColumns = useMemo(
    () =>
      defineColumns<(typeof requirementRows)[number]>((c) => [
        c.id("title", {
          header: "Requirement",
          minWidth: 200,
          priority: 0,
          cell: (row) => (
            <RecordLink table="engineering_requirements" record={row.requirement}>
              {row.title}
            </RecordLink>
          ),
        }),
        // The name is the row's one link; the code identifies it.
        c.text("code", { header: "Code", priority: 1, width: 130 }),
        c.text("statement", { header: "Statement", minWidth: 220, wrap: true }),
        c.custom("relationship", {
          header: "Relationship",
          text: (row) => [...row.descriptions, ...row.rationales].join(" · "),
          cell: (row) => (
            <Stack space="space.050">
              <Text>{row.descriptions.join(" · ")}</Text>
              {row.rationales.map((rationale) => (
                <Text as="p" color="color.text.subtle" key={rationale}>
                  {rationale}
                </Text>
              ))}
            </Stack>
          ),
        }),
      ]),
    [],
  );
  const requirementPreviewOptions = useMemo(
    () => ({
      onPreview: (row: (typeof requirementRows)[number]) => setRequirementPreviewId(row.id),
      activeId: requirementPreviewId ?? null,
    }),
    [requirementPreviewId],
  );
  const requirementTable = useDataTable({
    columns: requirementColumns,
    data: requirementRows,
    getRowId: (row) => row.id,
    preview: requirementPreviewOptions,
    label: "SSP supporting requirements",
    view: "ssp-supporting-requirements",
  });
  const displayedRequirements = useDisplayedRecords(requirementTable);
  const requirementPreview = requirementRows.find((row) => row.id === requirementPreviewId);
  const evidenceRows = useMemo(
    () =>
      (assembly?.evidence ?? []).map((support) => ({
        ...support,
        title: support.artifact?.title ?? "Evidence unavailable",
        versionLabel: support.version
          ? `Version ${support.version.version_number} · ${statusLabel(revisionStates, support.version.state)}`
          : "Version unavailable",
      })),
    [assembly],
  );
  const evidenceColumns = useMemo(
    () =>
      defineColumns<(typeof evidenceRows)[number]>((c) => [
        c.id("title", {
          header: "Evidence",
          minWidth: 200,
          priority: 0,
          cell: (row) =>
            row.version ? (
              <RecordLink table="evidence_versions" record={row.version}>
                {row.title}
              </RecordLink>
            ) : (
              row.title
            ),
        }),
        c.text("versionLabel", { header: "Exact version", width: 180 }),
        c.custom("origins", {
          header: "Recorded support",
          text: (row) =>
            row.origins
              .map((origin) =>
                [origin.label, origin.claim, origin.rationale].filter(Boolean).join(" · "),
              )
              .join("; "),
          cell: (row) => (
            <Stack space="space.075">
              {row.origins.map((origin) => (
                <Stack key={`${origin.id}/${origin.label}`} space="space.025">
                  <Text as="p">{origin.label}</Text>
                  {origin.claim && (
                    <Text as="p" color="color.text.subtle">
                      {origin.claim}
                    </Text>
                  )}
                  {origin.rationale && (
                    <Text as="p" color="color.text.subtle">
                      {origin.rationale}
                    </Text>
                  )}
                </Stack>
              ))}
            </Stack>
          ),
        }),
      ]),
    [],
  );
  const evidencePreview = useMemo(
    () => ({
      onPreview: (row: (typeof evidenceRows)[number]) => {
        if (row.version && row.artifact) setEvidenceId(row.id);
      },
      activeId: evidenceId ?? null,
    }),
    [evidenceId],
  );
  const evidenceTable = useDataTable({
    columns: evidenceColumns,
    data: evidenceRows,
    getRowId: (row) => row.id,
    preview: evidencePreview,
    label: "SSP supporting evidence",
    view: "ssp-supporting-evidence",
  });
  const displayedEvidence = useDisplayedRecords(evidenceTable);
  const shownEvidence = assembly?.evidence.find((support) => support.id === evidenceId);
  const version = shownEvidence?.version;
  const artifact = shownEvidence?.artifact;
  const partLabels = useMemo(
    () =>
      new Map((detail.data?.parts ?? []).map((part) => [part.id, part.source_id ?? part.title])),
    [detail.data],
  );
  const partLabel = (statement: SspStatement) =>
    partLabels.get(statement.control_part_id) ?? "Control statement";
  const authored = controlRows.filter((row) => row.narrative === "Recorded").length;
  const gaps = register.data?.gaps ?? [];
  const boundaryName = systems.find((row) => row.id === plan.system_id)?.name ?? "Boundary";
  const openNarrative = (row: ControlRow, control: SspControlAssembly | undefined) =>
    onEdit({
      table: "implemented_requirements",
      description: `${row.code} · ${row.title}`,
      ...(control?.implementation ? { existing: control.implementation as DataRecord } : {}),
      initialValues: { ssp_revision_id: plan.id, selected_control_id: row.id },
    });
  const previewActions = (row: ControlRow) => {
    if (!editable) return undefined;
    const implementation = assembly?.implementation;
    // An edit starts from the implementation as stored, which the preview reads as it opens; a
    // control with none yet is created from nothing.
    const waiting =
      row.implementationId && !implementation
        ? detail.isError
          ? "The control implementation could not be loaded."
          : "The control implementation is loading."
        : undefined;
    // Statements and contributions hang off a recorded implementation.
    const statementEdits = implementation ? (assembly?.statements ?? []) : [];
    const contributionEdits = implementation ? (assembly?.contributions ?? []) : [];
    return (
      <>
        <Button
          size="small"
          variant="primary"
          {...(waiting ? { disabledReason: waiting } : {})}
          onClick={() => openNarrative(row, assembly)}
        >
          {row.implementationId ? "Edit control implementation" : "Create control implementation"}
        </Button>
        {implementation && (statementEdits.length > 0 || contributionEdits.length > 0) && (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <IconButton
                  icon={<MoreHorizontal />}
                  label="More control actions"
                  size="small"
                  variant="subtle"
                />
              }
            />
            <DropdownMenuContent align="end">
              {statementEdits.map((statement) => (
                <DropdownMenuItem
                  key={statement.id}
                  description={partLabel(statement)}
                  onClick={() =>
                    onEdit({
                      table: "implementation_statements",
                      existing: statement as DataRecord,
                      initialValues: {
                        ssp_revision_id: plan.id,
                        implemented_requirement_id: implementation.id,
                        control_part_id: statement.control_part_id,
                      },
                      description: `${row.code} · ${partLabel(statement)}`,
                    })
                  }
                >
                  Edit implementation statement
                </DropdownMenuItem>
              ))}
              {statementEdits.length > 0 && contributionEdits.length > 0 && (
                <DropdownMenuSeparator />
              )}
              {contributionEdits.map(({ record, component }) => (
                <DropdownMenuItem
                  key={record.id}
                  description={component?.name ?? "Component unavailable"}
                  onClick={() =>
                    onEdit({
                      table: "component_contributions",
                      existing: record as DataRecord,
                      initialValues: {
                        ssp_revision_id: plan.id,
                        implemented_requirement_id: implementation.id,
                        system_component_id: record.system_component_id,
                      },
                      description: `${row.code} · ${component?.name ?? "Component unavailable"}`,
                    })
                  }
                >
                  Edit component contribution
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </>
    );
  };
  // A detail waits for the register: a line while it loads, and a missing value once it failed
  // with nothing to show (the collection's alert below carries Retry).
  const ready = register.data !== undefined;
  const failed = register.isError && register.data === undefined;
  const held = (value: ReactNode) =>
    ready ? (
      value
    ) : failed ? (
      <Absent label="Could not load" />
    ) : (
      <>
        <Skeleton shape="line" width={64} />
        <VisuallyHidden>Loading</VisuallyHidden>
      </>
    );
  return (
    <Stack space="space.200">
      {register.data?.boundaryDiffers && (
        <Alert tone="warning" role="status">
          <TriangleAlert aria-hidden />
          <AlertTitle>The system baseline differs from this SSP</AlertTitle>
          <AlertDescription>
            This SSP retains its stored selection. Review the boundary’s changed baseline before
            creating an updated SSP.
          </AlertDescription>
        </Alert>
      )}
      {gaps.length > 0 && (
        <Alert tone="warning" role="status">
          <TriangleAlert aria-hidden />
          <AlertTitle>System controls outside this SSP selection</AlertTitle>
          <AlertDescription>
            <Stack space="space.075">
              <Text as="p">These controls are outside this SSP’s stored selection.</Text>
              <List>
                {gaps.map((gap) => (
                  <List.Item key={gap.systemId}>
                    {gap.name}: {gap.codes.join(", ")}
                  </List.Item>
                ))}
              </List>
            </Stack>
          </AlertDescription>
        </Alert>
      )}
      <Section title="SSP details" isCollapsible>
        <KeyValue.Group labelWidth="auto">
          <KeyValue label="Stored baseline" wrap>
            {held(register.data?.baselineTitle ?? <Absent />)}
          </KeyValue>
          <KeyValue label="Selected controls">{held(controlRows.length)}</KeyValue>
          <KeyValue label="Control narratives">{held(authored)}</KeyValue>
          <KeyValue label="Related requirements">{held(register.data?.requirements)}</KeyValue>
          <KeyValue label="Linked evidence versions">{held(register.data?.evidence)}</KeyValue>
          {register.data?.importedDemo && (
            <KeyValue label="Source">Imported demo selection</KeyValue>
          )}
        </KeyValue.Group>
      </Section>
      <ProductCollection
        table={table}
        queries={[...context, register]}
        onRowClick={(row) => {
          const record = controlRecord(row);
          if (record) openRecord("implemented_requirements", record, () => openPreview(row));
          else openPreview(row);
        }}
        empty={{
          illustration: "shield",
          title: "No controls in this SSP selection",
          description: "The stored baseline contains no selected controls.",
        }}
        fill={fill}
        searchLabel="Find selected controls"
        views={views}
        filters={
          <>
            {hasStatus ? <DataTable.Filter table={table} column="controlStatus" /> : null}
            {hasBaseline ? <DataTable.Filter table={table} column="origin" /> : null}
            <DataTable.Filter table={table} column="narrative" />
          </>
        }
      />
      <ReportFailures queries={[controlStatus]} />
      {selected && (
        // The preview stays open under a dialog opened from it, so focus returns to its trigger.
        <RecordPreviewPanel
          title={selected.title}
          label="SSP control preview"
          recordActions={previewActions(selected)}
          defaultWidth={640}
          onClose={() => {
            setSelectedId(undefined);
            setEvidenceId(undefined);
          }}
          navigation={
            // The row finds its place among the displayed rows. The full record is the control's
            // implementation; a control with none yet has no page beyond this preview.
            <RecordPreviewActions
              table="implemented_requirements"
              record={selected}
              {...(selectedRecord
                ? { destination: recordDestination("implemented_requirements", selectedRecord) }
                : { openLink: false })}
              rows={displayedRows}
              onSelect={openPreview}
            />
          }
        >
          <Stack space="space.300">
            <KeyValue.Group>
              <KeyValue label="Control">{selected.code}</KeyValue>
              <KeyValue label="SSP" wrap>
                {boundaryName} · SSP {plan.version_number}
              </KeyValue>
              <KeyValue label="Implementation">
                <StatusBadge
                  statuses={implementationStatuses}
                  value={selected.implementationId ? selected.status : undefined}
                />
              </KeyValue>
              {hasStatus && (
                <KeyValue label="Control status">
                  <StatusBadge
                    statuses={controlStatuses}
                    value={selected.controlStatus}
                    absentLabel="Not in the program baseline"
                  />
                </KeyValue>
              )}
            </KeyValue.Group>
            {requirementPreview && (
              <RecordSummaryPreview
                model="requirement_revisions"
                readOnly
                record={requirementPreview}
                rows={displayedRequirements}
                onSelect={(row) => setRequirementPreviewId(row.id)}
                onClose={() => setRequirementPreviewId(undefined)}
                fields={[
                  { key: "title" },
                  { key: "statement" },
                  { key: "acceptance_criteria" },
                  { key: "state" },
                ]}
              />
            )}
            {version && artifact && (
              <RecordPreviewPanel
                title={artifact.title}
                label="Supporting evidence preview"
                defaultWidth={640}
                onClose={() => setEvidenceId(undefined)}
                navigation={
                  <RecordPreviewActions
                    table="evidence_versions"
                    record={version}
                    rows={displayedEvidence}
                    onSelect={(next) => setEvidenceId(next.id)}
                  />
                }
              >
                <Stack space="space.200">
                  <KeyValue.Group>
                    <KeyValue label="Exact version">
                      Version {version.version_number} ·{" "}
                      {statusLabel(revisionStates, version.state)}
                    </KeyValue>
                  </KeyValue.Group>
                  <EvidenceVersionDetails artifact={artifact} version={version} />
                </Stack>
              </RecordPreviewPanel>
            )}
            {/* What stands behind the control, read as its preview opens: lines while it loads, and
                the preview's own alert with Retry when it fails. */}
            <QueryState queries={[detail]}>
              {assembly ? (
                <ControlSupport
                  control={assembly}
                  editable={editable}
                  partLabel={partLabel}
                  requirements={
                    <ProductCollection
                      table={requirementTable}
                      keepQuestion={false}
                      // A few rows in the preview, under its record header.
                      compact
                      searchLabel="Find supporting requirements"
                      empty={{
                        illustration: "shield",
                        icon: <ListChecks />,
                        title: "No requirement support",
                        description:
                          "No requirement support or allocated control mapping is recorded.",
                      }}
                    />
                  }
                  evidence={
                    <ProductCollection
                      table={evidenceTable}
                      keepQuestion={false}
                      compact
                      searchLabel="Find supporting evidence"
                      empty={{
                        illustration: "document",
                        icon: <FileText />,
                        title: "No supporting evidence",
                        description:
                          "No evidence is linked through this implementation or its related requirements.",
                      }}
                    />
                  }
                />
              ) : null}
            </QueryState>
          </Stack>
        </RecordPreviewPanel>
      )}
    </Stack>
  );
}

/**
 * What stands behind a control in its preview: its narrative, its recorded gaps, its statements and
 * contributions, the requirements and evidence behind it, and the provider offerings it accepted.
 */
function ControlSupport({
  control,
  editable,
  partLabel,
  requirements,
  evidence,
}: {
  control: SspControlAssembly;
  editable: boolean;
  partLabel: (statement: SspStatement) => string;
  /** The Requirements collection, its table owned by the preview's caller. */
  requirements: ReactNode;
  /** The Evidence collection, likewise. */
  evidence: ReactNode;
}) {
  return (
    <>
      <Section title="Control implementation">
        <Stack space="space.150">
          {control.implementation?.description ? (
            <Prose>{control.implementation.description}</Prose>
          ) : control.implementation ? (
            <EmptyMessage
              compact
              title="No narrative recorded"
              {...(editable
                ? {
                    description: "Edit the control implementation to say how this control is met.",
                  }
                : {})}
            />
          ) : (
            <EmptyMessage
              compact
              title="No control implementation yet"
              description={
                editable
                  ? "Create the control implementation to say how this control is met."
                  : "How this control is met is recorded in its control implementation."
              }
            />
          )}
          {control.implementation?.not_applicable_rationale && (
            <Prose label="Not applicable rationale">
              {control.implementation.not_applicable_rationale}
            </Prose>
          )}
        </Stack>
      </Section>
      {!!control.gaps.length && (
        <Section title="Recorded gaps">
          <List>
            {control.gaps.map((gap) => (
              <List.Item key={gap}>{gap}</List.Item>
            ))}
          </List>
        </Section>
      )}
      {!!control.statements.length && (
        <Section title="Statement narratives">
          <Stack space="space.200">
            {control.statements.map((statement) => (
              <Prose key={statement.id} label={partLabel(statement)}>
                {statement.description}
              </Prose>
            ))}
          </Stack>
        </Section>
      )}
      <Section title="Contributing systems">
        <Stack space="space.200">
          {!control.contributions.length && (
            <EmptyMessage
              compact
              title="No component contributions"
              description="A nested system or inherited control selection does not create an implementation narrative."
            />
          )}
          {control.contributions.map(({ record, component, path, binding }) => (
            <Section key={record.id} title={component?.name ?? "Component unavailable"}>
              <Stack space="space.100">
                <KeyValue.Group>
                  <KeyValue label="Path" wrap>
                    {path}
                    {["unbound", "ambiguous"].includes(binding) ? " · Identity needs review" : ""}
                  </KeyValue>
                  <KeyValue label="Implementation">
                    <StatusBadge
                      statuses={implementationStatuses}
                      value={record.implementation_status}
                    />
                  </KeyValue>
                </KeyValue.Group>
                {record.description && <Prose>{record.description}</Prose>}
              </Stack>
            </Section>
          ))}
        </Stack>
      </Section>
      <Section title="Requirements">{requirements}</Section>
      <Section title="Evidence">{evidence}</Section>
      {!!control.inherited.length && (
        <Section title="Accepted provider contributions">
          <Stack space="space.200">
            {control.inherited.map(({ acceptance, offering, contribution }) => (
              <Section
                key={acceptance.id}
                title={offering?.name ?? "Provider offering unavailable"}
              >
                <Stack space="space.100">
                  {contribution?.description ? <Prose>{contribution.description}</Prose> : null}
                  <KeyValue.Group>
                    {/* The pinned narrative could not be read: said where it would be. */}
                    {!contribution?.description && (
                      <KeyValue label="Provider narrative">
                        <Absent label="Unavailable" />
                      </KeyValue>
                    )}
                    <KeyValue label="Accepted">
                      <DateTime value={acceptance.accepted_at} />
                    </KeyValue>
                  </KeyValue.Group>
                  {acceptance.rationale && <Prose label="Rationale">{acceptance.rationale}</Prose>}
                  {acceptance.consumer_responsibility && (
                    <Prose label="Consumer responsibility">
                      {acceptance.consumer_responsibility}
                    </Prose>
                  )}
                </Stack>
              </Section>
            ))}
          </Stack>
        </Section>
      )}
    </>
  );
}
