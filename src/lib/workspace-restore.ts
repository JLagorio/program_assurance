import { restoreAssessments } from "@/lib/assessment-store";
import { restoreAssuranceRecords } from "@/lib/assurance-record-store";
import { restoreCompositionChanges } from "@/lib/composition-store";
import { restoreWork } from "@/lib/control-work";
import { restoreEvidence } from "@/lib/evidence-catalog";
import { registerPlatformData } from "@/lib/platform-ingestion";
import { restoreProgramSchedule } from "@/lib/program-schedule";
import { restoreProgramSetups } from "@/lib/program-setup";
import { restoreProgramCommands, restorePrograms } from "@/lib/program-store";
import { restoreVerificationLinks } from "@/lib/requirement-verification";
import { restoreRequirements } from "@/lib/requirements";
import { restoreTasks } from "@/lib/tasks";
import { restoreTestRuns } from "@/lib/test-execution";

/** Restore referenced records before dependants validate their saved relationships. */
export function restoreWorkspaceRecords(): string[] {
  const errors: string[] = [];
  for (const [label, restore] of [
    ["WS-X90 seed", registerPlatformData],
    ["Programs", restorePrograms],
    ["Program actions", restoreProgramCommands],
    ["System boundaries", restoreProgramSetups],
    ["System tree", restoreCompositionChanges],
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
