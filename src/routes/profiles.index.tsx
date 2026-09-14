import { canAuthorLibrary } from "@/components/prototype/library-utils";
import { useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  Button,
  DataTable,
  defineColumns,
  Inline,
  PageHeader,
  Stack,
  useDataTable,
} from "@ledger/design-system";
import { Plus } from "lucide-react";
import { useRows } from "@/lib/models";
import { useWorkspace } from "@/components/app/workspace";
import { LibraryEditor, LibraryLoading } from "@/components/prototype/library-shared";

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
function ProfilesIndex() {
  const navigate = useNavigate();
  const workspace = useWorkspace();
  const profiles = useRows("profiles");
  const revisions = useRows("profile_revisions");
  const resolutions = useRows("profile_resolutions");
  const selections = useRows("selected_controls");
  const [creating, setCreating] = useState(false);
  const rows = useMemo(
    () =>
      (profiles.data ?? []).map((profile) => {
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
          version: revision?.version ?? "No revisions",
          status: revision?.state ?? "No revisions",
          selection: resolution
            ? String(
                selections.data?.filter((item) => item.profile_resolution_id === resolution.id)
                  .length ?? 0,
              )
            : "Not resolved",
          drafts: versions.some((item) => item.state === "draft") ? "Has draft" : "No draft",
        };
      }),
    [profiles.data, revisions.data, resolutions.data, selections.data],
  );
  const columns = useMemo(
    () =>
      defineColumns<(typeof rows)[number]>((c) => [
        c.text("title", { header: "Profile", hideable: false, minWidth: 220 }),
        c.id("code", { header: "Identifier", width: 230 }),
        c.text("kind", { header: "Source", width: 160 }),
        c.text("version", { header: "Latest revision", width: 125 }),
        c.status("status", { header: "State", width: 125, tone: () => "neutral" }),
        c.text("drafts", { header: "Drafts", width: 110 }),
        c.text("selection", { header: "Controls", width: 115 }),
      ]),
    [],
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
  return (
    <Stack className="animate-rise" space="space.200">
      <PageHeader>
        <div className="min-w-0">
          <PageHeader.Title>Profiles</PageHeader.Title>
          <p className="pt-050 font-body-small text-subtle">
            Versioned control selections, their exact source imports, and recorded tailoring.
          </p>
        </div>
      </PageHeader>
      {creating && (
        <LibraryEditor
          table="profiles"
          title="New profile"
          onClose={() => setCreating(false)}
          onSaved={(record) => {
            void navigate({ to: "/profiles/$profileId", params: { profileId: record.id } });
          }}
        />
      )}
      <LibraryLoading queries={[profiles, revisions, resolutions, selections]}>
        <DataTable
          table={table}
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
              <Button variant="primary" iconBefore={<Plus />} onClick={() => setCreating(true)}>
                New profile
              </Button>
            ) : undefined,
          }}
          toolbar={
            <Inline space="space.100" alignBlock="center" shouldWrap>
              <DataTable.Search table={table} placeholder="Find a profile" />
              <DataTable.Presets table={table} variant="menu" presets={presets} />
              <DataTable.Filter table={table} column="kind" />
              <DataTable.Filter table={table} column="status" />
              <DataTable.Filter table={table} column="drafts" />
              <Inline className="ml-auto" space="space.100" alignBlock="center">
                <DataTable.Columns table={table} />
                <DataTable.Settings table={table} />
                {canCreate && (
                  <Button
                    size="small"
                    variant="primary"
                    iconBefore={<Plus />}
                    disabled={creating}
                    onClick={() => setCreating(true)}
                  >
                    New profile
                  </Button>
                )}
              </Inline>
            </Inline>
          }
        />
      </LibraryLoading>
    </Stack>
  );
}
