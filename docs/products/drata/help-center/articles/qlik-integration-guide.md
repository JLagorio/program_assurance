# Qlik Integration Guide

Source: https://help.drata.com/en/articles/9774060-qlik-integration-guide
Collection: Connection Support › Other Guidance
Updated: 2026-07-01
Fetched: 2026-11-22

## Article text

Integrating Qlik with Drata automates your user access reviews, saving time and reducing errors by syncing user data directly from Qlik.

## Key Capabilities

- **Automated user access synchronization: **Sync Qlik Cloud user accounts and access details into Drata for continuous monitoring.
- **Accurate access review workflows: **Ensure compliance tests reflect the current state of user access in Qlik.
- **Time-saving automation: **Reduce manual evidence collection and streamline audits by using Qlik as a verified access source.

## Prerequisites & Data Access

- Ensure you have Admin privileges within your Qlik Cloud.
- Must be assigned one of the following Drata roles: **Admin, Workspace Managers, DevOps Engineer**.
- If you have the **Access Reviewer** role, you can only view the Connections page.
- Copy your Qlik tenant name. You will need this to connect Qlik to Drata.
- Copy your Qlik API Key. You will need this to connect Qlik to Drata.
- If your organization uses a web application firewall (WAF), make sure you [allow the following IP addresses](allowlist-ip-addresses-for-waf-configurations.md) to ensure successful connection.

### Permissions & Data Table

| Permission / Scope | Why It’s Needed | Data Accessed (Read Only) |
|---|---|---|
| Qlik API Key | Authenticates Drata to retrieve user access data | User accounts and user access metadata |
| Qlik Tenant Name | Identifies the correct Qlik Cloud environment | Tenant-specific user access data |

## Step-by-Step Setup

### Step 1: Identify Your Qlik Tenant Name

Your tenant name appears in your Qlik Cloud URL:
If your URL is:
`https://my-tenant.eu.qlikcloud.com/hub`
Your tenant name is:
`my-tenant`

### Step 2: Create a Qlik API Key

1. Log in to **Qlik Cloud**.
2. Open your **Profile Settings**.
3. From the left-side navigation under **Management**, select **API keys**.
4. Select **Generate new key**.
5. Enter the API key details (description, scope, name).
6. Generate and **copy** the API key.
7. Note the **expiration date** for rotation and maintenance purposes.

**Important:** If your organization uses a Web Application Firewall (WAF), ensure Drata’s IP addresses are allowlisted to avoid connection errors.

### Step 3: Open the Qlik Connection in Drata

1. Select **Connections **on the side navigation menu.
2. Select the **Available connections** tab, search for Qlik, and select **Connect**.
3. Follow the instructions on the connection drawer.
   - After you select connect to Qlik, on the popup modal, enter the required fields with the values that you obtained from the previous section.

## Additional resources

- [Access Reviews](https://help.drata.com/en/articles/8895897-access-reviews)

## Related articles

- [Elastic Integration Guide](elastic-integration-guide.md)
- [15Five Integration Guide](15five-integration-guide.md)
- [SendGrid Integration Guide](sendgrid-integration-guide.md)
- [Articulate Integration Guide](articulate-integration-guide.md)
- [Dropbox Sign Integration Guide](dropbox-sign-integration-guide.md)
