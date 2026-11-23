# How do Bring Your Own Device (BYOD) Devices Affect my Audit?

Source: https://help.drata.com/en/articles/6297649-how-do-bring-your-own-device-byod-devices-affect-my-audit
Collection: Personnel Management › Device Compliance
Updated: 2026-11-14
Fetched: 2026-11-22

## Article text

A question we get asked a lot by companies is what to do when all devices at an organization are BYOD. This is a tough situation from a compliance standpoint because the company doesn’t own the device, and therefore can’t enforce configurations like hard drive encryption, screensaver lock, and other workstation controls. And even when these settings are enabled on those devices, getting evidence from them can be difficult. Users may not want to enroll in an MDM, install the Drata agent, or provide a screenshot from their personal device. So how do you handle these situations when you’re going for your audit?

**Establishing a BYOD Program**

The very first step should be to formally authorize your employees to use BYOD workstations. This is done by explaining within a policy that your organization is authorizing employees/contractors to use their own devices. Some organizations create an entirely separate BYOD Policy, which is fine, however, most organizations add these details to an existing policy such as the Acceptable Use Policy, Asset Management Policy, or Information Security Policy. Any of those three policies would work for this, it’s really up to you and where you think it fits best. If you opt to add these statements to an existing policy, it should say something like:

“<Company Name> has authorized employees and contractors to use a Bring Your Own Device (BYOD) machine of their choosing as a workstation. <Company Name> does not own these devices, but encourages* employees/contractors to enable the following settings on their devices:

- Hard Drive Encryption
- Anti-virus/anti-malware
- Screensaver lock with a 15 minute inactivity timeout
- Automatic Updates
- Password Manager

The above settings are only required for workstations such as laptops and desktops. For mobile devices such as smartphones and tablets, <Company Name> encourages* setting a screen timeout of 1 minute or less and enabling a password or PIN to be entered before the device will be unlocked. <Company Name> also discourages the use of “jailbroken” or “rooted” devices.

Additionally, employees/contractors are required to support <Company Name>’s efforts to demonstrate compliance with select security controls. This will entail enrolling in <Company Name>’s MDM solution, installing the Drata agent to automatically collect evidence that these settings have been enabled, or provide screenshots showing that these settings have been enabled.”

You should also consider listing any restrictions on the types of devices that employees can use. For example, if due to the nature of your business, all BYOD devices have to be a Windows machine, you should list those types of items here as well.

Finally, we recommend adding a statement to employee and contractor agreements which states something like: “<Company Name> reserves the right to request and verify deletion of any company data downloaded to personal devices upon termination of employment at <Company Name>.”

***NOTE:** We recommend that you require this where possible. However, depending on the locality of the employee/contractor, this may not always be possible due to legal/privacy laws and regulations in specific jurisdictions. So before you change “encourages” to “requires” in the above language, you should speak with your HR team and Legal Counsel to make sure that you are legally allowed to require these settings on an employee’s personal device.

**How BYOD Devices Affect an Audit**

Regardless of who owns the device, the company or an individual employee/contractor, compliance frameworks like SOC 2 and ISO 27001 do contain controls around securing workstations, and BYOD does not remove these requirements in all cases. For the majority of companies, you will still be required to prove that devices being used to conduct business are configured securely. This will require you to collect evidence demonstrating this, such as enrolling those devices in an MDM, using the Drata agent, or having employees/contractors submit screenshots from their workstations.

However, in the event that this is not possible for whatever reason, alternative controls can be implemented, but whether these controls are accepted or not is up to your auditor to decide. For instance, if you can’t show that workstation hard drives are encrypted, you may have to implement a control such as more stringent Data Loss Protection (DLP) controls to show that data cannot be exported from systems like Google Drive, your cloud environment, etc. If data cannot be saved locally on workstations due to DLP controls on these systems, hard drive encryption is less important.

In the event that workstation controls cannot be implemented, and alternative controls are not possible, as a last resort, you should discuss this with your auditor if you’re doing SOC 2 or HIPAA, or your QSA if you are doing PCI. If you are doing ISO 27001 you should examine the Statement of Applicability and note under remarks for those controls related to workstations what you’ve done to compensate for not being able to implement the specific controls listed in ISO 27001. The reason for this is because your Certification Body for ISO 27001 cannot advise you on controls, so asking them what controls to implement is not possible.

**A Note on Smartphones and Tablets**

There is a second class of BYOD devices that come up just as much, which are smartphones and/or tablets. How you handle these devices mostly depends on what the devices are being used for and what framework you are working towards. We recommend a policy that prevents accessing Customer Data and/or Regulated Data (PHI, CHD) from BYOD smartphones and tablets.

For SOC 2 and ISO 27001, if the devices don't store customer data and are only used to access systems like company chat systems, email, calendar, etc., most of the time auditors will be fine with relying on policy for these types of devices. If the devices do store customer data, then these devices will likely be in-scope for the audit, but which controls need to be implemented will really depend on the auditor. If you are storing customer data on these types of BYOD devices, we suggest using a containerized MDM solution and having your employees/contractors load this solution on their device so you can demonstrate that any data on those devices is still being protected.

For frameworks such as HIPAA or PCI, the scope of the audit is actually a specific type of data. So for HIPAA, if the devices cannot access Protected Health Information (PHI) they will be out of scope. If they can access PHI, they will be in-scope. For PCI, if the device can connect to a system or network containing Cardholder Data (CHD), the device will be in-scope. In these cases, we also recommend using a containerized MDM to demonstrate that you are controlling the data on these devices.

## Related articles

- [Are Contractors in Scope for my Audit?](are-contractors-in-scope-for-my-audit.md)
- [Physical Security Policy Guidance](physical-security-policy-guidance.md)
- [Information Security Policy Guidance](information-security-policy-guidance.md)
- [Example Evidence for Not Monitored Controls Linked to Policies](example-evidence-for-not-monitored-controls-linked-to-policies.md)
- [Section 2: GRC Roles & Responsibilities](section-2-grc-roles-responsibilities.md)
