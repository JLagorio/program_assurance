import { useMemo, useState } from "react";
import { FileCheck } from "lucide-react";
import { Absent, DateTime, Person, Prose, Section, useLedgerLocale } from "@ledger/design-system";
import { useWorkspace } from "@/components/app/workspace";
import { useCampaignResults, type CampaignResults as Results } from "@/lib/assessment-results";
import { idSet, useRows } from "@/lib/models";
import { revisionStates } from "@/lib/status";
import { AssessmentTable, type AssessmentColumn } from "./assessment-table";
import { usePublishResults } from "./publish-results";
import { PublishResultsAction } from "./publish-results-action";
import { RecordSummaryPreview, type RecordSummaryField } from "./record-summary-preview";
import { RelationName } from "./record-tools";

/*
 * A campaign's Assessment results: every results revision of its plans, newest first, with its
 * state, how many findings it holds, who published it and when. The campaign's Actions menu
 * publishes the newest draft that holds a finding, which this list shows. A results revision has
 * no page of its own, so its name opens its preview beside the page: the summary of its facts,
 * whose one primary, for a draft and a reader who may write, is the Review queue's Publish
 * assessment results.
 */

/** A results revision as the section lists it: the person who published it by name. */
type ResultsRow = Results & {
  /** Who published the results; null while they are a draft, or where nobody was recorded. */
  published_by: string | null;
};

/** Who published, else why nobody is named: a draft is not published yet. */
const publisher = (row: ResultsRow) =>
  row.published_by ? (
    <Person name={row.published_by} />
  ) : (
    <Absent
      label={
        row.state === "draft"
          ? "Not published"
          : row.published_by_party_id
            ? "Not available"
            : "Not recorded"
      }
    />
  );

/**
 * The columns, built once: the table keeps its page while the preview steps through it. The
 * results' title names them (it carries their increment), so their version is the preview's.
 */
const columns: AssessmentColumn<ResultsRow>[] = [
  { key: "title", label: "Results" },
  { key: "state", label: "State", statuses: revisionStates, width: 130, priority: 1 },
  { key: "findings", label: "Findings", kind: "number", width: 110, priority: 2 },
  {
    key: "published_by",
    label: "Published by",
    kind: "person",
    width: 180,
    priority: 3,
    value: publisher,
  },
  {
    key: "published_at",
    label: "Published",
    priority: 4,
    value: (row) =>
      row.published_at ? (
        <DateTime value={row.published_at} format="date" />
      ) : (
        <Absent label="Not published" />
      ),
  },
];

export function CampaignResults({ campaignId }: { campaignId: string }) {
  const { rows: results, queries } = useCampaignResults(campaignId);
  // The people who published, by name, so the column sorts and finds them by it.
  const publisherIds = useMemo(
    () => idSet(results?.map((row) => row.published_by_party_id)),
    [results],
  );
  const parties = useRows(
    "parties",
    { id: publisherIds },
    { columns: ["id", "name"], enabled: results !== undefined },
  );
  const rows = useMemo<ResultsRow[]>(() => {
    const names = new Map((parties.data ?? []).map((party) => [party.id, party.name]));
    return (results ?? []).map((row) => ({
      ...row,
      published_by: row.published_by_party_id
        ? (names.get(row.published_by_party_id) ?? null)
        : null,
    }));
  }, [results, parties.data]);
  const [preview, setPreview] = useState<ResultsRow | null>(null);
  const [displayed, setDisplayed] = useState<ResultsRow[]>([]);
  // Counted once the rows are read: no count while they load or after they failed, never 0.
  const ready = results !== undefined && parties.data !== undefined;
  return (
    <Section title="Assessment results" count={ready ? rows.length : undefined} countMax={9999}>
      <AssessmentTable
        queries={[...queries, parties]}
        model="assessment_results_revisions"
        compact
        label="Assessment results"
        rows={rows}
        columns={columns}
        selectedId={preview?.id}
        onPreview={setPreview}
        onDisplayedRowsChange={setDisplayed}
        empty={{
          icon: <FileCheck />,
          description:
            "Assessment results hold the findings an assessor records against this campaign's plans.",
        }}
      />
      {preview && (
        <ResultsPreview
          // The list's copy, once a publication or a refresh reads it again.
          record={rows.find((row) => row.id === preview.id) ?? preview}
          rows={displayed}
          onSelect={setPreview}
          onClose={() => setPreview(null)}
        />
      )}
    </Section>
  );
}

/**
 * A results revision beside the campaign: its state, version, findings, who published it and when,
 * the plan it belongs to and what its author wrote, with previous and next through the list. A
 * draft offers Publish assessment results to a reader who may write; once a draft shown here is
 * published, here or in another session, the action keeps its place and says why it no longer
 * runs, so focus stays on it.
 */
function ResultsPreview({
  record,
  rows,
  onSelect,
  onClose,
}: {
  record: ResultsRow;
  rows: ResultsRow[];
  onSelect: (row: ResultsRow) => void;
  onClose: () => void;
}) {
  const workspace = useWorkspace();
  const { formatNumber } = useLedgerLocale();
  const publish = usePublishResults();
  // A draft this preview has shown keeps its action once it is published, here or elsewhere.
  const [drafts, setDrafts] = useState<ReadonlySet<string>>(() => new Set());
  if (record.state === "draft" && !drafts.has(record.id))
    setDrafts(new Set([...drafts, record.id]));
  const offered =
    workspace.role !== "viewer" && (record.state === "draft" || drafts.has(record.id));
  const fields: RecordSummaryField<ResultsRow>[] = [
    { key: "state", label: "State", statuses: revisionStates },
    { key: "version_number", label: "Version", render: (row) => formatNumber(row.version_number) },
    { key: "findings", label: "Findings", render: (row) => formatNumber(row.findings) },
    { key: "published_by", label: "Published by", render: publisher },
    {
      key: "published_at",
      label: "Published",
      render: (row) =>
        row.published_at ? <DateTime value={row.published_at} /> : <Absent label="Not published" />,
    },
    {
      key: "assessment_plan_revision_id",
      label: "Assessment plan",
      render: (row) => (
        <RelationName table="assessment_plan_revisions" id={row.assessment_plan_revision_id} />
      ),
    },
  ];
  return (
    <>
      <RecordSummaryPreview
        model="assessment_results_revisions"
        record={record}
        rows={rows}
        onSelect={onSelect}
        onClose={onClose}
        readOnly
        recordActions={
          offered ? (
            <PublishResultsAction
              key={record.id}
              results={{ id: record.id, title: record.title, findings: record.findings }}
              onPublish={publish.ask}
            />
          ) : undefined
        }
        fields={fields}
      >
        {record.description?.trim() ? (
          <Prose label="Description">{record.description}</Prose>
        ) : null}
      </RecordSummaryPreview>
      {publish.confirmation}
    </>
  );
}
