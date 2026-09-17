import { createFileRoute } from "@tanstack/react-router";
import { RequirementLibraryIndex } from "@/components/prototype/library-requirements";
export const Route = createFileRoute("/library/requirements/")({
  head: () => ({ meta: [{ title: "Requirements — Program Assurance" }] }),
  component: RequirementLibraryIndex,
});
