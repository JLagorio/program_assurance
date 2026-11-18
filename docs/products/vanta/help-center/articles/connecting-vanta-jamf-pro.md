# Connecting Vanta & Jamf Pro

Source: https://help.vanta.com/en/articles/11345770-connecting-vanta-jamf-pro
Collection: Integrations ; Integrations › Integrations by Type ; Integrations › Integrations by Type › Endpoint and Device Management (MDM)
Fetched: 2026-11-17

## Article text

## Overview 
Vanta’s Jamf Pro integration enables automated evidence collection and continuous monitoring of your managed devices.
 
Vanta synchronizes the following data from Jamf Pro:
- 
Computers: Device details, including hardware information, operating system version, disk encryption status, installed applications, running services, configuration profiles, and local user accounts.
- 
Accounts: Jamf user accounts used for linked account monitoring.
- 
Vendors: Third-party software vendors inferred from installed applications (identified by bundle ID) on your Jamf-managed computers, used for vendor inventory and related workflows in Vanta.
This data syncs approximately every hour and is used within Vanta for: 
- 
Device compliance monitoring
- 
Automated evidence collection
- 
Endpoint inventory tracking
- 
Security posture assessments (such as disk encryption, screen lock configuration, antivirus detection, and password manager detection)
 

## How it works 

## Authentication
Vanta connects to Jamf Pro using OAuth 2.0 through Jamf’s API Roles and Clients framework.
 
During setup: 
- 
You create an API Role with specific read-only permissions
- 
You generate a Client ID and Client Secret
Vanta uses these client credentials to obtain OAuth access tokens whose lifetime you configure in Jamf Pro for the API client. Vanta refreshes tokens automatically as needed. No passwords are stored.
 

## How Vanta Uses This Data
- 
Device compliance monitoring: Evaluates whether computers meet security requirements such as disk encryption (FileVault), screen lock configuration, and antivirus presence.
- 
Automated evidence collection: Generates compliance evidence for frameworks such as SOC 2, ISO 27001, and HIPAA based on collected device data.
- 
Password manager detection: Identifies whether approved password managers are installed on devices.
- 
Linked accounts: Maps Jamf user accounts to Vanta personnel to support access review workflows.
- 
Vendor inventory: Surfaces third-party applications observed via Jamf as vendor records, including which managed computers have them installed.
 

## Use Cases 
Connecting Jamf enables the following capabilities within Vanta:
- 
Demonstrate Endpoint Compliance for Audits (SOC 2, ISO 27001, HIPAA): Automatically provide evidence that managed macOS devices meet security requirements such as disk encryption (FileVault), screenlock enforcement, antivirus protection, and password manager usage — without manual evidence collection.
- 
Continuously Monitor macOS Fleet Security Posture: Maintain ongoing visibility into device compliance status across your organization, including OS version, encryption state, installed applications, and running security services.
- 
Scope audit evidence to relevant devices: Use Jamf Sites or the "VantaNoAlert" computer group to filter which devices Vanta monitors, ensuring compliance reporting includes only machines relevant to a specific audit or business unit.
- 
Reduce IT effort during audit preparation: Eliminate manual exports, screenshots, and spreadsheet compilation by synchronizing device and account data directly from Jamf Pro into Vanta.
- 
Jamf admin account access reviews: Map Jamf Pro admin accounts to your personnel directory to support periodic access reviews of who has administrative access to your MDM.
 

## Prerequisites
To connect the Jamf Pro (OAuth) integration, you must have: 
- 
A Jamf Pro Cloud instance (for example, yourdomain.jamfcloud.com)
- 
Administrator access or sufficient privileges to create API Roles and API Clients in Jamf Pro
Note: Vanta does not currently support on-premise deployments, Jamf Now, or Jamf Business.
 

## Connect the integration
[image 01]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2184267375/f4e7ca44e3677dcee3c2c7356dd3/7fb92e0f-8104-4550-aa23-cd82a4d1b2ce?expires=1794967200&signature=9d4510c7ed9ff57851fc9f8d60424b26c14e04afab65810ce5153b3afe01629b&req=diEvEst4moJYXPMW1HO4zQURHWMGOQSKxTMt8vvARTOucKC33rrDxpNDL%2B%2Be%0Ai8OnVZ3cMj%2F8k9V%2Btf4%3D%0A>
 

## Step 1: Create an API Role in Jamf Pro
Before connecting Vanta, define the specific read-only permissions the integration will use.
- 
Log in to your Jamf Pro dashboard.
- 
Click the Settings (gear icon) in the top right or side navigation.
- 
Go to System → API roles and clients.
- 
Select the API Roles tab and click + New.
- 
Under Display Name, enter vanta_test_role (or a name of your choice).
- 
In the Privileges section, search for and add the following Read permissions:
- 
Read Accounts: Account names, emails, roles, access levels, enabled status	
- 
Read Computers: Computer names, OS versions, disk encryption status, installed applications, running services, user/location data, hardware info	
- 
Read Static Computer Groups:Group names per computer 
- 
Read macOS Configuration Profiles: Profile payloads to verify screenlock enforcement
- 
Click save. 
 
[image 02]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2184268387/180cfc8fe39d4900dc8a3c35a07a/013c70b5-fc90-4b46-b8c1-68fa0b15c23d?expires=1794967200&signature=937a4d7996067cd1afc901bb5e824245f24edc134aef94b5b37797b5b7f64103&req=diEvEst4lYJXXvMW1HO4zYhjNahUhJhMPLJPRJ9NY3ZbQbcoNQIxFnhAnAOh%0A6yHlSrtC6h7bg3%2B%2FU98%3D%0A>
 

## Step 2: Create an API Client and Generate Credentials
Next, generate the client credentials required for the Vanta connection.
- 
Switch to the API Clients tab and click + New
- 
Under Display Name, enter vanta_client_cred
- 
Under API Roles, select the role created in Step 1 (for example, vanta_test_role)
- 
Ensure the client is set to Enabled
- 
Click Save
- 
After saving, click Generate Client Secret
Important: Copy the Client ID and Client Secret immediately. The Client Secret will not be visible again after you close this window.
 
[image 03]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2184272708/8c1936a26e88cccfdc91ecbc3360/b2185211-d614-433b-8dbb-2293a02d1ff6?expires=1794967200&signature=1ff64c96aa9d84d5281bc6ebd44a8d3f3408a91d8c12b0f3305ced357e3bb7fa&req=diEvEst5n4ZfUfMW1HO4zZSDNB3VwBcOhTrouu8EUMtTXmRN9QdUZccJBsb3%0A%2BIEzz%2BjtKCUzRlSm%2Ba8%3D%0A>
[image 04]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2184296968/04d022f13a0ba4b41fc7584c3e47/bc1c7c37-58d2-4b4c-80cd-7776bf4e6adf?expires=1794967200&signature=cd2137692dd592dba3262935346e99e44ffd213f75ef22ef1506378917ac390d&req=diEvEst3m4hZUfMW1HO4zYJL2djcSTINlnL6obMRs%2FC94f3D0Jy2AiZPRAre%0AmVJxbyrimMzM212bTX4%3D%0A>

## Step 3: Connect Jamf Pro to Vanta
- 
In Vanta, go to the Integrations page, click Add integration, and search for Jamf Pro. For help, see our guide to the Integrations Page <https://help.vanta.com/en/articles/11345761-integrations-page>.
- 
Click Connect.
- 
In the connection modal, provide the following:
- 
Jamf Cloud Hostname: Your full Jamf Cloud URL (e.g., company.jamfcloud.com).
- 
Client ID: The ID generated in Step 2
- 
Client Secret: The Secret generated in Step 2
- 
Select Validate and store
If the connection is successful, you will see a confirmation message indicating that the Jamf Pro connection has been created.
 
[image 05]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2184304574/038655ed7d5eca515da414ede80c/ee847b14-d34e-4ca5-93ec-6501bf7a5bf7?expires=1794967200&signature=5614b1d101d08e859fb9e557442884bdf45decdcdc86c7d163c84ddc8a3d297f&req=diEvEsp%2BmYRYXfMW1HO4zV1qrpJf4dZpTlA7Eq%2Blu3paUGydED33uxNXaBP1%0AJz5WFn7O0masm5HKoPM%3D%0A>
 

## Step 4: Configure Resource Scope
After connecting, configure which resources Vanta should monitor. 
- 
Navigate to Connected Integrations 
- 
Locate Jamf Pro and select Configure Scope 
- 
Review the list of Jamf Accounts and Computers
- 
Toggle specific resources In Scope or Out of Scope based on your compliance requirements
Note: Resource scoping changes may take at least one hour to fully update across the platform.
 
[image 06]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2184310587/af52923ad9de88789ef80f2ca573/78c495b2-0671-4db3-8c1d-241ffdcff2c2?expires=1794967200&signature=56f3183a5cca46e4ebd09de12721a8b8a65376eccd84bbac36395d876ecac26a&req=diEvEsp%2FnYRXXvMW1HO4zbEyTfgMI8ZSLl%2F8rxkiuuom52%2BFc%2BkoKID40byY%0ADiDsM8vXGp%2B5YTua6B4%3D%0A>
 

## Permissions

## Vanta requires the following permissions to monitor:
 
 | 
Permission | 
Description | 
Use cases
 | 
Read Accounts | 
Account names, emails, roles, access levels, enabled status | 
With this permission, Vanta can pull in Jamf admin and user accounts for access management and deprovisioning checks.
 | 
Read Computers | 
Computer names, OS versions, disk encryption status, installed applications, running services, user/location data, hardware info | 
With this permission, Vanta can pull in device info such as hardware details, installed applications, antivirus status, password managers, and disk encryption.
 | 
Read Static Computer Groups | 
Group names per computer  | 
With this permission, Vanta can identify device groupings for MDM scoping and exclude specific devices from compliance checks.
 
 | 
Read macOS Configuration Profiles | 
Profile payloads to verify screenlock enforcement (askForPassword, askForPasswordDelay, loginWindowIdleTime) | 
With this permission, Vanta can pull in screenlock settings to verify that devices require a password after the screensaver activates.
 

## Vanta will be able to write: 
- 
Nothing - Vanta has read-only access and cannot modify your Jamf Pro configuration, devices, or policies
 

## Monitored resources
The Jamf Pro integration monitors macOS computers only. Although Jamf Pro also manages iOS and iPadOS devices, Vanta does not currently sync mobile device data from this integration. Windows, Linux, and Android are not supported by Jamf Pro.
 
For each managed Mac, Vanta collects: hardware details, OS version, serial number, UDID, asset tag, last contact date, enrollment date, and site assignment. It reads macOS configuration profiles to verify screenlock enforcement. It checks installed applications and running services to detect recognized antivirus products and approved password managers. 
 
 | 
Resource type | 
Windows | 
macOS | 
Linux | 
iOS | 
Android
 | 
Device Monitoring | 
Not supported by Jamf | 
✅ | 
Not supported by Jamf | 
❌ | 
Not supported by Jamf
 | 
Screenlock
Settings | 
Not supported by Jamf | 
✅ | 
Not supported by Jamf | 
❌ | 
Not supported by Jamf
 | 
Antivirus detection | 
Not supported by Jamf | 
✅ | 
Not supported by Jamf | 
❌ | 
Not supported by Jamf
 | 
Password Manager | 
Not supported by Jamf | 
✅ | 
Not supported by Jamf | 
❌ | 
Not supported by Jamf
 | 
Vendor inventory | 
Not supported by Jamf | 
✅ | 
Not supported by Jamf | 
❌ | 
Not supported by Jamf
 

## Additional Guidance
If you have computers that are not managed by Jamf Pro, install the Vanta Device Agent on those machines to ensure full compliance coverage.

## Images

- [image 01] ../../images/integrations/jamf-pro/connecting-vanta-jamf-pro--01.png
- [image 02] ../../images/integrations/jamf-pro/connecting-vanta-jamf-pro--02.png
- [image 03] ../../images/integrations/jamf-pro/connecting-vanta-jamf-pro--03.png
- [image 04] ../../images/integrations/jamf-pro/connecting-vanta-jamf-pro--04.png
- [image 05] ../../images/ux/integrations/connecting-vanta-jamf-pro--05.png
- [image 06] ../../images/ux/integrations/connecting-vanta-jamf-pro--06.png
