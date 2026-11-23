# Elastic Integration Guide

Source: https://help.drata.com/en/articles/9737185-elastic-integration-guide
Collection: Connection Support › Other Guidance
Updated: 2026-03-04
Fetched: 2026-11-22
Description: Learn how to connect Elastic to Drata. This connection supports the following types: User Access Reviews (UAR).

## Article text

The **Elastic integration** enables security and compliance teams to automate **User Access Reviews (UAR)** by syncing user access data directly from Elastic. This helps organizations review which users have access to Elastic and maintain accurate access records for compliance monitoring.

---

## Key Capabilities

- **User Access Monitoring:** Retrieve Elastic user accounts for access review workflows
- **Organization Visibility:** Monitor users associated with your Elastic Cloud organization
- **Compliance Monitoring:** Maintain visibility into system access for audit readiness

This integration supports **User Access Review workflows**, helping demonstrate compliance with **access control policies**.

---

## Prerequisites & Data Access

### Elastic Access Requirements

- You must have **Admin privileges** in your **Elastic Cloud organization**.
- You must obtain your **Elastic Cloud Organization ID**.
- You must generate an **Elastic API key** with appropriate access.

### Drata Role Requirements

- To create or modify connections, you must have one of the following **Drata roles with write access**: Admin, Workspace Manager, or DevOps Engineer
- **Access Reviewers** can view the connection page but cannot create or modify connections

---

### Permissions & Data Table

| Permission / Access | Why It’s Needed |
|---|---|
| Elastic API Key | Authenticates the integration and allows Drata to retrieve user access data |
| Organization ID | Identifies the Elastic Cloud organization being connected |

---

## Step-by-Step Setup

### Step 1: Retrieve Your Elastic Organization ID

1. Log in to your **Elastic Cloud account**.
2. Select your **profile icon** in the top-right corner.
3. Select **Organization** to open the Organization page.
4. Locate and copy your **Organization ID**.

Expected outcome:
You have copied the **Elastic Cloud Organization ID** required for the integration.

---

### Step 2: Create an Elastic API Key

1. From the **Organization page**, select the **API Keys** tab.
2. Select **Create API Key**.
3. Enter a **name** for the API key.
4. Set an **expiration date** for the key.
5. Enable **Organization Owner** permissions.
6. Create the API key and copy the generated **API key value**.

Important:
Record the **expiration date** so you can update the connection before the key expires.

Expected outcome:
You have created and stored the **Elastic API key** required for the integration.

---

### Step 3: Connect Elastic in Drata

1. Log in to **Drata** → go to the **Connections** page.
2. Navigate to your **Available Connections**.
3. Search for and start the **Elastic connection process**.
4. Enter the following information when prompted:
   - **Elastic Organization ID**
   - **Elastic API Key**

Expected outcome:
Elastic is successfully connected and user access data begins syncing to Drata.

---

## Important Notes

- **Authentication method:** The Elastic integration uses an **API key** generated from Elastic Cloud.
- **API key expiration:** If the API key expires, you must create a new key and update the connection in Drata.
- **Network restrictions:** If your organization uses a **Web Application Firewall (WAF)**, ensure required Drata IP addresses are allowlisted so the connection can be established.

## Related articles

- [Pinpoint Integration Guide](pinpoint-integration-guide.md)
- [Scaleway Integration Guide](scaleway-integration-guide.md)
- [Fivetran Integration Guide](fivetran-integration-guide.md)
- [Dialpad Integration Guide](dialpad-integration-guide.md)
- [OpenVPN Integration Guide](openvpn-integration-guide.md)
