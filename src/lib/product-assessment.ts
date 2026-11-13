import { useMutation, useQuery, useQueryClient, type UseQueryResult } from "@tanstack/react-query";
import type { SupabaseClient } from "@supabase/supabase-js";
import { useMemo } from "react";
import { z } from "zod";
import { useWorkspace } from "@/components/app/workspace";
import { database, requireIdentity } from "./database";
import {
  invalidateModel,
  useRows,
  writeRow,
  type ReadContext,
  type Row,
  type TableName,
} from "./models";
import { useStaleOnWrite } from "./server-table";

/*
 * Authoring a product assessment: an assessor's determinations on a published product version,
 * recorded where the product varies, on the element. A draft assessment is worked an element at a
 * time. `product_assessment_sheet` gives the whole sheet in one request (the baseline's controls,
 * what each element claims and what is determined so far), and `record_product_determinations`
 * records one determination for many controls of one element at once, all or none. Publishing
 * freezes the assessment and makes it the version's standing, which `product_control_status` reads.
 */

type Client = Pick<SupabaseClient, "rpc">;
type TableClient = Pick<SupabaseClient, "from">;

/** What an assessor may find. */
export const PRODUCT_DETERMINATIONS = [
  "satisfied",
  "partially_satisfied",
  "other_than_satisfied",
] as const;
export type ProductDetermination = (typeof PRODUCT_DETERMINATIONS)[number];

const determination = z.enum(PRODUCT_DETERMINATIONS);

const sheetAnswer = z.object({
  assessment: z.object({
    id: z.string(),
    title: z.string(),
    description: z.string().nullable(),
    state: z.enum(["draft", "published"]),
    revision: z.number(),
    product_revision_id: z.string(),
    profile_resolution_id: z.string(),
    assessor_party_id: z.string().nullable(),
    started_on: z.string().nullable(),
    completed_on: z.string().nullable(),
    published_at: z.string().nullable(),
  }),
  elements: z.array(
    z.object({
      id: z.string(),
      code: z.string(),
      name: z.string(),
      claimed: z.number(),
      determined: z.number(),
    }),
  ),
  whole_determined: z.number(),
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
      element_id: z.string().nullable(),
      control_id: z.string(),
      determination,
      rationale: z.string().nullable(),
    }),
  ),
});

/** The key of the product as a whole among the sheet's elements. */
export const WHOLE_PRODUCT = "whole";

export type SheetElement = {
  /** The element's id, or `WHOLE_PRODUCT` for a determination that stands in every configuration. */
  id: string;
  code: string | null;
  name: string;
  /** How many controls of the baseline the element claims through its library component. */
  claimed: number;
  /** How many controls carry a determination for it. */
  determined: number;
};

export type SheetControl = {
  id: string;
  code: string;
  title: string;
  parentId: string | null;
  family: string | null;
  familyTitle: string | null;
};

export type ProductAssessmentSheet = {
  assessment: {
    id: string;
    title: string;
    description: string | null;
    state: "draft" | "published";
    revision: number;
    productRevisionId: string;
    profileResolutionId: string;
    assessorPartyId: string | null;
    startedOn: string | null;
    completedOn: string | null;
    publishedAt: string | null;
  };
  /** The product as a whole first, then the version's elements by code. */
  elements: SheetElement[];
  /** The controls of the assessment's control baseline, by family and code. */
  controls: SheetControl[];
  /** How many determinations the assessment holds in all. */
  determined: number;
  /** By element (or `WHOLE_PRODUCT`): the controls it claims. */
  claims: ReadonlyMap<string, ReadonlySet<string>>;
  /** By element (or `WHOLE_PRODUCT`), then by control: what is determined, and why. */
  determinations: ReadonlyMap<
    string,
    ReadonlyMap<string, { determination: ProductDetermination; rationale: string | null }>
  >;
};

/** A product assessment's sheet, as the server reads it; null for one that is gone or not visible. */
export async function readProductAssessmentSheet(
  client: Client,
  context: ReadContext,
  assessmentId: string,
  signal?: AbortSignal,
): Promise<ProductAssessmentSheet | null> {
  let request = client
    .rpc("product_assessment_sheet", {
      p_tenant_id: context.tenantId,
      p_assessment_id: assessmentId,
    })
    .setHeader("Authorization", `Bearer ${context.token}`);
  if (signal) request = request.abortSignal(signal);
  const { data, error } = await request;
  if (error) throw new Error(error.message);
  if (data === null) return null;
  const answer = sheetAnswer.parse(data);
  const claims = new Map<string, Set<string>>();
  for (const [elementId, controlId] of answer.claims) {
    const held = claims.get(elementId) ?? new Set<string>();
    held.add(controlId);
    claims.set(elementId, held);
  }
  const determinations = new Map<
    string,
    Map<string, { determination: ProductDetermination; rationale: string | null }>
  >();
  for (const row of answer.determinations) {
    const key = row.element_id ?? WHOLE_PRODUCT;
    const held = determinations.get(key) ?? new Map();
    held.set(row.control_id, { determination: row.determination, rationale: row.rationale });
    determinations.set(key, held);
  }
  return {
    assessment: {
      id: answer.assessment.id,
      title: answer.assessment.title,
      description: answer.assessment.description,
      state: answer.assessment.state,
      revision: answer.assessment.revision,
      productRevisionId: answer.assessment.product_revision_id,
      profileResolutionId: answer.assessment.profile_resolution_id,
      assessorPartyId: answer.assessment.assessor_party_id,
      startedOn: answer.assessment.started_on,
      completedOn: answer.assessment.completed_on,
      publishedAt: answer.assessment.published_at,
    },
    elements: [
      {
        id: WHOLE_PRODUCT,
        code: null,
        name: "Whole product",
        claimed: 0,
        determined: answer.whole_determined,
      },
      ...answer.elements,
    ],
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
  "product_assessments",
  "product_determinations",
  "product_elements",
  "defined_component_implementations",
] as const satisfies readonly TableName[];

/** A product assessment's sheet; a determination recorded reads it again. */
export function useProductAssessmentSheet(
  assessmentId: string | null | undefined,
): UseQueryResult<ProductAssessmentSheet | null, Error> {
  const workspace = useWorkspace();
  const key = ["models", workspace.tenantId, "product_assessment_sheet"];
  useStaleOnWrite(workspace.tenantId, SHEET_MODELS, key);
  return useQuery<ProductAssessmentSheet | null, Error>({
    queryKey: [...key, assessmentId ?? null],
    enabled: !!assessmentId,
    retry: false,
    queryFn: async ({ signal }) =>
      readProductAssessmentSheet(
        database(),
        { tenantId: workspace.tenantId, token: await requireIdentity(workspace) },
        assessmentId!,
        signal,
      ),
  });
}

/** One control of the sheet for one element: whether the element claims it, and what is determined. */
export type SheetRow = SheetControl & {
  claimed: boolean;
  determination: ProductDetermination | null;
  rationale: string | null;
};

/** The sheet's controls as one element's rows, in the baseline's order. */
export function sheetRows(sheet: ProductAssessmentSheet, elementId: string): SheetRow[] {
  const claimed = sheet.claims.get(elementId);
  const determined = sheet.determinations.get(elementId);
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

/** One determination for many controls of one element; none clears what was recorded. */
export type DeterminationRecord = {
  assessmentId: string;
  /** The element, or `WHOLE_PRODUCT`. */
  elementId: string;
  controlIds: readonly string[];
  determination: ProductDetermination | null;
  rationale?: string | null | undefined;
};

const recordedSchema = z.object({
  assessmentId: z.string(),
  recorded: z.number(),
  cleared: z.number(),
  unchanged: z.number(),
});
export type RecordedDeterminations = z.infer<typeof recordedSchema>;

export const RECORD_NEEDS_CONTROLS = "Choose at least one control.";
export const RECORD_TOO_MANY = "Record at most 2,000 controls at a time.";

/**
 * Record one determination for the chosen controls of one element, or clear them, in one request:
 * every control takes it or none does, and recording what is already recorded changes nothing.
 */
export async function recordProductDeterminations(
  client: Client,
  context: ReadContext,
  record: DeterminationRecord,
): Promise<RecordedDeterminations> {
  const controlIds = [...new Set(record.controlIds)];
  if (!controlIds.length) throw new Error(RECORD_NEEDS_CONTROLS);
  if (controlIds.length > 2000) throw new Error(RECORD_TOO_MANY);
  const { data, error } = await client
    .rpc("record_product_determinations", {
      p_tenant_id: context.tenantId,
      p_assessment_id: record.assessmentId,
      p_element_id: record.elementId === WHOLE_PRODUCT ? null : record.elementId,
      p_control_ids: controlIds,
      p_determination: record.determination,
      p_rationale: record.determination ? record.rationale?.trim() || null : null,
    })
    .setHeader("Authorization", `Bearer ${context.token}`);
  if (error) throw new Error(error.message);
  return recordedSchema.parse(data);
}

/** Record determinations as a mutation; the sheet is read again once it settles. */
export function useRecordProductDeterminations() {
  const workspace = useWorkspace();
  const cache = useQueryClient();
  return useMutation<RecordedDeterminations, Error, DeterminationRecord>({
    mutationFn: async (record) =>
      recordProductDeterminations(
        database(),
        { tenantId: workspace.tenantId, token: await requireIdentity(workspace) },
        record,
      ),
    onSettled: () => void invalidateModel(cache, workspace.tenantId, "product_determinations"),
  });
}

/** A new draft assessment of a published product version against a control baseline. */
export type NewProductAssessment = {
  productRevisionId: string;
  profileResolutionId: string;
  title: string;
  assessorPartyId?: string | null | undefined;
  startedOn?: string | null | undefined;
};

export const ASSESSMENT_NEEDS_TITLE = "Give the product assessment a title.";
export const ASSESSMENT_NEEDS_BASELINE = "Choose the control baseline to assess against.";

/** What stops a new assessment before it is sent; empty when it may go. */
export function newAssessmentIssues(values: {
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

/** Create a draft product assessment. The database refuses a draft version or a draft baseline. */
export async function createProductAssessment(
  client: TableClient,
  context: ReadContext,
  values: NewProductAssessment,
): Promise<Row<"product_assessments">> {
  const [issue] = newAssessmentIssues(values);
  if (issue) throw new Error(issue.message);
  return writeRow(client, context, "product_assessments", {
    values: {
      product_revision_id: values.productRevisionId,
      profile_resolution_id: values.profileResolutionId,
      title: values.title.trim(),
      assessor_party_id: values.assessorPartyId ?? null,
      started_on: values.startedOn || null,
    },
  });
}

export function useCreateProductAssessment() {
  const workspace = useWorkspace();
  const cache = useQueryClient();
  return useMutation<Row<"product_assessments">, Error, NewProductAssessment>({
    mutationFn: async (values) =>
      createProductAssessment(
        database(),
        { tenantId: workspace.tenantId, token: await requireIdentity(workspace) },
        values,
      ),
    onSettled: () => void invalidateModel(cache, workspace.tenantId, "product_assessments"),
  });
}

export const PUBLISH_NEEDS_DETERMINATIONS =
  "Record at least one determination before publishing the assessment.";

/**
 * Publish a draft assessment at the revision the reader saw. It then stands as the version's
 * assessment and can no longer change; `completedOn` records the day the work ended.
 */
export async function publishProductAssessment(
  client: TableClient,
  context: ReadContext,
  assessment: { id: string; revision: number; determined: number; completedOn?: string | null },
): Promise<Row<"product_assessments">> {
  if (!assessment.determined) throw new Error(PUBLISH_NEEDS_DETERMINATIONS);
  return writeRow(client, context, "product_assessments", {
    id: assessment.id,
    revision: assessment.revision,
    values: {
      state: "published",
      ...(assessment.completedOn ? { completed_on: assessment.completedOn } : {}),
    },
  });
}

export function usePublishProductAssessment() {
  const workspace = useWorkspace();
  const cache = useQueryClient();
  return useMutation<
    Row<"product_assessments">,
    Error,
    { id: string; revision: number; determined: number; completedOn?: string | null }
  >({
    mutationFn: async (assessment) =>
      publishProductAssessment(
        database(),
        { tenantId: workspace.tenantId, token: await requireIdentity(workspace) },
        assessment,
      ),
    onSettled: () => void invalidateModel(cache, workspace.tenantId, "product_assessments"),
  });
}

/** The assessments of a product version, newest first. */
export function useProductAssessments(productRevisionId: string | null | undefined) {
  const assessments = useRows(
    "product_assessments",
    { product_revision_id: productRevisionId ?? "" },
    { enabled: !!productRevisionId },
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

/** The published control baselines a product can be assessed against, by name. */
export function useBaselineOptions() {
  const resolutions = useRows("profile_resolutions", undefined, {
    columns: ["id", "profile_revision_id", "state"],
  });
  const revisions = useRows("profile_revisions", undefined, {
    columns: ["id", "profile_id", "title", "version"],
  });
  const profiles = useRows("profiles", undefined, { columns: ["id", "title"] });
  const options = useMemo(
    () =>
      (resolutions.data ?? [])
        .filter((resolution) => resolution.state === "published")
        .flatMap((resolution) => {
          const revision = revisions.data?.find((row) => row.id === resolution.profile_revision_id);
          const profile = profiles.data?.find((row) => row.id === revision?.profile_id);
          return revision
            ? [
                {
                  value: resolution.id,
                  label: `${profile?.title ?? revision.title} · ${revision.version}`,
                },
              ]
            : [];
        })
        .sort((a, b) => a.label.localeCompare(b.label, undefined, { numeric: true })),
    [resolutions.data, revisions.data, profiles.data],
  );
  return { options, queries: [resolutions, revisions, profiles] };
}

/** A control baseline by the name its picker gives it; undefined while it loads or when it is gone. */
export function useBaselineName(profileResolutionId: string | null | undefined) {
  const { options, queries } = useBaselineOptions();
  return {
    name: options.find((option) => option.value === profileResolutionId)?.label,
    queries,
  };
}
