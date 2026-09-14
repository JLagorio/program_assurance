import { ProgramEvidence } from "@/components/app/program-evidence";
import { PageHeader, Stack } from "@ledger/design-system";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/evidence")({
  head: () => ({
    meta: [
      { title: "Evidence — Equinox" },
      {
        name: "description",
        content:
          "Every evidence artifact across programs, with what each one supports and its review state.",
      },
    ],
  }),
  component: Evidence,
});

/** The cross-program register, in the shape /findings and /register use. */
function Evidence() {
  return (
    <Stack space="space.200" className="min-w-0">
      <PageHeader>
        <div className="min-w-0">
          <PageHeader.Title>{"Evidence"}</PageHeader.Title>
        </div>
      </PageHeader>
      <ProgramEvidence />
    </Stack>
  );
}
