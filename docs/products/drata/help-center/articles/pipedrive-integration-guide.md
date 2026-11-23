# Pipedrive Integration Guide

Source: https://help.drata.com/en/articles/9300814-pipedrive-integration-guide
Collection: Connection Support › Other Guidance
Updated: 2026-03-09
Fetched: 2026-11-22

## Article text

The Pipedrive integration enables security and compliance teams to review who has access to Pipedrive in their organization. It connects Drata to Pipedrive so your team can monitor user roles and permissions to support access governance and compliance requirements.

## Key Capabilities

- User access review data: Review users and roles in Pipedrive
- Access governance support: Identify individuals with access to the platform
- Automated evidence collection: Sync access data into Drata for compliance reviews

This integration is used to automate tests such as user access review verification and privileged access review, helping prove compliance with access control and least privilege policies.

## Prerequisites & Data Access

- Administrative access to your **Pipedrive account**
- Ability to generate a **Pipedrive API Token**
- Access to your **Pipedrive company domain**
- Required Drata Role with Write access: Admin, Workspace Managers, DevOps Engineer
- Access Reviewers (Access Reviewers can only Read the connection page they can’t make changes)

### Permissions & Data Table

| Permission/Scope | Why It’s Needed |
|---|---|
| Pipedrive API Token | Allows Drata to authenticate and retrieve user access and role data |
| Company domain | Identifies the correct Pipedrive instance for your organization |

## Step-by-Step Setup

### Step 1: Generate a Pipedrive API Token

1. Log in to **Pipedrive**.
2. Navigate to your **account settings**.
3. Locate the **API** section.
4. Generate or copy your **API Token**.

Expected outcome: You have a Pipedrive API token required for authentication.

### Step 2: Identify Your Pipedrive Company Domain

1. Look at the URL you use to log in to Pipedrive.
   - Example: If your URL is `https://theoffice.pipedrive.com`, your **company domain is `theoffice`**.
2. Copy the company domain value.

Expected outcome: You have the company domain needed for the connection.

### Step 3: Connect Pipedrive in Drata

1. Log in to **Drata** → go to the **Connections** page.
2. Navigate to your **Available Connections**.
3. Search for and start the **Pipedrive** connection process.
4. Enter the following when prompted:
   - **API Token**
   - **Company Domain**

Expected outcome:
Pipedrive is successfully connected and user access data begins syncing to Drata.

## Important Notes

- This integration is used for **User Access Review** and focuses on reviewing users and roles within Pipedrive.
- The **company domain** must match the domain used in your Pipedrive login URL.
- If your organization uses a **Web Application Firewall (WAF)**, allow outbound access for the integration to connect successfully.
- The provided information does not specify the exact IP addresses required for WAF allowlisting.

## Related articles

- [Attio Integration Guide](attio-integration-guide.md)
- [Freshsales Integration Guide (UAR)](freshsales-integration-guide-uar.md)
- [Recruitee Integration Guide](recruitee-integration-guide.md)
- [Workable Integration Guide](workable-integration-guide.md)
- [Ironclad Integration Guide (UAR)](ironclad-integration-guide-uar.md)
