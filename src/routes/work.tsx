import { PageHeader, Tabs, TabsContent, TabsList, TabsTrigger } from "@ledger/design-system";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Page } from "@/components/app/shell";
import { WorkTable } from "@/components/prototype/work-table";
import { AttentionInbox } from "@/components/prototype/attention-inbox";
export const Route = createFileRoute("/work")({
  validateSearch: (search: Record<string, unknown>): { view?: "attention" | undefined } =>
    search["view"] === "attention" ? { view: "attention" } : {},
  component: MyWork,
  head: () => ({ meta: [{ title: "My work — Program Assurance" }] }),
});
function MyWork() {
  const { view } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  return (
    <Page>
      <PageHeader>
        <PageHeader.Heading>
          <PageHeader.Title>My work</PageHeader.Title>
        </PageHeader.Heading>
      </PageHeader>
      <Tabs
        value={view ?? "tasks"}
        onValueChange={(value) =>
          void navigate({
            search: (current) => ({
              ...current,
              view: value === "attention" ? "attention" : undefined,
            }),
          })
        }
      >
        <TabsList variant="line" aria-label="My work views">
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="attention">Attention</TabsTrigger>
        </TabsList>
        <TabsContent value="tasks">
          <WorkTable mineOnly fill />
        </TabsContent>
        <TabsContent value="attention">
          <AttentionInbox />
        </TabsContent>
      </Tabs>
    </Page>
  );
}
