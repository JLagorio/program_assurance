# ClearCompany (formerly Brainer)

Source: https://help.drata.com/en/articles/12590328-clearcompany-formerly-brainer
Collection: Connection Support › Other Guidance
Updated: 2026-11-14
Fetched: 2026-11-22

## Article text

## Prerequisites & Data Access

- Admin privileges in your [ClearCompany (formerly Brainer)](https://www.clearcompany.com/brainier/) account to complete this integration.
- ClearCompany API Client created. Required API scopes enabled (`groups`, `users`)
- ClearCompany subdomain
- Username of SuperAdmin or Service Account (optional but recommended)

## Step-by-Step Setup

### Step 1: Create API Client

1. Log in to ClearCompany LMS.
2. Navigate to:
   **Admin > Settings > Options > Integrations > Elan REST API > Manage API Clients**
3. Click **Add** to create a new API Client.
4. Fill out:
   - **Client Name**: e.g. `Drata Integration`
   - **Token Duration**: Up to 1440 minutes (24 hours)
   - **Scopes**:
      - `groups `
      - `users`
5. Click **Save** to generate credentials.
6. Copy **Client ID **and **Client Secret** *(store securely)*

### Step 2: Copy ClearCompany Subdomain

1. Your ClearCompany subdomain is the first part of your ClearCompany URL.
2. For example, if your ClearCompany URL is **`https://mycompany.clearcompany.com`**, your subdomain is **`mycompany`**.

### Step 3: Copy ClearCompany Username

1. Identify the username of the account you want to bind the access token to. This is typically a SuperAdmin account or a dedicated service account with appropriate permissions.
2. If no username is supplied during authentication, the token will be bound to the default SuperAdmin account (user_id 1).

### Step 4: Link your ClearCompany Account to Drata

1. Go to **Connections** in Drata.
2. Select **ClearCompany.**
3. Enter:
   - Subdomain
   - Client ID
   - Client Secret
   - Username (optional)

## Related articles

- [Bullhorn Integration Guide](bullhorn-integration-guide.md)
- [Databricks Integration Guide (UAR)](databricks-integration-guide-uar.md)
- [OpenVPN Integration Guide](openvpn-integration-guide.md)
- [Docebo Integration Guide](docebo-integration-guide.md)
- [Udemy Integration Guide](udemy-integration-guide.md)
