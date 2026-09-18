import { RecordPreviewActions, RecordPreviewPanel } from "./record-preview";
import { EmptyMessage, MissingRecord, RecordActions } from "./work-common";
import { useState, type ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Absent,
  Box,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Inspector,
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
import { labelFor, type DataRecord } from "@/lib/records";
import {
  EntityEditor,
  EntitySection,
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
  const [previewRows, setPreviewRows] = useState<DataRecord[]>([]);
  const latest = (id: string) =>
    versions.data
      ?.filter((row) => row.package_id === id)
      .sort((a, b) => b.version_number - a.version_number)[0];
  return (
    <Stack space="space.200">
      <PageHeader>
        <PageHeader.Heading>
          <PageHeader.Title>Authorization packages</PageHeader.Title>
        </PageHeader.Heading>
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
            model="authorization_packages"
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
                render: (row) => latest(row.id)?.version_number ?? <Absent />,
              },
              {
                key: "state",
                label: "Version state",
                render: (row) => <StateBadge value={latest(row.id)?.state} />,
              },
            ]}
            onPreview={setPreview}
            selectedId={preview?.id}
            onDisplayedRowsChange={setPreviewRows}
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
                    Create authorization package
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
                  Create authorization package
                </Button>
              )
            }
          />
        </QueryState>
      </QueryState>
      {preview && (
        <RecordPreviewPanel
          title={String(preview["title"])}
          label="Authorization package preview"
          defaultWidth={480}
          onClose={() => setPreview(null)}
          navigation={
            <RecordPreviewActions
              table="authorization_packages"
              record={preview}
              rows={previewRows}
              onSelect={setPreview}
            />
          }
        >
          <Stack space="space.200">
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
          </Stack>
        </RecordPreviewPanel>
      )}
    </Stack>
  );
}
export function PackageRecord({ id }: { id: string }) {
  const workspace = useWorkspace();
  const query = useRow("authorization_packages", id);
  const [editing, setEditing] = useState<DataRecord | null>(null),
    [selected, setSelected] = useState<DataRecord | null>(null);
  const [displayedVersions, setDisplayedVersions] = useState<DataRecord[]>([]);
  const row = query.data;
  return (
    <Stack space="space.250">
      <QueryState query={query}>
        {row ? (
          <>
            <PageHeader>
              <PageHeader.Lead render={<Breadcrumb />}>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink render={<Link to="/packages" />}>
                      Authorization packages
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>{row.title}</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </PageHeader.Lead>
              <PageHeader.Heading>
                <PageHeader.Title>{row.title}</PageHeader.Title>
              </PageHeader.Heading>
              <PageHeader.Actions>
                <RecordActions
                  table="authorization_packages"
                  id={id}
                  onEdit={() => setEditing(row as DataRecord)}
                  editLabel="Edit authorization package"
                />
              </PageHeader.Actions>
            </PageHeader>
            {editing && (
              <EntityEditor
                table="authorization_packages"
                existing={editing}
                onCancel={() => setEditing(null)}
              />
            )}
            <Shell.Aside label="Record details">
              <Inspector.Group title="Details">
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
                        <RelationName
                          table="parties"
                          id={record["owner_party_id"] as string | null}
                        />
                      ),
                    },
                  ]}
                />
              </Inspector.Group>
            </Shell.Aside>
            <EntitySection
              showHeading
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
              selectedId={selected?.id}
              onDisplayedRowsChange={setDisplayedVersions}
            />
            {selected && (
              <PackageVersion
                key={selected.id}
                id={selected.id}
                renderFrame={({ content, actions }) => (
                  <RecordPreviewPanel
                    title={`Version ${String(selected["version_number"])}`}
                    label="Package version preview"
                    defaultWidth={640}
                    onClose={() => setSelected(null)}
                    recordActions={actions}
                    navigation={
                      <RecordPreviewActions
                        table="package_revisions"
                        record={selected}
                        rows={displayedVersions}
                        onSelect={setSelected}
                      />
                    }
                  >
                    {content}
                  </RecordPreviewPanel>
                )}
              />
            )}
          </>
        ) : (
          <MissingRecord backTo="/packages" kind="Authorization package" />
        )}
      </QueryState>
    </Stack>
  );
}
function PackageVersion({
  id,
  renderFrame,
}: {
  id: string;
  renderFrame: (frame: { content: ReactNode; actions: ReactNode }) => ReactNode;
}) {
  const workspace = useWorkspace();
  const query = useRow("package_revisions", id);
  const [editing, setEditing] = useState<DataRecord | null>(null);
  const version = query.data;
  return renderFrame({
    actions:
      version?.state === "draft" && workspace.role !== "viewer" ? (
        <Button size="small" variant="primary" onClick={() => setEditing(version as DataRecord)}>
          Edit authorization package version
        </Button>
      ) : null,
    content: (
      <QueryState query={query}>
        {version && (
          <Stack space="space.250">
            <Section title="Details">
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
              showHeading
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
              showHeading
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
              showHeading
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
    ),
  });
}
export function Briefing() {
  const packages = useRows("authorization_packages"),
    versions = useRows("package_revisions");
  const publishedPackages = packages.data?.filter((row) =>
    versions.data?.some(
      (version) => version.package_id === row.id && version.state === "published",
    ),
  );
  const [displayedDecisions, setDisplayedDecisions] = useState<DataRecord[]>([]);
  const [selection, setSelection] = useState<DataRecord | null>(null);
  return (
    <Stack space="space.250">
      <PageHeader>
        <PageHeader.Heading>
          <PageHeader.Title>Authorization decisions</PageHeader.Title>
        </PageHeader.Heading>
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
            selectedId={selection?.id}
            onDisplayedRowsChange={setDisplayedDecisions}
          />
          {selection && (
            <RecordPreviewPanel
              title={`${labelFor(String(selection["decision"]))} · ${String(selection["decided_at"] ?? "Decision")}`}
              label="Authorization decision preview"
              defaultWidth={480}
              onClose={() => setSelection(null)}
              navigation={
                <RecordPreviewActions
                  table="authorization_decisions"
                  record={selection}
                  rows={displayedDecisions}
                  onSelect={setSelection}
                />
              }
            >
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
            </RecordPreviewPanel>
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
                <EmptyMessage title="No published package versions have been recorded" />
              )}
            </QueryState>
          </QueryState>
        </Section>
      </Grid>
    </Stack>
  );
}
