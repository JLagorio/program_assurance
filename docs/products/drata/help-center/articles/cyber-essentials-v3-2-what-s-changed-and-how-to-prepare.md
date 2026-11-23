# Cyber Essentials v3.2: What’s Changed and How to Prepare

Source: https://help.drata.com/en/articles/13188560-cyber-essentials-v3-2-what-s-changed-and-how-to-prepare
Collection: Framework Information › Cyber Essentials
Updated: 2026-07-07
Fetched: 2026-11-22
Description: CE is a UK government-backed certification that helps organizations protect themselves from cyber threats. It focuses on 5 key areas: firewalls, secure setup, keeping software updated, controlling who can access what, and protecting against malware.

## Article text

## What is Cyber Essentials (CE)?

Cyber Essentials is a UK government-backed certification that helps organizations protect themselves from common cyber threats. It focuses on five key areas: firewalls, secure setup, keeping software updated, controlling who can access what, and protecting against malware.

## Who Needs Cyber Essentials?

Cyber Essentials is especially relevant for UK-based organizations that work with government contracts or handle sensitive data. That said, any business – from small startups to large enterprises – can benefit from it as a way to show strong cybersecurity practices.

It’s also worth understanding the two certification levels:

- **Cyber Essentials** is a self-assessed certification that covers the core security controls.
- **Cyber Essentials Plus** includes the same requirements but adds an independent technical audit to validate that the controls are properly implemented.

## Why is it changing?

Cyber threats constantly evolve, so CE needs to be updated to remain effective. Version 3.2 (also called "Willow") replaces the previous v3.1 ("Montpellier").

## When do the changes take effect?

- **As of April 28, 2025:** All new certifications now follow the v3.2 "Willow" question set.
- **Grace Period:** If you started your certification before April 28, 2025, you have until October 28, 2025, to complete it under the old v3.1 standard.

## Key Changes in v3.2:

1. **Passwordless Authentication is now allowed:** You can use methods like biometrics or security keys instead of traditional passwords, as long as they are secure.
2. **Stronger focus on Multi-Factor Authentication (MFA) and Least Privilege:** MFA is still required for cloud and internet-facing accounts. There is increased emphasis on ensuring that people should only have access to what they need for their job.
3. **"Software" definition clarified (Plugins are now "Extensions"):** This means browser extensions and similar add-ons are included when you need to manage and update software.
4. **"Vulnerability Fixes" are mandatory:** Previously, you had to apply patches. Now, if a vendor provides *any* fix for a high-risk vulnerability (even a configuration change or script), you must apply it within 14 days. You can't defer applying fixes until a traditional patch is released.
5. **"Home and Remote Working" is explicitly in scope:** Any device used for work outside the main office (home, cafes, etc.) must meet CE standards. This means you need to secure all these devices as if they were in the office.
6. **Clearer Questions:** The new "Willow" question set has links to a knowledge base and shows relevant requirement text to make it easier to understand.

## Changes for Cyber Essentials Plus (the audit-level certification):

The audit process is getting stricter to ensure thoroughness.

- **Scope Verification:** The auditor will now formally check that the systems they are testing match what you said was in scope during your self-assessment.
- **Segregation Verification:** If you exclude parts of your IT from the scope, the auditor will technically verify that these systems are truly separated and can't interact with the in-scope systems.
- **Sample Size Verification:** Auditors will ensure they test enough devices to represent your environment accurately.
- **Stricter Vulnerability Test:** If a vulnerability (even one that can be fixed by a configuration change) has a vendor fix available for more than 14 days, your device will fail the audit.
- **72-Hour Device Selection Notice:** Auditors will give you only 72 hours' notice of which specific devices they will test. This means all your in-scope devices need to be continuously compliant.

## What does this mean for your organization?

- **Small Businesses:** You'll need to be more diligent about patch management and potentially get help with vulnerability scanning. Securing all devices (including those used at home) is crucial.
- **Mid-size and Large Enterprises:** If you exclude parts of your network from scope, you'll need to ensure strict segmentation. You should also review user access rights and leverage existing patch and vulnerability management processes.
- **Organizations with Remote Workers:** You must update your policies and controls to ensure all remote devices (company-issued or personal) meet CE standards. This means firewalls, antivirus, and updates on all these devices.

## Actionable Steps to Comply:

1. **Update Policies and Inventory:** Review what's in scope, document how you separate systems, and update your security policies to reflect the new terms.
2. **Ensure All Software is Supported and Patched:** Get rid of unsupported software. Implement a process to apply *all* vulnerability fixes (patches, configuration changes, scripts, etc.) within 14 days.
3. **Strengthen Authentication and Access Control:** Enforce MFA. Consider passwordless solutions if they fit your needs. Ensure users don't have unnecessary admin rights.
4. **Secure Remote Work Setups:** Make sure remote devices have firewalls, use VPNs when connecting from public networks, and educate staff on remote security.
5. **Prepare for CE Plus (if applicable):**
   - Do a pre-audit check of your scope and network segmentation.
   - Review your asset count and understand how the auditor will select samples.
   - Run internal vulnerability scans with credentials to find and fix issues beforehand.
   - Gather all necessary documentation.

## Conclusion:

Cyber Essentials v3.2 is an evolution, not a complete overhaul. It provides clearer guidance and strengthens requirements, particularly around patch management and securing remote work. By preparing early, you can improve your cybersecurity posture and ensure a smooth certification process.

## Related articles

- [Example Evidence for Not Monitored Controls (SOC 2)](example-evidence-for-not-monitored-controls-soc-2.md)
- [Example Evidence for Not Monitored Controls (CIS 8.1)](example-evidence-for-not-monitored-controls-cis-8-1.md)
- [Example Evidence for Not Monitored Controls (ISO 27001) - Revised (Following 5/7/2024 Updates)](example-evidence-for-not-monitored-controls-iso-27001-revised-following-5-7-2024-updates.md)
- [Example Evidence for Not Monitored Controls (Essential Eight)](example-evidence-for-not-monitored-controls-essential-eight.md)
- [Example Evidence for Not Monitored Controls (NIST CSF 2.0)](example-evidence-for-not-monitored-controls-nist-csf-2-0.md)
