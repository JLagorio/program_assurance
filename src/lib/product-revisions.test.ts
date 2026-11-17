import { describe, expect, it, vi } from "vitest";

vi.mock("./database", () => ({ database: vi.fn(), requireIdentity: vi.fn() }));

import {
  CodeTaken,
  configurationCodeTaken,
  createProductConfiguration,
  elementCodeTaken,
  includeElements,
  saveProductElement,
} from "./product-revisions";
import { SaveOnceConflict } from "./save-once";
import {
  args,
  fakeClient,
  filter,
  uuid,
  type FakeCall,
  type FakeResult,
} from "./testing/fake-client";

const context = { tenantId: "tenant-1", token: "token" };
const productId = uuid(1);
const revisionId = uuid(2);
const ground = uuid(3);
const air = uuid(4);

/** Answers each request in turn, as the server would. */
function answering(...answers: FakeResult[]) {
  let next = 0;
  return fakeClient(() => answers[next++] ?? { data: null, error: null });
}
const none: FakeResult = { data: null, error: null };
const taken: FakeResult = { data: null, error: { code: "23505", message: "duplicate key value" } };

describe("creating a configuration, safe to retry", () => {
  const id = uuid(11);
  const draft = { id, productId, code: " GL ", name: " Ground launch ", description: "  " };
  const stored = {
    id,
    tenant_id: "tenant-1",
    revision: 1,
    state: "active",
    product_id: productId,
    code: "GL",
    name: "Ground launch",
    description: null,
  };

  it("creates it under the id its form chose", async () => {
    const { client, calls } = answering(none, { data: stored, error: null });
    const result = await createProductConfiguration(client, context, draft);
    expect(result).toEqual({ outcome: "created", record: stored });
    expect(filter(calls[0], "eq", "id")).toBe(id);
    expect(filter(calls[0], "eq", "tenant_id")).toBe("tenant-1");
    expect(args(calls[1], "insert")[0]?.[0]).toEqual({
      id,
      tenant_id: "tenant-1",
      product_id: productId,
      code: "GL",
      name: "Ground launch",
      description: null,
    });
  });

  it("finds the first try after a lost answer, and is not refused on its code", async () => {
    const { client, calls } = answering({ data: stored, error: null });
    const result = await createProductConfiguration(client, context, draft);
    expect(result).toEqual({ outcome: "unchanged", record: stored });
    expect(calls).toHaveLength(1);
  });

  it("refuses, in words, the same id saved with another name", async () => {
    const { client, calls } = answering({ data: { ...stored, name: "Air launch" }, error: null });
    const saving = createProductConfiguration(client, context, draft);
    await expect(saving).rejects.toBeInstanceOf(SaveOnceConflict);
    await expect(saving).rejects.toMatchObject({ reason: "different" });
    expect(calls).toHaveLength(1);
  });

  it("says another configuration holds the code, as the code's own issue", async () => {
    const { client } = answering(none, taken, none);
    const saving = createProductConfiguration(client, context, draft);
    await expect(saving).rejects.toBeInstanceOf(CodeTaken);
    await expect(saving).rejects.toMatchObject({
      code: "GL",
      message: configurationCodeTaken("GL"),
    });
  });
});

describe("including elements in a configuration", () => {
  it("adds them in one statement, passing over those already in it", async () => {
    const { client, calls } = answering(none);
    await includeElements(client, context, {
      revisionId,
      configurationId: ground,
      elementIds: [uuid(21), uuid(22)],
    });
    expect(calls).toHaveLength(1);
    const [rows, options] = args(calls[0], "upsert")[0] ?? [];
    expect(rows).toEqual([
      {
        tenant_id: "tenant-1",
        product_revision_id: revisionId,
        product_configuration_id: ground,
        product_element_id: uuid(21),
      },
      {
        tenant_id: "tenant-1",
        product_revision_id: revisionId,
        product_configuration_id: ground,
        product_element_id: uuid(22),
      },
    ]);
    expect(options).toEqual({
      onConflict: "tenant_id,product_revision_id,product_configuration_id,product_element_id",
      ignoreDuplicates: true,
    });
  });

  it("sends nothing for no elements", async () => {
    const { client, calls } = answering();
    await includeElements(client, context, { revisionId, configurationId: ground, elementIds: [] });
    expect(calls).toEqual([]);
  });
});

describe("saving a product element, safe to retry", () => {
  const id = uuid(31);
  const child = uuid(32);
  const element = {
    id,
    parentId: null,
    code: " GUID ",
    name: " Guidance unit ",
    description: "",
    elementType: "hardware" as const,
    definedComponentId: null,
    position: 2,
  };
  const stored = {
    id,
    tenant_id: "tenant-1",
    revision: 1,
    product_revision_id: revisionId,
    parent_element_id: null,
    code: "GUID",
    name: "Guidance unit",
    description: null,
    element_type: "hardware",
    defined_component_id: null,
    position: 2,
  };
  const membership = (rowId: number, configurationId: string, elementId = id) => ({
    id: uuid(rowId),
    product_configuration_id: configurationId,
    product_element_id: elementId,
  });

  it("creates it under the id its form chose, then joins the configurations chosen", async () => {
    const { client, calls } = answering(
      none,
      { data: stored, error: null },
      { data: [], error: null },
      none,
    );
    const result = await saveProductElement(client, context, {
      revisionId,
      element,
      configurationIds: [ground, air],
      descendantIds: [],
    });
    expect(result).toEqual({ id, outcome: "created" });
    expect(args(calls[1], "insert")[0]?.[0]).toEqual({
      id,
      tenant_id: "tenant-1",
      product_revision_id: revisionId,
      parent_element_id: null,
      code: "GUID",
      name: "Guidance unit",
      description: null,
      element_type: "hardware",
      defined_component_id: null,
      position: 2,
    });
    // The memberships are read as the server holds them, for the element and what is inside it.
    expect(calls[2]?.table).toBe("product_configuration_elements");
    expect(args(calls[2], "in")[0]).toEqual(["product_element_id", [id]]);
    expect(args(calls[3], "upsert")[0]?.[0]).toEqual([
      expect.objectContaining({ product_configuration_id: ground, product_element_id: id }),
      expect.objectContaining({ product_configuration_id: air, product_element_id: id }),
    ]);
    expect(calls).toHaveLength(4);
  });

  it("finds the first try after a lost answer: one element, and only the memberships still missing", async () => {
    const { client, calls } = answering(
      { data: stored, error: null },
      { data: [membership(41, ground)], error: null },
      none,
    );
    const result = await saveProductElement(client, context, {
      revisionId,
      element,
      configurationIds: [ground, air],
      descendantIds: [],
    });
    expect(result).toEqual({ id, outcome: "unchanged" });
    expect(calls.some((call) => args(call, "insert").length)).toBe(false);
    expect(args(calls[2], "upsert")[0]?.[0]).toEqual([
      expect.objectContaining({ product_configuration_id: air, product_element_id: id }),
    ]);
  });

  it("writes nothing more when the first try saved the element and its memberships", async () => {
    const { client, calls } = answering(
      { data: stored, error: null },
      { data: [membership(41, ground), membership(42, air)], error: null },
    );
    await saveProductElement(client, context, {
      revisionId,
      element,
      configurationIds: [ground, air],
      descendantIds: [],
    });
    expect(calls).toHaveLength(2);
  });

  it("refuses, in words, the same id saved with another name, and touches no membership", async () => {
    const { client, calls } = answering({ data: { ...stored, name: "Seeker" }, error: null });
    await expect(
      saveProductElement(client, context, {
        revisionId,
        element,
        configurationIds: [ground],
        descendantIds: [],
      }),
    ).rejects.toMatchObject({ reason: "different" });
    expect(calls).toHaveLength(1);
  });

  it("says another element of the version holds the code, as the code's own issue", async () => {
    const { client, calls } = answering(none, taken, none);
    const saving = saveProductElement(client, context, {
      revisionId,
      element,
      configurationIds: [ground],
      descendantIds: [],
    });
    await expect(saving).rejects.toBeInstanceOf(CodeTaken);
    await expect(saving).rejects.toMatchObject({ code: "GUID", message: elementCodeTaken("GUID") });
    expect(calls).toHaveLength(3);
  });

  it("edits at the revision the reader saw, and a configuration it leaves takes what is inside it", async () => {
    const { client, calls } = answering(
      { data: { ...stored, revision: 3, name: "Old name" }, error: null },
      { data: { ...stored, revision: 4 }, error: null },
      {
        data: [membership(41, ground), membership(42, air), membership(43, air, child)],
        error: null,
      },
      none,
    );
    const result = await saveProductElement(client, context, {
      revisionId,
      element: { ...element, revision: 3 },
      configurationIds: [ground],
      descendantIds: [child],
    });
    expect(result.outcome).toBe("updated");
    expect(args(calls[1], "update")[0]?.[0]).toMatchObject({ name: "Guidance unit", revision: 4 });
    expect(filter(calls[1], "eq", "revision")).toBe(3);
    expect(args(calls[2], "in")[0]).toEqual(["product_element_id", [id, child]]);
    expect(args(calls[3], "delete")).toHaveLength(1);
    expect(args(calls[3], "in")[0]).toEqual(["id", [uuid(42), uuid(43)]]);
    expect(calls).toHaveLength(4);
  });

  it("refuses an edit at a stale revision as another session's change, and writes nothing", async () => {
    const { client, calls } = answering({
      data: { ...stored, revision: 4, name: "Their name" },
      error: null,
    });
    const saving = saveProductElement(client, context, {
      revisionId,
      element: { ...element, revision: 3 },
      configurationIds: [],
      descendantIds: [],
    });
    await expect(saving).rejects.toBeInstanceOf(SaveOnceConflict);
    await expect(saving).rejects.toMatchObject({ reason: "changed" });
    expect(calls).toHaveLength(1);
  });

  it("refuses an edit that the server finds stale between its lookup and its update", async () => {
    const { client } = answering(
      { data: { ...stored, revision: 3, name: "Old name" }, error: null },
      { data: null, error: { code: "PT409", message: "Record revision conflict" } },
    );
    await expect(
      saveProductElement(client, context, {
        revisionId,
        element: { ...element, revision: 3 },
        configurationIds: [],
        descendantIds: [],
      }),
    ).rejects.toMatchObject({ reason: "changed" });
  });
});
