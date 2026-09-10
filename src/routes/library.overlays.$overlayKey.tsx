import { createFileRoute } from "@tanstack/react-router";
import { AssuranceLibraryRecord } from "@/components/app/assurance-library";
export const Route = createFileRoute("/library/overlays/$overlayKey")({
  validateSearch: (search: Record<string, unknown>): { version?: string } =>
    typeof search["version"] === "string" ? { version: search["version"] } : {},
  head: () => ({ meta: [{ title: "Overlay — Equinox GRC" }] }),
  component: OverlayRecord,
});
function OverlayRecord() {
  const { overlayKey } = Route.useParams();
  const { version } = Route.useSearch();
  return (
    <AssuranceLibraryRecord
      key={`${overlayKey}:${version ?? ""}`}
      entryKey={overlayKey}
      initialVersion={version}
      kind="Overlay"
    />
  );
}
