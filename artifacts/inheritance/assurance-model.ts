export type ObjectKind =
  "System" | "Subsystem" | "Component" | "Organizational profile" | "Overlay" | "Host platform";
export type ControlDefinition = { id: string; title: string; family: string; objective: string };
export type Requirement = {
  id: string;
  title: string;
  controlIds: string[];
  status: "Verified" | "Open";
  evidenceIds: string[];
};
export type Evidence = { id: string; title: string; kind: string; date: string; scope: string };
export type Assessment = {
  id: string;
  date: string;
  assessor: string;
  scope: string;
  result: "Complete" | "In progress";
  note: string;
};
export type ObjectControl = {
  id: string;
  applicability: "Applicable" | "Not applicable";
  status: "Satisfied" | "Partial" | "Not assessed" | "Not applicable";
  implementation: string;
  responsibility: string;
  rationale: string;
  evidenceIds: string[];
  requirementIds: string[];
  contributions: { objectId: string; controlId: string; note: string }[];
};
export type AssuranceObject = {
  id: string;
  name: string;
  version: string;
  kind: ObjectKind;
  owner: string;
  conditions: string[];
  children: { slot: string; objectId: string; label: string }[];
  baseProfileId?: string;
  consumers: string[];
  controls: ObjectControl[];
  requirements: Requirement[];
  evidence: Evidence[];
  assessments: Assessment[];
};
export type Program = {
  id: string;
  name: string;
  context: string;
  owner: string;
  requirements: Requirement[];
  evidence: Evidence[];
};
export type ProgramInstance = {
  id: string;
  programId: string;
  productId: string;
  parentInstanceId?: string;
  hostInstanceId?: string;
  applicableControlIds?: string[];
  name: string;
  role?: "Product" | "Host";
};
export type ProfileAssignment = {
  id: string;
  programId: string;
  profileId: string;
  targetInstanceIds: string[];
};
export type ConsumerDecision = {
  confirmedSourceIds: string[];
  excludedSourceIds: string[];
  localNarrative: string;
  localComplete: boolean;
};
export type DecisionMap = Record<string, ConsumerDecision>;
export const decisionKey = (programId: string, instanceId: string, controlId: string) =>
  `${programId}|${instanceId}|${controlId}`;
export const emptyDecision = (): ConsumerDecision => ({
  confirmedSourceIds: [],
  excludedSourceIds: [],
  localNarrative: "",
  localComplete: false,
});
