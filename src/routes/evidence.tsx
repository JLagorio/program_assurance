import { ProgramEvidence } from "@/components/app/program-evidence";
import { programs } from "@/lib/grc-data";
import {
  PageHeader,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Stack,
} from "@ledger/design-system";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

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
    <Stack space="space.200" className="min-w-0">
      <PageHeader>
        <div className="min-w-0">
          <PageHeader.Title>{"Evidence"}</PageHeader.Title>
        </div>
      </PageHeader>
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
    </Stack>
  );
}
