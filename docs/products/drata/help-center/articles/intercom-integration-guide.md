# Intercom Integration Guide

Source: https://help.drata.com/en/articles/9773756-intercom-integration-guide
Collection: Connection Support › Other Guidance
Updated: 2026-03-09
Fetched: 2026-11-22
Description: Learn how to connect Intercom to Drata to automate User Access Reviews by syncing Intercom user data.

## Article text

The **Intercom integration** enables security and compliance teams to automate **User Access Reviews (UAR)** by syncing user account data directly from Intercom. This allows organizations to review who has access to Intercom and monitor user permissions for compliance and security governance.

---

## Key Capabilities

- **User Access Monitoring:** Retrieve Intercom user accounts for access review workflows
- **Access Visibility:** Monitor which users have access to your Intercom workspace
- **Compliance Monitoring:** Maintain auditable records of system access for compliance programs

This integration supports **User Access Review workflows**, helping organizations demonstrate compliance with **access control policies**.

---

## Prerequisites & Data Access

### Intercom Access Requirements

- You must have **Admin privileges** in your **Intercom account**.
- You must create an **Intercom Access Token** from the Intercom Developer Hub.

### Drata Role Requirements

To create or modify connections, you must have one of the following **Drata roles with write access**:

- Admin
- Workspace Manager
- DevOps Engineer

**Access Reviewers** can view the connection page but cannot create or modify connections.

---

### Permissions & Data Table

| Credential / Permission | Why It’s Needed |
|---|---|
| Intercom Access Token | Allows Drata to authenticate with the Intercom API |

---

## Step-by-Step Setup

### Step 1: Create an Intercom Access Token

1. Log in to the **Intercom Developer Hub**.
2. Navigate to the **Apps** section.
3. Select **New app**.
4. Enter the following information:
   - **App Name**
   - **Workspace**
5. Create the application.

After creating the app:

- Copy the **Access Token**

Store this token securely as it will be required when connecting the integration.

Expected outcome:
You have generated the **Intercom Access Token** required for the integration.

---

### Step 2: Connect Intercom in Drata

1. Log in to **Drata** → go to the **Connections** page.
2. Navigate to your **Available Connections**.
3. Search for and start the **Intercom connection process**.
4. Enter the following information when prompted:

- **Access Token**

Expected outcome:
Intercom is successfully connected and user access data begins syncing to Drata.

---

## Important Notes

- **Authentication method:** The Intercom integration uses an **API Access Token**.
- **Credential security:** Store the Access Token securely according to your organization’s security policies.
- **Network restrictions:** If your organization uses a **Web Application Firewall (WAF)**, ensure required Drata IP addresses are allowlisted so the connection can be established.

## Related articles

- [Segment Integration Guide](segment-integration-guide.md)
- [Dixa Integration Guide](dixa-integration-guide.md)
- [Workable Integration Guide](workable-integration-guide.md)
- [TeamViewer (Remote) Integration Guide](teamviewer-remote-integration-guide.md)
- [Sophos Integration Guide](sophos-integration-guide.md)
