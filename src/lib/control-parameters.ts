import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { useWorkspace } from "./workspace-context";
import { database, requireIdentity } from "./database";
import type { ReadContext, TableName } from "./models";
import { useStaleOnWrite } from "./server-table";

/*
 * A program's values for the parameters of one control. The catalog prints a parameter as a
 * placeholder ("[Assignment: organization-defined frequency]"); a program's control baseline gives
 * it values, as author_tailored_profile resolves them: the nearest layer of the stack that sets the
 * parameter, else the catalog's own values, else none, and the placeholder stays.
 * `program_control_parameters` answers every stack of the program that selects the control, in one
 * request as the reader; this module reads it and says what each parameter reads in the program,
 * which the program's record of the control prints in the control's text.
 */

/** Where a parameter's values come from: the layer of the stack that set them, or the catalog. */
export type ParameterSource =
  | {
      /** The reference baseline the stack starts from, an overlay, or the program's tailoring. */
      kind: "reference" | "overlay" | "tailoring";
      /** The layer as the program's Control baseline names it: the overlay's title, else its profile's. */
      title: string;
      resolutionId: string;
    }
  | { kind: "catalog" };

/** One parameter in one stack. */
export type StackParameter = {
  parameterId: string;
  /** The effective values, in order; none where nothing gives the parameter a value. */
  values: string[];
  source: ParameterSource | null;
  /** Why the layer set them, as its setting records it. */
  rationale: string | null;
};

/** One control baseline of the program that selects the control. */
export type ParameterStack = {
  choiceId: string;
  /** The top of the stack: the resolution the program adopted. */
  resolutionId: string;
  /** The profile the program adopted, as the Control baseline heads a program's several baselines. */
  title: string;
  /** Every parameter of the control, in the catalog's order. */
  parameters: StackParameter[];
};

/** A program's values for the parameters of one control, stack by stack. */
export type ProgramControlParameters = {
  /** One of the program's control baselines selects the control. */
  selected: boolean;
  /** The stacks that select it, in the order the program adopted them. */
  stacks: ParameterStack[];
};

const sourceSchema = z.union([
  z.object({
    kind: z.enum(["reference", "overlay", "tailoring"]),
    title: z.string(),
    resolution_id: z.string(),
  }),
  z.object({ kind: z.literal("catalog") }),
]);
const answerSchema = z.object({
  selected: z.boolean(),
  stacks: z.array(
    z.object({
      choice_id: z.string(),
      resolution_id: z.string(),
      title: z.string().nullable(),
      parameters: z.array(
        z.object({
          parameter_id: z.string(),
          values: z.array(z.string()),
          source: sourceSchema.nullable(),
          rationale: z.string().nullable(),
        }),
      ),
    }),
  ),
});

type Client = Pick<SupabaseClient, "rpc">;

/**
 * A program's values for a control's parameters as the server reads them. A control none of the
 * program's baselines selects answers `selected: false` and no stack; a program the reader cannot
 * read is refused.
 */
export async function readProgramControlParameters(
  client: Client,
  context: ReadContext,
  programId: string,
  controlId: string,
  signal?: AbortSignal,
): Promise<ProgramControlParameters> {
  let request = client
    .rpc("program_control_parameters", { p_program_id: programId, p_control_id: controlId })
    .setHeader("Authorization", `Bearer ${context.token}`);
  if (signal) request = request.abortSignal(signal);
  const { data, error } = await request;
  if (error) throw new Error(error.message);
  const answer = answerSchema.parse(data);
  return {
    selected: answer.selected,
    stacks: answer.stacks.map((stack) => ({
      choiceId: stack.choice_id,
      resolutionId: stack.resolution_id,
      title: stack.title ?? "Control baseline",
      parameters: stack.parameters.map((parameter) => ({
        parameterId: parameter.parameter_id,
        values: parameter.values,
        source: !parameter.source
          ? null
          : parameter.source.kind === "catalog"
            ? { kind: "catalog" }
            : {
                kind: parameter.source.kind,
                title: parameter.source.title,
                resolutionId: parameter.source.resolution_id,
              },
        rationale: parameter.rationale,
      })),
    })),
  };
}

/**
 * Every model the values are read from: a write to one reads them again. The stacks are the
 * resolutions the program's reference choices name, their layers' settings give the values, and
 * an overlay's title names its layer.
 */
const PARAMETER_MODELS = [
  "program_reference_choices",
  "profile_resolutions",
  "profile_parameter_settings",
  "profile_parameter_values",
  "profile_overlay_applications",
  "control_overlays",
  "profiles",
] as const satisfies readonly TableName[];

/**
 * A program's values for a control's parameters, read in one request. With no program (the
 * catalog's record of the control) nothing is read. While another control's values load there is
 * no data: one control's values never stand in for another's.
 */
export function useProgramControlParameters(
  programId: string | null | undefined,
  controlId: string | null | undefined,
): UseQueryResult<ProgramControlParameters, Error> {
  const workspace = useWorkspace();
  useStaleOnWrite(workspace.tenantId, PARAMETER_MODELS, [
    "models",
    workspace.tenantId,
    "program_control_parameters",
  ]);
  return useQuery<ProgramControlParameters, Error>({
    queryKey: [
      "models",
      workspace.tenantId,
      "program_control_parameters",
      programId ?? null,
      controlId ?? null,
    ],
    enabled: !!programId && !!controlId,
    retry: false,
    queryFn: async ({ signal }) =>
      readProgramControlParameters(
        database(),
        { tenantId: workspace.tenantId, token: await requireIdentity(workspace) },
        programId!,
        controlId!,
        signal,
      ),
  });
}

/* ——— What a parameter reads in the program ——————————————————————————————————————————————— */

/** One thing a parameter reads in the program: its values, where they come from and whose they are. */
export type ParameterReading = {
  /** The values, in order; none where the stacks that read so give the parameter no value. */
  values: string[];
  /** Where they come from, each once, in the order of the stacks. */
  sources: ParameterSource[];
  /** The stacks that read so, by title, in the order the program adopted them. */
  stacks: string[];
  /** Why the layers set them, each once. */
  rationales: string[];
};

const sameSource = (a: ParameterSource, b: ParameterSource) =>
  a.kind === "catalog" || b.kind === "catalog"
    ? a.kind === b.kind
    : a.resolutionId === b.resolutionId;

/**
 * What each parameter of the control reads in the program, by the parameter's id. Where the
 * program has one stack, or its stacks agree, a parameter reads one way; where its stacks set
 * different values, it reads one way a set of values, in the order of the first stack that reads
 * each, a stack that gives it none included. `null` when no stack selects the control: its text
 * keeps the catalog's words.
 */
export function parameterReadings(
  answer: ProgramControlParameters,
): ReadonlyMap<string, readonly ParameterReading[]> | null {
  if (!answer.selected || !answer.stacks.length) return null;
  const readings = new Map<string, ParameterReading[]>();
  for (const stack of answer.stacks)
    for (const parameter of stack.parameters) {
      const known = readings.get(parameter.parameterId) ?? [];
      readings.set(parameter.parameterId, known);
      const key = JSON.stringify(parameter.values);
      let reading = known.find((held) => JSON.stringify(held.values) === key);
      if (!reading) {
        reading = { values: parameter.values, sources: [], stacks: [], rationales: [] };
        known.push(reading);
      }
      if (!reading.stacks.includes(stack.title)) reading.stacks.push(stack.title);
      const source = parameter.source;
      if (source && !reading.sources.some((held) => sameSource(held, source)))
        reading.sources.push(source);
      if (parameter.rationale && !reading.rationales.includes(parameter.rationale))
        reading.rationales.push(parameter.rationale);
    }
  return readings;
}

/** A reading's values as the control's text prints them: "Anticipate, Withstand, Recover". */
export const readingText = (reading: Pick<ParameterReading, "values">) => reading.values.join(", ");

/** A source's kind, as the program's Control baseline says what each layer is. */
export const sourceKinds: Readonly<Record<ParameterSource["kind"], string>> = {
  reference: "Baseline",
  overlay: "Overlay",
  tailoring: "Tailoring",
  catalog: "Catalog",
};

/** A source by name: the layer's title, or the catalog. */
export const sourceName = (source: ParameterSource) =>
  source.kind === "catalog" ? "the catalog" : source.title;

/**
 * What a value printed in the control's text says on hover: the parameter's label and where the
 * value comes from, with the stacks that read so where the program's stacks disagree.
 * "cyber resiliency goals, set by Program tailoring".
 */
export function readingTitle(
  label: string,
  reading: Pick<ParameterReading, "sources" | "stacks">,
  disagree: boolean,
): string {
  const where = disagree && reading.stacks.length ? ` in ${reading.stacks.join(" and ")}` : "";
  const sources = reading.sources.map(sourceName);
  return sources.length ? `${label}${where}, set by ${sources.join(" and ")}` : `${label}${where}`;
}
