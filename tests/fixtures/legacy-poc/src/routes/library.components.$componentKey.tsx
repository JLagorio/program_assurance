import { createFileRoute } from "@tanstack/react-router";
import { AssuranceLibraryRecord } from "@/components/app/assurance-library";

export const Route = createFileRoute("/library/components/$componentKey")({
  validateSearch: (search: Record<string, unknown>): { version?: string } =>
    typeof search["version"] === "string" ? { version: search["version"] } : {},
  head: () => ({ meta: [{ title: "Component — Equinox GRC" }] }),
  component: ComponentRecord,
});

function ComponentRecord() {
  const { componentKey } = Route.useParams();
  const { version } = Route.useSearch();
  return (
    <AssuranceLibraryRecord
      key={`${componentKey}:${version ?? ""}`}
      entryKey={componentKey}
      initialVersion={version}
    />
  );
}
