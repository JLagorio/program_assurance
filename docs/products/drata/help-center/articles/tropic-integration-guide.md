# Tropic Integration Guide

Source: https://help.drata.com/en/articles/16765259-tropic-integration-guide
Collection: Understand the Drata Platform › Vendors › Procurement Connections
Updated: 2026-11-16
Fetched: 2026-11-22

## Article text

Effective vendor management is a cornerstone of a robust security and compliance program, especially for audits like SOC 2 and ISO 27001. Drata’s Tropic connection imports the suppliers that are named on purchase requests in Tropic into your Drata vendor registry. A supplier that isn’t named on any purchase request isn’t imported.

This article explains how the integration works, how vendors are matched against your existing registry, how often the sync runs, and how to set it up.

## Prerequisites

Before you start, you need the following from Tropic:

- A Tropic API key. For instructions, see [Tropic’s Getting Started with the Tropic API and Webhooks](https://help.tropicapp.io/hc/en-us/articles/31190653050139-Getting-Started-with-the-Tropic-API-and-Webhooks#h_01JDAE0MV7R7DJJ831GK260HAH).
- Permission to register a webhook in your Tropic workspace.
- A Tropic user account that can comment on tasks and upload security review summaries. Drata uses this account to post on your Tropic purchase requests.

**Additional information**

- You can use Dry Run Mode in Drata to preview what would sync before any vendor records are created or updated. Turn it off when you’re ready to apply the changes.

## Set up the integration in Drata

The setup has three steps: Configure, Webhook, and Connect.

1. In Drata, select **Connections** in the left sidebar, and then select the **Available** tab.
2. Search for **Tropic** and select it. You can also use the **Procurement** filter.

### Step 1: Configure

In **Workspaces assigned**, select one or more workspaces for this connection. You must select at least one. Then select **Next**.

### Step 2: Webhook

A webhook lets Tropic notify Drata when a purchase request task changes status. You’ll work in both Drata and Tropic. Keep the Drata setup page open while you do this.

1. In Drata, copy the Webhook URL shown on this step.
2. Create the webhook in Tropic:
   - Paste the Webhook URL you copied from Drata into the endpoint URL field.
   - Enable the `purchase_request_task.status_changed` permission, so Tropic notifies Drata when a purchase request task’s status changes.
   - Save the webhook, and then copy its signing secret.
   - For help, see [Tropic’s Getting Started with the Tropic API and Webhooks](https://help.tropicapp.io/hc/en-us/articles/31190653050139-Getting-Started-with-the-Tropic-API-and-Webhooks#h_01JDAE0MV7NR5XPAKK2RBDWXG1).
3. In Drata, paste the signing secret into **Webhook Secret**. This is the HMAC signing secret that Drata uses to verify incoming webhook payloads. This field is required.

### Step 3: Connect

Enter the following values:

- **API Key**: Paste the Tropic API key you created. Make sure you enable Read and Write permissions.
- **Domain**: The Tropic environment that matches your API key.
   - The default is `app.tropicapp.io`.
   - If you use a sandbox environment for testing, enter its domain, for example `sandbox.tropicapp.io`.
   - If you’re unsure which to use, ask your Tropic admin. Required.
- **Purchase Request Categories** (optional): A comma-separated list of Tropic category names, for example `SaaS, Marketing Tools`.
   - Leave blank to import suppliers from all purchase requests.
- **Workflow Step Name** (optional): The name of the Tropic workflow task where Drata creates security reviews and posts results.
   - Enter the task’s **Task Name** exactly as it appears in Tropic.
   - If you leave this empty, Drata uses `security approval`.
- **Tropic user email**: The email of the Tropic user that Drata uses to comment on tasks and upload security review summaries on purchase requests
- **Dry Run Mode**: Selected by default. Leave it on to preview the sync without creating or changing vendors. Clear it when you’re ready for Drata to create and update vendor records.

## Customization options

- **Adjusting settings after setup: **Open the connection from Active Connections at any time to update the connection details.
- **Field mapping: **The mapping Drata generates on the first sync is saved to your connection, so it can be adjusted if you want a Tropic field to land somewhere different in Drata.

## How the integration works

Drata’s Tropic connection imports the suppliers named on purchase requests in Tropic into your Drata vendor registry. Each time it syncs, Drata does the following:

1. **Connects to Tropic.** Drata uses the information you entered during the connection process to read your purchase requests from Tropic and collect the suppliers named on them.
2. **Filters by category.** If you set Purchase Request Categories, Drata reads only the purchase requests in those categories and imports the suppliers named on them.
3. **Maps fields.** By default, Drata maps each supplier’s name, website, risk level, and business use case (to services provided). It sets the vendor type to Software.
4. **Matches vendors.** Drata checks each supplier against your existing vendors to decide whether to update one or create a new one.
5. **Previews or applies.** While Dry Run Mode is on, Drata doesn’t create or update any vendors. When you turn it off, Drata creates and updates vendors and records the Tropic supplier ID for each vendor.
6. **Adds contact details.** Drata gets each supplier’s contact information from Tropic and adds the first contact’s email to the vendor.
7. **Repeats.** The sync runs again automatically. For timing, see [How often the sync runs](#h_71d77db1a8).

### Field mapping

Drata applies a default field mapping. On the first sync, it fills any remaining unmapped fields with AI-suggested mappings, so you don’t have to configure mapping to get started. Drata saves the mapping to your connection, and you can adjust it later.

### Link back to Tropic

Each synced vendor keeps a link to its Tropic supplier record. You can go from the vendor in Drata to the original request in Tropic.

## How vendors are matched to your existing registry

Drata compares each supplier from Tropic with the vendors already in your registry. If it finds a match, it updates that vendor. If it doesn’t, it creates a new vendor.

By default, Drata checks in the following order and stops at the first match:

1. **Tropic supplier ID.** If Drata synced this supplier before, it uses the Tropic ID to find the vendor it created. This is the most reliable check. Renaming a supplier in Tropic updates your existing vendor and doesn’t create a second one. IDs are specific to this connection.
2. **Exact name.** The supplier name is identical to an existing vendor name.
3. **Website.** The supplier’s website matches an existing vendor’s website after Drata simplifies both.
4. **Simplified name.** The names match after Drata simplifies them.
5. **Close name match.** Drata scores how similar the simplified names are. If the score is very high, Drata treats them as the same vendor. If it’s moderate, Drata doesn’t merge them and records a possible match.
6. **AI review.** For moderate matches, Drata asks an AI model whether the two names refer to the same company. If the model confirms it, Drata merges the records.

When a supplier matches an existing vendor, Drata updates that vendor. Any field that Tropic doesn’t provide keeps its current value. Drata records how each supplier was matched, including suppliers that matched nothing.

**Things to know**

- The first sync has no Tropic IDs to use, so it relies on the other checks. After that, suppliers that Drata already matched are found by their Tropic ID.
- If two suppliers in Tropic have exactly the same name in one sync, Drata treats them as one record. If they’re different vendors, give them different names in Tropic.

## How often the sync runs

The Tropic sync runs automatically every 24 hours. The 24 hours count from the end of the previous sync, not from a fixed time of day.

**Timing**

- **Duration.** The time depends on how many suppliers you have. Drata reads Tropic’s data in pages and keeps within Tropic’s rate limits. It then makes one more request per supplier to get contact details. For about 1,000 suppliers, getting contact details can take about half an hour.
- **New suppliers.** A supplier appears in Drata on the next scheduled sync after it’s named on a purchase request in Tropic.
- **Webhook.** The supplier sync is scheduled. The webhook is separate. It only tells Drata when a purchase request task’s status changes.

## Related articles

- [Slack Integration Guide (Communication and UAR)](slack-integration-guide-communication-and-uar.md)
- [Vetty Integration Guide](vetty-integration-guide.md)
- [Integrate Zip with Drata Vendor Management](integrate-zip-with-drata-vendor-management.md)
- [Ironclad Integration Guide (Procurement)](ironclad-integration-guide-procurement.md)
- [Ramp Integration Guide](ramp-integration-guide.md)
