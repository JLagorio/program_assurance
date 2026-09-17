export const campaignTabs = ["Overview", "Execution", "Procedures", "Runs", "Regression"] as const;
export type CampaignTab = (typeof campaignTabs)[number];
