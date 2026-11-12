import type { Database } from "./database.types";
import type { TableName } from "./models";
import { labelFor, type Column } from "./records";

/**
 * The product noun for every table and view, singular and in sentence case. One map, exhaustive
 * over the product models (the unit test fails for a table that is not named here, and the type
 * rejects a name that is not a model); the legacy snapshot table is not a product model. A link
 * table is named for what it connects from its record ("linked observation"); a table that cites
 * evidence with a claim is an "evidence citation".
 */
const nouns = {
  activity_events: "activity event",
  activity_steps: "activity step",
  assessment_activities: "assessment activity",
  assessment_campaigns: "assessment campaign",
  assessment_events: "assessment event",
  // The assessment findings register: a finding with its assessor by name.
  assessment_finding_rows: "assessment finding",
  assessment_findings: "assessment finding",
  assessment_objectives: "assessment objective",
  assessment_plan_revisions: "assessment plan revision",
  assessment_results_revisions: "assessment results revision",
  assessment_subjects: "assessment subject",
  assessment_task_dependencies: "assessment task dependency",
  assurance_allocation_attention_generations: "allocation attention generation",
  assurance_attention_requests: "attention request",
  assurance_attention_acknowledgments: "attention acknowledgment",
  assurance_attention_sources: "attention item",
  assurance_citations: "evidence citation",
  assurance_review_messages: "review message",
  assurance_review_requests: "review request",
  assurance_review_threads: "review discussion",
  assurance_saved_views: "saved view",
  assurance_navigation_items: "personal navigation item",
  assurance_search_documents: "search document",
  assurance_workbooks: "assurance workbook",
  assurance_workbook_requests: "workbook request",
  authorization_decisions: "authorization decision",
  authorization_packages: "authorization package",
  // The catalog's Controls register: a control with its family and the profiles selecting it.
  catalog_control_rows: "control",
  catalog_groups: "catalog group",
  catalog_revisions: "catalog revision",
  catalogs: "catalog",
  cci_control_links: "CCI control link",
  // The catalog's CCIs register: a CCI with its types and mapped controls.
  cci_item_rows: "CCI",
  cci_item_types: "CCI type",
  cci_items: "CCI",
  cci_references: "CCI reference",
  cci_revisions: "CCI list revision",
  change_requests: "change request",
  comments: "comment",
  component_contributions: "component contribution",
  component_definition_revisions: "component version",
  // The library's reusable component; the parts its versions define are defined components.
  component_definitions: "component",
  component_pins: "component pin",
  component_relationships: "component relationship",
  composition_nodes: "system element",
  configuration_baselines: "configuration baseline",
  control_links: "control link",
  control_mappings: "mapping entry",
  control_overlay_decisions: "overlay decision",
  control_overlay_rows: "overlay",
  control_overlays: "overlay",
  control_parts: "control part",
  controls: "control",
  defined_component_evidence: "evidence citation",
  defined_component_implementations: "control implementation",
  defined_components: "defined component",
  demo_import_batches: "demo import batch",
  demo_import_records: "demo import record",
  demo_import_sources: "demo import source",
  engineering_requirements: "engineering requirement",
  // The evidence register: an artifact with its latest version and review.
  evidence_artifact_rows: "evidence artifact",
  evidence_artifacts: "evidence artifact",
  evidence_create_requests: "evidence create request",
  evidence_reviews: "evidence review",
  evidence_uses: "evidence use",
  evidence_versions: "evidence version",
  finding_evidence: "evidence citation",
  finding_observations: "supporting observation",
  finding_risks: "linked risk assessment",
  // A framework read beside the control catalog (NIST SP 800-160): an item is a technique, an
  // approach, a process or an outcome, and a control link the control that supports one.
  framework_control_link_rows: "framework control link",
  framework_control_links: "framework control link",
  framework_item_link_rows: "framework item link",
  framework_item_links: "framework item link",
  framework_item_rows: "framework item",
  framework_items: "framework item",
  framework_revisions: "framework revision",
  framework_rows: "framework",
  frameworks: "framework",
  gate_criteria: "gate criterion",
  // A gate's criteria with the security outcome and the life cycle process each was drawn from.
  gate_criterion_rows: "gate criterion",
  gate_evidence: "evidence citation",
  gate_outcome_requests: "gate outcome request",
  implementation_evidence: "evidence citation",
  implementation_statements: "implementation statement",
  implemented_requirements: "control implementation",
  import_issues: "import issue",
  ingestion_jobs: "ingestion job",
  inheritance_acceptances: "inheritance acceptance",
  inventory_components: "implemented component",
  inventory_items: "inventory item",
  issue_evidence: "evidence citation",
  issue_observations: "linked observation",
  issue_poams: "linked remediation item",
  library_apply_requests: "library apply request",
  library_assignment_targets: "library assignment target",
  library_assignments: "library assignment",
  lifecycle_gates: "lifecycle gate",
  mapping_collections: "mapping collection",
  mapping_endpoints: "mapping endpoint",
  observation_evidence: "evidence citation",
  observations: "observation",
  offered_implementations: "offering",
  // The operational issues register: an issue with its program and owner by name.
  operational_issue_rows: "operational issue",
  operational_issues: "operational issue",
  oscal_document_imports: "OSCAL document import",
  oscal_document_resources: "OSCAL resource",
  oscal_document_revisions: "OSCAL document revision",
  oscal_documents: "OSCAL document",
  package_documents: "package document",
  package_revisions: "authorization package version",
  parameter_choices: "parameter choice",
  parameter_constraints: "parameter constraint",
  parameter_guidelines: "parameter guideline",
  parameter_pins: "parameter pin",
  parameter_values: "parameter value",
  parameters: "parameter",
  parties: "party",
  program_sctm_rows: "control mapping",
  requirement_workbook_rows: "engineering requirement",
  poam_documents: "POA&M plan",
  poam_item_observations: "linked observation",
  poam_item_revisions: "remediation commitment",
  poam_item_risks: "linked risk assessment",
  poam_items: "remediation item",
  poam_milestones: "remediation milestone",
  poam_revision_items: "POA&M plan item",
  poam_revisions: "POA&M revision",
  procedure_revisions: "procedure revision",
  procedure_steps: "procedure step",
  procedures: "procedure",
  product_configuration_elements: "configuration element",
  product_configurations: "configuration",
  product_elements: "product element",
  product_revisions: "product version",
  products: "product",
  profile_imports: "profile import",
  profile_overlay_applications: "overlay application",
  profile_parameter_settings: "parameter setting",
  profile_parameter_values: "parameter setting value",
  profile_resolution_catalogs: "resolution catalog",
  profile_resolution_inputs: "resolution input",
  profile_resolutions: "profile resolution",
  profile_revisions: "profile revision",
  profile_rules: "tailoring rule",
  profiles: "profile",
  program_control_requirement_counts: "control coverage",
  program_reference_choices: "reference choice",
  // The program Requirements register: a requirement, its latest revision and its place in a tree.
  program_requirement_rows: "engineering requirement",
  program_role_assignments: "program responsibility",
  program_wizard_requests: "program setup request",
  programs: "program",
  provider_capabilities: "provider capability",
  ref_sources: "reference source",
  requirement_allocations: "allocation",
  requirement_applicability: "applicability decision",
  requirement_control_links: "control mapping",
  requirement_decompositions: "requirement decomposition",
  requirement_definition_revisions: "requirement version",
  requirement_definitions: "requirement",
  requirement_edit_requests: "requirement edit request",
  requirement_evidence: "evidence citation",
  requirement_implementations: "support link",
  requirement_revision_requests: "requirement revision request",
  requirement_revisions: "requirement revision",
  requirement_verifications: "requirement verification",
  result_observations: "result observation",
  result_sets: "result set",
  review_decisions: "review decision",
  // An ATT&CK technique a risk concerns, from NIST SP 800-160 Vol. 2 Rev. 1, Appendix F.
  risk_attack_techniques: "linked ATT&CK technique",
  risk_observations: "linked observation",
  risk_responses: "risk response",
  risk_revisions: "risk assessment",
  // The risk register: a risk with its latest assessment.
  risk_rows: "risk",
  risks: "risk",
  scheduled_assessment_tasks: "scheduled assessment task",
  scope_baselines: "scope baseline",
  scopes: "scope",
  security_processes: "security process",
  selected_controls: "selected control",
  selection_provenance: "selection provenance",
  ssp_revisions: "SSP revision",
  step_result_evidence: "evidence citation",
  step_results: "step result",
  system_baseline_requests: "system baseline request",
  system_component_element_links: "component element link",
  system_components: "system component",
  system_effective_baselines: "effective baseline",
  systems: "system",
  task_activities: "linked assessment activity",
  task_assessments: "linked assessment task",
  task_assignments: "task assignment",
  task_create_requests: "task create request",
  task_evidence: "evidence citation",
  task_implementations: "linked control implementation",
  task_issues: "linked task",
  task_poams: "linked task",
  task_requirements: "linked requirement",
  task_risks: "linked task",
  // The task registers: a task with its program and the people assigned by name.
  task_rows: "task",
  tasks: "task",
  tenant_memberships: "workspace membership",
  tenants: "workspace",
  test_run_evidence: "evidence citation",
  test_runs: "test run",
  workstreams: "workstream",
} as const satisfies Partial<Record<TableName | RegisterView, string>>;

/** A server-paged register's view: its rows are records of a model, and read as that record. */
type RegisterView = keyof Database["public"]["Views"];

type NamedModel = keyof typeof nouns;

/** The tables and views that have a product noun: every product model. */
export const productNounTables = Object.keys(nouns) as NamedModel[];

function isModel(table: string): table is NamedModel {
  return Object.hasOwn(nouns, table);
}

/**
 * What a framework item is, by its kind (`framework_items.kind`), in the product's words. `noun`
 * names one; `holders` say what the items that hold it are to it, nearest first, as its preview
 * labels them (a security outcome's Process and Group); `coded` marks a kind whose code is the
 * publication's own identifier, read with its title (T1190 Exploit Public-Facing Application);
 * `text` names what the publication prints of it, where that is a definition. One map: a
 * preview's name, its title, its facts and their labels read it.
 */
const frameworkItemKinds: Readonly<
  Record<string, { noun: string; holders?: readonly string[]; coded?: boolean; text?: string }>
> = {
  // The cyber resiliency constructs of NIST SP 800-160 Vol. 2 Rev. 1.
  goal: { noun: "resiliency goal", text: "Definition" },
  objective: { noun: "resiliency objective", text: "Definition" },
  technique: { noun: "resiliency technique", text: "Definition" },
  approach: { noun: "approach", holders: ["Technique"], text: "Definition" },
  "strategic-design-principle": { noun: "strategic design principle" },
  "structural-design-principle": { noun: "structural design principle" },
  // ATT&CK as the volume's Appendix F names it. A specific effect is held by a high-level one.
  tactic: { noun: "tactic" },
  "attack-technique": { noun: "ATT&CK technique", coded: true },
  mitigation: { noun: "ATT&CK mitigation", coded: true },
  "candidate-mitigation": { noun: "candidate mitigation", coded: true },
  effect: { noun: "effect", holders: ["High-level effect"], text: "Definition" },
  // The system life cycle processes of NIST SP 800-160 Vol. 1 Rev. 1.
  "process-group": { noun: "process group" },
  process: { noun: "life cycle process", holders: ["Group"] },
  outcome: { noun: "security outcome", holders: ["Process", "Group"] },
};

/** A framework item as the product words it. */
export type FrameworkItemWords = {
  /** What one is, singular and in sentence case: "security outcome". */
  noun: string;
  /** What the items that hold it are to it, nearest first: "Process", then "Group". */
  holders: readonly string[];
  /** Its code is the publication's identifier and leads its name: "T1190 Exploit…". */
  coded: boolean;
  /** The label of what the publication prints of it: "Definition", else "Description". */
  text: string;
};

/** The product's words for a framework item of a kind; `undefined` for a kind it has none for. */
export function frameworkItemWords(kind: unknown): FrameworkItemWords | undefined {
  const words =
    typeof kind === "string" && Object.hasOwn(frameworkItemKinds, kind)
      ? frameworkItemKinds[kind]
      : undefined;
  if (!words) return undefined;
  return {
    noun: words.noun,
    holders: words.holders ?? [],
    coded: words.coded ?? false,
    text: words.text ?? "Description",
  };
}

/** The framework items' table, or the view that reads the current revision's. */
const isFrameworkItems = (table: string) =>
  table === "framework_items" || table === "framework_item_rows";

/** Labels describe real tables; fields and choices still come from the database. */
export function productRecordNoun(table: string, values?: Record<string, unknown>): string {
  if (table === "parties") {
    const type = values?.["party_type"];
    if (type === "organization" || type === "person" || type === "team") return type;
  }
  // A framework item is named for what it is: a security outcome, an ATT&CK technique.
  if (isFrameworkItems(table)) {
    const words = frameworkItemWords(values?.["kind"]);
    if (words) return words.noun;
  }
  if (isModel(table)) return nouns[table];
  // A name the models do not know (a stale key, a diagnostic collection) still reads as words.
  return labelFor(table.replace(/ies$/, "y").replace(/s$/, "")).toLowerCase();
}

/** The same operation label belongs on a create trigger, its form and its submit button. */
export function productCreateLabel(table: string, values?: Record<string, unknown>): string {
  return `Create ${productRecordNoun(table, values)}`;
}

/**
 * The columns the product names in words their own names do not say, by table: a form's field and
 * a preview's fact read the same.
 */
const columnLabels: Record<string, Record<string, string>> = {
  // A criterion drawn from NIST SP 800-160 Vol. 1 names the security outcome it came from.
  gate_criteria: { outcome_item_id: "Security outcome" },
};

/**
 * The product's own words for a column, where it has them; a form or a preview derives the rest.
 * `values` are the record's, for a column whose words depend on what the record is: the item that
 * holds a framework item is a security outcome's Process and an approach's Technique.
 */
export function productColumnLabel(
  table: string,
  column: string,
  values?: Record<string, unknown>,
): string | undefined {
  if (isFrameworkItems(table) && column === "parent_item_id")
    return frameworkItemWords(values?.["kind"])?.holders[0];
  return columnLabels[table]?.[column];
}

/**
 * A form field's label in the product's words. A party reference is named for the role it records
 * ("Owner", "Sponsor", "Author", as the record previews name it), and a few columns take the
 * register's words ("Contact email"); every other column reads as its own name without `_id`.
 */
export function productFieldLabel(
  table: string,
  column: string,
  values?: Record<string, unknown>,
): string {
  const named = productColumnLabel(table, column, values);
  if (named) return named;
  // Status is operational progress (Active, Retired); State is a version's draft or published.
  if ((table === "products" || table === "product_configurations") && column === "state")
    return "Status";
  // An SSP's narratives, in the words its register and preview use.
  if (table === "implemented_requirements") {
    if (column === "description") return "Control narrative";
    if (column === "selected_control_id") return "Control";
  }
  if (table === "implementation_statements" && column === "description")
    return "Statement narrative";
  // A due is a calendar day, asked for as Create task asks for it.
  if (column === "due_on") return "Due date";
  if (table === "parties") {
    if (column === "email") return "Contact email";
    // An organization's organization is the one it belongs to.
    if (column === "organization_id")
      return values?.["party_type"] === "organization" ? "Parent organization" : "Organization";
  }
  return labelFor(column.replace(/_party_id$/, "").replace(/_id$/, ""));
}

const plurals: Record<string, string> = {
  person: "people",
  "gate criterion": "gate criteria",
  "selection provenance": "selection provenance records",
};

export function productCollectionNoun(table: string, values?: Record<string, unknown>): string {
  const noun = productRecordNoun(table, values);
  if (plurals[noun]) return plurals[noun];
  if (noun.endsWith("y") && !/[aeiou]y$/.test(noun)) return `${noun.slice(0, -1)}ies`;
  return `${noun}${/(s|x|ch|sh)$/.test(noun) ? "es" : "s"}`;
}

/**
 * Columns of which a record sets one (`exactlyOne`) or at most one: the polymorphic targets a
 * check constraint (`num_nonnulls(...)`) enforces. The schema catalog does not expose check
 * constraints, so they are named here, beside the nouns, and a test compares them with the
 * migrations. A form that is given one member by its context hides the others, since setting
 * any of them could only fail the save.
 */
export type ProductTargetGroup = { columns: readonly string[]; exactlyOne: boolean };

const workflowTargets = [
  "program_id",
  "task_id",
  "issue_id",
  "risk_id",
  "poam_item_id",
  "assessment_campaign_id",
  "evidence_artifact_id",
  "package_id",
] as const;

const targetGroups: Partial<Record<TableName, readonly ProductTargetGroup[]>> = {
  activity_events: [{ columns: workflowTargets, exactlyOne: true }],
  assessment_subjects: [
    {
      columns: [
        "system_id",
        "scope_id",
        "component_id",
        "composition_node_id",
        "inventory_item_id",
        "party_id",
      ],
      exactlyOne: true,
    },
  ],
  change_requests: [
    {
      columns: [
        "ssp_revision_id",
        "requirement_revision_id",
        "procedure_revision_id",
        "assessment_plan_revision_id",
        "risk_revision_id",
        "poam_item_revision_id",
      ],
      exactlyOne: true,
    },
  ],
  comments: [{ columns: workflowTargets, exactlyOne: true }],
  control_links: [
    {
      columns: ["target_control_id", "target_part_id", "target_group_id", "resource_id"],
      exactlyOne: false,
    },
  ],
  control_parts: [{ columns: ["control_id", "group_id"], exactlyOne: false }],
  evidence_uses: [
    { columns: ["component_contribution_id", "requirement_revision_id"], exactlyOne: true },
  ],
  implementation_evidence: [
    {
      columns: [
        "implemented_requirement_id",
        "implementation_statement_id",
        "component_contribution_id",
      ],
      exactlyOne: true,
    },
  ],
  library_assignments: [
    { columns: ["source_revision_id", "requirement_definition_revision_id"], exactlyOne: true },
  ],
  mapping_endpoints: [{ columns: ["control_id", "control_part_id"], exactlyOne: true }],
  package_documents: [
    {
      columns: [
        "ssp_revision_id",
        "assessment_plan_revision_id",
        "assessment_results_revision_id",
        "poam_revision_id",
        "evidence_version_id",
      ],
      exactlyOne: true,
    },
  ],
  parameters: [{ columns: ["control_id", "group_id"], exactlyOne: false }],
  profile_imports: [
    { columns: ["catalog_revision_id", "imported_profile_revision_id"], exactlyOne: true },
  ],
  requirement_allocations: [
    { columns: ["system_id", "provider_capability_id", "security_process_id"], exactlyOne: true },
  ],
  requirement_implementations: [
    { columns: ["implemented_requirement_id", "component_contribution_id"], exactlyOne: true },
  ],
  review_decisions: [
    {
      columns: [
        "gate_criterion_id",
        "package_revision_id",
        "evidence_version_id",
        "risk_revision_id",
      ],
      exactlyOne: true,
    },
  ],
};

/** The polymorphic target groups of a table; none for a table without one. */
export function productTargetGroups(table: string): readonly ProductTargetGroup[] {
  return isModel(table) ? (targetGroups[table as TableName] ?? []) : [];
}

/** The tables with a polymorphic target group, for the test that compares them with the schema. */
export const targetGroupTables = Object.keys(targetGroups) as TableName[];

/** The authored content leads: a name, then the text that is the record (a comment's body). */
const leadingFields = [
  "title",
  "name",
  "code",
  "body",
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
    /^(source_uuid|oscal_uuid|oscal_document_revision_id|source_pointer|source_content|metadata|original_content|ordinal|content_sha256|input_sha256|output_sha256|resolver_name|resolver_version)$/.test(
      column.name,
    )
  );
}
