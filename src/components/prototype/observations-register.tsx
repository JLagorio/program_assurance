import { useState } from "react";
import { Section, Stack } from "@ledger/design-system";
import { RecordPreviewActions, RecordPreviewPanel } from "./record-preview";
import { useRows } from "@/lib/models";
import type { DataRecord } from "@/lib/records";
import { EntitySection, ModelFacts, ModelTable, QueryState, RelationName } from "./record-tools";

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
  const [selected, setSelected] = useState<DataRecord | null>(null);
  const [displayed, setDisplayed] = useState<DataRecord[]>([]);
  const content = (
    <>
      <QueryState query={observations}>
        <ModelTable
          model="observations"
          selectedId={selected?.id}
          onDisplayedRowsChange={setDisplayed}
          rows={(observations.data ?? []) as DataRecord[]}
          fill={fill}
          searchLabel="Search observations"
          columns={[
            { key: "title", label: "Observation" },
            { key: "method" },
            { key: "observed_at", label: "Observed" },
            ...(!programId
              ? [
                  {
                    key: "program_id",
                    label: "Program",
                    render: (row: DataRecord) => (
                      <RelationName table="programs" id={row["program_id"] as string | null} />
                    ),
                  },
                ]
              : []),
          ]}
          onPreview={setSelected}
          empty={{ title: "No observations recorded" }}
        />
      </QueryState>
      {selected ? (
        <RecordPreviewPanel
          title={String(selected["title"])}
          label="Observation preview"
          defaultWidth={640}
          onClose={() => setSelected(null)}
          navigation={
            <RecordPreviewActions
              table="observations"
              record={selected}
              rows={displayed}
              onSelect={setSelected}
            />
          }
        >
          <Stack space="space.250">
            <ModelFacts
              record={selected}
              fields={[
                "description",
                "method",
                "observed_at",
                "expires_at",
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
                  label: "Execution result",
                  render: (row) => (
                    <RelationName
                      table="step_results"
                      id={row["step_result_id"] as string | null}
                    />
                  ),
                },
              ]}
            />
            <EntitySection
              table="observation_evidence"
              filters={{ observation_id: selected.id }}
              title="Evidence citations"
              readOnly
              columns={[
                {
                  key: "evidence_version_id",
                  label: "Evidence version",
                  render: (row) => (
                    <RelationName
                      table="evidence_versions"
                      id={row["evidence_version_id"] as string}
                    />
                  ),
                },
                { key: "description" },
              ]}
            />
          </Stack>
        </RecordPreviewPanel>
      ) : null}
    </>
  );
  return fill ? content : <Section title="Observations">{content}</Section>;
}
