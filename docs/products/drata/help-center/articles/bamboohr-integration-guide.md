# BambooHR Integration Guide

Source: https://help.drata.com/en/articles/5122726-bamboohr-integration-guide
Collection: Connection Support › Other Guidance
Updated: 2026-08-05
Fetched: 2026-11-22
Description: Making the initial connection to BambooHR

## Article text

The BambooHR integration connects Drata to your company's BambooHR account so your team can automate checks and evidence collection for personnel hire and separation dates and employment status.

## Key Capabilities

- **Automated personnel data checks**: Use BambooHR data for personnel hire dates, separation dates, and employment status to support Drata automation.
- **Evidence collection from HR records**: Collect personnel details needed as evidence in Drata based on BambooHR records.
- **Optional policy and document syncing**: When configured with the correct permissions, sync signed documents and company policies from BambooHR Documents and Company Files into Drata.

This integration is used to support automation of tests that rely on BambooHR personnel data and any policy documents you choose to sync into Drata.

## Prerequisites & Data Access

- Admin access to your company's BambooHR account.
- Ability to create or use a BambooHR service account with read-only administrator permissions for this connection (recommended).
- **For OAuth**: Username and password for the BambooHR user account you will use to connect.
- **For API key**: Administrator access to generate an API key in BambooHR.

### Permissions & Data Table

| **Permission/Scope** | **Why It’s Needed** |
|---|---|
| View only Personal > Basic Info (Status, First Name, Last Name) | Allows Drata to view employee status and identify employees in BambooHR. |
| View only Personal > Contact (Work Email, Home Email) | Allows Drata to read employee email addresses associated with Drata users. |
| View only Job (Hire Date, Original Hire Date, Employment Status, Job Information) | Allows Drata to read hire and separation dates and employment status from BambooHR. |
| View only Documents (Signed Documents, Company Policies) | Allows Drata to sync signed documents and company policies from BambooHR. |
| Access to Company Files folders that contain company policies and tests | Required so Drata can import or link the policies and tests you wish to sync from BambooHR. |

## Step-by-Step Setup

### Step 1: Choose connection method and prepare your BambooHR account

1. Decide whether you will connect BambooHR to Drata using OAuth or a BambooHR API key.
2. Ensure you can access your company's BambooHR account with administrator permissions.

**(Recommended)** 
Create or identify a separate BambooHR service account that will hold the read-only administrator permissions needed for this connection.

1. For OAuth (Must be enabled within tenant):
   - If you prefer to connect through OAuth with a separate user account, create a BambooHR user with read-only administrator permissions.
   - Have the username and password for this BambooHR user ready to log in when prompted.
2. For API key:
   - Confirm you can sign in to the BambooHR console with an account that has administrator permissions.

**Expected outcome:** You have selected a connection method (OAuth or API key) and have an appropriate BambooHR admin or service account ready to use for the Drata connection.

### Step 3: Create a custom access level in BambooHR

1. In BambooHR, go to `https://{domain}.bamboohr.com/access_levels/custom/create` to create a custom access level for the Drata connection.
2. In **What this access level can do**, do not select any items, and continue.
3. In **What Can People with this Access Level See**:
   - Select **See About other Employees**
   - **Access level: All Employees**
4. In the data table, configure **View Only** access for the following fields:
   - **Personal > Basic Info**: Status, First Name, Last Name
   - **Personal > Contact**: Work Email, Home Email
   - **Job**: Hire Date, Original Hire Date, Employment Status, Job Information
   - **Documents**: Signed Documents (only if you are syncing policy information through BambooHR), Company Policies
5. Grant access to **Company Files** folders that contain the company policies and tests you want to sync to Drata. If view access is not given to the folders containing these policies, you will not be able to import or link them in Drata.

**Expected outcome:** A custom BambooHR access level exists with view-only permissions for the required personnel fields, documents, and company policy folders needed for the Drata connection.

### Step 4: Assign the custom access level to the BambooHR account used for Drata

1. In BambooHR, assign the custom access level you created to the BambooHR account that will be used to connect to Drata.
2. Use the service account for this assignment if you created one, rather than one of your main administrator accounts.

**Expected outcome:** The BambooHR account that will connect to Drata has the custom access level applied.

### Step 5: Connect BambooHR inside Drata

1. In Drata, open the **Connections** page.
2. Locate the **BambooHR** connection and start the connection process.
3. Follow the on-screen instructions to complete authentication and finish setting up the connection.

**Expected outcome:** The BambooHR connection is successfully established in Drata.

## Related articles

- [KarmaCheck Integration Guide](karmacheck-integration-guide.md)
- [TriNet Integration Guide](trinet-integration-guide.md)
- [HR Cloud Integration Guide](hr-cloud-integration-guide.md)
- [Workday Integration Guide (HRIS)](workday-integration-guide-hris.md)
- [UKG Pro Integration Guide](ukg-pro-integration-guide.md)
