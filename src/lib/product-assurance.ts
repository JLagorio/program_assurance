import {
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
  type UseQueryResult,
} from "@tanstack/react-query";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { useWorkspace } from "./workspace-context";
import { database, requireIdentity } from "./database";
import { invalidateModel, useRows, type ReadContext, type TableName } from "./models";
import { useStaleOnWrite } from "./server-table";
import {
  complianceStatuses,
  productControlStatuses,
  requirementMetBy,
  variantDeltas,
} from "./status";

/*
 * A product assessed once, and what a program's variant of it changes.
 *
 * `product_control_status` answers what a product version gives for each control: for its core,
 * the elements every configuration includes, and for each configuration. `variant_control_delta`
 * answers each control of a variant's control baseline against that: inherited, shared, changed
 * here or program only. `variant_version_changes` says what taking a newer version of the product
 * would do to a variant, and `take_product_version` does it. `requirement_source_compliance` gives
 * a customer's requirements document back as a compliance matrix, each requirement with what meets
 * it. Each is one request, read as the reader. The words and their order are
 * `productControlStatuses`, `variantDeltas`, `complianceStatuses` and `requirementMetBy` in status.
 */

type Client = Pick<SupabaseClient, "rpc">;

/** What a product gives for a control in one scope: a key of `productControlStatuses`. */
export type ProductControlStatus = keyof typeof productControlStatuses;
export const PRODUCT_CONTROL_STATUS_ORDER = Object.keys(
  productControlStatuses,
) as ProductControlStatus[];
/** Where a control of a variant stands against its product: a key of `variantDeltas`. */
export type VariantDelta = keyof typeof variantDeltas;
export const VARIANT_DELTA_ORDER = Object.keys(variantDeltas) as VariantDelta[];
/** A program's answer to a requirement: a key of `complianceStatuses`. */
export type ComplianceStatus = keyof typeof complianceStatuses;
export const COMPLIANCE_STATUS_ORDER = Object.keys(complianceStatuses) as ComplianceStatus[];
/** What meets a requirement: a key of `requirementMetBy`. */
export type RequirementMetBy = keyof typeof requirementMetBy;
export const REQUIREMENT_MET_BY_ORDER = Object.keys(requirementMetBy) as RequirementMetBy[];
/** What a program may change in an element it inherited. */
export const ELEMENT_CHANGE_KINDS = ["software", "firmware", "hardware", "data"] as const;
export type ElementChangeKind = (typeof ELEMENT_CHANGE_KINDS)[number];
export const ELEMENT_CHANGE_LABELS: Record<ElementChangeKind, string> = {
  software: "Software",
  firmware: "Firmware",
  hardware: "Hardware",
  data: "Data",
};
/** What a program changed in an element, as a cell and a preview say it: "Firmware, Software". */
export const elementChangeText = (kinds: readonly string[] | null | undefined): string =>
  (kinds ?? [])
    .map((kind) => ELEMENT_CHANGE_LABELS[kind as ElementChangeKind] ?? kind)
    .sort()
    .join(", ");
export const VERIFICATION_METHODS = [
  "inspection",
  "analysis",
  "demonstration",
  "test",
  "similarity",
] as const;
export type VerificationMethod = (typeof VERIFICATION_METHODS)[number];

const productStatus = z.enum(
  PRODUCT_CONTROL_STATUS_ORDER as [ProductControlStatus, ...ProductControlStatus[]],
);
const delta = z.enum(VARIANT_DELTA_ORDER as [VariantDelta, ...VariantDelta[]]);
const compliance = z.enum(COMPLIANCE_STATUS_ORDER as [ComplianceStatus, ...ComplianceStatus[]]);
const metBy = z.enum(REQUIREMENT_MET_BY_ORDER as [RequirementMetBy, ...RequirementMetBy[]]);
const changeKind = z.enum(ELEMENT_CHANGE_KINDS);
const counts = <Key extends string>(keys: readonly Key[]) =>
  z.object(Object.fromEntries(keys.map((key) => [key, z.number()])) as Record<Key, z.ZodNumber>);

const controlFacts = {
  id: z.string(),
  code: z.string(),
  title: z.string(),
  parent_id: z.string().nullable(),
  family: z.string().nullable(),
  family_title: z.string().nullable(),
};

/* ——— What a product gives ————————————————————————————————————————————————————————————————————— */

const productAnswer = z.object({
  product_revision_id: z.string(),
  assessment: z
    .object({
      id: z.string(),
      title: z.string(),
      published_at: z.string(),
      completed_on: z.string().nullable(),
      assessor_party_id: z.string().nullable(),
      profile_resolution_id: z.string(),
    })
    .nullable(),
  configurations: z.array(
    z.object({ id: z.string(), code: z.string(), name: z.string(), elements: z.number() }),
  ),
  core_elements: z.number(),
  totals: z.object({
    controls: z.number(),
    satisfied_everywhere: z.number(),
    differs: z.number(),
    scopes: z.record(z.string(), counts(PRODUCT_CONTROL_STATUS_ORDER)),
  }),
  controls: z.array(
    z.object({
      ...controlFacts,
      core: productStatus,
      configurations: z.record(z.string(), productStatus),
      differs: z.boolean(),
    }),
  ),
});

export type ProductControlCounts = Record<ProductControlStatus, number>;

/** A control with what the product gives for it in its core and in each configuration. */
export type ProductControlStanding = {
  id: string;
  code: string; // "AC-2(1)"
  title: string;
  parentId: string | null;
  family: string | null;
  familyTitle: string | null;
  core: ProductControlStatus;
  /** By configuration id. */
  configurations: Record<string, ProductControlStatus>;
  /** The control stands differently from one configuration to another. */
  differs: boolean;
};

export type ProductConfigurationScope = {
  id: string;
  code: string;
  name: string;
  /** How many elements of the version the configuration includes. */
  elements: number;
  counts: ProductControlCounts;
};

export type ProductControlStatusAnswer = {
  productRevisionId: string;
  /** The latest published assessment of the version, or none: then nothing is judged. */
  assessment: {
    id: string;
    title: string;
    publishedAt: string;
    completedOn: string | null;
    assessorPartyId: string | null;
    profileResolutionId: string;
  } | null;
  /** How many controls are read: the assessment's baseline, else what the elements claim. */
  total: number;
  /** Controls satisfied in every configuration. */
  satisfiedEverywhere: number;
  /** Controls that stand differently from one configuration to another. */
  differs: number;
  /** The elements every active configuration includes, and where they stand. */
  core: { elements: number; counts: ProductControlCounts };
  /** The active configurations, by code. */
  configurations: ProductConfigurationScope[];
  controls: ProductControlStanding[];
};

const emptyProductCounts = (): ProductControlCounts => ({
  not_covered: 0,
  not_assessed: 0,
  other_than_satisfied: 0,
  partially_satisfied: 0,
  satisfied: 0,
});

async function ask(
  client: Client,
  context: Pick<ReadContext, "token">,
  name: string,
  args: Record<string, unknown>,
  signal?: AbortSignal,
): Promise<unknown> {
  let request = client.rpc(name, args).setHeader("Authorization", `Bearer ${context.token}`);
  if (signal) request = request.abortSignal(signal);
  const { data, error } = await request;
  if (error) throw new Error(error.message);
  return data;
}

/** What a product version gives for each control, as the server reads it. */
export async function readProductControlStatus(
  client: Client,
  context: ReadContext,
  productRevisionId: string,
  signal?: AbortSignal,
): Promise<ProductControlStatusAnswer> {
  const answer = productAnswer.parse(
    await ask(
      client,
      context,
      "product_control_status",
      { p_tenant_id: context.tenantId, p_product_revision_id: productRevisionId },
      signal,
    ),
  );
  const scope = (key: string) => answer.totals.scopes[key] ?? emptyProductCounts();
  return {
    productRevisionId: answer.product_revision_id,
    assessment: answer.assessment && {
      id: answer.assessment.id,
      title: answer.assessment.title,
      publishedAt: answer.assessment.published_at,
      completedOn: answer.assessment.completed_on,
      assessorPartyId: answer.assessment.assessor_party_id,
      profileResolutionId: answer.assessment.profile_resolution_id,
    },
    total: answer.totals.controls,
    satisfiedEverywhere: answer.totals.satisfied_everywhere,
    differs: answer.totals.differs,
    core: { elements: answer.core_elements, counts: scope("core") },
    configurations: answer.configurations.map((configuration) => ({
      ...configuration,
      counts: scope(configuration.id),
    })),
    controls: answer.controls.map((control) => ({
      id: control.id,
      code: control.code,
      title: control.title,
      parentId: control.parent_id,
      family: control.family,
      familyTitle: control.family_title,
      core: control.core,
      configurations: control.configurations,
      differs: control.differs,
    })),
  };
}

/** Every model the product's standing is read from: a write to one reads it again. */
const PRODUCT_MODELS = [
  "product_assessments",
  "product_determinations",
  "product_configurations",
  "product_configuration_elements",
  "product_elements",
  "defined_component_implementations",
] as const satisfies readonly TableName[];

/** What a product version gives for each control. One version's answer never stands in for another's. */
export function useProductControlStatus(
  productRevisionId: string | null | undefined,
): UseQueryResult<ProductControlStatusAnswer, Error> {
  const workspace = useWorkspace();
  const key = ["models", workspace.tenantId, "product_control_status"];
  useStaleOnWrite(workspace.tenantId, PRODUCT_MODELS, key);
  return useQuery<ProductControlStatusAnswer, Error>({
    queryKey: [...key, productRevisionId ?? null],
    enabled: !!productRevisionId,
    retry: false,
    queryFn: async ({ signal }) =>
      readProductControlStatus(
        database(),
        { tenantId: workspace.tenantId, token: await requireIdentity(workspace) },
        productRevisionId!,
        signal,
      ),
  });
}

/** Several product versions' standings at once, by version id: a row of a register reads its own. */
export function useProductsControlStatus(
  productRevisionIds: readonly string[],
): ReadonlyMap<string, UseQueryResult<ProductControlStatusAnswer, Error>> {
  const workspace = useWorkspace();
  const key = ["models", workspace.tenantId, "product_control_status"];
  useStaleOnWrite(workspace.tenantId, PRODUCT_MODELS, key);
  const answers = useQueries({
    queries: productRevisionIds.map((revisionId) => ({
      queryKey: [...key, revisionId],
      retry: false,
      queryFn: async ({ signal }: { signal: AbortSignal }) =>
        readProductControlStatus(
          database(),
          { tenantId: workspace.tenantId, token: await requireIdentity(workspace) },
          revisionId,
          signal,
        ),
    })),
  });
  return new Map(
    productRevisionIds.map((revisionId, index) => [
      revisionId,
      answers[index] as UseQueryResult<ProductControlStatusAnswer, Error>,
    ]),
  );
}

/* ——— What a variant changes ——————————————————————————————————————————————————————————————————— */

const changedElement = z.object({
  product_element_id: z.string(),
  system_id: z.string().nullable(),
  code: z.string(),
  name: z.string(),
  change: z.enum(["modified", "removed"]),
  kinds: z.array(changeKind),
});

const deltaAnswer = z.object({
  system_id: z.string(),
  product: z
    .object({
      id: z.string(),
      code: z.string(),
      name: z.string(),
      revision_id: z.string(),
      version: z.number(),
      configuration_id: z.string(),
      configuration_code: z.string(),
      configuration: z.string(),
    })
    .nullable(),
  program_id: z.string().optional(),
  assessment: z
    .object({ id: z.string(), title: z.string(), published_at: z.string() })
    .nullable()
    .optional(),
  update_available: z
    .object({ revision_id: z.string(), version: z.number() })
    .nullable()
    .optional(),
  elements: z
    .object({ inherited: z.number(), modified: z.number(), removed: z.number(), added: z.number() })
    .optional(),
  totals: counts(VARIANT_DELTA_ORDER).extend({ controls: z.number() }).optional(),
  controls: z
    .array(
      z.object({
        ...controlFacts,
        delta,
        product_status: productStatus.nullable(),
        changed_elements: z.array(changedElement),
      }),
    )
    .optional(),
});

/** An element of the product behind a control that the variant modified or left out. */
export type ChangedElement = {
  productElementId: string;
  /** The element in the variant; none when it was left out. */
  systemId: string | null;
  code: string;
  name: string;
  change: "modified" | "removed";
  kinds: ElementChangeKind[];
};

export type VariantControl = {
  id: string;
  code: string;
  title: string;
  parentId: string | null;
  family: string | null;
  familyTitle: string | null;
  delta: VariantDelta;
  /** What the product gives on what the variant kept; null where the product gives nothing. */
  productStatus: ProductControlStatus | null;
  changedElements: ChangedElement[];
};

export type VariantControlDelta = {
  systemId: string;
  programId: string;
  product: {
    id: string;
    code: string;
    name: string;
    revisionId: string;
    version: number;
    configurationId: string;
    configurationCode: string;
    configuration: string;
  };
  /** The product assessment the standing is read from, or none. */
  assessment: { id: string; title: string; publishedAt: string } | null;
  /** A newer published version of the product, when there is one. */
  updateAvailable: { revisionId: string; version: number } | null;
  /** The configuration's elements as the variant holds them, and the program's own. */
  elements: { inherited: number; modified: number; removed: number; added: number };
  total: number;
  counts: Record<VariantDelta, number>;
  controls: VariantControl[];
};

/**
 * A variant's delta, as the server reads it. A system that was not created from a product has
 * none, which is null and not an empty delta.
 */
export async function readVariantControlDelta(
  client: Client,
  context: ReadContext,
  systemId: string,
  signal?: AbortSignal,
): Promise<VariantControlDelta | null> {
  const answer = deltaAnswer.parse(
    await ask(
      client,
      context,
      "variant_control_delta",
      { p_tenant_id: context.tenantId, p_system_id: systemId },
      signal,
    ),
  );
  if (
    !answer.product ||
    !answer.totals ||
    !answer.elements ||
    !answer.controls ||
    !answer.program_id
  )
    return null;
  const { controls: total, ...byDelta } = answer.totals;
  return {
    systemId: answer.system_id,
    programId: answer.program_id,
    product: {
      id: answer.product.id,
      code: answer.product.code,
      name: answer.product.name,
      revisionId: answer.product.revision_id,
      version: answer.product.version,
      configurationId: answer.product.configuration_id,
      configurationCode: answer.product.configuration_code,
      configuration: answer.product.configuration,
    },
    assessment: answer.assessment
      ? {
          id: answer.assessment.id,
          title: answer.assessment.title,
          publishedAt: answer.assessment.published_at,
        }
      : null,
    updateAvailable: answer.update_available
      ? {
          revisionId: answer.update_available.revision_id,
          version: answer.update_available.version,
        }
      : null,
    elements: answer.elements,
    total,
    counts: byDelta,
    controls: answer.controls.map((control) => ({
      id: control.id,
      code: control.code,
      title: control.title,
      parentId: control.parent_id,
      family: control.family,
      familyTitle: control.family_title,
      delta: control.delta,
      productStatus: control.product_status,
      changedElements: control.changed_elements.map((element) => ({
        productElementId: element.product_element_id,
        systemId: element.system_id,
        code: element.code,
        name: element.name,
        change: element.change,
        kinds: element.kinds,
      })),
    })),
  };
}

/** Every model a delta is read from, beside the product's own. */
const DELTA_MODELS = [
  ...PRODUCT_MODELS,
  "systems",
  "product_revisions",
  "selected_controls",
] as const satisfies readonly TableName[];

/** A variant's delta against the product it was created from; null for a system that has none. */
export function useVariantControlDelta(
  systemId: string | null | undefined,
): UseQueryResult<VariantControlDelta | null, Error> {
  const workspace = useWorkspace();
  const key = ["models", workspace.tenantId, "variant_control_delta"];
  useStaleOnWrite(workspace.tenantId, DELTA_MODELS, key);
  return useQuery<VariantControlDelta | null, Error>({
    queryKey: [...key, systemId ?? null],
    enabled: !!systemId,
    retry: false,
    queryFn: async ({ signal }) =>
      readVariantControlDelta(
        database(),
        { tenantId: workspace.tenantId, token: await requireIdentity(workspace) },
        systemId!,
        signal,
      ),
  });
}

/**
 * Several variants' deltas at once, by system id: a row of a register reads its own, once. A
 * system that was not created from a product answers null.
 */
export function useVariantsControlDelta(
  systemIds: readonly string[],
): ReadonlyMap<string, UseQueryResult<VariantControlDelta | null, Error>> {
  const workspace = useWorkspace();
  const key = ["models", workspace.tenantId, "variant_control_delta"];
  useStaleOnWrite(workspace.tenantId, DELTA_MODELS, key);
  const answers = useQueries({
    queries: systemIds.map((systemId) => ({
      queryKey: [...key, systemId],
      retry: false,
      queryFn: async ({ signal }: { signal: AbortSignal }) =>
        readVariantControlDelta(
          database(),
          { tenantId: workspace.tenantId, token: await requireIdentity(workspace) },
          systemId,
          signal,
        ),
    })),
  });
  return new Map(
    systemIds.map((systemId, index) => [
      systemId,
      answers[index] as UseQueryResult<VariantControlDelta | null, Error>,
    ]),
  );
}

/** What a program changed in an element it inherited. No kinds withdraws the declaration. */
export type ElementChange = {
  systemId: string;
  /** The element's revision as the reader saw it. */
  expectedRevision: number;
  kinds: readonly ElementChangeKind[];
  rationale: string | null;
};

const declaredSchema = z.object({
  systemId: z.string(),
  revision: z.number(),
  kinds: z.array(changeKind),
  changed: z.boolean(),
});
export type DeclaredElementChange = z.infer<typeof declaredSchema>;

export const ELEMENT_CHANGE_NEEDS_REASON = "Say why the program changed this element.";

/**
 * Record what a program changed in an inherited element, or withdraw it, in one request. The same
 * declaration sent again changes nothing; the command's refusals are passed on as they are.
 */
export async function declareElementChange(
  client: Client,
  context: ReadContext,
  request: ElementChange,
): Promise<DeclaredElementChange> {
  const kinds = [...new Set(request.kinds)];
  const rationale = request.rationale?.trim() || null;
  if (kinds.length && !rationale) throw new Error(ELEMENT_CHANGE_NEEDS_REASON);
  return declaredSchema.parse(
    await ask(client, context, "declare_product_element_change", {
      p_tenant_id: context.tenantId,
      p_system_id: request.systemId,
      p_expected_revision: request.expectedRevision,
      p_kinds: kinds,
      p_rationale: rationale,
    }),
  );
}

/** Declare an element's change as a mutation; the element's reads are marked stale once it settles. */
export function useDeclareElementChange() {
  const workspace = useWorkspace();
  const cache = useQueryClient();
  return useMutation<DeclaredElementChange, Error, ElementChange>({
    mutationFn: async (request) =>
      declareElementChange(
        database(),
        { tenantId: workspace.tenantId, token: await requireIdentity(workspace) },
        request,
      ),
    onSettled: () => void invalidateModel(cache, workspace.tenantId, "systems"),
  });
}

/**
 * What a delta assessment of a variant planned now would hold: how many controls the variant owes
 * and how many objectives they make, each control as the assessment objectives it counts and one
 * for a control that counts none.
 */
const deltaObjectivesAnswer = z.object({
  system_id: z.string(),
  controls: z.number(),
  objectives: z.number(),
});
export type DeltaAssessmentObjectives = { systemId: string; controls: number; objectives: number };

/** How many objectives a delta assessment of the variant would hold, and over how many controls. */
export async function readDeltaAssessmentObjectives(
  client: Client,
  context: ReadContext,
  systemId: string,
  signal?: AbortSignal,
): Promise<DeltaAssessmentObjectives> {
  const answer = deltaObjectivesAnswer.parse(
    await ask(
      client,
      context,
      "delta_assessment_objectives",
      { p_tenant_id: context.tenantId, p_system_id: systemId },
      signal,
    ),
  );
  return { systemId: answer.system_id, controls: answer.controls, objectives: answer.objectives };
}

/**
 * What Plan delta assessment's Dialog says before the command runs: the objectives the plan will
 * hold. Read again when anything the variant's delta is read from changes.
 */
export function useDeltaAssessmentObjectives(
  systemId: string | null | undefined,
): UseQueryResult<DeltaAssessmentObjectives, Error> {
  const workspace = useWorkspace();
  const key = ["models", workspace.tenantId, "delta_assessment_objectives"];
  useStaleOnWrite(workspace.tenantId, DELTA_MODELS, key);
  return useQuery<DeltaAssessmentObjectives, Error>({
    queryKey: [...key, systemId ?? null],
    enabled: !!systemId,
    retry: false,
    queryFn: async ({ signal }) =>
      readDeltaAssessmentObjectives(
        database(),
        { tenantId: workspace.tenantId, token: await requireIdentity(workspace) },
        systemId!,
        signal,
      ),
  });
}

/** A variant's planned delta assessment: the campaign, its draft plan and how much it holds. */
const plannedSchema = z.object({
  campaignId: z.string(),
  created: z.boolean(),
  planRevisionId: z.string().nullable(),
  /** The plan's objectives: each owed control's assessment objectives, one for a control that counts none. */
  objectives: z.number(),
  /** The controls they are of. */
  controls: z.number(),
  changedHere: z.number().optional(),
  programOnly: z.number().optional(),
});
export type PlannedDeltaAssessment = z.infer<typeof plannedSchema>;

export type DeltaAssessmentPlan = {
  systemId: string;
  /** Chosen once for the plan: it becomes the campaign's id, so sending it again makes no second one. */
  requestId: string;
  title?: string | null | undefined;
};

/**
 * Plan a variant's delta assessment: an assessment campaign on the variant's published SSP whose
 * plan holds each control that is changed here or the program's only as the assessment objectives
 * it counts. The command refuses a variant whose SSP is still a draft, and says so.
 */
export async function planDeltaAssessment(
  client: Client,
  context: ReadContext,
  request: DeltaAssessmentPlan,
): Promise<PlannedDeltaAssessment> {
  return plannedSchema.parse(
    await ask(client, context, "plan_delta_assessment", {
      p_tenant_id: context.tenantId,
      p_system_id: request.systemId,
      p_request_id: request.requestId,
      p_title: request.title?.trim() || null,
    }),
  );
}

/** Plan a delta assessment as a mutation; the campaign registers are marked stale once it settles. */
export function usePlanDeltaAssessment() {
  const workspace = useWorkspace();
  const cache = useQueryClient();
  return useMutation<PlannedDeltaAssessment, Error, DeltaAssessmentPlan>({
    mutationFn: async (request) =>
      planDeltaAssessment(
        database(),
        { tenantId: workspace.tenantId, token: await requireIdentity(workspace) },
        request,
      ),
    onSettled: () => {
      void invalidateModel(cache, workspace.tenantId, "assessment_campaigns");
      void invalidateModel(cache, workspace.tenantId, "assessment_plan_revisions");
      void invalidateModel(cache, workspace.tenantId, "assessment_objectives");
    },
  });
}

/* ——— Taking a newer product version ————————————————————————————————————————————————————————— */

/**
 * What becomes of an element when a variant takes a newer version of its product, in the order a
 * reader looks at them: what is new first, what is left as it is last.
 */
export const VERSION_CHANGES = ["added", "released", "skipped", "stays_removed", "kept"] as const;
export type VersionChange = (typeof VERSION_CHANGES)[number];

const versionRef = z.object({ revision_id: z.string(), version: z.number() });
const named = z.object({ id: z.string(), code: z.string(), name: z.string() });
const versionChangesAnswer = z.object({
  system_id: z.string(),
  current: z.boolean(),
  product: named,
  configuration: named,
  from: versionRef,
  to: versionRef,
  assessment: z.object({ id: z.string(), title: z.string(), published_at: z.string() }).nullable(),
  elements: z.array(
    z.object({
      code: z.string(),
      name: z.string(),
      element_type: z.string(),
      change: z.enum(VERSION_CHANGES),
      system_id: z.string().nullable(),
      system_code: z.string().nullable(),
      parent_code: z.string().nullable(),
      modified: z.boolean(),
      pin_changed: z.boolean(),
    }),
  ),
  totals: z.object({
    kept: z.number(),
    added: z.number(),
    released: z.number(),
    stays_removed: z.number(),
    skipped: z.number(),
    pin_changed: z.number(),
  }),
});

/** One element of the newer version's configuration, or of the variant, and what becomes of it. */
export type VersionElementChange = {
  /** The element's code in the product. */
  code: string;
  name: string;
  elementType: string;
  change: VersionChange;
  /** The variant's element, where it holds one. */
  systemId: string | null;
  /** The element's code in the variant: the one it has, or the one an added element takes. */
  systemCode: string | null;
  parentCode: string | null;
  /** A kept element the program changed: the change stays declared. */
  modified: boolean;
  /** A kept element whose library component differs in the newer version. */
  pinChanged: boolean;
};

export type VariantVersionChanges = {
  systemId: string;
  /** The variant is at this version already: there is nothing to take. */
  current: boolean;
  product: { id: string; code: string; name: string };
  configuration: { id: string; code: string; name: string };
  from: { revisionId: string; version: number };
  to: { revisionId: string; version: number };
  /** The newer version's latest published product assessment, or none: nobody assessed it yet. */
  assessment: { id: string; title: string; publishedAt: string } | null;
  elements: VersionElementChange[];
  counts: Record<VersionChange, number>;
  pinChanged: number;
};

/** What taking a version of its product would do to a variant, as the server reads it. */
export async function readVariantVersionChanges(
  client: Client,
  context: ReadContext,
  systemId: string,
  revisionId: string,
  signal?: AbortSignal,
): Promise<VariantVersionChanges> {
  const answer = versionChangesAnswer.parse(
    await ask(
      client,
      context,
      "variant_version_changes",
      { p_tenant_id: context.tenantId, p_system_id: systemId, p_product_revision_id: revisionId },
      signal,
    ),
  );
  return {
    systemId: answer.system_id,
    current: answer.current,
    product: answer.product,
    configuration: answer.configuration,
    from: { revisionId: answer.from.revision_id, version: answer.from.version },
    to: { revisionId: answer.to.revision_id, version: answer.to.version },
    assessment: answer.assessment && {
      id: answer.assessment.id,
      title: answer.assessment.title,
      publishedAt: answer.assessment.published_at,
    },
    elements: answer.elements.map((element) => ({
      code: element.code,
      name: element.name,
      elementType: element.element_type,
      change: element.change,
      systemId: element.system_id,
      systemCode: element.system_code,
      parentCode: element.parent_code,
      modified: element.modified,
      pinChanged: element.pin_changed,
    })),
    counts: {
      added: answer.totals.added,
      released: answer.totals.released,
      skipped: answer.totals.skipped,
      stays_removed: answer.totals.stays_removed,
      kept: answer.totals.kept,
    },
    pinChanged: answer.totals.pin_changed,
  };
}

/** What taking a version would change in a variant: read as its review opens, and changes nothing. */
export function useVariantVersionChanges(
  systemId: string | null | undefined,
  revisionId: string | null | undefined,
): UseQueryResult<VariantVersionChanges, Error> {
  const workspace = useWorkspace();
  const key = ["models", workspace.tenantId, "variant_version_changes"];
  useStaleOnWrite(workspace.tenantId, DELTA_MODELS, key);
  return useQuery<VariantVersionChanges, Error>({
    queryKey: [...key, systemId ?? null, revisionId ?? null],
    enabled: !!systemId && !!revisionId,
    retry: false,
    queryFn: async ({ signal }) =>
      readVariantVersionChanges(
        database(),
        { tenantId: workspace.tenantId, token: await requireIdentity(workspace) },
        systemId!,
        revisionId!,
        signal,
      ),
  });
}

export type ProductVersionTake = {
  /** The variant: a system created from a product configuration. */
  systemId: string;
  /** The variant's revision as the reader saw it. */
  expectedRevision: number;
  /** The published version to take. */
  revisionId: string;
  /** Chosen once for the take: it names the library components the added elements bring. */
  requestId: string;
};

const takenSchema = z.object({
  systemId: z.string(),
  revision: z.number(),
  changed: z.boolean(),
  version: z.number(),
  kept: z.number(),
  added: z.number(),
  released: z.number(),
  staysRemoved: z.number(),
  skipped: z.number(),
  elements: z.array(z.object({ systemId: z.string(), code: z.string(), name: z.string() })),
});
export type TakenProductVersion = z.infer<typeof takenSchema>;

/**
 * Take a newer published version of its product into a variant, in one request: kept elements
 * follow the newer version, elements new in the product are created, and elements the
 * configuration no longer has become the program's own. A variant already at that version is left
 * as it is, so sending the request again changes nothing.
 */
export async function takeProductVersion(
  client: Client,
  context: ReadContext,
  request: ProductVersionTake,
): Promise<TakenProductVersion> {
  return takenSchema.parse(
    await ask(client, context, "take_product_version", {
      p_tenant_id: context.tenantId,
      p_system_id: request.systemId,
      p_expected_revision: request.expectedRevision,
      p_product_revision_id: request.revisionId,
      p_request_id: request.requestId,
    }),
  );
}

/** Take a product version as a mutation; what it writes is marked stale once it settles. */
export function useTakeProductVersion() {
  const workspace = useWorkspace();
  const cache = useQueryClient();
  return useMutation<TakenProductVersion, Error, ProductVersionTake>({
    mutationFn: async (request) =>
      takeProductVersion(
        database(),
        { tenantId: workspace.tenantId, token: await requireIdentity(workspace) },
        request,
      ),
    onSettled: () => {
      for (const model of TAKE_MODELS) void invalidateModel(cache, workspace.tenantId, model);
    },
  });
}

/** What taking a version writes: the variant's elements, their components and the program's activity. */
const TAKE_MODELS = [
  "systems",
  "system_components",
  "library_assignments",
  "activity_events",
] as const satisfies readonly TableName[];

/* ——— What the screens draw from them ————————————————————————————————————————————————————————— */

/** What a grouping by control family reads of a control. */
type FiledControl = {
  id: string;
  parentId: string | null;
  family: string | null;
  familyTitle: string | null;
};

/** A control family with its controls, each enhancement under its control, and a count a key. */
export type ControlFamily<Control extends FiledControl, Key extends string> = {
  /** The family's code, "AC"; "Other" for a control the catalog files under no family. */
  code: string;
  title: string | null;
  /** How many of the family's controls are read, enhancements included. */
  total: number;
  counts: Record<Key, number>;
  controls: (Control & { enhancements: Control[] })[];
};

/**
 * Controls by family in the order they are given, each enhancement under its control, counting
 * the key `read` gives each: a variant's deltas, or a product's statuses in one scope.
 */
export function controlFamilies<Control extends FiledControl, Key extends string>(
  controls: readonly Control[],
  keys: readonly Key[],
  read: (control: Control) => Key,
): ControlFamily<Control, Key>[] {
  const families = new Map<string, ControlFamily<Control, Key>>();
  const held = new Map<string, Control & { enhancements: Control[] }>();
  const ids = new Set(controls.map((control) => control.id));
  const familyOf = (control: Control) => {
    const code = control.family ?? "Other";
    let family = families.get(code);
    if (!family) {
      family = {
        code,
        title: control.familyTitle,
        total: 0,
        counts: Object.fromEntries(keys.map((key) => [key, 0])) as Record<Key, number>,
        controls: [],
      };
      families.set(code, family);
    }
    return family;
  };
  // The controls first, so an enhancement finds its control wherever the order put it.
  for (const control of controls) {
    if (control.parentId && ids.has(control.parentId)) continue;
    const top = { ...control, enhancements: [] };
    held.set(control.id, top);
    familyOf(control).controls.push(top);
  }
  for (const control of controls) {
    const family = familyOf(control);
    family.total += 1;
    family.counts[read(control)] += 1;
    if (control.parentId && ids.has(control.parentId)) {
      const parent = held.get(control.parentId);
      if (parent) parent.enhancements.push(control);
      else family.controls.push({ ...control, enhancements: [] });
    }
  }
  return [...families.values()];
}

/** The controls a variant owes an assessment on: those changed here and the program's only. */
export const controlsOwed = (delta: Pick<VariantControlDelta, "counts">): number =>
  delta.counts.changed_here + delta.counts.program_only;

/** The controls a variant does not assess again: inherited, and shared with the product. */
export const controlsCarried = (delta: Pick<VariantControlDelta, "counts">): number =>
  delta.counts.inherited + delta.counts.shared;

/** An element of the product the variant modified or left out, with the controls behind it. */
export type VariantElementChange = ChangedElement & {
  /** How many controls of the baseline stand on the element, and so owe an assessment. */
  controls: number;
};

/** The product's elements a variant modified or left out, by code, each with its control count. */
export function variantElementChanges(
  delta: Pick<VariantControlDelta, "controls">,
): VariantElementChange[] {
  const changes = new Map<string, VariantElementChange>();
  for (const control of delta.controls)
    for (const element of control.changedElements) {
      const change = changes.get(element.productElementId);
      if (change) change.controls += 1;
      else changes.set(element.productElementId, { ...element, controls: 1 });
    }
  return [...changes.values()].sort((a, b) =>
    a.code.localeCompare(b.code, undefined, { numeric: true }),
  );
}

/**
 * A program's product variants: its boundary systems that were created from a configuration, in
 * the order the program took them (the one it was created around first), then by code.
 */
export function useProgramVariants(programId: string | null | undefined) {
  const systems = useRows(
    "systems",
    { program_id: programId ?? "", is_authorization_boundary: true },
    {
      columns: [
        "id",
        "code",
        "name",
        "revision",
        "created_at",
        "product_revision_id",
        "product_configuration_id",
      ],
      enabled: !!programId,
    },
  );
  return {
    query: systems,
    variants: systems.data
      ?.filter((system) => system.product_configuration_id)
      .sort(
        (a, b) =>
          a.created_at.localeCompare(b.created_at) ||
          a.code.localeCompare(b.code, undefined, { numeric: true }),
      ),
  };
}

/** The assessment campaigns that Plan delta assessment made for a variant. */
export function useDeltaAssessments(systemId: string | null | undefined) {
  return useRows(
    "assessment_campaigns",
    { variant_system_id: systemId ?? "" },
    { columns: ["id", "title", "status", "variant_system_id"], enabled: !!systemId },
  );
}

/** How a product's controls stand in one scope: its core, or a configuration by id. */
export function productScopeStatus(
  control: Pick<ProductControlStanding, "core" | "configurations">,
  scope: "core" | (string & {}),
): ProductControlStatus {
  return scope === "core" ? control.core : (control.configurations[scope] ?? "not_covered");
}

/* ——— A customer's requirements ———————————————————————————————————————————————————————————————— */

const complianceAnswer = z.object({
  source: z.object({
    id: z.string(),
    program_id: z.string(),
    code: z.string(),
    title: z.string(),
    issuer_party_id: z.string().nullable(),
    document_reference: z.string().nullable(),
    version_label: z.string().nullable(),
    received_on: z.string().nullable(),
  }),
  totals: counts(COMPLIANCE_STATUS_ORDER).extend({
    requirements: z.number(),
    unanswered: z.number(),
    met_by: counts(REQUIREMENT_MET_BY_ORDER),
  }),
  requirements: z.array(
    z.object({
      id: z.string(),
      code: z.string(),
      reference: z.string().nullable(),
      revision_id: z.string(),
      title: z.string(),
      statement: z.string(),
      type: z.string(),
      status: compliance.nullable(),
      verification_method: z.enum(VERIFICATION_METHODS).nullable(),
      compliance_statement: z.string().nullable(),
      met_by: metBy,
      elements: z.array(
        z.object({
          system_id: z.string(),
          code: z.string(),
          name: z.string(),
          standing: z.enum(["inherited", "modified", "own"]),
        }),
      ),
      controls: z.number(),
      evidence: z.number(),
    }),
  ),
});

export type RequirementCompliance = {
  id: string;
  code: string;
  /** The requirement's paragraph in its document. */
  reference: string | null;
  revisionId: string;
  title: string;
  statement: string;
  type: string;
  /** The program's answer; null while nobody has answered. */
  status: ComplianceStatus | null;
  verificationMethod: VerificationMethod | null;
  complianceStatement: string | null;
  metBy: RequirementMetBy;
  /** The elements it is allocated to, each as the variant holds it. */
  elements: {
    systemId: string;
    code: string;
    name: string;
    standing: "inherited" | "modified" | "own";
  }[];
  /** How many controls it maps and how many evidence versions it cites. */
  controls: number;
  evidence: number;
};

export type RequirementSourceCompliance = {
  source: {
    id: string;
    programId: string;
    code: string;
    title: string;
    issuerPartyId: string | null;
    documentReference: string | null;
    versionLabel: string | null;
    receivedOn: string | null;
  };
  total: number;
  counts: Record<ComplianceStatus, number>;
  /** Requirements nobody has answered: not counted as non-compliant. */
  unanswered: number;
  metBy: Record<RequirementMetBy, number>;
  /** In the document's order. */
  requirements: RequirementCompliance[];
};

/** A customer's requirements document as a compliance matrix, as the server reads it. */
export async function readRequirementSourceCompliance(
  client: Client,
  context: ReadContext,
  sourceId: string,
  signal?: AbortSignal,
): Promise<RequirementSourceCompliance> {
  const answer = complianceAnswer.parse(
    await ask(
      client,
      context,
      "requirement_source_compliance",
      { p_tenant_id: context.tenantId, p_source_id: sourceId },
      signal,
    ),
  );
  const { requirements: total, unanswered, met_by, ...byStatus } = answer.totals;
  return {
    source: {
      id: answer.source.id,
      programId: answer.source.program_id,
      code: answer.source.code,
      title: answer.source.title,
      issuerPartyId: answer.source.issuer_party_id,
      documentReference: answer.source.document_reference,
      versionLabel: answer.source.version_label,
      receivedOn: answer.source.received_on,
    },
    total,
    counts: byStatus,
    unanswered,
    metBy: met_by,
    requirements: answer.requirements.map((requirement) => ({
      id: requirement.id,
      code: requirement.code,
      reference: requirement.reference,
      revisionId: requirement.revision_id,
      title: requirement.title,
      statement: requirement.statement,
      type: requirement.type,
      status: requirement.status,
      verificationMethod: requirement.verification_method,
      complianceStatement: requirement.compliance_statement,
      metBy: requirement.met_by,
      elements: requirement.elements.map((element) => ({
        systemId: element.system_id,
        code: element.code,
        name: element.name,
        standing: element.standing,
      })),
      controls: requirement.controls,
      evidence: requirement.evidence,
    })),
  };
}

const COMPLIANCE_MODELS = [
  "requirement_sources",
  "requirement_compliance",
  "engineering_requirements",
  "requirement_revisions",
  "requirement_allocations",
  "requirement_control_links",
  "requirement_evidence",
  "systems",
] as const satisfies readonly TableName[];

/** A customer's requirements document as a compliance matrix. */
export function useRequirementSourceCompliance(
  sourceId: string | null | undefined,
): UseQueryResult<RequirementSourceCompliance, Error> {
  const workspace = useWorkspace();
  const key = ["models", workspace.tenantId, "requirement_source_compliance"];
  useStaleOnWrite(workspace.tenantId, COMPLIANCE_MODELS, key);
  return useQuery<RequirementSourceCompliance, Error>({
    queryKey: [...key, sourceId ?? null],
    enabled: !!sourceId,
    retry: false,
    queryFn: async ({ signal }) =>
      readRequirementSourceCompliance(
        database(),
        { tenantId: workspace.tenantId, token: await requireIdentity(workspace) },
        sourceId!,
        signal,
      ),
  });
}

/** One paragraph of a customer's document, as it is imported. */
export type ImportedRequirement = {
  /** Its paragraph or identifier in the document. */
  reference: string;
  statement: string;
  title?: string | undefined;
  code?: string | undefined;
  acceptanceCriteria?: string | undefined;
  type?: string | undefined;
  rationale?: string | undefined;
  /** The codes of the program's elements the document names for it: an allocation each. */
  elements?: readonly string[] | undefined;
};

export type RequirementImport = {
  programId: string;
  /** Chosen once for the import, so sending it again adds nothing more. */
  requestId: string;
  source: {
    code: string;
    title: string;
    issuerPartyId?: string | null | undefined;
    documentReference?: string | null | undefined;
    versionLabel?: string | null | undefined;
    receivedOn?: string | null | undefined;
    description?: string | null | undefined;
  };
  requirements: readonly ImportedRequirement[];
};

const importedSchema = z.object({
  sourceId: z.string(),
  sourceCreated: z.boolean(),
  created: z.number(),
  skipped: z.number(),
  /** How many allocations the import made; absent from an answer recorded before it could. */
  allocated: z.number().optional(),
  requirementIds: z.array(z.string()),
});
export type ImportedRequirements = z.infer<typeof importedSchema>;

export const IMPORT_NOTHING_TO_ADD = "Add at least one requirement to import.";
export const IMPORT_TOO_MANY = "Import at most 2,000 requirements at a time.";
export const IMPORT_MAX = 2000;

/** What stops an import before it is sent, in the order a reader fixes it; empty when it may go. */
export function requirementImportIssues(
  request: Pick<RequirementImport, "source" | "requirements">,
) {
  const issues: string[] = [];
  if (!request.source.code.trim()) issues.push("Give the document a code.");
  if (!request.source.title.trim()) issues.push("Give the document a title.");
  if (!request.requirements.length) issues.push(IMPORT_NOTHING_TO_ADD);
  if (request.requirements.length > IMPORT_MAX) issues.push(IMPORT_TOO_MANY);
  const seen = new Set<string>();
  const twice = new Set<string>();
  let blank = 0;
  for (const requirement of request.requirements) {
    const reference = requirement.reference.trim();
    if (!reference || !requirement.statement.trim()) blank += 1;
    else if (seen.has(reference)) twice.add(reference);
    seen.add(reference);
  }
  if (blank)
    issues.push(
      blank === 1
        ? "One requirement has no reference or no statement."
        : `${blank} requirements have no reference or no statement.`,
    );
  if (twice.size) issues.push(`A reference appears twice: ${[...twice].slice(0, 3).join(", ")}.`);
  return issues;
}

/**
 * Import a document's requirements in one request: all of them or none, a paragraph already there
 * passed over, and the same request sent again answering what it answered.
 */
export async function importCustomerRequirements(
  client: Client,
  context: ReadContext,
  request: RequirementImport,
): Promise<ImportedRequirements> {
  const [issue] = requirementImportIssues(request);
  if (issue) throw new Error(issue);
  return importedSchema.parse(
    await ask(client, context, "import_customer_requirements", {
      p_tenant_id: context.tenantId,
      p_program_id: request.programId,
      p_request_id: request.requestId,
      p_source: request.source,
      p_requirements: request.requirements,
    }),
  );
}

/** Import a document's requirements as a mutation; the register's reads are marked stale once it settles. */
export function useImportCustomerRequirements() {
  const workspace = useWorkspace();
  const cache = useQueryClient();
  return useMutation<ImportedRequirements, Error, RequirementImport>({
    mutationFn: async (request) =>
      importCustomerRequirements(
        database(),
        { tenantId: workspace.tenantId, token: await requireIdentity(workspace) },
        request,
      ),
    onSettled: () => {
      void invalidateModel(cache, workspace.tenantId, "engineering_requirements");
      void invalidateModel(cache, workspace.tenantId, "requirement_sources");
    },
  });
}
