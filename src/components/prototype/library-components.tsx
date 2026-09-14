import { canAuthorLibrary, downloadLibraryRecords } from "./library-utils";
import { useMemo, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Badge,
  Button,
  Count,
  DataTable,
  defineColumns,
  Id,
  Inline,
  Inspector,
  KeyValue,
  PageHeader,
  Shell,
  Stack,
  Table,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  TextLink,
  useDataTable,
} from "@ledger/design-system";
import { useRow, useRows, useModelSave, type Row } from "@/lib/models";
import { useWorkspace } from "@/components/app/workspace";
import { ControlInspector } from "./library-controls";
import { LibraryEditor, LibraryLoading, LibrarySelect } from "./library-shared";
import type { DataRecord } from "@/lib/records";

export function ComponentLibraryIndex() {
  const navigate = useNavigate();
  const workspace = useWorkspace();
  const definitions = useRows("component_definitions");
  const revisions = useRows("component_definition_revisions");
  const components = useRows("defined_components");
  const claims = useRows("defined_component_implementations");
  const [creating, setCreating] = useState(false);
  const rows = useMemo(
    () =>
      (definitions.data ?? []).map((definition) => {
        const revision = (revisions.data ?? [])
          .filter((item) => item.component_definition_id === definition.id)
          .sort((a, b) => b.version_number - a.version_number)[0];
        return {
          ...definition,
          version: revision ? String(revision.version_number) : "No revisions",
          status: revision?.state ?? "No revisions",
          types:
            [
              ...new Set(
                components.data
                  ?.filter((item) => item.component_definition_revision_id === revision?.id)
                  .map((item) => item.component_type),
              ),
            ].join(", ") || "Not defined",
          controls: new Set(
            claims.data
              ?.filter((claim) => claim.component_definition_revision_id === revision?.id)
              .map((claim) => claim.control_id),
          ).size,
        };
      }),
    [definitions.data, revisions.data, components.data, claims.data],
  );
  const columns = useMemo(
    () =>
      defineColumns<(typeof rows)[number]>((c) => [
        c.id("code", { header: "ID", width: 150 }),
        c.text("name", { header: "Component definition", hideable: false }),
        c.text("types", { header: "Type", width: 170 }),
        c.text("version", { header: "Version", width: 110 }),
        c.number("controls", { header: "Controls", width: 100 }),
        c.status("status", { header: "State", width: 130, tone: () => "neutral" }),
      ]),
    [],
  );
  const table = useDataTable({
    data: rows,
    columns,
    getRowId: (row) => row.id,
    label: "Reusable component library",
    view: "live-component-library",
    resizable: true,
    reorderable: true,
  });
  return (
    <Stack space="space.200" className="animate-rise">
      <PageHeader>
        <div className="min-w-0">
          <PageHeader.Title>Components</PageHeader.Title>
          <p className="pt-050 font-body-small text-subtle">
            Reusable implementation content, versioned independently from its use in systems.
          </p>
        </div>
        <PageHeader.Actions>
          <Inline space="space.100">
            <Button
              variant="secondary"
              disabled={!definitions.data || !revisions.data || !components.data || !claims.data}
              onClick={() =>
                downloadLibraryRecords("component-library.json", {
                  definitions: definitions.data,
                  revisions: revisions.data,
                  components: components.data,
                  implementations: claims.data,
                })
              }
            >
              Export
            </Button>
            {canAuthorLibrary(workspace.role) && (
              <Button variant="primary" onClick={() => setCreating(true)}>
                New component
              </Button>
            )}
          </Inline>
        </PageHeader.Actions>
      </PageHeader>
      {creating && (
        <LibraryEditor
          table="component_definitions"
          title="New component definition"
          onClose={() => setCreating(false)}
          onSaved={(record) => {
            void navigate({
              to: "/library/components/$componentKey",
              params: { componentKey: record.id },
            });
          }}
        />
      )}
      <LibraryLoading queries={[definitions, revisions, components, claims]}>
        <DataTable
          table={table}
          fill
          onRowClick={(row) => {
            void navigate({
              to: "/library/components/$componentKey",
              params: { componentKey: row.id },
            });
          }}
          empty={{
            illustration: "tree",
            title: "No reusable components",
            description:
              "Create a component definition, then add its versioned implementation content.",
          }}
          toolbar={
            <Inline space="space.100" alignBlock="center" shouldWrap>
              <DataTable.Search table={table} placeholder="Search components" />
              <DataTable.Filter table={table} column="types" />
              <DataTable.Filter table={table} column="status" />
              <Inline className="ml-auto">
                <DataTable.Columns table={table} />
              </Inline>
            </Inline>
          }
        />
      </LibraryLoading>
    </Stack>
  );
}

export function ComponentLibraryRecord({
  id,
  initialVersion,
}: {
  id: string;
  initialVersion?: string;
}) {
  const definition = useRow("component_definitions", id);
  const revisions = useRows("component_definition_revisions", { component_definition_id: id });
  const createRevision = useModelSave("component_definition_revisions");
  const workspace = useWorkspace();
  const [selectedVersion, setSelectedVersion] = useState(initialVersion ?? "");
  const [editDefinition, setEditDefinition] = useState(false);
  const [error, setError] = useState("");
  const versions = [...(revisions.data ?? [])].sort((a, b) => b.version_number - a.version_number);
  const current =
    versions.find(
      (revision) =>
        revision.id === selectedVersion || String(revision.version_number) === selectedVersion,
    ) ?? versions[0];
  const editable = canAuthorLibrary(workspace.role);
  async function newRevision() {
    setError("");
    try {
      const row = await createRevision.mutateAsync({
        values: {
          component_definition_id: id,
          version_number: Math.max(0, ...versions.map((revision) => revision.version_number)) + 1,
        },
      });
      setSelectedVersion(row.id);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not create a revision.");
    }
  }
  return (
    <LibraryLoading queries={[definition, revisions]}>
      <Stack space="space.200" className="animate-rise">
        <PageHeader>
          <div className="min-w-0">
            <TextLink render={<Link to="/library/components" />}>Components</TextLink>
            <PageHeader.Title>{definition.data?.name ?? "Component not found"}</PageHeader.Title>
            {definition.data?.description && (
              <p className="pt-050 font-body-small text-subtle">{definition.data.description}</p>
            )}
          </div>
          {editable && definition.data && (
            <PageHeader.Actions>
              <Inline space="space.100">
                <Button variant="secondary" onClick={() => setEditDefinition(true)}>
                  Edit details
                </Button>
                <Button
                  variant="primary"
                  disabled={createRevision.isPending}
                  onClick={() => void newRevision()}
                >
                  New version
                </Button>
              </Inline>
            </PageHeader.Actions>
          )}
        </PageHeader>
        {error && (
          <p role="alert" className="text-danger">
            {error}
          </p>
        )}
        {editDefinition && definition.data && (
          <LibraryEditor
            table="component_definitions"
            title="Edit component definition"
            existing={definition.data}
            onClose={() => setEditDefinition(false)}
          />
        )}
        {current && (
          <div className="w-layout-rail max-w-full">
            <LibrarySelect
              label="Version"
              value={current.id}
              options={versions.map((revision) => ({
                value: revision.id,
                label: `${revision.version_number} · ${revision.state}`,
              }))}
              onChange={setSelectedVersion}
            />
          </div>
        )}
        {current ? (
          <ComponentRevision
            key={current.id}
            revision={current}
            versions={versions}
            onVersion={setSelectedVersion}
            editable={editable}
          />
        ) : (
          <p className="text-subtle">No component versions have been authored.</p>
        )}
      </Stack>
    </LibraryLoading>
  );
}

function ComponentRevision({
  revision,
  versions,
  onVersion,
  editable,
}: {
  revision: Row<"component_definition_revisions">;
  versions: Row<"component_definition_revisions">[];
  onVersion: (id: string) => void;
  editable: boolean;
}) {
  const components = useRows("defined_components", {
    component_definition_revision_id: revision.id,
  });
  const implementations = useRows("defined_component_implementations", {
    component_definition_revision_id: revision.id,
  });
  const controls = useRows("controls");
  const uses = useRows("system_components");
  const systems = useRows("systems");
  const programs = useRows("programs");
  const publish = useModelSave("component_definition_revisions");
  const [tab, setTab] = useState("Controls");
  const [edit, setEdit] = useState<{ table: string; row?: DataRecord } | null>(null);
  const [inspected, setInspected] = useState<Row<"controls"> | null>(null);
  const [error, setError] = useState("");
  const canEdit = editable && revision.state === "draft";
  const componentIds = new Set(components.data?.map((component) => component.id));
  const currentUses = (uses.data ?? []).filter(
    (use) => use.defined_component_id && componentIds.has(use.defined_component_id),
  );
  const claimRows = useMemo(
    () =>
      (implementations.data ?? []).map((claim) => ({
        ...claim,
        code:
          controls.data?.find((control) => control.id === claim.control_id)?.code ??
          claim.control_id,
        title:
          controls.data?.find((control) => control.id === claim.control_id)?.title ??
          "Not recorded",
        component:
          components.data?.find((component) => component.id === claim.defined_component_id)?.name ??
          "Not recorded",
      })),
    [implementations.data, controls.data, components.data],
  );
  const columns = useMemo(
    () =>
      defineColumns<(typeof claimRows)[number]>((c) => [
        c.id("code", { header: "Control", width: 130 }),
        c.text("title", { header: "Title" }),
        c.text("component", { header: "Component", width: 180 }),
        c.text("description", { header: "Implementation" }),
        c.status("implementation_status", {
          header: "Implementation state",
          width: 170,
          tone: () => "neutral",
        }),
      ]),
    [],
  );
  const table = useDataTable({
    data: claimRows,
    columns,
    getRowId: (row) => row.id,
    label: "Reusable control implementations",
    view: "live-component-controls",
    resizable: true,
  });
  async function publishRevision() {
    setError("");
    try {
      await publish.mutateAsync({
        id: revision.id,
        revision: revision.revision,
        values: { state: "published" },
      });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not publish this version.");
    }
  }
  return (
    <Stack space="space.200">
      <Inline space="space.150" alignBlock="center">
        <Badge variant="secondary" tone="neutral">
          {revision.state}
        </Badge>
        {canEdit && (
          <Button
            variant="secondary"
            disabled={publish.isPending || !components.data?.length}
            onClick={() => void publishRevision()}
          >
            Publish version
          </Button>
        )}
      </Inline>
      {error && (
        <p role="alert" className="text-danger">
          {error}
        </p>
      )}
      {edit && (
        <LibraryEditor
          table={edit.table}
          title={
            edit.row
              ? "Edit library record"
              : edit.table === "defined_components"
                ? "Add component"
                : "Add control implementation"
          }
          initialValues={{ component_definition_revision_id: revision.id }}
          {...(edit.row ? { existing: edit.row } : {})}
          onClose={() => setEdit(null)}
        />
      )}
      <Tabs value={tab} onValueChange={(value) => setTab(String(value))} className="contents">
        <TabsList variant="line" className="w-full justify-start flex-wrap">
          {["Controls", "Structure", "Requirements", "Evidence", "Versions", "Programs"].map(
            (name) => (
              <TabsTrigger key={name} value={name}>
                {name}
                {name === "Controls" && implementations.data && (
                  <Count
                    value={new Set(implementations.data.map((claim) => claim.control_id)).size}
                    max={99999}
                  />
                )}
              </TabsTrigger>
            ),
          )}
        </TabsList>
        <TabsContent value={tab} className="contents">
          <LibraryLoading
            queries={[components, implementations, controls, uses, systems, programs]}
          >
            {tab === "Controls" && (
              <Stack space="space.200">
                {canEdit && (
                  <Inline>
                    <Button
                      variant="primary"
                      disabled={!components.data?.length}
                      onClick={() => setEdit({ table: "defined_component_implementations" })}
                    >
                      Add control implementation
                    </Button>
                  </Inline>
                )}
                <DataTable
                  table={table}
                  onRowClick={(claim) => {
                    if (canEdit)
                      setEdit({ table: "defined_component_implementations", row: claim });
                    else
                      setInspected(
                        controls.data?.find((control) => control.id === claim.control_id) ?? null,
                      );
                  }}
                  empty={{
                    illustration: "shield",
                    title: "No implementation claims",
                    description:
                      "Add a component in Structure, then author its control implementation.",
                  }}
                  toolbar={
                    <Inline space="space.100">
                      <DataTable.Search table={table} placeholder="Search controls" />
                      <DataTable.Filter table={table} column="component" />
                      <DataTable.Filter table={table} column="implementation_status" />
                    </Inline>
                  }
                />
              </Stack>
            )}
            {tab === "Structure" && (
              <Stack space="space.200">
                <Inline spread="space-between" alignBlock="center">
                  <h2 className="font-heading-small">Components</h2>
                  {canEdit && (
                    <Button
                      variant="primary"
                      onClick={() => setEdit({ table: "defined_components" })}
                    >
                      Add component
                    </Button>
                  )}
                </Inline>
                <Table>
                  <thead>
                    <tr>
                      <Table.Header>Component</Table.Header>
                      <Table.Header>Type</Table.Header>
                      <Table.Header>Description</Table.Header>
                      {canEdit && <Table.Header>Actions</Table.Header>}
                    </tr>
                  </thead>
                  <tbody>
                    {components.data?.map((component) => (
                      <Table.Row key={component.id}>
                        <Table.Cell>{component.name}</Table.Cell>
                        <Table.Cell>{component.component_type}</Table.Cell>
                        <Table.Cell>{component.description ?? "Not recorded"}</Table.Cell>
                        {canEdit && (
                          <Table.Cell>
                            <Button
                              variant="subtle"
                              size="small"
                              onClick={() =>
                                setEdit({ table: "defined_components", row: component })
                              }
                            >
                              Edit
                            </Button>
                          </Table.Cell>
                        )}
                      </Table.Row>
                    ))}
                  </tbody>
                </Table>
                {!components.data?.length && (
                  <p className="text-subtle">This version contains no components.</p>
                )}
              </Stack>
            )}
            {tab === "Versions" && (
              <Table>
                <thead>
                  <tr>
                    <Table.Header>Version</Table.Header>
                    <Table.Header>State</Table.Header>
                    <Table.Header>Published</Table.Header>
                    <Table.Header>Actions</Table.Header>
                  </tr>
                </thead>
                <tbody>
                  {versions.map((version) => (
                    <Table.Row key={version.id}>
                      <Table.Cell>{version.version_number}</Table.Cell>
                      <Table.Cell>{version.state}</Table.Cell>
                      <Table.Cell>{version.published_at ?? "Not published"}</Table.Cell>
                      <Table.Cell>
                        <Button variant="subtle" size="small" onClick={() => onVersion(version.id)}>
                          Open version
                        </Button>
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </tbody>
              </Table>
            )}
            {tab === "Programs" && (
              <Stack space="space.200">
                <Table>
                  <thead>
                    <tr>
                      <Table.Header>Program</Table.Header>
                      <Table.Header>System</Table.Header>
                      <Table.Header>Component instance</Table.Header>
                      <Table.Header>Version</Table.Header>
                    </tr>
                  </thead>
                  <tbody>
                    {currentUses.map((use) => {
                      const system = systems.data?.find(
                        (candidate) => candidate.id === use.system_id,
                      );
                      const program = programs.data?.find(
                        (candidate) => candidate.id === system?.program_id,
                      );
                      return (
                        <Table.Row key={use.id}>
                          <Table.Cell>
                            {program ? (
                              <TextLink
                                render={
                                  <Link
                                    to="/programs/$programId"
                                    params={{ programId: program.id }}
                                  />
                                }
                              >
                                {program.name}
                              </TextLink>
                            ) : (
                              "Not recorded"
                            )}
                          </Table.Cell>
                          <Table.Cell>{system?.name ?? "Not recorded"}</Table.Cell>
                          <Table.Cell>{use.name}</Table.Cell>
                          <Table.Cell>{use.version ?? "Not recorded"}</Table.Cell>
                        </Table.Row>
                      );
                    })}
                  </tbody>
                </Table>
                {!currentUses.length && (
                  <p className="text-subtle">No system components use this version.</p>
                )}
              </Stack>
            )}
            {(tab === "Requirements" || tab === "Evidence") && (
              <ComponentTraceability key={tab} kind={tab} uses={currentUses} />
            )}
          </LibraryLoading>
        </TabsContent>
      </Tabs>
      <Shell.Aside label="Component properties">
        <Inspector.Group title="Version">
          <KeyValue label="Version">{revision.version_number}</KeyValue>
          <KeyValue label="State">{revision.state}</KeyValue>
          <KeyValue label="Published">{revision.published_at ?? "Not published"}</KeyValue>
          <KeyValue label="Components">{components.data?.length ?? "Loading…"}</KeyValue>
          <KeyValue label="System uses">
            {uses.data && components.data ? currentUses.length : "Loading…"}
          </KeyValue>
          {revision.remarks && (
            <KeyValue label="Remarks" wrap>
              {revision.remarks}
            </KeyValue>
          )}
        </Inspector.Group>
      </Shell.Aside>
      {inspected && <ControlInspector control={inspected} onClose={() => setInspected(null)} />}
    </Stack>
  );
}

function ComponentTraceability({
  kind,
  uses,
}: {
  kind: "Requirements" | "Evidence";
  uses: Row<"system_components">[];
}) {
  const contributions = useRows("component_contributions");
  const requirementLinks = useRows("requirement_implementations");
  const requirements = useRows("requirement_revisions");
  const evidenceLinks = useRows("implementation_evidence");
  const evidence = useRows("evidence_versions");
  const artifacts = useRows("evidence_artifacts");
  const useIds = new Set(uses.map((use) => use.id));
  const relevant = (contributions.data ?? []).filter((contribution) =>
    useIds.has(contribution.system_component_id),
  );
  const contributionIds = new Set(relevant.map((contribution) => contribution.id));
  const requirementIds = new Set(
    requirementLinks.data
      ?.filter(
        (link) =>
          !!link.component_contribution_id && contributionIds.has(link.component_contribution_id),
      )
      .map((link) => link.requirement_revision_id),
  );
  const statementIds = new Set(
    relevant.flatMap((contribution) => contribution.implementation_statement_id ?? []),
  );
  const evidenceIds = new Set(
    evidenceLinks.data
      ?.filter(
        (link) =>
          (!!link.implementation_statement_id &&
            statementIds.has(link.implementation_statement_id)) ||
          (!!link.component_contribution_id && contributionIds.has(link.component_contribution_id)),
      )
      .map((link) => link.evidence_version_id),
  );
  const matchingRequirements = (requirements.data ?? []).filter((requirement) =>
    requirementIds.has(requirement.id),
  );
  const matchingEvidence = (evidence.data ?? []).filter((version) => evidenceIds.has(version.id));
  return (
    <LibraryLoading
      queries={[contributions, requirementLinks, requirements, evidenceLinks, evidence, artifacts]}
    >
      <Stack space="space.200">
        <p className="font-body-small text-subtle">
          {kind} linked to actual system implementations using this component version.
        </p>
        {kind === "Requirements" ? (
          matchingRequirements.length ? (
            matchingRequirements.map((requirement) => (
              <Inspector.Group key={requirement.id} title={requirement.title}>
                <KeyValue label="Version">{requirement.version_number}</KeyValue>
                <KeyValue label="State">{requirement.state}</KeyValue>
                <p className="font-body-small">{requirement.statement}</p>
              </Inspector.Group>
            ))
          ) : (
            <p className="text-subtle">
              No requirements have been linked through these system implementations.
            </p>
          )
        ) : matchingEvidence.length ? (
          matchingEvidence.map((version) => (
            <Inspector.Group
              key={version.id}
              title={
                artifacts.data?.find((artifact) => artifact.id === version.artifact_id)?.title ??
                version.id
              }
            >
              <KeyValue label="Version">{version.version_number}</KeyValue>
              <KeyValue label="State">{version.state}</KeyValue>
              <KeyValue label="Location" wrap>
                {version.external_uri ? (
                  <TextLink href={version.external_uri} target="_blank" rel="noreferrer">
                    {version.external_uri}
                  </TextLink>
                ) : (
                  (version.storage_object_name ?? "Not recorded")
                )}
              </KeyValue>
            </Inspector.Group>
          ))
        ) : (
          <p className="text-subtle">
            No evidence has been linked through these system implementations.
          </p>
        )}
      </Stack>
    </LibraryLoading>
  );
}
