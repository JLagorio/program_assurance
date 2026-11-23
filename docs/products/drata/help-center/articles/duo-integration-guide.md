# Duo Integration Guide

Source: https://help.drata.com/en/articles/9788421-duo-integration-guide
Collection: Connection Support › Other Guidance
Updated: 2026-08-17
Fetched: 2026-11-22

## Article text

Integrating Duo with Drata automates your user access reviews, saving time and reducing errors by syncing user data directly from Duo.

## Key Capabilities

- **Automated user access synchronization: **Sync Duo user and administrative access metadata into Drata.
- **Continuous access monitoring: **Keep access reviews accurate and up to date without manual data entry.
- **Compliance-ready evidence collection: **Supports automated testing for access control requirements, including Access Reviews.

## Prerequisites & Data Access

- You must have the **Owner** role within Duo to configure the Admin API.
- Must be assigned one of the following Drata roles: **Admin, Workspace Managers, DevOps Engineer**.
- If you have the **Access Reviewer** role, you can only view the Connections page.

### Permissions & Data Table

| Permission / Scope | Why It’s Needed | Data Accessed (Read Only) |
|---|---|---|
| Duo Admin API keys (Integration key, Secret key, API hostname) | Authenticate Drata to Duo’s Admin API | User metadata, admin user listings, group membership |
| Admin API permissions | Allow Drata to read required access information | User and admin access data used for Access Reviews |

## Step-by-Step Setup

### Step 1: Generate Duo Admin API Credentials

1. Log in to your **[Duo Admin](https://admin.duosecurity.com/)** page and select **Applications **which is on the left side navigation.
2. Select **Protect an Application **button on the Applications page.
3. Scroll down the Admin API and select the corresponding** Protect** button.
4. Copy the following information:
   - Integration key,
   - Secret key, and
   - API hostname.
   - You will need this to connect Duo to Drata.
5. Configure the following permissions. You can configure these permissions on the same page you copied the integrations keys. It will be located under the **Permissions **section.
   - `Grant administrators`
   - `Grant read information`
   - `Grant settings`
   - `Grant read resource`
   - `Grant write resource`
6. If your organization uses a web application firewall (WAF), make sure you [allow the following IP addresses](https://help.drata.com/en/articles/10929029-waf-access-ip-allowlist-for-uar-connections) to ensure successful connection.

### Step 2: Enter Duo Credentials

1. Select **Connections **on the side navigation menu.
2. Select the **Available connections** tab, search for Duo, and select **Connect**.
3. Follow the instructions on the connection drawer.
   - After you select connect to Duo, on the popup modal, enter the required fields with the values that you obtained from the previous section.

## Additional resources

- [Access Reviews](https://help.drata.com/en/articles/8895897-access-reviews)

## Related articles

- [HubSpot Integration Guide (UAR)](hubspot-integration-guide-uar.md)
- [Attio Integration Guide](attio-integration-guide.md)
- [Envoy Integration Guide](envoy-integration-guide.md)
- [15Five Integration Guide](15five-integration-guide.md)
- [Lattice Integration Guide](lattice-integration-guide.md)
