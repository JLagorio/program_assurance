import { useEffect, useSyncExternalStore } from "react";
import { z } from "zod";

import { toast } from "@ledger/design-system";

import { risks, type Risk } from "@/lib/grc-data";

export type RiskDraft = {
  title: string;
  summary: string;
  framework: string;
  control: string;
  owner: string;
  treatment: string;
  likelihood: string;
  impact: string;
};

export type Treatment = {
  id: string;
  riskId: string;
  action: string;
  plan: string;
  assignee: string;
  due: string;
  recorded: string;
};

const storageKey = "equinox.risks.v1";
const listeners = new Set<() => void>();
let version = 0;
let restored = false;
let savedDraft: RiskDraft | null = null;
const treatments: Treatment[] = [];
const draftSchema = z.object({
  title: z.string(),
  summary: z.string(),
  framework: z.string(),
  control: z.string(),
  owner: z.string(),
  treatment: z.string(),
  likelihood: z.string(),
  impact: z.string(),
});
const riskSchema = draftSchema.extend({
  id: z.string(),
  team: z.string(),
  inherent: z.number().finite(),
  residual: z.number().finite(),
  status: z.enum(["Active", "Mitigating", "Accepted", "Closed"]),
  tone: z.enum(["neutral", "information", "success", "warning", "danger"]),
  updated: z.string(),
  opened: z.string(),
  due: z.string(),
});
const treatmentSchema = z.object({
  id: z.string(),
  riskId: z.string(),
  action: z.string(),
  plan: z.string(),
  assignee: z.string(),
  due: z.string(),
  recorded: z.string(),
});
const storedSchema = z.object({
  risks: z.array(riskSchema),
  treatments: z.array(treatmentSchema),
  draft: draftSchema.nullable(),
});

function notify() {
  version += 1;
  for (const listener of listeners) listener();
}

function persist(nextRisks: Risk[], nextTreatments: Treatment[], draft: RiskDraft | null) {
  // Write first: a quota or storage failure must never produce a successful save.
  window.localStorage.setItem(
    storageKey,
    JSON.stringify({ risks: nextRisks, treatments: nextTreatments, draft }),
  );
  risks.splice(0, risks.length, ...nextRisks);
  treatments.splice(0, treatments.length, ...nextTreatments);
  savedDraft = draft;
  notify();
}

export function restoreRisks() {
  if (restored || typeof window === "undefined") return;
  restored = true;
  const raw = window.localStorage.getItem(storageKey);
  if (!raw) return;
  const state = storedSchema.parse(JSON.parse(raw));
  risks.splice(0, risks.length, ...state.risks);
  treatments.splice(
    0,
    treatments.length,
    ...(Array.isArray(state.treatments) ? state.treatments : []),
  );
  savedDraft = state.draft ?? null;
  notify();
}

export function useRisksVersion() {
  useEffect(() => {
    try {
      restoreRisks();
    } catch {
      toast.add({
        title: "Saved risks could not be restored",
        type: "error",
        timeout: 8000,
        description:
          "Browser storage is unavailable or the saved data is invalid. Existing data has not been overwritten.",
      });
    }
  }, []);
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    () => version,
    () => 0,
  );
}

export function riskDraft(): RiskDraft | null {
  return savedDraft;
}

export function saveRiskDraft(draft: RiskDraft | null) {
  persist([...risks], [...treatments], draft);
}

export function createRisk(draft: RiskDraft): Risk {
  if (!draft.title.trim() || !draft.owner.trim())
    throw new Error("Enter a title and choose an owner.");
  const likelihood = Number(draft.likelihood),
    impact = Number(draft.impact);
  if (![likelihood, impact].every((value) => Number.isInteger(value) && value >= 1 && value <= 5)) {
    throw new Error("Likelihood and impact must be whole numbers from 1 to 5.");
  }
  const id = `RSK-${Math.max(2400, ...risks.map((risk) => Number(risk.id.replace("RSK-", "")) || 0)) + 1}`;
  const inherent = likelihood * impact * 4;
  const date = new Date().toISOString().slice(0, 10);
  const risk: Risk = {
    ...draft,
    title: draft.title.trim(),
    id,
    team: "Unassigned",
    inherent,
    // A treatment plan alone does not reduce risk; assessment establishes the residual.
    residual: inherent,
    status: "Active",
    tone: inherent > 60 ? "danger" : inherent > 30 ? "warning" : "success",
    opened: date,
    updated: date,
    due: "—",
  };
  persist([...risks, risk], [...treatments], null);
  return risk;
}

export function treatmentsForRisk(riskId: string): Treatment[] {
  return treatments.filter((item) => item.riskId === riskId);
}

export function addRiskTreatment(input: Omit<Treatment, "id" | "recorded">): Treatment {
  if (!input.plan.trim() || !input.assignee.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(input.due)) {
    throw new Error("Enter a plan, an assignee, and a valid due date.");
  }
  const risk = risks.find((item) => item.id === input.riskId);
  if (!risk) throw new Error("Risk not found.");
  const treatment = {
    ...input,
    plan: input.plan.trim(),
    id: `TRT-${crypto.randomUUID()}`,
    recorded: new Date().toISOString(),
  };
  persist(
    risks.map((item) =>
      item.id === risk.id
        ? {
            ...item,
            treatment: input.action,
            due: input.due,
            updated: treatment.recorded.slice(0, 10),
            status: input.action === "Mitigate" ? "Mitigating" : item.status,
          }
        : item,
    ),
    [...treatments, treatment],
    savedDraft,
  );
  return treatment;
}
