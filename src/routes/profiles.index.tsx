import { useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  Badge,
  Count,
  DataTable,
  defineColumns,
  Inline,
  PageHeader,
  Stack,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  useDataTable,
} from "@ledger/design-system";
import { ControlSetApprovals } from "@/components/app/control-set-approvals";
import { useControlSetVersion } from "@/lib/control-set";
import { pendingRevisions } from "@/lib/control-set";
import { profileSummaries, type ProfileSummary } from "@/lib/profiles";

export const Route = createFileRoute("/profiles/")({
  head: () => ({
    meta: [
      { title: "Profiles — tailored control selections | Equinox" },
      {
        name: "description",
        content:
          "Every control selection in the product: the published SP 800-53B baselines, the program's tailored profile, and each scope's own set.",
      },
      { property: "og:title", content: "Profiles — Equinox" },
      { property: "og:type", content: "website" },
    ],
  }),
  component: ProfilesIndex,
});

const tabs = ["Profiles", "Approvals"] as const;
type Tab = (typeof tabs)[number];

function ProfilesIndex() {
  const [tab, setTab] = useState<Tab>("Profiles");
  useControlSetVersion();
  const rows = profileSummaries();
  const pending = pendingRevisions().length;

  return (
    <Stack className="animate-rise" space="space.200">
      <PageHeader>
        <div className="min-w-0">
          <PageHeader.Title>{"Profiles"}</PageHeader.Title>
          <p className="pt-050 font-body-small text-subtle">
            A profile takes a catalog and tailors it up or down. The four SP 800-53B baselines are
            NIST's own; the rest were resolved here from them.
          </p>
        </div>
      </PageHeader>

      <Tabs value={tab} onValueChange={(value) => setTab(value as Tab)} className="contents">
        <TabsList className="w-full justify-start" variant="line" activateOnFocus>
          {tabs.map((t) => (
            <TabsTrigger key={t} value={t}>
              {t}
              <Count value={t === "Profiles" ? rows.length : pending} max={999} />
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value={tab} className="contents">
          {tab === "Profiles" ? <ProfilesTable rows={rows} /> : null}
          {tab === "Approvals" ? <ControlSetApprovals /> : null}
        </TabsContent>
      </Tabs>
    </Stack>
  );
}

const kindTone = {
  Baseline: "information",
  Tailored: "success",
} as const;

/** The row the table sorts, filters and exports: every column id is a real key. */
type Row = ProfileSummary & { source: string };

function ProfilesTable({ rows }: { rows: ProfileSummary[] }) {
  const navigate = useNavigate();

  const data = useMemo<Row[]>(
    () =>
      rows.map((row) => ({
        ...row,
        source: row.authoritative ? "Authoritative" : "Derived here",
      })),
    [rows],
  );

  const columns = useMemo(
    () =>
      defineColumns<Row>((c) => [
        c.text("name", { header: "Profile", hideable: false }),
        c.text("kind", {
          header: "Kind",
          width: 112,
          cell: (row) => (
            <Badge variant="secondary" tone={kindTone[row.kind]}>
              {row.kind}
            </Badge>
          ),
        }),
        c.text("importsFrom", { header: "Imports from", width: 260 }),
        c.number("controls", { header: "Controls", width: 104 }),
        c.text("status", { header: "Status", width: 180 }),
        c.text("source", {
          header: "Source",
          width: 150,
          cell: (row) => (
            <Badge variant="secondary" tone={row.authoritative ? "success" : "neutral"}>
              {row.source}
            </Badge>
          ),
        }),
      ]),
    [],
  );

  const table = useDataTable({
    data,
    columns,
    getRowId: (row) => row.id,
    label: "Profiles",
    view: "profiles-register",
    resizable: true,
    reorderable: true,
  });

  return (
    <DataTable
      table={table}
      onRowClick={(row) => {
        void navigate({ to: "/profiles/$profileId", params: { profileId: row.id } });
      }}
      empty={{ title: "No profiles match", description: "Clear the search or the filters." }}
      toolbar={
        <Inline space="space.100" alignBlock="center" shouldWrap>
          <DataTable.Search table={table} placeholder="Find a profile" />
          <DataTable.Filter table={table} column="kind" />
          <Inline className="ml-auto" space="space.100" alignBlock="center">
            <DataTable.Columns table={table} />
            <DataTable.Settings table={table} />
          </Inline>
        </Inline>
      }
    />
  );
}
