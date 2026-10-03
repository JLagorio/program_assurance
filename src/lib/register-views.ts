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
} as const;

export type RegisterView = (typeof registerViews)[keyof typeof registerViews];
