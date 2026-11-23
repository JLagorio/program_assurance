# Vetty Integration Guide

Source: https://help.drata.com/en/articles/9655155-vetty-integration-guide
Collection: Connection Support › Other Guidance
Updated: 2026-08-05
Fetched: 2026-11-22
Description: Learn how to connect Vetty to Drata for background check workflows and compliance monitoring.

## Article text

Integrating Vetty to Drata streamlines your background check process, enhancing compliance and security. Follow these steps to set up the integration.

## Key Capabilities

- **Background Check Automation:** Send background checks from Drata to Vetty
- **Compliance Monitoring:** Track background check status for employees within compliance workflows
- **Webhook-Based Updates:** Vetty sends screening results back to Drata automatically through webhook events

This integration supports compliance programs that require **background checks and personnel verification evidence**.

## Prerequisites & Data Access

### Vetty Access Requirements

- You must have access to the **Vetty dashboard**.
- You must create the following Vetty credentials:
   - **API Key**
   - **Client ID**
   - **Webhook Secret Key**
   - **Default Package ID**

### Drata Role Requirements

To create or modify connections, you must have one of the following **Drata roles with write access**:

- Admin
- Workspace Manager
- DevOps Engineer

**Access Reviewers** can view the connection page but cannot create or modify connections.

---

### Permissions & Data Table

| Credential | Why It’s Needed |
|---|---|
| API Key | Allows Drata to authenticate with Vetty APIs |
| Client ID | Identifies the Vetty application used for the integration |
| Webhook Secret Key | Allows Drata to securely verify Vetty webhook events |
| Default Package ID | Determines which background check package Vetty will run |

---

## Step-by-Step Setup

### Step 1: Create a Vetty API Key

1. Log in to your **Vetty dashboard**.
2. Navigate to **Settings → API Management → API Management System**.
3. Create a **new API key**.
4. Set the IP range to:
   ```
0.0.0.0/0
   ```
5. Save the API key.

After creation:

- Copy the **API Key**
- Copy the **Client ID**

Important:
 Record the **API key expiration date**, as the key must be updated in Drata before it expires.

Expected outcome:
 You have generated the Vetty **API Key and Client ID** required for the integration.

---

### Step 2: Configure the Vetty Webhook

Drata uses a webhook to receive background check status updates from Vetty.

1. In your **Vetty dashboard**, navigate to:
    **Settings → API Management → Web Hook**
2. Register the appropriate webhook URL based on your Drata data region:
   - **United States (default)**
   ```
https://api.drata.com/vetty/webhook
   ```
   - **Europe**
   ```
https://api.eu.drata.com/vetty/webhook
   ```
   - **APAC**
   ```
https://api.apac.drata.com/vetty/webhook
   ```
3. When registering the webhook, Vetty will generate a **Webhook Secret Key**.
4. Copy and securely store the **Webhook Secret Key**.

Expected outcome:
 The Vetty webhook is configured and ready to send background check updates to Drata.

---

### Step 3: Retrieve Your Vetty Package ID

1. In the **Vetty dashboard**, navigate to **Packages**.
2. Select the package you want to use for background checks.
3. Copy the **Package ID**.

Expected outcome:
 You have the **Package ID** that will be used for background checks initiated from Drata.

---

### Step 4: Connect Vetty in Drata

1. Log in to **Drata** → go to the **Connections** page.
2. Navigate to your **Available Connections**.
3. Search for and start the **Vetty connection process**.
4. Enter the following information when prompted:

- **API Key**
- **Client ID**
- **Webhook Secret Key**
- **Default Package ID**

Save the connection.

Expected outcome:
Vetty is successfully connected and background check workflows can begin syncing with Drata.

---

## Important Notes

- **API key expiration:** Vetty API keys expire. Update the key in Drata before it expires to prevent connection interruptions.
- **Webhook security:** The **Webhook Secret Key** ensures Vetty webhook requests are securely verified.
- **Regional webhook URLs:** Ensure the correct webhook URL is used based on your Drata hosting region.

## Related articles

- [Certn Integration Guide (Background Check)](certn-integration-guide-background-check.md)
- [Scaleway Integration Guide](scaleway-integration-guide.md)
- [Gong Integration Guide](gong-integration-guide.md)
- [OpenVPN Integration Guide](openvpn-integration-guide.md)
- [Jit Integration Guide](jit-integration-guide.md)
