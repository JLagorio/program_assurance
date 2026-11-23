# Leapsome Integration Guide

Source: https://help.drata.com/en/articles/9300676-leapsome-integration-guide
Collection: Connection Support › Other Guidance
Updated: 2026-03-10
Fetched: 2026-11-22

## Article text

The Leapsome integration enables security and compliance teams to review who has access to Leapsome in their organization. It connects Drata to Leapsome so your team can monitor user access and roles to support compliance and access governance requirements.

## Key Capabilities

- User access review data: Review individuals with access to Leapsome
- Role visibility: Monitor assigned roles within the platform
- Automated evidence collection: Sync access data into Drata for compliance reviews

This integration is used to automate tests such as user access review verification and privileged access review, helping prove compliance with access control and least privilege policies.

## Prerequisites & Data Access

- Administrative access to your **Leapsome account**
- Access to generate a **Leapsome SCIM Token**
- Required Drata Role with Write access: Admin, Workspace Managers, DevOps Engineer
- Access Reviewers (Access Reviewers can only Read the connection page they can’t make changes)

### Permissions & Data Table

| Permission/Scope | Why It’s Needed |
|---|---|
| SCIM Token | Allows Drata to access user provisioning and identity data for access reviews |

## Step-by-Step Setup

### Step 1: Generate the SCIM Token

1. In Leapsome, locate the **SCIM configuration or provisioning settings**.
2. Generate a **SCIM Token**.
3. Copy the generated token.

Expected outcome: You have the SCIM Token required for the integration.

### Step 3: Connect Leapsome in Drata

1. Log in to **Drata** → go to the **Connections** page.
2. Navigate to your **Available Connections**.
3. Search for and start the **Leapsome** connection process.
4. Enter the following when prompted:
   - **SCIM Token**

Expected outcome:
Leapsome is successfully connected and user access data begins syncing to Drata.

## Important Notes

- This integration is used for **User Access Review** and focuses on reviewing users and roles within Leapsome.
- If your organization uses a **Web Application Firewall (WAF)**, ensure required IP addresses are allowlisted for the connection.

## Related articles

- [Okta Integration Guide (User Access Review)](okta-integration-guide-user-access-review.md)
- [Canva Integration Guide](canva-integration-guide.md)
- [Klaviyo Integration Guide](klaviyo-integration-guide.md)
- [CyberArk Integration Guide](cyberark-integration-guide.md)
- [1Password Integration Guide](1password-integration-guide.md)
