# Work in a Fieldguide-connected audit in Audit Hub

Source: https://help.drata.com/en/articles/15436045-work-in-a-fieldguide-connected-audit-in-audit-hub
Collection: The Auditor Experience
Updated: 2026-06-09
Fetched: 2026-11-22

## Article text

## Overview

After your audit is connected, requests from the linked Fieldguide engagement appear in Audit Hub so you can manage evidence and customer-side collaboration in Drata.

Fieldguide remains the source of truth for request creation and request statuses. Drata remains the source of truth for evidence.

## Identify a connected audit

A connected audit shows Fieldguide as the connected audit tool and displays the linked connection state in the audit header.

## Understand request statuses and sync behavior

For connected requests, the linked Fieldguide workflow controls the request status lifecycle.

This matters because uploading evidence in Drata does not send it to Fieldguide immediately. Evidence is sent when the request reaches the correct status transition for sync.

The key behavior to understand is:

- attaching evidence in Drata prepares the evidence on the Drata side.
- moving the linked request from **New** to **Prepared** in Audit Hub triggers the mapped handoff to **Ready for Review** in Fieldguide.
- if the auditor sends the request back with changes requested, that status change syncs back to Audit Hub so you can continue working in Drata.

## Add evidence to a request

Use Audit Hub to add and manage evidence for linked requests.

Remember that evidence sync is tied to request status, not just file upload. If you add evidence but do not move the request to the correct state, that evidence will not be sent to Fieldguide yet.

You can also exclude evidence from a linked request if you do not want it included in the Fieldguide handoff. Excluded evidence is not sent to Fieldguide when the request reaches the sync status.

## Understand comments and messages

New comments on linked requests sync between Fieldguide and Audit Hub. That means:

- if you add a new comment in Audit Hub, it syncs to Fieldguide.
- if a new comment is added in Fieldguide, it syncs to Audit Hub.
- attribution can vary between systems depending on who posted the comment and how that user is represented in Fieldguide.

## Understand connection health states

The connected audit header can show health states such as **Connected**, **Disconnected**, or **Error** for the linked Fieldguide connection.

Use these states to understand whether sync is currently healthy:

- **Connected** means the integration is active and available for normal sync behavior.
- **Disconnected** means the connection is no longer active and sync may be paused until it is fixed.
- **Error** means there is a problem with the connection configuration or token, and the integration needs attention before sync can continue normally.

## Troubleshooting

### I added evidence, but it is not in Fieldguide yet

Check the request status in Audit Hub. Evidence is not pushed just because it was attached. It is sent when the request reaches the correct sync status transition.

### I do not see a comment from Fieldguide in Audit Hub

New comments should sync, but attribution can vary depending on who posted the comment and how that user is represented in Fieldguide.

### The audit shows a connection warning

Review the linked Fieldguide connection in **Settings > Connections** and re-test the connection or update the token if needed.

## Related articles

- [What auditors need to do for the Drata + Fieldguide integration](what-auditors-need-to-do-for-the-drata-fieldguide-integration.md)

## Related articles

- [Understanding the Drata + Fieldguide Integration](understanding-the-drata-fieldguide-integration.md)
- [Pre-Audit Checklist: How to Prepare for Your Audit with Drata](pre-audit-checklist-how-to-prepare-for-your-audit-with-drata.md)
- [Set up the Drata + Fieldguide integration in Audit Hub](set-up-the-drata-fieldguide-integration-in-audit-hub.md)
- [What auditors need to do for the Drata + Fieldguide integration](what-auditors-need-to-do-for-the-drata-fieldguide-integration.md)
- [Map audit requests to DCF controls with AI](map-audit-requests-to-dcf-controls-with-ai.md)
