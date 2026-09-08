import { restorePrograms, restoreProgramCommands } from "@/lib/program-store";
import { restoreProgramSetups } from "@/lib/program-setup";
import { restoreRequirements } from "@/lib/requirements";
import { restoreAssessments } from "@/lib/assessment-store";
import { restoreVerificationLinks } from "@/lib/requirement-verification";
import { restoreTestRuns } from "@/lib/test-execution";
import { restoreEvidence } from "@/lib/evidence-catalog";
import { restoreWork } from "@/lib/control-work";
import { restoreAssuranceRecords } from "@/lib/assurance-record-store";
import { restoreTasks } from "@/lib/tasks";
import { restoreProgramSchedule } from "@/lib/program-schedule";
import { registerPlatformData } from "@/lib/platform-ingestion";

/** Restore referenced records before dependants validate their saved relationships. */
export function restoreWorkspaceRecords(): string[] {
  const errors: string[] = [];
  for (const [label, restore] of [
    ["WS-X90 seed", registerPlatformData],
    ["Programs", restorePrograms],
    ["Program actions", restoreProgramCommands],
    ["System boundaries", restoreProgramSetups],
    ["Requirements", restoreRequirements],
    ["Assessments", restoreAssessments],
    ["Verification links", restoreVerificationLinks],
    ["Assessment runs", restoreTestRuns],
    ["Evidence", restoreEvidence],
    ["Control implementation", restoreWork],
    ["Findings and POA&Ms", restoreAssuranceRecords],
    ["Tasks", restoreTasks],
    ["Schedule", restoreProgramSchedule],
  ] as const) {
    try {
      restore();
    } catch (error) {
      errors.push(
        `${label}: ${error instanceof Error ? error.message : "Saved records could not be read."}`,
      );
    }
  }
  return errors;
}
