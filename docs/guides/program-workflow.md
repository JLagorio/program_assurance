# Program assurance workflow

Work starts inside a program and stays attached to that program's systems, requirements, controls, assessments, and remediation records. The program route is `src/routes/programs.$programId.tsx`.

| Tab          | Purpose                                                                                                            |
| ------------ | ------------------------------------------------------------------------------------------------------------------ |
| System       | Define the system composition and assessment scopes.                                                               |
| Requirements | Author requirements, map their sources and controls, allocate responsibility, and inspect verification coverage.   |
| Controls     | Work the implementation statement and assessment for a control within a selected system scope.                     |
| Evidence     | Find artifact references, see which records they support, and add, link, or review them.                           |
| Assessments  | Plan assessment objectives and procedures, execute runs against named builds, and record observations and results. |
| Findings     | Review the program's deficiencies, their supporting evidence, ownership, remediation, and retests.                 |
| POA&M        | Manage remediation commitments, owners, due dates, milestones, and completion within the program.                  |
| Schedule     | Coordinate the program plan, assessment windows, remediation milestones, tasks, and assignments.                   |

1. **Define the requirement and implementation.** Create or select a requirement and connect it to the applicable control. Allocate the requirement to the responsible element. On the control record, select the relevant system scope, assign an owner, and write the implementation statement. Implementation and assessment are separate states. Control workflow actions enforce their stated role and evidence gates; revising a satisfied control's narrative requires reassessment.

2. **Add supporting evidence.** Add an artifact from Evidence, a control record, or a requirement record. Supply its repository URL, title, collection date, owner, version, provenance, and program or system scope. Link it to the implementation or requirement it supports. The same reference appears in the inventory and linked records. Evidence linked to one engineering requirement is not treated as supporting its siblings.

   Evidence currently stores **URL references and metadata, not uploaded file contents**. Opening an artifact follows its repository URL; that repository controls access. Seed references without a location are identified as such. Artifact review records suitability as Pending review, Accepted, or Needs revision, with a reviewer and rationale. Accepting evidence does not produce a passing assessment verdict.

3. **Assess the claim.** In Assessments, create an assessment with an objective, method, procedure, acceptance criterion, owner, and dates. Connect the requirement and subject where applicable. Start a run against a named build or configuration. Record each step's observed behavior, result, and supporting program evidence, then complete the run when the required records are present. Requirement coverage follows execution results. Retesting creates a separate run and preserves the previous execution.

4. **Record and remediate deficiencies.** Raise a finding from an assessment or create it in Findings. Specify the control, affected asset or system scope, applicable requirements, severity, owner, determination, and evidence. A finding can exist before it has a POA&M. Create or link its remediation commitment, then maintain the POA&M's plan, owner, resources, completion date, and milestones.

5. **Verify closure.** After remediation, collect retest evidence and record the finding's retest determination and assessor. A passing retest closes the finding; a failed retest leaves it in remediation. The original assessment remains on the record. Completing a POA&M requires resolved linked findings and completed milestones. Closing through remediation requires a passing retest; risk acceptance or false-positive disposition requires a recorded rationale. Closing a finding does not independently mark the entire control satisfied.

Schedule has **Plan**, **Tasks**, and **Assignments** views. It consolidates acquisition and RMF milestones, assessment dates, remediation deadlines, workstreams, and accountable people. These views use the underlying assessment, POA&M, and task records. Milestone dependencies must stay within the program and cannot form cycles.

The traceability matrix and exports read these shared records. OSCAL SSPs carry implementation statements and evidence references; assessment plans and results carry objectives, procedures, execution observations, and determinations; POA&M exports carry current remediation commitments and milestones. Imported and newly authored commitments are exported once. All four PRG-1041 OSCAL models were checked against the official **OSCAL 1.1.2 JSON schema**, both with seeded data and after creating an assessment, run, and evidence reference. eMASS exports also use the canonical remediation records.

Changes persist in this browser's local storage, including requirements and allocations, control work, evidence metadata, assessment plans and runs, findings, POA&Ms, and schedule edits. This is a browser-local workspace, without shared server persistence or synchronization between users and devices. Clearing that browser's site storage removes its saved edits.
