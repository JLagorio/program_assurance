import { createFileRoute } from "@tanstack/react-router";
import { RequirementLibraryRecord } from "@/components/prototype/library-requirements";
export const Route = createFileRoute("/library/requirements/$definitionKey")({
  validateSearch: (search: Record<string, unknown>): { version?: string } =>
    typeof search["version"] === "string" ? { version: search["version"] } : {},
  head: () => ({ meta: [{ title: "Requirement definition — Program Assurance" }] }),
  component: RequirementPage,
});
function RequirementPage() {
  const { definitionKey } = Route.useParams();
  const { version } = Route.useSearch();
  return (
    <RequirementLibraryRecord
      id={definitionKey}
      {...(version ? { initialVersion: version } : {})}
    />
  );
}
