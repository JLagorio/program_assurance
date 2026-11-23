# System Access Control Policy Guidance

Source: https://help.drata.com/en/articles/7211097-system-access-control-policy-guidance
Collection: Policy Guidance
Updated: 2026-11-14
Fetched: 2026-11-22

## Article text

## The following article contains guidance explaining portions of the System Access Control Policy that we frequently see questions around, explaining what the sections mean.

Guidance statements will appear in bold and enclosed in brackets “[]” below the statements of the policy.

## System Access Control Policy

## [COMPANY NAME]

____________________________________________________________________________

## Background

Access to [COMPANY NAME] systems and applications is limited for all users, including but not limited to workforce members, volunteers, business associates, contracted providers, and consultants. Access by any other entity is allowable only on a minimum necessary basis. All users are responsible for reporting an incident of unauthorized use or access of the organization's information systems.

## Purpose

The purpose of this procedure is to provide a policy and guideline for creating, modifying, or removing access to the company’s network and data by creating, changing or deleting the network account configuration for a User.

## Scope

This policy and defined process is used to allow access to the company’s data and systems to individuals who meet the requirements defined in this policy. This policy governs individuals who are granted access that is necessary to support the business. This policy relates to all data used, processed, stored, maintained, or transmitted in and through the company’s systems.

## Policy

## Access Establishment and Modification 

- The level of security assigned to a user to the organization's information systems will be based on the minimum necessary amount of data access required to carry out legitimate job responsibilities assigned to a user's job classification.
- All access to systems and data will be regulated by the role-based access control (RBAC) method, based on the *Principle of Least Privilege*.
- The need for segregation of duties will be considered when assigning user rights.

**[This section is saying that you have defined access for different job roles by default. For example, it would be standard for a developer/software engineer to have write access to your source code repositories, but would be non-standard access for someone in HR or Finance to have that level of access. Someone in HR or Finance would require an additional documented approval to receive that level of access.]**

All access requests will require formal documentation and authorization. This includes changes to user IDs (addition, deletion, and modification), authentication factors, and other identifier objects as well as changes in access rights.

Requests for access to [COMPANY NAME] Platform systems and applications are made formally using the following process:** [This process can be updated based on the organization’s process]**

- A [COMPANY NAME] workforce member initiates the access request by creating an Issue in the [COMPANY NAME] ticketing system.

- **[A ticketing system is not required for this documentation, but is recommended for auditability.]**

- User identities must be verified prior to granting access to new accounts.
- Identity verification must be done in person where possible; for remote employees, identities must be verified over the phone.
- For new accounts, the method used to verify the user's identity must be recorded on the Issue.

- **[Identity verification over the phone or another method such as Zoom and recording this verification are not required, but are recommended as a security best practice.]**

- The Security Officer will grant or reject access to systems as dictated by the employee's role and job title.
   - If additional access is required outside of the minimum necessary to perform job functions, the requester must include a description of why the additional access is required as part of the access request.
   - If the request is rejected, it goes back for further review and documentation.
   - If the review is approved, the request is marked as “Done”, and any pertinent notes are added.

## Access Reviews

All user access to [COMPANY NAME] systems and services to ensure user accounts, including third party or vendor accounts, and their associated roles and permissions will be reviewed periodically by management to ensure they remain appropriate based on job function. Access reviews will be performed on a **<FREQUENCY OF ACCESS REVIEWS>** basis to ensure proper authorizations are in place.

**[Quarterly is recommended for the frequency of access reviews]**

## Unique User Identification

- All user access to system components for users and administrators will be authenticated via at least one of the following authentication factors:
   - Something you know, such as a password or passphrase.
   - Something you have, such as a token device or smart card.
   - Something you are, such as a biometric element.
- Access to the [COMPANY NAME] systems and applications is controlled by requiring unique user login IDs and passwords for each individual user.
- Authentication requirements, such as single sign-on (SSO) authentication and/or minimum password requirements, will be enforced across all systems in accordance with the *Password Policy*.
- Passwords are not displayed at any time and are not transmitted or stored in plain text.
- Default accounts on all production systems, including root, will be deleted, disabled or restricted to a limited number of authorized administrators and used only under exceptional circumstances with documented business justification and management approval.
- Group, shared, or generic account usage will be prevented unless strictly necessary and supported by documented business justification and management approval. Mechanisms will be implemented to confirm individual user identity before access to the account is granted and to trace every action to an individual user.
- Unique authentication factors such as physical or logical security tokens, smart cards, or certificates will be assigned to individual users and cannot shared among multiple users. Physical or technical controls, such as a PIN, biometric data, passwords, etc., will be implemented so that only the intended user can use that factor to gain access.
- Automated log-on configurations other than the company’s approved Password Management provider that store user passwords or bypass password entry are not permitted for use with [COMPANY NAME] workstations or production systems.
- Identifiers will include user characteristics and status to help further identify the individual, such as employment status (e.g., contractor, non-organizational users).
   - **[This requirement is specific to NIST SP 800-53 and is not currently applicable to other frameworks.]**

## Multi-factor Authentication

- User authentication to systems will require the use of multi-factor authentication where technically feasible.
- Where multi-factor authentication (MFA) is used, system configurations are in place to:
   - Prevent replay attacks
   - Require at least two different types of authentication factors
   - Restrict bypassing of requirements by any users, including administrative users, unless specifically documented, and authorized by management on an exception basis, for a limited time period.
- All remote access to the entity’s network (including that of users, administrators, and third parties or vendors) will require multi-factor authentication.

## Automated Logoffs

- Company-issued devices, and bring-your-own or third party devices that may connect to company systems, as applicable, will be configured to enforce a screensaver lock with a timeout of **<# minutes or less>.**
- Where technically feasible, [COMPANY NAME]’s applications and systems will be configured to automatically log users out after **<# minutes of inactivity> **or closure of the system or internet browser.

**[A maximum of 15 minutes is required for PCI DSS compliance]**

## Third-Party Access

Accounts used by third parties to access, support, or maintain system components via remote access will be enabled during the time period needed based on documented authorization by management and disabled when not in use. Third-party remote access will be monitored by company personnel for unexpected activity.

## Application and System Accounts

Application and system accounts and related access privileges will be provisioned based on documented authorization from management and limited to only the access needed for the operability of an application or system.

If accounts used by systems or applications can be used for interactive login, they will be managed as follows:

- Interactive use will be prevented unless needed for an exceptional circumstance.
- Interactive use will be limited to the time needed for the exceptional circumstance.
- Business justification for interactive use will be documented.
- Interactive use will be explicitly approved by management.
- Individual user identity will be confirmed before access to account is granted, and every action taken will be attributable to an individual user.

## Cloud Service Access

**<Access Reviews for Cloud Services are not explicitly required by the SOC 2 framework, but they are recommended as a best practice. However, access reviews are required under other frameworks, such as ISO/IEC 27017:15, which provides specific guidelines for cloud security. It is essential to understand the specific requirements of each framework relevant to your organization to ensure comprehensive compliance and robust security practices.>**

## *Cloud Service Customers*

[COMPANY NAME]'s network services will clearly specify the requirements for user access to each individual cloud service provider utilized (See Appendix B).

- [COMPANY NAME] will ensure that access to these cloud services can be restricted per this policy, including limiting access to the cloud services, specific functions within a cloud service, and [COMPANY NAME] data maintained within the service.

## Cloud Service Providers

[COMPANY NAME] will provide access controls to allow its cloud service customers to enforce their access restrictions to the cloud service, cloud service functions, and the data they store within the service.

- Virtual environments of cloud service customers will be protected from unauthorized access by other cloud service customers or unauthorized individuals. [COMPANY NAME] will enforce the logical segregation of cloud service customer data, virtualized applications, operating systems, storage, and network infrastructure for:
   - Separation of [COMPANY NAME]'s internal administration from resources used by its cloud service customers.
   - Separation of resources used by different cloud service customers in multi-tenant environments, where [COMPANY NAME] will implement robust information security controls to ensure appropriate isolation of resources utilized by different tenants. These controls mitigate the risks associated with sharing infrastructure among multiple customers.
- When cloud service customers supply and run third-party software within [COMPANY NAME]’s cloud services, [COMPANY NAME] will assess and address the risks associated with the execution of such software to prevent any unauthorized access or interference within the cloud services.

## Use of Utility Programs

Access to manage utility programs (including anti-virus consoles and diagnostic, patching, backup, or network tools, or any other utility capable of bypassing normal or operating system and application controls) will be restricted to authorized system administrators. Standard users will be restricted from accessing privileged utilities or modifying their configurations through access controls and authentication mechanisms.

**[This is required for ISO 27001:2022, ISO 27017:2015, PCI 4.0, SOC 2. However, optional for other frameworks]**

## Concurrent Sessions

[COMPANY NAME] limits the number of concurrent sessions, as follows:

- Ex. Account X: **<MAX # OF SESSIONS>**
- Ex. Accounts Type A: **<MAX # OF SESSIONS>**

- **[The Concurrent Sessions section is specific to NIST SP 800-53, and is not required for other frameworks.] **

## Disabling Accounts

In order to mitigate risk, user accounts will be disabled as outlined in Appendix A.

- **[The Disabling Accounts section and Appendix A are specific to NIST SP 800-53 and are not required for other frameworks.]**

## Employee Termination/Offboarding Procedures

System and physical access will be revoked within **<SLA FOR SEPARATION>** of effective termination date for terminated users (including employees, third parties and vendors, and other personnel). The procedure is as follows:

**[The standard separation SLA is within 1 business day]**

- The HR/People department (or other designated department), users, and their supervisors are required to notify system administrators of an upcoming separation and facilitate completion of the "Termination Checklist".
- The system administrators will terminate users' access rights within the established SLAs of termination/separation.
- The HR/People department (or other designated department) will track the return of all electronic and physical assets upon termination as part of the offboarding process, including laptops and other equipment, files, and access mechanisms such as keys, access cards, badges, MFA tokens, etc.

The HR/People department, users, and supervisors are required to notify the system administrators to terminate a user's access rights if there is evidence or reason to believe the following (these incidents are also reported on an incident report and are filed with the Management):

- The user has been using their access rights inappropriately;
- A user's password has been compromised (a new password may be provided to the user if the user is not identified as the individual compromising the original password);

Management will disable inactive accounts of users that have not logged into the organization's information systems/applications for 90 days or more.

**[This is a requirement for PCI, but may be optional for other frameworks.]**

## APPENDIX A

**Disabling Accounts**

**High Risk Users**

[COMPANY NAME] will disable accounts of users that are deemed to pose a high risk to the company’s systems. Accounts will be disabled for the given duration and within the defined time period given the specific risk(s)

| **Risk** | **Time Period to Disable** | **Duration of Disablement** |
|---|---|---|
| Ex. User intends to sell company information to competitor | Immediately | 1 month |
|  |  |  |
|  |  |  |

## APPENDIX B

**Access Requirements for Individual Cloud Service Providers**

(For Cloud Service Customers) [COMPANY NAME]’s requirements for user access to each individual cloud service provider utilized are as follows:

**<ACCESS REQUIREMENTS FOR INDIVIDUAL CLOUD SERVICE PROVIDERS>**

## Related articles

- [Asset Management Policy Guidance](asset-management-policy-guidance.md)
- [Password Policy Guidance](password-policy-guidance.md)
- [Encryption Policy Guidance](encryption-policy-guidance.md)
- [Data Protection Policy Guidance](data-protection-policy-guidance.md)
- [Logging and Monitoring Policy Guidance](logging-and-monitoring-policy-guidance.md)
