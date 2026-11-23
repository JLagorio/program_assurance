# Bullhorn Integration Guide

Source: https://help.drata.com/en/articles/9774077-bullhorn-integration-guide
Collection: Connection Support › Other Guidance
Updated: 2026-03-04
Fetched: 2026-11-22
Description: Learn how to connect Bullhorn to Drata. This connection supports the following types: User Access Reviews (UAR).

## Article text

The **Bullhorn integration** enables security and compliance teams to automate **User Access Reviews (UAR)** by syncing user account data directly from Bullhorn. This helps organizations review which users have access to Bullhorn and maintain accurate access records for compliance monitoring.

---

## Key Capabilities

- **User Access Review Data Sync:** Import Bullhorn user account data into Drata
- **Access Governance:** Monitor which users have access to your Bullhorn environment
- **Compliance Monitoring:** Maintain visibility into system access to support audit and compliance workflows

This integration supports **User Access Review workflows**, helping demonstrate compliance with **access control policies**.

---

## Prerequisites & Data Access

### Bullhorn Access Requirements

- You must have **Admin privileges** in your **Bullhorn account**.
- You must obtain the following credentials from Bullhorn:
   - **Client ID**
   - **Client Secret**
   - **API Username**
- You must request that Bullhorn support add the following **OAuth redirect URI**: `https://api.stackone.com/connect/oauth2/bullhorn_iam/callback`

- You must determine your **Bullhorn Data Center Region identifier**.

### Drata Role Requirements

- To create or modify connections, you must have one of the following **Drata roles with write access**: Admin, Workspace Manager, or DevOps Engineer
- **Access Reviewers** can view the connection page but cannot create or modify connections

---

### Permissions & Data Table

| Permission / Access | Why It’s Needed |
|---|---|
| Client ID | Identifies the Bullhorn API application |
| Client Secret | Authenticates the Bullhorn integration |
| API Username | Allows Drata to access Bullhorn user data |
| Data Center Region | Directs the connection to the correct Bullhorn API endpoint |

---

## Step-by-Step Setup

### Step 1: Obtain Bullhorn API Credentials

Retrieve the following information from your Bullhorn account:

- **Client ID**
- **Client Secret**
- **API Username**

If you do not have access to these values, contact **Bullhorn Support** or submit a request through the **Bullhorn Resource Center**.

Expected outcome:
 You have obtained the required Bullhorn API credentials.

---

### Step 2: Configure the OAuth Redirect URI

1. Bullhorn requires the redirect URI to be registered before the integration can authenticate.
2. Contact **Bullhorn Support** and request that the following redirect URI be added to your application:

```
https://api.stackone.com/connect/oauth2/bullhorn_iam/callback
```

Expected outcome:
 The OAuth redirect URI is registered in Bullhorn.

---

### Step 3: Identify Your Bullhorn Data Center Region

Your **Data Center Region identifier** determines which API endpoint Bullhorn uses.

1. Log in to your **Bullhorn account**.
2. Look at the URL in your browser.
   Example:
   ```
https://.bullhornstaffing.com
   ```
3. Copy the value that appears in place of **region_identifier**.

Expected outcome:
 You have identified the **Bullhorn Data Center Region** required for the connection.

---

### Step 4: Connect Bullhorn in Drata

1. Log in to **Drata** → go to the **Connections** page.
2. Navigate to your **Available Connections**.
3. Search for and start the **Bullhorn connection process**.
4. Enter the following information when prompted:
   - **Client ID**
   - **Client Secret**
   - **API Username**
   - **Data Center Region**

Expected outcome:
 Bullhorn is successfully connected and user access data begins syncing to Drata.

---

## Important Notes

- **Redirect URI requirement:** The redirect URI must be registered in Bullhorn before the integration can authenticate successfully.
- **Regional API endpoints:** Bullhorn uses **data center–specific API URLs**, so the correct region identifier is required for the integration to function.
- **Network restrictions:** If your organization uses a **Web Application Firewall (WAF)**, ensure required Drata IP addresses are allowlisted so the connection can be established.

## Related articles

- [Webex Integration Guide](webex-integration-guide.md)
- [Zelt Integration Guide](zelt-integration-guide.md)
- [RingCentral Integration Guide](ringcentral-integration-guide.md)
- [OpenVPN Integration Guide](openvpn-integration-guide.md)
- [Box Integration Guide](box-integration-guide.md)
