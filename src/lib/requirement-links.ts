import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { useWorkspace } from "@/components/app/workspace";
import { database, requireIdentity } from "./database";

/**
 * What a requirement revision records against other records: the systems it is allocated to, the
 * controls it maps to and the evidence versions that support it. Each is its own row, removed on
 * its own; a published or superseded revision keeps its links (the schema refuses the change).
 */
export const requirementLinkTables = [
  "requirement_allocations",
  "requirement_control_links",
  "requirement_evidence",
] as const;
export type RequirementLinkTable = (typeof requirementLinkTables)[number];

/** The words each link is called by in a sentence: "Remove allocation", "The control mapping…". */
export const requirementLinkNouns: Record<RequirementLinkTable, string> = {
  requirement_allocations: "allocation",
  requirement_control_links: "control mapping",
  requirement_evidence: "evidence link",
};

type Client = Pick<SupabaseClient, "from">;
type Context = { tenantId: string; token: string };
type PostgrestFailure = { code?: string | undefined; message: string } | null;

const uuid = z.string().uuid();
const seen = z.object({ id: uuid, revision: z.number().int().nonnegative() });

export const removeRequirementLinkSchema = z
  .object({
    table: z.enum(requirementLinkTables),
    id: uuid,
    revision: z.number().int().nonnegative(),
    /**
     * An allocation only: the control mappings the reader was shown for its system, removed
     * first, since a system's mapping needs the requirement allocated to that system.
     */
    mappings: z.array(seen).max(500).optional(),
  })
  .strict();
export type RemoveRequirementLink = z.infer<typeof removeRequirementLinkSchema>;

export const allocateRequirementSchema = z
  .object({
    requirementRevisionId: uuid,
    /** One row per chosen system, each with an id chosen once so a retry cannot duplicate it. */
    targets: z
      .array(z.object({ id: uuid, systemId: uuid }))
      .min(1, "Choose a system.")
      .max(500),
    rationale: z.string().trim().max(10000).nullable(),
  })
  .strict();
export type AllocateRequirement = z.infer<typeof allocateRequirementSchema>;

/** The most requirements one allocation to a system takes: a whole program's register. */
export const ALLOCATE_TO_SYSTEM_LIMIT = 5000;

export const allocateToSystemSchema = z
  .object({
    systemId: uuid,
    /** One row per chosen requirement revision, each with an id chosen once for every attempt. */
    targets: z
      .array(z.object({ id: uuid, requirementRevisionId: uuid }))
      .min(1, "Choose a requirement.")
      .max(ALLOCATE_TO_SYSTEM_LIMIT),
    rationale: z.string().trim().max(10000).nullable(),
    /**
     * A later attempt after one whose answer was lost: the ids are looked up first, so only what
     * the earlier attempt did not write is inserted. A first attempt sends the one insert.
     */
    retry: z.boolean().optional(),
  })
  .strict();
export type AllocateToSystem = z.infer<typeof allocateToSystemSchema>;

/** A database refusal in the reader's words: what happened and what to do next. */
function failure(error: NonNullable<PostgrestFailure>, noun: string): Error {
  // 23514 is every check the schema makes; only the history guard's is about the revision. The
  // others ("The allocated system must belong to the requirement program") say what fixes them.
  if (error.code === "23514" && /historical requirement revision/i.test(error.message))
    return new Error(
      `This requirement revision is no longer the current one, so its ${noun}s cannot change. Open the latest revision.`,
    );
  if (error.code === "23503")
    return new Error(`Other records still depend on this ${noun}. Remove them first.`);
  if (error.code === "23505")
    return new Error("The requirement is already allocated to one of these systems.");
  if (error.code === "42501")
    return new Error(`Only an editor, admin or owner can change this ${noun}.`);
  // The schema's messages carry no full stop; the forms follow them with "Your choices are kept."
  const message = error.message.trim();
  return new Error(/[.!?]$/.test(message) ? message : `${message}.`);
}

/** Delete one row at the revision the reader saw. Returns whether the row was still there. */
async function deleteSeen(
  client: Client,
  { tenantId, token }: Context,
  table: RequirementLinkTable,
  row: { id: string; revision: number },
) {
  const noun = requirementLinkNouns[table];
  const { data, error } = await client
    .from(table)
    .delete()
    .eq("tenant_id", tenantId)
    .eq("id", row.id)
    .eq("revision", row.revision)
    .select("id")
    .setHeader("Authorization", `Bearer ${token}`);
  if (error) throw failure(error, noun);
  if (Array.isArray(data) && data.length) return true;
  // Nothing matched: it is gone already, it changed since it was read, or it cannot be removed.
  const current = await client
    .from(table)
    .select("id, revision")
    .eq("tenant_id", tenantId)
    .eq("id", row.id)
    .setHeader("Authorization", `Bearer ${token}`)
    .maybeSingle();
  if (current.error) throw failure(current.error, noun);
  if (!current.data) return false;
  if ((current.data as { revision: number }).revision !== row.revision)
    throw new Error(`This ${noun} changed in another session. Review it before removing it.`);
  throw new Error(`This ${noun} could not be removed. An editor, admin or owner can remove it.`);
}

/**
 * Remove an allocation, a control mapping or an evidence link. An allocation goes with the
 * control mappings recorded for its system, which the reader confirmed: mappings first, so no
 * mapping is ever left on a system the requirement is not allocated to. A row that is already
 * gone counts as removed, so a retry after an uncertain response succeeds.
 */
export async function removeRequirementLink(
  client: Client,
  context: Context,
  request: RemoveRequirementLink,
): Promise<{ removed: boolean; mappingsRemoved: number }> {
  const values = removeRequirementLinkSchema.parse(request);
  let mappingsRemoved = 0;
  if (values.table === "requirement_allocations") {
    const allocation = await client
      .from("requirement_allocations")
      .select("id, requirement_revision_id, system_id")
      .eq("tenant_id", context.tenantId)
      .eq("id", values.id)
      .setHeader("Authorization", `Bearer ${context.token}`)
      .maybeSingle();
    if (allocation.error) throw failure(allocation.error, "allocation");
    if (!allocation.data) return { removed: false, mappingsRemoved };
    const target = allocation.data as { requirement_revision_id: string; system_id: string | null };
    for (const mapping of values.mappings ?? [])
      if (await deleteSeen(client, context, "requirement_control_links", mapping))
        mappingsRemoved += 1;
    if (target.system_id) {
      const remaining = await client
        .from("requirement_control_links")
        .select("id")
        .eq("tenant_id", context.tenantId)
        .eq("requirement_revision_id", target.requirement_revision_id)
        .eq("system_id", target.system_id)
        .setHeader("Authorization", `Bearer ${context.token}`);
      if (remaining.error) throw failure(remaining.error, "control mapping");
      if (Array.isArray(remaining.data) && remaining.data.length)
        throw new Error(
          "Another control mapping was recorded for this system. Review the control mappings before removing the allocation.",
        );
    }
  }
  const removed = await deleteSeen(client, context, values.table, values);
  return { removed, mappingsRemoved };
}

/**
 * Allocate a requirement revision to several systems in one insert, with one rationale for all.
 * Each target carries the id chosen when the reader first submitted, so a retry inserts only what
 * an earlier attempt did not, and refuses when a row with that id now says something else.
 */
export async function allocateRequirement(
  client: Client,
  { tenantId, token }: Context,
  request: AllocateRequirement,
): Promise<{ allocationIds: string[]; created: number }> {
  const values = allocateRequirementSchema.parse(request);
  const rationale = values.rationale?.trim() || null;
  const ids = values.targets.map((target) => target.id);
  const existing = await client
    .from("requirement_allocations")
    .select("id, requirement_revision_id, system_id, rationale")
    .eq("tenant_id", tenantId)
    .in("id", ids)
    .setHeader("Authorization", `Bearer ${token}`);
  if (existing.error) throw failure(existing.error, "allocation");
  const found = new Map(
    (
      (existing.data ?? []) as {
        id: string;
        requirement_revision_id: string;
        system_id: string | null;
        rationale: string | null;
      }[]
    ).map((row) => [row.id, row]),
  );
  for (const target of values.targets) {
    const row = found.get(target.id);
    if (
      row &&
      (row.requirement_revision_id !== values.requirementRevisionId ||
        row.system_id !== target.systemId ||
        row.rationale !== rationale)
    )
      throw new Error(
        "An allocation changed after this attempt. Close and allocate again to see the current allocations.",
      );
  }
  const missing = values.targets.filter((target) => !found.has(target.id));
  if (missing.length) {
    const { error } = await client
      .from("requirement_allocations")
      .insert(
        missing.map((target) => ({
          id: target.id,
          tenant_id: tenantId,
          requirement_revision_id: values.requirementRevisionId,
          system_id: target.systemId,
          rationale,
        })),
      )
      .setHeader("Authorization", `Bearer ${token}`);
    if (error) throw failure(error, "allocation");
  }
  return { allocationIds: ids, created: missing.length };
}

/** How many ids one lookup names, so a request's address stays short. */
const LOOKUP_CHUNK = 100;

/**
 * Allocate many requirement revisions to one system in one insert, with one rationale for all:
 * the Allocate requirements picker. A single insert is one statement, so a refusal writes none of
 * them. A retry (`retry: true`) first reads which of its ids an earlier attempt wrote, inserts
 * only the rest, and refuses when a row with one of those ids now says something else.
 */
export async function allocateRequirementsToSystem(
  client: Client,
  { tenantId, token }: Context,
  request: AllocateToSystem,
): Promise<{ allocationIds: string[]; created: number }> {
  const values = allocateToSystemSchema.parse(request);
  const rationale = values.rationale?.trim() || null;
  const ids = values.targets.map((target) => target.id);
  const found = new Map<
    string,
    { requirement_revision_id: string; system_id: string | null; rationale: string | null }
  >();
  if (values.retry)
    for (let offset = 0; offset < ids.length; offset += LOOKUP_CHUNK) {
      const existing = await client
        .from("requirement_allocations")
        .select("id, requirement_revision_id, system_id, rationale")
        .eq("tenant_id", tenantId)
        .in("id", ids.slice(offset, offset + LOOKUP_CHUNK))
        .setHeader("Authorization", `Bearer ${token}`);
      if (existing.error) throw failure(existing.error, "allocation");
      for (const row of (existing.data ?? []) as {
        id: string;
        requirement_revision_id: string;
        system_id: string | null;
        rationale: string | null;
      }[])
        found.set(row.id, row);
    }
  for (const target of values.targets) {
    const row = found.get(target.id);
    if (
      row &&
      (row.requirement_revision_id !== target.requirementRevisionId ||
        row.system_id !== values.systemId ||
        row.rationale !== rationale)
    )
      throw new Error(
        "An allocation changed after this attempt. Close and allocate again to see the current allocations.",
      );
  }
  const missing = values.targets.filter((target) => !found.has(target.id));
  if (missing.length) {
    const { error } = await client
      .from("requirement_allocations")
      .insert(
        missing.map((target) => ({
          id: target.id,
          tenant_id: tenantId,
          requirement_revision_id: target.requirementRevisionId,
          system_id: values.systemId,
          rationale,
        })),
      )
      .setHeader("Authorization", `Bearer ${token}`);
    if (error?.code === "23505")
      throw new Error(
        "One of these requirements was allocated to this system in another session. Close and allocate again to see what is left.",
      );
    if (error) throw failure(error, "allocation");
  }
  return { allocationIds: ids, created: missing.length };
}

const prefixes = ["models", "model", "records", "record", "reference-options"];

function useRefresh() {
  const workspace = useWorkspace();
  const cache = useQueryClient();
  return (tables: readonly string[]) => {
    for (const table of tables)
      for (const prefix of prefixes)
        void cache.invalidateQueries({ queryKey: [prefix, workspace.tenantId, table] });
  };
}

/** Remove one of a requirement revision's links; the lists refresh behind the confirmation. */
export function useRemoveRequirementLink() {
  const workspace = useWorkspace();
  const refresh = useRefresh();
  return useMutation({
    mutationFn: async (request: RemoveRequirementLink) => {
      const token = await requireIdentity(workspace);
      return removeRequirementLink(database(), { tenantId: workspace.tenantId, token }, request);
    },
    onSuccess: (_result, request) =>
      refresh(
        request.table === "requirement_allocations"
          ? ["requirement_allocations", "requirement_control_links"]
          : [request.table],
      ),
  });
}

/** Allocate a requirement revision to the chosen systems in one write. */
export function useAllocateRequirement() {
  const workspace = useWorkspace();
  const refresh = useRefresh();
  return useMutation({
    mutationFn: async (request: AllocateRequirement) => {
      const token = await requireIdentity(workspace);
      return allocateRequirement(database(), { tenantId: workspace.tenantId, token }, request);
    },
    onSuccess: () => refresh(["requirement_allocations"]),
  });
}

/** Allocate the chosen requirement revisions to one system in one write. */
export function useAllocateRequirementsToSystem() {
  const workspace = useWorkspace();
  const refresh = useRefresh();
  return useMutation({
    mutationFn: async (request: AllocateToSystem) => {
      const token = await requireIdentity(workspace);
      return allocateRequirementsToSystem(
        database(),
        { tenantId: workspace.tenantId, token },
        request,
      );
    },
    onSuccess: () => refresh(["requirement_allocations"]),
  });
}
