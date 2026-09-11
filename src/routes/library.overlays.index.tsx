import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/library/overlays/")({
  beforeLoad: () => {
    throw redirect({ to: "/library/components" });
  },
});
