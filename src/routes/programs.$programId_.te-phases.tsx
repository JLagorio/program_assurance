import { createFileRoute, redirect } from "@tanstack/react-router";
/** The Cyber T&E phases address is the program's Assessment campaigns tab; the old URL lands there. */
export const Route = createFileRoute("/programs/$programId_/te-phases")({
  head: () => ({ meta: [{ title: "Program — Program Assurance" }] }),
  beforeLoad: ({ params }) => {
    throw redirect({
      to: "/programs/$programId",
      params: { programId: params.programId },
      search: { tab: "Assessment campaigns" },
    });
  },
  component: () => null,
});
