import { ProfileChain } from "@/components/app/profile-tailoring/chain";
import { ProfileTailoringEditor } from "@/components/app/profile-tailoring/editor";
import { useReferenceData } from "@/components/app/profile-tailoring/use-reference-data";
import { useRecordTitle } from "@/components/app/browser-title";
import { Page, RecordPending } from "@/components/app/shell";
import { StatusBadge } from "@/components/app/status";
import { useWorkspace } from "@/components/app/workspace";
import { ControlInspector, LibraryControlTable } from "@/components/prototype/library-controls";
import { QueryValue } from "@/components/prototype/library-shared";
import { canAuthorLibrary } from "@/components/prototype/library-utils";
import { ProductRecordDialog } from "@/components/prototype/product-record-dialog";
import { RecordTrail, TrailLink } from "@/components/prototype/record-trail";
import { EmptyMessage, MissingRecord, QueryState } from "@/components/prototype/work-common";
import { useRow, useRows, type Row } from "@/lib/models";
import { inspectBase, overlayDecisions, profileDisplayTitle } from "@/lib/program-wizard-reference";
import { labelFor } from "@/lib/records";
import { revisionStates, statusLabel } from "@/lib/status";
import {
  Absent,
  Button,
  CodeBlock,
  Count,
  DateTime,
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
  Id,
  Inspector,
  Item,
  KeyValue,
  PageHeader,
  Section,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Shell,
  Stack,
  Stat,
  Table,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Text,
  TextLink,
  useLedgerLocale,
} from "@ledger/design-system";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useMemo, useState } from "react";

const profileTabs = ["Overview", "Derivation", "Controls", "Tailoring"] as const;
type ProfileTab = (typeof profileTabs)[number];
function profileTab(value: unknown): ProfileTab | undefined {
  return profileTabs.find((tab) => tab === value);
}

export const Route = createFileRoute("/profiles/$profileId")({
  head: () => ({ meta: [{ title: "Profile — Program Assurance" }] }),
  pendingComponent: RecordPending,
  // The tab and the revision are part of the address, so a reload, Back or a shared link keeps them.
  validateSearch: (
    search: Record<string, unknown>,
  ): { tab?: ProfileTab | undefined; revision?: string | undefined } => ({
    tab: profileTab(search["tab"]),
    revision:
      typeof search["revision"] === "string" && search["revision"] ? search["revision"] : undefined,
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { profileId } = Route.useParams();
  const { tab = "Overview", revision: chosen } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const profile = useRow("profiles", profileId);
  const revisions = useRows("profile_revisions", { profile_id: profileId });
  const workspace = useWorkspace();
  const [creating, setCreating] = useState(false);
  const versions = useMemo(
    () => [...(revisions.data ?? [])].sort((a, b) => b.created_at.localeCompare(a.created_at)),
    [revisions.data],
  );
  const current = versions.find((revision) => revision.id === chosen) ?? versions[0];
  const record = profile.data;
  useRecordTitle("Profile", record?.title);
  const editable = record?.tenant_id === workspace.tenantId && canAuthorLibrary(workspace.role);
  const go = (next: { tab?: ProfileTab; revision?: string }) =>
    void navigate({ search: (previous) => ({ ...previous, ...next }), replace: true });
  if (profile.isSuccess && !record) return <MissingRecord backTo="/profiles" kind="Profile" />;
  if (!record) return <QueryState queries={[profile]} />;
  const create = () => setCreating(true);
  return (
    <Page>
      <PageHeader>
        <RecordTrail current={record.title}>
          <TrailLink to="/profiles">Profiles</TrailLink>
        </RecordTrail>
        <PageHeader.Heading>
          <PageHeader.Title>{record.title}</PageHeader.Title>
        </PageHeader.Heading>
        {editable && (
          <PageHeader.Actions>
            <Button variant="primary" onClick={create}>
              Create profile revision
            </Button>
          </PageHeader.Actions>
        )}
      </PageHeader>
      {creating && (
        <ProductRecordDialog
          table="profile_revisions"
          initialValues={{ profile_id: profileId }}
          onClose={() => setCreating(false)}
          onSaved={(saved) => go({ revision: saved.id })}
        />
      )}
      <QueryState queries={[revisions]} retryLabel="Retry loading revisions">
        {current ? (
          <ProfileRevision
            key={current.id}
            profile={record}
            revision={current}
            editable={editable}
            versions={versions}
            tab={tab}
            onTab={(next) => go({ tab: next })}
            onVersion={(id) => go({ revision: id })}
          />
        ) : (
          <EmptyMessage
            illustration="shield"
            title="No profile revisions yet"
            description="A revision records the profile's source imports, its selection rules and the controls they resolve to."
            action={
              editable ? (
                <Button variant="primary" iconBefore={<Plus />} onClick={create}>
                  Create profile revision
                </Button>
              ) : undefined
            }
          />
        )}
      </QueryState>
    </Page>
  );
}

function ProfileRevision({
  profile,
  revision,
  editable,
  versions,
  tab,
  onTab,
  onVersion,
}: {
  profile: Row<"profiles">;
  revision: Row<"profile_revisions">;
  editable: boolean;
  versions: Row<"profile_revisions">[];
  tab: ProfileTab;
  onTab: (tab: ProfileTab) => void;
  onVersion: (id: string) => void;
}) {
  const locale = useLedgerLocale();
  const [resolutionId, setResolutionId] = useState("");
  const [displayedControls, setDisplayedControls] = useState<Row<"controls">[]>([]);
  const [control, setControl] = useState<Row<"controls"> | null>(null);
  const [editing, setEditing] = useState<"profile_imports" | "profile_rules" | null>(null);
  const imports = useRows("profile_imports", { profile_revision_id: revision.id });
  const rules = useRows("profile_rules", { profile_revision_id: revision.id });
  const resolutions = useRows("profile_resolutions", { profile_revision_id: revision.id });
  const allRevisions = useRows("profile_revisions");
  const controls = useRows("controls");
  const catalogRevisions = useRows("catalog_revisions");
  const catalogs = useRows("catalogs");
  const profiles = useRows("profiles");
  const reference = useReferenceData();
  // The source document's name only: its stored OSCAL content is never fetched for a page.
  const sourceDocument = useRows(
    "oscal_document_revisions",
    { id: revision.document_revision_id },
    { columns: ["id", "title", "document_version"] },
  );
  const available = [...(resolutions.data ?? [])].sort((a, b) =>
    b.resolved_at.localeCompare(a.resolved_at),
  );
  const resolution = available.find((candidate) => candidate.id === resolutionId) ?? available[0];
  const selections = useRows(
    "selected_controls",
    resolution ? { profile_resolution_id: resolution.id } : {},
    { enabled: !!resolution },
  );
  const selectedIds = new Set(selections.data?.map((selection) => selection.control_id));
  const selectedControls = (controls.data ?? []).filter((candidate) =>
    selectedIds.has(candidate.id),
  );
  const selectionsReady = !!selections.data;
  const inspection = useMemo(
    () => (resolution && reference.ready ? inspectBase(resolution.id, reference.data) : null),
    [resolution, reference.ready, reference.data],
  );
  const decisions = useMemo(
    () => (resolution && reference.ready ? overlayDecisions(resolution.id, reference.data) : null),
    [resolution, reference.ready, reference.data],
  );
  const orderedImports = useMemo(
    () => [...(imports.data ?? [])].sort((a, b) => a.ordinal - b.ordinal),
    [imports.data],
  );
  const catalogOf = (item: Row<"profile_imports">) =>
    catalogRevisions.data?.find((catalog) => catalog.id === item.catalog_revision_id);
  const catalogTitle = (catalog: Row<"catalog_revisions">) =>
    catalogs.data?.find((row) => row.id === catalog.catalog_id)?.title ?? catalog.title;
  /**
   * The catalog under its stable name: the resolved chain's when a published resolution walks to
   * it, otherwise the catalog this revision imports directly (a draft resolves nothing yet).
   */
  const catalog = useMemo(() => {
    const resolved = inspection?.catalog;
    const imported = orderedImports
      .map((item) => catalogRevisions.data?.find((row) => row.id === item.catalog_revision_id))
      .find(Boolean);
    const edition = resolved ?? imported;
    if (!edition) return null;
    return {
      id: edition.id,
      title:
        (catalogs.data ?? reference.data.catalogs).find((row) => row.id === edition.catalog_id)
          ?.title ?? edition.title,
      version: edition.version,
    };
  }, [inspection, orderedImports, catalogRevisions.data, catalogs.data, reference.data.catalogs]);
  const importedRevision = (item: Row<"profile_imports">) =>
    allRevisions.data?.find((row) => row.id === item.imported_profile_revision_id);
  const importSelection = (item: Row<"profile_imports">) => {
    if (item.include_all) return "Include all";
    const own = (rules.data ?? []).filter((rule) => rule.profile_import_id === item.id);
    const count = (kind: string) =>
      own
        .filter((rule) => rule.kind === kind)
        .reduce((sum, rule) => {
          const ids = (rule.definition as { "with-ids"?: unknown } | null)?.["with-ids"];
          return sum + (Array.isArray(ids) ? ids.length : 0);
        }, 0);
    const included = count("include");
    const excluded = count("exclude");
    return (
      [
        included ? `${locale.formatNumber(included)} included` : null,
        excluded ? `${locale.formatNumber(excluded)} excluded` : null,
      ]
        .filter(Boolean)
        .join(" · ") || "No selection rules"
    );
  };
  const draft = editable && revision.state === "draft";
  const resolvedOn = (value: string) =>
    locale.formatDate(new Date(value), { dateStyle: "medium", timeStyle: "short" });
  // A resolved chain says what the profile is; before one resolves, its imports do: a base
  // profile among them makes it tailored.
  const tailored = inspection?.chain.length
    ? inspection.kind === "overlay"
    : orderedImports.some((item) => !!item.imported_profile_revision_id);
  const baseTitle =
    inspection?.kind === "overlay"
      ? profileDisplayTitle(inspection.base?.profile, reference.data)
      : null;
  const kindLabel = tailored
    ? baseTitle
      ? `Tailored from ${baseTitle}`
      : "Tailored"
    : "Reference";
  const referenceFailed = reference.queries.filter(
    (query) => query.isError && query.data === undefined,
  );
  // One outage is one alert: when the revision's own records fail too, one Retry covers both.
  const overviewQueries = [imports, rules, resolutions];
  const overviewFailed = overviewQueries.some((query) => query.isError && query.data === undefined);
  const createImport = draft ? (
    <Button variant="secondary" onClick={() => setEditing("profile_imports")}>
      Create profile import
    </Button>
  ) : undefined;
  return (
    <>
      <Tabs
        value={tab}
        onValueChange={(value) => {
          onTab(profileTab(value) ?? "Overview");
          setControl(null);
        }}
        className="gap-150"
      >
        <TabsList variant="line" aria-label="Profile sections">
          {profileTabs.map((name) => (
            <TabsTrigger key={name} value={name}>
              {name}
              {name === "Controls" && resolution && selectionsReady && (
                <Count value={selections.data?.length ?? 0} max={9999} />
              )}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value={tab}>
          <Stack space="space.300" className="min-w-0 pt-200">
            {editing && (
              <ProductRecordDialog
                table={editing}
                initialValues={{ profile_revision_id: revision.id }}
                onClose={() => setEditing(null)}
              />
            )}
            {tab === "Overview" && (
              <>
                {referenceFailed.length > 0 && !overviewFailed && (
                  <QueryState queries={referenceFailed} retryLabel="Retry loading the derivation" />
                )}
                <QueryState
                  queries={[...overviewQueries, ...(overviewFailed ? referenceFailed : [])]}
                >
                  <Stat.Grid cols={3} role="group" aria-label="Revision summary">
                    <Stat.Tile
                      label="Controls"
                      value={
                        resolution ? (
                          <QueryValue queries={[selections]}>
                            {() => locale.formatNumber(selections.data?.length ?? 0)}
                          </QueryValue>
                        ) : (
                          <Absent label="Not resolved" />
                        )
                      }
                      note={
                        resolution
                          ? `Resolved ${resolvedOn(resolution.resolved_at)}`
                          : "No resolution recorded"
                      }
                    />
                    <Stat.Tile
                      label="Source imports"
                      value={locale.formatNumber(orderedImports.length)}
                      {...(catalog ? { note: catalog.title } : {})}
                    />
                    <Stat.Tile
                      label="OSCAL rules"
                      value={locale.formatNumber(rules.data?.length ?? 0)}
                    />
                  </Stat.Grid>
                  <Section title="Derived from">
                    <KeyValue.Group>
                      {/* The whole chain, this profile included: ProfileChain names each hop by its
                          place in it, so a layer between this profile and its base keeps its name. */}
                      {inspection && inspection.chain.length > 1 ? (
                        <ProfileChain chain={inspection.chain} catalog={catalog} />
                      ) : (
                        <KeyValue label="Catalog" wrap>
                          {catalog ? (
                            <TextLink
                              render={<Link to="/catalog" search={{ edition: catalog.id }} />}
                            >
                              {catalog.title} · {catalog.version}
                            </TextLink>
                          ) : (
                            <Absent label="Not recorded" />
                          )}
                        </KeyValue>
                      )}
                    </KeyValue.Group>
                  </Section>
                </QueryState>
              </>
            )}
            {tab === "Derivation" && (
              <QueryState
                queries={[imports, rules, resolutions, allRevisions, catalogRevisions, catalogs]}
              >
                <Section
                  title="Source imports"
                  {...(orderedImports.length && createImport ? { action: createImport } : {})}
                >
                  {orderedImports.length ? (
                    <Table>
                      <thead>
                        <tr>
                          <Table.Header align="end" width={88}>
                            Order
                          </Table.Header>
                          <Table.Header>Source</Table.Header>
                          <Table.Header>Selection</Table.Header>
                          <Table.Header>Reference</Table.Header>
                        </tr>
                      </thead>
                      <tbody>
                        {orderedImports.map((item) => {
                          const edition = catalogOf(item);
                          const imported = importedRevision(item);
                          return (
                            <Table.Row key={item.id}>
                              <Table.Cell align="end">{item.ordinal}</Table.Cell>
                              <Table.Cell wrap>
                                {edition ? (
                                  <TextLink
                                    render={<Link to="/catalog" search={{ edition: edition.id }} />}
                                  >
                                    Catalog · {catalogTitle(edition)}
                                  </TextLink>
                                ) : imported ? (
                                  <TextLink
                                    render={
                                      <Link
                                        to="/profiles/$profileId"
                                        params={{ profileId: imported.profile_id }}
                                      />
                                    }
                                  >
                                    Base profile ·{" "}
                                    {profiles.data?.find((row) => row.id === imported.profile_id)
                                      ?.title ?? imported.title}{" "}
                                    · {imported.version}
                                  </TextLink>
                                ) : (
                                  <Absent label="Not recorded" />
                                )}
                              </Table.Cell>
                              <Table.Cell wrap>{importSelection(item)}</Table.Cell>
                              <Table.Cell wrap>
                                <Id className="break-all">{item.href}</Id>
                              </Table.Cell>
                            </Table.Row>
                          );
                        })}
                      </tbody>
                    </Table>
                  ) : (
                    <EmptyMessage
                      compact
                      illustration="document"
                      title="No source imports yet"
                      description="An import names the catalog or base profile this revision selects its controls from."
                      action={createImport}
                    />
                  )}
                </Section>
                <Section title="Recorded resolutions" count={available.length} isCollapsible>
                  {available.length ? (
                    <Stack space="space.300">
                      {available.map((item) => (
                        <Section
                          key={item.id}
                          title={`${item.resolver_name} · ${item.resolver_version}`}
                        >
                          <KeyValue.Group>
                            <KeyValue label="State">
                              <StatusBadge statuses={revisionStates} value={item.state} />
                            </KeyValue>
                            <KeyValue label="Resolved">
                              <DateTime value={item.resolved_at} />
                            </KeyValue>
                            <KeyValue label="Input hash" wrap>
                              <Id className="break-all">{item.input_sha256}</Id>
                            </KeyValue>
                            <KeyValue label="Output hash" wrap>
                              <Id className="break-all">{item.output_sha256}</Id>
                            </KeyValue>
                          </KeyValue.Group>
                        </Section>
                      ))}
                    </Stack>
                  ) : (
                    <EmptyMessage
                      compact
                      title="No resolution recorded"
                      description="A resolution records the controls this revision's imports and rules select. None is recorded for this revision yet."
                    />
                  )}
                </Section>
              </QueryState>
            )}
            {tab === "Controls" && (
              <QueryState queries={[resolutions, controls, ...(resolution ? [selections] : [])]}>
                {resolution ? (
                  <LibraryControlTable
                    filters={
                      <Select<string>
                        value={resolution.id}
                        items={available.map((item) => ({
                          value: item.id,
                          label: `${resolvedOn(item.resolved_at)} · ${statusLabel(revisionStates, item.state)}`,
                        }))}
                        onValueChange={(value) => {
                          if (value) setResolutionId(value);
                        }}
                      >
                        <SelectTrigger size="small" aria-label="Resolved selection">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {available.map((item) => (
                            <SelectItem key={item.id} value={item.id}>
                              {resolvedOn(item.resolved_at)} ·{" "}
                              {statusLabel(revisionStates, item.state)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    }
                    selectedId={control?.id}
                    onDisplayedRowsChange={setDisplayedControls}
                    controls={selectedControls}
                    onSelect={setControl}
                    label="Profile controls"
                  />
                ) : (
                  <EmptyMessage
                    illustration="shield"
                    title="No resolved selection"
                    description="This revision has no recorded resolution, so it selects no controls yet."
                  />
                )}
              </QueryState>
            )}
            {tab === "Tailoring" && (
              <QueryState queries={[rules, resolutions, ...reference.queries]}>
                {decisions ? (
                  <ProfileTailoringEditor
                    readOnly
                    catalogRevisionId={decisions.catalogRevisionId}
                    baseResolutionId={decisions.baseResolutionId}
                    decisions={decisions.tailoring}
                    parameters={decisions.parameters}
                    data={reference.data}
                  />
                ) : (
                  <Empty size="compact">
                    <EmptyHeader>
                      <EmptyTitle>
                        {inspection?.kind === "reference"
                          ? "A reference profile: nothing is tailored from another profile"
                          : "No tailoring to show"}
                      </EmptyTitle>
                      <EmptyDescription>
                        {inspection?.kind === "reference"
                          ? "This profile selects its controls straight from the catalog. Its selection rules are below."
                          : "What a tailored profile takes out of and adds to its base profile appears here once it has a published resolution."}
                      </EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                )}
                <Section
                  title="OSCAL rules"
                  count={rules.data?.length ?? 0}
                  isCollapsible
                  {...(draft
                    ? {
                        action: (
                          <Button variant="secondary" onClick={() => setEditing("profile_rules")}>
                            Create tailoring rule
                          </Button>
                        ),
                      }
                    : {})}
                >
                  <Item.Group aria-label="OSCAL rules" empty="No tailoring rules recorded.">
                    {[...(rules.data ?? [])]
                      .sort((a, b) => a.ordinal - b.ordinal)
                      .map((rule) => (
                        <Item
                          key={rule.id}
                          title={labelFor(rule.kind)}
                          meta={<Id>{rule.source_pointer}</Id>}
                          {...(rule.rationale ? { description: rule.rationale } : {})}
                          isCollapsible
                        >
                          <CodeBlock
                            label={`${labelFor(rule.kind)} rule definition`}
                            lines={JSON.stringify(rule.definition, null, 2).split("\n")}
                          />
                        </Item>
                      ))}
                  </Item.Group>
                </Section>
              </QueryState>
            )}
          </Stack>
        </TabsContent>
      </Tabs>
      {tab === "Overview" && (
        <Shell.Aside label="Profile details">
          <Inspector.Group title="Details">
            <KeyValue.Group labelWidth={120} layout="columns">
              <KeyValue label="Revision">
                {versions.length > 1 ? (
                  <Select<string>
                    value={revision.id}
                    items={versions.map((version) => ({
                      value: version.id,
                      label: `${version.version} · ${statusLabel(revisionStates, version.state)}`,
                    }))}
                    onValueChange={(value) => {
                      if (value) onVersion(value);
                    }}
                  >
                    <SelectTrigger size="small" aria-label="Profile revision">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {versions.map((version) => (
                        <SelectItem key={version.id} value={version.id}>
                          {version.version} · {statusLabel(revisionStates, version.state)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  revision.version
                )}
              </KeyValue>
              <KeyValue label="State">
                <StatusBadge statuses={revisionStates} value={revision.state} />
              </KeyValue>
              <KeyValue label="Kind" wrap>
                <QueryValue
                  queries={[resolutions, imports, ...(resolution ? reference.queries : [])]}
                >
                  {() => kindLabel}
                </QueryValue>
              </KeyValue>
              <KeyValue label="Code" wrap>
                <Id>{profile.code}</Id>
              </KeyValue>
              <KeyValue label="Source">
                {profile.tenant_id ? "Workspace profile" : "Shared reference"}
              </KeyValue>
              <KeyValue label="OSCAL document">
                {/* A link only to a document that is there: loading, failure and a missing
                    document read as words, never as a link's name. */}
                <QueryValue queries={[sourceDocument]}>
                  {() => {
                    const document = sourceDocument.data?.[0];
                    return document ? (
                      <TextLink
                        render={
                          <Link
                            to="/records/$collection/$recordId"
                            params={{
                              collection: "oscal_document_revisions",
                              recordId: document.id,
                            }}
                          />
                        }
                      >
                        {document.title} · {document.document_version}
                      </TextLink>
                    ) : (
                      <Text color="color.text.subtle">Not available</Text>
                    );
                  }}
                </QueryValue>
              </KeyValue>
              <KeyValue label="Updated">
                <DateTime value={revision.updated_at} format="date" />
              </KeyValue>
            </KeyValue.Group>
          </Inspector.Group>
        </Shell.Aside>
      )}
      {control && (
        <ControlInspector
          control={control}
          records={displayedControls}
          onSelect={setControl}
          {...(selections.data?.find((selection) => selection.control_id === control.id)?.id
            ? {
                selectionId: selections.data.find(
                  (selection) => selection.control_id === control.id,
                )!.id,
              }
            : {})}
          onClose={() => setControl(null)}
        />
      )}
    </>
  );
}
