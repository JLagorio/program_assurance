# Notifications and notification settings

Source: https://help.vanta.com/en/articles/11345394-notifications-and-notification-settings
Fetched: 2026-11-17

**Purpose**: how Vanta tells owners and employees what needs attention (email, Slack, Microsoft Teams), the two kinds (alerts, digests), the two destinations (account, company) and the schedule.

## The steps

1. Email: no setup; on by default; a reminder every Monday for incomplete tasks (people added mid-week get theirs the next Monday). Weekly or daily schedule in notification settings. Allow-list the sender if mail is filtered.
2. Slack: off by default → Settings → Company notifications → Slack card → **Connect to Slack** (a Slack admin grants permissions to list channels and post).
3. Microsoft Teams: off by default → Settings → Company notifications → **Connect to Teams**.
4. Each user: Settings → My Account → **Notifications** (Account notifications page): toggle each alert and pick its channel (Email; Slack DM matched by email; no Teams DMs); toggle email digests.
5. Company: Settings → Company → **Notifications**: Schedule (Allow notifications Anytime / Every day between 9am and 6pm in a time zone), Personnel reminders (Every Monday / Every weekday), External notifications per category.

## Layout

notifications-and-notification-settings-01 (email digest): Vanta mark; "A summary of all items requiring your attention"; "Please review the following items to help you stay compliant and secure."; "Employee Summary": 6 tests need attention on Tests; 29 employees need to complete security tasks on People; 39 employees need to be offboarded on People; 21 documents missing on Documents (each page name a link).

notifications-and-notification-settings-02 (Slack card): header "Slack"; plug icon; "Authorize Vanta to get started"; "An admin on your Slack account needs to grant permissions for Vanta to receive the list of channels and post notifications to the selected channels."; Learn more, Connect to Slack (primary).

notifications-and-notification-settings-03 (Teams card): the same for "Microsoft Teams"; Learn more, Connect to Teams.

notifications-and-notification-settings-04 (Slack alert): "Vanta APP 11:57 AM", "Alert: 1 automated test without an owner needs attention"; group "1 Employee test"; item "Slack accounts deprovisioned when employees leave" with "Some Slack accounts associated with ex-employees were not deprovisioned within your company's specified SLA." and an "Open" button.

notifications-and-notification-settings-05 (Slack digest, captioned in the article as "example alert sent to Slack"): "A summary of all items requiring your attention"; sections Employee Summary (6 tests need attention on Tests; 29 employees … security tasks on People; 39 … offboarded on People; 21 documents missing on Documents), Engineering Summary (8 ECR containers approaching SLA on Vulnerabilities; 1 EC2 instance approaching SLA on Vulnerabilities; 47 documents missing; 3 documents need update), Policy Summary (17 policy tests need attention on Tests; 3 policies missing on Policies; 19 documents missing; 2 documents need update), Risks Summary (1 risk test needs attention on Tests; 6 documents missing on Documents).

notifications-and-notification-settings-06 (My account notifications):
- Title "My account notifications".
- Settings sub-nav: COMPANY (Notifications, User permissions, Roles, Information, Login and security, Billing ↗, Frameworks, Language, Developer console, Advanced); MY ACCOUNT (Notifications — highlighted, GraphQL API tokens, Language, Interface).
- Card "My alerts": "Receive an alert when certain events occur. Alerts will be batched and sent every 1 or 4 hours to avoid over-notifying you." Ten toggles: automated test I own needs attention; document I own needs to be updated; I am assigned ownership of an item (on, channel "Email"); Trust Center access request received (Sent immediately); Access Review assigned to me needs attention; personalized updates on Access Reviews; new procurement request submitted; vendor owner needs to be reassigned; risk task assigned to me needs attention ("An alert will be sent 7 days before the task is due and when the task becomes overdue"); comment added to a thread I am part of (on, "Email").
- Card "Email digests": toggles "My assigned controls", "My assigned risk scenarios", …

notifications-and-notification-settings-07 (company Schedule card): "Schedule — Configure when Test, Document, and Control owners should be notified about failures."; "Allow notifications": Anytime / Every day between 9am and 6pm in "GMT-4 America/New York" (selected).

## Flow edges

- Settings → Company → Notifications (Schedule, Personnel reminders, External notifications, Slack/Teams cards)
- Settings → My Account → Notifications (My alerts, Email digests)
- Slack alert → Open → the test (inferred)
- digest line → Tests / People / Documents / Policies / Vulnerabilities

## Actions

Connect to Slack · Connect to Teams · Learn more · toggle an alert · choose channel (Email / Slack) · toggle a digest · choose schedule (Anytime / Every day 9–6 / Every Monday / Every weekday / daily) · Open

## Vocabulary

Alerts · Immediate alerts (batched every 4 hours; the page says 1 or 4) · Digests / Summaries · Account notifications · Company notifications · Personnel reminders · External notifications · needs attention · approaching SLA · documents missing · documents need update · owner · Notification for Policy Tasks · Notifications for Security Tasks Based on SLAs

## Screenshots

- notifications-and-notification-settings-01.png: email digest, Employee Summary with four linked counts.
- notifications-and-notification-settings-02.png: Slack connect card.
- notifications-and-notification-settings-03.png: Microsoft Teams connect card.
- notifications-and-notification-settings-04.png: Slack alert for one unowned automated test, with Open.
- notifications-and-notification-settings-05.png: Slack digest by category (Employee, Engineering, Policy, Risks).
- notifications-and-notification-settings-06.png: My account notifications, My alerts toggles with channel picker, Email digests.
- notifications-and-notification-settings-07.png: company Schedule card, working-hours window with time zone.

## For Program Assurance

- A digest is a list of "N <things> <state> on <page>" lines grouped by area, each count linking to the register that holds them; that is the shape for a weekly RMF summary (controls with no evidence, POA&M items approaching due, documents missing).
- Alerts are owner-scoped ("a test I own", "assigned to me") with one toggle and one channel per event, batched to avoid noise.
- Reminders tie to an SLA: start before the due date, again when overdue (7 days before and at overdue for risk tasks).
