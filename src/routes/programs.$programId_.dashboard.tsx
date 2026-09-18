import { createFileRoute, redirect } from "@tanstack/react-router";
/** The legacy dashboard address resolves to the program Overview. */
export const Route = createFileRoute("/programs/$programId_/dashboard")({
  head: () => ({ meta: [{ title: "Program — Program Assurance" }] }),
  beforeLoad: ({ params }) => {
    throw redirect({
      to: "/programs/$programId",
      params: { programId: params.programId },
      search: { tab: "Overview" },
    });
  },
  component: () => null,
});
