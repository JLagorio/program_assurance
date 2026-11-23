# Identify and Add Missing AWS Permissions for Drata

Source: https://help.drata.com/en/articles/13455970-identify-and-add-missing-aws-permissions-for-drata
Collection: Understand the Drata Platform › Monitoring
Updated: 2026-02-18
Fetched: 2026-11-22

## Article text

## Overview

This guide walks you through how to identify and add missing AWS permissions when Drata tests enter an error state or new services are enabled. You'll locate the IAM role connected to Drata and update it using AWS best practices.

Drata uses a default **read-only** permission set designed to support the most common monitoring and evidence collection use cases. While this set is broad enough for most setups, you may need to expand it as your environment evolves. Common causes of permission-related errors include missing required policies, such as the AWS-provided Security Audit policy, and incorrect role configurations. Ensuring that the IAM role is properly deployed and configured can prevent many errors.

## Prerequisites

Before you begin, confirm you have the following as prerequisites:

- **An existing AWS integration with Drata**
   - You must already have AWS connected to Drata. To learn how to set up the integration, refer to the [AWS connection set up guide](aws-integration-guide-infrastructure-user-access-review.md).
- **Permission to manage IAM roles and policies**
- **Name or ARN of the IAM role connected to Drata**
- **The specific missing permissions identified by Drata**
   - These are provided in Drata error messages or test instructions.

### Don't have AWS access?

If you don’t have direct access to AWS or your organization manages IAM roles through Infrastructure as Code (IaC), you’ll need to submit a request to your infrastructure or DevOps team.

When creating a ticket or request, include the following:

- Name or ARN of the IAM role used by Drata
- Specific AWS permissions required (e.g., `s3:GetBucketPolicy`)
- Source of the request (e.g., erroring test)
- Suggested location for the update (e.g., existing SecurityAudit-based policy)

Your team can apply the changes using their preferred method, such as Terraform, CloudFormation, or the AWS Console.

## Steps

### Step 1: Identify the Required Permissions

To find out which permissions are missing:

1. In Drata, go to the **Monitoring** page and locate the relevant test.
   - You can filter tests by an **Error** or **Failed** state to narrow the results.
2. Open the test and review the **Latest result** section in the **Overview** tab or go to the **Findings** tab to view the affected resources and the raw JSON output.

Make a note of the specific AWS actions required (e.g., `ec2:DescribeInstances`).

**Note:** To view the test instructions, select the test from the **Monitoring** page, then in the **Overview** tab, go to the **Details** section and select **View instructions**. A modal opens with specific guidance on the permissions required to pass the test.

### Step 2: Find the IAM Role Drata Uses

1. In Drata, go to **Connections > AWS integration**.
2. Copy the IAM role ARN shown in the connection details.
3. Sign in to the **AWS Management Console**.
4. Navigate to **IAM > Roles**.
5. Paste the ARN or search for the role name.
6. Open the role to view and manage permissions.

### Step 3: Update the Existing Policy on the IAM Role

Most Drata customers use the AWS-managed **SecurityAudit** policy as the foundation for their integration. If a required permission is missing, you can update the customer-managed policy attached to the IAM role or add a new statement to the existing inline policy. If the Security Audit policy is not currently attached, consider adding it to provide a robust baseline for permissions. This AWS-provided policy supports monitoring and auditing features essential for Drata's operation.

To modify an attached policy:

1. In AWS, go to **IAM > Roles** and select the role used for Drata.
2. Under the **Permissions** tab, find the attached policy (e.g., your custom policy or SecurityAudit).
3. Select **Edit policy**.
4. In the **JSON** tab, add the required actions to the existing policy statement.

**Example addition**

**Note**: Replace `SERVICE:Action` with the actual permission required.

```
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["SERVICE:Action"],
      "Resource": "*"
    }
  ]
}
```

### Step 4: Confirm the Update

- In AWS, verify that the new policy appears under the IAM role.
- If your organization uses Service Control Policies or permission boundaries, confirm that they don’t restrict the new permissions.

## Verification

To verify the changes:

1. Return to Drata.
2. Go to the affected test or AWS integration status view.
3. Re-run the test.

If the permissions were added correctly, the test should now execute successfully.

## Next Steps

- Check other erroring tests for permission gaps.
- Update your IAM role as you enable additional AWS services or Drata tests.
- For background on how Drata uses permissions, review the [Understanding AWS Permissions and Drata Integrations article](understanding-aws-permissions-and-how-drata-integrates-with-aws-concept-guide.md).

## Related articles

- [AWS Integration Guide (Infrastructure, User Access Review)](aws-integration-guide-infrastructure-user-access-review.md)
- [AWS GovCloud Integration Guide](aws-govcloud-integration-guide.md)
- [AWS Org Units Connection Instructions](aws-org-units-connection-instructions.md)
- [Understanding AWS Permissions and How Drata Integrates with AWS (Concept Guide)](understanding-aws-permissions-and-how-drata-integrates-with-aws-concept-guide.md)
- [Identify and Add Missing GCP Permissions for Drata](identify-and-add-missing-gcp-permissions-for-drata.md)
