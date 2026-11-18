# Connecting Vanta & Confluence Access Control

Source: https://help.vanta.com/en/articles/15589220-connecting-vanta-confluence-access-control
Collection: Integrations ; Integrations › Integrations by Type ; Integrations › Integrations by Type › Access and Additional Integrations
Fetched: 2026-11-17

## Article text

✅ Feature availability: This integration is now available for Vanta Government <https://www.vanta.com/solutions/public-sector> customers.

## Overview
The Confluence Access Control integration connects your Atlassian Confluence Cloud workspace to Vanta over OAuth, syncing user accounts from Confluence groups to support access governance and compliance tracking. Once connected, Vanta can track which Confluence accounts belong to your personnel, verify that every account is attributed to a known employee, and confirm that access is revoked when someone leaves. It is best suited for security and IT teams that use Confluence as part of their internal tooling and need to close gaps in their access review and offboarding processes.
 
Estimated setup time: 10–15 minutes
 
 

## Use cases and capabilities
We pull user account and group membership data from Confluence into Vanta so accounts can be reviewed, linked to personnel records, and tracked through access control tests. You choose which Confluence groups to monitor during setup, giving you control over the scope of what we track.
ℹ️ Note: We only sync accounts within the groups you select. App and bot accounts are filtered out automatically. We do not sync Confluence pages, spaces, or any content.

### Capabilities overview
 | 
Resource / Capability | 
Supported | 
How it is used in Vanta
 | 
User accounts from selected groups | 
Yes | 
Imported into Vanta for access reviews and personnel tracking.
 | 
Group membership scoping | 
Yes | 
You select which groups to monitor during setup and only those members are synced.
 | 
Display name and email | 
Partial | 
Display name is always available. Email availability depends on Atlassian's API restrictions. If email is not returned, Vanta will attempt to resolve it from a connected Jira integration. Without email, auto-matching relies on display name only and may require more manual linking
 | 
Role / permissions | 
No | 
Derived from the account's Confluence API operations (e.g., read, write), not from group membership.
 | 
Suspended or deactivated accounts | 
Partial | 
Filtered out using available signals; detection is heuristic-based, not a dedicated status field.
 | 
App and bot accounts | 
No | 
Filtered out automatically and not included in results. 
 | 
MFA status | 
No | 
Not available from the Confluence API.
 | 
Last login time | 
No | 
Not available from the Confluence API.
 | 
Deprovisioning through Vanta | 
No | 
Write-back is not supported for this integration.
 
 

## Prerequisites
Before starting setup, confirm the following:
- 
You have a Vanta admin account.
- 
You have an Atlassian account with at least read access to Confluence groups and group members in the workspace you want to connect.
💡 Tip: We connect via OAuth and inherit the permissions of the account you authorize with, so if that account has restricted visibility, we will only be able to access what it can see. For best results, connect with an account that has full read access to all groups and members you want to track.
ℹ️ Note: Only one Confluence organization can be connected per credential. If your organization runs multiple Confluence instances, each will require a separate connection.
 
 

## Setup guide

### Step 1: Find the Confluence Access Control integration in Vanta
- 
In Vanta, go to Integrations and click Add integrations.
- 
Search for Confluence Access Control and click on the integration tile.
- 
Click Connect.
[image 01]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2493252227/0936303bee1941d65ec6b2296e6a/55e872a9-4717-42c6-8aae-8c7f0e3d0f18?expires=1794967200&signature=014148cbbf32ab583561c8ad483d17df13447ef008fa458d0e4dc6bf8a7e7df7&req=diQuFct7n4NdXvMW1HO4zaxcNUfik0s9vk35WPmU0R%2B5tqn2om0lXeeNmtm9%0AmmPMuqtcP2sSSvmLLP4%3D%0A>
 

### Step 2: Authorize the connection
- 
A modal will appear. Enter your Atlassian site URL (e.g., https://yourorg.atlassian.net) and click Connect Confluence Access Control.
[image 02]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2493253198/df1378225cf441f9c7fa8c4d8272/48f52050-90d5-4dc9-8a1b-96c3895538c8?expires=1794967200&signature=562080b6697a752a7d0024a35bcb769ebcd2081b62f2b0f452ab63c7acd5071c&req=diQuFct7noBWUfMW1HO4zVLYVt9DUyByVxshZR6v4aiJUDuDJVuj6aqTmr5I%0AwexcmyNiaxE5KjcRw%2FA%3D%0A>
ℹ️ Note: Providing your site URL ensures we connect to the correct Atlassian organization if your account has access to more than one.
- 
Vanta will redirect you to Atlassian's OAuth authorization page. Make sure you are signed into the correct Atlassian account before proceeding.
- 
Review the requested permissions and click the confirmation button to grant Vanta access. Atlassian will redirect you back to Vanta automatically.
 

### Step 3: Select groups to monitor
- 
After authorizing, you will be presented with a group selection screen. Review the list of Confluence groups and select the ones you want Vanta to monitor.
[image 03]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2493255925/e9348f5b2127155c318602b799fe/c0ba933b-1707-48e2-9615-7c81ca9aa376?expires=1794967200&signature=9528256969db9a137ae5b75eae977e3f11629b89127de15290c3652b185681da&req=diQuFct7mIhdXPMW1HO4zc9lwx5%2BTeFp4XwjHyAXqtT1nYm5WElyzdXtUjlx%0AuxcG6cIPuZHezw0DkJw%3D%0A>
- 
We pre-select a default set of groups including those matching confluence-admins-*, confluence-guests-*, confluence-users-*, administrators, and site-admins. Adjust this list to reflect your actual access structure.
- 
Click Save to confirm your selection.
 

## Step 4: Review imported accounts
- 
In Vanta, go to Personnel, select the Access page, and filter by Confluence to review imported accounts.
- 
Matching accuracy depends on email availability from Atlassian. If email is not returned, matching relies on display name, which may require more manual linking. Connecting the Jira integration can improve email resolution.
- 
For any accounts that were not auto-matched, link them to the correct Vanta user, or mark them as external or service accounts as appropriate.
 
 

## Permissions

### Read access
We use the authorization granted during setup to read group membership and user account data from your Confluence workspace including display names, email addresses where available, and role information. We do not access Confluence pages, spaces, content, or any customer-facing data.
 

### Write access
There is no write access. We do not modify, reassign, or delete any data in Confluence.
 
 

## Troubleshooting and FAQs 

### The integration is showing no accounts after connecting
- 
Likely cause: No groups were selected during setup, the selected groups have no members, or the connected account does not have permission to read those groups.
- 
How to confirm: Go to Integrations in Vanta, find the connected Confluence Access Control integration, and click Manage, then select Edit tracked groups and review which groups are selected. Verify that those groups contain active members in Confluence.
- 
Fix: Edit the integration configuration, re-select the appropriate groups, and save. If the issue persists, verify that the connected Atlassian account can view those groups in Confluence.

### The integration disconnected or shows a connection error
- 
Likely cause: The integration may become disconnected if Vanta encounters persistent authorization or permission errors from Atlassian, for example if the OAuth token was revoked.
- 
How to confirm: Check the Confluence integration tile in Vanta for a disconnected or error status. Confirm that Vanta's OAuth authorization is still active in your Atlassian account settings.
- 
Fix: Reconnect the integration from the Vanta Integrations page and complete the OAuth flow again using an account with the required read permissions.

### Vanta connected to the wrong Atlassian organization
- 
Likely cause: Your Atlassian account has access to more than one organization, and Vanta resolved the wrong one during the OAuth flow.
- 
How to confirm: Review the connected organization shown in Vanta's integration settings and compare it to your intended Confluence workspace.
- 
Fix: Disconnect and reconnect the integration. When prompted, enter your Atlassian site URL (e.g., https://yourorg.atlassian.net <https://yourorg.atlassian.net>) to ensure we connect to the correct organization.

### An account I expected to see is missing from Vanta
- 
Likely cause: The account may belong to a group that was not selected during setup, or the account may be flagged as suspended or deactivated based on its display name or permission state in Confluence.
- 
How to confirm: Check whether the account belongs to one of your selected groups in Confluence. Review the account's status and display name. Accounts with (Unlicensed) or (Deactivated) in their display name are filtered out automatically.
- 
Fix: If the account should be monitored, ensure its group is selected in the integration configuration in Vanta. If the account appears active in Confluence but is still missing, contact Vanta support.

## Images

- [image 01] ../../images/ux/integrations/connecting-vanta-confluence-access-control--01.png
- [image 02] ../../images/integrations/confluence-access-control/connecting-vanta-confluence-access-control--02.png
- [image 03] ../../images/integrations/confluence-access-control/connecting-vanta-confluence-access-control--03.png
