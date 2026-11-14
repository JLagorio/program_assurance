import { QueryClient } from "@tanstack/react-query";
import { describe, expect, it } from "vitest";

const { invalidateModel } = await import("./models");
const { TRACE_MODELS } = await import("./assurance-trace");
const {
  issueProgramHeldReason,
  issueRequirementRows,
  linkIssueRequirements,
  requirementChoices,
  unlinkIssueRequirement,
} = await import("./issue-requirements");

type Result = { data: unknown; error: { code?: string; message: string } | null };
type Call = { target: string; steps: [string, unknown[]][] };

/**
 * A stand-in for the Supabase client: every `from(table)` chain is recorded, and resolves (when
 * awaited, or at `maybeSingle`) to the next queued result.
 */
function fakeClient(results: Result[]) {
  const calls: Call[] = [];
  const queue = [...results];
  const next = () => Promise.resolve(queue.shift() ?? { data: null, error: null });
  const chain = (target: string) => {
    const call: Call = { target, steps: [] };
    calls.push(call);
    const builder: Record<string, unknown> = {};
    for (const name of ["select", "delete", "upsert", "eq", "setHeader"])
      builder[name] = (...args: unknown[]) => {
        call.steps.push([name, args]);
        return builder;
      };
    builder["maybeSingle"] = () => {
      call.steps.push(["maybeSingle", []]);
      return next();
    };
    builder["then"] = (resolve: (value: Result) => unknown, reject: (reason: unknown) => unknown) =>
      next().then(resolve, reject);
    return builder;
  };
  return { client: { from: (table: string) => chain(table) } as never, calls };
}

const tenantId = "00000000-0000-4000-8000-000000000001";
const context = { tenantId, token: "token" };
const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const step = (call: Call | undefined, name: string) =>
  call?.steps.find(([stepName]) => stepName === name)?.[1];
const filters = (call: Call | undefined) =>
  Object.fromEntries(
    (call?.steps ?? []).filter(([name]) => name === "eq").map(([, args]) => [args[0], args[1]]),
  );

const program = id(2);
const issue = id(3);
const revision = (
  requirement: string,
  version: number,
  title: string,
  more: Partial<{ state: string; requirement_type: string }> = {},
) => ({
  id: `${requirement}-${version}`,
  engineering_requirement_id: requirement,
  version_number: version,
  title,
  requirement_type: more.requirement_type ?? "security",
  state: more.state ?? "draft",
  statement: `${title} statement`,
  acceptance_criteria: `${title} criteria`,
});

describe("the requirements an issue names", () => {
  const requirements = [
    { id: id(10), code: "REQ-10", program_id: program },
    { id: id(11), code: "REQ-8", program_id: program },
    { id: id(12), code: "REQ-9", program_id: program },
  ];
  const revisions = [
    revision(id(10), 1, "Old title"),
    revision(id(10), 2, "Audit records are signed", { state: "published" }),
    revision(id(11), 1, "Sessions lock", { requirement_type: "functional" }),
  ];

  it("reads each at its latest revision, in code order", () => {
    const rows = issueRequirementRows(
      [
        { id: id(20), program_id: program, engineering_requirement_id: id(10) },
        { id: id(21), program_id: program, engineering_requirement_id: id(11) },
      ],
      requirements,
      revisions,
    );
    expect(rows).toEqual([
      {
        id: id(11),
        linkId: id(21),
        programId: program,
        code: "REQ-8",
        name: "Sessions lock",
        state: "draft",
        type: "Functional",
      },
      {
        id: id(10),
        linkId: id(20),
        programId: program,
        code: "REQ-10",
        name: "Audit records are signed",
        state: "published",
        type: "Security",
      },
    ]);
  });

  it("names a requirement with no revision by its code, and waits for one not read yet", () => {
    const rows = issueRequirementRows(
      [
        { id: id(22), program_id: program, engineering_requirement_id: id(12) },
        { id: id(23), program_id: program, engineering_requirement_id: id(13) },
      ],
      requirements,
      revisions,
    );
    expect(rows).toEqual([
      {
        id: id(12),
        linkId: id(22),
        programId: program,
        code: "REQ-9",
        name: "REQ-9",
        state: null,
        type: null,
      },
    ]);
  });
});

describe("what Link requirement offers", () => {
  it("offers the program's requirements at their latest revision that the issue does not name", () => {
    const choices = requirementChoices(
      [
        { id: id(10), code: "REQ-10", program_id: program },
        { id: id(11), code: "REQ-8", program_id: program },
        { id: id(12), code: "REQ-9", program_id: program },
        { id: id(14), code: "REQ-2", program_id: program },
      ],
      [
        revision(id(10), 1, "Old title"),
        revision(id(10), 2, "Audit records are signed", { state: "published" }),
        revision(id(11), 1, "Sessions lock"),
        revision(id(14), 1, "Keys rotate"),
      ],
      // REQ-8 is named already; REQ-9 has no revision to read before it is chosen.
      new Set([id(11)]),
    );
    expect(choices.map((choice) => choice.code)).toEqual(["REQ-2", "REQ-10"]);
    expect(choices[1]).toEqual({
      id: id(10),
      code: "REQ-10",
      name: "Audit records are signed",
      version: 2,
      state: "published",
      type: "Security",
      statement: "Audit records are signed statement",
      acceptanceCriteria: "Audit records are signed criteria",
    });
  });
});

describe("linking requirements to an issue", () => {
  it("inserts every chosen requirement in one request, in the issue's program, passing over the ones already named", async () => {
    const { client, calls } = fakeClient([{ data: [{ id: id(30) }], error: null }]);
    await expect(
      linkIssueRequirements(client, context, {
        issueId: issue,
        programId: program,
        requirementIds: [id(10), id(11), id(10)],
      }),
    ).resolves.toEqual({ linked: 1, alreadyLinked: 1 });
    expect(calls).toHaveLength(1);
    expect(calls[0]!.target).toBe("issue_requirements");
    expect(step(calls[0], "upsert")).toEqual([
      [
        {
          tenant_id: tenantId,
          program_id: program,
          issue_id: issue,
          engineering_requirement_id: id(10),
        },
        {
          tenant_id: tenantId,
          program_id: program,
          issue_id: issue,
          engineering_requirement_id: id(11),
        },
      ],
      { onConflict: "tenant_id,issue_id,engineering_requirement_id", ignoreDuplicates: true },
    ]);
    expect(step(calls[0], "setHeader")).toEqual(["Authorization", "Bearer token"]);
  });

  it("asks nothing of the server without a requirement, an issue or a program", async () => {
    const { client, calls } = fakeClient([]);
    await expect(
      linkIssueRequirements(client, context, {
        issueId: issue,
        programId: program,
        requirementIds: [],
      }),
    ).rejects.toThrow("Choose a requirement.");
    await expect(
      linkIssueRequirements(client, context, {
        issueId: "not-an-issue",
        programId: program,
        requirementIds: [id(10)],
      }),
    ).rejects.toThrow();
    expect(calls).toHaveLength(0);
  });

  it("says a refusal in the reader's words", async () => {
    const viewer = fakeClient([
      { data: null, error: { code: "42501", message: "new row violates row-level security" } },
    ]);
    await expect(
      linkIssueRequirements(viewer.client, context, {
        issueId: issue,
        programId: program,
        requirementIds: [id(10)],
      }),
    ).rejects.toThrow("Only an editor, admin or owner can change the requirements");
    // A requirement of another program, or one that is gone, is refused by the foreign keys.
    const elsewhere = fakeClient([
      { data: null, error: { code: "23503", message: "violates foreign key constraint" } },
    ]);
    await expect(
      linkIssueRequirements(elsewhere.client, context, {
        issueId: issue,
        programId: program,
        requirementIds: [id(10)],
      }),
    ).rejects.toThrow("no longer available in this program");
  });
});

describe("unlinking a requirement from an issue", () => {
  it("deletes the link in the workspace", async () => {
    const { client, calls } = fakeClient([{ data: [{ id: id(30) }], error: null }]);
    await expect(unlinkIssueRequirement(client, context, { linkId: id(30) })).resolves.toEqual({
      removed: true,
    });
    expect(calls).toHaveLength(1);
    expect(calls[0]!.target).toBe("issue_requirements");
    expect(step(calls[0], "delete")).toEqual([]);
    expect(filters(calls[0])).toEqual({ tenant_id: tenantId, id: id(30) });
  });

  it("counts a link that is already gone as removed, so a retry succeeds", async () => {
    const { client, calls } = fakeClient([
      { data: [], error: null },
      { data: null, error: null },
    ]);
    await expect(unlinkIssueRequirement(client, context, { linkId: id(30) })).resolves.toEqual({
      removed: false,
    });
    expect(calls).toHaveLength(2);
  });

  it("refuses a link the reader could not remove, and says a failure", async () => {
    const viewer = fakeClient([
      { data: [], error: null },
      { data: { id: id(30) }, error: null },
    ]);
    await expect(
      unlinkIssueRequirement(viewer.client, context, { linkId: id(30) }),
    ).rejects.toThrow("An editor, admin or owner can unlink it.");
    const failed = fakeClient([{ data: null, error: { message: "The database is unavailable" } }]);
    await expect(
      unlinkIssueRequirement(failed.client, context, { linkId: id(30) }),
    ).rejects.toThrow("The database is unavailable.");
  });
});

describe("why an issue's program is held", () => {
  it("names the requirements to unlink first, in code order", () => {
    expect(issueProgramHeldReason(["REQ-10", "REQ-8"])).toBe(
      "This issue names REQ-8 and REQ-10. Unlink them from the issue's Requirements to move the issue to another program.",
    );
    expect(issueProgramHeldReason(["REQ-8"])).toBe(
      "This issue names REQ-8. Unlink it from the issue's Requirements to move the issue to another program.",
    );
  });

  it("names the first three and counts the rest", () => {
    expect(issueProgramHeldReason(["REQ-4", "REQ-1", "REQ-3", "REQ-2", "REQ-5"])).toBe(
      "This issue names REQ-1, REQ-2, REQ-3, and 2 more. Unlink them from the issue's Requirements to move the issue to another program.",
    );
  });
});

describe("what a write marks stale", () => {
  it("is a model the chain reads watch, so a link or an unlink reads the trace and the posture again", async () => {
    expect(TRACE_MODELS).toContain("issue_requirements");
    const cache = new QueryClient();
    const keys = {
      // What useStaleOnWrite watches for the trace and the posture.
      watch: ["models", tenantId, "issue_requirements", "server-page-watch"],
      links: ["models", tenantId, "issue_requirements", { issue_id: issue }],
      elsewhere: ["models", id(9), "issue_requirements", { issue_id: issue }],
      unrelated: ["models", tenantId, "issue_evidence", {}],
    };
    for (const key of Object.values(keys)) cache.setQueryData(key, 1);
    await invalidateModel(cache, tenantId, "issue_requirements");
    const stale = (key: readonly unknown[]) => cache.getQueryState(key)?.isInvalidated;
    expect(stale(keys.watch)).toBe(true);
    expect(stale(keys.links)).toBe(true);
    expect(stale(keys.elsewhere)).toBe(false);
    expect(stale(keys.unrelated)).toBe(false);
  });
});
