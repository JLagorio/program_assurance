import { createFileRoute } from "@tanstack/react-router";
import { ProgramWizard } from "@/components/app/program-wizard";

export const Route = createFileRoute("/programs/new")({
  head: () => ({
    meta: [
      { title: "Create program — Program Assurance" },
      {
        name: "description",
        content:
          "Create a program, define its systems, and tailor controls from published OSCAL catalogs and profiles.",
      },
    ],
  }),
  component: ProgramWizard,
});
