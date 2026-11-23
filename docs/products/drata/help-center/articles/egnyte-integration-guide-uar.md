# Egnyte Integration Guide (UAR)

Source: https://help.drata.com/en/articles/9769774-egnyte-integration-guide-uar
Collection: Connection Support › Other Guidance
Updated: 2025-12-10
Fetched: 2026-11-22

## Article text

Integrating Egnyte with Drata automates your user access reviews, saving time and reducing errors by syncing user data directly from Egnyte.

## Key Capabilities

- **Access retrieval**: Retrieves users and assigned roles from connected systems.
- **Review enablement**: Makes this access data available for review in Drata’s Access Reviews feature.
- **Account mapping support**: Allows external accounts to be mapped to Drata personnel for accurate review and tracking.

## Prerequisites & Data Access

- Ensure you have Admin privileges within your Egnyte account and Egnyte developers account.
   - You can register for an account at **[Egnyte for Developers](https://developers.egnyte.com/member/register)**.
- You will need:
   - Egnyte **domain**
   - Egnyte **Administrator username**
   - Egnyte **Administrator password**
   - Egnyte **Client ID** (Client Key)
   - Egnyte **Client Secret**
- Must be assigned one of the following Drata roles: **Admin, Workspace Managers, DevOps Engineer**.
- If you have the **Access Reviewer** Drata role, you can only view the Connections page.

## Permissions & Data Table

| Permission / Scope | Why It’s Needed | Data Accessed (Read-Only) |
|---|---|---|
| Egnyte Admin login | Required to authenticate the integration | User list, role metadata |
| Client ID & Secret | Allow Drata to connect via OAuth | Access information from Egnyte IAM |
| Egnyte Domain | Identifies your Egnyte tenant | Tenant-specific user access data |

## Step-by-Step Setup

### Step 1: Create credentials / app registration

You will need to create a new application to copy the client ID and secret.

1. Create an Egnyte developers account. If you do not already one, you can **[register here](https://developers.egnyte.com/)** using your existing Egnyte Administrator email.
2. Go to [My Applications](https://developers.egnyte.com/apps/myapps) in Egnyte | For Developers.
3. Select **CREATE A NEW APPLICATION**.
4. Enter the application details.
   - **Name of your application**: Name of the application.
   - **Type**: Internal Application (own company use only)
   - **Current User Base**: New App
   - **Platform**: Web App
   - **Egnyte Domain**: Enter your domain.
   - **Registered OAuth Redirect URI**: **`https://api.stackone.com/connect/oauth2/egnyte_iam/callback`**
   - **Issue a new key for Egnyte connect API**: Enable
5. Register the application.
6. Navigate to the **Keys **tab on the **My API Keys **page.
7. Copy your key (which is the client ID) and secret (which is the client secret). You will need this to connect Egnyte to Drata.

**Expected outcome:**
You now have a registered Egnyte application with a Client ID and Client Secret.

### Step 2: Assign roles / grant permissions

1. Ensure your Egnyte user has **Admin privileges** within:
   - Your Egnyte domain
   - Your Egnyte Developers account
2. Ensure that the user whose credentials will be used to connect Egnyte to Drata also has the correct access to view users and roles.

**Expected outcome:**
Your Egnyte user account has the permissions needed for Drata to retrieve user access information.

### Step 3: Copy your Egnyte domain

1. Log in to your **[Egnyte File Server](https://www.egnyte.com/)**.
2. Your Domain is found in the URL.
   If your URL is **`https://my-domain.egnyte.com`**, then the Domain is **`my-domain`**.

**Expected outcome:**
All required Egnyte credentials and configuration values are ready for the Drata connection setup.

### Step 4: Connect inside Drata

1. In Drata, go to **Connections**.
2. Select the **Available Connections** tab.
3. Search for **Egnyte**, then select **Connect**.
4. In the connection drawer, enter:
   - Egnyte domain
   - Egnyte username
   - Egnyte password
   - Client ID
   - Client Secret
5. Complete the OAuth connection process.

**Expected outcome:**
Drata connects to your Egnyte domain and begins importing your Egnyte user access data.

## Related articles

- [OneLogin Integration Guide](onelogin-integration-guide.md)
- [Domo Integration Guide](domo-integration-guide.md)
- [RingCentral Integration Guide](ringcentral-integration-guide.md)
- [Smartsheet Integration Guide](smartsheet-integration-guide.md)
- [PingOne Integration Guide](pingone-integration-guide.md)
