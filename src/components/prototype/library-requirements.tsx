import { StatusBadge } from "@/components/app/status";
import { useWorkspace } from "@/components/app/workspace";
import { useRow, useRows, type Row } from "@/lib/models";
import { labelFor, type DataRecord, type RecordValue } from "@/lib/records";
import { revisionStates, statusLabel } from "@/lib/status";
import {
  Absent,
  Button,
  DataTable,
  DateTime,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Id,
  Inspector,
  KeyValue,
  PageHeader,
  Prose,
  Section,
  Shell,
  Stack,
  TextLink,
  defineColumns,
  toast,
  useDataTable,
  useLedgerLocale,
} from "@ledger/design-system";
import { Link, useNavigate } from "@tanstack/react-router";
import { ChevronDown, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { LibrarySelect, QueryValue } from "./library-shared";
import { canAuthorLibrary, nextVersionNumber, usePublishVersion } from "./library-utils";
import { ProductCollection } from "./product-collection";
import { ProductRecordDialog } from "./product-record-dialog";
import { RecordLink, recordDestination, useDisplayedRecords } from "./record-preview";
import { RecordSummaryPreview } from "./record-summary-preview";
import { RecordTrail, TrailLink } from "./record-trail";
import { EmptyMessage, MissingRecord, QueryState } from "./work-common";

/** A definition with what its versions say: the latest version and state, the published text. */
type LibraryRow = Row<"requirement_definitions"> & {
  version: number | null;
  status: string | null;
  type: string | null;
  statement: string | null;
  adopted: number;
};

/** The reusable requirements library: definitions, each with published versions programs adopt by reference. */
export function RequirementLibraryIndex() {
  const navigate = useNavigate();
  const workspace = useWorkspace();
  const definitions = useRows("requirement_definitions");
  const revisions = useRows("requirement_definition_revisions");
  const adoptions = useRows(
    "engineering_requirements",
    {},
    { columns: ["id", "program_id", "definition_revision_id"] },
  );
  const [creating, setCreating] = useState(false);
  const [selected, setSelected] = useState<LibraryRow | null>(null);
  const rows = useMemo(
    () =>
      (definitions.data ?? []).map((definition): LibraryRow => {
        const versions = (revisions.data ?? [])
          .filter((row) => row.requirement_definition_id === definition.id)
          .sort((a, b) => b.version_number - a.version_number);
        const latest = versions[0];
        const published = versions.find((row) => row.state === "published");
        const shown = published ?? latest;
        const versionIds = new Set(versions.map((row) => row.id));
        return {
          ...definition,
          version: latest?.version_number ?? null,
          status: latest?.state ?? null,
          type: shown ? labelFor(shown.requirement_type) : null,
          statement: shown?.statement ?? null,
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
      defineColumns<LibraryRow>((c) => [
        c.id("code", {
          header: "ID",
          width: 150,
          priority: 1,
          preview: setSelected,
          active: (row) => row.id === selected?.id,
        }),
        c.text("title", {
          header: "Requirement definition",
          hideable: false,
          priority: 0,
          width: 220,
          cell: (row) => (
            <RecordLink table="requirement_definitions" record={row}>
              {row.title}
            </RecordLink>
          ),
        }),
        c.text("statement", { header: "Statement", minWidth: 280, wrap: true }),
        c.text("type", { header: "Type", width: 130 }),
        c.number("version", { header: "Latest version", width: 120 }),
        c.number("adopted", { header: "Programs", width: 100 }),
        c.status("status", { header: "State", width: 130, statuses: revisionStates }),
      ]),
    [selected?.id],
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
  const displayed = useDisplayedRecords(table);
  const canCreate = canAuthorLibrary(workspace.role);
  const create = (size: "small" | "medium") => (
    <Button size={size} variant="primary" iconBefore={<Plus />} onClick={() => setCreating(true)}>
      Create requirement
    </Button>
  );
  return (
    <Stack space="space.200" className="animate-rise">
      <PageHeader>
        <PageHeader.Heading>
          <PageHeader.Title>Requirements</PageHeader.Title>
        </PageHeader.Heading>
      </PageHeader>
      {creating && (
        <ProductRecordDialog
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
      <ProductCollection
        table={table}
        queries={[definitions, revisions, adoptions]}
        fill
        onRowClick={(row) => {
          void navigate({
            to: "/library/requirements/$definitionKey",
            params: { definitionKey: row.id },
          });
        }}
        empty={{
          action: canCreate ? create("medium") : undefined,
          illustration: "shield",
          title: "No reusable requirements",
          description: canCreate
            ? "Create a requirement definition, then author and publish its first version."
            : "Requirement definitions an editor creates here appear in this library.",
        }}
        searchLabel="Find requirements"
        filters={
          <>
            <DataTable.Filter table={table} column="type" />
            <DataTable.Filter table={table} column="status" />
          </>
        }
        action={canCreate ? create("small") : undefined}
      />
      {selected && (
        <RecordSummaryPreview
          model="requirement_definitions"
          fields={[
            { key: "code", label: "Code", render: (row) => <Id>{row.code}</Id> },
            {
              key: "description",
              label: "Description",
              render: (row) => row.description || <Absent label="Not recorded" />,
            },
            {
              key: "version",
              label: "Latest version",
              render: (row) => row.version ?? <Absent label="No versions" />,
            },
            {
              key: "status",
              label: "State",
              render: (row) => (
                <StatusBadge
                  statuses={revisionStates}
                  value={row.status}
                  absentLabel="No versions"
                />
              ),
            },
            {
              key: "statement",
              label: "Statement",
              render: (row) => row.statement ?? <Absent label="Not recorded" />,
            },
            {
              key: "type",
              label: "Type",
              render: (row) => row.type ?? <Absent label="Not recorded" />,
            },
            { key: "adopted", label: "Programs" },
          ]}
          record={rows.find((row) => row.id === selected.id) ?? selected}
          rows={displayed}
          onSelect={setSelected}
          onClose={() => setSelected(null)}
        />
      )}
    </Stack>
  );
}

type EditTarget = {
  table: "requirement_definitions" | "requirement_definition_revisions";
  existing?: DataRecord;
  initialValues?: Record<string, RecordValue>;
  onSaved?: (record: DataRecord) => void;
};

export function RequirementLibraryRecord({
  id,
  initialVersion,
}: {
  id: string;
  initialVersion?: string;
}) {
  const navigate = useNavigate();
  const locale = useLedgerLocale();
  const workspace = useWorkspace();
  const definition = useRow("requirement_definitions", id);
  const revisions = useRows("requirement_definition_revisions", { requirement_definition_id: id });
  const adoptions = useRows(
    "engineering_requirements",
    {},
    { columns: ["id", "code", "program_id", "definition_revision_id"] },
  );
  const requirementContents = useRows(
    "requirement_revisions",
    {},
    { columns: ["id", "engineering_requirement_id", "version_number", "title"] },
  );
  const programs = useRows("programs", {}, { columns: ["id", "name"] });
  const publishing = usePublishVersion(
    "requirement_definition_revisions",
    "Programs can adopt it once it is published.",
  );
  const [selectedVersion, setSelectedVersion] = useState(initialVersion ?? "");
  const [edit, setEdit] = useState<EditTarget | null>(null);
  const versions = useMemo(
    () => [...(revisions.data ?? [])].sort((a, b) => b.version_number - a.version_number),
    [revisions.data],
  );
  const current =
    versions.find(
      (revision) =>
        revision.id === selectedVersion || String(revision.version_number) === selectedVersion,
    ) ?? versions[0];
  const editable = canAuthorLibrary(workspace.role);
  const adoptionRows = useMemo(() => {
    const versionById = new Map(versions.map((version) => [version.id, version]));
    const programById = new Map((programs.data ?? []).map((row) => [row.id, row]));
    return (adoptions.data ?? [])
      .filter((item) => item.definition_revision_id && versionById.has(item.definition_revision_id))
      .map((item) => {
        const content = requirementContents.data
          ?.filter((row) => row.engineering_requirement_id === item.id)
          .sort((a, b) => b.version_number - a.version_number)[0];
        return {
          ...item,
          title: content?.title ?? item.code,
          programName: programById.get(item.program_id)?.name ?? null,
          definitionVersion: versionById.get(item.definition_revision_id ?? "")?.version_number,
        };
      });
  }, [versions, adoptions.data, programs.data, requirementContents.data]);
  const [adoptionPreview, setAdoptionPreview] = useState<(typeof adoptionRows)[number] | null>(
    null,
  );
  const adoptionColumns = useMemo(
    () =>
      defineColumns<(typeof adoptionRows)[number]>((c) => [
        c.id("code", {
          header: "ID",
          width: 150,
          priority: 1,
          preview: setAdoptionPreview,
          active: (row) => row.id === adoptionPreview?.id,
        }),
        c.text("title", {
          header: "Requirement",
          hideable: false,
          priority: 0,
          minWidth: 220,
          cell: (row) => (
            <RecordLink table="engineering_requirements" record={row}>
              {row.title}
            </RecordLink>
          ),
        }),
        c.text("programName", {
          header: "Program",
          cell: (row) =>
            row.programName ? (
              <TextLink
                render={<Link to="/programs/$programId" params={{ programId: row.program_id }} />}
              >
                {row.programName}
              </TextLink>
            ) : (
              <Absent label="Not available" />
            ),
        }),
        c.number("definitionVersion", { header: "Definition version", width: 150 }),
      ]),
    [adoptionPreview?.id],
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
  const displayedAdoptions = useDisplayedRecords(adoptionTable);
  function selectVersion(versionId: string) {
    setSelectedVersion(versionId);
    // The version is part of the address, so a reload, Back or a shared link keeps it.
    void navigate({
      to: "/library/requirements/$definitionKey",
      params: { definitionKey: id },
      search: (previous) => ({ ...previous, version: versionId }),
      replace: true,
    });
  }
  function createVersion() {
    const next = nextVersionNumber(versions);
    // A new version starts from the one on screen; with none, its required fields start empty.
    setEdit({
      table: "requirement_definition_revisions",
      initialValues: {
        requirement_definition_id: id,
        version_number: next,
        ...(current
          ? {
              statement: current.statement,
              acceptance_criteria: current.acceptance_criteria,
              requirement_type: current.requirement_type,
              rationale: current.rationale,
            }
          : {}),
      },
      onSaved: (record) => {
        selectVersion(record.id);
        toast.add({
          title: `Version ${String(record["version_number"] ?? next)} created`,
          type: "success",
        });
      },
    });
  }
  if (!definition.data)
    return (
      <QueryState queries={[definition]}>
        <MissingRecord backTo="/library/requirements" kind="Requirement definition" />
      </QueryState>
    );
  const record = definition.data;
  return (
    <>
      <Stack space="space.200" className="animate-rise">
        <PageHeader>
          <RecordTrail current={record.title}>
            <TrailLink to="/library/requirements">Requirements</TrailLink>
          </RecordTrail>
          <PageHeader.Heading>
            <PageHeader.Title>{record.title}</PageHeader.Title>
          </PageHeader.Heading>
          {editable && (
            <PageHeader.Actions>
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={<Button iconAfter={<ChevronDown />}>Actions</Button>}
                />
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() =>
                      setEdit({
                        table: "requirement_definitions",
                        existing: record as unknown as DataRecord,
                      })
                    }
                  >
                    Edit requirement
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    {...(revisions.data
                      ? {}
                      : {
                          disabledReason: revisions.isError
                            ? "The versions could not be loaded."
                            : "The versions are still loading.",
                        })}
                    onClick={createVersion}
                  >
                    Create requirement version
                  </DropdownMenuItem>
                  {current?.state === "draft" && (
                    <>
                      <DropdownMenuItem
                        onClick={() =>
                          setEdit({
                            table: "requirement_definition_revisions",
                            existing: current as unknown as DataRecord,
                          })
                        }
                      >
                        Edit requirement version
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => void publishing.publish(current)}>
                        Publish version
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
              {publishing.confirmation}
            </PageHeader.Actions>
          )}
        </PageHeader>
        {edit && (
          <ProductRecordDialog
            table={edit.table}
            {...(edit.existing ? { existing: edit.existing } : {})}
            initialValues={edit.initialValues ?? { requirement_definition_id: id }}
            onSaved={edit.onSaved}
            onClose={() => setEdit(null)}
          />
        )}
        <Prose label="Description" className="max-w-layout-measure">
          {record.description || <Absent label="Not recorded" />}
        </Prose>
        <QueryState queries={[revisions]}>
          {current ? (
            <Stack space="space.300">
              <Stack space="space.200" className="max-w-layout-measure">
                <Prose label="Statement" size="large">
                  {current.statement}
                </Prose>
                <Prose label="Acceptance criteria">{current.acceptance_criteria}</Prose>
                {current.rationale && <Prose label="Rationale">{current.rationale}</Prose>}
              </Stack>
              <Section title="Adopted by">
                <ProductCollection
                  table={adoptionTable}
                  queries={[adoptions, programs, requirementContents]}
                  onRowClick={(row) =>
                    void navigate(recordDestination("engineering_requirements", row))
                  }
                  empty={{
                    illustration: "records",
                    title: "No adoptions yet",
                    description:
                      "A program adopts a published version when it adds a requirement from this definition.",
                  }}
                  fill
                  searchLabel="Find adopted requirements"
                  filters={<DataTable.Filter table={adoptionTable} column="programName" />}
                />
              </Section>
            </Stack>
          ) : (
            <EmptyMessage
              illustration="shield"
              title="No versions yet"
              description={
                editable
                  ? "Author the first version: its statement, acceptance criteria and type. Programs adopt a version once it is published."
                  : "An editor authors this definition's versions; programs adopt a version once it is published."
              }
              action={
                editable ? (
                  <Button variant="primary" iconBefore={<Plus />} onClick={createVersion}>
                    Create requirement version
                  </Button>
                ) : undefined
              }
            />
          )}
        </QueryState>
      </Stack>
      {adoptionPreview && (
        <RecordSummaryPreview
          model="engineering_requirements"
          fields={[
            { key: "code", label: "Code", render: (row) => <Id>{row.code}</Id> },
            {
              key: "programName",
              label: "Program",
              render: (row) => row.programName ?? <Absent label="Not available" />,
            },
            {
              key: "definitionVersion",
              label: "Definition version",
              render: (row) => row.definitionVersion ?? <Absent label="Not recorded" />,
            },
          ]}
          record={adoptionPreview}
          rows={displayedAdoptions}
          onSelect={setAdoptionPreview}
          onClose={() => setAdoptionPreview(null)}
        />
      )}
      <Shell.Aside label="Requirement definition details">
        <Stack space="space.200">
          {versions.length > 1 && current && (
            <LibrarySelect
              label="Version"
              value={current.id}
              options={versions.map((revision) => ({
                value: revision.id,
                label: `Version ${revision.version_number} · ${statusLabel(revisionStates, revision.state)}`,
              }))}
              onChange={selectVersion}
            />
          )}
          <Inspector.Group title="Details">
            <KeyValue.Group layout="columns">
              <KeyValue label="Code">
                <Id>{record.code}</Id>
              </KeyValue>
              <KeyValue label="Version">
                <QueryValue queries={[revisions]}>
                  {() => current?.version_number ?? <Absent label="No versions" />}
                </QueryValue>
              </KeyValue>
              <KeyValue label="State">
                <QueryValue queries={[revisions]}>
                  {() => (
                    <StatusBadge
                      statuses={revisionStates}
                      value={current?.state}
                      absentLabel="No versions"
                    />
                  )}
                </QueryValue>
              </KeyValue>
              <KeyValue label="Type">
                {current ? labelFor(current.requirement_type) : <Absent label="Not recorded" />}
              </KeyValue>
              <KeyValue label="Published">
                <DateTime value={current?.published_at ?? null} absentLabel="Not published" />
              </KeyValue>
              <KeyValue label="Adopted by">
                <QueryValue queries={[revisions, adoptions]}>
                  {() =>
                    locale.formatPlural(adoptionRows.length, {
                      one: "{count} requirement",
                      other: "{count} requirements",
                    })
                  }
                </QueryValue>
              </KeyValue>
            </KeyValue.Group>
          </Inspector.Group>
        </Stack>
      </Shell.Aside>
    </>
  );
}
