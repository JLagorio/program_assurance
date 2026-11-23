# Snowflake Integration Guide

Source: https://help.drata.com/en/articles/8987822-snowflake-integration-guide
Collection: Connection Support › Other Guidance
Updated: 2026-04-21
Fetched: 2026-11-22
Description: User Access Review connection: Connect Snowflake to Drata to review the list of users with access to Snowflake in your organization.

## Article text

The Snowflake integration enables security and compliance teams to review who has access to Snowflake in their organization. It connects Drata to Snowflake so your team can monitor user access, identify permission issues, and stay on top of user access reviews.

## Key Capabilities

- User access review data: Review the list of users with access to Snowflake
- Access governance support: Identify and validate access permissions for compliance
- Automated evidence collection: Sync Snowflake access data into Drata for user access reviews

## Prerequisites & Data Access

- Admin access to your Snowflake account: **ACCOUNTADMIN**
- Ability to create a dedicated Snowflake service user (non-human account) for the integration, configured to use key-pair or SSO-based authentication instead of password-only sign-in.
- Access to a Snowflake **warehouse**
- Ability to retrieve the following values for setup:
   - **Account Identifier**
   - **Client ID**
   - **Client Secret**
   - **Warehouse**
- Required Drata Role with Write access: Admin, Workspace Managers, DevOps Engineer
- Access Reviewers (Access Reviewers can only Read the connection page they can’t make changes)

### Permissions & Data Table

| Permission/Scope | Why It’s Needed |
|---|---|
| ACCOUNTADMIN | Required to create the role, security integration, and user needed for the connection |
| Imported privileges on SNOWFLAKE database | Allows the integration role to access Snowflake account metadata |
| Warehouse usage privilege | Allows the integration role to use the specified warehouse |
| OAuth client credentials | Allows Drata to authenticate to Snowflake securely |

## Step-by-Step Setup

### Step 1: Select a Warehouse

1. Log in to Snowflake as an **ACCOUNTADMIN** user.
2. Choose the warehouse you want to use for the integration.
3. For these instructions, the example warehouse is **COMPUTE_WH**.

Expected outcome: You have identified the Snowflake warehouse to use for the integration.

### Step 2: Create a Snowflake Role

1. Open a Snowflake worksheet.
2. Run the following SQL command to create a new role:
   ```
CREATE ROLE TEST_AUTH_ROLE;
   ```
3. Grant imported privileges on the Snowflake database to the role:
   ```
GRANT IMPORTED PRIVILEGES ON DATABASE SNOWFLAKE TO ROLE TEST_AUTH_ROLE;
   ```

Expected outcome: A new Snowflake role exists with access to required Snowflake metadata.

### Step 3: Create the Security Integration

1. In the Snowflake worksheet, run the following SQL command:
   ```
CREATE SECURITY INTEGRATION TEST_LOCAL_OAUTH 
TYPE = OAUTH 
ENABLED = TRUE 
OAUTH_CLIENT = CUSTOM 
OAUTH_CLIENT_TYPE = 'CONFIDENTIAL' 
OAUTH_REDIRECT_URI = 'https://app.drata.com/callback/snowflake' 
OAUTH_ISSUE_REFRESH_TOKENS = TRUE 
PRE_AUTHORIZED_ROLES_LIST = ('TEST_AUTH_ROLE');
   ```
2. Grant warehouse usage to the role. Replace **COMPUTE_WH** with your warehouse name if different:
   ```
GRANT USAGE ON WAREHOUSE COMPUTE_WH TO ROLE TEST_AUTH_ROLE; 
   ```

Expected outcome: The security integration is created and the role can use the selected warehouse.

### Step 4: Create the Integration User

Snowflake recommends using a `SERVICE` user type for integrations. This ensures the connection isn't tied to an individual person and follows "Strong Authentication" protocols.

1. Run the following command to create a dedicated user for Drata. This keeps the integration's activity separate from your personal account.
   ```
CREATE USER drata_integration_user
   TYPE = SERVICE
   DEFAULT_ROLE = TEST_AUTH_ROLE
   MUST_CHANGE_PASSWORD = FALSE;

GRANT ROLE TEST_AUTH_ROLE TO USER drata_integration_user;
   ```
   Note: If your version of Snowflake does not support `TYPE = SERVICE`, you can omit that line, but we highly recommend it for security.

Expected outcome: A dedicated Snowflake service user exists, has the integration role assigned, and is configured to use strong authentication (key-pair or SSO) instead of password-only authentication.

### Step 5: Gather the Required Credentials

You will need three specific pieces of information to finish the setup in Drata:

1. **Account Identifier:** Find this in the bottom-left corner of your Snowflake UI or by running `SELECT CURRENT_ACCOUNT_LOCATOR();`.
2. **Client ID & Secret:** Run the following command to retrieve your OAuth credentials:
   ```
SELECT SYSTEM$SHOW_OAUTH_CLIENT_SECRETS ('TEST_LOCAL_OAUTH');
   ```
3. Confirm the Warehouse value you want to use for the connection.

Expected outcome: You have the Account Identifier, Client ID, Client Secret, and Warehouse needed to connect Snowflake to Drata.

### Step 6: Confirm the Warehouse Format

Snowflake is case-sensitive regarding object names. To avoid connection errors:

- If your warehouse was created without quotes (e.g., `CREATE WAREHOUSE COMPUTE_WH`), enter it as **uppercase** in Drata: `COMPUTE_WH`.
- If it was created with double quotes (e.g., `CREATE WAREHOUSE "compute_wh"`), enter it **exactly** as it appears in the quotes.

For the Drata integration, use the warehouse name in **uppercase without quotes** when possible.

Expected outcome: Your warehouse value is formatted correctly for the connection and less likely to cause case-sensitivity errors.

### Step 7: Connect Snowflake in Drata

1. In Drata, go to the **Connections** page.
2. Navigate to your **Available Connections**. Search for and start the **Snowflake** connection process.
3. Enter the following when prompted:
   - **Account Identifier**
   - **Client ID**
   - **Client Secret**
   - **Warehouse**
4. Start the connection flow. Drata uses the Snowflake security integration you created in Step 3 to perform an **OAuth** flow:
   - Drata redirects you to Snowflake to complete an **interactive OAuth login** as a Snowflake user that has the integration role (for example, the `drata_integration_user` created in Step 4).
   - Sign in using **username + password** or **SSO**, according to how that user is configured.
5. After successful authentication, Drata completes the connection and begins syncing user access data from Snowflake into Drata.

Expected outcome: Snowflake is successfully connected and user access review data begins syncing to Drata.

## Important Notes

- Authentication:
   - Snowflake is enforcing strong authentication for human users and deprecating passwords for service users.
   - If your integration user is still configured with password-only authentication or as a legacy service user, follow Snowflake’s strong authentication guidance to migrate it to key-pair or SSO to avoid future connection issues.
   - See [https://docs.snowflake.com/en/user-guide/security-mfa-rollout](https://docs.snowflake.com/en/user-guide/security-mfa-rollout) for details.
- This integration is used for **User Access Review** and focuses on reviewing the list of users with access to Snowflake.
- The warehouse value can be **case-sensitive** depending on how it was created in Snowflake.
- To avoid warehouse naming issues, use the warehouse name in **uppercase without quotes** when possible.
- The provided information does not specify whether multiple warehouses can be reviewed through a single connection.

## Related articles

- [Miro Integration](miro-integration.md)
- [HubSpot Integration Guide (UAR)](hubspot-integration-guide-uar.md)
- [Sentry Integration Guide](sentry-integration-guide.md)
- [Scaleway Integration Guide](scaleway-integration-guide.md)
- [Tableau Integration Guide](tableau-integration-guide.md)
