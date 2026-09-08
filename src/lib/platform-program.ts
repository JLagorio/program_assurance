import type { Program } from "@/lib/grc-data";
import { platformSeed, type PlatformSeed } from "@/lib/platform-seed";

/** The program is the entry point; the imported system graph retains its own identifiers. */
export function platformProgramFrom(data: PlatformSeed): Program {
  const system = data.systems[0]!;
  const profile = data.profiles.find((item) => item.id === system.profile_id)!;
  const assessed = new Set(
    data.assessment_results
      .filter((result) => result.outcome !== "not-assessed")
      .flatMap((result) => result.control_ids),
  );
  const failing = new Set(
    data.assessment_results
      .filter((result) => result.outcome === "fail")
      .flatMap((result) => result.control_ids),
  );
  const impact = (value: string): Program["impact"] =>
    value === "high" ? "High" : value === "moderate" ? "Moderate" : "Low";
  return {
    id: "PRG-1090",
    name: system.name,
    acronym: system.short_name,
    system: system.id,
    type: "Weapon system",
    environment: "Deployed platform",
    impact: impact(system.security_categorization.overall),
    confidentiality: impact(system.security_categorization.confidentiality),
    integrity: impact(system.security_categorization.integrity),
    availability: impact(system.security_categorization.availability),
    baseline: profile.name,
    controlsTotal: profile.effective_control_ids.length,
    controlsAssessed: profile.effective_control_ids.filter((id) => assessed.has(id)).length,
    controlsFailing: profile.effective_control_ids.filter((id) => failing.has(id)).length,
    status: data.poam_items.some((item) => item.status !== "completed")
      ? "POA&M open"
      : "In assessment",
    owner: "System Security Engineer",
    assessor: data.assessments[0]?.assessor_role ?? "Unassigned",
    authorizingOfficial: "Unassigned",
    authorized: "—",
    expires: "—",
    updated: data.dataset_metadata.generated_at,
    summary: system.description,
  };
}

export const platformProgram = platformProgramFrom(platformSeed);
