import { describe, expect, it, vi } from "vitest";
import { QueryClient } from "@tanstack/react-query";
import { args, fakeClient, uuid } from "./testing/fake-client";
vi.mock("@/components/app/workspace", () => ({ useWorkspace: () => ({}) }));
const {
  reviewTargetSchema,
  reviewCommandSchema,
  citationSourceLink,
  commandAssuranceReview,
  readReviewThreads,
  readCitationEvidence,
  invalidateReviewQueries,
  verifyCitationFile,
} = await import("./assurance-review");
const target = { kind: "requirement" as const, recordId: uuid(1) };
const context = { tenantId: uuid(2), token: "test-session" };
describe("review intents and exact citation locations", () => {
  it("validates stable targets without allowing caller authority or foreign fields", () => {
    expect(reviewTargetSchema.parse(target)).toEqual(target);
    for (const bad of [
      { ...target, tenantId: uuid(3) },
      {
        kind: "cell",
        programId: uuid(1),
        workbookId: uuid(2),
        sheetId: "Sheet 1",
        rowId: "r1",
        columnId: "c1",
      },
      { ...target, kind: "task" },
    ])
      expect(() => reviewTargetSchema.parse(bad)).toThrow();
  });
  it("requires real locations and bounds normalized rectangles", () => {
    const citation = {
      operation: "create-citation",
      target,
      evidenceVersionId: uuid(3),
      expectedEvidenceRevision: 2,
      passage: "Quoted passage",
      page: 4,
      rectangle: { x: 0.2, y: 0.3, width: 0.4, height: 0.1 },
    };
    expect(reviewCommandSchema.parse(citation)).toEqual(citation);
    for (const patch of [
      { page: undefined },
      { page: 0 },
      { rectangle: { x: 0.9, y: 0, width: 0.2, height: 0.1 } },
      { rectangle: { x: 0, y: 0, width: 0, height: 0.1 } },
      { source_uri: "https://forged.example" },
      { created_by: uuid(8) },
    ])
      expect(() => reviewCommandSchema.parse({ ...citation, ...patch })).toThrow();
  });
  it("preserves exact source queries and uses real page/anchor fragments without inventing rectangle support", () => {
    expect(
      citationSourceLink({
        source_uri: "https://example.test/report.pdf?edition=2",
        page: 8,
        anchor: null,
      }),
    ).toBe("https://example.test/report.pdf?edition=2#page=8");
    expect(
      citationSourceLink({
        source_uri: "https://example.test/doc#old",
        page: 8,
        anchor: "section-4",
      }),
    ).toBe("https://example.test/doc#section-4");
    expect(() =>
      citationSourceLink({ source_uri: "javascript:alert(1)", page: 1, anchor: null }),
    ).toThrow();
  });
});
describe("captured private evidence files", () => {
  it("verifies bytes against the captured digest and refuses a changed file", async () => {
    const blob = new Blob(["abc"]);
    const digest = "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad";
    await expect(verifyCitationFile(blob, digest)).resolves.toBeUndefined();
    await expect(verifyCitationFile(new Blob(["changed"]), digest)).rejects.toThrow(
      "no longer matches",
    );
  });
});
describe("dependent review views", () => {
  it("refreshes scoped attention immediately and citation search only when references change", async () => {
    const cache = new QueryClient();
    const tenant = uuid(1),
      other = uuid(2);
    const review = ["assurance-review", tenant, "threads"];
    const attention = ["attention", tenant, uuid(3), "open", 0];
    const search = ["workspace-search", tenant, uuid(3), "retention"];
    const outsider = ["attention", other, uuid(4), "open", 0];
    for (const key of [review, attention, search, outsider]) cache.setQueryData(key, { rows: [] });
    await invalidateReviewQueries(cache, tenant, "set-status");
    expect(cache.getQueryState(review)?.isInvalidated).toBe(true);
    expect(cache.getQueryState(attention)?.isInvalidated).toBe(true);
    expect(cache.getQueryState(search)?.isInvalidated).toBe(false);
    expect(cache.getQueryState(outsider)?.isInvalidated).toBe(false);
    await invalidateReviewQueries(cache, tenant, "create-citation");
    expect(cache.getQueryState(search)?.isInvalidated).toBe(true);
    expect(cache.getQueryState(outsider)?.isInvalidated).toBe(false);
    cache.clear();
  });
});
describe("scoped persistent review commands", () => {
  it("sends one exact receipt and never sends caller author claims", async () => {
    const result = { threadId: uuid(3), revision: 1, messageId: uuid(4) };
    const { client, calls } = fakeClient(() => ({ data: result, error: null }));
    const request = {
      requestId: uuid(5),
      command: {
        operation: "create-thread" as const,
        target,
        subject: "Review basis",
        body: "Please confirm this passage.",
      },
    };
    expect(await commandAssuranceReview(client, context, request)).toEqual(result);
    expect(calls).toHaveLength(1);
    expect(args(calls[0], "rpc")[0]?.[0]).toEqual({
      p_tenant_id: context.tenantId,
      p_request_id: request.requestId,
      p_command: request.command,
    });
    expect(args(calls[0], "setHeader")[0]).toEqual(["Authorization", "Bearer test-session"]);
  });
  it("forwards revision conflicts without transforming them into success", async () => {
    const { client } = fakeClient(() => ({
      data: null,
      error: { code: "PT409", message: "The discussion changed" },
    }));
    await expect(
      commandAssuranceReview(client, context, {
        requestId: uuid(5),
        command: {
          operation: "set-status",
          threadId: uuid(3),
          expectedRevision: 1,
          status: "resolved",
        },
      }),
    ).rejects.toThrow("discussion changed");
  });
  it("pages all matching evidence versions with stable ordering and the full server count", async () => {
    const { client, calls } = fakeClient(() => ({ data: [], count: 61, error: null }));
    expect(await readCitationEvidence(client, context, "Report", 2)).toEqual({
      rows: [],
      count: 61,
      page: 2,
      pageSize: 25,
    });
    expect(args(calls[0], "range")[0]).toEqual([50, 74]);
    expect(args(calls[0], "order")).toEqual([
      ["created_at", { ascending: false }],
      ["id", { ascending: true }],
    ]);
    expect(args(calls[0], "eq")).toEqual([["tenant_id", context.tenantId]]);
  });
  it("pages the scoped full count and cancels stale reads", async () => {
    const { client, calls } = fakeClient(() => ({ data: [], count: 61, error: null }));
    const signal = new AbortController().signal;
    expect(
      await readReviewThreads(client, context, { target, page: 2, status: "open" }, signal),
    ).toEqual({ rows: [], count: 61, page: 2, pageSize: 25 });
    expect(args(calls[0], "eq")).toEqual([
      ["tenant_id", context.tenantId],
      ["target", JSON.stringify(target)],
      ["status", "open"],
    ]);
    expect(args(calls[0], "range")[0]).toEqual([50, 74]);
    expect(args(calls[0], "abortSignal")[0]).toEqual([signal]);
  });
});

describe("source anchored review contracts", () => {
  it("keeps citation identities and exact passage locations distinct", () => {
    expect(reviewTargetSchema.parse({ kind: "citation", recordId: uuid(1) })).toEqual({
      kind: "citation",
      recordId: uuid(1),
    });
    const target = {
      kind: "passage",
      recordId: uuid(2),
      sha256: "a".repeat(64),
      page: 2,
      passage: "Exact source",
      rectangle: { x: 0.1, y: 0.2, width: 0.5, height: 0.1 },
    };
    expect(reviewTargetSchema.parse(target)).toEqual(target);
    expect(() =>
      reviewTargetSchema.parse({
        ...target,
        rectangle: { x: 0.9, y: 0.2, width: 0.5, height: 0.1 },
      }),
    ).toThrow();
    expect(() => reviewTargetSchema.parse({ ...target, sha256: "unknown" })).toThrow();
  });
  it("filters edit discussions by immutable event and field, retaining tenant scope", async () => {
    const scope = {
      kind: "requirement-change" as const,
      recordId: uuid(3),
      editId: uuid(4),
      field: "statement" as const,
    };
    const { client, calls } = fakeClient(() => ({ data: [], count: 0, error: null }));
    await readReviewThreads(client, context, { targetScope: scope });
    expect(args(calls[0], "eq")).toContainEqual(["target->>editId", scope.editId]);
    expect(args(calls[0], "eq")).toContainEqual(["target->>field", "statement"]);
    expect(args(calls[0], "eq")).toContainEqual(["tenant_id", context.tenantId]);
  });
});
