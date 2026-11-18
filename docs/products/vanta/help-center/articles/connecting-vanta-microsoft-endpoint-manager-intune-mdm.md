# Connecting Vanta & Microsoft Endpoint Manager / Intune MDM

Source: https://help.vanta.com/en/articles/11345786-connecting-vanta-microsoft-endpoint-manager-intune-mdm
Collection: Integrations ; Integrations › Integrations by Type ; Integrations › Integrations by Type › Access and Additional Integrations
Fetched: 2026-11-17

## Article text

Microsoft Endpoint Manager <https://www.microsoft.com/en-us/security/business/microsoft-endpoint-manager> is Microsoft's platform for managing devices. Microsoft Intune is now part of Microsoft Endpoint Manager as its MDM solution. Today, Vanta integrates with Microsoft Endpoint Manager by pulling in device and app info for Windows and MacOS devices. Vanta continuously runs tests on these devices to ensure secure and compliant configuration.
​
​

## Prerequisites
- 
Connection must be completed by the Administrator of Endpoint Manager.
An easy way to check if your account is an admin is to visit the Microsoft Endpoint Manager admin center  <https://endpoint.microsoft.com/?ref=AdminCenter#home/>and make sure that you can log in. Clicking on My permissions from the tenant admin menu, you should see that you are listed as an administrator with full permissions to Intune:
[image 01]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516765004/9df02811d54abfe6570e71b9d8b8/23701935004308?expires=1794967200&signature=d625c812a71bb2080e6b596b73cf446b0460a1af4c05b8f76bdfe39a0bdaa20b&req=dSUmEM54mIFfXfMW1HO4zfiRJZtLa8U1N36GeponAtL6EWa3lNe4T5EWR%2F9b%0A68qAb25v0%2FpTEvJpXO0%3D%0A>
 
 

## Explore the integrations page 
When you navigate to the Microsoft Endpoint Manager integration, you'll land on its listing page, which includes five tabs that cover what you need to know before (and after) you connect.
 
- 
Overview — Start here. A summary of what the integration does, its top capabilities, and the prerequisites you'll need in place before connecting. When you're ready, select Connect to begin setup.
- 
API permissions — Exactly what access Vanta requests from Microsoft Intune: each permission's scope, whether it's read or write, and what data it covers, etc. Share this tab with your security team if they need to review access before you connect.
- 
Resource types — Every resource type Vanta imports from Intune, down to the specific fields collected for each. Use this to understand exactly what data will show up in Vanta once connected.
- 
Automated tests — How many tests connecting Intune unlocks and which frameworks and controls they map to (SOC 2, ISO 27001, etc.), plus the full list of tests by name. Useful for scoping compliance coverage ahead of an audit.
- 
Security — How Vanta protects the data it collects — encryption, data retention, access controls, and infrastructure. Visit Vanta's Trust Center <https://trust.vanta.com/> for the full picture.
When you’re ready to connect, continue to the setup guide below.
 
 
 
 

## Procedure
- 
In Vanta:
- 
In Vanta, go to the Integrations page, click Add integration, and search for Microsoft Endpoint Manager. For help, see our guide to the Integrations Page <https://help.vanta.com/en/articles/11345761-integrations-page>.
- 
Select Connect.
- 
Click 'Connect Microsoft Endpoint Manager'
Note: Ensure you have verified that you are an admin of the Office organization.
[image 02]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516765006/284788e4e1215c65481f0ea27986/18457673131284?expires=1794967200&signature=d651f75b078d48d105324242b9b2b6fbfde1c60a89f7a005b1bbcf582f1ca165&req=dSUmEM54mIFfX%2FMW1HO4zRxm2RJAF88mTgWU%2BaKpWm2%2FY2xaawDNG81oTGue%0AsR%2FRSj1uFhNwWMUjdr4%3D%0A>
- 
When prompted, log in with your Administrator details. You will be shown the list of permissions required by the integration to Accept.
- 
Once accepted, you will be prompted to configure the time it takes to ensure security settings are set up for new devices. Vanta will not alert on newly registered computers until the time entered has passed. This is set to 3 hours by default. 
​
​Note: If multiple MDM integrations are connected, any change made here to the computer setup time will be applied to all MDM integrations.
[image 03]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516765019/15c3ad23a884aceaaf4d88a14359/18457673132308?expires=1794967200&signature=13fd470ff7be098f0340e51043f55ad97e25ea84acd5bd8ea155091393530ce9&req=dSUmEM54mIFeUPMW1HO4zZJVrydHuGfZzGmgj9dxRWcILAWjtNNNfsUCZH7J%0A8cQUUwftfiom%2Ffh7KNw%3D%0A>
- 
Once Saved, You can manually configure which devices you would like to be marked in/out of scope. For more information on scoping see Frequently Asked Questions: How do I Mark Resources out of Scope?  <https://help.vanta.com/en/articles/11346114>
[image 04]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516765018/29e5c138226701ab23f186cce460/18457650315796?expires=1794967200&signature=ff7bc4bd2d38474ba34e3dcfb2bd0933aa0e297b5fff8d0411f5d8304e6ba93c&req=dSUmEM54mIFeUfMW1HO4zWQikGjXRSIYluuxwZ7ytszuAQ9cCphrCkYiJPTw%0AcA1qVWW35mX2x6pDUOE%3D%0A>

## Permissions
All access is read-only. Vanta cannot modify your Intune configuration, devices, or policies. 
 | 
Permission | 
Description | 
Use cases
 | 
DeviceManagementManagedDevices.Read.All | 
Allows Vanta to read managed devices, detected applications, and device compliance policy states from Intune. | 
This is the main permission. Vanta uses it to pull in device inventory, hardware details, installed applications, and each device's compliance policy states.
 | 
DeviceManagementConfiguration.Read.All | 
Allows Vanta to read the compliance policy definitions configured in Intune. | 
Vanta uses this to read your compliance policies, which is how screenlock, antivirus, and encryption requirements are evaluated.
 | 
User.Read.All | 
Allows Vanta to read the Microsoft Entra ID user associated with each managed device. | 
Vanta uses this to identify the primary user assigned to each device, which is how devices are matched to people in Vanta.
ℹ️ Note: You will also see an entry called "Access Microsoft Graph" (https://graph.microsoft.com/.default) on the integration's API permissions tab. This is the scope Vanta requests during sign-in; Microsoft then grants only the application permissions your administrator has consented to for your tenant, listed above.
⚠️ Note: Vanta verifies these permissions when you connect. If a required permission is missing, the connection fails with an error such as "Vanta can't read all required Intune data for this tenant. Grant the read-only Microsoft Graph application permissions for: [missing data]." Grant the missing permission in Microsoft Entra ID, then reconnect. If a permission is removed after connecting, data syncs will fail with authorization errors until access is restored and the integration is reconnected.
 
 

## What Can't Vanta Monitor?
- 
iOS or Android devices: Today, Vanta does not pull in mobile devices such as iOS or Android. We are also limited by what Intune can support. 
​
​
- 
Non-Corporate devices:  Intune collects the phone numbers, app inventory, and UDIDs of corporate-owned devices. Devices that aren't corporate-owned won't report UDID or installed apps, so Vanta won't be able to define a solid identity or run installed software checks on these devices.

## Things to Keep in Mind:
- 
Weekly app scans: Because Intune only scans and reports hardware and software inventory once every 7 days, these app updates will also report updates at this cadence in Vanta.
​
​
- 
Proper licensing: Users can enroll their corporate devices only if they have an Intune license.
​
​
- 
Compliance vs Configuration Policies: When using Microsoft Endpoint Manager, Vanta will only read in compliance policies and will not read in configuration profiles. See our set up guide for instructions on how to configure compliance policies for Vanta: Microsoft Endpoint Manager - Configuration for Vanta <https://help.vanta.com/en/articles/11345788>
​
- 
Password manager and AV detection. Unlike other MDM providers for MacOS, Microsoft does not provide us with bundle identifiers for MacOS apps. As a fallback, we determine if an app is a password manager or an AV by its app name, which can be less precise.
- 
For antivirus, Vanta also checks to see if a device has a compliance policy enforced that requires antivirus.
​
​
- 
No browser extensions. Like our other MDM integrations, we don't have easy access to see what extensions are installed in an employee's browser(s). One way this could be done in the future is w/ device policies — but that would check for enforcement rather than detecting an actual installation.

## Images

- [image 01] ../../images/integrations/microsoft/connecting-vanta-microsoft-endpoint-manager-intune-mdm--01.png
- [image 02] ../../images/ux/integrations/connecting-vanta-microsoft-endpoint-manager-intune-mdm--02.png
- [image 03] ../../images/ux/integrations/connecting-vanta-microsoft-endpoint-manager-intune-mdm--03.png
- [image 04] ../../images/ux/integrations/connecting-vanta-microsoft-endpoint-manager-intune-mdm--04.png
