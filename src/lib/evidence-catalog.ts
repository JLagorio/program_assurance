/** Shared evidence inventory. Artifacts support claims; linking one never assesses a claim. */
import { useEffect, useSyncExternalStore } from "react";
import { programs } from "@/lib/grc-data";
import { assetById, findings } from "@/lib/findings";
import { campaignById, eventById, objectiveById } from "@/lib/campaigns";
import { nodeById } from "@/lib/composition";
import { allTestRuns, runById, useRunLogVersion } from "@/lib/test-execution";
import { controlSetFor, scopesForProgram } from "@/lib/scopes";
import { getRequirement } from "@/lib/requirements";

export type EvidenceLink = {
  kind: "control" | "requirement" | "assessment" | "finding";
  id: string;
  scopeId?: string;
};
export type EvidenceReview = "Pending review" | "Accepted" | "Needs revision";
export type EvidenceArtifact = {
  id: string;
  label: string;
  collected: string;
  program: string;
  scopeIds: string[];
  owner: string;
  kind: "Configuration" | "Test result" | "Document" | "Scan output";
  version: string;
  provenance: string;
  url?: string;
  review: EvidenceReview;
  reviewedBy?: string;
  reviewedOn?: string;
  reviewNote?: string;
  links: EvidenceLink[];
  sourceId?: string;
  sourceUuid?: string;
  referenceUri?: string;
  sha256?: string;
  validThrough?: string;
  componentIds?: string[];
  assessmentReuse?: string;
};
export type NewEvidence = Pick<
  EvidenceArtifact,
  "label" | "collected" | "program" | "owner" | "kind" | "version" | "provenance" | "url"
> & { scopeIds?: string[]; links?: EvidenceLink[] };

const storageKey = "equinox.evidence.v1";
const saved = new Map<string, EvidenceArtifact>();
const sources = new Set<() => EvidenceArtifact[]>();
const listeners = new Set<() => void>();
let revision = 0;
let restored = false;
const keyOf = (link: EvidenceLink) => `${link.kind}|${link.id}|${link.scopeId ?? ""}`;
function emit() {
  revision += 1;
  listeners.forEach((listener) => listener());
}
export function subscribeEvidence(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
/** A source record changed its artifact relationships. */
export function notifyEvidenceSourcesChanged() {
  emit();
}

export function evidenceVersion() {
  return revision;
}
export function registerEvidenceSource(source: () => EvidenceArtifact[]) {
  sources.add(source);
}
export function useEvidenceVersion() {
  const runVersion = useRunLogVersion();
  useEffect(() => {
    restoreEvidence();
  }, []);
  return useSyncExternalStore(subscribeEvidence, evidenceVersion, () => 0) + runVersion;
}
export function restoreEvidence() {
  if (restored || typeof window === "undefined") return;
  const raw = window.localStorage.getItem(storageKey);
  if (raw) {
    const rows: unknown = JSON.parse(raw);
    if (
      !Array.isArray(rows) ||
      !rows.every(
        (row) =>
          row &&
          typeof row.id === "string" &&
          typeof row.program === "string" &&
          typeof row.label === "string" &&
          Array.isArray(row.links) &&
          Array.isArray(row.scopeIds),
      )
    )
      throw new Error("Saved evidence records could not be read.");
    for (const row of rows as EvidenceArtifact[]) saved.set(row.id, row);
  }
  restored = true;
  emit();
}
function commit(artifact: EvidenceArtifact) {
  const next = new Map(saved).set(artifact.id, artifact);
  if (typeof window !== "undefined")
    window.localStorage.setItem(storageKey, JSON.stringify([...next.values()]));
  saved.set(artifact.id, artifact);
  emit();
  return artifact;
}
function sourceArtifact(
  id: string,
  program: string,
  label: string,
  collected: string,
  owner: string,
  provenance: string,
  links: EvidenceLink[],
  kind: EvidenceArtifact["kind"],
): EvidenceArtifact {
  return {
    id,
    program,
    label,
    collected,
    owner,
    provenance,
    kind,
    scopeIds: [],
    version: "Unrecorded",
    review: "Pending review",
    links,
  };
}
function allEvidence(): EvidenceArtifact[] {
  const rows = new Map<string, EvidenceArtifact>();
  const add = (artifact: EvidenceArtifact) => {
    if (!artifact.id.startsWith("EVD-") || !artifact.program) return;
    const existing = rows.get(artifact.id);
    if (!existing) rows.set(artifact.id, { ...artifact, links: [...artifact.links] });
    else if (existing.program === artifact.program) {
      existing.links = [
        ...new Map(
          [...existing.links, ...artifact.links].map((link) => [keyOf(link), link]),
        ).values(),
      ];
      existing.scopeIds = [...new Set([...existing.scopeIds, ...artifact.scopeIds])];
    }
  };
  // Catalog records own metadata; findings and runs only contribute relationships.
  for (const source of sources) source().forEach(add);
  for (const finding of findings) {
    const program =
      (finding as { program?: string }).program ?? assetById.get(finding.asset)?.program;
    if (!program) continue;
    for (const id of new Set([
      finding.sourceArtifact,
      ...finding.assessment.evidence,
      ...(finding.retests ?? []).flatMap((retest) => retest.evidence),
    ])) {
      add(
        sourceArtifact(
          id,
          program,
          `${finding.source} · ${finding.control}`,
          finding.assessment.assessedOn || finding.firstSeen,
          finding.assessment.assessedBy || finding.owner,
          `${finding.source} recorded in ${finding.id}`,
          [{ kind: "finding", id: finding.id }],
          finding.source.includes("scan") || finding.source === "STIG checklist"
            ? "Scan output"
            : "Test result",
        ),
      );
    }
  }
  for (const seeded of allTestRuns()) {
    const run = runById(seeded.id) ?? seeded;
    const event = run.event ? eventById.get(run.event) : undefined;
    const program =
      (run as { program?: string }).program ??
      (event ? campaignById.get(event.campaign)?.program : undefined) ??
      run.nodes.map((id) => nodeById.get(id)?.program).find(Boolean);
    if (!program) continue;
    for (const record of run.records)
      for (const id of record.evidence) {
        add(
          sourceArtifact(
            id,
            program,
            `Test capture · ${run.id}`,
            record.at !== "—" ? record.at : run.started,
            run.operator,
            `Recorded by ${run.operator} in ${run.id}, step ${record.step}`,
            [{ kind: "assessment", id: run.id }],
            "Test result",
          ),
        );
      }
  }
  for (const artifact of saved.values()) {
    const derived = rows.get(artifact.id);
    // Finding and run relationships remain sourced from their records; user-maintained links are persisted here.
    const sourced =
      derived?.links.filter((link) => link.kind === "finding" || link.kind === "assessment") ?? [];
    rows.set(artifact.id, {
      ...artifact,
      links: [
        ...new Map([...artifact.links, ...sourced].map((link) => [keyOf(link), link])).values(),
      ],
    });
  }
  return [...rows.values()].sort((a, b) => a.id.localeCompare(b.id));
}
/** Legacy iterable API remains available; new readers should use scoped selectors. */
export const evidenceCatalog: EvidenceArtifact[] = new Proxy([] as EvidenceArtifact[], {
  get: (_target, property) => {
    const rows = allEvidence();
    const value = Reflect.get(rows, property);
    return typeof value === "function" ? value.bind(rows) : value;
  },
});
export function evidenceForProgram(program: string) {
  return allEvidence().filter((artifact) => artifact.program === program);
}
export function evidenceById(id: string) {
  return allEvidence().find((artifact) => artifact.id === id);
}
export function evidenceForTarget(
  program: string,
  kind: EvidenceLink["kind"],
  id: string,
  scopeId?: string,
) {
  return evidenceForProgram(program).filter((artifact) =>
    artifact.links.some(
      (link) => link.kind === kind && link.id === id && (!scopeId || link.scopeId === scopeId),
    ),
  );
}
function validateLink(artifact: EvidenceArtifact, target: EvidenceLink) {
  if (!target.id.trim()) throw new Error("Choose a supporting record.");
  if (
    target.scopeId &&
    !scopesForProgram(artifact.program).some((scope) => scope.id === target.scopeId)
  )
    throw new Error("The system must belong to this program.");
  if (artifact.scopeIds.length && target.scopeId && !artifact.scopeIds.includes(target.scopeId))
    throw new Error("This artifact belongs to another system scope.");
  if (
    target.kind === "control" &&
    (!target.scopeId ||
      !controlSetFor(target.scopeId)?.controls.some((item) => item.control.id === target.id))
  )
    throw new Error("Choose a control selected for this system.");
  if (target.kind === "requirement" && getRequirement(target.id)?.program !== artifact.program)
    throw new Error("The requirement must belong to this program.");
  if (target.kind === "assessment") {
    const event =
      eventById.get(target.id) ??
      (objectiveById.get(target.id)?.event
        ? eventById.get(objectiveById.get(target.id)!.event!)
        : undefined);
    const run = runById(target.id);
    const runEvent = run?.event ? eventById.get(run.event) : undefined;
    const program =
      campaignById.get(target.id)?.program ??
      (event ? campaignById.get(event.campaign)?.program : undefined) ??
      (run as { program?: string } | undefined)?.program ??
      (runEvent ? campaignById.get(runEvent.campaign)?.program : undefined) ??
      run?.nodes.map((id) => nodeById.get(id)?.program).find(Boolean);
    if (program !== artifact.program)
      throw new Error("The assessment must belong to this program.");
  }
  if (target.kind === "finding") {
    const finding = findings.find((row) => row.id === target.id);
    const program =
      finding &&
      ((finding as { program?: string }).program ?? assetById.get(finding.asset)?.program);
    if (program !== artifact.program) throw new Error("The finding must belong to this program.");
  }
}
export function createEvidence(input: NewEvidence): EvidenceArtifact {
  restoreEvidence();
  if (
    ![
      input.label,
      input.program,
      input.owner,
      input.version,
      input.provenance,
      input.collected,
    ].every((value) => value.trim())
  )
    throw new Error("Title, collection date, owner, version and provenance are required.");
  if (!programs.some((program) => program.id === input.program))
    throw new Error("Program was not found.");
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(input.collected) ||
    !Number.isFinite(Date.parse(input.collected)) ||
    new Date(input.collected).toISOString().slice(0, 10) !== input.collected
  )
    throw new Error("Choose a valid collection date.");
  if (!input.url?.trim()) throw new Error("Provide the artifact's repository URL.");
  let url: URL;
  try {
    url = new URL(input.url.trim());
  } catch {
    throw new Error("Enter a valid http or https artifact URL.");
  }
  if (!["https:", "http:"].includes(url.protocol))
    throw new Error("Artifact URLs must use http or https.");
  if (
    (input.scopeIds ?? []).some(
      (id) => !scopesForProgram(input.program).some((scope) => scope.id === id),
    )
  )
    throw new Error("The system must belong to this program.");
  const ids = allEvidence()
    .map((artifact) => Number(artifact.id.replace("EVD-", "")))
    .filter(Number.isFinite);
  const artifact: EvidenceArtifact = {
    ...input,
    id: `EVD-${Math.max(9000, ...ids) + 1}`,
    label: input.label.trim(),
    url: url.href,
    scopeIds: input.scopeIds ?? [],
    links: input.links ?? [],
    review: "Pending review",
  };
  artifact.links.forEach((link) => validateLink(artifact, link));
  return commit(artifact);
}
export function linkArtifact(id: string, target: EvidenceLink) {
  restoreEvidence();
  const artifact = evidenceById(id);
  if (!artifact) throw new Error("Evidence artifact was not found.");
  validateLink(artifact, target);
  if (artifact.links.some((link) => keyOf(link) === keyOf(target))) return artifact;
  return commit({ ...artifact, links: [...artifact.links, target] });
}
export function unlinkArtifact(id: string, target: EvidenceLink) {
  restoreEvidence();
  const artifact = evidenceById(id);
  if (!artifact) return;
  return commit({
    ...artifact,
    links: artifact.links.filter((link) => keyOf(link) !== keyOf(target)),
  });
}
export function reviewEvidence(
  id: string,
  review: EvidenceReview,
  reviewedBy: string,
  reviewNote: string,
) {
  restoreEvidence();
  const artifact = evidenceById(id);
  if (!artifact) throw new Error("Evidence artifact was not found.");
  if (!reviewedBy.trim() || !reviewNote.trim())
    throw new Error("Reviewer and review rationale are required.");
  return commit({
    ...artifact,
    review,
    reviewedBy: reviewedBy.trim(),
    reviewNote: reviewNote.trim(),
    reviewedOn: new Date().toISOString().slice(0, 10),
  });
}
