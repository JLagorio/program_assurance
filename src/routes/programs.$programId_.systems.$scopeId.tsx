import { createFileRoute, redirect } from "@tanstack/react-router";

import { scopeById } from "@/lib/scopes";

/**
 * The scope record was folded into the element record on 2026-09-02: one
 * subsystem, one record, with the control set as a tab on it. The URL stays
 * for old links and bookmarks and sends the reader to the node that anchors
 * the scope. "Revisions" was a tab of its own before that; it lands on the
 * merged Control set tab.
 */
type NodeTab = "Overview" | "Control set";

export const Route = createFileRoute("/programs/$programId_/systems/$scopeId")({
  validateSearch: (search: Record<string, unknown>): { tab?: NodeTab | undefined } => {
    const raw = String(search["tab"] ?? "").toLowerCase();
    if (raw === "overview" || raw === "components") return { tab: "Overview" };
    if (raw === "revisions" || raw === "control set") return { tab: "Control set" };
    return {};
  },
  beforeLoad: ({ params, search }) => {
    const scope = scopeById.get(params.scopeId);
    if (!scope) {
      throw redirect({
        to: "/programs/$programId",
        params: { programId: params.programId },
        search: { tab: "Systems" },
        replace: true,
      });
    }
    throw redirect({
      to: "/programs/$programId/components/$componentId",
      params: { programId: params.programId, componentId: scope.element },
      search: { tab: search.tab ?? "Control set" },
      replace: true,
    });
  },
  component: () => null,
});
