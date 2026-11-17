import { describe, expect, it } from "vitest";
import { programEntry, programDestinations } from "./navigation-scope";
import {
  partAddress,
  programPart,
  programParts,
  programTab,
  programTabHash,
  type ProgramPart,
} from "./program-parts";

const path = "/programs/5b834025-4245-5e6b-81a0-98538930a36c";

describe("a program record's parts", () => {
  it("reads the part from the tab, and on POA&M & risk from the hash", () => {
    expect(programPart("Overview", "")).toBe("Overview");
    expect(programPart("Assessment campaigns", "")).toBe("Assessments");
    expect(programPart("POA&M & risk", "")).toBe("POA&M");
    expect(programPart("POA&M & risk", "program-poam_documents")).toBe("POA&M");
    expect(programPart("POA&M & risk", "program-risks")).toBe("Risks");
    expect(programPart("Library", "")).toBe("Library");
  });

  it("opens every part at its own address", () => {
    for (const part of programParts) {
      const { search, hash = "" } = partAddress(part);
      expect(programPart(programTab(search.tab), hash)).toBe(part);
    }
  });

  it("keeps an aliased address on the part its content is in", () => {
    const open = (named: string) => programPart(programTab(named), programTabHash(named) ?? "");
    expect(open("risk")).toBe("Risks");
    expect(open("Risks")).toBe("Risks");
    expect(open("POA&M")).toBe("POA&M");
    expect(open("Assessments")).toBe("Assessments");
    expect(open("activity")).toBe("Overview");
    expect(open("nothing")).toBe("Overview");
  });

  it("names each part the side nav lists by the nav's own label", () => {
    const labels = [...programDestinations.chain, ...programDestinations.quiet].map(
      (entry) => entry.label as string,
    );
    for (const part of programParts) {
      const { search, hash = "" } = partAddress(part);
      const entry = programEntry(path, search.tab, hash);
      const label = [...programDestinations.chain, ...programDestinations.quiet].find(
        (item) => item.key === entry,
      )?.label;
      // A part the nav names is current under its own label; Library is System's, Schedule none.
      const expected: Partial<Record<ProgramPart, string | undefined>> = {
        Library: "System",
        Schedule: undefined,
      };
      expect(label).toBe(part in expected ? expected[part] : part);
      if (labels.includes(part)) expect(label).toBe(part);
    }
  });
});
