import { PageHeader } from "@ledger/design-system";
import { createFileRoute } from "@tanstack/react-router";
import { Page } from "@/components/app/shell";
import { EvidenceBrowser } from "@/components/prototype/evidence-browser";

export const Route = createFileRoute("/evidence")({
  component: EvidencePage,
  head: () => ({ meta: [{ title: "Evidence — Program Assurance" }] }),
});
function EvidencePage() {
  return (
    <Page>
      <PageHeader>
        <PageHeader.Heading>
          <PageHeader.Title>Evidence</PageHeader.Title>
        </PageHeader.Heading>
      </PageHeader>
      <EvidenceBrowser />
    </Page>
  );
}
