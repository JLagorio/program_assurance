# Rollbar Integration Guide

Source: https://help.drata.com/en/articles/9967708-rollbar-integration-guide
Collection: Connection Support › Other Guidance
Updated: 2025-12-09
Fetched: 2026-11-22

## Article text

Integrating Rollbar with Drata automates your user access reviews, saving time and reducing errors by syncing user data directly from Rollbar.

## Key Capabilities

- **Automated user access synchronization: **Pulls Rollbar user access details into Drata to power automated access review workflows.
- **Accurate, up-to-date access records: **Ensures compliance reporting reflects the current state of user permissions in Rollbar.
- **Continuous monitoring: **Tracks changes in Rollbar user access to support least-privilege and audit-readiness.

## Prerequisites & Data Access

- **Rollbar account access: **You must have **Owner** privileges within your Rollbar account.
- **Access Token required: **A Rollbar Access Token with the appropriate **read scope** is required to authenticate Drata.
- Must be assigned one of the following Drata roles: **Admin, Workspace Managers, DevOps Engineer**.
- If you have the **Access Reviewer** role, you can only view the Connections page.

### Permissions & Data Table

| Permission / Scope | Why It’s Needed | Data Accessed (Read Only) |
|---|---|---|
| Access Token with `read` scope | Allows Drata to retrieve user access information from Rollbar | User metadata and user access details |

## Step-by-Step Setup

### Step 1: Create a Rollbar Access Token

1. Log in to your **Rollbar account**.
2. In the left navigation menu, select **Settings**.
3. Under **Setup**, select **Account Access Tokens**.
4. Select **Add new access token**.
5. Enable the **read** scope:
   - Select the **pencil icon** next to the token.
   - Check the box for the **read** permission.
   - (Optional) Rename the token.
6. Copy the **Access Token** and store it securely. You will use this token when connecting Rollbar to Drata.

If your organization uses a **web application firewall (WAF)**, ensure Drata’s IP addresses are allowed to avoid connection errors.

### Step 2: Connect Rollbar Inside Drata

1. In Drata, select **Connections** from the left navigation menu.
2. Go to the **Available Connections** tab.
3. Search for **Rollbar** and select **Connect**.
4. During the connection process, enter the Access Token you created previously.
5. Review and confirm the details, then complete the connection.

**Expected outcome:** Drata successfully validates the token and connects to Rollbar.

## Related articles

- [Sentry Integration Guide](sentry-integration-guide.md)
- [Leapsome Integration Guide](leapsome-integration-guide.md)
- [MeisterTask Integration Guide (UAR)](meistertask-integration-guide-uar.md)
- [Aircall Integration Guide](aircall-integration-guide.md)
- [Harvest Integration Guide](harvest-integration-guide.md)
