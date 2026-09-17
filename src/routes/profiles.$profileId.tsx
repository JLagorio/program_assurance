import { canAuthorLibrary } from "@/components/prototype/library-utils";
import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronDown } from "lucide-react";
import {
  Badge,
  Button,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  Count,
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
  Id,
  Inline,
  Inspector,
  KeyValue,
  PageHeader,
  Section,
  Shell,
  Stack,
  Table,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  TextLink,
} from "@ledger/design-system";
import { useRow, useRows, type Row } from "@/lib/models";
import { inspectBase, overlayDecisions, profileDisplayTitle } from "@/lib/program-wizard-reference";
import { useWorkspace } from "@/components/app/workspace";
import { LibraryControlTable, ControlInspector } from "@/components/prototype/library-controls";
import {
  LibraryEditor,
  LibraryLoading,
  LibrarySelect,
} from "@/components/prototype/library-shared";
import { ProfileChain } from "@/components/app/profile-tailoring/chain";
import { ProfileTailoringEditor } from "@/components/app/profile-tailoring/editor";
import { useReferenceData } from "@/components/app/profile-tailoring/use-reference-data";

export const Route = createFileRoute("/profiles/$profileId")({
  head: () => ({ meta: [{ title: "Profile — Program Assurance" }] }),
  component: ProfilePage,
});
function ProfilePage() {
  const { profileId } = Route.useParams();
  const profile = useRow("profiles", profileId);
  const revisions = useRows("profile_revisions", { profile_id: profileId });
  const workspace = useWorkspace();
  const [chosen, setChosen] = useState("");
  const [creating, setCreating] = useState(false);
  const versions = [...(revisions.data ?? [])].sort((a, b) =>
    b.created_at.localeCompare(a.created_at),
  );
  const current = versions.find((revision) => revision.id === chosen) ?? versions[0];
  const editable =
    profile.data?.tenant_id === workspace.tenantId && canAuthorLibrary(workspace.role);
  return (
    <LibraryLoading queries={[profile, revisions]}>
      <Stack space="space.200" className="animate-rise">
        <PageHeader>
          <div className="min-w-0">
            <TextLink render={<Link to="/profiles" />}>Profiles</TextLink>
            <PageHeader.Title>{profile.data?.title ?? "Profile not found"}</PageHeader.Title>
          </div>
          {editable && (
            <PageHeader.Actions>
              <Button variant="primary" onClick={() => setCreating(true)}>
                New revision
              </Button>
            </PageHeader.Actions>
          )}
        </PageHeader>
        {creating && (
          <LibraryEditor
            table="profile_revisions"
            title="New profile revision"
            initialValues={{ profile_id: profileId }}
            onClose={() => setCreating(false)}
            onSaved={(record) => setChosen(record.id)}
          />
        )}
        {!!versions.length && (
          <div className="w-layout-rail max-w-full">
            <LibrarySelect
              label="Profile revision"
              value={current?.id ?? ""}
              options={versions.map((revision) => ({
                value: revision.id,
                label: `${revision.version} · ${revision.state}`,
              }))}
              onChange={setChosen}
            />
          </div>
        )}
        {current ? (
          <ProfileRevision key={current.id} revision={current} editable={!!editable} />
        ) : (
          <p className="text-subtle">
            This profile has no revisions. Create a revision to record its source and selection
            rules.
          </p>
        )}
      </Stack>
    </LibraryLoading>
  );
}

function ProfileRevision({
  revision,
  editable,
}: {
  revision: Row<"profile_revisions">;
  editable: boolean;
}) {
  const [tab, setTab] = useState("Derivation");
  const [resolutionId, setResolutionId] = useState("");
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
  /** The resolved catalog edition under its stable name, for the chain and the rail. */
  const inspectedCatalog = useMemo(() => {
    const catalog = inspection?.catalog;
    if (!catalog) return null;
    return {
      id: catalog.id,
      title:
        reference.data.catalogs.find((row) => row.id === catalog.catalog_id)?.title ??
        catalog.title,
      version: catalog.version,
    };
  }, [inspection, reference.data.catalogs]);
  const catalogOf = (item: Row<"profile_imports">) =>
    catalogRevisions.data?.find((catalog) => catalog.id === item.catalog_revision_id);
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
      [included ? `${included} included` : null, excluded ? `${excluded} excluded` : null]
        .filter(Boolean)
        .join(" · ") || "No selection rules"
    );
  };
  const kind = inspection?.kind === "overlay" ? "Tailored" : "Reference";
  return (
    <Stack space="space.200">
      <Tabs
        value={tab}
        onValueChange={(value) => {
          setTab(String(value));
          setControl(null);
        }}
        className="contents"
      >
        <TabsList variant="line" className="w-full justify-start">
          {["Derivation", "Controls", "Tailoring"].map((name) => (
            <TabsTrigger key={name} value={name}>
              {name}
              {name === "Controls" && resolution && selectionsReady && (
                <Count value={selections.data?.length ?? 0} max={99999} />
              )}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value={tab} className="contents">
          <LibraryLoading
            queries={[
              imports,
              rules,
              resolutions,
              allRevisions,
              controls,
              catalogRevisions,
              catalogs,
              profiles,
              ...(resolution ? [selections] : []),
              ...(tab === "Tailoring" ? reference.queries : []),
            ]}
          >
            {editing && (
              <LibraryEditor
                table={editing}
                title={
                  editing === "profile_imports" ? "Record profile import" : "Record tailoring rule"
                }
                initialValues={{ profile_revision_id: revision.id }}
                onClose={() => setEditing(null)}
              />
            )}
            {tab === "Derivation" && (
              <Stack space="space.200">
                <Inline alignBlock="center" spread="space-between">
                  <h2 className="font-heading-small">Source imports</h2>
                  {editable && revision.state === "draft" && (
                    <Button variant="secondary" onClick={() => setEditing("profile_imports")}>
                      Add import
                    </Button>
                  )}
                </Inline>
                <Table>
                  <thead>
                    <tr>
                      <Table.Header>Order</Table.Header>
                      <Table.Header>Source</Table.Header>
                      <Table.Header>Selection</Table.Header>
                      <Table.Header>Reference</Table.Header>
                    </tr>
                  </thead>
                  <tbody>
                    {imports.data?.map((item) => {
                      const catalog = catalogOf(item);
                      const imported = importedRevision(item);
                      return (
                        <Table.Row key={item.id}>
                          <Table.Cell>{item.ordinal}</Table.Cell>
                          <Table.Cell className="whitespace-normal">
                            {catalog ? (
                              <TextLink
                                render={<Link to="/catalog" search={{ edition: catalog.id }} />}
                              >
                                Catalog ·{" "}
                                {catalogs.data?.find((row) => row.id === catalog.catalog_id)
                                  ?.title ?? catalog.title}
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
                              "Not recorded"
                            )}
                          </Table.Cell>
                          <Table.Cell>{importSelection(item)}</Table.Cell>
                          <Table.Cell>
                            <Id>{item.href}</Id>
                          </Table.Cell>
                        </Table.Row>
                      );
                    })}
                  </tbody>
                </Table>
                {!imports.data?.length && (
                  <p className="text-subtle">No source imports recorded.</p>
                )}
                <h2 className="font-heading-small">Recorded resolutions</h2>
                {available.length ? (
                  available.map((item) => (
                    <Inspector.Group
                      key={item.id}
                      title={`${item.resolver_name} · ${item.resolver_version}`}
                    >
                      <KeyValue label="State">{item.state}</KeyValue>
                      <KeyValue label="Resolved at">{item.resolved_at}</KeyValue>
                      <KeyValue label="Input hash" wrap>
                        <Id>{item.input_sha256}</Id>
                      </KeyValue>
                      <KeyValue label="Output hash" wrap>
                        <Id>{item.output_sha256}</Id>
                      </KeyValue>
                    </Inspector.Group>
                  ))
                ) : (
                  <p className="text-subtle">
                    No resolution has been recorded. A control count is available after a resolution
                    has been imported.
                  </p>
                )}
              </Stack>
            )}
            {tab === "Controls" && (
              <Stack space="space.200">
                {resolution ? (
                  <>
                    <div className="w-layout-rail max-w-full">
                      <LibrarySelect
                        label="Resolved selection"
                        value={resolution.id}
                        options={available.map((item) => ({
                          value: item.id,
                          label: `${item.resolved_at} · ${item.state}`,
                        }))}
                        onChange={setResolutionId}
                      />
                    </div>
                    <LibraryControlTable
                      controls={selectedControls}
                      onSelect={setControl}
                      label="Profile controls"
                    />
                  </>
                ) : (
                  <p className="text-subtle">This revision has no recorded resolved selection.</p>
                )}
              </Stack>
            )}
            {tab === "Tailoring" && (
              <Stack space="space.250">
                <Section title="Derived from">
                  {inspection ? (
                    <ProfileChain chain={inspection.chain} catalog={inspectedCatalog} />
                  ) : (
                    <p className="text-subtle">
                      Derivation is shown for a published, resolved revision.
                    </p>
                  )}
                </Section>
                {decisions ? (
                  <ProfileTailoringEditor
                    readOnly
                    catalogRevisionId={decisions.catalogRevisionId}
                    baseResolutionId={decisions.baseResolutionId}
                    decisions={decisions.tailoring}
                    parameters={decisions.parameters}
                    title={profileDisplayTitle(revision, reference.data) ?? revision.title}
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
                          : "A tailoring diff appears for a published, resolved revision layered on a base profile."}
                      </EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                )}
                <Collapsible>
                  <Inline alignBlock="center" spread="space-between">
                    <CollapsibleTrigger
                      render={
                        <Button variant="subtle" size="small" iconAfter={<ChevronDown />}>
                          OSCAL rules · {rules.data?.length ?? 0}
                        </Button>
                      }
                    />
                    {editable && revision.state === "draft" && (
                      <Button variant="secondary" onClick={() => setEditing("profile_rules")}>
                        Add rule
                      </Button>
                    )}
                  </Inline>
                  <CollapsibleContent>
                    <Stack space="space.200" className="pt-150">
                      {rules.data?.length ? (
                        rules.data.map((rule) => (
                          <Stack key={rule.id} space="space.100" className="border-b pb-200">
                            <Inline space="space.100">
                              <Badge variant="secondary" tone="neutral">
                                {rule.kind}
                              </Badge>
                              <Id>{rule.source_pointer}</Id>
                            </Inline>
                            {rule.rationale && <p className="font-body-small">{rule.rationale}</p>}
                            <pre className="font-body-small overflow-auto whitespace-pre-wrap">
                              {JSON.stringify(rule.definition, null, 2)}
                            </pre>
                          </Stack>
                        ))
                      ) : (
                        <p className="text-subtle">No tailoring rules recorded.</p>
                      )}
                    </Stack>
                  </CollapsibleContent>
                </Collapsible>
              </Stack>
            )}
          </LibraryLoading>
        </TabsContent>
      </Tabs>
      <Shell.Aside label="Profile properties">
        <Inspector.Group title="Profile revision">
          <KeyValue label="Version">{revision.version}</KeyValue>
          <KeyValue label="State">{revision.state}</KeyValue>
          <KeyValue label="Kind" wrap>
            {inspection
              ? inspection.kind === "overlay"
                ? `${kind} from ${profileDisplayTitle(inspection.base?.profile, reference.data) ?? "a base profile"}`
                : kind
              : "Not resolved"}
          </KeyValue>
          <KeyValue label="Catalog" wrap>
            {inspectedCatalog ? (
              <TextLink render={<Link to="/catalog" search={{ edition: inspectedCatalog.id }} />}>
                {inspectedCatalog.title} · {inspectedCatalog.version}
              </TextLink>
            ) : (
              "Not resolved"
            )}
          </KeyValue>
          <KeyValue label="Controls">
            {resolution
              ? selections.error
                ? "Unavailable"
                : selectionsReady
                  ? selections.data!.length
                  : "Loading…"
              : "Not resolved"}
          </KeyValue>
          <KeyValue label="Imports">{imports.data?.length ?? "Loading…"}</KeyValue>
          <KeyValue label="OSCAL document revision" wrap>
            <Id>{revision.document_revision_id}</Id>
          </KeyValue>
        </Inspector.Group>
      </Shell.Aside>
      {control && (
        <ControlInspector
          key={control.id}
          control={control}
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
    </Stack>
  );
}
