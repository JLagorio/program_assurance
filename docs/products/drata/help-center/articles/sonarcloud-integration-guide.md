# SonarCloud Integration Guide

Source: https://help.drata.com/en/articles/9869023-sonarcloud-integration-guide
Collection: Connection Support › Other Guidance
Updated: 2025-12-09
Fetched: 2026-11-22

## Article text

Integrating SonarCloud with Drata automates your user access reviews, saving time and reducing errors by syncing user data directly from SonarCloud.

## Key Capabilities

- **Automated user access synchronization: **Pulls SonarCloud user and organization membership data into Drata for compliance monitoring.
- **Continuous access review automation: **Keeps user access records up to date with SonarCloud as the source of truth.
- **Improved audit efficiency: **Evidence for access control tests is automatically collected and available in Drata.

## Prerequisites & Data Access

- You must have **Admin** privileges within your SonarCloud organization.
- **Required credentials from SonarCloud:**
   - **User Token**
   - **Organization Key**
- Must be assigned one of the following Drata roles: **Admin, Workspace Managers, DevOps Engineer**.
- If you have the **Access Reviewer** role, you can only view the Connections page.

### Permissions & Data Table

| Permission / Scope | Why It’s Needed | Data Accessed (Read Only) |
|---|---|---|
| User Token | Authenticates Drata to SonarCloud's API | User list, organization membership metadata |
| Organization Key | Identifies the organization Drata should sync | Organization users and permissions |

## Step-by-Step Setup

### Step 1: Create a SonarCloud User Token & Locate Organization Key

1. Log in to **SonarCloud** using your preferred authentication provider
   (example: GitHub).
2. Complete the authentication process and sign in.
3. Navigate to **My Account** (or your account settings page).
4. Create a **User Token**:
   - Go to the *Security* or *Tokens* section.
   - Generate a new user token.
   - Copy the token and store it securely.
5. Navigate to the **Organizations** section.
6. Copy your **Organization Key** for the organization you want Drata to monitor.

**Note:** If your organization uses a web application firewall (WAF), make sure you allow the following IP addresses to ensure successful connection.

### Step 2: Enter Required Credentials

1. Select **Connections **on the side navigation menu.
2. Select the **Available connections** tab, search for SonarCloud, and select **Connect**.
3. Follow the instructions on the connection drawer.
   - After you select connect to SonarCloud, on the popup modal, enter the required fields with the values that you obtained from the previous section.

## Additional resources

- [Access Reviews](https://help.drata.com/en/articles/8895897-access-reviews)

## Related articles

- [GitLab Integration Guide](gitlab-integration-guide.md)
- [Terraform Integration Guide](terraform-integration-guide.md)
- [JetBrains Integration Guide](jetbrains-integration-guide.md)
- [Dialpad Integration Guide](dialpad-integration-guide.md)
- [Ironclad Integration Guide (UAR)](ironclad-integration-guide-uar.md)
