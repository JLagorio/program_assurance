import type { ChartDatum, ChartSeries, Tone } from "../../components";

/* The fixtures the nine Chart pages share: one program's coverage, findings, risks and systems, so a
   reader who moves from the Bar page to the Line page sees the same numbers drawn another way. */

export const byFamily = [
  { family: "AC", satisfied: 34, partial: 5, other: 7, notAssessed: 2, target: 44 },
  { family: "AU", satisfied: 18, partial: 4, other: 3, notAssessed: 1, target: 24 },
  { family: "CM", satisfied: 23, partial: 4, other: 5, notAssessed: 0, target: 30 },
  { family: "IA", satisfied: 22, partial: 1, other: 3, notAssessed: 2, target: 26 },
  { family: "SC", satisfied: 40, partial: 6, other: 4, notAssessed: 3, target: 50 },
  { family: "SI", satisfied: 29, partial: 3, other: 2, notAssessed: 1, target: 34 },
];
export const familyNames: Record<string, string> = {
  AC: "Access control",
  AU: "Audit and accountability",
  CM: "Configuration management",
  IA: "Identification and authentication",
  SC: "System and communications protection",
  SI: "System and information integrity",
};
export const statusSeries: ChartSeries[] = [
  { key: "satisfied", label: "Satisfied", tone: "success" },
  { key: "partial", label: "Partial", tone: "warning" },
  { key: "other", label: "Other than satisfied", tone: "danger" },
  { key: "notAssessed", label: "Not assessed", tone: "neutral" },
];

export const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep"];
export const byMonth = months.map((month, i) => ({
  month,
  open: [14, 17, 15, 19, 12, 11, 9, 8, 5][i],
  closed: [3, 5, 8, 6, 11, 9, 7, 6, 4][i],
  plan: [14, 13, 12, 11, 10, 9, 8, 7, 6][i],
  assessed: [120, 150, 190, 210, 240, 280, 310, 330, 350][i],
}));
/** The same months with two counts missing: the register was down in April and July. */
export const byMonthGaps: ChartDatum[] = byMonth.map((d) =>
  d.month === "Apr" || d.month === "Jul" ? { ...d, open: null, closed: null } : d,
);
export const findingSeries: ChartSeries[] = [
  { key: "open", label: "Open", tone: "danger" },
  { key: "closed", label: "Closed", tone: "neutral" },
];

export const bySource = [
  { source: "STIG checklist", n: 41 },
  { source: "ACAS scan", n: 27 },
  { source: "Code scan", n: 19 },
  { source: "Manual procedure", n: 12 },
  { source: "Test event", n: 6 },
];
export const sourceSeries: ChartSeries[] = [{ key: "n", label: "Findings", tone: "brand" }];

export const byAssessor = [
  { week: "W31", whitfield: 12, okafor: 9, ryde: 7, hoppel: 4, lind: 3 },
  { week: "W32", whitfield: 14, okafor: 8, ryde: 9, hoppel: 6, lind: 2 },
  { week: "W33", whitfield: 11, okafor: 12, ryde: 8, hoppel: 5, lind: 4 },
  { week: "W34", whitfield: 15, okafor: 10, ryde: 6, hoppel: 7, lind: 3 },
  { week: "W35", whitfield: 13, okafor: 11, ryde: 10, hoppel: 5, lind: 5 },
];
export const assessors: ChartSeries[] = [
  { key: "whitfield", label: "D. Whitfield" },
  { key: "okafor", label: "A. Okafor" },
  { key: "ryde", label: "M. Ryde" },
  { key: "hoppel", label: "G. Hoppel" },
  { key: "lind", label: "S. Lind" },
];
/** One assessor is the point: brand for D. Whitfield, neutral for the team. */
export const assessorsEmphasised: ChartSeries[] = assessors.map((a, i) => ({
  ...a,
  tone: i === 0 ? "brand" : "neutral",
}));

export const windows: ChartDatum[] = [
  { phase: "Categorize", weeks: [0, 3] },
  { phase: "Select", weeks: [2, 6] },
  { phase: "Implement", weeks: [5, 14] },
  { phase: "Assess", weeks: [12, 20] },
  { phase: "Authorize", weeks: [19, 23] },
  { phase: "Monitor", weeks: [23, 36] },
];

export const risks = [
  { id: "RSK-014", title: "Unpatched hypervisor", likelihood: 4, impact: 5, exposure: 420, status: "open", owner: "D. Whitfield" },
  { id: "RSK-021", title: "Shared service account", likelihood: 5, impact: 3, exposure: 260, status: "open", owner: "A. Okafor" },
  { id: "RSK-007", title: "Backup restore untested", likelihood: 3, impact: 4, exposure: 180, status: "treating", owner: "M. Ryde" },
  { id: "RSK-030", title: "Vendor SBOM missing", likelihood: 2, impact: 4, exposure: 120, status: "treating", owner: "G. Hoppel" },
  { id: "RSK-011", title: "Log retention 30 days", likelihood: 3, impact: 2, exposure: 90, status: "treating", owner: "S. Lind" },
  { id: "RSK-002", title: "Stale firewall rules", likelihood: 2, impact: 2, exposure: 40, status: "accepted", owner: "A. Okafor" },
  { id: "RSK-019", title: "Legacy TLS on printer", likelihood: 1, impact: 2, exposure: 20, status: "accepted", owner: "S. Lind" },
  { id: "RSK-025", title: "Single admin for PKI", likelihood: 2, impact: 5, exposure: 210, status: "open", owner: "D. Whitfield" },
];
export const riskGroups = [
  { key: "open", label: "Open", tone: "danger" as const },
  { key: "treating", label: "In treatment", tone: "warning" as const },
  { key: "accepted", label: "Accepted", tone: "neutral" as const },
];

export const bySystem = [
  {
    name: "Payments",
    children: [
      { name: "Ledger API", value: 18 },
      { name: "Card vault", value: 11 },
      { name: "Settlement", value: 7 },
    ],
  },
  {
    name: "Identity",
    children: [
      { name: "SSO", value: 14 },
      { name: "PKI", value: 9 },
    ],
  },
  { name: "Reporting", children: [{ name: "Warehouse", value: 12 }, { name: "Dashboards", value: 4 }] },
  { name: "Network", children: [{ name: "Edge", value: 6 }, { name: "Core", value: 3 }] },
];
/** The systems as bars: the top level of a drill-down. */
export const systemTotals = bySystem.map((s) => ({
  name: s.name,
  findings: s.children.reduce((n, c) => n + c.value, 0),
}));
/** A system's components as bars: the level under it. */
export const componentsOf = (system: string) =>
  (bySystem.find((s) => s.name === system)?.children ?? []).map((c) => ({
    name: c.name,
    findings: c.value,
  }));
export const componentFacts: Record<string, { owner: string; open: number; assessed: string }> = {
  "Ledger API": { owner: "A. Okafor", open: 6, assessed: "12 Aug 2026" },
  "Card vault": { owner: "D. Whitfield", open: 4, assessed: "3 Aug 2026" },
  Settlement: { owner: "M. Ryde", open: 2, assessed: "28 Jul 2026" },
  SSO: { owner: "G. Hoppel", open: 5, assessed: "19 Aug 2026" },
  PKI: { owner: "D. Whitfield", open: 3, assessed: "2 Sep 2026" },
  Warehouse: { owner: "S. Lind", open: 4, assessed: "26 Aug 2026" },
  Dashboards: { owner: "S. Lind", open: 1, assessed: "26 Aug 2026" },
  Edge: { owner: "M. Ryde", open: 2, assessed: "9 Aug 2026" },
  Core: { owner: "M. Ryde", open: 1, assessed: "9 Aug 2026" },
};

export const families = ["AC", "AU", "CM", "IA", "SC", "SI"];
export const heatMonths = months.slice(3);
export const findingsByFamilyMonth: Record<string, number[]> = {
  AC: [6, 8, 9, 5, 4, 3],
  AU: [2, 3, 2, 1, 1, 0],
  CM: [5, 5, 7, 6, 3, 2],
  IA: [3, 2, 2, 2, 1, 1],
  SC: [9, 11, 12, 8, 6, 4],
  SI: [4, 4, 5, 3, 2, 2],
};
export const varianceByPhase: Record<string, number[]> = {
  Categorize: [0, 0, 0, 0, 0, 0],
  Select: [-2, -3, 0, 0, 0, 0],
  Implement: [1, 3, 5, 7, 6, 4],
  Assess: [0, 0, 2, 4, 9, 12],
  Authorize: [0, 0, 0, 0, 3, 8],
};
export const phases = Object.keys(varianceByPhase);
export const likelihoods = ["Rare", "Unlikely", "Possible", "Likely", "Certain"];
export const impacts = ["Minor", "Moderate", "Major", "Severe", "Critical"];
export const riskCount = (row: string, col: string) => {
  const l = likelihoods.indexOf(row) + 1;
  const i = impacts.indexOf(col) + 1;
  return risks.filter((r) => r.likelihood === l && r.impact === i).length;
};
export const risksAt = (row: string, col: string) => {
  const l = likelihoods.indexOf(row) + 1;
  const i = impacts.indexOf(col) + 1;
  return risks.filter((r) => r.likelihood === l && r.impact === i);
};
export const riskTone = (_value: number, row: string, col: string): Tone => {
  const score = (likelihoods.indexOf(row) + 1) * (impacts.indexOf(col) + 1);
  return score >= 15 ? "danger" : score >= 8 ? "warning" : score >= 4 ? "information" : "success";
};

/** Weekly open findings over six months, with real dates: the time axis picks its own ticks. */
export const byWeek = Array.from({ length: 26 }, (_, i) => {
  const date = new Date(2026, 2, 2 + i * 7);
  return {
    date,
    open: [22, 24, 23, 26, 25, 21, 19, 20, 18, 17, 19, 16, 14, 15, 13, 12, 12, 11, 9, 10, 8, 8, 7, 6, 6, 5][i],
    closed: [1, 2, 3, 2, 4, 5, 4, 3, 6, 5, 4, 7, 6, 5, 8, 6, 7, 9, 8, 7, 9, 10, 8, 9, 11, 10][i],
  };
});
export const assessmentWindow = { from: new Date(2026, 5, 1), to: new Date(2026, 6, 15) };
export const authorizationDate = new Date(2026, 7, 3);

/** Schedule variance per phase in days: below zero is early, above is late. */
export const varianceRows = [
  { phase: "Categorize", days: -2 },
  { phase: "Select", days: -3 },
  { phase: "Implement", days: 7 },
  { phase: "Assess", days: 12 },
  { phase: "Authorize", days: 4 },
  { phase: "Monitor", days: -1 },
];
export const varianceSeries: ChartSeries[] = [{ key: "days", label: "Days against plan", tone: "brand" }];

/** Monthly rates beside counts: a per-series format. */
export const byMonthRates = byMonth.map((d) => {
  const open = d.open ?? 0;
  const closed = d.closed ?? 0;
  return { ...d, closeRate: Math.round((closed / (open + closed)) * 100) / 100 };
});
export const percent = (v: number) => `${Math.round(v * 100)}%`;
