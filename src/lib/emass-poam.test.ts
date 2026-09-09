import { beforeEach, expect, it, vi } from "vitest";

vi.mock("@ledger/design-system", () => ({ toast: { add: vi.fn(), close: vi.fn() } }));
beforeEach(() => {
  vi.resetModules();
  const storage = new Map<string, string>();
  vi.stubGlobal("window", {
    localStorage: {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
    },
  });
});

it("exports canonical POA&M commitments once, including edits and structured milestones on imported items", async () => {
  const { poamsForProgram } = await import("./register");
  const store = await import("./assurance-record-store");
  const { emassPoam } = await import("./emass");
  const imported = poamsForProgram("PRG-1041").find((item) => item.legacyUuid)!;
  store.updatePoam(imported.id, {
    title: "Updated audit delivery plan",
    owner: "Program engineer",
    scheduledCompletion: "2026-11-01",
  });
  store.addPoamMilestone(imported.id, {
    title: "Validate audit delivery in the production build",
    targetDate: "2026-10-25",
  });
  const exported = emassPoam("PRG-1041");
  expect(exported.rows).toHaveLength(poamsForProgram("PRG-1041").length);
  expect(new Set(exported.rows.map((row) => row[0])).size).toBe(exported.rows.length);
  const row = exported.rows.find((entry) => entry[0] === imported.id)!;
  expect(row[1]).toBe("Updated audit delivery plan");
  expect(row[3]).toBe("Program engineer");
  expect(row[6]).toBe("2026-11-01");
  expect(row[7]).toContain("Validate audit delivery in the production build");
});
