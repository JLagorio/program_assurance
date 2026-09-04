import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import { Download, Plus } from "lucide-react";

import {
  Badge,
  Box,
  Button,
  Combobox,
  DataTable,
  Dialog,
  Field,
  Glance,
  Grid,
  Id,
  IndexPage,
  Inline,
  Input,
  KeyValue,
  NativeSelect,
  PageHeader,
  Progress,
  Spinner,
  Stack,
  Tabs,
  TextLink,
  Textarea,
  defineColumns,
  toast,
  toCsv,
  useDataTable,
  type Tone,
} from "@ledger/design-system";
import { useTableSearch, validateTableSearch } from "@/lib/table-state";
import { Shell } from "@/components/app/shell";
import { riskStatusTone, risks, type Risk } from "@/lib/grc-data";

export const Route = createFileRoute("/risks")({
  // The URL owns the table's question: sort, page, search and filters.
  validateSearch: validateTableSearch,
  head: () => ({
    meta: [
      { title: "Risk register — Equinox GRC" },
      {
        name: "description",
        content:
          "Every tracked risk with inherent and residual scoring, owner, treatment, and linked control — filterable and audit-ready.",
      },
      { property: "og:title", content: "Risk register — Equinox GRC" },
      {
        property: "og:description",
        content: "Inherent and residual scoring, owners, treatments, and linked controls.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RisksLayout,
});

const tabs = [
  { label: "All", count: 24 },
  { label: "Active", count: 4 },
  { label: "Mitigating", count: 11 },
  { label: "Accepted", count: 6 },
  { label: "Closed", count: 3 },
];

function RisksLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  if (pathname !== "/risks") return <Outlet />;
  return (
    <Shell>
      <RiskList />
    </Shell>
  );
}

function RiskPeek({ risk: r }: { risk: Risk }) {
  return (
    <Glance
      id={r.id}
      status={
        <Badge tone={riskStatusTone[r.status]} size="xsmall">
          {r.status}
        </Badge>
      }
      title={r.title}
      meta={`${r.framework} · ${r.control} · ${r.team}`}
    >
      <KeyValue label="Owner">{r.owner}</KeyValue>
      <KeyValue label="Treatment">{r.treatment}</KeyValue>
      <KeyValue label="Residual">
        <span className="tabular-nums">
          {r.residual} of {r.inherent} inherent
        </span>
      </KeyValue>
      <KeyValue label="Due">
        <span className="tabular-nums">{r.due}</span>
      </KeyValue>
    </Glance>
  );
}

const residualTone = (residual: number): Tone =>
  residual > 60 ? "danger" : residual > 30 ? "warning" : "success";

const riskColumns = defineColumns<Risk>((c) => [
  c.id("id", { pin: "start", hideable: false, glance: (r) => <RiskPeek risk={r} /> }),
  c.text("title", {
    header: "Risk",
    hideable: false,
    cell: (r) => (
      <TextLink weight="medium">
        <Link to="/risks/$riskId" params={{ riskId: r.id }}>
          {r.title}
        </Link>
      </TextLink>
    ),
  }),
  c.text("framework", { header: "Framework", width: 104 }),
  c.id("control", { header: "Control", width: 76, tone: "subtle", sortable: false }),
  c.person("owner", { header: "Owner", width: 130 }),
  c.text("treatment", { header: "Treatment", width: 88 }),
  c.custom("residual", {
    header: "Residual",
    width: 120,
    sort: (r) => r.residual,
    cell: (r) => (
      <Inline space="space.100" alignBlock="center">
        <span className="tabular-nums text-right font-body-small text-subtlest line-through w-250">
          {r.inherent}
        </span>
        <Progress value={r.residual} tone={residualTone(r.residual)} />
        <span className="tabular-nums shrink-0 text-right font-body-small font-medium w-250">
          {r.residual}
        </span>
      </Inline>
    ),
  }),
  c.date("updated", { header: "Updated", width: 104, sortable: false }),
  c.status("status", { header: "Status", width: 108, tone: (r) => riskStatusTone[r.status] }),
]);

function RiskList() {
  const [creating, setCreating] = useState(false);
  const [exporting, setExporting] = useState(false);
  // The URL owns the question: the tabs write the status filter, the chips write theirs, the
  // headers write the sort, Pagination writes the page. A link carries all of it.
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const url = useTableSearch(
    search,
    (patch) => void navigate({ search: (prev) => ({ ...prev, ...patch }), replace: true }),
    { sort: "id", dir: "desc", pageSize: 5 },
  );
  const tab = String(url.state.columnFilters.find((f) => f.id === "status")?.value ?? "All");
  const setTab = (next: string) =>
    url.onColumnFiltersChange((f) => [
      ...f.filter((x) => x.id !== "status"),
      ...(next === "All" ? [] : [{ id: "status", value: next }]),
    ]);
  const table = useDataTable({
    columns: riskColumns,
    data: risks,
    getRowId: (r) => r.id,
    selectable: true,
    pageSize: 5,
    label: "Risk register",
    view: "risks",
    resizable: true,
    reorderable: true,
    state: url.state,
    onSortingChange: url.onSortingChange,
    onPaginationChange: url.onPaginationChange,
    onColumnFiltersChange: url.onColumnFiltersChange,
    onGlobalFilterChange: url.onGlobalFilterChange,
  });
  const shown = table.getRowCount();

  return (
    <IndexPage
      header={
        <PageHeader
          title="Risk register"
          description="24 tracked risks across 4 frameworks. Residual scores recalculate when linked controls change state."
          actions={
            <>
              <Button
                variant="secondary"
                disabled={exporting}
                onClick={() => {
                  setExporting(true);
                  window.setTimeout(() => {
                    setExporting(false);
                    const csv = toCsv(table);
                    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = "risk-register.csv";
                    a.click();
                    URL.revokeObjectURL(url);
                    toast.success("Risk register exported", {
                      description: `${shown} risks · the columns shown, in the sort chosen`,
                    });
                  }, 300);
                }}
              >
                {exporting ? <Spinner /> : <Download className="size-icon-small" />} Export
              </Button>
              <Button variant="primary" onClick={() => setCreating(true)}>
                <Plus className="size-icon-small" /> New risk
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
        <DataTable.Filter table={table} column="framework" />
        <DataTable.Filter table={table} column="owner" />
        <DataTable.Filter table={table} column="treatment" />
        <DataTable.Filter table={table} column="updated" />
        <Inline className="ml-auto" space="space.100" alignBlock="center">
          <DataTable.Columns table={table} />
        </Inline>
      </Inline>

      <DataTable.SelectionBar
        table={table}
        actions={
          <>
            <Button variant="secondary" size="small">
              Reassign
            </Button>
            <Button variant="secondary" size="small">
              Change treatment
            </Button>
          </>
        }
      />

      <DataTable
        table={table}
        empty={{ title: "No risks match", description: "Change the tab or the treatment filter." }}
      />

      <CreateRiskModal open={creating} onClose={() => setCreating(false)} />
    </IndexPage>
  );
}

function CreateRiskModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [title, setTitle] = useState("");
  const [framework, setFramework] = useState("SOC 2");
  const [control, setControl] = useState("CC6.1");
  const [owner, setOwner] = useState("Sarah Chen");
  const [treatment, setTreatment] = useState("Mitigate");
  const [likelihood, setLikelihood] = useState("3");
  const [impact, setImpact] = useState("4");

  const inherent = Number(likelihood) * Number(impact) * 4;
  const residual = Math.round(inherent * (treatment === "Accept" ? 0.95 : 0.55));

  return (
    <Dialog
      open={open}
      onClose={onClose}
      width="large"
      title="Create a risk"
      description="Risks inherit scoring from likelihood × impact and recalculate when the linked control changes state."
      aside={
        <div>
          <div className="font-heading-xxsmall uppercase text-subtle">Preview</div>
          <Box paddingBlockStart="space.150">
            <Box className="rounded-medium border border-default bg-surface" padding="space.150">
              <Id className="text-subtle">RSK-2431</Id>
              <Box className="font-body font-medium" paddingBlockStart="space.050">
                {title || "Untitled risk"}
              </Box>
              <Box className="font-body-small text-subtle" paddingBlockStart="space.050">
                {framework} · {control} · {owner}
              </Box>
              <dl className="pt-150 space-y-100 border-t border-default">
                <Inline className="font-body-small" alignBlock="center" spread="space-between">
                  <dt className="text-subtle">Inherent</dt>
                  <dd className="tabular-nums font-medium">{inherent}</dd>
                </Inline>
                <Inline className="font-body-small" alignBlock="center" spread="space-between">
                  <dt className="text-subtle">Residual</dt>
                  <dd className="tabular-nums font-medium">{residual}</dd>
                </Inline>
                <Progress
                  value={residual}
                  tone={residual > 60 ? "danger" : residual > 30 ? "warning" : "success"}
                />
              </dl>
            </Box>
          </Box>
          <p className="pt-150 font-body-small text-subtle">
            Creating this risk notifies {owner} and opens a treatment task due in 30 days.
          </p>
        </div>
      }
      footer={
        <>
          <Button variant="subtle" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="secondary" onClick={onClose}>
            Save draft
          </Button>
          <Button variant="primary" onClick={onClose}>
            Create risk
          </Button>
        </>
      }
    >
      <Stack space="space.150">
        <Field label="Title">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Unscoped object references on export endpoint"
          />
        </Field>
        <Field label="Description" hint="Auditors read this verbatim during sampling.">
          <Textarea placeholder="What could happen, to which system, and why it matters." />
        </Field>
        <Grid gap="space.150" templateColumns="repeat(2, minmax(0, 1fr))">
          <Field label="Framework">
            <NativeSelect value={framework} onChange={(e) => setFramework(e.target.value)}>
              {["SOC 2", "ISO 27001", "GDPR", "PCI DSS"].map((f) => (
                <option key={f}>{f}</option>
              ))}
            </NativeSelect>
          </Field>
          <Field label="Linked control">
            <NativeSelect value={control} onChange={(e) => setControl(e.target.value)}>
              {["CC6.1", "CC6.2", "CC7.2", "CC9.2", "A.8.9"].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </NativeSelect>
          </Field>
          <Field label="Owner">
            <Combobox
              value={owner}
              onChange={setOwner}
              options={["Sarah Chen", "Linus Aarto", "Marcus Ryde", "Priya Raghavan"].map(
                (name) => ({ value: name, label: name }),
              )}
              placeholder="Choose an owner"
              searchPlaceholder="Search people…"
              className="w-full"
            />
          </Field>
          <Field label="Treatment">
            <NativeSelect value={treatment} onChange={(e) => setTreatment(e.target.value)}>
              {["Mitigate", "Accept", "Transfer", "Avoid"].map((t) => (
                <option key={t}>{t}</option>
              ))}
            </NativeSelect>
          </Field>
          <Field label="Likelihood (1–5)">
            <Input
              type="number"
              min={1}
              max={5}
              value={likelihood}
              onChange={(e) => setLikelihood(e.target.value)}
            />
          </Field>
          <Field label="Impact (1–5)">
            <Input
              type="number"
              min={1}
              max={5}
              value={impact}
              onChange={(e) => setImpact(e.target.value)}
            />
          </Field>
        </Grid>
      </Stack>
    </Dialog>
  );
}
