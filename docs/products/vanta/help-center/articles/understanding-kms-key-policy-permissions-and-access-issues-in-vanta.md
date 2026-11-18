# Understanding KMS Key Policy Permissions and Access Issues in Vanta

Source: https://help.vanta.com/en/articles/11345859-understanding-kms-key-policy-permissions-and-access-issues-in-vanta
Collection: Optimizing your Workflow ; Optimizing your Workflow › Troubleshooting
Fetched: 2026-11-17

## Article text

## Overview
AWS Key Management Service (KMS) keys require specific policies to allow access. This article explains why some KMS keys may not be accessible to Vanta’s vanta-auditor role and offers steps to resolve this issue.
 

## Why Am I Experiencing Issues Accessing Certain KMS Keys?
When using AWS KMS, access permissions for keys are determined by key policies (resource-based policies) rather than IAM policies alone. This means:
- 
If a KMS key policy does not allow IAM policy permissions, even roles with attached IAM policies cannot access the key.
- 
A key with only a custom policy might prevent Vanta’s vanta-auditor role from accessing it unless that policy includes permissions for IAM roles.
Please note: The permissions we’re adding in the solutions below are intended to be added directly to the KMS key policy. They should not be added to the IAM policies for Vanta-auditor or VantaAdditionalPermissions roles, as those IAM policies alone do not affect KMS keys. For each failing key, you’ll need to update the key’s specific policy with one of the following solutions.
 

## Default vs. Custom KMS Key Policies
- 
Default Policy
- 
By default, new KMS keys have a policy that allows IAM permissions, enabling roles like vanta-auditor to access them through their IAM policies.
- 
See AWS Documentation on default KMS key policy permissions <https://docs.aws.amazon.com/kms/latest/developerguide/key-policy-default.html>.
- 
Custom Policy
- 
If a KMS key has a custom policy without an “Allow” for IAM permissions, the vanta-auditor role will be denied access.
- 
This custom policy restriction results in Vanta being unable to fetch key details.
 

## How to Resolve Access Issues
If you encounter an issue where Vanta cannot access a KMS key, you can update the key’s policy in one of two ways:
- 
Add Default IAM Permissions (Easiest Solution): This allows the vanta-auditor role to access the key based on its IAM policy.
- 
To re-enable IAM permissions for the key, add the following default statement to your key policy:{
  "Sid": "Enable IAM User Permissions",
  "Effect": "Allow",
  "Principal": { "AWS": "arn:aws:iam::<ACCOUNT_ID>:root" },
  "Action": "kms:*",
  "Resource": "*"
}
 
- 
Add Specific Permissions for Vanta:
- 
Alternatively, you can add a more targeted policy for the vanta-auditor role, allowing only read-only actions needed for Vanta’s purposes:{
  "Sid": "AllowVantaAuditorReadAccess",
  "Effect": "Allow",
  "Principal": { "AWS": "arn:aws:iam::<ACCOUNT_ID>:role/vanta-auditor" },
  "Action": [
    "kms:DescribeKey",
    "kms:GetPublicKey",
    "kms:ListAliases",
    "kms:ListGrants",
    "kms:ListKeyPolicies",
    "kms:ListResourceTags",
    "kms:ListRetirableGrants"
  ],
  "Resource": "*"
}
 

## Long-Term Solution
To avoid interruptions, consider:
- 
Review and update KMS key policies when setting up keys.
- 
The linking flow in your Vanta dashboard might alert you to necessary permission changes.
- 
Support Articles and guidance are available to assist with troubleshooting key policy issues.
For additional help, please contact our support team or refer to the AWS Key Policy Documentation <https://docs.aws.amazon.com/kms/latest/developerguide/key-policies.html>.

## Images

- none
