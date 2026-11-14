import { useMutation, useQuery, useQueryClient, type UseQueryResult } from "@tanstack/react-query";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { useWorkspace } from "./workspace-context";
import { database, requireIdentity } from "./database";
import type { Database } from "./database.types";
import { itemsByParent, type FrameworkItem } from "./frameworks";
import { idSet, invalidateModel, type ReadContext } from "./models";
import { readServerResult, serverRead, type ServerRow } from "./server-table";

/*
 * Gate criteria drawn from the security outcomes of the system life cycle processes (NIST SP
 * 800-160 Vol. 1 Rev. 1). Each of the publication's 30 processes lists the security outcomes it
 * achieves, and an outcome reads as a criterion of a lifecycle gate. A criterion keeps the outcome
 * it was drawn from (`gate_criteria.outcome_item_id`), which only the command here records; a
 * criterion somebody wrote keeps none.
 *
 * An outcome keeps its code from one reading of the publication to the next and its id does not,
 * so "already a criterion of this gate" is asked by code.
 */

/** A security outcome as a gate can take it: its sentence, and the process and group that hold it. */
export type SecurityOutcome = {
  /** The framework item's id in the revision read: what a criterion drawn from it keeps. */
  id: string;
  /** The outcome's code, the same in every revision: `outcome.SR.2`. */
  code: string;
  /** The outcome's sentence, which becomes the criterion's title. */
  title: string;
  /** The life cycle process that lists it: "System Requirements Definition". */
  process: string;
  /** The process group that holds the process: "Technical Processes". */
  group: string;
};

/**
 * The life cycle framework's outcomes in the order the publication prints them: its process
 * groups, each group's processes, each process's outcomes. Give it every item of the framework
 * (`useFrameworkItems(LIFE_CYCLE_FRAMEWORK)`); an outcome whose process or group was not read is
 * left out, since a row could not say where it comes from.
 */
export function securityOutcomes(items: readonly FrameworkItem[]): SecurityOutcome[] {
  const held = itemsByParent(items);
  const of = (parent: string | null, kind: string) =>
    (held.get(parent) ?? []).filter((item) => item.kind === kind);
  return of(null, "process-group").flatMap((group) =>
    of(group.code, "process").flatMap((process) =>
      of(process.code, "outcome").map((outcome) => ({
        id: outcome.id,
        code: outcome.code,
        title: outcome.title,
        process: process.title,
        group: group.title,
      })),
    ),
  );
}

/* ——— What a gate's criteria were drawn from ————————————————————————————————————————————————— */

const SOURCE_COLUMNS = [
  "id",
  "outcome_item_id",
  "outcome_code",
  "process_title",
  "group_title",
] as const;
/** A gate criterion as the register's view gives it: the outcome it was drawn from, by code, and the names that hold it. */
export type GateCriterionRow = ServerRow<"gate_criterion_rows", (typeof SOURCE_COLUMNS)[number]>;

/** The outcome a criterion was drawn from. A name is empty where the reader cannot read its row. */
export type GateCriterionSource = {
  /** The outcome's code: `outcome.SR.2`. */
  outcomeCode: string | null;
  /** The life cycle process that lists the outcome: "System Requirements Definition". */
  process: string | null;
  /** The process group that holds the process. */
  group: string | null;
};

/** What the criteria of one gate were drawn from. */
export type GateCriterionSources = {
  /** By criterion id. A criterion somebody wrote is not among them. */
  byCriterion: ReadonlyMap<string, GateCriterionSource>;
  /** The codes of the outcomes the gate already holds as criteria. */
  outcomeCodes: ReadonlySet<string>;
};

/** The register view's rows as the sources they name. */
export function gateCriterionSources(rows: readonly GateCriterionRow[]): GateCriterionSources {
  const byCriterion = new Map<string, GateCriterionSource>();
  const outcomeCodes = new Set<string>();
  for (const row of rows) {
    if (!row.outcome_item_id) continue;
    byCriterion.set(row.id, {
      outcomeCode: row.outcome_code,
      process: row.process_title,
      group: row.group_title,
    });
    if (row.outcome_code) outcomeCodes.add(row.outcome_code);
  }
  return { byCriterion, outcomeCodes };
}

/** One gate's criteria with what each was drawn from, in one read of the register's view. */
export async function readGateCriterionRows(
  client: Pick<SupabaseClient, "from">,
  context: ReadContext,
  gateId: string,
  signal?: AbortSignal | undefined,
): Promise<GateCriterionRow[]> {
  const read = serverRead({
    source: "gate_criterion_rows",
    model: "gate_criteria",
    columns: SOURCE_COLUMNS,
    scope: { gate_id: gateId },
  });
  const rows = await readServerResult(client, context, read, {}, signal ? { signal } : {});
  return rows as GateCriterionRow[];
}

/**
 * What a gate's criteria were drawn from, for the register's Source column and for the outcomes
 * the picker marks as already on the gate. Kept under the criteria's model, so a criterion
 * created, edited or removed reads it again; a read that finds the same rows answers with the
 * same sources, so the register's columns stay as they are.
 */
export function useGateCriterionSources(
  gateId: string,
): UseQueryResult<GateCriterionSources, Error> {
  const workspace = useWorkspace();
  return useQuery<GateCriterionRow[], Error, GateCriterionSources>({
    queryKey: ["models", workspace.tenantId, "gate_criteria", "sources", gateId],
    retry: false,
    queryFn: async ({ signal }) =>
      readGateCriterionRows(
        database(),
        { tenantId: workspace.tenantId, token: await requireIdentity(workspace) },
        gateId,
        signal,
      ),
    select: gateCriterionSources,
  });
}

/* ——— Add security outcomes —————————————————————————————————————————————————————————————————— */

export type AddGateSecurityOutcomes = {
  gateId: string;
  /** Chosen once for a choice (`choiceRequests`): the same choice sent again adds nothing more. */
  requestId: string;
  /** The chosen outcomes, by the id the framework read gave them. */
  outcomeItemIds: readonly string[];
};

const answerSchema = z.object({
  gateId: z.string(),
  added: z.number().int().nonnegative(),
  skipped: z.number().int().nonnegative(),
  criterionIds: z.array(z.string()),
});
/**
 * What the command did: the criteria it added, in the gate's order, and how many of the chosen
 * outcomes it skipped because the gate already held them.
 */
export type AddedSecurityOutcomes = z.infer<typeof answerSchema>;

export const GATE_OUTCOMES_REQUEST_REUSED =
  "This request was already used for a different choice. Close this and choose the security outcomes again.";
export const GATE_OUTCOMES_ANSWER_UNREADABLE =
  "The security outcomes were added, but the answer could not be read. Reload to see the gate's criteria.";

type CommandArgs = Database["public"]["Functions"]["add_gate_security_outcomes"]["Args"];

/**
 * Add the chosen security outcomes to one gate as its criteria, in one request: all of them are
 * added or none. Each criterion is titled with its outcome's sentence, is required and follows
 * the gate's last in the order the publication prints the outcomes; an outcome the gate already
 * holds is skipped. The request sent again under the same id answers as it first did.
 */
export async function addGateSecurityOutcomes(
  client: Pick<SupabaseClient, "rpc">,
  { tenantId, token }: ReadContext,
  request: AddGateSecurityOutcomes,
): Promise<AddedSecurityOutcomes> {
  const args: CommandArgs = {
    p_tenant_id: tenantId,
    p_gate_id: request.gateId,
    p_request_id: request.requestId,
    p_outcome_item_ids: [...request.outcomeItemIds],
  };
  const { data, error } = await client
    .rpc("add_gate_security_outcomes", args)
    .setHeader("Authorization", `Bearer ${token}`);
  if (error) throw new Error(error.code === "PT409" ? GATE_OUTCOMES_REQUEST_REUSED : error.message);
  const answer = answerSchema.safeParse(data);
  if (!answer.success) throw new Error(GATE_OUTCOMES_ANSWER_UNREADABLE);
  return answer.data;
}

/**
 * The request ids of one opening of the picker. An id is chosen once for a choice, the same
 * outcomes in any order, so sending that choice again adds nothing more; a changed choice is
 * another request.
 */
export function choiceRequests(newId: () => string = () => crypto.randomUUID()) {
  const ids = new Map<string, string>();
  return (outcomeItemIds: readonly string[]): string => {
    const choice = idSet(outcomeItemIds).join(",");
    const id = ids.get(choice) ?? newId();
    ids.set(choice, id);
    return id;
  };
}

/**
 * Add security outcomes as a mutation. The gate's criteria are read again once the request
 * settles, whichever way: a request whose answer was lost may still have added them.
 */
export function useAddGateSecurityOutcomes() {
  const workspace = useWorkspace();
  const cache = useQueryClient();
  return useMutation<AddedSecurityOutcomes, Error, AddGateSecurityOutcomes>({
    mutationFn: async (request) =>
      addGateSecurityOutcomes(
        database(),
        { tenantId: workspace.tenantId, token: await requireIdentity(workspace) },
        request,
      ),
    onSettled: () => void invalidateModel(cache, workspace.tenantId, "gate_criteria"),
  });
}
