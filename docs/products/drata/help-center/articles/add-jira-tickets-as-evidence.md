# Add Jira Tickets as Evidence

Source: https://help.drata.com/en/articles/13444265-add-jira-tickets-as-evidence
Collection: Understand the Drata Platform › Evidence
Updated: 2026-11-09
Fetched: 2026-11-22
Description: Use Jira tickets as evidence to demonstrate how compliance and security work is tracked and completed.

## Article text

### Overview

Many compliance and security activities are managed in Jira. Drata allows you to link closed Jira tickets as evidence in the Evidence Library so auditors can review proof of work without leaving Drata.

Jira tickets help demonstrate remediation, investigation, or approval activities tied to controls.

## Prerequisites

Make sure the following requirements are met:

- **Drata roles: **You must have one of these roles.
   - Admin
   - Information Security Lead
   - Workspace Manager
   - Control Manager
- **Jira connection:** Jira must be connected to Drata. Refer to **[Connecting Jira to Drata](jira-integration-guide.md)** for setup instructions.
- **Ticket requirements:**
   - The Jira ticket must be **closed** before it can be added as evidence.
   - Any attachments on the ticket must be **under 25 MB**.

## Add a Jira ticket as evidence

1. Go to **Compliance > Evidence**.
2. Select **Create Evidence**.
3. Enter a **name** and **description** for the evidence.
4. For **Source**, select **Ticketing provider**.
   - Enter the **Jira ticket URL** using this format: `https://your-domain.atlassian.net/browse/PROJ-123`.
      - The Jira ticket must belong to a Jira account that's already connected to Drata.
   - Enter a **creation date** and **renewal date**.
      - Renewal dates determine whether the linked control remains ready.
   - Enter the owner.
5. (Optional) Link the evidence to one or more controls by selecting **Link control**.
6. Select **Save**.

The Jira ticket is added to the Evidence Library and can now contribute to control readiness.

## View or update Jira ticket evidence

1. Go to **Compliance > Evidence**.
2. Use filters to narrow the **Source** to **Ticket**.
3. Select the evidence item to open its details.
4. In the **Current artifact** section, you can:
   - Update creation or renewal dates
   - Open the Jira ticket
   - Download a ZIP file containing the ticket PDF and attachments
5. Previous versions appear in the **Past artifacts** tab.

## Related articles

- [Evidence Overview](evidence-overview.md)
- [Create Evidence](create-evidence.md)
- [Managing Evidence in Drata Training Video (New Experience)](managing-evidence-in-drata-training-video-new-experience.md)
- [Section 5: Evidence Owners](section-5-evidence-owners.md)
- [Bulk Import Evidence](bulk-import-evidence.md)
