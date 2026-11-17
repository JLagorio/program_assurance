import { createFileRoute } from "@tanstack/react-router";
import { RecordPending } from "@/components/app/shell";
import { useRecordTitle } from "@/components/app/browser-title";
import { useRow } from "@/lib/models";
import {
  ComponentLibraryRecord,
  isComponentSetTab,
} from "@/components/prototype/library-components";

export const Route = createFileRoute("/library/component-sets/$setId")({
  // The version and the tab a reader chose survive a reload, Back and a shared link. The tab is
  // typed as a string so the record's own version navigation, which spreads the previous search
  // without naming this route, still type-checks; only a real tab name gets through.
  validateSearch: (
    search: Record<string, unknown>,
  ): { version?: string | undefined; tab?: string | undefined } => ({
    ...(typeof search["version"] === "string" ? { version: search["version"] } : {}),
    ...(isComponentSetTab(search["tab"]) ? { tab: search["tab"] } : {}),
  }),
  head: () => ({ meta: [{ title: "Component set — Program Assurance" }] }),
  pendingComponent: RecordPending,
  component: ComponentSetPage,
});
function ComponentSetPage() {
  const { setId } = Route.useParams();
  const record = useRow("component_definitions", setId);
  useRecordTitle("Component set", record.data?.name);
  const { version, tab } = Route.useSearch();
  const navigate = Route.useNavigate();
  return (
    <ComponentLibraryRecord
      id={setId}
      {...(version ? { initialVersion: version } : {})}
      // The address owns the tab, so Back to an address without one is Overview again.
      tab={isComponentSetTab(tab) ? tab : "Overview"}
      onTabChange={(next) => void navigate({ search: (previous) => ({ ...previous, tab: next }) })}
    />
  );
}
