# Connecting Vanta & Addigy

Source: https://help.vanta.com/en/articles/11345686-connecting-vanta-addigy
Collection: Integrations ; Integrations › Integrations by Type ; Integrations › Integrations by Type › Endpoint and Device Management (MDM)
Fetched: 2026-11-17

## Article text

## Overview 
Vanta integrates with Addigy to automatically collect device evidence from your managed macOS fleet. By connecting Addigy as a Mobile Device Management (MDM) tool, Vanta continuously monitors computers for compliance with security controls such as disk encryption, antivirus installation, and password manager usage.
 
Addigy-managed devices are synchronized into Vanta to support audit readiness for frameworks such as SOC 2, ISO 27001, and HIPAA.
 

## Data synced from Addigy
For supported macOS devices, Vanta synchronizes the following information:
- 
Managed computer inventory (device name, model, serial number, OS version)
- 
Disk encryption status (FileVault)
- 
Installed applications (including antivirus and password manager detection)
- 
Local user accounts and admin users
- 
Device enrollment and last contact dates

## Authentication
Vanta authenticates to Addigy using a V2 API Token generated in your Addigy Dashboard.
 
The token is organization-scoped and grants API access based on the permissions assigned at creation. For this integration, the token requires only the View Devices permission.
 
Vanta uses this token to securely retrieve device data from Addigy. The integration is read-only — Vanta does not create, modify, or delete any data in your Addigy account.
 
The API token can be rotated or revoked at any time from your Addigy Dashboard.
Estimated setup time: 5–10 minutes.
 

## Use cases 
Connecting Addigy enables the following capabilities within Vanta:
- 
Demonstrate Endpoint Compliance for Audits (SOC 2, ISO 27001, HIPAA): Automatically provide evidence that managed macOS devices meet security requirements such as disk encryption, antivirus protection, and password manager usage — without manual evidence collection.
- 
Continuously Monitor macOS Fleet Security Posture: Maintain ongoing visibility into device compliance status across your organization, rather than relying on point-in-time reviews.
- 
Scope audit evidence to relevant devices: Use Addigy Policies to filter which devices Vanta monitors, ensuring compliance reporting includes only machines relevant to a specific audit or business unit.
- 
Reduce IT effort during audit preparation: Eliminate manual exports, screenshots, and spreadsheet compilation by synchronizing device data directly from Addigy into Vanta.
- 
Support structured device onboarding: Configure a grace period for newly enrolled devices so provisioning activities do not create false compliance failures. Devices are automatically monitored once the grace period ends.

## Requirements and readiness checklist  
Before connecting Addigy to Vanta, ensure the following: 
- 
You have access to an active Addigy Dashboard. 
- 
Your Addigy user role includes the following permissions: 
- 
View Integrations API
- 
Create Integrations API keys
You can verify these permissions on the Users <https://app.addigy.com/users> page in your Addigy Dashboard. 
 
[image 01]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2127157659/c57afec3d5e64354fc9def5af90a/58477024-d7eb-40ca-b150-c8a9e717ad7a?expires=1794967200&signature=161f272ec7213fd707b5429a68ced7102cd30094f1caf59b8045c9f4c48ccb43&req=diElEch7modaUPMW1HO4zdBRdzITwVngNcxtO%2BObLG47uAdD6%2FK0r88khOPy%0AoSrefSXEwEZglyBJ7qg%3D%0A>
 

## Connect the integration 
Follow the steps below to connect Addigy to Vanta using a V2 API Token. 

## 

## Step 1: Generate a V2 API token in Addigy
Before connecting in Vanta, create a V2 API Token in your Addigy Dashboard.
- 
Log in to your Addigy Dashboard.
- 
Navigate to Account → Integrations → Addigy API → V2.
- 
Click New API Token. 
 
[image 02]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2127167883/c88e38afe3f7bbd2bd23da542d84/6bc2e374-164b-401f-8d7c-3c8304499aca?expires=1794967200&signature=2d6932659b21da0272ee1375430921a0949f7efecfb48cafb928ca91167f6c17&req=diElEch4molXWvMW1HO4zWgUxC5qPR%2FjbA1T2vdFfzabi42H1b62%2BYbAIuql%0AdCyjmh0Y1ubxM2nkCrs%3D%0A>
 
- 
Ensure the token includes the following permission: 
- 
View Devices
 
[image 03]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2127167887/1a287d21b24bc6bcdea6f3fbb373/619dd170-b78f-46d1-a461-53ce0335b545?expires=1794967200&signature=e6d7b0289c798a9bf5199d33400504c16a4a1ddfbcefd40b95fef0f6076c3597&req=diElEch4molXXvMW1HO4zTwsYqEZ%2FXxtG7WgrIy3SYrfEQwY%2B4UAS9VsB3kW%0ADSBAWAtfNwPmuGO8fB0%3D%0A>
 
- 
Copy the generated token to your clipboard. You will paste this into Vanta during the connection process. 
 
[image 04]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2127167888/e2b42c882cd2fc037487d8740946/1f13d6f5-3428-4ab8-b461-542da29aa424?expires=1794967200&signature=179c55d90222da0974ba49d4387ab9f00f2c7d2b72e7544b14c43bdddecd1912&req=diElEch4molXUfMW1HO4zQaBH70L3h0gWr%2Bcsf1o4xxMwndWqVh1cB7tak%2Br%0Al40JHsv%2F2t1dzCrxeJY%3D%0A>
 
Note: The V2 API token provides read-only access. Vanta does not modify any data in your Addigy account. 

## Step 2:  Link Credentials in Vanta
Once your V2 API Token is created:
- 
Open Vanta in a separate window.
- 
Navigate to Integrations.
- 
Select the Connected tab and search for Addigy.
- 
If you see an alert stating “Deprecated API credentials detected,” click Reconnect.
- 
In the Connect Addigy modal, paste your V2 API Token into the designated field.
- 
Click connect. 
Vanta will validate the key and display a success message: "Addigy connected!"
 
[image 05]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2127172275/bfd3d8ea3f15ad7f940ff9aace72/fa760bf6-19e7-423c-801b-c3c41e047bce?expires=1794967200&signature=0626cc331929bbf5a699482330bb87762ec225ae4f008e74acffc2624954b073&req=diElEch5n4NYXPMW1HO4zU1Pcy5ZMlFfDE5jsKgrJtVWRpuauoZF2sHgkBwn%0A0Bpd3pYaj1kHJKxKN7s%3D%0A>
 

## Step 3: Configure device scope
After a successful connection, you will be prompted to define which devices Vanta should monitor.
- 
The Select Addigy Policies modal will appear automatically.
- 
Choose your preferred filter type: 
- 
All – Vanta retrieves all devices from your Addigy account.
- 
Policies (Specific) – Manually select specific folders or locations (e.g., Vanta Integration, Location 1, XProtect).
- 
Click save.
[image 06]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2127176192/4a7966f469b302d28f141833f0c0/5f70bfdd-3f91-4a45-8dca-344e3f2ba143?expires=1794967200&signature=dcecebf6200d15571ce0fba6b755141716e8ea65dd35409560bfdfac4187a707&req=diElEch5m4BWW%2FMW1HO4zdr6qJWDnvHcQt2nwQmCMdK7pYM%2Fyd9NNakTzC5e%0A6WJrKDRKCpghs6kiRks%3D%0A>
 
You will see a confirmation message: “Successfully set Addigy Device filter.” 
 
[image 07]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2127176201/350e1fc64e6eead06ac6278416de/b8ceafbe-2c71-4f44-9afc-df6538c27f83?expires=1794967200&signature=4fb82eb0848e6fde8f93ed3c210cd4174f67282f847304b6036c33e00c5d9af5&req=diElEch5m4NfWPMW1HO4zcMPaH%2B846Aw2BUDjPgtmj%2BLKQrWjTbOL6rUXdiw%0Ax%2F2QCU4S0tK7TLvI9Lc%3D%0A>
 
You can update this selection later by navigating to Integrations → Addigy → Manage → Edit Policies.
 
[image 08]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2127176204/2ab8face446ada7da0f2715629a5/155ac093-293c-45fa-a27a-50f9f5d5d532?expires=1794967200&signature=b4264136a0e61ec0250496911fdf4377cd20c1b116b807b0c113401b1d5976b4&req=diElEch5m4NfXfMW1HO4zbRiPp1dZaNLILBjenzSVy5rY%2F0mrBAhuyRVNrja%0AWv%2FobWIDoKsKRorfxoA%3D%0A>
 

## Step 4: Verify the Connection
To confirm the integration is healthy:
- 
Navigate to Integrations → Connected.
- 
Locate Addigy.
- 
Confirm that:
- 
The status displays Connected (green).
- 
The badges for Credentials valid, Computers, and Inventory are active.
Once connected, Vanta will begin periodically syncing device data from Addigy.
 
[image 09]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2127178701/4a198b2c644f16c0d3b90f5a9a7b/e9eb597e-00d3-4eba-be5b-334a83afc9ff?expires=1794967200&signature=d74d4f953b21401a33838e7b472b70a2ddeb304f715db75a684346f9ccb8892e&req=diElEch5lYZfWPMW1HO4zbPThaziJBHqaPRXxCWJ47cETO4pHAlQ9pKLmU9d%0APWfwm6P4bTwCAnapJr0%3D%0A>
 

## Monitored Resources
 | 
Resource type | 
Windows | 
macOS | 
Linux | 
iOS | 
Android
 | 
Device Monitoring | 
❌ | 
✅ | 
❌ | 
❌ | 
❌
 | 
Screenlock
Settings | 
❌ | 
✅ | 
❌ | 
❌ | 
❌
 | 
Antivirus detection | 
❌ | 
✅ | 
❌ | 
❌ | 
❌
 | 
Password Manager | 
❌ | 
✅ | 
❌ | 
❌ | 
❌
✅ Supported
❌ Not Supported
 

## FAQs 

## What permissions does the Addigy API token need?
The V2 API Token requires only the View Devices permission. Vanta uses read-only access and does not modify any data in your Addigy account.
 

## What happened to the V1 API credentials?
Addigy is deprecating the V1 API. If you see a “Deprecated API credentials detected” alert in Vanta, generate a new V2 API Token in your Addigy Dashboard and reconnect the integration following the steps above. 
 

## Can I choose which devices Vanta monitors?
Yes. During setup — or at any time afterward via Manage → Edit Policies — you can select:
- 
All devices, or
- 
Specific Addigy Policies to scope which computers Vanta pulls into inventory. 

## My newly enrolled devices are failing compliance tests. What should I do?
You can configure a Computer Setup grace period to temporarily exclude newly enrolled devices from compliance checks while they are being provisioned.
To adjust the grace period:
- 
Navigate to Integrations.
- 
Locate Addigy.
- 
Select Manage → Edit.
- 
Update the grace period setting.

## What operating systems does this integration support?
Addigy is an Apple device management platform. This integration monitors macOS workstations.
 

## How often does Vanta sync data from Addigy?
Vanta periodically fetches device data from Addigy. The exact sync frequency depends on your Vanta plan, but data is typically refreshed at least once every 24 hours.
 

## What should I do if the integration shows a connection error?
- 
Verify that your V2 API Token is still valid.
- 
Confirm that the token includes the View Devices permission.
- 
If the token was revoked or rotated, generate a new one and reconnect in Vanta.
If the issue persists, contact Vanta Support.
 

## Can I mark specific devices as out of scope?
Yes. On the Vanta Computers page, you can mark individual machines as out of scope so they are excluded from compliance checks and audit evidence.

## Images

- [image 01] ../../images/integrations/addigy/connecting-vanta-addigy--01.png
- [image 02] ../../images/integrations/addigy/connecting-vanta-addigy--02.png
- [image 03] ../../images/integrations/addigy/connecting-vanta-addigy--03.png
- [image 04] ../../images/integrations/addigy/connecting-vanta-addigy--04.png
- [image 05] ../../images/ux/integrations/connecting-vanta-addigy--05.png
- [image 06] ../../images/ux/integrations/connecting-vanta-addigy--06.png
- [image 07] ../../images/integrations/addigy/connecting-vanta-addigy--07.png
- [image 08] ../../images/ux/integrations/connecting-vanta-addigy--08.png
- [image 09] ../../images/ux/integrations/connecting-vanta-addigy--09.png
