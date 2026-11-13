import { createFileRoute } from "@tanstack/react-router";
import { RecordPending } from "@/components/app/shell";
import { useRecordTitle } from "@/components/app/browser-title";
import { useRow } from "@/lib/models";
import { IssueRecord } from "@/components/prototype/findings-views";
export const Route = createFileRoute("/issues/$issueId")({
  // `link=requirement` asks the issue to open its Link requirement, as its trace's gap offers.
  validateSearch: (search: Record<string, unknown>): { link?: "requirement" | undefined } =>
    search["link"] === "requirement" ? { link: "requirement" } : {},
  head: () => ({ meta: [{ title: "Operational issue — Program Assurance" }] }),
  pendingComponent: RecordPending,
  component: Page,
});
function Page() {
  const { issueId } = Route.useParams();
  const { link } = Route.useSearch();
  const navigate = Route.useNavigate();
  const record = useRow("operational_issues", issueId);
  useRecordTitle("Operational issue", record.data?.title);
  return (
    <IssueRecord
      id={issueId}
      linkRequirement={link === "requirement"}
      // Once the browser has opened, the address no longer asks: a reload or Back opens nothing.
      onLinkRequirementOpened={() =>
        void navigate({
          search: (current) => ({ ...current, link: undefined }),
          replace: true,
          resetScroll: false,
        })
      }
    />
  );
}
