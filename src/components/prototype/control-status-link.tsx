import { Link } from "@tanstack/react-router";
import type { ControlStatus } from "@/lib/control-status";
import { controlsViewSearch } from "@/lib/program-parts";
import { registerViews } from "@/lib/register-views";
import { questionSearch } from "./collection-question";

/*
 * The links into a program's Controls › Status register: every count that says how many controls
 * stand somewhere opens the register asked for those controls. The register's question lives in
 * the address under its view, so the link is the question.
 */

/**
 * The search that opens a program's Controls › Status register on a question: the controls at a
 * status, or a family's, or both. A link from the Overview's key, from the view's own band and from
 * a family's row.
 */
export function controlStatusListSearch(question: {
  status?: ControlStatus | undefined;
  /** Several statuses at once: the controls that reached a rung of the climb. */
  statuses?: readonly ControlStatus[] | undefined;
  family?: string | undefined;
}): Record<string, unknown> {
  const statuses = question.statuses ?? (question.status ? [question.status] : []);
  return {
    ...controlsViewSearch("Status"),
    ...questionSearch(registerViews.controlStatus, {
      search: "",
      filters: [
        ...(statuses.length ? [{ id: "status", value: [...statuses] }] : []),
        ...(question.family ? [{ id: "family", value: [question.family] }] : []),
      ],
    }),
  };
}

/** A link to a program's Controls › Status register asked for one status. */
export const controlStatusLink = (programId: string) => (status: ControlStatus) => (
  <Link
    to="/programs/$programId"
    params={{ programId }}
    search={controlStatusListSearch({ status }) as never}
  />
);
