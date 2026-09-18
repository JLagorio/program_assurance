import { ProductCollection } from "@/components/prototype/product-collection";
import { RecordSummaryPreview } from "@/components/prototype/record-summary-preview";
import { RecordLink, useDisplayedRecords } from "@/components/prototype/record-preview";
import { QueryState } from "@/components/prototype/work-common";
import { useMemo, useState } from "react";
import { Link, Outlet, createFileRoute, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Button,
  DataTable,
  Inline,
  Toolbar,
  PageHeader,
  Stack,
  TextLink,
  defineColumns,
  toCsv,
  useDataTable,
} from "@ledger/design-system";
import { Download, Plus } from "lucide-react";
import { useRows, type Row } from "@/lib/models";
import { labelFor } from "@/lib/records";
import { useWorkspace } from "@/components/app/workspace";
import { programTone } from "@/components/prototype/program-shared";

export const Route = createFileRoute("/programs")({
  head: () => ({ meta: [{ title: "Programs — Program Assurance" }] }),
  component: ProgramsLayout,
});
function ProgramsLayout() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  return pathname === "/programs" || pathname === "/programs/" ? <ProgramList /> : <Outlet />;
}
type ProgramListRow = Row<"programs"> & {
  state: string;
  systemCount: number;
  sponsor: string;
  impacts: string;
};
const statusPresets = [
  { id: "all", label: "All programs" },
  { id: "active", label: "Active", filters: [{ id: "state", value: [labelFor("active")] }] },
  { id: "planned", label: "Planned", filters: [{ id: "state", value: [labelFor("planned")] }] },
  {
    id: "open",
    label: "Active or planned",
    filters: [{ id: "state", value: [labelFor("active"), labelFor("planned")] }],
  },
  {
    id: "closed",
    label: "Closed or suspended",
    filters: [{ id: "state", value: [labelFor("closed"), labelFor("suspended")] }],
  },
];
function ProgramList() {
  const workspace = useWorkspace();
  const navigate = useNavigate();
  const programs = useRows("programs");
  const systems = useRows("systems");
  const parties = useRows("parties");
  const rows = useMemo(
    () =>
      (programs.data ?? []).map((program): ProgramListRow => {
        const owned = (systems.data ?? []).filter((system) => system.program_id === program.id);
        const impacts = [
          ...new Set(
            owned
              .flatMap((system) => [
                system.confidentiality_impact,
                system.integrity_impact,
                system.availability_impact,
              ])
              .filter((value): value is string => !!value),
          ),
        ];
        return {
          ...program,
          state: labelFor(program.status),
          systemCount: owned.length,
          sponsor:
            parties.data?.find((party) => party.id === program.sponsor_party_id)?.name ??
            "Not assigned",
          impacts: impacts.length ? impacts.map(labelFor).join(" · ") : "Not categorized",
        };
      }),
    [programs.data, systems.data, parties.data],
  );
  const [preview, setPreview] = useState<ProgramListRow | null>(null);
  const columns = useMemo(
    () =>
      defineColumns<ProgramListRow>((c) => [
        c.id("name", {
          header: "Program",
          width: 220,
          minWidth: 180,
          priority: 0,
          hideable: false,
          preview: setPreview,
          active: (row) => row.id === preview?.id,
          cell: (row) => (
            <RecordLink table="programs" record={row}>
              {row.name}
            </RecordLink>
          ),
        }),
        c.text("code", { header: "Code", width: 130 }),
        c.status("state", { header: "Status", width: 130, tone: (row) => programTone(row.status) }),
        c.number("systemCount", { header: "Systems", width: 100 }),
        c.text("impacts", { header: "System impacts", width: 160 }),
        c.text("sponsor", { header: "Sponsor", width: 160 }),
        c.date("starts_on", { header: "Starts", width: 120 }),
        c.date("ends_on", { header: "Ends", width: 120 }),
      ]),
    [preview?.id],
  );
  const table = useDataTable({
    columns,
    data: rows,
    getRowId: (program) => program.id,
    label: "Programs",
    view: "programs",
    pageSize: 25,
    resizable: true,
    reorderable: true,
  });
  const displayed = useDisplayedRecords(table);
  const error = programs.error ?? systems.error ?? parties.error;
  const loading = programs.isPending || systems.isPending || parties.isPending;
  const canCreate = workspace.role !== "viewer";
  function download() {
    const blob = new Blob([toCsv(table)], { type: "text/csv" });
    const href = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = href;
    link.download = "programs.csv";
    link.click();
    URL.revokeObjectURL(href);
  }
  return (
    <Stack space="space.200" className="min-w-0">
      <PageHeader>
        <PageHeader.Heading>
          <PageHeader.Title>Programs</PageHeader.Title>
        </PageHeader.Heading>
      </PageHeader>
      <ProductCollection
        queries={[programs, systems, parties]}
        table={table}
        fill
        onRowClick={(program) =>
          void navigate({ to: "/programs/$programId", params: { programId: program.id } })
        }
        empty={{
          illustration: "tree",
          title: "No programs yet",
          description:
            "A program holds the systems it assures, their requirements and the work that proves them. Create the first to start.",
          action: canCreate ? (
            <Button variant="primary" iconBefore={<Plus />} render={<Link to="/programs/new" />}>
              Create program
            </Button>
          ) : undefined,
        }}
        searchLabel="Find programs"
        views={<DataTable.Presets table={table} variant="menu" presets={statusPresets} />}
        filters={
          <>
            <DataTable.Filter table={table} column="state" />
            <DataTable.Filter table={table} column="sponsor" />
          </>
        }
        commands={[
          {
            label: "Export programs",
            onSelect: download,
            disabled: loading || !!error || rows.length === 0,
          },
        ]}
        action={
          <>
            {" "}
            {canCreate && (
              <Button
                size="small"
                variant="primary"
                iconBefore={<Plus />}
                render={<Link to="/programs/new" />}
              >
                Create program
              </Button>
            )}
          </>
        }
      />
      {preview && (
        <RecordSummaryPreview
          model="programs"
          record={rows.find((row) => row.id === preview.id) ?? preview}
          rows={displayed}
          onSelect={setPreview}
          onClose={() => setPreview(null)}
          fields={[
            { key: "code", label: "Code" },
            { key: "state", label: "Status" },
            { key: "sponsor", label: "Sponsor" },
            { key: "systemCount", label: "Systems" },
            { key: "impacts", label: "System impacts" },
          ]}
        />
      )}
    </Stack>
  );
}
