import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Badge,
  Block,
  Button,
  DataTable,
  Fact,
  Inline,
  PreviewSheet,
  Stack,
  Table,
  TextLink,
  defineColumns,
  useDataTable,
} from "@ledger/design-system";
import { Funnel } from "@/components/app/control-board";
import {
  ControlActions,
  Determination,
  EvidenceBlock,
  Narrative,
} from "@/components/app/control-work";
import { NewRequirementModal } from "@/components/app/requirement-forms";
import { ControlRequirementTable } from "@/components/app/requirements";
import { useAssuranceVersion } from "@/lib/assurance-record-store";
import { buildBoard, stageKeys, stageLabels } from "@/lib/control-board";
import { controlEvidence } from "@/lib/control-evidence";
import {
  assessmentTone,
  implementationTone,
  useWorkVersion,
  workFor,
  type WorkContext,
} from "@/lib/control-work";
import {
  controlAllocationCount,
  controlRequirementsInElement,
  programControlImplementations,
  programControlRows,
  type ProgramControlRow,
} from "@/lib/program-controls";
import { closestProgramScope, programElementIds } from "@/lib/program-scope";
import { useRequirementsVersion } from "@/lib/requirements";
import { scopeById, useScopesVersion } from "@/lib/scopes";
import { useControlText, useSctm } from "@/lib/sctm";
import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";

type ControlTableRow = ProgramControlRow & { progressStage: string };

const implementationColor = (row: ProgramControlRow) =>
  row.implementation === "Mixed" || row.implementation === "Unrecorded"
    ? ("neutral" as const)
    : implementationTone[row.implementation];

const controlGroupOptions = [
  { value: "family", label: "Family" },
  { value: "implementation", label: "Implementation" },
  { value: "assessment", label: "Assessment" },
  { value: "owner", label: "Owner" },
  { value: "appliesTo", label: "Applies to" },
] as const;

export function ProgramControls({
  programId,
  elementId,
}: {
  programId: string;
  elementId?: string | undefined;
}) {
  const workVersion = useWorkVersion();
  const scopesVersion = useScopesVersion();
  const assuranceVersion = useAssuranceVersion();
  const requirementsVersion = useRequirementsVersion();
  const text = useControlText();
  const sctm = useSctm(programId, text);
  const [selected, setSelected] = useState<{ controlId: string; scopeId: string } | null>(null);
  const [groupBy, setGroupBy] = useState<"" | (typeof controlGroupOptions)[number]["value"]>("");
  const rows = useMemo(
    () => programControlRows(programId, elementId),
    [programId, elementId, workVersion, scopesVersion, assuranceVersion, requirementsVersion],
  );
  const selectedControl = rows.find((row) => row.id === selected?.controlId);
  const selectedScope =
    selected && selectedControl?.scopeIds.includes(selected.scopeId) ? selected.scopeId : undefined;
  const progress = useMemo(() => {
    const controlIds = new Set(rows.map((row) => row.id));
    return buildBoard(programId, {
      ...sctm,
      rows: sctm.rows.filter((row) => controlIds.has(row.control)),
    });
  }, [programId, rows, sctm]);
  const tableRows = useMemo(() => {
    const stages = new Map(progress.controls.map((control) => [control.id, control.stuckAt]));
    return rows.map((row) => {
      const stage = stages.get(row.id);
      return { ...row, progressStage: stage ? stageLabels[stage] : "No stalled stage" };
    });
  }, [rows, progress]);
  const scope = closestProgramScope(programId, elementId);
  const columns = useMemo(
    () =>
      defineColumns<ControlTableRow>((column) => [
        column.id("id", { header: "Control", width: 100, hideable: false }),
        column.text("title", { header: "Title", minWidth: 250, hideable: false }),
        column.text("family", { header: "Family", width: 100 }),
        column.custom("appliesTo", {
          header: "Applies to",
          width: 175,
          cell: (row) =>
            `${row.scopeIds.length} ${row.scopeIds.length === 1 ? "element" : "elements"}`,
          text: (row) => row.appliesTo,
        }),
        column.status("implementation", {
          header: "Implementation",
          width: 176,
          tone: implementationColor,
        }),
        column.status("assessment", {
          header: "Assessment",
          width: 178,
          tone: (row) => assessmentTone[row.assessment],
        }),
        column.text("owner", { header: "Owner", width: 185 }),
        column.text("progressStage", { header: "Stuck at", hideable: false }),
      ]),
    [],
  );
  const table = useDataTable({
    data: tableRows,
    columns,
    getRowId: (row) => row.id,
    label: "Program controls",
    view: `program-controls-${programId}`,
    resizable: true,
    reorderable: true,
    groupBy: groupBy || undefined,
    detail: (row) => (
      <ImplementationRows
        programId={programId}
        controlId={row.id}
        elementId={elementId}
        onOpen={(scopeId) => setSelected({ controlId: row.id, scopeId })}
      />
    ),
    state: { grouping: groupBy ? [groupBy] : [] },
    initialState: { expanded: true, columnVisibility: { family: false, progressStage: false } },
  });
  // This field connects metric clicks to the Filters menu; it is not a displayed column.
  // Apply it after restoring older saved views that predate the field.
  const hiddenMetricFor = useRef<string | null>(null);
  useEffect(() => {
    if (hiddenMetricFor.current === programId) return;
    hiddenMetricFor.current = programId;
    table.setColumnVisibility((visibility) => ({ ...visibility, progressStage: false }));
  }, [programId, table]);
  const stageFilter = table.getColumn("progressStage")?.getFilterValue();
  const activeStage =
    Array.isArray(stageFilter) && stageFilter.length === 1
      ? (stageKeys.find((key) => stageLabels[key] === stageFilter[0]) ?? null)
      : null;
  return (
    <DataTable.Metrics>
      <DataTable
        table={table}
        onRowClick={(row) => table.options.meta?.toggleDetail?.(row.id)}
        empty={{ title: "No controls found", description: "No controls apply to this selection." }}
        toolbar={
          <Stack space="space.100">
            <Inline space="space.100" alignBlock="center" shouldWrap>
              <DataTable.Search table={table} placeholder="Find controls" />
              <Inline className="ml-auto" space="space.100" alignBlock="center" shouldWrap>
                <DataTable.GroupBy
                  options={controlGroupOptions}
                  value={groupBy}
                  onValueChange={setGroupBy}
                />
                <DataTable.Filters
                  table={table}
                  columns={["implementation", "assessment", "owner", "progressStage"]}
                />
                <DataTable.MetricsTrigger />
                <DataTable.Columns table={table} />
                <DataTable.Settings table={table} />
                {scope ? (
                  <Button
                    size="small"
                    render={
                      <Link
                        to="/programs/$programId/components/$componentId"
                        params={{ programId, componentId: scope.element }}
                        search={{ tab: "Control set" }}
                      />
                    }
                  >
                    Manage control set
                  </Button>
                ) : null}
              </Inline>
            </Inline>
            <DataTable.MetricsContent
              aria-label="Control metrics"
              className="border-0 bg-transparent"
            >
              <Funnel
                funnel={progress.funnel}
                total={progress.total}
                hollow={progress.hollow}
                through={progress.through}
                unknown={progress.unknown}
                active={activeStage}
                onSelect={(stage) =>
                  table
                    .getColumn("progressStage")
                    ?.setFilterValue(stage ? [stageLabels[stage]] : undefined)
                }
              />
            </DataTable.MetricsContent>
          </Stack>
        }
      />
      {selectedControl && selectedScope ? (
        <ControlPreview
          key={`${selectedControl.id}|${selectedScope}|${elementId ?? "program"}`}
          row={{ ...selectedControl, scopeId: selectedScope, scopeIds: [selectedScope] }}
          programId={programId}
          {...(elementId ? { elementId } : {})}
          onClose={() => setSelected(null)}
        />
      ) : null}
    </DataTable.Metrics>
  );
}

function ImplementationRows({
  programId,
  controlId,
  elementId,
  onOpen,
}: {
  programId: string;
  controlId: string;
  elementId?: string | undefined;
  onOpen: (scopeId: string) => void;
}) {
  const rows = programControlImplementations(programId, controlId, elementId);
  return (
    <Table label={`${controlId} implementations`} style={{ minWidth: 960 }}>
      <thead>
        <Table.Row>
          <Table.Header>System / component</Table.Header>
          <Table.Header width={160}>Implementation</Table.Header>
          <Table.Header width={170}>Assessment</Table.Header>
          <Table.Header width={170}>Owner</Table.Header>
          <Table.Header width={100}>Requirements</Table.Header>
          <Table.Header width={80}>Evidence</Table.Header>
        </Table.Row>
      </thead>
      <tbody>
        {rows.map((row) => (
          <Table.Row key={row.scopeId}>
            <Table.Cell className="whitespace-normal max-w-none">
              <TextLink>
                <button
                  type="button"
                  onClick={() => onOpen(row.scopeId)}
                  aria-label={`Open ${controlId} implementation for ${row.name}`}
                >
                  {row.name}
                </button>
              </TextLink>
            </Table.Cell>
            <Table.Cell>
              <Badge
                size="xsmall"
                tone={
                  row.implementation === "Unrecorded"
                    ? "neutral"
                    : implementationTone[row.implementation]
                }
              >
                {row.implementation}
              </Badge>
            </Table.Cell>
            <Table.Cell>
              <Badge size="xsmall" tone={assessmentTone[row.assessment]}>
                {row.assessment}
              </Badge>
            </Table.Cell>
            <Table.Cell>{row.owner}</Table.Cell>
            <Table.Cell>{row.requirements}</Table.Cell>
            <Table.Cell>{row.evidence}</Table.Cell>
          </Table.Row>
        ))}
      </tbody>
    </Table>
  );
}

function ControlPreview({
  row,
  programId,
  elementId,
  onClose,
}: {
  row: ProgramControlRow;
  programId: string;
  elementId?: string;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const [scopeId, setScopeId] = useState(row.scopeId);
  const [deriving, setDeriving] = useState(false);
  const [, refresh] = useState(0);
  const scope = scopeById.get(scopeId);
  const inheritedScope =
    !!elementId && !!scope && !programElementIds(programId, elementId).has(scope.element);
  const selectedElement = inheritedScope ? elementId : scope?.element;
  const applies = !!scope && row.scopeIds.includes(scope.id);
  const work =
    scope && applies && !inheritedScope ? workFor(programId, scope.id, row.id) : undefined;
  const requirements = controlRequirementsInElement(programId, row.id, selectedElement);
  const count = (id: string) => controlAllocationCount(programId, id, selectedElement);
  const contributors = requirements.reduce(
    (total, requirement) => total + count(requirement.id),
    0,
  );
  const context: WorkContext = {
    contributors,
    contributorDetail: contributors
      ? `${requirements.length} requirements, ${contributors} allocations`
      : "No allocated requirement",
  };
  const changed = () => refresh((version) => version + 1);
  const scopeIdItems = row.scopeIds.map((id) => ({
    value: id,
    label: scopeById.get(id)?.name ?? id,
  }));
  return (
    <>
      <PreviewSheet
        open
        onClose={onClose}
        id={row.id}
        title={row.title}
        subtitle={scope?.name ?? row.appliesTo}
        openTo={
          <Link
            to="/programs/$programId/controls/$controlId"
            params={{ programId, controlId: row.id }}
            search={{ scope: scopeId, element: elementId }}
          >
            Open control
          </Link>
        }
        status={
          <Badge tone={assessmentTone[work?.assessment ?? row.assessment]}>
            {work?.assessment ?? row.assessment}
          </Badge>
        }
        facts={
          <>
            <Fact label="Applies to">
              {row.scopeIds.length > 1 ? (
                <Select<string>
                  items={scopeIdItems}
                  value={scopeId}
                  onValueChange={(value) => {
                    if (value === null) return;
                    return setScopeId(value);
                  }}
                >
                  <SelectTrigger className="w-full" aria-label="Control scope">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {scopeIdItems.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                (scope?.name ?? row.appliesTo)
              )}
            </Fact>
            <Fact label="Implementation">
              {work
                ? work.implementationRecorded === false
                  ? "Unrecorded"
                  : work.implementation
                : row.implementation}
            </Fact>
            <Fact label="Owner">{work ? (work.owner ?? "Unassigned") : row.owner}</Fact>
          </>
        }
        actions={
          work ? (
            <ControlActions
              work={work}
              context={context}
              onChange={changed}
              extra={
                <Button size="small" onClick={() => setDeriving(true)}>
                  Derive requirement
                </Button>
              }
            />
          ) : (
            <>
              <Button size="small" onClick={() => setDeriving(true)}>
                Derive requirement
              </Button>
              {scope && applies ? (
                <Button
                  size="small"
                  render={
                    <Link
                      to="/programs/$programId/controls/$controlId"
                      params={{ programId, controlId: row.id }}
                      search={{ scope: scope.id, element: elementId }}
                    />
                  }
                >
                  Open inherited implementation
                </Button>
              ) : null}
            </>
          )
        }
      >
        {work ? (
          <Stack space="space.200">
            <Block title="Implementation">
              <Narrative key={work.id} work={work} elementId={elementId} onChange={changed} />
            </Block>
            <Block title="Requirements" count={requirements.length}>
              <ControlRequirementTable
                requirements={requirements}
                programId={programId}
                controlId={row.id}
                allocationCount={count}
                elementId={elementId}
              />
            </Block>
            <Block title="Supporting evidence" count={controlEvidence(work).length}>
              <EvidenceBlock key={work.id} work={work} elementId={elementId} onChange={changed} />
            </Block>
            <Block title="Assessment">
              <Determination key={work.id} work={work} onChange={changed} />
            </Block>
          </Stack>
        ) : (
          <Stack space="space.200">
            <Block title="Implementation">
              <p className="font-body text-subtle">
                {applies
                  ? `No component implementation recorded. This control is inherited from ${scope?.name ?? "the parent scope"}.`
                  : "This control no longer applies to the selected scope."}
              </p>
            </Block>
            <Block title="Requirements" count={requirements.length}>
              <ControlRequirementTable
                requirements={requirements}
                programId={programId}
                controlId={row.id}
                allocationCount={count}
                elementId={elementId}
              />
            </Block>
          </Stack>
        )}
      </PreviewSheet>
      {deriving ? (
        <NewRequirementModal
          key={row.id}
          open
          onClose={() => setDeriving(false)}
          programId={programId}
          initialControlId={row.id}
          onCreated={(requirement) => {
            void navigate({
              to: "/programs/$programId/requirements/$requirementId",
              params: { programId, requirementId: requirement.id },
              search: { element: elementId },
            });
          }}
        />
      ) : null}
    </>
  );
}
