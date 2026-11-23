# Dixa Integration Guide

Source: https://help.drata.com/en/articles/9300568-dixa-integration-guide
Collection: Connection Support › Other Guidance
Updated: 2026-03-04
Fetched: 2026-11-22
Description: Learn how to connect Dixa to Drata. This connection supports the following types: User Access Reviews (UAR).

## Article text

The **Dixa integration** enables security and compliance teams to automate **User Access Reviews (UAR)** by syncing user access data directly from Dixa. This helps organizations review who has access to Dixa and maintain accurate access records for compliance monitoring.

---

## Key Capabilities

- **User Access Review Data Sync:** Import Dixa user account data into Drata
- **Access Governance:** Monitor which users have access to your Dixa environment
- **Compliance Monitoring:** Maintain visibility into system access to support audit and compliance workflows

This integration supports **User Access Review workflows**, helping demonstrate compliance with **access control policies**.

---

## Prerequisites & Data Access

### Dixa Access Requirements

- You must have the **Administrator role** in your **Dixa account**.
- You must generate a **Dixa API token**.

### Drata Role Requirements

- To create or modify connections, you must have one of the following **Drata roles with write access**: Admin, Workspace Manager, or DevOps Engineer
- **Access Reviewers** can view the connection page but cannot create or modify connections

---

### Permissions & Required Access

| Permission / Access | Why It’s Needed |
|---|---|
| API Token | Allows Drata to authenticate and retrieve user access data from Dixa |

---

## Step-by-Step Setup

### Step 1: Generate a Dixa API Token

1. Log in to your **Dixa account**.
2. Navigate to the **API token management** section.
3. Generate a new **API token**.
4. Copy the generated **API token** and store it securely.

For detailed instructions, refer to the **[Dixa documentation on creating API tokens](https://docs.dixa.io/docs/tutorial-create-an-api-token)**.

Expected outcome:
You have generated the **Dixa API token** required for the integration.

---

### Step 2: Connect Dixa in Drata

1. Log in to **Drata** → go to the **Connections** page.
2. Navigate to your **Available Connections**.
3. Search for and start the **Dixa connection process**.
4. Enter the **API token** when prompted.

Expected outcome:
Dixa is successfully connected and user access data begins syncing to Drata.

---

## Important Notes

- **Authentication method:** The Dixa integration uses an **API token**.
- **Security best practice:** Store API tokens securely and rotate them according to your organization’s security policies.
- **Network restrictions:** If your organization uses a **Web Application Firewall (WAF)**, ensure required Drata IP addresses are allowlisted so the connection can be established.

## Related articles

- [Segment Integration Guide](segment-integration-guide.md)
- [Pinpoint Integration Guide](pinpoint-integration-guide.md)
- [Dialpad Integration Guide](dialpad-integration-guide.md)
- [Vercel Integration Guide](vercel-integration-guide.md)
- [Toggl Integration Guide](toggl-integration-guide.md)
