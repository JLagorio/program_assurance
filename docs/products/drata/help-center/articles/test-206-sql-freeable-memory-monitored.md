# Test 206: SQL Freeable Memory Monitored

Source: https://help.drata.com/en/articles/10029047-test-206-sql-freeable-memory-monitored
Collection: Monitoring Test Guidance
Updated: 2026-08-17
Fetched: 2026-11-22
Description: Determine if freeable memory is monitored and alerts to personnel are sent when defined thresholds are crossed.

## Article text

Drata inspects SQL freeable memory monitoring and alerting configurations to determine if freeable memory is monitored and alerts to personnel are sent when defined thresholds are crossed.

## ASSOCIATED DRATA CONTROL

This test is part of the System Monitoring (DCF-86) that ensures your production systems and resources are monitored and automated alerts are sent to personnel based on pre-configured rules. Events are triaged to determine if they constitute an incident and escalated per policy if necessary.

## WHAT TO DO IF A TEST FAILS

If it appears you do not have SQL freeable memory monitoring enabled or alerts are not configured for the following SQL databases, the test will fail.

**STEPS TO REMEDIATE**

Configure SQL freeable memory monitoring and configure alerts to be sent to personnel when defined thresholds are crossed.

## Related articles

- [Test 112: Database CPU Monitored](test-112-database-cpu-monitored.md)
- [Test 133: Failed Backup Alerts Being Sent](test-133-failed-backup-alerts-being-sent.md)
- [Test 250: Azure Log Alert for Create or Update SQL Server Firewall Rule](test-250-azure-log-alert-for-create-or-update-sql-server-firewall-rule.md)
- [Test 251: Azure Log Alert for Delete SQL Server Firewall Rule](test-251-azure-log-alert-for-delete-sql-server-firewall-rule.md)
- [Test 116: NoSQL Cluster CPU Load Monitored](test-116-nosql-cluster-cpu-load-monitored.md)
