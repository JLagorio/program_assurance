import { useMutation, useQuery, useQueryClient, type UseQueryResult } from "@tanstack/react-query";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { useWorkspace } from "./workspace-context";
import {
  COMPONENT_CONTROL_STATUS_ORDER,
  componentVersionChangeSchema,
  type ComponentControlStatus,
  type ComponentVersionChange,
} from "./component-reuse";
import type { ControlDeterminer, ControlStatus } from "./control-status";
import { database, requireIdentity } from "./database";
import type { Database } from "./database.types";
import { invalidateModel, type ReadContext, type TableName } from "./models";
import { useStaleOnWrite } from "./server-table";
import { controlDeterminers, controlStatuses, vulnerabilityStates } from "./status";

/*
 * Component versions: a program taking a newer version of a library component it is built from.
 *
 * A consumer stays on the version it took: a newer one drafted or published moves nothing for it,
 * it reads as behind and no more. A new version carries forward every determination of the version
 * before, except on the controls its owner lists as affected by what it changes, which read not
 * assessed, marked for review, until the new version is judged on them. Take version reviews
 * before it writes: `component_version_review` answers, for one system component, the version it
 * is built from and the latest published one, what each version between changes, the controls
 * those changes affect with where the program stands on each, what carries forward, the CVEs the
 * newer version fixes, and why the version cannot be taken where it cannot.
 * `take_component_version` moves the one system component at the revision the reader saw, one
 * answer a request; what the program inherits follows from the reads.
 */

type Client = Pick<SupabaseClient, "rpc">;

/** Why a system component cannot take a newer version, by the review's code. */
export const VERSION_BLOCKS = ["not_library", "latest", "assignment", "product"] as const;
/**
 * `not_library`: it is built from no library component. `latest`: it is on the latest published
 * version. `assignment`: it came through a library assignment, which the program's Library tab
 * moves with its claims. `product`: its element is inherited from a product, and a variant takes
 * a newer component version through its product.
 */
export type VersionBlock = (typeof VERSION_BLOCKS)[number];

/** A CVE's state on an SBOM component: a key of `vulnerabilityStates`. */
export type VulnerabilityState = keyof typeof vulnerabilityStates;

const keysOf = <T extends string>(map: Readonly<Record<T, unknown>>) =>
  Object.keys(map) as [T, ...T[]];
const standing = z.enum(
  COMPONENT_CONTROL_STATUS_ORDER as [ComponentControlStatus, ...ComponentControlStatus[]],
);
const named = z.object({ id: z.string(), code: z.string(), name: z.string() });

const reviewAnswer = z.object({
  system_component_id: z.string(),
  system_component: z.object({
    id: z.string(),
    code: z.string(),
    name: z.string(),
    version: z.string().nullable(),
    revision: z.number(),
    assignment_id: z.string().nullable(),
    applied_at: z.string().nullable(),
  }),
  program: named,
  system: named,
  element: named.extend({ product_element_id: z.string().nullable(), modified: z.boolean() }),
  component: z
    .object({
      name: z.string(),
      component_type: z.string(),
      definition_id: z.string(),
      definition_code: z.string(),
      definition_name: z.string(),
      owner_party_id: z.string().nullable(),
    })
    .nullable(),
  taken: z
    .object({
      defined_component_id: z.string(),
      revision_id: z.string(),
      version: z.number(),
      state: z.enum(["draft", "published"]),
      published_at: z.string().nullable(),
    })
    .nullable(),
  latest: z
    .object({
      defined_component_id: z.string(),
      revision_id: z.string(),
      version: z.number(),
      published_at: z.string().nullable(),
    })
    .nullable(),
  behind: z.number(),
  newer_drafts: z.number(),
  versions: z.array(
    z.object({
      revision_id: z.string(),
      version: z.number(),
      published_at: z.string().nullable(),
      defined_component_id: z.string(),
      change: componentVersionChangeSchema.nullable(),
    }),
  ),
  affected_controls: z.array(
    z.object({
      id: z.string(),
      code: z.string(),
      title: z.string(),
      versions: z.array(z.number()),
      taken_status: standing.nullable(),
      latest_status: standing.nullable(),
      to_review: z.boolean(),
      control_status: z.enum(keysOf(controlStatuses)).nullable(),
      determined_by: z.enum(keysOf(controlDeterminers)).nullable(),
      inherited: z.boolean(),
    }),
  ),
  determinations: z
    .object({
      taken: z.number(),
      carried: z.number(),
      judged: z.number(),
      to_review: z.number(),
    })
    .nullable(),
  vulnerabilities_fixed: z.array(
    z.object({
      id: z.string(),
      cve_id: z.string(),
      title: z.string(),
      severity: z.string().nullable(),
      fixed_in: z.string().nullable(),
      latest_state: z.enum(keysOf(vulnerabilityStates)).nullable(),
      issue: z
        .object({
          id: z.string(),
          title: z.string(),
          status: z.string(),
          severity: z.string().nullable(),
        })
        .nullable(),
    }),
  ),
  vulnerabilities_open: z.object({ taken: z.number(), latest: z.number().nullable() }).nullable(),
  blocked: z.object({ code: z.enum(VERSION_BLOCKS), message: z.string() }).nullable(),
});

/** A published version after the one taken that holds the component, with what it changes. */
export type NewerVersion = {
  revisionId: string;
  version: number;
  publishedAt: string | null;
  /** The component of the same name in that version. */
  definedComponentId: string;
  /** None where the version records no change of the component. */
  change: ComponentVersionChange | null;
};

/** A control a newer version's change affects, with where it stands before and after. */
export type AffectedControl = {
  id: string;
  code: string;
  title: string;
  /** The versions whose change lists it, the oldest first. */
  versions: number[];
  /** What the version taken reads on it; none where it neither claims it nor was judged on it. */
  takenStatus: ComponentControlStatus | null;
  /** What the latest version reads on it. */
  latestStatus: ComponentControlStatus | null;
  /** Whether the latest holds nothing of its own on it and an earlier version was judged on it. */
  toReview: boolean;
  /** The program's control status on it; none for a control outside its control baseline. */
  controlStatus: ControlStatus | null;
  determinedBy: ControlDeterminer | null;
  /** Whether the component's element inherits the control today. */
  inherited: boolean;
};

/** A CVE the latest version fixes: it affects the version taken and not the latest. */
export type FixedVulnerability = {
  id: string;
  cveId: string;
  title: string;
  /** A key of `severityLevels`; none while nobody has rated it. */
  severity: string | null;
  fixedIn: string | null;
  /** The state the latest version's standing SBOM records for it; none where it does not list it. */
  latestState: VulnerabilityState | null;
  /** The program's operational issue for it, its open one first; none where it holds none. */
  issue: { id: string; title: string; status: string; severity: string | null } | null;
};

/** What Take version shows before it writes, for one system component. */
export type ComponentVersionReview = {
  /** The system component, at the revision the command is sent with. */
  systemComponent: {
    id: string;
    code: string;
    name: string;
    /** The version the system component records for itself. */
    version: string | null;
    revision: number;
    /** The library assignment it came through, if any. */
    assignmentId: string | null;
    appliedAt: string | null;
  };
  program: { id: string; code: string; name: string };
  system: { id: string; code: string; name: string };
  /** The element the component sits on. */
  element: {
    id: string;
    code: string;
    name: string;
    productElementId: string | null;
    /** Whether the program declared the inherited element modified. */
    modified: boolean;
  };
  /** The library component it is built from; none for one built from no library component. */
  component: {
    name: string;
    componentType: string;
    definitionId: string;
    definitionCode: string;
    definitionName: string;
    /** Who answers for the component: its own owner, else its set's. */
    ownerPartyId: string | null;
  } | null;
  /** The version it is built from. */
  taken: {
    definedComponentId: string;
    revisionId: string;
    version: number;
    state: "draft" | "published";
    publishedAt: string | null;
  } | null;
  /** The latest published version of the same component; none where none is newer. */
  latest: {
    definedComponentId: string;
    revisionId: string;
    version: number;
    publishedAt: string | null;
  } | null;
  /** How many published versions it is behind. */
  behind: number;
  /** Newer versions of the set still being drafted: nothing to take yet. */
  newerDrafts: number;
  /** Each published version after the one taken, the oldest first. */
  versions: NewerVersion[];
  /** The controls those versions' changes affect, in code order. */
  affectedControls: AffectedControl[];
  /**
   * The determinations that stand on the version taken, and on the latest: those carried forward
   * from an earlier version, its own, and the controls left to review. None for a component built
   * from no library component.
   */
  determinations: { taken: number; carried: number; judged: number; toReview: number } | null;
  /** The CVEs the latest version fixes, by identifier. */
  vulnerabilitiesFixed: FixedVulnerability[];
  /**
   * How many CVEs affect the version taken, and the latest; the latest's is none while no SBOM of
   * it is recorded, which is not the same as none affecting it.
   */
  vulnerabilitiesOpen: { taken: number; latest: number | null } | null;
  /** Why the version cannot be taken, by code and as a sentence; none where it can. */
  blocked: { code: VersionBlock; message: string } | null;
};

/** Words as a sentence: the review's reasons end one, as the command's refusals do. */
const sentence = (words: string) => {
  const message = words.trim();
  return /[.!?]$/.test(message) ? message : `${message}.`;
};

/** What Take version shows before it writes, as the server reads it. */
export async function readComponentVersionReview(
  client: Client,
  context: Pick<ReadContext, "token">,
  systemComponentId: string,
  signal?: AbortSignal,
): Promise<ComponentVersionReview> {
  let request = client
    .rpc("component_version_review", { p_system_component_id: systemComponentId })
    .setHeader("Authorization", `Bearer ${context.token}`);
  if (signal) request = request.abortSignal(signal);
  const { data, error } = await request;
  if (error) throw new Error(error.message);
  const answer = reviewAnswer.parse(data);
  const { system_component: own, element, component, taken, latest, determinations } = answer;
  return {
    systemComponent: {
      id: own.id,
      code: own.code,
      name: own.name,
      version: own.version,
      revision: own.revision,
      assignmentId: own.assignment_id,
      appliedAt: own.applied_at,
    },
    program: answer.program,
    system: answer.system,
    element: {
      id: element.id,
      code: element.code,
      name: element.name,
      productElementId: element.product_element_id,
      modified: element.modified,
    },
    component: component && {
      name: component.name,
      componentType: component.component_type,
      definitionId: component.definition_id,
      definitionCode: component.definition_code,
      definitionName: component.definition_name,
      ownerPartyId: component.owner_party_id,
    },
    taken: taken && {
      definedComponentId: taken.defined_component_id,
      revisionId: taken.revision_id,
      version: taken.version,
      state: taken.state,
      publishedAt: taken.published_at,
    },
    latest: latest && {
      definedComponentId: latest.defined_component_id,
      revisionId: latest.revision_id,
      version: latest.version,
      publishedAt: latest.published_at,
    },
    behind: answer.behind,
    newerDrafts: answer.newer_drafts,
    versions: answer.versions.map((version) => ({
      revisionId: version.revision_id,
      version: version.version,
      publishedAt: version.published_at,
      definedComponentId: version.defined_component_id,
      change: version.change,
    })),
    affectedControls: answer.affected_controls.map((control) => ({
      id: control.id,
      code: control.code,
      title: control.title,
      versions: control.versions,
      takenStatus: control.taken_status,
      latestStatus: control.latest_status,
      toReview: control.to_review,
      controlStatus: control.control_status,
      determinedBy: control.determined_by,
      inherited: control.inherited,
    })),
    determinations: determinations && {
      taken: determinations.taken,
      carried: determinations.carried,
      judged: determinations.judged,
      toReview: determinations.to_review,
    },
    vulnerabilitiesFixed: answer.vulnerabilities_fixed.map((cve) => ({
      id: cve.id,
      cveId: cve.cve_id,
      title: cve.title,
      severity: cve.severity,
      fixedIn: cve.fixed_in,
      latestState: cve.latest_state,
      issue: cve.issue,
    })),
    vulnerabilitiesOpen: answer.vulnerabilities_open,
    blocked: answer.blocked && {
      code: answer.blocked.code,
      message: sentence(answer.blocked.message),
    },
  };
}

/**
 * Every model the review is read from: the system component and where it sits, the versions of its
 * component's set with what each changes and what stands on them, their SBOMs and the CVEs on
 * them, the program's issues for those, and what decides the program's control status on an
 * affected control.
 */
const REVIEW_MODELS = [
  "system_components",
  "systems",
  "programs",
  "component_definitions",
  "component_definition_revisions",
  "defined_components",
  "defined_component_implementations",
  "component_owners",
  "component_version_changes",
  "component_version_change_controls",
  "component_assessments",
  "component_determinations",
  "sboms",
  "sbom_components",
  "sbom_component_vulnerabilities",
  "vulnerabilities",
  "issue_vulnerabilities",
  "operational_issues",
  "requirement_control_links",
  "requirement_evidence",
  "assessment_findings",
  "assessment_results_revisions",
  "selected_controls",
] as const satisfies readonly TableName[];

/**
 * What Take version shows before it writes. A version published, a change recorded, an assessment
 * published or the component taken reads it again, so the revision the command is sent at is the
 * one on screen. One system component's review never stands in for another's.
 */
export function useComponentVersionReview(
  systemComponentId: string | null | undefined,
): UseQueryResult<ComponentVersionReview, Error> {
  const workspace = useWorkspace();
  const key = ["models", workspace.tenantId, "component_version_review"];
  useStaleOnWrite(workspace.tenantId, REVIEW_MODELS, key);
  return useQuery<ComponentVersionReview, Error>({
    queryKey: [...key, systemComponentId ?? null],
    enabled: !!systemComponentId,
    retry: false,
    queryFn: async ({ signal }) =>
      readComponentVersionReview(
        database(),
        { token: await requireIdentity(workspace) },
        systemComponentId!,
        signal,
      ),
  });
}

/* ——— Take version ———————————————————————————————————————————————————————————————————————————— */

/** A newer version to take, as the reader reviewed it. */
export type TakeComponentVersion = {
  systemComponentId: string;
  /** The component of the same name in the published version to take: the review's `latest`. */
  definedComponentId: string;
  /** The system component's revision the reader reviewed: one changed since is refused. */
  expectedRevision: number;
  /** Chosen once for one review: the same request sent again answers as it first did. */
  requestId: string;
};

const takenSchema = z.object({
  systemComponentId: z.string(),
  programId: z.string(),
  definedComponentId: z.string(),
  previousDefinedComponentId: z.string(),
  /** The version taken, and the one before. */
  version: z.number().int().positive(),
  previousVersion: z.number().int().positive(),
  /** The system component's revision now. */
  revision: z.number().int().positive(),
  appliedAt: z.string(),
  /** The determinations that stand on the version taken, carried forward from an earlier one. */
  carried: z.number().int().nonnegative(),
  /** Those the version taken was judged on itself. */
  judged: z.number().int().nonnegative(),
  /** The controls its changes left to review. */
  toReview: z.number().int().nonnegative(),
  activityEventId: z.string(),
});
/** What taking a version did: the versions, the component's next revision and what stands on it. */
export type TakenComponentVersion = z.infer<typeof takenSchema>;

export const TAKE_NEEDS_VERSION = "Choose the version to take.";
export const TAKE_REVISION_MISSING =
  "Review the version again before taking it; the component's revision is missing.";
export const TAKE_ANSWER_UNREADABLE =
  "The version was taken, but the answer could not be read. Reload to see the component.";

/**
 * The request Take version sends for a review, or why it cannot be sent: the reason the review
 * gives (the component is on the latest version, came through a library assignment, sits on an
 * element inherited from a product, or is built from no library component).
 */
export function versionToTake(
  review: ComponentVersionReview,
): { take: Omit<TakeComponentVersion, "requestId"> } | { waits: string } {
  if (review.blocked) return { waits: review.blocked.message };
  if (!review.latest) return { waits: TAKE_NEEDS_VERSION };
  return {
    take: {
      systemComponentId: review.systemComponent.id,
      definedComponentId: review.latest.definedComponentId,
      expectedRevision: review.systemComponent.revision,
    },
  };
}

/**
 * Take a newer version of the library component a system component is built from, at the revision
 * the reader reviewed, in one request: the component is built from the same component in the
 * published version chosen, and who took it and when are recorded, with one activity event of the
 * program. Nothing else is written; what the program inherits follows from the reads. Refused in
 * the review's own words where the version cannot be taken, and in words the reader acts on for a
 * component changed since it was reviewed or gone, and a target that is not the same component, is
 * not published or is not newer. Sent again under the same id, the request answers as it first did.
 */
export async function takeComponentVersion(
  client: Client,
  { tenantId, token }: ReadContext,
  request: TakeComponentVersion,
): Promise<TakenComponentVersion> {
  if (!request.systemComponentId || !request.definedComponentId)
    throw new Error(TAKE_NEEDS_VERSION);
  if (!Number.isSafeInteger(request.expectedRevision)) throw new Error(TAKE_REVISION_MISSING);
  const args: Database["public"]["Functions"]["take_component_version"]["Args"] = {
    p_tenant_id: tenantId,
    p_system_component_id: request.systemComponentId,
    p_defined_component_id: request.definedComponentId,
    p_expected_revision: request.expectedRevision,
    p_request_id: request.requestId,
  };
  const { data, error } = await client
    .rpc("take_component_version", args)
    .setHeader("Authorization", `Bearer ${token}`);
  if (error) throw new Error(sentence(error.message));
  const parsed = takenSchema.safeParse(data);
  if (!parsed.success) throw new Error(TAKE_ANSWER_UNREADABLE);
  return parsed.data;
}

/**
 * Take version as a mutation. However the request settles, the system components read again, and
 * with them every read of what a system takes from above, where a component is used, what a
 * program inherits and the review itself; the program's activity reads again too. A request whose
 * answer was lost may still have taken the version, and one refused for a component that changed
 * is sent again at the revision read now.
 */
export function useTakeComponentVersion() {
  const workspace = useWorkspace();
  const cache = useQueryClient();
  return useMutation<TakenComponentVersion, Error, TakeComponentVersion>({
    mutationFn: async (request) =>
      takeComponentVersion(
        database(),
        { tenantId: workspace.tenantId, token: await requireIdentity(workspace) },
        request,
      ),
    onSettled: () =>
      void Promise.all(
        (["system_components", "activity_events"] as const).map((table) =>
          invalidateModel(cache, workspace.tenantId, table),
        ),
      ),
  });
}
