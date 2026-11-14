import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { useWorkspace } from "./workspace-context";
import { database, requireIdentity } from "./database";
import type { Database } from "./database.types";
import {
  idSet,
  invalidateModel,
  useRows,
  type ReadContext,
  type Row,
  type TableName,
} from "./models";
import type { StepPlans } from "./next-steps";
import { useStaleOnWrite } from "./server-table";

/*
 * A control in an assessment. Evidence no assessor has determined moves on once an assessment
 * holds the control: the draft plan of one of the program's open campaigns
 * (`add_controls_to_assessment_plan`), or of a campaign planned around it where none has a draft
 * plan (`plan_control_assessment`). Both commands write a control as the assessment objectives it
 * counts (the list `program_control_objectives` gives), one plan objective each, titled by its
 * label and text and aimed at its part, which an assessor's finding judges; a control that counts
 * none is one objective aimed at its statement, as Plan delta assessment writes a control. A plan
 * holds a control once it holds every objective the control counts, or its statement, as every
 * plan written before plans took objectives does; one that holds some takes only the rest. What
 * the campaigns hold of a control is read here (`plan_control_holdings`), for its next step and
 * for the pickers that do it. The program's assessors decide a control once they have judged every
 * objective it counts, so a control judged in part is still waiting on them: its step opens the
 * campaign whose plan holds what is left to judge, which a plan holding the whole control does.
 */

/** The campaign statuses whose plan can still take a control. */
const OPEN_STATUSES = new Set(["planned", "active"]);

const CAMPAIGN_COLUMNS = ["id", "title", "status", "starts_at", "ends_at"] as const;
const PLAN_COLUMNS = [
  "id",
  "campaign_id",
  "title",
  "version_number",
  "state",
  "revision",
  "ssp_revision_id",
] as const;
type CampaignRow = Pick<Row<"assessment_campaigns">, (typeof CAMPAIGN_COLUMNS)[number]>;
type PlanRow = Pick<Row<"assessment_plan_revisions">, (typeof PLAN_COLUMNS)[number]>;

/** A campaign's plan as a picker shows it and a command is sent at. */
export type CampaignPlanRevision = {
  id: string;
  title: string;
  versionNumber: number;
  state: string;
  /** The revision the reader saw, which the command is sent at. */
  revision: number;
  sspRevisionId: string;
};

/** One of the program's open campaigns, and what its latest plan holds of the control. */
export type AssessmentCampaignPlan = {
  id: string;
  title: string;
  status: string;
  startsAt: string | null;
  endsAt: string | null;
  /** The campaign's latest plan revision; none while it has no plan. */
  plan: CampaignPlanRevision | null;
  /** Whether that plan holds the control: every objective it counts, or its statement. */
  holds: boolean;
  /**
   * Whether that plan holds what is left to judge of the control: every objective it counts that
   * the program's assessors have not judged yet (the whole control while none is judged).
   */
  holdsUnjudged: boolean;
  /** How many of the control's objectives that plan holds; none while it has no plan. */
  objectivesHeld: number;
};

/**
 * What the program's open campaigns hold of a control: the campaigns, how many assessment
 * objectives the control counts (none for one a plan takes as its statement), and its step's
 * reading.
 */
export type ControlAssessment = StepPlans & {
  campaigns: AssessmentCampaignPlan[];
  objectives: number;
};

/** What a plan holds of one control. */
export type PlanHolding = {
  /** How many of the objectives the control counts the plan holds. */
  held: number;
  /** It holds every one, or the control's statement: the control takes nothing more. */
  holds: boolean;
  /**
   * It holds every objective the plan's program has not judged yet: the whole control while none
   * is judged, the rest once some are.
   */
  holdsUnjudged: boolean;
};

/** What the named plans hold of one control, as the server reads them. */
export type PlanHoldings = {
  controlId: string;
  /** The assessment objectives the control counts; none for a control a plan takes as its statement. */
  objectives: number;
  /** Each plan named that the reader reads, by its id. */
  plans: ReadonlyMap<string, PlanHolding>;
};

const NOT_HELD: PlanHolding = { held: 0, holds: false, holdsUnjudged: false };

/** Each campaign's latest plan revision, by its campaign. */
export function latestPlans(plans: readonly PlanRow[]): Map<string, PlanRow> {
  const latest = new Map<string, PlanRow>();
  for (const plan of plans) {
    const current = latest.get(plan.campaign_id);
    if (!current || current.version_number < plan.version_number)
      latest.set(plan.campaign_id, plan);
  }
  return latest;
}

/** Active before planned, then the earliest start (none last), then by title. */
const campaignOrder = (a: AssessmentCampaignPlan, b: AssessmentCampaignPlan) =>
  (a.status === "active" ? 0 : 1) - (b.status === "active" ? 0 : 1) ||
  (a.startsAt ?? "￿").localeCompare(b.startsAt ?? "￿") ||
  a.title.localeCompare(b.title, undefined, { numeric: true }) ||
  a.id.localeCompare(b.id);

/**
 * The program's open campaigns (planned or active) with their latest plan and what it holds of the
 * control, in the order a reader looks for one; the campaign whose plan holds what is left to judge
 * of it (the whole control while the program's assessors have judged none of it), first of them;
 * and how many have a draft plan that does not hold that yet, which a plan holding some of its
 * objectives still is, since it takes the rest. A completed or cancelled campaign takes no control,
 * so a control only such a campaign planned is not under way anywhere. `holdings` is what those
 * plans hold of the control (`plan_control_holdings`).
 */
export function controlAssessment(
  campaigns: readonly CampaignRow[],
  plans: readonly PlanRow[],
  holdings: Pick<PlanHoldings, "objectives" | "plans">,
): ControlAssessment {
  const latest = latestPlans(plans);
  const open = campaigns
    .filter((campaign) => OPEN_STATUSES.has(campaign.status))
    .map((campaign): AssessmentCampaignPlan => {
      const plan = latest.get(campaign.id);
      const holding = (plan && holdings.plans.get(plan.id)) || NOT_HELD;
      return {
        id: campaign.id,
        title: campaign.title,
        status: campaign.status,
        startsAt: campaign.starts_at,
        endsAt: campaign.ends_at,
        plan: plan
          ? {
              id: plan.id,
              title: plan.title,
              versionNumber: plan.version_number,
              state: plan.state,
              revision: plan.revision,
              sspRevisionId: plan.ssp_revision_id,
            }
          : null,
        holds: !!plan && holding.holds,
        holdsUnjudged: !!plan && holding.holdsUnjudged,
        objectivesHeld: plan ? holding.held : 0,
      };
    })
    .sort(campaignOrder);
  // Where the assessment of what is left goes on: a control judged in part is under way in the
  // campaign whose plan holds the objectives nobody has judged yet.
  const planned = open.find((campaign) => campaign.holdsUnjudged);
  return {
    campaigns: open,
    objectives: holdings.objectives,
    planned: planned ? { id: planned.id, title: planned.title } : null,
    drafts: open.filter((campaign) => campaign.plan?.state === "draft" && !campaign.holdsUnjudged)
      .length,
  };
}

const holdingsSchema = z.object({
  control_id: z.string(),
  objectives: z.number().int().nonnegative(),
  plans: z.array(
    z.object({
      plan_revision_id: z.string(),
      objectives_held: z.number().int().nonnegative(),
      holds: z.boolean(),
      holds_unjudged: z.boolean(),
    }),
  ),
});

type Client = Pick<SupabaseClient, "rpc">;

/**
 * What the named plans hold of one control, in one request, as the reader: how many assessment
 * objectives the control counts and, for each plan the reader reads, how many of them it holds,
 * whether it holds the control, and whether it holds what its program has not judged yet. A plan
 * left out of the answer holds nothing.
 */
export async function readPlanControlHoldings(
  client: Client,
  { tenantId, token }: ReadContext,
  controlId: string,
  planIds: readonly string[],
  signal?: AbortSignal,
): Promise<PlanHoldings> {
  const args: Database["public"]["Functions"]["plan_control_holdings"]["Args"] = {
    p_tenant_id: tenantId,
    p_control_id: controlId,
    p_plan_revision_ids: [...planIds],
  };
  let request = client
    .rpc("plan_control_holdings", args)
    .setHeader("Authorization", `Bearer ${token}`);
  if (signal) request = request.abortSignal(signal);
  const { data, error } = await request;
  if (error) throw new Error(error.message);
  const answer = holdingsSchema.parse(data);
  return {
    controlId: answer.control_id,
    objectives: answer.objectives,
    plans: new Map(
      answer.plans.map((plan) => [
        plan.plan_revision_id,
        { held: plan.objectives_held, holds: plan.holds, holdsUnjudged: plan.holds_unjudged },
      ]),
    ),
  };
}

/**
 * What a plan holds of a control is read from its objectives, and what is left to judge of it from
 * the findings published on it: a write to one reads it again.
 */
const HOLDING_MODELS = [
  "assessment_objectives",
  "assessment_findings",
  "assessment_results_revisions",
] as const satisfies readonly TableName[];

/**
 * What the program's open assessment campaigns hold of one control, read while `enabled`: the
 * campaigns and their latest plans, each read scoped on the server, and what those plans hold of
 * the control (`plan_control_holdings`). `queries` are the three reads, for a value that waits on
 * them and a region's one alert. A write to a campaign, a plan or an objective reads them again.
 */
export function useControlAssessment(
  programId: string | null | undefined,
  controlId: string | null | undefined,
  { enabled = true }: { enabled?: boolean | undefined } = {},
) {
  const workspace = useWorkspace();
  const on = enabled && !!programId && !!controlId;
  const campaigns = useRows(
    "assessment_campaigns",
    { program_id: programId ?? "" },
    { columns: CAMPAIGN_COLUMNS, enabled: on },
  );
  const openIds = useMemo(
    () =>
      idSet(
        campaigns.data
          ?.filter((campaign) => OPEN_STATUSES.has(campaign.status))
          .map((campaign) => campaign.id),
      ),
    [campaigns.data],
  );
  const plans = useRows(
    "assessment_plan_revisions",
    { campaign_id: openIds },
    { columns: PLAN_COLUMNS, enabled: on && campaigns.isSuccess },
  );
  const latestIds = useMemo(
    () => idSet([...latestPlans(plans.data ?? []).values()].map((plan) => plan.id)),
    [plans.data],
  );
  // What each latest plan holds of the control, and how many objectives the control counts, which
  // the picker says even where no campaign has a plan yet.
  useStaleOnWrite(workspace.tenantId, HOLDING_MODELS, [
    "models",
    workspace.tenantId,
    "plan_control_holdings",
  ]);
  const holdings = useQuery<PlanHoldings, Error>({
    queryKey: ["models", workspace.tenantId, "plan_control_holdings", controlId ?? null, latestIds],
    enabled: on && plans.isSuccess,
    retry: false,
    queryFn: async ({ signal }) =>
      readPlanControlHoldings(
        database(),
        { tenantId: workspace.tenantId, token: await requireIdentity(workspace) },
        controlId!,
        latestIds,
        signal,
      ),
  });
  const data = useMemo(
    () =>
      campaigns.data && plans.data && holdings.data
        ? controlAssessment(campaigns.data, plans.data, holdings.data)
        : undefined,
    [campaigns.data, plans.data, holdings.data],
  );
  return { data, queries: [campaigns, plans, holdings] };
}

/**
 * What a picker of draft plans says of each: how many objectives the plan holds, and whether its
 * SSP's control baseline selects the control, which the plan needs to take it.
 */
export function useDraftPlanDetails(
  plans: readonly CampaignPlanRevision[],
  controlId: string,
  { enabled = true }: { enabled?: boolean | undefined } = {},
) {
  const planIds = useMemo(() => idSet(plans.map((plan) => plan.id)), [plans]);
  const sspIds = useMemo(() => idSet(plans.map((plan) => plan.sspRevisionId)), [plans]);
  const objectives = useRows(
    "assessment_objectives",
    { plan_revision_id: planIds },
    { columns: ["id", "plan_revision_id"], enabled },
  );
  const ssps = useRows(
    "ssp_revisions",
    { id: sspIds },
    { columns: ["id", "profile_resolution_id"], enabled },
  );
  const resolutionIds = useMemo(
    () => idSet(ssps.data?.map((ssp) => ssp.profile_resolution_id)),
    [ssps.data],
  );
  const selected = useRows(
    "selected_controls",
    { control_id: controlId, profile_resolution_id: resolutionIds },
    { columns: ["id", "profile_resolution_id"], enabled: enabled && ssps.isSuccess },
  );
  const data = useMemo(() => {
    if (!objectives.data || !ssps.data || !selected.data) return undefined;
    const counts = new Map<string, number>();
    for (const objective of objectives.data)
      counts.set(objective.plan_revision_id, (counts.get(objective.plan_revision_id) ?? 0) + 1);
    const resolutionOf = new Map(ssps.data.map((ssp) => [ssp.id, ssp.profile_resolution_id]));
    const selecting = new Set(selected.data.map((row) => row.profile_resolution_id));
    return new Map(
      plans.map((plan) => [
        plan.id,
        {
          objectives: counts.get(plan.id) ?? 0,
          selects: selecting.has(resolutionOf.get(plan.sspRevisionId) ?? ""),
        },
      ]),
    );
  }, [plans, objectives.data, ssps.data, selected.data]);
  return { data, queries: [objectives, ssps, selected] };
}

type SspRow = Pick<
  Row<"ssp_revisions">,
  "id" | "system_id" | "version_number" | "profile_resolution_id"
>;

/** A published SSP of one of the program's systems, as Plan an assessment offers it. */
export type PlanSspOption = {
  id: string;
  systemCode: string;
  systemName: string;
  versionNumber: number;
  /** Whether the SSP's control baseline selects the control, which a plan on it needs. */
  selects: boolean;
};

/**
 * The SSPs a new assessment of the control can be pinned to: the latest published revision of
 * each of the program's systems, authorization boundaries first, then by code.
 */
export function usePlanSspOptions(
  programId: string,
  controlId: string,
  { enabled = true }: { enabled?: boolean | undefined } = {},
) {
  const systems = useRows(
    "systems",
    { program_id: programId },
    { columns: ["id", "code", "name", "is_authorization_boundary"], enabled },
  );
  const systemIds = useMemo(() => idSet(systems.data?.map((system) => system.id)), [systems.data]);
  const ssps = useRows(
    "ssp_revisions",
    { system_id: systemIds, state: "published" },
    {
      columns: ["id", "system_id", "version_number", "profile_resolution_id"],
      enabled: enabled && systems.isSuccess,
    },
  );
  const latest = useMemo(() => {
    const bySystem = new Map<string, SspRow>();
    for (const ssp of ssps.data ?? []) {
      const current = bySystem.get(ssp.system_id);
      if (!current || current.version_number < ssp.version_number) bySystem.set(ssp.system_id, ssp);
    }
    return [...bySystem.values()];
  }, [ssps.data]);
  const resolutionIds = useMemo(
    () => idSet(latest.map((ssp) => ssp.profile_resolution_id)),
    [latest],
  );
  const selected = useRows(
    "selected_controls",
    { control_id: controlId, profile_resolution_id: resolutionIds },
    { columns: ["id", "profile_resolution_id"], enabled: enabled && ssps.isSuccess },
  );
  const data = useMemo(() => {
    if (!systems.data || !ssps.data || !selected.data) return undefined;
    const selecting = new Set(selected.data.map((row) => row.profile_resolution_id));
    const systemOf = new Map(systems.data.map((system) => [system.id, system]));
    return latest
      .flatMap((ssp): (PlanSspOption & { boundary: boolean })[] => {
        const system = systemOf.get(ssp.system_id);
        if (!system) return [];
        return [
          {
            id: ssp.id,
            systemCode: system.code,
            systemName: system.name,
            versionNumber: ssp.version_number,
            selects: selecting.has(ssp.profile_resolution_id),
            boundary: system.is_authorization_boundary === true,
          },
        ];
      })
      .sort(
        (a, b) =>
          Number(b.boundary) - Number(a.boundary) ||
          a.systemCode.localeCompare(b.systemCode, undefined, { numeric: true }),
      )
      .map(({ boundary: _boundary, ...option }) => option);
  }, [systems.data, ssps.data, selected.data, latest]);
  return { data, queries: [systems, ssps, selected] };
}

const answerSchema = z.object({
  campaignId: z.string(),
  planRevisionId: z.string(),
  /** The plan objectives the command added. */
  added: z.number().int().nonnegative(),
  /** The chosen controls the plan held whole already, which took nothing. */
  skipped: z.number().int().nonnegative(),
  objectiveIds: z.array(z.string()),
  /**
   * The assessment objectives the chosen controls count, each a plan objective of its own. None
   * where each was written as its statement: a control that counts none, and every answer given
   * before plans took objectives, whose receipt has no count.
   */
  counted: z.number().int().nonnegative().default(0),
});
/**
 * What a command did: the campaign and plan, the objectives it added, the controls it skipped and
 * how many objectives the chosen controls count.
 */
export type AddedObjectives = z.infer<typeof answerSchema>;

export const CONTROL_ASSESSMENT_ANSWER_UNREADABLE =
  "The control was added, but the answer could not be read. Reload to see the campaign's plan.";

type PostgrestFailure = { code?: string | undefined; message: string };

/** A refusal in the reader's words: the command's own, which say what stopped it. */
function refusal(error: PostgrestFailure): Error {
  const message = error.message.trim();
  return new Error(/[.!?]$/.test(message) ? message : `${message}.`);
}

function answer(data: unknown): AddedObjectives {
  const parsed = answerSchema.safeParse(data);
  if (!parsed.success) throw new Error(CONTROL_ASSESSMENT_ANSWER_UNREADABLE);
  return parsed.data;
}

export type AddControlsToAssessmentPlan = {
  planRevisionId: string;
  /** The plan revision the reader saw: a plan changed since is refused. */
  expectedRevision: number;
  /** Chosen once for a choice (`choiceRequests`): the same choice sent again adds nothing more. */
  requestId: string;
  controlIds: readonly string[];
};

/**
 * Add the chosen controls to a campaign's draft plan, at the plan revision the reader saw, in one
 * request: each control as the objectives it counts that the plan does not hold yet (all of them,
 * or the rest), one plan objective each, and a control that counts none as one objective aimed at
 * its statement; a control the plan holds whole takes nothing. A control the plan's SSP does not
 * select refuses the whole choice. Sent again under the same id, the request answers as it first
 * did.
 */
export async function addControlsToAssessmentPlan(
  client: Client,
  { tenantId, token }: ReadContext,
  request: AddControlsToAssessmentPlan,
): Promise<AddedObjectives> {
  const args: Database["public"]["Functions"]["add_controls_to_assessment_plan"]["Args"] = {
    p_tenant_id: tenantId,
    p_plan_revision_id: request.planRevisionId,
    p_expected_revision: request.expectedRevision,
    p_request_id: request.requestId,
    p_control_ids: [...request.controlIds],
  };
  const { data, error } = await client
    .rpc("add_controls_to_assessment_plan", args)
    .setHeader("Authorization", `Bearer ${token}`);
  if (error) throw refusal(error);
  return answer(data);
}

export type PlanControlAssessment = {
  programId: string;
  /** A published SSP of one of the program's systems, which the new plan assesses. */
  sspRevisionId: string;
  title: string;
  /** Chosen once for a choice (`choiceRequests`): the same choice sent again plans nothing more. */
  requestId: string;
  controlIds: readonly string[];
};

/**
 * Plan an assessment of the chosen controls, in one request: a planned campaign of the program
 * with the given title, its first plan a draft pinned to the chosen SSP, holding each control as
 * the objectives it counts, or its statement where it counts none. Sent again under the same id,
 * the request answers as it first did.
 */
export async function planControlAssessment(
  client: Client,
  { tenantId, token }: ReadContext,
  request: PlanControlAssessment,
): Promise<AddedObjectives> {
  const args: Database["public"]["Functions"]["plan_control_assessment"]["Args"] = {
    p_tenant_id: tenantId,
    p_program_id: request.programId,
    p_ssp_revision_id: request.sspRevisionId,
    p_title: request.title,
    p_request_id: request.requestId,
    p_control_ids: [...request.controlIds],
  };
  const { data, error } = await client
    .rpc("plan_control_assessment", args)
    .setHeader("Authorization", `Bearer ${token}`);
  if (error) throw refusal(error);
  return answer(data);
}

/**
 * The request ids of one opening of a picker or a form. An id is chosen once for a choice, the
 * same parts in any order, so sending that choice again writes nothing more; a changed choice is
 * another request.
 */
export function choiceRequests(newId: () => string = () => crypto.randomUUID()) {
  const ids = new Map<string, string>();
  return (parts: readonly string[]): string => {
    const choice = JSON.stringify([...parts].sort());
    const id = ids.get(choice) ?? newId();
    ids.set(choice, id);
    return id;
  };
}

/**
 * Add to assessment campaign as a mutation. The plans and their objectives are read again however
 * the request settles: one whose answer was lost may still have added them, and one refused for a
 * plan that changed is sent again at the revision read now.
 */
export function useAddControlsToAssessmentPlan() {
  const workspace = useWorkspace();
  const cache = useQueryClient();
  return useMutation<AddedObjectives, Error, AddControlsToAssessmentPlan>({
    mutationFn: async (request) =>
      addControlsToAssessmentPlan(
        database(),
        { tenantId: workspace.tenantId, token: await requireIdentity(workspace) },
        request,
      ),
    onSettled: () =>
      void Promise.all(
        (["assessment_plan_revisions", "assessment_objectives"] as const).map((table) =>
          invalidateModel(cache, workspace.tenantId, table),
        ),
      ),
  });
}

/** Plan an assessment as a mutation: the program's campaigns, their plans and objectives read again. */
export function usePlanControlAssessment() {
  const workspace = useWorkspace();
  const cache = useQueryClient();
  return useMutation<AddedObjectives, Error, PlanControlAssessment>({
    mutationFn: async (request) =>
      planControlAssessment(
        database(),
        { tenantId: workspace.tenantId, token: await requireIdentity(workspace) },
        request,
      ),
    onSettled: () =>
      void Promise.all(
        (
          ["assessment_campaigns", "assessment_plan_revisions", "assessment_objectives"] as const
        ).map((table) => invalidateModel(cache, workspace.tenantId, table)),
      ),
  });
}
