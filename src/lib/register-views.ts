/**
 * The views of the registers a link can open on a question. A register's view names its column
 * layout in the reader's browser and the parameters its question takes in the address
 * (`risk-register.filters`, `operational-issues.q`), so a Portfolio tile or a heatmap cell can link
 * to the register filtered to what it counts. Renaming one breaks the links people have shared:
 * a view here keeps its name.
 */
export const registerViews = {
  programs: "programs",
  risks: "risk-register",
  operationalIssues: "operational-issues",
  assessmentFindings: "assessment-findings",
  systemAssets: "system-assets",
  /** The Review queue: everything in the workspace waiting on a reviewer. */
  reviewQueue: "review-queue",
  /** The List of a program's Control status view: its controls by where the program stands. */
  controlStatus: "program-control-status",
  /** The List of a program's Product delta view: a variant's controls against its product. */
  productDelta: "program-product-delta",
  /** A program's Compliance matrix: a customer's requirements with the program's answers. */
  compliance: "program-compliance",
  /** The List of a product's Assessment tab: its controls by configuration. */
  productAssessment: "product-assessment",
  /** A program's Findings tab: its operational issues (ProgramCollection's `program-<table>`). */
  programOperationalIssues: "program-operational_issues",
  /** A program's POA&M & risk tab: its risks. */
  programRisks: "program-risks",
} as const;

/**
 * The ATT&CK techniques column of a program's risks (`programRisks`), which a filter's question
 * names: a control's Risks count opens the register on the technique it counts, by the technique's
 * identifier and name together ("T1078 Valid Accounts"). Renaming it breaks those links.
 */
export const programRiskTechniquesColumn = "attack_techniques";

/** The task register a program's Schedule draws (WorkTable), one view a program. */
export const programTasksView = (programId: string) => `tasks-${programId}`;

export type RegisterView = (typeof registerViews)[keyof typeof registerViews];
