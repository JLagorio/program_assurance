import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Box,
  Button,
  Grid,
  Inline,
  PageHeader,
  Section,
  Shell,
  Stack,
  TextLink,
} from "@ledger/design-system";
import { Plus } from "lucide-react";
import { useRow, useRows } from "@/lib/models";
import { useWorkspace } from "@/components/app/workspace";
import type { DataRecord } from "@/lib/records";
import {
  EntityEditor,
  EntitySection,
  InspectLink,
  ModelFacts,
  ModelTable,
  QueryState,
  RelationName,
  StateBadge,
} from "./record-tools";
export function Packages() {
  const query = useRows("authorization_packages"),
    versions = useRows("package_revisions");
  const workspace = useWorkspace(),
    navigate = useNavigate();
  const [creating, setCreating] = useState(false),
    [preview, setPreview] = useState<DataRecord | null>(null);
  const latest = (id: string) =>
    versions.data
      ?.filter((row) => row.package_id === id)
      .sort((a, b) => b.version_number - a.version_number)[0];
  return (
    <Stack space="space.200">
      <PageHeader>
        <PageHeader.Title>Authorization packages</PageHeader.Title>
      </PageHeader>
      {creating && (
        <EntityEditor
          table="authorization_packages"
          onCancel={() => setCreating(false)}
          onSaved={(row) => void navigate({ to: "/packages/$pkgId", params: { pkgId: row.id } })}
        />
      )}
      <QueryState query={query}>
        <QueryState query={versions}>
          <ModelTable
            fill
            rows={(query.data ?? []) as DataRecord[]}
            columns={[
              { key: "title", label: "Package" },
              {
                key: "program_id",
                render: (row) => <RelationName table="programs" id={row["program_id"] as string} />,
              },
              {
                key: "system_id",
                render: (row) => <RelationName table="systems" id={row["system_id"] as string} />,
              },
              {
                key: "owner_party_id",
                label: "Owner",
                render: (row) => (
                  <RelationName table="parties" id={row["owner_party_id"] as string | null} />
                ),
              },
              {
                key: "version_number",
                label: "Latest version",
                render: (row) => latest(row.id)?.version_number ?? "Not recorded",
              },
              {
                key: "state",
                label: "Version state",
                render: (row) => <StateBadge value={latest(row.id)?.state} />,
              },
            ]}
            onOpen={setPreview}
            searchLabel="Search packages"
            view="authorization-packages"
            empty={{
              illustration: "document",
              title: "No packages yet",
              description:
                "Create a package to assemble exact SSP, assessment, POA&M, and evidence versions for a decision.",
              action:
                workspace.role !== "viewer" ? (
                  <Button variant="primary" iconBefore={<Plus />} onClick={() => setCreating(true)}>
                    Create package
                  </Button>
                ) : undefined,
            }}
            actions={
              workspace.role !== "viewer" && (
                <Button
                  size="small"
                  variant="primary"
                  iconBefore={<Plus />}
                  onClick={() => setCreating(true)}
                >
                  Create package
                </Button>
              )
            }
          />
        </QueryState>
      </QueryState>
      {preview && (
        <Shell.Panel title={String(preview["title"])} onClose={() => setPreview(null)}>
          <Stack space="space.200">
            <TextLink render={<Link to="/packages/$pkgId" params={{ pkgId: preview.id }} />}>
              Open package
            </TextLink>
            <ModelFacts
              record={preview}
              fields={[
                {
                  key: "program_id",
                  render: (row) => (
                    <RelationName table="programs" id={row["program_id"] as string} />
                  ),
                },
                {
                  key: "system_id",
                  render: (row) => <RelationName table="systems" id={row["system_id"] as string} />,
                },
                {
                  key: "owner_party_id",
                  label: "Owner",
                  render: (row) => (
                    <RelationName table="parties" id={row["owner_party_id"] as string | null} />
                  ),
                },
              ]}
            />
            <InspectLink table="authorization_packages" id={preview.id} />
          </Stack>
        </Shell.Panel>
      )}
    </Stack>
  );
}
export function PackageRecord({ id }: { id: string }) {
  const workspace = useWorkspace();
  const query = useRow("authorization_packages", id);
  const [editing, setEditing] = useState<DataRecord | null>(null),
    [selected, setSelected] = useState<DataRecord | null>(null);
  const row = query.data;
  return (
    <Stack space="space.250">
      <TextLink render={<Link to="/packages" />}>Authorization packages</TextLink>
      <QueryState query={query}>
        {row ? (
          <>
            <PageHeader>
              <PageHeader.Title>{row.title}</PageHeader.Title>
              <PageHeader.Actions>
                {workspace.role !== "viewer" && (
                  <Button onClick={() => setEditing(row as DataRecord)}>Edit package</Button>
                )}
                <InspectLink table="authorization_packages" id={id} />
              </PageHeader.Actions>
            </PageHeader>
            {editing && (
              <EntityEditor
                table="authorization_packages"
                existing={editing}
                onCancel={() => setEditing(null)}
              />
            )}
            <ModelFacts
              record={row as DataRecord}
              fields={[
                {
                  key: "program_id",
                  render: (record) => (
                    <RelationName table="programs" id={record["program_id"] as string} />
                  ),
                },
                {
                  key: "system_id",
                  render: (record) => (
                    <RelationName table="systems" id={record["system_id"] as string} />
                  ),
                },
                {
                  key: "owner_party_id",
                  label: "Owner",
                  render: (record) => (
                    <RelationName table="parties" id={record["owner_party_id"] as string | null} />
                  ),
                },
              ]}
            />
            <EntitySection
              table="package_revisions"
              filters={{ package_id: id }}
              title="Package versions"
              columns={[
                { key: "version_number" },
                { key: "state" },
                { key: "description" },
                { key: "submitted_at" },
                { key: "published_at" },
              ]}
              onOpen={setSelected}
            />
            {selected && <PackageVersion key={selected.id} id={selected.id} />}
          </>
        ) : (
          <p>Package not found.</p>
        )}
      </QueryState>
    </Stack>
  );
}
function PackageVersion({ id }: { id: string }) {
  const workspace = useWorkspace();
  const query = useRow("package_revisions", id);
  const [editing, setEditing] = useState<DataRecord | null>(null);
  const version = query.data;
  return (
    <QueryState query={query}>
      {version && (
        <Stack space="space.250">
          <Section
            title={`Package version ${version.version_number}`}
            action={
              version.state === "draft" && workspace.role !== "viewer" ? (
                <Button onClick={() => setEditing(version as DataRecord)}>Edit version</Button>
              ) : (
                <StateBadge value={version.state} />
              )
            }
          >
            {editing && (
              <EntityEditor
                table="package_revisions"
                existing={editing}
                onCancel={() => setEditing(null)}
              />
            )}
            <ModelFacts
              record={version as DataRecord}
              fields={["state", "description", "submitted_at", "published_at"]}
            />
          </Section>
          <EntitySection
            table="package_documents"
            filters={{ package_revision_id: id }}
            title="Included documents"
            columns={[
              { key: "title" },
              {
                key: "ssp_revision_id",
                label: "SSP",
                render: (row) => (
                  <RelationName
                    table="ssp_revisions"
                    id={row["ssp_revision_id"] as string | null}
                  />
                ),
              },
              {
                key: "assessment_plan_revision_id",
                label: "Assessment plan",
                render: (row) => (
                  <RelationName
                    table="assessment_plan_revisions"
                    id={row["assessment_plan_revision_id"] as string | null}
                  />
                ),
              },
              {
                key: "assessment_results_revision_id",
                label: "Results",
                render: (row) => (
                  <RelationName
                    table="assessment_results_revisions"
                    id={row["assessment_results_revision_id"] as string | null}
                  />
                ),
              },
              {
                key: "poam_revision_id",
                label: "POA&M",
                render: (row) => (
                  <RelationName
                    table="poam_revisions"
                    id={row["poam_revision_id"] as string | null}
                  />
                ),
              },
              {
                key: "evidence_version_id",
                label: "Evidence",
                render: (row) => (
                  <RelationName
                    table="evidence_versions"
                    id={row["evidence_version_id"] as string | null}
                  />
                ),
              },
            ]}
            readOnly={version.state === "published"}
            description="Each document pins one published source version. Publish the package after assembling and reviewing its contents."
          />
          <EntitySection
            table="review_decisions"
            appendOnly
            filters={{ package_revision_id: id }}
            title="Package reviews"
            columns={[
              { key: "decision" },
              {
                key: "reviewer_party_id",
                label: "Reviewer",
                render: (row) => (
                  <RelationName table="parties" id={row["reviewer_party_id"] as string} />
                ),
              },
              { key: "rationale" },
              { key: "decided_at" },
            ]}
          />
          <EntitySection
            table="authorization_decisions"
            appendOnly
            readOnly={version.state !== "published"}
            description={
              version.state !== "published"
                ? "Publish this package version before recording an authorization decision."
                : "Recorded decisions are immutable. Record a new decision to supersede an earlier one."
            }
            filters={{ package_revision_id: id }}
            title="Authorization decisions"
            columns={[
              { key: "decision" },
              {
                key: "decision_maker_party_id",
                label: "Decision maker",
                render: (row) => (
                  <RelationName table="parties" id={row["decision_maker_party_id"] as string} />
                ),
              },
              { key: "rationale" },
              { key: "decided_at" },
              { key: "expires_on" },
            ]}
          />
        </Stack>
      )}
    </QueryState>
  );
}
export function Briefing() {
  const packages = useRows("authorization_packages"),
    versions = useRows("package_revisions");
  const publishedPackages = packages.data?.filter((row) =>
    versions.data?.some(
      (version) => version.package_id === row.id && version.state === "published",
    ),
  );
  const [selection, setSelection] = useState<DataRecord | null>(null);
  return (
    <Stack space="space.250">
      <PageHeader>
        <PageHeader.Title>ATO briefing room</PageHeader.Title>
        <PageHeader.Description>
          Review published package versions and record the actual authorization decision.
        </PageHeader.Description>
      </PageHeader>
      <Grid gap="space.400" templateColumns={{ base: "minmax(0,1fr)", xl: "minmax(0,1fr) 320px" }}>
        <Stack space="space.250">
          <EntitySection
            table="authorization_decisions"
            title="Authorization decisions"
            readOnly
            description="Open a published package version to record a new authorization decision."
            columns={[
              { key: "decision" },
              {
                key: "decision_maker_party_id",
                label: "Decision maker",
                render: (row) => (
                  <RelationName table="parties" id={row["decision_maker_party_id"] as string} />
                ),
              },
              { key: "decided_at" },
              { key: "effective_on" },
              { key: "expires_on" },
            ]}
            onOpen={setSelection}
          />
          {selection && (
            <Section title="Decision record">
              <ModelFacts
                record={selection}
                fields={[
                  "decision",
                  "rationale",
                  "conditions",
                  "decided_at",
                  "effective_on",
                  "expires_on",
                ]}
              />
              <InspectLink table="authorization_decisions" id={selection.id} />
            </Section>
          )}
        </Stack>
        <Section title="Packages for review">
          <QueryState query={packages}>
            <QueryState query={versions}>
              {publishedPackages?.length ? (
                <Stack space="space.200">
                  {publishedPackages.map((row) => (
                    <Box key={row.id} className="border-b border-default pb-150">
                      <TextLink render={<Link to="/packages/$pkgId" params={{ pkgId: row.id }} />}>
                        {row.title}
                      </TextLink>
                      <p className="text-subtle font-body-small">
                        {
                          versions.data?.filter(
                            (version) =>
                              version.package_id === row.id && version.state === "published",
                          ).length
                        }{" "}
                        published versions
                      </p>
                    </Box>
                  ))}
                </Stack>
              ) : (
                <p className="text-subtle">No published package versions have been recorded.</p>
              )}
            </QueryState>
          </QueryState>
        </Section>
      </Grid>
    </Stack>
  );
}
