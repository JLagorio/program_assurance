import { useMemo, useState } from "react";
import { Absent, HeadingLevelProvider, Prose, Section, Stack } from "@ledger/design-system";
import { RecordPreviewActions, RecordPreviewPanel, useEndOnHide } from "./record-preview";
import { useRows } from "@/lib/models";
import type { DataRecord } from "@/lib/records";
import { stepDeterminations } from "@/lib/status";
import { EntitySection, ModelFacts, ModelTable, RelationName, RevisionName } from "./record-tools";
import { StatusBadge } from "@/components/app/status";

/**
 * What an observation says, wherever it is previewed: what was observed, how and by whom, the
 * operational issues it supports, and the evidence it cites. An observation has no page of its
 * own; it is read from the issue it supports, or here.
 */
export function ObservationDetails({
  observation,
  result,
}: {
  observation: DataRecord;
  /** Its test step's determination, where the caller has read it; read here otherwise. */
  result?: string | null | undefined;
}) {
  const step = useRows(
    "step_results",
    { id: typeof observation["step_result_id"] === "string" ? observation["step_result_id"] : [] },
    {
      columns: ["id", "determination"],
      enabled: result === undefined && typeof observation["step_result_id"] === "string",
    },
  );
  const determination = result === undefined ? (step.data?.[0]?.determination ?? null) : result;
  const description = observation["description"];
  return (
    // The preview's record title is its h2; its collections sit under it.
    <HeadingLevelProvider level={3}>
      <Stack space="space.250">
        <Prose label="Description">
          {typeof description === "string" && description.trim() ? description : <Absent />}
        </Prose>
        <ModelFacts
          record={observation}
          table="observations"
          fields={[
            { key: "method", label: "Method" },
            { key: "observed_at", label: "Observed" },
            { key: "expires_at", label: "Expires" },
            {
              key: "program_id",
              label: "Program",
              render: (row) => (
                <RelationName table="programs" id={row["program_id"] as string | null} />
              ),
            },
            {
              key: "observer_party_id",
              label: "Observer",
              render: (row) => (
                <RelationName table="parties" id={row["observer_party_id"] as string | null} />
              ),
            },
            {
              key: "assessment_event_id",
              label: "Assessment event",
              render: (row) => (
                <RelationName
                  table="assessment_events"
                  id={row["assessment_event_id"] as string | null}
                />
              ),
            },
            {
              key: "step_result_id",
              label: "Step result",
              render: (row) =>
                determination ? (
                  <StatusBadge statuses={stepDeterminations} value={determination} />
                ) : (
                  <Absent label={row["step_result_id"] ? "No result recorded" : "Not recorded"} />
                ),
            },
          ]}
        />
        <EntitySection
          showHeading
          table="issue_observations"
          links="operational_issues"
          filters={{ observation_id: observation.id }}
          title="Operational issues"
          readOnly
          columns={[
            {
              key: "issue_id",
              label: "Operational issue",
              render: (row) => (
                <RelationName table="operational_issues" id={row["issue_id"] as string} />
              ),
            },
          ]}
        />
        <EntitySection
          showHeading
          table="observation_evidence"
          links="evidence_versions"
          filters={{ observation_id: observation.id }}
          title="Evidence citations"
          readOnly
          columns={[
            {
              key: "evidence_version_id",
              label: "Evidence",
              render: (row) => (
                <RevisionName table="evidence_versions" id={row["evidence_version_id"] as string} />
              ),
            },
            { key: "description", label: "Description" },
          ]}
        />
      </Stack>
    </HeadingLevelProvider>
  );
}

/** Recorded observations can exist before a formal assessment execution is pinned. */
export function ObservationsRegister({
  programId,
  fill,
}: {
  programId?: string | undefined;
  /** The register is the page's one block: it takes the rest of the window. */
  fill?: boolean | undefined;
}) {
  const observations = useRows("observations", programId ? { program_id: programId } : {});
  // An observation made at a test step carries that step's result; only the determination is read.
  const results = useRows("step_results", {}, { columns: ["id", "determination"] });
  const resultOf = useMemo(
    () => new Map((results.data ?? []).map((result) => [result.id, result.determination])),
    [results.data],
  );
  const result = (row: DataRecord) =>
    typeof row["step_result_id"] === "string"
      ? (resultOf.get(row["step_result_id"]) ?? null)
      : null;
  const [selected, setSelected] = useState<DataRecord | null>(null);
  useEndOnHide(() => setSelected(null));
  const [displayed, setDisplayed] = useState<DataRecord[]>([]);
  // The preview reads the stored record, so a refreshed observation shows as it is now.
  const current =
    selected &&
    ((observations.data as DataRecord[] | undefined)?.find((row) => row.id === selected.id) ??
      selected);
  const content = (
    <>
      <ModelTable
        model="observations"
        queries={[observations, results]}
        selectedId={selected?.id}
        onDisplayedRowsChange={setDisplayed}
        rows={(observations.data ?? []) as DataRecord[]}
        fill={fill}
        searchLabel="Find observations"
        view={programId ? "program-observations" : "observations"}
        // Each column says its kind, so the register reads no record schema.
        columns={[
          { key: "title", label: "Observation" },
          { key: "method", label: "Method", kind: "category", priority: 2 },
          { key: "observed_at", label: "Observed", kind: "date", priority: 1 },
          {
            key: "result",
            label: "Result",
            statuses: stepDeterminations,
            value: result,
            width: 130,
            priority: 3,
          },
          ...(!programId
            ? [
                {
                  key: "program_id",
                  label: "Program",
                  kind: "text" as const,
                  render: (row: DataRecord) => (
                    <RelationName table="programs" id={row["program_id"] as string | null} />
                  ),
                },
              ]
            : []),
        ]}
        onPreview={setSelected}
        empty={{
          illustration: "records",
          title: "No observations recorded",
          description:
            "Observations are recorded from assessment test runs and events, and appear here as they are made.",
        }}
      />
      {current ? (
        <RecordPreviewPanel
          title={String(current["title"])}
          label="Observation preview"
          defaultWidth={640}
          onClose={() => setSelected(null)}
          navigation={
            <RecordPreviewActions
              table="observations"
              record={current}
              rows={displayed}
              onSelect={setSelected}
            />
          }
        >
          <ObservationDetails observation={current} result={result(current)} />
        </RecordPreviewPanel>
      ) : null}
    </>
  );
  return fill ? content : <Section title="Observations">{content}</Section>;
}
