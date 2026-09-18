import { labelFor, type Column } from "./records";

const nouns: Record<string, string> = {
  component_definitions: "component",
  defined_components: "component",
  defined_component_implementations: "control implementation",
  component_definition_revisions: "component version",
  product_configurations: "configuration",
  product_revisions: "product version",
  requirement_definition_revisions: "requirement version",
  requirement_revisions: "requirement revision",
  profile_imports: "profile import",
  profile_rules: "tailoring rule",
  requirement_definitions: "requirement",
  evidence_artifacts: "evidence artifact",
  evidence_versions: "evidence version",
  assessment_campaigns: "assessment campaign",
  assessment_plan_revisions: "assessment plan revision",
  assessment_results_revisions: "assessment results revision",
  assessment_findings: "assessment finding",
  operational_issues: "operational issue",
  engineering_requirements: "engineering requirement",
  implemented_requirements: "control implementation",
  composition_nodes: "system element",
  system_components: "system component",
  inventory_items: "inventory item",
  parties: "party",
  ssp_revisions: "SSP revision",
  poam_documents: "POA&M plan",
  poam_revisions: "POA&M revision",
  poam_items: "remediation item",
  poam_item_revisions: "remediation commitment",
  evidence_reviews: "evidence review",
  requirement_control_mappings: "control mapping",
  poam_milestones: "remediation milestone",
  authorization_packages: "authorization package",
  package_revisions: "authorization package version",
  risk_revisions: "risk assessment",
  program_role_assignments: "program responsibility",
  profile_revisions: "profile revision",
  profiles: "profile",
  procedures: "procedure",
  procedure_revisions: "procedure revision",
  scope_baselines: "scope baseline",
  oscal_documents: "OSCAL document",
  oscal_document_revisions: "OSCAL document revision",
  security_processes: "security process",
  provider_capabilities: "provider capability",
  offered_implementations: "offering",
  authorization_decisions: "authorization decision",
  risk_responses: "risk response",
};

/** Labels describe real tables; fields and choices still come from the database. */
export function productRecordNoun(table: string, values?: Record<string, unknown>): string {
  if (table === "parties") {
    const type = values?.["party_type"];
    if (type === "organization" || type === "person" || type === "team") return type;
  }
  return nouns[table] ?? labelFor(table.replace(/ies$/, "y").replace(/s$/, "")).toLowerCase();
}

/** The same operation label belongs on a create trigger, its form and its submit button. */
export function productCreateLabel(table: string, values?: Record<string, unknown>): string {
  return `Create ${productRecordNoun(table, values)}`;
}

export function productCollectionNoun(table: string, values?: Record<string, unknown>): string {
  const noun = productRecordNoun(table, values);
  if (noun === "person") return "people";
  if (noun.endsWith("y") && !/[aeiou]y$/.test(noun)) return `${noun.slice(0, -1)}ies`;
  return `${noun}${/(s|x|ch|sh)$/.test(noun) ? "es" : "s"}`;
}

const leadingFields = [
  "title",
  "name",
  "code",
  "description",
  "program_id",
  "system_id",
  "scope_id",
];
export function productFieldOrder(a: Column, b: Column) {
  const rank = (column: Column) => {
    const index = leadingFields.indexOf(column.name);
    return index === -1 ? leadingFields.length : index;
  };
  return rank(a) - rank(b);
}

export function isAdditionalProductField(column: Column): boolean {
  if (column.required && !column.default) return false;
  return (
    column.type.startsWith("json") ||
    /^(source_uuid|oscal_uuid|source_pointer|source_content|metadata|original_content|ordinal|content_sha256|input_sha256|output_sha256|resolver_name|resolver_version)$/.test(
      column.name,
    )
  );
}
