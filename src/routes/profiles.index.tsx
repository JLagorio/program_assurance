import { StatusBadge } from "@/components/app/status";
import { useWorkspace } from "@/components/app/workspace";
import { canAuthorLibrary } from "@/components/prototype/library-utils";
import { ProductCollection } from "@/components/prototype/product-collection";
import { ProductRecordDialog } from "@/components/prototype/product-record-dialog";
import { RecordLink, useDisplayedRecords } from "@/components/prototype/record-preview";
import { RecordSummaryPreview } from "@/components/prototype/record-summary-preview";
import { useRows, type Row } from "@/lib/models";
import { revisionStates } from "@/lib/status";
import {
  Absent,
  Button,
  DataTable,
  defineColumns,
  PageHeader,
  Stack,
  useDataTable,
  useLedgerLocale,
} from "@ledger/design-system";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useMemo, useState } from "react";

export const Route = createFileRoute("/profiles/")({
  head: () => ({ meta: [{ title: "Profiles — Program Assurance" }] }),
  component: ProfilesIndex,
});
const presets = [
  { id: "all", label: "All profiles" },
  {
    id: "drafts",
    label: "With a draft revision",
    filters: [{ id: "drafts", value: ["Has draft"] }],
  },
  {
    id: "workspace",
    label: "Workspace profiles",
    filters: [{ id: "kind", value: ["Workspace profile"] }],
  },
];
type ProfileRow = Row<"profiles"> & {
  kind: string;
  version: string | null;
  status: string | null;
  selection: number | null;
  drafts: string;
};
function ProfilesIndex() {
  const navigate = useNavigate();
  const workspace = useWorkspace();
  const locale = useLedgerLocale();
  const profiles = useRows("profiles");
  // Only what the register shows: the selections are counted, never read, so they come as ids.
  const revisions = useRows("profile_revisions", undefined, {
    columns: ["id", "profile_id", "created_at", "version", "state"],
  });
  const resolutions = useRows("profile_resolutions", undefined, {
    columns: ["id", "profile_revision_id", "resolved_at"],
  });
  const selections = useRows("selected_controls", undefined, {
    columns: ["id", "profile_resolution_id"],
  });
  const [creating, setCreating] = useState(false);
  const [selected, setSelected] = useState<ProfileRow | null>(null);
  const rows = useMemo(
    () =>
      (profiles.data ?? []).map((profile): ProfileRow => {
        const versions = (revisions.data ?? [])
          .filter((revision) => revision.profile_id === profile.id)
          .sort((a, b) => b.created_at.localeCompare(a.created_at));
        const revision = versions[0];
        const resolution = (resolutions.data ?? [])
          .filter((candidate) => candidate.profile_revision_id === revision?.id)
          .sort((a, b) => b.resolved_at.localeCompare(a.resolved_at))[0];
        return {
          ...profile,
          kind: profile.tenant_id ? "Workspace profile" : "Shared reference",
          version: revision?.version ?? null,
          status: revision?.state ?? null,
          // A count, so the column sorts as a number; nothing when no resolution is recorded.
          selection: resolution
            ? (selections.data?.filter((item) => item.profile_resolution_id === resolution.id)
                .length ?? 0)
            : null,
          drafts: versions.some((item) => item.state === "draft") ? "Has draft" : "No draft",
        };
      }),
    [profiles.data, revisions.data, resolutions.data, selections.data],
  );
  const columns = useMemo(
    () =>
      defineColumns<(typeof rows)[number]>((c) => [
        c.text("title", {
          header: "Profile",
          hideable: false,
          priority: 0,
          width: 220,
          minWidth: 220,
          cell: (row) => (
            <RecordLink table="profiles" record={row}>
              {row.title}
            </RecordLink>
          ),
        }),
        c.id("code", {
          header: "Identifier",
          width: 150,
          preview: setSelected,
          active: (row) => row.id === selected?.id,
        }),
        c.text("kind", { header: "Source", width: 160 }),
        c.text("version", { header: "Latest revision", width: 150 }),
        c.status("status", { header: "State", width: 125, statuses: revisionStates }),
        c.text("drafts", { header: "Drafts", width: 110 }),
        c.number("selection", { header: "Controls", width: 115 }),
      ]),
    [selected?.id],
  );
  const table = useDataTable({
    data: rows,
    columns,
    getRowId: (row) => row.id,
    label: "Profiles",
    view: "live-profiles",
    resizable: true,
    reorderable: true,
  });
  const canCreate = canAuthorLibrary(workspace.role);
  const displayed = useDisplayedRecords(table);
  return (
    <Stack className="animate-rise" space="space.200">
      <PageHeader>
        <PageHeader.Heading>
          <PageHeader.Title>Profiles</PageHeader.Title>
        </PageHeader.Heading>
      </PageHeader>
      {creating && (
        <ProductRecordDialog
          table="profiles"
          onClose={() => setCreating(false)}
          onSaved={(record) => {
            void navigate({ to: "/profiles/$profileId", params: { profileId: record.id } });
          }}
        />
      )}
      <ProductCollection
        table={table}
        queries={[profiles, revisions, resolutions, selections]}
        fill
        onRowClick={(row) => {
          void navigate({ to: "/profiles/$profileId", params: { profileId: row.id } });
        }}
        empty={{
          illustration: "shield",
          title: "No profiles yet",
          description:
            "A profile is a versioned control selection with its source imports and tailoring. Author the first, or import a shared reference.",
          action: canCreate ? (
            <Button
              size="small"
              variant="primary"
              iconBefore={<Plus />}
              onClick={() => setCreating(true)}
            >
              Create profile
            </Button>
          ) : undefined,
        }}
        searchLabel="Find profiles"
        views={
          <>
            <DataTable.Presets table={table} variant="menu" presets={presets} />
          </>
        }
        filters={
          <>
            <DataTable.Filter table={table} column="kind" />
            <DataTable.Filter table={table} column="status" />
            <DataTable.Filter table={table} column="drafts" />
          </>
        }
        action={
          <>
            {canCreate && (
              <Button
                size="small"
                variant="primary"
                iconBefore={<Plus />}
                onClick={() => setCreating(true)}
              >
                Create profile
              </Button>
            )}
          </>
        }
      />
      {selected && (
        <RecordSummaryPreview
          model="profiles"
          fields={[
            { key: "code", label: "Code" },
            { key: "kind", label: "Source" },
            {
              key: "version",
              label: "Latest revision",
              render: (row) => row.version ?? <Absent label="No revisions" />,
            },
            {
              key: "status",
              label: "State",
              render: (row) => (
                <StatusBadge
                  statuses={revisionStates}
                  value={row.status}
                  absentLabel="No revisions"
                />
              ),
            },
            {
              key: "selection",
              label: "Controls",
              render: (row) =>
                row.selection === null ? (
                  <Absent label="Not resolved" />
                ) : (
                  locale.formatNumber(row.selection)
                ),
            },
          ]}
          record={selected}
          rows={displayed}
          onSelect={setSelected}
          onClose={() => setSelected(null)}
        />
      )}
    </Stack>
  );
}
