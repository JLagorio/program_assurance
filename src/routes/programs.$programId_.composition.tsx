import { createFileRoute, redirect } from "@tanstack/react-router";
/** The composition view is the program's System tab; the old URL lands there. */
export const Route = createFileRoute("/programs/$programId_/composition")({
  head: () => ({ meta: [{ title: "System composition — Program Assurance" }] }),
  beforeLoad: ({ params }) => {
    throw redirect({
      to: "/programs/$programId",
      params: { programId: params.programId },
      search: { tab: "System" },
    });
  },
  component: () => null,
});
