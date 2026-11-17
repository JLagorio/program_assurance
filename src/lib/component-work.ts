import { useQueries, type UseQueryResult } from "@tanstack/react-query";
import { useMemo } from "react";
import { useWorkspace } from "./workspace-context";
import {
  STATUS_MODELS,
  readComponentControlStatus,
  type ComponentConsumers,
  type ComponentControlCounts,
  type ComponentControlStatus,
  type ComponentControlStatusAnswer,
  type ComponentVersionChange,
  type SystemConsumer,
} from "./component-reuse";
import type {
  ComponentVulnerabilities,
  SbomComponentKind,
  SbomFormat,
  VulnerabilityIssue,
} from "./component-vulnerabilities";
import type { VulnerabilityState } from "./component-versions";
import { database, requireIdentity } from "./database";
import { idSet, useRow, useRows, type Row } from "./models";
import { useStaleOnWrite } from "./server-table";
import { vulnerabilityStates } from "./status";

/*
 * What a shared component's record works from on its Findings, SBOM and Versions tabs, beside the
 * reads in component-reuse, component-offers, component-vulnerabilities and component-versions:
 * who a component is across the versions of its set, which programs accepting an offer reaches,
 * each SBOM component's CVEs in VEX's words, who has answered a CVE, and each version's standing
 * and what a version's change does to the controls it affects. A component has no identity of its
 * own across versions: it is followed by its set and its name.
 */

/** Codes and names as a reader orders them: AC-2 before AC-10. */
const natural = new Intl.Collator("en", { numeric: true });

/* ——— Who a component is ———————————————————————————————————————————————————————————————————————— */

/** One component version, by its set and its name, as every tab of the record reads it. */
export type ComponentIdentity = {
  /** The component version: a `defined_components` row. */
  id: string;
  name: string;
  revisionId: string;
  /** The set the component belongs to, which its versions are versions of. */
  definitionId: string;
  version: number;
  state: string;
  publishedAt: string | null;
};

/**
 * One component version as its set and its name, from its row and its version's: `undefined`
 * while either is read, `null` for a component that is gone or not visible.
 */
export function useComponentIdentity(componentId: string) {
  const component = useRow("defined_components", componentId);
  const revisionId = component.data?.component_definition_revision_id;
  const revision = useRow("component_definition_revisions", revisionId);
  const identity = useMemo((): ComponentIdentity | null | undefined => {
    if (component.data === null) return null;
    if (!component.data || revision.data === undefined) return undefined;
    if (revision.data === null) return null;
    return {
      id: component.data.id,
      name: component.data.name,
      revisionId: revision.data.id,
      definitionId: revision.data.component_definition_id,
      version: revision.data.version_number,
      state: revision.data.state,
      publishedAt: revision.data.published_at,
    };
  }, [component.data, revision.data]);
  return { identity, queries: [component, revision] };
}

/* ——— Which programs an offer reaches ——————————————————————————————————————————————————————————— */

/** A program built from the version an offer names, and whether it is the program that offered. */
export type OfferReach = {
  programId: string;
  programCode: string;
  programName: string;
  /** The offering program keeps its own issue; every other one gets one when a finding is accepted. */
  offering: boolean;
  /** Its system components built from that version. */
  systemComponents: number;
};

/**
 * The programs built from the component version an offer names: each program that holds a system
 * component built from it, once, the others by code and the offering program last. A variant that
 * left the element out holds no component and is not reached.
 */
export function offerReach(
  offer: { programId: string; definedComponentId: string },
  systems: readonly SystemConsumer[],
): OfferReach[] {
  const programs = new Map<string, OfferReach>();
  for (const system of systems) {
    if (system.definedComponentId !== offer.definedComponentId || !system.systemComponentId)
      continue;
    const held = programs.get(system.programId);
    if (held) held.systemComponents += 1;
    else
      programs.set(system.programId, {
        programId: system.programId,
        programCode: system.programCode,
        programName: system.programName,
        offering: system.programId === offer.programId,
        systemComponents: 1,
      });
  }
  return [...programs.values()].sort(
    (a, b) =>
      Number(a.offering) - Number(b.offering) ||
      natural.compare(a.programCode, b.programCode) ||
      a.programId.localeCompare(b.programId),
  );
}

/* ——— An SBOM in words ———————————————————————————————————————————————————————————————————————— */

/** What a component of an SBOM is, in a reader's words: CycloneDX's kinds. */
export const SBOM_KIND_WORDS: Record<SbomComponentKind, string> = {
  library: "Library",
  application: "Application",
  "operating-system": "Operating system",
  firmware: "Firmware",
  container: "Container",
  device: "Device",
  file: "File",
};

/** An SBOM's format and the version of its specification: "CycloneDX 1.5". */
export function sbomFormatWords(format: SbomFormat, specVersion: string | null): string {
  const name = format === "cyclonedx" ? "CycloneDX" : format === "spdx" ? "SPDX" : "Other format";
  return specVersion ? `${name} ${specVersion}` : name;
}

/* ——— An SBOM's CVEs, in VEX's words ————————————————————————————————————————————————————————————— */

const LINK_COLUMNS = [
  "id",
  "sbom_component_id",
  "vulnerability_id",
  "state",
  "note",
] as const satisfies readonly (keyof Row<"sbom_component_vulnerabilities">)[];
const CVE_COLUMNS = [
  "id",
  "cve_id",
  "title",
  "severity",
  "cvss_score",
  "fixed_in",
  "known_exploited",
] as const satisfies readonly (keyof Row<"vulnerabilities">)[];

type LinkRow = Pick<Row<"sbom_component_vulnerabilities">, (typeof LINK_COLUMNS)[number]>;
type CveRow = Pick<Row<"vulnerabilities">, (typeof CVE_COLUMNS)[number]>;

/** A CVE on one component of an SBOM, with its state there in VEX's words. */
export type SbomCve = {
  /** The link's id: one CVE on one SBOM component. */
  id: string;
  sbomComponentId: string;
  vulnerabilityId: string;
  cveId: string;
  title: string;
  state: VulnerabilityState;
  /** Why the state holds, as the record says it: the affected range, the fix. */
  note: string | null;
  /** A key of `severityLevels`; none while nobody has rated it. */
  severity: string | null;
  cvssScore: number | null;
  fixedIn: string | null;
  knownExploited: boolean;
};

const STATE_ORDER = Object.keys(vulnerabilityStates) as VulnerabilityState[];
const stateOf = (state: string): VulnerabilityState =>
  (STATE_ORDER as string[]).includes(state) ? (state as VulnerabilityState) : "under_investigation";

/**
 * Each SBOM component's CVEs, in VEX's order (affected, under investigation, fixed, not
 * affected), then by CVE identifier. A link whose CVE could not be read is left out.
 */
export function sbomCvesByComponent(
  links: readonly LinkRow[],
  cves: readonly CveRow[],
): Map<string, SbomCve[]> {
  const byId = new Map(cves.map((cve) => [cve.id, cve]));
  const found = new Map<string, SbomCve[]>();
  for (const link of links) {
    const cve = byId.get(link.vulnerability_id);
    if (!cve) continue;
    const list = found.get(link.sbom_component_id) ?? [];
    list.push({
      id: link.id,
      sbomComponentId: link.sbom_component_id,
      vulnerabilityId: cve.id,
      cveId: cve.cve_id,
      title: cve.title,
      state: stateOf(link.state),
      note: link.note,
      severity: cve.severity,
      cvssScore: cve.cvss_score,
      fixedIn: cve.fixed_in,
      knownExploited: cve.known_exploited,
    });
    found.set(link.sbom_component_id, list);
  }
  for (const list of found.values())
    list.sort(
      (a, b) =>
        STATE_ORDER.indexOf(a.state) - STATE_ORDER.indexOf(b.state) ||
        natural.compare(a.cveId, b.cveId),
    );
  return found;
}

/** The CVEs an SBOM records as fixed in what it describes, each once, by identifier. */
export function fixedCves(byComponent: ReadonlyMap<string, readonly SbomCve[]>): SbomCve[] {
  const fixed = new Map<string, SbomCve>();
  for (const list of byComponent.values())
    for (const cve of list)
      if (cve.state === "fixed" && !fixed.has(cve.vulnerabilityId))
        fixed.set(cve.vulnerabilityId, cve);
  return [...fixed.values()].sort((a, b) => natural.compare(a.cveId, b.cveId));
}

/** Which SBOM components' CVEs a read lists. */
export type SbomCveScope =
  /** The components a register's page shows. */
  | { sbomComponentIds: readonly string[] }
  /** One SBOM's components, in one state: the CVEs it records as fixed. */
  | { sbomId: string; state: VulnerabilityState };

/**
 * The CVEs recorded on SBOM components, read through the links that tie them, then the CVEs
 * themselves by id: those of the components a page shows, or one SBOM's in one state, read through
 * the components they are found in. Nothing is read while no scope is named.
 */
export function useSbomCves(scope: SbomCveScope | null) {
  const filters = !scope
    ? {}
    : "sbomComponentIds" in scope
      ? { sbom_component_id: idSet(scope.sbomComponentIds) }
      : { "sbom_components.sbom_id": scope.sbomId, state: scope.state };
  const links = useRows("sbom_component_vulnerabilities", filters, {
    columns: LINK_COLUMNS,
    enabled: !!scope,
    keepPrevious: true,
  });
  const cves = useRows(
    "vulnerabilities",
    { id: idSet(links.data?.map((link) => link.vulnerability_id)) },
    { columns: CVE_COLUMNS, enabled: links.isSuccess, keepPrevious: true },
  );
  const byComponent = useMemo(
    () => (links.data && cves.data ? sbomCvesByComponent(links.data, cves.data) : undefined),
    [links.data, cves.data],
  );
  return { byComponent, queries: scope ? [links, cves] : [] };
}

/* ——— Who has answered a CVE ————————————————————————————————————————————————————————————————————— */

/** A program built from the version, with how it has answered one CVE that affects it. */
export type CveAnswer = {
  /** The CVE and the program: one row each. */
  id: string;
  vulnerabilityId: string;
  cveId: string;
  programId: string;
  programCode: string;
  programName: string;
  /** Whether it holds an operational issue for the CVE. */
  answered: boolean;
  issue: VulnerabilityIssue | null;
};

/**
 * Every program built from the version under each CVE that affects it, the worst CVE first as the
 * read gives them, and the programs that have not answered first, then by code.
 */
export function cveAnswers(answer: Pick<ComponentVulnerabilities, "vulnerabilities">): CveAnswer[] {
  return answer.vulnerabilities.flatMap((cve) =>
    [...cve.consumers]
      .sort(
        (a, b) =>
          Number(a.answered) - Number(b.answered) || natural.compare(a.programCode, b.programCode),
      )
      .map((consumer) => ({
        id: `${cve.vulnerabilityId}:${consumer.programId}`,
        vulnerabilityId: cve.vulnerabilityId,
        cveId: cve.cveId,
        programId: consumer.programId,
        programCode: consumer.programCode,
        programName: consumer.programName,
        answered: consumer.answered,
        issue: consumer.issue,
      })),
  );
}

/** A CVE some program built from the version holds no issue for, with those programs' names. */
export type UnansweredCve = { vulnerabilityId: string; cveId: string; programs: string[] };

/** The CVEs still owed an answer, each with the programs that owe it, by name. */
export function unansweredCves(
  answer: Pick<ComponentVulnerabilities, "vulnerabilities">,
): UnansweredCve[] {
  return answer.vulnerabilities
    .map((cve) => ({
      vulnerabilityId: cve.vulnerabilityId,
      cveId: cve.cveId,
      programs: cve.consumers
        .filter((consumer) => !consumer.answered)
        .sort((a, b) => natural.compare(a.programCode, b.programCode))
        .map((consumer) => consumer.programName),
    }))
    .filter((cve) => cve.programs.length > 0);
}

/* ——— The versions of a component ———————————————————————————————————————————————————————————————— */

/** A version of the set that holds the component, and the component of that name in it. */
export type ComponentVersionHeld = {
  revisionId: string;
  version: number;
  state: string;
  publishedAt: string | null;
  definedComponentId: string;
};

/**
 * The versions of a set that hold a component of the name, the newest first. A version that does
 * not hold it (one that dropped it, or one before it was added) is left out.
 */
export function versionsHolding(
  revisions: readonly Pick<
    Row<"component_definition_revisions">,
    "id" | "version_number" | "state" | "published_at"
  >[],
  components: readonly Pick<Row<"defined_components">, "id" | "component_definition_revision_id">[],
): ComponentVersionHeld[] {
  const held = new Map(
    components.map((component) => [component.component_definition_revision_id, component.id]),
  );
  return revisions
    .filter((revision) => held.has(revision.id))
    .map((revision) => ({
      revisionId: revision.id,
      version: revision.version_number,
      state: revision.state,
      publishedAt: revision.published_at,
      definedComponentId: held.get(revision.id)!,
    }))
    .sort((a, b) => b.version - a.version);
}

/**
 * The versions of the component's set that hold it, each with the component of its name: the
 * set's versions, then the components of that name in them. `undefined` while any is read.
 */
export function useComponentVersionsHeld(identity: ComponentIdentity | null | undefined) {
  const revisions = useRows(
    "component_definition_revisions",
    { component_definition_id: identity?.definitionId ?? "" },
    { columns: ["id", "version_number", "state", "published_at"], enabled: !!identity },
  );
  const components = useRows(
    "defined_components",
    {
      component_definition_revision_id: idSet(revisions.data?.map((revision) => revision.id)),
      name: identity?.name ?? "",
    },
    { columns: ["id", "component_definition_revision_id"], enabled: revisions.isSuccess },
  );
  const versions = useMemo(
    () =>
      revisions.data && components.data
        ? versionsHolding(revisions.data, components.data)
        : undefined,
    [revisions.data, components.data],
  );
  return { versions, queries: [revisions, components] };
}

/**
 * Where each component version named stands, one read a version under the key the record's other
 * reads of a version's standing use, so each is read once wherever it is drawn. A write that moves
 * a version's standing reads them all again.
 */
export function useComponentStandings(definedComponentIds: readonly string[]) {
  const workspace = useWorkspace();
  const key = ["models", workspace.tenantId, "component_control_status"];
  useStaleOnWrite(workspace.tenantId, STATUS_MODELS, key);
  return useQueries({
    queries: definedComponentIds.map((id) => ({
      queryKey: [...key, id],
      retry: false,
      queryFn: async ({ signal }: { signal: AbortSignal }) =>
        readComponentControlStatus(
          database(),
          { token: await requireIdentity(workspace) },
          id,
          signal,
        ),
    })),
    combine: standingsOf,
  });
}

/** The answers by version, once every one is read; the reads, as a collection waits on them. */
function standingsOf(reads: UseQueryResult<ComponentControlStatusAnswer, Error>[]) {
  const ready = reads.every((read) => read.data !== undefined);
  return {
    standings: ready
      ? new Map(reads.map((read) => [read.data!.component.id, read.data!] as const))
      : undefined,
    queries: reads,
  };
}

const NO_COUNTS: ComponentControlCounts = {
  satisfied: 0,
  partially_satisfied: 0,
  other_than_satisfied: 0,
  not_assessed: 0,
};

/** A version of the component, with where it stands and who is built from it. */
export type ComponentVersionLine = ComponentVersionHeld & {
  /** The row's identity: the component version. */
  id: string;
  /**
   * The published assessment that judged this version itself, the latest; none where every
   * determination that stands on it was carried forward from an earlier version.
   */
  assessment: { id: string; title: string; on: string; assessorPartyId: string | null } | null;
  /** How many controls it claims, was judged on or an earlier version was judged on. */
  controls: number;
  /** Its standing on them: the four statuses, the controls to review among those not assessed. */
  counts: ComponentControlCounts;
  satisfied: number;
  /** The controls a change left to review: not assessed until this version is judged on them. */
  toReview: number;
  /** The product elements of current product versions and the system components built from it. */
  consumers: number;
};

/**
 * Each version of the component, the newest first, with the assessment that judged it itself,
 * its controls satisfied out of those it stands on, the controls left to review and how many
 * consumers took it: a current product version's element pinned to it, and a system component
 * built from it (a variant that left the element out holds none).
 */
export function componentVersionLines(
  versions: readonly ComponentVersionHeld[],
  standings: ReadonlyMap<
    string,
    Pick<ComponentControlStatusAnswer, "assessments" | "total" | "counts" | "toReview">
  >,
  consumers: Pick<ComponentConsumers, "products" | "systems"> | undefined,
): ComponentVersionLine[] {
  return versions.map((version) => {
    const standing = standings.get(version.definedComponentId);
    const own = (standing?.assessments ?? [])
      .filter((assessment) => assessment.version === version.version)
      .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))[0];
    const products = (consumers?.products ?? []).filter(
      (product) => product.current && product.definedComponentId === version.definedComponentId,
    ).length;
    const systems = (consumers?.systems ?? []).filter(
      (system) =>
        system.systemComponentId !== null &&
        system.definedComponentId === version.definedComponentId,
    ).length;
    return {
      ...version,
      id: version.definedComponentId,
      assessment: own
        ? {
            id: own.id,
            title: own.title,
            on: own.completedOn ?? own.publishedAt,
            assessorPartyId: own.assessorPartyId,
          }
        : null,
      controls: standing?.total ?? 0,
      counts: standing?.counts ?? NO_COUNTS,
      satisfied: standing?.counts.satisfied ?? 0,
      toReview: standing?.toReview ?? 0,
      consumers: products + systems,
    };
  });
}

/** What a version's change does to its standing: carried, judged on it, to review, not assessed. */
export type ChangeOutcome = {
  controls: number;
  /** Determinations carried forward from an earlier version. */
  carried: number;
  /** Determinations this version was judged on itself. */
  judged: number;
  /** Controls an earlier version was judged on that the change left to review. */
  toReview: number;
  /** Controls nobody judged, those to review apart. */
  notAssessed: number;
};

/** Where a version stands once its change has stopped what it affects from carrying forward. */
export function changeOutcome(
  standing: Pick<ComponentControlStatusAnswer, "total" | "counts" | "carried" | "toReview">,
): ChangeOutcome {
  const determined = standing.total - standing.counts.not_assessed;
  return {
    controls: standing.total,
    carried: standing.carried,
    judged: Math.max(0, determined - standing.carried),
    toReview: standing.toReview,
    notAssessed: Math.max(0, standing.counts.not_assessed - standing.toReview),
  };
}

/** A control a version's change affects, with where the version before and this one stand on it. */
export type AffectedControlLine = {
  id: string;
  code: string;
  title: string;
  /** The version before's standing; none where it neither claims the control nor was judged on it. */
  before: ComponentControlStatus | null;
  /** This version's standing; none where it neither claims the control nor carries one. */
  after: ComponentControlStatus | null;
  /** Whether this version reads not assessed because the change stopped a determination carrying. */
  toReview: boolean;
};

/**
 * The controls a version's change affects, in code order, each with the standing of the version
 * before (none for the first version) and of this one.
 */
export function affectedControlLines(
  change: Pick<ComponentVersionChange, "controls">,
  shown: Pick<ComponentControlStatusAnswer, "controls">,
  before: Pick<ComponentControlStatusAnswer, "controls"> | null,
): AffectedControlLine[] {
  const now = new Map(shown.controls.map((control) => [control.id, control]));
  const then = new Map((before?.controls ?? []).map((control) => [control.id, control]));
  return [...change.controls]
    .sort((a, b) => natural.compare(a.code, b.code))
    .map((control) => {
      const after = now.get(control.id);
      return {
        id: control.id,
        code: control.code,
        title: control.title,
        before: then.get(control.id)?.status ?? null,
        after: after?.status ?? null,
        toReview: after?.toReview ?? false,
      };
    });
}
