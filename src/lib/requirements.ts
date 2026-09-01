/**
 * Security requirements — the engineering layer between a control obligation
 * and the parts that have to do something about it.
 *
 * The rest of this product reads a control and asks which components carry it.
 * That question has an answer in `sctm.ts`, and the answer is a flattened one:
 * a row names `responsibleNodes`, so the trace from SI-7 to the bootloader is
 * *stored*. Storing it is what makes the matrix cheap and what makes it lie.
 * It cannot say that the bootloader verifies a signature the signing enclave
 * produced, that the fuse the ASIC compares against was burned on the line, or
 * that the boot chain fails closed because of a red-team finding rather than
 * because 800-53 asked for it.
 *
 * So this module inverts the storage. Nothing here records a control-to-node
 * edge. A `Requirement` is an engineering "shall" with its own provenance; an
 * `Allocation` says which element owes what share of it; and the control trace
 * a component displays is *computed* by `derivedControlTrace` walking
 * node → allocation → requirement → derivation. If that function is ever
 * replaced by a field, the model has collapsed back into the matrix.
 *
 * Three things follow from that inversion and are load-bearing:
 *
 *  - A requirement can derive from a threat, a policy or an architecture
 *    decision and from no control at all. `REQ-0042.3` is exactly that, and
 *    `unmappedRequirements` exists to count them. A layer that only ever
 *    derives from controls is a relabelled CCI list.
 *  - An allocation is a record, not a string in an array. Responsibility,
 *    coverage and scope are the difference between "the ASIC is involved in
 *    SI-7" and "the ASIC stores the fuse-backed key hash the bootloader
 *    compares against, and covers none of the verification itself".
 *  - Allocation targets are not all composition nodes. A signing enclave is a
 *    provider; a two-person key ceremony is a process. Neither is inside the
 *    authorization boundary, and the obligation is unsatisfiable without both.
 *
 * Scope of this first cut: interfaces are NOT yet allocation targets. `§4` of
 * the platform design wants them first-class, but `CompositionEdge` carries no
 * id, and promoting it reaches `graph-posture.ts` and `change-impact.ts`. The
 * secure-boot thread seeded here does not need them.
 */

import { useSyncExternalStore } from "react";

import type { Tone } from "@/components/app/ui";
import { nodeById, pathLabel, type CompositionNode } from "@/lib/composition";
import { componentByKey, type SystemComponent } from "@/lib/reusable-components";
import { datasetToday } from "@/lib/dataset-clock";
import type { VerificationMethod } from "@/lib/spine";

/* ------------------------------------------------------------------- Types */

/**
 * `§7.1` of the platform design. The type is not decoration: it decides which
 * element kinds an allocation is allowed to name, and it is what stops a
 * process obligation from being filed against a board.
 */
export type RequirementType =
  | "Protection need"
  | "System security"
  | "Derived"
  | "Subsystem"
  | "Component"
  | "Interface"
  | "Process"
  | "Assurance";

/**
 * `§15.1`. Approved is the gate that matters — a requirement cannot be
 * allocated before someone with authority accepted the text, and cannot be
 * verified before an allocation was accepted by the element's owner.
 */
export type RequirementState =
  | "Draft"
  | "Proposed"
  | "Approved"
  | "Allocated"
  | "Implemented"
  | "Verified"
  | "Rejected"
  | "Superseded"
  | "Retired";

/**
 * Where a requirement came from. Deliberately wider than the control catalog:
 * the four non-control members are the whole argument for this layer existing.
 */
export type DerivationSource =
  | "Control statement"
  | "Overlay"
  | "Policy"
  | "Threat"
  | "Architecture decision"
  | "Interface contract"
  | "Finding"
  | "Supplier constraint";

export type Derivation = {
  sourceType: DerivationSource;
  /** The upstream record: "SI-7(1)", "THR-0303", "CMP-008", "FND-2269". */
  sourceId: string;
  /** How the source reads on screen when the id alone is not enough. */
  sourceLabel: string;
  /** Why this source produces this requirement. Never "the security team asked". */
  rationale: string;
};

export type Requirement = {
  id: string; // REQ-
  program: string; // PRG-
  /** Parent in the decomposition tree; null for a top-level SSR. */
  parent: string | null;
  type: RequirementType;
  /** The shall statement. One obligation, testable, no compound clauses. */
  text: string;
  /** Bumped on every text change — never mutate in place (`§7.3`). */
  revision: number;
  state: RequirementState;
  /** Accountable engineering owner, by name. */
  owner: string;
  /**
   * At least one, always. The invariant in `§15.2` — "every approved
   * requirement has at least one provenance source" — is asserted by
   * `unprovenancedRequirements`, which must stay empty.
   */
  derivations: Derivation[];
  method: VerificationMethod;
  /** The observable that decides the requirement is met. */
  successCriteria: string;
  /** Workstream carrying the work, or null. */
  workstream: string | null;
  note: string;
};

/* -------------------------------------------------------------- Allocation */

/**
 * `§8`. Sender and Receiver are declared but unused until interfaces become
 * allocation targets — they are the vocabulary an interface split needs, and
 * naming them now keeps the second cut from widening the union under callers.
 */
export type Responsibility =
  "Primary" | "Supporting" | "Verifier" | "Provider" | "Operator" | "Sender" | "Receiver";

/** How much of the requirement this one element covers. */
export type Coverage = "Full" | "Partial" | "Conditional" | "Shared";

export type AllocationState =
  "Proposed" | "Accepted" | "Implemented" | "Verified" | "Rejected" | "Superseded";

/**
 * Not every allocation target is inside the boundary. A composition node is;
 * a provider capability and an operational process are not, and the secure
 * boot obligation is unsatisfiable without all three.
 */
export type AllocationTargetKind = "node" | "provider" | "process";

export type Allocation = {
  id: string; // ALC-
  requirement: string; // REQ-
  /** CN- node id, provider `key`, or PRC- process id, per `targetKind`. */
  target: string;
  targetKind: AllocationTargetKind;
  responsibility: Responsibility;
  coverage: Coverage;
  /** The bounded claim: what part of the requirement this element answers. */
  scope: string;
  /** The element owner who accepted the allocation. */
  owner: string;
  state: AllocationState;
  rationale: string;
};

/**
 * An operational, manufacturing or maintenance process that carries security
 * obligations. Not a composition node: it has no parent in the build tree, no
 * BOM and no part key, and forcing it into that tree would corrupt it.
 */
export type SecurityProcess = {
  id: string; // PRC-
  name: string;
  owner: string;
  org: string;
  summary: string;
  /** What running the process produces that an assessor can look at. */
  evidence: string;
  workstream: string | null;
};

/* ------------------------------------------------------------ Vocabularies */
/* Ordered option lists for the inline editors. Declared beside the unions so a
   widened union that forgets its options is a compile error, not a silent gap. */

export const requirementStates: RequirementState[] = [
  "Draft",
  "Proposed",
  "Approved",
  "Allocated",
  "Implemented",
  "Verified",
  "Rejected",
  "Superseded",
  "Retired",
];

export const responsibilities: Responsibility[] = [
  "Primary",
  "Supporting",
  "Verifier",
  "Provider",
  "Operator",
  "Sender",
  "Receiver",
];

export const coverages: Coverage[] = ["Full", "Partial", "Conditional", "Shared"];

export const allocationStates: AllocationState[] = [
  "Proposed",
  "Accepted",
  "Implemented",
  "Verified",
  "Rejected",
  "Superseded",
];

export const verificationMethods: VerificationMethod[] = [
  "Test",
  "Demonstration",
  "Analysis",
  "Inspection",
];

/* -------------------------------------------------------------------- Tone */

export const requirementStateTone: Record<RequirementState, Tone> = {
  Draft: "neutral",
  Proposed: "neutral",
  Approved: "info",
  Allocated: "info",
  Implemented: "info",
  Verified: "success",
  Rejected: "danger",
  Superseded: "neutral",
  Retired: "neutral",
};

export const allocationStateTone: Record<AllocationState, Tone> = {
  Proposed: "neutral",
  Accepted: "info",
  Implemented: "info",
  Verified: "success",
  Rejected: "danger",
  Superseded: "neutral",
};

/** Partial and Conditional are not failures — they are the normal case. */
export const coverageTone: Record<Coverage, Tone> = {
  Full: "success",
  Partial: "neutral",
  Conditional: "warning",
  Shared: "neutral",
};

/**
 * Control-derived provenance reads as the informational default; everything
 * else is neutral. The point is that non-control sources look equally native,
 * so no tone here implies a requirement is less legitimate for lacking a CCI.
 */
export const derivationSourceTone: Record<DerivationSource, Tone> = {
  "Control statement": "info",
  Overlay: "info",
  Policy: "neutral",
  Threat: "warning",
  "Architecture decision": "neutral",
  "Interface contract": "neutral",
  Finding: "danger",
  "Supplier constraint": "neutral",
};

export const responsibilityTone: Record<Responsibility, Tone> = {
  Primary: "info",
  Supporting: "neutral",
  Verifier: "neutral",
  Provider: "neutral",
  Operator: "neutral",
  Sender: "neutral",
  Receiver: "neutral",
};

/* --------------------------------------------------------------- Processes */

export const securityProcesses: SecurityProcess[] = [
  {
    id: "PRC-0001",
    name: "Firmware release and signing authorization",
    owner: "Joel Barrantes",
    org: "Platform Engineering",
    summary:
      "A reproducible build emits an SBOM and a detached signature request. The request crosses the air gap on transfer media, is signed inside the enclave, and the signed image is promoted to the flashing fixture only after the release record names both custodians and the build it authorizes.",
    evidence: "Release record, signature request manifest, transfer media chain of custody",
    workstream: "WS-0104",
  },
  {
    id: "PRC-0002",
    name: "Production key ceremony and custodian control",
    owner: "Victor Amsel",
    org: "Product Security",
    summary:
      "Generation of the production signing hierarchy inside the air-gapped HSM pair under a scripted two-person ceremony, with named custodians, a witnessed transcript, and tamper-evident storage of the activation material between ceremonies.",
    evidence: "Ceremony transcript, custodian attestations, HSM audit log, tamper-seal record",
    workstream: "WS-0103",
  },
];

export const processById = new Map(securityProcesses.map((p) => [p.id, p]));

/* ------------------------------------------------------------ Requirements */

/**
 * The secure boot thread — `§17` of the platform design, written against the
 * composition this program already carries rather than against an example
 * system. `CN-0314` is the ROMMON bootloader on the tactical edge switch,
 * `CN-0312` the Marvell forwarding ASIC beneath it, `CN-0112` the UEFI BIOS on
 * a ground-segment mainboard.
 *
 * Read the derivations before the text. `REQ-0042.3` derives from a threat and
 * nothing else, and `REQ-0042.4` from organizational policy — neither is
 * expressible as an 800-53A objective, and both are the reason the module
 * exists.
 */
export const requirements: Requirement[] = [
  {
    id: "REQ-0042",
    program: "PRG-1041",
    parent: null,
    type: "System security",
    text: "The system shall prevent execution of unauthorized firmware during the boot process.",
    revision: 4,
    state: "Allocated",
    owner: "Amara Bell",
    derivations: [
      {
        sourceType: "Control statement",
        sourceId: "SI-7",
        sourceLabel: "Software, Firmware, and Information Integrity",
        rationale:
          "The control obliges the system to detect unauthorized changes to firmware. Detection alone does not prevent execution, so the system-level requirement states the outcome the control is selected to achieve on this platform.",
      },
      {
        sourceType: "Threat",
        sourceId: "THR-0309",
        sourceLabel: "Supplier substitution in the mission image",
        rationale:
          "A tier V portrayal substitutes a build upstream of the operator network. Nothing in the boundary detects the substitution after the fact, so the obligation has to be enforced at load time.",
      },
    ],
    method: "Test",
    successCriteria:
      "No image lacking a valid production signature reaches an executable state on any bootable element in the boundary.",
    workstream: "WS-0101",
    note: "Parent obligation. Every child below decomposes one part of it; the parent is not itself allocated.",
  },
  {
    id: "REQ-0042.1",
    program: "PRG-1041",
    parent: "REQ-0042",
    type: "Derived",
    text: "Executable firmware shall be cryptographically authenticated against a production signing key before execution.",
    revision: 3,
    state: "Implemented",
    owner: "Dan Whitfield",
    derivations: [
      {
        sourceType: "Control statement",
        sourceId: "SI-7(1)",
        sourceLabel: "Integrity Checks",
        rationale:
          "The enhancement requires an integrity check of firmware at startup. Authentication against a signing key is the check this platform performs.",
      },
      {
        sourceType: "Architecture decision",
        sourceId: "WS-0101",
        sourceLabel: "Boot chain of trust — signature verification at every stage",
        rationale:
          "The chain of trust was designed so each stage verifies the next rather than relying on a single measurement at reset, which is what makes the requirement apply to more than one element.",
      },
    ],
    method: "Test",
    successCriteria:
      "An image signed with a development key, an unsigned image, and an image with a corrupted signature block are each refused at every verifying stage.",
    workstream: "WS-0101",
    note: "Allocated to two different bootable elements on two different subsystems — the archetype for why a requirement is not owned by one part.",
  },
  {
    id: "REQ-0042.2",
    program: "PRG-1041",
    parent: "REQ-0042",
    type: "Derived",
    text: "Boot authentication shall chain to a hardware-protected root of trust provisioned before the module leaves the manufacturing line.",
    revision: 2,
    state: "Approved",
    owner: "Elena Vasquez",
    derivations: [
      {
        sourceType: "Control statement",
        sourceId: "SI-7(15)",
        sourceLabel: "Code Authentication",
        rationale:
          "The enhancement requires cryptographic authentication of software before installation. A key the firmware can rewrite authenticates nothing, so the trust anchor has to be hardware-protected.",
      },
      {
        sourceType: "Threat",
        sourceId: "THR-0303",
        sourceLabel: "Forwarding ASIC denial at the tactical edge",
        rationale:
          "The scenario notes the forwarding ASIC is unattested and reachable over the line board MDIO strap. An anchor held anywhere the strap can reach is not an anchor.",
      },
      {
        sourceType: "Architecture decision",
        sourceId: "WS-0102",
        sourceLabel: "Fuse-backed key hash burned on the line",
        rationale:
          "Provisioning was moved into the fixture rather than a field step, which puts part of this requirement outside the boundary and onto a manufacturing capability.",
      },
    ],
    method: "Inspection",
    successCriteria:
      "Fuse readback on a production unit matches the approved key hash, and the fuses are locked against further programming.",
    workstream: "WS-0101",
    note: "Blocked with the workstream — the anchor cannot be burned to a production key hash until the ceremony in WS-0103 completes.",
  },
  {
    id: "REQ-0042.3",
    program: "PRG-1041",
    parent: "REQ-0042",
    type: "Derived",
    text: "Authentication failure shall halt the boot sequence and shall not transition the module to normal operational boot.",
    revision: 2,
    state: "Implemented",
    owner: "Dan Whitfield",
    derivations: [
      {
        sourceType: "Threat",
        sourceId: "THR-0309",
        sourceLabel: "Supplier substitution in the mission image",
        rationale:
          "Detecting a substituted image and then continuing to boot it is the failure the scenario actually exercises. Fail-closed behaviour is the response, and no control statement in the selected set asks for it.",
      },
    ],
    method: "Test",
    successCriteria:
      "On a forced verification failure the module enters recovery and no operational image is given control; the failure is recorded where it survives the reset.",
    workstream: "WS-0101",
    note: "Derives from a threat and from nothing in the catalog. This requirement is invisible to a control-first model, and it is the one a red team defeats first.",
  },
  {
    id: "REQ-0042.4",
    program: "PRG-1041",
    parent: "REQ-0042",
    type: "Derived",
    text: "The module shall refuse firmware whose security version is below the value recorded in the rollback fuses.",
    revision: 1,
    state: "Approved",
    owner: "Marcus Ryde",
    derivations: [
      {
        sourceType: "Policy",
        sourceId: "CMP-008",
        sourceLabel: "Enterprise security policy set 2026.1",
        rationale:
          "Organizational policy requires anti-rollback on any product that ships a field-updatable boot chain. The control set carries no equivalent obligation at this baseline.",
      },
      {
        sourceType: "Threat",
        sourceId: "THR-0309",
        sourceLabel: "Supplier substitution in the mission image",
        rationale:
          "A validly signed but superseded image defeats REQ-0042.1 without breaking it. Version enforcement is what closes that path.",
      },
    ],
    method: "Test",
    successCriteria:
      "A correctly signed image at a security version below the burned floor is refused, and the refusal is distinguishable from a signature failure.",
    workstream: "WS-0101",
    note: "Policy-derived. Splits across the firmware that compares the version and the ASIC that stores the floor.",
  },
  {
    id: "REQ-0042.5",
    program: "PRG-1041",
    parent: "REQ-0042",
    type: "Process",
    text: "A production signing operation shall require two authorized custodians, both recorded in the release record for the image signed.",
    revision: 1,
    state: "Proposed",
    owner: "Victor Amsel",
    derivations: [
      {
        sourceType: "Policy",
        sourceId: "CMP-008",
        sourceLabel: "Enterprise security policy set 2026.1",
        rationale:
          "Two-person control over production signing authority is an organizational obligation, not a property of any delivered part.",
      },
      {
        sourceType: "Control statement",
        sourceId: "SC-12",
        sourceLabel: "Cryptographic Key Establishment and Management",
        rationale:
          "Key management obligations reach the authorization to use the key, not only its storage. The custodian split is where that authorization is enforced.",
      },
    ],
    method: "Inspection",
    successCriteria:
      "Every release record for a signed production image names two distinct cleared custodians, and the ceremony transcript corroborates both.",
    workstream: "WS-0103",
    note: "Allocates to a process and to nothing in the boundary. No composition node can carry it, which is why the allocation target union is not just CN- ids.",
  },
];

export const requirementById = new Map(requirements.map((r) => [r.id, r]));

/* ------------------------------------------------------------- Allocations */

/**
 * Ten allocations across three target kinds. The shape of this list is the
 * argument: `REQ-0042.1` reaches two bootable elements on two subsystems, a
 * provider that never enters the boundary, and a release process — and no
 * single one of them "implements SI-7(1)".
 */
export const allocations: Allocation[] = [
  {
    id: "ALC-0001",
    requirement: "REQ-0042.1",
    target: "CN-0314",
    targetKind: "node",
    responsibility: "Primary",
    coverage: "Partial",
    scope: "Signature verification of the next boot stage prior to handing it execution",
    owner: "Dan Whitfield",
    state: "Implemented",
    rationale:
      "ROMMON is the first mutable stage with a verifier in it, so on-device authentication is performed here or not at all.",
  },
  {
    id: "ALC-0002",
    requirement: "REQ-0042.1",
    target: "CN-0112",
    targetKind: "node",
    responsibility: "Primary",
    coverage: "Partial",
    scope: "Verification of the ground-segment boot chain on the R760 mainboard",
    owner: "Elena Vasquez",
    state: "Accepted",
    rationale:
      "The same obligation reaches every bootable compute element. The ground segment boots a vendor UEFI implementation, so the coverage is real but the verification path is not the one the tactical edge uses.",
  },
  {
    id: "ALC-0003",
    requirement: "REQ-0042.1",
    target: "signing-enclave",
    targetKind: "provider",
    responsibility: "Provider",
    coverage: "Shared",
    scope: "Produces the detached production signature the bootloader verifies",
    owner: "Victor Amsel",
    state: "Accepted",
    rationale:
      "There is nothing for the bootloader to authenticate against unless the enclave has signed the image under the production hierarchy. The verifier and the signer are different accountable parties.",
  },
  {
    id: "ALC-0004",
    requirement: "REQ-0042.1",
    target: "PRC-0001",
    targetKind: "process",
    responsibility: "Verifier",
    coverage: "Conditional",
    scope: "Image promotion gate confirms a valid signature before the image reaches the fixture",
    owner: "Joel Barrantes",
    state: "Accepted",
    rationale:
      "A signed image that was never authorized for release still verifies on the device. The release gate is where authorization is checked, and it is conditional on the transfer set being the only path in.",
  },
  {
    id: "ALC-0005",
    requirement: "REQ-0042.2",
    target: "CN-0312",
    targetKind: "node",
    responsibility: "Primary",
    coverage: "Partial",
    scope: "Holds the fuse-backed key hash the boot chain anchors to",
    owner: "Elena Vasquez",
    state: "Proposed",
    rationale:
      "The ASIC is the only element in the chain whose key storage the firmware above it cannot rewrite.",
  },
  {
    id: "ALC-0006",
    requirement: "REQ-0042.2",
    target: "provisioning-line",
    targetKind: "provider",
    responsibility: "Provider",
    coverage: "Partial",
    scope: "Trust-anchor programming and the per-unit provisioning record",
    owner: "Tom Okafor",
    state: "Accepted",
    rationale:
      "The anchor is burned on the line, before the module is a system. Half of this requirement is discharged by a manufacturing capability that is not in the authorization boundary.",
  },
  {
    id: "ALC-0007",
    requirement: "REQ-0042.3",
    target: "CN-0314",
    targetKind: "node",
    responsibility: "Primary",
    coverage: "Full",
    scope: "Fail-closed transition to recovery on any verification failure",
    owner: "Dan Whitfield",
    state: "Verified",
    rationale:
      "The decision to hand over execution is made in one place, so the failure behaviour is fully owned by one element. Rare, and worth noticing when it happens.",
  },
  {
    id: "ALC-0008",
    requirement: "REQ-0042.4",
    target: "CN-0313",
    targetKind: "node",
    responsibility: "Primary",
    coverage: "Partial",
    scope: "Compares image security version against the burned floor at load",
    owner: "Marcus Ryde",
    state: "Accepted",
    rationale: "The comparison happens in the firmware image that performs the load.",
  },
  {
    id: "ALC-0009",
    requirement: "REQ-0042.4",
    target: "CN-0312",
    targetKind: "node",
    responsibility: "Supporting",
    coverage: "Partial",
    scope: "Stores the monotonic rollback floor in one-time-programmable fuses",
    owner: "Elena Vasquez",
    state: "Proposed",
    rationale:
      "A floor the firmware can lower is not a floor. Storage and comparison are deliberately in different elements.",
  },
  {
    id: "ALC-0010",
    requirement: "REQ-0042.5",
    target: "PRC-0002",
    targetKind: "process",
    responsibility: "Operator",
    coverage: "Full",
    scope: "Two-custodian authorization and the witnessed ceremony transcript",
    owner: "Victor Amsel",
    state: "Proposed",
    rationale:
      "Nothing delivered with the product enforces this. It is discharged entirely by how the ceremony is run.",
  },
];

/* --------------------------------------------------------------- Selectors */

export function requirementsForProgram(programId: string): Requirement[] {
  return requirements.filter((r) => r.program === programId).map(resolveRequirement);
}

/** One requirement with edits applied. Prefer this over `requirementById`. */
export function getRequirement(requirementId: string): Requirement | undefined {
  const seed = requirementById.get(requirementId);
  return seed ? resolveRequirement(seed) : undefined;
}

/** Direct children in the decomposition tree, in id order. */
export function childrenOfRequirement(requirementId: string): Requirement[] {
  return requirements.filter((r) => r.parent === requirementId).map(resolveRequirement);
}

/** The requirement and every ancestor above it, nearest first. */
export function ancestorsOfRequirement(requirementId: string): Requirement[] {
  const out: Requirement[] = [];
  let cursor = requirementById.get(requirementId)?.parent ?? null;
  const seen = new Set<string>([requirementId]);
  while (cursor && !seen.has(cursor)) {
    seen.add(cursor);
    const next = requirementById.get(cursor);
    if (!next) break;
    out.push(resolveRequirement(next));
    cursor = next.parent;
  }
  return out;
}

export function allocationsFor(requirementId: string): Allocation[] {
  return allocations.filter((a) => a.requirement === requirementId).map(resolveAllocation);
}

/**
 * The reverse direction — every allocation landing on one element, whatever
 * kind it is. This is what a component page asks, and the reason the target
 * union is a discriminated pair rather than three separate lists.
 */
export function allocationsOn(targetId: string): Allocation[] {
  return allocations.filter((a) => a.target === targetId).map(resolveAllocation);
}

export type AllocationTarget =
  | { kind: "node"; id: string; name: string; detail: string; node: CompositionNode }
  | { kind: "provider"; id: string; name: string; detail: string; provider: SystemComponent }
  | { kind: "process"; id: string; name: string; detail: string; process: SecurityProcess }
  | { kind: "missing"; id: string; name: string; detail: string };

/**
 * Resolve an allocation to the thing it names. Returns a `missing` variant
 * rather than throwing or filtering: an allocation pointing at a retired
 * element is a real state that has to be visible, and silently dropping the
 * row would understate the requirement's coverage.
 */
export function resolveTarget(allocation: Allocation): AllocationTarget {
  const { target, targetKind } = allocation;
  if (targetKind === "node") {
    const node = nodeById.get(target);
    if (node) {
      return { kind: "node", id: target, name: node.name, detail: pathLabel(target), node };
    }
  }
  if (targetKind === "provider") {
    const provider = componentByKey(target);
    if (provider) {
      return {
        kind: "provider",
        id: target,
        name: provider.name,
        detail: `${provider.provider} · ${provider.version}`,
        provider,
      };
    }
  }
  if (targetKind === "process") {
    const process = processById.get(target);
    if (process) {
      return { kind: "process", id: target, name: process.name, detail: process.org, process };
    }
  }
  return { kind: "missing", id: target, name: target, detail: "No longer in the model" };
}

/* --------------------------------------------------- The derived trace */

export type ControlTraceHop = {
  /** The control or enhancement id the obligation sits on. */
  control: string;
  controlLabel: string;
  /** The requirement that carries the derivation. */
  requirement: string;
  requirementText: string;
  /** The allocation that puts the requirement on this element. */
  allocation: Allocation;
  /**
   * Whether the control was named by the allocated requirement itself, or
   * inherited from an ancestor it decomposes. An ancestor hop is a weaker
   * claim and must not read as a direct one.
   */
  via: "direct" | "ancestor";
  /** The ancestor that supplied the derivation, when `via` is "ancestor". */
  through: string | null;
  rationale: string;
};

export type NodeControlTrace = {
  target: string;
  /** Every control this element reaches, and by which path. */
  hops: ControlTraceHop[];
  /** Distinct control ids, in first-seen order. */
  controls: string[];
  /**
   * Requirements allocated here whose OWN provenance names no control.
   *
   * Deliberately not "reaches no control": such a requirement usually still
   * reaches one through the parent it decomposes, and that hop is in `hops`.
   * The fact worth surfacing is narrower and sharper — this obligation was
   * written by threat analysis, policy or architecture, and the catalog hop
   * above it did not ask for the behaviour the requirement actually states.
   * Not a gap. `§1.1` of the platform design.
   */
  withoutControl: Requirement[];
};

/**
 * The computed control trace for one element.
 *
 * This function is the whole thesis in code. Nothing in this module stores a
 * control-to-element edge; the relationship a compliance tool would persist is
 * derived here by walking allocation → requirement → derivation, and it is
 * derived on every read so it cannot drift from the requirements that produce
 * it. If a `controls: string[]` field ever appears on `CompositionNode`, this
 * function is what makes it redundant — and what makes the redundancy visible.
 */
export function derivedControlTrace(targetId: string): NodeControlTrace {
  const hops: ControlTraceHop[] = [];
  const withoutControl: Requirement[] = [];

  for (const allocation of allocationsOn(targetId)) {
    const requirement = getRequirement(allocation.requirement);
    if (!requirement) continue;

    // Counted over the requirement's own derivations only. An ancestor hop is
    // recorded below but must not make this requirement look catalog-derived.
    let directlyReached = 0;
    for (const derivation of requirement.derivations) {
      if (derivation.sourceType !== "Control statement" && derivation.sourceType !== "Overlay") {
        continue;
      }
      directlyReached += 1;
      hops.push({
        control: derivation.sourceId,
        controlLabel: derivation.sourceLabel,
        requirement: requirement.id,
        requirementText: requirement.text,
        allocation,
        via: "direct",
        through: null,
        rationale: derivation.rationale,
      });
    }

    // A child decomposes its parent, so the parent's obligations reach here
    // too — but as a weaker, explicitly marked claim.
    for (const ancestor of ancestorsOfRequirement(requirement.id)) {
      for (const derivation of ancestor.derivations) {
        if (derivation.sourceType !== "Control statement" && derivation.sourceType !== "Overlay") {
          continue;
        }
        hops.push({
          control: derivation.sourceId,
          controlLabel: derivation.sourceLabel,
          requirement: requirement.id,
          requirementText: requirement.text,
          allocation,
          via: "ancestor",
          through: ancestor.id,
          rationale: derivation.rationale,
        });
      }
    }

    if (directlyReached === 0) withoutControl.push(requirement);
  }

  const controls: string[] = [];
  for (const hop of hops) if (!controls.includes(hop.control)) controls.push(hop.control);

  return { target: targetId, hops, controls, withoutControl };
}

/**
 * The forward direction — every requirement a control produced, directly or
 * through a requirement that decomposes one. Used by the control record to
 * show what the obligation actually turned into.
 */
export function requirementsForControl(controlId: string, programId?: string): Requirement[] {
  const direct = requirements.filter(
    (r) =>
      (!programId || r.program === programId) &&
      r.derivations.some(
        (d) =>
          (d.sourceType === "Control statement" || d.sourceType === "Overlay") &&
          d.sourceId === controlId,
      ),
  );
  const ids = new Set(direct.map((r) => r.id));
  // A child that decomposes a control-derived parent is serving the same
  // obligation, and is usually where the allocation actually lives.
  for (const requirement of requirements) {
    if (ids.has(requirement.id)) continue;
    if (programId && requirement.program !== programId) continue;
    if (ancestorsOfRequirement(requirement.id).some((a) => ids.has(a.id))) {
      direct.push(requirement);
    }
  }
  return direct.map(resolveRequirement).sort((a, b) => a.id.localeCompare(b.id));
}

/* ------------------------------------------------------------------- Gaps */

/**
 * `§15.2` — "every approved requirement has at least one provenance source".
 * The invariant is asserted by keeping this list empty rather than by a
 * constructor check, so a seed that violates it is visible on screen instead
 * of throwing at import time.
 */
export function unprovenancedRequirements(programId: string): Requirement[] {
  return requirementsForProgram(programId).filter((r) => r.derivations.length === 0);
}

/** Approved or later, and nothing has been made responsible for it yet. */
export function unallocatedRequirements(programId: string): Requirement[] {
  const allocatable = new Set(allocations.map((a) => a.requirement));
  return requirementsForProgram(programId).filter(
    (r) =>
      !allocatable.has(r.id) &&
      childrenOfRequirement(r.id).length === 0 &&
      r.state !== "Draft" &&
      r.state !== "Proposed" &&
      r.state !== "Rejected" &&
      r.state !== "Retired",
  );
}

/**
 * Requirements no control produced. Deliberately not called a gap: this is the
 * count that shows the layer is carrying engineering intent rather than
 * restating the catalog.
 */
export function unmappedRequirements(programId: string): Requirement[] {
  return requirementsForProgram(programId).filter(
    (r) =>
      !r.derivations.some(
        (d) => d.sourceType === "Control statement" || d.sourceType === "Overlay",
      ),
  );
}

export type RequirementSummary = {
  total: number;
  allocations: number;
  /** Distinct elements, providers and processes carrying at least one. */
  elements: number;
  verified: number;
  /** Requirements deriving from something other than the control catalog. */
  nonCatalog: number;
  unallocated: number;
};

export function requirementSummary(programId: string): RequirementSummary {
  const rows = requirementsForProgram(programId);
  const ids = new Set(rows.map((r) => r.id));
  const mine = allocations.filter((a) => ids.has(a.requirement));
  return {
    total: rows.length,
    allocations: mine.length,
    elements: new Set(mine.map((a) => a.target)).size,
    verified: rows.filter((r) => r.state === "Verified").length,
    nonCatalog: rows.filter((r) =>
      r.derivations.some((d) => d.sourceType !== "Control statement" && d.sourceType !== "Overlay"),
    ).length,
    unallocated: unallocatedRequirements(programId).length,
  };
}

/* ------------------------------------------------------------------ Store */

/**
 * Editable overlay over the seed, mirroring the override store in
 * `composition.ts`: the seeded arrays stay immutable, edits accumulate in a
 * patch map, and a version counter drives `useSyncExternalStore` so every
 * surface showing a requirement re-renders on a change made anywhere else.
 *
 * Deliberately not a general mutation API. Only the fields a user is allowed
 * to change in this cut are patchable — text is not among them, because
 * `§7.3` requires a text change to create a new revision with impact
 * analysis rather than mutate the statement in place. That belongs in the
 * change-management cut, not behind an inline edit.
 */
export type RequirementPatch = Partial<
  Pick<Requirement, "state" | "owner" | "method" | "successCriteria">
>;
export type AllocationPatch = Partial<
  Pick<Allocation, "responsibility" | "coverage" | "state" | "owner" | "scope">
>;

const requirementOverrides = new Map<string, RequirementPatch>();
const allocationOverrides = new Map<string, AllocationPatch>();
const listeners = new Set<() => void>();
let version = 0;

function bump() {
  version += 1;
  for (const l of listeners) l();
}

export function subscribeRequirements(cb: () => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

export function requirementsVersion(): number {
  return version;
}

export function setRequirementField(requirementId: string, patch: RequirementPatch) {
  if (!requirementById.has(requirementId)) return;
  requirementOverrides.set(requirementId, {
    ...requirementOverrides.get(requirementId),
    ...patch,
  });
  bump();
}

export function setAllocationField(allocationId: string, patch: AllocationPatch) {
  if (!allocations.some((a) => a.id === allocationId)) return;
  allocationOverrides.set(allocationId, {
    ...allocationOverrides.get(allocationId),
    ...patch,
  });
  bump();
}

/** Seed record with any accepted edits applied. */
export function resolveRequirement(requirement: Requirement): Requirement {
  const patch = requirementOverrides.get(requirement.id);
  return patch ? { ...requirement, ...patch } : requirement;
}

export function resolveAllocation(allocation: Allocation): Allocation {
  const patch = allocationOverrides.get(allocation.id);
  return patch ? { ...allocation, ...patch } : allocation;
}

/**
 * Mock persistence, same contract as `saveProgramField`: resolves on success,
 * rejects with a human message so the inline editor can roll back.
 */
export function saveRequirementField(field: string, value: string): Promise<string> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (value.trim().length === 0) reject(new Error(`${field} cannot be empty`));
      else resolve(value.trim());
    }, 420);
  });
}

/* ------------------------------------------------------- Applicability */

/**
 * Whether one requirement applies to one component — recorded either way.
 *
 * "Does not apply here" is a decision, not an absence. An LRU that was
 * considered for an obligation and consciously excluded is a different state
 * from one nobody looked at, and only the first is defensible to an assessor.
 * `§5.3` treats exclusion as a first-class tailoring decision with rationale
 * and authority; this is the same idea at component granularity, which is
 * where an engineer actually answers the question.
 *
 * A `true` decision is accompanied by an Allocation carrying the responsibility
 * and coverage. A `false` decision stands alone — there is nothing to allocate.
 */
export type ApplicabilityDecision = {
  id: string; // APP-
  requirement: string; // REQ-
  target: string;
  targetKind: AllocationTargetKind;
  applies: boolean;
  /** Mandatory when `applies` is false. Why this part is out of scope. */
  rationale: string;
  decidedBy: string;
  decidedOn: string;
};

const decisions: ApplicabilityDecision[] = [
  {
    id: "APP-0001",
    requirement: "REQ-0042.1",
    target: "CN-0313",
    targetKind: "node",
    applies: false,
    rationale:
      "IOS-XE is authenticated by ROMMON before it is given control; it does not itself verify a next stage. The obligation is discharged one level down, not here.",
    decidedBy: "Marcus Ryde",
    decidedOn: "Aug 26, 2026",
  },
  {
    id: "APP-0002",
    requirement: "REQ-0042.2",
    target: "CN-0111",
    targetKind: "node",
    applies: false,
    rationale:
      "The R760 mainboard carries a vendor TPM the program does not provision. Trust-anchor programming is out of scope for the ground segment under the current boundary.",
    decidedBy: "Elena Vasquez",
    decidedOn: "Aug 24, 2026",
  },
];

let decisionSeq = decisions.length;

export function decisionsFor(requirementId: string): ApplicabilityDecision[] {
  return decisions.filter((d) => d.requirement === requirementId);
}

export function decisionsOn(targetId: string): ApplicabilityDecision[] {
  return decisions.filter((d) => d.target === targetId);
}

/** Requirements explicitly ruled out for this component, with the reason. */
export function skippedOn(targetId: string): ApplicabilityDecision[] {
  return decisions.filter((d) => d.target === targetId && !d.applies);
}

function decisionFor(requirementId: string, targetId: string) {
  return decisions.find((d) => d.requirement === requirementId && d.target === targetId);
}

/**
 * Requirements this component has never been assessed against — the queue the
 * "does this apply here?" walk works through. A requirement already allocated
 * here, or already ruled out here, is answered and drops off.
 */
export function undecidedFor(targetId: string, programId: string): Requirement[] {
  const allocated = new Set(allocationsOn(targetId).map((a) => a.requirement));
  const ruled = new Set(decisionsOn(targetId).map((d) => d.requirement));
  return requirementsForProgram(programId).filter(
    (r) =>
      !allocated.has(r.id) &&
      !ruled.has(r.id) &&
      // A parent obligation is discharged through its children, never allocated
      // directly, so it is not a candidate for a component decision.
      childrenOfRequirement(r.id).length === 0,
  );
}

/**
 * Record an applicability decision. `applies: true` also creates the
 * allocation, because deciding an obligation lands here without saying what
 * share of it lands here is the flattened mapping this model exists to avoid.
 */
export function decideApplicability(input: {
  requirement: string;
  target: string;
  targetKind: AllocationTargetKind;
  applies: boolean;
  rationale: string;
  decidedBy: string;
  allocation?: {
    responsibility: Responsibility;
    coverage: Coverage;
    scope: string;
    owner: string;
  };
}): void {
  const existing = decisionFor(input.requirement, input.target);
  if (existing) {
    existing.applies = input.applies;
    existing.rationale = input.rationale;
    existing.decidedBy = input.decidedBy;
    existing.decidedOn = datasetToday;
  } else {
    decisionSeq += 1;
    decisions.push({
      id: `APP-${String(decisionSeq).padStart(4, "0")}`,
      requirement: input.requirement,
      target: input.target,
      targetKind: input.targetKind,
      applies: input.applies,
      rationale: input.rationale,
      decidedBy: input.decidedBy,
      decidedOn: datasetToday,
    });
  }

  if (input.applies && input.allocation) {
    addAllocation({
      requirement: input.requirement,
      target: input.target,
      targetKind: input.targetKind,
      ...input.allocation,
      rationale: input.rationale,
    });
    return;
  }
  bump();
}

/* -------------------------------------------------------------- Creation */

let requirementSeq = 42;
let allocationSeq = allocations.length;

/** Author a new requirement. At least one derivation is required by the model. */
export function addRequirement(input: {
  program: string;
  parent: string | null;
  type: RequirementType;
  text: string;
  owner: string;
  method: VerificationMethod;
  successCriteria: string;
  derivations: Derivation[];
}): Requirement {
  if (input.derivations.length === 0) {
    throw new Error("A requirement needs at least one derivation source");
  }
  // Children number under their parent; top-level requirements take the next
  // whole number, so REQ-0042.6 sits with its siblings rather than at the end.
  let id: string;
  if (input.parent) {
    const siblings = requirements.filter((r) => r.parent === input.parent).length;
    id = `${input.parent}.${siblings + 1}`;
  } else {
    requirementSeq += 1;
    id = `REQ-${String(requirementSeq).padStart(4, "0")}`;
  }

  const created: Requirement = {
    id,
    program: input.program,
    parent: input.parent,
    type: input.type,
    text: input.text,
    revision: 1,
    state: "Draft",
    owner: input.owner,
    derivations: input.derivations,
    method: input.method,
    successCriteria: input.successCriteria,
    workstream: input.parent ? (requirementById.get(input.parent)?.workstream ?? null) : null,
    note: "",
  };
  requirements.push(created);
  requirementById.set(created.id, created);
  bump();
  return created;
}

export function addAllocation(input: {
  requirement: string;
  target: string;
  targetKind: AllocationTargetKind;
  responsibility: Responsibility;
  coverage: Coverage;
  scope: string;
  owner: string;
  rationale: string;
}): Allocation {
  allocationSeq += 1;
  const created: Allocation = {
    id: `ALC-${String(allocationSeq).padStart(4, "0")}`,
    ...input,
    state: "Proposed",
  };
  allocations.push(created);
  bump();
  return created;
}

/**
 * Subscribes to the store and returns its version counter.
 *
 * Returns the version rather than a selected value on purpose. `useSyncExternal
 * Store` compares snapshots by identity, so a selector that builds an array —
 * every one of the selectors above does, they all `.filter().map()` — hands
 * React a new reference on each call and re-renders forever. A number is
 * stable, so callers key a `useMemo` off it instead:
 *
 *   const v = useRequirementsVersion();
 *   const rows = useMemo(() => requirementsForProgram(id), [id, v]);
 */
export function useRequirementsVersion(): number {
  return useSyncExternalStore(subscribeRequirements, requirementsVersion, requirementsVersion);
}
