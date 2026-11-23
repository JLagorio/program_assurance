# TalentLMS Integration Guide

Source: https://help.drata.com/en/articles/9774255-talentlms-integration-guide
Collection: Connection Support › Other Guidance
Updated: 2026-11-14
Fetched: 2026-11-22
Description: Learn how to connect TalentLMS to Drata. This connection supports the following types: User Access Reviews (UAR).

## Article text

The **TalentLMS integration** enables security and compliance teams to automate **User Access Reviews (UAR)** by syncing user access data directly from TalentLMS. This helps organizations review which users have access to TalentLMS and maintain accurate access records for compliance monitoring.

---

## Key Capabilities

- **User Access Monitoring:** Retrieve TalentLMS user accounts for access review workflows
- **Access Governance:** Monitor which users have access to your TalentLMS environment
- **Compliance Monitoring:** Maintain visibility into system access for audit readiness

This integration supports **User Access Review workflows**, helping demonstrate compliance with **access control policies**.

---

## Prerequisites & Data Access

### TalentLMS Access Requirements

- You must have **SuperAdmin or Account Owner privileges** in your **TalentLMS account**.
- You must obtain your **TalentLMS domain**.
- You must enable the **TalentLMS API** and generate an **API key**.

### Drata Role Requirements

To create or modify connections, you must have one of the following **Drata roles with write access**:

- Admin
- Workspace Manager
- DevOps Engineer

**Access Reviewers** can view the connection page but cannot create or modify connections.

### Permissions & Data Table

| Permission | Why It’s Needed |
|---|---|
| TalentLMS API | Allows Drata to retrieve user access data |
| API Key | Authenticates the integration with TalentLMS |
| Domain | Identifies the TalentLMS workspace being connected |

---

## Step-by-Step Setup

### Step 1: Identify Your TalentLMS Domain

Your **TalentLMS domain** is the URL used to access your TalentLMS instance.

Example:

```
https://companydomain.talentlms.com
```

Copy the **companydomain** portion of the URL.

Expected outcome:
You have identified the **TalentLMS domain** required for the connection.

---

### Step 2: Enable the TalentLMS API and Generate an API Key

1. Log in to your **TalentLMS Dashboard**.
2. Select **Account & Settings**.
3. Scroll to the **Security** section.
4. Enable the API option.
5. Copy the **API Key** and store it securely.

Expected outcome:
You have generated the **TalentLMS API key** required for the integration.

---

### Step 3: Connect TalentLMS in Drata

1. Log in to **Drata** → go to the **Connections** page.
2. Navigate to your **Available Connections**.
3. Search for and start the **TalentLMS connection process**.
4. Enter the following information when prompted:
   - **TalentLMS Domain**
   - **API Key**

Expected outcome:
TalentLMS is successfully connected and user access data begins syncing to Drata.

---

## Important Notes

- **Authentication method:** The TalentLMS integration uses an **API key**.
- **API security:** Store the API key securely and rotate it according to your organization’s security policies.
- **Network restrictions:** If your organization uses a **Web Application Firewall (WAF)**, ensure required Drata IP addresses are allowlisted so the connection can be established.

## Related articles

- [Pinpoint Integration Guide](pinpoint-integration-guide.md)
- [Scaleway Integration Guide](scaleway-integration-guide.md)
- [Fivetran Integration Guide](fivetran-integration-guide.md)
- [Dialpad Integration Guide](dialpad-integration-guide.md)
- [Gong Integration Guide](gong-integration-guide.md)
