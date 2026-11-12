import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/app/workspace", () => ({ useWorkspace: () => ({}) }));

const { controlPrograms, readAssuranceTrace, traceKey, traceLinks, traceReach, traceTreatment } =
  await import("./assurance-trace");
type AssuranceTrace = import("./assurance-trace").AssuranceTrace;

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

const uuid = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const [program, other] = [uuid(1), uuid(2)];
const [au10, au6] = [uuid(10), uuid(11)];
const [req1, req2, req3] = [uuid(20), uuid(21), uuid(22)];
const [evd1, evd2] = [uuid(30), uuid(31)];
const [issue1, issue2] = [uuid(40), uuid(41)];
const risk1 = uuid(50);
const [item1, item2] = [uuid(60), uuid(61)];

/** A risk resting on one issue; a second issue with remediation and no risk. */
const trace: AssuranceTrace = {
  focus: { kind: "risk", id: risk1 },
  clipped: false,
  controls: [
    { id: au10, code: "AU-10", title: "Non-repudiation", family: "AU", family_title: "Audit" },
    { id: au6, code: "AU-6(3)", title: "Correlate", family: "AU", family_title: "Audit" },
  ],
  requirements: [
    {
      id: req1,
      code: "REQ-360",
      title: "Sign",
      state: "published",
      program_id: program,
      evidence_count: 1,
    },
    {
      id: req2,
      code: "REQ-349",
      title: "Correlate",
      state: "draft",
      program_id: program,
      evidence_count: 0,
    },
    {
      id: req3,
      code: "REQ-9",
      title: "Elsewhere",
      state: "draft",
      program_id: other,
      evidence_count: 2,
    },
  ],
  evidence: [
    {
      id: evd1,
      title: "Key history",
      kind: "document",
      program_id: program,
      version_id: uuid(32),
      version_number: 1,
      collected_at: null,
      review: "accepted",
      expires_at: null,
    },
    {
      id: evd2,
      title: "Audit direction",
      kind: "document",
      program_id: program,
      version_id: null,
      version_number: null,
      collected_at: null,
      review: "not_reviewed",
      expires_at: null,
    },
  ],
  issues: [
    {
      id: issue1,
      title: "Records unverifiable",
      severity: "critical",
      status: "open",
      opened_at: null,
      closed_at: null,
      program_id: program,
    },
    {
      id: issue2,
      title: "Direction out of date",
      severity: "low",
      status: "closed",
      opened_at: null,
      closed_at: null,
      program_id: program,
    },
  ],
  risks: [
    {
      id: risk1,
      title: "Records become unverifiable",
      status: "open",
      severity: "critical",
      likelihood: "high",
      impact: "very_high",
      program_id: program,
    },
  ],
  remediation: [
    {
      id: item1,
      title: "Publish the key history",
      status: "in_progress",
      planned_on: "2026-12-29",
      completed_on: null,
      milestones: [
        {
          id: uuid(70),
          title: "Draft",
          status: "completed",
          planned_on: "2026-10-01",
          completed_on: "2026-10-02",
        },
        {
          id: uuid(71),
          title: "Review",
          status: "in_progress",
          planned_on: "2026-11-01",
          completed_on: null,
        },
        {
          id: uuid(72),
          title: "Publish",
          status: "planned",
          planned_on: "2026-12-20",
          completed_on: null,
        },
        {
          id: uuid(73),
          title: "Dropped",
          status: "cancelled",
          planned_on: "2026-09-01",
          completed_on: null,
        },
      ],
    },
    {
      id: item2,
      title: "Reissue the direction",
      status: "completed",
      planned_on: "2026-09-30",
      completed_on: "2026-09-28",
      milestones: [
        {
          id: uuid(74),
          title: "Reissue",
          status: "completed",
          planned_on: "2026-09-30",
          completed_on: "2026-09-28",
        },
      ],
    },
  ],
  elements: [
    { id: uuid(81), code: "SYS-10", name: "Ground segment", program_id: program },
    { id: uuid(80), code: "SYS-2", name: "Flight computer", program_id: program },
  ],
  links: {
    control_requirement: [
      [au10, req1],
      [au6, req2],
    ],
    requirement_evidence: [[req1, evd1]],
    evidence_issue: [
      [evd1, issue1],
      [evd2, issue2],
    ],
    issue_risk: [[issue1, risk1]],
    issue_remediation: [
      [issue1, item1],
      [issue2, item2],
    ],
  },
};

describe("readAssuranceTrace", () => {
  it("asks for one record's trace as the reader, in its program when one is named", async () => {
    const { client: rpc, calls } = client({ data: trace, error: null });
    const answer = await readAssuranceTrace(
      rpc,
      { tenantId: "tenant", token: "token" },
      { kind: "control", id: au10, programId: program },
    );
    expect(answer.controls).toHaveLength(2);
    expect(calls[0]).toMatchObject({
      name: "assurance_trace",
      headers: { Authorization: "Bearer token" },
      args: { p_tenant_id: "tenant", p_kind: "control", p_id: au10, p_program_id: program },
    });
  });

  it("leaves the program out when none is named", async () => {
    const { client: rpc, calls } = client({ data: trace, error: null });
    await readAssuranceTrace(
      rpc,
      { tenantId: "tenant", token: "token" },
      { kind: "risk", id: risk1 },
    );
    expect(calls[0]?.args).not.toHaveProperty("p_program_id");
  });

  it("fails on the server's error and on an answer of another shape", async () => {
    const refused = client({ data: null, error: { message: "Workspace access is required" } });
    await expect(
      readAssuranceTrace(
        refused.client,
        { tenantId: "t", token: "k" },
        { kind: "risk", id: risk1 },
      ),
    ).rejects.toThrow("Workspace access is required");
    const wrong = client({ data: { focus: { kind: "risk", id: risk1 } }, error: null });
    await expect(
      readAssuranceTrace(wrong.client, { tenantId: "t", token: "k" }, { kind: "risk", id: risk1 }),
    ).rejects.toThrow();
  });
});

describe("traceLinks", () => {
  const links = traceLinks(trace);
  const has = (from: string, to: string) =>
    links.some((link) => link.from === from && link.to === to);

  it("draws each recorded link from the earlier stage to the later one", () => {
    expect(has(traceKey("control", au10), traceKey("requirement", req1))).toBe(true);
    expect(has(traceKey("requirement", req1), traceKey("evidence", evd1))).toBe(true);
    expect(has(traceKey("evidence", evd1), traceKey("issue", issue1))).toBe(true);
    expect(has(traceKey("issue", issue1), traceKey("risk", risk1))).toBe(true);
  });

  it("links an item from the risk of its issue, and from the issue itself when no risk rests on it", () => {
    expect(has(traceKey("risk", risk1), traceKey("remediation", item1))).toBe(true);
    expect(has(traceKey("issue", issue1), traceKey("remediation", item1))).toBe(false);
    expect(has(traceKey("issue", issue2), traceKey("remediation", item2))).toBe(true);
  });

  it("draws a link once however many records imply it", () => {
    const twice = traceLinks({
      ...trace,
      links: {
        ...trace.links,
        issue_risk: [
          [issue1, risk1],
          [issue2, risk1],
        ],
        issue_remediation: [
          [issue1, item1],
          [issue2, item1],
        ],
      },
    });
    expect(
      twice.filter(
        (link) =>
          link.from === traceKey("risk", risk1) && link.to === traceKey("remediation", item1),
      ),
    ).toHaveLength(1);
  });
});

describe("traceReach", () => {
  it("counts the controls of each family and lists the elements by code", () => {
    const reach = traceReach(trace);
    expect(reach.families).toEqual([{ code: "AU", title: "Audit", controls: 2 }]);
    expect(reach.elements.map((element) => element.code)).toEqual(["SYS-2", "SYS-10"]);
  });
});

describe("traceTreatment", () => {
  it("counts open items, reached milestones and the ones planned before today", () => {
    expect(traceTreatment(trace.remediation, "2026-11-10")).toEqual({
      items: 2,
      open: 1,
      milestones: 4,
      completed: 2,
      late: 1,
      dueOn: "2026-12-29",
      overdue: false,
    });
  });

  it("is overdue once the last planned completion has passed", () => {
    expect(traceTreatment(trace.remediation, "2026-12-30")).toMatchObject({
      late: 2,
      overdue: true,
    });
  });

  it("leaves a cancelled or risk-accepted item's dates out", () => {
    const stopped = traceTreatment(
      [{ ...trace.remediation[0]!, status: "risk_accepted" }],
      "2026-12-30",
    );
    expect(stopped).toMatchObject({ open: 0, late: 0, dueOn: null, overdue: false });
  });

  it("says nothing is due when there is no remediation", () => {
    expect(traceTreatment([], "2026-11-10")).toEqual({
      items: 0,
      open: 0,
      milestones: 0,
      completed: 0,
      late: 0,
      dueOn: null,
      overdue: false,
    });
  });
});

describe("controlPrograms", () => {
  it("gives each program its requirements, the ones with evidence, and its open issues and risks", () => {
    expect(controlPrograms(trace)).toEqual([
      { programId: program, requirements: 2, evidenced: 1, issues: 1, risks: 1 },
      { programId: other, requirements: 1, evidenced: 1, issues: 0, risks: 0 },
    ]);
  });
});
