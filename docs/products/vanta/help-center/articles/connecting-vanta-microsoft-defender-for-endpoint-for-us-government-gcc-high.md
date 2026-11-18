# Connecting Vanta & Microsoft Defender for Endpoint for US Government (GCC High)

Source: https://help.vanta.com/en/articles/13730348-connecting-vanta-microsoft-defender-for-endpoint-for-us-government-gcc-high
Collection: Integrations ; Integrations › Integrations by Type ; Integrations › Integrations by Type › Vulnerability Scanners
Fetched: 2026-11-17

## Article text

## Overview
Microsoft Defender for Endpoint for US Government (GCC High) is an enterprise endpoint security platform hosted in the Azure Government Cloud. It is designed for US government contractors and organizations managing Controlled Unclassified Information (CUI) that require a FedRAMP-authorized security environment. 
 
This integration connects Vanta to your GCC High Defender tenant via OAuth (via Azure Government authorization endpoint) and provides endpoint detection and response (EDR), vulnerability management, and threat protection. It provides visibility into endpoint security posture and vulnerabilities. 
 
Estimated setup time: 5-10 minutes
ℹ️ Note: This guide covers the Microsoft Defender for Endpoint (GCC High) integration, which is available on the Vanta Government instance. If you are connecting a commercial Microsoft 365 tenant, see Connecting Vanta & Microsoft Defender for Endpoint <https://help.vanta.com/en/articles/16988266-connecting-vanta-microsoft-defender-for-endpoint>.
 
 

## Use cases and capabilities
This integration with Vanta powers the following workflows for organizations operating in the GCC High government cloud environment: 
- 
Endpoint monitoring for vulnerability management: Vanta imports your Defender-enrolled endpoint machines and maintains them as monitored assets. This gives you a continuously updated view of which devices are active in your environment without manual tracking. 
- 
Vulnerability management: Vanta syncs CVE-based vulnerability findings from Defender and links each finding to the affected endpoint machine. This data powers four automated tests in Vanta, one for each severity level: critical, high, medium, and low. These tests run automatically and help demonstrate continuous vulnerability management to auditors. 
- 
Evidence collection: Vulnerability and endpoint data synced through this integration is available as continuous evidence in Vanta, reducing the need for manual screenshots or exports during audits. 
- 
Remediation acceleration: For each vulnerability finding, Vanta surfaces remediation guidance parsed from the CVE details returned by Defender. Teams can review what action is needed directly in Vanta without switching to the Defender portal to look up fix guidance per CVE.
- 
Posture monitoring: Vanta imports device risk scores and exposure levels assigned by Defender for each enrolled endpoint. Teams can review which machines carry elevated risk or high exposure as part of their ongoing security posture review.
- 
Compliance support: Vulnerability findings synced from Defender feed directly into Vanta's automated test results and evidence library. This reduces manual evidence gathering during audits and helps demonstrate that vulnerability management controls are operating continuously across your endpoint environment.
 
 

## Prerequisites
Confirm all of the following before starting setup: 
- 
You have access to the Vanta Government instance
- 
You have admin access in Vanta
- 
You have a Microsoft Defender for Endpoint license (which includes Threat and Vulnerability Management) such as Microsoft Defender for Endpoint Plan 2 or Microsoft 365 E5 GCC High 
- 
Your organization is enrolled in the GCC High (Azure Government) environment (not standard commercial Microsoft 365)
- 
Microsoft Defender for Endpoint is deployed and devices are actively onboarded 
- 
Threat and Vulnerability Management is enabled in your Defender tenant 
- 
The person completing setup holds a Global Administrator or equivalent admin role in the GCC High Microsoft 365 organization (which is required to grant tenant-wide consent during the OAuth flow) 
- 
Confirm your admin role before starting: open the Microsoft 365 Defender portal for GCC High <https://security.microsoft.us/> and verify that your account is assigned one of Microsoft's admin roles that allows you to approve connections on behalf of your organization 
 
 

## Setup guide

### In Vanta (Gov instance only), navigate to Integrations <https://app.vanta.com/integrations>.
- 
Log in to your Vanta Government instance.
- 
To connect, go to the Integrations page, click Add integration, and search for Microsoft Defender for Endpoint (GCC High). For help navigating the Integrations page, see Integrations Page <https://help.vanta.com/en/articles/11345761-integrations-page>.
- 
Click Connect. 
[image 01]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2230789475/f7ef50ee67446d6fe95574568f53/b39743b0-bcae-4f5a-b99d-d57bae28ad48?expires=1794967200&signature=ef0783ecd8e12290f277ff7fc6a70be0df756fcca84f083929d171d6c2306c4d&req=diIkFs52lIVYXPMW1HO4zZlndPORpiI4mTRAiWI6d1JcwprtyqANb2uZBv6o%0AiF8jcqc4ghAPuZfcGt4%3D%0A>
- 
Then click Connect Microsoft Defender for Endpoint (GCC High).  
[image 02]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2230789478/914fbcd14a24f7075f76b74f97ac/4d803070-7317-4409-99f8-355be429b177?expires=1794967200&signature=dd12795fca8e9d674231133e62f6f3518f0c0418407e2c6051c2e9de8cc2c5a1&req=diIkFs52lIVYUfMW1HO4zZm0yFUo4HTZKNOVbkQl6gcu4semM%2BPwd5eqxaWo%0A0W5h4lyqybtBpG%2FKa9Q%3D%0A>
- 
You will be redirected to Microsoft Azure’s Government sign-in page: (https://login.microsoftonline.us/ <https://login.microsoftonline.us/>). Sign in with your GCC High admin account. You must be a Global Administrator (or equivalent) to complete this step. 
- 
Review the permissions Vanta is requesting and click Accept to grant tenant-wide consent. 
Note: Vanta requests read-only access. No write permissions are granted. 
 
[image 03]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2230789476/18782a4af16f93e512840740f9dd/c0d109bb-d3d1-4562-a91a-d60f1bf46f97?expires=1794967200&signature=98eb7660a7052d75024a8bc41b8c03615fb2fd8a8b1ec4be8a8a8197f00bd03f&req=diIkFs52lIVYX%2FMW1HO4zdcmD725U%2BNiUdegplMbhKnKX%2BK5NFCUafaTepU6%0AzfyZIZr1RIZPCs2GGyE%3D%0A>
- 
After consent is granted, Microsoft redirects back to Vanta. Vanta validates the connections and stores your tenant credentials. 
[image 04]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2230789479/bd1ae24ce8f3986ef73d76cc27b0/f915c4b3-e532-409b-8b6c-f86b0df8837b?expires=1794967200&signature=c7caf5ab067ebda4eb30416084c8e83c264acd5b0b793dd780f455b4cb927e7f&req=diIkFs52lIVYUPMW1HO4zSoIQLLeIo6guHZ5TyKha%2FHyYzr7YdDkg16OYHjg%0AiiNQbZ6vymjNVqlpe7Y%3D%0A>
- 
Click Close. Vanta will begin syncing endpoint machine and vulnerability data on its standard recurring schedule.
 
 

## Verification and validation
After completing setup, the integration should appear as Connected in your Vanta Integrations page.
 

### Confirming data is syncing
- 
Navigate to the Vulnerabilities page in Vanta. Your Defender endpoint machines should appear as vulnerable assets (monitored endpoints), with CVE findings linked to them and organized by severity (Critical, High, Medium, Low). For more on reading this page and tracking SLA deadlines, see The Vulnerabilities Page <https://help.vanta.com/en/articles/11345382-the-vulnerabilities-page>.

### What to check if data is missing
- 
Confirm that devices in Defender have Active health status and are not excluded.
- 
Confirm that endpoint devices are onboarded in Microsoft Defender for Endpoint (Vanta only pulls vulnerability data for onboarded machines).
- 
Confirm that Threat and Vulnerability Management is enabled in your Defender tenant.
- 
Confirm that your Defender license supports vulnerability data access.
- 
Check that the integration status in Vanta shows Connected (not an error state).
 
 

## Permissions
Vanta connects to your Defender tenant with read-only access. The person completing setup must be a Global Administrator (or equivalent) in the GCC High Microsoft 365 organization to grant tenant-wide consent.
 

### Read access
Vanta uses the authorization you grant during setup to read the endpoint machines enrolled in your GCC High Defender tenant, including each machine's health status, risk score, and exposure level, and to read the CVE-based vulnerability findings that Threat and Vulnerability Management raises against those machines.
Vanta does not import Defender alerts.
Microsoft displays the full set of permissions you are granting on the consent screen during setup. Review them there before you accept.
 

### Write access
Vanta has no write access to your Defender environment. Vanta cannot create, modify, close, or remediate anything in Defender.
 
 

## Troubleshooting and FAQs
Issue: No endpoint machines appear in Vanta after connecting
- 
Likely cause: No machines in your Defender tenant have an Active health status, or all machines are marked as excluded in Defender.
- 
How to confirm: Log in to the Microsoft Defender portal for GCC High (security.microsoft.us) and verify that enrolled devices show a health status of Active and are not excluded.
- 
Fix: Ensure devices are actively onboarded to Defender for Endpoint and are not excluded from the inventory. Then wait for the next sync cycle or contact Vanta support to trigger a manual sync.
 
Issue: Machines appear but no vulnerability data is visible
- 
Likely cause: Either Threat and Vulnerability Management is not enabled in your Defender tenant, or the initial machine sync has not yet completed (vulnerability data requires machines to be recorded first).
- 
How to confirm: In the Defender portal, navigate to Threat and Vulnerability Management and verify it is active. Also confirm the integration has completed at least one full sync cycle in Vanta.
- 
Fix: Enable Threat and Vulnerability Management in your Defender settings. If it is already enabled, wait for an additional sync cycle to complete. If the issue persists, verify your Defender license includes this feature.
 
Issue: The integration disconnects and shows an error in Vanta
- 
Likely cause: The permissions granted during setup were revoked, or the admin account used during setup no longer has sufficient rights in the GCC High tenant.
- 
How to confirm: Check the integration status in Vanta. A disconnected state following a previously successful connection typically indicates a permissions or authorization issue.
- 
Fix: Reconnect the integration from the Vanta Integrations page. Ensure the account completing setup is a Global Administrator in the GCC High organization and can grant tenant-wide admin consent.

## Images

- [image 01] ../../images/ux/integrations/connecting-vanta-microsoft-defender-for-endpoint-for-us-government-gcc-high--01.png
- [image 02] ../../images/ux/integrations/connecting-vanta-microsoft-defender-for-endpoint-for-us-government-gcc-high--02.png
- [image 03] ../../images/integrations/microsoft/connecting-vanta-microsoft-defender-for-endpoint-for-us-government-gcc-high--03.png
- [image 04] ../../images/ux/integrations/connecting-vanta-microsoft-defender-for-endpoint-for-us-government-gcc-high--04.png
