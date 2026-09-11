/**
 * Characterization of the three engines that decide what the matrix says.
 *
 *  E1 selection      which controls        `scopes.ts` resolveSelection
 *  E2 decomposition  which rows per control `sctm.ts` requirementsFor
 *  E3 method         the method on a row    `sctm.ts` methodFor
 *
 * Every screen reads through `buildSctm`, and until this file existed none of
 * these numbers was pinned anywhere — the whole of `lib/catalog.ts` is untested,
 * so a change to any engine moved every screen silently. These are not
 * aspirational values. They are what the app does today, recorded so that a
 * deliberate change shows up as a diff and an accidental one shows up as a
 * failure. When a number here moves, say why in the commit.
 */
import { describe, expect, it } from "vitest";
import { controlMatrix } from "@/lib/control-matrix";
import { buildControlTextIndex, buildSctm } from "@/lib/sctm";
import { loadAllControlText } from "@/lib/nist-control-text/registry";
import { categorizationOf, controlSetFor, scopesForProgram } from "@/lib/scopes";
import { resolveCnssiControlIds } from "@/lib/cnssi-1253";

const histogram = <T extends string>(values: readonly T[]): Record<string, number> => {
  const out: Record<string, number> = {};
  for (const value of values) out[value] = (out[value] ?? 0) + 1;
  return out;
};

describe("E1 — control selection per scope", () => {
  it("PRG-1041 selects its three scopes from the published CNSSI 1253 allocation", () => {
    const totals = Object.fromEntries(
      scopesForProgram("PRG-1041").map((scope) => [scope.id, controlSetFor(scope.id)?.total]),
    );
    // SYS-0001 H/H/H, SYS-0002 M/H/M, SYS-0003 H/H/L. Each is the CNSSI union
    // plus the overlay additions the scope's tailoring carries.
    expect(totals).toEqual({ "SYS-0001": 614, "SYS-0002": 589, "SYS-0003": 569 });
  });

  it("agrees with CNSSI 1253 control for control, with no drift in either direction", () => {
    const set = controlSetFor("SYS-0001")!;
    const published = new Set(
      resolveCnssiControlIds(categorizationOf(set.triad), { includeOrganizationWide: true }),
    );
    const byCategorization = set.controls
      .filter((row) => row.selectedBy.length > 0)
      .map((row) => row.control.id);

    // The guard that matters. This module used to approximate CNSSI's table at
    // family level from SP 800-53B membership, which at H/H/H produced exactly
    // the 370-control SP 800-53B High baseline -- the FIPS 200 collapse the
    // module header exists to reject, and a set that disagreed with the seed's
    // own derivation of the same doctrine. Both directions are asserted: a
    // control selected here that CNSSI does not select is invention, and one
    // CNSSI selects that is missing here is a silent drop.
    expect(byCategorization).toHaveLength(published.size);
    expect(byCategorization.filter((id) => !published.has(id))).toEqual([]);
    expect([...published].filter((id) => !byCategorization.includes(id))).toEqual([]);

    // What is left over is the scope's own overlay work, not categorization.
    expect(set.controls.filter((row) => row.selectedBy.length === 0)).toHaveLength(4);
  });

  it("counts each objective's own contribution, which is what makes a triad differ from a high-water mark", () => {
    expect(controlSetFor("SYS-0001")?.byObjective).toEqual({
      Confidentiality: 434,
      Integrity: 511,
      Availability: 320,
    });
    // Availability falls 320 -> 184 at A=Low while Confidentiality holds. A
    // collapsed FIPS-200 baseline cannot express that difference.
    expect(controlSetFor("SYS-0003")?.byObjective).toEqual({
      Confidentiality: 434,
      Integrity: 510,
      Availability: 184,
    });
  });
});

describe("E2/E3 — decomposition and method", () => {
  it("decomposes to SP 800-53A objectives when the control text is loaded", async () => {
    const text = buildControlTextIndex(await loadAllControlText());
    const { rows } = buildSctm("PRG-1041", controlMatrix("PRG-1041"), text);

    expect(rows).toHaveLength(2089);
    // Every row is an SP 800-53A objective. `requirementsFor` used to put the
    // DISA CCI first and reach objectives only when a control had none; the 16
    // controls the old fixture covered therefore showed 24 crosswalk rows in
    // place of their 105 published objectives. This histogram is the guard on
    // that precedence: if CCI ever reappears here for a control that publishes
    // objectives, an authoritative unit has been displaced by a mirrored one.
    expect(histogram(rows.map((row) => row.unit))).toEqual({
      Objective: 2080,
      Requirement: 9,
    });
    expect(histogram(rows.map((row) => row.method))).toEqual({
      Inspection: 1100,
      Analysis: 315,
      Test: 674,
    });
  }, 120_000);

  it("carries the DISA CCIs as a cross-reference on the row, not as the unit", async () => {
    const text = buildControlTextIndex(await loadAllControlText());
    const { rows } = buildSctm("PRG-1041", controlMatrix("PRG-1041"), text);

    // The published 2024 list reaches 1,511 of 1,512 rows. Before the rewire the
    // whole product joined against a 17-row hand-written fixture.
    expect(rows.filter((row) => row.ccis.length > 0)).toHaveLength(2088);
    const ac1 = rows.find((row) => row.control === "AC-1");
    expect(ac1?.unit).toBe("Objective");
    expect(ac1?.ccis).toContain("CCI-000002");
  }, 120_000);

  it("falls through to the control itself when no text is loaded", () => {
    const { rows } = buildSctm("PRG-1041", controlMatrix("PRG-1041"), null);
    expect(rows).toHaveLength(628);
    // With no objectives to decompose to, a control falls through to itself. The
    // nine CCI rows are the ones a finding names for itself -- a deficiency keeps
    // its own identifier addressable.
    expect(histogram(rows.map((row) => row.unit))).toEqual({
      Control: 610,
      CCI: 9,
      Requirement: 9,
    });
  });
});
