/**
 * Control catalog — 800-53 Rev 5 controls, CNSSI 1253 overlays, and the CCI
 * decomposition that joins the requirements side of the product to the
 * verification side. Rules declare the CCIs they satisfy; assessment
 * procedures and test objectives cover the same CCIs.
 */

import type { CciCompliance } from "@/lib/spine";

export type ControlFamilyId =
  | "AC"
  | "AU"
  | "CM"
  | "IA"
  | "RA"
  | "SC"
  | "SI"
  | "SR";

export const families: { id: ControlFamilyId; name: string }[] = [
  { id: "AC", name: "Access control" },
  { id: "AU", name: "Audit and accountability" },
  { id: "CM", name: "Configuration management" },
  { id: "IA", name: "Identification and authentication" },
  { id: "RA", name: "Risk assessment" },
  { id: "SC", name: "System and communications protection" },
  { id: "SI", name: "System and information integrity" },
  { id: "SR", name: "Supply chain risk management" },
];

export type Cci = {
  id: string;
  control: string;
  /** The atomic testable statement, verbatim from the DISA list. */
  definition: string;
  /** Who the statement is addressed to. */
  type: "Technical" | "Policy" | "Procedural";
  compliance: CciCompliance;
  /** Rules (V-IDs) declaring they satisfy this CCI. */
  rules: string[];
  /** 800-53A assessment procedures covering it. */
  procedures: string[];
  /** Test objectives exercising it. */
  objectives: string[];
};

export type Control = {
  id: string;
  family: ControlFamilyId;
  title: string;
  baseline: ("Low" | "Moderate" | "High")[];
  /** Overlay ids that add this control beyond the high-water baseline. */
  addedBy: string[];
  cciCount: number;
};

export type Overlay = {
  id: string;
  name: string;
  authority: string;
  applicability: string;
  adds: number;
  removes: number;
  parameters: number;
};

export type Benchmark = {
  id: string;
  name: string;
  technology: string;
  version: string;
  released: string;
  rules: number;
  /** Version currently applied across the estate, if it lags. */
  appliedVersion: string;
  catI: number;
  catII: number;
  catIII: number;
};

export type Rule = {
  id: string;
  benchmark: string;
  title: string;
  severity: "CAT I" | "CAT II" | "CAT III";
  ccis: string[];
};

export const controls: Control[] = [
  { id: "AC-2", family: "AC", title: "Account management", baseline: ["Low", "Moderate", "High"], addedBy: [], cciCount: 27 },
  { id: "AC-2(3)", family: "AC", title: "Account management | disable accounts", baseline: ["Moderate", "High"], addedBy: [], cciCount: 3 },
  { id: "AC-6(9)", family: "AC", title: "Least privilege | log use of privileged functions", baseline: ["Moderate", "High"], addedBy: [], cciCount: 2 },
  { id: "AC-17(2)", family: "AC", title: "Remote access | protection of confidentiality", baseline: ["Moderate", "High"], addedBy: ["OVL-TAC"], cciCount: 2 },
  { id: "AU-3", family: "AU", title: "Content of audit records", baseline: ["Low", "Moderate", "High"], addedBy: [], cciCount: 8 },
  { id: "AU-9", family: "AU", title: "Protection of audit information", baseline: ["Low", "Moderate", "High"], addedBy: [], cciCount: 5 },
  { id: "CM-6", family: "CM", title: "Configuration settings", baseline: ["Low", "Moderate", "High"], addedBy: [], cciCount: 9 },
  { id: "CM-7(5)", family: "CM", title: "Least functionality | authorized software", baseline: ["High"], addedBy: ["OVL-CLS"], cciCount: 4 },
  { id: "IA-2", family: "IA", title: "Identification and authentication (organizational users)", baseline: ["Low", "Moderate", "High"], addedBy: [], cciCount: 12 },
  { id: "IA-5(1)", family: "IA", title: "Authenticator management | password-based authentication", baseline: ["Low", "Moderate", "High"], addedBy: [], cciCount: 11 },
  { id: "RA-5", family: "RA", title: "Vulnerability monitoring and scanning", baseline: ["Low", "Moderate", "High"], addedBy: [], cciCount: 10 },
  { id: "SC-8(1)", family: "SC", title: "Transmission confidentiality | cryptographic protection", baseline: ["Moderate", "High"], addedBy: ["OVL-SPC"], cciCount: 3 },
  { id: "SC-28", family: "SC", title: "Protection of information at rest", baseline: ["Moderate", "High"], addedBy: [], cciCount: 4 },
  { id: "SI-2", family: "SI", title: "Flaw remediation", baseline: ["Low", "Moderate", "High"], addedBy: [], cciCount: 7 },
  { id: "SI-4", family: "SI", title: "System monitoring", baseline: ["Low", "Moderate", "High"], addedBy: [], cciCount: 23 },
  { id: "SR-11", family: "SR", title: "Component authenticity", baseline: ["Moderate", "High"], addedBy: ["OVL-SAF"], cciCount: 5 },
];

export const overlays: Overlay[] = [
  { id: "OVL-CLS", name: "Classified information", authority: "CNSSI 1253 App. F Att. 5", applicability: "Systems processing collateral SECRET and above", adds: 41, removes: 0, parameters: 18 },
  { id: "OVL-TAC", name: "Tactical / DDIL", authority: "CNSSI 1253 App. K", applicability: "Disconnected, intermittent, limited-bandwidth edge systems", adds: 12, removes: 9, parameters: 22 },
  { id: "OVL-SPC", name: "Space platform", authority: "CNSSI 1253 App. F Att. 2", applicability: "On-orbit segments and ground control", adds: 17, removes: 4, parameters: 11 },
  { id: "OVL-SAF", name: "Safety-critical", authority: "Service overlay", applicability: "Systems with a loss-of-life failure mode", adds: 23, removes: 0, parameters: 14 },
  { id: "OVL-IL5", name: "DoD IL5 cloud", authority: "DoD CC SRG", applicability: "Mission-owner workloads on an IL5 CSO", adds: 8, removes: 2, parameters: 9 },
];

export const ccis: Cci[] = [
  {
    id: "CCI-000015",
    control: "AC-2",
    definition:
      "The organization employs automated mechanisms to support the management of information system accounts.",
    type: "Technical",
    compliance: "Compliant",
    rules: ["V-222387", "V-230234"],
    procedures: ["AC-2(a).1"],
    objectives: ["TO-04 Credential lifecycle"],
  },
  {
    id: "CCI-000018",
    control: "AC-2",
    definition:
      "The information system automatically audits account creation actions.",
    type: "Technical",
    compliance: "Non-compliant",
    rules: ["V-230234"],
    procedures: ["AC-2(f).2"],
    objectives: ["TO-04 Credential lifecycle"],
  },
  {
    id: "CCI-001361",
    control: "AC-2(3)",
    definition:
      "The information system automatically disables inactive accounts after an organization-defined time period.",
    type: "Technical",
    compliance: "Compliant",
    rules: ["V-230235"],
    procedures: ["AC-2(3).1"],
    objectives: [],
  },
  {
    id: "CCI-000172",
    control: "AC-6(9)",
    definition: "The information system audits the execution of privileged functions.",
    type: "Technical",
    compliance: "Non-compliant",
    rules: ["V-230386", "V-222412"],
    procedures: ["AC-6(9).1"],
    objectives: ["TO-07 Privilege abuse"],
  },
  {
    id: "CCI-000068",
    control: "AC-17(2)",
    definition:
      "The information system implements cryptographic mechanisms to protect the confidentiality of remote access sessions.",
    type: "Technical",
    compliance: "Compliant",
    rules: ["V-222397"],
    procedures: ["AC-17(2).1"],
    objectives: ["TO-02 Remote access interception"],
  },
  {
    id: "CCI-000130",
    control: "AU-3",
    definition:
      "The information system generates audit records containing information that establishes what type of event occurred.",
    type: "Technical",
    compliance: "Compliant",
    rules: ["V-230396"],
    procedures: ["AU-3.1"],
    objectives: [],
  },
  {
    id: "CCI-000162",
    control: "AU-9",
    definition: "The information system protects audit information from unauthorized access.",
    type: "Technical",
    compliance: "Not assessed",
    rules: ["V-230401", "V-222440"],
    procedures: ["AU-9.1"],
    objectives: ["TO-09 Audit tamper"],
  },
  {
    id: "CCI-000366",
    control: "CM-6",
    definition:
      "The organization implements the security configuration settings in accordance with organization-defined criteria.",
    type: "Technical",
    compliance: "Non-compliant",
    rules: ["V-230221", "V-230222", "V-222501"],
    procedures: ["CM-6(b).1"],
    objectives: ["TO-01 Baseline drift"],
  },
  {
    id: "CCI-001774",
    control: "CM-7(5)",
    definition:
      "The information system employs a deny-all, permit-by-exception policy to allow the execution of authorized software.",
    type: "Technical",
    compliance: "Not assessed",
    rules: ["V-230522"],
    procedures: ["CM-7(5)(b).1"],
    objectives: ["TO-11 Arbitrary execution"],
  },
  {
    id: "CCI-000765",
    control: "IA-2",
    definition:
      "The information system implements multifactor authentication for network access to privileged accounts.",
    type: "Technical",
    compliance: "Compliant",
    rules: ["V-222390"],
    procedures: ["IA-2(1).1"],
    objectives: ["TO-04 Credential lifecycle"],
  },
  {
    id: "CCI-000192",
    control: "IA-5(1)",
    definition:
      "The information system enforces minimum password complexity of organization-defined requirements for case sensitivity.",
    type: "Technical",
    compliance: "Compliant",
    rules: ["V-230357"],
    procedures: ["IA-5(1)(a).1"],
    objectives: [],
  },
  {
    id: "CCI-001067",
    control: "RA-5",
    definition:
      "The organization analyzes vulnerability scan reports and results from security control assessments.",
    type: "Procedural",
    compliance: "Compliant",
    rules: [],
    procedures: ["RA-5(c).1"],
    objectives: ["TO-03 Scan coverage"],
  },
  {
    id: "CCI-002418",
    control: "SC-8(1)",
    definition:
      "The information system protects the confidentiality of transmitted information using cryptographic mechanisms.",
    type: "Technical",
    compliance: "Non-compliant",
    rules: ["V-222577", "V-230529"],
    procedures: ["SC-8(1).1"],
    objectives: ["TO-02 Remote access interception"],
  },
  {
    id: "CCI-001199",
    control: "SC-28",
    definition:
      "The information system protects the confidentiality and integrity of organization-defined information at rest.",
    type: "Technical",
    compliance: "Not assessed",
    rules: ["V-230550"],
    procedures: ["SC-28.1"],
    objectives: [],
  },
  {
    id: "CCI-002605",
    control: "SI-2",
    definition: "The organization installs security-relevant software updates.",
    type: "Technical",
    compliance: "Non-compliant",
    rules: ["V-230262"],
    procedures: ["SI-2(c).1"],
    objectives: ["TO-05 Patch latency"],
  },
  {
    id: "CCI-002656",
    control: "SI-4",
    definition:
      "The information system monitors inbound and outbound communications traffic for unusual or unauthorized activities.",
    type: "Technical",
    compliance: "Not assessed",
    rules: ["V-222604"],
    procedures: ["SI-4(4).1"],
    objectives: ["TO-08 Lateral movement"],
  },
  {
    id: "CCI-003479",
    control: "SR-11",
    definition:
      "The organization employs anti-counterfeit policy and procedures for organization-defined components.",
    type: "Policy",
    compliance: "Not applicable",
    rules: [],
    procedures: ["SR-11(a).1"],
    objectives: [],
  },
];

export const benchmarks: Benchmark[] = [
  { id: "BM-RHEL9", name: "Red Hat Enterprise Linux 9 STIG", technology: "RHEL 9", version: "V2R3", released: "Jul 2026", rules: 386, appliedVersion: "V2R1", catI: 11, catII: 302, catIII: 73 },
  { id: "BM-K8S", name: "Kubernetes STIG", technology: "Kubernetes 1.30", version: "V2R2", released: "Jun 2026", rules: 97, appliedVersion: "V2R2", catI: 9, catII: 71, catIII: 17 },
  { id: "BM-ASD", name: "Application Security & Development SRG", technology: "Application", version: "V6R2", released: "Apr 2026", rules: 286, appliedVersion: "V6R1", catI: 18, catII: 214, catIII: 54 },
  { id: "BM-WIN2022", name: "Windows Server 2022 STIG", technology: "Windows Server 2022", version: "V2R4", released: "Aug 2026", rules: 272, appliedVersion: "V1R9", catI: 14, catII: 209, catIII: 49 },
  { id: "BM-CISCO", name: "Cisco IOS XE Router NDM STIG", technology: "Cisco IOS XE", version: "V3R2", released: "Mar 2026", rules: 118, appliedVersion: "V3R2", catI: 6, catII: 92, catIII: 20 },
  { id: "BM-NGINX", name: "Web Server SRG", technology: "NGINX 1.26", version: "V3R1", released: "Feb 2026", rules: 92, appliedVersion: "V3R1", catI: 4, catII: 70, catIII: 18 },
];

export const rules: Rule[] = [
  { id: "V-222387", benchmark: "BM-ASD", title: "The application must provide automated mechanisms for account management.", severity: "CAT II", ccis: ["CCI-000015"] },
  { id: "V-230234", benchmark: "BM-RHEL9", title: "RHEL 9 must audit all account creations.", severity: "CAT II", ccis: ["CCI-000015", "CCI-000018"] },
  { id: "V-230235", benchmark: "BM-RHEL9", title: "RHEL 9 must disable account identifiers after 35 days of inactivity.", severity: "CAT III", ccis: ["CCI-001361"] },
  { id: "V-230386", benchmark: "BM-RHEL9", title: "RHEL 9 must audit all uses of the execve system call.", severity: "CAT II", ccis: ["CCI-000172"] },
  { id: "V-222412", benchmark: "BM-ASD", title: "The application must audit the execution of privileged functions.", severity: "CAT II", ccis: ["CCI-000172"] },
  { id: "V-222397", benchmark: "BM-ASD", title: "The application must use FIPS-validated cryptography for remote sessions.", severity: "CAT I", ccis: ["CCI-000068"] },
  { id: "V-230396", benchmark: "BM-RHEL9", title: "RHEL 9 audit records must contain the event type.", severity: "CAT III", ccis: ["CCI-000130"] },
  { id: "V-230401", benchmark: "BM-RHEL9", title: "RHEL 9 audit logs must be owned by root.", severity: "CAT II", ccis: ["CCI-000162"] },
  { id: "V-222440", benchmark: "BM-ASD", title: "The application must protect audit information from unauthorized read access.", severity: "CAT II", ccis: ["CCI-000162"] },
  { id: "V-230221", benchmark: "BM-RHEL9", title: "RHEL 9 must be a vendor-supported release.", severity: "CAT I", ccis: ["CCI-000366"] },
  { id: "V-230222", benchmark: "BM-RHEL9", title: "RHEL 9 must enable FIPS mode.", severity: "CAT I", ccis: ["CCI-000366"] },
  { id: "V-222501", benchmark: "BM-K8S", title: "Kubernetes must disable anonymous authentication to the API server.", severity: "CAT I", ccis: ["CCI-000366"] },
  { id: "V-230522", benchmark: "BM-RHEL9", title: "RHEL 9 must employ a deny-all, permit-by-exception execution policy.", severity: "CAT II", ccis: ["CCI-001774"] },
  { id: "V-222390", benchmark: "BM-ASD", title: "The application must use multifactor authentication for privileged accounts.", severity: "CAT I", ccis: ["CCI-000765"] },
  { id: "V-230357", benchmark: "BM-RHEL9", title: "RHEL 9 passwords must enforce character class requirements.", severity: "CAT II", ccis: ["CCI-000192"] },
  { id: "V-222577", benchmark: "BM-ASD", title: "The application must implement TLS 1.2 or greater for all transmitted data.", severity: "CAT I", ccis: ["CCI-002418"] },
  { id: "V-230529", benchmark: "BM-NGINX", title: "The web server must disable TLS renegotiation and legacy ciphers.", severity: "CAT II", ccis: ["CCI-002418"] },
  { id: "V-230550", benchmark: "BM-RHEL9", title: "RHEL 9 must encrypt all persistent volumes at rest.", severity: "CAT II", ccis: ["CCI-001199"] },
  { id: "V-230262", benchmark: "BM-RHEL9", title: "RHEL 9 must install security-relevant updates within the defined period.", severity: "CAT II", ccis: ["CCI-002605"] },
  { id: "V-222604", benchmark: "BM-K8S", title: "Kubernetes must monitor and audit inbound and outbound API traffic.", severity: "CAT II", ccis: ["CCI-002656"] },
];

/** The three verification paths for a CCI, per the spine. */
export function verificationPaths(cci: Cci) {
  return {
    rules: cci.rules.length,
    procedures: cci.procedures.length,
    objectives: cci.objectives.length,
    covered: cci.rules.length + cci.procedures.length + cci.objectives.length > 0,
  };
}

export const rulesByCci = new Map<string, Rule[]>();
for (const rule of rules) {
  for (const cci of rule.ccis) {
    rulesByCci.set(cci, [...(rulesByCci.get(cci) ?? []), rule]);
  }
}

export const ccisByControl = new Map<string, Cci[]>();
for (const cci of ccis) {
  ccisByControl.set(cci.control, [...(ccisByControl.get(cci.control) ?? []), cci]);
}

export const benchmarkById = new Map(benchmarks.map((b) => [b.id, b]));
