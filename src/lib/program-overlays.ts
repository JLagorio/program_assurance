import { useMutation, useQueryClient, type Query, type QueryClient } from "@tanstack/react-query";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { useWorkspace } from "@/components/app/workspace";
import {
  deriveStack,
  idleLayer,
  stackAt,
  withParameters,
  type BaselineDerivation,
  type StackDecision,
  type StackLayerInput,
} from "./baseline-stack";
import { database, requireIdentity } from "./database";
import type { ReadContext } from "./models";

type Client = Pick<SupabaseClient, "rpc">;

/*
 * Changing a program's control baseline after creation: the overlays of one program profile's
 * stack, added, removed and reordered, with the program's tailoring kept last. The database
 * command is `set_program_baseline_overlays`; what it does to systems and SSP revisions is in
 * docs/control-baseline.md. The preview here reads a stack the way the command will author it, so
 * the Dialog says what changes before anything is sent.
 */

/** The most overlays one program profile stacks, as program setup allows. */
export const OVERLAY_LIMIT = 6;

/** An overlay as a stack reads it: its decisions, in the order they are given, and its values. */
export type StackOverlay = {
  id: string;
  title: string;
  decisions: readonly StackDecision[];
  /** The control of each parameter it sets a value for: a value counts where the stack selects it. */
  parameters?: readonly { controlId: string | null }[] | undefined;
};

/** What the program's tailoring holds: its decisions, and the control each parameter value sets. */
export type TailoringContent = {
  decisions: readonly StackDecision[];
  parameters: readonly { sourceId: string; controlId: string | null }[];
};

/**
 * How a saved stack is made, as the command reads it: its overlays bottom up, and whether the
 * program's tailoring is its last layer. A layer no overlay accounts for anywhere but last is not
 * a stack the command can keep in order, and `supported` says so.
 */
export function stackShape(derivation: Pick<BaselineDerivation, "layers">): {
  overlayIds: string[];
  tailoring: boolean;
  supported: boolean;
} {
  const layers = derivation.layers;
  const overlayIds = layers.flatMap((layer) =>
    layer.kind === "overlay" && layer.overlayId ? [layer.overlayId] : [],
  );
  const tailoring = layers.at(-1)?.kind === "tailoring";
  const supported = layers.every(
    (layer, index) =>
      (layer.kind === "overlay" && !!layer.overlayId) ||
      (layer.kind === "tailoring" && index === layers.length - 1),
  );
  return { overlayIds, tailoring, supported };
}

/** The decisions of the program's tailoring as its saved layer records them. */
export function tailoringDecisions(
  derivation: Pick<BaselineDerivation, "layers">,
): StackDecision[] | null {
  const last = derivation.layers.at(-1);
  if (last?.kind !== "tailoring") return null;
  return last.effects.flatMap((row): StackDecision[] =>
    row.effect === "added"
      ? [{ controlId: row.controlId, action: "include", rationale: row.rationale }]
      : row.effect === "removed"
        ? [{ controlId: row.controlId, action: "exclude", rationale: row.rationale }]
        : [],
  );
}

export type TailoringCarry = {
  /** The tailoring is a layer of the new stack: something of it still changes the baseline. */
  authored: boolean;
  /** Its decisions that still change the stack beneath, and its parameter values still set. */
  decisions: number;
  parameters: number;
  /** Adds of controls the new stack already selects, by control id. */
  alreadySelected: string[];
  /** Removals of controls the new stack leaves out, by control id. */
  notInBaseline: string[];
  /** The parameter values of controls the new stack no longer selects, by parameter id. */
  parametersDropped: string[];
};

export type RestackPreview = {
  /** The new stack: the reference baseline, each overlay, and the tailoring while it changes something. */
  derivation: BaselineDerivation;
  /** Against the current control baseline, by control id. */
  added: string[];
  removed: string[];
  /** The overlays that change nothing where they sit (no control and no value), which the command refuses. */
  idle: string[];
  /** What becomes of the program's tailoring; `null` for a stack without one. */
  tailoring: TailoringCarry | null;
};

const overlayLayer = (overlay: StackOverlay): StackLayerInput => ({
  key: overlay.id,
  kind: "overlay",
  title: overlay.title,
  overlayId: overlay.id,
  decisions: overlay.decisions,
});

/**
 * The stack the command will author for these overlays, read as the stack table reads one: the
 * reference baseline of the current stack, each overlay applied to what is beneath it, then the
 * program's tailoring with the decisions that still change something. A tailoring decision the
 * new stack already makes true, and a parameter value of a control it no longer selects, are left
 * out; a tailoring left with nothing is no layer at all.
 */
export function restackPreview(
  current: Pick<BaselineDerivation, "layers" | "selected">,
  overlays: readonly StackOverlay[],
  tailoring: TailoringContent | null,
): RestackPreview {
  const reference = stackAt(current, 0).selected;
  const layers = overlays.map(overlayLayer);
  // An overlay's values count where the layer it makes selects their controls, as applying it
  // authors them; the tailoring's are those it keeps.
  const valuesOf = (key: string) => overlays.find((overlay) => overlay.id === key)?.parameters;
  const stacked = withParameters(deriveStack(reference, layers), valuesOf);
  const idle = stacked.layers.filter(idleLayer).map((layer) => layer.key);
  let derivation = stacked;
  let carry: TailoringCarry | null = null;
  if (tailoring) {
    const beneath = stacked.selected;
    const kept = tailoring.decisions.filter(
      (decision) => (decision.action === "include") !== beneath.has(decision.controlId),
    );
    const selected = new Set(beneath);
    for (const decision of kept)
      if (decision.action === "include") selected.add(decision.controlId);
      else selected.delete(decision.controlId);
    const parameters = tailoring.parameters.filter(
      (parameter) => !!parameter.controlId && selected.has(parameter.controlId),
    );
    carry = {
      authored: kept.length > 0 || parameters.length > 0,
      decisions: kept.length,
      parameters: parameters.length,
      alreadySelected: tailoring.decisions
        .filter((decision) => decision.action === "include" && beneath.has(decision.controlId))
        .map((decision) => decision.controlId),
      notInBaseline: tailoring.decisions
        .filter((decision) => decision.action === "exclude" && !beneath.has(decision.controlId))
        .map((decision) => decision.controlId),
      parametersDropped: tailoring.parameters
        .filter((parameter) => !parameter.controlId || !selected.has(parameter.controlId))
        .map((parameter) => parameter.sourceId),
    };
    if (carry.authored)
      derivation = withParameters(
        deriveStack(reference, [
          ...layers,
          { key: "tailoring", kind: "tailoring", title: "Program tailoring", decisions: kept },
        ]),
        (key) => (key === "tailoring" ? parameters : valuesOf(key)),
      );
  }
  return {
    derivation,
    added: [...derivation.selected].filter((id) => !current.selected.has(id)),
    removed: [...current.selected].filter((id) => !derivation.selected.has(id)),
    idle,
    tailoring: carry,
  };
}

const uuid = z.string().uuid();
const answerSchema = z.object({
  choiceId: uuid,
  programId: uuid,
  changed: z.boolean(),
  profileResolutionId: uuid,
  previousProfileResolutionId: uuid,
  revision: z.number().int(),
  overlayIds: z.array(uuid),
  controls: z.object({
    before: z.number().int(),
    after: z.number().int(),
    added: z.number().int(),
    removed: z.number().int(),
  }),
  tailoring: z
    .object({
      authored: z.boolean(),
      decisions: z.number().int(),
      parameters: z.number().int(),
      alreadySelected: z.array(z.string()),
      notInBaseline: z.array(z.string()),
      parametersDropped: z.array(z.string()),
    })
    .nullable(),
  systems: z.array(z.object({ id: uuid, code: z.string() })),
  ssps: z.array(
    z.object({
      id: uuid,
      systemId: uuid,
      systemCode: z.string(),
      version: z.number().int(),
      state: z.string(),
    }),
  ),
});
/** What the command answers: the new top, what it counted, and what it moved and left. */
export type ProgramOverlaysAnswer = z.infer<typeof answerSchema>;

export type ProgramOverlaysRequest = {
  /** The program profile: its `program_reference_choices` row. */
  choiceId: string;
  /** The choice's revision the reader saw. */
  expectedRevision: number;
  /** Chosen again whenever the overlays asked for change, so a retry of one choice is that choice. */
  requestId: string;
  /** The overlays in the order they apply, bottom up. */
  overlayIds: readonly string[];
};

/**
 * Change the overlays of one program profile's stack. A request sent again answers what it
 * answered; the overlays the stack already holds, in its order, write nothing; a stale revision
 * and the same request id with another choice are refused with the command's words.
 */
export async function setProgramBaselineOverlays(
  client: Client,
  { tenantId, token }: ReadContext,
  request: ProgramOverlaysRequest,
): Promise<ProgramOverlaysAnswer> {
  const { data, error } = await client
    .rpc("set_program_baseline_overlays", {
      p_tenant_id: tenantId,
      p_choice_id: request.choiceId,
      p_expected_revision: request.expectedRevision,
      p_request_id: request.requestId,
      p_overlay_ids: [...request.overlayIds],
    })
    .setHeader("Authorization", `Bearer ${token}`);
  if (error) throw new ProgramOverlaysError(error.message, error.code === "PT409");
  return answerSchema.parse(data);
}

/** A refusal of the command, with whether it was another session's change (a stale revision). */
export class ProgramOverlaysError extends Error {
  constructor(
    message: string,
    readonly conflict: boolean,
  ) {
    super(message);
    this.name = "ProgramOverlaysError";
  }
}

const READ_PREFIXES = ["models", "model", "records", "record", "reference-options"];
/** What a stack is read from: the new layers' records, and what moved with them. */
const STACK_TABLES = new Set([
  "profile_resolutions",
  "profile_revisions",
  "profiles",
  "profile_imports",
  "profile_rules",
  "profile_overlay_applications",
  "control_overlays",
  "systems",
  "ssp_revisions",
]);
const CHOICES = "program_reference_choices";
const tableOf = (query: Query) => query.queryKey[2];

/** Read the stack again: the layers' records first, then the program's choice. */
async function readStackAgain(cache: QueryClient, tenant: string) {
  await Promise.all(
    [...STACK_TABLES].map((table) =>
      cache.invalidateQueries({ queryKey: ["models", tenant, table] }),
    ),
  );
  await cache.invalidateQueries({ queryKey: ["models", tenant, CHOICES] });
}

/**
 * The command as a mutation. It resolves once the stack reads again: the layers' records first,
 * then the program's choice, so the choice never names a top its chain cannot read yet. Every
 * other read of the workspace refreshes behind it. Another session's change refused it: the stack
 * reads again behind the dialog, so the next Edit overlays starts from the stack as it is now.
 */
export function useSetProgramBaselineOverlays() {
  const workspace = useWorkspace();
  const cache = useQueryClient();
  return useMutation<ProgramOverlaysAnswer, Error, ProgramOverlaysRequest>({
    mutationFn: async (request) =>
      setProgramBaselineOverlays(
        database(),
        { tenantId: workspace.tenantId, token: await requireIdentity(workspace) },
        request,
      ),
    onSuccess: async () => {
      const tenant = workspace.tenantId;
      void Promise.all(
        READ_PREFIXES.map((prefix) =>
          cache.invalidateQueries({
            queryKey: [prefix, tenant],
            predicate: (query) =>
              !(
                query.queryKey[0] === "models" &&
                (STACK_TABLES.has(String(tableOf(query))) || tableOf(query) === CHOICES)
              ),
          }),
        ),
      );
      await readStackAgain(cache, tenant);
    },
    onError: (error) => {
      if (error instanceof ProgramOverlaysError && error.conflict)
        void readStackAgain(cache, workspace.tenantId);
    },
  });
}
