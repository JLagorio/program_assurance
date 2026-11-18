# Connecting Vanta & Iru

Source: https://help.vanta.com/en/articles/11345787-connecting-vanta-iru
Collection: Integrations ; Integrations › Integrations by Type ; Integrations › Integrations by Type › Access and Additional Integrations
Fetched: 2026-11-17

## Article text

## Overview
The Iru integration connects your Iru (formerly Kandji) tenant to Vanta with a read-only API token. We import your managed macOS and Windows computers, including computer configuration, installed apps, and Library Item status, so you can show which computers meet your endpoint security requirements. The integration supports Vanta's Automated Compliance and Personnel and Access products. It is best suited for teams that manage their company computers with Iru.
ℹ️ Note: This article describes the setup for new Iru connections. If you connected Iru earlier and your setup looks different, see Existing connections.
 
 
 

##  Use cases and capabilities
- 
Computer compliance monitoring: We track FileVault encryption, MDM enrollment, and Iru Agent status for your imported computers.
- 
Audit evidence: Show SOC 2 and ISO 27001 auditors which computers are encrypted and enrolled in MDM.
- 
Device owner matching: We read the user Iru assigns to each device (name and email) to match computers to people in Vanta.
- 
Installed app checks: We read installed apps on each device to check for antivirus software and a password manager, and to track AI apps.
- 
Blueprint exclusions: Exclude devices in selected Blueprints, such as test or lab fleets, from monitoring.
⚠️ Note: Blueprint exclusions require the List Blueprints permission on your API token. Without it, we sync every device. See Step 3.

### Capabilities overview
 | 
Resource / Capability | 
Supported | 
How it is used in Vanta
 | 
Computers (macOS and Windows) | 
Yes | 
Device inventory, enrollment status, and configuration for computer compliance checks
 | 
FileVault encryption, MDM enrollment, and Iru Agent status | 
Yes | 
Evidence that computers are encrypted and enrolled in MDM
 | 
Device owner (assigned user) | 
Yes | 
Matching computers to people in Vanta
 | 
Installed apps | 
Yes | 
Checking for antivirus software and a password manager, and tracking AI apps
 | 
Library Items | 
Yes | 
Reading Library Item status for each device
 | 
Blueprint exclusions | 
Optional (requires List Blueprints) | 
Keeping devices in selected Blueprints out of your Computers list
 | 
Write access to Iru | 
No | 
Not supported. We do not modify any data in your Iru environment.
 
 

## Prerequisites
Before starting setup, confirm the following:
- 
You have a Vanta account with permission to add or manage integrations.
- 
You have an Iru administrator account.
- 
Your Iru plan includes API access.
- 
At least one Mac or Windows device is enrolled in Iru.
💡 Tip: If you want to exclude devices in specific Blueprints, decide which Blueprints before you start. You will need to add the optional List Blueprints permission when you create your API token in Step 1.
 
 

## Setup guide

### Step 1: Create an API token in Iru
- 
Sign in to your Iru admin dashboard.
- 
Go to Access > API tokens and click Add Token.
- 
Give the token a descriptive name, such as "Vanta integration."
- 
Click Configure Permissions and enable read-only access to the following:
- 
Device list (required): We list the devices enrolled in your Iru tenant to import them as computers and match them to people.
- 
Device details (required): We read each device's configuration details to check disk encryption, MDM enrollment, and Iru Agent status.
- 
Application list (required): We read installed apps to check for antivirus software and a password manager, and to track AI apps.
- 
Device Library Items (required): We read device Library Items and their status to confirm the security settings you deploy through Iru stay enforced.
- 
List Blueprints (optional): We list your Blueprints so you can choose which devices to sync. See Step 3.
- 
Save the token and securely copy the token value. You will paste it into Vanta in the next step.
ℹ️ Note: You do not need to grant write permissions. We use read-only access. For more on Iru API tokens, see Iru's API documentation <https://api-docs.iru.com/> and guide to integrating third-party apps <https://docs.iru.com/en/endpoint/integrations/overview/integrating-third-party-apps-using-the-iru-endpoint-api#available-third-party-app-integrations>.
 

### Step 2: Provide API token in Vanta
- 
In Vanta, go to the Integrations page, click Add integration, and search for Iru. For help, see our guide to the Integrations Page <https://help.vanta.com/en/articles/11345761-integrations-page>.
- 
Click Connect.
- 
In Iru API URL, copy the URL from Access > API tokens in Iru, then add https:// in front of it. For example: https://your-company.api.kandji.io.
- 
Paste the API token you copied from Iru into API Token.
- 
Click Connect. We check that the token has the required permissions and that at least one Mac or Windows device is enrolled in Iru.
[image 01]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2774737308/061660990349590e45f60ae018eb/image.png?expires=1794967200&signature=e667f27bd39abe7e79915f9586995cead9cab21697a8c798128aa67ff60f2f57&req=dicgEs59moJfUfMW1HO4zViTo7HNlRw9dcAMO6tlew%2FTeIsV7hEm7dLP%2B2q3%0AiGDidMT6X4i%2F9nLMt2k%3D%0A>
 
💡 Tip: Iru API URLs still use the kandji.io domain. We currently accept only kandji.io API URLs.
 

### Step 3: Set sync filters (optional)
- 
By default, we sync every device we find. To keep devices in specific Blueprints out of Vanta, select Exclude devices in selected Blueprints.
- 
In Blueprints to exclude, choose one or more Blueprints. Once the checkbox is selected, you must choose at least one Blueprint.
- 
Click Save. 
[image 02]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2774739203/ea3690137b72b86194fa47aa198b/image.png?expires=1794967200&signature=b08539ba7d8b1af69ab4e2e9a884e942bac51daad6c1841a5b68170754faca19&req=dicgEs59lINfWvMW1HO4zbQQ5W0DuIpp%2FuVP6UFXZ79qu%2BvdcusN05%2BSzqsL%0A8QaCicTpnesy4OJ8l7M%3D%0A>
 
We remove devices in the selected Blueprints from your Computers list on the next sync without changing anything in Iru. Exclusions are saved by Blueprint ID, so renaming a Blueprint in Iru does not change them. For more on scoping devices with Blueprints, see Scoping MDM-managed computers via Iru Blueprints <https://help.vanta.com/en/articles/11345782-scoping-mdm-managed-computers-via-iru-kandji-blueprints>.
⚠️ Note: This option requires the List Blueprints permission on your API token. Without it, we show a message instead of the Blueprint picker and sync every device. To use this option, include List Blueprints when you create your token in Step 1. If you remove the permission later, your saved exclusions keep applying, but you cannot view, change, or turn them off until you add the permission back.
 

### Step 4: Confirm the connection
- 
When you finish setup, we show a You're connected screen and start syncing your resources right away.
- 
The Iru integration appears as Connected in your Vanta integrations list.
- 
After the initial sync, we sync about once an hour by default.
- 
Check that your computers appear in Vanta's device list, and that device counts and key details (owner, OS, last check-in, serial number) match the Iru admin console.
 
 
 

## Permissions

### Read access
We use the API token you create to read the following from Iru:
- 
Device names, models, serial numbers, operating system versions, and last check-in times
- 
Device enrollment and management status
- 
Device configuration and posture, such as FileVault encryption, MDM enrollment, Iru Agent status, and Activation Lock status
- 
Network identifiers, such as IP and MAC addresses
- 
Local user accounts on each device
- 
Lost Mode status, including who turned it on or off and when. We do not read device location or lock-screen personal data.
- 
Installed apps
- 
Device Library Items and their status
- 
The assigned user's name and email on each device
- 
Blueprint names and IDs (only if you grant the optional List Blueprints permission)

### Write access
We do not have write access to your Iru account. We do not modify or delete any devices, Blueprints, or other data in your Iru environment.
 
 

## Troubleshooting and FAQs

### The connection fails with a missing permission error
- 
Likely cause: The API token is missing one of the required permissions.
- 
How to confirm: The error reads "The Iru API token is missing the [permission] permission."
- 
Fix: In Iru, go to Access > API tokens, open the token, click Edit, and enable the permission named in the message. Then connect again in Vanta.

### The connection fails with an invalid API URL error
- 
Likely cause: The URL is missing https://, or it is not an Iru API URL on the kandji.io domain.
- 
How to confirm: The error reads "This isn't a valid Iru API URL."
- 
Fix: Copy the URL from Access > API tokens in Iru, add https:// in front of it, and try again. For example: https://your-company.api.kandji.io. We currently accept only kandji.io API URLs.

### The connection fails because no Mac or Windows devices were found
- 
Likely cause: No Mac or Windows device is enrolled in your Iru tenant.
- 
How to confirm: The error reads "Vanta didn't find any Mac or Windows devices in Iru."
- 
Fix: Enroll at least one Mac or Windows device in Iru, then connect again.

### The connection fails because Iru does not accept the API token
- 
Likely cause: The token is invalid, expired, or revoked.
- 
How to confirm: The error reads "Iru did not accept this API token."
- 
Fix: In Iru, go to Access > API tokens and add a new token with the permissions listed in Step 1. Then connect again in Vanta.

### The connection fails because the Iru tenant was not found
- 
Likely cause: The API URL does not match your Iru tenant.
- 
How to confirm: The error reads "Vanta could not find an Iru tenant at this API URL."
- 
Fix: Verify the API URL in Iru under Access > API tokens, add https:// in front of it, and try again.

### The connection fails because Iru is rate limiting or temporarily unavailable
- 
Likely cause: Iru's API is limiting requests or is temporarily down.
- 
How to confirm: The error reads "Vanta reached Iru's API rate limit" or "Iru is temporarily unavailable."
- 
Fix: Wait a few minutes and try connecting again.

### The connection fails with a general Iru error
- 
Likely cause: The API URL or token is incorrect.
- 
How to confirm: The error reads "Iru rejected this request" or "Vanta could not validate the Iru API at this URL."
- 
Fix: Check the API URL and token in Iru under Access > API tokens, then try again. If the issue persists, contact Vanta Support.

### Fewer devices appear in Vanta than in Iru
- 
Likely cause: Devices in an excluded Blueprint do not appear in Computers, other device types are not monitored as computers, or the token's account cannot see every device.
- 
How to confirm: Check whether you selected Blueprints under Set sync filters. Check the platform of the missing devices in Iru, since Vanta monitors macOS and Windows computers. Confirm the Iru account that created the token can see all of your devices.
- 
Fix: Update your Blueprint exclusions if needed, and confirm the token includes all of the permissions listed in Step 1. If the issue persists, contact Vanta Support and include a screenshot of the error, the Iru API URL you entered in Vanta, and confirmation of the token's assigned permissions.

### A device appears in Vanta without details
- 
Likely cause: The API token is missing the Device details permission.
- 
How to confirm: The device is imported, but its configuration details are missing, and Vanta shows an issue for that device: "The Iru API token doesn't have the "Device details" permission, so Vanta imported this device without details."
- 
Fix: In Iru, go to Access > API tokens, open the token, click Edit, and enable Device details. We import the details on the next sync.
A device can also appear without details when Iru rate limits requests or is briefly unavailable. We try again on the next sync, so no action is needed.
 

### The Blueprint picker does not appear
- 
Likely cause: The API token does not have the List Blueprints permission.
- 
How to confirm: The Set sync filters step shows a message about adding the permission instead of the Blueprint picker. If you already had exclusions, the message says you have existing Blueprints excluded.
- 
Fix: Create the API token with the List Blueprints permission, as described in Step 1, before you connect. If you already connected without it, contact Vanta Support. Your saved exclusions keep applying in the meantime.
 

### What happens to devices in an excluded Blueprint?
We remove them from your Computers list on the next sync. Nothing changes in Iru.
 
 

## Existing connections
If you connected Iru before the updated setup was available, your connection continues to work as before. You do not need to take any action or reconnect. Use the steps and information below for your connection.
 

### Prerequisites 
To connect the Iru integration, you must have:
- 
An Administrator account in your Iru admin dashboard
- 
A Vanta account with permission to add or manage integrations
- 
An Iru API token with read-only access to device and user data

### Step 1: Create an API token in Iru
- 
Sign in to your Iru admin dashboard.
- 
Navigate to Account > Access > API Tokens (menu names may vary depending on your UI version).
- 
Click Add Token (or similar).
- 
Assign the token a descriptive name, for example: Vanta Integration, <date>.
- 
Save the token and securely copy the token value. You will paste this into Vanta.
- 
Click Configure Permissions.
- 
Grant read-only permissions (GET endpoints) that allow access to:
- 
Devices (device inventory)
- 
Users (device owner / assigned user)
- 
Library (if you want application metadata to appear in Vanta)
ℹ️ Note: If Iru lists named API scopes, pick the minimal read-only scopes that cover Devices, Users, and Library. There is no need to grant write permissions for this integration.
 

### Step 2: Add Iru in Vanta
- 
In Vanta, go to the Integrations page, click Add integration, and search for Iru. For help, see our guide to the Integrations Page <https://help.vanta.com/en/articles/11345761-integrations-page>.
- 
Click Connect to open the credentials modal.
- 
Paste the API token generated in Iru into the API Token field.
- 
Enter the API URL displayed in the Access section of your Iru Admin dashboard. For example: https://subdomain.api.kandji.io
- 
Click Save (or Connect) to submit your Iru credentials to Vanta.
💡 Tip: The API URL may continue to use the kandji.io domain. Use the exact API URL displayed in your Iru Admin dashboard.
 

### Step 3: Verify the connection
After connecting, Vanta performs an initial sync. To confirm the integration is working:
- 
Verify that device inventory and attributes appear in Vanta's device list.
- 
Confirm that device counts and key details (owner, OS, last check-in, serial number) match the Iru admin console.
If fewer devices appear in Vanta:
- 
Verify the API token's scopes.
- 
Confirm that the token's account has visibility into all devices.

### Sync behavior and token rotation
Vanta performs an initial import upon connection and continues syncing on an hourly schedule.
 
To rotate your API token:
- 
Generate a new read-only token in Iru.
- 
Update the token value in Vanta's Iru integration settings.
- 
Save and confirm a successful sync.
- 
Revoke the old token only after verifying the new token is functioning properly.

### Permissions
Vanta can access device inventory and metadata (OS, serial number, model, last check-in, tags, and so on), device enrollment and management status, device posture and compliance details reported by Iru, and associated device user and owner information. Vanta does not write to Iru. The integration uses read-only access and does not modify any data in your Iru environment.
 

### Troubleshooting
Invalid API token. If you receive an invalid token error:
- 
Ensure the token was copied correctly.
- 
Confirm that the token has not expired or been revoked.
- 
Verify that the token includes the required read-only scopes.
If needed, generate a new token in Iru and reconnect the integration.
Fewer devices in Vanta than Iru. If fewer devices appear in Vanta than in Iru:
- 
Confirm that the token's associated account has visibility into all devices.
- 
Verify that there are no Iru filters limiting device visibility.
- 
Ensure the token's scopes include access to Devices and Users.
If issues persist, contact Vanta Support and include a screenshot of the error, the Iru admin URL entered in Vanta, and confirmation of the token's assigned permissions.
 

## What scopes or permissions does the API token need?
The API token must allow read-only access to Devices and Users. If you want Vanta to ingest Library metadata, include read access for Library as well. Select the minimal read-only scopes exposed by Iru that cover these resources.

## Images

- [image 01] ../../images/ux/integrations/connecting-vanta-iru--01.png
- [image 02] ../../images/integrations/iru/connecting-vanta-iru--02.png
