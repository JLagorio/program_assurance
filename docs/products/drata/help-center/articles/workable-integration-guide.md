# Workable Integration Guide

Source: https://help.drata.com/en/articles/9300828-workable-integration-guide
Collection: Connection Support › Other Guidance
Updated: 2026-03-09
Fetched: 2026-11-22
Description: Learn how to connect Workable to Drata to automate User Access Reviews by syncing user access data from Workable.

## Article text

The **Workable integration** enables security and compliance teams to automate **User Access Reviews (UAR)** by syncing user access data directly from Workable. This helps organizations review which users have access to Workable and maintain accurate access records for compliance monitoring.

---

## Key Capabilities

- **User Access Monitoring:** Retrieve Workable user accounts for access review workflows
- **Access Visibility:** Monitor which users have access to your Workable environment
- **Compliance Monitoring:** Maintain auditable records of system access for compliance and security governance

This integration supports **User Access Review workflows**, helping organizations demonstrate compliance with **access control policies**.

---

## Prerequisites & Data Access

### Workable Access Requirements

- You must have **Super Admin privileges** in your **Workable account**.
- You will need to create a **Workable API Key** with the following configuration:
   - Name: Drata
   - Expiration: 1 year
   - Scope: r_jobs

Make sure to **record the API key expiration date**. You must update the key in Drata before it expires to maintain the connection.

### Drata Role Requirements

To create or modify connections, you must have one of the following **Drata roles with write access**:

- Admin
- Workspace Manager
- DevOps Engineer

Access Reviewers can view the connection page but cannot modify connection settings.

---

## Step-by-Step Setup

### Step 1: Create a Workable API Key

1. Log in to your **Workable account**.
2. Navigate to the **API key management section**.
3. Create a new API key with the following settings:
   - **Name:** Drata
   - **Expiration:** 1 year
   - **Scope:** `r_jobs`
4. Copy the **API Key** and store it securely.

**Expected outcome:**
You have generated the **Workable API Key** required for the integration.

---

### Step 2: Identify Your Workable Company Domain

Your **Workable company domain** is part of the URL used to access your Workable workspace.

Examples:

```
https://companyDomain.workable.com
```

or

```
https://apply.workable.com/companyDomain/
```

Copy the **companyDomain** portion of the URL.

**Expected outcome:**
 You have identified the **Workable company domain** required for the connection.

---

### Step 3: Connect Workable in Drata

1. Log in to **Drata** → go to the **Connections** page.
2. Navigate to your **Available Connections**.
3. Search for and start the **Workable connection process**.
4. Enter the following information when prompted:

- **API Key**
- **Company Domain**

**Expected outcome:**
 Workable is successfully connected and user access data begins syncing to Drata.

---

## Important Notes

- **Authentication method:** The Workable integration uses an **API Key**.
- **Credential expiration:** Workable API keys expire after the configured duration (recommended: **1 year**). Update the key in Drata before expiration to avoid connection disruptions.
- **Network restrictions:** If your organization uses a **Web Application Firewall (WAF)**, ensure required Drata IP addresses are allowlisted so the connection can be established.

## Related articles

- [Elastic Integration Guide](elastic-integration-guide.md)
- [Scaleway Integration Guide](scaleway-integration-guide.md)
- [Intercom Integration Guide](intercom-integration-guide.md)
- [TalentLMS Integration Guide](talentlms-integration-guide.md)
- [Dialpad Integration Guide](dialpad-integration-guide.md)
