# Connecting Vanta & PagerDuty

Source: https://help.vanta.com/en/articles/17001367-connecting-vanta-pagerduty
Collection: Integrations ; Integrations › Integrations by Type ; Integrations › Integrations by Type › Access and Additional Integrations
Fetched: 2026-11-17

## Article text

## Overview
Vanta connects to PagerDuty via OAuth 2.0 and syncs user account data on a recurring schedule. That gives you continuous visibility into who has PagerDuty access, keeps that data current in Vanta's access review and compliance workflows, and (when enabled) lets you remove a user's PagerDuty account directly from Vanta during offboarding without any manual action in PagerDuty. This integration is most useful for: 
- 
Security and compliance teams that need to verify PagerDuty access is assigned to active employees and removed promptly when personnel leave.
- 
IT and operations teams managing offboarding workflows who want to automate PagerDuty account removal directly from Vanta.
- 
Compliance programs that require audit-ready evidence of access reviews and access lifecycle management for on-call tooling.
 
Estimated setup time: 5-10 minutes
 
 

## Use cases and capabilities
This integration powers four workflows in Vanta:
- 
Access reviews — We sync PagerDuty user accounts into Vanta so reviewers can confirm who has access, evaluate whether it's still appropriate, and produce audit-ready evidence without leaving Vanta.
- 
Access requests — Synced PagerDuty users make PagerDuty available as a destination in Vanta's Access Requests workflow. Employees can request access and approvers can review requests with user context visible. Access request fulfillment is manual — we do not auto-provision new PagerDuty users when a request is approved.
- 
Automated compliance tests — We bring in user account data to run two automated tests: one that verifies PagerDuty accounts are associated with users in Vanta, and one that confirms access is deprovisioned when personnel leave the organization.
- 
Automated deprovisioning — When enabled, we can permanently remove a user's PagerDuty account directly from Vanta as part of an offboarding workflow with no manual action required in PagerDuty. This requires opting in during setup and authorizing write access. Accounts are deleted, not deactivated.
⚠️ Note: Automated deprovisioning is not enabled by default. This is an Access Management feature that may require an upgrade or add-on. Refer to Vanta Plans and Pricing <https://www.vanta.com/pricing?utm_source=help_center&utm_campaign=hc_pricing_cta> for details. For a full walkthrough of the offboarding workflow, see Offboarding Personnel <https://help.vanta.com/en/articles/11345609-offboarding-personnel>.
 

### Capabilities summary
 | 
Resource / Capability | 
Supported | 
How it is used in Vanta
 | 
Users | 
Yes | 
Access Reviews, Access Requests, Automated Tests
 | 
User role | 
Partial | 
Basic role data appears on account records — role changes in PagerDuty are reflected on next sync
 | 
Groups | 
No | 
Not currently synced by this integration 
 | 
Last login | 
No | 
Not currently synced by this integration
 | 
MFA status | 
No | 
Not currently synced by this integration
 | 
Deprovisioning | 
Yes | 
Automated user removal during offboarding — requires opt-in during setup; may require a plan upgrade
 
 

## Prerequisites
Confirm you have the following before setup: 
- 
A Vanta administrator account. 
- 
A PagerDuty account with Account Owner or Global Admin role..
ℹ️ Note: Users with lower permission levels (e.g., User, Limited User, Observer) will not be able to complete the OAuth authorization flow. See PagerDuty's user role documentation <https://support.pagerduty.com/main/docs/manage-users> for details on role permissions.
 
 

## Setup guide

### Step 1: Connect in Vanta
- 
In Vanta, go to the Integrations page, click Add integration.
- 
Search for PagerDuty and click on the integration card. 
- 
Click Connect. 
[image 01]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2679419180/5faa991a9ec16a4495ddc4fcf39d/image.png?expires=1794967200&signature=db6bccb6b9b17f7b2f2300fb2fea2521a0c86fb892ba85c7f04859f38eceed10&req=diYgH81%2FlIBXWfMW1HO4zerIi0xBbgYpxU6lqkBWUvYya9CPKd2YEl%2F6Mjig%0AFz%2FeNfsVLw4RzSrmKOw%3D%0A>
- 
If you want automated deprovisioning, enable the deprovisioning option before continuing. Then click Connect PagerDuty. You will be redirected to the PagerDuty login page.
[image 02]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2679421053/85ee37c3dd2718cffb3db888b401/25aaf412-2dc4-4dd4-a8e7-bf4c7fe9fd45?expires=1794967200&signature=f574a0237a557664d7e73cd5000f1661d8e5666b41bec178e6911497433ddad4&req=diYgH818nIFaWvMW1HO4zfNk4hRdA9ZJKAJEgPqsDfEZuPMouW25Hh6fixzv%0AO0Pq%2FL5VHL6suq0OYcU%3D%0A>
 

### Step 2: Authorize in PagerDuty
- 
Sign in to PagerDuty using an account with Account Owner or Global Admin permissions.
- 
Review the permissions we are requesting and authorize access. If you enabled deprovisioning in Vanta before starting OAuth, the request will include write access needed to remove users during offboarding. Otherwise, the connection remains read-only.
[image 03]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2679425305/aac16e6f395205855e0bc9b94e53/image.png?expires=1794967200&signature=8ffadd79f38beae8b67d266dd4f75996a9d1a489e382bbb03c11837a32e2a09c&req=diYgH818mIJfXPMW1HO4zazBBA6JoClwAGTWiy5MLiUt9zeYMeZQW9Cc3t9M%0AfCZz9EgVHbDPPKT9CxE%3D%0A>
- 
PagerDuty redirects you back to Vanta automatically. 
 

### Step 3 (optional): Configure scope
- 
Once redirected, you will see a confirmation that the connection was successful.
- 
Use the Configure Scope option to exclude any user accounts that do not require monitoring in Vanta (e.g., service accounts or shared mailboxes).
[image 04]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2679426172/ede0b95095ba4f9a0f78395554a7/6e94cd68-0514-4be3-9048-cdc3fbb811ce?expires=1794967200&signature=a7a8817bfdec6ecda7bd90aa1166b66a5a86c0a0c67c06904931817ee97675a8&req=diYgH818m4BYW%2FMW1HO4zTVoW4rNr2mAWo2NLhqCF%2B4Vm9XotInkqka0msiv%0A4Z0qYxOqL%2BKqGr%2BPGhI%3D%0A>
 
 

## Verification and validation
After setup, go to Integrations, search for PagerDuty, and verify the status shows Connected. To confirm the account data is syncing, go to Personnel > Access > select PagerDuty from the dropdown menu. Once the initial sync completes, active PagerDuty user accounts will populate on this page.
 
 

## Disconnecting the integration
To disconnect PagerDuty from Vanta:
- 
In Vanta, go to the Integrations page and select PagerDuty, or use the search bar to find it.
- 
Click the three-dot menu next to the PagerDuty integration.
- 
Select Delete from the dropdown and confirm.
Deleting the connection stops all user data syncing and disables automated deprovisioning. No further reads or writes occur after the connection is removed.
If you want to remove write access but keep the integration connected, reconnect the integration without enabling the deprovisioning option. This re-authorizes the connection with read-only scopes.
 
 

## Permissions

### What Vanta reads from PagerDuty
- 
User accounts — We read user data including name, email, role, and profile URL. This confirms that only active employees retain system access and that terminated employees are deprovisioned promptly. 

### What Vanta writes to PagerDuty
We write only when automated deprovisioning is enabled, the connection was authorized with write-capable scopes, and an offboarding action is initiated in Vanta:
- 
Removes users — We call PagerDuty's API to permanently delete the user from your PagerDuty account. No other user data is modified. Accounts are deleted, not deactivated.
We do not create users, modify user roles, or change any other account settings in PagerDuty.
 
 

## Troubleshooting and FAQs
I can't authorize PagerDuty in the OAuth flow
- 
Likely cause: Your PagerDuty account does not have sufficient permissions.
- 
Fix: You must sign in with an account that has Account Owner or Global Admin role in PagerDuty. If you are unsure of your role, check your PagerDuty account settings or contact your PagerDuty administrator.
 
My users aren't appearing in Vanta after connecting
- 
Likely cause: The initial sync has not yet completed, or the OAuth credentials are invalid.
- 
Fix: Allow time for the initial sync to complete. If users still do not appear after an hour, verify that you authorized the connection with the correct PagerDuty account. You can reconnect the integration from the Integrations page in Vanta.
 
Deprovisioning is not available for PagerDuty
- 
Likely cause: Your integration is connected with read-only permissions, deprovisioning was not selected during connection, or the deprovisioning feature is not included in your Vanta plan.
- 
Fix: Reconnect the PagerDuty integration, enable the deprovisioning option during setup, and authorize write access. If you have already reconnected and deprovisioning is still unavailable, confirm that your Vanta plan includes Access Management features. Refer to Vanta Plans and Pricing <https://www.vanta.com/pricing?utm_source=help_center&utm_campaign=hc_pricing_cta> for details.
 
Deprovisioning failed with Insufficient permissions
- 
Likely cause: The OAuth token stored in Vanta was authorized by a PagerDuty user who no longer has Account Owner or Global Admin permissions, or the token's scopes do not include write access.
- 
Fix: Reconnect the PagerDuty integration in Vanta using an account with Account Owner or Global Admin permissions, enable the deprovisioning option during setup, and authorize write access. This will generate a new OAuth token with the required scopes.
 
Deprovisioning failed with Reconnect the integration
- 
Likely cause: The OAuth token has expired or been revoked. PagerDuty OAuth tokens expire after 30 days if they cannot be automatically refreshed. If this happens, reconnect the integration.
- 
Fix: Go to the Integrations page in Vanta, find PagerDuty, and click Reconnect to re-authorize the connection.
 
 

## Support
If you need help with this integration, contact Vanta's support team. In the Vanta app, click the ? icon in the top navigation and select Chat with us to connect with support, or select Help center to browse documentation. Vanta's support team handles all questions about this integration, including setup, syncing, and deprovisioning behavior.

## Images

- [image 01] ../../images/ux/integrations/connecting-vanta-pagerduty--01.png
- [image 02] ../../images/ux/integrations/connecting-vanta-pagerduty--02.png
- [image 03] ../../images/integrations/pagerduty/connecting-vanta-pagerduty--03.png
- [image 04] ../../images/ux/integrations/connecting-vanta-pagerduty--04.png
