# Dropbox Sign Integration Guide

Source: https://help.drata.com/en/articles/10594472-dropbox-sign-integration-guide
Collection: Connection Support › Other Guidance
Updated: 2026-03-10
Fetched: 2026-11-22

## Article text

The Dropbox Sign integration enables security and compliance teams to review who has access to Dropbox Sign in their organization. It connects Drata to Dropbox Sign so your team can monitor user access and roles to support compliance and access governance requirements.

## Key Capabilities

- User access review data: Review users with access to Dropbox Sign
- Role visibility: Monitor assigned roles within the platform
- Automated evidence collection: Sync access data into Drata for compliance reviews

This integration is used to automate tests such as user access review verification and privileged access review, helping prove compliance with access control and least privilege policies.

## Prerequisites & Data Access

- **Dropbox Sign Standard plan or higher**
- **Admin access** to your Dropbox Sign account
- Ability to generate a **Dropbox Sign API Key**
- Required Drata Role with Write access: Admin, Workspace Managers, DevOps Engineer
- Access Reviewers (Access Reviewers can only Read the connection page they can’t make changes)

### Permissions & Data Table

| Permission/Scope | Why It’s Needed |
|---|---|
| Dropbox Sign API Key | Allows Drata to authenticate and retrieve user access data from Dropbox Sign |

## Step-by-Step Setup

### Step 1: Generate a Dropbox Sign API Key

1. Log in to your **Dropbox Sign** account.
2. Navigate to the **API** page in your account settings.
3. Select **Create API Key**.
4. Copy and securely store the generated **API Key**.

Expected outcome: You have a Dropbox Sign API key required to authenticate the integration.

### Step 2: Connect Dropbox Sign in Drata

1. Log in to **Drata** → go to the **Connections** page.
2. Navigate to your **Available Connections**.
3. Search for and start the **Dropbox Sign** connection process.
4. Enter your **Dropbox Sign API Key** when prompted.

Expected outcome:
Dropbox Sign is successfully connected and user access data begins syncing to Drata.

## Important Notes

- This integration requires the **Dropbox Sign Standard plan or higher**.
- The integration is used for **User Access Review** and focuses on reviewing users and roles within Dropbox Sign.
- If your organization uses a **Web Application Firewall (WAF)**, ensure required IP addresses are allowlisted for the integration.
- The provided information does not specify the exact IP addresses required for WAF allowlisting.

## Related articles

- [Pinpoint Integration Guide](pinpoint-integration-guide.md)
- [Salesloft Integration Guide](salesloft-integration-guide.md)
- [SendGrid Integration Guide](sendgrid-integration-guide.md)
- [Lattice Integration Guide](lattice-integration-guide.md)
- [Dropbox Integration Guide](dropbox-integration-guide.md)
