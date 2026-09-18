import { displayDate, statusTone } from "./work-format";
import { useCallback, useMemo, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Button,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  IconButton,
  DataTable,
  defineColumns,
  Inline,
  PreviewSheet,
  Section,
  Stack,
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
  RecordPreviewPanel,
  RecordPreviewActions,
  recordDestination,
  useDisplayedRecords,
} from "./record-preview";
import type { ReactNode } from "react";
import { ProductCollection } from "./product-collection";
import { MoreHorizontal, Plus } from "lucide-react";
import { useRows, type Row } from "@/lib/models";
import { labelFor, type DataRecord } from "@/lib/records";
import { useWorkspace } from "@/components/app/workspace";
import { EvidenceFile } from "@/components/app/evidence-file";
import { CreateEvidenceDialog } from "./create-evidence-dialog";
import { DetailFacts, ModelForm, QueryState, StatusBadge, type FormTarget } from "./work-common";

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
          width: 220,
          priority: 0,
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
      <ProductCollection
        table={table}
        queries={[artifacts, versions, reviews, programs, parties]}
        fill
        searchLabel="Find evidence"
        onRowClick={(row) => void navigate(recordDestination("evidence_artifacts", row))}
        empty={{
          illustration: "document",
          title: "No evidence yet",
          description:
            "Create an artifact and its first draft version, then attach its file and supporting relationships.",
        }}
        views={
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
        }
        filters={
          <>
            <DataTable.Filter table={table} column="review" />
            <DataTable.Filter table={table} column="kind" />
          </>
        }
        action={
          workspace.role !== "viewer" ? (
            <Button
              size="small"
              variant="primary"
              iconBefore={<Plus />}
              disabled={!!form || creating}
              onClick={() => setCreating(true)}
            >
              Create evidence artifact
            </Button>
          ) : undefined
        }
      />
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
          versionId={selectedVersionId}
          onSelectVersion={setSelectedVersionId}
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
  versionId,
  onSelectVersion: setVersionId,
  onClose,
  onEdit,
}: {
  artifact: Row<"evidence_artifacts">;
  navigation: ReactNode;
  versionId: string | null;
  onSelectVersion: (id: string | null) => void;
  onClose: () => void;
  onEdit: (target: FormTarget) => void;
}) {
  const workspace = useWorkspace();
  const versions = useRows("evidence_versions", { artifact_id: artifact.id });
  const parties = useRows("parties");
  const sorted = useMemo(
    () => [...(versions.data ?? [])].sort((a, b) => b.version_number - a.version_number),
    [versions.data],
  );
  const current = sorted.find((version) => version.id === versionId);
  const writable = workspace.role !== "viewer";
  const columns = useMemo(
    () =>
      defineColumns<Row<"evidence_versions">>((c) => [
        c.id("version_number", {
          header: "Version",
          priority: 0,
          width: 180,
          hideable: false,
          preview: (row) => setVersionId(row.id),
          active: (row) => row.id === versionId,
          cell: (row) => (
            <RecordLink table="evidence_versions" record={row}>
              Version {row.version_number}
            </RecordLink>
          ),
        }),
        c.status("state", { header: "State", width: 130, tone: (row) => statusTone(row.state) }),
        c.date("collected_at", { header: "Collected", width: 150 }),
        c.text("storage_object_name", {
          header: "File",
          width: 180,
          cell: (row) =>
            row.storage_object_id
              ? "Uploaded"
              : row.storage_object_name
                ? "Upload unfinished"
                : row.external_uri
                  ? "External reference"
                  : "No file",
        }),
      ]),
    [versionId, setVersionId],
  );
  const table = useDataTable({
    columns,
    data: sorted,
    getRowId: (row) => row.id,
    label: "Evidence versions",
  });
  const displayed = useDisplayedRecords(table);
  const createVersion = writable ? (
    <Button
      size="small"
      variant="primary"
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
  ) : undefined;
  return (
    <RecordPreviewPanel
      title={artifact.title}
      label="Evidence artifact preview"
      navigation={navigation}
      onClose={onClose}
      recordActions={
        writable ? (
          <Button
            size="small"
            variant="primary"
            onClick={() =>
              onEdit({ table: "evidence_artifacts", existing: artifact as DataRecord })
            }
          >
            Edit evidence artifact
          </Button>
        ) : undefined
      }
    >
      <Stack space="space.250">
        <DetailFacts
          facts={[
            ["Description", artifact.description],
            ["Kind", labelFor(artifact.artifact_kind)],
            ["Owner", parties.data?.find((party) => party.id === artifact.owner_party_id)?.name],
            ["Source", artifact.source_uri],
            ["Retain until", displayDate(artifact.retention_until)],
          ]}
        />
        <Section title="Versions">
          <ProductCollection
            table={table}
            queries={[versions]}
            searchLabel="Find versions"
            action={createVersion}
            empty={{
              illustration: "document",
              title: "No versions yet",
              description:
                "Create a draft version to upload a file or reference an external artifact.",
            }}
          />
        </Section>
        {current && (
          <PreviewSheet
            open
            onClose={() => setVersionId(null)}
            id={null}
            title={`${artifact.title} · Version ${current.version_number}`}
            navigation={
              <RecordPreviewActions
                table="evidence_versions"
                record={current}
                rows={displayed}
                onSelect={(row) => setVersionId(row.id)}
              />
            }
            openTo={
              <Link
                to="/records/$collection/$recordId"
                params={{ collection: "evidence_versions", recordId: current.id }}
                target="_blank"
                rel="noopener noreferrer"
              >
                Open the full record
              </Link>
            }
            actions={
              writable ? <EvidenceVersionActions version={current} onEdit={onEdit} /> : undefined
            }
          >
            <EvidenceVersion key={current.id} version={current} />
          </PreviewSheet>
        )}
      </Stack>
    </RecordPreviewPanel>
  );
}

const evidenceRelationships = [
  ["Requirement", "requirement_evidence"],
  ["Implementation", "implementation_evidence"],
  ["Observation", "observation_evidence"],
  ["Assessment finding", "finding_evidence"],
  ["Test run", "test_run_evidence"],
  ["Step result", "step_result_evidence"],
  ["Task", "task_evidence"],
  ["Operational issue", "issue_evidence"],
  ["Gate criterion", "gate_evidence"],
] as const;
function EvidenceVersionActions({
  version,
  onEdit,
}: {
  version: Row<"evidence_versions">;
  onEdit: (target: FormTarget) => void;
}) {
  const workspace = useWorkspace();
  const parties = useRows("parties");
  const me = parties.data?.find((party) => party.auth_user_id === workspace.userId);
  return (
    <Inline space="space.100">
      <Button
        size="small"
        variant="primary"
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
        Create evidence review
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <IconButton
              size="small"
              variant="subtle"
              label="Evidence version actions"
              icon={<MoreHorizontal />}
            />
          }
        />
        <DropdownMenuContent align="end">
          {version.state === "draft" && (
            <DropdownMenuItem
              onClick={() =>
                onEdit({ table: "evidence_versions", existing: version as DataRecord })
              }
            >
              Edit evidence version
            </DropdownMenuItem>
          )}
          {evidenceRelationships.map(([label, table]) => (
            <DropdownMenuItem
              key={table}
              onClick={() =>
                onEdit({
                  table,
                  operationLabel: `Link ${label.toLowerCase()}`,
                  initialValues: { evidence_version_id: version.id },
                })
              }
            >
              Link {label.toLowerCase()}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </Inline>
  );
}

function EvidenceVersion({ version }: { version: Row<"evidence_versions"> }) {
  const workspace = useWorkspace();
  const collection = workspace.collections.find((item) => item.name === "evidence_versions");
  const reviews = useRows("evidence_reviews", { evidence_version_id: version.id });
  const parties = useRows("parties");
  const safeExternal =
    version.external_uri && /^https?:\/\//i.test(version.external_uri)
      ? version.external_uri
      : null;
  return (
    <Stack space="space.250">
      <Section title="Version details">
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
      </Section>
      {collection && <EvidenceFile collection={collection} record={version as DataRecord} />}
      <EvidenceSupport versionId={version.id} />
      <Section title="Reviews">
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

function EvidenceSupport({ versionId }: { versionId: string }) {
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
    (group.query.data ?? []).map((row) => ({
      ...group,
      row: row as DataRecord,
      id: `${group.table}/${row.id}`,
    })),
  );
  const columns = defineColumns<(typeof links)[number]>((c) => [
    c.id("label", {
      header: "Supported record",
      priority: 0,
      width: 200,
      hideable: false,
      cell: (link) => (
        <RecordLink
          table={link.target as import("@/lib/models").TableName}
          record={{ id: String(link.row[link.column]) }}
        >
          Open {link.label.toLowerCase()}
        </RecordLink>
      ),
    }),
    c.text("table", { header: "Relationship", width: 180, cell: (link) => link.label }),
  ]);
  const table = useDataTable({
    data: links,
    columns,
    getRowId: (link) => `${link.table}/${link.row.id}`,
    label: "Evidence support relationships",
  });
  return (
    <Section title="Supports">
      <ProductCollection
        table={table}
        queries={groups.map((group) => group.query)}
        searchLabel="Find relationships"
        empty={{
          illustration: "tree",
          title: "No support relationships",
          description: "Link the controls, requirements or findings this evidence supports.",
        }}
      />
    </Section>
  );
}
