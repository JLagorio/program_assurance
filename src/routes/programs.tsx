import { QueryState } from "@/components/prototype/work-common";
import { useMemo } from "react";
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
const columns = defineColumns<ProgramListRow>((column) => [
  column.text("code", {
    header: "Program",
    width: 130,
    pin: "start",
    hideable: false,
    cell: (program) => (
      <TextLink render={<Link to="/programs/$programId" params={{ programId: program.id }} />}>
        {program.code}
      </TextLink>
    ),
  }),
  column.text("name", {
    header: "Name",
    minWidth: 200,
    hideable: false,
    cell: (program) => (
      <TextLink
        weight="medium"
        render={<Link to="/programs/$programId" params={{ programId: program.id }} />}
      >
        {program.name}
      </TextLink>
    ),
  }),
  column.status("state", {
    header: "Status",
    width: 130,
    tone: (program) => programTone(program.status),
  }),
  column.number("systemCount", { header: "Systems", width: 100 }),
  column.text("impacts", { header: "System impacts", width: 160 }),
  column.text("sponsor", { header: "Sponsor", width: 160 }),
  column.date("starts_on", { header: "Starts", width: 120 }),
  column.date("ends_on", { header: "Ends", width: 120 }),
]);
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
      <QueryState queries={[programs, systems, parties]}>
        <DataTable
          responsive
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
          toolbar={
            <Toolbar
              search={String(table.state.globalFilter ?? "")}
              onSearch={(value) => table.setGlobalFilter(value)}
              placeholder="Find programs"
              views={<DataTable.Presets table={table} variant="menu" presets={statusPresets} />}
              filters={
                <>
                  <DataTable.Filter table={table} column="state" />
                  <DataTable.Filter table={table} column="sponsor" />
                </>
              }
              actions={
                <>
                  {" "}
                  <Button
                    size="small"
                    iconBefore={<Download />}
                    onClick={download}
                    disabled={loading || !!error || rows.length === 0}
                  >
                    Export
                  </Button>
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
            >
              <DataTable.Columns table={table} />
              <DataTable.Settings table={table} />
            </Toolbar>
          }
        />
      </QueryState>
    </Stack>
  );
}
