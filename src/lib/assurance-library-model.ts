/**
 * What a library entry *is*. Both are components in OSCAL's sense — a
 * component-definition covers `policy` and `process` as readily as hardware and
 * software — and they differ only in how they reach a program: a Product is
 * instantiated at a node (`LibraryUse`), a Policy is assigned to the program or
 * to selected targets without entering the inventory (`LibraryAssignment`).
 *
 * Policy was called "Overlay" until the catalogue consolidation. It never
 * tailored a control set, which is the one thing an overlay does, so the word
 * was doing two unrelated jobs: this one, and the CNSSI 1253 appendix that
 * modifies a program's control selection. That second meaning is the only
 * Overlay left in the product, and it belongs to the profile.
 */
export type LibraryKind = "Product" | "Policy";
export type LibraryAssessment = "Not assessed" | "Satisfied" | "Other than satisfied";
export type LibraryControl = {
  id: string;
  title: string;
  family: string;
  applicability: "Applicable" | "Not applicable";
  implementation: string;
  consumerResponsibility: string;
  assessment: LibraryAssessment;
  assessor: string;
  assessedOn: string;
  requirementIds: string[];
  evidenceIds: string[];
};
export type LibraryRequirement = {
  id: string;
  title: string;
  controlIds: string[];
  status: "Open" | "Verified";
  evidenceIds: string[];
};
export type LibraryEvidence = {
  id: string;
  title: string;
  kind: string;
  date: string;
  reference: string;
};
export type LibraryReference = { entryId: string; versionId: string };
export type LibraryChild = LibraryReference & { slot: string; name: string };
export type LibraryVersion = {
  id: string;
  version: string;
  publishedOn: string | null;
  controls: LibraryControl[];
  requirements: LibraryRequirement[];
  evidence: LibraryEvidence[];
  children: LibraryChild[];
  /** A Policy may supplement another Policy; a regional supplement extends a corporate one. */
  basePolicy: LibraryReference | null;
  conditions: string[];
};
export type LibraryEntry = {
  id: string;
  key: string;
  kind: LibraryKind;
  name: string;
  category: string;
  owner: string;
  versions: LibraryVersion[];
  draft: LibraryVersion | null;
};
export type LibraryUse = LibraryReference & {
  id: string;
  programId: string;
  name: string;
  parentUseId: string | null;
  targetNodeId: string | null;
  role: "Product" | "Host";
  hostUseId: string | null;
  controlIds: string[];
};
export type LibraryAssignment = LibraryReference & {
  id: string;
  programId: string;
  targetIds: string[]; // use ID or "program"
};
export type LibraryDecision = {
  programId: string;
  useId: string;
  controlId: string;
  sourceDecisions: Record<string, "Pending" | "Confirmed" | "Excluded">;
  narrative: string;
  evidenceIds: string[];
  implementation: "Not implemented" | "Planned" | "Partially implemented" | "Implemented";
  assessment: LibraryAssessment;
  assessor: string;
  assessedOn: string;
  determination: string;
};
export type LibraryProgramEvidence = LibraryEvidence & { programId: string; useId: string };
export type LibrarySource = {
  id: string;
  entry: LibraryEntry;
  version: LibraryVersion;
  control: LibraryControl;
  /** How this contribution reaches the control: the use itself, an assigned policy, or its host. */
  kind: "Product" | "Policy" | "Host";
  decision: "Pending" | "Confirmed" | "Excluded";
};
export type LibraryState = {
  entries: LibraryEntry[];
  uses: LibraryUse[];
  assignments: LibraryAssignment[];
  decisions: LibraryDecision[];
  programEvidence: LibraryProgramEvidence[];
};
