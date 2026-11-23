# Business Continuity Plan - Appendix A: Business Impact Analysis

Source: https://help.drata.com/en/articles/5732621-business-continuity-plan-appendix-a-business-impact-analysis
Collection: Policy Guidance
Updated: 2026-08-05
Fetched: 2026-11-22

## Article text

This is a specific ISO 27001 requirement, however, we would still recommend you complete this from a risk mitigation perspective even if you are not pursuing ISO 27001 certification.

To make the Business Impact Analysis more clear, we updated Appendix A with some examples. You can replace Appendix A with the following:

**APPENDIX A**

**Business Impact Analysis**

[MUST BE TAILORED TO PARTICULAR ORGANIZATION; TABLES ARE FILLED WITH EXAMPLES ONLY]

1. **System Description**

<Provide a general description of system architecture and functionality.  Indicate the operating environment, physical location, general location of users, and partnerships with external organizations/systems. Include information regarding any other technical considerations that are important for recovery purposes, such as backup procedures. Provide a diagram of the architecture, including inputs and outputs and telecommunications connections. >

1. **Data Collection**

*<*Data collection can be accomplished through individual/group interviews, workshops, email, questionnaires, or any combination of these.>*  *

**STEP 1. Determine Process and System Criticality**

Identify the specific business processes that depend on or support the information system, using input from users, managers, business process owners, and other internal or external points of contact.

| **BUSINESS PROCESS** | **DESCRIPTION** |
|---|---|
| *Example 1: DevOps* |  |
| *Example 2: Sales* |  |
|  |  |

1. Outage Impacts

Impact categories (e.g., cost, lost revenue, customer satisfaction, etc.) and values characterize levels of severity (e.g., Severe, Moderate, Minimal) to the company that would result for that particular impact category, if the business process could not be performed. These impact categories and values are samples and should be revised to reflect what is appropriate for the organization.

The following impact categories represent important areas for consideration in the event of a disruption or impact

| **IMPACT CATEGORY** | **SEVERITY** |  |  |
|---|---|---|---|
|  | **Severe** | **Moderate** | **Minimal** |
| *Example: Cost* | *Over $1M* | *$500K-$1M* | *Under $500K* |
| *Example: Customer Sat.* | *Loss of Customer/ Bad Publicity* | *Money Back* | *Employee Overtime* |

The table(s) below summarize the impact on each mission/business process if [SYSTEM NAME 1 (e.g., AWS)] were unavailable, based on the following criteria:

| **BUSINESS PROCESS** | **IMPACT CATEGORY** |  |  |  |  |
|---|---|---|---|---|---|
|  | **Cost** | **Customer Sa** | **<CAT 3>** | **<CAT 4>** | **IMPACT** |
| *DevOps* |  |  |  |  |  |
| *Sales* |  |  |  |  |  |
|  |  |  |  |  |  |

The table below summarizes the impact on each mission/business process if [SYSTEM NAME 2 (e.g., Google Workspace)] were unavailable, based on the following criteria:

| **BUSINESS PROCESS** | **IMPACT CATEGORY** |  |  |  |  |
|---|---|---|---|---|---|
|  | **Cost** | **Customer Sa** | **<CAT 3>** | **<CAT 4>** | **IMPACT** |
| *DevOps* |  |  |  |  |  |
| *Sales* |  |  |  |  |  |
|  |  |  |  |  |  |

1. Estimated Downtime

Downtime factors resulting from a disruptive event will be estimated by working directly with business process owners, departmental staff, managers, and other stakeholders. The following downtime categories will be considered:

- **Maximum Tolerable Downtime (MTD).** The MTD represents the total amount of time managers are willing to accept for a business process outage or disruption and includes all impact considerations. Determining MTD is important because it could leave continuity planners with imprecise direction on:
   1. Selection of an appropriate recovery method; and
   2. The depth of detail which will be required when developing recovery procedures, including their scope and content.
- **Recovery Time Objective (RTO).** RTO defines the maximum amount of time that a system resource can remain unavailable before there is an unacceptable impact on other system resources, supported business processes, and the MTD.  Determining the information system resource RTO is important for selecting appropriate technologies that are best suited for meeting the MTD.
- **Recovery Point Objective (RPO).** The RPO represents the point in time, prior to a disruption or system outage, to which business process data must be recovered (given the most recent backup copy of the data) after an outage.

| **BUSINESS PROCESS** | **MTD** | **RTO** | **RPO** |
|---|---|---|---|
|  |  |  |  |
|  |  |  |  |
|  |  |  |  |

**STEP 2. Identify Resource Requirements**

Identify the resources that compose <system name> in support of business processes, including hardware, software, and other resources such as data files.* *

| **SYSTEM RESOURCE/**<br>**COMPONENT** | **PLATFORM/OS/VERSION (AS APPLICABLE)** | **DESCRIPTION** |
|---|---|---|
|  |  |  |
|  |  |  |
|  |  |  |

**STEP 3. Identify Recovery Priorities for System Resources**

List the order of recovery for <system name> resources, and identify the expected time for recovering the resource following a “worst case” (complete rebuild/repair or replacement) disruption. A system resource can be software, data files, servers, or other hardware and should be identified individually or as a logical group.

| **PRIORITY** | **SYSTEM RESOURCE/**<br>**COMPONENT** | **RTO** |
|---|---|---|
|  |  |  |
|  |  |  |
|  |  |  |

Any alternate strategies in place to meet expected RTOs will be identified, including backup or spare equipment and vendor support contracts.

## Related articles

- [SOC 2 Trust Services Categories Overview](soc-2-trust-services-categories-overview.md)
- [Example Business Continuity Plan](example-business-continuity-plan.md)
- [Business Continuity Plan Guidance](business-continuity-plan-guidance.md)
- [Disaster Recovery Plan Guidance](disaster-recovery-plan-guidance.md)
- [Disaster Recovery Checklist: Simple Steps for Business Resilience](disaster-recovery-checklist-simple-steps-for-business-resilience.md)
