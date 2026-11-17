import { describe, expect, it } from "vitest";
import {
  issuesByProgram,
  portfolioHierarchy,
  portfolioRows,
  programsOnAProduct,
  rowIssues,
  type PortfolioInput,
} from "./portfolio";

/** Air Defense holds X800 Missile, with two configurations and two variants, one behind. */
const input: PortfolioInput = {
  lines: [
    { id: "ms", code: "MS", name: "Mission Systems" },
    { id: "ad", code: "AD", name: "Air Defense" },
  ],
  products: [
    { id: "x800", code: "X800", name: "X800 Missile", business_line_id: "ad" },
    { id: "r210", code: "R210", name: "R210 Launcher Electronics Unit", business_line_id: "ad" },
    { id: "lone", code: "L1", name: "Lone product", business_line_id: null },
  ],
  versions: [
    {
      id: "x1",
      product_id: "x800",
      version_number: 1,
      state: "published",
      published_at: "2026-10-01",
    },
    {
      id: "x2",
      product_id: "x800",
      version_number: 2,
      state: "published",
      published_at: "2026-11-02",
    },
    { id: "x3", product_id: "x800", version_number: 3, state: "draft", published_at: null },
    {
      id: "r1",
      product_id: "r210",
      version_number: 1,
      state: "published",
      published_at: "2026-10-05",
    },
  ],
  configurations: [
    { id: "c", product_id: "x800", code: "C", name: "Palletized Launch", state: "active" },
    { id: "a", product_id: "x800", code: "A", name: "Lug & Rail Launch", state: "active" },
    { id: "old", product_id: "x800", code: "Z", name: "Retired", state: "retired" },
    { id: "std", product_id: "r210", code: "STD", name: "Standard", state: "active" },
  ],
  variants: [
    {
      id: "va",
      code: "X800-A-CUSA",
      program_id: "p1",
      product_revision_id: "x1",
      product_configuration_id: "a",
    },
    {
      id: "vc",
      code: "X800-C-CUSB",
      program_id: "p2",
      product_revision_id: "x2",
      product_configuration_id: "c",
    },
    {
      id: "vr",
      code: "R210-STD-CUSA",
      program_id: "p1",
      product_revision_id: "r1",
      product_configuration_id: "std",
    },
    {
      id: "vz",
      code: "X800-Z",
      program_id: "p3",
      product_revision_id: "x2",
      product_configuration_id: "old",
    },
  ],
  programs: [
    { id: "p1", code: "PRG-2101", name: "Customer A" },
    { id: "p2", code: "PRG-2102", name: "Customer B" },
    { id: "p3", code: "PRG-2103", name: "Customer Z" },
  ],
  elements: [
    { boundary_system_id: "va", product_change_kinds: ["firmware"] },
    { boundary_system_id: "va", product_change_kinds: ["software", "data"] },
    { boundary_system_id: "va", product_change_kinds: [] },
    { boundary_system_id: "vc", product_change_kinds: null },
    { boundary_system_id: "vr", product_change_kinds: ["firmware"] },
  ],
};

describe("portfolioHierarchy", () => {
  const tree = portfolioHierarchy(input);
  const row = (id: string) => portfolioRows(tree).find((item) => item.id === id)!;

  it("lists business lines by name, then the products in none", () => {
    expect(tree.map((item) => item.name)).toEqual([
      "Air Defense",
      "Mission Systems",
      "Lone product",
    ]);
    expect(row("line:ad").children.map((item) => item.name)).toEqual([
      "R210 Launcher Electronics Unit",
      "X800 Missile",
    ]);
    expect(row("line:ms").children).toEqual([]);
  });

  it("puts each active configuration under its product, in code order, and its variants under it", () => {
    expect(row("product:x800").children.map((item) => item.id)).toEqual([
      "configuration:a",
      "configuration:c",
      // A variant of a retired configuration stands under the product.
      "variant:vz",
    ]);
    expect(row("configuration:a").children.map((item) => item.name)).toEqual(["Customer A"]);
    expect(row("configuration:a").revisionId).toBe("x2");
  });

  it("reads a product's latest published version, never a draft", () => {
    expect(row("product:x800")).toMatchObject({
      version: 2,
      revisionId: "x2",
      publishedAt: "2026-11-02",
    });
    expect(row("product:lone")).toMatchObject({ version: null, revisionId: null });
  });

  it("says how far behind a variant is and what its program changed", () => {
    expect(row("variant:va")).toMatchObject({
      recordId: "p1",
      code: "X800-A-CUSA",
      version: 1,
      behind: 1,
      modified: 2,
      attention: ["behind", "modified"],
    });
    expect(row("variant:vc")).toMatchObject({ version: 2, behind: 0, modified: 0, attention: [] });
  });

  it("counts each program once on a summary row, and sums what was changed", () => {
    // Customer A takes both products: Air Defense counts it once.
    expect(row("line:ad").programIds.sort()).toEqual(["p1", "p2", "p3"]);
    expect(row("line:ad").modified).toBe(3);
    expect(row("product:x800").modified).toBe(2);
    expect(programsOnAProduct(tree).sort()).toEqual(["p1", "p2", "p3"]);
  });
});

describe("open issues", () => {
  it("counts a row's open issues by severity, each program once", () => {
    const byProgram = issuesByProgram([
      { program_id: "p1", severity: "critical" },
      { program_id: "p1", severity: "high" },
      { program_id: "p2", severity: "high" },
      { program_id: "p2", severity: null },
      { program_id: null, severity: "low" },
    ]);
    expect(rowIssues({ programIds: ["p1", "p2"] }, byProgram)).toEqual({
      critical: 1,
      high: 2,
      none: 1,
    });
    expect(rowIssues({ programIds: [] }, byProgram)).toEqual({});
  });
});
