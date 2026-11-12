import { Link } from "@tanstack/react-router";
import type { ControlStatus } from "@/lib/control-status";
import { registerViews } from "@/lib/register-views";
import { questionSearch } from "./collection-question";

/*
 * The links into a program's Control status List: every count that says how many controls stand
 * somewhere opens the List asked for those controls. The List's question lives in the address
 * under its view, so the link is the question.
 */

/**
 * The search that opens a program's Control status List on a question: the controls at a status,
 * or a family's. A link from the Overview's key, from the view's own key and from a family's card.
 */
export function controlStatusListSearch(question: {
  status?: ControlStatus | undefined;
  family?: string | undefined;
}): Record<string, unknown> {
  return {
    show: "list",
    ...questionSearch(registerViews.controlStatus, {
      search: "",
      filters: [
        ...(question.status ? [{ id: "status", value: [question.status] }] : []),
        ...(question.family ? [{ id: "family", value: [question.family] }] : []),
      ],
    }),
  };
}

/** A link to a program's Control status List asked for one status. */
export const controlStatusLink = (programId: string) => (status: ControlStatus) => (
  <Link
    to="/programs/$programId/control-status"
    params={{ programId }}
    search={controlStatusListSearch({ status })}
  />
);
