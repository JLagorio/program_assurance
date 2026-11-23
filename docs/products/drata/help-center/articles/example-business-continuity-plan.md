# Example Business Continuity Plan

Source: https://help.drata.com/en/articles/6232796-example-business-continuity-plan
Collection: Policy Guidance
Updated: 2026-11-14
Fetched: 2026-11-22

## Article text

## What is a Business Continuity Plan (BCP)?

A Business Continuity Plan (BCP) is a core requirement in frameworks such as SOC 2, ISO 27001, and others. It outlines the specific procedures your organization will follow in response to a continuity event—such as a natural disaster, cyber incident, or other business disruption—including recovery priorities, team responsibilities, and communication protocols for both internal and external stakeholders.

To support your BCP development, we’ve provided a **completed sample** based on Drata’s standard template. This example is designed to illustrate what a finalized BCP **might** look like after tailoring it to a specific organization. While you’re welcome to reference or adapt sections, it’s essential to customize the content to reflect your actual business processes, risks, and operating environment.

Please review the [Business Continuity Plan Guidance](business-continuity-plan-guidance.md) to see explanations for each section.

## Business Continuity Plan

## Example Corporation

**SOC 2 Criteria: **CC5.3, CC7.5

**ISO 27001 Annex A: **A.17.1.1, A.17.1.2

**Keywords: **BIA, Status Page, Worksite Recovery

__________________________________________________________

## Purpose 

This policy establishes procedures to recover Example Corporation following a disruption in conjunction with the *Disaster Recovery Plan.*

## Policy

Example Corporation policy requires that:

- A plan and process for business continuity, including the backup and recovery of systems and data, must be defined and documented.
- The Business Continuity Plan shall be simulated and tested at least once a year. Metrics shall be measured and identified recovery enhancements shall be filed to improve the process.
- Security controls and requirements must be maintained during all Business Continuity Plan activities.

## Roles and Responsibilities

This Policy is maintained by the Example Corporation Security Officer and Privacy Officer. All executive leadership shall be informed of any and all contingency events.

**Line of Succession**

The following order of succession ensures that decision-making authority for the Example Corporation Business Continuity Plan is uninterrupted. The CEO is responsible for ensuring the safety of personnel and the execution of procedures documented within this Plan. The Head of Engineering is responsible for the recovery of Example Corporation technical environments. If the CEO or Head of Engineering is unable to function as the overall authority or chooses to delegate this responsibility to a successor, the Business Operations Lead shall function as that authority or choose an alternative delegate.

**Response Teams and Responsibilities**

The following teams have been developed and trained to respond to a contingency event affecting Example Corporation infrastructure and systems.

1. HR & Facilities is responsible for ensuring the physical safety of all Example Corporation personnel and environmental safety at each Example Corporation physical location. The team members also include site leads at each Example Corporation work site. The team leader is the Head of HR who reports to the CEO.
2. DevOps is responsible for assuring all applications, web services, platforms, and their supporting infrastructure in the Cloud. The team is also responsible for testing re-deployments and assessing damage to the environment. The team leader is the Head of Engineering.
3. Security is responsible for assessing and responding to all cybersecurity related incidents according to Example Corporation Incident Response policy and procedures. The security team shall assist the above teams in recovery as needed in non-cybersecurity events. The team leader is the Security Officer.

Members of above teams must maintain local copies of the contact information of the Business Continuity Plan succession team. Additionally, the team leads must maintain a local copy of this policy in the event Internet access is not available during a disaster scenario.

All executive leadership shall be informed of any and all contingency events.

## Policy

**Business Impact Analysis (BIA)**

The BIA will help identify and prioritize system components by correlating them to the business processes that the system supports. It will allow for the characterization of the impact on the processes if the system becomes unavailable. The BIA has three steps:

1. **Determine business processes and recovery criticality. **Business processes supported by the system are identified and the impact of a system disruption to those processes is determined along with outage impacts and estimated downtime. The downtime should reflect the maximum that an organization can tolerate while still maintaining the mission.
2. **Identify resource requirements.** Realistic recovery efforts require a thorough evaluation of the resources required to resume mission/business processes and related interdependencies as quickly as possible. Examples of resources that should be identified include facilities, personnel, equipment, software, data files, system components, and vital records.
3. **Identify recovery priorities for system resources.** Based upon the results from the previous activities, system resources can more clearly be linked to critical mission/business processes. Priority levels can be established for sequencing recovery activities and resources.

*See Appendix A for the BIA breakdown.*

**Work Site Recovery**

In the event an Example Corporation facility is not functioning due to a disaster, employees will work from home or locate to a secondary site with Internet access, until the physical recovery of the facility impacted is complete.

Example Corporation’s software development organization has the ability to work from any location with Internet access and does not require an office provided Internet connection.

**Application Service Event Recovery**

Example Corporation maintains a status page to provide real time updates and inform customers of the status of each service. The status page is updated with details about an event that may cause service interruption / downtime. Example Corporation’s status page: **[https://examplecorp.com/status](https://examplecorp.com/status)**

## APPENDIX A

**Business Impact Analysis**

**System Description**

Example System runs completely on Amazon Web Services (AWS). The specific services used are EC2 for running servers, RDS for managing databases, S3 for storing unstructured data, CloudWatch/CloudTrail for logging and monitoring, Glacier for long term storage/archiving data, and SNS for sending notifications.

EC2 instances are primarily running CentOS, and all EC2 instances run within the US-East1 region. A load balancer is used to distribute incoming traffic between EC2 instances. <Additional information about EC2>

All RDS instances are using Postgres, the primary database executes in the US-East1a zone, with a read-replica in US-East1b. Backup instances are running in US-East2 region. Automated backups are enabled and retained for 30 days, both backups and instances are encrypted through AWS. <Additional information about RDS>

Example Corporation has no physical office locations and has no business partnerships or system interconnections with the networks of other organizations. All employees and contractors of Example Corporation work remotely within the United States or Canada.

Users of Example System access the platform by using standard web browsers and navigating to examplesystems.com. There, users are able to create or login to their Example System account where they can <The following section is example language, please change> book coaching sessions, reschedule coaching sessions, read help articles, view on-demand webinar, or manage their account. Users primarily reside within the United States.

**Data Collection**

Data was collected through email questionnaires sent to the individuals responsible for these business processes.

**STEP 1. Determine Process and System Criticality**

Identify the specific business processes that depend on or support the information system, using input from users, managers, business process owners, and other internal or external points of contact.

| **BUSINESS PROCESS** | **DESCRIPTION** |
|---|---|
| Employee Onboarding | Employee Onboarding is the process of getting new employees set up within Example Corporation It is the responsibility of Human Resources. |
| Recruiting | Recruiting is the process of finding and interviewing potential new employees for Example Corporation It is the responsibility of Human Resources. |
| Legal Services | Legal Services encompasses functions such as contract review, regulation analysis, and legal counsel. Legal Services are the responsibility of the Legal department. |
| Example System Developement | Example System development is the process of building out new functionality or improving existing functionality for Example System. Example System development is the responsibility of the Engineering department. |
| <Additional Functions> |  |
|  |  |

**Outage Impacts **

***<Please note, these are example values for illustration purposes>***

Impact categories and values characterize levels of severity to the company that would result for that particular impact category, if the business process could not be performed. These impact categories and values are samples and should be revised to reflect what is appropriate for the organization.

| **Impact** | **High** | **Moderate** | **Low** |
|---|---|---|---|
| Cost | > $500,000 | $100,001 - $499,999 | < $100,000 |
| Customer Satisfaction | Loss of greater than 10% of customers | Loss of between 1% - 9% | Loss of little to no customers |
| Legal Impact | Organization is deemed non-compliant with laws or regulations | Organization agrees to unfavorable contract | Contract review is delayed |
| Data Loss | > 10,000 records lost | 100 - 9,999 records lost | 100 or less records lost |

| **BUSINESS PROCESS** | **IMPACT CATEGORY** |  |  |  |  |
|---|---|---|---|---|---|
|  | **Cost** | **Customer Satisfaction** | **Legal Impact** | **Data Loss** | **Overall IMPACT** |
| Employee Onboarding | Low | Low | Low | Low | Low |
| Recruiting | Low | Low | Low | Low | Low |
| Legal Services | Moderate | Low | Moderate | Low | Moderate |
| Example System Developement | Moderate | Low | Low | High | High |
| <Additional Functions> |  |  |  |  |  |
|  |  |  |  |  |  |

**Estimated Downtime **

Downtime factors resulting from a disruptive event will be estimated by working directly with business process owners, departmental staff, managers, and other stakeholders. The following downtime categories will be considered:

- **Maximum Tolerable Downtime (MTD).** The MTD represents the total amount of time managers are willing to accept for a business process outage or disruption and includes all impact considerations. Determining MTD is important because it could leave continuity planners with imprecise direction on:
   1. Selection of an appropriate recovery method; and
   2. The depth of detail which will be required when developing recovery procedures, including their scope and content.
- **Recovery Time Objective (RTO).** RTO defines the maximum amount of time that a system resource can remain unavailable before there is an unacceptable impact on other system resources, supported business processes, and the MTD. Determining the information system resource RTO is important for selecting appropriate technologies that are best suited for meeting the MTD.
- **Recovery Point Objective (RPO).** The RPO represents the point in time, prior to a disruption or system outage, to which business process data must be recovered (given the most recent backup copy of the data) after an outage.

| **BUSINESS PROCESS** | **MTD** | **RTO** | **RPO** |
|---|---|---|---|
| Employee Onboarding | 1 week | 72 hours | 72 hours |
| Recruiting | 2 weeks | 1 week | 1 week |
| Legal Services | 1 week | 72 hours | 72 hours |
| Example System Developement | 72 hours | 48 hours | 48 hours |
| <Additional Functions> |  |  |  |

**STEP 2. Identify Resource Requirements**

Identify the resources that compose Example System in support of business processes, including hardware, software, and other resources such as data files.* *

| **SYSTEM RESOURCE/COMPONENT** | **PLATFORM/OS/VERSION (AS APPLICABLE)** | **DESCRIPTION** |
|---|---|---|
| Source Code | N/A | The source code which runs the “Example” System |
| Servers | AWS/CentOS | The servers which run the “Example” System |
| Developer Workstations | MacOS | The workstations used by developers in support of the “Example” System |
| <Additional Components> |  |  |

**STEP 3. Identify Recovery Priorities for System Resources**

List the order of recovery for Example System resources, and identify the expected time for recovering the resource following a “worst case” (complete rebuild/repair or replacement) disruption. A system resource can be software, data files, servers, or other hardware and should be identified individually or as a logical group.

| **PRIORITY** | **SYSTEM RESOURCE/COMPONENT** | **RTO** |
|---|---|---|
| 1 | Servers | 12 hours |
| 2 | Source Code | 24 hours |
| 3 | Developer Workstations | 48 hours |

Any alternate strategies in place to meet expected RTOs will be identified, including backup or spare equipment and vendor support contracts.

## Revision History

| **Version** | **Date** | **Editor** | **Description of Changes** |
|---|---|---|---|
| 1.0 | January, 1, 20XX | Jane Doe | Initial Creation |

## Related articles

- [Business Continuity Plan - Appendix A: Business Impact Analysis](business-continuity-plan-appendix-a-business-impact-analysis.md)
- [Business Continuity Plan Guidance](business-continuity-plan-guidance.md)
- [ISO 27001:2022 Example ISMS Plan](iso-27001-2022-example-isms-plan.md)
- [ISO 27001:2013 Example ISMS Plan](iso-27001-2013-example-isms-plan.md)
- [Disaster Recovery Checklist: Simple Steps for Business Resilience](disaster-recovery-checklist-simple-steps-for-business-resilience.md)
