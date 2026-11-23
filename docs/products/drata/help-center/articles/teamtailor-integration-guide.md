# Teamtailor Integration Guide

Source: https://help.drata.com/en/articles/9236588-teamtailor-integration-guide
Collection: Connection Support › Other Guidance
Updated: 2025-10-27
Fetched: 2026-11-22

## Article text

The **Teamtailor integration** enables **HR, IT, and Compliance teams** to automate user access reviews and streamline onboarding verification by syncing personnel data directly from **Teamtailor** into Drata. This integration helps maintain compliance by ensuring all employee accounts are provisioned and managed according to company policy.

## Key Capabilities

- **Automated user synchronization:** Imports employee records, roles, and permissions from Teamtailor to Drata.
- **Access verification:** Ensures personnel access aligns with defined recruitment and onboarding roles.
- **Evidence automation:** Provides proof of HR and recruiting access configurations for compliance audits.

## Prerequisites & Data Access

- Must have **Admin privileges** in your **Teamtailor account**.
- Must have access to **create API keys** and **view the Company ID**. Refer to [Using Teamtailor API](https://support.teamtailor.com/en/articles/5963369-use-our-teamtailor-api) for more Teamtailor API information.
- Must have or create a **Recruitment Admin account** with valid login credentials.
- If your organization uses a **Web Application Firewall (WAF)**, ensure Drata’s IP addresses are allowlisted.

### Permissions & Data Table

| **Permission/Scope** | **Why It’s Needed** | **Data Accessed (Read Only)** |
|---|---|---|
| API Key (Admin scope with Read access) | Authorizes Drata to retrieve user and company data | User names, roles, emails, and employee metadata |
| Company ID | Identifies your Teamtailor organization | Organizational and employee directory |
| Account Email and Password | Authenticates the recruitment admin account for data access | Admin-level user data and permissions mapping |

## Step-by-Step Setup

### Step 1: Generate a Teamtailor API Key

1. Log in to your **Teamtailor account**.
2. Go to **Settings** from the top menu.
3. In the left-hand sidebar, under **Integrations**, select **API Keys**.
4. Click **New API Key** in the upper-right corner.
5. Fill in the required details:
   - **Name:** Enter a descriptive name (e.g., “Drata Integration Key”).
   - **API Scope:** Set to **admin**.
   - **Read:** Enable the **Read** option.
6. Copy the generated **API Key**.
7. Locate your **Company ID** in the URL (format example: `https://app.teamtailor.com/companies/<company_id>/settings`).
8. Save both values securely for the next steps.

### Step 2: Create a Recruitment Admin Account

1. In Teamtailor, select the **Employees** tab.
2. Click the **➕ (Add Employee)** icon.
3. Fill out the required fields for the new user account.
4. Set the **Role** to **Recruitment Admin** to ensure full API and integration permissions.
5. If your Teamtailor environment uses **SSO (Single Sign-On)**, exclude the integration user from SSO:
   - Go to **Settings → Exclude individual users from SSO login**.
   - Exclude the new Recruitment Admin user.
6. Ensure a password is set for the account.
   - You may need to edit permissions via the **gear icon (⚙️)** in the **Employees** tab.
7. The new user will receive an email invitation.
   - Click **Create Account** from the email.
   - Log out of any active sessions if prompted to set a password.

## Complete the Connection

In Drata’s **Connections** page, enter the following information:

| Drata Field | Teamtailor Value |
|---|---|
| API Key | The API key created in Teamtailor’s Integration settings |
| Company ID | The company ID found in the Teamtailor URL |
| Email | Recruitment Admin account email |
| Password | Recruitment Admin account password |

For steps on accessing and using the Connections page in Drata, refer to [The Connections Page in Drata](https://help.drata.com/en/articles/12305645-the-connections-page-in-drata).

## Related articles

- [BambooHR Integration Guide](bamboohr-integration-guide.md)
- [TriNet Integration Guide](trinet-integration-guide.md)
- [15Five Integration Guide](15five-integration-guide.md)
- [Anthropic Integration Guide](anthropic-integration-guide.md)
- [Dayforce Integration Guide (HRIS)](dayforce-integration-guide-hris.md)
