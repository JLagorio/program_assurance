import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router";
import { RecordList } from "@/components/app/record-browser";
export const Route = createFileRoute("/records/$collection")({
  head: () => ({ meta: [{ title: "Schema records — Program Assurance" }] }),
  validateSearch: (search: Record<string, unknown>): { field?: string; value?: string } => ({
    ...(typeof search["field"] === "string" ? { field: search["field"] } : {}),
    ...(typeof search["value"] === "string" ? { value: search["value"] } : {}),
  }),
  component: Records,
});
function Records() {
  const { collection } = Route.useParams();
  const { field, value } = Route.useSearch();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  if (pathname.replace(/\/$/, "") !== `/records/${collection}`) return <Outlet />;
  return (
    <RecordList
      key={`${collection}-${field}-${value}`}
      name={collection}
      filter={field && value ? [field, value] : undefined}
    />
  );
}
