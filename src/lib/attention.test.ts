import { describe, expect, it, vi } from "vitest";
import { args, fakeClient, uuid } from "./testing/fake-client";
vi.mock("@/components/app/workspace", () => ({ useWorkspace: () => ({}) }));
const {
  acknowledgeAttention,
  createAttentionIntent,
  AttentionConflict,
  attentionCommandSchema,
  attentionItemSchema,
} = await import("./attention");
const context = { tenantId: uuid(1), userId: uuid(2), token: "session" };
const item = attentionItemSchema.parse({
  tenant_id: context.tenantId,
  item_key: `review:${uuid(3)}`,
  source_revision: "8",
  kind: "review",
  title: "Review source",
  reason: "Open discussion",
  target: { kind: "requirement", recordId: uuid(4) },
  program_id: null,
  updated_at: "2026-10-14T12:00:00Z",
  state: null,
  ack_version: 0,
});
describe("versioned attention intents", () => {
  it("retries one captured command and request ID after a lost response", async () => {
    const result = { state: "done", version: 1, previousState: null, changed: true };
    let requests = 0;
    const { client, calls } = fakeClient(() =>
      ++requests === 1
        ? { data: null, error: { message: "Network response lost" } }
        : { data: result, error: null },
    );
    const intent = createAttentionIntent(context, item, "done");
    await expect(acknowledgeAttention(client, context, intent)).rejects.toThrow(
      "Network response lost",
    );
    await expect(acknowledgeAttention(client, context, intent)).resolves.toEqual(result);
    expect(args(calls[0], "rpc")).toEqual(args(calls[1], "rpc"));
    expect(args(calls[0], "rpc")[0]).toEqual([
      {
        p_tenant_id: context.tenantId,
        p_request_id: intent.requestId,
        p_command: {
          itemKey: item.item_key,
          sourceRevision: "8",
          expectedVersion: 0,
          operation: "set-state",
          state: "done",
        },
      },
    ]);
    expect(args(calls[0], "setHeader")).toEqual([["Authorization", "Bearer session"]]);
  });
  it("requires the captured reader and workspace, and preserves stale conflicts for Reload", async () => {
    const { client, calls } = fakeClient(() => ({
      data: null,
      error: { code: "PT409", message: "Changed in another tab" },
    }));
    const intent = createAttentionIntent(context, item, "seen", "observe");
    await expect(
      acknowledgeAttention(client, { ...context, userId: uuid(9) }, intent),
    ).rejects.toThrow("different workspace or reader");
    expect(calls).toHaveLength(0);
    await expect(acknowledgeAttention(client, context, intent)).rejects.toBeInstanceOf(
      AttentionConflict,
    );
    expect(() => createAttentionIntent({ ...context, tenantId: uuid(9) }, item, "done")).toThrow(
      "different workspace",
    );
  });
  it("Undo captures the committed acknowledgment version rather than the old displayed version", () => {
    const intent = createAttentionIntent(
      context,
      { ...item, state: "done", ack_version: 7 },
      "seen",
    );
    expect(intent.command).toMatchObject({
      operation: "set-state",
      expectedVersion: 7,
      state: "seen",
    });
    expect(
      attentionCommandSchema.safeParse({ ...intent.command, operation: "observe", state: null })
        .success,
    ).toBe(false);
    for (const expectedVersion of [-1, null, 1.5, Number.MAX_SAFE_INTEGER + 1])
      expect(attentionCommandSchema.safeParse({ ...intent.command, expectedVersion }).success).toBe(
        false,
      );
    expect(attentionCommandSchema.safeParse({ ...intent.command, userId: uuid(8) }).success).toBe(
      false,
    );
  });
});
