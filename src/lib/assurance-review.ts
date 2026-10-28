import { useRef } from "react";
import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { useWorkspace } from "@/components/app/workspace";
import { database, requireIdentity } from "./database";

const uuid = z.string().uuid();
const stableId = z.string().regex(/^[A-Za-z0-9_-]{1,160}$/);
export const citationRectangleSchema = z
  .object({
    x: z.number().min(0).max(1),
    y: z.number().min(0).max(1),
    width: z.number().positive().max(1),
    height: z.number().positive().max(1),
  })
  .strict()
  .refine(
    (rect) => rect.x + rect.width <= 1 && rect.y + rect.height <= 1,
    "The rectangle must fit within the page (coordinates from 0 to 1).",
  );
export const reviewTargetSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("requirement"), recordId: uuid }).strict(),
  z.object({ kind: z.literal("mapping"), recordId: uuid }).strict(),
  z.object({ kind: z.literal("evidence"), recordId: uuid }).strict(),
  z.object({ kind: z.literal("citation"), recordId: uuid }).strict(),
  z.object({ kind: z.literal("assessment-finding"), recordId: uuid }).strict(),
  z
    .object({
      kind: z.literal("passage"),
      recordId: uuid,
      sha256: z.string().regex(/^[a-f0-9]{64}$/),
      page: z.number().int().min(1).max(100000),
      passage: z.string().trim().max(10000),
      rectangle: citationRectangleSchema,
    })
    .strict(),
  z
    .object({
      kind: z.literal("requirement-change"),
      recordId: uuid,
      editId: uuid,
      field: z.enum([
        "title",
        "statement",
        "acceptanceCriteria",
        "rationale",
        "requirementType",
        "ownerPartyId",
      ]),
      side: z.enum(["before", "after"]),
      startLine: z.number().int().min(1).optional(),
      endLine: z.number().int().min(1).optional(),
    })
    .strict(),
  z
    .object({
      kind: z.literal("cell"),
      programId: uuid,
      workbookId: uuid,
      sheetId: stableId,
      rowId: stableId,
      columnId: stableId,
    })
    .strict(),
]);
export type ReviewTarget = z.infer<typeof reviewTargetSchema>;
const body = z.string().trim().min(1, "Write a comment before sending it.").max(10000);
const citationCommandSchema = z
  .object({
    operation: z.literal("create-citation"),
    target: reviewTargetSchema,
    evidenceVersionId: uuid,
    expectedEvidenceRevision: z.number().int().positive(),
    passage: z.string().trim().min(1, "Enter the exact quoted passage.").max(10000),
    page: z.number().int().min(1).max(100000).optional(),
    anchor: z.string().trim().min(1).max(500).optional(),
    rectangle: citationRectangleSchema.optional(),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (!value.page && !value.anchor)
      ctx.addIssue({
        code: "custom",
        path: ["page"],
        message: "Enter a page number or source anchor.",
      });
    if (value.rectangle && !value.page)
      ctx.addIssue({
        code: "custom",
        path: ["rectangle"],
        message: "A rectangle needs a page number.",
      });
  });
export const reviewCommandSchema = z.union([
  z
    .object({
      operation: z.literal("create-thread"),
      target: reviewTargetSchema,
      subject: z.string().trim().min(1).max(240),
      body,
    })
    .strict(),
  z
    .object({ operation: z.literal("reply"), threadId: uuid, parentId: uuid.optional(), body })
    .strict(),
  z
    .object({
      operation: z.literal("set-status"),
      threadId: uuid,
      expectedRevision: z.number().int().positive(),
      status: z.enum(["open", "resolved"]),
    })
    .strict(),
  citationCommandSchema,
]);
export type ReviewCommand = z.infer<typeof reviewCommandSchema>;
export type ReviewRequest = { requestId: string; command: ReviewCommand };
const resultSchema = z.union([
  z.object({ threadId: uuid, revision: z.number().int().positive(), messageId: uuid }),
  z.object({ citationId: uuid }),
]);
export type ReviewResult = z.infer<typeof resultSchema>;
export const reviewThreadSchema = z.object({
  id: uuid,
  tenant_id: uuid,
  program_id: uuid.nullable(),
  target: reviewTargetSchema,
  target_context: z.record(z.string(), z.unknown()).optional(),
  subject: z.string(),
  status: z.enum(["open", "resolved"]),
  revision: z.number().int().positive(),
  created_by: uuid,
  author_name: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
  resolved_at: z.string().nullable(),
  resolved_by: uuid.nullable(),
});
export type ReviewThread = z.infer<typeof reviewThreadSchema>;
const messageSchema = z.object({
  id: uuid,
  tenant_id: uuid,
  thread_id: uuid,
  parent_id: uuid.nullable(),
  kind: z.enum(["comment", "resolved", "reopened"]),
  body: z.string(),
  created_by: uuid,
  author_name: z.string(),
  created_at: z.string(),
});
export type ReviewMessage = z.infer<typeof messageSchema>;
export const citationSchema = z.object({
  id: uuid,
  tenant_id: uuid,
  program_id: uuid.nullable(),
  target: reviewTargetSchema,
  evidence_version_id: uuid,
  evidence_revision: z.number().int().positive(),
  evidence_sha256: z.string().regex(/^[a-f0-9]{64}$/),
  evidence_title: z.string(),
  version_number: z.number().int(),
  source_uri: z
    .string()
    .url()
    .refine((value) => /^(https?:\/\/|storage:\/\/evidence\/)/i.test(value)),
  source_storage_object_id: uuid.nullable(),
  source_storage_object_name: z.string().nullable(),
  passage: z.string(),
  page: z.number().int().nullable(),
  anchor: z.string().nullable(),
  rectangle: citationRectangleSchema.nullable(),
  created_by: uuid,
  author_name: z.string(),
  created_at: z.string(),
});
export type AssuranceCitation = z.infer<typeof citationSchema>;
export type ReviewListOptions = {
  target?: ReviewTarget | undefined;
  programId?: string | undefined;
  evidenceVersionId?: string | undefined;
  targetScope?:
    | Pick<
        Extract<ReviewTarget, { kind: "requirement-change" }>,
        "kind" | "recordId" | "editId" | "field"
      >
    | undefined;
  status?: "open" | "resolved" | undefined;
  page?: number | undefined;
};
export type CitationListOptions = {
  target?: ReviewTarget | undefined;
  evidenceVersionId?: string | undefined;
  page?: number | undefined;
};
type Client = Pick<SupabaseClient, "from" | "rpc">;
type Context = { tenantId: string; token: string };
export const reviewQueryKey = (tenantId: string) => ["assurance-review", tenantId] as const;
const PAGE_SIZE = 25;
const pageIndex = (page = 0) => z.number().int().min(0).max(100000).parse(page);

export async function commandAssuranceReview(
  client: Client,
  context: Context,
  request: ReviewRequest,
): Promise<ReviewResult> {
  const command = reviewCommandSchema.parse(request.command);
  const { data, error } = await client
    .rpc("command_assurance_review", {
      p_tenant_id: uuid.parse(context.tenantId),
      p_request_id: uuid.parse(request.requestId),
      p_command: command,
    })
    .setHeader("Authorization", `Bearer ${context.token}`);
  if (error) throw new Error(error.message);
  return resultSchema.parse(data);
}

export async function readReviewThreads(
  client: Client,
  context: Context,
  options: ReviewListOptions = {},
  signal?: AbortSignal,
) {
  const page = pageIndex(options.page);
  let query = client
    .from("assurance_review_threads")
    .select("*", { count: "exact" })
    .eq("tenant_id", context.tenantId)
    .setHeader("Authorization", `Bearer ${context.token}`);
  if (options.target)
    query = query.eq("target", JSON.stringify(reviewTargetSchema.parse(options.target)));
  if (options.targetScope) {
    const scope = options.targetScope;
    uuid.parse(scope.recordId);
    uuid.parse(scope.editId);
    query = query
      .eq("target->>kind", "requirement-change")
      .eq("target->>recordId", scope.recordId)
      .eq("target->>editId", scope.editId)
      .eq("target->>field", scope.field);
  }
  if (options.evidenceVersionId)
    query = query
      .eq("target->>recordId", uuid.parse(options.evidenceVersionId))
      .eq("target->>kind", "passage");
  if (options.programId) query = query.eq("program_id", uuid.parse(options.programId));
  if (options.status)
    query = query.eq("status", z.enum(["open", "resolved"]).parse(options.status));
  if (signal) query = query.abortSignal(signal);
  const { data, count, error } = await query
    .order("updated_at", { ascending: false })
    .order("id")
    .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
  if (error) throw new Error(error.message);
  if (count === null) throw new Error("The discussion count could not be read.");
  return { rows: reviewThreadSchema.array().parse(data), count, page, pageSize: PAGE_SIZE };
}
export function useAssuranceReviewThreads(options: ReviewListOptions = {}) {
  const workspace = useWorkspace();
  return useQuery({
    queryKey: [...reviewQueryKey(workspace.tenantId), "threads", options],
    queryFn: async ({ signal }) =>
      readReviewThreads(
        database(),
        { tenantId: workspace.tenantId, token: await requireIdentity(workspace) },
        options,
        signal,
      ),
  });
}
export function useAssuranceReviewThread(threadId: string, page = 0) {
  const workspace = useWorkspace();
  return useQuery({
    queryKey: [...reviewQueryKey(workspace.tenantId), "thread", threadId, page],
    enabled: Boolean(threadId),
    queryFn: async ({ signal }) => {
      uuid.parse(threadId);
      pageIndex(page);
      const token = await requireIdentity(workspace);
      const [thread, messages] = await Promise.all([
        database()
          .from("assurance_review_threads")
          .select("*")
          .eq("tenant_id", workspace.tenantId)
          .eq("id", threadId)
          .setHeader("Authorization", `Bearer ${token}`)
          .abortSignal(signal)
          .single(),
        database()
          .from("assurance_review_messages")
          .select("*", { count: "exact" })
          .eq("tenant_id", workspace.tenantId)
          .eq("thread_id", threadId)
          .setHeader("Authorization", `Bearer ${token}`)
          .abortSignal(signal)
          .order("created_at", { ascending: false })
          .order("id")
          .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1),
      ]);
      if (thread.error) throw new Error(thread.error.message);
      if (messages.error) throw new Error(messages.error.message);
      return {
        thread: reviewThreadSchema.parse(thread.data),
        messages: messageSchema.array().parse(messages.data),
        count: messages.count ?? 0,
        page,
        pageSize: PAGE_SIZE,
      };
    },
  });
}
export function useAssuranceCitations(options: CitationListOptions) {
  const workspace = useWorkspace();
  return useQuery({
    queryKey: [...reviewQueryKey(workspace.tenantId), "citations", options],
    queryFn: async ({ signal }) => {
      const page = pageIndex(options.page);
      let query = database()
        .from("assurance_citations")
        .select("*", { count: "exact" })
        .eq("tenant_id", workspace.tenantId)
        .setHeader("Authorization", `Bearer ${await requireIdentity(workspace)}`)
        .abortSignal(signal);
      if (options.target)
        query = query.eq("target", JSON.stringify(reviewTargetSchema.parse(options.target)));
      if (options.evidenceVersionId)
        query = query.eq("evidence_version_id", uuid.parse(options.evidenceVersionId));
      const { data, count, error } = await query
        .order("created_at", { ascending: false })
        .order("id")
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
      if (error) throw new Error(error.message);
      return {
        rows: citationSchema.array().parse(data),
        count: count ?? 0,
        page,
        pageSize: PAGE_SIZE,
      };
    },
  });
}
/** Refresh dependent product views immediately without invalidating another workspace. */
export async function invalidateReviewQueries(
  cache: QueryClient,
  tenantId: string,
  operation: ReviewCommand["operation"],
) {
  await Promise.all([
    cache.invalidateQueries({ queryKey: reviewQueryKey(tenantId) }),
    cache.invalidateQueries({ queryKey: ["attention", tenantId] }),
    ...(operation === "create-citation"
      ? [cache.invalidateQueries({ queryKey: ["workspace-search", tenantId] })]
      : []),
  ]);
}
export function useAssuranceReviewCommand() {
  const workspace = useWorkspace();
  const cache = useQueryClient();
  return useMutation({
    mutationFn: async (request: ReviewRequest) => {
      const result = await commandAssuranceReview(
        database(),
        { tenantId: workspace.tenantId, token: await requireIdentity(workspace) },
        request,
      );
      await requireIdentity(workspace);
      return result;
    },
    onSuccess: (_result, request) =>
      invalidateReviewQueries(cache, workspace.tenantId, request.command.operation),
  });
}
const evidenceChoiceSchema = z.object({
  id: uuid,
  revision: z.number(),
  sha256: z.string().nullable(),
  external_uri: z.string().nullable(),
  storage_object_id: uuid.nullable(),
  storage_object_name: z.string().nullable(),
  version_number: z.number(),
  artifact: z.object({
    title: z.string(),
    source_uri: z.string().nullable(),
    program_id: uuid.nullable(),
  }),
});
export type CitationEvidenceChoice = z.infer<typeof evidenceChoiceSchema>;
export async function readCitationEvidence(
  client: Client,
  context: Context,
  search: string,
  page = 0,
  signal?: AbortSignal,
) {
  const offset = pageIndex(page) * PAGE_SIZE;
  let query = client
    .from("evidence_versions")
    .select(
      "id,revision,sha256,external_uri,storage_object_id,storage_object_name,version_number,artifact:evidence_artifacts!inner(title,source_uri,program_id)",
      { count: "exact" },
    )
    .eq("tenant_id", context.tenantId)
    .ilike("artifact.title", `%${search.replaceAll("%", "\\%").replaceAll("_", "\\_")}%`)
    .order("created_at", { ascending: false })
    .order("id", { ascending: true })
    .range(offset, offset + PAGE_SIZE - 1)
    .setHeader("Authorization", `Bearer ${context.token}`);
  if (signal) query = query.abortSignal(signal);
  const { data, error, count } = await query;
  if (error) throw new Error(error.message);
  return {
    rows: evidenceChoiceSchema.array().parse(data),
    count: count ?? 0,
    page,
    pageSize: PAGE_SIZE,
  };
}
export function useCitationEvidence(search: string, page = 0) {
  const workspace = useWorkspace();
  return useQuery({
    queryKey: [...reviewQueryKey(workspace.tenantId), "evidence-choices", search, page],
    queryFn: async ({ signal }) =>
      readCitationEvidence(
        database(),
        { tenantId: workspace.tenantId, token: await requireIdentity(workspace) },
        search,
        page,
        signal,
      ),
  });
}
/** Page/fragment links open the original source. Rectangle coordinates stay in the citation;
 * a generic external site cannot be assumed to understand a rectangle fragment. */
export function citationSourceLink(
  citation: Pick<AssuranceCitation, "source_uri" | "page" | "anchor">,
): string {
  const url = new URL(citation.source_uri);
  if (!["http:", "https:"].includes(url.protocol))
    throw new Error("Only HTTP(S) citation sources can be opened.");
  if (citation.anchor) url.hash = citation.anchor.replace(/^#/, "");
  else if (citation.page) url.hash = `page=${citation.page}`;
  return url.href;
}
export function reviewTargetHref(target: ReviewTarget, programId?: string | null): string {
  if (target.kind === "cell")
    return `/programs/${target.programId}/workbook?sheet=${encodeURIComponent(target.sheetId)}&reviewRow=${encodeURIComponent(target.rowId)}&reviewColumn=${encodeURIComponent(target.columnId)}`;
  if (target.kind === "citation") return `/evidence?citation=${target.recordId}`;
  if (target.kind === "passage")
    return `/evidence?version=${target.recordId}&reader=true&page=${target.page}&rectangle=${encodeURIComponent(JSON.stringify(target.rectangle))}&sha256=${target.sha256}`;
  if (target.kind === "evidence") return `/evidence?version=${target.recordId}`;
  if (target.kind === "assessment-finding")
    return `/records/assessment_findings/${target.recordId}`;
  if (target.kind === "requirement-change" && programId)
    return `/programs/${programId}/requirements/${target.recordId}?tab=Edit%20history&edit=${target.editId}&field=${target.field}&side=${target.side}${target.startLine ? `&startLine=${target.startLine}&endLine=${target.endLine}` : ""}`;
  if ((target.kind === "requirement" || target.kind === "requirement-change") && programId)
    return `/programs/${programId}/requirements/${target.recordId}`;
  const table =
    target.kind === "requirement" || target.kind === "requirement-change"
      ? "engineering_requirements"
      : target.kind === "mapping"
        ? "requirement_control_links"
        : "evidence_versions";
  return `/records/${table}/${target.recordId}`;
}

/** Retain the exact intent/id after an uncertain response. Changing the intent creates a new id. */
export function useAssuranceReviewSubmit() {
  const mutation = useAssuranceReviewCommand();
  const attempt = useRef<{ json: string; requestId: string } | null>(null);
  return {
    ...mutation,
    submit: async (command: ReviewCommand) => {
      const json = JSON.stringify(command);
      if (attempt.current?.json !== json)
        attempt.current = { json, requestId: crypto.randomUUID() };
      const result = await mutation.mutateAsync({ requestId: attempt.current.requestId, command });
      attempt.current = null;
      return result;
    },
  };
}

/** Download only the captured private object and reject changed bytes before exposing them. */
export async function verifyCitationFile(blob: Blob, expectedSha256: string): Promise<void> {
  const digest = await crypto.subtle.digest("SHA-256", await blob.arrayBuffer());
  const actual = Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
  if (actual !== expectedSha256.toLowerCase())
    throw new Error("This file no longer matches the cited SHA-256. The download was refused.");
}
export function useDownloadCitation() {
  const workspace = useWorkspace();
  return useMutation({
    mutationFn: async (citation: AssuranceCitation) => {
      if (
        citation.tenant_id !== workspace.tenantId ||
        !citation.source_storage_object_id ||
        !citation.source_storage_object_name
      )
        throw new Error("This citation has no stored file in the active workspace.");
      const token = await requireIdentity(workspace);
      const client = createClient(
        import.meta.env["VITE_SUPABASE_URL"],
        import.meta.env["VITE_SUPABASE_ANON_KEY"],
        {
          accessToken: async () => token,
          global: {
            fetch: (input, init) => fetch(input, { ...init, signal: AbortSignal.timeout(120000) }),
          },
        },
      );
      const { data, error } = await client.storage
        .from("evidence")
        .download(citation.source_storage_object_name);
      if (error) throw new Error(error.message);
      await requireIdentity(workspace);
      await verifyCitationFile(data, citation.evidence_sha256);
      await requireIdentity(workspace);
      return {
        blob: data,
        filename: citation.source_storage_object_name.split("/").at(-1) ?? "cited-evidence",
      };
    },
  });
}

/** Read one exact citation under the current tenant, including a link reached without a version. */
export function useAssuranceCitation(citationId?: string) {
  const workspace = useWorkspace();
  return useQuery({
    queryKey: [...reviewQueryKey(workspace.tenantId), "citation", citationId],
    enabled: Boolean(citationId),
    queryFn: async ({ signal }) => {
      const { data, error } = await database()
        .from("assurance_citations")
        .select("*")
        .eq("tenant_id", workspace.tenantId)
        .eq("id", uuid.parse(citationId))
        .setHeader("Authorization", `Bearer ${await requireIdentity(workspace)}`)
        .abortSignal(signal)
        .single();
      if (error) throw new Error(error.message);
      return citationSchema.parse(data);
    },
  });
}
export function citationReaderHref(
  citation: Pick<AssuranceCitation, "id" | "evidence_version_id">,
) {
  return `/evidence?version=${citation.evidence_version_id}&citation=${citation.id}&reader=true`;
}
