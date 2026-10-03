export const campaignTabs = ["Overview", "Execution", "Procedures", "Runs", "Regression"] as const;
export type CampaignTab = (typeof campaignTabs)[number];

/** The assessment browser's tabs, in order; Scopes shows only within a program. */
export const ASSESSMENT_TABS = ["Campaigns", "Events", "Objectives", "Scopes"] as const;
export type AssessmentKind = (typeof ASSESSMENT_TABS)[number];
/** The browser's tab an address names, in any case; anything else names none. */
export function assessmentTab(value: unknown): AssessmentKind | undefined {
  const text = String(value ?? "").toLowerCase();
  return ASSESSMENT_TABS.find((tab) => tab.toLowerCase() === text);
}
