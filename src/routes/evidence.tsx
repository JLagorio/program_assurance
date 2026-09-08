import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { IndexPage, NativeSelect, PageHeader, Stack } from "@ledger/design-system";
import { ProgramEvidence } from "@/components/app/program-evidence";
import { Shell } from "@/components/app/shell";
import { programs } from "@/lib/grc-data";

export const Route = createFileRoute("/evidence")({
  head: () => ({
    meta: [
      { title: "Evidence — Equinox" },
      {
        name: "description",
        content:
          "Program evidence supporting control implementations, requirements and assessments.",
      },
    ],
  }),
  component: Evidence,
});
function Evidence() {
  const [programId, setProgramId] = useState(programs[0]?.id ?? "");
  return (
    <Shell>
      <IndexPage header={<PageHeader title="Evidence" />}>
        <Stack space="space.200">
          <NativeSelect
            aria-label="Evidence program"
            value={programId}
            onChange={(event) => setProgramId(event.target.value)}
          >
            {programs.map((program) => (
              <option key={program.id} value={program.id}>
                {program.name}
              </option>
            ))}
          </NativeSelect>
          {programId ? <ProgramEvidence key={programId} programId={programId} /> : null}
        </Stack>
      </IndexPage>
    </Shell>
  );
}
