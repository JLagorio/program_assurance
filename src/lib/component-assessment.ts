import { useMutation, useQuery, useQueryClient, type UseQueryResult } from "@tanstack/react-query";
import type { SupabaseClient } from "@supabase/supabase-js";
import { useMemo } from "react";
import { z } from "zod";
import { useWorkspace } from "./workspace-context";
import { database, requireIdentity } from "./database";
import type { Database } from "./database.types";
import {
  invalidateModel,
  useRows,
  writeRow,
  type ReadContext,
  type Row,
  type TableName,
} from "./models";
import { PRODUCT_DETERMINATIONS, type ProductDetermination } from "./product-assessment";
import { useStaleOnWrite } from "./server-table";

/*
 * Authoring a component assessment: an assessor's determinations on a published component version
 * (a revision of a component definition), recorded on each component of that version, so a shared
 * component is assessed once for everything built from it. A draft is worked a component at a time.
 * `component_assessment_sheet` gives the whole sheet in one request (the baseline's controls, what
 * each component claims and what is determined so far), `record_component_determinations` records
 * one determination for many controls of one component at once, all or none, and
 * `publish_component_assessment` freezes the draft at the revision the reader saw, one answer a
 * request. Where a published component version stands is `component_control_status`, in
 * `component-reuse`.
 */

type Client = Pick<SupabaseClient, "rpc">;
type TableClient = Pick<SupabaseClient, "from">;

/** What an assessor may find: one vocabulary for a product's elements and a library component. */
export const COMPONENT_DETERMINATIONS = PRODUCT_DETERMINATIONS;
export type ComponentDetermination = ProductDetermination;

const determination = z.enum(COMPONENT_DETERMINATIONS);

const sheetAnswer = z.object({
  assessment: z.object({
    id: z.string(),
    title: z.string(),
    description: z.string().nullable(),
    state: z.enum(["draft", "published"]),
    revision: z.number(),
    component_definition_revision_id: z.string(),
    profile_resolution_id: z.string(),
    assessor_party_id: z.string().nullable(),
    started_on: z.string().nullable(),
    completed_on: z.string().nullable(),
    published_at: z.string().nullable(),
  }),
  definition: z.object({
    id: z.string(),
    code: z.string(),
    name: z.string(),
    version: z.number(),
    owner_party_id: z.string().nullable(),
    business_line_id: z.string().nullable(),
  }),
  components: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      component_type: z.string(),
      claimed: z.number(),
      determined: z.number(),
    }),
  ),
  controls: z.array(
    z.object({
      id: z.string(),
      code: z.string(),
      title: z.string(),
      parent_id: z.string().nullable(),
      family: z.string().nullable(),
      family_title: z.string().nullable(),
    }),
  ),
  claims: z.array(z.tuple([z.string(), z.string()])),
  determinations: z.array(
    z.object({
      component_id: z.string(),
      control_id: z.string(),
      determination,
      rationale: z.string().nullable(),
    }),
  ),
});

export type SheetComponent = {
  id: string;
  name: string;
  componentType: string;
  /** How many controls of the baseline the component claims through its library implementations. */
  claimed: number;
  /** How many controls carry a determination for it. */
  determined: number;
};

export type ComponentSheetControl = {
  id: string;
  code: string;
  title: string;
  parentId: string | null;
  family: string | null;
  familyTitle: string | null;
};

export type ComponentAssessmentSheet = {
  assessment: {
    id: string;
    title: string;
    description: string | null;
    state: "draft" | "published";
    revision: number;
    componentDefinitionRevisionId: string;
    profileResolutionId: string;
    assessorPartyId: string | null;
    startedOn: string | null;
    completedOn: string | null;
    publishedAt: string | null;
  };
  /** The component definition the assessed version belongs to, with who answers for it. */
  definition: {
    id: string;
    code: string;
    name: string;
    version: number;
    ownerPartyId: string | null;
    businessLineId: string | null;
  };
  /** The components of the assessed version, by name. */
  components: SheetComponent[];
  /** The controls of the assessment's control baseline, by family and code. */
  controls: ComponentSheetControl[];
  /** How many determinations the assessment holds in all: what a publication is told it freezes. */
  determined: number;
  /** By component: the controls it claims. */
  claims: ReadonlyMap<string, ReadonlySet<string>>;
  /** By component, then by control: what is determined, and why. */
  determinations: ReadonlyMap<
    string,
    ReadonlyMap<string, { determination: ComponentDetermination; rationale: string | null }>
  >;
};

/** A component assessment's sheet, as the server reads it; null for one that is gone or not visible. */
export async function readComponentAssessmentSheet(
  client: Client,
  context: Pick<ReadContext, "token">,
  assessmentId: string,
  signal?: AbortSignal,
): Promise<ComponentAssessmentSheet | null> {
  let request = client
    .rpc("component_assessment_sheet", { p_assessment_id: assessmentId })
    .setHeader("Authorization", `Bearer ${context.token}`);
  if (signal) request = request.abortSignal(signal);
  const { data, error } = await request;
  if (error) throw new Error(error.message);
  if (data === null) return null;
  const answer = sheetAnswer.parse(data);
  const claims = new Map<string, Set<string>>();
  for (const [componentId, controlId] of answer.claims) {
    const held = claims.get(componentId) ?? new Set<string>();
    held.add(controlId);
    claims.set(componentId, held);
  }
  const determinations = new Map<
    string,
    Map<string, { determination: ComponentDetermination; rationale: string | null }>
  >();
  for (const row of answer.determinations) {
    const held = determinations.get(row.component_id) ?? new Map();
    held.set(row.control_id, { determination: row.determination, rationale: row.rationale });
    determinations.set(row.component_id, held);
  }
  return {
    assessment: {
      id: answer.assessment.id,
      title: answer.assessment.title,
      description: answer.assessment.description,
      state: answer.assessment.state,
      revision: answer.assessment.revision,
      componentDefinitionRevisionId: answer.assessment.component_definition_revision_id,
      profileResolutionId: answer.assessment.profile_resolution_id,
      assessorPartyId: answer.assessment.assessor_party_id,
      startedOn: answer.assessment.started_on,
      completedOn: answer.assessment.completed_on,
      publishedAt: answer.assessment.published_at,
    },
    definition: {
      id: answer.definition.id,
      code: answer.definition.code,
      name: answer.definition.name,
      version: answer.definition.version,
      ownerPartyId: answer.definition.owner_party_id,
      businessLineId: answer.definition.business_line_id,
    },
    components: answer.components.map((component) => ({
      id: component.id,
      name: component.name,
      componentType: component.component_type,
      claimed: component.claimed,
      determined: component.determined,
    })),
    controls: answer.controls.map((control) => ({
      id: control.id,
      code: control.code,
      title: control.title,
      parentId: control.parent_id,
      family: control.family,
      familyTitle: control.family_title,
    })),
    determined: answer.determinations.length,
    claims,
    determinations,
  };
}

const SHEET_MODELS = [
  "component_assessments",
  "component_determinations",
  "component_definitions",
  "defined_components",
  "defined_component_implementations",
] as const satisfies readonly TableName[];

/** A component assessment's sheet; a determination recorded reads it again. */
export function useComponentAssessmentSheet(
  assessmentId: string | null | undefined,
): UseQueryResult<ComponentAssessmentSheet | null, Error> {
  const workspace = useWorkspace();
  const key = ["models", workspace.tenantId, "component_assessment_sheet"];
  useStaleOnWrite(workspace.tenantId, SHEET_MODELS, key);
  return useQuery<ComponentAssessmentSheet | null, Error>({
    queryKey: [...key, assessmentId ?? null],
    enabled: !!assessmentId,
    retry: false,
    queryFn: async ({ signal }) =>
      readComponentAssessmentSheet(
        database(),
        { token: await requireIdentity(workspace) },
        assessmentId!,
        signal,
      ),
  });
}

/**
 * The component a sheet opens on when the reader has chosen none: the first by name that holds a
 * determination, so the work already recorded is what shows; else the first that claims a control;
 * else the first.
 */
export function openingComponent(
  components: readonly SheetComponent[],
): SheetComponent | undefined {
  return (
    components.find((component) => component.determined > 0) ??
    components.find((component) => component.claimed > 0) ??
    components[0]
  );
}

/** One control of the sheet for one component: whether it claims it, and what is determined. */
export type ComponentSheetRow = ComponentSheetControl & {
  claimed: boolean;
  determination: ComponentDetermination | null;
  rationale: string | null;
};

/** The sheet's controls as one component's rows, in the baseline's order. */
export function componentSheetRows(
  sheet: ComponentAssessmentSheet,
  componentId: string,
): ComponentSheetRow[] {
  const claimed = sheet.claims.get(componentId);
  const determined = sheet.determinations.get(componentId);
  return sheet.controls.map((control) => {
    const found = determined?.get(control.id);
    return {
      ...control,
      claimed: claimed?.has(control.id) ?? false,
      determination: found?.determination ?? null,
      rationale: found?.rationale ?? null,
    };
  });
}

/** One determination for many controls of one component; none clears what was recorded. */
export type ComponentDeterminationRecord = {
  assessmentId: string;
  /** The component judged, one of the assessed version's. */
  componentId: string;
  controlIds: readonly string[];
  determination: ComponentDetermination | null;
  rationale?: string | null | undefined;
};

const recordedSchema = z.object({
  assessmentId: z.string(),
  recorded: z.number(),
  cleared: z.number(),
  unchanged: z.number(),
});
export type RecordedComponentDeterminations = z.infer<typeof recordedSchema>;

export const RECORD_NEEDS_COMPONENT = "Choose the component to judge.";
export const RECORD_NEEDS_CONTROLS = "Choose at least one control.";
export const RECORD_TOO_MANY = "Record at most 2,000 controls at a time.";

/**
 * Record one determination for the chosen controls of one component, or clear them, in one request:
 * every control takes it or none does, and recording what is already recorded changes nothing, so
 * the same record sent again is safe.
 */
export async function recordComponentDeterminations(
  client: Client,
  context: ReadContext,
  record: ComponentDeterminationRecord,
): Promise<RecordedComponentDeterminations> {
  if (!record.componentId) throw new Error(RECORD_NEEDS_COMPONENT);
  const controlIds = [...new Set(record.controlIds)];
  if (!controlIds.length) throw new Error(RECORD_NEEDS_CONTROLS);
  if (controlIds.length > 2000) throw new Error(RECORD_TOO_MANY);
  const { data, error } = await client
    .rpc("record_component_determinations", {
      p_tenant_id: context.tenantId,
      p_assessment_id: record.assessmentId,
      p_defined_component_id: record.componentId,
      p_control_ids: controlIds,
      p_determination: record.determination,
      p_rationale: record.determination ? record.rationale?.trim() || null : null,
    })
    .setHeader("Authorization", `Bearer ${context.token}`);
  if (error) throw new Error(error.message);
  return recordedSchema.parse(data);
}

/** Record determinations as a mutation; the sheet is read again once it settles. */
export function useRecordComponentDeterminations() {
  const workspace = useWorkspace();
  const cache = useQueryClient();
  return useMutation<RecordedComponentDeterminations, Error, ComponentDeterminationRecord>({
    mutationFn: async (record) =>
      recordComponentDeterminations(
        database(),
        { tenantId: workspace.tenantId, token: await requireIdentity(workspace) },
        record,
      ),
    onSettled: () => void invalidateModel(cache, workspace.tenantId, "component_determinations"),
  });
}

/** A new draft assessment of a published component version against a control baseline. */
export type NewComponentAssessment = {
  componentDefinitionRevisionId: string;
  profileResolutionId: string;
  title: string;
  assessorPartyId?: string | null | undefined;
  startedOn?: string | null | undefined;
};

export const ASSESSMENT_NEEDS_TITLE = "Give the component assessment a title.";
export const ASSESSMENT_NEEDS_BASELINE = "Choose the control baseline to assess against.";

/** What stops a new assessment before it is sent; empty when it may go. */
export function newComponentAssessmentIssues(values: {
  title: string;
  profileResolutionId: string | null;
}): { field: "title" | "baseline"; message: string }[] {
  return [
    ...(values.title.trim() ? [] : [{ field: "title" as const, message: ASSESSMENT_NEEDS_TITLE }]),
    ...(values.profileResolutionId
      ? []
      : [{ field: "baseline" as const, message: ASSESSMENT_NEEDS_BASELINE }]),
  ];
}

/** Create a draft component assessment. The database refuses a draft version or a draft baseline. */
export async function createComponentAssessment(
  client: TableClient,
  context: ReadContext,
  values: NewComponentAssessment,
): Promise<Row<"component_assessments">> {
  const [issue] = newComponentAssessmentIssues(values);
  if (issue) throw new Error(issue.message);
  return writeRow(client, context, "component_assessments", {
    values: {
      component_definition_revision_id: values.componentDefinitionRevisionId,
      profile_resolution_id: values.profileResolutionId,
      title: values.title.trim(),
      assessor_party_id: values.assessorPartyId ?? null,
      started_on: values.startedOn || null,
    },
  });
}

export function useCreateComponentAssessment() {
  const workspace = useWorkspace();
  const cache = useQueryClient();
  return useMutation<Row<"component_assessments">, Error, NewComponentAssessment>({
    mutationFn: async (values) =>
      createComponentAssessment(
        database(),
        { tenantId: workspace.tenantId, token: await requireIdentity(workspace) },
        values,
      ),
    onSettled: () => void invalidateModel(cache, workspace.tenantId, "component_assessments"),
  });
}

/** A draft assessment as the reader saw it, which a publication freezes. */
export type ComponentAssessmentToPublish = {
  id: string;
  /** The revision the reader saw: an assessment changed since is refused. */
  revision: number;
  /** How many determinations the reader was told it holds: another number is refused. */
  determined: number;
  /** The day the work ended, where the reader says it. */
  completedOn?: string | null | undefined;
};

export type PublishComponentAssessmentRequest = ComponentAssessmentToPublish & {
  /** Chosen once for one publication: the same request sent again answers as it first did. */
  requestId: string;
};

const publishedSchema = z.object({
  assessmentId: z.string(),
  componentDefinitionRevisionId: z.string(),
  determinations: z.number().int().nonnegative(),
  components: z.number().int().nonnegative(),
  publishedAt: z.string(),
  completedOn: z.string().nullable(),
});
/** What a publication did: the assessment, the version it judges and what it froze. */
export type PublishedComponentAssessment = z.infer<typeof publishedSchema>;

export const PUBLISH_NEEDS_DETERMINATIONS =
  "Record at least one determination before publishing the assessment.";
export const PUBLISH_REVISION_MISSING =
  "Reload the component assessment before publishing it; its revision is missing.";
export const PUBLISH_ANSWER_UNREADABLE =
  "The component assessment was published, but the answer could not be read. Reload to see it.";

/** A refusal in the reader's words: the command's own, which say what stopped it. */
function refusal(error: { message: string }): Error {
  const message = error.message.trim();
  return new Error(/[.!?]$/.test(message) ? message : `${message}.`);
}

/**
 * Publish a draft component assessment in one request, at the revision the reader saw and holding
 * the determinations the reader was told. It then stands for every consumer of the component
 * version and can no longer change. An assessment already published, changed since, holding no
 * determination or not in the workspace is refused in words the reader acts on. Sent again under
 * the same id, the request answers as it first did.
 */
export async function publishComponentAssessment(
  client: Client,
  { tenantId, token }: ReadContext,
  request: PublishComponentAssessmentRequest,
): Promise<PublishedComponentAssessment> {
  if (request.determined < 1) throw new Error(PUBLISH_NEEDS_DETERMINATIONS);
  if (!Number.isSafeInteger(request.revision)) throw new Error(PUBLISH_REVISION_MISSING);
  const args: Database["public"]["Functions"]["publish_component_assessment"]["Args"] = {
    p_tenant_id: tenantId,
    p_assessment_id: request.id,
    p_expected_revision: request.revision,
    p_expected_determinations: request.determined,
    p_request_id: request.requestId,
    ...(request.completedOn ? { p_completed_on: request.completedOn } : {}),
  };
  const { data, error } = await client
    .rpc("publish_component_assessment", args)
    .setHeader("Authorization", `Bearer ${token}`);
  if (error) throw refusal(error);
  const parsed = publishedSchema.safeParse(data);
  if (!parsed.success) throw new Error(PUBLISH_ANSWER_UNREADABLE);
  return parsed.data;
}

/**
 * Publish a component assessment as a mutation. However the request settles, every read of the
 * assessments reads again, and with them each read that names the model: the sheet, the component
 * version's standing, the register and a system's upstream. A refusal for an assessment someone
 * else published, or changed, then shows it as it is.
 */
export function usePublishComponentAssessment() {
  const workspace = useWorkspace();
  const cache = useQueryClient();
  return useMutation<PublishedComponentAssessment, Error, PublishComponentAssessmentRequest>({
    mutationFn: async (request) =>
      publishComponentAssessment(
        database(),
        { tenantId: workspace.tenantId, token: await requireIdentity(workspace) },
        request,
      ),
    onSettled: () => void invalidateModel(cache, workspace.tenantId, "component_assessments"),
  });
}

/** The assessments of a component version, newest first. */
export function useComponentAssessments(componentDefinitionRevisionId: string | null | undefined) {
  const assessments = useRows(
    "component_assessments",
    { component_definition_revision_id: componentDefinitionRevisionId ?? "" },
    { enabled: !!componentDefinitionRevisionId },
  );
  const sorted = useMemo(
    () =>
      assessments.data
        ? [...assessments.data].sort((a, b) => b.created_at.localeCompare(a.created_at))
        : undefined,
    [assessments.data],
  );
  return { query: assessments, assessments: sorted };
}
