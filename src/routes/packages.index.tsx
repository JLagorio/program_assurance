import { createFileRoute } from "@tanstack/react-router";
import { Packages } from "@/components/prototype/package-views";
export const Route = createFileRoute("/packages/")({
  head: () => ({ meta: [{ title: "Authorization packages — Program Assurance" }] }),
  component: Page,
});
function Page() {
  return <Packages />;
}
