# HR Cloud Integration Guide

Source: https://help.drata.com/en/articles/5523165-hr-cloud-integration-guide
Collection: Connection Support › Other Guidance
Updated: 2026-08-05
Fetched: 2026-11-22
Description: Making the initial connection to HR Cloud

## Article text

The [HR Cloud](https://www.hrcloud.com/) (All-in-One HRIS & Employee Onboarding Software) integration enables security and compliance teams to automatically track employee lifecycle information. It connects Drata to HR Cloud so your team can collect evidence on employee hire dates, separation dates, and employment status to support compliance monitoring.

## Key Capabilities

- Employee lifecycle data: Hire dates and separation dates
- Employment status tracking: Active or inactive employee records
- Automated evidence collection: Sync HR Cloud personnel data into Drata

This integration is used to automate tests such as employee roster verification and employee offboarding verification, helping prove compliance with personnel security and access management policies.

## Prerequisites & Data Access

- **Admin access** or **Application User permissions** in your HR Cloud account
- Valid **HR Cloud username and password**
- Required Drata Role with Write access: Admin, Workspace Managers, DevOps Engineer
- Access Reviewers (Access Reviewers can only Read the connection page they can’t make changes)

### Permissions & Data Table

| Permission/Scope | Why It’s Needed |
|---|---|
| HR Cloud Admin or Application User access | Allows Drata to retrieve employee lifecycle data such as hire dates, separation dates, and employment status |
| Username and password | Allows Drata to securely authenticate and sync HR Cloud personnel data |

## Step-by-Step Setup

### Step 1: Confirm HR Cloud Account Access

1. Log in to **HR Cloud**.
2. Verify that your account has either:
   - **Admin access**, or
   - **Application User permissions**.

Expected outcome: You have the required permissions to authorize the integration.

### Step 2: Connect HR Cloud in Drata

1. Log in to **Drata** → go to the **Connections** page.
2. Navigate to your **Available Connections**.
3. Search for and start the **HR Cloud** connection process.
4. When prompted, enter the following credentials:
   - **Username**
   - **Password**

Expected outcome:
HR Cloud is successfully connected and employee lifecycle data begins syncing to Drata.

## Important Notes

- Drata uses the provided credentials to **securely sync HR Cloud personnel information**.
- The credentials should belong to an **Admin or Application User** account.
- This integration collects employee lifecycle metadata such as **hire dates, separation dates, and employment status** for compliance evidence.

## Related articles

- [Rippling Integration Guide (HRIS, MDM, UAR)](rippling-integration-guide-hris-mdm-uar.md)
- [BambooHR Integration Guide](bamboohr-integration-guide.md)
- [Freshteam Integration Guide](freshteam-integration-guide.md)
- [TriNet Integration Guide](trinet-integration-guide.md)
- [UKG Pro Integration Guide](ukg-pro-integration-guide.md)
