import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Download, ListFilter, Plus } from "lucide-react";

import {
  Badge,
  Box,
  Button,
  Calendar,
  Checkbox,
  Dialog,
  FilterChip,
  Glance,
  HoverCard,
  Id,
  IndexPage,
  Inline,
  PageHeader,
  Pagination,
  Popover,
  Progress,
  RadioGroup,
  Spinner,
  Stack,
  Table,
  Tabs,
  toast,
  usePage,
  useSort,
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
    <Glance
      id={p.id}
      title={p.name}
      meta={`${p.system} · ${p.environment}`}
      status={
        <Badge tone={programStatusTone[p.status]} size="xsmall">
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
        <FilterChip label="Baseline" value="Rev. 5" isActive />
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
            className="space-y-100"
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
        <Inline className="ml-auto" space="space.100" alignBlock="center">
          <Popover
            width={200}
            align="end"
            trigger={
              <Button variant="secondary" size="small">
                <ListFilter className="size-icon-small" /> Columns
                {hidden.length ? (
                  <Box
                    className="tabular-nums rounded-small bg-neutral font-body-xsmall font-medium text-subtle"
                    as="span"
                    paddingInline="space.050"
                  >
                    {columns.length - hidden.length}/{columns.length}
                  </Box>
                ) : null}
              </Button>
            }
          >
            <Stack space="space.100">
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
            </Stack>
          </Popover>
        </Inline>
      </Inline>

      {selected.length > 0 ? (
        <Inline
          className="rounded-medium border border-brand bg-selected px-150 py-075 font-body text-brand"
          space="space.100"
          alignBlock="center"
        >
          <span className="tabular-nums font-medium">{selected.length} selected</span>
          <Inline className="ml-auto" as="span" space="space.100" alignBlock="center">
            <Button variant="secondary" size="small">
              Reassign assessor
            </Button>
            <Button variant="secondary" size="small" onClick={() => setScheduling(true)}>
              Schedule assessment
            </Button>
            <Button variant="subtle" size="small" onClick={() => setSelected([])}>
              Clear
            </Button>
          </Inline>
        </Inline>
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
            <Table.Header sort={sort.dir("id")} onSort={() => sort.toggle("id")} width={92}>
              Program
            </Table.Header>
            <Table.Header sort={sort.dir("system")} onSort={() => sort.toggle("system")}>
              System
            </Table.Header>
            {show("impact") ? (
              <Table.Header
                sort={sort.dir("impact")}
                onSort={() => sort.toggle("impact")}
                width={104}
              >
                Impact
              </Table.Header>
            ) : null}
            {show("baseline") ? <Table.Header width={132}>Baseline</Table.Header> : null}
            {show("assessment") ? (
              <Table.Header
                sort={sort.dir("assessed")}
                onSort={() => sort.toggle("assessed")}
                width={168}
              >
                Assessment
              </Table.Header>
            ) : null}
            {show("status") ? (
              <Table.Header
                sort={sort.dir("status")}
                onSort={() => sort.toggle("status")}
                width={124}
              >
                Status
              </Table.Header>
            ) : null}
            {show("owner") ? (
              <Table.Header
                sort={sort.dir("owner")}
                onSort={() => sort.toggle("owner")}
                width={120}
              >
                Owner
              </Table.Header>
            ) : null}
            {show("expires") ? (
              <Table.Header
                className="text-right"
                sort={sort.dir("expires")}
                onSort={() => sort.toggle("expires")}
                width={112}
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
              <Table.Row key={p.id} className="group" isSelected={selected.includes(p.id)}>
                <Table.Selection
                  checked={selected.includes(p.id)}
                  onCheckedChange={() => toggle(p.id)}
                  label={`Select ${p.id}`}
                />
                <Table.Cell width={92}>
                  <HoverCard content={<ProgramPeek program={p} />}>
                    <Inline
                      tabIndex={0}
                      className="rounded-xsmall outline-none focus-visible:outline-focused"
                      as="span"
                      display="inline-flex"
                    >
                      <Id>{p.id}</Id>
                    </Inline>
                  </HoverCard>
                </Table.Cell>
                <Table.Cell>
                  <Link
                    to="/programs/$programId"
                    params={{ programId: p.id }}
                    className="font-medium text-default group-hover:text-brand"
                  >
                    {p.name}
                  </Link>
                  <Box className="text-subtle" as="span" paddingInlineStart="space.100">
                    {p.system}
                  </Box>
                </Table.Cell>
                {show("impact") ? (
                  <Table.Cell width={104}>
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
                {show("baseline") ? <Table.Cell width={132}>Rev. 5 · {p.impact}</Table.Cell> : null}
                {show("assessment") ? (
                  <Table.Cell width={168}>
                    <Inline as="span" space="space.100" alignBlock="center">
                      <span className="w-800">
                        <Progress value={pct} tone={pct === 100 ? "success" : "information"} />
                      </span>
                      <span className="tabular-nums text-subtle">
                        {p.controlsAssessed}/{p.controlsTotal}
                      </span>
                    </Inline>
                  </Table.Cell>
                ) : null}
                {show("status") ? (
                  <Table.Cell width={124}>
                    <Badge tone={programStatusTone[p.status]}>{p.status}</Badge>
                  </Table.Cell>
                ) : null}
                {show("owner") ? <Table.Cell width={120}>{p.owner}</Table.Cell> : null}
                {show("expires") ? (
                  <Table.Cell className="tabular-nums text-right" width={112}>
                    {p.expires}
                  </Table.Cell>
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
        className="border-t border-default pt-150"
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
