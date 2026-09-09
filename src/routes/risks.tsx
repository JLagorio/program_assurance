import { CreateRiskDialog } from "@/components/app/risk-create-dialog";
import { UnavailableAction } from "@/components/app/unavailable-action";
import { useRisksVersion } from "@/lib/risk-store";
import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { Download, Plus } from "lucide-react";
import { useMemo, useState } from "react";

import { Shell } from "@/components/app/shell";
import { type Risk, risks, riskStatusTone } from "@/lib/grc-data";
import { useTableSearch, validateTableSearch } from "@/lib/table-state";
import {
  Badge,
  Button,
  DataTable,
  defineColumns,
  Glance,
  IndexPage,
  Inline,
  PageHeader,
  type Preset,
  Progress,
  TextLink,
  toast,
  toCsv,
  type Tone,
  useDataTable,
} from "@ledger/design-system";

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

/** The states as saved questions over the register; the counts are live. */
const presets: Preset[] = ["All", "Active", "Mitigating", "Accepted", "Closed"].map((s) => ({
  id: s,
  label: s,
  filters: s === "All" ? [] : [{ id: "status", value: s }],
}));

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
      title={r.title}
      meta={`${r.framework} · ${r.control} · ${r.team}`}
      status={
        <Badge variant="secondary" tone={riskStatusTone[r.status]} size="xsmall">
          {r.status}
        </Badge>
      }
      facts={[
        { label: "Owner", value: r.owner },
        { label: "Treatment", value: r.treatment },
        { label: "Residual", value: `${r.residual} of ${r.inherent} inherent` },
        { label: "Due", value: r.due },
      ]}
    />
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
      <TextLink weight="medium" render={<Link to="/risks/$riskId" params={{ riskId: r.id }} />}>
        {r.title}
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
        <Progress value={r.residual} tone={residualTone(r.residual)} aria-hidden />
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
  const riskVersion = useRisksVersion();
  // Mutations keep the seed array identity; the store version invalidates the table snapshot.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const data = useMemo(() => [...risks], [riskVersion]);
  const [creating, setCreating] = useState(false);
  const [exporting, setExporting] = useState(false);
  // The URL owns the question: the presets write the status filter, the chips write theirs, the
  // headers write the sort, Pagination writes the page. A link carries all of it.
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const url = useTableSearch(
    search,
    (patch) => void navigate({ search: (prev) => ({ ...prev, ...patch }), replace: true }),
    { sort: "id", dir: "desc", pageSize: 5 },
  );
  const table = useDataTable({
    columns: riskColumns,
    data,
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
          actions={
            <>
              <Button
                variant="secondary"
                isLoading={exporting}
                iconBefore={<Download />}
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
                    toast.add({
                      title: "Risk register exported",
                      type: "success",
                      description: `${shown} risks · the columns shown, in the sort chosen`,
                    });
                  }, 300);
                }}
              >
                Export
              </Button>
              <Button variant="primary" onClick={() => setCreating(true)} iconBefore={<Plus />}>
                New risk
              </Button>
            </>
          }
        />
      }
    >
      <DataTable.Presets table={table} presets={presets} aria-label="Status" />
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
            <UnavailableAction
              reason="Reassignment is not available in this view."
              variant="secondary"
              size="small"
            >
              Reassign
            </UnavailableAction>
            <UnavailableAction
              reason="Open a risk record to add a treatment plan."
              variant="secondary"
              size="small"
            >
              Change treatment
            </UnavailableAction>
          </>
        }
      />

      <DataTable
        table={table}
        empty={{
          title: "No risks match",
          description: "Change the tab or the treatment filter.",
        }}
      />

      {creating ? <CreateRiskDialog open onClose={() => setCreating(false)} /> : null}
    </IndexPage>
  );
}
