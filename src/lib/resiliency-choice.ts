import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { useWorkspace } from "./workspace-context";
import { database, requireIdentity } from "./database";
import type { FrameworkItem } from "./frameworks";
import type { ReadContext, TableName } from "./models";
import { useStaleOnWrite } from "./server-table";

/*
 * What a program chose for SA-24, Design for Cyber Resiliency. The control asks an organization to
 * define its cyber resiliency goals, objectives, techniques, implementation approaches and design
 * principles; SP 800-160 Vol. 2 says no system employs every one, so the program's choice is what
 * a reading of its resiliency measures against. No reference baseline selects SA-24: a program
 * tailors it in and sets its five parameters there, each value the title of an item of the cyber
 * resiliency framework (`CYBER_RESILIENCY_FRAMEWORK` in frameworks), since a parameter value is
 * text. `program_resiliency_choice` reads the choice from the effective parameter values of the
 * program's control baseline, in one request as the reader, and names each value by its item's
 * code. This module also says which items each parameter may name, for the form that sets them.
 */

/** What a program chose for SA-24, Design for Cyber Resiliency: read from the effective parameter values of its control baseline. */
export interface ResiliencyChoice {
  /** SA-24 is in the program's control baseline. */
  selected: boolean;
  /** Item codes of the cyber resiliency framework that the parameter values name, in the framework's order. */
  goals: string[]; // "goal.anticipate"
  objectives: string[];
  techniques: string[]; // "technique.segmentation"
  approaches: string[];
  designPrinciples: string[]; // "strategic-principle.…" and "structural-principle.…"
  /** Parameter values that name no item of the framework, as written. */
  unmatched: string[];
}

const codes = z.array(z.string());
const choiceSchema = z.object({
  selected: z.boolean(),
  goals: codes,
  objectives: codes,
  techniques: codes,
  approaches: codes,
  design_principles: codes,
  unmatched: z.array(z.string()),
});

type Client = Pick<SupabaseClient, "rpc">;

/**
 * A program's choice as the server reads it. A program whose baseline does not select SA-24
 * answers `selected: false` and empty lists; a program the reader cannot read is refused.
 */
export async function readProgramResiliencyChoice(
  client: Client,
  context: ReadContext,
  programId: string,
  signal?: AbortSignal,
): Promise<ResiliencyChoice> {
  let request = client
    .rpc("program_resiliency_choice", { p_program_id: programId })
    .setHeader("Authorization", `Bearer ${context.token}`);
  if (signal) request = request.abortSignal(signal);
  const { data, error } = await request;
  if (error) throw new Error(error.message);
  const answer = choiceSchema.parse(data);
  return {
    selected: answer.selected,
    goals: answer.goals,
    objectives: answer.objectives,
    techniques: answer.techniques,
    approaches: answer.approaches,
    designPrinciples: answer.design_principles,
    unmatched: answer.unmatched,
  };
}

/**
 * Every model the choice is read from: a write to one reads it again. A program's baseline is the
 * resolution its reference choice names, and the values are the settings of the profiles that
 * resolution layers on.
 */
const CHOICE_MODELS = [
  "program_reference_choices",
  "profile_resolutions",
  "profile_parameter_settings",
  "profile_parameter_values",
] as const satisfies readonly TableName[];

/**
 * A program's choice for SA-24. A program without SA-24 answers `selected: false` and empty lists;
 * no program keeps the read waiting. While another program's choice loads there is no data: one
 * program's choice never stands in for another's.
 */
export function useProgramResiliencyChoice(
  programId: string | null | undefined,
): UseQueryResult<ResiliencyChoice, Error> {
  const workspace = useWorkspace();
  useStaleOnWrite(workspace.tenantId, CHOICE_MODELS, [
    "models",
    workspace.tenantId,
    "program_resiliency_choice",
  ]);
  return useQuery<ResiliencyChoice, Error>({
    queryKey: ["models", workspace.tenantId, "program_resiliency_choice", programId ?? null],
    enabled: !!programId,
    retry: false,
    queryFn: async ({ signal }) =>
      readProgramResiliencyChoice(
        database(),
        { tenantId: workspace.tenantId, token: await requireIdentity(workspace) },
        programId!,
        signal,
      ),
  });
}

/* ——— What each parameter may name ———————————————————————————————————————————————————————————— */

/** The lists SA-24 asks for, as a choice names them. */
export type ResiliencyList = Exclude<keyof ResiliencyChoice, "selected" | "unmatched">;

type ResiliencyParameter = {
  /** The parameter's source id in the catalog. */
  sourceId: string;
  list: ResiliencyList;
  /** The kinds of framework item its values name, in the order the lists read. */
  kinds: readonly string[];
};

/**
 * SA-24's five parameters, in the control's order: the list each one defines and the kinds of item
 * of the cyber resiliency framework its values name. `program_resiliency_choice` reads the same
 * five by the same ids.
 */
export const RESILIENCY_PARAMETERS = [
  { sourceId: "sa-24_odp.01", list: "goals", kinds: ["goal"] },
  { sourceId: "sa-24_odp.02", list: "objectives", kinds: ["objective"] },
  { sourceId: "sa-24_odp.03", list: "techniques", kinds: ["technique"] },
  { sourceId: "sa-24_odp.04", list: "approaches", kinds: ["approach"] },
  {
    sourceId: "sa-24_odp.05",
    list: "designPrinciples",
    kinds: ["strategic-design-principle", "structural-design-principle"],
  },
] as const satisfies readonly ResiliencyParameter[];

/** Every kind the five parameters name: what a form that sets them reads, in one request. */
export const RESILIENCY_KINDS: readonly string[] = RESILIENCY_PARAMETERS.flatMap(
  (parameter) => parameter.kinds,
);

/** The parameter of SA-24 a catalog parameter is, by its source id; `undefined` for any other. */
export function resiliencyParameter(sourceId: string): ResiliencyParameter | undefined {
  return RESILIENCY_PARAMETERS.find((parameter) => parameter.sourceId === sourceId);
}

/** The heading a kind's items stand under where a list holds more than one kind. */
const KIND_HEADINGS: Readonly<Record<string, string>> = {
  "strategic-design-principle": "Strategic design principles",
  "structural-design-principle": "Structural design principles",
};

/** An item a parameter value may name: the value is its title. */
export type VocabularyOption = { code: string; title: string };

/** What the values of one of SA-24's parameters may name. */
export type ResiliencyVocabulary = {
  list: ResiliencyList;
  /** Every item, in the publication's order: an approach after the approaches of the techniques before its own. */
  options: VocabularyOption[];
  /**
   * The same items under the heading the publication gives them: an approach under its technique,
   * a design principle under its kind. Empty for a list the publication prints as one.
   */
  groups: { label: string; options: VocabularyOption[] }[];
  /** Where the publication prints the list: "Table D-4". */
  printedIn: string[];
};

const compareText = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);
/** A value as it is matched to a title: without regard to case or surrounding space, as the server matches. */
const nameOf = (value: string) => value.trim().toLowerCase();

/**
 * What one of SA-24's parameters may name, from the cyber resiliency framework's items (read every
 * kind in `RESILIENCY_KINDS`, with the techniques for the order of the approaches). `null` for a
 * parameter that is not one of the five, and when the items hold none of its kinds: the framework's
 * reference data is not loaded, and the parameter is typed text like any other.
 */
export function resiliencyVocabulary(
  parameterSourceId: string,
  items: readonly FrameworkItem[],
): ResiliencyVocabulary | null {
  const parameter = resiliencyParameter(parameterSourceId);
  if (!parameter) return null;
  const kinds: readonly string[] = parameter.kinds;
  const named = items.filter((item) => kinds.includes(item.kind));
  if (!named.length) return null;
  // The place of the item that holds each item: an approach's technique among the techniques.
  const holders = new Map(items.map((item) => [item.code, item.ordinal]));
  const heldAt = (item: FrameworkItem) =>
    item.parent_code ? (holders.get(item.parent_code) ?? Number.MAX_SAFE_INTEGER) : 0;
  const ordered = [...named].sort(
    (a, b) =>
      kinds.indexOf(a.kind) - kinds.indexOf(b.kind) ||
      heldAt(a) - heldAt(b) ||
      compareText(a.parent_code ?? "", b.parent_code ?? "") ||
      a.ordinal - b.ordinal ||
      compareText(a.code, b.code),
  );
  // A title names one item: a second item of the same name could not be told from the first.
  const seen = new Set<string>();
  const unique = ordered.filter((item) => {
    const name = nameOf(item.title);
    if (seen.has(name)) return false;
    seen.add(name);
    return true;
  });
  const heading = (item: FrameworkItem) =>
    item.parent_title ?? (kinds.length > 1 ? (KIND_HEADINGS[item.kind] ?? item.kind) : null);
  const groups: ResiliencyVocabulary["groups"] = [];
  for (const item of unique) {
    const label = heading(item);
    if (label === null) continue;
    const last = groups.at(-1);
    const group = last?.label === label ? last : { label, options: [] };
    if (group !== last) groups.push(group);
    group.options.push({ code: item.code, title: item.title });
  }
  return {
    list: parameter.list,
    options: unique.map((item) => ({ code: item.code, title: item.title })),
    groups,
    printedIn: [...new Set(unique.map((item) => item.printed_in))],
  };
}

/**
 * The titles a parameter's values name, as the vocabulary spells them and in its order, each once.
 * `null` when a value names none of them: the values are then text the reader typed, and stay so.
 */
export function vocabularyValues(
  vocabulary: Pick<ResiliencyVocabulary, "options">,
  values: readonly string[],
): string[] | null {
  const names = new Set(values.map(nameOf));
  const titles = vocabulary.options
    .filter((option) => names.has(nameOf(option.title)))
    .map((option) => option.title);
  return new Set(titles.map(nameOf)).size === names.size ? titles : null;
}
