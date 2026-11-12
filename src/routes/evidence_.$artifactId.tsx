import { createFileRoute } from "@tanstack/react-router";
import { RecordPending } from "@/components/app/shell";
import { useRecordTitle } from "@/components/app/browser-title";
import { useRow } from "@/lib/models";
import { EvidenceRecord } from "@/components/prototype/evidence-browser";

export const Route = createFileRoute("/evidence_/$artifactId")({
  // The version whose review is open survives a reload, Back and a shared link.
  validateSearch: (search: Record<string, unknown>): { version?: string | undefined } =>
    typeof search["version"] === "string" && /^[0-9a-f-]{36}$/i.test(search["version"])
      ? { version: search["version"] }
      : {},
  head: () => ({ meta: [{ title: "Evidence artifact — Program Assurance" }] }),
  pendingComponent: RecordPending,
  component: Page,
});
function Page() {
  const { artifactId } = Route.useParams();
  const { version } = Route.useSearch();
  const navigate = Route.useNavigate();
  const record = useRow("evidence_artifacts", artifactId);
  useRecordTitle("Evidence artifact", record.data?.title);
  return (
    <EvidenceRecord
      id={artifactId}
      versionId={version}
      // Opening a version's review is a step in the history, so Back closes it.
      onVersionChange={(next) =>
        void navigate({
          search: (current) => ({ ...current, version: next ?? undefined }),
          resetScroll: false,
        })
      }
    />
  );
}
