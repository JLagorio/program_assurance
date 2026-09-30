import { createFileRoute } from "@tanstack/react-router";
import { RecordPending } from "@/components/app/shell";
import { useRecordTitle } from "@/components/app/browser-title";
import { useRow } from "@/lib/models";
import { RequirementLibraryRecord } from "@/components/prototype/library-requirements";
export const Route = createFileRoute("/library/requirements/$definitionKey")({
  validateSearch: (search: Record<string, unknown>): { version?: string } =>
    typeof search["version"] === "string" ? { version: search["version"] } : {},
  head: () => ({ meta: [{ title: "Requirement definition — Program Assurance" }] }),
  pendingComponent: RecordPending,
  component: RequirementPage,
});
function RequirementPage() {
  const { definitionKey } = Route.useParams();
  const record = useRow("requirement_definitions", definitionKey);
  useRecordTitle("Requirement definition", record.data?.title);
  const { version } = Route.useSearch();
  return (
    <RequirementLibraryRecord
      id={definitionKey}
      {...(version ? { initialVersion: version } : {})}
    />
  );
}
