# JetBrains Integration Guide

Source: https://help.drata.com/en/articles/9773698-jetbrains-integration-guide
Collection: Connection Support › Other Guidance
Updated: 2026-03-04
Fetched: 2026-11-22
Description: Learn how to connect JetBrains Space to Drata. This connection supports the following types: Access Reviews (UAR).

## Article text

The **JetBrains Space integration** enables security and compliance teams to automate **User Access Reviews (UAR)** by syncing user and team membership data directly from JetBrains Space. This integration helps reduce manual work and ensures access review workflows use accurate and up-to-date user information.

---

## Key Capabilities

- **User Access Review Data Sync:** Import JetBrains Space users and team memberships into Drata
- **Access Governance:** Support periodic access reviews to validate appropriate user permissions
- **Compliance Evidence Collection:** Maintain visibility into user access for audit and compliance workflows

This integration supports **User Access Review workflows**, helping demonstrate compliance with **access control policies**.

---

## Prerequisites & Data Access

Before connecting JetBrains Space to Drata, ensure the following requirements are met:

- **JetBrains Space admin access:** You must have **Administrator privileges** in your JetBrains Space account.
- **JetBrains Space subdomain:** You must know your organization’s **JetBrains Space subdomain**.
   - Example: If your URL is `https://subdomain.jetbrains.space`, the subdomain is `subdomain`.
- **Personal Access Token:** You must generate a **JetBrains Space personal access token** with the required permissions.

**Required Drata Role with Write access**

- Admin
- Workspace Managers
- DevOps Engineer

**Drata Access Reviewers**

Access Reviewers can view the connection page but cannot modify connection settings.

---

### Permissions & Data Table

| Permission/Scope | Why It’s Needed |
|---|---|
| Member Teams: View memberships | Allows Drata to retrieve team membership information |
| Members: View all external users | Allows Drata to retrieve external user accounts |
| Members: View member profiles | Allows Drata to retrieve user profile information |
| Members: View member profile basic info | Allows Drata to retrieve essential user identity data |
| Permissions: View permissions granted to other members | Allows Drata to evaluate user access levels |
| Teams: View teams | Allows Drata to retrieve JetBrains team structures |

---

## Step-by-Step Setup

### Step 1: Retrieve Your JetBrains Space Subdomain

1. Log in to your **JetBrains Space** account.
2. Locate the URL in your browser.
3. Copy the **subdomain** from the URL.

Example:
If the URL is `https://subdomain.jetbrains.space`, the subdomain is **subdomain**.

Expected outcome:
You have identified the **JetBrains Space subdomain** required to complete the connection.

---

### Step 2: Generate a Personal Access Token

1. Log in to your **JetBrains Space** account.
2. Navigate to the **Authentication** section.
3. Open the **Personal Tokens** page.
4. Select **New Personal Token**.
5. Configure the token with the following settings:
   - **Name: **Enter a name for the token.
   - **Expires: **Set an expiration date or leave blank for permanent access. If you set an expiration date, ensure the token is **renewed before it expires**.
   - **Access Level: **Select **Limited**.
   - **Permissions**
      - Member Teams → View memberships
      - Members → View all external users
      - Members → View member profiles
      - Members → View member profile basic info
      - Permissions → View permissions granted to other members
      - Teams → View teams
6. Save the token.
7. Copy the **personal access token**.

Expected outcome:
You have generated a **JetBrains Space personal access token** with the required permissions.

---

### Step 3: Connect JetBrains Space in Drata

Log in to **Drata** → go to the **Connections** page.

Navigate to your **Available Connections**.

Search for and start the **JetBrains connection process**.

Enter the following information when prompted:

- **JetBrains Space subdomain**
- **Personal access token**

Expected outcome:
JetBrains Space is successfully connected and user data begins syncing to Drata.

---

## Important Notes

- **Token expiration:** If your personal access token has an expiration date, ensure it is renewed before expiration to prevent connection failures.
- **Security best practice:** Store your personal access token securely and rotate it according to your organization’s security policies.
- **Network restrictions:** If your organization uses a **Web Application Firewall (WAF)**, ensure required Drata IP addresses are allowlisted so the connection can be established.

---

## Related articles

- [Segment Integration Guide](segment-integration-guide.md)
- [Canva Integration Guide](canva-integration-guide.md)
- [Pinpoint Integration Guide](pinpoint-integration-guide.md)
- [Dialpad Integration Guide](dialpad-integration-guide.md)
- [OpenVPN Integration Guide](openvpn-integration-guide.md)
