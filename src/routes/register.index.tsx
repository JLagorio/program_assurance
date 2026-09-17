import { createFileRoute } from "@tanstack/react-router";
import { Register } from "@/components/prototype/assurance-views";
export const Route = createFileRoute("/register/")({
  head: () => ({ meta: [{ title: "POA&M & risk register — Program Assurance" }] }),
  component: Page,
});
function Page() {
  return <Register />;
}
