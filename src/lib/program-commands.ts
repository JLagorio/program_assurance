/**
 * Pure command list for a program record. No React, no side effects of its
 * own — the caller supplies the handlers and the palette renders the result.
 */

import type { Command } from "@/components/app/command-palette";
import type { Program } from "@/lib/grc-data";
import { stages, type Stage } from "@/lib/program-stage";
import { poamItems } from "@/lib/register";
import { workstreamsForProgram } from "@/lib/people";

export type ProgramCommandHandlers = {
  goTab: (tab: string) => void;
  setStage: (stage: Stage) => void;
  recordAssessment: () => void;
  generateCdr: () => void;
  openRecord: (to: string, params: Record<string, string>) => void;
};

export const programTabs = [
  "Overview",
  "Controls",
  "Findings",
  "Evidence",
  "POA&M",
  "Team",
  "Activity",
] as const;

export function programCommands(program: Program, h: ProgramCommandHandlers): Command[] {
  const out: Command[] = [];

  out.push(
    {
      id: "act-dashboard",
      group: "Actions",
      label: "Open the program dashboard",
      hint: "D",
      run: () => h.openRecord("/programs/$programId/dashboard", { programId: program.id }),
    },
    {
      id: "act-assess",
      group: "Actions",
      label: "Record a control assessment",
      hint: "A",
      run: h.recordAssessment,
    },
    {
      id: "act-cdr",
      group: "Actions",
      label: "Generate CDR package",
      hint: "C",
      run: h.generateCdr,
    },
  );

  for (const s of stages) {
    out.push({
      id: `stage-${s}`,
      group: "Set stage",
      label: `Move to ${s}`,
      run: () => h.setStage(s),
    });
  }

  programTabs.forEach((t, i) => {
    out.push({
      id: `tab-${t}`,
      group: "Go to",
      label: t,
      hint: `g ${i + 1}`,
      run: () => h.goTab(t),
    });
  });

  for (const p of poamItems.filter((x) => x.program === program.id).slice(0, 8)) {
    out.push({
      id: `poam-${p.id}`,
      group: "POA&M",
      label: `${p.id} · ${p.title}`,
      run: () => h.openRecord("/register/poam/$poamId", { poamId: p.id }),
    });
  }

  for (const w of workstreamsForProgram(program.id).slice(0, 8)) {
    out.push({
      id: `ws-${w.id}`,
      group: "Workstreams",
      label: `${w.id} · ${w.title}`,
      run: () => h.openRecord("/workstreams/$workstreamId", { workstreamId: w.id }),
    });
  }

  return out;
}
