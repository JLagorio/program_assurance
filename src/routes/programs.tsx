import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Download, ListFilter, Plus } from "lucide-react";

import {
  Badge,
  Button,
  FilterChip,
  Progress,
  Table,
  Id,
  Dialog,
  Checkbox,
  HoverCard,
  Pagination,
  Popover,
  RadioGroup,
  Calendar,
  Spinner,
  Tabs,
  toast,
} from "@/ds/primitives";
import { PageHeader, IndexPage } from "@/ds/patterns";
import { Shell } from "@/ds/shell";
import { programStatusTone, programs, type Program } from "@/lib/grc-data";
import { useProgramsVersion } from "@/lib/program-store";
import { usePage, useSort } from "@/lib/table-state";

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

const programSort = {
  id: (p: Program) => p.id,
  system: (p: Program) => p.name,
  impact: (p: Program) => ({ Low: 0, Moderate: 1, High: 2 })[p.impact] ?? 0,
  assessed: (p: Program) => p.controlsAssessed / Math.max(p.controlsTotal, 1),
  status: (p: Program) => p.status,
  owner: (p: Program) => p.owner,
  expires: (p: Program) => p.expires,
};

const impactLevels = ["All", "High", "Moderate", "Low"] as const;

const columns = [
  { key: "impact", label: "Impact" },
  { key: "baseline", label: "Baseline" },
  { key: "assessment", label: "Assessment" },
  { key: "status", label: "Status" },
  { key: "owner", label: "Owner" },
  { key: "expires", label: "Expires" },
] as const;
type ColumnKey = (typeof columns)[number]["key"];

function ProgramPeek({ program: p }: { program: Program }) {
  return (
    <div className="space-y-2">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate font-medium">{p.name}</div>
          <div className="text-12 text-muted-foreground">
            {p.system} · {p.environment}
          </div>
        </div>
        <Badge tone={programStatusTone[p.status]} size="xs">
          {p.status}
        </Badge>
      </div>
      <dl className="grid grid-cols-[88px_1fr] gap-y-1 text-12">
        <dt className="text-muted-foreground">Owner</dt>
        <dd>{p.owner}</dd>
        <dt className="text-muted-foreground">Assessor</dt>
        <dd>{p.assessor}</dd>
        <dt className="text-muted-foreground">Assessed</dt>
        <dd className="tnum">
          {p.controlsAssessed}/{p.controlsTotal} · {p.controlsFailing} failing
        </dd>
        <dt className="text-muted-foreground">Expires</dt>
        <dd className="tnum">{p.expires}</dd>
      </dl>
    </div>
  );
}

function ProgramList() {
  const navigate = useNavigate();
  const programsVersion = useProgramsVersion();
  const [tab, setTab] = useState("All");
  const [selected, setSelected] = useState<string[]>([]);
  const [exporting, setExporting] = useState(false);
  const [scheduling, setScheduling] = useState(false);
  const [scheduleDate, setScheduleDate] = useState<Date | undefined>(undefined);
  const [hidden, setHidden] = useState<ColumnKey[]>([]);
  const show = (key: ColumnKey) => !hidden.includes(key);

  const [impact, setImpact] = useState<(typeof impactLevels)[number]>("All");

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

  const filtered = useMemo(
    () =>
      programs.filter(
        (p) => (tab === "All" || p.status === tab) && (impact === "All" || p.impact === impact),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tab, impact, programsVersion],
  );
  const sort = useSort(filtered, programSort, { key: "id", dir: "asc" });
  const paged = usePage(sort.rows, 25);
  const rows = paged.rows;

  const toggle = (id: string) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

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
                      description: `${filtered.length} programs · OSCAL 1.1.2 JSON`,
                    });
                  }, 900);
                }}
              >
                {exporting ? <Spinner /> : <Download className="size-3.5" />} Export SSP
              </Button>
              <Button variant="primary" onClick={() => void navigate({ to: "/programs/new" })}>
                <Plus className="size-3.5" /> New program
              </Button>
            </>
          }
        />
      }
    >
      <Tabs
        items={tabs.map((t) => ({
          key: t.label,
          label: t.label,
          active: tab === t.label,
          onSelect: () => setTab(t.label),
          trailing: (
            <span className="tnum rounded bg-muted px-1 text-[11px] font-medium text-muted-foreground">
              {t.count}
            </span>
          ),
        }))}
      />

      <div className="flex flex-wrap items-center gap-2">
        <FilterChip label="Baseline" value="Rev. 5" active />
        <Popover
          width={180}
          trigger={
            <FilterChip
              label="Impact"
              {...(impact === "All" ? {} : { value: impact, active: true })}
            />
          }
        >
          <RadioGroup
            value={impact}
            onValueChange={(v) => setImpact(v as (typeof impactLevels)[number])}
            aria-label="Impact"
            className="space-y-2"
          >
            {impactLevels.map((l) => (
              <RadioGroup.Item key={l} value={l}>
                {l === "All" ? "Any impact" : l}
              </RadioGroup.Item>
            ))}
          </RadioGroup>
        </Popover>
        <FilterChip label="Owner" />
        <FilterChip label="Assessor" />
        <div className="ml-auto flex items-center gap-2">
          <Popover
            width={200}
            align="end"
            trigger={
              <Button variant="secondary" size="sm">
                <ListFilter className="size-3.5" /> Columns
                {hidden.length ? (
                  <span className="tnum rounded bg-muted px-1 text-[11px] font-medium text-muted-foreground">
                    {columns.length - hidden.length}/{columns.length}
                  </span>
                ) : null}
              </Button>
            }
          >
            <div className="space-y-2">
              {columns.map((c) => (
                <div key={c.key}>
                  <Checkbox
                    checked={show(c.key)}
                    onCheckedChange={(v) =>
                      setHidden((h) => (v === true ? h.filter((x) => x !== c.key) : [...h, c.key]))
                    }
                  >
                    {c.label}
                  </Checkbox>
                </div>
              ))}
            </div>
          </Popover>
        </div>
      </div>

      {selected.length > 0 ? (
        <div className="flex items-center gap-2 rounded-md border border-primary/25 bg-primary-soft px-3 py-1.5 text-[13px] text-primary">
          <span className="tnum font-medium">{selected.length} selected</span>
          <span className="ml-auto flex items-center gap-2">
            <Button variant="secondary" size="sm">
              Reassign assessor
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setScheduling(true)}>
              Schedule assessment
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setSelected([])}>
              Clear
            </Button>
          </span>
        </div>
      ) : null}

      <Table>
        <thead>
          <tr>
            <Table.Selection
              header
              checked={
                selected.length > 0 && selected.length === rows.length
                  ? true
                  : selected.length > 0
                    ? "indeterminate"
                    : false
              }
              onCheckedChange={(next) => setSelected(next ? rows.map((r) => r.id) : [])}
              label="Select all programs"
            />
            <Table.Header
              className="w-[92px]"
              sort={sort.dir("id")}
              onSort={() => sort.toggle("id")}
            >
              Program
            </Table.Header>
            <Table.Header sort={sort.dir("system")} onSort={() => sort.toggle("system")}>
              System
            </Table.Header>
            {show("impact") ? (
              <Table.Header
                className="w-[104px]"
                sort={sort.dir("impact")}
                onSort={() => sort.toggle("impact")}
              >
                Impact
              </Table.Header>
            ) : null}
            {show("baseline") ? <Table.Header className="w-[132px]">Baseline</Table.Header> : null}
            {show("assessment") ? (
              <Table.Header
                className="w-[168px]"
                sort={sort.dir("assessed")}
                onSort={() => sort.toggle("assessed")}
              >
                Assessment
              </Table.Header>
            ) : null}
            {show("status") ? (
              <Table.Header
                className="w-[124px]"
                sort={sort.dir("status")}
                onSort={() => sort.toggle("status")}
              >
                Status
              </Table.Header>
            ) : null}
            {show("owner") ? (
              <Table.Header
                className="w-[120px]"
                sort={sort.dir("owner")}
                onSort={() => sort.toggle("owner")}
              >
                Owner
              </Table.Header>
            ) : null}
            {show("expires") ? (
              <Table.Header
                className="w-[112px] text-right"
                sort={sort.dir("expires")}
                onSort={() => sort.toggle("expires")}
              >
                Expires
              </Table.Header>
            ) : null}
          </tr>
        </thead>
        <tbody>
          {rows.map((p) => {
            const pct = Math.round((p.controlsAssessed / p.controlsTotal) * 100);
            return (
              <Table.Row key={p.id} className="group" selected={selected.includes(p.id)}>
                <Table.Selection
                  checked={selected.includes(p.id)}
                  onCheckedChange={() => toggle(p.id)}
                  label={`Select ${p.id}`}
                />
                <Table.Cell className="w-[92px]">
                  <HoverCard content={<ProgramPeek program={p} />}>
                    <span
                      tabIndex={0}
                      className="inline-flex rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/35"
                    >
                      <Id>{p.id}</Id>
                    </span>
                  </HoverCard>
                </Table.Cell>
                <Table.Cell>
                  <Link
                    to="/programs/$programId"
                    params={{ programId: p.id }}
                    className="font-medium text-foreground group-hover:text-primary"
                  >
                    {p.name}
                  </Link>
                  <span className="ml-2 text-muted-foreground">{p.system}</span>
                </Table.Cell>
                {show("impact") ? (
                  <Table.Cell className="w-[104px]">
                    <Badge
                      tone={
                        p.impact === "High"
                          ? "danger"
                          : p.impact === "Moderate"
                            ? "warning"
                            : "neutral"
                      }
                    >
                      {p.impact}
                    </Badge>
                  </Table.Cell>
                ) : null}
                {show("baseline") ? (
                  <Table.Cell className="w-[132px]">Rev. 5 · {p.impact}</Table.Cell>
                ) : null}
                {show("assessment") ? (
                  <Table.Cell className="w-[168px]">
                    <span className="flex items-center gap-2">
                      <span className="w-16">
                        <Progress value={pct} tone={pct === 100 ? "success" : "info"} />
                      </span>
                      <span className="tnum text-muted-foreground">
                        {p.controlsAssessed}/{p.controlsTotal}
                      </span>
                    </span>
                  </Table.Cell>
                ) : null}
                {show("status") ? (
                  <Table.Cell className="w-[124px]">
                    <Badge tone={programStatusTone[p.status]}>{p.status}</Badge>
                  </Table.Cell>
                ) : null}
                {show("owner") ? <Table.Cell className="w-[120px]">{p.owner}</Table.Cell> : null}
                {show("expires") ? (
                  <Table.Cell className="tnum w-[112px] text-right">{p.expires}</Table.Cell>
                ) : null}
              </Table.Row>
            );
          })}
        </tbody>
      </Table>

      <Pagination
        page={paged.page}
        pageCount={paged.pageCount}
        onPageChange={paged.setPage}
        total={paged.total}
        pageSize={paged.pageSize}
        className="border-t border-border pt-3"
      />

      <Dialog
        open={scheduling}
        onClose={() => setScheduling(false)}
        title="Schedule assessment"
        description={`${selected.length} ${selected.length === 1 ? "program" : "programs"} · the assessor is notified with the date`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setScheduling(false)}>
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
        <div className="flex justify-center">
          <Calendar mode="single" selected={scheduleDate} onSelect={setScheduleDate} />
        </div>
      </Dialog>
    </IndexPage>
  );
}
