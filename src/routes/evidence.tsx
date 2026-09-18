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
        <PageHeader.Heading>
          <PageHeader.Title>Evidence</PageHeader.Title>
        </PageHeader.Heading>
      </PageHeader>
      <EvidenceBrowser />
    </Stack>
  );
}
