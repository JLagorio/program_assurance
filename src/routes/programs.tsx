import { ProductCollection } from "@/components/prototype/product-collection";
import { RecordSummaryPreview } from "@/components/prototype/record-summary-preview";
import { RecordLink, useDisplayedRecords } from "@/components/prototype/record-preview";
import { useMemo, useState } from "react";
import { Link, Outlet, createFileRoute, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  DataTable,
  LinkButton,
  PageHeader,
  defineColumns,
  downloadCsv,
  useDataTable,
} from "@ledger/design-system";
import { Plus } from "lucide-react";
import { useRows, type Row } from "@/lib/models";
import { labelFor } from "@/lib/records";
import { programStatuses } from "@/lib/status";
import { Page } from "@/components/app/shell";
import { useWorkspace } from "@/components/app/workspace";
import { StatusBadge } from "@/components/app/status";

export const Route = createFileRoute("/programs")({
  head: () => ({ meta: [{ title: "Programs — Program Assurance" }] }),
  component: ProgramsLayout,
});
function ProgramsLayout() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  return pathname === "/programs" || pathname === "/programs/" ? <ProgramList /> : <Outlet />;
}
type ProgramListRow = Row<"programs"> & {
  systemCount: number;
  /** The sponsor's name; missing when the program records none. */
  sponsor?: string | undefined;
  /** The distinct impact levels of the program's systems, in words; missing when none is set. */
  impacts?: string | undefined;
};
// The status filter holds stored values; the chip and the badge read them through programStatuses.
const statusPresets = [
  { id: "all", label: "All programs" },
  { id: "active", label: "Active", filters: [{ id: "status", value: ["active"] }] },
  { id: "planned", label: "Planned", filters: [{ id: "status", value: ["planned"] }] },
  {
    id: "open",
    label: "Active or planned",
    filters: [{ id: "status", value: ["active", "planned"] }],
  },
  {
    id: "closed",
    label: "Closed or suspended",
    filters: [{ id: "status", value: ["closed", "suspended"] }],
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
        const sponsor = parties.data?.find((party) => party.id === program.sponsor_party_id);
        return {
          ...program,
          systemCount: owned.length,
          ...(sponsor ? { sponsor: sponsor.name } : {}),
          ...(impacts.length ? { impacts: impacts.map(labelFor).join(" · ") } : {}),
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
          width: 200,
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
        // In a narrow frame the status stays beside the name longest, then the code.
        c.text("code", { header: "Code", width: 130, priority: 2 }),
        c.status("status", {
          header: "Status",
          width: 120,
          priority: 1,
          statuses: programStatuses,
        }),
        c.number("systemCount", { header: "Systems", width: 100, priority: 3 }),
        c.text("impacts", { header: "System impacts", width: 160, priority: 4 }),
        c.text("sponsor", { header: "Sponsor", width: 160, priority: 5 }),
        c.date("starts_on", { header: "Starts", width: 120, priority: 6 }),
        c.date("ends_on", { header: "Ends", width: 120, priority: 7 }),
      ]),
    [preview?.id],
  );
  const table = useDataTable({
    columns,
    data: rows,
    getRowId: (program) => program.id,
    label: "Programs",
    view: "programs",
    pageSize: 20,
    resizable: true,
    reorderable: true,
  });
  const displayed = useDisplayedRecords(table);
  const error = programs.error ?? systems.error ?? parties.error;
  const loading = programs.isPending || systems.isPending || parties.isPending;
  const canCreate = workspace.role !== "viewer";
  function download() {
    downloadCsv(table, "programs.csv");
  }
  return (
    <Page>
      <PageHeader>
        <PageHeader.Heading>
          <PageHeader.Title>Programs</PageHeader.Title>
        </PageHeader.Heading>
      </PageHeader>
      <ProductCollection
        queries={[programs, systems, parties]}
        table={table}
        fill
        noun={{ one: "program", other: "programs" }}
        onRowClick={(program) =>
          void navigate({ to: "/programs/$programId", params: { programId: program.id } })
        }
        empty={{
          illustration: "tree",
          title: "No programs yet",
          description:
            "A program holds the systems it assures, their requirements and the work that proves them. Create the first to start.",
          action: canCreate ? (
            <LinkButton
              variant="primary"
              iconBefore={<Plus />}
              render={<Link to="/programs/new" />}
            >
              Create program
            </LinkButton>
          ) : undefined,
        }}
        searchLabel="Find programs"
        views={<DataTable.Presets table={table} variant="menu" presets={statusPresets} />}
        filters={
          <>
            <DataTable.Filter table={table} column="status" />
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
          canCreate ? (
            <LinkButton
              size="small"
              variant="primary"
              iconBefore={<Plus />}
              render={<Link to="/programs/new" />}
            >
              Create program
            </LinkButton>
          ) : undefined
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
            {
              key: "status",
              label: "Status",
              render: (row) => <StatusBadge statuses={programStatuses} value={row.status} />,
            },
            { key: "sponsor", label: "Sponsor" },
            { key: "systemCount", label: "Systems" },
            { key: "impacts", label: "System impacts" },
          ]}
        />
      )}
    </Page>
  );
}
