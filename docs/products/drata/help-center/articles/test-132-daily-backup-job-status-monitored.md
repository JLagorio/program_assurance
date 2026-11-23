# Test 132: Daily backup job status monitored

Source: https://help.drata.com/en/articles/9999495-test-132-daily-backup-job-status-monitored
Collection: Monitoring Test Guidance
Updated: 2026-11-14
Fetched: 2026-11-22
Description: Drata inspected company's database snapshot history and determined a successful snapshot is available for the previous day.

## Article text

Drata inspected company's database snapshot history and determined a successful snapshot is available for the previous day.

## Prerequisite

- This test requires an additional permission: `backup:ListRecoveryPointsByResource`.
   - To add this permission to the DrataAutoPilot role, follow these steps to avoid permission errors.
      1. Navigate to the DrataAutopilotRole in IAM Console.
      2. Add an inline policy to the role.
         - In the policy editor, choose JSON to add permissions manually and paste the following JSON for the permission (backup:ListRecoveryPointsByResource) needed for this test:
            ```
{
    "Version": "2012-10-17", 
    "Statement": [
      {
        "Effect": "Allow", 
        "Action": [
          "backup:ListRecoveryPointsByResource"
        ], 
        "Resource": "*"
      }
    ]
  }
            ```
      3. Give this inline policy a name and add it to the DrataAutoPilot role.

## ASSOCIATED DRATA CONTROL

This test is part of the Backup Monitoringcontrol (DCF-99) that ensures automated notifications are sent to personnel in the event of a backup failure. Backup failures are investigated and resolved by engineering personnel following company policies and procedures.

## WHAT TO DO IF A TEST FAILS

If Drata did not identify a successful snapshot for the previous day for the following databases, the test will fail. To remediate a failed test, you will need to investigate the reason for the backup failure and manually restart the backup job if necessary.

## Related articles

- [Test 106: Has a Backup Policy](test-106-has-a-backup-policy.md)
- [Test 107: Daily Database Backups](test-107-daily-database-backups.md)
- [Test 133: Failed Backup Alerts Being Sent](test-133-failed-backup-alerts-being-sent.md)
- [Test 134: Failed Backups Addressed in Timely Manner](test-134-failed-backups-addressed-in-timely-manner.md)
- [Test 301: AWS DynamoDB Point-in-Time Recovery Enabled](test-301-aws-dynamodb-point-in-time-recovery-enabled.md)
