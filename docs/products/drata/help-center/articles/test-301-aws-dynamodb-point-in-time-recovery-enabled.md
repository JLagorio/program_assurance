# Test 301: AWS DynamoDB Point-in-Time Recovery Enabled

Source: https://help.drata.com/en/articles/9999538-test-301-aws-dynamodb-point-in-time-recovery-enabled
Collection: Monitoring Test Guidance
Updated: 2024-10-29
Fetched: 2026-11-22
Description: Drata validates that each DynamoDB table has point-in-time recovery status set to enabled.

## Article text

Drata validates that each DynamoDB table has point-in-time recovery status set to enabled.

## Prerequisites

- This test requires an additional permission: '`backup:ListRecoveryPointsByResource`' which is not a default permission within the SecurityAudit policy on the DrataAutoPilot role.
   - To add the required permission to the DrataAutoPilot role.
      1. Navigate to the DrataAutoPilot role in IAM Console.
      2. Add an inline policy to the role.
      3. In the policy editor, choose JSON to add permissions manually and paste the following JSON for the `backup:ListRecoveryPointsByResource` permission needed for this test:
         ```
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [ "backup:ListRecoveryPointsByResource" ],
      "Resource": "*"
    }
  ] 
} 
         ```
      4. Give this inline policy a name and add it to the DrataAutoPilot role.

## ASSOCIATED DRATA CONTROL

This test is part of theSystem Monitoring (DCF-86) that ensures production systems and resources are monitored and automated alerts are sent out personnel based on pre-configured rules. Events are triaged to determine if they constitute an incident and escalated per policy if necessary.

## WHAT TO DO IF A TEST FAILS

If Drata detects that it appears that one or more AWS DynamoDB tables do not have point-in-time recovery status set to enabled, your test will fail. To remediate a failed test:

1. Sign into the AWS Management console and navigate to DynamoDB.

2. Select a table that is failing this test.

3. Go to the 'Backups' tab and enable 'Point-In-Time Recovery' .

4. Confirm the action and repeat for each failing DynamoDB table.

## Related articles

- [AWS Integration Guide (Infrastructure, User Access Review)](aws-integration-guide-infrastructure-user-access-review.md)
- [Test 230: AWS IAM Principle of Least Privilege](test-230-aws-iam-principle-of-least-privilege.md)
- [Test 223: AWS CMK Rotation](test-223-aws-cmk-rotation.md)
- [Test 131: Autoscaling Configurations in Place](test-131-autoscaling-configurations-in-place.md)
- [Identify and Add Missing AWS Permissions for Drata](identify-and-add-missing-aws-permissions-for-drata.md)
