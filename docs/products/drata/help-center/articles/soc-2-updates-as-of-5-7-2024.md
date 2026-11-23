# SOC 2 Updates as of 5/7/2024

Source: https://help.drata.com/en/articles/9265872-soc-2-updates-as-of-5-7-2024
Collection: Framework Information › SOC 2 2017
Updated: 2026-11-14
Fetched: 2026-11-22

## Article text

## Long story short…

We know this is a long article, so we’re going to give you the bottom line, up front.

This article applies to you if you manage SOC 2 2017 in Drata. We applied these changes in your account on 5/7/2024.

This update will not impact your framework readiness.

We gave you some additional controls, updated the control details, and refined some of our control-to-requirement mappings. However, you are not required to implement these changes to achieve or maintain compliance with SOC 2. If you want to take advantage of our new control details or control mapping, use the functionality outlined in [this article](https://help.drata.com/en/articles/8840054-revert-to-drata-s-latest-control-template-on-any-control-in-the-dcf-library) and [this article.](https://help.drata.com/en/articles/9201136-apply-default-mapping-between-controls-and-requirements) (Do be aware that if you apply our default mappings, your readiness is likely to change.)

Why do you have more controls in your account if you aren’t required to do anything? Because we wanted to give you all the latest information that we had in the spirit of continuous improvement. We don’t want to hold anything back from you.

## Why are we doing this?

**Updates from the AICPA**

In the fall of 2022, the AICPA released an updated version of the 2017 Trust Services Criteria for Security, Availability, Processing Integrity, Confidentiality, and Privacy (2017 TSC) with revised points of focus. The revised points of focus in this version are intended to better support application of the criteria in:

- an environment of ever-changing technologies, threats and vulnerabilities, and other matters that may create additional risks to organizations.
- addressing changing legal and regulatory requirements and related cultural expectations regarding privacy.
- addressing data management (for example, data storage, backup, and retention), particularly when related to confidentiality.
- differentiating which points of focus related to privacy may apply only to an organization that is a data controller or only to an organization that is a data processor, as defined in the glossary.

**Control library improvements**

We have updated the SOC 2 DCF control library to align with the 2022 revisions to the points of focus of the Trust Service Criteria. Additionally, we’ve used this as an opportunity to iterate on the DCF control library as a result of:

- Realignment of DCF Controls with other connected Drata features (e.g., monitoring tests, policies, etc.)
- Administrative maintenance and standardization
- Alignment with evolving industry standards and best practices
- Industry developments and emerging technologies (e.g., AI)
- Scope calibration and removal of redundancies
- Feedback from stakeholders (customers, audit firms, technology partners, etc.)

For more information on how Drata manages the DCF control library and control ↔ requirement mapping, refer to **[this article](https://help.drata.com/en/articles/8705808-the-drata-control-framework)**.

**What changed:**

**Requirement updates**

Under each SOC 2 trust service criterion (requirements), the descriptions of the points of focus have been updated to reflect TSP Section 100 - 2017 Trust Services Criteria for Security, Availability, Processing Integrity, Confidentiality, and Privacy (with Revised Points of Focus – 2022). [Refer to this AICPA document](https://www.aicpa-cima.com/resources/download/2017-trust-services-criteria-with-revised-points-of-focus-2022) for the authoritative reference.

**DCF Control Library Updates**

Below is a summary of the updates we made to the DCF control library.

Please note that these updates are **not mandatory** to maintain a SOC 2 compliance program because:

- The changes to the points of focus in the 2022 revisions do not, in any way, alter the criteria in the 2017 TSC.
- The trust services criteria do not prescribe a specific set of controls. Organizations define their own controls and processes based on their perceived risks and business objectives.
- Use of the trust services criteria does not require an assessment of whether each point of focus is addressed.

You are encouraged to evaluate these updates and determine whether you want to incorporate these into your SOC 2 compliance program. For example:

- You may determine that some of Drata’s new controls added to the SOC 2 catalog are not applicable to your organization, or are not necessary to mitigate a risk and therefore not relevant for your SOC 2 program. In this case, you can choose to mark these new controls out of scope.
- You may determine some of Drata’s new controls added to the SOC 2 catalog align with activities that you are already performing in your organization, or are activities that you would like to implement to mitigate risk and enhance your security posture and compliance program. In these cases, you may decide you want to formally manage these controls for your SOC 2, so you keep these new controls in scope.
- You may have made customizations to control descriptions that you wish to keep, so you may choose not to apply updates to descriptions based on Drata’s latest template. Alternatively, you may wish to align your control details to Drata’s latest recommendations, so you apply the latest updates to the control name and description to match Drata’s current version.

If you were an existing customer when we made these updates, you will see that we added new controls to your account. However, we did not pre-map them to SOC2 requirements on your behalf because we didn’t want to negatively impact your readiness upon release. This means you are able to review these new controls, and either apply Drata’s default mappings yourself, or you can mark them out of scope if you don’t want to include them in your compliance program.

We make it easy to map your controls and requirements according to our suggestions. Learn how to do that in [this article](https://help.drata.com/en/articles/9201136-apply-default-mapping-between-controls-and-requirements).

## Controls currently in the SOC 2 control library that will no longer be mapped to SOC 2 criteria

These controls were in the control library mapped to one or more SOC 2 criteria. The default mappings associated with SOC 2 criteria are now removed. However, if you were an existing customer at the time of the release, we did not remove these mappings on your behalf. If you reset your framework to use the default mappings, then you will see these mappings removed.

| Code | Legacy Name | Change Log |
|---|---|---|
| DCF-1 | Customer Data Policies | Removed mapping from SOC 2 and ISO 27001. Consolidated in DCF-37 and DCF-45. |
| DCF-2 | Least-Privileged Policy for Sensitive Data Access | Removed mapping from SOC 2 and ISO 27001. Replaced with DCF-69. |
| DCF-3 | Require Encryption of Web-Based Admin Access | Removed mapping from SOC 2 and ISO 27001. Generalized in DCF-59. |
| DCF-23 | Security Issues are Prioritized | Removed mapping from SOC 2 and ISO 27001. Replaced by DCF-28. |
| DCF-24 | SLA for Security Bugs | Removed mappings from SOC 2 and ISO 27001. Replaced by DCF-28. |
| DCF-34 | Security Team/Steering Committee | Removed mappings to SOC 2 and ISO 27001. Replaced with DCF-42. |
| DCF-35 | Security Team Communicates in a Timely Manner | Removed mappings to SOC 2 and ISO 27001. Deprecated control. |
| DCF-40 | Contractor Requirements | Removed SOC 2 and ISO 27001 Mappings. Control replaced by DCF-32, DCF-39, and DCF-44. |
| DCF-43 | Termination/Offboarding Checklist | Removed SOC 2 and ISO 27001 Mappings. Control replaced by DCF-70 and DCF-688. |
| DCF-53 | Cryptography Policies | Removed mappings for SOC 2 and ISO 27001. Redundant with DCF-181. |
| DCF-58 | Authentication Protocol | Removed mapping to SOC 2 and ISO 27001. Replaced by DCF-68, DCF-69, and DCF-747. |
| DCF-80 | Log Management System | Removed mapping to SOC 2 and ISO 27001. Replaced by DCF-79 and DCF-28. |
| DCF-81 | Databases Monitored and Alarmed | Removed mapping to SOC 2 and ISO 27001. Consolidated in DCF-86. |
| DCF-82 | Messaging Queues Monitored and Alarmed | Removed mapping to SOC 2 and ISO 27001. Consolidated in DCF-86. |
| DCF-83 | NoSQL Database Monitored and Alarmed | Removed mapping to SOC 2 and ISO 27001. Consolidated in DCF-86. |
| DCF-84 | Servers Monitored and Alarmed | Removed mapping to SOC 2 and ISO 27001. Consolidated in DCF-86. |
| DCF-89 | Cloud Infrastructure Linked to Drata | Removed mapping to SOC 2 and ISO 27001. Consolidated in DCF-160 |
| DCF-93 | Credential Keys Managed | Removed mapping to SOC 2 and ISO 27001. Redundant with DCF-181. |
| DCF-98 | Daily Backup Statuses Monitored | Removed mapping to SOC 2 and ISO 27001. Redundant with DCF-99. |
| DCF-113 | Review Privacy Notice Annually | Removed SOC 2 and ISO 27001 mapping. Redundant with DCF-120. |
| DCF-114 | Privacy Policy Publicly Available | Removed SOC 2 and ISO 27001 mapping. Redundant with DCF-65. |
| DCF-116 | Accept The Privacy Policy | Removed SOC 2 and ISO 27001 mapping. Redundant with DCF-112. |
| DCF-117 | Minimal Information Required | Removed SOC 2 and ISO 27001 mapping. Deprecated control. |
| DCF-118 | Third Party Reliability | Removed SOC 2 and ISO 27001 mapping. Replaced by DCF-507. |
| DCF-119 | Allowable Use and Disclosure | Removed SOC 2 and ISO 27001 mapping. Redundant with DCF-115. |
| DCF-121 | Purposeful Use Only | Removed SOC 2 and ISO 27001 mapping. Deprecated control. |
| DCF-124 | Require Authentication for Access | Removed SOC 2 and ISO 27001 mapping. Redundant with DCF-126. |
| DCF-125 | Users Can Access All Their Information | Removed SOC 2 and ISO 27001 mapping. Redundant with DCF-126. |
| DCF-128 | Disclosure with 3rd Parties | Removed SOC 2 and ISO 27001 mapping. Redundant with DCF-132. |
| DCF-129 | PII with 3rd Parties and Vendors | Removed SOC 2 and ISO 27001 mapping. Redundant with DCF-136. |
| DCF-131 | Incident Report Template and Process | Removed SOC 2 and ISO 27001 mapping. Redundant with DCF-159. |
| DCF-133 | Unauthorized Disclosures by 3rd Parties | Removed SOC 2 and ISO 27001 mapping. Redundant with DCF-127. |
| DCF-134 | 3rd Parties and Vendors Given Instructions on Breach Reporting | Removed SOC 2 and ISO 27001 mapping. Redundant with DCF-127. |
| DCF-137 | Data Entry Field Completion Automated | Removed SOC 2 and ISO 27001 mapping. Redundant with DCF-110 and DCF-111. |
| DCF-138 | Confirmation Before Submission | Removed SOC 2 and ISO 27001 mapping. Deprecated control. |
| DCF-139 | Contact Information for Privacy Concerns | Removed SOC 2 and ISO 27001 mapping. Redundant with DCF-140. |
| DCF-142 | Quarterly Review of Privacy Compliance | Removed SOC 2 and ISO 27001 mapping. Redundant with DCF-146. |
| DCF-143 | Board Oversight Briefings Conducted | Removed SOC 2 and ISO 27001 mapping. Redundant with DCF-146. |
| DCF-145 | Board Expertise Developed | Removed SOC 2 and ISO 27001 mapping. Replaced by DCF-41. |
| DCF-147 | Physical Access to Facilities is Protected | Removed SOC 2 and ISO 27001 mapping. Redundant with DCF-94. |
| DCF-148 | Regression Testing in Place | Removed SOC 2 and ISO 27001 mapping. Redundant with DCF-155. |
| DCF-151 | FIM (File Integrity Monitoring) Software in Place | Removed SOC 2 and ISO 27001 mapping. Replaced by DCF-478. |
| DCF-153 | Conduct Control Self-Assessments | Removed SOC 2 and ISO 27001 mapping. Redundant with DCF-160. |
| DCF-158 | MFA Available for External Users | Removed SOC 2 and ISO 27001 mappings. Replaced by DCF-747. |

## New controls in the database that will be mapped to SOC 2

These controls did not previously exist in our database. They will be added to the database and mapped to one or more SOC 2 criteria. However, if you were an existing customer we did not pre-map them for you upon release. We gave these controls to you, but it’s up to you if you want to apply Drata’s default mappings to put them to use.

| Code | Control Name |
|---|---|
| DCF-543 | Communication of Changes in Subprocessors |
| DCF-570 | Disciplinary Process |
| DCF-571 | Fire Detection and Suppression |
| DCF-572 | Temperature Monitoring Systems |
| DCF-573 | Uninterruptible Power Supply |
| DCF-574 | Mobile Device Management Software |
| DCF-684 | Redundancy of Processing Facilites |
| DCF-746 | Privacy Training |
| DCF-747 | Secure Log-on for Customers |
| DCF-748 | Segmentation of Networks |
| DCF-749 | Leak Detection System |
| DCF-753 | Mechanisms to Object to PII Processing |
| DCF-754 | Right to Access |
| DCF-756 | Dual Opt-In for Consent to Sell PII |
| DCF-757 | User and System Guides |
| DCF-765 | Limit Collection of PII |
| DCF-770 | Consulting with Customer Prior to PII Disclosures |
| DCF-774 | Data Processing Monitoring |
| DCF-775 | Cloud Deletion Protection |
| DCF-776 | Principle of Least Privilege |
| DCF-777 | Cloud Resource Tagging |
| DCF-778 | Fraud Risk Assessment |
| DCF-779 | Key Rotation |
| DCF-781 | Secure Login Procedures |
| DCF-782 | Cloud Storage Lifecycle |
| DCF-783 | Secret Rotation |
| DCF-784 | Software Composition Analysis (SCA) |
| DCF-785 | Secure Runtime Configurations |
| DCF-786 | Defined Company Objectives |

## Existing controls in the DCF control library that will now be mapped to SOC 2

These controls already exist in our DCF control library but are not mapped to SOC 2 criteria (i.e., they currently map to other frameworks offered by Drata). They will now be mapped to at least one SOC 2 criteria. However, if you were an existing customer, we did not pre-map them for you upon release. We gave these controls to you, but it’s up to you if you want to apply Drata’s default mappings to put them to use.

| Code | Control Name |
|---|---|
| DCF-173 | Employment Terms & Conditions |
| DCF-204 | Dataflow Diagram |
| DCF-253 | Data Secure Disposal |
| DCF-273 | Strong Key Generation Policies and Procedures |
| DCF-278 | Key Retirement Policies and Procedures |
| DCF-293 | Anti-Malware Capabilities and Automatic Updates |
| DCF-294 | Anti-Malware Tools Behavior |
| DCF-312 | Secure Code Development Training |
| DCF-326 | Need-to-Know Principle |
| DCF-339 | Account Lockout after Failed Logins |
| DCF-340 | Lockout Duration |
| DCF-350 | Password History Enforcement |
| DCF-355 | MFA for Remote Network Access |
| DCF-356 | Communication of Authentication Best Practices |
| DCF-363 | Entry Controls in Place |
| DCF-365 | Secure Physical Access Control Mechanisms |
| DCF-372 | Restricted Access to Badge System |
| DCF-374 | Visitors Authorized and Escorted |
| DCF-375 | Personnel and Visitor Badges |
| DCF-377 | Visitor Badge Control |
| DCF-378 | Visitor Log |
| DCF-381 | Media Physically Secured or Encrypted |
| DCF-406 | Audit Logging |
| DCF-407 | Audit Logs Data Points |
| DCF-409 | Audit Trail for Privileged Access |
| DCF-411 | Audit Trail for Invalid Access Attempts |
| DCF-412 | Audit Trail for Identification and Authentication Mechanism Changes |
| DCF-414 | Audit Trail of System-Level Object Changes |
| DCF-478 | Change Detection Mechanism |
| DCF-503 | Multiple Methods for Security Awareness |
| DCF-507 | Vendor Due Diligence |
| DCF-522 | Anti-Malware Scans of Media |
| DCF-527 | Designated Data Protection Officer |
| DCF-529 | Data Subject Consent |
| DCF-531 | Notification of Disclosures to Third Parties |
| DCF-536 | Record of Processing Activity (ROPA) |
| DCF-537 | Data Processing Agreements |
| DCF-540 | Timely Response to Data Subject Requests |
| DCF-541 | Procedures for Management of Data Subject Rights |
| DCF-549 | Identity Verification for Data Subject Requests |
| DCF-557 | Shared Account Management |
| DCF-558 | Restrictions on Software Installation |
| DCF-562 | Management of Utility Programs |
| DCF-567 | Change Management Policy |
| DCF-677 | Software Update and Patch Management |
| DCF-681 | Phishing Simulations |
| DCF-688 | Return of Assets |
| DCF-689 | On-Call Team |
| DCF-691 | Marketing Express Consent |
| DCF-712 | Static Application Security Testing |
| DCF-741 | Logging and Monitoring Policy |

## Complete SOC 2 Control Catalog as of May 7, 2024

In case anything above is lacking, we also wanted to provide you with a complete list of controls that are mapped to SOC2 as of the date of the release.

| **Code** | **Name** | **SOC 2 Criteria** |
|---|---|---|
| DCF-4 | Version Control System | CC8.1 |
| DCF-5 | Change Review Process | CC8.1 |
| DCF-6 | Production Changes Restricted | CC8.1, CC5.1 |
| DCF-7 | Separate Environments | CC8.1 |
| DCF-8 | External Communication Channels | CC2.3 |
| DCF-9 | Internal Communication Channels | CC2.2, CC1.1, CC1.5 |
| DCF-10 | Access Control Policy | CC6.2, CC6.3 |
| DCF-11 | Periodic Access Reviews | CC4.1, CC6.2, CC6.4, CC6.3 |
| DCF-12 | System Security Configuration and Hardening Standards | CC7.1, CC6.1 |
| DCF-13 | Information Security Policies | CC2.1, CC5.3 |
| DCF-14 | Organizational Chart | CC1.3, CC1.5, CC2.2 |
| DCF-15 | Risk Assessment Policy | CC3.2, CC3.3, CC4.2, CC5.3, CC3.4, CC3.1 |
| DCF-16 | Periodic Risk Assessment | CC3.2, CC3.3, CC4.2, CC5.1, CC5.2, CC3.4, A1.2, CC3.1 |
| DCF-17 | Risk Treatment Plan | CC3.2, CC3.3, CC4.2, CC5.1, CC5.2, CC3.4, CC3.1 |
| DCF-18 | Vulnerability Scans | CC3.2, CC4.1, CC5.2, CC7.1 |
| DCF-19 | Penetration Tests | CC4.1, CC5.2, CC7.1 |
| DCF-20 | Asset Inventory | CC2.1, CC6.1 |
| DCF-21 | Architectural Diagram | CC2.1 |
| DCF-22 | Network Diagram | CC2.1 |
| DCF-25 | Disaster Recovery Plan | CC5.3, CC9.1, A1.2, A1.3 |
| DCF-26 | BCP/DR Tests | A1.2, A1.3 |
| DCF-27 | Region or Zone Redundancy | CC9.1, A1.2 |
| DCF-28 | Security Events Tracked and Evaluated | CC7.3, CC7.4, CC7.5 |
| DCF-29 | Incident Response Team | CC7.4, CC7.5, CC7.3 |
| DCF-30 | Incident Response Lessons Learned Documented | CC7.3, CC7.4, CC7.5 |
| DCF-31 | Software Development Policies | CC8.1 |
| DCF-32 | Security Policies | CC1.1, CC2.2, CC2.1, CC5.2, CC5.3 |
| DCF-33 | Periodic Policy Reviews | CC2.1, CC2.2, CC5.3 |
| DCF-36 | Periodic Security Training | CC1.4, CC2.2, CC5.2 |
| DCF-37 | Acceptable Use Policy | CC5.3 |
| DCF-38 | Performance Evaluations | CC1.4, CC1.5, CC1.1 |
| DCF-39 | Background Checks | CC1.1 |
| DCF-41 | Independent Board of Directors | CC1.2 |
| DCF-42 | Defined Roles and Responsibilities | CC1.3, CC1.2 |
| DCF-44 | Code of Conduct | CC1.1, CC1.4, CC1.5, CC2.2, CC5.3 |
| DCF-45 | Data Protection Policy | CC6.7, C1.1, P4.2 |
| DCF-46 | Formal Screening Process | CC1.4 |
| DCF-47 | Job Descriptions | CC1.4, CC2.2 |
| DCF-48 | Screen Lockout | CC6.6 |
| DCF-49 | Password Manager | CC6.1 |
| DCF-50 | Antimalware Software on Devices | CC6.8, CC7.1 |
| DCF-51 | Automated Updates on Devices | CC7.1, CC6.7 |
| DCF-52 | Hard-Disk Encryption | CC6.1, CC6.7 |
| DCF-54 | Encryption at Rest | CC6.1, C1.1, P4.2, CC6.6, PI1.5, PI1.4 |
| DCF-55 | Encryption in Transit | CC6.6, CC6.7, CC6.1, C1.1, P4.2 |
| DCF-56 | Vendor Register and Agreements | CC3.2, CC9.2 |
| DCF-57 | Vendor Compliance Monitoring | CC3.2, CC9.2, P6.4, P6.5 |
| DCF-59 | Privileged Access Restricted | CC6.1, C1.1, P4.2, CC5.2, PI1.5, PI1.4 |
| DCF-60 | Secure Password Storage | CC6.1 |
| DCF-61 | Customer Data Segregation | CC6.1, C1.1, P4.2 |
| DCF-62 | Inactivity and Browser Exit Logout | CC6.6 |
| DCF-63 | Terms of Service | CC2.3 |
| DCF-64 | Commitments Communicated to Customers | CC2.3, CC3.1 |
| DCF-65 | Public Privacy Policy | P1.1, CC2.3 |
| DCF-66 | Master Service Agreements | CC2.3 |
| DCF-67 | Multi-Factor Authentication | CC6.1, CC6.6, C1.1, P4.2 |
| DCF-68 | Authentication Configurations | CC6.1, CC6.6, C1.1, P4.2 |
| DCF-69 | Access Provisioning | CC6.2, CC6.1, CC6.3, CC5.1, CC5.2 |
| DCF-70 | Access Deprovisioning | CC6.2, CC6.1, CC6.3 |
| DCF-71 | Unique User IDs | CC6.1 |
| DCF-72 | Root Access Control | CC6.1 |
| DCF-73 | Access to Remote Server Administration Ports Restricted | CC6.6 |
| DCF-74 | Communication of System Changes | CC2.3 |
| DCF-75 | Restricted Public Access | CC6.6, CC6.1 |
| DCF-76 | Critical Change Management | CC8.1 |
| DCF-77 | Database Backups | A1.2 |
| DCF-78 | Storage Bucket Versioning | CC7.1 |
| DCF-79 | Logging System | CC7.2, PI1.3 |
| DCF-85 | Network Security Controls | CC6.6, CC6.1 |
| DCF-86 | Operational Monitoring | CC7.2, CC4.1, A1.1, CC7.1 |
| DCF-87 | Threat Detection System | CC6.8, CC7.1, CC7.2, CC6.6 |
| DCF-88 | Web Application Firewall | CC6.6, CC7.2 |
| DCF-90 | Root Infrastructure Account Monitored | CC7.2, CC6.1 |
| DCF-91 | Intrusion Detection/Prevention System | CC6.6, CC7.1, CC7.2 |
| DCF-92 | Encrypted Remote Production Access | CC6.1, CC6.6, C1.1, P4.2 |
| DCF-94 | Physical Security Policy | CC6.4 |
| DCF-95 | Monitoring Processing Capacity and Usage | A1.1 |
| DCF-96 | Load Balancer | A1.1 |
| DCF-97 | Autoscaling | A1.1 |
| DCF-99 | Backup Monitoring | A1.2 |
| DCF-100 | Backup Restore Testing | A1.3 |
| DCF-101 | Data Retention Policy | C1.1, P4.2 |
| DCF-102 | Data Classification Policy | CC2.1, C1.1, P4.2, PI1.1 |
| DCF-103 | Customer Data Deletion Upon Termination | C1.2, P4.3 |
| DCF-104 | Test Data | C1.1, P4.2, CC8.1 |
| DCF-105 | Personnel Non-Disclosure Agreements (NDA) | CC1.1, CC2.3, C1.1 |
| DCF-107 | Disposal of Sensitive Data on Paper | C1.2, CC6.5 |
| DCF-108 | Secure Storage Mechanisms | CC6.4 |
| DCF-109 | Disposal of Sensitive Data on Hardware | CC6.5, C1.2 |
| DCF-110 | Acceptable Input Ranges | P7.1, PI1.2 |
| DCF-111 | Mandatory Fields | P7.1, PI1.2 |
| DCF-112 | Notice and Acknowledgement of Privacy Practices | P1.1, P2.1, P3.2 |
| DCF-115 | Privacy Policy Content | P1.1, P3.2, P4.1 |
| DCF-120 | Periodic Review of Privacy Policy | P1.1, P2.1, P3.1 |
| DCF-122 | Requests for Deletion of PII | P4.3 |
| DCF-123 | Procedures for Information Disposal | C1.2, P4.3, CC6.5 |
| DCF-126 | Personal Information Accessible Through System Authentication | P5.1, P5.2, P4.3, P7.1 |
| DCF-127 | Privacy Requirements Communicated to Third parties | P6.1, P6.4, P6.5 |
| DCF-130 | Documentation of Breaches or Unauthorized Disclosures of PII | P6.3, P6.4, P6.5, P6.6, P8.1 |
| DCF-132 | Privacy and Security Requirements in Third-Party Agreements | CC2.3, CC9.2, P6.5 |
| DCF-135 | Notification of Incidents or Breaches | P6.6, P8.1, CC7.3, CC7.4, CC7.5, P6.3 |
| DCF-136 | Use of Subprocessors Communicated | CC2.3, P6.1 |
| DCF-140 | Point of Contact for Privacy Inquiries | P4.3, P8.1, CC2.3 |
| DCF-141 | Privacy Inquiries Tracked | P6.7, P8.1 |
| DCF-144 | Board Charter Documented | CC1.2, CC1.3 |
| DCF-146 | Board Meetings | CC1.2, CC2.2, CC2.3, CC4.2 |
| DCF-149 | Removable Media Device Encryption | CC6.7 |
| DCF-150 | Data Loss Prevention (DLP) Mechanisms | CC6.7 |
| DCF-152 | Automated Security Updates | CC6.8, CC8.1 |
| DCF-154 | Incident Response Test | CC7.3, CC7.4, CC7.5 |
| DCF-155 | Testing of Changes | CC8.1 |
| DCF-156 | Change Releases Approved | CC8.1 |
| DCF-157 | Cybersecurity Insurance | CC9.1 |
| DCF-159 | Incident Response Plan | CC7.3, CC9.1, P6.6, CC7.4, CC7.5 |
| DCF-160 | Continuous Control Monitoring | CC2.1, CC2.2, CC5.1, CC5.2, CC3.3, CC3.2, CC3.4, CC4.1, CC4.2 |
| DCF-166 | Business Continuity Plan | CC5.3, CC9.1 |
| DCF-168 | Vendor Management Policy | CC9.2 |
| DCF-169 | Backup Policy | A1.2 |
| DCF-173 | Employment Terms & Conditions | CC1.3, CC2.2, CC1.1 |
| DCF-181 | Encryption Policy | CC6.1, CC5.3 |
| DCF-182 | Asset Management Policy | CC5.3 |
| DCF-183 | Vulnerability Management Policy | CC7.1, CC5.3 |
| DCF-204 | Dataflow Diagram | CC2.1, PI1.1 |
| DCF-253 | Data Secure Disposal | C1.2, P4.3 |
| DCF-273 | Strong Key Generation Policies and Procedures | CC6.1 |
| DCF-278 | Key Retirement Policies and Procedures | CC6.1 |
| DCF-293 | Anti-Malware Capabilities and Automatic Updates | CC6.8 |
| DCF-294 | Anti-Malware Tools Behavior | CC6.8 |
| DCF-305 | Production Components Change Control Procedures | CC8.1, CC6.8, CC5.2 |
| DCF-312 | Secure Code Development Training | CC1.4, CC2.2 |
| DCF-326 | Need-to-Know Principle | CC6.1 |
| DCF-339 | Account Lockout after Failed Logins | CC6.1 |
| DCF-340 | Lockout Duration | CC6.1 |
| DCF-350 | Password History Enforcement | CC6.1 |
| DCF-355 | MFA for Remote Network Access | CC6.6 |
| DCF-356 | Communication of Authentication Best Practices | CC6.1 |
| DCF-363 | Entry Controls in Place | CC6.4 |
| DCF-365 | Secure Physical Access Control Mechanisms | CC6.4 |
| DCF-372 | Restricted Access to Badge System | CC6.4 |
| DCF-374 | Visitors Authorized and Escorted | CC6.4 |
| DCF-375 | Personnel and Visitor Badges | CC6.4 |
| DCF-377 | Visitor Badge Control | CC6.4 |
| DCF-378 | Visitor Log | CC6.4 |
| DCF-381 | Media Physically Secured or Encrypted | CC6.7 |
| DCF-406 | Audit Logging | CC7.2 |
| DCF-407 | Audit Logs Data Points | CC7.2 |
| DCF-409 | Audit Trail for Privileged Access | CC7.2 |
| DCF-411 | Audit Trail for Invalid Access Attempts | CC7.2 |
| DCF-412 | Audit Trail for Identification and Authentication Mechanism Changes | CC7.2 |
| DCF-414 | Audit Trail of System-Level Object Changes | CC7.2 |
| DCF-478 | Change Detection Mechanism | CC8.1, CC7.1, CC6.8 |
| DCF-503 | Multiple Methods for Security Awareness | CC2.2 |
| DCF-507 | Vendor Due Diligence | CC3.2, CC9.2, P3.1 |
| DCF-522 | Anti-Malware Scans of Media | CC6.8 |
| DCF-527 | Designated Data Protection Officer | CC1.3 |
| DCF-529 | Data Subject Consent | P3.2, P2.1 |
| DCF-531 | Notification of Disclosures to Third Parties | P6.2 |
| DCF-536 | Record of Processing Activity (ROPA) | P4.1, CC2.2 |
| DCF-537 | Data Processing Agreements | P6.1, P6.5, CC9.2 |
| DCF-540 | Timely Response to Data Subject Requests or Inquiries | P5.1, P5.2, P4.3, P6.7, P8.1 |
| DCF-541 | Procedures for Management of Data Subject Rights | P5.1, P5.2, P4.3, P6.7 |
| DCF-543 | Communication of Changes in Subprocessors | CC2.3, P6.1 |
| DCF-549 | Identity Verification for Data Subject Requests | P5.1, P5.2 |
| DCF-557 | Shared Account Management | CC6.1 |
| DCF-558 | Restrictions on Software Installation | CC6.8 |
| DCF-562 | Management of Utility Programs | CC6.8 |
| DCF-567 | Change Management Policy | CC8.1 |
| DCF-570 | Disciplinary Process | CC1.1, CC1.5 |
| DCF-571 | Fire Detection and Suppression | A1.2 |
| DCF-572 | Temperature Monitoring Systems | A1.2 |
| DCF-573 | Uninterruptible Power Supply | A1.2 |
| DCF-574 | Mobile Device Management Software | CC6.4, CC6.8, CC6.5 |
| DCF-677 | Software Update and Patch Management | CC8.1 |
| DCF-681 | Phishing Simulations | CC1.4, CC2.2 |
| DCF-684 | Redundancy of Processing | A1.2 |
| DCF-688 | Return of Assets | CC6.4 |
| DCF-689 | On-Call Team | CC7.3, CC7.4, CC7.5 |
| DCF-691 | Marketing Express Consent | P2.1, P3.1, P3.2 |
| DCF-712 | Static Application Security Testing | CC7.1, CC8.1 |
| DCF-741 | Logging and Monitoring Policy | CC7.2 |
| DCF-746 | Privacy Training | CC2.2, CC1.4 |
| DCF-747 | Secure Log-on for Customers | PI1.4, PI1.3 |
| DCF-748 | Segmentation of Networks | CC6.1, CC6.6 |
| DCF-749 | Leak Detection System | A1.2 |
| DCF-753 | Mechanisms to Object to PII Processing | P2.1, P3.2 |
| DCF-754 | Right to Access | P5.1, P5.2, P6.7 |
| DCF-756 | Dual Opt-In for Consent to Sell PII | P2.1, P3.2 |
| DCF-757 | User and System Guides | CC2.2, CC2.3, PI1.1, PI1.3, PI1.4 |
| DCF-765 | Limit Collection of PII | P3.1, P4.1 |
| DCF-770 | Consulting with Customer Prior to PII Disclosures | P3.2 |
| DCF-774 | Data Processing Monitoring | PI1.3 |
| DCF-775 | Cloud Deletion Protection | C1.1 |
| DCF-776 | Principle of Least Privilege | CC6.3 |
| DCF-777 | Cloud Resource Tagging | CC6.1 |
| DCF-778 | Fraud Risk Assessment | CC3.3 |
| DCF-779 | Cryptographic Key Rotation | CC6.1 |
| DCF-781 | Secure Login Procedures | CC3.3 |
| DCF-782 | Cloud Storage Lifecycle | C1.2 |
| DCF-783 | Credentials Rotation | CC6.1 |
| DCF-784 | Software Composition Analysis (SCA) | CC7.1 |
| DCF-785 | Secure Runtime Configurations | CC7.1 |
| DCF-786 | Defined Company Objectives | CC3.1, CC2.2, CC3.2 |

## Related articles

- [SOC 2: All controls](soc-2-all-controls.md)
- [Example Evidence for Not Monitored Controls Linked to Policies](example-evidence-for-not-monitored-controls-linked-to-policies.md)
- [DCF Library Updates on 1/18/2024](dcf-library-updates-on-1-18-2024.md)
- [ISO 27001:2022 Updates as of 5/7/2024](iso-27001-2022-updates-as-of-5-7-2024.md)
- [October 2024 Release: AWS Drata test](october-2024-release-aws-drata-test.md)
