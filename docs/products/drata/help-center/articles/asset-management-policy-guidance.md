# Asset Management Policy Guidance

Source: https://help.drata.com/en/articles/6568646-asset-management-policy-guidance
Collection: Policy Guidance
Updated: 2026-08-05
Fetched: 2026-11-22

## Article text

### Asset Management Policy 

The following article contains guidance explaining portions of the Asset Management Policy that we frequently see questions around, explaining what the sections mean.

Guidance statements will appear in bold and enclosed in brackets “**[ ]**” below the statements of the policy.

### Asset Management Policy

### [COMPANY NAME]

____________________________________________________________________________

### Purpose

The purpose of this policy is to define requirements for managing and properly tracking assets owned, managed, and under the control of [COMPANY NAME] through their lifecycle from initial acquisition to final disposal.

### Roles and Responsibilities

**<ROLES AND RESPONSIBILITIES>**

**[Please see here for more guidance on roles and responsibilities: [https://help.drata.com/en/articles/5829670-roles-and-responsibilities-guidance](roles-and-responsibilities-guidance.md). For example, “Who is responsible for updating, reviewing, and maintaining this policy?” The statement may become “The Chief Information Security Officer (CISO) is responsible for updating, reviewing, and maintaining this policy.”]**

### Policy

- All copies of media assets will be clearly marked for the attention of the authorized recipient.
   - Temporary or permanent copies of information will be at a level consistent with the protection of the original information.
- Access to each asset will be restricted based on the asset’s classification.
- A record of authorized recipients of assets will be established and maintained.
- The disposal/replacement of physical and virtual assets will be tracked, whether it is due to depreciation, expiring leases or agreements, obsolescence/end of support, loss, or other reasons.
- A reporting function will support auditing and monitoring for IT compliance with this standard.

**[Statement is saying the Asset Management Policy will ensure that physical and digital assets are properly protected, labeled, and controlled throughout their lifecycle.] **

### Asset Inventory Standard

An asset inventory process must be in place to support the technological management of critical business processes and to meet legal and regulatory requirements. The inventory process will also support the discovery, management and replacement and/or disposal of all assets. It will further facilitate the identification and removal of any illegal or unauthorized software, asset, or processes found in the [COMPANY NAME] environment. To accomplish these goals, all physical and virtual assets under [COMPANY NAME] management or control (including external assets such as end-user devices, network devices, non-computing/IoT devices, and servers) will be listed in an inventory that will include:

**[In the last sentence of the section above. The inclusion of "external assets" is specific to NIST CSF requirements and currently OPTIONAL for other frameworks.]**

- Unique identifier or name of the asset.
- Naming and asset classification will align with legal obligations, data sensitivity, and business value, to support proper handline and protection.
- Description of the asset.
- Purpose of the asset and the role the asset has in supporting critical business processes and in meeting legal or regulatory requirements, if applicable.
- Entity responsible for the asset.
- Assets that contain sensitive information (e.g., PHI, personal data, etc.) shall be clearly designated as such for the purposes of tracking.
- Classification of the asset, if applicable, as prescribed in the *Data Classification Policy.*

**[Classification of the asset or the data processed by the asset can be listed within the Notes column of Drata’s Asset page.]**

- Use of a hosted asset tracking solution for servers, switches, data center asset tracking, and racks that employ passive radio frequency identification (RFID), global positioning system (GPS), and/or Bluetooth Low Energy (BLE) technologies.
- Location and the cloud service utilized, when assets are stored in a cloud computing environment.
- Listed data from a cloud service customer and any data derived from the provided cloud service.

**[This section describes that a detailed inventory of assets managed by your company will support security, legal, and regulatory compliance. The inventory must track each asset’s identity, classification, ownership, purpose, and location. Identify and remove unauthorized or illegal assets or software. In addition, ensures sensitive assets are properly marked and protected according to company and legal standards.]**

### Asset Ownership

[COMPANY NAME] will assign an owner to each asset when the asset is created or transferred to [COMPANY NAME]. The asset owner can be an individual or an entity with approved management responsibility to control the whole lifecycle of the asset; the asset owner will not necessarily have property rights to the asset.

The asset owner will be responsible for the proper management of the asset over the asset’s entire lifecycle, or until a new owner is assigned to the asset. The asset owner will:

- Ensure that assets are inventoried.
- Ensure that assets are appropriately classified and protected.
- Define and periodically review access restrictions and classification to important assets, taking into account applicable access control policies.
- Ensure proper handling when the asset is deleted/destroyed.

**[This section describes assets owned by [COMPANY NAME] must have a designated owner responsible for managing it throughout its lifecycle. The asset owner ensures the asset is inventoried, properly classified, protected, and securely handled until it is transferred or destroyed.] **

### Physical Asset Inventory

[COMPANY NAME] leverages a SaaS-based asset management system, *Drata*, to maintain inventory of all company-owned physical computing equipment, including but not limited to:

**[If you use a system that is not Drata, you should adjust this section to mention the name of the asset management system you are using.]**

- Servers
- Workstations
- Laptops
- Printers
- Networking equipment

All company-owned devices are subject to a complete data wipe prior to repurposing, return, or disposal, particularly in the event of device compromise or infection. This data wipe will be carried out by the IT manager.

**[IT Manager is a suggested role in this instance. You can change this role to whoever will be performing this function at your organization.]**

### Digital Asset Inventory

[COMPANY NAME] uses *Drata*’s automated system to query across our cloud-based infrastructure to obtain detailed records of all digital assets, including but not limited to:

- Virtual machines
- Virtual servers
- Virtual repositories
- Security agents
- Source code repositories
- User accounts

The records are stored in a database system maintained by [COMPANY NAME]. Each record is tagged with the asset owner, associated project, and applicable classification to facilitate accountability and data governance.. All records are kept up to date through automation via *Drata*.

**[If you use a system that is not Drata, you should adjust this section to mention the name of the asset management system you are using.]**

### Asset Retirement Standard

The information resource owner determines when an asset is no longer needed or is obsolete and can be retired. If the asset to be replaced/retired supports mandatory legal and regulatory requirements of critical business processes, the asset owner must validate that any replacement asset continues to meet the business, legal, or regulatory requirements supported by the original asset before the original asset is retired.

Before retiring/replacing any asset that retains data, data retention requirements for all data stored or managed by that asset must be reviewed, and a plan for complying with all applicable data retention requirements must be developed and executed. This is particularly important for assets that manage data subject to legal/regulatory scrutiny. Any data subject to data retention requirements must be migrated to an appropriate destination and tested for appropriateness, completeness, accessibility and retrievability from the destination before the original data is deleted from the original asset as part of the system retirement process.

**[This section is saying that in the event you have to retire an asset, such as a database, server, etc. You will evaluate whether the data on that device is subject to specific retention requirements. For instance, if you have PHI data on the device, you may be required to retain those records on another asset in order to comply with state-specific retention requirements related to PHI records.]**

**Baseline Configurations for Endpoints**

The following baseline security requirements will be implemented for protection of endpoint assets including company-issues laptops, workstations and mobile devices as applicable:

- Antivirus and anti-malware tools will be deployed on endpoint devices (e.g., workstations, laptops, and mobile devices).
- Antivirus and anti-malware tools will be configured to automatically receive updates, run scans and alert appropriate personnel of viruses or malware.
- An approved password manager will be installed and configured on all company-issued devices.
- Hard-disk encryption will be enabled on all company-issued devices.
- Automated OS updates will be enabled on company-issued devices to install security patches.
- If browser add-ons are approved and installed, a browser testing tool will be installed to  assess the security of the add-on.
- Controls are in place to restrict the use of removable media to authorized personnel.

**[This section describes the baseline security controls required for all company-issued endpoint devices (e.g., laptops, workstations, and mobile devices). Technical controls (e.g., antivirus software, encryption, and automatic updates) are in place to ensure endpoint devices are protected against malware and unauthorized access.]**

### System Hardening Standards

Baseline security configuration standards for all system components will be documented in accordance with industry-accepted system hardening standards or vendor hardening recommendations. These standards will be updated as needed when vulnerabilities are identified and verified to be in place before or immediately after a system component is connected to a production environment.

***Device Best Practices and Hardening Standards***

- Manufacturer-provided hardening and best practice guides will be employed to ensure all device installation is properly guarded from vulnerabilities and unauthorized attempts to access the systems.
   - Center for Internet Security (CIS) benchmarks are utilized where possible for system hardening guidance.  ([https://www.cisecurity.org/cis-benchmarks/](https://www.cisecurity.org/cis-benchmarks/))

**[The CIS benchmarks are a suggestion in this instance. You may have other hardening standards you wish to apply to assets instead of CIS. These may be external hardening standards or you may develop internal best practices.]**

- Vendor supplied defaults, including usernames, passwords, and any other common settings that may result in unauthorized attempts to access the systems, will be disabled or changed in accordance with best practices and hardening guidelines.
- Insecure and unnecessary services, protocols, daemons, and functions in system components, and all unnecessary functionality (e.g., scripts, drivers, features, subsystems, file systems, interfaces, unused web servers, etc.) will be removed or disabled.
- Local passwords, when required, will be randomly generated and securely stored in the approved password management system.
- Current patches will be installed.
- Advanced malware protection (e.g., EDR or antivirus solutions) will be implemented and regularly updated.
- Logging will be enabled.
- Two-factor authentication should be used whenever available/supported on the device platform.
- Where applicable, use location-aware technologies to validate connection authentication integrity based on known equipment locations.

**[This section describes how the [COMPANY] secures its systems by following industry best practices for hardening devices (e.g., removing vulnerabilities, and disabling insecure features). The goal is to reduce the risk of unauthorized access and maintain a secure system environment.]**

***Infrastructure Virtualization Security***

- LVM images and snapshots are restricted to authorized locations.
- Backup systems and failover capabilities are established.
- VMs are tagged based on their sensitivity or risk level for easier identification.
- Formal change management process and approval is followed for creating, storing, and using VM images.
- Security policies and configurations are consistent across both physical and virtual networks.
- Security technologies across both physical and virtual networks are consistent with policy management and enforcement framework.
- Physical or virtual firewalls are utilized to separate groups of VMs from other hosted groups.
- Access controls for each trust level are established, governing access to physical and virtual management and security systems.

**[This section outlines security controls for managing virtual machines (VMs) and backups to protect sensitive data and ensure consistent security across both physical and virtual environments.]**

***Infrastructure Configuration and Maintenance ***

- Internal Workstation and Server Patching
   - OS patches and upgrades are evaluated on a regular schedule or upon release of critical updates.
   - OS and security patches/upgrades are installed based on their criticality.
   - Operating system patches/upgrades are installed during off-peak hours to minimize the disruption to business processes.

**[If you are using containers, it may make more sense to change these bullet points to reflect your process for updating the base image used to deploy containers and how containers will be redeployed.]**

- Internal Infrastructure Patching
   - Infrastructure (routers, switches, virtual hosts, etc.) patches/upgrades are evaluated as they come available from vendors.
   - Infrastructure patches/upgrades are installed based on their criticality.
   - Infrastructure patches/upgrades are reviewed and approved via a lab environment when possible/practical.
   - Infrastructure patches/upgrades are installed during off-peak hours to minimize the disruption to business processes.
   - When applicable, redundant systems are patched/upgraded one device at a time to ensure no impact to shared services.
   - Networking hardware/software updates follow the regular change management procedures.
- Infrastructure Support Documentation
   - Configuration standards for the setup of all infrastructure devices are in place and are formally documented as necessary.

**[This section describes managing updates and patches for internal workstations, servers, and infrastructure devices to keep systems secure.]**

### Capacity Management

Capacity requirements of systems will be identified in line with the business criticality of a concerned system.

- System tuning and monitoring will be applied to ensure and improve (when needed) the availability and efficiency of systems.
- Detective controls will be put in place to indicate problems as they occur.
- Projections of future capacity requirements will account for new business and system requirements and current and projected trends in the company’s information processing capabilities.
- To mitigate bottlenecks and dependence on key personnel presenting a threat to system security or services, managers must monitor the utilization of key system resources, identify trends in usage, and account for any resources that may have a long procurement lead times or high costs.

Providing sufficient capacity will be achieved by increasing capacity or by reducing demand. This includes:

- Deletion of obsolete data (disk space)
- Decommissioning of applications, systems, databases or environments
- Optimizing batch processes and schedules
- Optimizing application logic or database queries
- Denying or restricting bandwidth for resource-hungry services if these are not business critical (e.g. video streaming)
- Managing capacity demand
- Provisioning new server instances when capacity thresholds are met

**[This section may be adjusted if you manage capacity in other ways, such as by enabling auto-scaling policies. Similarly you perform monitoring through other methods such as enabling monitoring on a pool of resources/nodes instead of monitoring at the individual resource level.]**

### Management of Media

***Removable Media ***

For the proper management of removable media, the following steps will be taken, when applicable:

- Authorization will be required for removing media from [COMPANY NAME] facilities or assets, when necessary and practical.
   - A record of the removal will be kept for an audit trail
- A separate log or a clearly-defined section of the overall record shall be designated specifically for media containing ePHI.

**[If you do not handle or store ePHI, you can remove the bullet points related to it.]**

- Contents of any reusable media being retired, replaced, will be made unrecoverable.
- All media will be stored and secured in accordance with manufacturers’ specifications.
- Cryptographic techniques should be used to protect data on removable media to maintain integrity and confidentiality.
- Media degradation will be mitigated by transferring stored data to fresh media before becoming unreadable.
- Coincidental data damage or loss will be mitigated by making multiple copies of valuable data on separate media.
- Removable media drives will only be enabled if there is a business reason for it.
- Transfer of information to removable media will be monitored.

**[This section outlines how removable media (e.g., USB drives) should be managed to protect sensitive data]**

***Return of Assets Upon Termination***

- The termination process includes the return of all previously issued physical and electronic assets owned by or entrusted to [COMPANY NAME], as outlined in the *Employment Terms and Conditions*, and *System Access Control Policy*.
- If [COMPANY NAME] equipment was purchased by an employee or third party user, or personal equipment was used, all relevant information must be transferred to [COMPANY NAME] and securely erased from the equipment.
- Unauthorized copying of information by employees and contractors will be monitored and controlled during the termination period.

**[This can be performed through either a manual process, by examining logs, or can be implemented through technical controls, such as implementing Data Loss Prevention (DLP) or restrictions on removable media.]**

***Media Sanitization***

**[This section is specifically for NIST SP 800-53]**

Media Sanitization procedures are in place to ensure that when data is removed it could not be retrieved or reconstructed:

- System media will be defined, when they require sanitization prior to:
   - Disposal
   - Release from organization control
   - Reuse
- Sanitization applies to all media, digital or non-digital.
- Level of sanitization used will be determined by the classification or security category of the information.
- Sanitization techniques will include:
   - Clearing
   - Purging
   - Cryptographic erase
   - De-identification of PII
   - Destruction
- All sanitization and disposal actions will be:
   - Reviewed
   - Approved
   - Tracked
   - Documented
   - Verified
- Prior to connecting portable storage devices to the system, the devices will be sanitized through non-destructive techniques. Portable storage devices will be sanitized when:
   - **<SCENARIO 1>**
   - **<SCENARIO 2>**

Sanitization procedures and equipment will be reviewed and tested **<FREQUENCY>** to ensure that the intended sanitization is being achieved.

### Revision History 

| **Version** | **Date** | **Editor** | **Approver** | **Description of Changes** | **Format** |
|---|---|---|---|---|---|
|  |  |  |  |  |  |
|  |  |  |  |  |  |
|  |  |  |  |  |  |

## Related articles

- [Required Documentation for PCI DSS](required-documentation-for-pci-dss.md)
- [Acceptable Use Policy Guidance](acceptable-use-policy-guidance.md)
- [Physical Security Policy Guidance](physical-security-policy-guidance.md)
- [Information Security Policy Guidance](information-security-policy-guidance.md)
- [Maintenance Management Policy Guidance](maintenance-management-policy-guidance.md)
