import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useWorkspace } from "@/components/app/workspace";
import { database, requireIdentity } from "./database";

export const requirementPatchSchema = z
  .object({
    title: z.string().trim().min(1, "Enter a title.").optional(),
    statement: z.string().trim().min(1, "Enter a requirement statement.").optional(),
    acceptanceCriteria: z.string().trim().min(1, "Enter acceptance criteria.").optional(),
    rationale: z.string().trim().nullable().optional(),
    requirementType: z
      .enum([
        "functional",
        "performance",
        "interface",
        "security",
        "safety",
        "design",
        "operational",
        "other",
      ])
      .optional(),
    ownerPartyId: z.string().uuid("Choose an existing owner.").nullable().optional(),
  })
  .strict();
export type RequirementPatch = z.infer<typeof requirementPatchSchema>;
const requestSchema = z
  .object({
    requestId: z.string().uuid(),
    requirementId: z.string().uuid(),
    contentId: z.string().uuid(),
    expectedRevision: z.number().int().positive(),
    patch: requirementPatchSchema,
  })
  .strict();
export type RequirementEditRequest = z.infer<typeof requestSchema>;
const resultSchema = z.object({
  requirementId: z.string().uuid(),
  contentId: z.string().uuid(),
  revision: z.number().int().positive(),
  activityEventId: z.string().uuid().nullable(),
  changed: z.boolean(),
});
export type RequirementEditResult = z.infer<typeof resultSchema>;

export function useEditRequirement() {
  const workspace = useWorkspace();
  const cache = useQueryClient();
  return useMutation<RequirementEditResult, Error, RequirementEditRequest>({
    mutationFn: async (request) => {
      const parsed = requestSchema.safeParse(request);
      if (!parsed.success)
        throw new Error(parsed.error.issues[0]?.message ?? "Complete the requirement details.");
      const values = parsed.data;
      const token = await requireIdentity(workspace);
      const { data, error } = await database()
        .rpc("edit_requirement", {
          p_tenant_id: workspace.tenantId,
          p_request_id: values.requestId,
          p_requirement_id: values.requirementId,
          p_content_id: values.contentId,
          p_expected_revision: values.expectedRevision,
          p_patch: values.patch,
        })
        .setHeader("Authorization", `Bearer ${token}`);
      if (error) throw new Error(error.message);
      await requireIdentity(workspace);
      return resultSchema.parse(data);
    },
    onSuccess: async () => {
      await Promise.all(
        ["requirement_revisions", "activity_events"].flatMap((table) =>
          ["models", "model", "records", "record", "reference-options"].map((key) =>
            cache.invalidateQueries({ queryKey: [key, workspace.tenantId, table] }),
          ),
        ),
      );
    },
  });
}
