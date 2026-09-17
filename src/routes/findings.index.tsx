import { createFileRoute } from "@tanstack/react-router";
import { Findings } from "@/components/prototype/findings-views";
export const Route = createFileRoute("/findings/")({
  head: () => ({ meta: [{ title: "Findings & assets — Program Assurance" }] }),
  component: Page,
});
function Page() {
  return <Findings />;
}
