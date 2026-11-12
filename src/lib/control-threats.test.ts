import { describe, expect, it, vi } from "vitest";
import type { FrameworkControlLink } from "./frameworks";

// frameworks.ts holds the hooks beside the readers this module uses; the hooks are not run here.
vi.mock("@/components/app/workspace", () => ({ useWorkspace: () => ({}) }));

const { controlThreats, risksByTechnique } = await import("./control-threats");

const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const cref = (code: string) => `nist-sp800-160v2r1-cref:approach.${code}`;
const item = (kind: string, code: string, title: string, ordinal = 1) => ({
  kind,
  code,
  title,
  ordinal,
});

/** One row of Appendix F for SC-7, as the read gives it: the technique it is printed against. */
function printed(
  place: string,
  technique: [id: string, code: string, title: string],
  props: Record<string, unknown>,
  relation = "mitigates",
): FrameworkControlLink {
  return {
    relation,
    source_identifier: place,
    item_id: technique[0],
    item_code: technique[1],
    item_kind: "attack-technique",
    item_title: technique[2],
    control_id: id(7),
    control_code: "SC-7",
    control_title: "Boundary Protection",
    props,
  } as unknown as FrameworkControlLink;
}

const remote: [string, string, string] = [id(1133), "T1133", "External Remote Services"];
const scanning: [string, string, string] = [id(1046), "T1046", "Network Service Scanning"];
const relay: [string, string, string] = [id(1557), "T1557.002", "ARP Cache Poisoning"];

const attack = [
  item("tactic", "tactic.initial-access", "Initial Access", 3),
  item("tactic", "tactic.persistence", "Persistence", 5),
  item("tactic", "tactic.discovery", "Discovery", 9),
  item("mitigation", "M1030", "Network Segmentation"),
  item("mitigation", "M1035", "Limit Access to Resource Over Network"),
  item("candidate-mitigation", "CM1118", "Isolate or Contain Selected Applications"),
  item("effect", "effect.negate", "Negate", 2),
  item("effect", "effect.preempt", "Preempt", 3),
  item("effect", "effect.contain", "Contain", 10),
  item("effect", "effect.exert", "Exert", 13),
];
const approaches = [
  { code: "approach.predefined-segmentation", title: "Predefined Segmentation" },
  { code: "approach.trust-based-privilege-management", title: "Trust-Based Privilege Management" },
];

describe("controlThreats", () => {
  // As the read orders them: by where the control stands, not by technique.
  const links = [
    printed("F-7:T1133:M1030:1:SC-7", remote, {
      tactic: "tactic.persistence",
      mitigation: "M1030",
      approaches: [cref("predefined-segmentation")],
      effects: ["Preempt", "Exert", "Contain"],
    }),
    printed("F-11:T1046:M1030:1:SC-7", scanning, {
      tactic: "tactic.discovery",
      mitigation: "M1030",
      approaches: [cref("predefined-segmentation")],
      effects: ["Contain", "Exert"],
    }),
    printed("F-5:T1133:CM1118:1:SC-7", remote, {
      tactic: "tactic.initial-access",
      mitigation: "CM1118",
      approaches: [cref("trust-based-privilege-management"), cref("predefined-segmentation")],
      effects: ["Negate"],
    }),
    printed("F-5:T1133:M1035:2:SC-7", remote, {
      tactic: "tactic.initial-access",
      mitigation: "M1035",
      approaches: [cref("predefined-segmentation")],
      effects: ["Exert"],
    }),
    printed("F-5:T1557.002:M1030:1:SC-7", relay, {
      tactic: "tactic.initial-access",
      mitigation: "M1030",
      effects: ["Contain"],
    }),
    // A relation the appendix does not print against a control is not a technique it counters.
    printed("F-1:T1999:X:1:SC-7", [id(1999), "T1999", "Not countered"], {}, "supports"),
  ];
  const techniques = controlThreats(links, { attack, approaches });

  it("lists each technique once, in the order of the identifiers", () => {
    expect(techniques.map((technique) => technique.code)).toEqual(["T1046", "T1133", "T1557.002"]);
    expect(techniques[1]).toMatchObject({ id: remote[0], title: "External Remote Services" });
  });

  it("gathers every tactic, mitigation, approach and effect a technique's rows print", () => {
    expect(techniques[1]).toEqual({
      id: remote[0],
      code: "T1133",
      title: "External Remote Services",
      // In the order of the appendix's tables, whatever order the rows were read in.
      tactics: [
        { code: "tactic.initial-access", title: "Initial Access" },
        { code: "tactic.persistence", title: "Persistence" },
      ],
      // ATT&CK's own mitigations first, then the appendix's candidates.
      mitigations: [
        { code: "M1030", title: "Network Segmentation", candidate: false },
        { code: "M1035", title: "Limit Access to Resource Over Network", candidate: false },
        { code: "CM1118", title: "Isolate or Contain Selected Applications", candidate: true },
      ],
      // In the order first printed: Table F-5 comes before Table F-7.
      approaches: [
        {
          code: "approach.trust-based-privilege-management",
          title: "Trust-Based Privilege Management",
        },
        { code: "approach.predefined-segmentation", title: "Predefined Segmentation" },
      ],
      // In the order of Table F-1.
      effects: ["Negate", "Preempt", "Contain", "Exert"],
    });
  });

  it("keeps a row that names no approach, with none", () => {
    expect(techniques[2]).toMatchObject({ approaches: [], effects: ["Contain"] });
  });

  it("reads what the vocabulary lacks as its code", () => {
    const [bare] = controlThreats([links[2]!], { attack: [], approaches: [] });
    expect(bare).toMatchObject({
      tactics: [{ code: "tactic.initial-access", title: "tactic.initial-access" }],
      mitigations: [{ code: "CM1118", title: "CM1118", candidate: true }],
      approaches: [
        {
          code: "approach.trust-based-privilege-management",
          title: "approach.trust-based-privilege-management",
        },
        { code: "approach.predefined-segmentation", title: "approach.predefined-segmentation" },
      ],
    });
  });

  it("answers nothing for a control the appendix does not name", () => {
    expect(controlThreats([], { attack, approaches })).toEqual([]);
  });
});

describe("risksByTechnique", () => {
  it("counts the risks that name each technique, by its identifier", () => {
    const counts = risksByTechnique(
      [
        { risk_id: "risk-a", framework_item_id: remote[0] },
        { risk_id: "risk-b", framework_item_id: remote[0] },
        { risk_id: "risk-a", framework_item_id: scanning[0] },
        // The same technique in another reading of the appendix: the risk counts once.
        { risk_id: "risk-b", framework_item_id: id(9133) },
        // An item the reads did not name is passed over.
        { risk_id: "risk-c", framework_item_id: id(404) },
      ],
      [
        { id: remote[0], code: "T1133" },
        { id: id(9133), code: "T1133" },
        { id: scanning[0], code: "T1046" },
      ],
    );
    expect([...counts]).toEqual([
      ["T1133", 2],
      ["T1046", 1],
    ]);
  });

  it("is empty when no risk names a technique", () => {
    expect(risksByTechnique([], []).size).toBe(0);
  });
});
