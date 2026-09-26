import { RecordSummaryPreview } from "./record-summary-preview";
import { ProductCollection } from "./product-collection";
import { useCallback, useMemo, useRef, useState, type ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  RecordLink,
  RecordPreviewActions,
  RecordPreviewPanel,
  recordDestination,
  useDisplayedRecords,
} from "./record-preview";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { EmptyMessage, QueryState, type QueryStatus } from "./work-common";
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
  Stack,
  Text,
  TextLink,
  defineColumns,
  useDataTable,
} from "@ledger/design-system";
import { MoreHorizontal, TriangleAlert } from "lucide-react";
import { StatusBadge } from "@/components/app/status";
import { useWorkspace } from "@/components/app/workspace";
import { database, requireIdentity } from "@/lib/database";
import { useRow, useRows, type Row } from "@/lib/models";
import type { DataRecord } from "@/lib/records";
import { assembleSsp, sspSelectionGaps, type SspControlAssembly } from "@/lib/ssp-assembly";
import {
  implementationStatuses,
  recordedImplementationStatuses,
  revisionStates,
  statusLabel,
} from "@/lib/status";
import { EvidenceVersionDetails } from "./evidence-version-details";
import { ProductRecordDialog } from "./product-record-dialog";
import type { ProgramTableName } from "./program-shared";

type Editor = {
  table: ProgramTableName;
  existing?: DataRecord;
  initialValues?: Record<string, unknown>;
  description: string;
};

type LoadState = { data: unknown; fetchStatus: string; isError: boolean };
/** Settled: the query has rows to show, or nothing to wait for (a disabled query). A failed
 * refresh keeps its rows, so it stays settled and the screen keeps what the reader has. */
const settled = (query: LoadState) =>
  query.data !== undefined || (query.fetchStatus === "idle" && !query.isError);

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
  const systems = useRows("systems", { program_id: programId });
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

function useSspParts(ids: string[], enabled: boolean) {
  const workspace = useWorkspace();
  return useQuery({
    queryKey: ["ssp-assembly-parts", workspace.tenantId, ids],
    enabled,
    retry: false,
    // A saved statement changes the ids; the parts already shown stay while the new set loads.
    placeholderData: keepPreviousData,
    queryFn: async ({ signal }) => {
      const token = await requireIdentity(workspace);
      const rows: Row<"control_parts">[] = [];
      const seen = new Set<string>();
      let pending = ids;
      while (pending.length) {
        const batch = [...new Set(pending)].filter((id) => !seen.has(id));
        pending = [];
        batch.forEach((id) => seen.add(id));
        for (let offset = 0; offset < batch.length; offset += 100) {
          const { data, error } = await database()
            .from("control_parts")
            .select()
            .in("id", batch.slice(offset, offset + 100))
            .setHeader("Authorization", `Bearer ${token}`)
            .abortSignal(signal);
          if (error) throw new Error(error.message);
          rows.push(...data);
          pending.push(...data.flatMap((row) => row.parent_part_id ?? []));
        }
      }
      return rows;
    },
  });
}

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
  const system = useRow("systems", systemId);
  const plans = useRows("ssp_revisions", { system_id: systemId });
  const [chosenId, setChosenId] = useState<string>();
  const [creating, setCreating] = useState(false);
  const [editor, setEditor] = useState<Editor>();
  // Another revision is another register, drawn afresh; its picker takes the focus back.
  const revisionPicker = useFollowFocus();
  // Whether the open Create SSP revision dialog has saved: its opener leaves with the empty.
  const created = useRef(false);
  const ordered = [...(plans.data ?? [])].sort((a, b) => b.version_number - a.version_number);
  const plan = ordered.find((item) => item.id === chosenId) ?? ordered[0];
  const loaded = system.data !== undefined && plans.data !== undefined;
  const boundary =
    !!system.data && system.data.program_id === programId && system.data.is_authorization_boundary;
  let body: ReactNode;
  if (!loaded) body = <QueryState queries={[plans, system]} />;
  else if (!boundary)
    body = (
      <Stack space="space.200">
        {scope}
        <QueryState queries={[plans, system]}>
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
        fill={fill}
        context={[plans, system]}
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
        <QueryState queries={[plans, system]}>
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
  views,
  fill,
  context,
  onEdit,
}: {
  programId: string;
  plan: Row<"ssp_revisions">;
  /** The controls that choose what the register shows (the boundary, the SSP revision). */
  views: ReactNode;
  fill: boolean;
  /** The queries the plan itself came from, so their failed refresh is announced with the rest. */
  context: QueryStatus[];
  /** Opens an editor, which returns focus to the control that opened it. */
  onEdit: (editor: Editor) => void;
}) {
  const workspace = useWorkspace();
  const selections = useRows("selected_controls");
  const effectiveBaselines = useRows("system_effective_baselines");
  const controls = useRows("controls");
  const systems = useRows("systems", { program_id: programId });
  const implementations = useRows("implemented_requirements", { ssp_revision_id: plan.id });
  const statements = useRows("implementation_statements", { ssp_revision_id: plan.id });
  const contributions = useRows("component_contributions");
  const components = useRows("system_components");
  const componentElements = useRows("system_component_element_links");
  const requirements = useRows("engineering_requirements", { program_id: programId });
  const contents = useRows("requirement_revisions");
  const requirementLinks = useRows("requirement_implementations");
  const controlMappings = useRows("requirement_control_links");
  const allocations = useRows("requirement_allocations");
  const requirementEvidence = useRows("requirement_evidence");
  const implementationEvidence = useRows("implementation_evidence");
  const artifacts = useRows("evidence_artifacts");
  const versions = useRows("evidence_versions");
  const acceptances = useRows("inheritance_acceptances", { ssp_revision_id: plan.id });
  const offerings = useRows("offered_implementations");
  const resolution = useRow("profile_resolutions", plan.profile_resolution_id);
  const profile = useRow("profile_revisions", resolution.data?.profile_revision_id);
  const profileRecord = useRow("profiles", profile.data?.profile_id);
  const partIds = useMemo(
    () =>
      [
        ...new Set([
          ...(statements.data ?? []).map((row) => row.control_part_id),
          ...(controlMappings.data ?? []).flatMap((row) => row.control_part_id ?? []),
        ]),
      ].sort(),
    [statements.data, controlMappings.data],
  );
  const parts = useSspParts(
    partIds,
    statements.data !== undefined && controlMappings.data !== undefined,
  );
  const queries = [
    selections,
    controls,
    systems,
    implementations,
    statements,
    contributions,
    components,
    componentElements,
    requirements,
    contents,
    requirementLinks,
    controlMappings,
    allocations,
    requirementEvidence,
    implementationEvidence,
    artifacts,
    versions,
    acceptances,
    offerings,
    parts,
    effectiveBaselines,
    resolution,
    profile,
    profileRecord,
  ];
  const ready = queries.every(settled);
  const rows = useMemo(
    () =>
      assembleSsp({
        plan,
        selections: selections.data ?? [],
        controls: controls.data ?? [],
        parts: parts.data ?? [],
        systems: systems.data ?? [],
        implementations: implementations.data ?? [],
        statements: statements.data ?? [],
        contributions: contributions.data ?? [],
        components: components.data ?? [],
        componentElements: componentElements.data ?? [],
        requirements: requirements.data ?? [],
        contents: contents.data ?? [],
        requirementLinks: requirementLinks.data ?? [],
        controlMappings: controlMappings.data ?? [],
        allocations: allocations.data ?? [],
        requirementEvidence: requirementEvidence.data ?? [],
        implementationEvidence: implementationEvidence.data ?? [],
        artifacts: artifacts.data ?? [],
        versions: versions.data ?? [],
        acceptances: acceptances.data ?? [],
        offerings: offerings.data ?? [],
        effectiveBaselines: effectiveBaselines.data ?? [],
      }),
    [
      plan,
      selections.data,
      controls.data,
      parts.data,
      systems.data,
      implementations.data,
      statements.data,
      contributions.data,
      components.data,
      componentElements.data,
      requirements.data,
      contents.data,
      requirementLinks.data,
      controlMappings.data,
      allocations.data,
      requirementEvidence.data,
      implementationEvidence.data,
      artifacts.data,
      versions.data,
      acceptances.data,
      offerings.data,
      effectiveBaselines.data,
    ],
  );
  const [selectedId, setSelectedId] = useState<string>();
  const gapsReady = [selections, controls, systems, effectiveBaselines].every(settled);
  const selectionGaps = sspSelectionGaps({
    plan,
    selections: selections.data ?? [],
    controls: controls.data ?? [],
    systems: systems.data ?? [],
    effectiveBaselines: effectiveBaselines.data ?? [],
  });
  const [evidenceId, setEvidenceId] = useState<string>();
  const navigate = useNavigate();
  const selected = rows.find((row) => row.id === selectedId);
  const editable = plan.state === "draft" && workspace.role !== "viewer";
  // A control with an implementation opens its control record; one without has only its selection.
  const controlRecord = useMemo(
    () => (row: SspControlAssembly) =>
      row.implementation
        ? ({
            table: "implemented_requirements",
            record: { ...row.implementation, program_id: programId },
          } as const)
        : ({ table: "selected_controls", record: row.selection } as const),
    [programId],
  );
  const columns = useMemo(
    () =>
      defineColumns<SspControlAssembly>((c) => [
        c.id("code", {
          header: "Control",
          width: 130,
          priority: 1,
          pin: "start",
          hideable: false,
          preview: (row) => {
            setSelectedId(row.id);
            setEvidenceId(undefined);
          },
          active: (row) => row.id === selectedId,
        }),
        c.text("title", {
          header: "Title",
          minWidth: 180,
          priority: 0,
          hideable: false,
          cell: (row) => {
            const { table: model, record } = controlRecord(row);
            return (
              <RecordLink table={model} record={record}>
                {row.title}
              </RecordLink>
            );
          },
        }),
        c.status("status", {
          header: "Recorded implementation",
          width: 212,
          statuses: recordedImplementationStatuses,
          cell: (row) =>
            row.implementation ? (
              <StatusBadge
                statuses={implementationStatuses}
                value={row.implementation.implementation_status}
              />
            ) : (
              <Absent label="Not recorded" />
            ),
        }),
        c.text("narrative", { header: "Control narrative", width: 160 }),
        c.number("contributionCount", { header: "Contributions", width: 140 }),
        c.number("requirementCount", { header: "Requirements", width: 130 }),
        c.number("evidenceCount", { header: "Evidence", width: 105 }),
      ]),
    [selectedId, controlRecord],
  );
  const table = useDataTable({
    columns,
    data: rows,
    getRowId: (row) => row.id,
    label: "SSP control assembly",
    view: "ssp-control-assembly",
    pageSize: 20,
    resizable: true,
  });
  const displayedRows = useDisplayedRecords(table);
  const [requirementPreviewId, setRequirementPreviewId] = useState<string>();
  const requirementRows = useMemo(
    () =>
      (selected?.requirements ?? []).map((support) => ({
        ...support.content,
        code: support.requirement.code,
        requirement: support.requirement,
        descriptions: support.descriptions,
        rationales: support.rationale,
      })),
    [selected],
  );
  const requirementColumns = useMemo(
    () =>
      defineColumns<(typeof requirementRows)[number]>((c) => [
        c.id("title", {
          header: "Requirement",
          minWidth: 200,
          priority: 0,
          preview: (row) => setRequirementPreviewId(row.id),
          active: (row) => row.id === requirementPreviewId,
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
    [requirementPreviewId],
  );
  const requirementTable = useDataTable({
    columns: requirementColumns,
    data: requirementRows,
    getRowId: (row) => row.id,
    label: "SSP supporting requirements",
    view: "ssp-supporting-requirements",
  });
  const displayedRequirements = useDisplayedRecords(requirementTable);
  const requirementPreview = requirementRows.find((row) => row.id === requirementPreviewId);
  const evidenceRows = useMemo(
    () =>
      (selected?.evidence ?? []).map((support) => ({
        ...support,
        title: support.artifact?.title ?? "Evidence unavailable",
        versionLabel: support.version
          ? `Version ${support.version.version_number} · ${statusLabel(revisionStates, support.version.state)}`
          : "Version unavailable",
      })),
    [selected],
  );
  const evidenceColumns = useMemo(
    () =>
      defineColumns<(typeof evidenceRows)[number]>((c) => [
        c.id("title", {
          header: "Evidence",
          minWidth: 200,
          priority: 0,
          preview: (row) => {
            if (row.version && row.artifact) setEvidenceId(row.id);
          },
          active: (row) => row.id === evidenceId,
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
    [evidenceId],
  );
  const evidenceTable = useDataTable({
    columns: evidenceColumns,
    data: evidenceRows,
    getRowId: (row) => row.id,
    label: "SSP supporting evidence",
    view: "ssp-supporting-evidence",
  });
  const displayedEvidence = useDisplayedRecords(evidenceTable);
  const version = versions.data?.find((row) => row.id === evidenceId);
  const artifact = artifacts.data?.find((row) => row.id === version?.artifact_id);
  const partLabels = useMemo(
    () => new Map((parts.data ?? []).map((part) => [part.id, part.source_id ?? part.title])),
    [parts.data],
  );
  const partLabel = (statement: Row<"implementation_statements">) =>
    partLabels.get(statement.control_part_id) ?? "Control statement";
  const authored = rows.filter((row) => row.narrative === "Recorded").length;
  const linkedRequirements = new Set(
    rows.flatMap((row) => row.requirements.map((support) => support.requirement.id)),
  ).size;
  const linkedEvidence = new Set(rows.flatMap((row) => row.evidence.map((support) => support.id)))
    .size;
  const currentBoundaryBaseline = effectiveBaselines.data?.find(
    (baseline) => baseline.system_id === plan.system_id,
  );
  const boundaryBaselineDiffers =
    currentBoundaryBaseline?.profile_resolution_id != null &&
    currentBoundaryBaseline.profile_resolution_id !== plan.profile_resolution_id;
  const boundaryName = systems.data?.find((row) => row.id === plan.system_id)?.name ?? "Boundary";
  const openNarrative = (row: SspControlAssembly) =>
    onEdit({
      table: "implemented_requirements",
      description: `${row.code} · ${row.title}`,
      ...(row.implementation ? { existing: row.implementation as DataRecord } : {}),
      initialValues: { ssp_revision_id: plan.id, selected_control_id: row.id },
    });
  const previewActions = (row: SspControlAssembly) => {
    if (!editable) return undefined;
    const implementation = row.implementation;
    // Statements and contributions hang off a recorded implementation.
    const statementEdits = implementation ? row.statements : [];
    const contributionEdits = implementation ? row.contributions : [];
    return (
      <>
        <Button size="small" variant="primary" onClick={() => openNarrative(row)}>
          {implementation ? "Edit control implementation" : "Create control implementation"}
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
  return (
    <Stack space="space.200">
      {boundaryBaselineDiffers && (
        <Alert tone="warning" role="status">
          <TriangleAlert aria-hidden />
          <AlertTitle>The system baseline differs from this SSP</AlertTitle>
          <AlertDescription>
            This SSP retains its stored selection. Review the boundary’s changed baseline before
            creating an updated SSP.
          </AlertDescription>
        </Alert>
      )}
      {gapsReady && !!selectionGaps.length && (
        <Alert tone="warning" role="status">
          <TriangleAlert aria-hidden />
          <AlertTitle>System controls outside this SSP selection</AlertTitle>
          <AlertDescription>
            <Stack space="space.075">
              <Text as="p">These controls are outside this SSP’s stored selection.</Text>
              <List>
                {selectionGaps.map((gap) => (
                  <List.Item key={gap.system.id}>
                    {gap.system.name}: {gap.controls.map((control) => control.code).join(", ")}
                  </List.Item>
                ))}
              </List>
            </Stack>
          </AlertDescription>
        </Alert>
      )}
      <Section title="SSP details" isCollapsible>
        {ready ? (
          <KeyValue.Group labelWidth={160}>
            <KeyValue label="Stored baseline" wrap>
              {profileRecord.data?.title ?? <Absent label="Not recorded" />}
            </KeyValue>
            <KeyValue label="Selected controls">{rows.length}</KeyValue>
            <KeyValue label="Control narratives">{authored}</KeyValue>
            <KeyValue label="Related requirements">{linkedRequirements}</KeyValue>
            <KeyValue label="Linked evidence versions">{linkedEvidence}</KeyValue>
            {resolution.data?.resolver_name === "archived-demo-explicit-selection" && (
              <KeyValue label="Source">Imported demo selection</KeyValue>
            )}
          </KeyValue.Group>
        ) : (
          <Text as="p" color="color.text.subtle">
            {/* A load that failed with nothing to show is not one still in progress; the
                collection's alert below carries Retry. */}
            {queries.some((query) => query.isError && query.data === undefined)
              ? "The SSP details could not be loaded."
              : "The SSP details appear once its records have loaded."}
          </Text>
        )}
      </Section>
      <ProductCollection
        table={table}
        queries={[...context, ...queries]}
        onRowClick={(row) => {
          const { table: model, record } = controlRecord(row);
          void navigate(recordDestination(model, record));
        }}
        empty={{
          illustration: "shield",
          title: "No controls in this SSP selection",
          description: "The stored baseline contains no selected controls.",
        }}
        fill={fill}
        searchLabel="Find selected controls"
        views={views}
        filters={<DataTable.Filter table={table} column="narrative" />}
      />
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
            // The row finds its place among the displayed rows; the full record is the control's own.
            <RecordPreviewActions
              table={controlRecord(selected).table}
              record={selected}
              destination={recordDestination(
                controlRecord(selected).table,
                controlRecord(selected).record,
              )}
              rows={displayedRows}
              onSelect={(row) => {
                setSelectedId(row.id);
                setEvidenceId(undefined);
              }}
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
                  value={selected.implementation?.implementation_status}
                />
              </KeyValue>
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
            <Section title="Control implementation">
              <Stack space="space.150">
                {selected.implementation?.description ? (
                  <Prose>{selected.implementation.description}</Prose>
                ) : (
                  <Text as="p" color="color.text.subtle">
                    No control implementation narrative recorded.
                  </Text>
                )}
                {selected.implementation?.not_applicable_rationale && (
                  <Prose label="Not applicable rationale">
                    {selected.implementation.not_applicable_rationale}
                  </Prose>
                )}
              </Stack>
            </Section>
            {!!selected.gaps.length && (
              <Section title="Recorded gaps">
                <List>
                  {selected.gaps.map((gap) => (
                    <List.Item key={gap}>{gap}</List.Item>
                  ))}
                </List>
              </Section>
            )}
            {!!selected.statements.length && (
              <Section title="Statement narratives">
                <Stack space="space.200">
                  {selected.statements.map((statement) => (
                    <Prose key={statement.id} label={partLabel(statement)}>
                      {statement.description}
                    </Prose>
                  ))}
                </Stack>
              </Section>
            )}
            <Section title="Contributing systems">
              <Stack space="space.200">
                {!selected.contributions.length && (
                  <EmptyMessage
                    compact
                    title="No component contributions"
                    description="A nested system or inherited control selection does not create an implementation narrative."
                  />
                )}
                {selected.contributions.map(({ record, component, path, binding }) => (
                  <Section key={record.id} title={component?.name ?? "Component unavailable"}>
                    <Stack space="space.100">
                      <KeyValue.Group>
                        <KeyValue label="Path" wrap>
                          {path}
                          {["unbound", "ambiguous"].includes(binding)
                            ? " · Identity needs review"
                            : ""}
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
            <Section title="Requirements">
              <ProductCollection
                table={requirementTable}
                keepQuestion={false}
                searchLabel="Find supporting requirements"
                empty={{
                  illustration: "shield",
                  title: "No requirement support",
                  description: "No requirement support or allocated control mapping is recorded.",
                }}
              />
            </Section>
            <Section title="Evidence">
              <ProductCollection
                table={evidenceTable}
                keepQuestion={false}
                searchLabel="Find supporting evidence"
                empty={{
                  illustration: "document",
                  title: "No supporting evidence",
                  description:
                    "No evidence is linked through this implementation or its related requirements.",
                }}
              />
            </Section>
            {!!selected.inherited.length && (
              <Section title="Accepted provider contributions">
                <Stack space="space.200">
                  {selected.inherited.map(({ acceptance, offering, contribution }) => (
                    <Section
                      key={acceptance.id}
                      title={offering?.name ?? "Provider offering unavailable"}
                    >
                      <Stack space="space.100">
                        {contribution?.description ? (
                          <Prose>{contribution.description}</Prose>
                        ) : (
                          <Text as="p" color="color.text.subtle">
                            Pinned provider narrative unavailable.
                          </Text>
                        )}
                        <KeyValue.Group>
                          <KeyValue label="Accepted">
                            <DateTime value={acceptance.accepted_at} />
                          </KeyValue>
                        </KeyValue.Group>
                        {acceptance.rationale && (
                          <Prose label="Rationale">{acceptance.rationale}</Prose>
                        )}
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
          </Stack>
        </RecordPreviewPanel>
      )}
    </Stack>
  );
}
