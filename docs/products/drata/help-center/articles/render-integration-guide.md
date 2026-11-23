# Render Integration Guide

Source: https://help.drata.com/en/articles/9769676-render-integration-guide
Collection: Connection Support › Other Guidance
Updated: 2026-03-04
Fetched: 2026-11-22
Description: Learn how to connect Render to Drata. This connection supports the following types: User Access Reviews (UAR).

## Article text

The **Render integration** enables security and compliance teams to automate **User Access Reviews (UAR)** by syncing user access data directly from Render. This helps organizations review who has access to Render and maintain accurate access records for compliance monitoring.

---

## Key Capabilities

- **User Access Review Data Sync:** Import Render user access data into Drata
- **Access Governance:** Monitor which users have access to your Render organization
- **Compliance Monitoring:** Maintain visibility into system access to support audit and compliance workflows

This integration supports **User Access Review workflows**, helping demonstrate compliance with **access control policies**.

---

## Prerequisites & Data Access

### Render Access Requirements

- You must have **Admin privileges** in your **Render organization**.
- You must generate a **Render API key**.

### Drata Role Requirements

- To create or modify connections, you must have one of the following **Drata roles with write access**: Admin, Workspace Manager, or DevOps Engineer
- **Access Reviewers** can view the connection page but cannot create or modify connections

---

## Step-by-Step Setup

### Step 1: Retrieve Your Render Team ID

1. Log in to your **Render account**.
2. Navigate to your **Team Settings** page.
3. Look at the URL in your browser.
   - Example: `https://dashboard.render.com/teams/tea-abc123/settings`
4. Copy the value after `/teams/`. This is your **Team ID**.
   - Example Team ID: `tea-cppjs19ds78s73ea4vq0`

Expected outcome:
You have copied your **Render Team ID**, which will be used to connect Render to Drata.

---

### Step 2: Connect Render in Drata

Log in to **Drata** → go to the **Connections** page.

Navigate to your **Available Connections**.

Search for and start the **Render connection process**.

Enter the following information when prompted:

- **Team ID**
- **Team Admin Email**
- **Team Admin Password**

Expected outcome:
Render is successfully connected and user access data begins syncing to Drata.

## Related articles

- [Webex Integration Guide](webex-integration-guide.md)
- [Bullhorn Integration Guide](bullhorn-integration-guide.md)
- [Vercel Integration Guide](vercel-integration-guide.md)
- [Toggl Integration Guide](toggl-integration-guide.md)
- [Kameleoon Integration Guide](kameleoon-integration-guide.md)
