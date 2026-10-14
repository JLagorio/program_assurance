import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { useWorkspace } from "@/components/app/workspace";
import { database, requireIdentity } from "./database";
import { requirementPatchSchema, requirementTypes } from "./requirement-edit";

/** A workbook is a complete bounded program snapshot, never a loaded register page. */
export const ASSURANCE_WORKBOOK_ROW_LIMIT = 10_000;
export const ASSURANCE_CHANGE_LIMIT = 1000;
export const ASSURANCE_DOCUMENT_BYTES = 5_000_000;
export const mappingRelationships = ["derived_from", "maps_to", "satisfies"] as const;

const uuid = z.string().uuid();
const revision = z.number().int().positive();
const nullableText = z.string().nullable();
const jsonObject = z.record(z.unknown());

/** Authored fields share the existing command's validation; labels and bindings are domain data. */
export const requirementWorkbookFields = [
  { key: "title", patch: "title", label: "Title", kind: "text", required: true },
  { key: "statement", patch: "statement", label: "Statement", kind: "text", required: true },
  {
    key: "acceptance_criteria",
    patch: "acceptanceCriteria",
    label: "Acceptance criteria",
    kind: "text",
    required: true,
  },
  { key: "rationale", patch: "rationale", label: "Rationale", kind: "text", required: false },
  {
    key: "requirement_type",
    patch: "requirementType",
    label: "Type",
    kind: "choice",
    required: true,
    options: requirementTypes,
  },
  { key: "owner_party_id", patch: "ownerPartyId", label: "Owner", kind: "record", required: false },
] as const;
export type RequirementWorkbookField = (typeof requirementWorkbookFields)[number]["key"];

export const assuranceRequirementRowSchema = z.object({
  id: uuid,
  tenant_id: uuid,
  program_id: uuid,
  code: z.string(),
  content_id: uuid.nullable(),
  revision: revision.nullable(),
  title: nullableText,
  statement: nullableText,
  acceptance_criteria: nullableText,
  rationale: nullableText,
  requirement_type: z.enum(requirementTypes).nullable(),
  owner_party_id: uuid.nullable(),
  owner_name: nullableText,
  allocation: z.string(),
  control_mapping: z.string(),
  allocated_to: nullableText,
  linked_controls: nullableText,
  allocations: z.array(jsonObject),
  control_sources: z.array(jsonObject),
  parent_id: uuid.nullable(),
  ancestors: z.array(uuid),
  depth: z.number().int().nonnegative(),
  unstructured: z.boolean(),
  evidence_count: z.number().int().nonnegative(),
  verification_count: z.number().int().nonnegative(),
  updated_at: nullableText,
});
export type AssuranceRequirementRow = z.infer<typeof assuranceRequirementRowSchema>;

export const assuranceMappingRowSchema = z.object({
  id: uuid,
  tenant_id: uuid,
  program_id: uuid,
  revision,
  requirement_id: uuid,
  requirement_code: z.string(),
  requirement_title: z.string(),
  content_id: uuid,
  control_id: uuid,
  catalog_revision_id: uuid.nullable(),
  control_code: nullableText,
  control_title: nullableText,
  control_part_id: uuid.nullable(),
  part_name: nullableText,
  control_part_prose: nullableText,
  system_id: uuid.nullable(),
  system_code: nullableText,
  system_name: nullableText,
  selected_control_id: uuid.nullable(),
  relationship_type: z.enum(mappingRelationships),
  rationale: nullableText,
  scope_label: z.string(),
  profile_resolution_id: uuid.nullable(),
  baseline_source_system_id: uuid.nullable(),
  baseline_source: nullableText,
  baseline_inherited: z.boolean().nullable(),
  needs_review: z.boolean(),
  updated_at: z.string(),
});
export type AssuranceMappingRow = z.infer<typeof assuranceMappingRowSchema>;

const allocationRowSchema = z.object({
  id: uuid,
  revision,
  requirement_id: uuid,
  requirement_code: z.string(),
  content_id: uuid,
  system_id: uuid.nullable(),
  system_code: nullableText,
  system_name: nullableText,
  provider_capability_id: uuid.nullable(),
  security_process_id: uuid.nullable(),
  rationale: nullableText,
});
export type AssuranceAllocationRow = z.infer<typeof allocationRowSchema>;

const evidenceRowSchema = z.object({
  id: uuid,
  revision,
  requirement_id: uuid,
  requirement_code: z.string(),
  content_id: uuid,
  evidence_version_id: uuid,
  claim: nullableText,
  applicability_rationale: nullableText,
  artifact_id: uuid,
  artifact_title: z.string(),
  version_number: z.number().int().positive(),
  state: z.enum(["draft", "published"]),
});
export type AssuranceEvidenceRow = z.infer<typeof evidenceRowSchema>;

const systemRowSchema = z.object({
  id: uuid,
  code: z.string(),
  name: z.string(),
  system_type: z.string(),
  parent_system_id: uuid.nullable(),
  profile_resolution_id: uuid.nullable(),
  source_system_id: uuid.nullable(),
  inherited: z.boolean().nullable(),
  source_label: nullableText,
});
export type AssuranceSystemRow = z.infer<typeof systemRowSchema>;

const selectedControlSchema = z.object({
  id: uuid,
  control_id: uuid,
  profile_resolution_id: uuid,
  control_code: z.string(),
  control_title: z.string(),
  catalog_revision_id: uuid,
});
export type AssuranceSelectedControl = z.infer<typeof selectedControlSchema>;

const savedWorkbookSchema = z.object({
  id: uuid,
  tenant_id: uuid,
  program_id: uuid,
  name: z.string(),
  document: jsonObject,
  schema_version: z.literal(1),
  revision,
  created_at: z.string(),
  updated_at: z.string(),
});
export type SavedAssuranceWorkbook = z.infer<typeof savedWorkbookSchema>;

const sheetNames = [
  "requirements",
  "mappings",
  "allocations",
  "evidence",
  "systems",
  "owners",
  "selectedControls",
] as const;
export const assuranceWorkbookSchema = z
  .object({
    complete: z.literal(true),
    programId: uuid,
    capturedAt: z.string(),
    requirements: z.array(assuranceRequirementRowSchema).max(ASSURANCE_WORKBOOK_ROW_LIMIT),
    mappings: z.array(assuranceMappingRowSchema).max(ASSURANCE_WORKBOOK_ROW_LIMIT),
    allocations: z.array(allocationRowSchema).max(ASSURANCE_WORKBOOK_ROW_LIMIT),
    evidence: z.array(evidenceRowSchema).max(ASSURANCE_WORKBOOK_ROW_LIMIT),
    systems: z.array(systemRowSchema).max(ASSURANCE_WORKBOOK_ROW_LIMIT),
    owners: z.array(z.object({ id: uuid, name: z.string() })).max(ASSURANCE_WORKBOOK_ROW_LIMIT),
    selectedControls: z.array(selectedControlSchema).max(ASSURANCE_WORKBOOK_ROW_LIMIT),
    counts: z.record(z.number().int().nonnegative()),
    workbook: savedWorkbookSchema.nullable(),
  })
  .superRefine((snapshot, context) => {
    for (const name of sheetNames)
      if (snapshot.counts[name] !== snapshot[name].length)
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: [name],
          message: `The ${name} sheet is incomplete. Reload the complete workbook.`,
        });
  });
export type AssuranceWorkbookSnapshot = z.infer<typeof assuranceWorkbookSchema>;

export const requirementWorkbookChangeSchema = z
  .object({
    requirementId: uuid,
    contentId: uuid,
    expectedRevision: revision,
    patch: requirementPatchSchema,
  })
  .strict();
export type RequirementWorkbookChange = z.infer<typeof requirementWorkbookChangeSchema>;

export const mappingPatchSchema = z
  .object({
    relationshipType: z.enum(mappingRelationships).optional(),
    rationale: z.string().trim().max(10000).nullable().optional(),
  })
  .strict();
export const mappingWorkbookChangeSchema = z.discriminatedUnion("operation", [
  z
    .object({
      operation: z.literal("update"),
      id: uuid,
      expectedRevision: revision,
      patch: mappingPatchSchema,
    })
    .strict(),
  z
    .object({
      operation: z.literal("create"),
      id: uuid,
      contentId: uuid,
      controlId: uuid,
      controlPartId: uuid.nullable().optional(),
      systemId: uuid,
      selectedControlId: uuid,
      relationshipType: z.enum(mappingRelationships),
      rationale: z.string().trim().max(10000).nullable().optional(),
    })
    .strict(),
  z.object({ operation: z.literal("delete"), id: uuid, expectedRevision: revision }).strict(),
]);
export type MappingWorkbookChange = z.infer<typeof mappingWorkbookChangeSchema>;

export const applyAssuranceChangesSchema = z
  .object({
    requestId: uuid,
    programId: uuid,
    requirements: z.array(requirementWorkbookChangeSchema).default([]),
    mappings: z.array(mappingWorkbookChangeSchema).default([]),
  })
  .strict()
  .superRefine((request, context) => {
    const count = request.requirements.length + request.mappings.length;
    if (count < 1 || count > ASSURANCE_CHANGE_LIMIT)
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Apply between 1 and ${ASSURANCE_CHANGE_LIMIT} records in one change set.`,
      });
    if (
      new Set(request.requirements.map((change) => change.requirementId)).size !==
        request.requirements.length ||
      new Set(request.mappings.map((change) => change.id)).size !== request.mappings.length
    )
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Combine each record into one change before applying.",
      });
  });
export type ApplyAssuranceChanges = z.input<typeof applyAssuranceChangesSchema>;

const mappingRecordSchema = z
  .object({
    id: uuid,
    revision,
    requirement_revision_id: uuid,
    control_id: uuid,
    control_part_id: uuid.nullable(),
    system_id: uuid.nullable(),
    selected_control_id: uuid.nullable(),
    relationship_type: z.enum(mappingRelationships),
    rationale: nullableText,
  })
  .passthrough();
const applyResultSchema = z.object({
  requestId: uuid,
  requirements: z.array(
    z.object({
      requirementId: uuid,
      contentId: uuid,
      revision,
      activityEventId: uuid.nullable(),
      changed: z.boolean(),
    }),
  ),
  mappings: z.array(
    z.object({
      id: uuid,
      operation: z.enum(["create", "update", "delete"]),
      revision: revision.nullable(),
      changed: z.boolean(),
      before: mappingRecordSchema.nullable(),
      after: mappingRecordSchema.nullable(),
    }),
  ),
});
export type ApplyAssuranceChangesResult = z.infer<typeof applyResultSchema>;

export const saveAssuranceWorkbookSchema = z
  .object({
    requestId: uuid,
    programId: uuid,
    workbookId: uuid,
    /** Zero creates the program's first workbook; later saves compare the recorded revision. */
    expectedRevision: z.number().int().nonnegative(),
    name: z.string().trim().min(1).max(200),
    /** Workbook metadata and analysis, not an alternate source of authoritative record fields. */
    document: jsonObject,
  })
  .strict()
  .superRefine((request, context) => {
    try {
      if (
        new TextEncoder().encode(JSON.stringify(request.document)).byteLength >
        ASSURANCE_DOCUMENT_BYTES
      )
        context.addIssue({ code: z.ZodIssueCode.custom, message: "Keep the workbook under 5 MB." });
    } catch {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "The workbook must be a JSON document.",
      });
    }
  });
export type SaveAssuranceWorkbook = z.infer<typeof saveAssuranceWorkbookSchema>;
const saveResultSchema = z.object({ id: uuid, revision, updatedAt: z.string() });
export type SaveAssuranceWorkbookResult = z.infer<typeof saveResultSchema>;

type Client = Pick<SupabaseClient, "rpc">;
type Context = { tenantId: string; token: string };

/** Normalize one bound cell with the exact authored field schema used by inline requirement edits. */
export function requirementCellPatch(field: RequirementWorkbookField, value: string | null) {
  const descriptor = requirementWorkbookFields.find((candidate) => candidate.key === field)!;
  const next = descriptor.required ? value : value?.trim() || null;
  return requirementPatchSchema.parse({ [descriptor.patch]: next });
}

/** One SQL read, one database snapshot, or a refusal. No array in the result is a partial page. */
export async function readAssuranceWorkbook(
  client: Client,
  context: Context,
  programId: string,
  signal?: AbortSignal,
): Promise<AssuranceWorkbookSnapshot> {
  uuid.parse(programId);
  let query = client
    .rpc("read_assurance_workbook", {
      p_tenant_id: context.tenantId,
      p_program_id: programId,
      p_row_limit: ASSURANCE_WORKBOOK_ROW_LIMIT,
    })
    .setHeader("Authorization", `Bearer ${context.token}`);
  if (signal) query = query.abortSignal(signal);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  const snapshot = assuranceWorkbookSchema.parse(data);
  if (snapshot.programId !== programId)
    throw new Error("The workbook returned a different program. Reload before editing.");
  return snapshot;
}

/** Every requirement and mapping change either commits together or leaves no changes behind. */
export async function applyAssuranceChanges(
  client: Client,
  context: Context,
  request: ApplyAssuranceChanges,
): Promise<ApplyAssuranceChangesResult> {
  const values = applyAssuranceChangesSchema.parse(request);
  const { data, error } = await client
    .rpc("apply_assurance_changes", {
      p_tenant_id: context.tenantId,
      p_program_id: values.programId,
      p_request_id: values.requestId,
      p_requirements: values.requirements,
      p_mappings: values.mappings,
    })
    .setHeader("Authorization", `Bearer ${context.token}`);
  if (error) throw new Error(error.message);
  return applyResultSchema.parse(data);
}

/** Saves analysis and layout with its own compare-and-swap revision and idempotency receipt. */
export async function saveAssuranceWorkbook(
  client: Client,
  context: Context,
  request: SaveAssuranceWorkbook,
): Promise<SaveAssuranceWorkbookResult> {
  const values = saveAssuranceWorkbookSchema.parse(request);
  const { data, error } = await client
    .rpc("save_assurance_workbook", {
      p_tenant_id: context.tenantId,
      p_program_id: values.programId,
      p_request_id: values.requestId,
      p_workbook_id: values.workbookId,
      p_expected_revision: values.expectedRevision,
      p_name: values.name,
      p_document: values.document,
    })
    .setHeader("Authorization", `Bearer ${context.token}`);
  if (error) throw new Error(error.message);
  return saveResultSchema.parse(data);
}

export const assuranceWorkbookKey = (tenantId: string, programId?: string) =>
  programId
    ? (["assurance-workbook", tenantId, programId] as const)
    : (["assurance-workbook", tenantId] as const);

export function useAssuranceWorkbook(programId: string) {
  const workspace = useWorkspace();
  return useQuery({
    queryKey: assuranceWorkbookKey(workspace.tenantId, programId),
    queryFn: async ({ signal }) => {
      const token = await requireIdentity(workspace);
      const snapshot = await readAssuranceWorkbook(
        database(),
        { tenantId: workspace.tenantId, token },
        programId,
        signal,
      );
      await requireIdentity(workspace);
      return snapshot;
    },
    retry: false,
    refetchOnWindowFocus: true,
  });
}

export function useApplyAssuranceChanges() {
  const workspace = useWorkspace();
  const cache = useQueryClient();
  return useMutation<ApplyAssuranceChangesResult, Error, ApplyAssuranceChanges>({
    mutationFn: async (request) => {
      const token = await requireIdentity(workspace);
      const result = await applyAssuranceChanges(
        database(),
        { tenantId: workspace.tenantId, token },
        request,
      );
      await requireIdentity(workspace);
      return result;
    },
    onSuccess: (_result, request) => {
      void cache.invalidateQueries({
        queryKey: assuranceWorkbookKey(workspace.tenantId, request.programId),
      });
      for (const table of ["requirement_revisions", "requirement_control_links", "activity_events"])
        for (const prefix of ["models", "model", "records", "record", "reference-options"])
          void cache.invalidateQueries({ queryKey: [prefix, workspace.tenantId, table] });
    },
  });
}

export function useSaveAssuranceWorkbook() {
  const workspace = useWorkspace();
  const cache = useQueryClient();
  return useMutation<SaveAssuranceWorkbookResult, Error, SaveAssuranceWorkbook>({
    mutationFn: async (request) => {
      const token = await requireIdentity(workspace);
      const result = await saveAssuranceWorkbook(
        database(),
        { tenantId: workspace.tenantId, token },
        request,
      );
      await requireIdentity(workspace);
      return result;
    },
    onSuccess: (_result, request) =>
      void cache.invalidateQueries({
        queryKey: assuranceWorkbookKey(workspace.tenantId, request.programId),
      }),
  });
}
