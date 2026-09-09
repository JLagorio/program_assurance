# Program assurance workflow

Work starts inside a program and stays attached to that program's systems, requirements, controls, assessments, and remediation records. The program route is `src/routes/programs.$programId.tsx`.

WS-X90 Sentinel Mission System (`PRG-1090`) uses these same tabs and record editors. `platform-ingestion.ts` maps the supplied platform seed into the existing stores before browser edits are restored: 6 subsystems, 20 components, 74 effective controls, 120 requirements, 90 evidence references, 120 assessment results, 16 findings, and 16 POA&Ms. The source snapshot is shipped in `src/data/wsx90-platform-seed.json`; source IDs, UUIDs, and relationships remain available on imported records.

The system control set starts with the source selection and applies its three overlays in order. Child scopes inherit that set and can record further tailoring through the existing controls workflow. Missing evidence stays missing, undated remediation milestones appear as **Unscheduled**, and source closures without retests retain that gap. Imported evidence URNs identify references; they are not downloadable files.

WS-X90 exports include the paired profile and SSP, assessment plan and results, and POA&M. These were checked against the official OSCAL 1.2.3 JSON schema, including cross-document UUID references and preservation of all 16 POA&Ms and 48 undated milestones.

WS-X90's SSP uses the current system tree, including renamed, moved, and added elements, their control selections, and saved implementation work. Parent relationships appear in component links and a supporting hierarchy resource. Imported record UUIDs remain stable; historical assessment results keep their recorded subjects.

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

The program tabs open their full registers. **System** is an editable hierarchy. Its toolbar places **Columns**, **Settings**, then an **Add** dropdown containing **Add subsystem** and **Add component**. **Edit** and **Move** are in each row's action menu. System-table counts and element previews link to requirements allocated to that element or controls applicable to it and its parts. These linked lists name the element and provide **Show all requirements/controls**; changing tabs clears the list filter. There is no shared Scope selector. **Manage control set** opens the element's existing Control set editor.

Expand a control to see its named system/component implementations, with each record's own implementation state, assessment, owner, requirements, and evidence. The collapsed row summarizes those elements: missing implementations count as Unrecorded, and a Satisfied assessment requires every listed element to be assessed as satisfied. Select an element to open that implementation's preview and full record. Requirement records provide separate **Allocate** and **Link controls** actions: allocation names the responsible elements, while a control link explicitly records **Derived from** or **Mapped to**. Requirements can have no control relationship. An inherited control set does not imply that a component has an implementation statement or a passing assessment.

1. **Define the requirement and implementation.** Create or select a requirement and connect it to the applicable control. Allocate the requirement to the responsible element. On the control record, select the relevant system scope, assign an owner, and write the implementation statement. Implementation and assessment are separate states. Control workflow actions enforce their stated role and evidence gates; revising a satisfied control's narrative requires reassessment.

2. **Add supporting evidence.** Add an artifact from Evidence, a control record, or a requirement record. Supply its repository URL, title, collection date, owner, version, provenance, and program or system scope. Link it to the implementation or requirement it supports. The same reference appears in the inventory and linked records. Evidence linked to one engineering requirement is not treated as supporting its siblings.

   A control's **Supporting evidence** table identifies implementation links separately from requirement links. **Link evidence…** lets you choose the claim before selecting an existing artifact or adding a reference. Selecting an artifact opens its named supporting records, scope, provenance, review, and exact assessment run. Unlinking a component implementation preserves the artifact's other relationships. **View SSP** opens the existing OSCAL export of the saved implementation records.

   Evidence currently stores **URL references and metadata, not uploaded file contents**. Opening an artifact follows its repository URL; that repository controls access. Seed references without a location are identified as such. Artifact review records suitability as Pending review, Accepted, or Needs revision, with a reviewer and rationale. Accepting evidence does not produce a passing assessment verdict.

3. **Assess the claim.** In Assessments, create an assessment with an objective, method, procedure, acceptance criterion, owner, and dates. Connect the requirement and subject where applicable. Start a run against a named build or configuration. Record each step's observed behavior, result, and supporting program evidence, then complete the run when the required records are present. Requirement coverage follows execution results. Retesting creates a separate run and preserves the previous execution.

4. **Record and remediate deficiencies.** Raise a finding from an assessment or create it in Findings. Specify the control, affected asset or system scope, applicable requirements, severity, owner, determination, and evidence. A finding can exist before it has a POA&M. Create or link its remediation commitment, then maintain the POA&M's plan, owner, resources, completion date, and milestones.

5. **Verify closure.** After remediation, collect retest evidence and record the finding's retest determination and assessor. A passing retest closes the finding; a failed retest leaves it in remediation. The original assessment remains on the record. Completing a POA&M requires resolved linked findings and completed milestones. Closing through remediation requires a passing retest; risk acceptance or false-positive disposition requires a recorded rationale. Closing a finding does not independently mark the entire control satisfied.

Schedule has **Plan**, **Tasks**, and **Assignments** views. It consolidates acquisition and RMF milestones, assessment dates, remediation deadlines, workstreams, and accountable people. These views use the underlying assessment, POA&M, and task records. Milestone dependencies must stay within the program and cannot form cycles.

The traceability matrix and exports read these shared records. OSCAL SSPs carry implementation statements and evidence references; assessment plans and results carry objectives, procedures, execution observations, and determinations; POA&M exports carry current remediation commitments and milestones. Imported and newly authored commitments are exported once. All four PRG-1041 OSCAL models were checked against the official **OSCAL 1.1.2 JSON schema**, both with seeded data and after creating an assessment, run, and evidence reference. eMASS exports also use the canonical remediation records.

Changes persist in this browser's local storage, including system-tree edits, requirements and allocations, control work, evidence metadata, assessment plans and runs, findings, POA&Ms, and schedule edits. This is a browser-local workspace, without shared server persistence or synchronization between users and devices. Clearing that browser's site storage removes its saved edits.

## Try the control and evidence flow

1. Open WS-X90 (`PRG-1090`), open **Controls**, expand **AU-6**, and select **Mission Computer → Open control**. The record should show `REQ-015`, `REQ-089`, and evidence `EVD-015`/`EVD-089`, with each artifact's supporting relationships named.
2. Revise the implementation statement, save, and reload. The saved text remains under Mission Computer. **View SSP** opens the export; the AU-6 component statement contains the revision.
3. Open `EVD-015`. Its supporting-record table names the implementation scopes, `REQ-015`, `FND-002`, and `TR-109015`. The seeded artifact is a reference without a downloadable file.
4. Unlink **AU-6 / Mission Computer**, then close the preview. `EVD-015` remains because it still supports `REQ-015`, but its **Implementation** label disappears. Reload, then use **Link evidence…** to select the AU-6 implementation and relink `EVD-015`.
5. In **Link evidence…**, choose `REQ-015` and add a new evidence reference with a valid repository URL and provenance. It appears in the program Evidence inventory and supports `REQ-015`; it does not automatically support the implementation or `REQ-089`.
6. Review `EVD-015` as Accepted. Accepting evidence leaves the selected implementation's assessment unchanged. Open `TR-109015` from the evidence preview: the run is **Not met** and covers three components. Reload retains that run. `TR-109089`, linked from `EVD-089`, is a different, passing run.
7. Follow `FND-002` and `POAM-002` from the control record. Both open their existing records within the program's tabs.

## Try the system and requirement relationships

1. Open **System**. Open **Add** after Columns and Settings, choose **Add subsystem** or **Add component**, choose a parent, name the element, and save. It appears under that parent; reload retains it.
2. Open the row's **…** action menu and choose **Edit** to rename it or **Move** to choose a different parent. The element keeps its ID and relationships. You cannot move the root or place an element beneath itself or a descendant.
3. Select **Mission Computer** and follow **View allocated requirements**. The list names Mission Computer. **Show all requirements** restores the full register; choosing another program tab also opens that tab's full register.
4. Open a requirement. **Allocate** selects responsible system elements. **Link controls** separately selects controls, a mapped/derived relationship, and rationale. Linking controls leaves allocations unchanged, and allocating leaves control relationships unchanged. Reload retains both.
5. In **Controls**, expand **AU-6** and compare the named implementation rows. Choosing Mission Computer opens its own statement and evidence, rather than silently selecting the system-level record. The program's assessment action also requires choosing both the control and the system/component.
6. Select the component you added and open its control record. It starts Unrecorded and Not assessed. Write its implementation, then open **View SSP**. The export contains the new element and its saved narrative; renamed elements and parent relationships also reflect the edited tree.
