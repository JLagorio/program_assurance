import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  IndexPage,
  PageHeader,
  Stack,
} from "@ledger/design-system";
import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
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
  const programIdItems = programs.map((program) => ({ value: program.id, label: program.name }));
  return (
    <Shell>
      <IndexPage header={<PageHeader title="Evidence" />}>
        <Stack space="space.200">
          <Select<string>
            items={programIdItems}
            value={programId}
            onValueChange={(value) => {
              if (value === null) return;
              return setProgramId(value);
            }}
          >
            <SelectTrigger className="w-full" aria-label="Evidence program">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {programIdItems.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {programId ? <ProgramEvidence key={programId} programId={programId} /> : null}
        </Stack>
      </IndexPage>
    </Shell>
  );
}
