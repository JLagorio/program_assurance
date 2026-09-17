import { useMemo, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Badge,
  Button,
  DataTable,
  Id,
  Inline,
  Inspector,
  KeyValue,
  PageHeader,
  Shell,
  Stack,
  Table,
  TextLink,
  defineColumns,
  useDataTable,
} from "@ledger/design-system";
import { useModelSave, useRow, useRows, type Row } from "@/lib/models";
import { labelFor, type DataRecord } from "@/lib/records";
import { useWorkspace } from "@/components/app/workspace";
import { canAuthorLibrary } from "./library-utils";
import { LibraryEditor, LibraryLoading, LibrarySelect } from "./library-shared";

/** The reusable requirements library: definitions, each with published versions programs adopt by reference. */
export function RequirementLibraryIndex() {
  const navigate = useNavigate();
  const workspace = useWorkspace();
  const definitions = useRows("requirement_definitions");
  const revisions = useRows("requirement_definition_revisions");
  const adoptions = useRows("engineering_requirements");
  const [creating, setCreating] = useState(false);
  const rows = useMemo(
    () =>
      (definitions.data ?? []).map((definition) => {
        const versions = (revisions.data ?? [])
          .filter((row) => row.requirement_definition_id === definition.id)
          .sort((a, b) => b.version_number - a.version_number);
        const latest = versions[0];
        const published = versions.find((row) => row.state === "published");
        const versionIds = new Set(versions.map((row) => row.id));
        return {
          ...definition,
          version: latest ? String(latest.version_number) : "No versions",
          status: latest?.state ?? "No versions",
          type: published ? labelFor(published.requirement_type) : "Not published",
          statement: published?.statement ?? latest?.statement ?? "",
          adopted: new Set(
            (adoptions.data ?? [])
              .filter(
                (row) => row.definition_revision_id && versionIds.has(row.definition_revision_id),
              )
              .map((row) => row.program_id),
          ).size,
        };
      }),
    [definitions.data, revisions.data, adoptions.data],
  );
  const columns = useMemo(
    () =>
      defineColumns<(typeof rows)[number]>((c) => [
        c.id("code", { header: "ID", width: 150 }),
        c.text("title", { header: "Requirement definition", hideable: false }),
        c.text("statement", { header: "Statement", minWidth: 280, wrap: true }),
        c.text("type", { header: "Type", width: 130 }),
        c.text("version", { header: "Version", width: 100 }),
        c.number("adopted", { header: "Programs", width: 100 }),
        c.status("status", { header: "State", width: 130, tone: () => "neutral" }),
      ]),
    [],
  );
  const table = useDataTable({
    data: rows,
    columns,
    getRowId: (row) => row.id,
    label: "Reusable requirements library",
    view: "live-requirement-library",
    resizable: true,
    reorderable: true,
  });
  return (
    <Stack space="space.200" className="animate-rise">
      <PageHeader>
        <div className="min-w-0">
          <PageHeader.Title>Requirements</PageHeader.Title>
          <p className="pt-050 font-body-small text-subtle">
            Reusable requirement definitions, versioned; a program adopts an exact published version
            and allocates it to its elements.
          </p>
        </div>
        <PageHeader.Actions>
          {canAuthorLibrary(workspace.role) && (
            <Button variant="primary" onClick={() => setCreating(true)}>
              New requirement definition
            </Button>
          )}
        </PageHeader.Actions>
      </PageHeader>
      {creating && (
        <LibraryEditor
          table="requirement_definitions"
          title="New requirement definition"
          onClose={() => setCreating(false)}
          onSaved={(record) => {
            void navigate({
              to: "/library/requirements/$definitionKey",
              params: { definitionKey: record.id },
            });
          }}
        />
      )}
      <LibraryLoading queries={[definitions, revisions, adoptions]}>
        <DataTable
          table={table}
          fill
          onRowClick={(row) => {
            void navigate({
              to: "/library/requirements/$definitionKey",
              params: { definitionKey: row.id },
            });
          }}
          empty={{
            illustration: "shield",
            title: "No reusable requirements",
            description:
              "Create a requirement definition, then author and publish its first version.",
          }}
          toolbar={
            <Inline space="space.100" alignBlock="center" shouldWrap>
              <DataTable.Search table={table} placeholder="Search requirement definitions" />
              <DataTable.Filter table={table} column="type" />
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

export function RequirementLibraryRecord({
  id,
  initialVersion,
}: {
  id: string;
  initialVersion?: string;
}) {
  const definition = useRow("requirement_definitions", id);
  const revisions = useRows("requirement_definition_revisions", { requirement_definition_id: id });
  const adoptions = useRows("engineering_requirements");
  const programs = useRows("programs");
  const createRevision = useModelSave("requirement_definition_revisions");
  const publish = useModelSave("requirement_definition_revisions");
  const workspace = useWorkspace();
  const [selectedVersion, setSelectedVersion] = useState(initialVersion ?? "");
  const [edit, setEdit] = useState<{ table: string; row?: DataRecord; title: string } | null>(null);
  const [error, setError] = useState("");
  const versions = [...(revisions.data ?? [])].sort((a, b) => b.version_number - a.version_number);
  const current =
    versions.find(
      (revision) =>
        revision.id === selectedVersion || String(revision.version_number) === selectedVersion,
    ) ?? versions[0];
  const editable = canAuthorLibrary(workspace.role);
  const adopting = (adoptions.data ?? []).filter(
    (row) =>
      row.definition_revision_id && versions.some((v) => v.id === row.definition_revision_id),
  );
  async function newVersion() {
    setError("");
    const base = current;
    try {
      const row = await createRevision.mutateAsync({
        values: {
          requirement_definition_id: id,
          version_number: Math.max(0, ...versions.map((revision) => revision.version_number)) + 1,
          statement: base?.statement ?? "State what the system shall do.",
          acceptance_criteria: base?.acceptance_criteria ?? "State how it is verified.",
          requirement_type: base?.requirement_type ?? "functional",
          rationale: base?.rationale ?? null,
        },
      });
      setSelectedVersion(row.id);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not create a version.");
    }
  }
  async function publishVersion(revision: Row<"requirement_definition_revisions">) {
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
    <LibraryLoading queries={[definition, revisions, adoptions, programs]}>
      <Stack space="space.200" className="animate-rise">
        <PageHeader>
          <div className="min-w-0">
            <TextLink render={<Link to="/library/requirements" />}>Requirements</TextLink>
            <PageHeader.Title>{definition.data?.title ?? "Requirement not found"}</PageHeader.Title>
            {definition.data && (
              <p className="pt-050 font-body-small text-subtle">
                <Id>{definition.data.code}</Id>
                {definition.data.description ? ` · ${definition.data.description}` : ""}
              </p>
            )}
          </div>
          {editable && definition.data && (
            <PageHeader.Actions>
              <Inline space="space.100">
                <Button
                  variant="secondary"
                  onClick={() =>
                    setEdit({
                      table: "requirement_definitions",
                      row: definition.data as unknown as DataRecord,
                      title: "Edit requirement definition",
                    })
                  }
                >
                  Edit details
                </Button>
                <Button
                  variant="primary"
                  disabled={createRevision.isPending}
                  onClick={() => void newVersion()}
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
        {edit && (
          <LibraryEditor
            table={edit.table}
            title={edit.title}
            {...(edit.row ? { existing: edit.row } : {})}
            initialValues={{ requirement_definition_id: id }}
            onClose={() => setEdit(null)}
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
          <Stack space="space.200">
            <Inline space="space.150" alignBlock="center">
              <Badge variant="secondary" tone="neutral">
                {current.state}
              </Badge>
              {editable && current.state === "draft" && (
                <>
                  <Button
                    variant="secondary"
                    onClick={() =>
                      setEdit({
                        table: "requirement_definition_revisions",
                        row: current as unknown as DataRecord,
                        title: "Edit version",
                      })
                    }
                  >
                    Edit version
                  </Button>
                  <Button
                    variant="secondary"
                    disabled={publish.isPending}
                    onClick={() => void publishVersion(current)}
                  >
                    Publish version
                  </Button>
                </>
              )}
            </Inline>
            <KeyValue label="Statement" wrap>
              {current.statement}
            </KeyValue>
            <KeyValue label="Acceptance" wrap>
              {current.acceptance_criteria}
            </KeyValue>
            <KeyValue label="Type">{labelFor(current.requirement_type)}</KeyValue>
            {current.rationale && (
              <KeyValue label="Rationale" wrap>
                {current.rationale}
              </KeyValue>
            )}
            <Stack space="space.100">
              <h2 className="font-heading-small">Adopted by</h2>
              <Table>
                <thead>
                  <tr>
                    <Table.Header>Program</Table.Header>
                    <Table.Header>Requirement</Table.Header>
                    <Table.Header>Version</Table.Header>
                  </tr>
                </thead>
                <tbody>
                  {adopting.map((row) => {
                    const program = programs.data?.find((item) => item.id === row.program_id);
                    const version = versions.find((item) => item.id === row.definition_revision_id);
                    return (
                      <Table.Row key={row.id}>
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
                        <Table.Cell>
                          {program ? (
                            <TextLink
                              render={
                                <Link
                                  to="/programs/$programId/requirements/$requirementId"
                                  params={{ programId: program.id, requirementId: row.id }}
                                />
                              }
                            >
                              {row.code}
                            </TextLink>
                          ) : (
                            row.code
                          )}
                        </Table.Cell>
                        <Table.Cell>{version?.version_number ?? "—"}</Table.Cell>
                      </Table.Row>
                    );
                  })}
                </tbody>
              </Table>
              {!adopting.length && (
                <p className="text-subtle">No program has adopted this requirement yet.</p>
              )}
            </Stack>
          </Stack>
        ) : (
          <p className="text-subtle">No versions have been authored.</p>
        )}
      </Stack>
      <Shell.Aside label="Requirement definition properties">
        <Inspector.Group title="Version">
          <KeyValue label="Version">{current?.version_number ?? "—"}</KeyValue>
          <KeyValue label="State">{current?.state ?? "—"}</KeyValue>
          <KeyValue label="Published">{current?.published_at ?? "Not published"}</KeyValue>
          <KeyValue label="Adopted by">{adopting.length} requirements</KeyValue>
        </Inspector.Group>
      </Shell.Aside>
    </LibraryLoading>
  );
}
