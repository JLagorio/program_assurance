# Personal Slack Notifications in Vanta

Source: https://help.vanta.com/en/articles/14441493-personal-slack-notifications-in-vanta
Collection: Integrations ; Integrations › Integrations by Type ; Integrations › Integrations by Type › Access and Additional Integrations
Fetched: 2026-11-17

## Article text

Note: This article covers personal (direct message) Slack notifications for individual users. It does not cover company-level Slack channel setup. 
Important: Before you start, a Vanta admin must connect Vanta to your Slack workspace before personal notifications can work. See Setting Up Slack Notifications <https://help.vanta.com/en/articles/11345744-setting-up-slack-notifications> for admin configuration steps.
 
Vanta can send you a direct Slack message when items are assigned to you, questionnaire statuses change, vendor assessments complete, and more. This article covers how personal Slack notifications work, what you need to set up, and how to troubleshoot if messages are not arriving.
 

## How it works
When Vanta assigns a question, task, or other item to you, it can send a direct Slack message to your Slack account. Vanta matches your Vanta account to your Slack account using your email address. If the email on your Vanta account matches the email on your Slack account, the message is delivered automatically — no separate Slack login or app connection is required on your end.
Important: Personal Slack notifications are only available to users with non-employee roles (for example, Admin or Member). Users with the Employee role do not receive these alerts and will not see the notification settings page in Vanta. If a user needs to receive assignment alerts, an admin must update their role.
 

## Prerequisites
Before personal Slack notifications can work, all of the following must be true:
 

## Admin requirements (completed before user setup)
- 
A Vanta admin has connected Vanta to your company's Slack workspace. See Setting Up Slack Notifications <https://help.vanta.com/en/articles/11345744-setting-up-slack-notifications>.
- 
The Slack integration is active and not disconnected or revoked.

## Per-user requirements
- 
Your Vanta role must be a non-employee role (for example, Admin or Member). Users with the Employee role cannot access or receive these notifications.
- 
Your Vanta account email and your Slack account email must be identical. Even a small difference — such as using an email alias in one system — will prevent delivery.
- 
You must have the Slack notification toggle enabled in your Vanta personal notification settings (covered in the setup steps below).
- 
Your Slack account must be active. Deactivated Slack accounts will not receive messages.
 
 

## Admin setup

## 
Admin-level setup is covered in full in Setting Up Slack Notifications <https://help.vanta.com/en/articles/11345744-setting-up-slack-notifications>. That article includes:
- 
Connecting Vanta to your Slack workspace
- 
Selecting Slack channels for company-level notifications
- 
Adding the Vanta app to private channels
Complete that setup before asking users to configure their personal preferences. Once the admin has connected Slack, users will see a Slack toggle column on their personal notification settings page.
 
 
 

## User setup: enabling personal Slack notifications
Each user controls their own Slack notification preferences. Enabling the integration at the company level does not automatically turn on personal DMs for individual users.
- 
Log in to Vanta.
- 
Click the gear icon (top right) to open Settings, then select Notifications under My account in the sidebar.
- 
In the My alerts section, find the notification types you want to receive via Slack.
- 
Enable the Slack toggle for each type.
No further action is needed. Vanta will automatically match your Slack account using your email address the next time a notification is triggered. No additional authorization is required. 
Important: If you do not see a Slack column on this page, your admin has not yet connected Vanta to Slack. Ask your admin to complete the steps in Setting Up Slack Notifications <https://help.vanta.com/en/articles/11345744-setting-up-slack-notifications> first.
 

## What triggers a personal Slack notification
The notification types you can enable for Slack DMs are listed below. The exact types visible on your page depend on your company's Vanta plan and enabled features.
 

## My alerts
The My alerts section controls per-event notifications. These are batched and sent periodically to reduce notification volume, unless a specific type is marked as sent immediately.
 | 
Notification label in Vanta | 
What triggers it | 
Required feature 
 
Note: Notification types listed as “always available” are included on all Vanta plans and do not require additional features to be enabled. 
 | 
When an automated test I own needs attention | 
A test assigned to you enters a failing state | 
Compliance platform
 | 
When a document I own needs to be updated | 
An evidence document you own needs attention | 
Compliance platform
 | 
When I am assigned ownership of an item | 
Any question, task, control, or other item is assigned to you | 
Always available
 | 
When I am assigned approver of a questionnaire | 
You are added as an approver on a questionnaire | 
Questionnaire Automation Advanced
 | 
When the status changes on a questionnaire where I am approver or owner (Sent immediately) | 
A questionnaire you are involved with changes status | 
Questionnaire Automation Advanced
 | 
Contracts ready for review | 
A contract is ready for your review | 
Customer Commitments
 | 
When a vendor owner needs to be reassigned | 
A vendor's owner needs to be changed | 
Vendor Risk Management
 | 
When a vendor uploads a new document in Vanta Exchange | 
A vendor uploads a document through Vanta Exchange | 
Vendor Risk Management
 | 
When a vendor assessment has been completed | 
A vendor security assessment is finished | 
Vendor Risk Management
 | 
When all evidence is submitted and an assessment is ready for analysis | 
A vendor evidence portal submission is complete | 
Vendor Risk Management
 | 
When someone comments on an item I own | 
A comment is added to something you own | 
Always available
 | 
When a reply is added to a thread I've participated in | 
Someone replies to a comment thread you're part of | 
Always available
 | 
When someone comments on a piece of evidence in an audit | 
A comment is added to audit evidence | 
Audit access

## Digests
The Digests section controls scheduled summary notifications. These run on a set cadence (daily or weekly), not in real time.
 | 
Notification label in Vanta | 
What triggers it | 
Cadence
 | 
My assigned questionnaires | 
A summary of questionnaires needing your attention | 
Daily
 | 
Weekly digest of contracts synced from Ironclad | 
A summary of contracts synced from Ironclad | 
Weekly 

## Automatic system notifications (not toggle-controlled)

## 
Some Slack DMs are sent automatically by Vanta and are not controlled by a toggle in your notification settings:
 | 
Event | 
What happens
 | 
Deprovisioning task assigned | 
When an access deprovisioning task is assigned to you, Vanta sends a Slack DM with action buttons. If multiple tasks are assigned within a short window, they are combined into a single message.
 | 
Access request actions | 
When action is required on a Trust Center access request involving you, Vanta sends a Slack DM.
 | 
Questionnaire question assigned | 
When a specific question in a questionnaire is assigned to you.
 
 

## Timing and delivery behavior
- 
Most "My alerts" notifications are batched. The description in Vanta reads: "Receive an alert when certain events occur. Alerts will be batched and sent every 1 or 4 hours to avoid over-notifying you." This means you may not receive a DM the instant an event occurs.
- 
Two types are sent immediately and are labeled as such in the UI: questionnaire status changes and Trust Center access requests.
- 
Digest notifications run on a fixed schedule (daily or weekly) and are not sent in real time.
- 
Deprovisioning task notifications are batched within a short window (approximately 10 seconds) so that multiple tasks assigned at the same time arrive as a single combined message.
 

## Account matching and email requirements 
Vanta uses your email address to find your Slack account. Here is what happens when a notification is triggered:
- 
Vanta looks up your Vanta account email in your company's Slack workspace.
- 
If a Slack user with that exact email is found, Vanta sends the direct message to that account.
- 
If no match is found, the notification is silently skipped. You will not receive an error or alert — the message is simply not delivered.
What to check if the lookup is failing:
- 
Open your Vanta profile and confirm your email address.
- 
Open Slack, go to your profile, and confirm the email address listed there.
- 
The two must match exactly. If you use an email alias in one system, that will cause the lookup to fail.
- 
If your organization uses a different primary email in Slack than in Vanta, contact your Slack or IT admin to align the two accounts.
Important: There is no fallback or retry if the email lookup fails. If your emails do not match, Vanta will not notify you until the mismatch is resolved and a new notification is triggered.
 

## Troubleshooting: Not receiving Slack notifications
Work through this checklist in order if your personal Slack notifications are not arriving:
- 
Confirm your Vanta role is not set to Employee
- 
Users with the Employee role cannot see the notification settings page and do not receive personal Slack notifications.
- 
Ask your Vanta admin to check your role under Settings → Users and permissions.
- 
If your role is Employee and you need to receive assignment alerts, an admin must update your role.
- 
Confirm the admin-level Slack integration is connected
- 
Ask your Vanta admin to verify that the Slack integration is active under Settings → Company Notifications.
- 
If the integration was disconnected or the Slack app was uninstalled, no DMs can be sent to anyone. The admin will need to reconnect. See Setting Up Slack Notifications.
- 
Confirm your Slack toggle is enabled
- 
Go to Settings → Notifications (under "My account" in the sidebar).
- 
In the My alerts section, check that the Slack toggle is enabled for the relevant notification type (for example, "When I am assigned ownership of an item").
- 
If it is disabled, enable it and wait for the next triggering event.
- 
If you do not see a Slack column at all, the admin has not yet connected Slack at the company level.
- 
Confirm your email addresses match
- 
Compare the email on your Vanta account with the email on your Slack account.
- 
They must be identical. A mismatch causes the notification to be silently skipped.
- 
If they differ, update one to match the other, or contact your IT admin.
- 
Confirm your Slack account is active
- 
Verify that your Slack account has not been deactivated.
- 
Notifications sent to deactivated Slack accounts are silently dropped.
- 
If your account was recently reactivated, it will resume receiving messages on the next triggering event.
- 
Confirm the triggering event actually occurred
- 
Check in Vanta whether the question or task you expected a notification for is genuinely assigned to you.
- 
Assignment notifications are only sent at the moment of assignment. If you were already assigned before the Slack integration was enabled, or before you enabled your Slack toggle, you will not receive a retroactive notification.
- 
Allow time for batching
- 
Most alerts in the "My alerts" section are batched and sent every 1 or 4 hours. If you just triggered an event, the notification may not arrive for up to 4 hours.
- 
Notifications explicitly marked "(Sent immediately)" in the UI are the exception and should arrive promptly.
- 
Digest notifications (daily or weekly summaries) follow their own schedule.
- 
Confirm the notification type supports Slack for your plan
- 
Not all notification types have a Slack toggle. Some are email-only.
- 
Additionally, some Slack toggles are only visible if your company has certain features enabled (for example, Questionnaire Automation Advanced, Vendor Risk Management, or the Compliance platform). If you don't see a Slack toggle for a specific notification type, it may not be available on your current plan.
- 
If none of the above resolves it
- 
Contact your Vanta admin and ask them to verify the Slack integration status under Settings → Company Notifications. If the Slack app token has been revoked, they will need to reconnect the integration via a fresh OAuth flow.
If the Slack app token has been revoked (for example, due to a Slack workspace policy change), the admin will need to reconnect the integration. Token revocation stops all Slack notifications for the entire organization until the admin completes a fresh OAuth connection.
 

## FAQs

## 
Q: Does each user need to connect their own Slack account?
A: No. The company-level integration handles everything. There is no per-user Slack authentication step.
 
Q: What if my Slack email is different from my Vanta email?
A: You won't receive DMs. Update one to match the other, or ask your IT admin to align the two.
 
Q: Why don't I see a Slack column on my notification settings page?
A: Either your admin has not connected Vanta to Slack yet, or your user role is set to Employee (which does not have access to this page).
 
Q: Why don't I see a specific notification type on my page?
A: Some notification types are only available with certain Vanta features or plans. For example, questionnaire-related Slack toggles require Questionnaire Automation Advanced, and vendor-related toggles require Vendor Risk Management.
 
Q: I enabled my Slack toggle but haven't received anything yet. Is it broken?
A: Not necessarily. Most alerts are batched and sent periodically. Wait for the next batch cycle after a triggering event occurs. If you still don't see anything after several hours, work through the troubleshooting checklist above.
 
Q: Can I get DMs via Microsoft Teams instead of Slack?
A: Personal DM notifications are currently available via Slack and email. Microsoft Teams is supported for company-level channel notifications but not for personal DMs to individual users.

## Images

- none
