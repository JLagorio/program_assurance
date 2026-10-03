import { describe, expect, it } from "vitest";
import { readSchemaCatalog, schemaCatalogKey } from "./schema-catalog";
import { args, fakeClient } from "./testing/fake-client";

const systems = {
  name: "systems",
  description: null,
  columns: [
    {
      name: "id",
      type: "uuid",
      required: true,
      default: "gen_random_uuid()",
      description: null,
      choices: [],
    },
  ],
  relations: [],
  can_insert: true,
  can_update: true,
  can_delete: false,
};

describe("the record schema", () => {
  it("reads the collections with the session's token", async () => {
    const { client, calls } = fakeClient(() => ({ data: [systems], error: null }));
    await expect(readSchemaCatalog(client, "token")).resolves.toEqual([systems]);
    expect(calls[0]?.table).toBe("rpc:app_schema");
    expect(args(calls[0], "setHeader")[0]).toEqual(["Authorization", "Bearer token"]);
  });

  it("says the schema could not be read, with the database's reason", async () => {
    const { client } = fakeClient(() => ({ data: null, error: { message: "Sign in required" } }));
    await expect(readSchemaCatalog(client, "token")).rejects.toThrow(
      "The record schema could not be read. Sign in required",
    );
  });

  it("refuses a schema it cannot read as collections", async () => {
    const { client } = fakeClient(() => ({ data: [{ name: "systems" }], error: null }));
    await expect(readSchemaCatalog(client, "token")).rejects.toThrow();
  });

  it("is kept per workspace", () => {
    expect(schemaCatalogKey("a")).toEqual(["schema-catalog", "a"]);
  });
});
