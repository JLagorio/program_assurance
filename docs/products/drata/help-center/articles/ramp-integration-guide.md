# Ramp Integration Guide

Source: https://help.drata.com/en/articles/16880123-ramp-integration-guide
Collection: Understand the Drata Platform › Vendors › Procurement Connections
Updated: 2026-09-09
Fetched: 2026-11-22

## Article text

Effective vendor management is a cornerstone of a robust security and compliance program, especially for audits like SOC 2, ISO 27001, HIPAA, PCI DSS, and GDPR. Drata integrates with Ramp to connect your spend approval process directly to your compliance program — so when someone requests a new vendor in Ramp, a Drata security review starts automatically and spend can't be approved until that review is complete.

This article explains how the integration works, what it includes, how to set up the Drata side of the connection, and where to go for the Ramp-side configuration.

## BEFORE DIVING IN

- **This integration is built and maintained by Ramp.** It is configured in Ramp, using the credentials you generate in Drata. Ramp's documentation is the source of truth for the Ramp-side setup and any changes to it.
- **You must be using Drata's new experience.** Classic Drata does not support OAuth applications, which this integration requires.
- **You need admin access in both platforms** — Ramp Admin access to configure integrations and edit Programs, and Drata admin access to create an OAuth application.
- **The integration triggers for new vendors only.** Requests for vendors that already exist in Drata continue to follow your current workflow.

For full setup instructions and Ramp-side troubleshooting, see Ramp's guide: [Drata integration: Set up with Ramp Programs](https://support.ramp.com/set-up-and-use-the-drata-integration-with-ramp-programs). Reach out to Ramp Support with any questions about Ramp configuration.

## How the Integration Works

The Ramp × Drata integration closes the gap between procurement, finance, and compliance.

You add a **Drata security review** step to any Ramp Program workflow. When a spend request reaches that step, Ramp automatically creates the vendor in Drata and starts a security review. Your security team completes the review in Drata as they normally would. Once the review reaches a final decision, the result syncs back to Ramp and the spend request either advances or stops based on the outcome.

The result is that spend approval is gated on a completed security review, without manual handoffs over email, duplicate data entry between systems, or ambiguity about whether a vendor has actually been cleared.

## Step-by-Step Workflow

1. A team member submits a spend request in Ramp for a new vendor.
2. The request reaches the **Drata security review** step in your Program workflow.
3. Ramp creates the vendor record in Drata using the vendor name and URL from the request, along with any fields you've mapped.
4. Ramp starts a security review in Drata of the type you configured, with the owner and deadline you set.
5. The assigned owner receives a task on their Ramp home screen to manage the review.
6. Your security team completes and finalizes the review in Drata.
7. The decision syncs back to Ramp, and the workflow advances or stops accordingly.

## What Happens Based on the Review Decision

The decision your team records when finalizing the review in Drata determines what Ramp does with the spend request:

| **Drata decision** | **Result in Ramp** |
|---|---|
| **Approved** | The workflow advances to the next step. |
| **Approved with conditions** | The workflow advances to the next step. |
| **Rejected** | Ramp rejects the request. |

Because **Approved with conditions** advances the request, use it when you're comfortable proceeding while follow-up items remain outstanding — and record those conditions in your review rationale, internal notes, or observations so they're tracked in Drata.

## What's Included in the Integration

- **Automatic vendor creation:** Ramp creates the vendor record in Drata from the spend request — no duplicate data entry.
- **Field mapping:** Map fields from the Ramp request form to Drata vendor fields such as category, privacy URL, contact information, and compliance-related fields, so context carries through to the vendor record.
- **Selectable review type:** Choose which type of security review Ramp creates in Drata — **Security**, **SOC Report**, or **Upload Report**.
- **Owner assignment and deadlines:** Assign someone to manage the review, set a due date on the workflow step, and set the number of days the reviewer has to complete the review in Drata.
- **Reviewer instructions:** Add guidance for the reviewer on the workflow step.
- **Spend gating:** The request cannot proceed past the Drata step until the review reaches a final decision.
- **Progress visibility:** Track review status from within the Ramp request.

## Setting Up the Integration in Drata

The Drata side of setup is generating an OAuth application. Everything else is configured in Ramp.

1. Sign in to Drata using the **new experience**.
2. Go to **Settings → OAuth Applications**.
3. Select **Create OAuth Application**.
4. Under **Basic details**, enter a name — for example, Ramp — and set the expiration to **Never**.
5. Select **Next**.
6. Under **Scopes**, enable all six of the following:
   - read:event
   - read:vendor
   - create:vendor
   - update:vendor
   - create:vendor-security-review
   - read:vendor-security-review
7. Select **Save and finish**.
8. Copy the **cURL command** from the Client Secret modal that appears. Copy the entire command — Ramp extracts the token URL, client ID, client secret, and audience from it.

**Important:** The client secret is shown only once, in this modal. Copy the full cURL command before closing it. If you lose it, create a new OAuth application and use the new credentials.

Setting the expiration to **Never** keeps the connection from breaking unexpectedly. If your organization requires credential rotation, plan to create a new OAuth application and update the credentials in Ramp before the existing ones expire.

## Completing the Setup in Ramp

The remaining configuration happens in Ramp:

1. **Connect the integration.** In Ramp, go to **Automations → Integrations**, find Drata, and paste the cURL command you copied from Drata.
2. **Add the Drata step to a Program.** Open or create a Program, edit its approval workflow, and add the **Drata security review** step from the Integrations section.
3. **Configure the step.** Set the owner, instructions, due date, security review type, review deadline, and any field mappings.
4. **Save and publish the Program.**

The Drata step only appears in Ramp's workflow builder once the integration is connected.

For the detailed version of these steps, including field mapping options and troubleshooting, see [Ramp's setup guide](https://support.ramp.com/set-up-and-use-the-drata-integration-with-ramp-programs).

## How Results Sync Back to Ramp

Review results reach Ramp in one of two ways:

- **Automatic sync:** Ramp checks Drata for updates on an hourly schedule. Allow up to an hour for a completed review to appear in Ramp.
- **Manual sync:** Use the sync option on the in-progress Drata step in the Ramp workflow to refresh the status immediately.

**Note:** Drata does not currently support real-time webhook notifications for this integration, so results are retrieved through scheduled polling rather than pushed instantly. If a request is time-sensitive, use the manual sync option after finalizing the review in Drata.

## Troubleshooting

**I can't create an OAuth application in Drata**

Confirm you're signed in to Drata's new experience. Classic Drata does not support OAuth applications, and the integration cannot be connected from it.

**The vendor wasn't created in Drata**

Confirm the OAuth application has the create:vendor scope enabled, and that the vendor name on the Ramp request isn't empty.

**Results aren't appearing in Ramp**

Automatic sync runs hourly. If the review was finalized less than an hour ago, wait for the next cycle or use manual sync. If results still don't appear, confirm the OAuth application in Drata is still active and its credentials haven't been revoked.

**The request was rejected unexpectedly**

Check the decision recorded on the review in Drata. Only **Rejected** stops the request — both **Approved** and **Approved with conditions** advance it.

For Ramp-side issues — the cURL command not being accepted, the Drata step not appearing in the workflow builder, or Program configuration problems — see Ramp's [troubleshooting section](https://support.ramp.com/set-up-and-use-the-drata-integration-with-ramp-programs) or contact Ramp Support.

## FAQ

**Who builds and supports this integration?** Ramp builds and maintains it. Configuration happens in Ramp, and Ramp Support handles questions about the integration's behavior and setup. Drata supports the OAuth application and the security review itself.

**Does this work with Classic Drata?** No. The integration requires Drata's new experience, which supports OAuth applications.

**Does it trigger for every vendor request?** No — only for new vendors. Requests involving vendors that already exist continue through your existing workflow.

**What scopes does the OAuth application need?** Six: read:event, read:vendor, create:vendor, update:vendor, create:vendor-security-review, and read:vendor-security-review.

**Can I map custom fields from Ramp to Drata?** Yes. Field mappings are configured on the Drata step in your Ramp Program workflow.

**Can I disconnect the integration?** Yes — disconnect it from Ramp's connected integrations settings. You can reconnect later by creating new OAuth credentials in Drata.

**Can I build my own automation instead?** Yes. Drata's Public API is available for teams that want to build custom automations. See the [Drata Public API Documentation](https://docs.drata.com).

## Related articles

- [SmartRecruiters Integration Guide](smartrecruiters-integration-guide.md)
- [Bullhorn Integration Guide](bullhorn-integration-guide.md)
- [RingCentral Integration Guide](ringcentral-integration-guide.md)
- [Smartsheet Integration Guide](smartsheet-integration-guide.md)
- [Box Integration Guide](box-integration-guide.md)
