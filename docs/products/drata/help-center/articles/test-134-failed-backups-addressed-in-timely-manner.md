# Test 134: Failed Backups Addressed in Timely Manner

Source: https://help.drata.com/en/articles/4778882-test-134-failed-backups-addressed-in-timely-manner
Collection: Monitoring Test Guidance
Updated: 2026-08-05
Fetched: 2026-11-22
Description: Drata inspected infrastructure configuration and confirmed that failed backups were resolved in a timely manner.

## Article text

Drata inspected company's infrastructure configuration and confirmed that failed backups were resolved in a timely manner.

## Prerequisite

- This test requires an additional permissions: `backup:ListBackupJobs`.
   - To add this permission to the DrataAutoPilot role to avoid permission errors:
      1. Navigate to the DrataAutopilotRole in IAM Console.
      2. Add an inline policy to the role.
      3. In the policy editor,  choose JSON to add permissions manually and paste the following JSON for the permission (backup:ListBackupJobs) needed for this test:
         ```
{
    "Version": "2012-10-17", 
    "Statement": [
      {
        "Effect": "Allow", 
        "Action": [
          "backup:ListBackupJobs", 
        ], 
        "Resource": "*"
      }
    ]
  }
         ```
      4. Give this inline policy a name and add it to the DrataAutoPilot role

## ASSOCIATED DRATA CONTROL

This test is part of the Backup Monitoringcontrol (DCF-99) that ensures automated notifications are sent to personnel in the event of a backup failure. Backup failures are investigated and resolved by engineering personnel following company policies and procedures.

## WHAT TO DO IF A TEST FAILS

If Drata identified a failed backup that was not restarted within 24 hours, the test will fail. To remediate a failed test, you will need to ensure that all backup failures are restarted within 24 hours.

## Related articles

- [Test 106: Has a Backup Policy](test-106-has-a-backup-policy.md)
- [Test 107: Daily Database Backups](test-107-daily-database-backups.md)
- [Test 133: Failed Backup Alerts Being Sent](test-133-failed-backup-alerts-being-sent.md)
- [Test 132: Daily backup job status monitored](test-132-daily-backup-job-status-monitored.md)
- [Test 301: AWS DynamoDB Point-in-Time Recovery Enabled](test-301-aws-dynamodb-point-in-time-recovery-enabled.md)
