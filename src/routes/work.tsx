import { PageHeader } from "@ledger/design-system";
import { createFileRoute } from "@tanstack/react-router";
import { Page } from "@/components/app/shell";
import { WorkTable } from "@/components/prototype/work-table";
export const Route = createFileRoute("/work")({
  component: MyWork,
  head: () => ({ meta: [{ title: "My work — Program Assurance" }] }),
});
function MyWork() {
  return (
    <Page>
      <PageHeader>
        <PageHeader.Heading>
          <PageHeader.Title>My work</PageHeader.Title>
        </PageHeader.Heading>
      </PageHeader>
      <WorkTable mineOnly fill />
    </Page>
  );
}
