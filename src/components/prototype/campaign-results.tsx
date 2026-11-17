// From the product pattern contract (docs/guides/product-patterns.md), moved here on
// 2026-11-16 when the contract was cut to its rules: what holds for this screen alone, and the
// full wording of rules the contract now states in fewer words.
//
// The campaign record lists its results revisions, so the reader sees which results that is:
// Assessment results, a compact collection on its Overview after the Description (what the campaign
// set out to do, then what it found, on the tab a reader lands on from the queue and the feeds; the
// Execution tab keeps its plan's working collections in their order), one row a results revision
// named by its title, newest first (the latest created, then the highest version,
// `newestResultsFirst`), with its State, Findings (how many it holds), Published by and the day it
// was Published, the last two Absent (Not published) while it is a draft; it reads the same two
// requests as the Actions menu (`useCampaignResults` in assessment-results) and has no create
// action. A results revision has no page of its own, so its name is a link-styled Button that opens
// its preview beside the page, Assessment results preview, as wide as the record's other previews:
// the summary preview, `RecordSummaryPreview` with its State, Version, Findings, Published by,
// Published, Assessment plan and Description, then Assessment findings, the findings the results
// hold as a compact collection under its counted Section heading, a page at a time from
// `assessment_finding_rows` (`resultsFindingRead` in assessment-results), each finding's name a
// link to its record, its Determination as its status and a filter, and the Control it judges, a
// link to the program's record of it, control by control in the catalog's order (`ResultsFindings`
// in results-findings). The words are the vocabulary's, one results revision and several alike
// (`assessmentResultsWords` in product-records): the collection that cannot load says Could not
// load assessment results, while the record noun stays assessment results revision for the generic
// forms and the schema inspector, which put an article before it. It is not the queue's Review
// preview, whose facts (Kind, Waiting since) and navigation belong to a queue row and which knows
// only drafts that hold findings, so previous and next step through the campaign's results in one
// frame; the Review preview of results lists the same findings under its own facts. A draft's
// preview carries the queue's one primary, `PublishResultsAction` in publish-results-action, for a
// reader who may write: it says why while the draft holds no finding, and a draft published from it
// keeps it in place, saying why it no longer runs.

import { useMemo, useState } from "react";
import { FileCheck } from "lucide-react";
import { Absent, DateTime, Person, Prose, Section, useLedgerLocale } from "@ledger/design-system";
import { useWorkspace } from "@/components/app/workspace";
import { useCampaignResults, type CampaignResults as Results } from "@/lib/assessment-results";
import { idSet, useRows } from "@/lib/models";
import { assessmentResultsWords } from "@/lib/product-records";
import { revisionStates } from "@/lib/status";
import { AssessmentTable, type AssessmentColumn } from "./assessment-table";
import { ResultsMoreActions } from "./edit-results";
import { usePublishResults } from "./publish-results";
import { PublishResultsAction } from "./publish-results-action";
import { RecordSummaryPreview, type RecordSummaryField } from "./record-summary-preview";
import { RelationName } from "./record-tools";
import { ResultsFindings } from "./results-findings";

/*
 * A campaign's Assessment results: every results revision of its plans, newest first, with its
 * state, how many findings it holds, who published it and when. The campaign's Actions menu
 * publishes the newest draft that holds a finding, which this list shows. A results revision has
 * no page of its own, so its name opens its preview beside the page, Assessment results preview:
 * the summary of its facts, then the findings it holds. For a draft and a reader who may write,
 * its one primary is the Review queue's Publish assessment results, and its overflow menu offers
 * Edit assessment results.
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

export function CampaignResults({
  campaignId,
  programId,
}: {
  campaignId: string;
  /** The campaign's program, whose record of each control a finding's control opens. */
  programId: string;
}) {
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
        // A results revision is "assessment results", one and several: "Could not load assessment
        // results", never "assessment results revisions".
        noun={assessmentResultsWords}
        compact
        label="Assessment results"
        rows={rows}
        columns={columns}
        selectedId={preview?.id}
        onPreview={setPreview}
        onDisplayedRowsChange={setDisplayed}
        empty={{
          icon: <FileCheck />,
          description: "Results hold the findings an assessor records here.",
        }}
      />
      {preview && (
        <ResultsPreview
          // The list's copy, once a publication or a refresh reads it again.
          record={rows.find((row) => row.id === preview.id) ?? preview}
          rows={displayed}
          programId={programId}
          onSelect={setPreview}
          onClose={() => setPreview(null)}
        />
      )}
    </Section>
  );
}

/**
 * A results revision beside the campaign: its state, version, findings, who published it and when,
 * the plan it belongs to and what its author wrote, then the findings it holds, with previous and
 * next through the list. A draft offers Publish assessment results to a reader who may write, and
 * Edit assessment results in its overflow menu; once a draft shown here is published, here or in
 * another session, both keep their place and say why they no longer run, so focus stays on them.
 */
function ResultsPreview({
  record,
  rows,
  programId,
  onSelect,
  onClose,
}: {
  record: ResultsRow;
  rows: ResultsRow[];
  programId: string;
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
        // "Assessment results preview", as the vocabulary names a results revision.
        noun={assessmentResultsWords.one}
        // As wide as the record's other previews, so the findings it lists keep their
        // determination and control in the row.
        defaultWidth={640}
        record={record}
        rows={rows}
        onSelect={onSelect}
        onClose={onClose}
        readOnly
        recordActions={
          offered ? (
            <>
              <PublishResultsAction
                key={record.id}
                results={{ id: record.id, title: record.title, findings: record.findings }}
                programId={programId}
                onPublish={publish.ask}
              />
              <ResultsMoreActions key={`more-${record.id}`} resultsId={record.id} />
            </>
          ) : undefined
        }
        fields={fields}
      >
        {record.description?.trim() ? (
          <Prose label="Description">{record.description}</Prose>
        ) : null}
        <ResultsFindings key={record.id} resultsId={record.id} programId={programId} />
      </RecordSummaryPreview>
      {publish.confirmation}
    </>
  );
}
