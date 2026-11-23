# Segment Integration Guide

Source: https://help.drata.com/en/articles/8987892-segment-integration-guide
Collection: Connection Support › Other Guidance
Updated: 2026-03-04
Fetched: 2026-11-22
Description: Learn how to connect Segment to Drata. This connection supports the following types: User Access Reviews (UAR).

## Article text

The **Segment integration** enables security and compliance teams to automate **User Access Reviews (UAR)** by syncing user access data from Segment. This allows organizations to review who has access to Segment, identify potential permission risks, and maintain accurate records for compliance audits.

---

## Key Capabilities

- **User Access Review Data Sync:** Import Segment user accounts to support access review workflows
- **Access Governance:** Monitor which users have access to Segment within your organization
- **Compliance Monitoring:** Maintain visibility into system access to support security and audit requirements

This integration supports **User Access Review workflows**, helping demonstrate compliance with **access control policies**.

---

## Prerequisites & Data Access

- You must have **Administrator access** in your **Segment workspace**.
- You must create a **Segment Workspace Public API Token**.
   - **Important: **Create a **Public API Token**, not a **Config API Token**.
      Public API tokens provide the required administrative permissions for Drata to retrieve user access data.
- To create or modify connections in Drata, you must have one of the following **Drata roles** with write access: **Admin, Workspace Manager, DevOps Engineer**

**Drata Access Reviewers**
Access Reviewers can view the connection page but cannot create or modify connections.

---

### Permissions & Data Table

| Permission/Scope | Why It’s Needed |
|---|---|
| Public API Token | Allows Drata to retrieve Segment workspace user data for access reviews |

---

## Step-by-Step Setup

### Step 1: Create a Segment Public API Token

1. Log in to your **Segment workspace**.
2. Navigate to your **workspace settings**.
3. Navigate to the **Access Management** tab, and click **Tokens**.

**Important:**
Create a **Public API Token**, not a **Config API Token**. Public tokens provide the permissions required for Drata to retrieve user access information.

Expected outcome:
You have generated a **Segment Public API Token** that will be used to authenticate the integration.

---

### Step 2: Connect Segment in Drata

1. Log in to **Drata** → go to the **Connections** page.
2. Navigate to your **Available Connections**.
3. Search for and start the **Segment connection process**.
4. Enter the **Segment Public API Token** when prompted.

Expected outcome:
Segment is successfully connected and user access data begins syncing to Drata.

---

## Important Notes

- **Authentication method:** The Segment integration uses a **Workspace Public API Token**.
- **Token type requirement:** Using a **Config API Token** will prevent the integration from retrieving the required user access data.
- **Security best practice:** Store API tokens securely and rotate them according to your organization’s security policies.

## Related articles

- [Canva Integration Guide](canva-integration-guide.md)
- [Pinpoint Integration Guide](pinpoint-integration-guide.md)
- [Dialpad Integration Guide](dialpad-integration-guide.md)
- [Vercel Integration Guide](vercel-integration-guide.md)
- [Toggl Integration Guide](toggl-integration-guide.md)
