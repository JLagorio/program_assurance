# Salesloft Integration Guide

Source: https://help.drata.com/en/articles/9300819-salesloft-integration-guide
Collection: Connection Support › Other Guidance
Updated: 2026-03-10
Fetched: 2026-11-22

## Article text

The Salesloft integration enables security and compliance teams to review who has access to Salesloft in their organization. It connects Drata to Salesloft so your team can monitor user roles and permissions to support access governance and compliance requirements.

## Key Capabilities

- User access review data: Review users with access to Salesloft
- Role visibility: Monitor assigned roles within the platform
- Automated evidence collection: Sync access data into Drata for compliance reviews

This integration is used to automate tests such as user access review verification and privileged access review, helping prove compliance with access control and least privilege policies.

## Prerequisites & Data Access

- **Admin access** to your Salesloft account
- Ability to create a **Salesloft API Key**
- Required Drata Role with Write access: Admin, Workspace Managers, DevOps Engineer
- Access Reviewers (Access Reviewers can only Read the connection page they can’t make changes)

### Permissions & Data Table

| Permission/Scope | Why It’s Needed |
|---|---|
| Salesloft API Key | Allows Drata to authenticate and retrieve Salesloft user access information |

## Step-by-Step Setup

### Step 1: Generate a Salesloft API Key

1. Log in to **Salesloft**.
2. Navigate to **Your Applications**.
3. Select **Create New** under the **API Keys** section.
4. Enter **Drata** as the application name.
5. Submit the request to create the API key.
6. Copy and securely store the generated **API Key**.

Expected outcome: You have a Salesloft API key required to authenticate the integration.

### Step 2: Connect Salesloft in Drata

1. Log in to **Drata** → go to the **Connections** page.
2. Navigate to your **Available Connections**.
3. Search for and start the **Salesloft** connection process.
4. Enter your **API Key** when prompted.

Expected outcome:
Salesloft is successfully connected and user access data begins syncing to Drata.

## Important Notes

- This integration is used for **User Access Review** and focuses on reviewing users and roles within Salesloft.
- Ensure the API key is generated from **Your Applications → API Keys** within Salesloft.
- If your organization uses a **Web Application Firewall (WAF)**, ensure required IP addresses are allowlisted for the integration.

## Related articles

- [Attio Integration Guide](attio-integration-guide.md)
- [Pinpoint Integration Guide](pinpoint-integration-guide.md)
- [Envoy Integration Guide](envoy-integration-guide.md)
- [SendGrid Integration Guide](sendgrid-integration-guide.md)
- [Articulate Integration Guide](articulate-integration-guide.md)
