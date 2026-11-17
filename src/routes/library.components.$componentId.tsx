import { Navigate, createFileRoute } from "@tanstack/react-router";
import { RecordPending } from "@/components/app/shell";
import { useRecordTitle } from "@/components/app/browser-title";
import { useRow } from "@/lib/models";
import { ComponentRecord, isComponentTab } from "@/components/prototype/component-record";
import { isComponentSetTab } from "@/components/prototype/library-components";

export const Route = createFileRoute("/library/components/$componentId")({
  // The address names the version shown (a `defined_components` id), the tab and, on Findings, the
  // offer under review, so a reload, Back and a shared link keep them. The tab is typed as a
  // string, so an address from before components had pages, which named a component set and one
  // of its tabs, keeps its tab on the way to the set; `version` is that set's version.
  validateSearch: (
    search: Record<string, unknown>,
  ): {
    tab?: string | undefined;
    offer?: string | undefined;
    version?: string | undefined;
  } => ({
    ...(typeof search["tab"] === "string" ? { tab: search["tab"] } : {}),
    ...(typeof search["offer"] === "string" ? { offer: search["offer"] } : {}),
    ...(typeof search["version"] === "string" ? { version: search["version"] } : {}),
  }),
  head: () => ({ meta: [{ title: "Component — Program Assurance" }] }),
  pendingComponent: RecordPending,
  component: ComponentPage,
});

function ComponentPage() {
  const { componentId } = Route.useParams();
  const { tab, version } = Route.useSearch();
  const navigate = Route.useNavigate();
  const component = useRow("defined_components", componentId);
  // An address from before components had pages names a component set: it opens the set, at the
  // version and the tab it named.
  const set = useRow("component_definitions", component.data === null ? componentId : null);
  useRecordTitle("Component", component.data?.name);
  if (set.data)
    return (
      <Navigate
        to="/library/component-sets/$setId"
        params={{ setId: set.data.id }}
        search={{
          ...(version ? { version } : {}),
          ...(isComponentSetTab(tab) ? { tab } : {}),
        }}
        replace
      />
    );
  // Not a component: the set it might be is still being looked for.
  if (component.data === null && set.isPending && !set.isError) return <RecordPending />;
  return (
    <ComponentRecord
      id={componentId}
      component={component}
      // The address owns the tab, so Back to an address without one is Overview again.
      tab={isComponentTab(tab) ? tab : "Overview"}
      onTab={(next) =>
        void navigate({
          // Another tab leaves the offer the Findings tab was opened on.
          search: (previous) => ({ ...previous, tab: next, offer: undefined }),
        })
      }
      onVersion={(id) =>
        void navigate({
          to: "/library/components/$componentId",
          params: { componentId: id },
          search: (previous) => ({ ...previous, offer: undefined }),
        })
      }
    />
  );
}
