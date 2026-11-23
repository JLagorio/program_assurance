# Tableau Integration Guide

Source: https://help.drata.com/en/articles/9774359-tableau-integration-guide
Collection: Connection Support › Other Guidance
Updated: 2026-11-14
Fetched: 2026-11-22
Description: Learn how to connect Tableau to Drata. This connection supports the following types: User Access Reviews (UAR).

## Article text

The **Tableau integration** enables security and compliance teams to automate **User Access Reviews (UAR)** by syncing user and role data directly from Tableau. This helps organizations review who has access to Tableau and monitor assigned roles to support compliance monitoring.

---

## Key Capabilities

- **User Access Monitoring:** Retrieve Tableau user accounts for access review workflows
- **Role Visibility:** Monitor roles assigned to users within Tableau sites
- **Compliance Monitoring:** Maintain visibility into system access for audit readiness

This integration supports **User Access Review workflows**, helping demonstrate compliance with **access control policies**.

---

## Prerequisites & Data Access

### Tableau Access Requirements

- You must have **Site Administrator Creator privileges** in your **Tableau account**.
- You must obtain your **Tableau Server URL** and **Content URL**.
- You must generate a **Tableau Personal Access Token (PAT)**.

### Drata Role Requirements

- To create or modify connections, you must have one of the following **Drata roles with write access**: Admin, Workspace Manager, or DevOps Engineer
- **Access Reviewers** can view the connection page but cannot create or modify connections

---

### Permissions & Data Table

| Permission / Access | Why It’s Needed |
|---|---|
| Personal Access Token | Authenticates the integration with Tableau |
| Server URL | Identifies the Tableau server instance |
| Content URL | Identifies the Tableau site being connected |

---

## Step-by-Step Setup

### Step 1: Identify Your Tableau Server and Content URLs

1. Log in to your **Tableau account**.
2. Your Server URL and Content URL are found in the URL when you are logged in to your Tableau Cloud account.
   - Example given the URL: **`https://prod-uk-a.online.tableau.com/#/site/devb73211b483/users`**
   - Server URL: **`https://prod-uk-a.online.tableau.com`**
   - Content URL: **`devb73211b483`**

Expected outcome:
 You have copied the **Server URL** and **Content URL** required for the integration.

---

### Step 2: Create a Tableau Personal Access Token

1. In Tableau, select your **profile icon** in the top-right corner.
2. Select **My Account Settings**.
3. In the **Settings** tab, scroll to **Personal Access Tokens**.
4. Enter a **name** for the token.
5. Select **Create**.
6. Copy the following values and store them securely:
   - **Token Name**
   - **Token Secret**

Expected outcome:
 You have created and saved the **Personal Access Token credentials**.

---

### Step 3: Connect Tableau in Drata

1. Log in to **Drata** → go to the **Connections** page.
2. Navigate to your **Available Connections**.
3. Search for and start the **Tableau connection process**.
4. Enter the following information when prompted:
   - **Server URL**
   - **Content URL**
   - **Personal Access Token Name**
   - **Personal Access Token Secret**

Expected outcome:
 Tableau is successfully connected and user access data begins syncing to Drata.

---

## Important Notes

- **Authentication method:** The Tableau integration uses a **Personal Access Token (PAT)**.
- **Token security:** Store your token secret securely and rotate it according to your organization’s security policies.
- **Network restrictions:** If your organization uses a **Web Application Firewall (WAF)**, ensure required Drata IP addresses are allowlisted so the connection can be established.

## Related articles

- [Segment Integration Guide](segment-integration-guide.md)
- [Canva Integration Guide](canva-integration-guide.md)
- [Pinpoint Integration Guide](pinpoint-integration-guide.md)
- [Vercel Integration Guide](vercel-integration-guide.md)
- [Toggl Integration Guide](toggl-integration-guide.md)
