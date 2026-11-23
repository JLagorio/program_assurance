# Justworks Integration Guide

Source: https://help.drata.com/en/articles/5216094-justworks-integration-guide
Collection: Connection Support › Other Guidance
Updated: 2026-10-23
Fetched: 2026-11-22
Description: Learn how to connect Justworks to Drata. This connection supports the following types: HRIS.

## Article text

The **Justworks integration** enables security and compliance teams to automatically synchronize employee data from Justworks. This allows Drata to collect evidence related to personnel hire dates, termination dates, and employment status to support compliance monitoring and audit readiness.

---

## Key Capabilities

- **Employee Data Sync:** Import employee records from Justworks
- **Lifecycle Monitoring:** Track employee hire dates, termination dates, and employment status
- **Compliance Automation:** Automatically collect HRIS evidence to support compliance frameworks

This integration helps automate tests related to **employee lifecycle management**, supporting compliance with **HR security and access control policies**.

---

## Prerequisites & Data Access

### Justworks Access Requirements

- You must have **Admin access** in your **Justworks account**.
- You must be able to **authorize the Justworks integration during the connection process**.

### Drata Role Requirements

- To create or modify connections, you must have one of the following **Drata roles with write access**: Admin, Workspace Manager, or DevOps Engineer
- **Access Reviewers** can view the connection page but cannot create or modify connections

---

## Step-by-Step Setup

### Step 1: Connect Justworks in Drata

1. Log in to **Drata** → go to the **Connections** page.
2. Navigate to your **Available Connections**.
3. Search for and start the **Justworks connection process**.

Expected outcome:
The Justworks connection process begins in Drata.

---

### Step 2: Authorize Your Justworks Account

1. Sign in to your **Justworks account** when prompted.
2. Authorize Drata to access the required Justworks data.

Expected outcome:
Drata is authorized to access employee data from your Justworks account.

---

## Important Notes

- **Authentication method:** The Justworks integration uses **account authorization during the connection process**.
- **Credential expiration:** If the integration was previously configured using **username and password credentials**, those credentials may expire every **90 days**.
- **Recommended approach:** Use a **service account or integration authorization** when available to avoid credential expiration issues.

---

## Troubleshooting

### Sync Failures

If Justworks data is not syncing into Drata, the most common causes include:

- A **broken or interrupted API connection**
- An **invalid API token**, often missing required permissions

**How to fix**

Reset the Justworks connection in Drata to refresh the integration.

---

### API Token Becomes Invalid

API tokens may stop working if:

- Required **permissions or scopes were not enabled**
- The **token owner lost permissions or became inactive**

**How to fix**

Verify the token’s permissions in Justworks and generate a new token with the required access.

---

### Integration Won’t Reconnect After Reset

If reconnecting still fails, it may be because:

- The **API token lacks required permissions**
- **User role changes** limit access to Justworks data

**How to fix**

Verify the user who created the token still has the correct Justworks role and access level. If necessary, contact **Justworks Support** to confirm the correct permissions. If problems persist, consider contacting Drata support for further assistance.

## Related articles

- [Segment Integration Guide](segment-integration-guide.md)
- [Lever Integration Guide](lever-integration-guide.md)
- [Fivetran Integration Guide](fivetran-integration-guide.md)
- [RingCentral Integration Guide](ringcentral-integration-guide.md)
- [UKG Ready Integration Guide](ukg-ready-integration-guide.md)
