export const requirementTabs = [
  "Overview",
  "Allocations",
  "Evidence",
  "Activity",
  "Provenance",
] as const;
export type RequirementTab = (typeof requirementTabs)[number];
