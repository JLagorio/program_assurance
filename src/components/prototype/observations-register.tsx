import { useState } from "react";
import { Absent, HeadingLevelProvider, Prose, Section, Stack } from "@ledger/design-system";
import { RecordPreviewActions, RecordPreviewPanel } from "./record-preview";
import { useRows } from "@/lib/models";
import type { DataRecord } from "@/lib/records";
import { EntitySection, ModelFacts, ModelTable, RelationName } from "./record-tools";
import { VersionName } from "./work-common";

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
  // The preview reads the stored record, so a refreshed observation shows as it is now.
  const current =
    selected &&
    ((observations.data as DataRecord[] | undefined)?.find((row) => row.id === selected.id) ??
      selected);
  const description = current?.["description"];
  const content = (
    <>
      <ModelTable
        model="observations"
        queries={[observations]}
        selectedId={selected?.id}
        onDisplayedRowsChange={setDisplayed}
        rows={(observations.data ?? []) as DataRecord[]}
        fill={fill}
        searchLabel="Search observations"
        view={programId ? "program-observations" : "observations"}
        columns={[
          { key: "title", label: "Observation" },
          { key: "method", label: "Method" },
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
          {/* The preview's record title is its h2; its collection sits under it. */}
          <HeadingLevelProvider level={3}>
            <Stack space="space.250">
              <Prose label="Description">
                {typeof description === "string" && description.trim() ? (
                  description
                ) : (
                  <Absent label="Not recorded" />
                )}
              </Prose>
              <ModelFacts
                record={current}
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
                      <RelationName
                        table="parties"
                        id={row["observer_party_id"] as string | null}
                      />
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
                      row["step_result_id"] ? (
                        "Recorded in a test run"
                      ) : (
                        <Absent label="Not recorded" />
                      ),
                  },
                ]}
              />
              <EntitySection
                showHeading
                table="observation_evidence"
                filters={{ observation_id: current.id }}
                title="Evidence citations"
                readOnly
                columns={[
                  {
                    key: "evidence_version_id",
                    label: "Evidence version",
                    render: (row) => (
                      <VersionName
                        table="evidence_versions"
                        id={row["evidence_version_id"] as string}
                      />
                    ),
                  },
                  { key: "description", label: "Description" },
                ]}
              />
            </Stack>
          </HeadingLevelProvider>
        </RecordPreviewPanel>
      ) : null}
    </>
  );
  return fill ? content : <Section title="Observations">{content}</Section>;
}
