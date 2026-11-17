import { useMutation, useQuery, useQueryClient, type UseQueryResult } from "@tanstack/react-query";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { useWorkspace } from "./workspace-context";
import { database, requireIdentity } from "./database";
import { invalidateModel, useRows, type ReadContext, type TableName } from "./models";
import { ownerField } from "./owner-assign";
import { ELEMENT_CHANGE_KINDS } from "./product-assurance";
import { serverRead, useStaleOnWrite, type ServerRow } from "./server-table";
import { determinations, revisionStates } from "./status";

/*
 * A shared library component, assessed once and read by everything built from it.
 *
 * `component_control_status` answers where one component version stands on each control it claims,
 * was judged on or an earlier version was judged on: its own latest published determination, one
 * carried forward from the nearest earlier published version, or not assessed, marked for review
 * where a change of the version stopped an earlier determination from carrying.
 * `component_consumers` answers where a component is used, followed by its name through every
 * version of its definition: the product elements pinned to it and the system components built
 * from it, each with the version it took and how many published versions it is behind, a
 * program's declared change, a variant that left the element out, how much of what the version is
 * judged on the consumer's element inherits, the findings that stand on a version and the CVEs
 * that affect it. `system_upstream` answers what a system takes from above: the product it was
 * created from, and each library component with the version taken, the latest published one, the
 * component's standing and what the system inherits of it. Each is one request, read as the
 * reader. `component_rows` is the register's view, one row a component of each definition's latest
 * published version. A component is owned by its set's owner unless it names its own
 * (`component_owners`), which `setComponentOwner` writes.
 */

type Client = Pick<SupabaseClient, "rpc">;
type TableClient = Pick<SupabaseClient, "from">;

/** Where a component version stands on a control: a key of `determinations`. */
export type ComponentControlStatus = keyof typeof determinations;
export const COMPONENT_CONTROL_STATUS_ORDER = Object.keys(
  determinations,
) as ComponentControlStatus[];
export type ComponentControlCounts = Record<ComponentControlStatus, number>;

/** What became of a consumer's element: as the product delivers it, changed by the program, or left out. */
export const CONSUMER_CHANGES = ["inherited", "modified", "removed"] as const;
export type ConsumerChange = (typeof CONSUMER_CHANGES)[number];

const status = z.enum(
  COMPONENT_CONTROL_STATUS_ORDER as [ComponentControlStatus, ...ComponentControlStatus[]],
);
const counts = z.object({
  satisfied: z.number(),
  partially_satisfied: z.number(),
  other_than_satisfied: z.number(),
  not_assessed: z.number(),
});
const componentFacts = z.object({
  id: z.string(),
  name: z.string(),
  component_type: z.string(),
  definition_id: z.string(),
  definition_code: z.string(),
  definition_name: z.string(),
  revision_id: z.string(),
  version: z.number(),
  state: z.enum(["draft", "published"]),
  owner_party_id: z.string().nullable(),
  definition_owner_party_id: z.string().nullable(),
  business_line_id: z.string().nullable(),
});
/** A finding that stands on a component version, as one program holds it: its own open issue. */
const heldFinding = z.object({
  offer_id: z.string(),
  issue_id: z.string(),
  title: z.string(),
  severity: z.string().nullable(),
  status: z.string(),
  opened_at: z.string().nullable(),
  source: z.boolean(),
});
const pin = z
  .object({
    configuration_baseline_id: z.string(),
    name: z.string(),
    baseline_version: z.number(),
    state: z.enum(["draft", "published"]),
    version: z.string().nullable(),
  })
  .nullable();

/** A component version: the component, its definition and who answers for it. */
export type ComponentVersion = {
  id: string;
  name: string;
  componentType: string;
  definitionId: string;
  definitionCode: string;
  definitionName: string;
  revisionId: string;
  /** The version of its definition the component belongs to. */
  version: number;
  state: "draft" | "published";
  /** Who answers for the component: its own owner (`component_owners`), else its set's. */
  ownerPartyId: string | null;
  /** The set's own owner, which the component falls back to while it names none. */
  definitionOwnerPartyId: string | null;
  businessLineId: string | null;
};

/**
 * A program's own open operational issue for a finding that stands on the component version it
 * took: the issue of an accepted offer, or the one opened in the program when it was accepted.
 */
export type ConsumerFinding = {
  offerId: string;
  issueId: string;
  title: string;
  /** A key of `severityLevels`; none while nobody has rated the issue. */
  severity: string | null;
  /** A key of `operationalIssueStatuses`. */
  status: string;
  openedAt: string | null;
  /** Whether it is the issue the finding was offered from, the offering program's own. */
  source: boolean;
};

const consumerFinding = (finding: z.infer<typeof heldFinding>): ConsumerFinding => ({
  offerId: finding.offer_id,
  issueId: finding.issue_id,
  title: finding.title,
  severity: finding.severity,
  status: finding.status,
  openedAt: finding.opened_at,
  source: finding.source,
});

/** A component's pin in a system's latest configuration baseline (the latest published, else the latest). */
export type ComponentPin = {
  configurationBaselineId: string;
  name: string;
  baselineVersion: number;
  state: "draft" | "published";
  /** The version the baseline records for the component, in the program's own words. */
  version: string | null;
};

const componentVersion = (facts: z.infer<typeof componentFacts>): ComponentVersion => ({
  id: facts.id,
  name: facts.name,
  componentType: facts.component_type,
  definitionId: facts.definition_id,
  definitionCode: facts.definition_code,
  definitionName: facts.definition_name,
  revisionId: facts.revision_id,
  version: facts.version,
  state: facts.state,
  ownerPartyId: facts.owner_party_id,
  definitionOwnerPartyId: facts.definition_owner_party_id,
  businessLineId: facts.business_line_id,
});

const componentPin = (value: z.infer<typeof pin>): ComponentPin | null =>
  value && {
    configurationBaselineId: value.configuration_baseline_id,
    name: value.name,
    baselineVersion: value.baseline_version,
    state: value.state,
    version: value.version,
  };

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

/* ——— Where a component version stands ———————————————————————————————————————————————————————— */

/**
 * What one component of a version of its set changes against the version before: which kinds of
 * thing changed, a summary, and the controls the change affects. What an earlier version was
 * judged on such a control is not carried forward. `component_control_status` answers a version's
 * own, and `component_version_review` each newer version's.
 */
export const componentVersionChangeSchema = z.object({
  id: z.string(),
  kinds: z.array(z.enum(ELEMENT_CHANGE_KINDS)),
  summary: z.string(),
  controls: z.array(z.object({ id: z.string(), code: z.string(), title: z.string() })),
});
export type ComponentVersionChange = z.infer<typeof componentVersionChangeSchema>;

/** The statuses that are a determination: what an assessor found, never not assessed. */
const determined = z.enum(["satisfied", "partially_satisfied", "other_than_satisfied"]);

const statusAnswer = z.object({
  defined_component_id: z.string(),
  component: componentFacts,
  change: componentVersionChangeSchema.nullable(),
  assessments: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      published_at: z.string(),
      completed_on: z.string().nullable(),
      assessor_party_id: z.string().nullable(),
      profile_resolution_id: z.string(),
      determinations: z.number(),
      version: z.number(),
    }),
  ),
  totals: counts.extend({ controls: z.number(), carried: z.number(), to_review: z.number() }),
  controls: z.array(
    z.object({
      id: z.string(),
      code: z.string(),
      title: z.string(),
      parent_id: z.string().nullable(),
      family: z.string().nullable(),
      family_title: z.string().nullable(),
      status,
      claimed: z.boolean(),
      assessment_id: z.string().nullable(),
      rationale: z.string().nullable(),
      carried: z.boolean(),
      carried_from: z.object({ defined_component_id: z.string(), version: z.number() }).nullable(),
      to_review: z.boolean(),
      review: z
        .object({
          affected_in_version: z.number(),
          earlier_version: z.number(),
          earlier_determination: determined,
        })
        .nullable(),
    }),
  ),
});

/** A published assessment a standing determination was taken from. */
export type DecidingAssessment = {
  id: string;
  title: string;
  publishedAt: string;
  completedOn: string | null;
  assessorPartyId: string | null;
  profileResolutionId: string;
  /** How many of the component's standing determinations are this assessment's. */
  determinations: number;
  /** The version it judged: this one, or an earlier one whose determinations carried forward. */
  version: number;
};

/** What a control to review read before a change stopped it from carrying forward. */
export type ComponentControlReview = {
  /** The version whose change lists the control as affected: this one, or one published before it. */
  affectedInVersion: number;
  /** The nearest earlier published version judged on the control. */
  earlierVersion: number;
  earlierDetermination: Exclude<ComponentControlStatus, "not_assessed">;
};

/** One control the component claims or was judged on, with where the component stands on it. */
export type ComponentControl = {
  id: string;
  code: string;
  title: string;
  parentId: string | null;
  family: string | null;
  familyTitle: string | null;
  status: ComponentControlStatus;
  /** Whether the component claims the control through its library implementations. */
  claimed: boolean;
  /** The published assessment whose determination stands; none for a control nobody judged. */
  assessmentId: string | null;
  rationale: string | null;
  /** Whether the determination is an earlier version's, carried forward to this one. */
  carried: boolean;
  /** The earlier version it was carried from, and that version's component. */
  carriedFrom: { definedComponentId: string; version: number } | null;
  /**
   * Whether the control is left to review: an earlier version was judged on it, and a change of
   * this version, or of a published one between, lists it as affected. It reads not assessed
   * until this version is judged on it.
   */
  toReview: boolean;
  review: ComponentControlReview | null;
};

export type ComponentControlStatusAnswer = {
  component: ComponentVersion;
  /** What this version changes against the version before; none where it records no change. */
  change: ComponentVersionChange | null;
  /** The published assessments the standing determinations were taken from, the newest first. */
  assessments: DecidingAssessment[];
  /** How many controls the component claims, was judged on or an earlier version was judged on. */
  total: number;
  counts: ComponentControlCounts;
  /** Of the determinations that stand, those carried forward from an earlier version. */
  carried: number;
  /** Of the controls not assessed, those an earlier version was judged on and a change left to review. */
  toReview: number;
  /** By family and code. */
  controls: ComponentControl[];
};

/** Where a component version stands on each control, as the server reads it. */
export async function readComponentControlStatus(
  client: Client,
  context: Pick<ReadContext, "token">,
  definedComponentId: string,
  signal?: AbortSignal,
): Promise<ComponentControlStatusAnswer> {
  const answer = statusAnswer.parse(
    await ask(
      client,
      context,
      "component_control_status",
      { p_defined_component_id: definedComponentId },
      signal,
    ),
  );
  const { controls: total, carried, to_review: toReview, ...totals } = answer.totals;
  return {
    component: componentVersion(answer.component),
    change: answer.change,
    assessments: answer.assessments.map((assessment) => ({
      id: assessment.id,
      title: assessment.title,
      publishedAt: assessment.published_at,
      completedOn: assessment.completed_on,
      assessorPartyId: assessment.assessor_party_id,
      profileResolutionId: assessment.profile_resolution_id,
      determinations: assessment.determinations,
      version: assessment.version,
    })),
    total,
    counts: totals,
    carried,
    toReview,
    controls: answer.controls.map((control) => ({
      id: control.id,
      code: control.code,
      title: control.title,
      parentId: control.parent_id,
      family: control.family,
      familyTitle: control.family_title,
      status: control.status,
      claimed: control.claimed,
      assessmentId: control.assessment_id,
      rationale: control.rationale,
      carried: control.carried,
      carriedFrom: control.carried_from && {
        definedComponentId: control.carried_from.defined_component_id,
        version: control.carried_from.version,
      },
      toReview: control.to_review,
      review: control.review && {
        affectedInVersion: control.review.affected_in_version,
        earlierVersion: control.review.earlier_version,
        earlierDetermination: control.review.earlier_determination,
      },
    })),
  };
}

/** How many controls carry a determination: every control but those nobody judged. */
export const controlsDetermined = (standing: {
  total: number;
  counts: Pick<ComponentControlCounts, "not_assessed">;
}): number => standing.total - standing.counts.not_assessed;

/**
 * Every model the standing is read from: the version's claims, the assessments of it and of the
 * earlier versions it carries from, what each version's change affects, and who answers for it.
 */
const STATUS_MODELS = [
  "component_assessments",
  "component_determinations",
  "defined_component_implementations",
  "defined_components",
  "component_definitions",
  "component_definition_revisions",
  "component_version_changes",
  "component_version_change_controls",
  "component_owners",
] as const satisfies readonly TableName[];

/** Where a component version stands on each control. One version's answer never stands in for another's. */
export function useComponentControlStatus(
  definedComponentId: string | null | undefined,
): UseQueryResult<ComponentControlStatusAnswer, Error> {
  const workspace = useWorkspace();
  const key = ["models", workspace.tenantId, "component_control_status"];
  useStaleOnWrite(workspace.tenantId, STATUS_MODELS, key);
  return useQuery<ComponentControlStatusAnswer, Error>({
    queryKey: [...key, definedComponentId ?? null],
    enabled: !!definedComponentId,
    retry: false,
    queryFn: async ({ signal }) =>
      readComponentControlStatus(
        database(),
        { token: await requireIdentity(workspace) },
        definedComponentId!,
        signal,
      ),
  });
}

/* ——— Where a component is used ——————————————————————————————————————————————————————————————— */

const consumersAnswer = z.object({
  defined_component_id: z.string(),
  component: componentFacts,
  latest: z
    .object({
      revision_id: z.string(),
      version: z.number(),
      defined_component_id: z.string().nullable(),
    })
    .nullable(),
  products: z.array(
    z.object({
      product_id: z.string(),
      product_code: z.string(),
      product_name: z.string(),
      business_line_id: z.string().nullable(),
      product_revision_id: z.string(),
      product_version: z.number(),
      product_state: z.enum(["draft", "published"]),
      current: z.boolean(),
      element_id: z.string(),
      element_code: z.string(),
      element_name: z.string(),
      configurations: z.array(z.object({ id: z.string(), code: z.string(), name: z.string() })),
      defined_component_id: z.string(),
      version: z.number(),
      behind: z.number(),
      vulnerabilities_open: z.number(),
    }),
  ),
  systems: z.array(
    z.object({
      program_id: z.string(),
      program_code: z.string(),
      program_name: z.string(),
      business_line_id: z.string().nullable(),
      system_id: z.string(),
      system_code: z.string(),
      system_name: z.string(),
      element_id: z.string().nullable(),
      element_code: z.string(),
      element_name: z.string(),
      system_component_id: z.string().nullable(),
      component_code: z.string().nullable(),
      component_name: z.string().nullable(),
      component_version: z.string().nullable(),
      product_element_id: z.string().nullable(),
      defined_component_id: z.string(),
      version: z.number(),
      behind: z.number(),
      pin,
      change: z.enum(CONSUMER_CHANGES).nullable(),
      change_kinds: z.array(z.enum(ELEMENT_CHANGE_KINDS)),
      change_rationale: z.string().nullable(),
      findings: z.array(heldFinding),
      findings_open: z.number(),
      vulnerabilities_open: z.number(),
      controls_judged: z.number(),
      controls_inherited: z.number(),
    }),
  ),
  findings: z.array(
    z.object({
      offer_id: z.string(),
      item_id: z.string(),
      title: z.string(),
      severity: z.string().nullable(),
      defined_component_id: z.string(),
      version: z.number(),
      accepted_at: z.string(),
      source_program_id: z.string(),
      source_issue_id: z.string(),
      programs: z.number(),
      programs_open: z.number(),
    }),
  ),
  totals: z.object({
    products: z.number(),
    product_elements: z.number(),
    programs: z.number(),
    systems: z.number(),
    system_components: z.number(),
    behind: z.number(),
    modified: z.number(),
    removed: z.number(),
  }),
  findings_open: z.number(),
  offers_open: z.number(),
  vulnerabilities_open: z.number(),
});

/** A product element pinned to the component, in one version of its product. */
export type ProductConsumer = {
  productId: string;
  productCode: string;
  productName: string;
  businessLineId: string | null;
  productRevisionId: string;
  productVersion: number;
  productState: "draft" | "published";
  /** Whether this is the product's current version: its latest published one, else its latest. */
  current: boolean;
  elementId: string;
  elementCode: string;
  elementName: string;
  /** The configurations that include the element. */
  configurations: { id: string; code: string; name: string }[];
  /** The component version the element is pinned to. */
  definedComponentId: string;
  version: number;
  /** How many published versions of the definition are newer than the one taken. */
  behind: number;
  /** How many CVEs affect the version taken: those its standing SBOM carries as affected. */
  vulnerabilitiesOpen: number;
};

/**
 * A system that uses the component: one of its components is built from it, or it is a product
 * variant that left the element out (`change` is `removed`, and it holds no component).
 */
export type SystemConsumer = {
  /** The row's identity: the system component, or the variant and the element it left out. */
  key: string;
  programId: string;
  programCode: string;
  programName: string;
  businessLineId: string | null;
  /** The authorization boundary. */
  systemId: string;
  systemCode: string;
  systemName: string;
  /** The element the component sits on; none where the variant left it out. */
  elementId: string | null;
  elementCode: string;
  elementName: string;
  systemComponentId: string | null;
  componentCode: string | null;
  componentName: string | null;
  /** The version the system component records for itself. */
  componentVersion: string | null;
  productElementId: string | null;
  definedComponentId: string;
  /** The version of the definition the consumer took. */
  version: number;
  behind: number;
  pin: ComponentPin | null;
  /** None for a component the program applied itself, on an element with no product lineage. */
  change: ConsumerChange | null;
  changeKinds: (typeof ELEMENT_CHANGE_KINDS)[number][];
  changeRationale: string | null;
  /** The program's own open issues for the findings that stand on the version it took. */
  findings: ConsumerFinding[];
  findingsOpen: number;
  /** How many CVEs affect the version it took. */
  vulnerabilitiesOpen: number;
  /** How many controls the version it took is judged on, by its own assessment or one carried forward. */
  controlsJudged: number;
  /**
   * How many of those its element inherits: the ones its control baseline selects, on an element
   * the program did not declare modified and that holds nothing but judged library components.
   * None where the variant left the element out.
   */
  controlsInherited: number;
};

/** A finding that stands on a version of the component: an issue of an accepted offer. */
export type StandingFinding = {
  offerId: string;
  /** The offer's item, which each program's own issue for the finding is linked to. */
  itemId: string;
  title: string;
  /** A key of `severityLevels`; none while nobody has rated the issue. */
  severity: string | null;
  /** The component version it stands on. */
  definedComponentId: string;
  version: number;
  acceptedAt: string;
  /** The program that offered it, and the issue it offered. */
  sourceProgramId: string;
  sourceIssueId: string;
  /** How many programs hold an issue of their own for it, and how many of those are still open. */
  programs: number;
  programsOpen: number;
};

export type ComponentConsumers = {
  component: ComponentVersion;
  /** The definition's latest published version, and the component of this name in it, if it has one. */
  latest: { revisionId: string; version: number; definedComponentId: string | null } | null;
  /** By product code, the newest version first. */
  products: ProductConsumer[];
  /** By program, system and element. */
  systems: SystemConsumer[];
  totals: {
    /** Products whose current version uses the component. */
    products: number;
    productElements: number;
    programs: number;
    systems: number;
    systemComponents: number;
    /** Current product elements and system components built from an older version than the latest published. */
    behind: number;
    modified: number;
    removed: number;
  };
  /** The findings that stand on a version of the component, the newest first. */
  findings: StandingFinding[];
  /** How many of those findings some program still holds open. */
  findingsOpen: number;
  /** How many offers wait on the component's owner, for any of its versions. */
  offersOpen: number;
  /**
   * How many CVEs are open on the component, whichever version names it: each CVE once that
   * affects its newest version or a version a consumer still runs, as the register counts them.
   */
  vulnerabilitiesOpen: number;
};

/** Where a component is used, through every version of its definition, as the server reads it. */
export async function readComponentConsumers(
  client: Client,
  context: Pick<ReadContext, "token">,
  definedComponentId: string,
  signal?: AbortSignal,
): Promise<ComponentConsumers> {
  const answer = consumersAnswer.parse(
    await ask(
      client,
      context,
      "component_consumers",
      { p_defined_component_id: definedComponentId },
      signal,
    ),
  );
  return {
    component: componentVersion(answer.component),
    latest: answer.latest && {
      revisionId: answer.latest.revision_id,
      version: answer.latest.version,
      definedComponentId: answer.latest.defined_component_id,
    },
    products: answer.products.map((row) => ({
      productId: row.product_id,
      productCode: row.product_code,
      productName: row.product_name,
      businessLineId: row.business_line_id,
      productRevisionId: row.product_revision_id,
      productVersion: row.product_version,
      productState: row.product_state,
      current: row.current,
      elementId: row.element_id,
      elementCode: row.element_code,
      elementName: row.element_name,
      configurations: row.configurations,
      definedComponentId: row.defined_component_id,
      version: row.version,
      behind: row.behind,
      vulnerabilitiesOpen: row.vulnerabilities_open,
    })),
    systems: answer.systems.map((row) => ({
      key: row.system_component_id ?? `${row.system_id}:${row.product_element_id}`,
      programId: row.program_id,
      programCode: row.program_code,
      programName: row.program_name,
      businessLineId: row.business_line_id,
      systemId: row.system_id,
      systemCode: row.system_code,
      systemName: row.system_name,
      elementId: row.element_id,
      elementCode: row.element_code,
      elementName: row.element_name,
      systemComponentId: row.system_component_id,
      componentCode: row.component_code,
      componentName: row.component_name,
      componentVersion: row.component_version,
      productElementId: row.product_element_id,
      definedComponentId: row.defined_component_id,
      version: row.version,
      behind: row.behind,
      pin: componentPin(row.pin),
      change: row.change,
      changeKinds: row.change_kinds,
      changeRationale: row.change_rationale,
      findings: row.findings.map(consumerFinding),
      findingsOpen: row.findings_open,
      vulnerabilitiesOpen: row.vulnerabilities_open,
      controlsJudged: row.controls_judged,
      controlsInherited: row.controls_inherited,
    })),
    findings: answer.findings.map((finding) => ({
      offerId: finding.offer_id,
      itemId: finding.item_id,
      title: finding.title,
      severity: finding.severity,
      definedComponentId: finding.defined_component_id,
      version: finding.version,
      acceptedAt: finding.accepted_at,
      sourceProgramId: finding.source_program_id,
      sourceIssueId: finding.source_issue_id,
      programs: finding.programs,
      programsOpen: finding.programs_open,
    })),
    totals: {
      products: answer.totals.products,
      productElements: answer.totals.product_elements,
      programs: answer.totals.programs,
      systems: answer.totals.systems,
      systemComponents: answer.totals.system_components,
      behind: answer.totals.behind,
      modified: answer.totals.modified,
      removed: answer.totals.removed,
    },
    findingsOpen: answer.findings_open,
    offersOpen: answer.offers_open,
    vulnerabilitiesOpen: answer.vulnerabilities_open,
  };
}

/**
 * What a read of a component's standing among its consumers derives from, beside the consumers
 * themselves: the determinations that stand on each version and what each version's change
 * affects, the offers made on it and the issues each program holds for an accepted finding, and
 * the SBOMs and CVEs of its versions.
 */
const STANDING_MODELS = [
  "component_assessments",
  "component_determinations",
  "defined_component_implementations",
  "component_version_changes",
  "component_version_change_controls",
  "component_owners",
  "component_offers",
  "component_offer_items",
  "component_offer_issues",
  "operational_issues",
  "sboms",
  "sbom_components",
  "sbom_component_vulnerabilities",
  "selected_controls",
] as const satisfies readonly TableName[];

const CONSUMER_MODELS = [
  "system_components",
  "systems",
  "programs",
  "product_elements",
  "product_revisions",
  "product_configuration_elements",
  "component_definitions",
  "component_definition_revisions",
  "component_pins",
  "configuration_baselines",
  ...STANDING_MODELS,
] as const satisfies readonly TableName[];

/**
 * Where a component is used. A link made, a version published or taken, a change declared, an
 * offer made or reviewed, an assessment published or an SBOM recorded reads it again.
 */
export function useComponentConsumers(
  definedComponentId: string | null | undefined,
): UseQueryResult<ComponentConsumers, Error> {
  const workspace = useWorkspace();
  const key = ["models", workspace.tenantId, "component_consumers"];
  useStaleOnWrite(workspace.tenantId, CONSUMER_MODELS, key);
  return useQuery<ComponentConsumers, Error>({
    queryKey: [...key, definedComponentId ?? null],
    enabled: !!definedComponentId,
    retry: false,
    queryFn: async ({ signal }) =>
      readComponentConsumers(
        database(),
        { token: await requireIdentity(workspace) },
        definedComponentId!,
        signal,
      ),
  });
}

/* ——— What a system takes from above —————————————————————————————————————————————————————————— */

const upstreamAnswer = z.object({
  system_id: z.string(),
  boundary_system_id: z.string(),
  program_id: z.string(),
  product: z
    .object({
      id: z.string(),
      code: z.string(),
      name: z.string(),
      business_line_id: z.string().nullable(),
      revision_id: z.string(),
      version: z.number(),
      configuration_id: z.string(),
      configuration_code: z.string(),
      configuration: z.string(),
      latest_revision_id: z.string().nullable(),
      latest_version: z.number().nullable(),
      behind: z.number(),
    })
    .nullable(),
  components: z.array(
    z.object({
      system_component_id: z.string(),
      code: z.string(),
      name: z.string(),
      component_version: z.string().nullable(),
      element_id: z.string(),
      element_code: z.string(),
      element_name: z.string(),
      product_element_id: z.string().nullable(),
      change: z.enum(["inherited", "modified"]).nullable(),
      change_kinds: z.array(z.enum(ELEMENT_CHANGE_KINDS)),
      defined_component_id: z.string(),
      component_name: z.string(),
      component_type: z.string(),
      definition_id: z.string(),
      definition_code: z.string(),
      definition_name: z.string(),
      owner_party_id: z.string().nullable(),
      definition_owner_party_id: z.string().nullable(),
      business_line_id: z.string().nullable(),
      revision_id: z.string(),
      version: z.number(),
      latest_revision_id: z.string().nullable(),
      latest_version: z.number().nullable(),
      behind: z.number(),
      pin,
      standing: counts.extend({
        controls: z.number(),
        carried: z.number(),
        to_review: z.number(),
      }),
      controls_judged: z.number(),
      controls_inherited: z.number(),
      findings: z.array(heldFinding),
      findings_open: z.number(),
      offers_open: z.number(),
      vulnerabilities_open: z.number(),
    }),
  ),
  totals: z.object({
    components: z.number(),
    behind: z.number(),
    modified: z.number(),
    assessed: z.number(),
    controls_judged: z.number(),
    controls_inherited: z.number(),
  }),
  findings_open: z.number(),
  offers_open: z.number(),
  vulnerabilities_open: z.number(),
});

/** The product a system was created from, with how far behind its newest published version it is. */
export type UpstreamProduct = {
  id: string;
  code: string;
  name: string;
  businessLineId: string | null;
  revisionId: string;
  version: number;
  configurationId: string;
  configurationCode: string;
  configuration: string;
  latestRevisionId: string | null;
  latestVersion: number | null;
  behind: number;
};

/** A library component a system is built from. */
export type UpstreamComponent = {
  systemComponentId: string;
  code: string;
  name: string;
  componentVersion: string | null;
  elementId: string;
  elementCode: string;
  elementName: string;
  productElementId: string | null;
  /** Whether the program declared the inherited element modified; none without product lineage. */
  change: "inherited" | "modified" | null;
  changeKinds: (typeof ELEMENT_CHANGE_KINDS)[number][];
  definedComponentId: string;
  componentName: string;
  componentType: string;
  definitionId: string;
  definitionCode: string;
  definitionName: string;
  /** Who answers for the component: its own owner, else its set's. */
  ownerPartyId: string | null;
  /** The set's own owner. */
  definitionOwnerPartyId: string | null;
  businessLineId: string | null;
  revisionId: string;
  /** The version of the definition the system took. */
  version: number;
  latestRevisionId: string | null;
  /** The definition's latest published version; none while nothing is published. */
  latestVersion: number | null;
  behind: number;
  pin: ComponentPin | null;
  /**
   * Where the component version taken stands, as `component_control_status` counts it: among the
   * determinations, those carried forward from an earlier version, and among the controls not
   * assessed, those a change left to review.
   */
  standing: { total: number; counts: ComponentControlCounts; carried: number; toReview: number };
  /** How many controls the version taken is judged on, by its own assessment or one carried forward. */
  controlsJudged: number;
  /**
   * How many of those its element inherits: the ones its control baseline selects, on an element
   * the program did not declare modified and that holds nothing but judged library components.
   */
  controlsInherited: number;
  /** The program's own open issues for the findings that stand on the version taken. */
  findings: ConsumerFinding[];
  findingsOpen: number;
  /** How many offers wait on the owner of the version taken, whoever made them. */
  offersOpen: number;
  /** How many CVEs affect the version taken. */
  vulnerabilitiesOpen: number;
};

export type SystemUpstream = {
  systemId: string;
  boundarySystemId: string;
  programId: string;
  /** None for a system that was not created from a product. */
  product: UpstreamProduct | null;
  /** By element and component code. */
  components: UpstreamComponent[];
  totals: {
    components: number;
    behind: number;
    modified: number;
    /** Components whose version carries at least one published determination. */
    assessed: number;
    /** The controls some version taken is judged on, each once. */
    controlsJudged: number;
    /** The controls some element inherits, each once. */
    controlsInherited: number;
  };
  /** The program's open issues for findings that stand on what the system takes, each once. */
  findingsOpen: number;
  /** The offers that wait on the owners of the versions taken. */
  offersOpen: number;
  /** The CVEs that affect what the system takes, each once. */
  vulnerabilitiesOpen: number;
};

/** What a system takes from above, as the server reads it. */
export async function readSystemUpstream(
  client: Client,
  context: Pick<ReadContext, "token">,
  systemId: string,
  signal?: AbortSignal,
): Promise<SystemUpstream> {
  const answer = upstreamAnswer.parse(
    await ask(client, context, "system_upstream", { p_system_id: systemId }, signal),
  );
  const product = answer.product;
  return {
    systemId: answer.system_id,
    boundarySystemId: answer.boundary_system_id,
    programId: answer.program_id,
    product: product && {
      id: product.id,
      code: product.code,
      name: product.name,
      businessLineId: product.business_line_id,
      revisionId: product.revision_id,
      version: product.version,
      configurationId: product.configuration_id,
      configurationCode: product.configuration_code,
      configuration: product.configuration,
      latestRevisionId: product.latest_revision_id,
      latestVersion: product.latest_version,
      behind: product.behind,
    },
    components: answer.components.map((row) => {
      const { controls: total, carried, to_review: toReview, ...standing } = row.standing;
      return {
        systemComponentId: row.system_component_id,
        code: row.code,
        name: row.name,
        componentVersion: row.component_version,
        elementId: row.element_id,
        elementCode: row.element_code,
        elementName: row.element_name,
        productElementId: row.product_element_id,
        change: row.change,
        changeKinds: row.change_kinds,
        definedComponentId: row.defined_component_id,
        componentName: row.component_name,
        componentType: row.component_type,
        definitionId: row.definition_id,
        definitionCode: row.definition_code,
        definitionName: row.definition_name,
        ownerPartyId: row.owner_party_id,
        definitionOwnerPartyId: row.definition_owner_party_id,
        businessLineId: row.business_line_id,
        revisionId: row.revision_id,
        version: row.version,
        latestRevisionId: row.latest_revision_id,
        latestVersion: row.latest_version,
        behind: row.behind,
        pin: componentPin(row.pin),
        standing: { total, counts: standing, carried, toReview },
        controlsJudged: row.controls_judged,
        controlsInherited: row.controls_inherited,
        findings: row.findings.map(consumerFinding),
        findingsOpen: row.findings_open,
        offersOpen: row.offers_open,
        vulnerabilitiesOpen: row.vulnerabilities_open,
      };
    }),
    totals: {
      components: answer.totals.components,
      behind: answer.totals.behind,
      modified: answer.totals.modified,
      assessed: answer.totals.assessed,
      controlsJudged: answer.totals.controls_judged,
      controlsInherited: answer.totals.controls_inherited,
    },
    findingsOpen: answer.findings_open,
    offersOpen: answer.offers_open,
    vulnerabilitiesOpen: answer.vulnerabilities_open,
  };
}

const UPSTREAM_MODELS = [
  "system_components",
  "systems",
  "component_definitions",
  "component_definition_revisions",
  "component_pins",
  "configuration_baselines",
  "product_revisions",
  ...STANDING_MODELS,
] as const satisfies readonly TableName[];

/** What a system takes from above. One system's answer never stands in for another's. */
export function useSystemUpstream(
  systemId: string | null | undefined,
): UseQueryResult<SystemUpstream, Error> {
  const workspace = useWorkspace();
  const key = ["models", workspace.tenantId, "system_upstream"];
  useStaleOnWrite(workspace.tenantId, UPSTREAM_MODELS, key);
  return useQuery<SystemUpstream, Error>({
    queryKey: [...key, systemId ?? null],
    enabled: !!systemId,
    retry: false,
    queryFn: async ({ signal }) =>
      readSystemUpstream(
        database(),
        { token: await requireIdentity(workspace) },
        systemId!,
        signal,
      ),
  });
}

/* ——— The components register ————————————————————————————————————————————————————————————————— */

/** The Business line filter's value for the components placed in none. */
export const NO_BUSINESS_LINE = "No business line";

/**
 * What the register reads of a component: who answers for it, who uses it, where it stands and
 * what waits on its owner.
 */
export const COMPONENT_REGISTER_COLUMNS = [
  "id",
  "tenant_id",
  "name",
  "component_type",
  "component_definition_id",
  "definition_code",
  "definition_name",
  "component_definition_revision_id",
  "version",
  "state",
  "owner_party_id",
  "owner_name",
  "business_line_id",
  "business_line_name",
  "products",
  "programs",
  "consumers_behind",
  "consumers_modified",
  "assessment_id",
  "assessment_title",
  "assessed_on",
  "controls_claimed",
  "controls_determined",
  "controls_satisfied",
  "controls_partially_satisfied",
  "controls_other_than_satisfied",
  "controls_to_review",
  "offers_open",
  "vulnerabilities_open",
] as const;

/** The register's counts: a filter on one asks for a range, so "at least one" is a question. */
const REGISTER_COUNTS = [
  "products",
  "programs",
  "consumers_behind",
  "consumers_modified",
  "controls_claimed",
  "controls_determined",
  "controls_satisfied",
  "controls_partially_satisfied",
  "controls_other_than_satisfied",
  "controls_to_review",
  "offers_open",
  "vulnerabilities_open",
] as const satisfies readonly (typeof COMPONENT_REGISTER_COLUMNS)[number][];

/** A component as the register reads it, a page at a time. */
export type ComponentRegisterRow = ServerRow<
  "component_rows",
  (typeof COMPONENT_REGISTER_COLUMNS)[number],
  | "name"
  | "component_type"
  | "component_definition_id"
  | "definition_code"
  | "definition_name"
  | "component_definition_revision_id"
  | "version"
  | "state"
  | (typeof REGISTER_COUNTS)[number]
>;

/** The filter that asks a register's count for one or more: `atLeastOne("offers_open")`. */
export const atLeastOne = (column: (typeof REGISTER_COUNTS)[number]) => [
  { id: column, value: [1, null] },
];

/**
 * The components register's read, `component_rows`: one row a component of each definition's
 * latest published version (else its latest), by name, with its standing as the version carries
 * it (a determination carried forward from an earlier version counts, and a control a change left
 * to review is counted apart), how many offers wait on its owner and how many CVEs are open on it
 * (each CVE once that affects the listed version or a version a consumer still runs). A write to a
 * definition, a version or its change, an assessment, an owner, an offer, an SBOM or a consumer
 * reads the pages again, since the view derives its columns from them.
 */
export const componentRegisterRead = serverRead({
  source: "component_rows",
  model: "defined_components",
  models: [
    "component_definitions",
    "component_definition_revisions",
    "component_owners",
    "component_assessments",
    "component_determinations",
    "component_version_changes",
    "component_version_change_controls",
    "defined_component_implementations",
    "component_offers",
    "sboms",
    "sbom_components",
    "sbom_component_vulnerabilities",
    "system_components",
    "systems",
    "product_elements",
    "product_revisions",
    "parties",
    "business_lines",
  ],
  columns: COMPONENT_REGISTER_COLUMNS,
  search: ["name", "definition_code", "definition_name", "owner_name", "business_line_name"],
  fields: {
    // The Owner and Business line columns sort, filter and are found by name, as a register's
    // Owner is (`ownerField`); a component nobody owns, or in no business line, has none. The
    // owner is the component's effective one: its own, else its set's.
    owner_party_id: ownerField,
    business_line_id: { column: "business_line_name", emptyLabel: NO_BUSINESS_LINE },
    // The set and the assessment are read by their names.
    component_definition_id: { column: "definition_name" },
    assessment_id: { column: "assessment_title" },
    // The search finds a version by the word its State reads as.
    state: { labels: revisionStates },
    assessed_on: { filter: "range" },
    ...Object.fromEntries(REGISTER_COUNTS.map((column) => [column, { filter: "range" as const }])),
  },
  order: [{ column: "name" }, { column: "definition_code" }],
});

/* ——— A component's own owner ————————————————————————————————————————————————————————————————— */

/**
 * One component of a set, as its owner is named for it: the set and the name the component has in
 * the versions of that set, since a component has no identity of its own across versions.
 */
export type ComponentOwnerKey = { componentDefinitionId: string; componentName: string };

/** A component's owner as the reader chose it: a person or an organization, or none of its own. */
export type ComponentOwnerChange = ComponentOwnerKey & {
  /** None removes the component's own owner, so it is its set's owner's again. */
  ownerPartyId: string | null;
};

/**
 * What a change did: named an owner for a component that had none of its own, changed the one it
 * had, removed it, or found it already so. `ownerPartyId` is the component's own owner now; none
 * means its set's owner answers for it.
 */
export type ComponentOwnerSet = {
  outcome: "named" | "changed" | "removed" | "unchanged";
  ownerPartyId: string | null;
};

export const COMPONENT_OWNER_NEEDS_COMPONENT = "Choose the component to name an owner for.";
export const COMPONENT_OWNER_CHANGED =
  "This component's owner changed in another session. Reload before changing it again.";
export const COMPONENT_OWNER_NOT_A_COMPONENT =
  "This is not a component of a version of this component set, so it takes no owner of its own.";
export const COMPONENT_OWNER_NOT_ALLOWED =
  "An editor, admin, or owner can name a component's owner.";
export const COMPONENT_OWNER_NOT_A_PARTY =
  "This owner is no longer a person or an organization of the workspace. Choose another.";

type OwnerFailure = { code?: string | undefined; message: string };

/** A failed write of a component's owner, in the reader's words. */
function ownerRefusal(error: OwnerFailure): Error {
  // Another session wrote the row first: named an owner (a duplicate) or changed the one read.
  if (error.code === "23505" || error.code === "PT409" || error.code === "PGRST116")
    return new Error(COMPONENT_OWNER_CHANGED);
  // The guard's: the name is no component of any version of the set.
  if (error.code === "23514") return new Error(COMPONENT_OWNER_NOT_A_COMPONENT);
  // Row-level security's: the reader may not write to the workspace.
  if (error.code === "42501") return new Error(COMPONENT_OWNER_NOT_ALLOWED);
  // The foreign key's: the party is not the workspace's, or is gone.
  if (error.code === "23503") return new Error(COMPONENT_OWNER_NOT_A_PARTY);
  const message = error.message.trim();
  return new Error(/[.!?]$/.test(message) ? message : `${message}.`);
}

/**
 * Name one component's own owner, change it or remove it (`component_owners`, one row a component
 * of a set by its name). The component's row is read first and written at the revision read: none
 * yet is an insert, another party an update, the same party nothing, and no party a delete, after
 * which the component is its set's owner's again. The same change sent again writes nothing. Any
 * member who may write to the workspace names an owner; row-level security decides.
 */
export async function setComponentOwner(
  client: TableClient,
  { tenantId, token }: ReadContext,
  change: ComponentOwnerChange,
): Promise<ComponentOwnerSet> {
  if (!change.componentDefinitionId || !change.componentName)
    throw new Error(COMPONENT_OWNER_NEEDS_COMPONENT);
  const authorization = `Bearer ${token}`;
  const found = await client
    .from("component_owners")
    .select("id,revision,owner_party_id")
    .eq("tenant_id", tenantId)
    .eq("component_definition_id", change.componentDefinitionId)
    .eq("component_name", change.componentName)
    .setHeader("Authorization", authorization)
    .maybeSingle();
  if (found.error) throw ownerRefusal(found.error);
  const own = found.data as { id: string; revision: number; owner_party_id: string } | null;
  if (!change.ownerPartyId) {
    if (!own) return { outcome: "unchanged", ownerPartyId: null };
    const removed = await client
      .from("component_owners")
      .delete()
      .eq("id", own.id)
      .eq("revision", own.revision)
      .select("id")
      .setHeader("Authorization", authorization);
    if (removed.error) throw ownerRefusal(removed.error);
    // Nothing removed: the row was changed or removed since it was read.
    if (!Array.isArray(removed.data) || removed.data.length === 0)
      throw new Error(COMPONENT_OWNER_CHANGED);
    return { outcome: "removed", ownerPartyId: null };
  }
  if (own?.owner_party_id === change.ownerPartyId)
    return { outcome: "unchanged", ownerPartyId: own.owner_party_id };
  const written = own
    ? await client
        .from("component_owners")
        .update({ owner_party_id: change.ownerPartyId, revision: own.revision + 1 })
        .eq("id", own.id)
        .eq("revision", own.revision)
        .select("id")
        .setHeader("Authorization", authorization)
        .single()
    : await client
        .from("component_owners")
        .insert({
          tenant_id: tenantId,
          component_definition_id: change.componentDefinitionId,
          component_name: change.componentName,
          owner_party_id: change.ownerPartyId,
        })
        .select("id")
        .setHeader("Authorization", authorization)
        .single();
  if (written.error) throw ownerRefusal(written.error);
  return { outcome: own ? "changed" : "named", ownerPartyId: change.ownerPartyId };
}

/**
 * Name, change or remove a component's own owner as a mutation. However it settles, every read
 * that answers a component's owner reads again (the register, a version's standing, where it is
 * used, a system's upstream, the offers that wait on the owner and the Review queue), so a refusal
 * for an owner someone else changed shows it as it is.
 */
export function useSetComponentOwner() {
  const workspace = useWorkspace();
  const cache = useQueryClient();
  return useMutation<ComponentOwnerSet, Error, ComponentOwnerChange>({
    mutationFn: async (change) =>
      setComponentOwner(
        database(),
        { tenantId: workspace.tenantId, token: await requireIdentity(workspace) },
        change,
      ),
    onSettled: () =>
      void Promise.all([
        invalidateModel(cache, workspace.tenantId, "component_owners"),
        // The Review queue says who an offer waits on, and names no model of the owners.
        cache.invalidateQueries({ queryKey: ["models", workspace.tenantId, "review_queue_rows"] }),
      ]),
  });
}

/**
 * A component's own owner, if it names one: none while its set's owner answers for it. The reads
 * above answer the effective owner; this says whether there is an owner of its own to remove.
 */
export function useComponentOwner(component: ComponentOwnerKey | null | undefined) {
  const owners = useRows(
    "component_owners",
    {
      component_definition_id: component?.componentDefinitionId ?? "",
      component_name: component?.componentName ?? "",
    },
    {
      columns: ["id", "owner_party_id", "revision"],
      enabled: !!component?.componentDefinitionId && !!component.componentName,
    },
  );
  return {
    query: owners,
    ownerPartyId: owners.data ? (owners.data[0]?.owner_party_id ?? null) : undefined,
  };
}
