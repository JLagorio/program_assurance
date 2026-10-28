import { describe, expect, it } from "vitest";
import { readSavedViews, saveNamedView } from "./saved-views";
import { args, fakeClient, uuid } from "./testing/fake-client";
const context = { tenantId: uuid(1), userId: uuid(2), token: "session" };
const definition = { version: 1 as const, kind: "table" as const, question: {} };
describe("saved view isolation", () => {
  it("keeps usable views available when one shared or old definition is unsupported", async () => {
    const valid = {
      id: uuid(3),
      tenant_id: context.tenantId,
      owner_id: context.userId,
      scope_key: "requirements",
      name: "My view",
      visibility: "private",
      revision: 1,
      definition,
    };
    const fake = fakeClient(() => ({
      data: [
        valid,
        { ...valid, id: uuid(4), definition: {} },
        { ...valid, id: uuid(5), definition: { ...definition, version: 2 } },
      ],
      error: null,
    }));
    const result = await readSavedViews(fake.client, context, "requirements");
    expect(result.views.map((view) => view.id)).toEqual([uuid(3)]);
    expect(result.unsupportedCount).toBe(2);
    expect(args(fake.calls[0]!, "eq")).toContainEqual(["tenant_id", context.tenantId]);
    expect(args(fake.calls[0]!, "eq")).toContainEqual(["scope_key", "requirements"]);
  });
  it("preserves the same view identity and expected revision on a retry", async () => {
    const input = {
      id: uuid(3),
      scope: "requirements",
      name: "My view",
      visibility: "private" as const,
      definition,
      revision: 4,
    };
    const fake = fakeClient(() => ({
      data: {
        id: input.id,
        tenant_id: context.tenantId,
        owner_id: context.userId,
        scope_key: input.scope,
        name: input.name,
        visibility: input.visibility,
        revision: 5,
        definition,
      },
      error: null,
    }));
    await saveNamedView(fake.client, context, input);
    await saveNamedView(fake.client, context, input);
    expect(fake.calls[0]!.steps).toEqual(fake.calls[1]!.steps);
  });
});
