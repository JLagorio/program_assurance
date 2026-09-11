import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * Control-set approvals folded into the profile.
 *
 * A revision approves a scope's categorization, overlays and tailoring — which is
 * a profile decision, not a separate object. This route was never in the nav; it
 * is kept so the one link on My work, and any bookmark, still land.
 */
export const Route = createFileRoute("/scope")({
  beforeLoad: () => {
    throw redirect({ to: "/profiles" });
  },
});
