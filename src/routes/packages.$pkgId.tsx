import { createFileRoute } from "@tanstack/react-router";
import { PackageRecord } from "@/components/prototype/package-views";
export const Route = createFileRoute("/packages/$pkgId")({ component: Page });
function Page() {
  const { pkgId } = Route.useParams();
  return <PackageRecord id={pkgId} />;
}
