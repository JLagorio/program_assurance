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
  programSections,
  scopeMark,
} from "./navigation-scope";

type Screen = {
  file: string;
  path: string;
  family: string;
  nav?: { scope: "organization" | "program" | "product"; current: string | null };
};

const inventory = JSON.parse(
  readFileSync(
    fileURLToPath(new URL("../../docs/guides/screen-inventory.json", import.meta.url)),
    "utf8",
  ),
) as Screen[];

const id = "5b834025-4245-5e6b-81a0-98538930a36c";

/** The label of the entry an address marks current in the scope it opens, as the shell draws it. */
function marked(pathname: string, search: Record<string, unknown> = {}, hash = "") {
  const scope = navigationScope(pathname);
  if (scope.kind === "program") {
    const key = programEntry(pathname, search["tab"], hash);
    const all = [...programDestinations.chain, ...programDestinations.quiet];
    return { scope: "program", current: all.find((entry) => entry.key === key)?.label ?? null };
  }
  if (scope.kind === "product" || scope.kind === "product-assessment") {
    const key = productEntry(pathname, search["tab"], search["show"]);
    const all = [...productDestinations.chain, ...productDestinations.quiet];
    return { scope: "product", current: all.find((entry) => entry.key === key)?.label ?? null };
  }
  const key = organizationEntry(pathname, search["tab"]);
  const all = Object.values(organizationDestinations).flat();
  return { scope: "organization", current: all.find((entry) => entry.key === key)?.label ?? null };
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
    expect(navigationScope("/register/risks/x")).toEqual({ kind: "organization" });
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

  it("marks the catalog's sources as Guidance and the rest of the catalog as Frameworks", () => {
    expect(marked("/catalog").current).toBe("Frameworks");
    expect(marked("/catalog", { tab: "CCIs" }).current).toBe("Frameworks");
    expect(marked("/catalog", { tab: "Sources" }).current).toBe("Guidance");
    expect(marked("/catalog", { tab: "sources" }).current).toBe("Guidance");
  });

  it("keeps a record whose page sits elsewhere under its register", () => {
    expect(marked(`/tasks/${id}`).current).toBe("Home");
    expect(marked(`/workstreams/${id}`).current).toBe("Programs");
    expect(marked(`/issues/${id}`).current).toBe("Findings & assets");
    expect(marked("/risks").current).toBe("POA&M & risk register");
    expect(marked(`/poam-documents/${id}`).current).toBe("POA&M & risk register");
    expect(marked("/programsx").current).toBeNull();
  });

  it("marks a scope by its name's first two words", () => {
    expect(scopeMark("WS-X90 Sentinel Mission System")).toBe("WS");
    expect(scopeMark("Customer A · X800 Rail Integration")).toBe("CA");
    expect(scopeMark("X800 Missile")).toBe("XM");
    expect(scopeMark("atlas")).toBe("A");
  });
});
