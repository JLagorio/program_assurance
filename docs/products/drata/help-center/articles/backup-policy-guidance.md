# Backup Policy Guidance

Source: https://help.drata.com/en/articles/6568647-backup-policy-guidance
Collection: Policy Guidance
Updated: 2026-08-05
Fetched: 2026-11-22

## Article text

### The following article contains guidance explaining portions of the Backup Policy that we frequently see questions around, explaining what the sections mean.

Guidance statements will appear in bold and enclosed in brackets “[]” below the statements of the policy.

### Backup Policy

### [COMPANY NAME]

____________________________________________________________________________

### Purpose

To protect the confidentiality, integrity, and availability of data, both for [COMPANY NAME] and [COMPANY NAME]’s customers, complete backups are performed **<BACKUP FREQUENCY>** to assure that data remains available when it’s needed and in the case of a disaster.

**[For critical systems, frequent backups (e.g., hourly or daily) ensure minimal data loss. Non-critical systems may suffice with less frequent backups (e.g., daily or weekly).]**

### Policy

[COMPANY NAME] policy requires that:

- The scope, frequency, and duration of cloud data retention should comply with:
   - Applicable laws.
   - Contractual agreements with the cloud customers.
   - The cloud provider’s business requirements.

**[These Items are optional for SOC 2, but may be REQUIRED for other frameworks such as CCM]**

- Data should be classified at time of creation or acquisition according to the Data Classification Policy
- An up-to-date inventory and data flow map of all critical data are maintained.
- All business data should be stored or replicated into a company controlled repository, including data on end-user computing systems.
   - **[This statement means that critical business data should live in a company-controlled repository, such as Google Workspace, Dropbox, Box, etc. If your employees/contractors regularly store data only on their devices without backing up that data to a company-controlled repository, workstations should be included within the backup process.]**
- Data must be backed up according to its level defined in Data Classification Policy.
- Data retention period must be defined and comply with any and all applicable regulatory and contractual requirements. More specifically,
   - Data and records belonging to [COMPANY NAME] customers must be retained per [COMPANY NAME] product terms and conditions and/or specific contractual agreements.
   - By default, all security documentation and audit trails are kept for a minimum of seven years, unless otherwise specified by [COMPANY NAME]’s Data Classification Policy, specific regulations, or contractual agreement.
      - **[ Seven years is an example. You should examine the requirements of the framework you are working on and any retention requirements you may have in order to decide on this number. HIPAA for instance requires 6 years, while SOC 2 does not specify. We suggest a period of 1-7 years.]**
- System documentation must be backed up, to include security and privacy-related documentation.
   - **[This is only applicable to the requirements of NIST SP 800-53r5]**
- The data backup process must be monitored using technical and organizational safeguards, addressing malfunctions promptly by qualified employees to support compliance with retention's scope, frequency, and duration.
- Removable or external hard drives (e.g., USB sticks) used for data backups must remain disconnected from computers outside of active backup sessions.

**[This is OPTIONAL for SOC 2, but may be REQUIRED for other frameworks such as CCM and Cyber Essentials] **

### Backup and Recovery

***Customer Data***

[COMPANY NAME] stores customer data in a secure production account in **<YOUR CLOUD PROVIDER>**, using a combination of **<DATABASE TYPES>** databases. By default, **<CLOUD STORAGE>** provides durable infrastructure to store important data and is designed for durability of 99.999999999% of objects.

**[Examples:**

**Cloud Providers: AWS, GCP, AZURE, HEROKU, DIGITAL OCEAN, etc.**

**Database: S3, ElastiCache, RDS, Aurora, Redshift, etc.**

**Cloud Storage: S3, Azure Blob Storage, Google Cloud Storage, Dropbox, Google Drive, OneDrive, Box, etc.]**

[COMPANY NAME] performs automatic backups of all customer and system data to protect against catastrophic loss due to unforeseen events that impact the entire system. An automated process will back up all data to a separate region in the same country (e.g. US East to US West). By default, data will be backed up **<FREQUENCY>**. The backups are encrypted in the same way as live production data. Backups are monitored and alerted by **<MONITORING SYSTEM>**. Backup failures trigger an incident by alerting the Security Officer.

**[Monitoring Systems: CloudWatch, Azure Monitor, Google StackDriver, etc.]**

**[Security Officer is a suggested role in this instance. You can change this role to whoever will receive alerts if the backup process were to fail.]**

***Source Code***

[COMPANY NAME] stores its source code in git repositories hosted by **<VERSION CONTROL>**. Source code repositories are backed up to [COMPANY NAME]’s **<CLOUD PROVIDER>** account on a **<FREQUENCY>** basis. In the event that** <VERSION CONTROL>** suffers a catastrophic loss of data, source code will be restored from the backups in **<CLOUD PROVIDER>**.

**[Drata suggests maintaining a clean copy of your code repositories somewhere, in the event that a repository or SaaS platform like GitHub were to be compromised. If you do not intend to perform this, but do use a decentralized version control system such as git, you may reword this section to describe how each developer has a copy of the code through git’s decentralized nature.]**

**Revision History **

| **Version** | **Date** | **Editor** | **Approver** | **Description of Changes** | **Format** |
|---|---|---|---|---|---|
|  |  |  |  |  |  |
|  |  |  |  |  |  |
|  |  |  |  |  |  |

## Related articles

- [Asset Management Policy Guidance](asset-management-policy-guidance.md)
- [System Access Control Policy Guidance](system-access-control-policy-guidance.md)
- [Vendor Management Policy Guidance](vendor-management-policy-guidance.md)
- [Encryption Policy Guidance](encryption-policy-guidance.md)
- [Data Protection Policy Guidance](data-protection-policy-guidance.md)
