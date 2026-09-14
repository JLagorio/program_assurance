import { useState } from "react";
import {
  Box,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Section,
  Stack,
} from "@ledger/design-system";
import { useRows } from "@/lib/models";
import type { DataRecord } from "@/lib/records";
import {
  EntitySection,
  InspectLink,
  ModelFacts,
  ModelTable,
  QueryState,
  RelationName,
} from "./record-tools";

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
  return (
    <Section title="Observations">
      <Stack space="space.150">
        <p className="text-subtle">
          Recorded observations and their evidence. Assessment and execution links are shown when
          recorded.
        </p>
        <QueryState query={observations}>
          <ModelTable
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
            onOpen={setSelected}
            empty={{ title: "No observations recorded" }}
          />
        </QueryState>
      </Stack>
      {selected ? (
        <Dialog
          open
          onOpenChange={(open) => {
            if (!open) setSelected(null);
          }}
        >
          <DialogContent style={{ maxWidth: 820 }}>
            <DialogHeader>
              <DialogTitle>{String(selected["title"])}</DialogTitle>
              <DialogDescription>Recorded observation</DialogDescription>
            </DialogHeader>
            <Box padding="space.250" className="min-h-0 flex-1 overflow-y-auto">
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
                <InspectLink table="observations" id={selected.id} />
              </Stack>
            </Box>
          </DialogContent>
        </Dialog>
      ) : null}
    </Section>
  );
}
