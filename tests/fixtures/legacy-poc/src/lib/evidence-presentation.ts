/** Labels and native destinations for evidence relationships; no relationships are inferred here. */
import { campaignById, eventById, objectiveById } from "@/lib/campaigns";
import { nodeById } from "@/lib/composition";
import { findingProgram, findings } from "@/lib/findings";
import { nistControlById } from "@/lib/nist-catalog";
import { getRequirement } from "@/lib/requirements";
import { scopeById } from "@/lib/scopes";
import { procedureById, runById, runVerdict } from "@/lib/test-execution";
import type { EvidenceArtifact, EvidenceLink } from "@/lib/evidence-catalog";

export type EvidenceSupportRow = {
  key: string;
  link: EvidenceLink;
  kind:
    | "Implementation"
    | "Requirement"
    | "Finding"
    | "Assessment"
    | "Test event"
    | "Objective"
    | "Run";
  title: string;
  context: string;
  contextDetail?: string;
  available: boolean;
  elementId?: string;
  campaignId?: string;
  runId?: string;
};

export function evidenceSupportRows(artifact: EvidenceArtifact): EvidenceSupportRow[] {
  return artifact.links
    .map((link): EvidenceSupportRow => {
      const scope = link.scopeId ? scopeById.get(link.scopeId) : undefined;
      const scopeValid = !link.scopeId || scope?.program === artifact.program;
      const base = {
        key: `${link.kind}|${link.id}|${link.scopeId ?? ""}`,
        link,
        context: scopeValid && scope ? scope.name : link.scopeId ? "Unavailable scope" : "Program",
        ...(scopeValid && scope ? { elementId: scope.element } : {}),
      };
      if (link.kind === "control")
        return {
          ...base,
          kind: "Implementation",
          title: nistControlById.get(link.id)?.title ?? link.id,
          available: !!scope && scopeValid && nistControlById.has(link.id),
        };
      if (link.kind === "requirement") {
        const requirement = getRequirement(link.id);
        return {
          ...base,
          kind: "Requirement",
          title: requirement?.text ?? link.id,
          available: scopeValid && requirement?.program === artifact.program,
        };
      }
      if (link.kind === "finding") {
        const finding = findings.find((row) => row.id === link.id);
        const nodes = finding?.nodes ?? (finding?.node ? [finding.node] : []);
        return {
          ...base,
          kind: "Finding",
          title: finding?.title ?? link.id,
          context: nodes.map((id) => nodeById.get(id)?.name ?? id).join(", ") || base.context,
          available: !!finding && findingProgram(finding) === artifact.program && scopeValid,
        };
      }
      const run = runById(link.id);
      const objective = objectiveById.get(link.id);
      const event =
        eventById.get(link.id) ??
        (run?.event
          ? eventById.get(run.event)
          : objective?.event
            ? eventById.get(objective.event)
            : undefined);
      const campaign =
        campaignById.get(link.id) ?? (event ? campaignById.get(event.campaign) : undefined);
      const kind = run
        ? "Run"
        : objective
          ? "Objective"
          : eventById.has(link.id)
            ? "Test event"
            : "Assessment";
      return {
        ...base,
        kind,
        title: run
          ? (procedureById.get(run.procedure)?.title ?? run.id)
          : (objective?.statement ?? event?.name ?? campaign?.name ?? link.id),
        context: run
          ? `${procedureById.get(run.procedure)?.assessmentMethod ?? "Assessment"} · ${runVerdict(run.id)?.result ?? run.state} · ${run.nodes.length} component${run.nodes.length === 1 ? "" : "s"}`
          : event && kind === "Objective"
            ? `${event.id} · ${event.name}`
            : (campaign?.name ?? "Unavailable assessment"),
        available: campaign?.program === artifact.program && scopeValid,
        ...(run
          ? {
              contextDetail: `${event?.id ?? "Unrecorded event"} · ${run.nodes.map((id) => nodeById.get(id)?.name ?? id).join(", ")} · ${run.build === "Unrecorded" ? "Build unrecorded" : run.build}`,
            }
          : {}),
        ...(campaign?.program === artifact.program ? { campaignId: campaign.id } : {}),
        ...(run && campaign?.program === artifact.program ? { runId: run.id } : {}),
      };
    })
    .map((row) =>
      row.available
        ? row
        : {
            ...row,
            title: row.link.id,
            context: "Unavailable record",
            contextDetail: "Unavailable record",
          },
    );
}

export function evidenceSupportSummary(artifact: EvidenceArtifact): string {
  const rows = evidenceSupportRows(artifact);
  const counts = new Map<string, number>();
  for (const row of rows) {
    const label = row.available ? row.kind.toLowerCase() : "unresolved link";
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }
  return (
    [...counts].map(([label, count]) => `${count} ${label}${count === 1 ? "" : "s"}`).join(" · ") ||
    "Not linked"
  );
}

export function evidenceScopeNames(artifact: EvidenceArtifact): string[] {
  return [
    ...new Set(
      artifact.scopeIds.flatMap((id) => {
        const scope = scopeById.get(id);
        return scope?.program === artifact.program ? [scope.name] : [];
      }),
    ),
  ];
}
