import type { Tone } from "@/components/app/ui";
import type { Environment } from "@/lib/findings";

/* Reusable system components — the "1" in the 1+n architecture.
   Programs (the "n") inherit controls from these definitions.

   A component publishes an *offer*: a control, the model it is offered under, the
   assessment version the offer is evidenced by, and the inventory the offer is
   scoped to. A program *accepts* an offer at a named version on a named date.
   Those two facts are authored separately on purpose — the gap between them is
   what `@/lib/inheritance` reads as version drift. Nothing in this file decides
   which provider wins a control; `resolveInheritance` does, over the CCP tier
   ladder, and it lives one layer up in `@/lib/inheritance` along with the
   `inheritanceForProgram` projection of it. This module is the lower layer: it
   owns the offers and the types they are authored in, and imports no logic
   back, so the two never form a cycle. */

export type ComponentHealth = "Current" | "Evidence stale" | "Reassessment due";

export const componentHealthTone: Record<ComponentHealth, Tone> = {
  Current: "success",
  "Evidence stale": "warning",
  "Reassessment due": "danger",
};

/**
 * Why a candidate does or does not reach a consumer. Empty array = no constraint.
 *
 * Authored here with the offers it scopes — `ProvidedControl.applicability` is a
 * seed literal in this file — and evaluated one layer up, in `@/lib/inheritance`.
 */
export type ApplicabilityRule = {
  /** NodeKind values the consumer must carry at least one of. */
  nodeKinds: string[];
  /**
   * `Asset.environment` values the consumer must have at least one of.
   *
   * Typed as `Environment` rather than `string` on purpose: this field is
   * intersected against the asset register, and `Program.environment` is a
   * *different* union (the hosting model — "AWS GovCloud", "On-premise", …).
   * A literal from that other union can never match an asset, so it would
   * silently scope the offer out of every consumer forever. The narrow type
   * makes that mistake a compile error.
   */
  environments: Environment[];
  /** TrustZone values the consumer must have at least one node in. */
  zones: string[];
  /** FIPS-199 impact levels the offer is scoped to. */
  impact: string[];
  /** Explicit program allow-list; when non-empty, nothing else applies. */
  programs: string[];
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
  /** The provider's assessment the offer is evidenced by, e.g. "AR-2026.2". */
  assessmentVersion: string;
  /** When the provider last assessed this control. "MMM DD, YYYY". */
  assessedOn: string;
  /** The provider's own SSP implementation sentence for this control. */
  assertion: string;
  /** What a consuming system still owes. "—" for a fully inherited control. */
  consumerObligation: string;
  /** The inventory the offer reaches. Empty arrays mean no constraint. */
  applicability: ApplicabilityRule;
};

export type Consumer = {
  programId: string;
  programName: string;
  system: string;
  controls: number;
  /** Whether the current viewer can open the consuming program. */
  accessible: boolean;
  lastSync: string;
  /** The provider `version` this program accepted. "—" when nothing was accepted. */
  acceptedVersion: string;
  /** The provider `assessmentVersion` in force at acceptance. */
  acceptedAssessmentVersion: string;
  /** When the consuming program signed the acceptance. "MMM DD, YYYY" or "—". */
  acceptedOn: string;
  /** Who signed it on the consumer's side. */
  acceptedBy: string;
};

export type SystemComponent = {
  id: string;
  key: string;
  name: string;
  /**
   * "Manufacturing" is a capability that contributes to control outcomes
   * without publishing inherited controls of its own — `§9.1` of the platform
   * design calls these reusable capabilities, as distinct from common-control
   * providers. `ccpTierFor` in `inheritance.ts` falls through to "Component"
   * for it, which is correct: it offers nothing to inherit.
   */
  type: "Service" | "Platform" | "Policy" | "Facility" | "Manufacturing";
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
      {
        id: "AC-2",
        title: "Account management",
        family: "AC",
        model: "Shared",
        evidence: "IAM account review export",
        evidenceAge: 2,
        status: "Satisfied",
        assessmentVersion: "AR-2026.2",
        assessedOn: "Aug 28, 2026",
        assertion:
          "idp-core is the authoritative account store: workforce accounts are created, modified, disabled and recertified through the IdP lifecycle workflow, driven by joiner/mover/leaver events from the HR system of record, with inactivity disablement at 35 days and a 90-day recertification campaign per group.",
        consumerObligation:
          "Declare the system's own account types, role-to-group mappings and approval chain in the IdP, and complete the quarterly recertification for those groups — the IdP cannot know which roles this system needs or who approves them.",
        applicability: {
          nodeKinds: ["Application", "Service", "Operating system"],
          environments: [],
          zones: [],
          impact: [],
          programs: [],
        },
      },
      {
        id: "IA-2",
        title: "Identification and authentication (users)",
        family: "IA",
        model: "Inherited",
        evidence: "SSO enforcement report",
        evidenceAge: 41,
        status: "Satisfied",
        assessmentVersion: "AR-2026.2",
        assessedOn: "Jul 20, 2026",
        assertion:
          "All interactive and privileged user authentication to consuming systems is brokered by idp-core over OIDC with phishing-resistant MFA (PIV or FIDO2) enforced in the authentication policy; no consuming system holds a local interactive credential store.",
        consumerObligation: "—",
        applicability: {
          nodeKinds: ["Application", "Service", "Operating system"],
          environments: [],
          zones: [],
          impact: [],
          programs: [],
        },
      },
      {
        id: "IA-5(1)",
        title: "Password-based authentication",
        family: "IA",
        model: "Inherited",
        evidence: "Password policy attestation",
        evidenceAge: 41,
        status: "Satisfied",
        assessmentVersion: "AR-2026.2",
        assessedOn: "Jul 20, 2026",
        assertion:
          "Password-based authenticators are issued and stored only by idp-core under a 14-character minimum, screening against a breached-credential corpus at set time, no forced periodic rotation, and salted Argon2id storage in the IdP credential vault.",
        consumerObligation: "—",
        applicability: {
          nodeKinds: ["Application", "Service", "Operating system"],
          environments: [],
          zones: [],
          impact: [],
          programs: [],
        },
      },
      {
        id: "IA-8",
        title: "Non-organizational user authentication",
        family: "IA",
        model: "Inherited",
        evidence: "Federation config snapshot",
        evidenceAge: 41,
        status: "Satisfied",
        assessmentVersion: "AR-2026.2",
        assessedOn: "Jul 20, 2026",
        assertion:
          "Non-organizational users authenticate through federated brokering in idp-core to the accepted external providers only (Login.gov at IAL2/AAL2 and the partner SAML federation), and the achieved assurance level is asserted to the consuming system as a token claim.",
        consumerObligation: "—",
        applicability: {
          nodeKinds: ["Application", "Service", "Operating system"],
          environments: [],
          zones: [],
          impact: [],
          programs: [],
        },
      },
      {
        id: "AC-7",
        title: "Unsuccessful logon attempts",
        family: "AC",
        model: "Inherited",
        evidence: "Lockout policy screenshot",
        evidenceAge: 96,
        status: "Other than satisfied",
        assessmentVersion: "AR-2026.2",
        assessedOn: "May 26, 2026",
        assertion:
          "idp-core locks an account after five consecutive failed authentication attempts inside a 15-minute window and holds the lock for 30 minutes, raising a security event to the SOC on each lock.",
        consumerObligation: "—",
        applicability: {
          nodeKinds: ["Application", "Service", "Operating system"],
          environments: [],
          zones: [],
          impact: [],
          programs: [],
        },
      },
    ],
    consumers: [
      {
        programId: "PRG-1041",
        programName: "Atlas payments platform",
        system: "atlas-prod",
        controls: 19,
        accessible: true,
        lastSync: "Aug 27, 10:12",
        acceptedVersion: "v4.1",
        acceptedAssessmentVersion: "AR-2026.1",
        acceptedOn: "Jun 02, 2026",
        acceptedBy: "Grace Hoppel",
      },
      {
        programId: "PRG-1028",
        programName: "Northwind data warehouse",
        system: "ndw-analytics",
        controls: 17,
        accessible: true,
        lastSync: "Aug 26, 16:40",
        acceptedVersion: "v4.2",
        acceptedAssessmentVersion: "AR-2026.2",
        acceptedOn: "Aug 14, 2026",
        acceptedBy: "Marcus Ryde",
      },
      {
        programId: "PRG-1007",
        programName: "Field operations mobile",
        system: "fom-mobile",
        controls: 12,
        accessible: true,
        lastSync: "Aug 18, 13:27",
        acceptedVersion: "v4.1",
        acceptedAssessmentVersion: "AR-2026.1",
        acceptedOn: "May 21, 2026",
        acceptedBy: "Priya Raghavan",
      },
      {
        programId: "PRG-0994",
        programName: "Legacy billing gateway",
        system: "lbg-edge",
        controls: 14,
        accessible: true,
        lastSync: "Aug 11, 11:55",
        acceptedVersion: "v4.0",
        acceptedAssessmentVersion: "AR-2025.2",
        acceptedOn: "Nov 18, 2025",
        acceptedBy: "Tomas Ek",
      },
      {
        programId: "PRG-0961",
        programName: "Restricted program",
        system: "—",
        controls: 19,
        accessible: false,
        lastSync: "—",
        acceptedVersion: "—",
        acceptedAssessmentVersion: "—",
        acceptedOn: "—",
        acceptedBy: "—",
      },
      {
        programId: "PRG-0940",
        programName: "Restricted program",
        system: "—",
        controls: 11,
        accessible: false,
        lastSync: "—",
        acceptedVersion: "—",
        acceptedAssessmentVersion: "—",
        acceptedOn: "—",
        acceptedBy: "—",
      },
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
      {
        id: "SC-7",
        title: "Boundary protection",
        family: "SC",
        model: "Shared",
        evidence: "Network boundary diagram + firewall export",
        evidenceAge: 6,
        status: "Satisfied",
        assessmentVersion: "AR-2026.2",
        assessedOn: "Aug 24, 2026",
        assertion:
          "The landing zone terminates all ingress in a shared inspection VPC behind AWS Network Firewall and a Gateway Load Balancer, denies east-west traffic between tenant account boundaries by default, and publishes a managed egress prefix list and forward proxy for every hosted workload.",
        consumerObligation:
          "Register this system's security groups, NACL exceptions and published endpoints in the landing-zone boundary record, and justify every egress destination outside the managed prefix list at the CCB.",
        applicability: {
          nodeKinds: [],
          environments: ["Production", "Staging"],
          zones: ["DMZ", "Enclave", "Management"],
          impact: [],
          programs: [],
        },
      },
      {
        id: "AU-9",
        title: "Protection of audit information",
        family: "AU",
        model: "Inherited",
        evidence: "Log sink IAM policy",
        evidenceAge: 6,
        status: "Satisfied",
        assessmentVersion: "AR-2026.2",
        assessedOn: "Aug 24, 2026",
        assertion:
          "Audit records are streamed out of every tenant account into a dedicated log archive account whose bucket policy denies delete and overwrite to all principals outside the archive role, with S3 Object Lock in compliance mode for 400 days.",
        consumerObligation: "—",
        applicability: {
          nodeKinds: [],
          environments: ["Production", "Staging"],
          zones: [],
          impact: [],
          programs: [],
        },
      },
      {
        id: "CM-6",
        title: "Configuration settings",
        family: "CM",
        model: "Customer configured",
        evidence: "Config baseline scan",
        evidenceAge: 9,
        status: "Satisfied",
        assessmentVersion: "AR-2026.2",
        assessedOn: "Aug 21, 2026",
        assertion:
          "The landing zone publishes the hardened baseline as AWS Config conformance packs and Systems Manager documents and reports per-account drift daily; it does not apply or remediate the baseline inside a tenant workload on the tenant's behalf.",
        consumerObligation:
          "Apply the published conformance pack to this system's accounts, remediate the drift the landing zone reports, and record every accepted deviation as an approved configuration exception — the platform reports drift, it does not fix it.",
        applicability: {
          nodeKinds: [],
          environments: ["Production", "Staging"],
          zones: [],
          impact: [],
          programs: [],
        },
      },
      {
        id: "CP-9",
        title: "System backup",
        family: "CP",
        model: "Inherited",
        evidence: "Backup job results",
        evidenceAge: 4,
        status: "Satisfied",
        assessmentVersion: "AR-2026.2",
        assessedOn: "Aug 26, 2026",
        assertion:
          "AWS Backup plans run against every tagged production resource with daily snapshots retained 35 days and monthly copies vaulted cross-region for one year, and the platform team executes a documented restore test each quarter.",
        consumerObligation: "—",
        applicability: {
          nodeKinds: [],
          environments: ["Production"],
          zones: [],
          impact: ["Moderate", "High"],
          programs: [],
        },
      },
    ],
    consumers: [
      {
        programId: "PRG-1041",
        programName: "Atlas payments platform",
        system: "atlas-prod",
        controls: 46,
        accessible: true,
        lastSync: "Aug 27, 10:12",
        acceptedVersion: "v9.6",
        acceptedAssessmentVersion: "AR-2026.2",
        acceptedOn: "Aug 24, 2026",
        acceptedBy: "Grace Hoppel",
      },
      {
        programId: "PRG-1028",
        programName: "Northwind data warehouse",
        system: "ndw-analytics",
        controls: 41,
        accessible: true,
        lastSync: "Aug 26, 16:40",
        acceptedVersion: "v9.5",
        acceptedAssessmentVersion: "AR-2026.1",
        acceptedOn: "Mar 30, 2026",
        acceptedBy: "Marcus Ryde",
      },
      {
        programId: "PRG-0961",
        programName: "Restricted program",
        system: "—",
        controls: 46,
        accessible: false,
        lastSync: "—",
        acceptedVersion: "—",
        acceptedAssessmentVersion: "—",
        acceptedOn: "—",
        acceptedBy: "—",
      },
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
      {
        id: "AC-1",
        title: "Policy and procedures",
        family: "AC",
        model: "Inherited",
        evidence: "Access control policy 2026.1",
        evidenceAge: 227,
        status: "Other than satisfied",
        assessmentVersion: "AR-2026.1",
        assessedOn: "Jan 15, 2026",
        assertion:
          "Enterprise access control policy 2026.1 establishes account, access enforcement, least privilege and separation-of-duties requirements binding on every system in the enterprise, and is reviewed annually by the Compliance office.",
        consumerObligation: "—",
        applicability: {
          nodeKinds: [],
          environments: [],
          zones: [],
          impact: [],
          programs: [],
        },
      },
      {
        id: "AU-1",
        title: "Policy and procedures",
        family: "AU",
        model: "Inherited",
        evidence: "Audit policy 2026.1",
        evidenceAge: 227,
        status: "Other than satisfied",
        assessmentVersion: "AR-2026.1",
        assessedOn: "Jan 15, 2026",
        assertion:
          "Enterprise audit and accountability policy 2026.1 defines the auditable event set, the 400-day retention period and the weekly review cadence binding on every system in the enterprise.",
        consumerObligation: "—",
        applicability: {
          nodeKinds: [],
          environments: [],
          zones: [],
          impact: [],
          programs: [],
        },
      },
      {
        id: "AC-2",
        title: "Account management policy and procedures",
        family: "AC",
        // Shared, not Inherited. A policy set satisfies the -1 control of a
        // family; it does not operate an account lifecycle. Offering AC-2 as
        // fully inherited told every consumer that lost the CCP ladder — or had
        // no nearer provider at all — that account management was end-to-end
        // discharged by the compliance office and that it owed nothing, which is
        // exactly the obligation this offer's own assertion says the consumer
        // still carries: the policy *prescribes*, the system *implements*.
        model: "Shared",
        evidence: "Account management procedure 2026.1",
        evidenceAge: 227,
        status: "Satisfied",
        assessmentVersion: "AR-2026.1",
        assessedOn: "Jan 15, 2026",
        assertion:
          "Enterprise access control policy 2026.1 §4 prescribes the account types, approval authority, 35-day inactivity disablement period and quarterly recertification cadence that every system's account management must follow.",
        consumerObligation:
          "Implement the lifecycle the policy prescribes on this system: declare its account types and role mappings, enforce the documented approval chain, disable accounts at 35 days of inactivity, run the quarterly recertification, and evidence each. The policy sets the parameters; it does not operate any account.",
        applicability: {
          nodeKinds: [],
          environments: [],
          zones: [],
          impact: [],
          programs: [],
        },
      },
      {
        id: "IR-1",
        title: "Policy and procedures",
        family: "IR",
        model: "Inherited",
        evidence: "IR policy 2026.1",
        evidenceAge: 227,
        status: "Satisfied",
        assessmentVersion: "AR-2026.1",
        assessedOn: "Jan 15, 2026",
        assertion:
          "Enterprise incident response policy 2026.1 defines the incident categories, the one-hour US-CERT reporting timeline for category 1 and 2 events, and the enterprise IR team's declaration authority over every system in the enterprise.",
        consumerObligation: "—",
        applicability: {
          nodeKinds: [],
          environments: [],
          zones: [],
          impact: [],
          programs: [],
        },
      },
    ],
    consumers: [
      {
        programId: "PRG-1041",
        programName: "Atlas payments platform",
        system: "atlas-prod",
        controls: 20,
        accessible: true,
        lastSync: "Aug 27, 10:12",
        acceptedVersion: "2026.1",
        acceptedAssessmentVersion: "AR-2026.1",
        acceptedOn: "Feb 03, 2026",
        acceptedBy: "Grace Hoppel",
      },
      {
        programId: "PRG-1028",
        programName: "Northwind data warehouse",
        system: "ndw-analytics",
        controls: 20,
        accessible: true,
        lastSync: "Aug 26, 16:40",
        acceptedVersion: "2026.1",
        acceptedAssessmentVersion: "AR-2026.1",
        acceptedOn: "Feb 11, 2026",
        acceptedBy: "Marcus Ryde",
      },
      {
        programId: "PRG-1013",
        programName: "Corporate identity provider",
        system: "idp-core",
        controls: 20,
        accessible: true,
        lastSync: "Aug 22, 09:05",
        acceptedVersion: "2026.1",
        acceptedAssessmentVersion: "AR-2026.1",
        acceptedOn: "Feb 05, 2026",
        acceptedBy: "Dana Whitlock",
      },
      {
        programId: "PRG-1007",
        programName: "Field operations mobile",
        system: "fom-mobile",
        controls: 20,
        accessible: true,
        lastSync: "Aug 18, 13:27",
        acceptedVersion: "2025.2",
        acceptedAssessmentVersion: "AR-2025.2",
        acceptedOn: "Aug 19, 2025",
        acceptedBy: "Priya Raghavan",
      },
      {
        programId: "PRG-0994",
        programName: "Legacy billing gateway",
        system: "lbg-edge",
        controls: 20,
        accessible: true,
        lastSync: "Aug 11, 11:55",
        acceptedVersion: "2025.2",
        acceptedAssessmentVersion: "AR-2025.2",
        acceptedOn: "Sep 04, 2025",
        acceptedBy: "Tomas Ek",
      },
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
      "Physical hosting for on-premise workloads. Provides the full PE family under a shared-responsibility matrix, scoped to racked chassis in an on-premise environment.",
    sourceProgramId: null,
    sourceAccessible: false,
    controls: [
      {
        id: "PE-2",
        title: "Physical access authorizations",
        family: "PE",
        model: "Inherited",
        evidence: "Colo badge roster",
        evidenceAge: 24,
        status: "Satisfied",
        assessmentVersion: "AR-2026.1",
        assessedOn: "Aug 06, 2026",
        assertion:
          "Sierra Vista maintains the authorized physical access list for each caged suite, reconciled monthly against tenant sponsorship, and issues a badge only on a signed request from the tenant's named facility coordinator.",
        consumerObligation: "—",
        applicability: {
          // `Chassis` is the whole constraint: it is what "racked hardware in
          // the colo" actually looks like in the composition graph. There is
          // deliberately no environment clause — `environments` is intersected
          // against `Asset.environment` (Production / Staging / Lab / Tactical
          // edge), while "On-premise" belongs to `Program.environment`, the
          // hosting model. That literal could never match any asset, so it
          // scoped the app's only Facility provider out of every consumer,
          // including a program with four racked chassis and a field switch.
          nodeKinds: ["Chassis"],
          environments: [],
          zones: [],
          impact: [],
          programs: [],
        },
      },
      {
        id: "PE-3",
        title: "Physical access control",
        family: "PE",
        model: "Inherited",
        evidence: "Vantage SOC 2 Type II §PE",
        evidenceAge: 24,
        status: "Satisfied",
        assessmentVersion: "AR-2026.1",
        assessedOn: "Aug 06, 2026",
        assertion:
          "Access to the raised floor requires badge plus biometric through a two-door mantrap, escorted visitors are logged with sponsor and purpose for two years, and every cage door is under continuous CCTV with 90-day retention.",
        consumerObligation: "—",
        applicability: {
          // No environment clause — see PE-2 above. `Chassis` is the constraint.
          nodeKinds: ["Chassis"],
          environments: [],
          zones: [],
          impact: [],
          programs: [],
        },
      },
      {
        id: "PE-13",
        title: "Fire protection",
        family: "PE",
        model: "Inherited",
        evidence: "Suppression inspection report",
        evidenceAge: 24,
        status: "Satisfied",
        assessmentVersion: "AR-2026.1",
        assessedOn: "Aug 06, 2026",
        assertion:
          "The data hall is covered by a VESDA aspirating smoke detection system cross-zoned to a pre-action dry-pipe suppression system, inspected semi-annually by a licensed contractor and monitored by the facility NOC around the clock.",
        consumerObligation: "—",
        applicability: {
          // No environment clause — see PE-2 above. `Chassis` is the constraint.
          nodeKinds: ["Chassis"],
          environments: [],
          zones: [],
          impact: [],
          programs: [],
        },
      },
    ],
    consumers: [
      {
        programId: "PRG-0994",
        programName: "Legacy billing gateway",
        system: "lbg-edge",
        controls: 13,
        accessible: true,
        lastSync: "Aug 11, 11:55",
        acceptedVersion: "—",
        acceptedAssessmentVersion: "AR-2025.2",
        acceptedOn: "Jun 27, 2025",
        acceptedBy: "Tomas Ek",
      },
      {
        programId: "PRG-1041",
        programName: "Atlas payments platform",
        system: "atlas-prod",
        controls: 3,
        accessible: true,
        lastSync: "Aug 27, 10:12",
        acceptedVersion: "—",
        acceptedAssessmentVersion: "—",
        acceptedOn: "—",
        acceptedBy: "—",
      },
    ],
  },
  /*
   * Two reusable capabilities, added for the secure boot requirement thread.
   *
   * Both carry `controls: []` on purpose. They contribute to requirements —
   * the signing enclave produces the signature the bootloader authenticates,
   * the line burns the anchor that signature chains to — but neither publishes
   * a control a consuming system may inherit. `resolveInheritance` iterates
   * `controls`, so an empty list means these appear in the library and can be
   * named by an allocation without moving a single number in the control
   * matrix or the SCTM. Giving either one a `ProvidedControl` is a separate,
   * deliberate decision about what a consumer is entitled to claim.
   */
  {
    id: "CMP-041",
    key: "signing-enclave",
    name: "Production code signing enclave",
    type: "Service",
    owner: "Victor Amsel",
    provider: "Internal — Product Security (PKI)",
    version: "v2.1",
    authorization: "Pending — ceremony not yet held",
    health: "Reassessment due",
    updated: "Aug 29, 16:20",
    summary:
      "An air-gapped FIPS 140-3 Level 3 HSM pair holding the production signing hierarchy. Signature requests cross the gap on transfer media and are signed under a scripted two-person ceremony. Contributes to firmware authentication obligations; publishes no inheritable control while the hierarchy is still on development keys.",
    sourceProgramId: null,
    sourceAccessible: false,
    controls: [],
    consumers: [
      {
        programId: "PRG-1041",
        programName: "Atlas payments platform",
        system: "atlas-prod",
        controls: 0,
        accessible: true,
        lastSync: "Aug 29, 16:20",
        acceptedVersion: "—",
        acceptedAssessmentVersion: "—",
        acceptedOn: "—",
        acceptedBy: "—",
      },
    ],
  },
  {
    id: "CMP-047",
    key: "provisioning-line",
    name: "Module provisioning and fusing line",
    type: "Manufacturing",
    owner: "Elena Vasquez",
    provider: "Internal — Manufacturing Engineering",
    version: "Fixture Rev B",
    authorization: "Line qualification in progress",
    health: "Current",
    updated: "Aug 28, 11:05",
    summary:
      "A powered fixture on the manufacturing line that brings the module up, burns the secure-boot and rollback fuses, flashes the signed image and writes a per-unit provisioning record — without exposing key material to line operators. Discharges the part of trust-anchor provisioning that happens before the module is a system.",
    sourceProgramId: null,
    sourceAccessible: false,
    controls: [],
    consumers: [
      {
        programId: "PRG-1041",
        programName: "Atlas payments platform",
        system: "atlas-prod",
        controls: 0,
        accessible: true,
        lastSync: "Aug 28, 11:05",
        acceptedVersion: "Fixture Rev B",
        acceptedAssessmentVersion: "—",
        acceptedOn: "Aug 12, 2026",
        acceptedBy: "Grace Hoppel",
      },
    ],
  },
];

export function componentByKey(key: string) {
  return systemComponents.find((c) => c.key === key || c.id === key);
}

export const staleThresholdDays = 30;
