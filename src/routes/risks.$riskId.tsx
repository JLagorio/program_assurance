import { createFileRoute, redirect } from "@tanstack/react-router";
export const Route = createFileRoute("/risks/$riskId")({
  head: () => ({ meta: [{ title: "Risk — Program Assurance" }] }),
  beforeLoad: ({ params }) => {
    throw redirect({ to: "/register/risks/$riskId", params });
  },
});
