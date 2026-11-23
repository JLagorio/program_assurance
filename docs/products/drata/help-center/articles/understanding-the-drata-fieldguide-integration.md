# Understanding the Drata + Fieldguide Integration

Source: https://help.drata.com/en/articles/11504009-understanding-the-drata-fieldguide-integration
Collection: The Auditor Experience
Updated: 2026-10-20
Fetched: 2026-11-22

## Article text

## Overview

The Drata + Fieldguide integration lets your team work in Drata while your auditor works in Fieldguide for the same audit.

For connected audits, Drata links one Audit Hub audit to a specific Fieldguide engagement using a Fieldguide connection configured in **Settings → Connections**.

In this workflow:

- **Fieldguide** is the source of truth for request creation and request statuses.
- **Drata** is the source of truth for evidence.
- **Comments** on linked requests sync between Fieldguide and Audit Hub for new comments.

## How the integration works

After a Fieldguide connection is created in Drata, you can create a connected audit and select the Fieldguide engagement you want to link.

Once the audit is connected:

- Requests from the linked Fieldguide engagement appear in Audit Hub.
- The audit period is pulled from Fieldguide and becomes read-only in Drata for that connected audit.
- Assigned auditors are pulled from the linked Fieldguide engagement instead of being assigned in the normal Drata audit setup flow.

## What to expect in a connected audit

When you open a connected audit in Audit Hub, the audit shows **Fieldguide** as the connected audit tool and surfaces connection health for the linked integration.

You should use Drata to:

- upload and organize evidence for requests.
- track request progress from the customer side.
- respond to request-specific messages in Audit Hub.

Your auditor should use Fieldguide to:

- manage the engagement.
- create and review requests.
- send review feedback and request follow-up through linked requests.

### What syncs between systems

For linked requests, the integration supports:

- **Request sync** from Fieldguide into Audit Hub.
- **Status sync** based on the Fieldguide request lifecycle.
- **Evidence sync** from Drata to Fieldguide when the correct request status transition happens.
- **Comment sync** for new comments between both systems.

Comments sync between Fieldguide and Audit Hub, but full edit and delete parity is not yet supported.

When an auditor adds a comment in Fieldguide, it appears in Audit Hub and is attributed to that auditor whenever possible. When a client-side Fieldguide user adds a comment in Fieldguide, it can also appear in Audit Hub, but it may be displayed as a system-generated or Fieldguide-originated message instead of being attributed to a named Drata user.

## Before you set it up

Before you create a connected audit, confirm that:

- You can access **Settings > Connections** in Drata.
- You know which auditor or audit firm you are working with.
- You know which Fieldguide engagement to link to the audit.
- Your auditor has invited you to Fieldguide so you can sign in and generate your Fieldguide API token for the connection.

**Additional notes:**

- You can't link an audit to Fieldguide after the audit has already been created. The Fieldguide connection must be selected as part of setting up a new audit. If you've already created an audit that needs to be linked, create a new audit and follow the setup steps in [this guide](set-up-the-drata-fieldguide-integration-in-audit-hub.md).
- Each **Fieldguide engagement** should only be linked to a **single Audithub card**.
   If you notice that multiple connected audits have been created for the same engagement, please contact your **Account Manager** and our **Support team**.

## Related articles

- [Set up the Drata + Fieldguide integration in Audit Hub](set-up-the-drata-fieldguide-integration-in-audit-hub.md)

## Related articles

- [Internal audits in Drata (New Experience)](internal-audits-in-drata-new-experience.md)
- [Set up the Drata + Fieldguide integration in Audit Hub](set-up-the-drata-fieldguide-integration-in-audit-hub.md)
- [Work in a Fieldguide-connected audit in Audit Hub](work-in-a-fieldguide-connected-audit-in-audit-hub.md)
- [What auditors need to do for the Drata + Fieldguide integration](what-auditors-need-to-do-for-the-drata-fieldguide-integration.md)
- [Map audit requests to DCF controls with AI](map-audit-requests-to-dcf-controls-with-ai.md)
