import { Funnel } from "@/components/app/control-board";
import { useAssuranceVersion } from "@/lib/assurance-record-store";
import { buildBoard, stageKeys, stageLabels } from "@/lib/control-board";
import { controlStatusTone, type ControlStatus } from "@/lib/control-matrix";
import { assessmentTone, implementationTone, useWorkVersion } from "@/lib/control-work";
import {
  filterControlCoverage,
  programControlImplementations,
  programControlRows,
  type ProgramControlRow,
} from "@/lib/program-controls";
import { closestProgramScope } from "@/lib/program-scope";
import { useRequirementsVersion } from "@/lib/requirements";
import { useScopesVersion } from "@/lib/scopes";
import { useControlText, useSctm } from "@/lib/sctm";
import {
  Badge,
  Button,
  buttonVariants,
  DataTable,
  defineColumns,
  IconButton,
  Id,
  Inline,
  Stack,
  Table,
  TextLink,
  Toolbar,
  useDataTable,
} from "@ledger/design-system";
import { Link } from "@tanstack/react-router";
import { Columns3, ArrowUpRight, Eye } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

type ControlTableRow = ProgramControlRow & { progressStage: string; coverage: ControlStatus };

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
  coverageFamily,
  coverageStatus,
  onClearCoverage,
  previewId,
  onPreview,
}: {
  programId: string;
  previewId?: string | undefined;
  onPreview: (controlId: string, scopeId: string) => void;
  elementId?: string | undefined;
  coverageFamily?: string | undefined;
  coverageStatus?: ControlStatus | undefined;
  onClearCoverage?: (() => void) | undefined;
}) {
  const workVersion = useWorkVersion();
  const scopesVersion = useScopesVersion();
  const assuranceVersion = useAssuranceVersion();
  const requirementsVersion = useRequirementsVersion();
  const text = useControlText();
  const sctm = useSctm(programId, text);
  const previewRef = useRef({ previewId, onPreview });
  previewRef.current = { previewId, onPreview };
  const [groupBy, setGroupBy] = useState<"" | (typeof controlGroupOptions)[number]["value"]>("");
  const rows = useMemo(
    () =>
      filterControlCoverage(programControlRows(programId, elementId), {
        family: coverageFamily,
        status: coverageStatus,
      }),
    [
      programId,
      elementId,
      workVersion,
      scopesVersion,
      assuranceVersion,
      requirementsVersion,
      coverageFamily,
      coverageStatus,
    ],
  );
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
      return {
        ...row,
        coverage: row.record.status,
        progressStage: stage ? stageLabels[stage] : "No stalled stage",
      };
    });
  }, [rows, progress]);
  const scope = closestProgramScope(programId, elementId);
  const columns = useMemo(
    () =>
      defineColumns<ControlTableRow>((column) => [
        column.id("id", {
          header: "Control",
          width: 135,
          hideable: false,
          preview: (row) => previewRef.current.onPreview(row.id, row.scopeId),
          active: (row) => row.id === previewRef.current.previewId,
          cell: (row) => (
            <TextLink
              render={
                <Link
                  to="/programs/$programId/controls/$controlId"
                  params={{ programId, controlId: row.id }}
                  search={{ scope: row.scopeId, element: elementId }}
                />
              }
            >
              <Id>{row.id}</Id>
            </TextLink>
          ),
        }),
        column.text("title", {
          header: "Title",
          minWidth: 250,
          hideable: false,
          cell: (row) => (
            <TextLink
              render={
                <Link
                  to="/programs/$programId/controls/$controlId"
                  params={{ programId, controlId: row.id }}
                  search={{ scope: row.scopeId, element: elementId }}
                />
              }
            >
              {row.title}
            </TextLink>
          ),
        }),
        column.text("family", { header: "Family", width: 100 }),
        column.status("coverage", {
          header: "Coverage",
          width: 176,
          tone: (row) => controlStatusTone[row.coverage],
        }),
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
    [programId, elementId],
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
        onOpen={(scopeId) => onPreview(row.id, scopeId)}
      />
    ),
    state: { grouping: groupBy ? [groupBy] : [] },
    initialState: {
      expanded: true,
      columnVisibility: { family: false, coverage: false, progressStage: false },
    },
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
  // An explicit overview link takes precedence over filters from a saved table view.
  const appliedCoverage = useRef("");
  useEffect(() => {
    const key = `${programId}/${coverageFamily ?? ""}/${coverageStatus ?? ""}`;
    if (appliedCoverage.current === key) return;
    appliedCoverage.current = key;
    table.setColumnVisibility((visibility) => ({ ...visibility, coverage: !!coverageStatus }));
    if (coverageFamily || coverageStatus) {
      table.setColumnFilters([]);
      table.setGlobalFilter("");
    }
  }, [programId, coverageFamily, coverageStatus, table]);
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
            {coverageFamily || coverageStatus ? (
              <Inline space="space.100" alignBlock="center" shouldWrap>
                <Badge variant="secondary">
                  Coverage: {[coverageFamily, coverageStatus].filter(Boolean).join(" · ")}
                </Badge>
                <span className="font-body-small text-subtle">{rows.length} controls</span>
                <Button size="small" variant="subtle" onClick={onClearCoverage}>
                  Clear coverage filter
                </Button>
              </Inline>
            ) : null}
            <Toolbar
              search={String(table.state.globalFilter ?? "")}
              onSearch={(value) => table.setGlobalFilter(value)}
              placeholder="Find controls"
              filters={
                <>
                  <DataTable.Filters
                    table={table}
                    columns={["implementation", "assessment", "coverage", "owner", "progressStage"]}
                  />
                </>
              }
            >
              <DataTable.GroupBy
                options={controlGroupOptions}
                value={groupBy}
                onValueChange={setGroupBy}
              />

              <DataTable.MetricsTrigger />
              <DataTable.Columns table={table}>
                <Button size="small" iconBefore={<Columns3 />} aria-label="Columns" title="Columns">
                  <span className="sr-only sm:not-sr-only">Columns</span>
                </Button>
              </DataTable.Columns>
              <DataTable.Settings table={table} />
              {scope ? (
                <Link
                  to="/programs/$programId/components/$componentId"
                  params={{ programId, componentId: scope.element }}
                  search={{ tab: "Control set" }}
                  className={buttonVariants({ size: "small" })}
                >
                  <ArrowUpRight aria-hidden className="size-icon-small" />
                  <span className="sr-only sm:not-sr-only">Manage control set</span>
                </Link>
              ) : null}
            </Toolbar>
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
              <Inline space="space.100" alignBlock="center">
                <TextLink
                  render={
                    <Link
                      to="/programs/$programId/controls/$controlId"
                      params={{ programId, controlId }}
                      search={{ scope: row.scopeId, element: elementId }}
                    />
                  }
                >
                  {row.name}
                </TextLink>
                <IconButton
                  size="small"
                  variant="subtle"
                  icon={<Eye />}
                  label={`Preview ${controlId} implementation for ${row.name}`}
                  onClick={() => onOpen(row.scopeId)}
                />
              </Inline>
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
