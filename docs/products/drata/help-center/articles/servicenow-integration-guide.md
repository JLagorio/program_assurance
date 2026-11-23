# ServiceNow Integration Guide

Source: https://help.drata.com/en/articles/7939967-servicenow-integration-guide
Collection: Connection Support › Ticketing Guidance
Updated: 2026-08-05
Fetched: 2026-11-22

## Article text

The ServiceNow integration enables security and compliance teams to automatically monitor how security issues are tracked and prioritized. It connects Drata to ServiceNow so your team can verify that security issues are logged, categorized, and prioritized according to your organization’s security processes.

## Key Capabilities

- **Security ticket monitoring**: Track incidents, problems, and tasks used for security issues
- **Evidence collection**: Verify that security issues are properly logged and prioritized
- **Optional ticket creation**: Allow Drata to create security tickets directly in ServiceNow

This integration is used to automate tests such as security issue tracking verification, helping prove compliance with vulnerability management and incident response policies.

## Prerequisites & Data Access

- Access to your **ServiceNow subdomain**
- A **ServiceNow username and password**
- Recommended: ServiceNow user with the roles:
   - `admin`
   - `web_service_admin`
- Required Drata Role with Write access: Admin, Workspace Managers, DevOps Engineer
- Access Reviewers (Access Reviewers can only Read the connection page they can’t make changes)

### Permissions & Data Table

| Permission/Scope | Why It’s Needed |
|---|---|
| admin | Allows Drata to access ServiceNow records needed to verify security issue tracking |
| web_service_admin | Enables API access for ServiceNow web services |

## Step-by-Step Setup

## Step 1: Locate Your ServiceNow Subdomain

1. Sign in to your ServiceNow instance.
2. Check the URL in your browser.
   - Example: If your URL is `https://acme.service-now.com`, your **subdomain is `acme`**.
3. Copy the subdomain value.

Expected outcome: You have the ServiceNow subdomain required for authentication.

---

## Step 2: Account Setup

### Option 1: Admin Setup (Recommended)

This method uses an existing ServiceNow admin account and is the fastest setup option.

### Confirm Admin Roles

1. In ServiceNow, open the navigation menu and select **All**.
2. Navigate to **User Administration → Users**.
3. Search for and open the user account you will use for the integration.
4. In the **Roles** section, confirm the following roles are present:
   - `admin`
   - `web_service_admin`
5. If they are missing:
   - Click **Edit**
   - Locate each role in the collection list
   - Move them to the selected roles list
   - Click **Save**

Expected outcome: The user account has the required ServiceNow roles for API access. Move on to Step 3: Connect ServiceNow in Drata to complete the connection.

---

### Option 2: Non-Admin Setup (Least Privilege)

This method creates a dedicated integration user with restricted permissions. For setup instructions, see [Setting Up ServiceNow Scopes and Roles for Non-Admin Users](https://help.merge.dev/articles/8660564895-setting-up-servicenow-scopes-and-roles-for-non-admin-users#create-custom-acls-access-control-rules) in the Merge Help Center.

---

## Step 3: Connect ServiceNow in Drata

1. Log in to **Drata** → go to the **Connections** page.
2. Navigate to your **Available Connections**.
3. Search for and start the **ServiceNow** connection process.
4. Enter the account alias, the ticket types, and tags.
   - Select the ticket types your organization uses for security issues:
      - Incident
      - Problem
      - Task
   - Enter your **Security Tag** (must exactly match the tag used in ServiceNow).
5. Enter the following when prompted:
   - **ServiceNow subdomain**
   - **ServiceNow username**
   - **ServiceNow password**
6. Ensure the **Priority field** is enabled in ServiceNow for your selected ticket types.
7. *(Optional)* Enable **Write Access** if you want Drata to create tickets automatically.

Expected outcome:
ServiceNow is successfully connected and ticket data begins syncing to Drata.

## Important Notes

- Supported ticket types currently include **Incident, Problem, and Task**.
- The **Security Tag must exactly match** the tag configured in ServiceNow.
- Write access is optional and allows Drata to **create security tickets automatically**.
- Using the **admin setup** is recommended for the simplest configuration.
- Least-privilege setups require correctly configured **roles, ACLs, and table permissions**. If these are misconfigured, the integration may not retrieve or create tickets successfully.

## Related articles

- [Shortcut Integration Guide](shortcut-integration-guide.md)
- [Asana Integration Guide](asana-integration-guide.md)
- [Zoho Bug Tracker Integration Guide](zoho-bug-tracker-integration-guide.md)
- [ClickUp Integration Guide](clickup-integration-guide.md)
- [Create and Manage Tickets in Drata](create-and-manage-tickets-in-drata.md)
