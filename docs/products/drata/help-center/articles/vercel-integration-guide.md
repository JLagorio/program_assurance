# Vercel Integration Guide

Source: https://help.drata.com/en/articles/9923210-vercel-integration-guide
Collection: Connection Support › Other Guidance
Updated: 2026-03-04
Fetched: 2026-11-22
Description: Learn how to connect Vercel to Drata. This connection supports the following types: User Access Reviews (UAR).

## Article text

The **Vercel integration** enables security and compliance teams to review and monitor users who have access to Vercel within your organization. By syncing user access data from Vercel, Drata helps streamline **User Access Reviews** and maintain visibility into who can access your deployment environment.

## Key Capabilities

- **User Access Review Data Sync:** Import Vercel user access data to support access review workflows
- **Access Governance:** Monitor which users have access to your Vercel team environment
- **Compliance Monitoring:** Maintain visibility into user access for audit and compliance purposes

This integration supports **User Access Review workflows**, helping demonstrate compliance with **access control policies**.

## Prerequisites & Data Access

### Vercel Access Requirements

- You must have access to the **Vercel team account** you want to connect.
- You must retrieve your **Vercel Team ID**.
- You must generate a **Vercel access token**.

### Drata Role Requirements

To create or modify connections, you must have one of the following **Drata roles with write access**:

- Admin
- Workspace Manager
- DevOps Engineer

**Access Reviewers** can view the connection page but cannot create or modify connections.

### Permissions & Data Table

| Permission/Scope | Why It’s Needed |
|---|---|
| Team ID | Identifies the Vercel team environment to connect |
| Access Token | Allows Drata to retrieve user access data from Vercel |

## Step-by-Step Setup

### Step 1: Retrieve Your Vercel Team ID

1. Log in to your **Vercel account**.
2. Open your **team dashboard**.
3. In the sidebar, navigate to **Settings**.
4. Select **General** from the left-hand navigation.
5. Scroll to the **Team ID** section.
6. Copy the **Team ID**.

Refer to Vercel documentation if needed: **[Find your team ID](https://vercel.com/docs/accounts#find-your-team-id)**

Expected outcome:
You have copied your **Vercel Team ID**.

### Step 2: Create a Vercel Access Token

1. Log in to your **Vercel account**.
2. Navigate to your **account settings**.
3. Generate a new **Access Token**.
4. Copy the generated token and store it securely.

Expected outcome:
You have created a **Vercel access token** that can be used to authenticate the integration.

### Step 3: Connect Vercel in Drata

1. Log in to **Drata** → go to the **Connections** page.
2. Navigate to your **Available Connections**.
3. Search for and start the **Vercel connection process**.
4. Enter the following information when prompted:
   - **Team ID**
   - **Token**

Expected outcome:
Vercel is successfully connected and user access data begins syncing to Drata.

---

## Important Notes

- **Authentication method:** The Vercel integration uses an **access token**.
- **Security best practice:** Store access tokens securely and rotate them according to your organization’s security policies.

## Related articles

- [Segment Integration Guide](segment-integration-guide.md)
- [Canva Integration Guide](canva-integration-guide.md)
- [Tableau Integration Guide](tableau-integration-guide.md)
- [OpenVPN Integration Guide](openvpn-integration-guide.md)
- [Toggl Integration Guide](toggl-integration-guide.md)
