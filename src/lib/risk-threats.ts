import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient, type UseQueryResult } from "@tanstack/react-query";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { useWorkspace } from "./workspace-context";
import { database, requireIdentity } from "./database";
import {
  ATTACK_FRAMEWORK,
  itemReference,
  propList,
  propText,
  type FrameworkControlLink,
  type FrameworkItem,
  type FrameworkItemLink,
} from "./frameworks";
import { attackVocabulary, matrixPlace } from "./control-threats";
import { idSet, invalidateModel, useRows, type ReadContext, type TableName } from "./models";
import { useStaleOnWrite } from "./server-table";

/*
 * The threat a risk concerns, named as ATT&CK techniques, and what counters it. Appendix F of NIST
 * SP 800-160 Vol. 2 Rev. 1 lists, for each ATT&CK for Enterprise technique, the mitigations and the
 * cyber resiliency approaches, effects and SP 800-53 controls that counter it (`ATTACK_FRAMEWORK`
 * in frameworks), and Appendix G does the same for ATT&CK for ICS (`ATTACK_ICS_FRAMEWORK`). A risk
 * names the techniques it concerns, from either, one link a technique, and `risk_threats` reads
 * them in one request, as the reader, with the controls the appendices print against them and
 * where the risk's program stands on each: in its control baseline or not, its requirements, its
 * requirements with evidence, and how many of its assessment objectives they cover, cover with
 * evidence and the program's assessors have judged, as its control status counts them. This
 * module is that read, the link and unlink commands, and what the screens derive from the
 * appendices: the order a risk's controls read in, the techniques a picker offers, and one
 * technique's mitigations and controls.
 */

/** The link between a risk and a technique: the model its writes are announced under. */
const LINK_MODEL = "risk_attack_techniques" satisfies TableName;

/** An ATT&CK tactic a technique sits under: "Initial Access". */
export type ThreatTactic = { code: string; title: string };

/** An ATT&CK technique a risk names. */
export type RiskTechnique = {
  /** The link's row: what an unlink removes. */
  linkId: string;
  /** The technique's item, in the reading of the appendix the link was made from. */
  itemId: string;
  /** The ATT&CK identifier: "T1190", or "T0819" in ATT&CK for ICS. */
  code: string;
  title: string;
  /** The framework that prints it: Appendix F's for ATT&CK for Enterprise, Appendix G's for ICS. */
  framework: string;
  /** Its tactics, in the order of the appendix's tables. */
  tactics: ThreatTactic[];
};

/** A cyber resiliency approach a control counters a technique through. */
export type CounteringApproach = { code: string; title: string };

/** A control the appendix prints against one or more of a risk's techniques, once. */
export type CounteringControl = {
  id: string;
  code: string;
  title: string;
  /** The identifiers of the risk's techniques it counters. */
  techniques: string[];
  /** Its approaches over every row printed for those techniques, in the order first printed. */
  approaches: CounteringApproach[];
  /** The effects on the adversary those rows print, in the order of Table F-1. */
  effects: string[];
  /**
   * Whether a control baseline the program adopted selects it. Empty when the program records no
   * baseline, or no standing can be said.
   */
  inBaseline: boolean | null;
  /** The program's requirements whose latest revision maps it. Empty when no standing can be said. */
  requirements: number | null;
  /** Those of them whose latest revision cites an evidence version. */
  evidenced: number | null;
  /**
   * The assessment objectives the control counts (its leaves, and each heading that prints a
   * sentence of its own); none for a control the catalog gives none. Empty when no standing can be
   * said.
   */
  objectives: number | null;
  /** Those the program's requirements cover, as its control status counts them. */
  objectivesMapped: number | null;
  /** Those covered by a requirement that cites evidence, as its control status counts them. */
  objectivesEvidenced: number | null;
  /** Those an assessor of the program has judged, as its control status counts them. */
  objectivesAssessed: number | null;
};

/** What a risk concerns and what counters it. */
export type RiskThreats = {
  riskId: string;
  /** The risk's program; empty for a risk the reader cannot read. */
  programId: string | null;
  /** The appendix's reference data is loaded. An unloaded framework answers no technique to link. */
  loaded: boolean;
  /** The catalog edition the controls belong to: the program's, else the one the appendix was read against. */
  catalogRevisionId: string | null;
  /** The program records a control baseline on that edition, so each control stands in it or not. */
  baseline: boolean;
  techniques: RiskTechnique[];
  /** In the catalog's order. */
  controls: CounteringControl[];
  totals: {
    techniques: number;
    controls: number;
    /** Controls in the program's baseline; empty when it records none. */
    inBaseline: number | null;
    /** Controls a requirement of the program maps. */
    withRequirement: number | null;
    /** Controls a requirement with evidence maps. */
    withEvidence: number | null;
  };
};

const uuid = z.string().uuid();
const named = z.object({ code: z.string(), title: z.string() });
const count = z.number().int().nonnegative();
const answerSchema = z.object({
  risk_id: uuid,
  program_id: uuid.nullable(),
  loaded: z.boolean(),
  catalog_revision_id: uuid.nullable(),
  baseline: z.boolean(),
  techniques: z.array(
    z.object({
      link_id: uuid,
      item_id: uuid,
      code: z.string(),
      title: z.string(),
      // Every answer names it since ATT&CK for ICS was read; Appendix F's before.
      framework: z.string().default(ATTACK_FRAMEWORK),
      tactics: z.array(named),
    }),
  ),
  controls: z.array(
    z.object({
      id: uuid,
      code: z.string(),
      title: z.string(),
      techniques: z.array(z.string()),
      approaches: z.array(named),
      effects: z.array(z.string()),
      in_baseline: z.boolean().nullable(),
      requirements: count.nullable(),
      evidenced: count.nullable(),
      // Every answer counts them since 20261114051138_objective_counts_on_screens, and those with
      // evidence and judged since 20261114165512_latest_per_objective.
      objectives: count.nullable().default(null),
      objectives_mapped: count.nullable().default(null),
      objectives_evidenced: count.nullable().default(null),
      objectives_assessed: count.nullable().default(null),
    }),
  ),
  totals: z.object({
    techniques: count,
    controls: count,
    in_baseline: count.nullable(),
    with_requirement: count.nullable(),
    with_evidence: count.nullable(),
  }),
});

type RpcClient = Pick<SupabaseClient, "rpc">;
type TableClient = Pick<SupabaseClient, "from">;

/**
 * One request: the risk's techniques, the controls that counter them and the program's standing on
 * each. A risk with no technique answers empty lists; a workspace the reader cannot read is refused.
 */
export async function readRiskThreats(
  client: RpcClient,
  context: ReadContext,
  riskId: string,
  signal?: AbortSignal,
): Promise<RiskThreats> {
  let request = client
    .rpc("risk_threats", { p_tenant_id: context.tenantId, p_risk_id: riskId })
    .setHeader("Authorization", `Bearer ${context.token}`);
  if (signal) request = request.abortSignal(signal);
  const { data, error } = await request;
  if (error) throw new Error(error.message);
  const answer = answerSchema.parse(data);
  return {
    riskId: answer.risk_id,
    programId: answer.program_id,
    loaded: answer.loaded,
    catalogRevisionId: answer.catalog_revision_id,
    baseline: answer.baseline,
    techniques: answer.techniques.map((technique) => ({
      linkId: technique.link_id,
      itemId: technique.item_id,
      code: technique.code,
      title: technique.title,
      framework: technique.framework,
      tactics: technique.tactics,
    })),
    controls: answer.controls.map((control) => ({
      id: control.id,
      code: control.code,
      title: control.title,
      techniques: control.techniques,
      approaches: control.approaches,
      effects: control.effects,
      inBaseline: control.in_baseline,
      requirements: control.requirements,
      evidenced: control.evidenced,
      objectives: control.objectives,
      objectivesMapped: control.objectives_mapped,
      objectivesEvidenced: control.objectives_evidenced,
      objectivesAssessed: control.objectives_assessed,
    })),
    totals: {
      techniques: answer.totals.techniques,
      controls: answer.totals.controls,
      inBaseline: answer.totals.in_baseline,
      withRequirement: answer.totals.with_requirement,
      withEvidence: answer.totals.with_evidence,
    },
  };
}

/**
 * Every model the standing is counted from, beside the link itself: a write to one reads the
 * answer again. The program is the risk's, its baseline the resolution its reference choice names,
 * a requirement counts at its latest revision with that revision's control mappings and evidence,
 * on each system whose control baseline selects the control, and an objective is judged by the
 * findings published on it.
 */
const STANDING_MODELS = [
  "risks",
  "program_reference_choices",
  "requirement_control_links",
  "requirement_revisions",
  "requirement_evidence",
  "systems",
  "ssp_revisions",
  "assessment_findings",
  "assessment_results_revisions",
] as const satisfies readonly TableName[];

const RECORD_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Where the read is kept: under the link's model, so a write to it (`invalidateModel`) marks every
 * risk's answer in the workspace stale. Without a risk, the key every risk's answer starts with.
 */
export function riskThreatsKey(tenantId: string, riskId?: string | null | undefined) {
  const every = ["models", tenantId, LINK_MODEL, "threats"];
  return riskId === undefined ? every : [...every, riskId];
}

/**
 * What a risk concerns and what counters it, read once the risk's id is known. A link or an unlink
 * reads it again, and so does a write to a model the standing is counted from.
 */
export function useRiskThreats(
  riskId: string | null | undefined,
): UseQueryResult<RiskThreats, Error> {
  const workspace = useWorkspace();
  useStaleOnWrite(workspace.tenantId, STANDING_MODELS, riskThreatsKey(workspace.tenantId));
  return useQuery<RiskThreats, Error>({
    queryKey: riskThreatsKey(workspace.tenantId, riskId ?? null),
    enabled: !!riskId && RECORD_ID.test(riskId),
    retry: false,
    queryFn: async ({ signal }) =>
      readRiskThreats(
        database(),
        { tenantId: workspace.tenantId, token: await requireIdentity(workspace) },
        riskId!,
        signal,
      ),
  });
}

/* ——— Linking and unlinking ——————————————————————————————————————————————————————————————————— */

/** The most techniques one link takes: more than the appendix names. */
export const LINK_TECHNIQUES_LIMIT = 500;

export const linkRiskTechniquesSchema = z
  .object({
    riskId: uuid,
    /** The techniques' items, as a read of the framework named them. */
    itemIds: z.array(uuid).min(1, "Choose an ATT&CK technique.").max(LINK_TECHNIQUES_LIMIT),
  })
  .strict();
export type LinkRiskTechniques = z.infer<typeof linkRiskTechniquesSchema>;

export const unlinkRiskTechniqueSchema = z.object({ linkId: uuid }).strict();
export type UnlinkRiskTechnique = z.infer<typeof unlinkRiskTechniqueSchema>;

type PostgrestFailure = { code?: string | undefined; message: string };

/** A database refusal in the reader's words: what happened and what to do next. */
function failure(error: PostgrestFailure): Error {
  if (error.code === "42501")
    return new Error("Only an editor, admin or owner can change a risk's ATT&CK techniques.");
  // The risk is gone, or the technique is no longer one the reference data holds.
  if (error.code === "23503")
    return new Error("The risk or the ATT&CK technique is no longer available. Reload the risk.");
  // The schema's messages carry no full stop.
  const message = error.message.trim();
  return new Error(/[.!?]$/.test(message) ? message : `${message}.`);
}

/**
 * Name techniques on a risk, in one insert: all of them are linked, or none. A risk names a
 * technique once, and a technique it already names is passed over, so a retry after an uncertain
 * response, or a link another session made first, changes nothing and fails nothing.
 */
export async function linkRiskTechniques(
  client: TableClient,
  { tenantId, token }: ReadContext,
  request: LinkRiskTechniques,
): Promise<{ linked: number; alreadyLinked: number }> {
  const values = linkRiskTechniquesSchema.parse(request);
  const itemIds = [...new Set(values.itemIds)];
  const { data, error } = await client
    .from(LINK_MODEL)
    .upsert(
      itemIds.map((itemId) => ({
        tenant_id: tenantId,
        risk_id: values.riskId,
        framework_item_id: itemId,
      })),
      { onConflict: "tenant_id,risk_id,framework_item_id", ignoreDuplicates: true },
    )
    .select("id")
    .setHeader("Authorization", `Bearer ${token}`);
  if (error) throw failure(error);
  const linked = Array.isArray(data) ? data.length : 0;
  return { linked, alreadyLinked: itemIds.length - linked };
}

/**
 * Remove a technique from a risk. A link that is already gone counts as removed, so a retry after
 * an uncertain response succeeds; one that is still there after the delete could not be removed by
 * this reader.
 */
export async function unlinkRiskTechnique(
  client: TableClient,
  { tenantId, token }: ReadContext,
  request: UnlinkRiskTechnique,
): Promise<{ removed: boolean }> {
  const { linkId } = unlinkRiskTechniqueSchema.parse(request);
  const { data, error } = await client
    .from(LINK_MODEL)
    .delete()
    .eq("tenant_id", tenantId)
    .eq("id", linkId)
    .select("id")
    .setHeader("Authorization", `Bearer ${token}`);
  if (error) throw failure(error);
  if (Array.isArray(data) && data.length) return { removed: true };
  const current = await client
    .from(LINK_MODEL)
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("id", linkId)
    .setHeader("Authorization", `Bearer ${token}`)
    .maybeSingle();
  if (current.error) throw failure(current.error);
  if (!current.data) return { removed: false };
  throw new Error(
    "This ATT&CK technique could not be unlinked. An editor, admin or owner can unlink it.",
  );
}

/** Link techniques to a risk; the risk's read refreshes behind the surface that asked. */
export function useLinkRiskTechniques() {
  const workspace = useWorkspace();
  const cache = useQueryClient();
  return useMutation({
    mutationFn: async (request: LinkRiskTechniques) =>
      linkRiskTechniques(
        database(),
        { tenantId: workspace.tenantId, token: await requireIdentity(workspace) },
        request,
      ),
    onSuccess: () => void invalidateModel(cache, workspace.tenantId, LINK_MODEL),
  });
}

/** An ATT&CK technique by its identifier and name, as a register lists the ones a risk names. */
export type NamedTechnique = { code: string; title: string };

/**
 * The ATT&CK techniques each risk names, by the risk's id, each once and in the order of their
 * identifiers. A risk's link keeps the item of the reading it was made from, and an item's id
 * changes when the appendix is read again while its code does not: `items` gives the code and
 * title of every item the links name, and a link whose item is not among them is passed over. A
 * risk that names a technique through two readings names it once.
 */
export function techniquesByRisk(
  links: readonly { risk_id: string; framework_item_id: string }[],
  items: readonly { id: string; code: string; title: string }[],
): Map<string, NamedTechnique[]> {
  const byId = new Map(items.map((item) => [item.id, item]));
  const named = new Map<string, NamedTechnique[]>();
  for (const link of links) {
    const item = byId.get(link.framework_item_id);
    if (!item) continue;
    const techniques = named.get(link.risk_id) ?? [];
    named.set(link.risk_id, techniques);
    if (!techniques.some((held) => held.code === item.code))
      techniques.push({ code: item.code, title: item.title });
  }
  for (const techniques of named.values()) techniques.sort((a, b) => comparePlace(a.code, b.code));
  return named;
}

/**
 * The ATT&CK techniques a program's risks name, in two requests: the links, read through the
 * risks' program, and the items they name. `risks` gives each risk's techniques once both have
 * answered (`techniquesByRisk`); `links` and `items` are the rows, which a count by technique reads
 * (`risksByTechnique` in control-threats). `queries` are the reads to wait on and say the failure
 * of. A program's risks register lists the techniques, and a control's record counts the risks
 * that name each, from the same reads.
 */
export function useProgramRiskTechniques(
  programId: string | null | undefined,
  { enabled = true }: { enabled?: boolean | undefined } = {},
) {
  const links = useRows(
    "risk_attack_techniques",
    { "risks.program_id": programId ?? "" },
    { columns: ["risk_id", "framework_item_id"], enabled: !!programId && enabled },
  );
  const itemIds = useMemo(
    () => idSet(links.data?.map((link) => link.framework_item_id)),
    [links.data],
  );
  const items = useRows(
    "framework_items",
    { id: itemIds },
    { columns: ["id", "code", "title"], enabled: itemIds.length > 0 },
  );
  // Read once both have answered: links whose items are not read yet would name nothing.
  const risks = useMemo(
    () =>
      links.data && (items.data || !itemIds.length)
        ? techniquesByRisk(links.data, items.data ?? [])
        : undefined,
    [links.data, items.data, itemIds.length],
  );
  const queries = useMemo(
    () => [links, ...(itemIds.length ? [items] : [])],
    [links, items, itemIds.length],
  );
  return { links, items, risks, queries };
}

/** Unlink one technique from a risk; the risk's read refreshes behind the confirmation. */
export function useUnlinkRiskTechnique() {
  const workspace = useWorkspace();
  const cache = useQueryClient();
  return useMutation({
    mutationFn: async (request: UnlinkRiskTechnique) =>
      unlinkRiskTechnique(
        database(),
        { tenantId: workspace.tenantId, token: await requireIdentity(workspace) },
        request,
      ),
    onSuccess: () => void invalidateModel(cache, workspace.tenantId, LINK_MODEL),
  });
}

/* ——— What the screens derive ————————————————————————————————————————————————————————————————— */

/**
 * A technique, a control or a mitigation named by its code and its title together, as one identity:
 * "T1190 Exploit Public-Facing Application", "SC-26 Decoys".
 */
export const codedName = (record: { code: string; title: string }) =>
  `${record.code} ${record.title}`;

/** What the order of a risk's controls reads of each: its standing, and its objectives where counted. */
type Holding = Pick<CounteringControl, "inBaseline" | "requirements" | "evidenced"> &
  Partial<Pick<CounteringControl, "objectives" | "objectivesMapped" | "objectivesEvidenced">>;

/**
 * How much of a control the program holds, least first, by its objectives as its control status
 * counts them: not in its baseline, then in it with not every objective mapped, then with every
 * objective mapped and not every one evidenced, then with every one evidenced. A control the
 * catalog gives no objective climbs by its requirements: one maps it, then one that maps it cites
 * evidence. A control outside the baseline that requirements map all the same stands after the
 * ones they map less of.
 */
export function controlHolding(control: Holding): number {
  const objectives = control.objectives ?? 0;
  const mapped =
    objectives > 0
      ? (control.objectivesMapped ?? 0) >= objectives
      : (control.requirements ?? 0) > 0;
  const evidenced =
    mapped &&
    (objectives > 0
      ? (control.objectivesEvidenced ?? 0) >= objectives
      : (control.evidenced ?? 0) > 0);
  return (control.inBaseline ? 4 : 0) + (mapped ? 2 : 0) + (evidenced ? 1 : 0);
}

/**
 * A risk's controls in the order its record reads them: what the program does not hold first
 * (`controlHolding`), and the catalog's order among controls it holds alike.
 */
export function leastHeldFirst<T extends Holding>(controls: readonly T[]): T[] {
  return controls
    .map((control, index) => ({ control, index, held: controlHolding(control) }))
    .sort((a, b) => a.held - b.held || a.index - b.index)
    .map((entry) => entry.control);
}

/** A place in the publication (`F-5:T1190:CM1102:2:SC-26`) compares number by number: 2 before 10. */
const comparePlace = new Intl.Collator("en", { numeric: true }).compare;
const compareText = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);

/**
 * A technique as a picker offers it: its item in its framework's current reading, the framework
 * (Appendix F's for ATT&CK for Enterprise, Appendix G's for ICS) and its tactics.
 */
export type TechniqueChoice = {
  id: string;
  code: string;
  title: string;
  framework: string;
  tactics: ThreatTactic[];
};

/**
 * The techniques a picker offers, ATT&CK for Enterprise's first and then ATT&CK for ICS's, each in
 * the order of their identifiers, with its tactics in the order of its appendix's tables. Give it
 * the frameworks' `attack-technique` items, their `tactic` item links and their `tactic` items;
 * without the tactic items the tactics keep the links' order. Both appendices print an Initial
 * Access, so a tactic is placed among its own framework's.
 */
export function techniqueChoices(
  techniques: readonly FrameworkItem[],
  tacticLinks: readonly FrameworkItemLink[],
  tactics: readonly FrameworkItem[] = [],
): TechniqueChoice[] {
  const named = attackVocabulary(tactics);
  const held = new Map<string, ThreatTactic[]>();
  for (const link of tacticLinks) {
    if (link.relation !== "tactic") continue;
    const key = `${link.framework_code} ${link.source_code}`;
    const list = held.get(key) ?? [];
    held.set(key, list);
    if (!list.some((tactic) => tactic.code === link.target_code))
      list.push({ code: link.target_code, title: link.target_title });
  }
  for (const [key, list] of held) {
    const framework = key.slice(0, key.indexOf(" "));
    const place = (tactic: ThreatTactic) =>
      named(framework, tactic.code)?.ordinal ?? Number.MAX_SAFE_INTEGER;
    list.sort((a, b) => place(a) - place(b));
  }
  return techniques
    .filter((item) => item.kind === "attack-technique")
    .sort(
      (a, b) =>
        matrixPlace(a.framework_code) - matrixPlace(b.framework_code) ||
        compareText(a.code_order, b.code_order),
    )
    .map((item) => ({
      id: item.id,
      code: item.code,
      title: item.title,
      framework: item.framework_code,
      tactics: held.get(`${item.framework_code} ${item.code}`) ?? [],
    }));
}

/** A mitigation the appendix prints against a technique. */
export type TechniqueMitigation = {
  /** "M1048", or "CM1102" for a candidate mitigation. */
  code: string;
  title: string;
  /** One of the candidate mitigations the appendix defines (Tables F-17 to F-19), not ATT&CK's own. */
  candidate: boolean;
};

/** A control the appendix prints against a technique, once over every tactic's table. */
export type TechniqueControl = {
  id: string;
  code: string;
  title: string;
  /** The codes of the mitigations whose rows print it. */
  mitigations: string[];
  /** The titles of its approaches, in the order first printed. */
  approaches: string[];
  /** The effects on the adversary, in the order of Table F-1. */
  effects: string[];
};

/**
 * One technique's mitigations and the controls that counter it, from its appendix's rows for it
 * (`useFrameworkControlLinks(framework, { itemCodes: [code], relation: "mitigates",
 * catalogRevisionId })`, Appendix F's framework or Appendix G's). A technique that sits under
 * several tactics is printed in each one's table: a mitigation and a control are listed once, with
 * every approach and effect those rows print. `attack` names the mitigations and orders the effects
 * (the frameworks' `mitigation` and `candidate-mitigation` items, and Table F-1's `effect` items);
 * `approaches` names the approaches (the cyber resiliency framework's `approach` items). An item a
 * list lacks reads as its code.
 */
export function techniqueDefence(
  links: readonly FrameworkControlLink[],
  vocabulary: { attack: readonly FrameworkItem[]; approaches: readonly FrameworkItem[] },
): { mitigations: TechniqueMitigation[]; controls: TechniqueControl[] } {
  const named = attackVocabulary(vocabulary.attack);
  const approachTitles = new Map(vocabulary.approaches.map((item) => [item.code, item.title]));
  const effectPlace = new Map(
    vocabulary.attack
      .filter((item) => item.kind === "effect")
      .map((item) => [item.title, item.ordinal]),
  );
  const printed = links
    .filter((link) => link.relation === "mitigates")
    .sort((a, b) => comparePlace(a.source_identifier, b.source_identifier));
  const mitigations = new Map<string, TechniqueMitigation>();
  const controls = new Map<string, TechniqueControl>();
  // Each control's place in the catalog, as the read orders it: AC-2 before AC-10.
  const controlOrder = new Map<string, string>();
  for (const link of printed) {
    const mitigation = propText(link.props, "mitigation");
    if (mitigation && !mitigations.has(mitigation)) {
      const item = named(link.framework_code, mitigation);
      mitigations.set(mitigation, {
        code: mitigation,
        title: item?.title ?? mitigation,
        candidate: item ? item.kind === "candidate-mitigation" : mitigation.startsWith("CM"),
      });
    }
    // A label the catalog does not hold names no control to list.
    const id = link.control_id;
    if (!id) continue;
    const control = controls.get(id) ?? {
      id,
      code: link.control_code ?? link.control_label,
      title: link.control_title ?? link.control_label,
      mitigations: [],
      approaches: [],
      effects: [],
    };
    controls.set(id, control);
    controlOrder.set(id, link.control_order);
    if (mitigation && !control.mitigations.includes(mitigation))
      control.mitigations.push(mitigation);
    for (const reference of propList(link.props, "approaches")) {
      const { code } = itemReference(reference, link.framework_code);
      const title = approachTitles.get(code) ?? code;
      if (!control.approaches.includes(title)) control.approaches.push(title);
    }
    for (const effect of propList(link.props, "effects"))
      if (!control.effects.includes(effect)) control.effects.push(effect);
  }
  const place = (effect: string) => effectPlace.get(effect) ?? Number.MAX_SAFE_INTEGER;
  for (const control of controls.values())
    // Stable: effects the table does not name keep the order they were printed in, after the rest.
    control.effects.sort((a, b) => place(a) - place(b));
  return {
    // ATT&CK's own mitigations, then the appendix's candidates, each in the order of its code.
    mitigations: [...mitigations.values()].sort(
      (a, b) => Number(a.candidate) - Number(b.candidate) || comparePlace(a.code, b.code),
    ),
    controls: [...controls.values()].sort((a, b) =>
      compareText(controlOrder.get(a.id) ?? "", controlOrder.get(b.id) ?? ""),
    ),
  };
}
