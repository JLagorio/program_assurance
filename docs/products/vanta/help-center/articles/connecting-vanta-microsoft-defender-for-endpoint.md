# Connecting Vanta & Microsoft Defender for Endpoint

Source: https://help.vanta.com/en/articles/16988266-connecting-vanta-microsoft-defender-for-endpoint
Collection: Integrations ; Integrations › Integrations by Type ; Integrations › Integrations by Type › Vulnerability Scanners
Fetched: 2026-11-17

## Article text

## Overview
The Microsoft Defender for Endpoint integration connects your Defender tenant to Vanta over OAuth, importing the devices onboarded to your tenant along with the vulnerability findings raised against them. It is best suited for teams that already use Defender for Endpoint as their endpoint security and vulnerability management tool.
 
Vanta links each finding to the device it affects and brings in device health status, risk score, and exposure level alongside CVE severity and CVSS v3 scores, so you can prioritize remediation the same way Defender does.
 
Estimated setup time: 5 minutes
 
ℹ️ Note: This guide covers the commercial Defender for Endpoint integration. GCC High tenants on the Vanta Government instance use a separate integration — see Connecting Vanta & Microsoft Defender for Endpoint for US Government (GCC High) <https://help.vanta.com/en/articles/13730348-connecting-vanta-microsoft-defender-for-endpoint-for-us-government-gcc-high>. Microsoft Defender for Cloud, which reports on cloud infrastructure rather than devices, is part of Vanta's Azure integration <https://help.vanta.com/en/articles/15693150-azure-integration-guide>.
 
 

## Use cases and capabilities
- 
Device Monitoring: Connect your Defender tenant and we import each active device onboarded to Defender for Endpoint, maintaining it as a monitored asset in Vanta. This gives you a continuously updated view of your fleet without manual tracking.
- 
Vulnerability Management: We sync CVE-based findings from Microsoft Defender Vulnerability Management and link each finding to the device it affects. These findings power four automated tests in Vanta, one each for critical, high, medium, and low severity.
- 
Remediation Acceleration: For each finding, we surface the affected software product and version and, where Microsoft publishes one, the KB article that remediates it. Your team can see what action is needed without opening the Defender portal for each CVE.
- 
Posture Monitoring: We import the risk score and exposure level Defender assigns to each device, so you can review which devices carry elevated risk as part of your ongoing posture review.
- 
Evidence Collection: Device and vulnerability data synced through this integration is available as continuous evidence in Vanta, reducing manual screenshots and exports at audit time.
 

### Capabilities overview
 | 
Resource / Capability | 
Supported | 
How it is used in Vanta
 | 
Devices | 
Yes | 
Imported as monitored assets with health status, risk score, and exposure level
 | 
Vulnerability findings | 
Yes | 
Per-device CVE findings with severity and CVSS v3 score populate the Vulnerabilities page
 | 
Remediation guidance | 
Yes | 
Affected software product and version, plus the fixing Microsoft KB article where one is published
 | 
Automated tests | 
Yes | 
Four tests, one each for critical, high, medium, and low severity findings
 | 
Evidence collection | 
Yes | 
Device vulnerability evidence applies to every compliance framework you monitor in Vanta
 | 
Device selection from Vanta | 
No | 
Not supported — which devices sync is determined by their health status and exclusion state in Defender
 | 
Alerts | 
No | 
Not imported — use the Defender portal to review alerts
 | 
Write access to Defender | 
No | 
Not supported — access is read-only
 
 

## Prerequisites
Before starting setup, confirm the following:
- 
You have a Vanta admin account.
- 
Your tenant has a Microsoft Defender for Endpoint Plan 2 or Microsoft Defender Vulnerability Management license.
- 
You have a Microsoft Entra account with the Global Administrator or Privileged Role Administrator role, so you can grant admin consent on behalf of your whole tenant.
💡 Tip: Confirm your devices are onboarded and showing an Active health status in the Microsoft Defender portal <https://security.microsoft.com/> before you connect. We import only devices in that state, so connecting before any devices qualify leaves the integration with nothing to sync.
 
 

## Explore the integrations page 
When you navigate to the Microsoft Defender for Endpoint integration, you'll land on its listing page, which includes five tabs that cover what you need to know before (and after) you connect.
- 
Overview — Start here. A summary of what the integration does, its top capabilities, and the prerequisites you'll need in place before connecting. When you're ready, click Connect to begin setup.
- 
API permissions — Exactly what access Vanta requests from Microsoft Defender for Endpoint: each permission's scope, whether it's read or write, and what data it covers, etc. Share this tab with your security team if they need to review access before you connect.
- 
Resource types — Every resource type Vanta imports from this integration, down to the specific fields collected for each. Use this to understand exactly what data will show up in Vanta once connected.
- 
Automated tests — How many tests connecting this integration unlocks and which frameworks and controls they map to (SOC 2, ISO 27001, etc.), plus the full list of tests by name. Useful for scoping compliance coverage ahead of an audit.
- 
Security — How Vanta protects the data it collects — encryption, data retention, access controls, and infrastructure. Visit Vanta's Trust Center <https://trust.vanta.com/> for the full picture.
When you’re ready to connect, continue to the setup guide below.
 
 
 
 

## Setup guide

### Step 1: Find the Defender for Endpoint integration in Vanta
- 
In Vanta, go to the Integrations page, click Add integration, and search for Microsoft Defender for Endpoint. For help navigating, see our guide to the Integrations Page <https://help.vanta.com/en/articles/11345761-integrations-page>.
- 
Click the integration card. 
[image 01]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2677500193/0936409d5820aafbbe5b97e42a36/image.png?expires=1794967200&signature=e95dca262fee1bc6da5e23f92d768522f4d6a92685ce958f1c078d2019f2015f&req=diYgEcx%2BnYBWWvMW1HO4zeBmvP%2FwIPuYh30fNHmn4WbvyaLGEudAFQICFAxR%0ApLlbBY1OlVQOw2PHwtQ%3D%0A>
- 
A detailed integration listing page will open. To learn more about this experience, review Explore the integration page <https://help.vanta.com/en/articles/14977969-google-workspace-integration-guide#h_af1fa4c1ad> section.
- 
Click Connect.
[image 02]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2677503044/3d32c7f77daf277ab0c901b57a57/image.png?expires=1794967200&signature=537c12f22c93c97cf529813fb48f3e9df51816381c8201082076a8a6b0c157fa&req=diYgEcx%2BnoFbXfMW1HO4zdJcJDxpsvH8AKnxZ%2FmyR%2B0hwKijEy%2FY1h9ZdWug%0A804BwGOfq8ANHeT3c9I%3D%0A>
 

### Step 2: Authorize the connection
- 
On the Connect Microsoft Defender for Endpoint step, click Connect. Vanta opens Microsoft's sign-in flow.
[image 03]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2677504591/475fdae7ac4219f34965bdf14bd7/image.png?expires=1794967200&signature=27b8a4288827b25c296223a147e9bc532d5c27fc24d06a6abfa60c6097846ed4&req=diYgEcx%2BmYRWWPMW1HO4zfzq2J1Ou6v4lasBCIjpR8J%2BMzia8q0%2BTUkLURLT%0A5uxX42ruEqnGABGA0qc%3D%0A>
- 
Sign in with the Microsoft Entra account that holds the Global Administrator or Privileged Role Administrator role.
- 
Review the access Vanta is requesting and click Accept to grant consent on behalf of your organization. For what we request and why Microsoft may list more, see the Permissions section of this article.
[image 04]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2677507172/816c28876569ecf382781638b5d1/image.png?expires=1794967200&signature=e78ca0048472c8389e977d079bc809ae502eb21eb77b632dfdb5eecac3fe63a5&req=diYgEcx%2BmoBYW%2FMW1HO4zS8iZ%2F3469zmIzU4Nczsn8WFRhHoK0U5e6ekyXLu%0A7bVgVhndPAJdFn%2BkUZI%3D%0A>
 

### Step 3: Confirm the connection
- 
Microsoft redirects you back to Vanta, which confirms You're connected and begins syncing your resources.
- 
Click Manage integration to follow sync progress, review your synced data, or update integration settings.
[image 05]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2677508758/d5ae7c3ad337e1f001012df44198/image.png?expires=1794967200&signature=0d75c608eda9a02a2d7383fbc19bc04971faf01e295202b940216167d7d98369&req=diYgEcx%2BlYZaUfMW1HO4zR3zW7PEGsDFqUpn0PwdBTNmxm%2BkiGcUsRUFhePV%0Ab7%2FD1C7pVIoYC1KtDzI%3D%0A>
 
 
 

## Permissions

### Read access
We use the authorization you grant during setup to read the devices onboarded to your Defender tenant, including each device's health status, risk score, and exposure level, and to read the vulnerability findings Microsoft Defender Vulnerability Management raises against those devices, including CVE ID, severity, and CVSS v3 score. We do not import Defender alerts.
 
For the full list of permissions this integration requests, open the integration's listing page in Vanta and select the API permissions tab.
 

### Write access
We have no write access to your Defender environment. We cannot create, modify, close, or remediate anything in Defender.
 
 

## Troubleshooting and FAQs

### Setup fails with an authorization error
- 
Likely cause: The account used to grant consent does not hold a role that can consent on behalf of the organization.
- 
How to confirm: In the Microsoft Entra admin center <https://entra.microsoft.com/>, check the roles assigned to the account you used.
- 
Fix: Reconnect the integration and grant admin consent using an account with the Global Administrator or Privileged Role Administrator role.

### Setup fails with a permissions error
- 
Likely cause: Consent was granted, but not for all of the permissions the integration needs.
- 
How to confirm: The error names the permissions we could not use. You can compare them against the API permissions tab of the integration's listing page in Vanta.
- 
Fix: Reconnect the integration and grant admin consent for all requested permissions.

### The integration is connected but no devices appear
- 
Likely cause: No devices in your Defender tenant have an Active health status, or all of them are marked as excluded.
- 
How to confirm: In the Microsoft Defender portal <https://security.microsoft.com/>, check that your onboarded devices show a health status of Active and are not excluded.
- 
Fix: Confirm your devices are actively onboarded to Defender for Endpoint and are not excluded, then allow the next sync to complete.

### Devices appear but no vulnerability findings appear
- 
Likely cause: The initial device sync has not finished. We record your devices first, then pull the vulnerability findings for them, so findings cannot appear until the devices have synced.
- 
How to confirm: Open the integration in Vanta and click the Activity tab to check sync progress.
- 
Fix: Allow another sync cycle to complete. If your devices are present and findings still do not appear, confirm your Defender license includes vulnerability management.

### Where can I see sync progress or find out why a sync failed?
Open the integration in Vanta and click the Activity tab. The activity log shows sync history and error details for each run.

## Images

- [image 01] ../../images/ux/integrations/connecting-vanta-microsoft-defender-for-endpoint--01.png
- [image 02] ../../images/ux/integrations/connecting-vanta-microsoft-defender-for-endpoint--02.png
- [image 03] ../../images/integrations/microsoft-defender-for-endpoint/connecting-vanta-microsoft-defender-for-endpoint--03.png
- [image 04] ../../images/integrations/microsoft-defender-for-endpoint/connecting-vanta-microsoft-defender-for-endpoint--04.png
- [image 05] ../../images/integrations/microsoft-defender-for-endpoint/connecting-vanta-microsoft-defender-for-endpoint--05.png
