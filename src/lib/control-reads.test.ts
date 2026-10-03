import { describe, expect, it, vi } from "vitest";
import { fakeClient, filter, uuid, type FakeCall } from "./testing/fake-client";

vi.mock("@/components/app/workspace", () => ({ useWorkspace: () => ({}) }));

const { readControlStatements, readMappingParts } = await import("./control-reads");

const context = { tenantId: uuid(900), token: "token" };
type Part = { id: string; control_id: string | null; parent_part_id: string | null };
const part = (n: number, parent: number | null, control = 50): Part => ({
  id: uuid(n),
  control_id: uuid(control),
  parent_part_id: parent === null ? null : uuid(parent),
});
/** A catalog: statement 1 holds item 2, which holds item 3; control 60 has parts 10 and 11. */
const catalog = [part(1, null), part(2, 1), part(3, 2), part(10, null, 60), part(11, 10, 60)];
const answer = (call: FakeCall) => {
  const ids = filter(call, "in", "id") as string[] | undefined;
  const controls = filter(call, "in", "control_id") as string[] | undefined;
  const data = catalog.filter(
    (row) => ids?.includes(row.id) || (row.control_id && controls?.includes(row.control_id)),
  );
  return { data, error: null, count: data.length };
};

describe("control statements", () => {
  it("reads the parts asked for, then climbs to every part above them", async () => {
    const { client, calls } = fakeClient(answer);
    const parts = await readControlStatements(client, context, [uuid(3)]);
    expect(parts.map((row) => row.id).sort()).toEqual([uuid(1), uuid(2), uuid(3)]);
    // One read per level, each for the parts not yet read.
    expect(calls.map((call) => filter(call, "in", "id"))).toEqual([
      [uuid(3)],
      [uuid(2)],
      [uuid(1)],
    ]);
  });

  it("reads nothing for no statements", async () => {
    const { client, calls } = fakeClient(answer);
    await expect(readControlStatements(client, context, [])).resolves.toEqual([]);
    expect(calls).toHaveLength(0);
  });
});

describe("mapped control parts", () => {
  it("reads the targets, then every part of their controls, each once", async () => {
    const { client, calls } = fakeClient(answer);
    const parts = await readMappingParts(client, context, [uuid(2), uuid(11), uuid(2)]);
    expect(parts.map((row) => row.id).sort()).toEqual(
      [uuid(1), uuid(2), uuid(3), uuid(10), uuid(11)].sort(),
    );
    expect(filter(calls[0], "in", "id")).toEqual([uuid(2), uuid(11)]);
    expect(filter(calls[1], "in", "control_id")).toEqual([uuid(50), uuid(60)]);
  });

  it("reads nothing when the requirement maps no statement", async () => {
    const { client, calls } = fakeClient(answer);
    await expect(readMappingParts(client, context, [])).resolves.toEqual([]);
    expect(calls).toHaveLength(0);
  });
});
