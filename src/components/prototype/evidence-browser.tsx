import { displayDate, statusTone } from "./work-format";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Button,
  DataTable,
  Toolbar,
  defineColumns,
  Inline,
  PreviewSheet,
  Section,
  Stack,
  Table,
  useDataTable,
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyMedia,
  EmptyIllustration,
  EmptyDescription,
} from "@ledger/design-system";
import {
  RecordLink,
  RecordPreviewActions,
  recordDestination,
  useDisplayedRecords,
} from "./record-preview";
import type { ReactNode } from "react";
import { Plus } from "lucide-react";
import { useRows, type Row } from "@/lib/models";
import { labelFor, type DataRecord } from "@/lib/records";
import { useWorkspace } from "@/components/app/workspace";
import { EvidenceFile } from "@/components/app/evidence-file";
import { CreateEvidenceDialog } from "./create-evidence-dialog";
import {
  DetailFacts,
  ModelForm,
  QueryState,
  SchemaLink,
  StatusBadge,
  type FormTarget,
} from "./work-common";

type EvidenceRow = Row<"evidence_artifacts"> & {
  program: string;
  kind: string;
  owner: string;
  version: string;
  collected: string | undefined;
  review: string;
};
export function EvidenceBrowser({ programId }: { programId?: string }) {
  const workspace = useWorkspace();
  const navigate = useNavigate();
  const artifacts = useRows("evidence_artifacts", programId ? { program_id: programId } : {});
  const versions = useRows("evidence_versions");
  const reviews = useRows("evidence_reviews");
  const programs = useRows("programs");
  const parties = useRows("parties");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<FormTarget | null>(null);
  const selected = artifacts.data?.find((row) => row.id === selectedId);
  const rows = useMemo<EvidenceRow[]>(
    () =>
      (artifacts.data ?? []).map((artifact) => {
        const latest = (versions.data ?? [])
          .filter((version) => version.artifact_id === artifact.id)
          .sort((a, b) => b.version_number - a.version_number)[0];
        const review = latest
          ? (reviews.data ?? [])
              .filter((item) => item.evidence_version_id === latest.id)
              .sort((a, b) =>
                (b.reviewed_at ?? b.created_at).localeCompare(a.reviewed_at ?? a.created_at),
              )[0]
          : undefined;
        return {
          ...artifact,
          program: artifact.program_id
            ? (programs.data?.find((program) => program.id === artifact.program_id)?.name ??
              "Unavailable program")
            : "Not recorded",
          kind: labelFor(artifact.artifact_kind),
          owner: artifact.owner_party_id
            ? (parties.data?.find((party) => party.id === artifact.owner_party_id)?.name ??
              "Unavailable person")
            : "Not recorded",
          version: latest ? `Version ${latest.version_number}` : "No versions",
          collected: latest?.collected_at ?? undefined,
          review: review ? labelFor(review.decision) : "Not reviewed",
        };
      }),
    [artifacts.data, versions.data, reviews.data, programs.data, parties.data],
  );
  const openPreview = useCallback(
    (row: EvidenceRow) => {
      if (!form && !creating) {
        setSelectedId(row.id);
        setSelectedVersionId(null);
      }
    },
    [form, creating],
  );
  const columns = useMemo(
    () =>
      defineColumns<EvidenceRow>((c) => [
        c.id("title", {
          header: "Artifact",
          width: 300,
          hideable: false,
          preview: openPreview,
          active: (row) => row.id === selectedId,
          cell: (row) => (
            <RecordLink table="evidence_artifacts" record={row}>
              {row.title}
            </RecordLink>
          ),
        }),
        ...(programId ? [] : [c.text("program", { header: "Program", width: 170 })]),
        c.text("kind", { header: "Kind", width: 120 }),
        c.text("owner", { header: "Owner", width: 170 }),
        c.text("version", { header: "Version", width: 105 }),
        c.date("collected", { header: "Collected", width: 135 }),
        c.status("review", {
          header: "Latest review",
          width: 150,
          tone: (row) => statusTone(row.review.toLowerCase().replaceAll(" ", "_")),
        }),
      ]),
    [programId, selectedId, openPreview],
  );
  const table = useDataTable({
    data: rows,
    columns,
    getRowId: (row) => row.id,
    label: "Evidence",
    view: `evidence-${programId ?? "all"}`,
    pageSize: 20,
    resizable: true,
    reorderable: true,
  });
  const displayed = useDisplayedRecords(table);
  return (
    <Stack space="space.150">
      {creating && (
        <CreateEvidenceDialog
          programId={programId}
          onClose={() => setCreating(false)}
          onCreated={(result) => {
            setSelectedId(result.artifactId);
            setSelectedVersionId(result.versionId);
          }}
        />
      )}
      {form && (
        <ModelForm
          target={form}
          onClose={() => setForm(null)}
          onSaved={(record) => {
            if (form.table === "evidence_artifacts") setSelectedId(record.id);
          }}
        />
      )}
      <QueryState queries={[artifacts, versions, reviews, programs, parties]}>
        <DataTable
          responsive
          table={table}
          fill
          onRowClick={(row) => void navigate(recordDestination("evidence_artifacts", row))}
          empty={{
            illustration: "document",
            title: "No evidence yet",
            description:
              "Add an artifact and its first draft version, then attach its file and supporting relationships.",
            action:
              workspace.role !== "viewer" ? (
                <Button
                  variant="primary"
                  iconBefore={<Plus />}
                  disabled={!!form || creating}
                  onClick={() => setCreating(true)}
                >
                  Create evidence artifact
                </Button>
              ) : undefined,
          }}
          toolbar={
            <Toolbar
              search={String(table.state.globalFilter ?? "")}
              onSearch={(value) => table.setGlobalFilter(value)}
              placeholder="Find evidence"
              views={
                <>
                  <DataTable.Presets
                    table={table}
                    variant="menu"
                    presets={[
                      { id: "all", label: "All evidence" },
                      {
                        id: "pending",
                        label: "Not reviewed",
                        filters: [{ id: "review", value: ["Not reviewed", "Pending"] }],
                      },
                      {
                        id: "revision",
                        label: "Needs revision",
                        filters: [{ id: "review", value: ["Needs revision"] }],
                      },
                    ]}
                  />
                </>
              }
              filters={
                <>
                  <DataTable.Filter table={table} column="review" />
                  <DataTable.Filter table={table} column="kind" />
                </>
              }
              actions={
                <>
                  {workspace.role !== "viewer" && (
                    <Button
                      size="small"
                      variant="primary"
                      iconBefore={<Plus />}
                      disabled={!!form || creating}
                      onClick={() => setCreating(true)}
                    >
                      Create evidence artifact
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
      </QueryState>
      {selected && !form && !creating && (
        <EvidencePreview
          artifact={selected}
          navigation={
            <RecordPreviewActions
              table="evidence_artifacts"
              record={selected}
              rows={displayed}
              onSelect={openPreview}
            />
          }
          initialVersionId={selectedVersionId}
          onClose={() => setSelectedId(null)}
          onEdit={setForm}
        />
      )}
    </Stack>
  );
}

function EvidencePreview({
  artifact,
  navigation,
  initialVersionId,
  onClose,
  onEdit,
}: {
  artifact: Row<"evidence_artifacts">;
  navigation: ReactNode;
  initialVersionId: string | null;
  onClose: () => void;
  onEdit: (target: FormTarget) => void;
}) {
  const workspace = useWorkspace();
  const versions = useRows("evidence_versions", { artifact_id: artifact.id });
  const parties = useRows("parties");
  const [versionId, setVersionId] = useState<string | null>(initialVersionId);
  useEffect(() => setVersionId(initialVersionId), [artifact.id, initialVersionId]);
  const sorted = [...(versions.data ?? [])].sort((a, b) => b.version_number - a.version_number);
  const current = sorted.find((version) => version.id === versionId) ?? sorted[0];
  const writable = workspace.role !== "viewer";
  return (
    <PreviewSheet
      open
      onClose={onClose}
      id={null}
      navigation={navigation}
      title={artifact.title}
      openTo={
        <Link
          to="/records/$collection/$recordId"
          params={{ collection: "evidence_artifacts", recordId: artifact.id }}
          target="_blank"
          rel="noopener noreferrer"
        >
          Open the full record
        </Link>
      }
      actions={
        writable ? (
          <Button
            size="small"
            variant="primary"
            onClick={() =>
              onEdit({ table: "evidence_artifacts", existing: artifact as DataRecord })
            }
          >
            Edit artifact
          </Button>
        ) : undefined
      }
    >
      <Stack space="space.250">
        <Section title="Artifact">
          <p className="whitespace-pre-wrap pb-200">
            {artifact.description || "No description recorded."}
          </p>
          <DetailFacts
            facts={[
              ["Kind", labelFor(artifact.artifact_kind)],
              [
                "Owner",
                artifact.owner_party_id
                  ? (parties.data?.find((party) => party.id === artifact.owner_party_id)?.name ??
                    "Unavailable person")
                  : null,
              ],
              ["Source", artifact.source_uri],
              ["Retain until", displayDate(artifact.retention_until)],
            ]}
          />
        </Section>
        <Section
          title="Versions"
          action={
            writable ? (
              <Button
                size="small"
                disabled={versions.isPending || versions.isError}
                onClick={() =>
                  onEdit({
                    table: "evidence_versions",
                    initialValues: {
                      artifact_id: artifact.id,
                      version_number: (sorted[0]?.version_number ?? 0) + 1,
                    },
                  })
                }
              >
                Create evidence version
              </Button>
            ) : undefined
          }
        >
          <QueryState queries={[versions]}>
            {sorted.length ? (
              <Table>
                <thead>
                  <tr>
                    <Table.Header>Version</Table.Header>
                    <Table.Header>State</Table.Header>
                    <Table.Header>Collected</Table.Header>
                    <Table.Header>File</Table.Header>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((version) => (
                    <Table.Row key={version.id} isSelected={current?.id === version.id}>
                      <Table.Cell>
                        <Button
                          size="small"
                          variant="subtle"
                          onClick={() => setVersionId(version.id)}
                        >
                          Version {version.version_number}
                        </Button>
                      </Table.Cell>
                      <Table.Cell>
                        <StatusBadge value={version.state} />
                      </Table.Cell>
                      <Table.Cell>{displayDate(version.collected_at)}</Table.Cell>
                      <Table.Cell>
                        {version.storage_object_id
                          ? "Uploaded"
                          : version.storage_object_name
                            ? "Upload unfinished"
                            : version.external_uri
                              ? "External reference"
                              : "No file"}
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </tbody>
              </Table>
            ) : (
              <Empty>
                <EmptyMedia aria-hidden>
                  <EmptyIllustration kind="document" />
                </EmptyMedia>
                <EmptyHeader>
                  <EmptyTitle>No versions yet</EmptyTitle>
                  <EmptyDescription>
                    Create a draft version to upload a file or reference an external artifact.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            )}
          </QueryState>
        </Section>
        {current && <EvidenceVersion key={current.id} version={current} onEdit={onEdit} />}
      </Stack>
    </PreviewSheet>
  );
}

function EvidenceVersion({
  version,
  onEdit,
}: {
  version: Row<"evidence_versions">;
  onEdit: (target: FormTarget) => void;
}) {
  const workspace = useWorkspace();
  const collection = workspace.collections.find((item) => item.name === "evidence_versions");
  const reviews = useRows("evidence_reviews", { evidence_version_id: version.id });
  const parties = useRows("parties");
  const me = parties.data?.find((party) => party.auth_user_id === workspace.userId);
  const writable = workspace.role !== "viewer";
  const safeExternal =
    version.external_uri && /^https?:\/\//i.test(version.external_uri)
      ? version.external_uri
      : null;
  return (
    <Stack space="space.250">
      <Section
        title={`Version ${version.version_number}`}
        action={
          writable && version.state === "draft" ? (
            <Button
              size="small"
              onClick={() =>
                onEdit({ table: "evidence_versions", existing: version as DataRecord })
              }
            >
              Edit version
            </Button>
          ) : undefined
        }
      >
        <DetailFacts
          facts={[
            ["State", <StatusBadge value={version.state} />],
            ["Provenance", version.provenance],
            ["Collected", displayDate(version.collected_at)],
            ["Expires", displayDate(version.expires_at)],
            [
              "External reference",
              safeExternal ? (
                <a href={safeExternal} target="_blank" rel="noreferrer" className="underline">
                  Open external artifact
                </a>
              ) : (
                version.external_uri
              ),
            ],
            ["Media type", version.media_type],
            ["Bytes", version.byte_size],
            ["SHA-256", version.sha256],
          ]}
        />
        <div className="pt-200">
          <SchemaLink table="evidence_versions" id={version.id} />
        </div>
      </Section>
      {collection && <EvidenceFile collection={collection} record={version as DataRecord} />}
      <EvidenceSupport versionId={version.id} onEdit={onEdit} />
      <Section
        title="Reviews"
        action={
          writable ? (
            <Button
              size="small"
              onClick={() =>
                onEdit({
                  table: "evidence_reviews",
                  initialValues: {
                    evidence_version_id: version.id,
                    ...(me ? { reviewer_party_id: me.id } : {}),
                  },
                })
              }
            >
              Record review
            </Button>
          ) : undefined
        }
      >
        <QueryState queries={[reviews, parties]}>
          {reviews.data?.length ? (
            <Stack space="space.150">
              {[...reviews.data]
                .sort((a, b) =>
                  (b.reviewed_at ?? b.created_at).localeCompare(a.reviewed_at ?? a.created_at),
                )
                .map((review) => (
                  <div key={review.id} className="border-b border-default py-150">
                    <Inline space="space.100" alignBlock="center">
                      <StatusBadge value={review.decision} />
                      <span>
                        {parties.data?.find((party) => party.id === review.reviewer_party_id)
                          ?.name ?? "Unavailable reviewer"}
                      </span>
                    </Inline>
                    <p className="whitespace-pre-wrap pt-100">
                      {review.rationale || "No rationale recorded."}
                    </p>
                    <p className="font-body-small text-subtle">{displayDate(review.reviewed_at)}</p>
                  </div>
                ))}
            </Stack>
          ) : (
            <Empty>
              <EmptyMedia aria-hidden>
                <EmptyIllustration kind="done" />
              </EmptyMedia>
              <EmptyHeader>
                <EmptyTitle>Not reviewed yet</EmptyTitle>
                <EmptyDescription>
                  Review decisions are recorded for this exact evidence version.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </QueryState>
      </Section>
    </Stack>
  );
}

function EvidenceSupport({
  versionId,
  onEdit,
}: {
  versionId: string;
  onEdit: (target: FormTarget) => void;
}) {
  const workspace = useWorkspace();
  const filter = { evidence_version_id: versionId };
  const requirements = useRows("requirement_evidence", filter);
  const implementations = useRows("implementation_evidence", filter);
  const observations = useRows("observation_evidence", filter);
  const findings = useRows("finding_evidence", filter);
  const runs = useRows("test_run_evidence", filter);
  const steps = useRows("step_result_evidence", filter);
  const tasks = useRows("task_evidence", filter);
  const issues = useRows("issue_evidence", filter);
  const gates = useRows("gate_evidence", filter);
  const groups = [
    {
      label: "Requirement",
      table: "requirement_evidence" as const,
      query: requirements,
      column: "requirement_revision_id",
      target: "requirement_revisions",
    },
    {
      label: "Implementation",
      table: "implementation_evidence" as const,
      query: implementations,
      column: "implementation_statement_id",
      target: "implementation_statements",
    },
    {
      label: "Observation",
      table: "observation_evidence" as const,
      query: observations,
      column: "observation_id",
      target: "observations",
    },
    {
      label: "Finding",
      table: "finding_evidence" as const,
      query: findings,
      column: "finding_id",
      target: "assessment_findings",
    },
    {
      label: "Test run",
      table: "test_run_evidence" as const,
      query: runs,
      column: "test_run_id",
      target: "test_runs",
    },
    {
      label: "Step result",
      table: "step_result_evidence" as const,
      query: steps,
      column: "step_result_id",
      target: "step_results",
    },
    {
      label: "Task",
      table: "task_evidence" as const,
      query: tasks,
      column: "task_id",
      target: "tasks",
    },
    {
      label: "Issue",
      table: "issue_evidence" as const,
      query: issues,
      column: "issue_id",
      target: "operational_issues",
    },
    {
      label: "Gate criterion",
      table: "gate_evidence" as const,
      query: gates,
      column: "gate_criterion_id",
      target: "gate_criteria",
    },
  ];
  const links = groups.flatMap((group) =>
    (group.query.data ?? []).map((row) => ({ ...group, row: row as DataRecord })),
  );
  return (
    <Section title="Supports">
      <Stack space="space.150">
        <QueryState queries={groups.map((group) => group.query)}>
          {links.length ? (
            <Table>
              <thead>
                <tr>
                  <Table.Header>Relationship</Table.Header>
                  <Table.Header>Supported record</Table.Header>
                </tr>
              </thead>
              <tbody>
                {links.map((link) => (
                  <Table.Row key={`${link.table}/${link.row.id}`}>
                    <Table.Cell>{link.label}</Table.Cell>
                    <Table.Cell>
                      <SchemaLink table={link.target} id={String(link.row[link.column])}>
                        Open {link.label.toLowerCase()}
                      </SchemaLink>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </tbody>
            </Table>
          ) : (
            <Empty>
              <EmptyMedia aria-hidden>
                <EmptyIllustration kind="tree" />
              </EmptyMedia>
              <EmptyHeader>
                <EmptyTitle>No support relationships</EmptyTitle>
                <EmptyDescription>
                  Link the controls, requirements or findings this evidence supports.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </QueryState>
        {workspace.role !== "viewer" && (
          <Inline space="space.100" shouldWrap>
            {groups.map((group) => (
              <Button
                size="small"
                key={group.table}
                onClick={() => onEdit({ table: group.table, initialValues: filter })}
              >
                Link {group.label.toLowerCase()}
              </Button>
            ))}
          </Inline>
        )}
      </Stack>
    </Section>
  );
}
