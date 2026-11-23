# Pinpoint Integration Guide

Source: https://help.drata.com/en/articles/9300756-pinpoint-integration-guide
Collection: Connection Support › Other Guidance
Updated: 2026-03-04
Fetched: 2026-11-22
Description: Learn how to connect Pinpoint to Drata. This connection supports the following types: User Access Reviews (UAR).

## Article text

The **Pinpoint integration** enables security and compliance teams to monitor user access and roles within Pinpoint. By syncing user data from Pinpoint, Drata helps organizations review who has access to the platform and maintain accurate access records for compliance monitoring.

---

## Key Capabilities

- **User Access Review Data Sync:** Import Pinpoint user access data into Drata
- **Role Visibility:** Monitor user roles and permissions within your Pinpoint account
- **Compliance Monitoring:** Maintain visibility into system access to support audit and compliance workflows

This integration supports **User Access Review workflows**, helping demonstrate compliance with **access control policies**.

---

## Prerequisites & Data Access

### Pinpoint Access Requirements

- You must generate a **Pinpoint API key** with the required permissions.
- You must retrieve your **Pinpoint account subdomain**.

### Drata Role Requirements

- To create or modify connections, you must have one of the following **Drata roles with write access**: Admin, Workspace Manager, or DevOps Engineer
- **Access Reviewers** can view the connection page but cannot create or modify connections

---

### Permissions & Required Access

| Permission / Access | Why It’s Needed |
|---|---|
| Application permissions: Read | Allows Drata to retrieve user access data from Pinpoint |
| Department permissions: Read | Allows Drata to retrieve department-level access information |
| API Key | Authenticates the integration with Pinpoint |
| Subdomain | Identifies the Pinpoint account being connected |

---

## Step-by-Step Setup

### Step 1: Generate a Pinpoint API Key

1. Log in to your **Pinpoint account**.
2. Navigate to the **API settings** section.
3. Generate a new **API key** with the following parameters:
   - **API Key Name:** Drata
   - **Application permissions:** Read
   - **Department permissions:** Read
4. Copy the generated **API key** and store it securely.

Expected outcome:
You have generated a **Pinpoint API key** with the required permissions.

---

### Step 2: Retrieve Your Pinpoint Subdomain

1. Log in to your **Pinpoint account**.
2. Look at the URL in your browser when accessing Pinpoint.

Example:
If the URL is:

```
https://company.pinpointhq.com
```

The **subdomain** is:

```
company
```

Expected outcome:
 You have identified the **Pinpoint subdomain** required for the integration.

---

### Step 3: Connect Pinpoint in Drata

1. Log in to **Drata** → go to the **Connections** page.
2. Navigate to your **Available Connections**.
3. Search for and start the **Pinpoint connection process**.
4. Enter the following information when prompted:

- **Subdomain**
- **API Key**

Expected outcome:
 Pinpoint is successfully connected and user access data begins syncing to Drata.

---

## Important Notes

- **Authentication method:** The Pinpoint integration uses an **API key**.
- **Required permissions:** The API key must include **Read access for both Application and Department permissions**.
- **Security best practice:** Store API keys securely and rotate them according to your organization’s security policies.
- **Network restrictions:** If your organization uses a **Web Application Firewall (WAF)**, ensure required Drata IP addresses are allowlisted so the connection can be established.

## Related articles

- [Fivetran Integration Guide](fivetran-integration-guide.md)
- [TalentLMS Integration Guide](talentlms-integration-guide.md)
- [Dialpad Integration Guide](dialpad-integration-guide.md)
- [Gong Integration Guide](gong-integration-guide.md)
- [OpenVPN Integration Guide](openvpn-integration-guide.md)
