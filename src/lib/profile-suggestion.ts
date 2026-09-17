import type { Impact, ProgramWizardDraft, SystemWizardDraft } from "./program-wizard";
import type { WizardProfileOption } from "./program-wizard-reference";

const impactOrder: Record<Impact, number> = { low: 0, moderate: 1, high: 2 };

/** The one program profile the categorization points at, when exactly one matches its high-water mark. */
export function suggestProfileKey(
  system: SystemWizardDraft,
  draft: ProgramWizardDraft,
  options: WizardProfileOption[],
): { key: string; level: Impact } | null {
  const levels = [system.confidentiality, system.integrity, system.availability];
  if (levels.some((level) => !level)) return null;
  const level = levels.reduce<Impact>(
    (highest, current) => (impactOrder[current!] > impactOrder[highest] ? current! : highest),
    "low",
  );
  const matches = draft.profiles.filter((profile) =>
    new RegExp(`\\b${level}\\b`, "i").test(
      options.find((option) => option.id === profile.baseResolutionId)?.title ?? "",
    ),
  );
  return matches.length === 1 ? { key: matches[0]!.key, level } : null;
}
