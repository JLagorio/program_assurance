# Identify and Add Missing Azure Permissions for Drata

Source: https://help.drata.com/en/articles/13454138-identify-and-add-missing-azure-permissions-for-drata
Collection: Understand the Drata Platform › Monitoring
Updated: 2026-01-21
Fetched: 2026-11-22
Description: Understand why Drata Azure tests fail and how to add the required Microsoft Graph API and Azure RBAC permissions to restore monitoring.

## Article text

## Overview

This guide walks you through how to identify and add missing Azure permissions when Drata tests enter an error state or new services are enabled. You'll learn how to identify missing permissions, locate the Azure application and service principal connected to Drata, and apply the necessary updates using Azure best practices.

**Important note**: Drata uses a default **read-only** permission set designed to support the most common monitoring and evidence collection use cases. While this set is broad enough for most setups, you may need to expand it as your environment evolves.

## Prerequisites

Before you begin, confirm you have the following:

- **An existing Azure integration with Drata**
   - You must already have Azure connected to Drata. To learn how to set up the integration, refer to the [Azure connection setup guide](azure-integration-guide.md).
- **Access to the connected Azure environment**
   - You must be able to sign in to and make changes in the Azure tenant used by the Drata integration.
- **Ability to manage Azure permissions**, including:
   - App registrations and Microsoft Graph API permissions
   - Azure role assignments (RBAC) on subscriptions or management groups
- **The name or Application (Client) ID of the Azure app connected to Drata**
- **The specific missing permissions identified by Drata**
   - These are provided in Drata error messages or test instructions.

### Don’t have Azure access?

If you don’t have direct access to Azure or your organization uses Infrastructure as Code (IaC) to manage Azure, you'll need to submit a request to your infrastructure or DevOps team.

When creating a ticket or request, include the following:

- Name and **Application (Client) ID** of the Drata app
- **Microsoft Entra tenant ID**
- **Subscription ID(s)** or **management group** where access is required
- Specific permissions to be added, such as:
   - Microsoft Graph API application permissions
   - Azure RBAC role assignments
- Source of the request (e.g., erroring test)
- Suggested update location (e.g., app registration or subscription-level role assignment)

Your team can implement the change using the Azure Portal, Terraform, Bicep, or other approved tools.

## Steps

### Step 1: Find the missing permissions

To find out which permissions are missing:

1. In Drata, go to the **Monitoring** page and locate the relevant test.
   - You can filter tests by an **Error** or **Failed** state to narrow the results.
2. Open the test and review the **Latest result** section in the **Overview** tab or go to the **Findings** tab to view the affected resources and the raw JSON output.
3. Determine whether the missing access relates to:
   - **Microsoft Graph API permissions**, which are used to read directory data such as users, groups, and audit logs, or
   - **Azure RBAC roles**, which control access to Azure resources at the subscription level.
4. Make a note of the specific Azure permissions required (e.g. `Microsoft.Insights/ActivityLogAlerts/Read`)

**Note:** To view the test instructions, select the test from the **Monitoring** page, then in the **Overview** tab, go to the **Details** section and select **View instructions**. A modal opens with specific guidance on the permissions required to pass the test.

### Step 2: Determine where to apply the update

After you identify the missing permission, determine where in Azure the update must be made. Adding a permission in the wrong place will not resolve the issue.

- Use **Microsoft Graph API application permissions** to grant access to directory data.
- Use **Azure RBAC role assignments** to grant access to subscription-level resources.

### Step 3: Update Microsoft Graph API permissions (if required)

If you determined that the missing permission must be added as a Microsoft Graph API permission, complete the following steps:

1. Sign in to the Azure Portal.
2. Go to **Microsoft Entra ID > App registrations**.
3. Select the application used for Drata.
4. Go to **API permissions**.
5. Add the required Microsoft Graph application permissions.
6. Grant admin consent if prompted.

### Step 4: Update Azure RBAC role assignments (if required)

If you determined that the missing access must be added as an Azure RBAC role assignment, complete the following steps:

1. In the Azure Portal, navigate to the relevant **subscription** or **management group**.
2. Go to **Access control (IAM)**.
3. Find the service principal associated with the Drata app.
4. Assign the required role at the appropriate scope (for example, Reader or Key Vault Reader).

### Step 5: Confirm the update

After updating permissions, confirm the changes were applied correctly in Azure.

In Azure, verify the following:

- The updated **Microsoft Graph API application permissions** appear under the app registration, if applicable.
- The correct **Azure RBAC role assignment** appears on the service principal at the expected scope (subscription, management group, or resource group).
- The added role or permission reflects the intended scope and access level.

If your organization uses additional access controls, also confirm that they do not restrict the new permissions:

- **Management Group policies** are not blocking the role assignment or scope.
- **Azure Policy assignments** do not deny the required actions.
- **Custom role definitions** do not override or limit expected permissions.

These controls can prevent access even when a role or permission appears to be correctly assigned.

## Verification

To verify the changes:

1. Return to Drata.
2. Navigate to the affected test or Azure integration status view.
3. Re-run the test.

If the permissions were added correctly, the test should now execute successfully.

## Next Steps

- Review additional erroring tests for other missing permissions.
- Update permissions incrementally as new services or tests are enabled.
- For background on how Drata uses permissions, review the [Understanding Azure Permissions and the Drata Integration article](understanding-azure-permissions-and-how-drata-integrates-with-azure-concept-guide.md).

## Related articles

- [Azure Integration Guide](azure-integration-guide.md)
- [Azure Management Groups Integration Guide](azure-management-groups-integration-guide.md)
- [Test 254: Azure Key Vaults Key Expiration](test-254-azure-key-vaults-key-expiration.md)
- [Understanding Azure Permissions and How Drata Integrates with Azure (Concept Guide)](understanding-azure-permissions-and-how-drata-integrates-with-azure-concept-guide.md)
- [Identify and Add Missing GCP Permissions for Drata](identify-and-add-missing-gcp-permissions-for-drata.md)
