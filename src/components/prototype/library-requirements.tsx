import { RecordLink, recordDestination } from "./record-preview";
import { EmptyMessage, MissingRecord } from "./work-common";
import { displayDate } from "./work-format";
import { useMemo, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Absent,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  Section,
  Toolbar,
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
        c.text("title", {
          header: "Requirement definition",
          hideable: false,
          cell: (row) => (
            <RecordLink table="requirement_definitions" record={row}>
              {row.title}
            </RecordLink>
          ),
        }),
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
        <PageHeader.Heading>
          <PageHeader.Title>Requirements</PageHeader.Title>
        </PageHeader.Heading>
      </PageHeader>
      {creating && (
        <LibraryEditor
          table="requirement_definitions"
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
          responsive
          table={table}
          fill
          onRowClick={(row) => {
            void navigate({
              to: "/library/requirements/$definitionKey",
              params: { definitionKey: row.id },
            });
          }}
          empty={{
            action: canAuthorLibrary(workspace.role) ? (
              <Button variant="primary" onClick={() => setCreating(true)}>
                Create requirement
              </Button>
            ) : undefined,
            illustration: "shield",
            title: "No reusable requirements",
            description:
              "Create a requirement definition, then author and publish its first version.",
          }}
          toolbar={
            <Toolbar
              search={String(table.state.globalFilter ?? "")}
              onSearch={(value) => table.setGlobalFilter(value)}
              placeholder="Find requirements"
              filters={
                <>
                  <DataTable.Filter table={table} column="type" />
                  <DataTable.Filter table={table} column="status" />
                </>
              }
              actions={
                <>
                  {canAuthorLibrary(workspace.role) && (
                    <Button variant="primary" onClick={() => setCreating(true)}>
                      Create requirement definition
                    </Button>
                  )}
                </>
              }
            >
              <DataTable.Columns table={table} />
              <DataTable.Settings table={table} />
            </Toolbar>
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
  const navigate = useNavigate();
  const definition = useRow("requirement_definitions", id);
  const revisions = useRows("requirement_definition_revisions", { requirement_definition_id: id });
  const adoptions = useRows("engineering_requirements");
  const requirementContents = useRows("requirement_revisions");
  const programs = useRows("programs");
  const createRevision = useModelSave("requirement_definition_revisions");
  const publish = useModelSave("requirement_definition_revisions");
  const workspace = useWorkspace();
  const [selectedVersion, setSelectedVersion] = useState(initialVersion ?? "");
  const [edit, setEdit] = useState<{ table: string; row?: DataRecord } | null>(null);
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
  const adoptionRows = useMemo(() => {
    const definitions = revisions.data ?? [];
    return (adoptions.data ?? [])
      .filter(
        (item) =>
          item.definition_revision_id &&
          definitions.some((version) => version.id === item.definition_revision_id),
      )
      .map((item) => {
        const program = programs.data?.find((row) => row.id === item.program_id);
        const version = definitions.find((row) => row.id === item.definition_revision_id);
        const content = requirementContents.data
          ?.filter((row) => row.engineering_requirement_id === item.id)
          .sort((a, b) => b.version_number - a.version_number)[0];
        return {
          ...item,
          title: content?.title ?? "Requirement",
          programName: program?.name ?? null,
          definitionVersion: version?.version_number ?? null,
        };
      });
  }, [revisions.data, adoptions.data, programs.data, requirementContents.data]);
  const adoptionColumns = useMemo(
    () =>
      defineColumns<(typeof adoptionRows)[number]>((c) => [
        c.id("code", { header: "ID", width: 150 }),
        c.text("title", {
          header: "Requirement",
          hideable: false,
          cell: (row) => (
            <RecordLink table="engineering_requirements" record={row}>
              {row.title}
            </RecordLink>
          ),
        }),
        c.text("programName", {
          header: "Program",
          cell: (row) => (
            <TextLink
              render={<Link to="/programs/$programId" params={{ programId: row.program_id }} />}
            >
              {row.programName || <Absent />}
            </TextLink>
          ),
        }),
        c.number("definitionVersion", { header: "Definition version", width: 150 }),
      ]),
    [],
  );
  const adoptionTable = useDataTable({
    data: adoptionRows,
    columns: adoptionColumns,
    getRowId: (row) => row.id,
    label: "Requirement adoptions",
    view: "requirement-definition-adoptions",
    resizable: true,
    reorderable: true,
  });
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
  if (!definition.data)
    return (
      <LibraryLoading queries={[definition, revisions, adoptions, programs, requirementContents]}>
        <MissingRecord backTo="/library/requirements" kind="Requirement definition" />
      </LibraryLoading>
    );
  return (
    <LibraryLoading queries={[definition, revisions, adoptions, programs, requirementContents]}>
      <Stack space="space.200" className="animate-rise">
        <PageHeader>
          <PageHeader.Lead render={<Breadcrumb />}>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink render={<Link to="/library/requirements" />}>
                  Requirements
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{definition.data?.title}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </PageHeader.Lead>
          <PageHeader.Heading>
            <PageHeader.Title>{definition.data?.title}</PageHeader.Title>
          </PageHeader.Heading>
          {editable && definition.data && (
            <PageHeader.Actions>
              <DropdownMenu>
                <DropdownMenuTrigger render={<Button>Actions</Button>} />
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() =>
                      setEdit({
                        table: "requirement_definitions",
                        row: definition.data as unknown as DataRecord,
                      })
                    }
                  >
                    Edit requirement
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    disabled={createRevision.isPending}
                    onClick={() => void newVersion()}
                  >
                    Create requirement version
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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
                      })
                    }
                  >
                    Edit requirement version
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
            <Section title="Adopted by">
              <DataTable
                responsive
                table={adoptionTable}
                onRowClick={(row) =>
                  void navigate(recordDestination("engineering_requirements", row))
                }
                empty={{
                  illustration: "records",
                  title: "No adoptions yet",
                  description:
                    "Add a requirement from this definition in a program to record its adoption.",
                }}
                toolbar={
                  <Toolbar
                    search={String(adoptionTable.state.globalFilter ?? "")}
                    onSearch={(value) => adoptionTable.setGlobalFilter(value)}
                    placeholder="Find adopted requirements"
                    filters={<DataTable.Filter table={adoptionTable} column="programName" />}
                  >
                    <DataTable.Columns table={adoptionTable} />
                    <DataTable.Settings table={adoptionTable} />
                  </Toolbar>
                }
              />
            </Section>
          </Stack>
        ) : (
          <EmptyMessage title="No versions have been authored" />
        )}
      </Stack>
      <Shell.Aside label="Requirement definition properties">
        <Inspector.Group title="Details">
          <KeyValue label="Code">
            <Id>{definition.data.code}</Id>
          </KeyValue>
          <KeyValue label="Description" wrap>
            {definition.data.description || <Absent />}
          </KeyValue>
          <KeyValue label="Version">{current?.version_number ?? <Absent />}</KeyValue>
          <KeyValue label="State">{current?.state ?? <Absent />}</KeyValue>
          <KeyValue label="Published">
            {current?.published_at ? displayDate(current.published_at) : "Not published"}
          </KeyValue>
          <KeyValue label="Adopted by">{adopting.length} requirements</KeyValue>
        </Inspector.Group>
      </Shell.Aside>
    </LibraryLoading>
  );
}
