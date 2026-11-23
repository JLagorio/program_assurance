# Identify and Add Missing GCP Permissions for Drata

Source: https://help.drata.com/en/articles/13456336-identify-and-add-missing-gcp-permissions-for-drata
Collection: Understand the Drata Platform › Monitoring
Updated: 2026-01-21
Fetched: 2026-11-22

## Article text

## Overview

This guide walks you through how to identify and add missing GCP permissions when Drata tests enter an error state or new services are enabled. You'll locate the IAM role connected to Drata and update it using best practices.

Drata uses a default **read-only** permission set designed to support the most common monitoring and evidence collection use cases. While this set is broad enough for most setups, you may need to expand it as your environment evolves.

## Prerequisites

Before you begin, confirm you have the following as prerequisites:

- **An existingGCP integration with Drata**
   - You must already have GCP connected to Drata. To learn how to set up the integration, refer to the [GCP connection set up guide](gcp-integration-guide-script-setup.md).
- **Permission to manage IAM roles and policies**
   - IAM roles and policy bindings
   - Service accounts
- **Name or email of the Drata service account**
- **Current scope of the role (project or organization)**
- **The specific missing permissions identified by Drata**
   - These are provided in Drata error messages or test instructions.

### Don’t have GCP access?

If you don’t have direct access to GCP or your organization uses Infrastructure as Code (IaC) to manage GCP, you’ll need to submit a request to your infrastructure or DevOps team.

When creating a ticket or request, include the following:

- Drata service account email
- GCP project ID or organization ID
- The exact GCP permissions to be added
- Source of the request (e.g., erroring test)
- Current scope of the integration (project or organization)

Your team can apply changes using the Google Cloud Console, Terraform, or other supported tools.

## Steps

### Step 1: Identify the missing permissions

To find out which permissions are missing:

1. In Drata, go to the **Monitoring** page and locate the relevant test.
   - You can filter tests by an **Error** or **Failed** state to narrow the results.
2. Open the test and review the **Latest result** section in the **Overview** tab or go to the **Findings** tab to view the affected resources and the raw JSON output.

Make a note of the specific GCP actions (e.g., `compute.instances.list`).

**Note:** To view the test instructions, select the test from the **Monitoring** page, then in the **Overview** tab, go to the **Details** section and select **View instructions**. A modal opens with specific guidance on the permissions required to pass the test.

### Step 2: Determine if scope needs to change (optional)

Most updates can be made at the current scope. You only need to expand scope if:

- You're adding additional projects
- A test requires organization-level access
- You want to manage access centrally

**To expand the scope:**

1. In GCP, locate the custom IAM role assigned to the Drata service account.
2. Reassign the role at the organization or folder level.
3. Confirm the broader assignment is active before removing narrower ones.

You can also create a new integration in Drata using a different scope, if preferred.

### Step 3: Locate the Drata service account

You need to locate the service account used by the Drata integration so you can confirm:

- Which **custom IAM role** is assigned
- Where that role is applied (project or organization)
- That you are updating the correct identity

**To locate the service account:**

1. Sign in to the **Google Cloud Console**.
2. Navigate to **IAM & Admin**.
3. Navigate to **Service Accounts**.
4. Locate the service account used for the Drata integration.

You will use this service account in the next steps to verify role assignments and apply updates.

### Step 4: Update the custom IAM role

1. Go to **IAM & Admin > Roles**.
2. Find the custom role used by Drata.
3. Confirm that the role is assigned to the Drata service account.
4. Edit the role and add the required permission(s).
5. Save the role.

The updates take effect wherever the role is already assigned.

### Step 5: Confirm the update

- Verify the updated permissions appear under the IAM role
- Confirm the service account has the role at the correct scope
- Confirm no organization policies are blocking the required access

### Step 6: Confirm required APIs are enabled (if applicable)

Some Drata tests depend on specific GCP APIs.

1. Go to **APIs & Services > Enabled APIs & services**.
2. Confirm required APIs are enabled for the connected project.

## Verification

After updating permissions:

1. Return to Drata.
2. Go to the affected test or integration status view.
3. Re-run the test.

If the permissions were added correctly, the test should now execute successfully.

## Next Steps

- Check other erroring tests for additional permission gaps.
- Add new permissions as needed for expanded service coverage.
- For background on how Drata uses permissions, review the [Understanding GCP Permissions and the Drata Integration article](understanding-gcp-permissions-and-how-drata-integrates-with-gcp-concept-guide.md).

## Related articles

- [GCP Integration Guide (Script Setup)](gcp-integration-guide-script-setup.md)
- [GCP Integration Guide (Manual)](gcp-integration-guide-manual.md)
- [Identify and Add Missing Azure Permissions for Drata](identify-and-add-missing-azure-permissions-for-drata.md)
- [Identify and Add Missing AWS Permissions for Drata](identify-and-add-missing-aws-permissions-for-drata.md)
- [Understanding GCP Permissions and How Drata Integrates with GCP (Concept Guide)](understanding-gcp-permissions-and-how-drata-integrates-with-gcp-concept-guide.md)
