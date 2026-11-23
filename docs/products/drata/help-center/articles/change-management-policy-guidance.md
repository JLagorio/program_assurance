# Change Management Policy Guidance

Source: https://help.drata.com/en/articles/8364890-change-management-policy-guidance
Collection: Policy Guidance
Updated: 2026-08-05
Fetched: 2026-11-22

## Article text

The following article provides guidance on parts of the Change Management Policy that often raise questions, offering clarity on what each section means.

Guidance statements will appear in bold and enclosed in brackets “**[ ]**” below the statements of the policy.

### Change Management Policy

### [COMPANY NAME]

____________________________________________________________________________

### Purpose

This policy establishes [COMPANY NAME]’s processes to manage changes across the organization in a well-communicated, planned and predictable manner that minimizes unplanned outages and unforeseen system issues.

### Roles and Responsibilities

**[Please see here for more guidance on roles and responsibilities: [https://help.drata.com/en/articles/5829670-roles-and-responsibilities-guidance](roles-and-responsibilities-guidance.md). For example, “Who is responsible for updating, reviewing, and maintaining this policy?” The statement may become *“The Chief Information Security Officer (CISO) is responsible for updating, reviewing, and maintaining this policy*.”]**

### Policy

This policy communicates [COMPANY NAME] management’s intent to implement IT-supported business processes in a way that minimizes risk and impact to [COMPANY NAME] and its operations. [COMPANY NAME] will manage all system and application changes subject to this policy (e.g. operating system, computing hardware, networks, applications, data centers) in accordance with the applicable change management procedures.

### Procedures

The objective of this process is to manage the introduction of any change into production by ensuring that the correct procedures are being followed, proper documentation has been completed, proper testing has been performed, and proper approval is in place.

### Organizational Change Control

The following procedures apply to all changes, including infrastructure, code, and networking changes, as well as the deployment of new hardware:

- Changes to all system components must be documented along with a description of the change.
- Documentation of the security impact of the change must be documented
- Testing must be performed to verify that the change does not adversely impact system security.
- Procedures to address failures and return to a secure state must be documented.
- Controls and integrity procedures will be reviewed to ensure that they will not be compromised by the changes.
- Security critical code to minimize the likelihood of known security weaknesses will be identified and checked.
- Formal approval must be obtained for detailed proposals before work begins.
- Authorized users must accept changes prior to implementation.
- Changes will be implemented at a time that is least intrusive to business processes involved.
- Pre-production environments will be separated from production environments and the separation will be enforced with access controls.
- Test data and accounts will be removed before placing new and updated systems into production.
- Vendor-supplied software will be used without modification; in the event that a modification is necessary, the following will be evaluated:
   - Risk of compromising built-in controls and integrity processes
   - Vendor consent
   - Getting the modifications from vendor as standard updates
   - Impact of owning the responsibility for maintaining the program
   - Compatibility with other software in use.
- A technical review of applications will be conducted after changes to operating platforms (operating systems, databases and middleware platforms). The review will include:
   - Application control and integrity procedures to ensure that they have not been compromised by the operating platform changes.
   - Timely notification of operating platform changes to allow appropriate tests and reviews to take place before implementation.
   - Appropriate changes are made to the business continuity plans.
- Customers must be notified of major changes (new subprocessor, etc.) or changes that may lead to system downtime, at least <TIME PERIOD> prior to their deployment to the production environment.
   - **[We recommend at least 24 hour notice be provided to customers before the deployment of major changes. There is no set definition for what constitutes a “major change” and this is somewhat flexible. If the change has the potential to impact a customer, it should be communicated to that customer.]**
- [COMPANY NAME] will provide its cloud service customers information about any changes to the cloud service that could negatively affect the service. Such details will include:
   - The categories of changes.
   - The planned date and time for the changes.
   - A technical description of the alterations to the cloud service and the underlying systems.
   - Notification of the commencement and completion of the changes.
- When [COMPANY NAME] depends on a peer cloud service provider, [COMPANY NAME] will inform cloud service customers of changes triggered by the peer cloud service provider.
   - **[This statement means that if a change made by one of your vendors affects the service you provide, you will notify your customers accordingly.]**

**[These items pertaining to *cloud service customers* are OPTIONAL for SOC 2, but may be REQUIRED for other frameworks such as ISO 27017:2015.]**

### Planned Changes

For planned changes, [COMPANY NAME] will:

- Plan the implementation and assign tasks, responsibilities, deadlines and resources;
- Implement changes according to the plan; and,
- Monitor the implementation to confirm that they are implemented according to the plan.

**[Planned changes are changes that you are aware of before any work begins.]**

### Unplanned Changes

For observed unintended changes, [COMPANY NAME] will:

- Review consequences of the changes;
- Evaluate the occurrence or potential for occurrence of any adverse effects;
- Plan and implement actions to mitigate any adverse effects as necessary;
- In the case of Emergency Changes (e.g., when a critical vulnerability is discovered and needs to be resolved immediately), an expedited process may be conducted.

**[Unplanned changes are changes that could not be planned ahead of time, such as hotfixes, emergency code updates, unintended modifications, or unreported changes.]**

### Software Development

For software development, operating system applications and software changes will only be implemented after extensive and successful testing:

- The tests will cover:
   - Usability
   - Security
   - Effects on other systems
   - User- friendliness
      - **[While we recommend this set of tests, the list can be adjusted as needed; however, Security testing will remain mandatory.]**
   - Tests will be conducted on separate systems (test environment), and all corresponding program source libraries will also be updated, as appropriate.
- The operational software, applications and program libraries of [COMPANY NAME] will only be updated by trained administrators upon appropriate management authorization.
- Company operational systems will only hold approved executable code, not development code or compilers.
- A configuration control system will be used to keep control of all implemented software as well as the system documentation.
   - Previous versions of software will be retained as a contingency measure.
   - Old versions of software will be archived, together with all required information and parameters, procedures, configuration details and supporting software for as long as the data are retained in the archive.
- The utility programs of [COMPANY NAME] will only be accessible to a minimum practical number of authorized users in conjunction with [COMPANY NAME]’s *System Access Control Policy*. The use of utility programs will require:
   - Use of identification, authentication and authorization procedures;
   - Defining and documenting of authorization levels and ad-hoc use for utility programs;
   - Not making utility programs available to users who have access to applications on systems where segregation of duties is required;
   - Removing or disabling all unnecessary utility programs;
   - At a minimum, logical segregation of utility programs from application software. Where practical, segregating network communications for such programs from application traffic;
   - Limitation of the availability of utility programs (e.g. for the duration of an authorized change);
   - Logging of all use of utility programs.
      **[Utility programs can also be termed as “administrative tools”. Examples would include the administrative console of a Mobile Device Management (MDM) or Antivirus tool.]**

- There will be a rollback strategy in place before changes are implemented.
- An audit log will be maintained of all updates to operational program libraries.
- All decisions to upgrade to a new version release must take into account:
   - Business requirements for the change
   - Security of the release, e.g. the introduction of new information security functionality or the number and severity of information security problems affecting this version.
- Change security measures will be in place, to include:
   - Branch protection rules (GitHub);
   - Review & approval from the security team in case of significant changes;
   - Changes deployed to production only by specifically authorized personnel with escalated privileges; and,
   - Post deployment QA testing to ensure the change is functioning as intended in the production environment.

### Supplier Services

Management of changes to supplier services is covered in the *Vendor Management Policy* in the Policy Center.

### Configuration Management

For configuration management, production and system network changes will only be implemented with properly conducted procedures:

- <TOOL NAME> are used to standardize and automate configuration management.
   - **[While an automated tool is not required, it is recommended due to the effort required to manage configurations manually. Some examples of full stack configuration management solutions would be FreshService, ManageEngine Service Desk Plus, or ServiceNow’s Configuration Management Database module. Multiple tools can be used, such as Terraform to manage infrastructure deployment with Jenkins to configure application deployments.]**
- No systems are deployed into [COMPANY NAME] environments without approval of the [COMPANY NAME] CIO.
- All changes to production systems, network devices, and firewalls are approved by the [COMPANY NAME] CIO before they are implemented to assure they comply with business and security requirements.
- Impact/ROI analysis is conducted for designated changes (e.g., key management-related changes).
   - **[This item is OPTIONAL for SOC 2, but may be REQUIRED for other frameworks such as CCM.]**
- All changes to production systems are tested before they are implemented in production.
- Implementation of approved changes are only performed by authorized personnel.
- Tooling to generate an up-to-date inventory of systems, including corresponding architecture diagrams for related products and services, is hosted on <SYSTEM NAME>.
- All frontend functionality (developer dashboards and portals) is separated from backend (database and app servers) systems by being deployed on separate servers or containers.
- All software and systems are tested using unit tests and end to end tests.
- All committed code is reviewed using pull requests to assure software code quality and proactively detect potential security issues in development.
- [COMPANY NAME] utilizes development and staging environments that mirror production to assure proper function.
- [COMPANY NAME] also deploys environments locally using Vagrant to assure functionality before moving to staging or production.
- All formal change requests require unique ID and authentication.
- Identities assigned to multiple persons (e.g. shared identities) are only permitted where they are necessary for business or operational reasons and are subject to dedicated approval and documentation.
- Clocks are continuously synchronized to an authoritative source across all systems using a single reference time source. Modifying time data on systems is restricted.
- When configuring virtual networks, the consistency of configurations between virtual and physical networks will be verified based on [COMPANY NAME] policies.
   - [COMPANY NAME]’s information security policy for the virtual network and the physical network are aligned and consistent.
   - The virtual network's configuration aligns with the information security policy, irrespective of the means employed to create the configuration.
   - **[These items are OPTIONAL for SOC 2, but may be REQUIRED for other frameworks such as ISO 27017:2015.]**

These procedures will be reflected in [COMPANY NAME]’s Configuration Management Plan (see Appendix A).

**[Configuration Management is required for ISO 27001. Although ISO 27001 does not mandate the use of an automated system, its implementation guidance strongly recommends it.]**

### APPENDIX A

**Configuration Management Plan [Template]**

- **[This appendix is meant to be completed, with the purpose of describing how you manage the configurations relevant to your organization and/or a specific system within your organization. This is an example template, and the specific elements or formatting of this template are not required for a specific framework and can therefore be replaced with another template or format as appropriate.]**

### 1. General Information

| **Purpose** |
|---|
| *Describe the purpose of the Configuration Management Plan* |

- ##### [In this field, you would describe what the Configuration Management Plan does for the organization, such as: “*The purpose of this plan is to outline how configurations for systems, application, code, and networks within the organization are determined, managed, monitored, and changed.”*]

| **Scope** |
|---|
| *Describe the scope of the Configuration Management Plan as it relates to the project.* |

- **[In this field, you would describe the specific systems covered by this plan.]**

| **System Overview** |  |
|---|---|
|  | *Provide a brief system overview description as a point of reference for the remainder of the document.  In addition, include the following:* |
| **Responsible Organization** |  |
| **System Name/Title** |  |
| **System Code** |  |
| **System Category** | - *Major application: performs clearly defined functions for which there is a readily identifiable security consideration and need*<br>- *General support system: provides general ADP or network support for a variety of users and applications* |
| **Operational Status** | - *Operational*<br>- *Under development*<br>- *Undergoing a major modification* |
| **System Environment/ Special Conditions** |  |

- **[These fields just provide specific identifying elements of your system/organization. Any of these fields may be removed, fields may be added, or this entire table may be removed. Conversely, multiple tables can be added if multiple systems are being covered by this plan.]**

| **Project References** |
|---|
| *Provide a list of the references that were used in preparation of this document.  Examples of references are:*<br>- *Previously developed documents relating to the project*<br>- *Documentation concerning related projects*<br>- *[COMPANY NAME] standard procedures documents* |

- **[This section is asking for any previous documentation you’ve maintained related to these systems and where it can be found, and any related project documentation if you used an outside project as inspiration for your configuration management approach. This section can also be removed.]**

| **Acronyms & Abbreviations** |
|---|
| *If applicable, provide a list of the acronyms and abbreviations used in this document and the meaning of each.* |

- **[If there are any acronyms or abbreviations that will be used throughout the configuration management plan, they should be listed here.]**

|  | **Points of Contact** |
|---|---|
| **Information** | *Provide a list of the points of organizational contact (POC) who may be needed by the document user for informational and troubleshooting purposes.  Include type of contact, contact name, department, telephone number, and e-mail address (if applicable).  Points of contact may include, but are not limited to, helpdesk POC, development/maintenance POC, and operations POC.* |
| **Coordination** | *Provide a list of organizations that require coordination between the project and its specific support function (e.g., installation coordination, security, etc.).  Include a schedule for coordination activities.* |

- **[This table is for listing out the points of contact who are responsible for the systems covered by this document.]**

### 2. Configuration Control

| **Change Control Board (CCB)** |
|---|
| *The Change Control Board (CCB) is a project-level, decision-making body that must approve or disapprove all change control requests before they can be implemented.  The CCB acts on those changes that would cause material or substantive changes to the system, including design specifications, budget (including lifecycle cost projections), the project schedule, and interface characteristics with other systems.*<br>*Describe the project CCB, its roles and responsibilities, and the membership.  The interaction between the CCB and management should also be presented in this section.  If the CCB is divided into separate organizations, such as a main CCB, a software management board, or a technical review board, indicate such in this section.  Identify the roles and responsibilities, participants, and interaction between each group, and management.*<br>*In addition, describe the CM organization as well as the relationship to other project entities and management management. Present the roles and responsibilities of each organization, and management area(s) within each organization, that will affect the CM function.* |

- **[This section is defining a Change Control Board. Your organization may not have a Change Control Board, in which case this section should be removed.]**

| **Configuration Items** |  |
|---|---|
|  | *Configuration items (CI) are the products that are to be placed under configuration control.* |
| **Management ** | *Documentation describing the processes used to develop (or manage the development of) the system.* |
| **Technical ** | *Documentation or baselines describing the system (e.g., Functional Requirements Document)* |
| **Software ** | *Computer programs, operating systems and support tools, etc.* |
| **Data & Database ** | *Files and records that exist apart from software, which access the contents of a database)* |
| **Network ** | *As applicable* |
| **Hardware** | *Computer workstations, peripherals, servers and routers if applicable, etc.* |
| **Other** | *Other components that management may wish to include at its discretion.* |

- **[This table is for defining the specific components that need to have their configuration managed. So what documentation/processes need to have their configuration managed? That would be listed under Management. What software needs to have its configuration managed? That would be listed under Software, etc. All of these fields are optional and can be adjusted as appropriate.]**

| **Baseline Identification** |  |
|---|---|
|  | *A baseline is a collection of information describing the technical characteristics of each CI.  Baselines serve as technical control points in the lifecycle for the evaluation of proposed changes to these technical characteristics.  The baseline and the approved changes or modifications provide a current description of the system.*<br>*Describe each system baseline, identified below, and the process by which it will be established and managed.  This should include, but is not limited to, the physical contents of the baseline, including the code being developed.  The physical contents may include hard copies of documentation and commercial off-the-shelf (COTS) software.  A graphic may also be created to depict where in the lifecycle process each baseline is generated and who becomes the responsible party of the identified baseline.* |
| **Functional Baseline ** | *The functional baseline, sometimes called the requirements baseline, is the main product of the Define System Phase and is managed in accordance with the Functional Requirements Document and Data Requirements Document.  Include a subsection for software and documentation, including design documentation, if applicable.*<br>*Describe where in the lifecycle the functional baseline will be established and the process by which it will be managed for this project. * |
| **Design Baseline** | *The design baseline reflects activities performed during the Design System Phase.  Its major component is a system/subsystem specification that defines the overall system design in terms of its subsystems, the allocation of requirements to subsystems and interfaces between subsystems and external systems.  The user acceptance evaluation criteria component of this baseline is defined in the Verification, Validation and Test (VV&T) Plan.  The user acceptance evaluation criteria are not a separate document but are a major element of the design baseline.  Include a subsection for software and documentation, including design documentation, if applicable.*<br>*Describe where in the lifecycle the design baseline will be established and the process by which it will be managed for this project.* |
| **Development Baseline ** | *The development baseline, generated during the Build System Phase, defines the detailed structure of the system being implemented.  The development baseline’s major components are the generation of the computer programs (code) and the database.  Other components are the training documentation, user’s, operations, and maintenance documentation.  Include a subsection for software, documentation, etc., if applicable.*<br>*Describe where in the lifecycle the development baseline will be established and the process by which it will be managed for this project.  * |
| **Product Baseline** | *The product baseline is established during the Evaluate System Phase.  The product baseline’s major component is the end system product as built by the developers.  This includes the following:*<br>- *Software*<br>- *Design and specification documentation*<br>- *Manuals (user, operations, maintenance, etc.)*<br>- *Installation and conversion procedures*<br>*The product baseline is established after successful completion of the functional configuration audit (FCA), physical configuration audit (PCA) and associated system products and audit results presented at the Evaluate System review.  This baseline incorporates all changes needed to resolve problems detected during system acceptance and release testing and any discrepancies between the system, its requirements, and design documentation.*<br>*Describe where in the lifecycle the product baseline will be established and the process by which it will be managed for this project. * |

- **[This table is where you define the baselines (the standard configurations you want to have) at the different stages of software/application development. If you use a different software development lifecycle, you may adjust these stages. It is fine to end up with a single baseline as well, if that is more manageable. But the baseline should list things such as software versions for libraries, operating system versions, etc.]**

| **Impact/ROI Analysis** |  |  |  |  |
|---|---|---|---|---|
|  |  |  |  | *An impact or ROI analysis is the process of comparing the projected or estimated costs and benefits (or opportunities) associated with a change to determine whether it makes sense from a risk and business perspective.*<br>*Describe any process that may require an impact/ROI analysis below. Analyze the downstream effects and potential residual risk, and record the estimated and actual ROIs. Conduct an audit in the event of significant deviation between the values and report to system authority.* |
| **CHANGE TYPE** | **IMPACT ** | **ESTIMATED ROI** | **ACTUAL ROI** | **ROI DEVIATION** |
| **Key Management-related Change** |  |  |  |  |
| **+** |  |  |  |  |

- **[This table is used to identify any significant changes that could have an impact on your system/systems that would require additional consideration. The example here is “Key Management-related Change”, so if someone managing this system/systems were to leave the company and be replaced. Another example could be “Operating System no longer supported” or “AWS service deprecated”, essentially changes that may require you to evaluate large portions of your systems and may require other changes to be made.]**

|  | **Roles & Responsibilities** |
|---|---|
| **<Role 1>** | *Responsibilities* |
| **<Role 2>** | *Responsibilities* |
| **+** |  |

- **[This table is for outline roles and responsibilities as they relate to your system or systems. So who manages the systems on a day-to-day basis? Who is responsible for security? Who actually owns the whole system or systems? etc.]**

### 3. Training

| **Training Approach** |
|---|
| *Provide information regarding the content and scheduling of CM training to be conducted for all personnel supporting the project.  Train project personnel, including those assigned responsibility for performing CM activities, in the objectives, procedures, and methods for performing their CM-related duties.  Examples of training include the following:*<br>- *Role, responsibility, and authority of the CM personnel;*<br>- *CM standards, procedures, and methods;*<br>- *CM tools and their capabilities; and*<br>- *Data measurement, analysis, and reporting.* |

- **[This section is listing out how you train personnel on the Change Management process. Separate change management training is not specifically required and if you do not intend to implement this training, this section may be removed.]**

### 4. Change Control Process

| **Change Classification** |  |
|---|---|
|  | *Describe how change classifications will be determined and assigned in terms of the level of severity of their impact.  Selection factors may include:*<br>- *Criticality*<br>- *Interface requirements*<br>- *Change sensitivity*<br>- *Schedule*<br>- *Ownership*<br>- *Scope and complexity* |
| **<Classification 1>** | *Description* |
| **+** |  |

- **[This section is for listing out the different levels of changes based on criticality, such as Major, Minor, Emergency, Bugfix, etc.]**

| **Change Control Forms** |  |
|---|---|
|  | *Document the flow that generated change control forms will follow from initiation through approval or disapproval.  Additionally, describe the forms that may be included in the change control process such as:*<br>- *Needs Statement*<br>- *Requirements Change*<br>*Include sample forms in this plan.  These forms may include, but not be limited to, problem reports, system change requests, impact analysis reports, and change authorization notices.* |
| **Form Flow** | *Describe* |
| **Form Types** | *List and Describe* |

- **[This section is for listing out the forms required to submit change requests or requests for new projects.]**

| **Problem Resolution Tracking** |
|---|
| *Describe the process used to log project problem requests and initiate resolution.* |

- **[This table is for listing out your process for logging and tracking issues discovered with any changes/projects through remediation.]**

| **Measurements** |
|---|
| *Define the measurements used to determine the status of CM activities, the effectiveness of CM processes, and the stability of controlled baseline deliverables.* |

- **[This table is for listing out how you intend to measure the change management process, such as number of requests, time spent on requests, missed/slipped milestones, number of bugfixes required, etc.]**

| **Configuration Status Accounting** |  |
|---|---|
|  | *All CM activities are recorded, stored, and reported by the CSA function.  The CSA function is a discipline that provides managers with feedback to determine whether decisions of the CCB are being implemented as directed.  As approved changes are executed, the CSA function records and files data concerning the appropriately modified software, hardware, and documentation.  The CSA function is responsible for identifying and issuing the most current approved versions of the CM-controlled items to project participants.*<br>*Identify the format and contents of the status summary reports that will be produced by the CSA function, and include them in an appendix to this plan.  Describe how the audit trail will be kept that identifies all changes implemented on approved baseline deliverables.  Examples may include using hard copy, diskettes (hard or compact), or a COTS tool.  *<br>*Outline the processes and describe how captured information will be used to accomplish functions such as assuring that the software meets the design intent, contractual requirements are satisfied, and testing is performed in accordance with test plans.* |
|  |  |
|  |  |

- **[Change Status Accounting is the process of updating documentation, such as this plan, as changes happen to ensure that documentation is correct. This table is for outlining the process you use to perform Change Status Accounting.]**

| **Configuration Management Libraries** |  |
|---|---|
|  | *For each library (development, pilot, production, etc.), describe the organization of the CM library, including the multiple divisions of the library (the technical support library that stores the project development and production deliverables, the configuration library that contains records kept in support of the CCB, and the reference library consisting of technical documents that are either government-produced or COTS).  Each library type should be discussed in a separate subsection.* |
| **Development** | *Description* |
| **Production** | *Description* |
| **+** |  |

- **[This table is for listing out where you keep the documentation, copies of software, etc. for each environment, such as Development, Production, etc.]**

| **Release Management** |
|---|
| *Discuss the means by which the release of all project CIs will be managed.* |

- **[This table is for explaining how you manage releases.]**

### Revision History 

| **Version** | **Date** | **Editor** | **Approver** | **Description of Changes** | **Format** |
|---|---|---|---|---|---|
|  |  |  |  |  |  |
|  |  |  |  |  |  |
|  |  |  |  |  |  |

**[Version: This indicates which iteration of the policy document this is**

**Date: This indicates when the policy document was last updated**

**Editor: This is the person who wrote or revised the policy document**

**Approver: This is the person who reviewed and approved the policy document for official publication**

**Description of Changes: This provides a summary of the revisions made to the policy document since the previous version**

**Format: This refers to the way the policy document is presented. If you are using Drata’s Policy template, you can indicate this as “.PDF”**

**It is common and acceptable for smaller organizations to have the writer of the policy to be the same person as the approver]**

## Related articles

- [Asset Management Policy Guidance](asset-management-policy-guidance.md)
- [Vulnerability Management Policy Guidance](vulnerability-management-policy-guidance.md)
- [Software Development Lifecycle (SDLC) Policy Guidance](software-development-lifecycle-sdlc-policy-guidance.md)
- [System Security Planning Policy Guidance](system-security-planning-policy-guidance.md)
- [System and Information Integrity Policy Guidance](system-and-information-integrity-policy-guidance.md)
