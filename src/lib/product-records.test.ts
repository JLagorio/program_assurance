import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  isAdditionalProductField,
  productCollectionNoun,
  productCreateLabel,
  productFieldLabel,
  productFieldOrder,
  productNounTables,
  productRecordNoun,
  productTargetGroups,
  targetGroupTables,
} from "./product-records";
import type { Column } from "./records";

const migrations = fileURLToPath(new URL("../../supabase/migrations", import.meta.url));
const types = readFileSync(fileURLToPath(new URL("./database.types.ts", import.meta.url)), "utf8");

/** Every public table and view in the generated types, with its Row columns. */
function schemaModels() {
  const start = types.indexOf("public: {");
  const models = new Map<string, Set<string>>();
  for (const section of ["Tables", "Views"] as const) {
    const from = types.indexOf(`${section}: {`, start);
    const to = types.indexOf(section === "Tables" ? "Views: {" : "Functions: {", from);
    const body = types.slice(from, to);
    for (const match of body.matchAll(/^ {6}([a-z_0-9]+): \{\n {8}Row: \{\n([\s\S]*?)\n {8}\};/gm))
      models.set(
        match[1]!,
        new Set([...match[2]!.matchAll(/^ {10}([a-z_0-9]+):/gm)].map((column) => column[1]!)),
      );
  }
  return models;
}

/** Each table a `num_nonnulls(...)` check constrains, with the columns it names. */
function polymorphicChecks() {
  const checks = new Map<string, string[][]>();
  for (const file of readdirSync(migrations)
    .filter((name) => name.endsWith(".sql"))
    .sort()) {
    const sql = readFileSync(`${migrations}/${file}`, "utf8").replace(/--[^\n]*/g, "");
    const tables = [
      ...sql.matchAll(
        /(?:create table (?:if not exists )?|alter table (?:only )?(?:if exists )?)(?:public\.)?([a-z_0-9]+)/gi,
      ),
    ].map((match) => [match.index, match[1]!] as const);
    for (const match of sql.matchAll(/num_nonnulls\s*\(([^)]*)\)/gi)) {
      const table = tables.filter(([index]) => index < match.index).at(-1)?.[1];
      if (!table) continue;
      const columns = match[1]!.split(",").map((column) => column.trim());
      checks.set(table, [...(checks.get(table) ?? []), columns]);
    }
  }
  return checks;
}

const column = (name: string, overrides: Partial<Column> = {}): Column => ({
  name,
  type: "text",
  required: false,
  default: null,
  description: null,
  choices: [],
  ...overrides,
});

describe("product nouns", () => {
  const models = schemaModels();

  it("names every table and view in the schema, and nothing else", () => {
    // The archived composition table and the legacy workspace snapshot store are kept for
    // provenance and are not product models.
    const products = [...models.keys()].filter(
      (name) => !name.includes("_archive_") && name !== "workspace_snapshots",
    );
    expect(products.length).toBeGreaterThan(100);
    expect([...productNounTables].sort()).toEqual(products.sort());
  });

  it("gives each noun in sentence case, singular, with acronyms kept", () => {
    for (const table of productNounTables) {
      const noun = productRecordNoun(table);
      expect(noun, table).toMatch(/^([a-z]|[A-Z]{2,}|POA&M)/);
      expect(noun, table).not.toMatch(/_/);
    }
    expect(productRecordNoun("ssp_revisions")).toBe("SSP revision");
    expect(productRecordNoun("cci_items")).toBe("CCI");
  });

  it("uses the product vocabulary for the records the audit named", () => {
    expect(productRecordNoun("requirement_control_links")).toBe("control mapping");
    expect(productRecordNoun("requirement_allocations")).toBe("allocation");
    expect(productRecordNoun("component_definitions")).toBe("component");
    expect(productRecordNoun("defined_components")).toBe("defined component");
    expect(productRecordNoun("poam_items")).toBe("remediation item");
    expect(productRecordNoun("issue_observations")).toBe("linked observation");
    expect(productRecordNoun("finding_evidence")).toBe("evidence citation");
  });

  it("reads a party by its type and an unknown name as words", () => {
    expect(productRecordNoun("parties", { party_type: "organization" })).toBe("organization");
    expect(productRecordNoun("parties", { party_type: "person" })).toBe("person");
    expect(productRecordNoun("parties", { party_type: "robot" })).toBe("party");
    expect(productRecordNoun("audit_things")).toBe("audit thing");
  });

  it("builds the create operation and the collection name from the same noun", () => {
    expect(productCreateLabel("risks")).toBe("Create risk");
    expect(productCreateLabel("parties", { party_type: "organization" })).toBe(
      "Create organization",
    );
    expect(productCollectionNoun("parties", { party_type: "person" })).toBe("people");
    expect(productCollectionNoun("gate_criteria")).toBe("gate criteria");
    expect(productCollectionNoun("assessment_activities")).toBe("assessment activities");
    expect(productCollectionNoun("security_processes")).toBe("security processes");
    expect(productCollectionNoun("poam_documents")).toBe("POA&M plans");
  });
});

describe("product field labels", () => {
  it("names a party reference for its role, as the previews do", () => {
    expect(productFieldLabel("risks", "owner_party_id")).toBe("Owner");
    expect(productFieldLabel("comments", "author_party_id")).toBe("Author");
    expect(productFieldLabel("programs", "sponsor_party_id")).toBe("Sponsor");
    expect(productFieldLabel("risks", "program_id")).toBe("Program");
    expect(productFieldLabel("programs", "starts_on")).toBe("Starts on");
  });

  it("asks for a due as a day, in Create task's words", () => {
    expect(productFieldLabel("tasks", "due_on")).toBe("Due date");
    expect(productFieldLabel("scheduled_assessment_tasks", "due_on")).toBe("Due date");
    expect(productFieldLabel("lifecycle_gates", "due_on")).toBe("Due date");
  });

  it("uses the register's words for a party's contact and parent", () => {
    expect(productFieldLabel("parties", "email")).toBe("Contact email");
    expect(productFieldLabel("parties", "organization_id", { party_type: "organization" })).toBe(
      "Parent organization",
    );
    expect(productFieldLabel("parties", "organization_id", { party_type: "person" })).toBe(
      "Organization",
    );
  });

  it("calls a product's lifecycle Status and a version's lifecycle State", () => {
    expect(productFieldLabel("products", "state")).toBe("Status");
    expect(productFieldLabel("product_configurations", "state")).toBe("Status");
    expect(productFieldLabel("component_definition_revisions", "state")).toBe("State");
  });

  it("names an SSP's narratives as its register does", () => {
    expect(productFieldLabel("implemented_requirements", "description")).toBe("Control narrative");
    expect(productFieldLabel("implemented_requirements", "selected_control_id")).toBe("Control");
    expect(productFieldLabel("implementation_statements", "description")).toBe(
      "Statement narrative",
    );
  });
});

describe("polymorphic target groups", () => {
  const models = schemaModels();
  const checks = polymorphicChecks();

  it("covers every table a num_nonnulls check constrains", () => {
    expect(checks.size).toBeGreaterThan(10);
    expect([...targetGroupTables].sort()).toEqual([...checks.keys()].sort());
  });

  it("names only columns the table has, and one of the constraint's column sets", () => {
    for (const table of targetGroupTables) {
      const row = models.get(table);
      expect(row, table).toBeDefined();
      for (const group of productTargetGroups(table)) {
        for (const name of group.columns) expect(row!.has(name), `${table}.${name}`).toBe(true);
        expect(
          checks.get(table)!.some((columns) => columns.join() === group.columns.join()),
          `${table}: ${group.columns.join()}`,
        ).toBe(true);
      }
    }
  });

  it("has no groups for a table without a check", () => {
    expect(productTargetGroups("tasks")).toEqual([]);
    expect(productTargetGroups("not_a_table")).toEqual([]);
  });
});

describe("product field order", () => {
  it("puts a comment's body before its relationship pickers", () => {
    const fields = ["program_id", "task_id", "issue_id", "body", "author_party_id"].map((name) =>
      column(name),
    );
    expect([...fields].sort(productFieldOrder).map((field) => field.name)[0]).toBe("body");
  });

  it("keeps the name first and the rest in schema order", () => {
    const fields = ["status", "description", "code", "title", "owner_party_id"].map((name) =>
      column(name),
    );
    expect([...fields].sort(productFieldOrder).map((field) => field.name)).toEqual([
      "title",
      "code",
      "description",
      "status",
      "owner_party_id",
    ]);
  });

  it("folds provenance and structured fields under Additional details unless required", () => {
    expect(isAdditionalProductField(column("oscal_uuid"))).toBe(true);
    expect(isAdditionalProductField(column("props", { type: "jsonb" }))).toBe(true);
    expect(isAdditionalProductField(column("props", { type: "jsonb", required: true }))).toBe(
      false,
    );
    expect(isAdditionalProductField(column("title"))).toBe(false);
  });
});
