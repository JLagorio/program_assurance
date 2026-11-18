# Integrating Vanta & Datadog

Source: https://help.vanta.com/en/articles/11345784-integrating-vanta-datadog
Collection: Integrations ; Integrations › Integrations by Type ; Integrations › Integrations by Type › Access and Additional Integrations
Fetched: 2026-11-17

## Article text

## Overview
The Datadog integration connects your Datadog account to Vanta using an API Key and Application Key, automatically collecting user access information, infrastructure monitoring evidence, and security findings. Vanta always reads your Monitors and Users. You can additionally choose to enable Cloud Security and/or Cloud SIEM, each of which unlocks a different set of capabilities and requires additional Application Key scopes.
 
Estimated setup time: 10–15 minutes for an admin with Datadog Organization Settings access. The first sync may take a few hours depending on data volume.
 
 

## Use cases and capabilities
- 
Access management: We sync users who have Active status in Datadog to Vanta's Access page so you can monitor who has access to Datadog, run access reviews, and receive offboarding reminders when an employee leaves.
- 
Infrastructure monitoring evidence: We pull all infrastructure monitors from Datadog and surface them as evidence for infrastructure monitoring controls, with no manual uploads required.
- 
Vulnerability management and security alerts (Cloud Security): When you enable Cloud Security, we import library and host/container vulnerability findings (CVEs) from Datadog Cloud Security Management and surface them in Vanta's Vulnerability Inventory. Findings are tracked across four severity tiers: Critical, High, Medium, and Low. We also import security alert findings (such as misconfigurations, identity risks, and attack paths) to power security alert SLA compliance tests.
⚠️ Note: Some findings may be excluded from import. For example, findings without a CVE identifier, a severity level, or a matching Datadog asset. If you expect to see findings that aren't appearing, confirm that Datadog Cloud Security Management has generated them and that they include a CVE, severity, and associated asset.
- 
SIEM compliance (Cloud SIEM): When you enable Cloud SIEM, we collect detection rules, SIEM log indexes, and notification rules from Datadog Cloud SIEM to power automated SIEM compliance tests.

### Capabilities overview
 | 
Resource / Capability | 
Supported | 
How it is used in Vanta
 | 
Users | 
Yes | 
Access reviews, personnel tracking, offboarding reminders
 | 
Monitors | 
Yes | 
Infrastructure monitoring evidence and compliance tests
 | 
Vulnerability findings (CVEs) | 
Yes | 
Vulnerability Inventory; severity-based compliance tests (Critical / High / Medium / Low)
 | 
Security alerts | 
Yes | 
Security alert SLA compliance tests by severity
 | 
Vulnerability assets | 
Yes | 
Vulnerability monitoring targets under Inventory
 | 
Security detection rules | 
Yes | 
SIEM compliance tests
 | 
Log indexes | 
Yes | 
SIEM audit log retention tests
 | 
Security notification rules | 
Yes | 
SIEM monitoring and alerting tests
 | 
Groups / Roles | 
No | 
Not supported — access is tracked at the user level only
 | 
Write access to Datadog | 
No | 
Vanta has read-only access and cannot modify or deprovision accounts, monitors, or findings
 | 
Multiple Datadog accounts | 
Yes | 
A single Vanta org can connect multiple Datadog accounts or regions
 
 

## Prerequisites
Before starting setup, confirm the following:
- 
You have a Vanta administrator account.
- 
You have a Datadog administrator account, or any role that can access Organization Settings > Application Keys and API Keys, create keys, and grant the required scopes.
💡 Tip: We recommend creating the Application Key under a dedicated service account rather than a personal account. The Application Key inherits permissions from the user who creates it, so if that person leaves the organization, the connection may break.
Common blockers to check before you start:
- 
Application Key created without all the scopes required for the products you selected
- 
Region mismatch between your Datadog tenant and the region selected in Vanta
- 
Datadog Cloud Security (Vulnerability Management) not provisioned on your tenant — we can only surface findings that Datadog has already generated
 
 

## Setup guide

### Step 1: Find Datadog in Vanta
- 
In Vanta, go to the Integrations page and click Add integrations. 
- 
Search for Datadog. For help, see our guide to the Integrations Page <https://help.vanta.com/en/articles/11345761-integrations-page>.
- 
Click on the integration tile and then click Connect.
[image 01]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2551456872/f2cac10835596c543a87c8ef3429/image.png?expires=1794967200&signature=33c7d4ecebf889c6829d4aaab8e8f8366882fbce27a8466c112b8448d516cc20&req=diUiF817m4lYW%2FMW1HO4zX8SCTkESA3eVI%2B0gOa8TdbJtxb7gUVjCJZJKk6c%0AJGdr0sTcbAHY13L6Yfg%3D%0A>
 

### Step 2: Create your Datadog Application Key
- 
In Datadog, go to Organization Settings → Application Keys and create a new key.
- 
Grant the scopes that match the products you selected. Vanta displays the exact scopes required above the connection form.
[image 02]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2529384802/61801bfdb4535f8e446dac3a21eb/3ead5314-d476-4678-b084-6cd6ced0133d?expires=1794967200&signature=024ba5bf0a3d9d30dd75db8ac3d4e07e7ef50ee2e2dfb16b0288b3710e3801f2&req=diUlH8p2mYlfW%2FMW1HO4zTAHp6PjwbMG67Fi4zbuBYVsu2ctD2g2xvTG%2Btgh%0Ar%2BujCVbuodAqDegT%2B34%3D%0A>
 
Always required (Monitors and Users are always enabled): 
 | 
Scope | 
Purpose
 | 
monitors_read | 
Infrastructure monitor evidence
 | 
user_access_read | 
User access sync and offboarding
Additional scopes for optional products:
 | 
Product | 
Required scopes
 | 
Cloud Security | 
security_monitoring_findings_read, appsec_vm_read
 | 
Cloud SIEM | 
logs_read_config, logs_read_data, security_monitoring_rules_read, security_monitoring_notification_profiles_read

### Step 3: Create your Datadog API Key
- 
Still in Organization Settings, go to API Keys and create a new API Key.

### Step 4: Enter your credentials in Vanta
- 
Back in Vanta, on the Save API Key step, enter:
- 
Account Name — a label for this connection in Vanta
- 
Application Key and API Key from the steps above
- 
Region — select the region that matches your Datadog site
Supported regions: 
 | 
Region | 
Datadog site
 | 
US | 
app.datadoghq.com
 | 
US3 | 
us3.datadoghq.com
 | 
US5 | 
us5.datadoghq.com
 | 
EU | 
app.datadoghq.eu
 | 
AP1 | 
ap1.datadoghq.com
 | 
AP2 | 
ap2.datadoghq.com
 | 
US1-FED | 
app.ddog-gov.com
Not sure which region you're on? See Datadog's site identification guide <https://docs.datadoghq.com/getting_started/site/>.
- 
Click Done. 
[image 03]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2529394108/289f369cbe7c733236dc02d34977/image.png?expires=1794967200&signature=242db1fe6d2ea2f777d2f9fdb1d073054f9df34dbf8da2959ee35c58f50ffd0f&req=diUlH8p3mYBfUfMW1HO4zY%2BeDAssPm88oN8YnV7oayhq2oKRpNdYW0KTAGZ9%0AYwSg4PWMqYmKJjUeDaM%3D%0A>
 
ℹ️ Note: To connect additional Datadog accounts or regions, find the Datadog tile under Connected, click Manage → Edit, and repeat the setup with a new set of keys.
 

### Step 5: Select vulnerability severities (Cloud Security only)
- 
If you enabled Cloud Security in Step 2, you'll see a Select vulnerabilities step. This lets you choose the minimum severity of vulnerability findings Vanta imports from Datadog.
- 
Choose one of the following options:
 | 
Option | 
What Vanta imports | 
CVSS score range
 | 
All severity and scores (default) | 
All vulnerabilities regardless of severity | 
All scores
 | 
Critical only | 
Critical vulnerabilities only | 
9.0–10.0
 | 
High | 
High and above | 
7.0 and higher
 | 
Medium | 
Medium and above | 
4.0 and higher
 | 
Low | 
Low and above | 
0.1 and higher
- 
The default is All severity and scores. You can change this setting later by editing the connection.
- 
If you did not enable Cloud Security, this step is skipped automatically.
- 
Click Done.
[image 04]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2529397735/3010a16316c93bccdd49d8fc6958/image.png?expires=1794967200&signature=3f8f447dd3192b6bd15c6ff81376fb3ccf700482791277b64db0a5da70cde807&req=diUlH8p3moZcXPMW1HO4zUN%2FfjrwIOR0ItsE%2Bl2Eqpk2N5MV7%2BC9M%2FR5K65t%0A0uGiPlTuVDl0ACpAOdo%3D%0A>
 

## Permissions

### Read access
We use your API Key and Application Key to read:
- 
User data — to monitor who has access to Datadog and confirm deprovisioning when an employee leaves
- 
Infrastructure monitors — used as evidence for infrastructure monitoring controls
- 
Vulnerability findings and assets — used to populate Vanta's Vulnerability Inventory when Cloud Security is enabled
- 
SIEM detection rules, log indexes, and notification rules — used for automated SIEM compliance tests when Cloud SIEM is enabled
 

### Write access
Vanta has read-only access to Datadog. We cannot modify, provision, or deprovision any accounts, monitors, or findings.
 
 

## Troubleshooting and FAQs
 

### Connection fails with "Please check your application key scopes."
- 
Likely cause: The Application Key is missing a scope required by one of the products you enabled.
- 
Fix: Compare the scopes listed on Vanta's Save API Key step against the scopes on your key in Datadog, add any that are missing, and re-save the connection.

### Vulnerability findings are not appearing in Vanta
- 
Likely cause: Cloud Security was not selected during setup, or the Application Key is missing security_monitoring_findings_read or appsec_vm_read. Datadog Cloud Security Management (Vulnerability Management) may also not be provisioned on your tenant.
- 
Fix: Confirm Cloud Security is selected on the connection and verify the required scopes are present. Also confirm that Datadog Cloud Security is provisioned on your tenant. We only surface findings Datadog has already generated. Note: findings without a CVE identifier, a severity level, or a matching Datadog asset are automatically excluded.

### No Cloud SIEM data appearing in Vanta
- 
Likely cause: Cloud SIEM was not selected during setup, or the Application Key is missing one or more of the four required SIEM scopes.
- 
Fix: Confirm Cloud SIEM is selected on the connection and verify all four required scopes are present. If you are using Datadog for Government, contact Datadog Support to have the Logs Analytics API enabled on your tenant before enabling Cloud SIEM in Vanta.

### A terminated employee still shows as active in Vanta
- 
Likely cause: The user was removed from a Datadog team or role but was not deleted or deactivated in Datadog.
- 
Fix: Delete or deactivate the user directly in Datadog. Only those actions mark the user as deprovisioned in Vanta. The change will be reflected on the next sync.
⚠️ Note on Deprovisioning behavior: Vanta only syncs users who have Active status in Datadog. Users who are Disabled or have a Pending Invitation are not imported. We register a Datadog user as deprovisioned when they are deleted or deactivated in Datadog, meaning they no longer appear as Active on the next sync. Removing a user from a team or role without deactivating them will not trigger deprovisioning in Vanta.
 

### I get a credential or validation error when connecting
- 
Likely cause: The API Key, Application Key, or selected Region does not match the Datadog tenant.
- 
Fix: Confirm both keys belong to the tenant whose region you selected, and that neither has been revoked or had its scopes changed.

### Vanta flags my credentials as invalid after connecting
- 
Likely cause: Vanta received an authentication error from Datadog, typically because a key was revoked, expired, or rescoped.
- 
Fix: Re-create both keys with the correct scopes and re-save the connection in Vanta.
​

## Images

- [image 01] ../../images/ux/integrations/integrating-vanta-datadog--01.png
- [image 02] ../../images/integrations/datadog/integrating-vanta-datadog--02.png
- [image 03] ../../images/ux/integrations/integrating-vanta-datadog--03.png
- [image 04] ../../images/ux/integrations/integrating-vanta-datadog--04.png
