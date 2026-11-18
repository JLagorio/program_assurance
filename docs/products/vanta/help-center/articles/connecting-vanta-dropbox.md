# Connecting Vanta & Dropbox

Source: https://help.vanta.com/en/articles/11345995-connecting-vanta-dropbox
Collection: Optimizing your Workflow ; Optimizing your Workflow › Troubleshooting
Fetched: 2026-11-17

## Article text

## Overview
Vanta integrates with Dropbox Business to monitor and manage team member access. By connecting Dropbox to Vanta via OAuth, your active Dropbox team members are synced into Vanta and used to support access reviews, automated compliance tests, access management workflows, and when enabled, automated deprovisioning of accounts as part of offboarding.
 
This integration is most useful for security and compliance teams using Dropbox Business who need to monitor access, support access reviews, automate offboarding steps, and maintain evidence for compliance programs (including PCI DSS 4 and FedRAMP 20x). 
 
Estimated setup time: Less than 5 minutes
 
 

## Use cases and capabilities
Connecting Dropbox to Vanta enables the following workflows:
- 
Automated Compliance Tests: Connect Dropbox Business and we automatically sync your active team members into Vanta to power two compliance tests: one that verifies every Dropbox account is linked to a known employee, and one that confirms accounts belonging to terminated employees have been removed or deactivated. Failing accounts are surfaced directly in Vanta for remediation.
- 
Access Reviews: Once connected, active Dropbox team members and their assigned roles are synced into Vanta and appear in access review workflows automatically. Reviewers can validate whether access is still appropriate and generate audit-ready evidence without manual data collection.
- 
Access Requests: Dropbox admin-tier roles (Member, Support Admin, User Management Admin, and Team Admin) can be represented as entitlements in Vanta, allowing requesters to ask for elevated access, approvers to review role assignments in context, and administrators to track provisioning status.
- 
Automated Deprovisioning: When deprovisioning is enabled for the Dropbox integration, offboarding a team member in Vanta suspends their Dropbox Business account automatically — no separate action in the Dropbox Admin Console required.
⚠️ Note: Deprovisioning must be opted into at the time the integration is connected. If it was not enabled during initial setup, you will need to reconnect the integration to add the required permission.

### Capabilities Summary
 | 
Resource / Capability | 
Supported | 
How it is used in Vanta
 | 
Users (active) | 
Yes | 
Access Reviews, Automated Tests, Access Requests
 | 
Users (inactive / suspended / invited) | 
No | 
Not synced – only active team members are collected
 | 
Groups | 
No | 
Not collected by this integration
 | 
Roles / Entitlements | 
Yes (role-based access) | 
Access Reviews, Access Requests
 | 
Last Login | 
No | 
Not collected by this integration
 | 
Access Deprovisioning | 
Yes | 
Suspends Dropbox accounts during offboarding (requires Admin role and opt-in at connection)
 
 

## Prerequisites
Before connecting the Dropbox integration, confirm the following:
- 
You must be a Vanta administrator to connect an integration
- 
The account used to connect must have an Admin or Owner role in your Dropbox Business organization. A standard member account cannot list team members via the Dropbox API and cannot be used to connect
- 
You must be on a Dropbox Business plan. Personal Dropbox accounts are not supported
- 
(Optional) For automated deprovisioning: The connecting account must have an Admin or Owner role. Deprovisioning requires opting in at connection time and adds the members.write permission to the authorization
- 
Browser access: The connecting user must be able to complete an OAuth authorization flow in their browser
- 
Before you start: Log in to Dropbox in your browser using the admin account you plan to use for the connection. This avoids interruptions during the OAuth flow.
 
 

## Setup guide
- 
In Vanta, go to the Integrations page, click Add integration, and search for Dropbox. For help, see our guide to the Integrations Page <https://help.vanta.com/en/articles/11345761-integrations-page>.
- 
Click Connect.
- 
 A modal will appear. Select Connect Dropbox.
- 
If you want to enable automated deprovisioning, select the opt-in option before proceeding. This adds the permission needed for Vanta to suspend Dropbox accounts during offboarding.
[image 01]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2407151064/5f45f56bc546a96f1da658a7c4a6/9b221efb-623c-46d7-be69-b6d5b9dfbde3?expires=1794967200&signature=3c122b86d1f6302db886facadfb93052154d2459b8a3819566caa6d8fcd77ed2&req=diQnEch7nIFZXfMW1HO4zVPgWImewbjYRWBuFf50ZeYAc9yNrqYuIWh9e3oS%0A3nIWVZ8GSJjER9Ussec%3D%0A>
- 
If you are not already logged in to Dropbox, you will be prompted to log in before continuing.
- 
You will be redirected to Dropbox's authorization screen. Review the requested permissions and click Allow to authorize Vanta.
[image 02]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2407152806/c5a7648f9005b31070e00304dab7/97c63b5f-e4ca-41dd-aa60-8d6cf1c2323d?expires=1794967200&signature=9caf2795face80beaebbd1e0332caa1a20de982aa01490909aa110f903fd60d6&req=diQnEch7n4lfX%2FMW1HO4zVLJJXUY88Fvs5MPn9d49X%2F0qaQkg8eOc2bYy4Kt%0AEKoP0X2dPBBHKd%2Fgfbo%3D%0A>
- 
You will be redirected back to Vanta. A success screen confirms the connection is active.
[image 03]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2407154168/c45d828518501c2aaa64652bbffa/54daf0b3-4fca-4c37-8176-b135c46d8517?expires=1794967200&signature=42e95412b237a8917da9c9307d74f2e4edb78ae92d89de5fefd02a437bbfea2f&req=diQnEch7mYBZUfMW1HO4zS3710ow0zQjP41f8hDK%2F%2BQTnRlEaa8dFyuct5C9%0ABQ01LcVucr2UVlQ1JJY%3D%0A>
 
 

### Configure scope (optional, but recommended)
After connecting, determine which Dropbox accounts should be included or excluded from the scope of your audit.
- 
From the Integrations page, locate the connected Dropbox. 
- 
Click Configure scope to set your scope preferences.
[image 04]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2407156569/347bf9c24929c47ddafeb4a72f67/5357bcdd-259f-4cad-a328-e66886f11ac1?expires=1794967200&signature=1e3d23ed11c9bf97f376e48be0663c942e4697ddc0cfbf3eff9d1ee45e55d879&req=diQnEch7m4RZUPMW1HO4zQiaTkYbgLV7VdYaSBNpU7fXkEH3LYE9ttCJMUnW%0A92OSTOxZCe%2BN8yRtj40%3D%0A>
- 
You can update scope at any time by returning to this screen.
[image 05]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2407157065/a715f790f0b359041e33a7ef620e/0ac6be5d-3d1d-45e7-9220-6d3008ed6dff?expires=1794967200&signature=68bcd51edb0abcf0ddffce33027c76b676711500f0f5a156ee41eeccc95bfd01&req=diQnEch7moFZXPMW1HO4zQzMyhipMGQDPgy%2FyWIDCnBd%2BpF8kar095%2FWifgE%0A6rfNTy1fNgsunXoAg%2Fg%3D%0A>
 
ℹ️ Note: Scope configuration does not affect which data Vanta collects. It determines which accounts are treated as in-scope for your compliance program.
 
 

## Permissions

### Read access 
Vanta uses read access to retrieve the list of active team members in your Dropbox Business organization. This data powers automated tests, access reviews, and account matching in Vanta.
 
Vanta requests the following access scopes during the OAuth flow:
- 
account_info.read reads basic account information for the connecting user
- 
team_data.member accesses team member data
- 
members.read lists team members in the organization
These scopes are shown on the Dropbox authorization screen during setup. Dropbox's consent screen is the authoritative source for how these permissions are labeled.
 

### Write access
By default, Vanta has read-only access to your Dropbox organization. Write access is only used when you opt in to automated deprovisioning at connection time (via the members.write permission), and only in one specific situation: 
- 
Deprovisioning: This allows Vanta to suspend a team member's Dropbox account via the Dropbox Team API when an offboarding action is initiated in Vanta. Write access is only used when deprovisioning is explicitly triggered. 
Vanta does not modify, create, or delete any other Dropbox accounts, settings, or data. 
 
 

## Troubleshooting / Common Issues

### Users are missing from Vanta
- 
Likely cause: Vanta only syncs users with an active status in Dropbox. Users who are suspended, invited, or removed are not included.
- 
How to confirm: In the Dropbox Admin Console, review the status of any users you expect to see in Vanta.
- 
Fix: Ensure the users you want monitored are active members of your Dropbox Business organization. If users were recently added, wait for the next sync cycle.

### Dropbox accounts are showing as unlinked
- 
Likely cause: The email address or display name in Dropbox does not match what is recorded for that person in Vanta.
- 
How to confirm: Compare the email address on the Dropbox account with the email on the corresponding Vanta personnel record.
- 
Fix: Update the email in Dropbox or in Vanta so they match. Once the next sync runs, the account should be matched automatically.

### The integration shows a connection error or disconnected status
- 
Likely cause: The OAuth token has expired or is no longer valid. This can happen if the connected account's credentials changed, the account's admin role was removed, or the authorization was revoked in Dropbox.
- 
How to confirm: Check whether the connected Dropbox account still has an Admin or Owner role and that the authorization has not been revoked under Dropbox's connected apps settings.
- 
Fix: Reconnect the Dropbox integration from the Vanta Integrations page. Use an account with Admin or Owner permissions when reconnecting.

### Deprovisioning failed
- 
Likely cause: Either the connected account no longer has the required Admin role, the user has already been removed from Dropbox, or the user being offboarded is the Organization Owner.
- 
How to confirm: Check the connected account's role in the Dropbox Admin Console. Verify whether the user still has an active account in Dropbox.
- 
Fix:
- 
Confirm the connected account still has an Admin or Owner role in Dropbox Business. If not, reconnect the integration with a valid admin account.
- 
If the user has already been removed from Dropbox manually, no further action is needed in Dropbox. Dismiss the deprovisioning task in Vanta.
- 
If the user is the Organization Owner in Dropbox, transfer ownership to another admin in Dropbox first. This demotes the current Owner to Admin, after which you can retry deprovisioning through Vanta.

## Images

- [image 01] ../../images/integrations/dropbox/connecting-vanta-dropbox--01.png
- [image 02] ../../images/integrations/dropbox/connecting-vanta-dropbox--02.png
- [image 03] ../../images/integrations/dropbox/connecting-vanta-dropbox--03.png
- [image 04] ../../images/ux/integrations/connecting-vanta-dropbox--04.png
- [image 05] ../../images/ux/integrations/connecting-vanta-dropbox--05.png
