import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useWorkspace } from "@/components/app/workspace";
import { database, requireIdentity } from "./database";

const selectionSchema = z.object({
  programId: z.string().uuid(),
  requirementRevisionId: z.string().uuid(),
  evidenceVersionIds: z.array(z.string().uuid()).min(1).max(500),
});
const resultSchema = z.object({ linkIds: z.array(z.string().uuid()) });

export function useLinkRequirementEvidence() {
  const workspace = useWorkspace();
  const cache = useQueryClient();
  return useMutation({
    mutationFn: async (selection: z.infer<typeof selectionSchema>) => {
      const values = selectionSchema.parse(selection);
      const token = await requireIdentity(workspace);
      const { data, error } = await database()
        .rpc("link_requirement_evidence", {
          p_tenant_id: workspace.tenantId,
          p_program_id: values.programId,
          p_requirement_revision_id: values.requirementRevisionId,
          p_evidence_version_ids: values.evidenceVersionIds,
        })
        .setHeader("Authorization", `Bearer ${token}`);
      if (error) throw new Error(error.message);
      await requireIdentity(workspace);
      return resultSchema.parse(data);
    },
    onSuccess: async () => {
      await Promise.all(
        ["models", "model", "records", "record", "reference-options"].map((key) =>
          cache.invalidateQueries({ queryKey: [key, workspace.tenantId, "requirement_evidence"] }),
        ),
      );
    },
  });
}
