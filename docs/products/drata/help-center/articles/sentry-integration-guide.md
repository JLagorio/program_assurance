# Sentry Integration Guide

Source: https://help.drata.com/en/articles/8987934-sentry-integration-guide
Collection: Connection Support › Other Guidance
Updated: 2026-03-09
Fetched: 2026-11-22
Description: User Access Review connection: Connect Sentry to Drata to review the list of users with access to Sentry in your organization.

## Article text

The Sentry integration enables security and compliance teams to review who has access to Sentry in their organization. It connects Drata to Sentry so your team can monitor user access, identify permission issues, and stay on top of user access reviews.

## Key Capabilities

- User access review data: Review the list of users with access to Sentry
- Access governance support: Identify and validate access permissions for compliance
- Automated evidence collection: Sync Sentry access data into Drata for user access reviews

This integration is used to automate tests such as user access review verification and privileged access review, helping prove compliance with access control and least privilege policies.

## Prerequisites & Data Access

- Admin access to your company’s Sentry account
- A Sentry **Internal Integration**
- Your Sentry **Organization Slug**
- Required Drata Role with Write access: Admin, Workspace Managers, DevOps Engineer
- Access Reviewers (Access Reviewers can only Read the connection page they can’t make changes)

### Permissions & Data Table

| Permission/Scope | Why It’s Needed |
|---|---|
| Project Admin access | Allows the internal integration to access project-level data needed for the connection |
| Organization Admin access | Allows the internal integration to access organization-level user access data |
| Internal Integration token | Allows Drata to authenticate to Sentry |
| Organization Slug | Identifies the correct Sentry organization for the connection |

## Step-by-Step Setup

### Step 1: Create a Sentry Internal Integration

1. Log in to **sentry.io**.
2. In the left navigation, select **Settings**.
3. Under **Developer Settings**, select **Custom Integrations**.
4. Select **Create New Integration**.
5. Choose **Internal Integration**.
6. Enter an **Integration Name**.
7. Under **Permissions**, enable **Admin** access for:
   - **Project**
   - **Organization**
8. Create the integration.
9. Copy the generated token.

Expected outcome: You have a Sentry Internal Integration token with the required permissions.

### Step 2: Find Your Organization Slug

1. Locate your Sentry organization URL.
   - Example: If your URL is `https://myorganization.sentry.io`, your **organization slug is `myorganization`**.
2. You can also find the slug in **Organization Settings → General Settings → Organization Slug**.
3. Copy the organization slug.

Expected outcome: You have the Sentry organization slug required for the connection.

### Step 3: Connect Sentry in Drata

1. Log in to **Drata** → go to the **Connections** page.
2. Navigate to your **Available Connections**.
3. Search for and start the **Sentry** connection process.
4. Enter the following when prompted:
   - **Access Token**
   - **Organization Slug**

Expected outcome:
Sentry is successfully connected and user access review data begins syncing to Drata.

## Important Notes

- Important notes: This integration is used for **User Access Review** and focuses on reviewing users with access to Sentry.
- Principle of least privilege: The connection uses a dedicated **Internal Integration** token instead of requiring direct user credentials.
- Ensure **Admin access** is enabled for both **Project** and **Organization** when creating the Sentry Internal Integration.
- The provided information does not specify whether additional Sentry scopes or workspace-level restrictions may affect the connection.

## Related articles

- [Snowflake Integration Guide](snowflake-integration-guide.md)
- [Miro Integration](miro-integration.md)
- [Segment Integration Guide](segment-integration-guide.md)
- [HubSpot Integration Guide (UAR)](hubspot-integration-guide-uar.md)
- [15Five Integration Guide](15five-integration-guide.md)
