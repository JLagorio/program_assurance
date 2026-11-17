import { createFileRoute } from "@tanstack/react-router";
import { RecordPending } from "@/components/app/shell";
import { useViewTitle } from "@/components/app/browser-title";
import { useRow } from "@/lib/models";
import {
  AUTHORIZATION_TABS,
  ProgramAuthorization,
  type AuthorizationTab,
} from "@/components/prototype/program-authorization";
export const Route = createFileRoute("/programs/$programId_/authorization")({
  // The part a reader chose survives a reload, Back and a shared link: Schedule when it names none.
  validateSearch: (search: Record<string, unknown>): { tab?: AuthorizationTab | undefined } => ({
    tab: AUTHORIZATION_TABS.find((tab) => tab !== "schedule" && tab === search["tab"]),
  }),
  head: () => ({ meta: [{ title: "Authorization — Program Assurance" }] }),
  pendingComponent: RecordPending,
  component: ProgramView,
});
function ProgramView() {
  const { programId } = Route.useParams();
  const { tab } = Route.useSearch();
  const navigate = Route.useNavigate();
  const record = useRow("programs", programId);
  useViewTitle("Authorization", record.data?.name);
  return (
    <ProgramAuthorization
      programId={programId}
      tab={tab ?? "schedule"}
      // Over the address's other parameters: each register's question stays in it.
      onTabChange={(next) =>
        void navigate({
          search: (current) => ({ ...current, tab: next === "schedule" ? undefined : next }),
        })
      }
    />
  );
}
