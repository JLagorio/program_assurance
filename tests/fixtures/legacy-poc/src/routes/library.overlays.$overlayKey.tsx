import { createFileRoute, redirect } from "@tanstack/react-router";

/** The overlay register folded into the component library; a policy is an entry there. */
export const Route = createFileRoute("/library/overlays/$overlayKey")({
  validateSearch: (search: Record<string, unknown>): { version?: string } =>
    typeof search["version"] === "string" ? { version: search["version"] } : {},
  beforeLoad: ({ params, search }) => {
    throw redirect({
      to: "/library/components/$componentKey",
      params: { componentKey: params.overlayKey },
      search,
    });
  },
});
