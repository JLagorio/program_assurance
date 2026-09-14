import { createFileRoute } from "@tanstack/react-router";
import { Findings } from "@/components/prototype/findings-views";
export const Route = createFileRoute("/findings/")({ component: Page });
function Page() {
  return <Findings />;
}
