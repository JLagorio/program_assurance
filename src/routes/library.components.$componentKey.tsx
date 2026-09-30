import { createFileRoute } from "@tanstack/react-router";
import { RecordPending } from "@/components/app/shell";
import { useRecordTitle } from "@/components/app/browser-title";
import { useRow } from "@/lib/models";
import {
  ComponentLibraryRecord,
  type ComponentTab,
} from "@/components/prototype/library-components";

/** Every tab the record has: a record, so the type checker notices a tab added or removed there. */
const componentTabs: Record<ComponentTab, true> = {
  Overview: true,
  Controls: true,
  Structure: true,
  Requirements: true,
  Evidence: true,
  Versions: true,
  Programs: true,
};
const isComponentTab = (value: unknown): value is ComponentTab =>
  typeof value === "string" && Object.hasOwn(componentTabs, value);

export const Route = createFileRoute("/library/components/$componentKey")({
  // The version and the tab a reader chose survive a reload, Back and a shared link. The tab is
  // typed as a string so the record's own version navigation, which spreads the previous search
  // without naming this route, still type-checks; only a real tab name gets through.
  validateSearch: (
    search: Record<string, unknown>,
  ): { version?: string | undefined; tab?: string | undefined } => ({
    ...(typeof search["version"] === "string" ? { version: search["version"] } : {}),
    ...(isComponentTab(search["tab"]) ? { tab: search["tab"] } : {}),
  }),
  head: () => ({ meta: [{ title: "Component — Program Assurance" }] }),
  pendingComponent: RecordPending,
  component: ComponentPage,
});
function ComponentPage() {
  const { componentKey } = Route.useParams();
  const record = useRow("component_definitions", componentKey);
  useRecordTitle("Component", record.data?.name);
  const { version, tab } = Route.useSearch();
  const navigate = Route.useNavigate();
  return (
    <ComponentLibraryRecord
      id={componentKey}
      {...(version ? { initialVersion: version } : {})}
      tab={isComponentTab(tab) ? tab : undefined}
      onTabChange={(next) => void navigate({ search: (previous) => ({ ...previous, tab: next }) })}
    />
  );
}
