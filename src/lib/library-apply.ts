import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useWorkspace } from "@/components/app/workspace";
import { database, requireIdentity } from "./database";
import { systemWizardSchema } from "./program-wizard";

const uuid = z.string().uuid();
export const applySelectionSchema = z
  .object({
    sourceRevisionId: uuid,
    definedComponentId: uuid,
    targets: z
      .array(
        z.object({
          systemId: uuid,
          expectedRevision: z.number().int().positive(),
          code: z.string().trim().min(1, "Give the component instance a code."),
          name: z.string().trim().min(1, "Give the component instance a name."),
          /** Make the component an element of the tree under this target, carrying the instance. */
          createElement: z
            .object({
              code: z.string().trim().min(1, "Give the element a code."),
              name: z.string().trim().min(1, "Give the element a name."),
              type: z.string().trim().optional(),
            })
            .strict()
            .nullable()
            .optional(),
        }),
      )
      .min(1, "Choose at least one element."),
    controlIds: z.array(uuid).nullable(),
    excluded: z.array(z.object({ systemId: uuid, controlId: uuid })),
    includeDescendants: z.boolean(),
    rationale: z.string().trim().min(1, "Record why this library item applies here."),
  })
  .strict();
export type ApplySelection = z.infer<typeof applySelectionSchema>;
const applyResultSchema = z.object({
  assignmentId: uuid,
  sourceRevisionId: uuid,
  definedComponentId: uuid,
  targets: z.array(
    z.object({
      systemId: uuid,
      systemComponentId: uuid,
      elementId: uuid.optional(),
      state: z.string(),
      accepted: z.number().optional(),
      excluded: z.number().optional(),
      notInBaseline: z.number().optional(),
      noSsp: z.number().optional(),
    }),
  ),
});
export type ApplyResult = z.infer<typeof applyResultSchema>;

const invalidated = [
  "system_components",
  "component_contributions",
  "implemented_requirements",
  "implementation_statements",
  "library_assignments",
  "library_assignment_targets",
  "evidence_uses",
  "implementation_evidence",
  "requirement_evidence",
  "engineering_requirements",
  "requirement_revisions",
  "requirement_allocations",
  "systems",
  "composition_nodes",
  "ssp_revisions",
  "system_effective_baselines",
];

type CommandResult = { data: unknown; error: { code?: string; message: string } | null };

function useLibraryCommand<TRequest, TResult>(
  run: (request: TRequest, tenantId: string, token: string) => PromiseLike<CommandResult>,
  parse: (data: unknown) => TResult,
) {
  const workspace = useWorkspace();
  const cache = useQueryClient();
  return useMutation<TResult, Error, TRequest>({
    mutationFn: async (request) => {
      const token = await requireIdentity(workspace);
      const result = await run(request, workspace.tenantId, token);
      if (result.error)
        throw new Error(
          result.error.code === "PT409"
            ? "This changed in another session. Reload before trying again."
            : result.error.message,
        );
      return parse(result.data);
    },
    onSuccess: async () => {
      await Promise.all(
        invalidated.flatMap((table) =>
          ["models", "model", "records", "record", "reference-options"].map((key) =>
            cache.invalidateQueries({ queryKey: [key, workspace.tenantId, table] }),
          ),
        ),
      );
    },
  });
}

/** Apply one component of a published library version to one or more elements. */
export function useApplyLibrarySource() {
  return useLibraryCommand<
    { programId: string; requestId: string; selection: ApplySelection },
    ApplyResult
  >(
    (request, tenantId, token) => {
      const parsed = applySelectionSchema.safeParse(request.selection);
      if (!parsed.success)
        throw new Error(parsed.error.issues[0]?.message ?? "Complete the selection.");
      return database()
        .rpc("apply_library_source", {
          p_tenant_id: tenantId,
          p_program_id: request.programId,
          p_request_id: request.requestId,
          p_selection: parsed.data,
        })
        .setHeader("Authorization", `Bearer ${token}`);
    },
    (data) => applyResultSchema.parse(data),
  );
}

export const adoptSelectionSchema = z
  .object({
    definitionRevisionId: uuid,
    targets: z.array(z.object({ systemId: uuid })),
    code: z.string().trim().optional(),
    rationale: z.string().trim().nullable(),
  })
  .strict();
export type AdoptSelection = z.infer<typeof adoptSelectionSchema>;
const adoptResultSchema = z.object({
  assignmentId: uuid,
  requirementId: uuid,
  revisionId: uuid,
  created: z.boolean(),
  allocations: z.number(),
});
export type AdoptResult = z.infer<typeof adoptResultSchema>;

/** Adopt a reusable requirement by reference and allocate it to the chosen elements. */
export function useAdoptRequirementDefinition() {
  return useLibraryCommand<
    { programId: string; requestId: string; selection: AdoptSelection },
    AdoptResult
  >(
    (request, tenantId, token) => {
      const parsed = adoptSelectionSchema.safeParse(request.selection);
      if (!parsed.success)
        throw new Error(parsed.error.issues[0]?.message ?? "Complete the selection.");
      return database()
        .rpc("adopt_requirement_definition", {
          p_tenant_id: tenantId,
          p_program_id: request.programId,
          p_request_id: request.requestId,
          p_selection: parsed.data,
        })
        .setHeader("Authorization", `Bearer ${token}`);
    },
    (data) => adoptResultSchema.parse(data),
  );
}

const decideResultSchema = z.object({ id: uuid, decision: z.string(), revision: z.number() });
/** Accept a proposed evidence use (linking the exact version as support) or record it as not applicable. */
export function useDecideEvidenceUse() {
  return useLibraryCommand<
    {
      useId: string;
      expectedRevision: number;
      decision: "accepted" | "not_applicable";
      rationale: string | null;
    },
    z.infer<typeof decideResultSchema>
  >(
    (request, tenantId, token) =>
      database()
        .rpc("decide_evidence_use", {
          p_tenant_id: tenantId,
          p_use_id: request.useId,
          p_expected_revision: request.expectedRevision,
          p_decision: request.decision,
          p_rationale: request.rationale ?? "",
        })
        .setHeader("Authorization", `Bearer ${token}`),
    (data) => decideResultSchema.parse(data),
  );
}

const updateResultSchema = z.object({
  assignmentId: uuid,
  supersededAssignmentId: uuid,
  repinned: z.number(),
  updated: z.number(),
  keptLocal: z.number(),
  conflicting: z.number(),
  seeded: z.number(),
});
export type UpdateResult = z.infer<typeof updateResultSchema>;
/** Take an assignment to a newer published version of the same definition. */
export function useUpdateLibraryAssignment() {
  return useLibraryCommand<
    { assignmentId: string; newRevisionId: string; requestId: string; rationale: string },
    UpdateResult
  >(
    (request, tenantId, token) =>
      database()
        .rpc("update_library_assignment", {
          p_tenant_id: tenantId,
          p_assignment_id: request.assignmentId,
          p_new_revision_id: request.newRevisionId,
          p_request_id: request.requestId,
          p_rationale: request.rationale,
        })
        .setHeader("Authorization", `Bearer ${token}`),
    (data) => updateResultSchema.parse(data),
  );
}

/** The existing baseline command, so Add from library can apply a profile the same way the Controls tab does. */
export type BaselineSelection =
  | { mode: "inherit" }
  | {
      mode: "adopt";
      catalogRevisionId: string;
      profileResolutionId: string;
      controlIds: string[];
      rationale: string;
    };
export function useAdoptBaseline() {
  return useLibraryCommand<
    { systemId: string; expectedRevision: number; requestId: string; selection: BaselineSelection },
    { systemId: string; revision: number }
  >(
    (request, tenantId, token) =>
      database()
        .rpc("adopt_system_baseline", {
          p_tenant_id: tenantId,
          p_system_id: request.systemId,
          p_expected_revision: request.expectedRevision,
          p_request_id: request.requestId,
          p_selection: request.selection,
        })
        .setHeader("Authorization", `Bearer ${token}`),
    (data) => z.object({ systemId: uuid, revision: z.number() }).parse(data),
  );
}

/** One system added to an existing program: the wizard's system shape with the program profile named. */
export const addProgramSystemSchema = systemWizardSchema
  .omit({ profileKey: true })
  .extend({ profileResolutionId: uuid })
  .strict();
export type AddProgramSystem = z.infer<typeof addProgramSystemSchema>;
const addProgramSystemResultSchema = z.object({
  systemId: uuid,
  elements: z.array(z.object({ key: uuid, systemId: uuid, systemComponentId: uuid.nullable() })),
});
export type AddProgramSystemResult = z.infer<typeof addProgramSystemResultSchema>;
export function useAddProgramSystem() {
  return useLibraryCommand<
    { programId: string; requestId: string; system: AddProgramSystem },
    AddProgramSystemResult
  >(
    (request, tenantId, token) => {
      const parsed = addProgramSystemSchema.safeParse(request.system);
      if (!parsed.success)
        throw new Error(parsed.error.issues[0]?.message ?? "Complete the system details.");
      return database()
        .rpc("add_program_system", {
          p_tenant_id: tenantId,
          p_program_id: request.programId,
          p_request_id: request.requestId,
          p_system: parsed.data,
        })
        .setHeader("Authorization", `Bearer ${token}`);
    },
    (data) => addProgramSystemResultSchema.parse(data),
  );
}
