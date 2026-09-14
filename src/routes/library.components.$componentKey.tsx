import { createFileRoute } from "@tanstack/react-router";
import { ComponentLibraryRecord } from "@/components/prototype/library-components";
export const Route = createFileRoute("/library/components/$componentKey")({
  validateSearch: (search: Record<string, unknown>): { version?: string } =>
    typeof search["version"] === "string" ? { version: search["version"] } : {},
  head: () => ({ meta: [{ title: "Component — Program Assurance" }] }),
  component: ComponentPage,
});
function ComponentPage() {
  const { componentKey } = Route.useParams();
  const { version } = Route.useSearch();
  return (
    <ComponentLibraryRecord id={componentKey} {...(version ? { initialVersion: version } : {})} />
  );
}
