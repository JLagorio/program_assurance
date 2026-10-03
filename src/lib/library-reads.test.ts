import { describe, expect, it, vi } from "vitest";
import { fakeClient, filter, uuid, type FakeCall } from "./testing/fake-client";

vi.mock("@/components/app/workspace", () => ({ useWorkspace: () => ({}) }));

const { readEvidenceLinks } = await import("./library-reads");

const context = { tenantId: uuid(900), token: "token" };
const link = (n: number, contribution: number | null, statement: number | null) => ({
  id: uuid(n),
  evidence_version_id: uuid(n + 100),
  component_contribution_id: contribution === null ? null : uuid(contribution),
  implementation_statement_id: statement === null ? null : uuid(statement),
});
const links = [link(1, 10, null), link(2, null, 20), link(3, 10, 20), link(4, 11, null)];
const answer = (call: FakeCall) => {
  const contributions = filter(call, "in", "component_contribution_id") as string[] | undefined;
  const statements = filter(call, "in", "implementation_statement_id") as string[] | undefined;
  const data = links.filter(
    (row) =>
      (row.component_contribution_id && contributions?.includes(row.component_contribution_id)) ||
      (row.implementation_statement_id && statements?.includes(row.implementation_statement_id)),
  );
  return { data, error: null, count: data.length };
};

describe("a library component's evidence links", () => {
  it("reads the links of its contributions and of their statements, each once", async () => {
    const { client, calls } = fakeClient(answer);
    const found = await readEvidenceLinks(client, context, {
      contributionIds: [uuid(10)],
      statementIds: [uuid(20)],
    });
    expect(found.map((row) => row.id).sort()).toEqual([uuid(1), uuid(2), uuid(3)]);
    expect(calls).toHaveLength(2);
  });

  it("reads nothing for a component that is not used", async () => {
    const { client, calls } = fakeClient(answer);
    await expect(
      readEvidenceLinks(client, context, { contributionIds: [], statementIds: [] }),
    ).resolves.toEqual([]);
    expect(calls).toHaveLength(0);
  });
});
