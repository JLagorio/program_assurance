import { describe, expect, it } from "vitest";

const { readProgramSystemCounts } = await import("./system-counts");

type Answer = { data: unknown; error: { message: string } | null };

/** A client whose `rpc` calls are recorded and answer with `answer`. */
function client(answer: Answer) {
  const calls: { name: string; args: Record<string, unknown>; headers: Record<string, string> }[] =
    [];
  return {
    calls,
    client: {
      rpc(name: string, args: Record<string, unknown>) {
        const call = { name, args, headers: {} as Record<string, string> };
        calls.push(call);
        const builder = {
          setHeader(key: string, value: string) {
            call.headers[key] = value;
            return builder;
          },
          abortSignal: () => builder,
          then: (resolve: (value: Answer) => unknown, reject: (reason: unknown) => unknown) =>
            Promise.resolve(answer).then(resolve, reject),
        };
        return builder;
      },
    } as never,
  };
}

const context = { tenantId: "tenant", token: "token" };
const program = "00000000-0000-4000-8000-000000000001";

describe("readProgramSystemCounts", () => {
  it("asks for the program's elements in one request, as the reader, and names each count", async () => {
    const answer = {
      data: [
        {
          system_id: "boundary",
          control_count: 374,
          subtree_control_count: 380,
          additional_child_control_count: 6,
          unresolved_descendant_count: 1,
          requirement_count: 12,
          subtree_requirement_count: 40,
        },
        {
          system_id: "element",
          control_count: null,
          subtree_control_count: null,
          additional_child_control_count: 0,
          unresolved_descendant_count: 0,
          requirement_count: 0,
          subtree_requirement_count: 0,
        },
      ],
      error: null,
    };
    const read = client(answer);
    await expect(readProgramSystemCounts(read.client, context, program)).resolves.toEqual([
      {
        systemId: "boundary",
        controlCount: 374,
        subtreeControlCount: 380,
        additionalChildControlCount: 6,
        unresolvedDescendantCount: 1,
        requirementCount: 12,
        subtreeRequirementCount: 40,
      },
      {
        systemId: "element",
        controlCount: null,
        subtreeControlCount: null,
        additionalChildControlCount: 0,
        unresolvedDescendantCount: 0,
        requirementCount: 0,
        subtreeRequirementCount: 0,
      },
    ]);
    expect(read.calls).toEqual([
      {
        name: "program_system_counts",
        args: { p_program_id: program },
        headers: { Authorization: "Bearer token" },
      },
    ]);
  });

  it("says the server's refusal, and refuses an answer that is not counts", async () => {
    await expect(
      readProgramSystemCounts(
        client({ data: null, error: { message: "permission denied" } }).client,
        context,
        program,
      ),
    ).rejects.toThrow("permission denied");
    await expect(
      readProgramSystemCounts(
        client({ data: [{ system_id: "element", control_count: "many" }], error: null }).client,
        context,
        program,
      ),
    ).rejects.toThrow();
  });
});
