# Incident Response Plan Guidance

Source: https://help.drata.com/en/articles/7885026-incident-response-plan-guidance
Collection: Policy Guidance
Updated: 2026-11-14
Fetched: 2026-11-22

## Article text

The following article contains guidance explaining portions of the Incident Response Plan that we frequently see questions around, explaining what the sections mean.

Guidance statements will appear in **bold** and enclosed in brackets “**[...]**” below the statements of the policy.

## Incident Response Plan

## [COMPANY NAME]

______________________________________________________________________

## Purpose

This security incident response policy is intended to establish controls to ensure detection of security vulnerabilities and incidents, as well as quick reaction and response to security breaches. This document also provides implementing instructions for security incident response, to include definitions, procedures, responsibilities, and performance measures (metrics and reporting mechanisms).

## Scope

This policy applies to all users of information systems within [COMPANY NAME]. This typically includes employees and contractors, as well as any external parties that come into contact with systems and information controlled by [COMPANY NAME] (hereinafter referred to as “users”). This policy must be made readily available to all users.

## Background

A key objective of [COMPANY NAME]’s Information Security Program is to focus on detecting information security weaknesses and vulnerabilities so that incidents and breaches can be prevented wherever possible. [COMPANY NAME] is committed to protecting its employees, customers, and partners from illegal or damaging actions taken by others, either knowingly or unknowingly. Despite this, incidents and data breaches are likely to happen; when they do, [COMPANY NAME] is committed to rapidly responding to them, which may include identifying, containing, investigating, resolving, and communicating information related to the breach.

This policy requires that all users report any perceived or actual information security vulnerability or incident as soon as possible using the contact mechanisms prescribed in this document. In addition, [COMPANY NAME] must employ automated scanning and reporting mechanisms that can be used to identify possible information security vulnerabilities and incidents. If a vulnerability is identified, it must be resolved within a set period of time based on its severity. If an incident is identified, it must be investigated within a set period of time based on its severity. If an incident is confirmed as a breach, a set procedure must be followed to contain, investigate, resolve, and communicate information to employees, customers, partners and other stakeholders.

Within this document, the following definitions apply:

- **Information Security Vulnerability:**

A vulnerability in an information system, information system security procedures, or administrative controls that could be exploited to gain unauthorized access to information or to disrupt critical processing.

- **Information Security Incident:**

A suspected, attempted, successful, or imminent threat of unauthorized access, use, disclosure, breach, modification, or destruction of information; interference with information technology operations; or significant violation of information security policy.

- **Information Security Event:**

An occurrence or change in the normal behavior of systems, networks or services that may impact security and organizational operations (e.g., possible compromise of policies or failure of controls).

## Roles and Responsibilities

**<ROLES AND RESPONSIBILITIES>**

**[Additional guidance on what roles and responsibilities to list in this policy can be found in [Roles and Responsibilities Guidance](roles-and-responsibilities-guidance.md). **

**To use that article, you should list the answer to each question here as a role. For example: “Who is responsible for updating, reviewing, and maintaining this policy?” may become “The CISO is responsible for updating, reviewing, and maintaining this policy.”]**

## Policy

- All users must report any system vulnerability, incident, or event pointing to a possible incident to the Security Officer as quickly as possible but no later than 24 hours.

**[Security Officer role can be modified to the specific role in your organization who is appointed or primarily responsible for handling security reports. 24 hours is a best practice recommendation. We do not recommend beyond 24 hours as the longer an incident goes unreported, the greater the potential damage and the more difficult it can get to remediate it.]**

- Incidents must be reported by sending an email message with details of the incident.

**[Method to report an incident can be modified. Some organizations report incidents directly through a ticketing system and other use IM service such as Slack or Teams.]**

- Users must be trained on the procedures for reporting information security incidents or discovered vulnerabilities, and their responsibilities to report such incidents. Failure to report information security incidents shall be considered to be a security violation and will be reported to the Human Resources (HR) Manager for disciplinary action.

**[Information Security Awareness Training covers the procedures for reporting information security incidents. Employees reaching out to the immediate managers to report an incident is an acceptable approach. If you are using Drata’s built-in Security Awareness Training, it covers that portion.**

**No framework prescribes specific disciplinary sanctions that must be imposed. Your business can define what the process should look like, so long as it complies with applicable laws and regulations.]**

- Information and artifacts associated with security incidents (including but not limited to files, logs, and screen captures) must be preserved appropriately in the event that they need to be used as evidence of a crime.

**[Information Security Awareness Training covers the procedures for reporting information security incidents. Employees reaching out to the immediate managers to report an incident is an acceptable approach. If you are using Drata’s built-in Security Awareness Training, it covers that portion.**

**No framework prescribes specific disciplinary sanctions that must be imposed. Your business can define what the process should look like, so long as it complies with applicable laws and regulations.]**

- All information security incidents must be responded to through the incident management procedures defined below.

**[This bullet is emphasizing that you are following your Incident Response Plan when responding to incidents.]**

## Periodic Evaluation

It is important to note that the processes surrounding security incident response should be periodically reviewed and evaluated for effectiveness. This also involves appropriate training of resources expected to respond to security incidents, as well as the training of the general population regarding [COMPANY NAME]'s expectation for them, relative to security responsibilities. The incident response plan is tested annually.

**[Annual cadence of reviewing the Incident Response Plan is the minimum suggested time. You can perform this more often, but we do not recommend going beyond that. PCI does require organizations to review and test the plan at least annually as defined on Requirement 12.10.2]**

## Procedure For Establishing Incident Response System

- Define on-call schedules and assign an Information Security Manager (ISM) responsible for managing incident response procedures during each availability window.
- Define a notification channel to alert the on-call ISM of a potential security incident. Establish a company resource that includes up to date contact information for on-call ISM.

**[For the two bullets above, you can modify it according to what works in your organization. You can change the on-call schedule to a defined number of hours of when the person responsible for incident response is supposed to investigate or take action.] **

- Assign management sponsors from the Engineering, Legal, HR, Marketing, and C-Suite teams.

**[Management list can be reduced to business units that are involved in your incident response process. The example departments listed above are the common business units involved in this process.] **

- Distribute Procedure For Executing Incident Response to all staff and ensure up-to-date versions are accessible in a dedicated company resource.

- Require all staff to complete training for Procedure For Executing Incident Response at least once per year.

**[For the two bullets above, incident response training provided to all staff outside of those that are responsible for executing the incident response plan can be a general security awareness training that includes a section where it specifies how incidents should be reported.**

**If you are using Drata’s built-in Security Awareness Training module, it will have a section that covers reporting security incidents for general employees.**

**Incident Response Training for those who are involved in executing the plan can be demonstrated through conducting a tabletop exercises, red team exercises, live drills, and post-incident reviews] **

## Reporting Incidents

The following situations are to be considered for information security event reporting:

- Ineffective security control;
- Breach of information integrity, confidentiality or availability expectations;
- Human errors;
- Non-compliances with policies or guidelines;
- Breaches of physical security arrangements;
- Uncontrolled system changes;
- Malfunctions of software or hardware;
- Access violations; and,
- Malfunctions or other anomalous system behavior indicative of a security attack or actual security breach.

**[This is a general list of incidents that should be reported. You can modify this section and add more to the list such as Social Engineering attacks, Insider Threats, etc.] **

## Procedure For Executing Incident Response

- When an information security incident is identified or detected, users must notify their immediate manager within 24 hours. The manager must immediately notify the ISM on call for proper response. The following information must be included as part of the notification:
   - Description of the incident
   - Date, time, and location of the incident
   - Person who discovered the incident
   - How the incident was discovered
   - Known evidence of the incident
   - Affected system(s)

**[Information Security Manager role can be modified to the specific role in your organization who is appointed or primarily responsible for handling security reports. 24 hours is a best practice recommendation. We do not recommend beyond 24 hours as the longer an incident goes unreported, the greater the potential damage and the more difficult it can get to remediate it.**

**The suggested details that must be included in the report will aid in documentation and investigation.]**

- Within 48 hours of the incident being reported, the ISM shall conduct a preliminary investigation and risk assessment to review and confirm the details of the incident. If the incident is confirmed, the ISM must assess the impact to [COMPANY NAME] and assign a severity level, which will determine the level of remediation effort required:
   - **High**: the incident is potentially catastrophic to [COMPANY NAME] and/or disrupts [COMPANY NAME]’s day-to-day operations; a violation of legal, regulatory or contractual requirements is likely.
   - **Medium**: the incident will cause harm to one or more business units within [COMPANY NAME] and/or will cause delays to a business unit’s activities.
   - **Low**: the incident is a clear violation of organizational security policy, but will not substantively impact the business.

**[This section discusses that severity level should be defined in order for the organization to prioritize response efforts and manage resource allocation. Medium and High severity levels may also need to trigger the communication plan to certain departments, which will help in ensuring that all relevant stakeholders are informed.]**

- The ISM, in consultation with management sponsors, shall determine appropriate incident response activities in order to contain and resolve incidents.

**[It is best to consult with other departments involved in this process as some incidents may have some type of legal implications, some may require disciplinary actions determined by HR, and some may even need to be communicated to affected users.]**

- The ISM must take all necessary steps to preserve forensic evidence (e.g. log information, files, images) for further investigation to determine if any malicious activity has taken place. The collection of evidence will be managed by appropriate members with proper understanding and training in forensic evidence collection. In the absence of such members, certified third-party professionals will be used. All such information must be preserved and provided to law enforcement if the incident is determined to be malicious.

**[This section emphasizes that preserving forensic evidence is part of the procedure when investigating incidents. The intent of this is to ensure that files are not tampered with during the investigation and that it will remain as an admissible evidence should there be a legal action.]**

- If the incident is deemed as High or Medium, the ISM must work with the VP Brand/Creative, General Counsel, and HR Manager to create and execute a communications plan that communicates the incident to users, the public, and others affected.

**[These are the recommended functions to include in this section. Specific roles involved in this process may differ in your organization. Ensuring that these stakeholders are aligned with the incident can ensure that response effort is coordinated.]**

- The ISM must take all necessary steps to resolve the incident and recover information systems, data, and connectivity. All technical steps taken during an incident must be documented in [COMPANY NAME]’s incident log, and must contain the following:
   - Description of the incident
   - Incident severity level
   - Root cause (e.g. source address, website malware, vulnerability)
   - Evidence
   - Mitigations applied (e.g. patch, re-image)
   - Status (open, closed, archived)
   - Disclosures (parties to which the details of this incident were disclosed to, such as customers, vendors, law enforcement, etc.)

**[The information listed above that is recommended to be documented may help respond to similar incidents that may happen in the future. This can also aid in providing as much detail as it can should there be a need to provide evidence in the event of a legal or regulatory investigation.]**

- After an incident has been resolved, the ISM must conduct a post-mortem that includes root cause analysis and documentation of any lessons learned.
   - In the event that the incident involves the breach of sensitive privacy data (e.g., PII), (1) an assessment will also be conducted to determine the extent of harm, embarrassment, inconvenience, or unfairness to affected parties; (2) all affected parties and appropriate organizations (e.g., Law Enforcement) will be notified; and (3) every effort will be made to mitigate the harm to affected parties.

**[Performing post-incident activities may help improve the process for responding to similar incidents that may happen in the future.**

**Should there be a breach of privacy that happened as a result of the incident, it is important to determine the appropriate response and communication efforts to the affected parties to comply with certain legal and regulatory requirements]**

- Depending on the severity of the incident, the Chief Executive Officer (CEO) may elect to contact external authorities, including but not limited to law enforcement, private investigation firms, and government organizations as part of the response to the incident.

**[For some High and Medium incidents, it is required that the organization leverage specialized expertise from external authorities to avoid legal action, fines and penalties. This decision is made by the Upper Management and is advised to seek legal counsel prior to execution.]**

- The ISM must notify all users of the incident, conduct additional training if necessary, and present any lessons learned to prevent future occurrences. Where necessary, the HR Manager must take disciplinary action if a user’s activity is deemed as malicious.

**[No framework prescribes specific disciplinary sanctions that must be imposed. Your business can define what the process should look like, so long as it complies with applicable laws and regulations.]**

**APPENDIX A: **

**Security Incident Report Template**

**[This template can be used to facilitate your incident response documentation and ensure that it is consistent. Organizations can also use this as a guide to create a ticket template in your ticketing system (e.g. Jira, ServiceNow, etc.) should there be a plan to use those technologies.**

**This template can be simplified to include only the fields that are important to your organization]**

|  | **1.0 Reported by** |
|---|---|
| 1.1 Last Name: |  |
| 1.2 First Name: |  |
| 1.3 Position: |  |
| 1.4 Company/Org Name: |  |
| 1.5 Telephone No: |  |
| 1.6 E-mail: |  |

|  | **2.0 Organization Details** |
|---|---|
| 2.1 Name of organization: |  |
| 2.2 Type of organization: |  |
| 2.3 Street Address: |  |
| 2.4 At this time, is it known that other organizations are affected by this incident? (If so, list names, addresses, telephone number, email addresses & contact persons): |  |

|  | **3.0 Incident Details Including Injury and Impact Level** |
|---|---|
| 3.1 Date: | 3.2 Time: |
| 3.3 Location of affected site: |  |
| 3.4 Brief summary of the incident (what has happened, where did it happen, when did it happen): |  |
| 3.5 Description of the project/program and information involved, and, if applicable, the name of the specific program: |  |
| 3.6 Classification level of the information involved: |  |
| 3.7 System compromise (detail): |  |
| 3.8 Data compromise (detail): |  |
| 3.9 Originator and /or Official Classification Authority of the information involved? (List name, address, telephone no., email and contact person). |  |
| 3.10 Is Foreign Government Information involved? Originating country or International organization? |  |
| 3.11 Did the incident occur on an accredited system authorized to process and store the information in question? |  |
| 3.12 Estimated injury level/sector: |  |
| 3.13 Estimated impact level: (any compromise or disruption to service?) |  |
| 3.14 Incident duration: |  |
| 3.15 Estimated number of systems affected: |  |
| 3.16 Percentage of organization systems affected: |  |
| 3.17 Action taken: |  |
| 3.18 Supporting documents attached (describe if any) |  |
| 3.19 Multiple occurrences or first time this type of incident occurs within this location? |  |
| 3.20 Incident Status (resolved or unresolved) |  |
| 3.21 Has the matter been reported to other authorities? If so, list names, addresses, telephone no., email and contact person. |  |

|  | **4.0 Status of Mitigation Actions** |
|---|---|
| 4.1 Mitigation details to date: (List any actions that have been taken to mitigate incident and by whom) |  |
| 4.2 Results of mitigation: |  |
| 4.3 Additional assistance required? |  |

| **5.0 Computer Network Defense Incident Type (if applicable)** |  |
|---|---|
| 5.1 Malicious code (Worm, virus, trojan, backdoor, rootkit, etc.): |  |
| 5.2 Known vulnerability exploit (List the Common Vulnerabilities and Exposures (CVE) number for known vulnerability): |  |
| 5.3 Disruption of service: |  |
| 5.4 Access violation (Unauthorized access attempt, successful unauthorized access, password cracking, Etc.): |  |
| 5.5 Accident or error (Equipment failure, operator error, user error, natural or accidental causes): |  |
| 5.6 If the incident resulted from user error or malfeasance, reasons (training, disregard for policy, other) and responsible parties: |  |
| 5.7 Additional details: |  |
| 5.8. Apparent Origin of Incident or Attack: | Source IP and port: |
| URL: |  |
| Protocol: |  |
| Malware: |  |
| Additional details: |  |

|  | **6.0 Systems Affected** |
|---|---|
| 6.1 Network zone affected (Internet, administration, internal, etc.): |  |
| 6.2 Type of system affected (File server, Web server, mail server, database, workstation (mobile or desktop), etc.): |  |
| 6.3 Operating system (specify version): |  |
| 6.4 Protocols or services: |  |
| 6.5 Application (specify version): |  |

|  | **7.0 Post Incident Activities** |
|---|---|
| 7.1 Has information contained in this report been provided to the authorities? When? |  |
| 7.2 Complete a root cause analysis to determine the reason for the incident and steps to prevent re-occurrence. |  |

## Revision History 

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

**It is common and acceptable for smaller organizations to have the writer of the policy to be the same person as the approver.]**

## Related articles

- [Roles and Responsibilities Guidance](roles-and-responsibilities-guidance.md)
- [ISO 27001:2022 Example ISMS Plan](iso-27001-2022-example-isms-plan.md)
- [ISO 27001:2013 Example ISMS Plan](iso-27001-2013-example-isms-plan.md)
- [Responsible Disclosure Policy Guidance](responsible-disclosure-policy-guidance.md)
- [Information Security Policy Guidance](information-security-policy-guidance.md)
