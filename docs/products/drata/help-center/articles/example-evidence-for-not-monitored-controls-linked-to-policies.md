# Example Evidence for Not Monitored Controls Linked to Policies

Source: https://help.drata.com/en/articles/8016471-example-evidence-for-not-monitored-controls-linked-to-policies
Collection: Understand the Drata Platform › Evidence
Updated: 2026-11-14
Fetched: 2026-11-22

## Article text

## Background

This article is intended to serve as a reference for Controls that may show as Ready while only linked to an approved Policy in Drata, but more evidence is recommended from a compliance perspective. Some controls may only require an approved policy as evidence, and will be noted as such in the table below.

For the full list of “Not Monitored” controls, refer to the following articles. These articles will include additional “Not Monitored” controls that are not linked to policies by Drata and will need additional evidence uploaded to be ready for an audit.

1. [Example Evidence For Not Monitored Controls (SOC 2)](example-evidence-for-not-monitored-controls-soc-2.md)
2. [Example Evidence For Not Monitored Controls (ISO 27001)](example-evidence-for-not-monitored-controls-iso-27001-revised-following-5-7-2024-updates.md)
3. [Example Evidence For Not Monitored Controls (HIPAA)](example-evidence-for-not-monitored-controls-hipaa.md)
4. [Example Evidence For Not Monitored Controls (PCI)](https://help.drata.com/en/articles/6553140-example-evidence-for-not-monitored-pci-dss-controls)
5. [Example Evidence For Not Monitored Controls (GDPR)](example-evidence-for-not-monitored-gdpr-controls.md)

| Control Code | Control Name | Applicable Frameworks | Example Evidence |
|---|---|---|---|
| DCF-7 | Separate Testing and Production Environments | SOC 2, ISO 27001:13, PCI, ISO 27001:22 | 1. Screenshots from test and production environments for the application |
| DCF-11 | Annual Access Control Review | SOC 2, ISO 27001:13, HIPAA, ISO 27001:22 | 1. Tickets documenting the access control lists that were reviewed for in scope cloud environments, SaaS applications, infrastructure as code tools, and security protection tools (as applicable) 2. Tickets should be marked as completed/closed and the reviewer should provide comments on the results of the reviews. |
| DCF-12 | Hardening Standards in Place | SOC 2, ISO 27001:13, HIPAA, PCI, ISO 27001:22 | 1. Evidence from infrastructure as code tools showing configurations that would be implemented when new infrastructure is deployed. 2. Any type of document that formally documents the configurations that should be implemented for newly deployed infrastructure. |
| DCF-16 | Annual Risk Assessment | SOC 2, ISO 27001:13, HIPAA, PCI, ISO 27001:22 | 1. Most recently completed risk assessment report. |
| DCF-17 | Remediation Plan | SOC 2, ISO 27001:13, HIPAA, PCI, ISO 27001:22 | 1. Documented remediation plans for risks identified during the risk assessment. |
| DCF-18 | Quarterly Vulnerability Scan | SOC 2, ISO 27001:13, HIPAA, GDPR, PCI, ISO 27001:22 | 1. Completed quarterly vulnerability scans for the last four quarters. |
| DCF-19 | Annual Penetration Tests | SOC 2, ISO 27001:13, HIPAA, GDPR, PCI, ISO 27001:22 | 1. Most recently completed annual penetration test. |
| DCF-20 | Asset Inventory | SOC 2, ISO 27001:13, HIPAA, PCI, ISO 27001:22 | 1. Formal, documented listing of all assets (workstations, mobile devices, servers, databases, etc.) 2. For cloud infrastructure, screenshots from cloud environments listing all infrastructure |
| DCF-21 | Architectural Diagram | SOC 2, ISO 27001:13, HIPAA, PCI, ISO 27001:22 | 1. Approved Architectural Diagram |
| DCF-22 | Network segmentation in place | SOC 2, ISO 27001:13, HIPAA, ISO 27001:22 | 1. Formal, documented network/architecture diagram evidencing network segmentation of your cloud environments. |
| DCF-26 | BCP/DR Tests Conducted Annually | SOC 2, ISO 27001:13, HIPAA, ISO 27001:22 | 1. Most recently completed BCP/DR test. |
| DCF-35 | Security Team Communicates in a Timely Manner | SOC 2, ISO 27001:13, HIPAA, ISO 27001:22 | 1. Screenshots from communication tools (Slack, PagerDuty, etc.) showing the process for security events to be communicated to appropriate personnel. |
| DCF-42 | Defined Management Roles & Responsibilities | SOC 2, ISO 27001:13, HIPAA, ISO 27001:22 | 1. Roles and Responsibilities section from the information security policy. |
| DCF-56 | Vendor Agreements Maintained | SOC 2, ISO 27001:13, HIPAA, ISO 27001:22 | 1. Executed Agreement/contract between your company and key vendors. |
| DCF-57Vendor Compliance ReportsSOC 2, ISO 27001:13, HIPAA, ISO 27001:22 | 1. Screenshots from the vendor directory showing that vendors are categorized based on impact /risk. 2. Review documents showing that vendors' SOC2 reports were reviewed. |  |  |
| DCF-58 | Authentication Protocol | SOC 2, ISO 27001:13, HIPAA, ISO 27001:22 | 1. If SSO is an option, screenshots of a user logging in with SSO. 2. If username and password is an option, screenshots of a user logging in with a username and password. 3. Screenshots of MFA being required for employee users. 4. If customer users have the option to enable MFA, screenshots showing they are provided the option to enable MFA. |
| DCF-59 | Role-Based Security Implementation | SOC 2, ISO 27001:13, HIPAA, PCI, ISO 27001:22 | 1. Screenshots from the application showing how users are assigned roles. |
| DCF-60 | Password Storage | SOC 2, ISO 27001:13, HIPAA | 1. If username and password is required, screenshots from the database showing that password are stored using a salted hash. |
| DCF-61 | Customer Data Segregation | SOC 2, ISO 27001:13, ISO 27001:22 | 1. Screenshots from the database showing that customers are assigned separate IDs. 2. Screenshots from the application showing that a customer cannot see data of another customer (attempt to show one customer trying to access data of another customer). |
| DCF-62 | Inactivity and Browser Exit Logout | SOC 2, ISO 27001:13, HIPAA, ISO 27001:22 | 1. Screenshots of users being logged out of the application when browser/tab is closed and being forced to reauthenticate upon next login. 2. Screenshots showing that a user is logged out after pre-defined activity timeout and being forced to reauthenticate upon next login. |
| DCF-69 | System Access Granted | SOC 2, ISO 27001:13, HIPAA, ISO 27001:22 | 1.Formal, documented access request form/help desk ticket for a recent new hire. |
| DCF-74 | Customers Informed of Changes | SOC 2, ISO 27001:13, ISO 27001:22 | 1. Example emails communicating changes to customers. 2. Screenshots of banners warning customers of downtime prior to system maintenance. |
| DCF-76 | Critical Change Management | SOC 2, ISO 27001:13, ISO 27001:22 | 1. Formal, documented emergency change procedures for critical changes. |
| DCF-79 | Logs Centrally Stored | SOC 2, ISO 27001:13, HIPAA, ISO 27001:22 | 1. Screenshots from the location where logs of system activity are stored. |
| DCF-80 | Log Management System | SOC 2, ISO 27001:13, HIPAA, ISO 27001:22 | 1. Screenshots from the location where logs of system activity are stored. |
| DCF-86 | Operational Audit | SOC 2, ISO 27001:13, HIPAA, ISO 27001:22 | 1. Screenshots from the systems used to monitor for system availability issues. 2. Screenshots showing how personnel would be alerted of availability issues and who would be alerted. |
| DCF-91 | Intrusion Detection System | SOC 2, ISO 27001:13, HIPAA, PCI, ISO 27001:22 | 1. Screenshots from AWS GuardDuty, Azure Sentinel, GCP Security Command Center or equivalent monitoring tool showing that the service is enabled. 2. Screenshots from the mentioned applications/tools/services showing the types of threats that would be detected. 3. Screenshots from the mentioned applications/tools/services showing how personnel would be alerted and who would be alerted when threats are detected. |
| DCF-95 | Monitoring Processing Capacity and Usage | SOC 2, ISO 27001:13, ISO 27001:22 | 1. Evidence that management reviewed processing capacity and usage reports on a quarterly basis |
| DCF-97 | Auto-Scale Configuration | SOC 2, ISO 27001:13, ISO 27001:22 | 1. Screenshot of auto scaling configurations for relevant infrastructure. |
| DCF-98 | Daily Backup Statuses Monitored | SOC 2, ISO 27001:13, HIPAA, ISO 27001:22 | 1. Tickets showing that backup failures were monitored and resolved. |
| DCF-99 | Failed Backup Alert and Action | SOC 2, ISO 27001:13, HIPAA, ISO 27001:22 | 1. Automated configurations from the backup service for notifying personnel when backup processes fail. 2. Example email for a failed backup and ticket documenting resolution. |
| DCF-100 | Backup Integrity and Completeness | SOC 2, ISO 27001:13, HIPAA, ISO 27001:22 | 1. Screenshots showing a backup snapshot was restored completely and accurately. 2. Evidence from the annual DR tests showing that backups were restored completely and accurately. |
| DCF-104 | Test Data Used in Test Environment | SOC 2, ISO 27001:13, PCI, ISO 27001:22 | 1.Screenshots from the test environment showing that "real" data is not used. |
| DCF-105 | Employee Non-Disclosure Agreement (NDA) | SOC 2, ISO 27001:13, ISO 27001:22 | 1. Example new hire employee agreement, with NDA included. |
| DCF-108 | Storage of Sensitive Data on Paper | SOC 2, ISO 27001:13, HIPAA, ISO 27001:22 | 1. Pictures of secure storage bins from office locations. |
| DCF-109 | Disposal of Sensitive Data on Hardware | SOC 2, ISO 27001:2013, HIPAA, ISO 27001:2022 | 1. Data Retention Policy or equivalent policy documenting this policy and procedure. |
| DCF-113 | Review Privacy Notice Annually | SOC 2, ISO 27001:13, HIPAA, ISO 27001:22 | 1. Meeting minutes from management's annual meeting to review privacy practices. |
| DCF-114 | Privacy Policy Publicly Available | SOC 2, ISO 27001:13, HIPAA, ISO 27001:22 | 1. Screenshot of privacy practices posted on the entity's website. |
| DCF-117 | Minimal Information Required | SOC 2, ISO 27001:13, GDPR, ISO 27001:22 | 1. Screenshot of all information that the user can enter when providing data through the application. |
| DCF-120 | Annual Review of Purposes | SOC 2, ISO 27001:13, HIPAA, GDPR, ISO 27001:22 | 1. Meeting minutes for management's annual review of privacy policies |
| DCF-127 | Communication to 3rd Parties | SOC 2, ISO 27001:13, HIPAA, ISO 27001:22 | 1. Evidence to support that third parties with whom PII is sent to, were provided requirements for how PII should be handled, according to your requirements. |
| DCF-128 | Disclosure with 3rd Parties | SOC 2, ISO 27001:13, HIPAA, ISO 27001:22 | 1. Example executed contracts with third parties that receive PII showing that contracts included provisions for third parties to protect personal information. |
| DCF-129 | PII with 3rd Parties and Vendors | SOC 2, ISO 27001:13, HIPAA, ISO 27001:22 | 1. Formal, documented authorized list of third parties that can receive or access PII. |
| DCF-131 | Incident Report Template and Process | SOC 2, ISO 27001:2013, HIPAA, ISO 27001:2022 | 1. Formal, documented incident response procedures. |
| DCF-132 | Privacy and Security Requirements in Third-Party Agreements | SOC 2, ISO 27001:13, HIPAA, ISO 27001:22 | 1. Executed BAAs or other contractual agreements with third parties and vendors that are provided access to PHI or other sensitive data. |
| DCF-133 | Unauthorized Disclosures by 3rd Parties | SOC 2, ISO 27001:13, HIPAA, ISO 27001:22 | 1. Example executed contracts with third parties that receive PII showing that contracts included provisions for third parties to protect personal information. |
| DCF-134 | 3rd Parties and Vendors Given Instructions on Breach Reporting | SOC 2, ISO 27001:13, HIPAA, ISO 27001:22 | 1. Executed contracts with third parties that are provided access to PII to confirm that third parties are provided with information on how to report breaches of PII to the entity. |
| DCF-142 | Quarterly Review of Privacy Compliance | SOC 2, ISO 27001:13, HIPAA, ISO 27001:22 | 1. Meeting minutes from quarterly management meetings for tracking compliance with privacy practices and privacy regulations. |
| DCF-144 | Board Charter Documented | SOC 2, ISO 27001:13 | 1. Copy of Board Charter |
| DCF-145 | Board Expertise Developed | SOC 2, ISO 27001:13, ISO 27001:22 | 1. Board of Directors Backgrounds or Bios |
| DCF-146 | Board Meetings Conducted | SOC 2 | 1. Meeting minutes from Board meetings |
| DCF-147 | Physical Access to Facilities is Protected | SOC 2, ISO 27001:2013, HIPAA, ISO 27001:2022 | 1. Physical Access Control Policy |
| DCF-149 | Removable Media Device Encryption | SOC 2, ISO 27001:13, HIPAA, ISO 27001:22 | 1. If removable media devices are issued by the company to employees, provide evidence that removable media devices are encrypted. |
| DCF-150 | DLP (Data Loss Prevention) Software is Used | SOC 2, ISO 27001:13, HIPAA, ISO 27001:22 | 1. Screenshots of DLP software. 2. Example of emails being blocked when they contain sensitive data |
| DCF-151 | FIM (File Integrity Monitoring) Software in Place | SOC 2, ISO 27001:13, HIPAA, ISO 27001:22 | 1. Screenshots of FIM software. 2. Examples of FIM detecting changes. |
| DCF-153 | Conduct Control Self-Assessments | SOC 2, ISO 27001:13, HIPAA, ISO 27001:22 | 1. Screenshots of how Drata is used for continuous monitoring of controls. |
| DCF-154 | Annual Incident Response Test | SOC 2, ISO 27001:13, HIPAA, PCI, ISO 27001:22 | 1. Most recently completed incident response tabletop test. |
| DCF-155 | Code Changes are Tested | SOC 2, ISO 27001:13, ISO 27001:22 | 1. Screenshots from the ticketing system for a few changes showing that changes were tested. |
| DCF-156 | Production Code Released by Appropriate Personnel | SOC 2, ISO 27001:13, ISO 27001:22 | 1. Screenshots from the ticketing system for a few changes showing that changes were approved by appropriate personnel. |
| DCF-160 | Continuous Control Monitoring | SOC 2, ISO 27001:13, HIPAA, ISO 27001:22 | 1. Screenshots of how Drata is used for continuous monitoring of controls. |
| DCF-161 | ISMS Scope | ISO 27001:2013, ISO 27001:2022 | 1. Will be a part of your ISMS policy. |
| DCF-162 | Statement of Applicability | ISO 27001:2013, ISO 27001:2022 | 1. Will be a part of your ISMS policy. |
| DCF-163 | Interested Parties and Legal Requirements | ISO 27001:2013, ISO 27001:2022 | 1. Will be a part of your ISMS policy. |
| DCF-164 | ISMS Management Review | ISO 27001:2013, ISO 27001:2022 | 1. Will be a part of your ISMS policy. |
| DCF-165 | Independent Assessment | ISO 27001:13, ISO 27001:22 | 1. Evidence of testing performed for internal audit. 2. Internal audit report. |
| DCF-166 | Business Continuity Plan | SOC 2, ISO 27001:2013, HIPAA, PCI, GDPR, ISO 27001:2022 | 1. Business Continuity Plan. |
| DCF-167 | Business Impact Analysis | ISO 27001:2013, HIPAA, ISO 27001:2022 | 1. Business Impact Analysis (Typically part of the business continuity plan). |
| DCF-168 | Vendor Management Policy | SOC 2, ISO 27001:2013, HIPAA, ISO 27001:2022 | 1. Vendor Management Policy. |
| DCF-170 | Information Security Objectives | ISO 27001:2013, ISO 27001:2022 | 1. Will be a part of your ISMS policy. |
| DCF-171 | Operating Procedures | ISO 27001:2013, ISO 27001:2022 | 1. Will be a part of your ISMS policy. |
| DCF-172 | Organizational Change Management | ISO 27001:2013, ISO 27001:2022 | 1. Will be a part of your ISMS policy. |
| DCF-173 | Employment Terms & Conditions | ISO 27001:13, ISO 27001:22 | 1. Employee agreement template. |
| DCF-174 | Telework and Endpoint Devices | ISO 27001:2013, ISO 27001:2022 | 1. Section from the information security policy |
| DCF-175 | ISMS Communication Plan | ISO 27001:2013, ISO 27001:2022 | 1. Will be a part of your ISMS policy. |
| DCF-176 | Monitoring Plan | ISO 27001:2013, ISO 27001:2022 | 1. Will be a part of your ISMS policy. |
| DCF-177 | Event Logging | ISO 27001:2013, HIPAA, ISO 27001:2022 | 1. Section from the Data Protection Policy |
| DCF-178 | ISMS Record Management and Doc Control | ISO 27001:13, ISO 27001:22 | 1. Evidence showing that policy documents are versioned control. 2. Change log from the ISMS policy for the ISMS document. |
| DCF-179 | Information Security Skills Matrix | ISO 27001:13, HIPAA, ISO 27001:22 | 1. Information Security Skills Matrix (template provides in ISMS Plan for ISO customers) |
| DCF-180 | Secure Information Transfer | ISO 27001:2013, ISO 27001:2022 | 1. Section from the Data Protection Policy |
| DCF-182 | Asset Management Policy | SOC 2, ISO 27001:2013, HIPAA, ISO 27001:2022 | 1. Asset Management Policy. |
| DCF-183 | Vulnerability Management | SOC 2, ISO 27001:2013, HIPAA, PCI, GDPR ISO 27001:2022 | 1. Vulnerability Management Policy. |
| DCF-184 | Information Security Management System (ISMS) | ISO 27001:2013, ISO 27001:2022 | 1. ISMS Plan |
| DCF-185 | Periodic Dynamic Threat Assessment | ISO 27001:22, NIST SP 800-53r5 | 1. Completed Threat Assessment Plan contained within Appendix A of the Security version of the Risk Assessment Policy and Appendix C in the Privacy version of Risk Assessment Policy. 2. Screenshots showing that your organization is subscribed to a service or mailing list that provides information on new/developing security issues. 3. Evidence demonstrating that threats are being assessed according to the defined Threat Assessment Plan |
| DCF-186 | Data De-identification | ISO 27001:2022 | Data Classification PolicyData Protection Policy |
| DCF-187 | Configuration Management Plan | ISO 27001:2022 | Completed Appendix A within the Change Management Policy |
| DCF-189 | Activity Review | HIPAA | For this control, your organization will have to define a frequency for each of the three covered activities. This could be weekly, monthly, quarterly, it will depend on the size of your organization and what makes sense for each of the three areas: 1. Audit log reviews - A ticket from the ticketing system documenting which audit logs were reviewed, who reviewed them, and when the review was completed. 2. Security Incident Tracking Reports - A ticket documenting the review of incident reports including who completed the review and when the review was completed. Or meeting minutes demonstrating that incident reports were reviewed including who attended the meeting and the date. 3. Ticket documenting which system activity logs were reviewed, who reviewed these activity reports, and when the review was completed. |
| DCF-190 | Designated Security Officials | HIPAA | 1. Information Security Policy or 2. Job description of designated Security Official(s) outlining their responsibility for overseeing the organizations’ compliance with the security rule. |
| DCF-191 | Security Updates | HIPAA | 1. Formal documentation describing how the workforce is provided with periodic security updates, including how often security updates are provided. 2. Example of recent communication used for security updates (i.e. emails, newsletters, posters) |
| DCF-192 | Privacy, Use, and Disclosure | HIPAA | Privacy, Use, and Disclosure Policy |
| DCF-193 | Breach Notification | HIPAA, ISO 27001:2022 | Breach Notification Policy |
| DCF-195 | Business Associate Agreements | HIPAA | 1. Vendor Management Policy 2. Business Associate Policy 3. BAA template (if not contained within the Business Associate Policy) |
| DCF-196 | HIPAA Awareness Training | HIPAA | 1. Privacy, Use, and Disclosure Policy 2. Screenshots showing a certificate of completion from the HIPAA training provider. 3. Any other evidence supporting training on policies and procedures for handling PHI, as applicable. |
| DCF-197 | Document Retention Period | HIPAA | 1. Data Protection Policy 2. A document retention schedule should additionally be drawn up listing specific types of records, such as Business Associate Agreements, and the retention period such as 7 years. This should be uploaded to the Evidence Library page, and then linked to this control. 3. Any other policies supporting document retention requirements, as applicable |
| DCF-527 | Designated Data Protection Officer | GDPR | 1. Screenshot or documentation that designates a DPO. See Control Activities for additional guidance on the requirements and expectations of the DPO. |
| DCF-528 | Management of Sensitive Information | GDPR | 1.Data Classification Policy as long as it includes: a. Classification for PII b. Handling procedures for PII 2. Any Security Awareness Training materials that include information about handling PII and inform end users how to report security issues. |
| DCF-535 | Organizational Context | GDPR, ISO 27001:13, ISO 27001:22 | 1. Documentation that discusses how your company fits into the data processing ecosystem and includes each of the areas discussed in the 'Control Activities' section. Please see Appendix B of Drata’s latest Data Protection Policy template for helpful definitions. |
| DCF-536 | Record of Processing Activity (ROPA) | GDPR | 1. Completed ROPA documentation that includes the elements described in Control Activities a-g (Please see Appendix A of Drata’s latest Data Protection Policy template for more information on ROPAs). a. Be sure to consider your processing activities across different Personas, such as Marketing and Sales Prospects, Customers, Website Visitors, Employees, etc. It can be helpful to complete a separate ROPA per Persona. b. 2. ROPAs are only required in certain circumstances. The Control Activity Note details which circumstances trigger this requirement. |
| DCF-537 | Data Processing Agreements in Place | GDPR | 1. DPA templates used when sharing PII with third parties (an example DPA has been included in Appendix A of Drata’s latest Vendor Management Policy Template, for reference). 2. Copies of fully executed contracts with third parties that include DPAs. |
| DCF-539 | Collection of PII from Special Categories | GDPR | 1. Completed ROPA (see DCF-536 for more information on ROPAs) documentation that includes: a. Whether or not Special Categories of PII are collected (see Control Activity 1 for details on what PII is considered Special Categories). b. Which allowable conditions are used for collection (see Control Activity 2 for details on which allowable conditions are available). |
| DCF-557 | Shared Account Management | ISO 27001:2022 | 1. System Access Control Policy |
| DCF-566 | Register of Non-conformities | ISO 27001:2022 | 1. ISMS Plan, Appendix C |
| DCF-567 | Change Management Policy | ISO 27001:2022 | 1. Change Management Policy |
| DCF-568 | Records of Competence | ISO 27001:22 | 1. Records showing that all personnel listed in the ISMS Skills Matrix have the qualifications listed such as Resumes, LinkedIn Profiles, Copies of Certifications, etc. |

## Related articles

- [Policies to Framework Summary](policies-to-framework-summary.md)
- [DCF Library Updates on 1/18/2024](dcf-library-updates-on-1-18-2024.md)
- [ISO 27001:2022 Updates as of 5/7/2024](iso-27001-2022-updates-as-of-5-7-2024.md)
- [February 2025 Release: AWS and Azure Drata Tests](february-2025-release-aws-and-azure-drata-tests.md)
- [Control Mapping Updates for Policies - 10/17/2025](control-mapping-updates-for-policies-10-17-2025.md)
