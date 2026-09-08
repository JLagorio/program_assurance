import { UnavailableAction } from "@/components/app/unavailable-action";
import { downloadText } from "@/components/app/export";
import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Download, Plus } from "lucide-react";

import {
  Badge,
  Box,
  Button,
  Calendar,
  DataTable,
  Dialog,
  Glance,
  IndexPage,
  Inline,
  PageHeader,
  Progress,
  Stack,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Count,
  TextLink,
  defineColumns,
  toast,
  useDataTable,
  type ColumnFiltersState,
} from "@ledger/design-system";
import { Shell } from "@/components/app/shell";
import { programStatusTone, programs, type Program } from "@/lib/grc-data";
import { saveProgramCommands, useProgramsVersion } from "@/lib/program-store";
import { controlMatrix } from "@/lib/control-matrix";
import { scopesForProgram, useScopesVersion } from "@/lib/scopes";
import { useControlSetVersion } from "@/lib/control-set";
import { useWorkVersion } from "@/lib/control-work";
import { useAssuranceVersion } from "@/lib/assurance-record-store";
import { useEvidenceVersion } from "@/lib/evidence-catalog";

export const Route = createFileRoute("/programs")({
  head: () => ({
    meta: [
      { title: "Programs — Equinox GRC" },
      {
        name: "description",
        content:
          "Assess systems against NIST SP 800-53 Rev. 5 baselines: FIPS-199 categorization, tailored control sets, assessment progress, and authorization state.",
      },
      { property: "og:title", content: "Programs — Equinox GRC" },
      {
        property: "og:description",
        content:
          "System assessment programs mapped to NIST SP 800-53 Rev. 5 baselines and authorization state.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProgramsLayout,
});

function ProgramsLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  if (pathname !== "/programs") return <Outlet />;
  return (
    <Shell>
      <ProgramList />
    </Shell>
  );
}

const tabLabels = [
  "All",
  "In assessment",
  "Authorized",
  "POA&M open",
  "Draft",
  "Archived",
] as const;

function ProgramPeek({ program: p }: { program: Program }) {
  return (
    <Glance
      id={p.id}
      title={p.name}
      meta={`${p.system} · ${p.environment}`}
      status={
        <Badge variant="secondary" tone={programStatusTone[p.status]} size="xsmall">
          {p.status}
        </Badge>
      }
      facts={[
        { label: "Owner", value: p.owner },
        { label: "Assessor", value: p.assessor },
        {
          label: "Assessed",
          value: `${p.controlsAssessed}/${p.controlsTotal} · ${p.controlsFailing} failing`,
        },
        { label: "Expires", value: p.expires },
      ]}
    />
  );
}

const impactRank = { Low: 0, Moderate: 1, High: 2 } as const;

const programColumns = defineColumns<Program>((c) => [
  c.id("id", {
    header: "Program",
    pin: "start",
    hideable: false,
    glance: (p) => <ProgramPeek program={p} />,
  }),
  c.text("name", {
    header: "System",
    hideable: false,
    cell: (p) => (
      <>
        <TextLink weight="medium">
          <Link to="/programs/$programId" params={{ programId: p.id }}>
            {p.name}
          </Link>
        </TextLink>
        <Box className="text-subtle" as="span" paddingInlineStart="space.100">
          {p.system}
        </Box>
      </>
    ),
  }),
  c.status("impact", {
    header: "Impact",
    width: 90,
    sortBy: (p) => impactRank[p.impact] ?? 0,
    tone: (p) => (p.impact === "High" ? "danger" : p.impact === "Moderate" ? "warning" : "neutral"),
  }),
  c.custom("baseline", {
    header: "Baseline",
    width: 120,
    cell: (p) => (
      <>
        {scopesForProgram(p.id).some((scope) => scope.selectionSource)
          ? p.baseline
          : `Rev. 5 · ${p.impact}`}
      </>
    ),
  }),
  c.custom("assessment", {
    header: "Assessment",
    width: 150,
    sort: (p) => p.controlsAssessed / Math.max(p.controlsTotal, 1),
    cell: (p) => {
      const pct = Math.round((p.controlsAssessed / p.controlsTotal) * 100);
      return (
        <Inline as="span" space="space.100" alignBlock="center">
          <span className="w-800">
            <Progress value={pct} tone={pct === 100 ? "success" : "information"} />
          </span>
          <span className="tabular-nums text-subtle">
            {p.controlsAssessed}/{p.controlsTotal}
          </span>
        </Inline>
      );
    },
  }),
  c.status("status", { header: "Status", width: 124, tone: (p) => programStatusTone[p.status] }),
  c.person("owner", { header: "Owner", width: 140 }),
  c.date("expires", { header: "Expires", width: 112 }),
  c.text("assessmentScheduled", {
    header: "Assessment scheduled",
    width: 160,
    cell: (program) => program.assessmentScheduled || "—",
  }),
]);

function ProgramList() {
  const navigate = useNavigate();
  const programsVersion = useProgramsVersion();
  const scopesVersion = useScopesVersion();
  const controlSetsVersion = useControlSetVersion();
  const workVersion = useWorkVersion();
  const assuranceVersion = useAssuranceVersion();
  const evidenceVersion = useEvidenceVersion();
  const [exporting, setExporting] = useState(false);
  const [scheduling, setScheduling] = useState(false);
  const [scheduleDate, setScheduleDate] = useState<Date | undefined>(undefined);

  const tabs = useMemo(
    () =>
      tabLabels.map((label) => ({
        label,
        count: programs.filter((program) =>
          label === "Archived"
            ? !!program.archivedAt
            : !program.archivedAt && (label === "All" || program.status === label),
        ).length,
      })),
    // The seed array is mutated in place when a program is created.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [programsVersion],
  );

  // The route owns the filters: the tabs set the status filter, the chips set theirs, the table filters.
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const tab = String(columnFilters.find((f) => f.id === "status")?.value ?? "All");
  const [showArchived, setShowArchived] = useState(false);
  const setTab = (next: string) => {
    setShowArchived(next === "Archived");
    setColumnFilters((f) => [
      ...f.filter((x) => x.id !== "status"),
      ...(next === "All" || next === "Archived" ? [] : [{ id: "status", value: next }]),
    ]);
  };

  // The seed array is mutated in place when a program is created, so the table gets a fresh copy per version.
  const data = useMemo(
    () =>
      programs
        .filter((program) => (showArchived ? !!program.archivedAt : !program.archivedAt))
        .map((program) => {
          if (!scopesForProgram(program.id).some((scope) => scope.selectionSource)) return program;
          const rows = controlMatrix(program.id);
          return {
            ...program,
            controlsTotal: rows.length,
            controlsAssessed: rows.filter((row) => row.status !== "Not assessed").length,
            controlsFailing: rows.filter((row) => row.status === "Other than satisfied").length,
          };
        }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      programsVersion,
      showArchived,
      scopesVersion,
      controlSetsVersion,
      workVersion,
      assuranceVersion,
      evidenceVersion,
    ],
  );
  const table = useDataTable({
    columns: programColumns,
    data,
    getRowId: (p) => p.id,
    selectable: true,
    pageSize: 25,
    label: "Programs",
    view: "programs",
    resizable: true,
    reorderable: true,
    state: { columnFilters },
    onColumnFiltersChange: setColumnFilters,
    initialState: { sorting: [{ id: "id", desc: false }] },
  });
  const selected = table.getSelectedRowModel().rows.map((r) => r.original.id);

  return (
    <IndexPage
      header={
        <PageHeader
          title="Programs"
          actions={
            <>
              <Button
                variant="secondary"
                isLoading={exporting}
                iconBefore={<Download />}
                onClick={() => {
                  downloadText(
                    "program-register.json",
                    JSON.stringify(
                      table.getRowModel().rows.map((row) => row.original),
                      null,
                      2,
                    ),
                    "application/json",
                  );
                }}
              >
                Export programs
              </Button>
              <Button
                variant="primary"
                onClick={() => void navigate({ to: "/programs/new" })}
                iconBefore={<Plus />}
              >
                New program
              </Button>
            </>
          }
        />
      }
    >
      <Tabs
        value={showArchived ? "Archived" : tab}
        onValueChange={(value) => setTab(value)}
        className="contents"
      >
        <TabsList className="w-full justify-start" variant="line" activateOnFocus>
          {tabs.map((t) => (
            <TabsTrigger key={t.label} value={t.label}>
              {t.label}
              {t.count != null ? <Count value={t.count} max={9999} /> : null}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value={showArchived ? "Archived" : tab} className="contents">
          <Inline space="space.100" alignBlock="center" shouldWrap>
            <DataTable.Filter table={table} column="impact" />
            <DataTable.Filter table={table} column="owner" />
            <DataTable.Filter table={table} column="expires" />
            <Inline className="ml-auto" space="space.100" alignBlock="center">
              <DataTable.Columns table={table} />
            </Inline>
          </Inline>

          {showArchived && selected.length ? (
            <Button
              onClick={() => {
                try {
                  saveProgramCommands(selected, { archivedAt: "" });
                  toast.success("Programs restored");
                } catch {
                  toast.error("Programs could not be restored");
                }
              }}
            >
              Restore selected programs
            </Button>
          ) : null}
          <DataTable.SelectionBar
            table={table}
            actions={
              <>
                <UnavailableAction
                  reason="Bulk assessor reassignment is not available."
                  variant="secondary"
                  size="small"
                >
                  Reassign assessor
                </UnavailableAction>
                <Button variant="secondary" size="small" onClick={() => setScheduling(true)}>
                  Schedule assessment
                </Button>
              </>
            }
          />

          <DataTable
            table={table}
            empty={{
              title: "No programs match",
              description: "Change the tab or the impact filter.",
            }}
          />

          <Dialog
            open={scheduling}
            onClose={() => setScheduling(false)}
            title="Schedule assessment"
            description={`${selected.length} ${selected.length === 1 ? "program" : "programs"} · schedule saved in this browser`}
            footer={
              <>
                <Button variant="subtle" onClick={() => setScheduling(false)}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  disabled={!scheduleDate}
                  onClick={() => {
                    const d = scheduleDate;
                    if (!d) return;
                    try {
                      saveProgramCommands(selected, {
                        assessmentScheduled: d.toISOString().slice(0, 10),
                      });
                    } catch {
                      toast.error("Schedule could not be saved");
                      return;
                    }
                    setScheduling(false);
                    toast.success(
                      `Assessment scheduled for ${d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`,
                      { description: selected.join(", ") },
                    );
                  }}
                >
                  Schedule
                </Button>
              </>
            }
          >
            <Inline alignInline="center">
              <Calendar mode="single" selected={scheduleDate} onSelect={setScheduleDate} />
            </Inline>
          </Dialog>
        </TabsContent>
      </Tabs>
    </IndexPage>
  );
}
