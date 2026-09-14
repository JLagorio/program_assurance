import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useWorkspace } from "@/components/app/workspace";
import { database, requireIdentity } from "./database";

const externalReference = z
  .string()
  .trim()
  .max(4000)
  .refine((value) => {
    if (!value) return true;
    try {
      return ["http:", "https:", "urn:"].includes(new URL(value).protocol) && !/\s/.test(value);
    } catch {
      return false;
    }
  }, "Enter an absolute HTTP, HTTPS, or URN evidence reference.");
export const createEvidenceSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, "Enter an artifact title.")
      .max(1000, "Use at most 1000 characters for the title."),
    artifactKind: z.enum(
      ["document", "image", "dataset", "log", "scan", "interview", "test_record", "other"],
      { message: "Choose an evidence kind." },
    ),
    programId: z.string().uuid("Choose an existing program.").nullable(),
    scopeId: z.string().uuid("Choose an existing scope.").nullable(),
    ownerPartyId: z.string().uuid("Choose an existing owner.").nullable(),
    description: z.string().trim().max(10000, "Use at most 10000 characters for the description."),
    externalUri: externalReference,
    collectedAt: z
      .string()
      .datetime({ offset: true, message: "Enter a valid collection date and time." })
      .nullable(),
    provenance: z.string().trim().max(10000, "Use at most 10000 characters for provenance."),
  })
  .strict()
  .refine((value) => !value.scopeId || !!value.programId, {
    message: "Choose a program before selecting a scope.",
    path: ["scopeId"],
  });
export type CreateEvidenceInput = z.infer<typeof createEvidenceSchema>;
const resultSchema = z.object({ artifactId: z.string().uuid(), versionId: z.string().uuid() });
export type CreateEvidenceResult = z.infer<typeof resultSchema>;

export function useCreateEvidence() {
  const workspace = useWorkspace();
  const cache = useQueryClient();
  return useMutation<
    CreateEvidenceResult,
    Error,
    { requestId: string; values: CreateEvidenceInput }
  >({
    mutationFn: async ({ requestId, values }) => {
      const parsed = createEvidenceSchema.safeParse(values);
      if (!parsed.success)
        throw new Error(parsed.error.issues[0]?.message ?? "Complete the evidence details.");
      z.string().uuid().parse(requestId);
      const token = await requireIdentity(workspace);
      const { data, error } = await database()
        .rpc("create_evidence_with_version", {
          p_tenant_id: workspace.tenantId,
          p_request_id: requestId,
          p_evidence: parsed.data,
        })
        .setHeader("Authorization", `Bearer ${token}`);
      if (error) throw new Error(error.message);
      await requireIdentity(workspace);
      return resultSchema.parse(data);
    },
    onSuccess: async () => {
      await Promise.all(
        ["evidence_artifacts", "evidence_versions"].flatMap((table) =>
          ["models", "model", "records", "record", "reference-options"].map((key) =>
            cache.invalidateQueries({ queryKey: [key, workspace.tenantId, table] }),
          ),
        ),
      );
    },
  });
}
