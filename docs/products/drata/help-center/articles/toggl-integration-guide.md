# Toggl Integration Guide

Source: https://help.drata.com/en/articles/10595224-toggl-integration-guide
Collection: Connection Support › Other Guidance
Updated: 2026-03-04
Fetched: 2026-11-22
Description: Learn how to connect Toggl to Drata. This connection supports the following types: User Access Reviews (UAR).

## Article text

The **Toggl integration** enables security and compliance teams to automate **User Access Reviews (UAR)** by syncing user access data directly from Toggl. This helps organizations review who has access to Toggl and maintain accurate access records for compliance monitoring.

---

## Key Capabilities

- **User Access Review Data Sync:** Import Toggl user account data into Drata
- **Access Governance:** Monitor which users have access to your Toggl organization
- **Compliance Monitoring:** Maintain visibility into system access to support audit and compliance workflows

This integration supports **User Access Review workflows**, helping demonstrate compliance with **access control policies**.

---

## Prerequisites & Data Access

### Toggl Access Requirements

- You must have **Admin privileges** in your **Toggl account**.
- You must generate a **Toggl API token**.
- You must retrieve your **Toggl Organization ID**.

### Drata Role Requirements

- To create or modify connections, you must have one of the following **Drata roles with write access**: Admin, Workspace Manager, or DevOps Engineer
- **Access Reviewers** can view the connection page but cannot create or modify connections

---

### Permissions & Required Access

| Permission | Why It’s Needed |
|---|---|
| API Token | Authenticates the integration and allows Drata to retrieve user access data |
| Organization ID | Identifies the Toggl organization being connected |

---

## Step-by-Step Setup

### Step 1: Generate a Toggl API Token

1. Log in to your **Toggl Track account**.
2. Navigate to your **Profile Settings**.
3. Scroll to the **API Token** section.
4. If an API token has not yet been created, select the option to **generate a token**.
5. Copy the **API Token** and store it securely.

Expected outcome:
You have generated the **Toggl API Token** required for the integration.

---

### Step 2: Retrieve Your Toggl Organization ID

1. In Toggl Track, navigate to **Members** under the **Manage** section in the left navigation menu.
2. Look at the URL in your browser.
   - Example:
      ```
https://track.toggl.com/organization/organization-id/team
      ```
3. Copy the value shown in place of **organization-id**.

Expected outcome:
 You have copied the **Toggl Organization ID** required for the connection.

---

### Step 3: Connect Toggl in Drata

1. Log in to **Drata** → go to the **Connections** page.
2. Navigate to your **Available Connections**.
3. Search for and start the **Toggl connection process**.
4. Enter the following information when prompted:
   - **API Token**
   - **Organization ID**

Expected outcome:
Toggl is successfully connected and user access data begins syncing to Drata.

---

## Important Notes

- **Authentication method:** The Toggl integration uses an **API token**.
- **Security best practice:** Store API tokens securely and rotate them according to your organization’s security policies.
- **Network restrictions:** If your organization uses a **Web Application Firewall (WAF)**, ensure required Drata IP addresses are allowlisted so the connection can be established.

## Related articles

- [Segment Integration Guide](segment-integration-guide.md)
- [Dialpad Integration Guide](dialpad-integration-guide.md)
- [Gong Integration Guide](gong-integration-guide.md)
- [Vercel Integration Guide](vercel-integration-guide.md)
- [OpenVPN Integration Guide](openvpn-integration-guide.md)
