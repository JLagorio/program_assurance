import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ControlSourceDependencies } from "./control-work";

vi.mock("@ledger/design-system", () => ({ toast: { add: vi.fn(), close: vi.fn() } }));
let storage: Map<string, string>;
let write: ReturnType<typeof vi.fn>;
beforeEach(() => {
  vi.resetModules();
  storage = new Map();
  write = vi.fn((key: string, value: string) => storage.set(key, value));
  vi.stubGlobal("window", {
    localStorage: { getItem: (key: string) => storage.get(key) ?? null, setItem: write },
  });
});

const context = { contributors: 1, contributorDetail: "One confirmed source" };
async function readyControl() {
  const store = await import("./control-work");
  store.restoreWork();
  store.setSession({ name: "Dana Whitlock", role: "Assessor" });
  const control = store.registerControlWork({
    id: "WRK-LIBRARY-TEST",
    program: "PRG-1041",
    scope: "SYS-0001",
    control: "AU-2",
    owner: "Priya Raghavan",
    implementation: "Implemented",
    assessment: "Not assessed",
    submitted: true,
    narrative: "Audit events are forwarded to the program collector.",
    narrativeRevision: 1,
    determinationNote: "Verified deployed configuration and event delivery.",
    evidence: ["EVD-LIBRARY-TEST"],
    riskAcceptance: "",
  });
  return { store, control };
}

describe("control source dependencies", () => {
  it("blocks a deficient confirmed source independently of contributor counts", async () => {
    const { store, control } = await readyControl();
    store.registerControlSourceProvider(() => ({
      fingerprint: "component-v1:confirmed",
      confirmed: 1,
      deficiency: "Confirmed source is deficient",
    }));
    const offer = store
      .offersFor(control, context, "Assessor")
      .find((item) => item.def.key === "satisfy");
    expect(offer).toMatchObject({ allowed: false, blocked: "Confirmed source is deficient" });
    expect(store.perform(control.id, "satisfy", context, "Verified")).toEqual({
      ok: false,
      reason: "Confirmed source is deficient",
    });
    expect(control.assessment).toBe("Not assessed");
    expect(control.sourceBasis).toBeUndefined();
  });

  it("pins accepted source decisions and invalidates once without another storage write", async () => {
    const { store, control } = await readyControl();
    let source: ControlSourceDependencies = {
      fingerprint: "v1:confirmed",
      confirmed: 1,
      deficiency: null,
    };
    store.registerControlSourceProvider(() => source);
    expect(store.perform(control.id, "satisfy", context, "Verified")).toEqual({ ok: true });
    expect(control.sourceBasis).toBe("v1:confirmed");
    const notify = vi.fn();
    store.subscribeWork(notify);
    const events = store.activityFor(control.id).length;
    write.mockClear();
    store.refreshControlSourceDependencies();
    expect(control.assessment).toBe("Satisfied");
    expect(notify).not.toHaveBeenCalled();
    source = { fingerprint: "v1:excluded", confirmed: 0, deficiency: null };
    store.refreshControlSourceDependencies();
    store.refreshControlSourceDependencies();
    expect(control).toMatchObject({
      assessment: "Not assessed",
      submitted: false,
      sourceBasis: "v1:confirmed",
    });
    expect(notify).toHaveBeenCalledTimes(1);
    expect(store.activityFor(control.id)).toHaveLength(events + 1);
    expect(write).not.toHaveBeenCalled();
    expect(store.workFor("PRG-1041", "SYS-0001", "AC-2").assessment).toBe("Satisfied");
  });

  it("reapplies source invalidation after reload without rewriting the saved determination", async () => {
    let { store, control } = await readyControl();
    store.registerControlSourceProvider(() => ({
      fingerprint: "v1:confirmed",
      confirmed: 1,
      deficiency: null,
    }));
    expect(store.perform(control.id, "satisfy", context, "Verified")).toEqual({ ok: true });
    const saved = storage.get("equinox.control-work.v1");
    vi.resetModules();
    store = await import("./control-work");
    store.registerControlSourceProvider(() => ({
      fingerprint: "v1:excluded",
      confirmed: 0,
      deficiency: null,
    }));
    write.mockClear();
    store.restoreWork();
    control = store.workById(control.id)!;
    expect(control).toMatchObject({
      assessment: "Not assessed",
      submitted: false,
      sourceBasis: "v1:confirmed",
    });
    expect(storage.get("equinox.control-work.v1")).toBe(saved);
    expect(write).not.toHaveBeenCalled();
  });

  it("drops a former source dependency when a new assessment relies only on local work", async () => {
    const { store, control } = await readyControl();
    control.sourceBasis = "previous-source";
    store.registerControlSourceProvider(() => ({
      fingerprint: "none",
      confirmed: 0,
      deficiency: null,
    }));
    expect(
      store.perform(
        control.id,
        "satisfy",
        { contributors: 1, contributorDetail: "Allocated requirement" },
        "Verified local implementation",
      ),
    ).toEqual({ ok: true });
    expect(control.sourceBasis).toBeUndefined();
    store.registerControlSourceProvider(() => ({
      fingerprint: "new-source",
      confirmed: 1,
      deficiency: null,
    }));
    store.refreshControlSourceDependencies();
    expect(control.assessment).toBe("Satisfied");
  });
});
