import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@ledger/design-system", () => ({ toast: { error: vi.fn(), dismiss: vi.fn() } }));

beforeEach(() => {
  vi.resetModules();
  const entries = new Map<string, string>();
  vi.stubGlobal("window", {
    localStorage: {
      getItem: (key: string) => entries.get(key) ?? null,
      setItem: (key: string, value: string) => entries.set(key, value),
    },
  });
});

describe("exact assessment run navigation", () => {
  it("opens the named historical run and retains its observation, evidence, and subjects", async () => {
    const { registerPlatformData } = await import("./platform-ingestion");
    registerPlatformData();
    const { assessmentRunForProgram, runVerdict, runsForCampaign } =
      await import("./test-execution");
    const failed = assessmentRunForProgram("PRG-1090", "TC-1090", "TR-109015")!;
    expect(failed.id).toBe("TR-109015");
    expect(failed.id).not.toBe(runsForCampaign("TC-1090").at(-1)?.id);
    expect(failed.records).toEqual([
      expect.objectContaining({ result: "Fail", evidence: ["EVD-015"] }),
    ]);
    expect(failed.nodes).toEqual(["CN-109115", "CN-109118", "CN-109101"]);
    expect(runVerdict(failed.id)?.result).toBe("Not met");
    const passed = assessmentRunForProgram("PRG-1090", "TC-1090", "TR-109089")!;
    expect(passed.records).toEqual([
      expect.objectContaining({ result: "Pass", evidence: ["EVD-089"] }),
    ]);
    expect(runVerdict(passed.id)?.result).toBe("Met");
    expect(assessmentRunForProgram("PRG-1090", "TC-1090")?.id).toBe(
      runsForCampaign("TC-1090").at(-1)?.id,
    );
  });

  it("rejects a run from another campaign or program instead of displaying a different run", async () => {
    const { registerPlatformData } = await import("./platform-ingestion");
    registerPlatformData();
    const { campaigns } = await import("./campaigns");
    const { assessmentRunForProgram, runsForCampaign } = await import("./test-execution");
    const other = campaigns.find(
      (campaign) => campaign.program !== "PRG-1090" && runsForCampaign(campaign.id).length,
    )!;
    const otherRun = runsForCampaign(other.id)[0]!;
    expect(assessmentRunForProgram("PRG-1090", "TC-1090", otherRun.id)).toBeNull();
    expect(assessmentRunForProgram(other.program, "TC-1090", "TR-109015")).toBeNull();
    expect(assessmentRunForProgram("PRG-1090", other.id, otherRun.id)).toBeNull();
    expect(assessmentRunForProgram("PRG-1090", "TC-1090", "TR-MISSING")).toBeNull();
  });
});
