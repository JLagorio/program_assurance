# Freshteam Integration Guide

Source: https://help.drata.com/en/articles/5216108-freshteam-integration-guide
Collection: Connection Support › Other Guidance
Updated: 2026-08-05
Fetched: 2026-11-22
Description: Making the initial connection to Freshteam

## Article text

The Freshteam integration enables security and compliance teams to automatically track employee lifecycle events. It connects Drata to Freshteam so your team can collect evidence related to employee hire dates, separation dates, and employment status.

## Key Capabilities

- Employee lifecycle data: Hire dates and termination dates
- Employment status tracking: Active or inactive employee records
- Automated evidence collection: HRIS data used for compliance verification

This integration is used to automate tests such as employee offboarding verification and employee roster validation, helping prove compliance with access control and personnel security policies.

## Prerequisites & Data Access

- Admin access to your organization’s Freshteam account
- Required Drata Role with Write access: Admin, Workspace Managers, DevOps Engineer
- Access Reviewers (Access Reviewers can only read the connection page; they cannot make changes)

### Permissions & Data Table

| Permission/Scope | Why It’s Needed |
|---|---|
| Freshteam API Key | Allows Drata to authenticate and retrieve employee lifecycle data such as hire date, separation date, and employment status |
| Freshteam Subdomain | Identifies the correct Freshteam instance for your organization |

## Step-by-Step Setup

### Step 1: Find Your Freshteam Subdomain

1. Log in to your Freshteam account.
2. Locate the URL in your browser.
3. Identify the prefix between **`https://`** and **`.freshteam.com`**.
4. Copy this value.

Example:
If your URL is `https://companyname.freshteam.com`, the **subdomain is `companyname`**.

Expected outcome: You have the Freshteam subdomain required for authentication.

### Step 2: Retrieve Your Freshteam API Key

1. Log in to Freshteam.
2. Hover over your **profile image** in the top-right corner of any page.
3. Select **API Key** from the dropdown menu.
4. Copy the API key.

Expected outcome: You have copied the Freshteam API key required for the connection.

### Step 3: Connect Freshteam in Drata

1. Log in to **Drata** → go to the **Connections** page.
2. Navigate to your **Available Connections**.
3. Search for and start the **Freshteam** connection process.
4. Enter your **Freshteam subdomain** and **API Key** when prompted.

Expected outcome:
Freshteam is successfully connected and employee lifecycle data begins syncing to Drata.

## Important Notes

- Important notes: This integration collects employee lifecycle metadata such as hire dates, separation dates, and employment status for compliance evidence.
- Principle of least privilege: Authentication is performed using a Freshteam API key associated with your account.
- Edge cases: If the API key is rotated or revoked in Freshteam, the integration may disconnect and require reauthentication.

## Related articles

- [Rippling Integration Guide (HRIS, MDM, UAR)](rippling-integration-guide-hris-mdm-uar.md)
- [BambooHR Integration Guide](bamboohr-integration-guide.md)
- [TriNet Integration Guide](trinet-integration-guide.md)
- [HR Cloud Integration Guide](hr-cloud-integration-guide.md)
- [UKG Pro Integration Guide](ukg-pro-integration-guide.md)
