# Ansible Tower Integration Guide

Source: https://help.drata.com/en/articles/9971446-ansible-tower-integration-guide
Collection: Connection Support › Other Guidance
Updated: 2025-10-30
Fetched: 2026-11-22

## Article text

The **Ansible Tower (Ansible)** integration enables **security and compliance teams** to automate user access reviews by syncing user data directly from Ansible Tower.
It connects Drata to your Ansible instance via **OAuth credentials**, helping your team reduce manual work and ensure compliance with access control requirements.

## Key Capabilities

- **User Data Sync:** Automatically imports user and role information from Ansible Tower into Drata.
- **Access Review Automation:** Keeps identity and permission data aligned for compliance testing.

## Prerequisites & Data Access

- Must have **Admin**, **Information Security Lead**, **DevOps Engineer**, or **Workspace Manager** roles in Drata.
- Must have **Administrator privileges** in your **Ansible Tower account**.
- Must have access to your **Ansible Tower instance URL**.
- Must have the ability to **create an OAuth Application** in Ansible Tower.
- **Note:** Web Application Firewall (WAF) allowlisting is **not typically required** for this integration since Drata connects over HTTPS. Only allowlist Drata IPs if your organization restricts outbound connections.

## Step-by-Step Setup

### Step 1: Copy Your Ansible Tower URL

1. Log in to your **Ansible Tower instance**.
2. Copy your Ansible Tower URL. This will be needed to connect to Drata.
   - Example: `https://ansible.myapp-exp.com`

**Expected outcome:** You now have your Ansible Tower URL ready for use in Drata.

### Step 2: Create an Ansible OAuth Application

1. Log in to your **Ansible Tower account**.
2. Navigate to **Applications**.
3. Click the **plus (+)** icon to create a new application.
4. Enter the following details:
   - **Name:** Enter a descriptive name for the connection.
   - **Description (optional):** Provide context for this integration.
   - **Organization:** Select the organization to associate with the application.
   - **Authorization Grant Type:** Select **Authorization Code**.
   - **Redirect URIs:**
      ```
https://api.stackone.com/connect/oauth2/ansibletower_iam/callback
      ```
   - **Client Type:** Select **Confidential** or **Public** (depending on your environment).
5. Save the application.
6. Copy the **Client ID** and **Client Secret**, and store them securely.

**Expected outcome:** You now have valid OAuth credentials (Client ID and Client Secret) ready for Drata connection.

### Step 3: Complete the Connection in Drata

1. In Drata, navigate to **Connections → Available Connections**.
2. Search for **Ansible Tower** and select **Connect**.
3. In the connection drawer or popup modal, enter the following fields:

| **Drata Field** | **Ansible Tower Value** |
|---|---|
| **Ansible Tower URL** | The URL of your Ansible Tower instance (e.g., `https://ansible.myapp-exp.com`) |
| **Client ID** | Your Ansible application Client ID |
| **Client Secret** | Your Ansible application Client Secret |

## Related articles

- [SmartRecruiters Integration Guide](smartrecruiters-integration-guide.md)
- [Webex Integration Guide](webex-integration-guide.md)
- [CyberArk Integration Guide](cyberark-integration-guide.md)
- [Smartsheet Integration Guide](smartsheet-integration-guide.md)
- [Box Integration Guide](box-integration-guide.md)
