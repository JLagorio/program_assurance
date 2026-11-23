# Envoy Integration Guide

Source: https://help.drata.com/en/articles/9769744-envoy-integration-guide
Collection: Connection Support › Other Guidance
Updated: 2026-03-04
Fetched: 2026-11-22

## Article text

The **Envoy integration** enables security and compliance teams to automate **User Access Reviews (UAR)** by syncing user access data directly from Envoy. This helps organizations review who has access to Envoy and maintain accurate access records for compliance monitoring.

---

## Key Capabilities

- **User Access Review Data Sync:** Import Envoy user account data into Drata
- **Access Governance:** Monitor which users have access to your Envoy environment
- **Compliance Monitoring:** Maintain visibility into system access to support audit and compliance workflows

This integration supports **User Access Review workflows**, helping demonstrate compliance with **access control policies**.

---

## Prerequisites & Data Access

### Envoy Access Requirements

- You must have **Admin privileges** in your **Envoy organization**.
- You must create an **Envoy application** and retrieve the **Client API Key**.
- The application must include the required **API scope**.

### Drata Role Requirements

- To create or modify connections, you must have one of the following **Drata roles with write access**: Admin, Workspace Manager, or DevOps Engineer
- **Access Reviewers** can view the connection page but cannot create or modify connections

---

### Permissions & Required Access

| Permission / Scope | Why It’s Needed |
|---|---|
| `employees.read` | Allows Drata to retrieve employee and user access information from Envoy |
| Client API Key | Authenticates the integration with Envoy |

---

## Step-by-Step Setup

### Step 1: Create an Envoy Application

1. Log in to your **Envoy account**.
2. In the left navigation menu, select **Apps**.
3. Open the **Dev Dashboard**.
4. Select **Create New** to create a new application.
5. Enter an **application name**.

Expected outcome:
A new Envoy application is created.

---

### Step 2: Configure Application Permissions

1. In the application configuration settings, select the following **API scope**: **`employees.read`**
2. Do **not select any options** under **Where will customers install your app?**.
3. Save the application.

Expected outcome:
The Envoy application is configured with the required API permissions.

---

### Step 3: Retrieve the Client API Key

1. After saving the application, locate the **Client API Key**.
2. Copy the key and store it securely.

Expected outcome:
You have copied the **Client API Key** required to authenticate the integration.

---

### Step 4: Connect Envoy in Drata

1. Log in to **Drata** → go to the **Connections** page.
2. Navigate to your **Available Connections**.
3. Search for and start the **Envoy connection process**.
4. Enter the **Client API Key** when prompted.

Expected outcome:
Envoy is successfully connected and user access data begins syncing to Drata.

---

## Important Notes

- **Authentication method:** The Envoy integration uses an **API key generated from the Envoy Developer Dashboard**.
- **Required scope:** The application must include the **employees.read** permission.
- **Security best practice:** Store API credentials securely and rotate them according to your organization’s security policies.
- **Network restrictions:** If your organization uses a **Web Application Firewall (WAF)**, ensure required Drata IP addresses are allowlisted so the connection can be established.

## Related articles

- [Attio Integration Guide](attio-integration-guide.md)
- [Bitwarden Integration Guide](bitwarden-integration-guide.md)
- [Salesloft Integration Guide](salesloft-integration-guide.md)
- [Workable Integration Guide](workable-integration-guide.md)
- [SendGrid Integration Guide](sendgrid-integration-guide.md)
