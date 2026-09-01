/**
 * Every evidence artifact the repo actually knows about.
 *
 * There is no central evidence table in this codebase: `EVD-` ids appear on
 * findings (`sourceArtifact` and `assessment.evidence`) and on test-run step
 * records, with `baselines.ts` maintaining a collection-date index over both.
 * Rather than invent a parallel store, this harvests what exists so that
 * linking an artifact to a control links a real one.
 */

import { evidenceCollectedOn } from "@/lib/baselines";
import { findings } from "@/lib/findings";
import { testRuns } from "@/lib/test-execution";

export type EvidenceArtifact = {
  id: string; // EVD-
  label: string;
  collected: string;
};

function build(): EvidenceArtifact[] {
  const labels = new Map<string, string>();

  for (const f of findings) {
    if (f.sourceArtifact?.startsWith("EVD-")) {
      labels.set(f.sourceArtifact, `${f.source} output citing ${f.control}`);
    }
    for (const e of f.assessment.evidence ?? []) {
      if (e.startsWith("EVD-") && !labels.has(e)) {
        labels.set(e, `Assessment artifact for ${f.control}`);
      }
    }
  }

  for (const run of testRuns) {
    for (const record of run.records) {
      for (const e of record.evidence ?? []) {
        if (e.startsWith("EVD-") && !labels.has(e)) {
          labels.set(e, `Test run capture — ${run.id}`);
        }
      }
    }
  }

  return [...labels.entries()]
    .map(([id, label]) => ({ id, label, collected: evidenceCollectedOn(id) ?? "Unknown" }))
    .sort((a, b) => a.id.localeCompare(b.id));
}

export const evidenceCatalog: EvidenceArtifact[] = build();
