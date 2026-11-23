# Physical Security Policy Guidance

Source: https://help.drata.com/en/articles/7763364-physical-security-policy-guidance
Collection: Policy Guidance
Updated: 2026-08-05
Fetched: 2026-11-22

## Article text

The following article contains guidance explaining portions of the Physical Security Policy that we frequently see questions around, explaining what the sections mean.

Guidance statements will appear in **bold** and enclosed in brackets “**[...]**” below the statements of the policy.

### Physical Security Policy

**- [If your company is a fully remote team, please refer to our Help Article: [Developing a Physical Security Policy for a Remote Team](developing-a-physical-security-policy-for-a-remote-team.md)]**

### [COMPANY NAME]

______________________________________________________________________

### Purpose

The Physical Security Policy establishes requirements to ensure that [COMPANY NAME]’s information assets are protected by physical controls that prevent tampering, damage, theft or unauthorized physical access. This policy defines the following controls and acceptable practices:

- Definition of physical security perimeters and required controls
- Personnel and visitor access controls
- Protection of equipment stored off-site

### Scope

This policy applies to all [COMPANY NAME] physical facilities and users of information systems within [COMPANY NAME], which typically include employees and contractors, as well as any external parties that have physical access to the company’s information systems. This policy must be made readily available to all users.

### Background

It is the goal of [COMPANY NAME] to safeguard information both virtually and physically, as well to provide a safe and secure environment for all employees. As such, access to the [COMPANY NAME] facilities is limited to authorized individuals only. All workforce members are responsible for reporting an incident of unauthorized visitor and/or unauthorized access to [COMPANY NAME]'s facility.

### Roles and Responsibilities

**<ROLES AND RESPONSIBILITIES>**

**- [Additional guidance on what roles and responsibilities to list in this policy can be found in [Roles and Responsibilities Guidance](roles-and-responsibilities-guidance.md). **

**To use that article, you should list the answer to each question here as a role. For example: “Who is responsible for updating, reviewing, and maintaining this policy?” may become “The CISO is responsible for updating, reviewing, and maintaining this policy.”]**

### Policy

### General

- Physical access to [COMPANY NAME] facilities is restricted.

**- [This bullet emphasizes that only authorized personnel are allowed to enter the physical premises of the company and can be achieved by implementing locks on doors and windows, access control systems (e.g. key cards, biometric scanners), visitor sign-in, etc. Only applicable if you have a physical location]**

- All employees are required to wear employee badges at secure facilities if and when applicable (such as server rooms, data centers, labs).

**- [This bullet emphasizes that all employees are required to wear their badges when accessing secure facilities such as server rooms, data centers, and labs. The purpose of this is to identify and track who is accessing sensitive areas to prevent unauthorized access. This is optional for SOC 2 but is required for NIST 800-53. Only applicable if you have on-prem infrastructure]**

- All employees must follow physical security requirements and procedures documented by facility management.
- On-site visitors and vendors must be escorted by a [COMPANY NAME] employee at all times while on premise.

**- [This is to ensure that visitors and vendors will not have unauthorized access to areas or equipment and do not pose a security threat. This is not a hard requirement and is primarily concerned with visitors having access to sensitive areas]**

- All workforce members are responsible for reporting an incident of unauthorized visitor and/or unauthorized access to [COMPANY NAME]'s facility.
- A record is retained for each physical access, including visits, maintenance and repairs to [COMPANY NAME] production environments and secure facilities.
   - Details must be captured for all maintenance and repairs performed to physical security equipment such as locks, walls, doors, surveillance cameras; and
   - All records must be retained for a minimum of seven years.

**- [This is applicable if you have an on-prem infrastructure. The minimum requirement is to record who is accessing the facilities. **

**For leased offices/buildings, you can modify this language to mention your landlord/building owner as primarily responsible for providing a physical access control system to the building **

**7 years for retaining records is not a hard requirement]**

- Building security, such as fire extinguishers and detectors, escape routes, floor warden responsibilities, shall be maintained according to applicable laws and regulations.

**- [For leased offices/buildings, you can modify this language to mention your landlord/building owner as primarily responsible for providing a physical access control system to the building]**

### Access Requirements 

- Physical access is restricted using badge readers and/or smart locks that track all access.
   - Restricted areas and facilities are locked when unattended (where feasible).
   - Only authorized workforce members receive access to restricted areas (as determined by the Security Officer).
   - Access and keys are revoked upon termination of workforce members.
   - Workforce members must report a lost and/or stolen key(s) or badge(s) to his/her manager, local Site Lead, or the Facility Manager.
   - The Facility Manager or designee is responsible to revoke access to the lost/stolen badge(s) or access key(s), and re-provision access as needed.
   - The Facility Manager or designee facilitates the changing of the lock(s) within 7 days of a physical key being reported lost/stolen.

**- [Badge readers and smart locks are considered to be best practice recommendations. Physical keys and locks would be an appropriate method for restricting/managing physical access]**

- Visitor access requires additional controls.
   - Visitors must sign a visitor’s log indicating date and time in/out, organization represented (if applicable), purpose of visit, and company point of contact.
   - Visitor badges will be issued to visitors, and must be displayed at all times when in secure areas. Badges must be returned before leaving the facility or by the specified time.

**- [This section is optional for SOC 2, but is required for other frameworks such as ISO 27001. The minimum requirement for this is to have a method of capturing who is entering and exiting your office to ensure that only authorized personnel or visitors are at your office]**

- Delivery and Loading areas.
   - Access to delivery and loading areas from outside of the facility will be restricted to only identified and authorized personnel.
   - Such areas will be designed to ensure that access to other parts of the facility are restricted.
   - Incoming material must be appropriately inspected for any discrepancies, issues, or potential threats, and must be registered in accordance with *Asset Management* procedures.
   - When possible, incoming and outgoing shipments will be physically segregated.

**- [This section is optional for SOC 2, but is required for other frameworks such as ISO 27001. This will only apply if you have physical offices. The minimum requirement for this is to have a method of restricting access to office facilities and a way to log and track incoming deliveries]**

- Enforcement of Facility Access Policies
   - Report violations of this policy to the restricted area's department team leader, supervisor, manager, or director, or the Privacy Officer.
   - Workforce members in violation of this policy are subject to disciplinary action, up to and including termination.
   - Visitors in violation of this policy are subject to loss of vendor privileges and/or termination of services from [COMPANY NAME].

**- [It is advisable to have a way to report physical security violations. Termination is not a requirement when creating a disciplinary process, only that there is an existing disciplinary process in place to take action and communicate to employees who have committed a violation]**

- Workstation Security
   - Workstations may only be accessed and utilized by authorized workforce members to complete assigned job/contract responsibilities.
   - All workforce members are required to monitor workstations and report unauthorized users and/or unauthorized attempts to access systems/applications as per the System Access Control Policy.
   - All workstations purchased by [COMPANY NAME] are the property of [COMPANY NAME] and are distributed to personnel by the company.

**- [BYOD devices are not exempt from device security requirements. Please refer to our Help Article: [How do Bring your own devices affect my audit (BYOD)?](how-do-bring-your-own-device-byod-devices-affect-my-audit.md)]**

### Building Standards per Location

***Standards***

**- [This section is optional for SOC 2 but is required for other frameworks such as ISO.**

**This will be highly applicable if you have physical offices with sensitive computing equipment such as server rooms. If you do not have an on-prem infrastructure, you can modify this section to reflect, at minimum, requirements to have appropriate access control/restriction**

**For leased offices/buildings, you can modify this language to mention your landlord/building owner as primarily responsible for providing a physical access control system to the building]**

- A security perimeter must be defined and established to protect areas containing sensitive data and critical information processing facilities.
- The walls, ceilings and floor of any secure area must be of the same strength.
- Windows and doors have locks, and all entry points are secured by access control mechanisms and have cameras for additional monitoring as needed.
- Spaces around the perimeter are monitored with CCTV or security patrols.
   - CCTV recordings need to be kept for at least 3 months.

**- [Although SOC 2, ISO, and other standards do not have a minimum requirement in keeping security camera footage, we advise to verify this with your legal team as certain industries have different regulations they must follow when keeping CCTV footage (e.g. Banks are required to keep footage no shorter than six months and Casinos are required to keep footage no shorter than a year)]**

- Alarms are activated outside working hours.
- The most sensitive assets must be stored in the most secure areas. Using the “onion technique”, each perimeter “layer” should house progressively more sensitive assets.
- Keys to all secure or public areas housing IT equipment (including wireless access points, gateways, and more) must be protected in a centralized fashion.
- A controlled reception area must establish where:
   - All visitors are required to report first.
   - Security guards challenge unknown persons.
- Offsite backup locations are physically secure for backups and the security measures are reviewed at least annually.

***Location(s)***

- **<CITY, STATE> Office:**
   - The building is unlocked Monday-Friday from 9am-4pm
   - After hours the building is secured and requires an access card for entry
   - The office is secured and requires an access card for entry for after hours access
   - All server rooms are secured 24/7 and require an access card for entry
- **<ADD LOCATION AS NEEDED>**

**- [This will apply if you have multiple physical office locations]**

### Data Center Security

Physical security of data centers is ensured by [COMPANY NAME]’s cloud infrastructure service provider.

**- [If you are using a cloud infrastructure service provider, physical security of the data centers would be their responsibility. Indicate the name/s of your cloud infrastructure service provider that hosts your infrastructure]**

### Asset Security

The following factors will be considered and implemented, as applicable per risk assessments, and in conjunction with the following policies: *Information Security Policy*, *Asset Management Policy*, *Data Protection *and *Data Classification*. :

**- [This section is optional for SOC 2, but may be required for other frameworks such as ISO]**

***External/Environmental Threats***

All assets owned or managed by [COMPANY NAME] will be housed in designated facilities with a level of protection equivalent to the sensitivity and criticality of the asset and the associated information. Additionally, the following factors will be considered:

- The potential danger from environmental threats including weather, malicious attacks, and accidents.
   - Appropriate for risk mitigation must be implemented to reduce the potential for an incident to occur.
- Monitoring environmental conditions in appropriate areas.
   - At a minimum, monitoring will be performed for fire/smoke in the general facility areas.
   - Internal secure areas must be subject to additional monitoring for temperature, water, power continuity, humidity and cleanliness.
- Implementation of environmental controls in accordance with risk assessments.
   - Controls such as heating, ventilation, air conditioning, drainage, fire suppression, emergency lighting, continuous power and humidity control must be implemented in facilities, as appropriate.
   - If applicable, data centers must contain elements of each environmental control at sufficient levels.

**[The information assets being defined here are mostly referring to on-prem servers and networking equipment. This emphasizes the importance of environmental and monitoring controls to prevent damage to assets and associated information from external and environmental threats]**

***Backup Power ***

Continuous power will be provided for mission-critical information assets through battery-operated uninterrupted power supply (UPS) protection.

- Backup generators will be used in cases of higher levels of protection.

**Emergency Power Shut-off **

In the case of emergency, emergency power off switches will be located near emergency exits in equipment rooms to facilitate rapid power down.

***Alarm systems ***

Alarm system configurations must be periodically reviewed and evaluated to detect malfunctions in the supporting utilities and reconfigured when necessary.

***Off-Site Equipment and Security ***

Equipment may only be taken off-site for valid business reasons and with authorization from the Information Owner.

- The equipment includes network and telecommunication devices, servers, power and cooling equipment
- Individuals taking equipment offsite are responsible for the physical protection of the system and must ensure the system is secured at all times.
- Equipment will be recorded as being removed off-site and recorded when returned.

**- [If your work arrangement is a hybrid of on-site and remote, it is acceptable to modify the language to allow employees to take home company issued workstations. It would be ideal to have a record of who the equipment is assigned to and record when they return the equipment if they are no longer employed by the company or if they are issued a new workstation]**

***Cabling Protection ***

Power and telecommunications cabling must be protected adequately against risks such as interference, data capture or physical damage.

- Cables must be easily identifiable through markers or labels to ensure minimal handling errors.

### Revision History 

| **Version** | **Date** | **Editor** | **Approver** | **Description of Changes** | **Format** |
|---|---|---|---|---|---|
|  |  |  |  |  |  |
|  |  |  |  |  |  |
|  |  |  |  |  |  |

**- [Version: This indicates which iteration of the policy document this is**

**Date: This indicates when the policy document was last updated**

**Editor: This is the person who wrote or revised the policy document**

**Approver: This is the person who reviewed and approved the policy document for official publication**

**Description of Changes: This provides a summary of the revisions made to the policy document since the previous version**

**Format: This refers to the way the policy document is presented. If you are using Drata’s Policy template, you can indicate this as “.PDF”**

**It is common and acceptable for smaller organizations to have the writer of the policy to be the same person as the approver]**

## Related articles

- [Developing a Physical Security Policy for a remote team](developing-a-physical-security-policy-for-a-remote-team.md)
- [Asset Management Policy Guidance](asset-management-policy-guidance.md)
- [Data Classification Policy Guidance](data-classification-policy-guidance.md)
- [Information Security Policy Guidance](information-security-policy-guidance.md)
- [Maintenance Management Policy Guidance](maintenance-management-policy-guidance.md)
