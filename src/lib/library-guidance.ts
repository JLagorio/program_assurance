// The Library's counts over the reference frameworks and the control catalog, for the Guidance and
// Frameworks pages: what each framework holds by kind, how many controls it ties (in all and by
// control family), how the workspace's records name its items, and the catalog's reference
// baselines with the programs whose control baselines start from them.
//
// Every number is counted on the server: each read is one request whose embedded `count`
// (PostgREST counts a related table's rows for each row it returns, `alias:table(count)`, filtered
// by the alias) answers a framework's, a family's or a program's numbers. No read brings rows home
// to be counted: the most any returns is a catalog's families, the workspace's programs or an
// edition's reference baselines.
//
// What none of them counts: a program's choice for SA-24, which names the cyber resiliency
// constructs by their titles in its parameter values and is resolved one program at a time
// (`program_resiliency_choice`), so no read answers it for every program at once.

import { useMemo } from "react";
import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { useWorkspace } from "./workspace-context";
import { database, requireIdentity } from "./database";
import { idSet, type ReadContext, type TableName } from "./models";
import { useStaleOnWrite } from "./server-table";
import {
  ATTACK_FRAMEWORK,
  ATTACK_ICS_FRAMEWORK,
  CYBER_RESILIENCY_FRAMEWORK,
  LIFE_CYCLE_FRAMEWORK,
  attackMatrix,
  type Framework,
} from "./frameworks";

type Client = Pick<SupabaseClient, "from">;

/** postgrest-js's builder as far as these reads use it. */
type Query = PromiseLike<{ data: unknown; error: { message: string } | null }> & {
  eq(column: string, value: string | number): Query;
  in(column: string, values: readonly string[]): Query;
  or(filters: string): Query;
  order(column: string, options?: { ascending?: boolean }): Query;
  abortSignal(signal: AbortSignal): Query;
};

/** A read of `table` as the reader, kept to the workspace and the shared reference rows. */
function request(
  client: Client,
  context: ReadContext,
  table: string,
  select: readonly string[],
  signal: AbortSignal | undefined,
): Query {
  let query = client
    .from(table)
    .select(select.join(","))
    .setHeader("Authorization", `Bearer ${context.token}`)
    // One retry owner: TanStack Query.
    .retry(false)
    .or(`tenant_id.eq.${context.tenantId},tenant_id.is.null`) as unknown as Query;
  if (signal) query = query.abortSignal(signal);
  return query;
}

async function rowsOf(query: Query): Promise<Record<string, unknown>[]> {
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return z.array(z.record(z.string(), z.unknown())).parse(data ?? []);
}

const counted = z.array(z.object({ count: z.number() }));
/** A to-many embed's count as the server answers it (`[{ "count": 4 }]`): 4. */
const countOf = (value: unknown) => counted.parse(value)[0]?.count ?? 0;
const text = (value: unknown) => (typeof value === "string" ? value : "");

/* ——— Names —————————————————————————————————————————————————————————————————————————————————— */

/**
 * The publication a framework is printed in, by its short name: "NIST SP 800-160 Vol. 2 Rev. 1"
 * from a NIST DOI (`10.6028/NIST.SP.800-160v2r1`), else the document's title, else nothing.
 */
export function publicationName(document: Framework["source_document"]): string | undefined {
  // A part's letter is a capital (800-53A); a volume and a revision are lower case (v2r1).
  const match = /NIST\.SP\.(\d+-\d+[A-Z]?)(?:v(\d+))?(?:r(\d+))?/.exec(
    `${document.doi ?? ""} ${document.url ?? ""}`,
  );
  if (match) {
    const [, number, volume, revision] = match;
    return [`NIST SP ${number}`, volume && `Vol. ${volume}`, revision && `Rev. ${revision}`]
      .filter(Boolean)
      .join(" ");
  }
  return document.title || undefined;
}

/**
 * A framework as the Guidance page names it under its publication: an ATT&CK appendix by its
 * matrix ("ATT&CK for Enterprise"), any other by its title without the publication's name in
 * front ("Cyber resiliency constructs").
 */
export function guidanceName(framework: Pick<Framework, "code" | "title" | "source_document">) {
  const matrix = attackMatrix(framework.code);
  if (matrix) return `ATT&CK for ${matrix}`;
  const publication = publicationName(framework.source_document);
  const rest =
    publication && framework.title.startsWith(`${publication} `)
      ? framework.title.slice(publication.length + 1)
      : framework.title;
  return rest.charAt(0).toUpperCase() + rest.slice(1);
}

/* ——— What a framework holds ————————————————————————————————————————————————————————————————— */

/** Kinds of item a framework holds, read as one count, in the words its count reads in. */
export type Holding = { kinds: readonly string[]; one: string; other: string };

const attackHoldings: readonly Holding[] = [
  { kinds: ["tactic"], one: "tactic", other: "tactics" },
  { kinds: ["attack-technique"], one: "technique", other: "techniques" },
  // Appendix F's own candidate mitigations stand beside ATT&CK's.
  { kinds: ["mitigation", "candidate-mitigation"], one: "mitigation", other: "mitigations" },
];

/**
 * What each framework holds, in the order its levels read: a goal's objectives, their techniques,
 * the techniques' approaches. The kinds a framework's design principles, layers and effects are
 * stand beside its levels and are counted in its items alone.
 */
export const frameworkHoldings: Readonly<Record<string, readonly Holding[]>> = {
  [CYBER_RESILIENCY_FRAMEWORK]: [
    { kinds: ["goal"], one: "goal", other: "goals" },
    { kinds: ["objective"], one: "objective", other: "objectives" },
    { kinds: ["technique"], one: "technique", other: "techniques" },
    { kinds: ["approach"], one: "approach", other: "approaches" },
  ],
  [ATTACK_FRAMEWORK]: attackHoldings,
  [ATTACK_ICS_FRAMEWORK]: attackHoldings,
  [LIFE_CYCLE_FRAMEWORK]: [
    { kinds: ["process-group"], one: "process group", other: "process groups" },
    { kinds: ["process"], one: "process", other: "processes" },
    { kinds: ["outcome"], one: "security outcome", other: "security outcomes" },
  ],
};

/** A framework's current revision, counted. */
export type FrameworkCounts = {
  /** Its items of every kind. */
  items: number;
  /** Its links from an item to a control (Table E-1, Appendices F and G), against any catalog revision. */
  controlLinks: number;
  /** Each holding of `frameworkHoldings[code]`, in its order. */
  holdings: number[];
};

/**
 * Each framework's current revision counted, by the framework's code, in one request: its items,
 * its control links and each kind its row names (`frameworkHoldings`).
 */
export async function readFrameworkCounts(
  client: Client,
  context: ReadContext,
  frameworks: readonly Pick<Framework, "code" | "framework_revision_id">[],
  signal?: AbortSignal | undefined,
): Promise<Map<string, FrameworkCounts>> {
  if (!frameworks.length) return new Map();
  // One alias a set of kinds, read for every revision: a revision that holds none counts 0.
  const sets = new Map<string, readonly string[]>();
  for (const framework of frameworks)
    for (const holding of frameworkHoldings[framework.code] ?? [])
      sets.set(holding.kinds.join(","), holding.kinds);
  const aliases = [...sets].map(([key, kinds], index) => ({ key, kinds, alias: `k${index}` }));
  let query = request(
    client,
    context,
    "framework_revisions",
    [
      "id",
      "items:framework_items(count)",
      "links:framework_control_links(count)",
      ...aliases.map(({ alias }) => `${alias}:framework_items(count)`),
    ],
    signal,
  ).in("id", idSet(frameworks.map((framework) => framework.framework_revision_id)));
  for (const { alias, kinds } of aliases) query = query.in(`${alias}.kind`, [...kinds]);
  const rows = new Map((await rowsOf(query)).map((row) => [text(row["id"]), row]));
  const alias = new Map(aliases.map((entry) => [entry.key, entry.alias]));
  return new Map(
    frameworks.flatMap((framework) => {
      const row = rows.get(framework.framework_revision_id);
      if (!row) return [];
      const counts: FrameworkCounts = {
        items: countOf(row["items"]),
        controlLinks: countOf(row["links"]),
        holdings: (frameworkHoldings[framework.code] ?? []).map((holding) =>
          countOf(row[alias.get(holding.kinds.join(",")) ?? ""]),
        ),
      };
      return [[framework.code, counts]];
    }),
  );
}

/** What a framework holds, as its row says it: "4 goals › 8 objectives › 14 techniques". */
export function holdingsText(
  code: string,
  counts: FrameworkCounts,
  formatNumber: (value: number) => string,
): string | undefined {
  const holdings = frameworkHoldings[code];
  if (!holdings) return undefined;
  return holdings
    .map(
      (holding, index) =>
        `${formatNumber(counts.holdings[index] ?? 0)} ${(counts.holdings[index] ?? 0) === 1 ? holding.one : holding.other}`,
    )
    .join(" › ");
}

/* ——— Controls by family ——————————————————————————————————————————————————————————————————— */

/**
 * One line of a count by control family: the edition's controls in force (`catalog`), those one
 * or several frameworks tie (`tied`, the controls a framework revision links, each once), or those
 * a baseline selects (`selected`).
 */
export type FamilySeries =
  | { key: string; kind: "catalog" }
  | { key: string; kind: "tied"; frameworkRevisionIds: readonly string[] }
  | { key: string; kind: "selected"; profileResolutionId: string };

/** A control family of the catalog with each series' count. */
export type FamilyCount = {
  id: string;
  /** Its code as the catalog's controls name their family ("AC"). */
  code: string;
  title: string;
  counts: ReadonlyMap<string, number>;
};

/** What a by-family read answers: the edition by its catalog's name, and its families in order. */
export type FamilyCounts = {
  catalog: { title: string; version: string } | undefined;
  families: FamilyCount[];
};

/** The edition's controls in force: the catalog's own count leaves withdrawn controls out. */
const ACTIVE = "active";

/**
 * The edition's control families in the catalog's order, each with the count of every series, in
 * one request; the edition's name in a second beside it.
 */
export async function readFamilyCounts(
  client: Client,
  context: ReadContext,
  catalogRevisionId: string,
  series: readonly FamilySeries[],
  signal?: AbortSignal | undefined,
): Promise<FamilyCounts> {
  const aliases = series.map((entry, index) => ({ entry, alias: `s${index}` }));
  let query = request(
    client,
    context,
    "catalog_groups",
    [
      "id",
      "source_id",
      "title",
      "ordinal",
      ...aliases.map(({ entry, alias }) =>
        entry.kind === "tied"
          ? `${alias}:controls(count,framework_control_links!inner())`
          : entry.kind === "selected"
            ? `${alias}:controls(count,selected_controls!inner())`
            : `${alias}:controls(count)`,
      ),
    ],
    signal,
  ).eq("catalog_revision_id", catalogRevisionId);
  for (const { entry, alias } of aliases) {
    if (entry.kind === "catalog") query = query.eq(`${alias}.status`, ACTIVE);
    if (entry.kind === "tied")
      query = query.in(
        `${alias}.framework_control_links.framework_revision_id`,
        idSet(entry.frameworkRevisionIds),
      );
    if (entry.kind === "selected")
      query = query.eq(
        `${alias}.selected_controls.profile_resolution_id`,
        entry.profileResolutionId,
      );
  }
  const edition = request(
    client,
    context,
    "catalog_revisions",
    ["id", "version", "catalogs(title)"],
    signal,
  ).eq("id", catalogRevisionId);
  const [groups, revisions] = await Promise.all([rowsOf(query.order("ordinal")), rowsOf(edition)]);
  const revision = revisions[0];
  const catalog = revision
    ? {
        title:
          text((revision["catalogs"] as Record<string, unknown> | null)?.["title"]) ||
          text(revision["version"]),
        version: text(revision["version"]),
      }
    : undefined;
  return {
    catalog,
    families: groups.map((group) => ({
      id: text(group["id"]),
      code: text(group["source_id"]).toUpperCase(),
      title: text(group["title"]),
      counts: new Map(aliases.map(({ entry, alias }) => [entry.key, countOf(group[alias])])),
    })),
  };
}

/** A series' count over every family. */
export const familyTotal = (counts: FamilyCounts | undefined, key: string) =>
  counts?.families.reduce((sum, family) => sum + (family.counts.get(key) ?? 0), 0);

/* ——— How the workspace's records name a framework ———————————————————————————————————————————— */

/** The records that name a framework's items, and the programs that hold them. */
export type FrameworkUse = { records: number; programs: number };

/**
 * The record that names a framework's items, by framework, in the words its count reads in: a
 * risk names ATT&CK techniques (`risk_attack_techniques`), a gate criterion is drawn from a
 * security outcome (`gate_criteria.outcome_item_id`). A framework this leaves out is not counted.
 */
export const frameworkUseWords: Readonly<Record<string, { one: string; other: string }>> = {
  [ATTACK_FRAMEWORK]: { one: "risk", other: "risks" },
  [ATTACK_ICS_FRAMEWORK]: { one: "risk", other: "risks" },
  [LIFE_CYCLE_FRAMEWORK]: { one: "gate criterion", other: "gate criteria" },
};

/**
 * How the workspace's records name each framework's items, by the framework's code, in one request
 * over the workspace's programs: each program's risks that name one of an ATT&CK framework's
 * techniques, and its gate criteria drawn from one of the life cycle processes' outcomes, counted
 * by the server. A link keeps the item of the reading it was made from, so a framework is matched
 * through its revisions, never only its current one. A risk and a gate belong to one program, so
 * the sums count each record once.
 */
export async function readFrameworkUse(
  client: Client,
  context: ReadContext,
  frameworks: readonly Pick<Framework, "id" | "code">[],
  signal?: AbortSignal | undefined,
): Promise<Map<string, FrameworkUse>> {
  const named = frameworks
    .filter((framework) => frameworkUseWords[framework.code])
    .map((framework, index) => ({ framework, alias: `u${index}` }));
  if (!named.length) return new Map();
  const risks = (code: string) => code !== LIFE_CYCLE_FRAMEWORK;
  let query = request(
    client,
    context,
    "programs",
    [
      "id",
      ...named.map(({ framework, alias }) =>
        risks(framework.code)
          ? `${alias}:risks(count,risk_attack_techniques!inner(framework_items!inner(framework_revisions!inner())))`
          : `${alias}:lifecycle_gates(gate_criteria(count,framework_items!inner(framework_revisions!inner())))`,
      ),
    ],
    signal,
  );
  for (const { framework, alias } of named)
    query = query.eq(
      risks(framework.code)
        ? `${alias}.risk_attack_techniques.framework_items.framework_revisions.framework_id`
        : `${alias}.gate_criteria.framework_items.framework_revisions.framework_id`,
      framework.id,
    );
  const programs = await rowsOf(query);
  const gates = z.array(z.object({ gate_criteria: counted }));
  return new Map(
    named.map(({ framework, alias }) => {
      const each = programs.map((program) =>
        risks(framework.code)
          ? countOf(program[alias])
          : gates
              .parse(program[alias] ?? [])
              .reduce((sum, gate) => sum + (gate.gate_criteria[0]?.count ?? 0), 0),
      );
      return [
        framework.code,
        {
          records: each.reduce((sum, count) => sum + count, 0),
          programs: each.filter((count) => count > 0).length,
        },
      ];
    }),
  );
}

/* ——— Reference baselines and who starts from them ———————————————————————————————————————————— */

/** A program whose control baseline starts from a reference baseline. */
export type BaselineProgram = {
  id: string;
  code: string;
  name: string;
  /** The published profile revision of its control baseline: the Controls register's Selected by. */
  revisionId: string;
  /** The controls its control baseline selects. */
  controls: number;
};

/** A reference baseline of an edition: a published profile no other profile is layered under. */
export type ReferenceBaseline = {
  resolutionId: string;
  /** Its published profile revision: the Controls register's Selected by. */
  revisionId: string;
  profileId: string;
  title: string;
  controls: number;
  /** The programs whose control baselines start from it, by code. */
  programs: BaselineProgram[];
};

const choiceSchema = z.object({
  program_id: z.string(),
  profile_resolution_id: z.string(),
  programs: z.object({ code: z.string(), name: z.string() }).nullable(),
});
const placeSchema = z.object({
  profile_resolution_id: z.string(),
  root_profile_resolution_id: z.string().nullable(),
  depth: z.number(),
});
const resolutionSchema = z.object({
  id: z.string(),
  selected_controls: counted,
  profile_revisions: z
    .object({
      id: z.string(),
      title: z.string(),
      profile_id: z.string(),
      profiles: z.object({ title: z.string() }).nullable(),
    })
    .nullable(),
});

/**
 * The edition's reference baselines, the largest first, each with how many controls it selects
 * and the workspace's programs whose control baselines start from it (their stacks' root), with
 * how many controls each selects: three small requests, the programs' choices, where those and the
 * edition's reference profiles sit in their stacks, and the published ones counted.
 */
export async function readReferenceBaselines(
  client: Client,
  context: ReadContext,
  catalogRevisionId: string,
  signal?: AbortSignal | undefined,
): Promise<ReferenceBaseline[]> {
  const choices = z
    .array(choiceSchema)
    .parse(
      await rowsOf(
        request(
          client,
          context,
          "program_reference_choices",
          ["program_id", "profile_resolution_id", "programs(code,name)"],
          signal,
        ).eq("catalog_revision_id", catalogRevisionId),
      ),
    );
  const chosen = idSet(choices.map((choice) => choice.profile_resolution_id));
  const places = z.array(placeSchema).parse(
    await rowsOf(
      request(
        client,
        context,
        "profile_resolution_catalogs",
        ["profile_resolution_id", "root_profile_resolution_id", "depth"],
        signal,
      )
        .eq("catalog_revision_id", catalogRevisionId)
        .or(
          chosen.length
            ? `depth.eq.0,profile_resolution_id.in.(${chosen.join(",")})`
            : "depth.eq.0",
        ),
    ),
  );
  const ids = idSet(places.map((place) => place.profile_resolution_id));
  if (!ids.length) return [];
  const resolutions = z
    .array(resolutionSchema)
    .parse(
      await rowsOf(
        request(
          client,
          context,
          "profile_resolutions",
          [
            "id",
            "selected_controls(count)",
            "profile_revisions(id,title,profile_id,profiles(title))",
          ],
          signal,
        )
          .in("id", ids)
          .eq("state", "published"),
      ),
    );
  const published = new Map(resolutions.map((resolution) => [resolution.id, resolution]));
  const placed = new Map(places.map((place) => [place.profile_resolution_id, place]));
  const references = places
    .filter((place) => place.depth === 0)
    .flatMap((place) => {
      const resolution = published.get(place.profile_resolution_id);
      const revision = resolution?.profile_revisions;
      if (!resolution || !revision) return [];
      const programs = choices
        .flatMap((choice): BaselineProgram[] => {
          const root = placed.get(choice.profile_resolution_id)?.root_profile_resolution_id;
          const own = published.get(choice.profile_resolution_id);
          if (root !== resolution.id || !own?.profile_revisions || !choice.programs) return [];
          return [
            {
              id: choice.program_id,
              code: choice.programs.code,
              name: choice.programs.name,
              revisionId: own.profile_revisions.id,
              controls: countOf(own.selected_controls),
            },
          ];
        })
        .sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }));
      return [
        {
          resolutionId: resolution.id,
          revisionId: revision.id,
          profileId: revision.profile_id,
          title: revision.profiles?.title ?? revision.title,
          controls: countOf(resolution.selected_controls),
          programs,
        },
      ];
    });
  return references.sort((a, b) => b.controls - a.controls || a.title.localeCompare(b.title));
}

/* ——— Hooks ————————————————————————————————————————————————————————————————————————————————— */

/**
 * One read of this module as a query, kept under its model, and read again when a model it counts
 * is written (`watch`).
 */
function useLibraryRead<T>(
  model: TableName,
  key: readonly unknown[],
  enabled: boolean,
  read: (client: Client, context: ReadContext, signal: AbortSignal) => Promise<T>,
  watch?: readonly TableName[] | undefined,
): UseQueryResult<T, Error> {
  const workspace = useWorkspace();
  const queryKey = ["models", workspace.tenantId, model, "library", ...key];
  useStaleOnWrite(workspace.tenantId, watch, queryKey);
  return useQuery<T, Error>({
    queryKey,
    enabled,
    retry: false,
    queryFn: async ({ signal }) =>
      read(
        database(),
        { tenantId: workspace.tenantId, token: await requireIdentity(workspace) },
        signal,
      ),
  });
}

/** Each framework's current revision counted (`readFrameworkCounts`), once the frameworks are read. */
export function useFrameworkCounts(frameworks: readonly Framework[] | undefined) {
  const revisions = useMemo(
    () =>
      (frameworks ?? [])
        .map((framework) => ({
          code: framework.code,
          framework_revision_id: framework.framework_revision_id,
        }))
        .sort((a, b) => a.code.localeCompare(b.code)),
    [frameworks],
  );
  return useLibraryRead(
    "framework_items",
    ["counts", revisions],
    frameworks !== undefined,
    (client, context, signal) => readFrameworkCounts(client, context, revisions, signal),
  );
}

/** The edition's families with each series counted (`readFamilyCounts`); waits for an edition. */
export function useFamilyCounts(
  catalogRevisionId: string | null | undefined,
  series: readonly FamilySeries[],
  options: { enabled?: boolean | undefined } = {},
) {
  return useLibraryRead(
    "controls",
    ["families", catalogRevisionId ?? null, series],
    !!catalogRevisionId && (options.enabled ?? true),
    (client, context, signal) =>
      readFamilyCounts(client, context, catalogRevisionId ?? "", series, signal),
  );
}

/** How the workspace's records name each framework (`readFrameworkUse`), once the frameworks are read. */
export function useFrameworkUse(frameworks: readonly Framework[] | undefined) {
  const named = useMemo(
    () =>
      (frameworks ?? [])
        .map((framework) => ({ id: framework.id, code: framework.code }))
        .sort((a, b) => a.code.localeCompare(b.code)),
    [frameworks],
  );
  return useLibraryRead(
    "risk_attack_techniques",
    ["use", named],
    frameworks !== undefined,
    (client, context, signal) => readFrameworkUse(client, context, named, signal),
    ["risks", "gate_criteria", "lifecycle_gates", "programs"],
  );
}

/** The edition's reference baselines and who starts from them (`readReferenceBaselines`). */
export function useReferenceBaselines(
  catalogRevisionId: string | null | undefined,
  options: { enabled?: boolean | undefined } = {},
) {
  return useLibraryRead(
    "program_reference_choices",
    ["baselines", catalogRevisionId ?? null],
    !!catalogRevisionId && (options.enabled ?? true),
    (client, context, signal) =>
      readReferenceBaselines(client, context, catalogRevisionId ?? "", signal),
    ["profile_resolutions", "programs"],
  );
}
