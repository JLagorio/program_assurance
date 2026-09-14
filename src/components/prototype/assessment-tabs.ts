export const campaignTabs = ["Execution", "Procedures", "Runs", "Regression"] as const;
export type CampaignTab = (typeof campaignTabs)[number];
