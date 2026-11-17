/**
 * A program record's parts (Josef's decision of 2026-11-16): the record has no tab strip, since the
 * side nav's work scope names the parts (src/lib/navigation-scope.ts), and each part keeps the
 * address its tab had. `?tab=` names the part and, on the POA&M & risk address, the hash names
 * which of its two parts: the risks' Section (`#program-risks`) is Risks, anything else POA&M.
 * Each part is named by its h1, which is the name the side nav gives it where the nav lists it.
 */
import { programSections } from "./navigation-scope";

/** The tabs an address names, in the order the record listed them. */
export const programTabs = [
  "Overview",
  "System",
  "Library",
  "Requirements",
  "Controls",
  "Assessment campaigns",
  "Schedule",
  "Findings",
  "Evidence",
  "POA&M & risk",
] as const;
export type ProgramTab = (typeof programTabs)[number];
/** Tab names the program no longer has, which still reach their content's tab. */
export type RetiredProgramTab = "POA&M" | "Risk" | "Activity";

/** A name an address may give a tab, and the tab that holds its content now. */
const tabAliases: Readonly<Record<string, ProgramTab>> = {
  systems: "System",
  tasks: "Schedule",
  work: "Schedule",
  team: "Schedule",
  "poa&m": "POA&M & risk",
  poam: "POA&M & risk",
  poams: "POA&M & risk",
  risk: "POA&M & risk",
  risks: "POA&M & risk",
  activity: "Overview",
  requirements: "Requirements",
  assessment: "Assessment campaigns",
  assessments: "Assessment campaigns",
};

/**
 * The tab an address names. A retired tab lands where its content went: POA&M and Risk in POA&M &
 * risk, Activity on the Overview, whose activity Timeline it now is; anything else is Overview.
 */
export function programTab(value: unknown): ProgramTab {
  const text = String(value ?? "").toLowerCase();
  return programTabs.find((tab) => tab.toLowerCase() === text) ?? tabAliases[text] ?? "Overview";
}

/** The words an address may name the Risks part by: the retired Risk tab's, or the part's own. */
export const riskTabs = ["Risk", "Risks", "risk", "risks"] as const;
export type RiskTab = (typeof riskTabs)[number];

/** Whether an address names the Risks part by a word of its own (`?tab=risk`, `?tab=Risks`). */
export const isRiskTab = (value: unknown): value is RiskTab =>
  riskTabs.some((word) => word === value);

/** The hash an aliased address keeps as it is replaced: `?tab=risk` and `?tab=Risks` are Risks. */
export function programTabHash(value: unknown): string | undefined {
  const text = String(value ?? "").toLowerCase();
  return text === "risk" || text === "risks" ? programSections.risks : undefined;
}

/** The program's parts, in the record's order: each a page of the record, named by its h1. */
export const programParts = [
  "Overview",
  "System",
  "Library",
  "Requirements",
  "Controls",
  "Assessments",
  "Schedule",
  "Findings",
  "Evidence",
  "POA&M",
  "Risks",
] as const;
export type ProgramPart = (typeof programParts)[number];

/** The tab each part is at. */
const partTabs: Readonly<Record<ProgramPart, ProgramTab>> = {
  Overview: "Overview",
  System: "System",
  Library: "Library",
  Requirements: "Requirements",
  Controls: "Controls",
  Assessments: "Assessment campaigns",
  Schedule: "Schedule",
  Findings: "Findings",
  Evidence: "Evidence",
  "POA&M": "POA&M & risk",
  Risks: "POA&M & risk",
};

/** The part an address shows: its tab, and on the POA&M & risk tab its hash. */
export function programPart(tab: ProgramTab, hash: string): ProgramPart {
  if (tab === "POA&M & risk") return hash === programSections.risks ? "Risks" : "POA&M";
  if (tab === "Assessment campaigns") return "Assessments";
  return tab;
}

/** Where a part is: the search and, for Risks, the hash that open it. */
export function partAddress(part: ProgramPart): {
  search: { tab: ProgramTab };
  hash?: string;
} {
  return {
    search: { tab: partTabs[part] },
    ...(part === "Risks" ? { hash: programSections.risks } : {}),
  };
}
