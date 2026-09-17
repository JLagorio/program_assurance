import { PageHeader, Stack } from "@ledger/design-system";
import { createFileRoute } from "@tanstack/react-router";
import { EvidenceBrowser } from "@/components/prototype/evidence-browser";

export const Route = createFileRoute("/evidence")({
  component: EvidencePage,
  head: () => ({ meta: [{ title: "Evidence — Program Assurance" }] }),
});
function EvidencePage() {
  return (
    <Stack space="space.200" className="min-w-0">
      <PageHeader>
        <div className="min-w-0">
          <PageHeader.Title>Evidence</PageHeader.Title>
        </div>
      </PageHeader>
      <EvidenceBrowser />
    </Stack>
  );
}
