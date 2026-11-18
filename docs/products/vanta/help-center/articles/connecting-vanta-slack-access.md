# Connecting Vanta & Slack (Access)

Source: https://help.vanta.com/en/articles/15971608-connecting-vanta-slack-access
Collection: Integrations ; Integrations › Integrations by Type ; Integrations › Integrations by Type › Access and Additional Integrations
Fetched: 2026-11-17

## Article text

✅ Feature availability: This integration is now available for Vanta Government <https://www.vanta.com/solutions/public-sector> customers.
 

## Overview
The Slack integration connects your Slack workspace to Vanta over OAuth, syncing member accounts for access governance and compliance tracking. It is best suited for teams that use Slack for internal communication and need to ensure every Slack account is tracked, attributed to a known employee, and included in access reviews.
ℹ️ Note: This article covers the Slack access integration, which imports user accounts for access reviews. It is separate from the Slack Notifications integration <https://help.vanta.com/en/articles/11345744-setting-up-slack-notifications>, which sends Vanta notifications into Slack channels. You can connect both independently.
Estimated setup time: Under 5 minutes
 
 

## Use cases and capabilities
This integration pulls Slack member accounts into Vanta so they can be reviewed, linked to personnel records, and tracked through access control tests. It gives your team visibility into who has access to your Slack workspace without manual exports.
 

### Capabilities overview
 | 
Resource / Capability | 
Supported | 
How it is used in Vanta
 | 
Member, admin, and owner accounts | 
Yes | 
Imported into Vanta for access reviews and personnel tracking
 | 
Account email address | 
Yes | 
Used to identify accounts and auto-match to Vanta personnel records
 | 
Display name | 
Yes | 
Shown on the account record; falls back to real name or username if email is unavailable
 | 
Role (Admin, Member, or Guest) | 
Yes | 
Displayed on the account record. Admins are flagged as "Admin," multi-channel guests as "Guest," and everyone else as "Member"
 | 
MFA status (2FA) | 
Yes | 
Synced from Slack. Used by the "MFA on Slack" compliance test. Not available for users who have been invited but have not yet completed sign-up
 | 
Account creation date | 
No | 
Not available from the Slack API
 | 
Last login time | 
No | 
Not available from the Slack API
 | 
Full name | 
No | 
Not available as a separate field; display name or email is used instead
 | 
Deprovisioning through Vanta | 
No | 
Write-back is not supported for this integration
 | 
Single-channel guest accounts | 
No | 
Out of scope — single-channel guests are free accounts with minimal access and are excluded from sync
 | 
Bot and app accounts | 
No | 
Out of scope — only human accounts are synced
 | 
Slack messages or channel data | 
No | 
Out of scope — we only access user account information
 
 

## Prerequisites 
Before starting setup, confirm the following:
- 
You have a Vanta admin account.
- 
You have a Slack account with admin or owner-level access to the workspace you want to sync.
💡 Tip: We connect via OAuth and request read-only scopes (team:read, users:read, users:read.email). The authorizing account must have admin-level access so that Vanta can see all workspace members, including their email addresses and 2FA status.
 
 

## Explore the integration page 
 When you navigate to the Slack integration, you'll land on its listing page, which includes five tabs that cover what you need to know before (and after) you connect. 
- 
Overview — Start here. A summary of what the integration does, its top capabilities, and the prerequisites you'll need in place before connecting. When you're ready, select Connect to begin setup.
- 
API permissions — Exactly what access Vanta requests from Slack: each permission's scope, whether it's read or write, and what data it covers, etc. Share this tab with your security team if they need to review access before you connect.
- 
Resource types — Every resource type Vanta imports from Slack, down to the specific fields collected for each. Use this to understand exactly what data will show up in Vanta once connected.
- 
Automated tests — How many tests connecting Slack unlocks and which frameworks and controls they map to (SOC 2, ISO 27001, etc.), plus the full list of tests by name. Useful for scoping compliance coverage ahead of an audit.
- 
Security — How Vanta protects the data it collects — encryption, data retention, access controls, and infrastructure. Visit Vanta's Trust Center <https://trust.vanta.com/> for the full picture.
When you’re ready to connect, continue to the setup guide below. 
 
 
 

## Setup guide

### Step 1: Find the Slack integration in Vanta
- 
In Vanta, go to Integrations and click the Add integrations button.
- 
Search for Slack and click on the integration tile.
- 
Make sure you select the Slack access integration, not the Slack Notifications integration.
[image 01]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2550576005/f1fc9df7d0437e12b69fb8333bbe/image.png?expires=1794967200&signature=b824ad51c4903bf869d75ef8ed884d66dd0f908652b6901809da66a8b23b7d0a&req=diUiFsx5m4FfXPMW1HO4zQ%2FhEdar0nLX1ASvKoqikL3u1v2rYVhZgd5o6gfw%0Av0x7TfnV2n5M7E45Dq0%3D%0A>
- 
Click Connect.
[image 02]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2550578729/35e1047298affe13f3da76ef3195/image.png?expires=1794967200&signature=7f1fd6eb211a846a8bc01a75439401b9c8a64ea9f5fc26221be39fb937b078cd&req=diUiFsx5lYZdUPMW1HO4zbhJ7a4R9U3kDlyF8blB6Rizk2NWiARsWo9hqJ5g%0ARyk9M%2B7AsZ3CmRhXzEw%3D%0A>
 

### Step 2: Authorize the connection
- 
A connection modal will appear. Click Connect.
[image 03]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2550583308/2161359eb433dd34c0a095491b5c/image.png?expires=1794967200&signature=1e5ca5af03dc7f462c008e9b0cd8c8abe4301151eba2519b0b976deeb2052ae8&req=diUiFsx2noJfUfMW1HO4zbIgyEC4NWykv76K2%2BXfbGetHTmHTlvHftFtCx%2BM%0ANp5rwnlbMMNnQxcff5Q%3D%0A>
- 
Vanta redirects you to Slack's OAuth authorization page.
- 
Make sure you are logged into the correct Slack workspace before proceeding.
- 
Review the requested permissions and click Allow to grant Vanta access.
[image 04]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2550585975/1930d77db3ab16f6714ebf673145/image.png?expires=1794967200&signature=edc4742481bb20ce3cd2df098e7d5f1df4e24074e48d584b64d28b5a0795b4a6&req=diUiFsx2mIhYXPMW1HO4zXIRl71RzNvsxuDXXS0Ti%2BzH8L%2B4fUZ8reCBaSdv%0AgGo8r01IvXnqVCvHvLg%3D%0A>
- 
Slack redirects you back to Vanta automatically.
⚠️ Note: If you are not redirected back to Vanta, check that your browser is not blocking third-party cookies, which can interfere with the OAuth callback. If the redirect does not complete, try the flow in an incognito window or a different browser.
 

### Step 3: Confirm the connection
- 
After authorizing, the Slack integration should appear as Connected in your Vanta integrations list.
- 
We begin an initial sync immediately after setup completes. The sync may take a few minutes depending on the size of your Slack workspace.
[image 05]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2550599633/0fc371c5cb2d2e003a355c7035cb/image.png?expires=1794967200&signature=67e7f8b37454b3f5097c4c6666b6f4c54d7f1b43abd88ee8ba203fc37bf6f392&req=diUiFsx3lIdcWvMW1HO4zRwIrDRZSSJiUQ%2BdouEASFKbI8u89j%2BzSaLCpIJt%0AzLEXWdf6kglgGOOqnM4%3D%0A>
 

### Step 4: Review imported accounts
- 
In Vanta, go to Personnel and then select the Access page and filter by Slack to review imported accounts.
- 
We automatically suggest matches between Slack accounts and Vanta personnel records based on email address and display name. You may need to confirm these suggestions in the Access page for them to be fully linked.
- 
For any accounts that were not auto-matched, link them to the correct Vanta user, or mark them as external or service accounts as appropriate.
ℹ️ Note: Unmatched accounts will cause the "Slack accounts associated with users" test to fail until they are resolved.
 
ℹ️ Note: This integration connects to one Slack workspace per OAuth credential. If your organization uses multiple Slack workspaces, each will require a separate connection. Multi-connection is supported; you can add as many workspaces as you need. 
 
 

## Permissions

### Read access
We use the authorization you grant during setup to read user account data from your Slack workspace. The OAuth scopes we request are:
 | 
Scope | 
What it does
 | 
team:read | 
Reads basic information about your Slack workspace (team name and ID)
 | 
users:read | 
Reads the list of users in your workspace, including their role, display name, and 2FA status
 | 
users:read.email | 
Reads users' email addresses, which we use to match Slack accounts to Vanta personnel records

### Write access
There is no write access. We do not modify, deactivate, or delete any data in Slack.
 
 

## Troubleshooting and FAQs

### The integration shows as disconnected or needs reconnection
- 
How to confirm: In Vanta, check the Slack integration tile for a disconnected or error status. In Slack, confirm that Vanta's OAuth authorization is still active under your workspace's app management settings.
- 
Fix: Reconnect the integration from the Vanta Integrations page and complete the OAuth flow again. We recommend reconnecting with a Slack Owner or Admin account to reduce the risk of permission-related failures.

### A Slack account is missing from Vanta
- 
Likely cause: The missing account may be a bot account, a single-channel guest, or a deactivated user. We exclude all three from sync.
- 
How to confirm: Check the user's status in Slack under Settings & administration > Manage members. Verify the account is active, is not a bot, and is not a single-channel guest.
- 
Fix: If the account is a legitimate active member and still not showing in Vanta after waiting for a sync cycle, try disconnecting and reconnecting the integration to trigger a fresh sync.

### I connected the wrong Slack workspace
- 
Likely cause: You were logged into a different Slack workspace when you completed the OAuth flow.
- 
How to confirm: Check the connected workspace name in the Slack integration tile in Vanta.
- 
Fix: Disconnect the integration, log into the correct Slack workspace in your browser, then reconnect from the Vanta Integrations page.

### What is the difference between the Slack and Slack Notifications integrations?
- 
The Slack integration (this one) imports user accounts from your Slack workspace into Vanta for access reviews and compliance tracking. It has read-only access.
- 
The Slack Notifications <https://help.vanta.com/en/articles/11345744-setting-up-slack-notifications> integration <https://help.vanta.com/en/articles/11345744-setting-up-slack-notifications> sends Vanta notifications (such as task reminders and access request updates) into your Slack channels. It has write access to post messages.
- 
These are separate integrations with different OAuth connections and different permissions. You can connect one or both depending on your needs.

## Images

- [image 01] ../../images/ux/integrations/connecting-vanta-slack-access--01.png
- [image 02] ../../images/ux/integrations/connecting-vanta-slack-access--02.png
- [image 03] ../../images/integrations/slack/connecting-vanta-slack-access--03.png
- [image 04] ../../images/integrations/slack/connecting-vanta-slack-access--04.png
- [image 05] ../../images/ux/integrations/connecting-vanta-slack-access--05.png
