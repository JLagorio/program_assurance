import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  navigationScope,
  organizationDestinations,
  organizationEntry,
  productDestinations,
  productEntry,
  programDestinations,
  programEntry,
  programRecordPages,
  programSections,
  scopeMark,
} from "./navigation-scope";

type Screen = {
  file: string;
  path: string;
  family: string;
  nav?: {
    scope: "organization" | "program" | "product" | "program-record";
    current: string | null;
    /** A program record's entry while it loads, and for a record of no program. */
    organization?: string | null;
  };
};

const inventory = JSON.parse(
  readFileSync(
    fileURLToPath(new URL("../../docs/guides/screen-inventory.json", import.meta.url)),
    "utf8",
  ),
) as Screen[];

const id = "5b834025-4245-5e6b-81a0-98538930a36c";

const programLabel = (key: string | null | undefined) =>
  [...programDestinations.chain, ...programDestinations.quiet].find((entry) => entry.key === key)
    ?.label ?? null;

const organizationLabel = (pathname: string) => {
  const key = organizationEntry(pathname);
  return (
    Object.values(organizationDestinations)
      .flat()
      .find((entry) => entry.key === key)?.label ?? null
  );
};

/**
 * The label of the entry an address marks current in the scope it opens, as the shell draws it: a
 * program's record at an address of its own says both, the program's entry once the record names
 * its program and the organization's while it loads or where it names none.
 */
function marked(pathname: string, search: Record<string, unknown> = {}, hash = "") {
  const scope = navigationScope(pathname);
  if (scope.kind === "program")
    return { scope: "program", current: programLabel(programEntry(pathname, search["tab"], hash)) };
  if (scope.kind === "program-record")
    return {
      scope: "program-record",
      current: programLabel(programRecordPages[scope.record].entry),
      organization: organizationLabel(pathname),
    };
  if (scope.kind === "product" || scope.kind === "product-assessment") {
    const key = productEntry(pathname, search["tab"], search["show"]);
    const all = [...productDestinations.chain, ...productDestinations.quiet];
    return { scope: "product", current: all.find((entry) => entry.key === key)?.label ?? null };
  }
  return { scope: "organization", current: organizationLabel(pathname) };
}

describe("the side nav's scopes", () => {
  it("opens a program's work under its address, and the organization elsewhere", () => {
    expect(navigationScope(`/programs/${id}`)).toEqual({ kind: "program", programId: id });
    expect(navigationScope(`/programs/${id}/controls/${id}`)).toEqual({
      kind: "program",
      programId: id,
    });
    expect(navigationScope("/programs/new")).toEqual({ kind: "organization" });
    expect(navigationScope("/programs")).toEqual({ kind: "organization" });
    expect(navigationScope(`/library/products/${id}`)).toEqual({ kind: "product", productId: id });
    expect(navigationScope("/library/products/")).toEqual({ kind: "organization" });
    expect(navigationScope(`/library/product-assessments/${id}`)).toEqual({
      kind: "product-assessment",
      assessmentId: id,
    });
    expect(navigationScope("/register")).toEqual({ kind: "organization" });
    expect(navigationScope("/findings/")).toEqual({ kind: "organization" });
  });

  it("opens a program's record at an address of its own in its program's work", () => {
    expect(navigationScope(`/register/risks/${id}`)).toEqual({
      kind: "program-record",
      record: "risk",
      recordId: id,
    });
    expect(navigationScope(`/findings/assets/${id}`)).toMatchObject({ record: "asset" });
    expect(navigationScope(`/findings/${id}`)).toMatchObject({ record: "finding" });
    expect(navigationScope(`/register/poam/${id}`)).toMatchObject({ record: "remediation" });
    expect(navigationScope(`/evidence/${id}/x`)).toEqual({ kind: "organization" });
    const entries = Object.fromEntries(
      Object.entries(programRecordPages).map(([record, page]) => [
        record,
        programLabel(page.entry),
      ]),
    );
    expect(entries).toEqual({
      risk: "Risks",
      remediation: "POA&M",
      "poam-plan": "POA&M",
      issue: "Findings",
      finding: "Findings",
      asset: "System",
      evidence: "Evidence",
      campaign: "Assessments",
      package: "Authorization",
      task: null,
      workstream: null,
    });
    // While it loads, and for a record of no program, it stays where its register is.
    expect(marked(`/register/risks/${id}`)).toEqual({
      scope: "program-record",
      current: "Risks",
      organization: "POA&M & risk register",
    });
    expect(marked(`/tasks/${id}`)).toEqual({
      scope: "program-record",
      current: null,
      organization: "Home",
    });
  });

  // Every route the application has is in the inventory (design-system-boundary.test.mjs), so
  // each of a program's pages, its records and its focused views, marks the entry declared there.
  it("marks each route of the screen inventory as the inventory declares", () => {
    const routes = inventory.filter(
      (screen) =>
        !["redirect", "inspector", "schema-register", "schema-record"].includes(screen.family),
    );
    for (const screen of routes) {
      expect(screen.nav, `${screen.file} declares its nav`).toBeDefined();
      const pathname = screen.path.replace(/\$\w+/g, id).replace(/\/$/, "") || "/";
      expect(marked(pathname), screen.path).toEqual(screen.nav);
    }
  });

  it("marks a program's tabs, the POA&M & risk tab's Risks Section included", () => {
    const path = `/programs/${id}`;
    expect(marked(path).current).toBe("Overview");
    expect(marked(path, { tab: "System" }).current).toBe("System");
    expect(marked(path, { tab: "Library" }).current).toBe("System");
    expect(marked(path, { tab: "Assessment campaigns" }).current).toBe("Assessments");
    expect(marked(path, { tab: "Schedule" }).current).toBeNull();
    expect(marked(path, { tab: "POA&M & risk" }).current).toBe("POA&M");
    expect(marked(path, { tab: "POA&M & risk" }, programSections.poam).current).toBe("POA&M");
    expect(marked(path, { tab: "POA&M & risk" }, programSections.risks).current).toBe("Risks");
  });

  it("marks a product's tabs, the Assessment tab's List as Controls", () => {
    const path = `/library/products/${id}`;
    expect(marked(path, { tab: "Structure" }).current).toBe("Structure");
    expect(marked(path, { tab: "Configurations" }).current).toBe("Structure");
    expect(marked(path, { tab: "Assessment" }).current).toBe("Assessments");
    expect(marked(path, { tab: "Assessment", show: "list" }).current).toBe("Controls");
    expect(marked(path, { tab: "Variants" }).current).toBe("Where used");
    expect(marked(path, { tab: "Versions" }).current).toBeNull();
  });

  it("marks the catalog as Frameworks and the supplemental guidance as Guidance", () => {
    expect(marked("/catalog").current).toBe("Frameworks");
    expect(marked("/catalog", { tab: "CCIs" }).current).toBe("Frameworks");
    expect(marked("/catalog", { tab: "Sources" }).current).toBe("Frameworks");
    expect(marked(`/catalog/controls/${id}`).current).toBe("Frameworks");
    expect(marked("/guidance").current).toBe("Guidance");
  });

  it("keeps a record whose page sits elsewhere under its register in the organization", () => {
    expect(marked(`/tasks/${id}`).organization).toBe("Home");
    expect(marked(`/workstreams/${id}`).organization).toBe("Programs");
    expect(marked(`/issues/${id}`).organization).toBe("Findings & assets");
    expect(marked("/risks").current).toBe("POA&M & risk register");
    expect(marked(`/poam-documents/${id}`).organization).toBe("POA&M & risk register");
    expect(marked("/programsx").current).toBeNull();
  });

  it("marks a scope by its name's first two words", () => {
    expect(scopeMark("WS-X90 Sentinel Mission System")).toBe("WS");
    expect(scopeMark("Customer A · X800 Rail Integration")).toBe("CA");
    expect(scopeMark("X800 Missile")).toBe("XM");
    expect(scopeMark("atlas")).toBe("A");
  });
});
