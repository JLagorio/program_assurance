import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Download, ListFilter, Plus } from "lucide-react";

import {
  Badge,
  Box,
  Button,
  Calendar,
  Checkbox,
  DataTable,
  Dialog,
  IndexPage,
  Inline,
  PageHeader,
  Popover,
  Progress,
  Spinner,
  Stack,
  Tabs,
  TextLink,
  defineColumns,
  toast,
  useDataTable,
  type ColumnFiltersState,
} from "@ledger/design-system";
import { Shell } from "@/components/app/shell";
import { programStatusTone, programs, type Program } from "@/lib/grc-data";
import { useProgramsVersion } from "@/lib/program-store";

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

const tabLabels = ["All", "In assessment", "Authorized", "POA&M open", "Draft"] as const;

/** The columns the reader can hide, with their labels; the id and the system stay. */
const hideable = [
  { id: "impact", label: "Impact" },
  { id: "baseline", label: "Baseline" },
  { id: "assessment", label: "Assessment" },
  { id: "status", label: "Status" },
  { id: "owner", label: "Owner" },
  { id: "expires", label: "Expires" },
] as const;

function ProgramPeek({ program: p }: { program: Program }) {
  return (
    <Stack space="space.100">
      <Inline space="space.150" alignBlock="start" spread="space-between">
        <div className="min-w-0">
          <div className="truncate font-medium">{p.name}</div>
          <div className="font-body-small text-subtle">
            {p.system} · {p.environment}
          </div>
        </div>
        <Badge tone={programStatusTone[p.status]} size="xsmall">
          {p.status}
        </Badge>
      </Inline>
      <dl className="grid gap-y-050 font-body-small" style={{ gridTemplateColumns: "88px 1fr" }}>
        <dt className="text-subtle">Owner</dt>
        <dd>{p.owner}</dd>
        <dt className="text-subtle">Assessor</dt>
        <dd>{p.assessor}</dd>
        <dt className="text-subtle">Assessed</dt>
        <dd className="tabular-nums">
          {p.controlsAssessed}/{p.controlsTotal} · {p.controlsFailing} failing
        </dd>
        <dt className="text-subtle">Expires</dt>
        <dd className="tabular-nums">{p.expires}</dd>
      </dl>
    </Stack>
  );
}

const impactRank = { Low: 0, Moderate: 1, High: 2 } as const;

const programColumns = defineColumns<Program>((c) => [
  c.id("id", { header: "Program", glance: (p) => <ProgramPeek program={p} /> }),
  c.text("name", {
    header: "System",
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
  c.custom("baseline", { header: "Baseline", width: 120, cell: (p) => <>Rev. 5 · {p.impact}</> }),
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
]);

function ProgramList() {
  const navigate = useNavigate();
  const programsVersion = useProgramsVersion();
  const [exporting, setExporting] = useState(false);
  const [scheduling, setScheduling] = useState(false);
  const [scheduleDate, setScheduleDate] = useState<Date | undefined>(undefined);

  const tabs = useMemo(
    () =>
      tabLabels.map((label) => ({
        label,
        count:
          label === "All" ? programs.length : programs.filter((p) => p.status === label).length,
      })),
    // The seed array is mutated in place when a program is created.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [programsVersion],
  );

  // The route owns the filters: the tabs set the status filter, the chips set theirs, the table filters.
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const tab = String(columnFilters.find((f) => f.id === "status")?.value ?? "All");
  const setTab = (next: string) =>
    setColumnFilters((f) => [
      ...f.filter((x) => x.id !== "status"),
      ...(next === "All" ? [] : [{ id: "status", value: next }]),
    ]);

  // The seed array is mutated in place when a program is created, so the table gets a fresh copy per version.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const data = useMemo(() => [...programs], [programsVersion]);
  const table = useDataTable({
    columns: programColumns,
    data,
    getRowId: (p) => p.id,
    selectable: true,
    pageSize: 25,
    label: "Programs",
    state: { columnFilters },
    onColumnFiltersChange: setColumnFilters,
    initialState: { sorting: [{ id: "id", desc: false }] },
  });
  const selected = table.getSelectedRowModel().rows.map((r) => r.original.id);
  const hiddenCount = hideable.filter((c) => !table.getColumn(c.id)?.getIsVisible()).length;

  return (
    <IndexPage
      header={
        <PageHeader
          title="Programs"
          description="Each program scopes one or more systems, categorizes each under CNSSI 1253, and assesses the tailored NIST SP 800-53 Rev. 5 control set it selects."
          actions={
            <>
              <Button
                variant="secondary"
                disabled={exporting}
                onClick={() => {
                  setExporting(true);
                  window.setTimeout(() => {
                    setExporting(false);
                    toast.success("SSP export ready", {
                      description: `${table.getRowCount()} programs · OSCAL 1.1.2 JSON`,
                    });
                  }, 900);
                }}
              >
                {exporting ? <Spinner /> : <Download className="size-icon-small" />} Export SSP
              </Button>
              <Button variant="primary" onClick={() => void navigate({ to: "/programs/new" })}>
                <Plus className="size-icon-small" /> New program
              </Button>
            </>
          }
        />
      }
    >
      <Tabs>
        {tabs.map((t) => (
          <Tabs.Tab
            key={t.label}
            isSelected={tab === t.label}
            onClick={() => setTab(t.label)}
            count={t.count}
          >
            {t.label}
          </Tabs.Tab>
        ))}
      </Tabs>

      <Inline space="space.100" alignBlock="center" shouldWrap>
        <DataTable.Filter table={table} column="impact" />
        <DataTable.Filter table={table} column="owner" />
        <DataTable.Filter table={table} column="expires" />
        <Inline className="ml-auto" space="space.100" alignBlock="center">
          <Popover
            width={200}
            align="end"
            trigger={
              <Button variant="secondary" size="small">
                <ListFilter className="size-icon-small" /> Columns
                {hiddenCount ? (
                  <Box
                    className="tabular-nums rounded-small bg-neutral font-body-xsmall font-medium text-subtle"
                    as="span"
                    paddingInline="space.050"
                  >
                    {hideable.length - hiddenCount}/{hideable.length}
                  </Box>
                ) : null}
              </Button>
            }
          >
            <Stack space="space.100">
              {hideable.map((c) => (
                <div key={c.id}>
                  <Checkbox
                    checked={table.getColumn(c.id)?.getIsVisible() ?? true}
                    onCheckedChange={(v) => table.getColumn(c.id)?.toggleVisibility(v === true)}
                  >
                    {c.label}
                  </Checkbox>
                </div>
              ))}
            </Stack>
          </Popover>
        </Inline>
      </Inline>

      <DataTable.SelectionBar
        table={table}
        actions={
          <>
            <Button variant="secondary" size="small">
              Reassign assessor
            </Button>
            <Button variant="secondary" size="small" onClick={() => setScheduling(true)}>
              Schedule assessment
            </Button>
          </>
        }
      />

      <DataTable
        table={table}
        empty={{ title: "No programs match", description: "Change the tab or the impact filter." }}
      />

      <Dialog
        open={scheduling}
        onClose={() => setScheduling(false)}
        title="Schedule assessment"
        description={`${selected.length} ${selected.length === 1 ? "program" : "programs"} · the assessor is notified with the date`}
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
    </IndexPage>
  );
}
