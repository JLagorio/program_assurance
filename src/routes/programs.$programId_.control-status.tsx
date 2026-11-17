import { createFileRoute, redirect } from "@tanstack/react-router";
import { controlsViewSearch } from "@/lib/program-parts";
/**
 * The Control status view's old address resolves to the Controls part's Status view, which is
 * what it became, asking the same question: its List's search, sort and filters ride beside it
 * under the collection's name, which the Status view's register reads. `show` named the List, which
 * the view now always shows beside the families.
 */
export const Route = createFileRoute("/programs/$programId_/control-status")({
  head: () => ({ meta: [{ title: "Controls — Program Assurance" }] }),
  beforeLoad: ({ params, location }) => {
    const { show: _show, ...question } = location.search as Record<string, unknown>;
    throw redirect({
      to: "/programs/$programId",
      params: { programId: params.programId },
      // The router types a search by the routes that declare one; the question's parameters are
      // the collection's own, kept beside what the route declares.
      search: { ...question, ...controlsViewSearch("Status") } as never,
      replace: true,
    });
  },
  component: () => null,
});
