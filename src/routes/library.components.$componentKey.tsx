import { createFileRoute, redirect } from "@tanstack/react-router";
import { AssuranceLibraryRecord } from "@/components/app/assurance-library";
import { libraryEntry } from "@/lib/assurance-library";
export const Route = createFileRoute("/library/components/$componentKey")({
  validateSearch: (search: Record<string, unknown>): { version?: string } =>
    typeof search["version"] === "string" ? { version: search["version"] } : {},
  beforeLoad: ({ params, search }) => {
    const entry = libraryEntry(params.componentKey);
    if (entry?.kind === "Overlay") {
      throw redirect({
        to: "/library/overlays/$overlayKey",
        params: { overlayKey: entry.key },
        search,
      });
    }
  },
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
      kind="Component"
    />
  );
}
