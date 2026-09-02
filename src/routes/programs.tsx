import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Download, ListFilter, Plus } from "lucide-react";

import {
  Badge,
  Button,
  Field,
  FilterChip,
  Input,
  Progress,
  NativeSelect,
  Table,
  Textarea,
  Id,
  Dialog,
  DatePicker,
  Checkbox,
  Combobox,
  HoverCard,
  Pagination,
  Popover,
  RadioGroup,
  ToggleGroup,
  Calendar,
  Spinner,
  Stepper,
  Tabs,
  toast,
} from "@/ds/primitives";
import { PageHeader, IndexPage } from "@/ds/patterns";
import { Shell } from "@/ds/shell";
import {
  baselineCounts,
  programStatusTone,
  programs,
  type ImpactLevel,
  type Program,
} from "@/lib/grc-data";
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

const tabs = [
  { label: "All", count: programs.length },
  { label: "In assessment", count: 1 },
  { label: "Authorized", count: 1 },
  { label: "POA&M open", count: 1 },
  { label: "Draft", count: 1 },
];

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

const createSteps = ["System scope", "Categorization", "Confirm"];

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
  const [tab, setTab] = useState("All");
  const [selected, setSelected] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [scheduling, setScheduling] = useState(false);
  const [scheduleDate, setScheduleDate] = useState<Date | undefined>(undefined);
  const [hidden, setHidden] = useState<ColumnKey[]>([]);
  const show = (key: ColumnKey) => !hidden.includes(key);

  const [impact, setImpact] = useState<(typeof impactLevels)[number]>("All");

  const filtered = useMemo(
    () =>
      programs.filter(
        (p) => (tab === "All" || p.status === tab) && (impact === "All" || p.impact === impact),
      ),
    [tab, impact],
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
          description="Each program scopes one system, categorizes it under FIPS-199, and assesses the tailored NIST SP 800-53 Rev. 5 baseline it inherits."
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
              <Button variant="primary" onClick={() => setCreating(true)}>
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

      <CreateProgram open={creating} onClose={() => setCreating(false)} />
    </IndexPage>
  );
}

/* ------------------------------------------------------- Create program */

const levels: ImpactLevel[] = ["Low", "Moderate", "High"];
const rank: Record<ImpactLevel, number> = { Low: 0, Moderate: 1, High: 2 };

function CreateProgram({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [system, setSystem] = useState("");
  const [type, setType] = useState("Major application");
  const [environment, setEnvironment] = useState("AWS GovCloud");
  const [owner, setOwner] = useState("Grace Hoppel");
  const [assessor, setAssessor] = useState("Whitcombe LLP");
  const [c, setC] = useState<ImpactLevel>("Moderate");
  const [i, setI] = useState<ImpactLevel>("Moderate");
  const [a, setA] = useState<ImpactLevel>("Low");
  const [inherit, setInherit] = useState(true);
  const [notes, setNotes] = useState("");

  const impact = levels[Math.max(rank[c], rank[i], rank[a])] as ImpactLevel;
  const total = baselineCounts[impact];
  const inherited = inherit ? Math.round(total * 0.16) : 0;

  const close = () => {
    onClose();
    setStep(1);
  };

  return (
    <Dialog
      open={open}
      onClose={close}
      width="lg"
      title="Create a program"
      description={`Step ${step} of 3 · ${
        step === 1
          ? "System scope"
          : step === 2
            ? "FIPS-199 categorization"
            : "Baseline and assessment"
      }`}
      aside={
        <div className="space-y-4">
          <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
            Derived baseline
          </div>
          <div>
            <div className="text-[20px] font-semibold tracking-[-0.02em]">NIST 800-53 Rev. 5</div>
            <div className="mt-0.5 text-[13px] text-muted-foreground">
              {impact} baseline · high-water mark of C/I/A
            </div>
          </div>
          <dl className="divide-y divide-border border-y border-border">
            {[
              ["Controls in baseline", String(total)],
              ["Inherited from idp-core", String(inherited)],
              ["To assess", String(total - inherited)],
              ["Confidentiality", c],
              ["Integrity", i],
              ["Availability", a],
            ].map(([k, v]) => (
              <div key={k} className="flex items-center justify-between gap-3 py-1.5">
                <dt className="text-[12px] text-muted-foreground">{k}</dt>
                <dd className="tnum text-[12px] font-medium text-foreground">{v}</dd>
              </div>
            ))}
          </dl>
          <p className="text-[12px] leading-relaxed text-muted-foreground">
            Every control in the baseline is created as an assessable item linked to this program.
            Tailoring can mark controls not applicable after creation.
          </p>
        </div>
      }
      footer={
        <>
          <Button variant="ghost" onClick={step === 1 ? close : () => setStep(step - 1)}>
            {step === 1 ? "Cancel" : "Back"}
          </Button>
          {step < 3 ? (
            <Button variant="primary" onClick={() => setStep(step + 1)}>
              Continue
            </Button>
          ) : (
            <Button variant="primary" onClick={close}>
              Create program
            </Button>
          )}
        </>
      }
    >
      <div className="mb-4">
        <Stepper>
          {createSteps.map((label, i) => (
            <Stepper.Item
              key={label}
              state={i + 1 < step ? "done" : i + 1 === step ? "current" : "upcoming"}
              label={label}
              meta={`Step ${i + 1} of ${createSteps.length}`}
              first={i === 0}
              last={i === createSteps.length - 1}
              {...(i + 1 < step ? { onSelect: () => setStep(i + 1) } : {})}
            />
          ))}
        </Stepper>
      </div>

      {step === 1 ? (
        <div className="space-y-3">
          <Field label="Program name">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Atlas payments platform"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="System identifier" hint="Matches the inventory record.">
              <Input
                value={system}
                onChange={(e) => setSystem(e.target.value)}
                placeholder="atlas-prod"
              />
            </Field>
            <Field label="System type">
              <NativeSelect value={type} onChange={(e) => setType(e.target.value)}>
                <option>Major application</option>
                <option>General support system</option>
                <option>Minor application</option>
              </NativeSelect>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Environment">
              <NativeSelect value={environment} onChange={(e) => setEnvironment(e.target.value)}>
                <option>AWS GovCloud</option>
                <option>AWS Commercial</option>
                <option>Azure</option>
                <option>On-premise</option>
              </NativeSelect>
            </Field>
            <Field label="System owner">
              <Combobox
                value={owner}
                onChange={setOwner}
                options={["Grace Hoppel", "Marcus Ryde", "Dana Whitlock", "Priya Raghavan"].map(
                  (name) => ({ value: name, label: name }),
                )}
                placeholder="Choose an owner"
                searchPlaceholder="Search people…"
                className="w-full"
              />
            </Field>
          </div>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="space-y-3">
          <p className="text-[13px] text-muted-foreground">
            Rate the potential impact of a loss for each security objective. The baseline is set by
            the high-water mark.
          </p>
          <div className="divide-y divide-border border-y border-border">
            {(
              [
                ["Confidentiality", c, setC],
                ["Integrity", i, setI],
                ["Availability", a, setA],
              ] as const
            ).map(([label, value, set]) => (
              <div key={label} className="flex items-center justify-between gap-4 py-2.5">
                <div>
                  <div className="text-[13px] font-medium">{label}</div>
                  <div className="text-[12px] text-muted-foreground">FIPS-199 potential impact</div>
                </div>
                <ToggleGroup
                  aria-label={`${label} impact`}
                  value={value}
                  onChange={(v) => set(v as ImpactLevel)}
                  items={levels.map((l) => ({ value: l, label: l }))}
                />
              </div>
            ))}
          </div>
          <Field label="Categorization rationale">
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Processes cardholder data for settlement; loss of confidentiality has severe financial and reputational impact."
            />
          </Field>
        </div>
      ) : null}

      {step === 3 ? (
        <div className="space-y-3">
          <div className="rounded-md border border-border px-3 py-2.5">
            <div className="text-[13px] font-medium">NIST SP 800-53 Rev. 5 — {impact} baseline</div>
            <div className="tnum mt-0.5 text-[12px] text-muted-foreground">
              {total} controls and enhancements will be added to this program.
            </div>
          </div>
          <Checkbox
            checked={inherit}
            onCheckedChange={(v) => setInherit(v === true)}
            className="mt-0.5"
          >
            <span>
              <span className="block text-[13px] font-medium">
                Inherit common controls from idp-core
              </span>
              <span className="block text-[12px] text-muted-foreground">
                IA and AC family controls provided by the corporate identity provider are marked
                inherited and satisfied.
              </span>
            </span>
          </Checkbox>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Assessor">
              <NativeSelect value={assessor} onChange={(e) => setAssessor(e.target.value)}>
                <option>Whitcombe LLP</option>
                <option>Internal assessment team</option>
                <option>Unassigned</option>
              </NativeSelect>
            </Field>
            <Field label="Target authorization date">
              <DatePicker defaultValue="2026-12-15" />
            </Field>
          </div>
        </div>
      ) : null}
    </Dialog>
  );
}
