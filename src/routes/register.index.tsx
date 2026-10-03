import { createFileRoute } from "@tanstack/react-router";
import { REGISTER_TABS, Register, type RegisterTab } from "@/components/prototype/assurance-views";
export const Route = createFileRoute("/register/")({
  // The collection a reader chose survives a reload, Back and a shared link.
  validateSearch: (search: Record<string, unknown>): { tab?: RegisterTab | undefined } => ({
    tab: REGISTER_TABS.find((tab) => tab === search["tab"]),
  }),
  head: () => ({ meta: [{ title: "POA&M & risk register — Program Assurance" }] }),
  component: Page,
});
function Page() {
  const { tab } = Route.useSearch();
  const navigate = Route.useNavigate();
  // The tab over the address's other parameters: each register's question stays in it.
  return (
    <Register
      tab={tab}
      onTabChange={(next) => void navigate({ search: (current) => ({ ...current, tab: next }) })}
    />
  );
}
