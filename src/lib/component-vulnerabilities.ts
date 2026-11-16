import { useMutation, useQuery, useQueryClient, type UseQueryResult } from "@tanstack/react-query";
import type { SupabaseClient } from "@supabase/supabase-js";
import { useMemo } from "react";
import { z } from "zod";
import { useWorkspace } from "./workspace-context";
import type { ComponentVersion } from "./component-reuse";
import { database, requireIdentity } from "./database";
import type { Database } from "./database.types";
import {
  invalidateModel,
  useRows,
  type Filters,
  type ReadContext,
  type Row,
  type TableName,
} from "./models";
import { serverRead, useStaleOnWrite, type ServerRow } from "./server-table";
import { severityLevels } from "./status";

/*
 * What a shared component is made of and what is known to be wrong with it, each recorded once.
 *
 * An SBOM is a record of one subject, a library component version or an asset, with the components
 * it lists; a subject's standing SBOM is its latest by the day it was generated. `import_sbom`
 * writes one whole, all of its components or none, one answer a request, and `readSbomFile` reads
 * a CycloneDX or an SPDX document into what that command takes. A CVE is a record of the
 * workspace, tied to the SBOM components it is found in with its state in VEX's words; it affects
 * a component version where a component of the version's standing SBOM carries it as affected.
 * `component_vulnerabilities` answers, for one component version, those CVEs and under each every
 * program built from that version with the operational issue it holds for it, or none; and
 * `open_vulnerability_issues` opens that issue in every program that holds none.
 * `sbom_component_rows` lists the components of every standing SBOM.
 */

type Client = Pick<SupabaseClient, "rpc">;
type Functions = Database["public"]["Functions"];

/** An SBOM document's format, as `sboms.format` records it. */
export const SBOM_FORMATS = ["cyclonedx", "spdx", "other"] as const;
export type SbomFormat = (typeof SBOM_FORMATS)[number];

/** What a component of an SBOM is, in CycloneDX's words: the kinds `sbom_components.kind` takes. */
export const SBOM_COMPONENT_KINDS = [
  "library",
  "application",
  "operating-system",
  "firmware",
  "container",
  "device",
  "file",
] as const;
export type SbomComponentKind = (typeof SBOM_COMPONENT_KINDS)[number];

/** How many components one import takes at most. */
export const SBOM_COMPONENT_LIMIT = 5000;

type Failure = { code?: string | undefined; message: string };

/** A refusal in the reader's words: the command's own, which say what stopped it. */
function refusal(error: Failure): Error {
  const message = error.message.trim();
  return new Error(/[.!?]$/.test(message) ? message : `${message}.`);
}

/* ——— The CVEs on one component version, and who has answered them ——————————————————————————— */

const vulnerabilitiesAnswer = z.object({
  defined_component_id: z.string(),
  component: z.object({
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
  }),
  sbom: z
    .object({
      id: z.string(),
      title: z.string(),
      format: z.enum(SBOM_FORMATS),
      spec_version: z.string().nullable(),
      serial: z.string().nullable(),
      generated_on: z.string(),
      evidence_artifact_id: z.string().nullable(),
      components: z.number(),
    })
    .nullable(),
  vulnerabilities: z.array(
    z.object({
      vulnerability_id: z.string(),
      cve_id: z.string(),
      title: z.string(),
      severity: z.string().nullable(),
      cvss_score: z.number().nullable(),
      cvss_vector: z.string().nullable(),
      published_on: z.string().nullable(),
      fixed_in: z.string().nullable(),
      source_uri: z.string().nullable(),
      known_exploited: z.boolean(),
      components: z.array(
        z.object({
          sbom_component_id: z.string(),
          name: z.string(),
          version: z.string().nullable(),
          kind: z.string(),
          purl: z.string().nullable(),
          cpe: z.string().nullable(),
          note: z.string().nullable(),
        }),
      ),
      controls: z.array(z.object({ control_id: z.string(), code: z.string(), title: z.string() })),
      consumers: z.array(
        z.object({
          program_id: z.string(),
          program_code: z.string(),
          program_name: z.string(),
          business_line_id: z.string().nullable(),
          system_components: z.array(
            z.object({
              system_id: z.string(),
              system_code: z.string(),
              system_name: z.string(),
              system_component_id: z.string(),
              component_code: z.string(),
              component_name: z.string(),
            }),
          ),
          answered: z.boolean(),
          issues: z.number(),
          issue: z
            .object({
              issue_id: z.string(),
              title: z.string(),
              severity: z.string().nullable(),
              status: z.string(),
              open: z.boolean(),
              opened_at: z.string().nullable(),
              owner_party_id: z.string().nullable(),
              poam_items: z.number(),
            })
            .nullable(),
        }),
      ),
      programs: z.number(),
      programs_answered: z.number(),
      programs_open: z.number(),
    }),
  ),
  totals: z.object({
    vulnerabilities: z.number(),
    sbom_components: z.number(),
    programs: z.number(),
    unanswered: z.number(),
    programs_unanswered: z.number(),
  }),
});

/** A component version's standing SBOM: its latest by the day it was generated. */
export type StandingSbom = {
  id: string;
  title: string;
  format: SbomFormat;
  specVersion: string | null;
  serial: string | null;
  generatedOn: string;
  evidenceArtifactId: string | null;
  /** How many components it lists. */
  components: number;
};

/** A component of the standing SBOM that carries a CVE in the state affected. */
export type AffectedSbomComponent = {
  sbomComponentId: string;
  name: string;
  version: string | null;
  /** One of `SBOM_COMPONENT_KINDS`. */
  kind: string;
  purl: string | null;
  cpe: string | null;
  /** Why it is affected: the affected range, as the record says it. */
  note: string | null;
};

/** The operational issue a program holds for a CVE: its open one first, else its latest. */
export type VulnerabilityIssue = {
  issueId: string;
  title: string;
  /** A key of `severityLevels`; none while nobody has rated it. */
  severity: string | null;
  /** A key of `operationalIssueStatuses`. */
  status: string;
  /** Whether it is neither resolved nor closed. */
  open: boolean;
  openedAt: string | null;
  ownerPartyId: string | null;
  /** How many POA&M items answer it. */
  poamItems: number;
};

/** A program built from the component version, with how it has answered one CVE. */
export type VulnerabilityConsumer = {
  programId: string;
  programCode: string;
  programName: string;
  businessLineId: string | null;
  /** Its system components built from this version. */
  systemComponents: {
    systemId: string;
    systemCode: string;
    systemName: string;
    systemComponentId: string;
    componentCode: string;
    componentName: string;
  }[];
  /** Whether it holds an operational issue for the CVE: one that holds none has not answered. */
  answered: boolean;
  /** How many issues it holds for the CVE. */
  issues: number;
  issue: VulnerabilityIssue | null;
};

/** A CVE that affects the component version, with who is exposed and who has answered. */
export type ComponentVulnerability = {
  vulnerabilityId: string;
  cveId: string;
  title: string;
  /** A key of `severityLevels`; none while nobody has rated it. */
  severity: string | null;
  cvssScore: number | null;
  cvssVector: string | null;
  publishedOn: string | null;
  /** What fixes it: the version, patch or change that removes it. */
  fixedIn: string | null;
  sourceUri: string | null;
  knownExploited: boolean;
  /** The components of the standing SBOM that carry it. */
  components: AffectedSbomComponent[];
  /** The controls it bears on, in code order. */
  controls: { id: string; code: string; title: string }[];
  /** Every program built from this version, by program code. */
  consumers: VulnerabilityConsumer[];
  programs: number;
  programsAnswered: number;
  /** Programs whose issue for it is still open. */
  programsOpen: number;
};

export type ComponentVulnerabilities = {
  component: Omit<ComponentVersion, "definitionOwnerPartyId" | "businessLineId">;
  /** None while no SBOM of the version is recorded. */
  sbom: StandingSbom | null;
  /** The worst first. */
  vulnerabilities: ComponentVulnerability[];
  totals: {
    vulnerabilities: number;
    /** The SBOM components affected, each once. */
    sbomComponents: number;
    /** The programs built from this version. */
    programs: number;
    /** The answers still owed: a CVE and a program that holds no issue for it. */
    unanswered: number;
    /** The programs that owe one. */
    programsUnanswered: number;
  };
};

/** The CVEs on one component version and who has answered them, as the server reads them. */
export async function readComponentVulnerabilities(
  client: Client,
  context: Pick<ReadContext, "token">,
  definedComponentId: string,
  signal?: AbortSignal,
): Promise<ComponentVulnerabilities> {
  let request = client
    .rpc("component_vulnerabilities", { p_defined_component_id: definedComponentId })
    .setHeader("Authorization", `Bearer ${context.token}`);
  if (signal) request = request.abortSignal(signal);
  const { data, error } = await request;
  if (error) throw new Error(error.message);
  const answer = vulnerabilitiesAnswer.parse(data);
  const { component, sbom } = answer;
  return {
    component: {
      id: component.id,
      name: component.name,
      componentType: component.component_type,
      definitionId: component.definition_id,
      definitionCode: component.definition_code,
      definitionName: component.definition_name,
      revisionId: component.revision_id,
      version: component.version,
      state: component.state,
      ownerPartyId: component.owner_party_id,
    },
    sbom: sbom && {
      id: sbom.id,
      title: sbom.title,
      format: sbom.format,
      specVersion: sbom.spec_version,
      serial: sbom.serial,
      generatedOn: sbom.generated_on,
      evidenceArtifactId: sbom.evidence_artifact_id,
      components: sbom.components,
    },
    vulnerabilities: answer.vulnerabilities.map((cve) => ({
      vulnerabilityId: cve.vulnerability_id,
      cveId: cve.cve_id,
      title: cve.title,
      severity: cve.severity,
      cvssScore: cve.cvss_score,
      cvssVector: cve.cvss_vector,
      publishedOn: cve.published_on,
      fixedIn: cve.fixed_in,
      sourceUri: cve.source_uri,
      knownExploited: cve.known_exploited,
      components: cve.components.map((part) => ({
        sbomComponentId: part.sbom_component_id,
        name: part.name,
        version: part.version,
        kind: part.kind,
        purl: part.purl,
        cpe: part.cpe,
        note: part.note,
      })),
      controls: cve.controls.map((control) => ({
        id: control.control_id,
        code: control.code,
        title: control.title,
      })),
      consumers: cve.consumers.map((consumer) => ({
        programId: consumer.program_id,
        programCode: consumer.program_code,
        programName: consumer.program_name,
        businessLineId: consumer.business_line_id,
        systemComponents: consumer.system_components.map((used) => ({
          systemId: used.system_id,
          systemCode: used.system_code,
          systemName: used.system_name,
          systemComponentId: used.system_component_id,
          componentCode: used.component_code,
          componentName: used.component_name,
        })),
        answered: consumer.answered,
        issues: consumer.issues,
        issue: consumer.issue && {
          issueId: consumer.issue.issue_id,
          title: consumer.issue.title,
          severity: consumer.issue.severity,
          status: consumer.issue.status,
          open: consumer.issue.open,
          openedAt: consumer.issue.opened_at,
          ownerPartyId: consumer.issue.owner_party_id,
          poamItems: consumer.issue.poam_items,
        },
      })),
      programs: cve.programs,
      programsAnswered: cve.programs_answered,
      programsOpen: cve.programs_open,
    })),
    totals: {
      vulnerabilities: answer.totals.vulnerabilities,
      sbomComponents: answer.totals.sbom_components,
      programs: answer.totals.programs,
      unanswered: answer.totals.unanswered,
      programsUnanswered: answer.totals.programs_unanswered,
    },
  };
}

/**
 * Every model the answer is read from: the version's SBOMs and what they list, the CVEs and where
 * they are found, the consumers, and the issue each program holds for a CVE with its POA&M items.
 */
const VULNERABILITY_MODELS = [
  "sboms",
  "sbom_components",
  "sbom_component_vulnerabilities",
  "vulnerabilities",
  "vulnerability_controls",
  "issue_vulnerabilities",
  "operational_issues",
  "issue_poams",
  "system_components",
  "systems",
  "programs",
  "component_owners",
  "component_definitions",
  "defined_components",
] as const satisfies readonly TableName[];

/**
 * The CVEs on one component version, and who has answered them. An SBOM imported, a CVE recorded
 * on a component, an issue opened or resolved or a version taken reads it again. One version's
 * answer never stands in for another's.
 */
export function useComponentVulnerabilities(
  definedComponentId: string | null | undefined,
): UseQueryResult<ComponentVulnerabilities, Error> {
  const workspace = useWorkspace();
  const key = ["models", workspace.tenantId, "component_vulnerabilities"];
  useStaleOnWrite(workspace.tenantId, VULNERABILITY_MODELS, key);
  return useQuery<ComponentVulnerabilities, Error>({
    queryKey: [...key, definedComponentId ?? null],
    enabled: !!definedComponentId,
    retry: false,
    queryFn: async ({ signal }) =>
      readComponentVulnerabilities(
        database(),
        { token: await requireIdentity(workspace) },
        definedComponentId!,
        signal,
      ),
  });
}

/* ——— The components of a standing SBOM ——————————————————————————————————————————————————————— */

/**
 * What the register reads of an SBOM component: every column its form edits, its workspace and
 * revision, the component it sits inside by name, its SBOM and the subject that describes, and
 * how many CVEs affect it with the worst severity among them.
 */
export const SBOM_COMPONENT_COLUMNS = [
  "id",
  "tenant_id",
  "sbom_id",
  "parent_component_id",
  "parent_name",
  "name",
  "version",
  "kind",
  "supplier",
  "purl",
  "cpe",
  "license",
  "hash",
  "sbom_title",
  "sbom_format",
  "sbom_generated_on",
  "subject_kind",
  "subject_name",
  "subject_version",
  "subject_code",
  "defined_component_id",
  "inventory_item_id",
  "vulnerabilities",
  "worst_severity",
  "revision",
] as const;

/** A component of a standing SBOM as the register reads it, a page at a time. */
export type SbomComponentRow = ServerRow<
  "sbom_component_rows",
  (typeof SBOM_COMPONENT_COLUMNS)[number],
  | "tenant_id"
  | "sbom_id"
  | "name"
  | "kind"
  | "sbom_title"
  | "sbom_format"
  | "sbom_generated_on"
  | "subject_kind"
  | "vulnerabilities"
  | "revision"
>;

/** Which standing SBOM's components a read lists; every standing SBOM's unsaid. */
export type SbomComponentScope = {
  /** One SBOM, which is its subject's standing one: a replaced SBOM's components are not listed. */
  sbomId?: string | undefined;
  /** A library component version's standing SBOM. */
  definedComponentId?: string | undefined;
  /** An asset's standing SBOM. */
  inventoryItemId?: string | undefined;
};

/**
 * The read of SBOM components, `sbom_component_rows`, a page at a time: the components of one
 * SBOM, of a component version's standing SBOM or of an asset's, else of every standing SBOM, by
 * name and version. The search reads what identifies a component (its name, version, supplier,
 * package URL, CPE and license) and what it sits inside; the worst severity sorts in the product's
 * order and is found by its word. A CVE recorded on a component, or its state changed, reads the
 * pages again.
 */
export function sbomComponentRead(scope: SbomComponentScope = {}) {
  const filters: Filters = {
    ...(scope.sbomId ? { sbom_id: scope.sbomId } : {}),
    ...(scope.definedComponentId ? { defined_component_id: scope.definedComponentId } : {}),
    ...(scope.inventoryItemId ? { inventory_item_id: scope.inventoryItemId } : {}),
  };
  return serverRead({
    source: "sbom_component_rows",
    model: "sbom_components",
    models: [
      "sboms",
      "sbom_component_vulnerabilities",
      "vulnerabilities",
      "defined_components",
      "component_definition_revisions",
      "component_definitions",
      "inventory_items",
    ],
    columns: SBOM_COMPONENT_COLUMNS,
    scope: Object.keys(filters).length ? filters : undefined,
    search: ["name", "version", "supplier", "purl", "cpe", "license", "parent_name"],
    fields: {
      // What a component sits inside and the subject its SBOM describes are read by name.
      parent_component_id: { column: "parent_name" },
      subject: { column: "subject_name" },
      vulnerabilities: { filter: "range" },
      worst_severity: { labels: severityLevels, sort: "worst_severity_rank" },
    },
    order: [{ column: "name" }, { column: "version" }],
  });
}

/* ——— The SBOMs of a component version ———————————————————————————————————————————————————————— */

/** What a component version's SBOMs read: the document's own facts, and when it was recorded. */
export const SBOM_COLUMNS = [
  "id",
  "title",
  "format",
  "spec_version",
  "serial",
  "generated_on",
  "evidence_artifact_id",
  "created_at",
  "revision",
] as const satisfies readonly (keyof Row<"sboms">)[];

type SbomRow = Pick<Row<"sboms">, (typeof SBOM_COLUMNS)[number]>;

/** An SBOM of a component version, with whether it is the one that stands. */
export type ComponentSbom = SbomRow & {
  /** The version's latest by the day it was generated; of two that day, the one recorded last. */
  standing: boolean;
};

/**
 * A subject's SBOMs the newest first, as the server ranks them: by the day generated, then when
 * recorded, then by id. The first one stands.
 */
export function newestSbomFirst(rows: readonly SbomRow[]): ComponentSbom[] {
  return [...rows]
    .sort(
      (a, b) =>
        b.generated_on.localeCompare(a.generated_on) ||
        Date.parse(b.created_at) - Date.parse(a.created_at) ||
        b.created_at.localeCompare(a.created_at) ||
        b.id.localeCompare(a.id),
    )
    .map((row, index) => ({ ...row, standing: index === 0 }));
}

/** The SBOMs recorded of a component version, the newest first, the standing one marked. */
export function useComponentSboms(definedComponentId: string | null | undefined) {
  const query = useRows(
    "sboms",
    { defined_component_id: definedComponentId ?? "" },
    { columns: SBOM_COLUMNS, enabled: !!definedComponentId },
  );
  const sboms = useMemo(() => (query.data ? newestSbomFirst(query.data) : undefined), [query.data]);
  return { query, sboms };
}

/* ——— Reading an SBOM document ——————————————————————————————————————————————————————————————— */

/**
 * One component as `import_sbom` takes it: a name and, where the document gives them, its version,
 * kind, supplier, package URL, CPE, license and hash. `ref` is the document's own reference for the
 * component and `parent` the reference of the component it sits inside.
 */
export type SbomFileComponent = {
  name: string;
  version?: string | undefined;
  /** Unsaid, the import records a library. */
  kind?: SbomComponentKind | undefined;
  supplier?: string | undefined;
  purl?: string | undefined;
  cpe?: string | undefined;
  license?: string | undefined;
  hash?: string | undefined;
  ref?: string | undefined;
  parent?: string | undefined;
};

/** An SBOM document as read: what `import_sbom` takes of it, beside its subject and its title. */
export type SbomFile = {
  format: Exclude<SbomFormat, "other">;
  /** The version of the format's specification the document follows, as it says it. */
  specVersion: string | null;
  /** The document's own identifier: a CycloneDX serial number, an SPDX document namespace. */
  serial: string | null;
  /** The day the document says it was generated; none where it says none. */
  generatedOn: string | null;
  /** What the document calls what it describes: a title to start from. */
  title: string | null;
  components: SbomFileComponent[];
  /**
   * How many components are of a type the product has no kind for (a CycloneDX platform, an SPDX
   * archive): they are read with no kind, so the import records them as libraries.
   */
  kindsUnread: number;
};

export const SBOM_NOT_JSON =
  "This file is not JSON. Choose a CycloneDX or an SPDX document saved as JSON.";
export const SBOM_UNKNOWN_FORMAT =
  "This file is neither a CycloneDX nor an SPDX document, so its components cannot be read.";
export const SBOM_NO_COMPONENTS = "This SBOM lists no components, so there is nothing to import.";
export const SBOM_TOO_MANY =
  "This SBOM lists more than 5,000 components, the most one import takes.";
export const sbomUnnamed = (count: number) =>
  `Every component needs a name; ${count} of this SBOM's ${count === 1 ? "has" : "have"} none.`;

type Json = Record<string, unknown>;
const isObject = (value: unknown): value is Json =>
  value !== null && typeof value === "object" && !Array.isArray(value);
const list = (value: unknown): Json[] => (Array.isArray(value) ? value.filter(isObject) : []);
/** A value as text the document gives: trimmed, and none for an empty or an unsaid one. */
const text = (value: unknown): string | undefined => {
  const said =
    typeof value === "string" ? value.trim() : typeof value === "number" ? `${value}` : "";
  return said && said !== "NOASSERTION" && said !== "NONE" ? said : undefined;
};
/** The day of a moment as the document writes it. */
const day = (value: unknown): string | null => {
  const said = text(value);
  return said && /^\d{4}-\d{2}-\d{2}/.test(said) ? said.slice(0, 10) : null;
};

/** A document's type for a component as the product's kind; none for one it has no kind for. */
function kindOf(type: string | undefined): SbomComponentKind | undefined {
  const said = type?.toLowerCase().replace(/_/g, "-");
  // A framework is a library by another name in both formats.
  if (said === "framework") return "library";
  return (SBOM_COMPONENT_KINDS as readonly string[]).includes(said ?? "")
    ? (said as SbomComponentKind)
    : undefined;
}

/** A digest with its algorithm, SHA-256 where the document gives one, else its first. */
function digest(hashes: readonly Json[], algorithm: string, value: string): string | undefined {
  const named = hashes
    .map((hash) => ({ algorithm: text(hash[algorithm]), value: text(hash[value]) }))
    .filter(
      (hash): hash is { algorithm: string; value: string } => !!hash.algorithm && !!hash.value,
    );
  const chosen =
    named.find((hash) => hash.algorithm.replace(/[^a-z0-9]/gi, "").toUpperCase() === "SHA256") ??
    named[0];
  return chosen && `${chosen.algorithm}:${chosen.value}`;
}

/** A component with only what the document gave. */
const given = (component: SbomFileComponent): SbomFileComponent =>
  Object.fromEntries(
    Object.entries(component).filter(([, value]) => value !== undefined),
  ) as SbomFileComponent;

type Read = {
  components: (Omit<SbomFileComponent, "name"> & { name?: string | undefined })[];
  kindsUnread: number;
};

/**
 * A CycloneDX document's components. The component the document describes (`metadata.component`)
 * is listed first, as an SPDX document lists what it describes among its packages, and the
 * components listed at the top sit inside it; a component nested in another sits inside that one.
 */
function cyclonedxComponents(document: Json): Read {
  const read: Read = { components: [], kindsUnread: 0 };
  const refs = new Set<string>();
  const collect = (items: readonly Json[]) => {
    for (const item of items) {
      const ref = text(item["bom-ref"]);
      if (ref) refs.add(ref);
      collect(list(item["components"]));
    }
  };
  const metadata = isObject(document["metadata"]) ? document["metadata"] : {};
  const described = isObject(metadata["component"]) ? metadata["component"] : undefined;
  const listed = list(document["components"]);
  collect(listed);
  if (described) collect([described]);
  // A component that holds others needs a reference for them to name: one the document lacks is
  // given one no component of the document uses.
  let made = 0;
  const reference = () => {
    let ref: string;
    do ref = `component-${++made}`;
    while (refs.has(ref));
    refs.add(ref);
    return ref;
  };
  const add = (item: Json, parent: string | undefined) => {
    const inside = list(item["components"]);
    const ref = text(item["bom-ref"]) ?? (inside.length ? reference() : undefined);
    const type = text(item["type"]);
    const kind = kindOf(type);
    if (type && !kind) read.kindsUnread += 1;
    const supplier = isObject(item["supplier"]) ? text(item["supplier"]["name"]) : undefined;
    const licenses = list(item["licenses"]);
    const expression = licenses.map((entry) => text(entry["expression"])).find(Boolean);
    const named = licenses
      .map((entry) => (isObject(entry["license"]) ? entry["license"] : {}))
      .map((license) => text(license["id"]) ?? text(license["name"]))
      .filter((name): name is string => !!name);
    read.components.push({
      name: text(item["name"]),
      version: text(item["version"]),
      kind,
      supplier: supplier ?? text(item["publisher"]),
      purl: text(item["purl"]),
      cpe: text(item["cpe"]),
      license: expression ?? (named.length ? named.join(", ") : undefined),
      hash: digest(list(item["hashes"]), "alg", "content"),
      ref,
      parent,
    });
    for (const child of inside) add(child, ref);
  };
  // What the document describes leads the list unless the list holds it already.
  const same = (a: Json, b: Json) =>
    (text(a["bom-ref"]) !== undefined && text(a["bom-ref"]) === text(b["bom-ref"])) ||
    (text(a["name"]) === text(b["name"]) && text(a["version"]) === text(b["version"]));
  let top: string | undefined;
  if (described && text(described["name"]) && !listed.some((item) => same(item, described))) {
    top = text(described["bom-ref"]) ?? reference();
    add({ ...described, "bom-ref": top }, undefined);
  }
  for (const item of listed) add(item, top);
  return read;
}

/**
 * An SPDX document's packages. A package sits inside another where a relationship says the other
 * contains it (CONTAINS, or CONTAINED_BY read the other way); the first such relationship stands.
 */
function spdxComponents(document: Json): Read {
  const read: Read = { components: [], kindsUnread: 0 };
  const packages = list(document["packages"]);
  const ids = new Set(packages.map((item) => text(item["SPDXID"])).filter(Boolean));
  const parents = new Map<string, string>();
  for (const relationship of list(document["relationships"])) {
    const type = text(relationship["relationshipType"])?.toUpperCase();
    const from = text(relationship["spdxElementId"]);
    const to = text(relationship["relatedSpdxElement"]);
    const [outer, inner] =
      type === "CONTAINS" ? [from, to] : type === "CONTAINED_BY" ? [to, from] : [];
    if (
      outer &&
      inner &&
      outer !== inner &&
      ids.has(outer) &&
      ids.has(inner) &&
      !parents.has(inner)
    )
      parents.set(inner, outer);
  }
  for (const item of packages) {
    const ref = text(item["SPDXID"]);
    const purpose = text(item["primaryPackagePurpose"]);
    const kind = kindOf(purpose);
    if (purpose && !kind) read.kindsUnread += 1;
    const locator = (...types: string[]) =>
      list(item["externalRefs"])
        .filter((entry) => types.includes(text(entry["referenceType"]) ?? ""))
        .map((entry) => text(entry["referenceLocator"]))
        .find(Boolean);
    read.components.push({
      name: text(item["name"]),
      version: text(item["versionInfo"]),
      kind,
      // "Organization: Acme" names Acme.
      supplier: text(item["supplier"])?.replace(/^(organization|person):\s*/i, "") || undefined,
      purl: locator("purl"),
      cpe: locator("cpe23Type", "cpe22Type"),
      license: text(item["licenseConcluded"]) ?? text(item["licenseDeclared"]),
      hash: digest(list(item["checksums"]), "algorithm", "checksumValue"),
      ref,
      parent: ref ? parents.get(ref) : undefined,
    });
  }
  return read;
}

/**
 * Read an SBOM document, a CycloneDX or an SPDX document saved as JSON, into what `import_sbom`
 * takes: its format, the version of its specification, its own identifier, the day it says it was
 * generated, a title to start from and every component it lists with what it sits inside. Says in
 * the reader's words what stops it: a file that is not JSON, one that is neither format, one that
 * lists no component or more than an import takes, and a component with no name.
 */
export function readSbomFile(fileText: string): SbomFile {
  let parsed: unknown;
  try {
    // A file saved with a byte order mark is still JSON.
    parsed = JSON.parse(fileText.replace(/^\uFEFF/, ""));
  } catch {
    throw new Error(SBOM_NOT_JSON);
  }
  if (!isObject(parsed)) throw new Error(SBOM_UNKNOWN_FORMAT);
  const cyclonedx =
    text(parsed["bomFormat"])?.toLowerCase() === "cyclonedx" ||
    (parsed["bomFormat"] === undefined && Array.isArray(parsed["components"]));
  const spdx = text(parsed["spdxVersion"]) !== undefined || Array.isArray(parsed["packages"]);
  if (!cyclonedx && !spdx) throw new Error(SBOM_UNKNOWN_FORMAT);
  const read = cyclonedx ? cyclonedxComponents(parsed) : spdxComponents(parsed);
  if (!read.components.length) throw new Error(SBOM_NO_COMPONENTS);
  if (read.components.length > SBOM_COMPONENT_LIMIT) throw new Error(SBOM_TOO_MANY);
  const unnamed = read.components.filter((component) => !component.name).length;
  if (unnamed) throw new Error(sbomUnnamed(unnamed));
  const components = read.components.map((component) => given(component as SbomFileComponent));
  if (cyclonedx) {
    const metadata = isObject(parsed["metadata"]) ? parsed["metadata"] : {};
    const described = isObject(metadata["component"]) ? metadata["component"] : {};
    const title = [text(described["name"]), text(described["version"])].filter(Boolean).join(" ");
    return {
      format: "cyclonedx",
      specVersion: text(parsed["specVersion"]) ?? null,
      serial: text(parsed["serialNumber"]) ?? null,
      generatedOn: day(metadata["timestamp"]),
      title: title || null,
      components,
      kindsUnread: read.kindsUnread,
    };
  }
  const creation = isObject(parsed["creationInfo"]) ? parsed["creationInfo"] : {};
  return {
    format: "spdx",
    specVersion: text(parsed["spdxVersion"])?.replace(/^SPDX-/i, "") ?? null,
    serial: text(parsed["documentNamespace"]) ?? null,
    generatedOn: day(creation["created"]),
    title: text(parsed["name"]) ?? null,
    components,
    kindsUnread: read.kindsUnread,
  };
}

/* ——— Importing an SBOM ——————————————————————————————————————————————————————————————————————— */

/** An SBOM's one subject: a library component version, or an asset. */
export type SbomSubject = { definedComponentId: string } | { inventoryItemId: string };

/** An SBOM as it is imported: its subject, what the document says of itself and what it lists. */
export type SbomImport = {
  subject: SbomSubject;
  title: string;
  format: SbomFormat;
  specVersion?: string | null | undefined;
  serial?: string | null | undefined;
  /** The day it was generated: a subject's latest by this day stands. */
  generatedOn: string;
  /** The evidence artifact that holds the document, when it was captured as evidence. */
  evidenceArtifactId?: string | null | undefined;
  components: readonly SbomFileComponent[];
  /** Chosen once for one import: the same request sent again answers as it first did. */
  requestId: string;
};

export const SBOM_NEEDS_SUBJECT = "Choose the component version or the asset this SBOM describes.";
export const SBOM_NEEDS_TITLE = "Give the SBOM a title.";
export const SBOM_NEEDS_DAY = "Enter the day the SBOM was generated.";
export const SBOM_IMPORT_UNREADABLE =
  "The SBOM was imported, but the answer could not be read. Reload to see it.";

/** What stops an import before it is sent, each on the field that fixes it; empty when it may go. */
export function sbomImportIssues(values: {
  title: string;
  generatedOn: string | null | undefined;
  components: readonly unknown[];
}): { field: "title" | "generatedOn" | "components"; message: string }[] {
  return [
    ...(values.title.trim() ? [] : [{ field: "title" as const, message: SBOM_NEEDS_TITLE }]),
    ...(/^\d{4}-\d{2}-\d{2}$/.test(values.generatedOn ?? "")
      ? []
      : [{ field: "generatedOn" as const, message: SBOM_NEEDS_DAY }]),
    ...(values.components.length === 0
      ? [{ field: "components" as const, message: SBOM_NO_COMPONENTS }]
      : values.components.length > SBOM_COMPONENT_LIMIT
        ? [{ field: "components" as const, message: SBOM_TOO_MANY }]
        : []),
  ];
}

const importedSchema = z.object({
  sbomId: z.string(),
  definedComponentId: z.string().nullable(),
  inventoryItemId: z.string().nullable(),
  title: z.string(),
  format: z.enum(SBOM_FORMATS),
  generatedOn: z.string(),
  /** How many components it recorded. */
  components: z.number().int().positive(),
  /** Whether it now stands for its subject: not when a later one was already recorded. */
  standing: z.boolean(),
  revision: z.number().int().positive(),
});
/** What an import wrote: the SBOM, its subject, and whether it now stands for it. */
export type ImportedSbom = z.infer<typeof importedSchema>;

/**
 * Import an SBOM of one subject in one request: the SBOM and every component it lists, all of them
 * or none. Refused in words the reader acts on: a subject or an evidence artifact that is not in
 * the workspace, a component of an unknown kind, a name and version listed twice, a reference
 * given twice, a parent that names no component of the document and a component that sits inside
 * itself. Sent again under the same id, the request answers as it first did.
 */
export async function importSbom(
  client: Client,
  { tenantId, token }: ReadContext,
  sbom: SbomImport,
): Promise<ImportedSbom> {
  const definedComponentId =
    "definedComponentId" in sbom.subject ? sbom.subject.definedComponentId : null;
  const inventoryItemId = "inventoryItemId" in sbom.subject ? sbom.subject.inventoryItemId : null;
  if (!definedComponentId && !inventoryItemId) throw new Error(SBOM_NEEDS_SUBJECT);
  const [issue] = sbomImportIssues(sbom);
  if (issue) throw new Error(issue.message);
  const args = {
    p_tenant_id: tenantId,
    p_defined_component_id: definedComponentId,
    p_inventory_item_id: inventoryItemId,
    p_title: sbom.title.trim(),
    p_format: sbom.format,
    p_spec_version: sbom.specVersion?.trim() || null,
    p_serial: sbom.serial?.trim() || null,
    p_generated_on: sbom.generatedOn,
    p_evidence_artifact_id: sbom.evidenceArtifactId ?? null,
    p_components: sbom.components.map(given),
    p_request_id: sbom.requestId,
  } satisfies Record<keyof Functions["import_sbom"]["Args"], unknown>;
  const { data, error } = await client
    .rpc("import_sbom", args)
    .setHeader("Authorization", `Bearer ${token}`);
  if (error) throw refusal(error);
  const parsed = importedSchema.safeParse(data);
  if (!parsed.success) throw new Error(SBOM_IMPORT_UNREADABLE);
  return parsed.data;
}

/**
 * Import an SBOM as a mutation. However the request settles, the SBOMs and their components read
 * again, and with them every read that counts what affects a component version: a request whose
 * answer was lost may still have imported it.
 */
export function useImportSbom() {
  const workspace = useWorkspace();
  const cache = useQueryClient();
  return useMutation<ImportedSbom, Error, SbomImport>({
    mutationFn: async (sbom) =>
      importSbom(
        database(),
        { tenantId: workspace.tenantId, token: await requireIdentity(workspace) },
        sbom,
      ),
    onSettled: () =>
      void Promise.all(
        (["sboms", "sbom_components"] as const).map((table) =>
          invalidateModel(cache, workspace.tenantId, table),
        ),
      ),
  });
}

/* ——— A CVE's row in every program it exposes ————————————————————————————————————————————————— */

export type OpenVulnerabilityIssues = {
  vulnerabilityId: string;
  /** Chosen once for one run: the same request sent again answers as it first did. */
  requestId: string;
};

const openedSchema = z.object({
  vulnerabilityId: z.string(),
  cveId: z.string(),
  /** How many library component versions the CVE affects; none opens nothing. */
  componentVersions: z.number().int().nonnegative(),
  /** How many programs it opened an operational issue in. */
  programs: z.number().int().nonnegative(),
  issues: z.array(z.object({ programId: z.string(), issueId: z.string() })),
  /** How many exposed programs already held an issue for the CVE, whatever its status. */
  held: z.number().int().nonnegative(),
});
/** What a run opened: one issue in each exposed program that held none. */
export type OpenedVulnerabilityIssues = z.infer<typeof openedSchema>;

export const VULNERABILITY_NEEDS_CVE = "Choose the CVE to open operational issues for.";
export const VULNERABILITY_ISSUES_UNREADABLE =
  "The operational issues were opened, but the answer could not be read. Reload to see them.";

/**
 * Open a CVE's operational issue in every program it exposes, in one request: every program built
 * from a library component version the CVE affects that holds no issue for it yet gets one of its
 * own, open and nobody's, titled by the CVE and saying where it was found and what fixes it. One
 * issue a program, however many of its components are affected. Sent again under the same id, the
 * request answers as it first did; a later run under a new id opens issues only for the programs
 * exposed since.
 */
export async function openVulnerabilityIssues(
  client: Client,
  { tenantId, token }: ReadContext,
  request: OpenVulnerabilityIssues,
): Promise<OpenedVulnerabilityIssues> {
  if (!request.vulnerabilityId) throw new Error(VULNERABILITY_NEEDS_CVE);
  const args: Functions["open_vulnerability_issues"]["Args"] = {
    p_tenant_id: tenantId,
    p_vulnerability_id: request.vulnerabilityId,
    p_request_id: request.requestId,
  };
  const { data, error } = await client
    .rpc("open_vulnerability_issues", args)
    .setHeader("Authorization", `Bearer ${token}`);
  if (error) throw refusal(error);
  const parsed = openedSchema.safeParse(data);
  if (!parsed.success) throw new Error(VULNERABILITY_ISSUES_UNREADABLE);
  return parsed.data;
}

/**
 * Open a CVE's operational issues as a mutation. However it settles, the issues and their CVE
 * links read again, with every read that says who has answered a CVE and each program's activity.
 */
export function useOpenVulnerabilityIssues() {
  const workspace = useWorkspace();
  const cache = useQueryClient();
  return useMutation<OpenedVulnerabilityIssues, Error, OpenVulnerabilityIssues>({
    mutationFn: async (request) =>
      openVulnerabilityIssues(
        database(),
        { tenantId: workspace.tenantId, token: await requireIdentity(workspace) },
        request,
      ),
    onSettled: () =>
      void Promise.all(
        (["operational_issues", "issue_vulnerabilities", "activity_events"] as const).map((table) =>
          invalidateModel(cache, workspace.tenantId, table),
        ),
      ),
  });
}
