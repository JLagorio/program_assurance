// A control's Evidence tab, on the program's record of the control (board impl-control of the
// November 2026 UX proposal): the evidence the program's requirements that map the control cite, at
// their latest revisions, one line an evidence version. Each says its artifact (opening the
// version), the version, its latest review (Not reviewed where it has none; the newest by when it
// was decided, else recorded, as the evidence register reads it), who that review names
// (No reviewer where it names nobody), the requirements that cite it by code, when it was collected
// and when it expires. The tab's only content is the collection, so its one small primary is Add
// evidence, done on the control (`ControlAddEvidence` in control-add-evidence), for a reader who
// may write once a requirement maps the control. Which requirements map it is the trace's answer
// (`assurance_trace`); the lines are `citedEvidence` in control-work.

import { useMemo, useState } from "react";
import { Absent, Button, DateLabel, Person, defineColumns } from "@ledger/design-system";
import { Plus } from "lucide-react";
import { StatusBadge } from "@/components/app/status";
import { useWorkspace } from "@/components/app/workspace";
import { useAssuranceTrace } from "@/lib/assurance-trace";
import { citedEvidence, useLatestRevisions, type CitedEvidence } from "@/lib/control-work";
import { idSet, useRows } from "@/lib/models";
import { labelFor } from "@/lib/records";
import { evidenceReviewDecisions, type StatusVocabulary } from "@/lib/status";
import { useCollectionTable } from "./collection-question";
import { ControlAddEvidence } from "./control-add-evidence";
import { ProductCollection } from "./product-collection";
import { RecordLink, useOpenRecord } from "./record-preview";

/** The latest review's decision, and Not reviewed where the version has none. */
const reviewStates: StatusVocabulary = {
  not_reviewed: { label: "Not reviewed", tone: "neutral", rank: -1 },
  ...evidenceReviewDecisions,
};

type Line = CitedEvidence & {
  versionLabel: string;
  /** Who the latest review names, by name; none where it names nobody. */
  reviewer: string | null;
};

export function ControlEvidencePanel({
  programId,
  controlId,
}: {
  programId: string;
  controlId: string;
}) {
  const workspace = useWorkspace();
  const openRecord = useOpenRecord();
  const trace = useAssuranceTrace({ kind: "control", id: controlId, programId });
  const requirements = trace.data?.requirements;
  const requirementIds = useMemo(() => requirements?.map((row) => row.id), [requirements]);
  const { revisions, latest } = useLatestRevisions(requirementIds);
  const latestIds = useMemo(() => idSet([...latest.values()]), [latest]);
  const links = useRows(
    "requirement_evidence",
    { requirement_revision_id: latestIds },
    {
      columns: ["id", "requirement_revision_id", "evidence_version_id"],
      enabled: revisions.isSuccess,
    },
  );
  const versionIds = useMemo(
    () => idSet(links.data?.map((row) => row.evidence_version_id)),
    [links.data],
  );
  const versions = useRows(
    "evidence_versions",
    { id: versionIds },
    {
      columns: ["id", "artifact_id", "version_number", "state", "collected_at", "expires_at"],
      enabled: links.isSuccess,
    },
  );
  const artifacts = useRows(
    "evidence_artifacts",
    { id: idSet(versions.data?.map((row) => row.artifact_id)) },
    { columns: ["id", "title", "artifact_kind"], enabled: versions.isSuccess },
  );
  const reviews = useRows(
    "evidence_reviews",
    { evidence_version_id: versionIds },
    {
      columns: [
        "id",
        "evidence_version_id",
        "reviewer_party_id",
        "decision",
        "reviewed_at",
        "created_at",
      ],
      enabled: links.isSuccess,
    },
  );
  const reviewers = useRows(
    "parties",
    { id: idSet(reviews.data?.map((row) => row.reviewer_party_id)) },
    { columns: ["id", "name"], enabled: reviews.isSuccess },
  );
  const rows = useMemo<Line[]>(() => {
    if (!requirements || !links.data || !versions.data || !artifacts.data || !reviews.data)
      return [];
    const names = new Map((reviewers.data ?? []).map((party) => [party.id, party.name]));
    return citedEvidence({
      requirements,
      latest,
      links: links.data,
      versions: versions.data,
      artifacts: artifacts.data,
      reviews: reviews.data,
    }).map((line) => ({
      ...line,
      versionLabel: `Version ${line.version}`,
      reviewer: line.reviewerId ? (names.get(line.reviewerId) ?? null) : null,
    }));
  }, [
    requirements,
    latest,
    links.data,
    versions.data,
    artifacts.data,
    reviews.data,
    reviewers.data,
  ]);
  const columns = useMemo(
    () =>
      defineColumns<Line>((c) => [
        c.text("title", {
          header: "Artifact",
          minWidth: 220,
          priority: 0,
          hideable: false,
          cell: (row) => (
            <RecordLink
              table="evidence_versions"
              record={{ id: row.id, artifact_id: row.artifactId }}
            >
              {row.title}
            </RecordLink>
          ),
        }),
        c.text("versionLabel", { header: "Version", width: 110, priority: 2 }),
        c.status("review", { header: "Review", width: 140, priority: 1, statuses: reviewStates }),
        c.person("reviewer", {
          header: "Reviewer",
          width: 170,
          priority: 3,
          cell: (row) =>
            row.reviewer ? <Person name={row.reviewer} /> : <Absent label="No reviewer" />,
        }),
        c.list("citedBy", {
          header: "Cited by",
          width: 160,
          priority: 4,
          searchable: true,
          items: (row) => row.citedBy.map((code) => ({ key: code, label: code })),
        }),
        c.text("kind", {
          header: "Kind",
          width: 140,
          priority: 6,
          cell: (row) => labelFor(row.kind),
        }),
        c.date("collected", { header: "Collected", priority: 5 }),
        c.date("expires", {
          header: "Expires",
          width: 150,
          priority: 7,
          cell: (row) =>
            row.expires ? (
              <DateLabel value={row.expires} kind="expiry" format="date" />
            ) : (
              <Absent label="No expiry" />
            ),
        }),
      ]),
    [],
  );
  const table = useCollectionTable({
    columns,
    data: rows,
    getRowId: (row) => row.id,
    rowLabel: (row) => `${row.title}, ${row.versionLabel.toLowerCase()}`,
    label: "Evidence its requirements cite",
    view: "control-evidence",
  });
  const [adding, setAdding] = useState(false);
  const canAdd = workspace.role !== "viewer" && (requirements?.length ?? 0) > 0;
  const action = canAdd ? (
    <Button size="small" variant="primary" iconBefore={<Plus />} onClick={() => setAdding(true)}>
      Add evidence
    </Button>
  ) : null;
  return (
    <>
      <ProductCollection
        table={table}
        queries={[trace, revisions, links, versions, artifacts, reviews, reviewers]}
        keepQuestion
        searchLabel="Find evidence"
        action={action}
        onRowClick={(row) =>
          openRecord("evidence_versions", { id: row.id, artifact_id: row.artifactId })
        }
        empty={{
          illustration: "document",
          title: "No evidence cited",
          description: requirements?.length
            ? "Add evidence to a requirement that maps this control."
            : "Map a requirement to this control first.",
          action,
        }}
      />
      {canAdd && (
        <ControlAddEvidence
          programId={programId}
          controlId={controlId}
          open={adding}
          onOpenChange={setAdding}
        />
      )}
    </>
  );
}
