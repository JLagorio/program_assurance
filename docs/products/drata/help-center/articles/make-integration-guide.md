# Make Integration Guide

Source: https://help.drata.com/en/articles/10595092-make-integration-guide
Collection: Connection Support › Other Guidance
Updated: 2025-10-27
Fetched: 2026-11-22

## Article text

Integrating Make with Drata automates your user access reviews, saving time and reducing errors by syncing user data directly from Make.

## Key Capabilities

- **Automated user access reviews:** Pulls user, organization, and team data from Make to verify access control compliance.
- **Real-time synchronization:** Keeps personnel information up to date within Drata.
- **Improved audit accuracy:** Provides verifiable evidence for identity and access-related compliance tests.

## Prerequisites & Data Access

- Must have **Owner** or **Admin** privileges in your **Make account**.
- Must have access to the organization’s **Environment**, **Organization ID**, and **API Token**.
- If your organization uses a **Web Application Firewall (WAF)**, allowlist Drata’s IP addresses.

### Permissions & Data Table

| Permission/Scope | Why It’s Needed | Data Accessed (Read Only) |
|---|---|---|
| organizations:read | Identifies and retrieves organizational data | Organization metadata and structure |
| teams:read | Syncs team information for access validation | Team memberships and permissions |
| user:read | Pulls user profiles for compliance verification | User identities and roles within Make |

## Step-by-Step Setup

### Step 1: Copy Your Make Environment

1. Log in to your **Make account** at [https://www.make.com/login](https://www.make.com/login).
2. Select the **organization** you want to connect.
3. Your **Environment** appears in the URL.
   - Example: If your URL is `https://eu1.make.com`, your Environment is `eu1`.

### Step 2: Copy Your Make Organization ID

1. Your **Organization ID** can be found in the URL when viewing your Organization Dashboard.
2. For example, if the URL is **`https://eu1.make.com/organizations/1234567/dashboard`**, the **Organization ID** is **1234567**.

### Step 3: Create a Make API Token

1. In Make, go to your **Profile**.
2. Select the **API Access** tab.
3. Click **+ Add Token**.
4. Enter a **Label** for the token.
5. Enable the following scopes:
   - `organizations:read`
   - `teams:read`
   - `user:read`
6. Click **Save** and copy the **API Token**.

### Step 4: Enable the Make Connection in Drata

1. In Drata, go to **Connections** in the side navigation menu.
2. Select the **Available Connections** tab.
3. Search for **Make** and click **Connect**.
4. Follow the setup instructions in the connection drawer.
5. Select **Save & Test Connection** to confirm setup.

## Related articles

- [Miro Integration](miro-integration.md)
- [Pipedrive Integration Guide](pipedrive-integration-guide.md)
- [Tableau Integration Guide](tableau-integration-guide.md)
- [1Password Integration Guide](1password-integration-guide.md)
- [Toggl Integration Guide](toggl-integration-guide.md)
