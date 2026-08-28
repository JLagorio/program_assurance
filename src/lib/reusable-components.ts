import type { Tone } from "@/components/app/ui";

/* Reusable system components — the "1" in the 1+n architecture.
   Programs (the "n") inherit controls from these definitions. */

export type ComponentHealth = "Current" | "Evidence stale" | "Reassessment due";

export const componentHealthTone: Record<ComponentHealth, Tone> = {
  Current: "success",
  "Evidence stale": "warning",
  "Reassessment due": "danger",
};

export type ProvidedControl = {
  id: string;
  title: string;
  family: string;
  /** Inheritance model per NIST: fully inherited or shared responsibility. */
  model: "Inherited" | "Shared" | "Customer configured";
  evidence: string;
  evidenceAge: number;
  status: "Satisfied" | "Other than satisfied" | "Not assessed";
};

export type Consumer = {
  programId: string;
  programName: string;
  system: string;
  controls: number;
  /** Whether the current viewer can open the consuming program. */
  accessible: boolean;
  lastSync: string;
};

export type SystemComponent = {
  id: string;
  key: string;
  name: string;
  type: "Service" | "Platform" | "Policy" | "Facility";
  owner: string;
  provider: string;
  version: string;
  authorization: string;
  health: ComponentHealth;
  updated: string;
  summary: string;
  controls: ProvidedControl[];
  consumers: Consumer[];
  /** Set when the viewer's enclave grants do not include the source program. */
  sourceProgramId: string | null;
  sourceAccessible: boolean;
};

export const systemComponents: SystemComponent[] = [
  {
    id: "CMP-014",
    key: "idp-core",
    name: "Corporate identity provider",
    type: "Service",
    owner: "Dana Whitlock",
    provider: "Internal — Identity Engineering",
    version: "v4.2",
    authorization: "ATO through Nov 03, 2028",
    health: "Evidence stale",
    updated: "Aug 22, 09:05",
    summary:
      "Workforce SSO, MFA and privileged access brokering. Provides the IA family and most of AC account management to every consuming system.",
    sourceProgramId: "PRG-1013",
    sourceAccessible: true,
    controls: [
      { id: "AC-2", title: "Account management", family: "AC", model: "Shared", evidence: "IAM account review export", evidenceAge: 2, status: "Satisfied" },
      { id: "IA-2", title: "Identification and authentication (users)", family: "IA", model: "Inherited", evidence: "SSO enforcement report", evidenceAge: 41, status: "Satisfied" },
      { id: "IA-5(1)", title: "Password-based authentication", family: "IA", model: "Inherited", evidence: "Password policy attestation", evidenceAge: 41, status: "Satisfied" },
      { id: "IA-8", title: "Non-organizational user authentication", family: "IA", model: "Inherited", evidence: "Federation config snapshot", evidenceAge: 41, status: "Satisfied" },
      { id: "AC-7", title: "Unsuccessful logon attempts", family: "AC", model: "Inherited", evidence: "Lockout policy screenshot", evidenceAge: 96, status: "Other than satisfied" },
    ],
    consumers: [
      { programId: "PRG-1041", programName: "Atlas payments platform", system: "atlas-prod", controls: 19, accessible: true, lastSync: "Aug 27, 10:12" },
      { programId: "PRG-1028", programName: "Northwind data warehouse", system: "ndw-analytics", controls: 17, accessible: true, lastSync: "Aug 26, 16:40" },
      { programId: "PRG-1007", programName: "Field operations mobile", system: "fom-mobile", controls: 12, accessible: true, lastSync: "Aug 18, 13:27" },
      { programId: "PRG-0994", programName: "Legacy billing gateway", system: "lbg-edge", controls: 14, accessible: true, lastSync: "Aug 11, 11:55" },
      { programId: "PRG-0961", programName: "Restricted program", system: "—", controls: 19, accessible: false, lastSync: "—" },
      { programId: "PRG-0940", programName: "Restricted program", system: "—", controls: 11, accessible: false, lastSync: "—" },
    ],
  },
  {
    id: "CMP-021",
    key: "govcloud-landing-zone",
    name: "GovCloud landing zone",
    type: "Platform",
    owner: "Marcus Ryde",
    provider: "Internal — Cloud Platform",
    version: "v9.6",
    authorization: "ATO through Apr 30, 2029",
    health: "Current",
    updated: "Aug 25, 14:02",
    summary:
      "Hardened AWS GovCloud accounts, network boundary, logging pipeline and baseline configuration for hosted major applications.",
    sourceProgramId: "PRG-0961",
    sourceAccessible: false,
    controls: [
      { id: "SC-7", title: "Boundary protection", family: "SC", model: "Shared", evidence: "Network boundary diagram + firewall export", evidenceAge: 6, status: "Satisfied" },
      { id: "AU-9", title: "Protection of audit information", family: "AU", model: "Inherited", evidence: "Log sink IAM policy", evidenceAge: 6, status: "Satisfied" },
      { id: "CM-6", title: "Configuration settings", family: "CM", model: "Customer configured", evidence: "Config baseline scan", evidenceAge: 9, status: "Satisfied" },
      { id: "CP-9", title: "System backup", family: "CP", model: "Inherited", evidence: "Backup job results", evidenceAge: 4, status: "Satisfied" },
    ],
    consumers: [
      { programId: "PRG-1041", programName: "Atlas payments platform", system: "atlas-prod", controls: 46, accessible: true, lastSync: "Aug 27, 10:12" },
      { programId: "PRG-1028", programName: "Northwind data warehouse", system: "ndw-analytics", controls: 41, accessible: true, lastSync: "Aug 26, 16:40" },
      { programId: "PRG-0961", programName: "Restricted program", system: "—", controls: 46, accessible: false, lastSync: "—" },
    ],
  },
  {
    id: "CMP-008",
    key: "enterprise-secpol",
    name: "Enterprise security policy set",
    type: "Policy",
    owner: "Sarah Chen",
    provider: "Internal — Compliance",
    version: "2026.1",
    authorization: "Approved Jan 12, 2026",
    health: "Reassessment due",
    updated: "Jan 12, 2026",
    summary:
      "Organization-defined policies and procedures satisfying the -1 control of every family. Annual review lapsed 47 days ago.",
    sourceProgramId: null,
    sourceAccessible: false,
    controls: [
      { id: "AC-1", title: "Policy and procedures", family: "AC", model: "Inherited", evidence: "Access control policy 2026.1", evidenceAge: 227, status: "Other than satisfied" },
      { id: "AU-1", title: "Policy and procedures", family: "AU", model: "Inherited", evidence: "Audit policy 2026.1", evidenceAge: 227, status: "Other than satisfied" },
      { id: "IR-1", title: "Policy and procedures", family: "IR", model: "Inherited", evidence: "IR policy 2026.1", evidenceAge: 227, status: "Satisfied" },
    ],
    consumers: [
      { programId: "PRG-1041", programName: "Atlas payments platform", system: "atlas-prod", controls: 20, accessible: true, lastSync: "Aug 27, 10:12" },
      { programId: "PRG-1028", programName: "Northwind data warehouse", system: "ndw-analytics", controls: 20, accessible: true, lastSync: "Aug 26, 16:40" },
      { programId: "PRG-1013", programName: "Corporate identity provider", system: "idp-core", controls: 20, accessible: true, lastSync: "Aug 22, 09:05" },
      { programId: "PRG-1007", programName: "Field operations mobile", system: "fom-mobile", controls: 20, accessible: true, lastSync: "Aug 18, 13:27" },
      { programId: "PRG-0994", programName: "Legacy billing gateway", system: "lbg-edge", controls: 20, accessible: true, lastSync: "Aug 11, 11:55" },
    ],
  },
  {
    id: "CMP-032",
    key: "sierra-vista-facility",
    name: "Sierra Vista data center",
    type: "Facility",
    owner: "Dana Whitlock",
    provider: "Vantage Colocation",
    version: "—",
    authorization: "FedRAMP High P-ATO",
    health: "Current",
    updated: "Aug 04, 2026",
    summary:
      "Physical hosting for on-premise workloads. Provides the full PE family under a shared-responsibility matrix.",
    sourceProgramId: null,
    sourceAccessible: false,
    controls: [
      { id: "PE-2", title: "Physical access authorizations", family: "PE", model: "Inherited", evidence: "Colo badge roster", evidenceAge: 24, status: "Satisfied" },
      { id: "PE-3", title: "Physical access control", family: "PE", model: "Inherited", evidence: "Vantage SOC 2 Type II §PE", evidenceAge: 24, status: "Satisfied" },
      { id: "PE-13", title: "Fire protection", family: "PE", model: "Inherited", evidence: "Suppression inspection report", evidenceAge: 24, status: "Satisfied" },
    ],
    consumers: [
      { programId: "PRG-0994", programName: "Legacy billing gateway", system: "lbg-edge", controls: 13, accessible: true, lastSync: "Aug 11, 11:55" },
    ],
  },
];

export function componentByKey(key: string) {
  return systemComponents.find((c) => c.key === key || c.id === key);
}

/** Inheritance edges for a consuming program, keyed by control id. */
export function inheritanceForProgram(programId: string) {
  const map = new Map<string, { component: SystemComponent; control: ProvidedControl }>();
  for (const component of systemComponents) {
    if (!component.consumers.some((c) => c.programId === programId)) continue;
    for (const control of component.controls) {
      if (!map.has(control.id)) map.set(control.id, { component, control });
    }
  }
  return map;
}

export const staleThresholdDays = 30;
