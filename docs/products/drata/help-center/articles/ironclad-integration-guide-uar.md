# Ironclad Integration Guide (UAR)

Source: https://help.drata.com/en/articles/9971800-ironclad-integration-guide-uar
Collection: Connection Support › Other Guidance
Updated: 2026-09-15
Fetched: 2026-11-22

## Article text

The **Ironclad integration** enables security and compliance teams to automate **User Access Reviews (UAR)** by syncing user access data directly from Ironclad. This helps organizations review who has access to Ironclad and maintain accurate access records for compliance monitoring.

---

## Key Capabilities

- **User Access Review Data Sync:** Import Ironclad user account data into Drata
- **Access Governance:** Monitor which users have access to your Ironclad environment
- **Compliance Monitoring:** Maintain visibility into system access for audit and compliance workflows

This integration supports **User Access Review workflows**, helping demonstrate compliance with **access control policies**.

---

## Prerequisites & Data Access

### Ironclad Access Requirements

- You must have **Administrator privileges** in your **Ironclad account**.
- You must generate an **Ironclad API key**.

### Drata Role Requirements

- To create or modify connections, you must have one of the following **Drata roles with write access**: Admin, Workspace Manager, or DevOps Engineer
- **Access Reviewers** can view the connection page but cannot create or modify connections

---

### Permissions & Required Access

| Permission / Access | Why It’s Needed |
|---|---|
| API Token | Allows Drata to authenticate and retrieve user access data from Ironclad |

---

## Step-by-Step Setup

### Step 1: Generate an Ironclad API Token

1. Log in to your **Ironclad account** at:
   [https://ironcladapp.com/signin](https://ironcladapp.com/signin)
2. Navigate to **Company Settings**.
3. In the left navigation menu, select **API**.
4. Under **Create New Token**, enter a name for the token.
5. Select **Create**.
6. Copy the generated **API token** and store it securely.
7. Confirm and close the token creation window.

Expected outcome:
You have generated an **Ironclad API token** that will be used to authenticate the integration.

---

### Step 2: Connect Ironclad in Drata

1. Log in to **Drata** → go to the **Connections** page.
2. Navigate to your **Available Connections**.
3. Search for and start the **Ironclad connection process**.
4. Enter the **Ironclad API token** when prompted.

Expected outcome:
Ironclad is successfully connected and user access data begins syncing to Drata.

---

## Important Notes

- **Authentication method:** The Ironclad integration uses an **API token**.
- **Security best practice:** Store API tokens securely and rotate them according to your organization’s security policies.
- **Network restrictions:** If your organization uses a **Web Application Firewall (WAF)**, ensure required Drata IP addresses are allowlisted so the connection can be established.

## Related articles

- [Segment Integration Guide](segment-integration-guide.md)
- [Dixa Integration Guide](dixa-integration-guide.md)
- [Oneflow Integration Guide (UAR)](oneflow-integration-guide-uar.md)
- [Toggl Integration Guide](toggl-integration-guide.md)
- [Ironclad Integration Guide (Procurement)](ironclad-integration-guide-procurement.md)
