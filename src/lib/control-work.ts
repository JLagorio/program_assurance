import { useMemo } from "react";
import type { AssuranceTrace } from "./assurance-trace";
import type { AssessmentCampaignPlan } from "./control-assessment";
import { useControlNextStep } from "./control-status";
import type { ControlObjective } from "./control-objectives";
import { idSet, useRows, type Row } from "./models";
import { useProgramRoles, type ProgramRoleLine, type RoleHolder } from "./program-roles";
import {
  WHOLE_CONTROL,
  coverageOf,
  coveredObjectives,
  objectiveLabel,
} from "./requirement-control-mappings";

/*
 * A control's work in a program, as the tabs of its record read it: the requirements that map it
 * there with what each covers and on which systems, the evidence they cite with its review, and,
 * once an open campaign's plan holds what is left to judge of it, whom it waits on. The trace says
 * which requirements map the control (`assurance_trace`, the reads the record shares); a
 * requirement counts at its latest revision, as the control status counts it, so its mappings and
 * its evidence are read on that revision. Each is derived here from rows read scoped on the server.
 */

type TraceRequirement = AssuranceTrace["requirements"][number];

/** A requirement's revisions as the tabs read them: enough to find its latest. */
export type RevisionRef = Pick<
  Row<"requirement_revisions">,
  "id" | "engineering_requirement_id" | "version_number"
>;

/** Each requirement's latest revision, by the requirement's id: the one a mapping or a link counts on. */
export function latestRevisions(revisions: readonly RevisionRef[]): Map<string, string> {
  const latest = new Map<string, RevisionRef>();
  for (const revision of revisions) {
    const held = latest.get(revision.engineering_requirement_id);
    if (!held || revision.version_number > held.version_number)
      latest.set(revision.engineering_requirement_id, revision);
  }
  return new Map([...latest].map(([requirement, revision]) => [requirement, revision.id]));
}

/**
 * The latest revision of each requirement named, read as one request: the revision a requirement's
 * mappings and evidence count on. `latest` is empty until it is read.
 */
export function useLatestRevisions(requirementIds: readonly string[] | undefined) {
  const ids = useMemo(() => idSet(requirementIds), [requirementIds]);
  const revisions = useRows(
    "requirement_revisions",
    { engineering_requirement_id: ids },
    {
      columns: ["id", "engineering_requirement_id", "version_number"],
      enabled: requirementIds !== undefined,
    },
  );
  const latest = useMemo(() => latestRevisions(revisions.data ?? []), [revisions.data]);
  return { revisions, latest };
}

/* ——— The control's text, part by part —————————————————————————————————————————————————— */

export type TextPart = Pick<
  Row<"control_parts">,
  "id" | "parent_part_id" | "name" | "prose" | "props" | "ordinal"
>;

/** A part of the control's statement, with the narrative an SSP records for it and what contributes. */
export type ImplementationPart = {
  /** The statement's part, or none for the Summary: the control implementation's own narrative. */
  partId: string | null;
  /** As the catalog labels it, its parents' labels before it ("a.", "b.1."); none for the Summary. */
  label: string | null;
  prose: string | null;
  /** The implementation statement recorded for the part; none where nobody wrote one. */
  statementId: string | null;
  /** The contributions recorded on that statement, or, for the Summary, on no listed part. */
  contributionIds: string[];
};

/**
 * The control's statement part by part, in the catalog's reading order, with what an SSP records
 * against each: the Summary first (the control implementation's narrative, and the contributions
 * recorded on no part listed), then every item of the statement, a nested item after the one that
 * holds it, each with its implementation statement and the contributions recorded on it.
 */
export function implementationParts(input: {
  parts: readonly TextPart[];
  statements: readonly { id: string; control_part_id: string }[];
  contributions: readonly { id: string; implementation_statement_id: string | null }[];
}): ImplementationPart[] {
  const children = new Map<string | null, TextPart[]>();
  for (const part of input.parts)
    if (part.name === "statement" || part.name === "item")
      children.set(part.parent_part_id, [...(children.get(part.parent_part_id) ?? []), part]);
  const statementByPart = new Map(input.statements.map((row) => [row.control_part_id, row.id]));
  const items: ImplementationPart[] = [];
  const walk = (parentId: string, prefix: string) => {
    for (const part of [...(children.get(parentId) ?? [])].sort((a, b) => a.ordinal - b.ordinal)) {
      if (part.name !== "item") continue;
      const label = `${prefix}${objectiveLabel(part) ?? ""}` || null;
      const statementId = statementByPart.get(part.id) ?? null;
      items.push({
        partId: part.id,
        label,
        prose: part.prose,
        statementId,
        contributionIds: statementId
          ? input.contributions
              .filter((row) => row.implementation_statement_id === statementId)
              .map((row) => row.id)
          : [],
      });
      walk(part.id, label ?? "");
    }
  };
  const roots = (children.get(null) ?? []).filter((part) => part.name === "statement");
  for (const root of roots) walk(root.id, "");
  const listed = new Set(items.flatMap((item) => (item.statementId ? [item.statementId] : [])));
  return [
    {
      partId: null,
      label: null,
      prose: null,
      statementId: null,
      contributionIds: input.contributions
        .filter(
          (row) => !row.implementation_statement_id || !listed.has(row.implementation_statement_id),
        )
        .map((row) => row.id),
    },
    ...items,
  ];
}

/* ——— What each requirement covers ———————————————————————————————————————————————————————— */

/** A mapping of the control, as the Requirements tab reads it. */
export type ControlMapping = Pick<
  Row<"requirement_control_links">,
  "id" | "requirement_revision_id" | "control_part_id" | "system_id" | "relationship_type"
>;

/** One requirement that maps the control, with what its latest revision's mappings cover. */
export type RequirementCoverage = {
  id: string;
  code: string;
  title: string;
  state: string;
  /** Its latest revision, which its mappings and evidence count on; none while it is not read. */
  revisionId: string | null;
  /** How many evidence versions its latest revision cites, as the trace counts them. */
  evidence: number;
  /**
   * A mapping covers the whole control: it names no part, or a statement of its text. Mappings of
   * every objective one by one are not one of the whole control: they list the objectives.
   */
  whole: boolean;
  /** The objectives covered by label, in the catalog's reading order; none where it covers the whole control. */
  objectives: string[];
  /** How many of the control's objectives it covers, of `total`. */
  covered: number;
  total: number;
  /** The systems its mappings name, by id; none where a mapping names no system. */
  systems: string[];
  /** A mapping names no system, so it counts on every system that selects the control. */
  everySystem: boolean;
};

/**
 * What each requirement that maps the control covers at its latest revision: the whole control, or
 * its assessment objectives by label (a mapping covers the objective it names and every one under
 * it), and the systems its mappings name. A requirement whose latest revision holds no mapping of
 * the control covers nothing, as the status counts it. In the trace's order (by code).
 */
export function requirementCoverage(input: {
  requirements: readonly Pick<
    TraceRequirement,
    "id" | "code" | "title" | "state" | "evidence_count"
  >[];
  latest: ReadonlyMap<string, string>;
  mappings: readonly ControlMapping[];
  objectives: readonly Pick<ControlObjective, "id" | "label" | "ancestors">[];
}): RequirementCoverage[] {
  const byRevision = new Map<string, ControlMapping[]>();
  for (const mapping of input.mappings)
    byRevision.set(mapping.requirement_revision_id, [
      ...(byRevision.get(mapping.requirement_revision_id) ?? []),
      mapping,
    ]);
  return input.requirements.map((requirement) => {
    const revisionId = input.latest.get(requirement.id) ?? null;
    const mappings = (revisionId && byRevision.get(revisionId)) || [];
    const coverage = coverageOf(
      input.objectives,
      mappings.map((mapping) => mapping.control_part_id),
    );
    const whole = coverage.has(WHOLE_CONTROL);
    const covered = mappings.length ? coveredObjectives(coverage, input.objectives) : 0;
    return {
      id: requirement.id,
      code: requirement.code,
      title: requirement.title,
      state: requirement.state,
      revisionId,
      evidence: requirement.evidence_count,
      whole: mappings.length > 0 && whole,
      objectives:
        mappings.length && !whole
          ? input.objectives
              .filter((objective) => coverage.has(objective.id))
              .map((objective) => objective.label ?? "Unlabelled objective")
          : [],
      covered,
      total: input.objectives.length,
      systems: idSet(mappings.map((mapping) => mapping.system_id)),
      everySystem: mappings.some((mapping) => mapping.system_id === null),
    };
  });
}

/* ——— The evidence they cite ————————————————————————————————————————————————————————————— */

export type CitedLink = Pick<
  Row<"requirement_evidence">,
  "id" | "requirement_revision_id" | "evidence_version_id"
>;
export type CitedVersion = Pick<
  Row<"evidence_versions">,
  "id" | "artifact_id" | "version_number" | "state" | "collected_at" | "expires_at"
>;
export type CitedArtifact = Pick<Row<"evidence_artifacts">, "id" | "title" | "artifact_kind">;
export type VersionReview = Pick<
  Row<"evidence_reviews">,
  "id" | "evidence_version_id" | "reviewer_party_id" | "decision" | "reviewed_at" | "created_at"
>;

/** An evidence version the control's requirements cite, with its latest review. */
export type CitedEvidence = {
  /** The version's id: the row's identity. */
  id: string;
  artifactId: string;
  title: string;
  kind: string;
  version: number;
  state: string;
  collected: string | null;
  expires: string | null;
  /** The latest review's decision, `not_reviewed` where the version has none. */
  review: string;
  /** Who the latest review names; none where it names nobody or there is none. */
  reviewerId: string | null;
  /** The requirements that cite it, by code, in code order. */
  citedBy: string[];
};

const newestFirst = (a: VersionReview, b: VersionReview) =>
  (b.reviewed_at ?? b.created_at).localeCompare(a.reviewed_at ?? a.created_at) ||
  b.id.localeCompare(a.id);

/**
 * The evidence versions the latest revisions of the control's requirements cite, each once with the
 * requirements that cite it and its latest review (the newest by when it was decided, else
 * recorded, as the evidence register reads it). A version whose artifact the reader cannot read is
 * left out. By the artifact's title, the newest version first.
 */
export function citedEvidence(input: {
  requirements: readonly Pick<TraceRequirement, "id" | "code">[];
  latest: ReadonlyMap<string, string>;
  links: readonly CitedLink[];
  versions: readonly CitedVersion[];
  artifacts: readonly CitedArtifact[];
  reviews: readonly VersionReview[];
}): CitedEvidence[] {
  const codeByRevision = new Map(
    input.requirements.flatMap((requirement) => {
      const revision = input.latest.get(requirement.id);
      return revision ? [[revision, requirement.code] as const] : [];
    }),
  );
  const citers = new Map<string, Set<string>>();
  for (const link of input.links) {
    const code = codeByRevision.get(link.requirement_revision_id);
    if (!code) continue;
    citers.set(
      link.evidence_version_id,
      (citers.get(link.evidence_version_id) ?? new Set()).add(code),
    );
  }
  const artifacts = new Map(input.artifacts.map((artifact) => [artifact.id, artifact]));
  const latestReview = new Map<string, VersionReview>();
  for (const review of [...input.reviews].sort(newestFirst))
    if (!latestReview.has(review.evidence_version_id))
      latestReview.set(review.evidence_version_id, review);
  const byCode = new Intl.Collator("en", { numeric: true }).compare;
  return input.versions
    .flatMap((version): CitedEvidence[] => {
      const artifact = artifacts.get(version.artifact_id);
      const codes = citers.get(version.id);
      if (!artifact || !codes) return [];
      const review = latestReview.get(version.id);
      return [
        {
          id: version.id,
          artifactId: artifact.id,
          title: artifact.title,
          kind: artifact.artifact_kind,
          version: version.version_number,
          state: version.state,
          collected: version.collected_at,
          expires: version.expires_at,
          review: review?.decision ?? "not_reviewed",
          reviewerId: review?.reviewer_party_id ?? null,
          citedBy: [...codes].sort(byCode),
        },
      ];
    })
    .sort((a, b) => a.title.localeCompare(b.title) || b.version - a.version);
}

/* ——— Whom an assessment waits on ——————————————————————————————————————————————————————— */

/** A control under way in an assessment: the campaign whose plan holds it, and whom it waits on. */
export type AssessmentWait = {
  campaign: { id: string; title: string; endsAt: string | null };
  /**
   * Who answers for its results: the program's lead assessor today, who publishes them, else its
   * assessors today. None where the program records nobody in either role, since the schema
   * records no assessor of a campaign.
   */
  waitingOn: RoleHolder[];
  role: "lead_assessor" | "assessor" | null;
};

/**
 * Whom a control waits on once an open campaign's plan holds what is left to judge of it (`planned`
 * of `useControlAssessment`): the program's lead assessor holding the role today, who publishes the
 * campaign's results, else the assessors holding theirs today. None while no plan holds it.
 */
export function assessmentWait(
  planned: { id: string } | null | undefined,
  campaigns: readonly Pick<AssessmentCampaignPlan, "id" | "title" | "endsAt">[],
  roles: readonly ProgramRoleLine[],
): AssessmentWait | null {
  const campaign = planned && campaigns.find((item) => item.id === planned.id);
  if (!campaign) return null;
  const holders = (role: "lead_assessor" | "assessor") =>
    roles.find((line) => line.role === role)?.holders ?? [];
  const lead = holders("lead_assessor");
  const assessors = holders("assessor");
  return {
    campaign: { id: campaign.id, title: campaign.title, endsAt: campaign.endsAt },
    waitingOn: lead.length ? lead : assessors,
    role: lead.length ? "lead_assessor" : assessors.length ? "assessor" : null,
  };
}

/**
 * Whom a control of the program waits on in its assessment: once its next step is to open the
 * campaign whose plan holds what is left to judge of it (`controlNextStep`, a control at Not
 * assessed), that campaign, the day it ends and who holds the program's roles today. `wait` is null
 * where the control waits on no assessment, and undefined until that is read. `requirements` are
 * the requirements that map the control, as its trace reads them, which the next step shares.
 */
export function useAssessmentWait(
  programId: string | null | undefined,
  controlId: string | null | undefined,
  requirements?: AssuranceTrace["requirements"] | undefined,
) {
  const { step, plans, known, queries } = useControlNextStep(programId, controlId, requirements);
  const assessing = step?.kind === "open_campaign";
  const roles = useProgramRoles(assessing ? programId : null);
  const wait = useMemo(() => {
    if (!known) return undefined;
    if (!assessing) return null;
    return plans && roles.data
      ? assessmentWait(step.campaign, plans.campaigns, roles.data)
      : undefined;
  }, [known, assessing, step, plans, roles.data]);
  return { wait, queries: assessing ? [...queries, roles] : queries };
}
