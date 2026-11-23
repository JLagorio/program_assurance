# Example Evidence for Not Monitored Controls (HIPAA)

Source: https://help.drata.com/en/articles/9421032-example-evidence-for-not-monitored-controls-hipaa
Collection: Framework Information › HIPAA
Updated: 2026-11-14
Fetched: 2026-11-22
Description: Example Evidence for Not Monitored Controls (HIPAA)

## Article text

The following is a list of example evidence for controls not monitored in Drata for HIPAA.

**Please note:** An auditor may request additional evidence for each control.

| **Code** | **Name** | **Example Evidence** |
|---|---|---|
| DCF-1 | Customer Data Policies | Asset Management Policy,Information Security Policy,Acceptable Use Policy,Data Protection Policy,ISMS Plan (2013 and 2022) |
| DCF-2 | Least-Privileged Policy for Sensitive Data Access | System Access Control Policy |
| DCF-9 | Internal Communication Channels | Screenshots from communication tools (Slack, PagerDuty) showing the process for security events to be communicated to appropriate personnel. |
| DCF-11 | Periodic Access Reviews | 1. Tickets documenting the access control lists that were reviewed for in scope cloud environments, SaaS applications, infrastructure as code tools, and security protection tools (as applicable)<br>- and -<br>2. Tickets should be marked as completed/closed and the reviewer should provide comments on the results of the reviews. |
| DCF-16 | Periodic Risk Assessment | Most recently completed risk assessment report. |
| DCF-17 | Risk Treatment Plan | Documented remediation plans for risks identified during the risk assessment. |
| DCF-19 | Penetration Tests | Most recently completed annual penetration test. |
| DCF-20 | Asset Inventory | 1. Formal, documented listing of all assets (workstations, mobile devices, servers, databases, etc.)<br>- and -<br>2. For cloud infrastructure, screenshots from cloud environments listing all infrastructure |
| DCF-21 | Architectural Diagram | Approved Architectural Diagram |
| DCF-22 | Network Diagram | Formal, documented network/architecture diagram evidencing network segmentation of your cloud environments. |
| DCF-26 | BCP/DR Tests | Most recently completed BCP/DR test. |
| DCF-29 | Incident Response Team | Provide the documented list of Incident Response team members who have the responsibility and authority to coordinate and execute incident response procedures. |
| DCF-34 | Security Team/Steering Committee | Evidence that a Security Team has been assigned for the design, implementation, management, and review of the organization's security policies, standards, baselines, procedures, and guidelines. |
| DCF-35 | Security Team Communicates in a Timely Manner | Screenshots from communication tools (Slack, PagerDuty) showing the process for security events to be communicated to appropriate personnel. |
| DCF-40 | Contractor Requirements | Executed Agreement/contract between the entity and key vendors. |
| DCF-43 | Termination/Offboarding Checklist | Formal documented termination checklist/help desk ticket for a recent terminated employee. |
| DCF-53 | Cryptography Policies | 1. List of all locations where data is transmitted or received over open, public networks.<br>- and -<br>2. Documented standards which detail the level of security protocols and cryptographic algorithms used to protect this data.<br>- and -<br>3. Screenshots from the system configurations of the systems receiving this data showing the implementation of these security protocols and encryption algorithms |
| DCF-56 | Vendor Register and Agreements | 1. Provide evidence of a centralized, up-to-date inventory listing all your vendors/third parties. This should include details such as vendor name, relationship owner, a description of services, and their assigned risk rating.<br>   1. Screenshots from your vendor management system (e.g., Drata's TPRM module, a dedicated GRC tool, or a comprehensive spreadsheet) clearly showing the categorized list of vendors based on impact/risk, along with the other required attributes.<br>2. Upon request, provide evidence of an example executed agreement/contract between the entity and key vendors. This should be an agreement with a vendor involved in accessing, processing, storing, or managing your information assets. |
| DCF-58 | Authentication Protocol | 1. If SSO is an option, screenshots of a user logging in with SSO.<br>- and -<br>2. If username and password is an option, screenshots of a user logging in with a username and password.<br>- and -<br>3. Screenshots of MFA being required for employee users.<br>- and -<br>4. If users have the option to enable MFA, screenshots showing they are provided the option to enable MFA. |
| DCF-60 | Secure Password Storage | If username and password is required, screenshots from the database showing that password are stored using a salted hash. |
| DCF-62 | Inactivity and Browser Exit Logout | 1. Screenshots of users being logged out of the application when browser/tab is closed and being forced to reauthenticate upon next login.<br>- and -<br>2. Screenshots showing that a user is logged out after pre-defined activity timeout and being forced to reauthenticate upon next login. |
| DCF-64 | Commitments Communicated to Customers | 1. Upload evidence of a recently executed service agreement with a customer.<br>- and -<br>2. Upload evidence of your terms of service available online, as well as screenshots of the account sign up process showing users are required to accept the terms of service prior to using the system. |
| DCF-69 | Access Provisioning | Formal, documented access request form/help desk ticket for a recent new hire. |
| DCF-72 | Root Access Control | Screenshots of a user logging into the production systems, showing that they have to use a unique SSH account.<br>- or -<br>Screenshot of the setting from the production servers showing that the "root" account cannot be used to login to production. |
| DCF-79 | Logging System | Screenshots from the location where logs of system activity are stored. |
| DCF-80 | Log Management System | 1. Screenshots of logging software alert configuration<br>- and -<br>2. Screenshots from the location where logs of system activity are stored.<br>- and -<br>3. Evidence of corrective action being taken when alerted |
| DCF-81 | Databases Monitored and Alarmed | 1. Screenshots from the tool (or solution) showing that it is configured to monitor databases and alert/notify personnel of any identified incidents<br>- and -<br>2. Evidence that any identified incidents were escalated per policy. |
| DCF-82 | Messaging Queues Monitored and Alarmed | 1. Screenshots from the tool (or solution) showing that it is configured to monitor messaging queues and alert/notify personnel of any identified incidents<br>- and -<br>2. Evidence that any identified incidents were escalated per policy. |
| DCF-83 | NoSQL Database Monitored and Alarmed | 1. Screenshots from the tool (or solution) showing that it is configured to monitor NoSQL databases and alert/notify personnel of any identified incidents<br>- and -<br>2. Evidence that any identified incidents were escalated per policy. |
| DCF-84 | Servers Monitored and Alarmed | 1. Screenshots from the tool (or solution) showing that it is configured to monitor servers and alert/notify personnel of any identified incidents<br>- and -<br>2. Evidence that any identified incidents were escalated per policy. |
| DCF-91 | Intrusion Detection/Prevention System | 1. Screenshots from AWS GuardDuty, Azure Sentinel, GCP Security Command Center or equivalent monitoring tool showing that the service is enabled.<br>- and -<br>2. Screenshots from the mentioned applications/tools/services showing the types of threats that would be detected.<br>- and -<br>3. Screenshots from the mentioned applications/tools/services showing how personnel would be alerted and who would be alerted when threats are detected. |
| DCF-92 | Encrypted Remote Production Access | 1. Screenshots of a user trying to access production systems without being connected to a VPN and providing access is denied.<br>- and -<br>2. Screenshots of a user accessing production after connecting to a VPN to show a successful connection. |
| DCF-93 | Credential Keys Managed | 1. Key Management procedures included in the Encryption Policy<br>- and -<br>2. Evidence of the cryptographic technique used to manage keys |
| DCF-98 | Daily Backup Statuses Monitored | Tickets showing that backup failures were monitored and resolved. |
| DCF-99 | Failed Backup Alert and Action | 1. Automated configurations from the backup service for notifying personnel when backup processes fail.<br>- and -<br>2. Example email for a failed backup and ticket documenting resolution. |
| DCF-100 | Backup Restore Testing | 1. Screenshots showing a backup snapshot was restored completely and accurately.<br>- and -<br>2. Evidence from the annual DR tests showing that backups were restored completely and accurately. |
| DCF-103 | Customer Data Deletion Upon Termination | 1. For a recently churned customer, upload evidence showing that customer data disposal was conducted in accordance with the contractual agreements with the customer (such as evidence of logs showing data was disposed of, screenshots from production resources such as storage buckets and databases showing customer-specific resources were decommissioned.).<br>- and -<br>2. Upload evidence of the agreement with the former customer to show the specific data disposal requirements and commitments. |
| DCF-106 | Clean Desk and Clear Screen Policies and Procedures | 1. Acceptable Use Policy<br>- and -<br>2. (If applicable) Acknowledgement of the Acceptable Use Policy |
| DCF-107 | Disposal of Sensitive Data on Paper | Observation of hard copy material being disposed<br>Note: This can be performed by auditors on-site, or via virtual meeting. |
| DCF-108 | Secure Storage Mechanisms | Pictures of secure storage bins from office locations. |
| DCF-109 | Disposal of Sensitive Data on Hardware | Data Retention Policy or equivalent policy documenting this policy and procedure. |
| DCF-112 | Notice and Acknowledgement of Privacy Practices | Screenshots of the new user registration process where new users are provided the notice of privacy practices before completing the registration process. |
| DCF-113 | Review Privacy Notice Annually | Meeting minutes from management's annual meeting to review privacy practices. |
| DCF-114 | Privacy Policy Publicly Available | Screenshot of privacy practices posted on the entity's website. |
| DCF-119 | Allowable Use and Disclosure | Section from privacy practices/policy that covers this item. |
| DCF-120 | Periodic Review of Privacy Policy | Meeting minutes for management's annual review of privacy policies |
| DCF-123 | Procedures for Information Disposal | Formal, documented data deletion policy. |
| DCF-124 | Require Authentication for Access | Screenshots of a user authenticating to the application prior to seeing their information. |
| DCF-125 | Users Can Access All Their Information | Screenshots of where a user can find their information within the platform (i.e. user profile). |
| DCF-126 | Personal Information Accessible Through System Authentication | Screenshots of a user modifying their personal information within the application. |
| DCF-127 | Privacy Requirements Communicated to Third parties | Evidence to support that third parties with whom PII is sent to, were provided requirements for how PII should be handled, according to your requirements. |
| DCF-128 | Disclosure with 3rd Parties | Example executed contracts with third parties that receive PII showing that contracts included provisions for third parties to protect personal information. |
| DCF-129 | PII with 3rd Parties and Vendors | Formal, documented authorized list of third parties that can receive or access PII. |
| DCF-131 | Incident Report Template and Process | Formal, documented incident response procedures. |
| DCF-132 | Privacy and Security Requirements in Third-Party Agreements | Executed agreements (such Data Processing Agreements, Business Associates Agreements, Service Provider Agreements) with third parties and vendors that are provided access to personal data. |
| DCF-133 | Unauthorized Disclosures by 3rd Parties | Example executed contracts with third parties that receive PII showing that contracts included provisions for third parties to protect personal information. |
| DCF-134 | 3rd Parties and Vendors Given Instructions on Breach Reporting | Executed contracts with third parties that are provided access to PII to confirm that third parties are provided with information on how to report breaches of PII to the entity. |
| DCF-135 | Notification of Incidents or Breaches | 1. Formal, documented breach notification procedures.<br>- and -<br>2. Breach Notification Template |
| DCF-136 | Use of Subprocessors Communicated | Section from privacy practices on your website showing that 3rd parties that receive PII are listed. |
| DCF-139 | Contact Information for Privacy Concerns | Section from privacy practices on your website showing contact information for how external personnel contact you with inquiries, complaints, and disputes. |
| DCF-140 | Point of Contact for Privacy Inquiries | Screenshots of how a customer can submit inquiries, complaints or disputes about privacy issues. |
| DCF-141 | Privacy Inquiries Tracked | 1. Screenshots of the incident tracking system used to track users' complaints, inquiries and disputes.<br>- and -<br>2. Example submitted inquiries, complaints or disputes and evidence that resolution was communicated to the customer and corrective actions were performed, as necessary. |
| DCF-142 | Quarterly Review of Privacy Compliance | Meeting minutes from quarterly management meetings for tracking compliance with privacy practices and privacy regulations. |
| DCF-143 | Board Oversight Briefings Conducted | Meeting minutes from the Board of Directors meeting showing that the state of cybersecurity and privacy risks were discussed. |
| DCF-147 | Physical Access to Facilities is Protected | Physical Access Control Policy |
| DCF-149 | Removable Media Device Encryption | If removable media devices are issued by the company to employees, provide evidence that removable media devices are encrypted. |
| DCF-150 | Data Loss Prevention (DLP) Mechanisms | 1. Screenshots of DLP software.<br>- and -<br>2. Example of emails being blocked when they contain sensitive data |
| DCF-151 | FIM (File Integrity Monitoring) Software in Place | 1. Screenshots of FIM software.<br>- and -<br>2. Examples of FIM detecting changes. |
| DCF-153 | Conduct Control Self-Assessments | 1. Annual internal control assessment report with any identified findings<br>(Note: Drata can also be used as evidence for continuous control assessment)<br>- and -<br>2. Evidence that corrective actions were taken for the identified findings |
| DCF-154 | Incident Response Test | Most recently completed incident response tabletop test. |
| DCF-166 | Business Continuity Plan | Business Continuity Plan. |
| DCF-167 | Business Impact Analysis | Business Impact Analysis (Typically part of the business continuity plan). |
| DCF-168 | Vendor Management Policy | Vendor Management Policy |
| DCF-177 | Event Logging | Section from the Data Protection Policy |
| DCF-179 | Competence Records | 1. Upload documented job descriptions for both a recently hired personnel and an existing personnel.<br>- and -<br>2. Upload evidence of the formal interview/recruitment process for a recently hired personnel (for example calendar invites for interviews, documented feedback notes from interviewers, exports from the candidate's profile within the applicant tracking system, evidence of evaluation of resume and professional credentials .).<br>- and -<br>3. Upload an example of a completed performance evaluation for a sample personnel performed within the past year showing components of the evaluation process (for example, self-reviews, peer-reviews, manager-reviews).<br>- and -<br>4. Upload evidence for an example personnel with assigned roles within the management system(s) showing that they have the necessary competence to fulfill their duties on the basis of appropriate education, training, or experience.<br>Note: Example evidence may include, but is not limited to:<br>- records of education, certifications, and professional credentials<br>- records of training programs, courses and educational activities<br>- records of actions taken to acquire and retain the necessary competence as it relates to the management system |
| DCF-182 | Asset Management Policy | Asset Management Policy |
| DCF-189 | Activity Review | For this control, your organization will have to define a frequency for each of the three covered activities. This could be weekly, monthly, quarterly, it will depend on the size of your organization and what makes sense for each of the three areas:<br>1. Audit log reviews - A ticket from the ticketing system documenting which audit logs were reviewed, who reviewed them, and when the review was completed.<br>- and -<br>2. Security Incident Tracking Reports - A ticket documenting the review of incident reports including who completed the review and when the review was completed. Or meeting minutes demonstrating that incident reports were reviewed including who attended the meeting and the date.<br>- and -<br>3. Ticket documenting which system activity logs were reviewed, who reviewed these activity reports, and when the review was completed. |
| DCF-190 | Designated Security Officials | Information Security Policy<br>or<br>Job description of designated Security Official(s) outlining their responsibility for overseeing the organizations’ compliance with the security rule. |
| DCF-191 | Security Updates | Information Security Policy |
| DCF-192 | Privacy, Use, and Disclosure | Privacy, Use, and Disclosure Policy |
| DCF-193 | Breach Notification | Breach Notification Policy |
| DCF-194 | Group Health Plans | Plan documents outlining the requirements mapped to the controls. If you are not a Group Health Plan, then mark this control out of scope. |
| DCF-195 | Business Associate Agreements | 1. Vendor Management Policy<br>- and -<br>2. Business Associate Policy<br>- and -<br>3. BAA template (if not contained within the Business Associate Policy) |
| DCF-196 | HIPAA Awareness Training | Privacy, Use, and Disclosure Policy<br>If HIPAA training is not completed inside of Drata, screenshots showing a certificate of completion from the HIPAA training provider.<br>Any other evidence supporting training on policies and procedures for handling PHI, as applicable. |
| DCF-197 | Document Retention Period | 1. Data Protection Policy<br>-and-<br>2. A document retention schedule should additionally be drawn up listing specific types of records, such as Business Associate Agreements, and the retention period such as 7 years. This should be uploaded to the Evidence Library page, and then linked to this control.<br>-and-<br>3. Any other policies supporting document retention requirements, as applicable |
| DCF-253 | Data Secure Disposal | Policies and procedures for data disposal. |
| DCF-339 | Account Lockout after Failed Logins | Upload evidence of the account lockout configurations after failed login attempts for relevant systems where this is a configurable attribute, showing number of attempts that trigger the lockout and lockout duration. |
| DCF-350 | Password History Enforcement | Screenshots of system configurations showing that passwords must be different from the previous 4 passwords. |
| DCF-386 | Management Approval for Media Transfer | Documentation from a recent media transfer (including media distribution to individuals) showing that the transfer was approved by an authorized member of management. |
| DCF-503 | Multiple Methods for Security Awareness | Upload evidence showing that periodic security updates are provided to personnel through different mechanisms (such as screenshots of internal newsletters or intranet with security reminders, security updates sent out via Slack or other internal communication channels) |
| DCF-681 | Phishing Simulations | Upload evidence showing phishing simulations are conducted as part of the company's security awareness initiatives (such as screenshots from phishing simulation campaign configurations, screenshots of dashboards showing results of the campaign, screenshot showing example simulated phishing email) |
| DCF-741 | Logging and Monitoring Policy | Logging and Monitoring Policy |

## Related articles

- [Example Evidence for Not Monitored Controls Linked to Policies](example-evidence-for-not-monitored-controls-linked-to-policies.md)
- [Example Evidence for Not Monitored Controls (SOC 2)](example-evidence-for-not-monitored-controls-soc-2.md)
- [Example Evidence for Not Monitored Controls (CIS 8.1)](example-evidence-for-not-monitored-controls-cis-8-1.md)
- [Example Evidence for Not Monitored Controls (ISO 42001)](example-evidence-for-not-monitored-controls-iso-42001.md)
- [Example Evidence for Not Monitored Controls (NIST CSF 2.0)](example-evidence-for-not-monitored-controls-nist-csf-2-0.md)
