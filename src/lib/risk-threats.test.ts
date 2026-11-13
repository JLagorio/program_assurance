import { QueryClient } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/app/workspace", () => ({ useWorkspace: () => ({}) }));

const { invalidateModel } = await import("./models");
const {
  codedName,
  controlHolding,
  leastHeldFirst,
  linkRiskTechniques,
  readRiskThreats,
  riskThreatsKey,
  techniqueChoices,
  techniqueDefence,
  techniquesByRisk,
  unlinkRiskTechnique,
} = await import("./risk-threats");
type FrameworkItem = import("./frameworks").FrameworkItem;
type FrameworkItemLink = import("./frameworks").FrameworkItemLink;
type FrameworkControlLink = import("./frameworks").FrameworkControlLink;

type Result = { data: unknown; error: { code?: string; message: string } | null };
type Call = { target: string; steps: [string, unknown[]][] };

/**
 * A stand-in for the Supabase client: every `rpc(name)` and `from(table)` chain is recorded, and
 * resolves (when awaited, or at `maybeSingle`) to the next queued result.
 */
function fakeClient(results: Result[]) {
  const calls: Call[] = [];
  const queue = [...results];
  const next = () => Promise.resolve(queue.shift() ?? { data: null, error: null });
  const chain = (target: string, first?: [string, unknown[]]) => {
    const call: Call = { target, steps: first ? [first] : [] };
    calls.push(call);
    const builder: Record<string, unknown> = {};
    for (const name of ["select", "delete", "upsert", "eq", "setHeader", "abortSignal"])
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
  const client = {
    rpc: (name: string, args: unknown) => chain(`rpc:${name}`, ["args", [args]]),
    from: (table: string) => chain(table),
  };
  return { client: client as never, calls };
}

const tenantId = "00000000-0000-4000-8000-000000000001";
const context = { tenantId, token: "token" };
const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const step = (call: Call | undefined, name: string) =>
  call?.steps.find(([step]) => step === name)?.[1];
const filters = (call: Call | undefined) =>
  Object.fromEntries(
    (call?.steps ?? [])
      .filter(([name]) => name === "eq")
      .map(([, args]) => args as [string, unknown]),
  );

const risk = id(10);
const program = id(20);
const catalog = id(30);

/** The server's answer for a risk that names two techniques, one control countering both. */
const answer = {
  risk_id: risk,
  program_id: program,
  loaded: true,
  catalog_revision_id: catalog,
  baseline: true,
  techniques: [
    {
      link_id: id(41),
      item_id: id(51),
      code: "T1190",
      title: "Exploit Public-Facing Application",
      tactics: [{ code: "tactic.initial-access", title: "Initial Access" }],
    },
    {
      link_id: id(42),
      item_id: id(52),
      code: "T1595",
      title: "Active Scanning",
      tactics: [{ code: "tactic.reconnaissance", title: "Reconnaissance" }],
    },
  ],
  controls: [
    {
      id: id(61),
      code: "CA-8",
      title: "Penetration Testing",
      techniques: ["T1190"],
      approaches: [{ code: "approach.self-challenge", title: "Self-Challenge" }],
      effects: ["Preempt"],
      in_baseline: true,
      requirements: 3,
      evidenced: 2,
    },
    {
      id: id(62),
      code: "SC-26",
      title: "Decoys",
      techniques: ["T1190", "T1595"],
      approaches: [{ code: "approach.misdirection", title: "Misdirection" }],
      effects: ["Divert", "Deceive", "Detect"],
      in_baseline: false,
      requirements: 0,
      evidenced: 0,
    },
  ],
  totals: { techniques: 2, controls: 2, in_baseline: 1, with_requirement: 1, with_evidence: 1 },
};

describe("readRiskThreats", () => {
  it("asks for the risk as the reader and names the answer as the product does", async () => {
    const { client, calls } = fakeClient([{ data: answer, error: null }]);
    const threats = await readRiskThreats(client, context, risk);
    expect(calls).toHaveLength(1);
    expect(calls[0]!.target).toBe("rpc:risk_threats");
    expect(step(calls[0], "args")).toEqual([{ p_tenant_id: tenantId, p_risk_id: risk }]);
    expect(step(calls[0], "setHeader")).toEqual(["Authorization", "Bearer token"]);
    expect(threats.programId).toBe(program);
    expect(threats.catalogRevisionId).toBe(catalog);
    expect(threats.techniques[0]).toEqual({
      linkId: id(41),
      itemId: id(51),
      code: "T1190",
      title: "Exploit Public-Facing Application",
      tactics: [{ code: "tactic.initial-access", title: "Initial Access" }],
    });
    expect(threats.controls[1]).toEqual({
      id: id(62),
      code: "SC-26",
      title: "Decoys",
      techniques: ["T1190", "T1595"],
      approaches: [{ code: "approach.misdirection", title: "Misdirection" }],
      effects: ["Divert", "Deceive", "Detect"],
      inBaseline: false,
      requirements: 0,
      evidenced: 0,
    });
    expect(threats.totals).toEqual({
      techniques: 2,
      controls: 2,
      inBaseline: 1,
      withRequirement: 1,
      withEvidence: 1,
    });
  });

  it("reads a risk with no technique as empty lists, and no standing as none", async () => {
    const empty = {
      ...answer,
      baseline: false,
      techniques: [],
      controls: [],
      totals: {
        techniques: 0,
        controls: 0,
        in_baseline: null,
        with_requirement: null,
        with_evidence: null,
      },
    };
    const { client } = fakeClient([{ data: empty, error: null }]);
    const threats = await readRiskThreats(client, context, risk);
    expect(threats.techniques).toEqual([]);
    expect(threats.controls).toEqual([]);
    expect(threats.baseline).toBe(false);
    expect(threats.totals.inBaseline).toBeNull();
    // A control with no standing keeps it empty: never a zero the server did not count.
    const unplaced = {
      ...answer,
      controls: [
        { ...answer.controls[0]!, in_baseline: null, requirements: null, evidenced: null },
      ],
    };
    const second = fakeClient([{ data: unplaced, error: null }]);
    const control = (await readRiskThreats(second.client, context, risk)).controls[0]!;
    expect([control.inBaseline, control.requirements, control.evidenced]).toEqual([
      null,
      null,
      null,
    ]);
  });

  it("fails with the server's words, and refuses an answer of another shape", async () => {
    const refused = fakeClient([
      { data: null, error: { message: "Workspace access is required" } },
    ]);
    await expect(readRiskThreats(refused.client, context, risk)).rejects.toThrow(
      "Workspace access is required",
    );
    // A missing list is not an empty one: the risk is never read as naming no technique.
    const partial = fakeClient([{ data: { ...answer, controls: undefined }, error: null }]);
    await expect(readRiskThreats(partial.client, context, risk)).rejects.toThrow();
  });
});

describe("linking techniques to a risk", () => {
  it("inserts every chosen technique in one request, passing over the ones already named", async () => {
    const { client, calls } = fakeClient([{ data: [{ id: id(71) }], error: null }]);
    await expect(
      linkRiskTechniques(client, context, { riskId: risk, itemIds: [id(51), id(52), id(51)] }),
    ).resolves.toEqual({ linked: 1, alreadyLinked: 1 });
    expect(calls).toHaveLength(1);
    expect(calls[0]!.target).toBe("risk_attack_techniques");
    expect(step(calls[0], "upsert")).toEqual([
      [
        { tenant_id: tenantId, risk_id: risk, framework_item_id: id(51) },
        { tenant_id: tenantId, risk_id: risk, framework_item_id: id(52) },
      ],
      { onConflict: "tenant_id,risk_id,framework_item_id", ignoreDuplicates: true },
    ]);
    expect(step(calls[0], "setHeader")).toEqual(["Authorization", "Bearer token"]);
  });

  it("asks nothing of the server without a technique or a risk", async () => {
    const { client, calls } = fakeClient([]);
    await expect(
      linkRiskTechniques(client, context, { riskId: risk, itemIds: [] }),
    ).rejects.toThrow("Choose an ATT&CK technique.");
    await expect(
      linkRiskTechniques(client, context, { riskId: "not-a-risk", itemIds: [id(51)] }),
    ).rejects.toThrow();
    expect(calls).toHaveLength(0);
  });

  it("says a refusal in the reader's words", async () => {
    const viewer = fakeClient([
      { data: null, error: { code: "42501", message: "new row violates row-level security" } },
    ]);
    await expect(
      linkRiskTechniques(viewer.client, context, { riskId: risk, itemIds: [id(51)] }),
    ).rejects.toThrow("Only an editor, admin or owner can change a risk's ATT&CK techniques.");
    const notTechnique = fakeClient([
      {
        data: null,
        error: {
          code: "23514",
          message: "A risk names an ATT&CK technique of the published reference framework",
        },
      },
    ]);
    await expect(
      linkRiskTechniques(notTechnique.client, context, { riskId: risk, itemIds: [id(51)] }),
    ).rejects.toThrow("A risk names an ATT&CK technique of the published reference framework.");
    const gone = fakeClient([
      { data: null, error: { code: "23503", message: "violates foreign key constraint" } },
    ]);
    await expect(
      linkRiskTechniques(gone.client, context, { riskId: risk, itemIds: [id(51)] }),
    ).rejects.toThrow("no longer available");
  });
});

describe("unlinking a technique from a risk", () => {
  it("deletes the link in the workspace", async () => {
    const { client, calls } = fakeClient([{ data: [{ id: id(41) }], error: null }]);
    await expect(unlinkRiskTechnique(client, context, { linkId: id(41) })).resolves.toEqual({
      removed: true,
    });
    expect(calls).toHaveLength(1);
    expect(calls[0]!.target).toBe("risk_attack_techniques");
    expect(step(calls[0], "delete")).toEqual([]);
    expect(filters(calls[0])).toEqual({ tenant_id: tenantId, id: id(41) });
  });

  it("counts a link that is already gone as removed, so a retry succeeds", async () => {
    const { client, calls } = fakeClient([
      { data: [], error: null },
      { data: null, error: null },
    ]);
    await expect(unlinkRiskTechnique(client, context, { linkId: id(41) })).resolves.toEqual({
      removed: false,
    });
    expect(calls).toHaveLength(2);
  });

  it("refuses a link the reader could not remove, and says a failure", async () => {
    const viewer = fakeClient([
      { data: [], error: null },
      { data: { id: id(41) }, error: null },
    ]);
    await expect(unlinkRiskTechnique(viewer.client, context, { linkId: id(41) })).rejects.toThrow(
      "An editor, admin or owner can unlink it.",
    );
    const failed = fakeClient([{ data: null, error: { message: "The database is unavailable" } }]);
    await expect(unlinkRiskTechnique(failed.client, context, { linkId: id(41) })).rejects.toThrow(
      "The database is unavailable.",
    );
  });
});

describe("what a write marks stale", () => {
  it("keeps the read under the link's model, so a link or an unlink marks every risk's answer stale", async () => {
    const cache = new QueryClient();
    const otherTenant = "00000000-0000-4000-8000-000000000002";
    const keys = {
      risk: riskThreatsKey(tenantId, risk),
      another: riskThreatsKey(tenantId, id(11)),
      elsewhere: riskThreatsKey(otherTenant, risk),
      unrelated: ["models", tenantId, "risks", {}],
    };
    for (const key of Object.values(keys)) cache.setQueryData(key, answer);
    await invalidateModel(cache, tenantId, "risk_attack_techniques");
    const stale = (key: readonly unknown[]) => cache.getQueryState(key)?.isInvalidated;
    expect(stale(keys.risk)).toBe(true);
    expect(stale(keys.another)).toBe(true);
    // Another workspace's answer and another model's rows are left as they are.
    expect(stale(keys.elsewhere)).toBe(false);
    expect(stale(keys.unrelated)).toBe(false);
    expect(riskThreatsKey(tenantId, risk).slice(0, 4)).toEqual(riskThreatsKey(tenantId));
  });
});

describe("the order a risk's controls read in", () => {
  const control = (
    code: string,
    inBaseline: boolean | null,
    requirements: number | null,
    evidenced: number | null,
  ) => ({ code, inBaseline, requirements, evidenced });

  it("ranks what the program holds: baseline, then a requirement, then evidence", () => {
    expect(controlHolding(control("a", false, 0, 0))).toBe(0);
    expect(controlHolding(control("b", false, 2, 0))).toBe(2);
    expect(controlHolding(control("c", true, 0, 0))).toBe(4);
    expect(controlHolding(control("d", true, 1, 0))).toBe(6);
    expect(controlHolding(control("e", true, 3, 2))).toBe(7);
    // No standing holds nothing.
    expect(controlHolding(control("f", null, null, null))).toBe(0);
  });

  it("puts what the program does not hold first, in the catalog's order among equals", () => {
    const controls = [
      control("AC-6(2)", true, 1, 1),
      control("CA-8(2)", false, 0, 0),
      control("SC-26", false, 0, 0),
      control("SI-4(2)", true, 1, 0),
      control("SC-12", true, 0, 0),
      control("SI-20", false, 1, 0),
    ];
    expect(leastHeldFirst(controls).map((entry) => entry.code)).toEqual([
      "CA-8(2)",
      "SC-26",
      "SI-20",
      "SC-12",
      "SI-4(2)",
      "AC-6(2)",
    ]);
    // The list given is left as it was.
    expect(controls[0]!.code).toBe("AC-6(2)");
  });
});

/** A framework item as `framework_item_rows` answers, with what these derivations read. */
function item(kind: string, code: string, title: string, ordinal = 1): FrameworkItem {
  return {
    id: `item:${code}`,
    framework_code: "nist-sp800-160v2r1-attack",
    framework_revision_id: "revision",
    kind,
    code,
    // The view's key pads each run of digits: T1190 before T1595, M1026 before M1048.
    code_order: code.toLowerCase().replace(/\d+/g, (digits) => digits.padStart(12, "0")),
    title,
    prose: null,
    ordinal,
    props: {},
    printed_in: "Appendix F",
    parent_item_id: null,
    parent_code: null,
    parent_kind: null,
    parent_title: null,
  };
}

function tacticLink(technique: string, tactic: string, title: string): FrameworkItemLink {
  return {
    id: `${technique}>${tactic}`,
    framework_code: "nist-sp800-160v2r1-attack",
    framework_revision_id: "revision",
    relation: "tactic",
    ordinal: null,
    props: {},
    source_identifier: `F:${technique}:${tactic}`,
    printed_in: "Appendix F",
    source_item_id: `item:${technique}`,
    source_code: technique,
    source_kind: "attack-technique",
    source_title: technique,
    source_framework_code: "nist-sp800-160v2r1-attack",
    target_item_id: `item:${tactic}`,
    target_code: tactic,
    target_kind: "tactic",
    target_title: title,
    target_framework_code: "nist-sp800-160v2r1-attack",
  };
}

describe("techniquesByRisk", () => {
  it("lists each risk's techniques once, by identifier, through any reading of the appendix", () => {
    const items = [
      { id: "item-t1190", code: "T1190", title: "Exploit Public-Facing Application" },
      { id: "item-t1078", code: "T1078", title: "Valid Accounts" },
      // The same technique in an earlier reading: another item, the same code.
      { id: "item-t1078-old", code: "T1078", title: "Valid Accounts" },
      { id: "item-t1557.002", code: "T1557.002", title: "ARP Cache Poisoning" },
      { id: "item-t1557", code: "T1557", title: "Man-in-the-Middle" },
    ];
    const named = techniquesByRisk(
      [
        { risk_id: "risk-a", framework_item_id: "item-t1190" },
        { risk_id: "risk-a", framework_item_id: "item-t1078" },
        { risk_id: "risk-a", framework_item_id: "item-t1078-old" },
        { risk_id: "risk-b", framework_item_id: "item-t1557.002" },
        { risk_id: "risk-b", framework_item_id: "item-t1557" },
        // An item the reader could not read names nothing.
        { risk_id: "risk-c", framework_item_id: "item-unknown" },
      ],
      items,
    );
    expect(Object.fromEntries(named)).toEqual({
      "risk-a": [
        { code: "T1078", title: "Valid Accounts" },
        { code: "T1190", title: "Exploit Public-Facing Application" },
      ],
      "risk-b": [
        { code: "T1557", title: "Man-in-the-Middle" },
        { code: "T1557.002", title: "ARP Cache Poisoning" },
      ],
    });
    expect(named.get("risk-a")?.map(codedName)).toEqual([
      "T1078 Valid Accounts",
      "T1190 Exploit Public-Facing Application",
    ]);
  });
});

describe("techniqueChoices", () => {
  const tactics = [
    item("tactic", "tactic.persistence", "Persistence", 5),
    item("tactic", "tactic.privilege-escalation", "Privilege Escalation", 6),
    item("tactic", "tactic.reconnaissance", "Reconnaissance", 1),
  ];
  const techniques = [
    item("attack-technique", "T1595", "Active Scanning"),
    item("attack-technique", "T1574", "Hijack Execution Flow"),
    item("mitigation", "M1048", "Application Isolation and Sandboxing"),
    item("attack-technique", "T1001", "Data Obfuscation"),
  ];
  const links = [
    tacticLink("T1574", "tactic.privilege-escalation", "Privilege Escalation"),
    tacticLink("T1595", "tactic.reconnaissance", "Reconnaissance"),
    tacticLink("T1574", "tactic.persistence", "Persistence"),
    tacticLink("T1574", "tactic.persistence", "Persistence"),
  ];

  it("offers the techniques by identifier, each with its tactics in the appendix's order", () => {
    const choices = techniqueChoices(techniques, links, tactics);
    expect(
      choices.map((choice) => [choice.code, choice.tactics.map((tactic) => tactic.title)]),
    ).toEqual([
      ["T1001", []],
      ["T1574", ["Persistence", "Privilege Escalation"]],
      ["T1595", ["Reconnaissance"]],
    ]);
    expect(choices[1]).toMatchObject({ id: "item:T1574", title: "Hijack Execution Flow" });
    expect(codedName(choices[2]!)).toBe("T1595 Active Scanning");
  });

  it("keeps the links' order without the tactics, and offers nothing when the data is not loaded", () => {
    expect(techniqueChoices(techniques, links)[1]!.tactics.map((tactic) => tactic.title)).toEqual([
      "Privilege Escalation",
      "Persistence",
    ]);
    expect(techniqueChoices([], [])).toEqual([]);
  });
});

/** One printed row of Appendix F for T1190, as `framework_control_link_rows` answers. */
function printed(
  place: string,
  control: [id: string, code: string, title: string],
  props: Record<string, string | string[] | null>,
): FrameworkControlLink {
  return {
    id: place,
    framework_code: "nist-sp800-160v2r1-attack",
    framework_revision_id: "revision",
    relation: "mitigates",
    ordinal: 1,
    props,
    source_identifier: place,
    printed_in: "Table F-5",
    item_id: "item:T1190",
    item_code: "T1190",
    item_kind: "attack-technique",
    item_title: "Exploit Public-Facing Application",
    parent_item_id: null,
    parent_item_code: null,
    parent_item_kind: null,
    parent_item_title: null,
    control_label: control[1],
    control_order: control[1].toLowerCase().replace(/\d+/g, (digits) => digits.padStart(12, "0")),
    resolution_status: "resolved",
    control_id: control[0],
    control_code: control[1],
    control_title: control[2],
    catalog_revision_id: catalog,
    technique_item_id: null,
    technique_code: null,
    technique_title: null,
  };
}

describe("techniqueDefence", () => {
  const cref = (code: string) => `nist-sp800-160v2r1-cref:approach.${code}`;
  const decoys: [string, string, string] = [id(81), "SC-26", "Decoys"];
  const sandbox: [string, string, string] = [id(82), "SC-7(21)", "Isolation of System Components"];
  const audit: [string, string, string] = [id(83), "AU-6", "Audit Record Review"];
  // As the read orders them: by control, not by where they are printed.
  const links = [
    printed("F-5:T1190:CM2004:1:AU-6", audit, {
      tactic: "tactic.initial-access",
      mitigation: "CM2004",
      approaches: [cref("behavior-validation")],
      effects: ["Detect"],
    }),
    printed("F-5:T1190:M1048:1:SC-7(21)", sandbox, {
      tactic: "tactic.initial-access",
      mitigation: "M1048",
      approaches: [cref("predefined-segmentation")],
      effects: ["Contain", "Exert"],
    }),
    printed("F-5:T1190:CM1102:2:SC-26", decoys, {
      tactic: "tactic.initial-access",
      mitigation: "CM1102",
      approaches: [cref("misdirection")],
      effects: ["Deceive", "Divert"],
    }),
    printed("F-5:T1190:CM1102:1:SC-26", decoys, {
      tactic: "tactic.initial-access",
      mitigation: "CM1102",
      approaches: [cref("monitoring-and-damage-assessment"), cref("misdirection")],
      effects: ["Detect"],
    }),
  ];
  const attack = [
    item("candidate-mitigation", "CM1102", "Maintain Deception Environment"),
    item("mitigation", "M1048", "Application Isolation and Sandboxing"),
    item("effect", "effect.divert", "Divert", 3),
    item("effect", "effect.deceive", "Deceive", 4),
    item("effect", "effect.contain", "Contain", 10),
    item("effect", "effect.exert", "Exert", 13),
    item("effect", "effect.detect", "Detect", 18),
  ];
  const approaches = [
    item("approach", "approach.misdirection", "Misdirection"),
    item(
      "approach",
      "approach.monitoring-and-damage-assessment",
      "Monitoring and Damage Assessment",
    ),
    item("approach", "approach.predefined-segmentation", "Predefined Segmentation"),
  ];

  it("lists ATT&CK's mitigations before the appendix's candidates, each by name", () => {
    expect(techniqueDefence(links, { attack, approaches }).mitigations).toEqual([
      { code: "M1048", title: "Application Isolation and Sandboxing", candidate: false },
      { code: "CM1102", title: "Maintain Deception Environment", candidate: true },
      // An item the vocabulary lacks reads as its code, and a CM identifier is a candidate.
      { code: "CM2004", title: "CM2004", candidate: true },
    ]);
  });

  it("lists each control once, in the catalog's order, with every approach and effect its rows print", () => {
    const { controls } = techniqueDefence(links, { attack, approaches });
    expect(controls.map((control) => control.code)).toEqual(["AU-6", "SC-7(21)", "SC-26"]);
    expect(controls[2]).toEqual({
      id: id(81),
      code: "SC-26",
      title: "Decoys",
      mitigations: ["CM1102"],
      // In the order first printed: row 1 before row 2.
      approaches: ["Monitoring and Damage Assessment", "Misdirection"],
      // In Table F-1's order, whatever order the rows print them in.
      effects: ["Divert", "Deceive", "Detect"],
    });
    // An approach the vocabulary lacks reads as its code.
    expect(controls[0]!.approaches).toEqual(["approach.behavior-validation"]);
  });

  it("answers nothing for a technique with no rows, and lists no control a row does not resolve", () => {
    expect(techniqueDefence([], { attack, approaches })).toEqual({ mitigations: [], controls: [] });
    const unresolved = { ...links[0]!, control_id: null, control_code: null, control_title: null };
    const defence = techniqueDefence([unresolved], { attack, approaches });
    expect(defence.controls).toEqual([]);
    // The row still prints its mitigation.
    expect(defence.mitigations.map((mitigation) => mitigation.code)).toEqual(["CM2004"]);
  });
});
