# Test 133: Failed Backup Alerts Being Sent

Source: https://help.drata.com/en/articles/4778878-test-133-failed-backup-alerts-being-sent
Collection: Monitoring Test Guidance
Updated: 2026-08-05
Fetched: 2026-11-22
Description: Infrastructure configurations and confirmed that alerts are configured to be sent to personnel when the backup process fails.

## Article text

## Prerequisite

- This test requires an additional permissions: `backup:ListBackupJobs`.
   - To add this permission to the DrataAutopilotRole to avoid permission errors.
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
      "backup:ListBackupJobs"
    ], 
    "Resource": "*"
  }
]
}
         ```
      4. Give this inline policy a name and add it to the DrataAutopilotRole

## ASSOCIATED DRATA CONTROL

This test is part of the Backup Monitoringcontrol (DCF-99) that ensures automated notifications are sent to personnel in the event of a backup failure. Backup failures are investigated and resolved by engineering personnel following company policies and procedures.

## WHAT TO DO IF A TEST FAILS

If Drata did not find any alerts configured to notify personnel when a backup fails, the test will fail. To remediate a failed test, you will need to set up alerts to notify the appropriate personnel when a backup failure occurs.

## Related articles

- [Test 134: Failed Backups Addressed in Timely Manner](test-134-failed-backups-addressed-in-timely-manner.md)
- [Test 132: Daily backup job status monitored](test-132-daily-backup-job-status-monitored.md)
- [Test 301: AWS DynamoDB Point-in-Time Recovery Enabled](test-301-aws-dynamodb-point-in-time-recovery-enabled.md)
- [Test 116: NoSQL Cluster CPU Load Monitored](test-116-nosql-cluster-cpu-load-monitored.md)
- [Test 206: SQL Freeable Memory Monitored](test-206-sql-freeable-memory-monitored.md)
