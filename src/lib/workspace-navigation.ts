import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
const recordKind = z.enum([
  "program",
  "requirement",
  "control",
  "evidence",
  "citation",
  "risk",
  "finding",
  "saved-view",
]);
export const navigationTargetSchema = z.union([
  z.object({ kind: recordKind, recordId: z.string().uuid() }).strict(),
  z
    .object({
      kind: z.literal("workbook-sheet"),
      recordId: z.string().uuid(),
      sheetId: z.string().regex(/^[\w-]{1,160}$/),
    })
    .strict(),
]);
export type NavigationTarget = z.infer<typeof navigationTargetSchema>;
export function safeWorkspaceHref(href: string): string {
  if (
    !href.startsWith("/") ||
    href.startsWith("//") ||
    href.includes("\\") ||
    [...href].some((character) => character.charCodeAt(0) < 32)
  )
    throw new Error("This destination is not a workspace link.");
  const url = new URL(href, "https://workspace.invalid");
  if (url.origin !== "https://workspace.invalid")
    throw new Error("This destination is not a workspace link.");
  return `${url.pathname}${url.search}${url.hash}`;
}
export const navigationDestinationSchema = z.object({
  key: z.string(),
  target: navigationTargetSchema,
  title: z.string(),
  identifier: z.string().nullable(),
  href: z.string().transform(safeWorkspaceHref),
});
export type NavigationDestination = z.infer<typeof navigationDestinationSchema>;
export const navigationItemSchema = z.object({
  key: z.string(),
  target: navigationTargetSchema,
  favorite: z.boolean(),
  position: z.number(),
  visitedAt: z.string().nullable(),
  destination: navigationDestinationSchema.nullable(),
});
export type NavigationItem = z.infer<typeof navigationItemSchema>;
type Context = { tenantId: string; token: string };
export function navigationTargetKey(target: NavigationTarget): string {
  return `${target.kind}:${target.recordId}${target.kind === "workbook-sheet" ? `:${target.sheetId}` : ""}`;
}
export async function resolveNavigation(
  client: SupabaseClient,
  context: Context,
  target: NavigationTarget,
) {
  const { data, error } = await client
    .rpc("resolve_assurance_destination", {
      p_tenant_id: context.tenantId,
      p_target: navigationTargetSchema.parse(target),
    })
    .setHeader("Authorization", `Bearer ${context.token}`);
  if (error) throw new Error(error.message);
  return data === null ? null : navigationDestinationSchema.parse(data);
}
export async function readNavigation(client: SupabaseClient, context: Context) {
  const { data, error } = await client
    .rpc("read_assurance_navigation", { p_tenant_id: context.tenantId })
    .setHeader("Authorization", `Bearer ${context.token}`);
  if (error) throw new Error(error.message);
  return navigationItemSchema.array().parse(data);
}
export async function changeNavigation(
  client: SupabaseClient,
  context: Context,
  operation: "visit" | "favorite" | "unfavorite" | "forget" | "clear-recent" | "reorder",
  target?: NavigationTarget,
  keys?: string[],
) {
  const { error } = await client
    .rpc("command_assurance_navigation", {
      p_tenant_id: context.tenantId,
      p_operation: operation,
      p_target: target ? navigationTargetSchema.parse(target) : null,
      p_keys: keys ?? null,
    })
    .setHeader("Authorization", `Bearer ${context.token}`);
  if (error) throw new Error(error.message);
}
/** A route is a visit only after the server resolves a real record. Query cleanup is not another visit. */
export function navigationTargetFromLocation(
  pathname: string,
  search: Record<string, unknown>,
): NavigationTarget | null {
  let candidate: unknown;
  const program = pathname.match(/^\/programs\/([\w-]+)$/);
  const requirement = pathname.match(/^\/programs\/[\w-]+\/requirements\/([\w-]+)$/);
  const workbook = pathname.match(/^\/programs\/([\w-]+)\/(?:workbook|sctm)$/);
  const record = pathname.match(/^\/(risks|findings)\/([\w-]+)$/);
  const control = pathname.match(/^\/records\/controls\/([\w-]+)$/);
  // savedView is recorded by its actual onApply, never by the unfiltered destination route.
  if (search["savedView"]) return null;
  if (program) candidate = { kind: "program", recordId: program[1] };
  else if (requirement) candidate = { kind: "requirement", recordId: requirement[1] };
  else if (workbook)
    candidate = {
      kind: "workbook-sheet",
      recordId: workbook[1],
      sheetId:
        typeof search["sheet"] === "string"
          ? search["sheet"]
          : pathname.endsWith("/sctm")
            ? "mappings"
            : "requirements",
    };
  else if (record)
    candidate = { kind: record[1] === "risks" ? "risk" : "finding", recordId: record[2] };
  else if (control) candidate = { kind: "control", recordId: control[1] };
  else if (pathname === "/evidence" && search["artifact"])
    candidate = { kind: "evidence", recordId: search["artifact"] };
  const parsed = navigationTargetSchema.safeParse(candidate);
  return parsed.success ? parsed.data : null;
}
