# Identity sync updates in Drata

Source: https://help.drata.com/en/articles/5330216-identity-sync-updates-in-drata
Collection: Understand the Drata Platform › Personnel
Updated: 2026-08-05
Fetched: 2026-11-22
Description: Understand when personnel, user, and device changes will show in Drata

## Article text

When you make an update within your identity provider, HRIS, version control, infrastructure, or MDM system to an employee or user account, it can take up to 24 hours to see the updates appear within Drata. This is due to the availability of this updated data on the connection's API.

Important to note, deleting an account in one of these version control or infrastructure accounts will not remove it from Drata. Instead, Drata will add a timestamp under 'Access Revoked' on the Managed Accounts screen. This is important as it creates an audit trail allowing for tracking of access control SLAs.

Further, these are the monitoring tests that are at least partially dependent on a once-daily or ad-hoc user data sync. If you click the Test Now button for these tests, you may not see a change in the results until Drata syncs the latest user data from the connected platform. Follow the instructions in [this article](https://help.drata.com/en/articles/6338108-ad-hoc-identity-resync) to initiate an ad-hoc of that user data.

Upon the completion of that sync, you can rerun these tests to see updated results.

- Test 6 - Only Authorized Employees Access Version Control
- Test 86 - MFA on Identity Provider
- Test 87 - MFA on Version Control System
- Test 88 - MFA on Infrastructure Console
- Test 94 - Version Control Accounts Removed Properly
- Test 95 - Infrastructure Accounts Properly Removed
- Test 96 - Employees have Unique Email Accounts
- Test 97 - Employees have Unique Version Control Accounts
- Test 98 - Employees have Unique Infrastructure Accounts
- Tests 61 - Screensaver Lock Required on Employee Computers, 63 - Password Manager Records on Employee Computers, 64 - Malware Detection Software Installed on Employee Computers, 65 - Security Patches Auto-Applied on Employee Computers, and 66 - Hard-Disk Encryption Enabled on Employee Computers, but only if you are using an MDM connection
- Test 43 - Security Awareness Training Completed, but only if you are using a Security Training connection
- Test 38 - Policies are Acknowledged by Employees, but only if you are using the Bamboo External Policy Management connection
- Tests 45 - Employees Acknowledge the Acceptable Use Policy, 48 - Contractors Acknowledge the Code of Conduct, 49 - Contractors Acknowledge the Acceptable Use Policy, 55 - Employees Acknowledge the Code of Conduct, 57 - Employees Acknowledge the Data Protection Policy, 190 - Policies are Acknowledged by Contractors, and 191 - Contractors Acknowledge the Data Protection Policy, but only if you are using one of the External Policy Management connections *and* if you have specifically mapped these policies from that external source

Vulnerability monitoring tests

- Test 21: Vulnerability Scanning
- Tests 212 and 213
   - Critical Vulnerabilities Addressed (AWS Inspector)
   - High Vulnerabilities Addressed (AWS Inspector)
- Tests 235 and 236
   - Critical Vulnerabilities Addressed (Tenable)
   - High Vulnerabilities Addressed (Tenable)
- Tests 237 and 238
   - Critical Vulnerabilities Addressed (Snyk)
   - High Vulnerabilities Addressed (Snyk)
- Tests 239 and 240
   - Critical Vulnerabilities Addressed (Semgrep)
   - High Vulnerabilities Addressed (Semgrep)
- Tests 241 and 242
   - Critical Vulnerabilities Addressed (Qualys)
   - High Vulnerabilities Addressed (Qualys)
- Tests 282 and 283
   - Critical Vulnerabilities Addressed (CrowdStrike Spotlight)
   - High Vulnerabilities Addressed (CrowdStrike Spotlight)
- Tests 284 and 285
   - Critical Vulnerabilities Addressed (SentinelOne VMS)
   - High Vulnerabilities Addressed (SentinelOne VMS)
- Tests 286 and 287
   - Critical Vulnerabilities Addressed (Microsoft Defender Vulnerability Management)
   - High Vulnerabilities Addressed (Microsoft Defender Vulnerability Management)
- Tests 288 and 289
   - Critical Vulnerabilities Addressed (Rapid7 VMS)
   - High Vulnerabilities Addressed (Rapid7 VMS)
- Tests 313 and 314
   - Critical Vulnerabilities Addressed (Arnica)
   - High Vulnerabilities Addressed (Arnica)
- Tests 315 and 316
   - Critical Vulnerabilities Addressed (Aikido)
   - High Vulnerabilities Addressed (Aikido)
- Tests 317 and 318
   - Critical Vulnerabilities Addressed (Wiz VMS)
   - High Vulnerabilities Addressed (Wiz VMS)
- Tests 319 and 320
   - Critical Vulnerabilities Addressed (Wiz Code)
   - High Vulnerabilities Addressed (Wiz Code)
- Tests 321 and 322
   - Critical Vulnerabilities Addressed (Microsoft Defender VMS GCC High)
   - High Vulnerabilities Addressed (Microsoft Defender VMS GCC High)
- Tests 323 and 324
   - Critical Vulnerabilities Addressed (Orca Security)
   - High Vulnerabilities Addressed (Orca Security)
- Tests 325 and 326
   - Critical Vulnerabilities Addressed (Upwind)
   - High Vulnerabilities Addressed (Upwind)
- Tests 327 and 328
   - Critical Vulnerabilities Addressed (GitLab VMS)
   - High Vulnerabilities Addressed (GitLab VMS)

## Related articles

- [SentinelOne Singularity Vulnerability Management (VMS) Integration Guide](sentinelone-singularity-vulnerability-management-vms-integration-guide.md)
- [Creating an SLA for Employee Onboarding Completion](creating-an-sla-for-employee-onboarding-completion.md)
- [Vulnerabilities](vulnerabilities.md)
- [Getting Started with Drata: Personnel - Webinar Recording](getting-started-with-drata-personnel-webinar-recording.md)
- [Troubleshooting Identity Sync Issues in Drata](troubleshooting-identity-sync-issues-in-drata.md)
