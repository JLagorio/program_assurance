import { createFileRoute } from "@tanstack/react-router";

import { ProgramWizard } from "@/components/app/program-wizard";
import { Shell } from "@/ds/shell";

export const Route = createFileRoute("/programs/new")({
  head: () => ({
    meta: [
      { title: "New program — Equinox GRC" },
      {
        name: "description",
        content:
          "Create a program: choose a framework edition, draw its systems and subsystems, categorize each scope under CNSSI 1253, apply overlays, tailor controls, and freeze the first control-set revision.",
      },
      { property: "og:title", content: "New program — Equinox GRC" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: NewProgram,
});

function NewProgram() {
  return (
    <Shell>
      <ProgramWizard />
    </Shell>
  );
}
