import { RecordPreviewActions, RecordPreviewPanel } from "./record-preview";
import { MissingRecord, QueryState, RecordActions, VersionName } from "./work-common";
import { useState, type ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Absent,
  Button,
  DateTime,
  Grid,
  HeadingLevelProvider,
  Inspector,
  Item,
  LinkButton,
  PageHeader,
  Prose,
  Related,
  Shell,
  Stack,
  TextLink,
  useLedgerLocale,
} from "@ledger/design-system";
import { Plus } from "lucide-react";
import { useRow, useRows } from "@/lib/models";
import { useWorkspace } from "@/components/app/workspace";
import { type DataRecord } from "@/lib/records";
import { authorizationDecisions, revisionStates, statusLabel } from "@/lib/status";
import { RecordTrail, TrailLink } from "./record-trail";
import {
  EntityEditor,
  EntitySection,
  ModelFacts,
  ModelTable,
  RelationName,
  type DisplayColumn,
} from "./record-tools";

/** Authored text under its name, keeping its line breaks; a labelled Absent when there is none. */
function Described({ label, text }: { label: string; text: unknown }) {
  return (
    <Prose label={label}>
      {typeof text === "string" && text.trim() ? text : <Absent label="Not recorded" />}
    </Prose>
  );
}

const packageFacts: DisplayColumn[] = [
  {
    key: "program_id",
    label: "Program",
    render: (row) => <RelationName table="programs" id={row["program_id"] as string} />,
  },
  {
    key: "system_id",
    label: "System",
    render: (row) => <RelationName table="systems" id={row["system_id"] as string} />,
  },
  {
    key: "owner_party_id",
    label: "Owner",
    render: (row) => <RelationName table="parties" id={row["owner_party_id"] as string | null} />,
  },
];

export function Packages() {
  const query = useRows("authorization_packages"),
    versions = useRows("package_revisions");
  const workspace = useWorkspace(),
    navigate = useNavigate();
  const [creating, setCreating] = useState(false),
    [editing, setEditing] = useState<DataRecord | null>(null),
    [preview, setPreview] = useState<DataRecord | null>(null);
  const [previewRows, setPreviewRows] = useState<DataRecord[]>([]);
  const latest = (id: string) =>
    versions.data
      ?.filter((row) => row.package_id === id)
      .sort((a, b) => b.version_number - a.version_number)[0];
  const current =
    preview &&
    ((query.data as DataRecord[] | undefined)?.find((row) => row.id === preview.id) ?? preview);
  const derived: DisplayColumn[] = [
    {
      key: "latest_version",
      label: "Latest version",
      value: (row) => latest(row.id)?.version_number,
      kind: "number",
      width: 140,
    },
    {
      key: "latest_state",
      label: "Version state",
      value: (row) => latest(row.id)?.state,
      statuses: revisionStates,
    },
  ];
  const writable = workspace.role !== "viewer";
  const create = (size: "small" | "medium") =>
    writable ? (
      <Button
        size={size}
        variant="primary"
        iconBefore={<Plus />}
        onClick={() => {
          if (!creating) setCreating(true);
        }}
      >
        Create authorization package
      </Button>
    ) : undefined;
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
      {editing && (
        <EntityEditor
          table="authorization_packages"
          existing={editing}
          onCancel={() => setEditing(null)}
        />
      )}
      <ModelTable
        model="authorization_packages"
        fill
        rows={(query.data ?? []) as DataRecord[]}
        queries={[query, versions]}
        columns={[{ key: "title", label: "Package" }, ...packageFacts, ...derived]}
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
          action: create("medium"),
        }}
        actions={create("small")}
      />
      {current && (
        <RecordPreviewPanel
          title={String(current["title"])}
          label="Authorization package preview"
          defaultWidth={480}
          onClose={() => setPreview(null)}
          recordActions={
            writable && (
              <Button
                size="small"
                variant="primary"
                onClick={() => {
                  if (!editing) setEditing(current);
                }}
              >
                Edit authorization package
              </Button>
            )
          }
          navigation={
            <RecordPreviewActions
              table="authorization_packages"
              record={current}
              rows={previewRows}
              onSelect={setPreview}
            />
          }
        >
          <ModelFacts
            record={current}
            table="authorization_packages"
            fields={[...packageFacts, ...derived]}
          />
        </RecordPreviewPanel>
      )}
    </Stack>
  );
}
export function PackageRecord({ id }: { id: string }) {
  const query = useRow("authorization_packages", id);
  const [editing, setEditing] = useState<DataRecord | null>(null),
    [selected, setSelected] = useState<DataRecord | null>(null);
  const [displayedVersions, setDisplayedVersions] = useState<DataRecord[]>([]);
  const row = query.data;
  return (
    <Stack space="space.250">
      <QueryState query={query} shape="record">
        {row ? (
          <>
            <PageHeader>
              <RecordTrail current={row.title}>
                <TrailLink to="/packages">Authorization packages</TrailLink>
              </RecordTrail>
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
            <Shell.Aside label="Authorization package details">
              <Inspector.Group title="Details">
                <ModelFacts
                  record={row as DataRecord}
                  table="authorization_packages"
                  fields={packageFacts}
                />
              </Inspector.Group>
            </Shell.Aside>
            <EntitySection
              showHeading
              table="package_revisions"
              filters={{ package_id: id }}
              title="Package versions"
              columns={[
                { key: "version_number", label: "Version" },
                { key: "state", label: "State" },
                { key: "description", label: "Description" },
                { key: "submitted_at", label: "Submitted" },
                { key: "published_at", label: "Published" },
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
                    {/* The preview's record title is its h2; its collections sit under it. */}
                    <HeadingLevelProvider level={3}>{content}</HeadingLevelProvider>
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
        <Button
          size="small"
          variant="primary"
          onClick={() => {
            if (!editing) setEditing(version as DataRecord);
          }}
        >
          Edit authorization package version
        </Button>
      ) : null,
    content: (
      <QueryState query={query}>
        {version && (
          <Stack space="space.250">
            {editing && (
              <EntityEditor
                table="package_revisions"
                existing={editing}
                onCancel={() => setEditing(null)}
              />
            )}
            <Described label="Description" text={version.description} />
            <ModelFacts
              record={version as DataRecord}
              table="package_revisions"
              fields={[
                { key: "state", label: "State" },
                { key: "submitted_at", label: "Submitted" },
                { key: "published_at", label: "Published" },
              ]}
            />
            <EntitySection
              showHeading
              table="package_documents"
              filters={{ package_revision_id: id }}
              title="Included documents"
              columns={[
                { key: "title", label: "Document" },
                {
                  key: "ssp_revision_id",
                  label: "SSP",
                  render: (row) => (
                    <VersionName
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
                    <VersionName
                      table="poam_revisions"
                      id={row["poam_revision_id"] as string | null}
                    />
                  ),
                },
                {
                  key: "evidence_version_id",
                  label: "Evidence",
                  render: (row) => (
                    <VersionName
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
                { key: "decision", label: "Decision" },
                {
                  key: "reviewer_party_id",
                  label: "Reviewer",
                  render: (row) => (
                    <RelationName table="parties" id={row["reviewer_party_id"] as string} />
                  ),
                },
                { key: "rationale", label: "Rationale" },
                { key: "decided_at", label: "Decided" },
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
                { key: "decision", label: "Decision", width: 220 },
                {
                  key: "decision_maker_party_id",
                  label: "Decision maker",
                  render: (row) => (
                    <RelationName table="parties" id={row["decision_maker_party_id"] as string} />
                  ),
                },
                { key: "rationale", label: "Rationale" },
                { key: "decided_at", label: "Decided" },
                { key: "expires_on", label: "Expires" },
              ]}
            />
          </Stack>
        )}
      </QueryState>
    ),
  });
}

/** The authorization dashboard: decisions on published package versions, and the packages ready
 * for a decision (the inventory's dashboard exception). */
export function Briefing() {
  const packages = useRows("authorization_packages"),
    versions = useRows("package_revisions"),
    decisions = useRows("authorization_decisions");
  const { formatPlural } = useLedgerLocale();
  const published = (id: string) =>
    (versions.data ?? []).filter(
      (version) => version.package_id === id && version.state === "published",
    );
  const publishedPackages = (packages.data ?? []).filter((row) => published(row.id).length > 0);
  /** Which package version a decision was made on, in words. */
  const decidedOn = (revisionId: unknown) => {
    const version = versions.data?.find((item) => item.id === revisionId);
    const title = packages.data?.find((item) => item.id === version?.package_id)?.title;
    return version && title ? `${title} · version ${version.version_number}` : undefined;
  };
  const [displayedDecisions, setDisplayedDecisions] = useState<DataRecord[]>([]);
  const [selection, setSelection] = useState<DataRecord | null>(null);
  const current =
    selection &&
    ((decisions.data as DataRecord[] | undefined)?.find((row) => row.id === selection.id) ??
      selection);
  const decisionLabel = (row: DataRecord) => statusLabel(authorizationDecisions, row["decision"]);
  const columns: DisplayColumn[] = [
    {
      key: "package",
      label: "Package version",
      value: (row) => decidedOn(row["package_revision_id"]) ?? "Package version",
    },
    { key: "decision", label: "Decision", width: 220 },
    {
      key: "decision_maker_party_id",
      label: "Decision maker",
      render: (row) => (
        <RelationName table="parties" id={row["decision_maker_party_id"] as string} />
      ),
    },
    { key: "decided_at", label: "Decided" },
    { key: "effective_on", label: "Effective" },
    { key: "expires_on", label: "Expires" },
  ];
  return (
    <Stack space="space.250">
      <PageHeader>
        <PageHeader.Heading>
          <PageHeader.Title>Authorization decisions</PageHeader.Title>
        </PageHeader.Heading>
      </PageHeader>
      <Grid gap="space.400" templateColumns={{ base: "minmax(0,1fr)", xl: "minmax(0,1fr) 320px" }}>
        <Stack space="space.250">
          <ModelTable
            model="authorization_decisions"
            rows={(decisions.data ?? []) as DataRecord[]}
            queries={[decisions, versions, packages]}
            view="authorization-decisions"
            searchLabel="Search authorization decisions"
            columns={columns}
            onPreview={setSelection}
            selectedId={selection?.id}
            onDisplayedRowsChange={setDisplayedDecisions}
            empty={{
              illustration: "document",
              title: "No authorization decisions yet",
              description: "A decision is recorded on a published authorization package version.",
              action: (
                <LinkButton render={<Link to="/packages" />}>
                  Open authorization packages
                </LinkButton>
              ),
            }}
          />
          {current && (
            <RecordPreviewPanel
              title={
                <>
                  {decisionLabel(current)}
                  {typeof current["decided_at"] === "string" && (
                    <>
                      {" · "}
                      <DateTime
                        value={current["decided_at"]}
                        format="date"
                        focusable={false}
                        isTooltipDisabled
                      />
                    </>
                  )}
                </>
              }
              label="Authorization decision preview"
              defaultWidth={480}
              onClose={() => setSelection(null)}
              navigation={
                <RecordPreviewActions
                  table="authorization_decisions"
                  record={current}
                  rows={displayedDecisions}
                  onSelect={setSelection}
                />
              }
            >
              <Stack space="space.250">
                <ModelFacts
                  record={current}
                  table="authorization_decisions"
                  fields={[
                    { key: "decision", label: "Decision" },
                    {
                      key: "package",
                      label: "Package version",
                      value: (row) => decidedOn(row["package_revision_id"]),
                    },
                    {
                      key: "decision_maker_party_id",
                      label: "Decision maker",
                      render: (row) => (
                        <RelationName
                          table="parties"
                          id={row["decision_maker_party_id"] as string}
                        />
                      ),
                    },
                    { key: "decided_at", label: "Decided" },
                    { key: "effective_on", label: "Effective" },
                    { key: "expires_on", label: "Expires" },
                  ]}
                />
                <Described label="Rationale" text={current["rationale"]} />
                <Described label="Conditions" text={current["conditions"]} />
              </Stack>
            </RecordPreviewPanel>
          )}
        </Stack>
        <QueryState queries={[packages, versions]}>
          <HeadingLevelProvider level={2}>
            <Related
              title="Packages for review"
              size="default"
              {...(publishedPackages.length ? { count: publishedPackages.length } : {})}
              empty={{
                title: "No published package versions",
                description: "A package appears here once one of its versions is published.",
                action: (
                  <TextLink size="small" render={<Link to="/packages" />}>
                    Open authorization packages
                  </TextLink>
                ),
              }}
            >
              {publishedPackages.map((row) => (
                <Item
                  key={row.id}
                  title={row.title}
                  link={<Link to="/packages/$pkgId" params={{ pkgId: row.id }} />}
                  trailing={formatPlural(published(row.id).length, {
                    one: "{count} published version",
                    other: "{count} published versions",
                  })}
                />
              ))}
            </Related>
          </HeadingLevelProvider>
        </QueryState>
      </Grid>
    </Stack>
  );
}
