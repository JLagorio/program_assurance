import { describe, expect, it } from "vitest";
import {
  args,
  fakeClient,
  filter,
  uuid,
  type FakeCall,
  type FakeResult,
} from "./testing/fake-client";

const {
  COMPONENT_OFFER_COLUMNS,
  COMPONENT_OFFER_DECISIONS,
  COMPONENT_OFFER_KINDS,
  OFFER_ANSWER_UNREADABLE,
  OFFER_ITEM_LIMIT,
  OFFER_NEEDS_COMPONENT,
  OFFER_REVISION_MISSING,
  REVIEW_ANSWER_UNREADABLE,
  REVIEW_NEEDS_NOTE,
  WITHDRAWAL_ANSWER_UNREADABLE,
  componentOfferRead,
  offerNeedsItems,
  offerToComponent,
  offerTooMany,
  readComponentOffer,
  reviewComponentOffer,
  withdrawComponentOffer,
} = await import("./component-offers");
const { NO_OWNER } = await import("./owner-assign");
const { readServerPage } = await import("./server-table");
const { componentOfferStates } = await import("./status");

const context = { tenantId: uuid(1), token: "token" };

// The seeded scenario: WS-X90 offers the CVE it found on its LRU-001, built from version 1 of the
// X800 component set's Mission Computer, to the component's owner, Priya Raghavan.
const offer = {
  id: uuid(10),
  tenant_id: uuid(1),
  kind: "finding",
  title: "CVE-2024-6387 in the Mission Computer's OpenSSH server",
  note: "Found on WS-X90's LRU-001.",
  state: "offered",
  items: 1,
  defined_component_id: uuid(20),
  component_name: "Mission Computer",
  component_type: "hardware",
  component_definition_id: uuid(21),
  definition_code: "x800-components",
  definition_name: "X800 Missile component set",
  component_definition_revision_id: uuid(22),
  version: 1,
  program_id: uuid(30),
  program_code: "PRG-1090",
  program_name: "WS-X90 Sentinel Mission System",
  system_id: uuid(31),
  system_code: "SYS-WSX90",
  system_name: "WS-X90 Sentinel Mission System",
  system_component_id: uuid(32),
  system_component_code: "LRU-001",
  system_component_name: "Mission Computer",
  offered_by_party_id: uuid(40),
  offered_by_name: "Ingrid Solberg",
  offered_at: "2026-11-14T16:30:00+00:00",
  owner_party_id: uuid(41),
  owner_name: "Priya Raghavan",
  waiting_on_party_id: uuid(41),
  waiting_on_name: "Priya Raghavan",
  reviewed_by_party_id: null,
  reviewed_by_name: null,
  reviewed_at: null,
  review_note: null,
  withdrawn_by_party_id: null,
  withdrawn_at: null,
  component_assessment_id: null,
  issues_opened: 0,
  revision: 1,
};

describe("the offers' vocabulary", () => {
  it("holds a finding or determinations, and is accepted or returned", () => {
    expect([...COMPONENT_OFFER_KINDS]).toEqual(["finding", "determinations"]);
    expect([...COMPONENT_OFFER_DECISIONS]).toEqual(["accepted", "returned"]);
    // A decision is a state the offer then stands at.
    for (const decision of COMPONENT_OFFER_DECISIONS)
      expect(componentOfferStates).toHaveProperty(decision);
    expect(Object.keys(componentOfferStates)).toEqual([
      "offered",
      "accepted",
      "returned",
      "withdrawn",
    ]);
  });
});

describe("the offers register's read", () => {
  it("reads the view with what a register and a preview draw, and reads again when what it derives from is written", () => {
    const read = componentOfferRead();
    expect(read).toMatchObject({ source: "component_offer_rows", model: "component_offers" });
    expect(read.scope).toBeUndefined();
    expect(read.columns).toEqual([...COMPONENT_OFFER_COLUMNS]);
    // The revision a withdrawal or a review is sent at, and who it waits on.
    for (const column of ["revision", "waiting_on_party_id", "review_note", "issues_opened"])
      expect(read.columns).toContain(column);
    for (const model of [
      "component_offer_items",
      "component_offer_issues",
      "component_owners",
      "defined_components",
      "system_components",
      "programs",
      "parties",
    ])
      expect(read.models).toContain(model);
  });

  it("keeps to one component across its versions, one version, one program or one system component", () => {
    // A component is followed by its name through the versions of its set.
    expect(
      componentOfferRead({
        component: { componentDefinitionId: uuid(21), componentName: "Mission Computer" },
      }).scope,
    ).toEqual({ component_definition_id: uuid(21), component_name: "Mission Computer" });
    expect(componentOfferRead({ definedComponentId: uuid(20) }).scope).toEqual({
      defined_component_id: uuid(20),
    });
    expect(componentOfferRead({ programId: uuid(30) }).scope).toEqual({ program_id: uuid(30) });
    expect(componentOfferRead({ programId: uuid(30), systemComponentId: uuid(32) }).scope).toEqual({
      program_id: uuid(30),
      system_component_id: uuid(32),
    });
  });

  it("lists what waits first, then the newest, inside its scope", async () => {
    const { client, calls } = fakeClient(() => ({ data: [offer], error: null, count: 1 }));
    const page = await readServerPage(
      client,
      context,
      componentOfferRead({ programId: uuid(30) }),
      { pageIndex: 0, pageSize: 25 },
    );
    expect(page.count).toBe(1);
    expect(calls[0]?.table).toBe("component_offer_rows");
    expect(args(calls[0], "eq")).toEqual([["program_id", uuid(30)]]);
    expect(args(calls[0], "order")).toEqual([
      ["state_rank", { ascending: true, nullsFirst: false }],
      ["offered_at", { ascending: false, nullsFirst: false }],
      ["id"],
    ]);
  });

  it("sorts a kind and a state in the product's order, and reads its people by name", async () => {
    const { client, calls } = fakeClient(() => ({ data: [], error: null, count: 0 }));
    await readServerPage(client, context, componentOfferRead(), {
      pageIndex: 0,
      pageSize: 25,
      search: "returned",
      sorting: [
        { id: "state", desc: false },
        { id: "kind", desc: true },
        { id: "waiting_on", desc: false },
      ],
      filters: [
        { id: "owner_party_id", value: [NO_OWNER] },
        { id: "program", value: ["WS-X90 Sentinel Mission System"] },
        { id: "state", value: ["offered", "returned"] },
      ],
    });
    expect(args(calls[0], "order")).toEqual([
      ["state_rank", { ascending: true, nullsFirst: false }],
      ["kind_rank", { ascending: false, nullsFirst: true }],
      ["waiting_on_name", { ascending: true, nullsFirst: false }],
      ["id"],
    ]);
    expect(args(calls[0], "is")).toEqual([["owner_name", null]]);
    expect(args(calls[0], "in")).toEqual([
      ["program_name", ["WS-X90 Sentinel Mission System"]],
      ["state", ["offered", "returned"]],
    ]);
    // The search finds a state by the word its badge shows.
    expect(String(args(calls[0], "or")[1]?.[0])).toContain('state.in.("returned")');
  });
});

describe("one offer with what it holds", () => {
  const tables = (answers: Record<string, unknown[]>) =>
    fakeClient((call: FakeCall): FakeResult => {
      const rows = answers[call.table] ?? [];
      return { data: rows, error: null, count: rows.length };
    });

  it("reads the offer, its items and its links together, then the records they name", async () => {
    const accepted = {
      ...offer,
      state: "accepted",
      waiting_on_party_id: null,
      waiting_on_name: null,
      reviewed_by_party_id: uuid(41),
      reviewed_by_name: "Priya Raghavan",
      reviewed_at: "2026-11-15T09:00:00+00:00",
      issues_opened: 2,
      revision: 2,
    };
    const issue = (id: number, program: number, title: string, status = "open") => ({
      id: uuid(id),
      program_id: uuid(program),
      title,
      severity: "high",
      status,
      opened_at: "2026-11-15T09:00:00+00:00",
      owner_party_id: null,
    });
    const { client, calls } = tables({
      component_offer_rows: [accepted],
      component_offer_items: [
        { id: uuid(50), issue_id: uuid(60), assessment_finding_id: null, control_id: null },
      ],
      component_offer_issues: [
        {
          id: uuid(72),
          component_offer_item_id: uuid(50),
          program_id: uuid(34),
          issue_id: uuid(62),
          system_component_id: uuid(36),
          source: false,
        },
        {
          id: uuid(71),
          component_offer_item_id: uuid(50),
          program_id: uuid(33),
          issue_id: uuid(61),
          system_component_id: uuid(35),
          source: false,
        },
        {
          id: uuid(70),
          component_offer_item_id: uuid(50),
          program_id: uuid(30),
          issue_id: uuid(60),
          system_component_id: uuid(32),
          source: true,
        },
      ],
      operational_issues: [
        { ...issue(60, 30, "CVE-2024-6387 in the OpenSSH server"), owner_party_id: uuid(40) },
        issue(61, 33, "CVE-2024-6387 in the OpenSSH server"),
        issue(62, 34, "CVE-2024-6387 in the OpenSSH server", "resolved"),
      ],
      programs: [
        { id: uuid(30), code: "PRG-1090", name: "WS-X90 Sentinel Mission System" },
        { id: uuid(33), code: "PRG-2101", name: "Customer A" },
        { id: uuid(34), code: "PRG-2102", name: "Customer B" },
      ],
    });
    const read = await readComponentOffer(client, context, uuid(10));
    // The offer is the register's own row, read by its id; its items and links by the offer.
    expect(calls.slice(0, 3).map((call) => call.table)).toEqual([
      "component_offer_rows",
      "component_offer_items",
      "component_offer_issues",
    ]);
    expect(filter(calls[0], "eq", "id")).toBe(uuid(10));
    expect(filter(calls[1], "eq", "component_offer_id")).toBe(uuid(10));
    expect(filter(calls[2], "eq", "component_offer_id")).toBe(uuid(10));
    // Then the issues and the programs they name; an offer of a finding names no assessment
    // finding and no control, so neither is asked for.
    expect(calls.slice(3).map((call) => call.table)).toEqual(["operational_issues", "programs"]);
    expect(filter(calls[3], "in", "id")).toEqual([uuid(60), uuid(61), uuid(62)]);
    expect(filter(calls[4], "in", "id")).toEqual([uuid(30), uuid(33), uuid(34)]);
    for (const call of calls)
      expect(args(call, "setHeader")).toContainEqual(["Authorization", "Bearer token"]);

    expect(read?.offer).toMatchObject({ id: uuid(10), state: "accepted", issues_opened: 2 });
    expect(read?.items).toEqual([
      {
        id: uuid(50),
        issueId: uuid(60),
        issue: {
          id: uuid(60),
          programId: uuid(30),
          title: "CVE-2024-6387 in the OpenSSH server",
          severity: "high",
          status: "open",
          openedAt: "2026-11-15T09:00:00+00:00",
          ownerPartyId: uuid(40),
        },
        assessmentFindingId: null,
        finding: null,
      },
    ]);
    // Each program's own issue for the finding: the source first, then by program code.
    expect(
      read?.issues.map((link) => [link.programCode, link.source, link.issue?.status, link.itemId]),
    ).toEqual([
      ["PRG-1090", true, "open", uuid(50)],
      ["PRG-2101", false, "open", uuid(50)],
      ["PRG-2102", false, "resolved", uuid(50)],
    ]);
    expect(read?.issues[1]).toMatchObject({
      programId: uuid(33),
      programName: "Customer A",
      issueId: uuid(61),
      systemComponentId: uuid(35),
    });
  });

  it("reads an offer of determinations as its findings, each with the control it judges, in code order", async () => {
    const { client, calls } = tables({
      component_offer_rows: [{ ...offer, kind: "determinations", items: 2 }],
      component_offer_items: [
        { id: uuid(51), issue_id: null, assessment_finding_id: uuid(81), control_id: uuid(91) },
        { id: uuid(50), issue_id: null, assessment_finding_id: uuid(80), control_id: uuid(90) },
      ],
      assessment_findings: [
        {
          id: uuid(80),
          title: "AC-2 account management",
          determination: "satisfied",
          determined_at: "2026-10-01T12:00:00+00:00",
        },
        {
          id: uuid(81),
          title: "AC-10 concurrent sessions",
          determination: "other_than_satisfied",
          determined_at: null,
        },
      ],
      controls: [
        { id: uuid(90), code: "AC-2", title: "Account Management" },
        { id: uuid(91), code: "AC-10", title: "Concurrent Session Control" },
      ],
    });
    const read = await readComponentOffer(client, context, uuid(10));
    // Nothing is linked until a finding is accepted, so no issue and no program is asked for.
    expect(calls.slice(3).map((call) => call.table)).toEqual(["assessment_findings", "controls"]);
    expect(read?.issues).toEqual([]);
    expect(
      read?.items.map((item) => [item.finding?.control?.code, item.finding?.determination]),
    ).toEqual([
      ["AC-2", "satisfied"],
      ["AC-10", "other_than_satisfied"],
    ]);
    expect(read?.items[0]).toMatchObject({
      issueId: null,
      issue: null,
      assessmentFindingId: uuid(80),
      finding: {
        id: uuid(80),
        title: "AC-2 account management",
        determinedAt: "2026-10-01T12:00:00+00:00",
        control: { id: uuid(90), code: "AC-2", title: "Account Management" },
      },
    });
  });

  it("names an item whose record the reader can no longer read by its id alone", async () => {
    const { client } = tables({
      component_offer_rows: [offer],
      component_offer_items: [
        { id: uuid(50), issue_id: uuid(60), assessment_finding_id: null, control_id: null },
      ],
    });
    const read = await readComponentOffer(client, context, uuid(10));
    expect(read?.items).toEqual([
      { id: uuid(50), issueId: uuid(60), issue: null, assessmentFindingId: null, finding: null },
    ]);
  });

  it("answers nothing for an offer that is gone, and passes a failed read on", async () => {
    const gone = tables({});
    await expect(readComponentOffer(gone.client, context, uuid(10))).resolves.toBeNull();
    // The offer's own three reads, and nothing after them.
    expect(gone.calls).toHaveLength(3);
    const failed = fakeClient(() => ({ data: null, error: { message: "permission denied" } }));
    await expect(readComponentOffer(failed.client, context, uuid(10))).rejects.toThrow(
      "permission denied",
    );
  });
});

/** A client whose one `rpc` call answers with `data`, or refuses with `error`. */
const rpc = (data: unknown, error: { code?: string; message: string } | null = null) =>
  fakeClient(() => ({ data, error }));
const sent = (call: FakeCall | undefined) => args(call, "rpc")[0]?.[0];

describe("offering to a component's owner", () => {
  const request = {
    systemComponentId: uuid(32),
    kind: "finding" as const,
    itemIds: [uuid(60)],
    requestId: uuid(99),
  };
  const answered = {
    offerId: uuid(10),
    kind: "finding",
    state: "offered",
    revision: 1,
    items: 1,
    definedComponentId: uuid(20),
    programId: uuid(30),
    systemComponentId: uuid(32),
    waitingOnPartyId: uuid(41),
    offeredAt: "2026-11-14T16:30:00+00:00",
    activityEventId: uuid(98),
  };

  it("sends one request with every item once, a title and a note only where the reader wrote one", async () => {
    const { client, calls } = rpc(answered);
    await expect(
      offerToComponent(client, context, {
        ...request,
        itemIds: [uuid(60), uuid(61), uuid(60)],
        title: "  OpenSSH server CVEs ",
        note: " ",
      }),
    ).resolves.toEqual(answered);
    expect(calls).toHaveLength(1);
    expect(calls[0]?.table).toBe("rpc:offer_to_component");
    expect(sent(calls[0])).toEqual({
      p_tenant_id: uuid(1),
      p_system_component_id: uuid(32),
      p_kind: "finding",
      p_item_ids: [uuid(60), uuid(61)],
      p_title: "OpenSSH server CVEs",
      p_note: null,
      p_request_id: uuid(99),
    });
    expect(args(calls[0], "setHeader")).toEqual([["Authorization", "Bearer token"]]);
  });

  it("leaves the title to the first item where the reader gives none, and sends the same request again as it is", async () => {
    const { client, calls } = rpc({ ...answered, waitingOnPartyId: null });
    const first = await offerToComponent(client, context, request);
    await offerToComponent(client, context, request);
    // A component nobody owns yet waits on nobody.
    expect(first.waitingOnPartyId).toBeNull();
    expect(sent(calls[0])).toMatchObject({ p_title: null, p_note: null });
    expect(sent(calls[1])).toEqual(sent(calls[0]));
  });

  it("sends nothing without a component, without an item or for more than an offer holds", async () => {
    const { client, calls } = rpc(answered);
    await expect(
      offerToComponent(client, context, { ...request, systemComponentId: "" }),
    ).rejects.toThrow(OFFER_NEEDS_COMPONENT);
    await expect(offerToComponent(client, context, { ...request, itemIds: [] })).rejects.toThrow(
      "Choose at least one operational issue to offer.",
    );
    const many = Array.from({ length: OFFER_ITEM_LIMIT + 1 }, (_, index) => uuid(1000 + index));
    await expect(
      offerToComponent(client, context, { ...request, kind: "determinations", itemIds: many }),
    ).rejects.toThrow("Offer at most 200 assessment findings at a time.");
    expect(offerNeedsItems("determinations")).toBe(
      "Choose at least one assessment finding to offer.",
    );
    expect(offerTooMany("finding")).toBe("Offer at most 200 operational issues at a time.");
    expect(calls).toEqual([]);
  });

  it("says each refusal in the command's own words, ending a sentence", async () => {
    for (const [message, said] of [
      [
        "The program declared this component's element modified. Only a result on an unmodified component is offered to its owner.",
        "The program declared this component's element modified. Only a result on an unmodified component is offered to its owner.",
      ],
      [
        "This component is built from no library component, so it has no owner to offer to",
        "This component is built from no library component, so it has no owner to offer to.",
      ],
      [
        "This operational issue already waits in an offer to the component's owner",
        "This operational issue already waits in an offer to the component's owner.",
      ],
      [
        "Offer a finding of published assessment results. Draft results decide nothing yet.",
        "Offer a finding of published assessment results. Draft results decide nothing yet.",
      ],
      [
        "An editor, admin, or owner can offer a result to a component's owner",
        "An editor, admin, or owner can offer a result to a component's owner.",
      ],
    ] as const) {
      const { client } = rpc(null, { message });
      await expect(offerToComponent(client, context, request)).rejects.toThrow(said);
    }
  });

  it("says when the answer cannot be read, since the offer may have been made", async () => {
    const { client } = rpc({ ...answered, state: "pending" });
    await expect(offerToComponent(client, context, request)).rejects.toThrow(
      OFFER_ANSWER_UNREADABLE,
    );
  });
});

describe("withdrawing an offer", () => {
  const request = { offerId: uuid(10), expectedRevision: 1, requestId: uuid(99) };
  const answered = {
    offerId: uuid(10),
    state: "withdrawn",
    revision: 2,
    withdrawnAt: "2026-11-15T10:00:00+00:00",
    activityEventId: uuid(98),
  };

  it("sends one request at the revision the reader saw", async () => {
    const { client, calls } = rpc(answered);
    await expect(withdrawComponentOffer(client, context, request)).resolves.toEqual(answered);
    expect(calls[0]?.table).toBe("rpc:withdraw_component_offer");
    expect(sent(calls[0])).toEqual({
      p_tenant_id: uuid(1),
      p_offer_id: uuid(10),
      p_expected_revision: 1,
      p_request_id: uuid(99),
    });
    expect(args(calls[0], "setHeader")).toEqual([["Authorization", "Bearer token"]]);
  });

  it("sends nothing without the revision, and says a refusal or an unreadable answer", async () => {
    const unsent = rpc(answered);
    await expect(
      withdrawComponentOffer(unsent.client, context, { ...request, expectedRevision: Number.NaN }),
    ).rejects.toThrow(OFFER_REVISION_MISSING);
    expect(unsent.calls).toEqual([]);
    const refused = rpc(null, { message: "This offer was already accepted. Reload to see it." });
    await expect(withdrawComponentOffer(refused.client, context, request)).rejects.toThrow(
      "This offer was already accepted. Reload to see it.",
    );
    const unread = rpc({ offerId: uuid(10) });
    await expect(withdrawComponentOffer(unread.client, context, request)).rejects.toThrow(
      WITHDRAWAL_ANSWER_UNREADABLE,
    );
  });
});

describe("reviewing an offer", () => {
  const request = {
    offerId: uuid(10),
    expectedRevision: 1,
    decision: "accepted" as const,
    requestId: uuid(99),
  };
  const answered = {
    offerId: uuid(10),
    kind: "finding",
    state: "accepted",
    revision: 2,
    reviewedAt: "2026-11-15T09:00:00+00:00",
    programs: 2,
    issues: [
      { programId: uuid(33), issueId: uuid(61) },
      { programId: uuid(34), issueId: uuid(62) },
    ],
    skipped: 1,
    componentAssessmentId: null,
    determinations: 0,
    activityEventId: uuid(98),
  };

  it("accepts at the revision the reader saw, with or without a note", async () => {
    const { client, calls } = rpc(answered);
    const reviewed = await reviewComponentOffer(client, context, request);
    // An accepted finding opened an issue in two other programs and passed the offering one over.
    expect(reviewed).toMatchObject({ state: "accepted", programs: 2, skipped: 1 });
    expect(reviewed.issues).toHaveLength(2);
    expect(calls[0]?.table).toBe("rpc:review_component_offer");
    expect(sent(calls[0])).toEqual({
      p_tenant_id: uuid(1),
      p_offer_id: uuid(10),
      p_expected_revision: 1,
      p_decision: "accepted",
      p_note: null,
      p_request_id: uuid(99),
    });
    await reviewComponentOffer(client, context, { ...request, note: " Confirmed on the bench. " });
    expect(sent(calls[1])).toMatchObject({ p_note: "Confirmed on the bench." });
  });

  it("reads accepted determinations as the component assessment they were published as", async () => {
    const { client } = rpc({
      ...answered,
      kind: "determinations",
      programs: 0,
      issues: [],
      skipped: 0,
      componentAssessmentId: uuid(97),
      determinations: 3,
    });
    await expect(reviewComponentOffer(client, context, request)).resolves.toMatchObject({
      kind: "determinations",
      componentAssessmentId: uuid(97),
      determinations: 3,
    });
  });

  it("returns an offer only with a note that says why", async () => {
    const { client, calls } = rpc({ ...answered, state: "returned", programs: 0, issues: [] });
    for (const note of [undefined, null, "  "])
      await expect(
        reviewComponentOffer(client, context, { ...request, decision: "returned", note }),
      ).rejects.toThrow(REVIEW_NEEDS_NOTE);
    expect(calls).toEqual([]);
    await expect(
      reviewComponentOffer(client, context, {
        ...request,
        decision: "returned",
        note: "Not reproduced on version 1.",
      }),
    ).resolves.toMatchObject({ state: "returned" });
    expect(sent(calls[0])).toMatchObject({
      p_decision: "returned",
      p_note: "Not reproduced on version 1.",
    });
  });

  it("sends nothing without the revision, and says a refusal or an unreadable answer", async () => {
    const unsent = rpc(answered);
    await expect(
      reviewComponentOffer(unsent.client, context, { ...request, expectedRevision: Number.NaN }),
    ).rejects.toThrow(OFFER_REVISION_MISSING);
    expect(unsent.calls).toEqual([]);
    for (const [message, said] of [
      [
        "This offer changed since you read it. Reload it before reviewing.",
        "This offer changed since you read it. Reload it before reviewing.",
      ],
      [
        "1 offered control is outside the offering system's control baseline, so nothing was published: AC-2",
        "1 offered control is outside the offering system's control baseline, so nothing was published: AC-2.",
      ],
    ] as const) {
      const { client } = rpc(null, { message });
      await expect(reviewComponentOffer(client, context, request)).rejects.toThrow(said);
    }
    const unread = rpc({ ...answered, issues: "two" });
    await expect(reviewComponentOffer(unread.client, context, request)).rejects.toThrow(
      REVIEW_ANSWER_UNREADABLE,
    );
  });
});
