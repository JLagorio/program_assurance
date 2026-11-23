# Business Continuity Plan Guidance

Source: https://help.drata.com/en/articles/6630838-business-continuity-plan-guidance
Collection: Policy Guidance
Updated: 2026-08-05
Fetched: 2026-11-22

## Article text

The following article contains guidance explaining portions of the Business Continuity Plan that we frequently see questions around, explaining what the sections mean.

Guidance statements will appear in bold and enclosed in brackets “**[ ]**” below the statements of the policy. Additionally, an example of a completed Business Continuity Plan is also available: [https://help.drata.com/en/articles/6232796-example-business-continuity-plan](example-business-continuity-plan.md)

### Business Continuity Plan

### [COMPANY NAME]

__________________________________________________________________

### Purpose

This policy establishes procedures to recover [COMPANY NAME] following a disruption in conjunction with the *Disaster Recovery Plan*.

### Policy

[COMPANY NAME] policy requires that:

- A plan and process for business continuity, including the backup and recovery of systems and data, must be defined and documented.
- The Business Continuity Plan shall be simulated and tested at least once a year. Metrics shall be measured and identified recovery enhancements shall be filed to improve the process.

**[BCP/DR tests may include tabletop exercises, technical failover simulations, or live incident walkthroughs. Testing methods should be risk-based and aligned with the organization’s operational complexity.]**

- Security controls and requirements must be maintained at primary and alternate/backup sites during all Business Continuity Plan activities, and disruptions.

### Roles and Responsibilities

This Policy is maintained by the [COMPANY NAME] Security Officer and Privacy Officer. All executive leadership shall be informed of any and all contingency events.

**[These roles and responsibilities can be updated as needed and the text listed here is simply a suggestion for commonly used roles related to the BCP. Succession roles should reflect real internal leadership structure and include alternates. Ensure that those named have authority and knowledge to activate and execute the BCP.]**

### Line of Succession

The following order of succession ensures that decision-making authority for the [COMPANY NAME] Business Continuity Plan is uninterrupted. The CEO is responsible for ensuring the safety of personnel and the execution of procedures documented within this Plan. The Head of Engineering is responsible for the recovery of [COMPANY NAME] technical environments. If the CEO or Head of Engineering is unable to function as the overall authority or chooses to delegate this responsibility to a successor, the Business Operations Lead shall function as that authority or choose an alternative delegate.

**[These roles and responsibilities can be updated as needed and the text listed here is simply a suggestion for commonly used roles related to the BCP.]**

### Response Teams and Responsibilities

The following teams have been developed and trained to respond to a contingency event affecting [COMPANY NAME] infrastructure and systems.

- HR & Facilities is responsible for ensuring the physical safety of all [COMPANY NAME] personnel and environmental safety at each [COMPANY NAME] physical location. The team members also include site leads at each [COMPANY NAME] work site. The team leader is the Head of HR who reports to the CEO.

**[If your organization is fully remote, remove references to physical offices and clarify that HR is responsible for tracking changes in remote work locations, especially during large-scale outages.]**

- DevOps is responsible for assuring all applications, web services, platforms, and their supporting infrastructure in the Cloud. The team is also responsible for testing re-deployments and assessing damage to the environment. The team leader is the Head of Engineering.
- Security is responsible for assessing and responding to all cybersecurity related incidents according to [COMPANY NAME] Incident Response policy and procedures. The security team shall assist the above teams in recovery as needed in non-cybersecurity events. The team leader is the Security Officer.

Members of the above teams must maintain local copies of the contact information of the Business Continuity Plan succession team. Additionally, the team leads must maintain a local copy of this policy in the event Internet access is not available during a disaster scenario.

**[These team roles are illustrative and should be tailored to your actual personnel structure. Ensure all assigned team leads understand their roles and have access to offline copies of the BCP.]**

### Policy

### Operational Resilience Strategy

[COMPANY NAME]'s strategies for operational resilience take a holistic approach to the company and its business process and are developed with consideration of acceptable limits regarding the company's risk appetite and tolerance. These strategies are developed through:

- Risk assessment: to identify internal and external threats to the company's ability to conduct business particularly in the areas of technology, human resources, facilities, and third parties;
- Vulnerability analysis: to identify weaknesses that could raise the level operational disruption risk;
- Business impact analysis: (a) to define mission critical business processes, along with the technology, people and facilities that enable them; and, (b) to assess the potential effects on the company if those processes cannot be performed.

### Business Impact Analysis (BIA)

The BIA will determine the criticality of business activities to ensure operational resilience and business continuity during and after a disruption. The BIA will help identify and prioritize system components by correlating them to the business processes that the system supports. It will allow for the characterization of the impact on the processes if the system becomes unavailable. The BIA has three steps:

- **Determine business processes and recovery criticality.  **Business processes supported by the system are identified and the impact of a system disruption to those processes is determined along with outage impacts and estimated downtime.  The downtime should reflect the maximum that an organization can tolerate while still maintaining the mission.
- **Identify resource requirements.**  Realistic recovery efforts require a thorough evaluation of the resources required to resume mission/business processes and related interdependencies as quickly as possible.  Examples of resources that should be identified include facilities, personnel, equipment, software, data files, system components, and vital records.
- **Identify recovery priorities for system resources.**  Based upon the results from the previous activities, system resources can more clearly be linked to critical mission/business processes.  Priority levels can be established for sequencing recovery activities and resources.
- See Appendix A for the BIA breakdown.

**[This section explains the purpose and steps of a Business Impact Analysis (BIA), which assesses how critical each business process/activities is to the organization. It helps identify which systems and resources are most essential to keep operations running during and after a disruption, and prioritizes recovery efforts based on business impact.]**

### Work Site Recovery

In the event a [COMPANY NAME] facility is not functioning due to a disaster, employees will work from home or locate to a secondary site with Internet access, until the physical recovery of the facility impacted is complete.

[COMPANY NAME]’s software development organization has the ability to work from any location with Internet access and does not require an office provided Internet connection.

**[For fully remote companies, replace this section with language confirming that all personnel are equipped to work remotely with secure internet access.]**

### Application Service Event Recovery

[COMPANY NAME] maintains a status page to provide real time updates and inform customers of the status of each service. The status page is updated with details about an event that may cause service interruption / downtime. [COMPANY NAME]’s status page:

**<STATUS PAGE URL>**

**[You are not required to create a status page on your website. This is a best practice statement, and if you do not intend to implement one, you can delete this section.]**

**APPENDIX A**

**Business Impact Analysis**

**[For Appendix A. Please review the full example of the Business Impact Analysis, it can be found here: [https://help.drata.com/en/articles/6232796-example-business-continuity-plan](example-business-continuity-plan.md).]**

**System Description**

<Provide a general description of system architecture and functionality.  Indicate the operating environment, physical location, general location of users, and partnerships with external organizations/systems. Include information regarding any other technical considerations that are important for recovery purposes, such as backup procedures. Provide a diagram of the architecture, including inputs and outputs and telecommunications connections.>

**[The System Description should be a high level description of the systems you want to cover. This may be your entire organization or may be limited to a specific application which you provide/deliver to customers.]**

**Data Collection **

*<*Data collection can be accomplished through individual/group interviews, workshops, email, questionnaires, or any combination of these.>*  *

**[The Data Collection section covers how you collected the information to fill out this appendix. This may be through meetings, surveys, or even just a single person completing all sections of this appendix.]**

**STEP 1. Determine Process and System Criticality**

Identify the specific business processes that depend on or support the information system, using input from users, managers, business process owners, and other internal or external points of contact.

| **BUSINESS PROCESS** | **DESCRIPTION** |
|---|---|
|  |  |
|  |  |
|  |  |

**[Business processes are key organizational functions, such as HR, Engineering, Finance, Sales, and Legal. You may break them down further (e.g., Recruiting, Payroll), but general groupings are sufficient for most BIA exercises.]**

### Outage Impacts

Impact categories and values characterize levels of severity to the company that would result for that particular impact category, if the business process could not be performed. These impact categories and values are samples and should be revised to reflect what is appropriate for the organization.

| **BUSINESS PROCESS** | **IMPACT CATEGORY** |  |  |  |  |
|---|---|---|---|---|---|
|  | **<CAT 1>** | **<CAT 2>** | **<CAT 3>** | **<CAT 4>** | **IMPACT** |
|  |  |  |  |  |  |
|  |  |  |  |  |  |
|  |  |  |  |  |  |

**[You define the items labeled <CAT 1>, <CAT 2>, etc. These are potential types of impacts that an outage could create, such as Cost, Data Loss, Reputational Damage, etc.]**

### Estimated Downtime 

Downtime factors resulting from a disruptive event will be estimated by working directly with business process owners, departmental staff, managers, and other stakeholders. The following downtime categories will be considered:

- **Maximum Tolerable Downtime (MTD).** The MTD represents the total amount of time managers are willing to accept for a business process outage or disruption and includes all impact considerations. Determining MTD is important because it could leave continuity planners with imprecise direction on:
   - Selection of an appropriate recovery method; and
   - The depth of detail which will be required when developing recovery procedures, including their scope and content.
- **Recovery Time Objective (RTO).** RTO defines the maximum amount of time that a system resource can remain unavailable before there is an unacceptable impact on other system resources, supported business processes, and the MTD.  Determining the information system resource RTO is important for selecting appropriate technologies that are best suited for meeting the MTD.
- **Recovery Point Objective (RPO).** The RPO represents the point in time, prior to a disruption or system outage, to which business process data must be recovered (given the most recent backup copy of the data) after an outage.

| **BUSINESS PROCESS** | **MTD** | **RTO** | **RPO** |
|---|---|---|---|
|  |  |  |  |
|  |  |  |  |
|  |  |  |  |

**[These values are determined by you. MTD should be longer than RTO or RPO. Oftentimes, business processes such as Sales, HR, etc. have very large MTD values and RTO and RPO values which are higher than customer-facing processes.]  **

**STEP 2. Identify Resource Requirements**

Identify the resources that compose <system name> in support of business processes, including hardware, software, and other resources such as data files.* *

| **SYSTEM RESOURCE/COMPONENT** | **PLATFORM/OS/VERSION (AS APPLICABLE)** | **DESCRIPTION** |
|---|---|---|
|  |  |  |
|  |  |  |
|  |  |  |

**[In this section for the Identify Resource Requirements, most organizations usually list the systems/components which support the services they deliver to customers. So the servers that run your customer-facing application, developer workstations, etc. You may list ALL systems/components across all business processes, however, most organizations do not go into that level of detail.]**

Business-critical equipment and redundant equipment are identified. Redundant business-critical equipment is evaluated for independent location at a reasonable distance according to industry standards.

| **BUSINESS-CRITICAL EQUIPMENT** | **NEED FOR REDUNDANCY** | **LOCATION** |
|---|---|---|
|  |  |  |
|  |  |  |
|  |  |  |

**[In this section, you could list business-critical equipment/assets for your organization.]**

**STEP 3. Identify Recovery Priorities for System Resources**

List the order of recovery for <system name> resources, and identify the expected time for recovering the resource following a “worst case” (complete rebuild/repair or replacement) disruption. A system resource can be software, data files, servers, or other hardware and should be identified individually or as a logical group.

| **PRIORITY** | **SYSTEM RESOURCE/COMPONENT** | **RTO** |
|---|---|---|
|  |  |  |
|  |  |  |
|  |  |  |

Any alternate strategies in place to meet expected RTOs will be identified, including backup or spare equipment and vendor support contracts.

**[In this section, you will rank the components for which order they should be recovered in, so the components in this table should match those listed above.]**

### Revision History 

| **Version** | **Date** | **Editor** | **Approver** | **Description of Changes** | **Format** |
|---|---|---|---|---|---|
|  |  |  |  |  |  |
|  |  |  |  |  |  |
|  |  |  |  |  |  |

## Related articles

- [Business Continuity Plan - Appendix A: Business Impact Analysis](business-continuity-plan-appendix-a-business-impact-analysis.md)
- [Do cloud-hosted systems need Contingency Plans?](do-cloud-hosted-systems-need-contingency-plans.md)
- [Example Business Continuity Plan](example-business-continuity-plan.md)
- [Disaster Recovery Plan Guidance](disaster-recovery-plan-guidance.md)
- [Disaster Recovery Checklist: Simple Steps for Business Resilience](disaster-recovery-checklist-simple-steps-for-business-resilience.md)
