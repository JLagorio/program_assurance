# ACSC Essential Eight: A Requirement-Level Guide

Source: https://help.drata.com/en/articles/12430948-acsc-essential-eight-a-requirement-level-guide
Collection: Framework Information › ACSC Essential Eight
Updated: 2026-11-14
Fetched: 2026-11-22

## Article text

The ACSC Essential 8 is more than a technical checklist, it’s a framework for building a defensible and auditable cybersecurity program. At its core is the Maturity Model, which outlines three levels of implementation. Each level is designed to protect your organization against increasingly sophisticated adversaries.

An auditor’s goal is to verify not only that controls exist, but that they are implemented consistently and effectively to meet the specific requirements of your chosen maturity level. This guide breaks down each of the eight strategies, what the maturity levels look like in practice, and what an assessor will look for as proof.

## Understanding the Maturity Model

- **Maturity Level One:** Protects against opportunistic attackers using common tools and techniques, such as mass phishing campaigns or exploiting unpatched software.
- **Maturity Level Two:** Protects against more focused adversaries who invest more time and effort to bypass basic controls, such as targeted phishing to circumvent weak MFA.
- **Maturity Level Three:** Protects against adaptive attackers who modify techniques to exploit specific weaknesses, like inadequate logging, legacy software, or misconfigurations.

## Which Maturity Level Should You Target?

While every organization's risk profile is different, the ACSC provides general guidance:

- **Maturity Level One:** may be suitable for small to medium enterprises.
- **Maturity Level Two:** may be suitable for large enterprises.
- **Maturity Level Three:** may be suitable for critical infrastructure providers and other organizations in high-threat environments.

**Key Point:** The ACSC recommends a progressive implementation. Organizations should achieve the same maturity level across all eight strategies and validate it before moving to a higher level. This ensures a consistent and robust security posture.

## Requirement-Level Enablement

## 1. Patch Applications & Operating Systems

**Compliance Goal:** Systematically find and close known security gaps in software and systems before they can be exploited.

**Maturity in Practice:**

- **Not Meeting:** Patching is reactive and inconsistent; there is no active vulnerability scanning, and systems are months out of date.
- **Meeting Level 1:** You have a formal patch process, scan internet-facing systems daily, and patch their critical vulnerabilities within 48 hours. Standard office software is patched within two weeks.
- **Meeting Level 2:** Your program expands significantly. Scans now cover *all* applications, not just office software, and those applications are patched within one month.
- **Meeting Level 3:** Patching becomes much more aggressive. Critical patches for internal workstations and common applications (like Office) are now also due within 48 hours. The scope expands further to include scanning and patching of firmware and drivers.

**How Auditors Evaluate This:**

- Review your formal patch management policy.
- Examine vulnerability scanner reports and logs showing timely patch deployment.
- Check deployment logs with timestamps proving you met the required deadlines (e.g., the 48-hour window for both internet-facing and internal systems at Level 3).
- Verify a complete asset inventory, as unlisted systems cannot be verified.

**Key Consideration:** An incomplete asset inventory is a primary concern for auditors. Unmanaged devices on your network create unpatched security gaps that must be addressed.

## 2. Multi-Factor Authentication (MFA)

**Compliance Goal:** Verify that users are who they claim to be, preventing attackers from using stolen credentials.

**Maturity in Practice:**

- **Not Meeting:** MFA is optional or limited to a few non-critical applications.
- **Meeting Level 1:** MFA is enforced for all users when they access online services that contain sensitive data.
- **Meeting Level 2:** The scope expands dramatically. MFA is now required for *all users* on *any* corporate system (including workstations). The MFA method itself must be phishing-resistant (e.g., FIDO2 security keys).
- **Meeting Level 3:** The scope expands again to include MFA for access to data repositories. Log analysis is now required for workstations and internal servers, not just internet-facing ones.

**How Auditors Evaluate This:**

- Check your identity provider's configuration to confirm MFA is enforced across all required areas.
- Review the allowed MFA methods to ensure they meet the phishing-resistance requirement.
- Verify that logs of all successful and unsuccessful MFA attempts are being centrally collected and that you have a documented process for analyzing them in a timely manner.

**Key Consideration:** For Maturity Level 2 and above, the requirement for phishing-resistant MFA is strict. It's important to ensure your chosen MFA methods are compliant, as methods like SMS or standard authenticator app notifications are often not sufficient.

## 3. Restrict Administrative Privileges

**Compliance Goal:** Limit the power of administrative accounts to reduce the potential damage if one is compromised.

**Maturity in Practice:**

- **Not Meeting:** Administrators use a single, powerful account for all daily tasks and privileged work.
- **Meeting Level 1:** Administrators use separate standard user and privileged accounts, and the privileged accounts are blocked from accessing email and the internet.
- **Meeting Level 2:** Privileged access is now time-bound; it is automatically disabled after 45 days of inactivity and must be re-approved annually. All administrative work is performed via a secure jump server.
- **Meeting Level 3:** Controls become highly advanced. All administrative activities must be performed from a Secure Admin Workstation (SAW). Just-in-Time (JIT) administration is implemented, and specific Windows security features like Credential Guard are enabled.

**How Auditors Evaluate This:**

- Review your lists of privileged accounts and their assigned permissions.
- Verify the technical controls (e.g., firewall rules, GPOs) that block internet access for privileged accounts.
- For Level 3, they will look for evidence of your SAW and JIT implementation, as well as the configuration of features like Credential Guard.
- Examine logs of approval workflows and privileged access events to confirm that monitoring is in place.

**Key Consideration:** Be mindful of “privilege creep,” where access is granted but never revoked. The Level 2 and 3 controls for inactivity, annual revalidation, and JIT are designed specifically to address this.

## 4. Application Control

**Compliance Goal:** Prevent the execution of unauthorized or malicious software.

**Maturity in Practice:**

- **Not Meeting:** Users can install and run any software they wish.
- **Meeting Level 1:** Application control is active in a "default-deny" mode on all workstations, where only approved applications can run.
- **Meeting Level 2:** The scope extends to internet-facing servers. You must also implement Microsoft's recommended blocklist for system tools and conduct an annual review of your ruleset.
- **Meeting Level 3:** The scope expands to cover *all* servers (including non-internet-facing). The policy is hardened to also control the execution of drivers and block Microsoft's vulnerable driver blocklist.

**How Auditors Evaluate This:**

- Inspect your application control configuration to ensure it is in enforcement (block) mode across the required systems.
- Ask for the documentation from your annual ruleset review.
- Verify that logs of both allowed and blocked application executions are being centrally collected and analyzed.

**Key Consideration:** Application control software should not be left in "audit mode." While useful for testing, audit mode provides visibility but does not prevent execution and is therefore not compliant for an audit.

## 5. Restrict Microsoft Office Macros

**Compliance Goal:** Block a common malware delivery vector by securing Microsoft Office macro settings.

**Maturity in Practice:**

- **Not Meeting:** Users can enable macros from any source without restriction.
- **Meeting Level 1:** Macros in files that originate from the internet are blocked, and users cannot change this setting.
- **Meeting Level 2:** A technical control is added to block macros from making Win32 API calls, which effectively prevents them from executing malicious commands on the operating system.
- **Meeting Level 3:** A highly robust process is required. Macros are only allowed to run if they are from a trusted, sandboxed location or have been digitally signed by a trusted publisher after a formal vetting process.

**How Auditors Evaluate This:**

- Review the GPOs or endpoint security policies that enforce these specific macro restrictions.
- Confirm that the settings are locked and cannot be overridden by standard users.
- For Level 3, they will ask for documentation of your macro vetting and signing process.

**Key Consideration:** User awareness training is important, but it is not a substitute for technical enforcement. The framework requires these controls because social engineering can convince even savvy users to click "Enable Content."

## 6. User Application Hardening

**Compliance Goal:** Secure commonly exploited applications like web browsers and Microsoft Office to break common attack chains.

**Maturity in Practice:**

- **Not Meeting:** Applications are left in their default, less-secure state.
- **Meeting Level 1:** Web browsers are configured to block advertisements and Java content from the internet.
- **Meeting Level 2:** Hardening becomes more advanced. Microsoft Office is blocked from creating child processes (a common attack technique). You must also centrally log all PowerShell and command-line activity.
- **Meeting Level 3:** Hardening is extended to the underlying system. Legacy software like .NET Framework 3.5 and PowerShell 2.0 must be removed, and PowerShell must be configured in Constrained Language Mode.

**How Auditors Evaluate This:**

- Inspect the policies or configurations that enforce browser and Office application restrictions.
- Verify that PowerShell and command-line logging is enabled and that logs are being sent to a central, secure location.
- For Level 3, they will check for the presence of legacy frameworks and the PowerShell language mode settings.

**Key Consideration:** Application hardening should not be an optional or user-managed setting. An auditor will verify that these configurations are enforced centrally.

## 7. Regular Backups

**Compliance Goal:** Ensure you can recover data and systems after a significant incident, such as ransomware.

**Maturity in Practice:**

- **Not Meeting:** Backups are performed irregularly, are not stored securely, and restoration has never been tested.
- **Meeting Level 1:** You have regular, secure backups, conduct annual restoration tests, and prevent regular users from accessing them.
- **Meeting Level 2:** Protection is hardened significantly. Backups are now protected from modification or deletion by *privileged* accounts (e.g., Domain Admins), with access restricted to only dedicated, isolated backup administrator accounts.
- **Meeting Level 3:** The ultimate level of protection is required. Backups must be configured to be immutable, preventing *any* account (including backup administrators) from modifying or deleting them during their retention period.

**How Auditors Evaluate This:**

- Review your backup policy, schedules, and retention periods.
- Examine the formal report from your most recent disaster recovery test.
- Scrutinize the access control lists for your backup repositories to prove they are isolated from standard privileged accounts. For Level 3, they will inspect the immutability settings.

**Key Consideration:** The Level 2 and 3 requirements to protect backups from privileged account compromise and enforce immutability are direct responses to modern ransomware tactics where attackers actively target backups.

## Demonstrating Compliance and Readiness

Unlike some frameworks that require a formal "Statement of Applicability" (like ISO 27001's Annex A), the Essential 8 does not have a mandatory document you need to create and submit for certification.

Instead, you should use the official ACSC documentation (Appendices A, B, and C for Levels 1, 2, and 3 respectively) as the definitive **audit checklist**. Your goal is to gather evidence for every single requirement listed for your target maturity level. A GRC platform is the ideal place to map your evidence (such as policies, configuration screenshots, and scan reports) directly to each of these requirements.

What About Compensating Controls and Legacy Systems?

The ACSC recognizes that it can be difficult to implement certain controls on legacy systems. In these cases, you may use compensating controls. However, you must be able to demonstrate to an auditor that the compensating control provides an equivalent level of protection to the original requirement. Simply accepting the risk without a compensating control is not sufficient and will result in being assessed as not meeting the requirement.

**Common Pitfalls That Cause Audit Failures**

- **Asset Inventory Gaps: **Systems not listed cannot be verified or patched, causing failed patch management assessments.
- **MFA Misconfiguration: **MFA enabled, but not phishing-resistant (e.g., using SMS or non-FIDO authenticators).
- **Admin Internet Access: **Admin accounts still able to browse or check email — fails Level 1.
- **Audit Mode Confusion: **Application control is deployed in monitoring/audit mode, not enforcement mode.
- **Backups Not Tested: **Even if backups exist, a missing or undocumented recovery test fails the maturity level.
- **Inconsistent Maturity Across Strategies: **One area at Level 3, others at Level 1. ACSC expects consistent levels across all eight.
- **Legacy Exceptions Without Controls: **Legacy systems not protected by compensating controls = automatic non-compliance.

## Conclusion

Achieving maturity across the Essential 8 requires consistent implementation across all eight strategies. Gaps in even a single area weaken your overall security posture. By aligning your controls with the maturity model and documenting clear evidence for each requirement, your organization can demonstrate both real-world resilience and audit readiness.

## Further information

The *[Essential Eight maturity model](https://www.cyber.gov.au/business-government/asds-cyber-security-frameworks/essential-eight)* is part of a suite of related publications:

- Answers to questions on this maturity model are available in the *[Essential Eight maturity model FAQ](https://www.cyber.gov.au/business-government/asds-cyber-security-frameworks/essential-eight/essential-eight-maturity-model-faq)* publication.
- Additional mitigation strategies are available in the *[Strategies to mitigate cybersecurity incidents](https://www.cyber.gov.au/business-government/asds-cyber-security-frameworks/mitigating-cyber-security-incidents)* publication.
- [Essential Eight Assessment Report Template](https://www.cyber.gov.au/business-government/asds-cyber-security-frameworks/essential-eight/essential-eight-assessment-process-guide#:~:text=maturity%20model%20FAQ-,Essential%20Eight%20assessment%20report%20template,-Essential%20Eight%20assessment)

## Related articles

- [Level Picker for Frameworks with Tiered Requirements](level-picker-for-frameworks-with-tiered-requirements.md)
- [ACSC Essential Eight Overview](acsc-essential-eight-overview.md)
- [Example Evidence for Not Monitored Controls (Essential Eight)](example-evidence-for-not-monitored-controls-essential-eight.md)
- [Cyber Essentials v3.2: What’s Changed and How to Prepare](cyber-essentials-v3-2-what-s-changed-and-how-to-prepare.md)
- [APRA CPS 230: A Requirement-Level Guide](apra-cps-230-a-requirement-level-guide.md)
