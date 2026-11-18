# Connecting Vanta & Splunk Enterprise

Source: https://help.vanta.com/en/articles/15434429-connecting-vanta-splunk-enterprise
Collection: Integrations ; Integrations › Integrations by Type ; Integrations › Integrations by Type › Access and Additional Integrations
Fetched: 2026-11-17

## Article text

## Overview 
The Splunk Enterprise integration connects your self-hosted Splunk instance to Vanta over its REST API, syncing user account data for access governance and compliance tracking. It is best suited for security and IT teams that run Splunk on-premises and need to ensure every Splunk account is tracked, attributed to a known employee, and included in access reviews.
 
Estimated setup time: Under 10 minutes
 
 

## Use cases and capabilities
This integration pulls user accounts from your on-premises Splunk Enterprise instance into Vanta so they can be reviewed, linked to personnel records, and tracked through automated compliance tests. It gives your team visibility into who has access to Splunk without manual exports or spreadsheet reviews.
ℹ️ Note: We only sync user accounts. We do not access Splunk events, searches, indexes, dashboards, or any operational data.

### Capabilities overview
 | 
Resource / Capability | 
Supported | 
How it is used in Vanta
 | 
User accounts | 
Yes | 
Imported into Vanta for access reviews and personnel tracking
 | 
Roles / Entitlements | 
Yes | 
Displayed on account records in Access Reviews for least-privilege validation
 | 
Last login time | 
Yes | 
Surfaced in Access Reviews to identify inactive accounts
 | 
Account display name and email | 
Yes | 
Used to identify accounts and auto-match to Vanta personnel records
 | 
Groups | 
No | 
Not available from this integration — group data is not fetched from Splunk Enterprise
 | 
MFA status | 
No | 
Not available from the Splunk Enterprise API
 | 
Deprovisioning through Vanta | 
No | 
Write-back is not supported for this integration
 
 

## Prerequisites
Before starting setup, confirm the following:
- 
You have a Vanta admin account.
- 
You have an active Splunk Enterprise license and administrator access to your self-hosted Splunk Enterprise instance.
- 
The Splunk REST API (port 8089 by default) is network-accessible from Vanta's outbound IP. Add Vanta's outbound IP — found on your Integrations page or in Vanta's IP Address — to your firewall's allowlist for the management port before connecting.
- 
Remote login is enabled on your Splunk instance (allowRemoteLogin = always in server.conf). 
- 
Token authentication is enabled in Splunk Web. This requires TLS/SSL and KV Store to be active on your instance.
- 
The Splunk user account tied to the token has both list_all_objects and edit_user capabilities. The built-in admin role typically includes both.
💡 Tip: We recommend creating a dedicated service account for the Vanta integration rather than using an individual's account. Authentication tokens inherit the permissions of the user they are assigned to — if that user's access changes or they leave the organization, the integration will break.
ℹ️ Note: This integration supports multiple installations. If your organization runs more than one Splunk Enterprise instance, each can be connected to Vanta separately.
 
 

## Setup guide
💡 Tip: Setup alternates between your Splunk instance and Vanta. Steps 1, 3–6 are completed in Splunk; Steps 2, 7–8 are completed in Vanta.

### Step 1: Enable remote login and confirm API access
- 
Log in to your Splunk server as an administrator.
- 
Open $SPLUNK_HOME/etc/system/local/server.conf and add or update the [general] stanza:
[general]
allowRemoteLogin = always
- 
Save the file and restart Splunk.
- 
Confirm that port 8089 is reachable from Vanta's outbound IP. If you have a firewall or network perimeter, add Vanta's IP — found on your Integrations page — to the allowlist for this port before proceeding.
- 
Note your full base URL — you will enter it in Step 2. It should include the scheme, hostname, and port. Example: https://splunk.yourcompany.com:8089.
[image 01]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2468706148/4ce5953ba9e21c0621aac9d32f3a/fa5cb5e7-5bce-4a97-b815-74976af8f339?expires=1794967200&signature=76baccfaad5d6c3977a26475db8de956609aef0be6c67c5ab1824537c71431b5&req=diQhHs5%2Bm4BbUfMW1HO4zRaG6E5PRUmvbnrlv2HRxHaeLyaPdqcAQ5HUO8jS%0AYNgmadFMQuMI9wuUsFo%3D%0A>
 
 

### Step 2: Enter the base URL in Vanta 
- 
In Vanta, go to Integrations. 
- 
Click Add Integrations and search for Splunk Enterprise (On-Prem). 
[image 02]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2493790531/0f046c3ac31d5995224d54795f5b/image.png?expires=1794967200&signature=95fec20a89b3ccbeae40b90d6f25a8431700f78c281478164110b2ae1373ad17&req=diQuFc53nYRcWPMW1HO4zd%2BJV5uwp2MO7lgMACNvjZn9MXUCv%2FLY6X6vG02R%0AlIUxFwKwyZ2LxhjWihQ%3D%0A>
 
- 
Click the integration tile and then click Connect. 
[image 03]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2493791407/562380b2edf8f98aff15812e8b45/image.png?expires=1794967200&signature=ae03867f4450c23374d725c7b2fc6717970e64fef0d23208a8472c90256383dc&req=diQuFc53nIVfXvMW1HO4zXkuu9VeRS%2B5RqBzZD6%2F6%2ByNT%2Bcu5WgbpoGpT0fW%0AyAf0eQmi4D%2Ff%2B%2By9hXo%3D%0A>
 
- 
On the connection page, enter your full base URL in the Splunk REST API Base URL field.
[image 04]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2493791727/7a545fbbe5b01a0ae18702b2d021/image.png?expires=1794967200&signature=1d1f49e9f58609a0df3f788ac69e39beb7013d1017913e6d15f0c51a34be37be&req=diQuFc53nIZdXvMW1HO4zSO%2Bv370OIpbkMAOvpblmWJIM39kZ04ZLJfljDwT%0AV4Bh0gxJthYfvcplaKo%3D%0A>
 
 

### Step 3: Enable token authentication in Splunk
- 
Log in to Splunk Web as an administrator.
- 
Go to Settings > Tokens.
- 
If token authentication is not already enabled, click Enable Token Authentication to proceed.
[image 05]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2468707294/fb35d6f0e1df873848e2ce8295d8/68577cb1-c987-4309-9f2f-d341812707bf?expires=1794967200&signature=c81673145cad429c70abd5b3b6168a09894017304613df54a2e352317f3961f5&req=diQhHs5%2BmoNWXfMW1HO4zY4MHWGr3%2BxRtLSZx1zePhZrSdRtJq4jloJzb%2Fxp%0AjWoepodkCLMPOF8sQNc%3D%0A>
⚠️ Note: Token authentication requires TLS/SSL and KV Store to be enabled on your Splunk instance. If either is not active, resolve that before continuing.
ℹ️ Note: Self-signed TLS certificates are acceptable You do not need a certificate signed by a public Certificate Authority (CA).
 

### Step 4: (Optional) Set tokens to never expire 
Tokens can be created with an expiration date. If a token expires, the integration will stop syncing and you will need to create a new token and update your credentials in Vanta. To avoid this disruption:
- 
On the Tokens page, click Token Settings.
- 
Set the default expiration to never and click Save.
[image 06]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2468708769/0b08fbebb049f5f04f3d31e725e5/4283dca9-3eaf-4dac-a316-f2dda228a811?expires=1794967200&signature=2e7fa033c741da13b58e82c0f1e60d8790474654c74eda331102cf25a975da28&req=diQhHs5%2BlYZZUPMW1HO4zYalr9xb53mc1VfnGKzeJEH3%2FNUT33i2PvN7Ash9%0Ayt4lg%2BsLOvV7K45NuVU%3D%0A>
 

### Step 5: Confirm the token user has the required capabilities
Tokens inherit the capabilities of the Splunk user they are assigned to. Before creating a token, verify the user has both required capabilities:
- 
Go to Settings > Roles in Splunk Web.
- 
Find the role assigned to your service account and confirm it includes list_all_objects and edit_user under the Capabilities tab.
- 
If either capability is missing, click Edit on the role (or click New Role to create a dedicated one) and add both capabilities under the Capabilities section.
ℹ️ Note: edit_user is required by Splunk even for read-only access to user detail fields such as email, display name, roles, and last login time. We do not use it to make any changes to user data.
 

### Step 6: Create an authentication token
- 
On the Tokens page, click New Token.
- 
In the User field, enter the username of the service account from Step 5.
- 
In the Audience field, enter any descriptive value (for example, vanta-integration). This is for your reference only and does not affect token permissions.
- 
Click Create.
- 
Copy the generated token value from the Token field.
⚠️ Note: Splunk displays the token value only once. Copy it before closing the dialog; you cannot retrieve it again afterward.
 

## Step 7: Enter the authentication token in Vanta
- 
Return to the Vanta connection page for Splunk Enterprise.
- 
Paste the token from Step 6 into the Authentication Token field.
- 
Click Validate and store credentials.
 

## Step 8: Review imported accounts
- 
In Vanta, go to Personnel, select the Access page, and filter by Splunk Enterprise to review imported accounts.
- 
We automatically suggest matches between Splunk accounts and Vanta personnel records based on email address, display name, and username. You may need to confirm these suggestions in the Access page for them to be fully linked.
- 
For any accounts that were not auto-matched, link them to the correct Vanta user, or mark them as external or service accounts as appropriate.
⚠️ Note: Unmatched accounts will cause the relevant compliance test to fail until they are resolved.
 
 

## Permissions

### Read access
Vanta calls one API endpoint: GET /services/authentication/users. Accounts are retrieved up to 100 per page until all non-locked-out users are fetched. Locked-out users are excluded at the API level and will not appear in Vanta. The required capabilities for this endpoint are list_all_objects and edit_user. See Prerequisites and Step 5 for details.
 

### Write access
None. Vanta does not modify, create, or delete any data in Splunk Enterprise.
 
 

## Troubleshooting and FAQs 

### Credential validation fails when I click "Validate and store credentials"
- 
Likely cause: The base URL is malformed, port 8089 is not reachable from Vanta's IP range, or the token user is missing required capabilities.
- 
How to confirm: Try calling https://splunk.yourcompany.com:8089/services/authentication/users?output_mode=json&count=1 with your token in an API client. A 200 response means the token and URL are valid — the issue is likely network access. A 401 means the token is invalid or expired — verify you copied the full token value. A 403 means the token user is missing required capabilities.
- 
Fix: Confirm Vanta's outbound IP (see Vanta's IP Address or your Integrations page) is allowlisted on port 8089. Verify the token user has both list_all_objects and edit_user. Confirm the base URL uses https:// and includes the port number.

### Users are missing from Vanta after connecting
- 
Likely cause: The missing users are locked out in Splunk and are excluded from the sync, or their account records are missing a username or unique identifier.
- 
How to confirm: In Splunk Web, go to Settings > Users and check whether the missing users have a locked-out status. Locked-out users are filtered at the API level and will not sync to Vanta.
- 
Fix: If users should not be locked out, unlock them in Splunk. On the next sync they will appear in Vanta. If the issue is missing field data, those records are silently skipped. A valid username and unique identifier are required for a record to be imported.

### User display names or account names are showing as usernames instead of real names or email addresses
- 
Likely cause: The affected Splunk accounts do not have a realname or email field populated in their Splunk profile. We fall back to the Splunk username when these fields are absent.
- 
How to confirm: In Splunk Web, go to Settings > Users and check the affected user profiles for a populated real name and email address.
- 
Fix: Update the Splunk user profiles to include a real name and email. On the next sync, Vanta will display the email as the account name and the real name as the display name.

### The integration breaks after the token expires
- 
Likely cause: The authentication token was created with an expiration date and has since expired.
- 
How to confirm: In Splunk Web, go to Settings > Tokens and check the expiration date of the token associated with Vanta.
- 
Fix: Create a new token for the service account and update the credentials in Vanta under Integrations > Splunk Enterprise. To prevent this from recurring, configure the default token expiration to never in Token Settings see Step 4 in the setup guide.

## Images

- [image 01] ../../images/integrations/splunk-enterprise/connecting-vanta-splunk-enterprise--01.png
- [image 02] ../../images/ux/integrations/connecting-vanta-splunk-enterprise--02.png
- [image 03] ../../images/ux/integrations/connecting-vanta-splunk-enterprise--03.png
- [image 04] ../../images/integrations/splunk-enterprise/connecting-vanta-splunk-enterprise--04.png
- [image 05] ../../images/integrations/splunk-enterprise/connecting-vanta-splunk-enterprise--05.png
- [image 06] ../../images/integrations/splunk-enterprise/connecting-vanta-splunk-enterprise--06.png
