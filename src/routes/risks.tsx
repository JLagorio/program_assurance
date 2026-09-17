import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router";
import { RiskList } from "@/components/prototype/assurance-views";
export const Route = createFileRoute("/risks")({
  head: () => ({ meta: [{ title: "Risk register — Program Assurance" }] }),
  component: Page,
});
function Page() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  return pathname.replace(/\/$/, "") === "/risks" ? <RiskList /> : <Outlet />;
}
