# What auditors need to do for the Drata + Fieldguide integration

Source: https://help.drata.com/en/articles/15436084-what-auditors-need-to-do-for-the-drata-fieldguide-integration
Collection: The Auditor Experience
Updated: 2026-06-09
Fetched: 2026-11-22

## Article text

## Overview

Use this article when your firm wants to run the audit in Fieldguide while your client works in Drata Audit Hub.

In the new Fieldguide integration flow, the client creates the Fieldguide connection in Drata. As the auditor, you are still responsible for preparing the client for setup and making sure they select the correct Fieldguide engagement.

## What the auditor is responsible for

As the auditor, you should:

- decide which Fieldguide engagement should be linked to the client’s Drata audit.
- invite the client to Fieldguide so they can access the correct engagement on the Fieldguide side.
- tell the client which auditor or firm alias to use when naming the Drata connection so it is easy to identify later.
- tell the client which Fieldguide engagement to select in Drata when they create the connected audit.
- continue managing the audit engagement and request lifecycle in Fieldguide after the connection is live.

## Before you begin

Before you start, make sure that:

- the audit engagement is ready in Fieldguide.
- your client has been invited to Fieldguide and can access it.
- your client knows the name of your firm or the alias they should use when setting up the connection in Drata.
- your client knows exactly which Fieldguide engagement to select in Drata when they create the connected audit.

## Step 1: Invite your client to Fieldguide

Invite your client to Fieldguide before asking them to create the connection in Drata. They must sign in to Fieldguide to generate the API token they will use for the connection in Drata.

## Step 2: Explain how the client gets a Fieldguide token

Tell your client to sign in to Fieldguide, generate an API token, and paste that token into the new Fieldguide connection in Drata. Because the client creates the connection, remind them to treat the API token like any other credential and store it securely. Clients can typically find API token management in Fieldguide’s **Integrations** area under custom integrations.

## Step 3: Tell the client how to name the connection in Drata

If your firm uses Fieldguide for multiple audit engagements, or if the client works with multiple auditors who use Fieldguide, the client should create a separate Fieldguide connection for each auditor or audit firm.

Ask the client to name the Drata connection using your auditor or firm name so they can easily choose the correct connection later.

Examples:

- Sensiba Fieldguide
- EY Fieldguide
- Johanson Group Fieldguide

## Step 4: Tell the client which engagement to select in Drata

When the client creates the connected audit in Drata, they will:

- choose **Connected audit tool**.
- select the Fieldguide connection by the alias they created for your firm.
- choose the Fieldguide engagement that matches the audit you are running.

Make sure the client knows exactly which engagement to select so the correct requests sync into Audit Hub.

## Step 5: Work in Fieldguide after the connection is live

After the audit is connected:

- requests continue to be managed in Fieldguide.
- request statuses continue to be driven by the Fieldguide workflow.
- the client works in Drata to manage evidence and customer-side request collaboration.
- new comments on linked requests sync between Fieldguide and Drata.

If you send a request back for additional work, that status change should sync back to Audit Hub so the client can continue working in Drata.

## What to tell clients about evidence and comments

Set expectations early:

- uploading evidence in Drata does not send it to Fieldguide immediately.
- evidence is sent when the linked request reaches the correct sync status transition in Drata.
- new comments on linked requests sync between Fieldguide and Audit Hub.
- comment attribution can vary between systems depending on who posted the comment and how that user is represented in Fieldguide.

## Troubleshooting

### The client cannot create a connected audit

Ask the client to confirm that they already created a Fieldguide connection in Drata under **Settings > Connections**.

### The client does not know which connection to choose

Tell the client to choose the Fieldguide connection using the alias that matches your auditor or firm name.

### The wrong requests are syncing

Confirm that the client selected the correct Fieldguide engagement during audit creation.

### Comments look different in Drata than in Fieldguide

New comments should sync, but attribution can vary depending on whether the comment was posted by an auditor or by a client-side Fieldguide user.

## Related articles

- [Understanding the Drata + Fieldguide Integration](understanding-the-drata-fieldguide-integration.md)

## Related articles

- [Understanding the Drata + Fieldguide Integration](understanding-the-drata-fieldguide-integration.md)
- [Access Drata as an auditor (New Experience)](access-drata-as-an-auditor-new-experience.md)
- [Section 5: Drata for Auditors](section-5-drata-for-auditors.md)
- [Set up the Drata + Fieldguide integration in Audit Hub](set-up-the-drata-fieldguide-integration-in-audit-hub.md)
- [Work in a Fieldguide-connected audit in Audit Hub](work-in-a-fieldguide-connected-audit-in-audit-hub.md)
