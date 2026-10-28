import { useQuery } from "@tanstack/react-query";
import { createClient } from "@supabase/supabase-js";
import { useWorkspace } from "@/components/app/workspace";
import { database, requireIdentity } from "./database";
import {
  citationRectangleSchema,
  verifyCitationFile,
  type AssuranceCitation,
} from "./assurance-review";
import { z } from "zod";
import { MAX_READER_BYTES, boundedEvidenceResponse } from "./evidence-reader-bytes";
export { MAX_READER_BYTES } from "./evidence-reader-bytes";
export const readerLocationSchema = z.object({
  page: z.number().int().min(1).max(100000),
  rectangle: citationRectangleSchema,
});
export function readerPassageHref(
  versionId: string,
  location: z.infer<typeof readerLocationSchema>,
  sha256?: string,
) {
  z.string().uuid().parse(versionId);
  readerLocationSchema.parse(location);
  const hash = sha256
    ? z
        .string()
        .regex(/^[0-9a-f]{64}$/)
        .parse(sha256)
    : undefined;
  return `/evidence?version=${versionId}&reader=true&page=${location.page}&rectangle=${encodeURIComponent(JSON.stringify(location.rectangle))}${hash ? `&sha256=${hash}` : ""}`;
}
/** Download the captured citation object, or the version's current private object, and verify
 * its recorded digest before the bytes reach the renderer. No public/signed URL is retained. */
export function useEvidenceReaderBytes(
  versionId: string,
  citation?: AssuranceCitation,
  passageSha?: string,
) {
  const workspace = useWorkspace();
  return useQuery({
    queryKey: ["evidence-reader", workspace.tenantId, versionId, citation?.id, passageSha],
    enabled: Boolean(versionId),
    staleTime: 0,
    gcTime: 0,
    retry: false,
    queryFn: async ({ signal }) => {
      const token = await requireIdentity(workspace);
      const { data: version, error } = await database()
        .from("evidence_versions")
        .select("*,artifact:evidence_artifacts!inner(title,program_id,source_uri)")
        .eq("tenant_id", workspace.tenantId)
        .eq("id", z.string().uuid().parse(versionId))
        .setHeader("Authorization", `Bearer ${token}`)
        .abortSignal(signal)
        .single();
      if (error) throw new Error(error.message);
      if (
        citation &&
        (citation.tenant_id !== workspace.tenantId || citation.evidence_version_id !== versionId)
      )
        throw new Error("This citation does not belong to the selected evidence version.");
      let path = citation ? citation.source_storage_object_name : version.storage_object_name;
      const hash = citation?.evidence_sha256 ?? passageSha ?? version.sha256;
      // A passage link can name older bytes only when a server-captured thread pins them.
      // The URL supplies a digest, never an arbitrary storage path.
      if (!citation && passageSha && passageSha !== version.sha256) {
        z.string()
          .regex(/^[0-9a-f]{64}$/)
          .parse(passageSha);
        const { data: captures, error: captureError } = await database()
          .from("assurance_review_threads")
          .select("target_context")
          .eq("tenant_id", workspace.tenantId)
          .eq("target->>kind", "passage")
          .eq("target->>recordId", versionId)
          .eq("target->>sha256", passageSha)
          .order("created_at")
          .limit(1)
          .setHeader("Authorization", `Bearer ${token}`)
          .abortSignal(signal);
        if (captureError) throw new Error(captureError.message);
        const context = captures?.[0]?.target_context as Record<string, unknown> | undefined;
        if (typeof context?.["sourceStorageObjectName"] !== "string")
          throw new Error(
            "This passage's source file has changed and no captured discussion retains its original file. Open the current evidence version to select a new passage.",
          );
        path = context["sourceStorageObjectName"];
      }
      if (!path || !hash)
        throw new Error(
          "Attach a PDF file with its recorded SHA-256 to read it here. External sources remain available through Open external artifact.",
        );
      if (
        path === version.storage_object_name &&
        version.byte_size &&
        version.byte_size > MAX_READER_BYTES
      )
        throw new Error("This file is too large for the reader (50 MiB maximum).");
      const client = createClient(
        import.meta.env["VITE_SUPABASE_URL"],
        import.meta.env["VITE_SUPABASE_ANON_KEY"],
        {
          accessToken: async () => token,
          global: {
            fetch: async (input, init) =>
              boundedEvidenceResponse(
                await fetch(input, {
                  ...init,
                  signal: AbortSignal.any([signal, AbortSignal.timeout(120000)]),
                }),
              ),
          },
        },
      );
      const { data: blob, error: downloadError } = await client.storage
        .from("evidence")
        .download(path);
      if (downloadError) throw new Error(downloadError.message);
      signal.throwIfAborted();
      if (blob.size > MAX_READER_BYTES)
        throw new Error("This file is too large for the reader (50 MiB maximum).");
      await verifyCitationFile(blob, hash);
      await requireIdentity(workspace);
      signal.throwIfAborted();
      const bytes = new Uint8Array(await blob.arrayBuffer());
      if (!new TextDecoder().decode(bytes.slice(0, 1024)).includes("%PDF-"))
        throw new Error(
          "This attachment is not a PDF. Download it from the evidence version to open it in its native application.",
        );
      return { bytes, version, sha256: hash, path };
    },
  });
}

/** Bounded target picker for a citation created from the document itself. */
export function useReaderCitationTargets(
  kind: "requirement" | "assessment-finding",
  search: string,
) {
  const workspace = useWorkspace();
  return useQuery({
    queryKey: ["citation-targets", workspace.tenantId, kind, search],
    queryFn: async ({ signal }) => {
      const token = await requireIdentity(workspace);
      const escaped = search.replaceAll("%", "\\%").replaceAll("_", "\\_");
      const query = database()
        .from(kind === "requirement" ? "engineering_requirements" : "assessment_findings")
        .select(kind === "requirement" ? "id,code" : "id,title")
        .eq("tenant_id", workspace.tenantId)
        .ilike(kind === "requirement" ? "code" : "title", `%${escaped}%`)
        .order(kind === "requirement" ? "code" : "title")
        .order("id")
        .limit(25)
        .setHeader("Authorization", `Bearer ${token}`)
        .abortSignal(signal);
      const { data, error } = await query;
      if (error) throw new Error(error.message);
      return (data ?? []).map((row) => {
        const value = row as unknown as { id: string; code?: string; title?: string };
        return { id: value.id, label: value.code ?? value.title ?? value.id };
      });
    },
  });
}
