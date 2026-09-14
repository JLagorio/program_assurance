import { labelFor, type Column } from "./records";

const nouns: Record<string, string> = {
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
  poam_milestones: "remediation milestone",
  authorization_packages: "authorization package",
  program_role_assignments: "program responsibility",
  profile_revisions: "profile revision",
  profiles: "profile",
  procedures: "procedure",
  procedure_revisions: "procedure revision",
  scope_baselines: "scope baseline",
  oscal_documents: "OSCAL document",
  oscal_document_revisions: "OSCAL document revision",
};

/** Labels describe real tables; fields and choices still come from the database. */
export function productRecordNoun(table: string): string {
  return nouns[table] ?? labelFor(table.replace(/ies$/, "y").replace(/s$/, "")).toLowerCase();
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
