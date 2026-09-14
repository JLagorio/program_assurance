import { createFileRoute } from "@tanstack/react-router";
import { Briefing } from "@/components/prototype/package-views";
export const Route = createFileRoute("/briefing")({ component: Page });
function Page() {
  return <Briefing />;
}
