export const controlTabs = [
  "Implementation",
  "Requirements",
  "Evidence",
  "Assessment",
  "Tasks",
  "Activity",
  "Reference",
] as const;
export type ControlTab = (typeof controlTabs)[number];
