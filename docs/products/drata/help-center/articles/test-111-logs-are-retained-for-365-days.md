# Test 111: Logs are Retained for 365 Days

Source: https://help.drata.com/en/articles/4778770-test-111-logs-are-retained-for-365-days
Collection: Monitoring Test Guidance
Updated: 2026-08-05
Fetched: 2026-11-22
Description: Drata inspects the retention policy for the infrastructure logging system to determine if the logs are being archived in long-term storage.

## Article text

## ASSOCIATED DRATA CONTROL

This test is part of the **Logs Retained for 12 Months **control that ensures your company uses logging software that retains logs for at least 12 months.

## WHAT TO DO IF A TEST FAILS

If Drata test results show that the logs are not being retained for at least 12 months in either the retention policy or long term archival storage the test will fail.

To remediate a failed test, you will need to configure your logging system to retain logs for more than 12 months and/or enable long term archival storage. To see details on how this test operates as part of the Datadog connection, please go to [this article](datadog-integration-guide.md).

### Troubleshooting for AWS Organizational Units

Sub-account information is only evaluated by Drata when using the AWS Organizational Units connection. This is a toggle set at connection creation time. If this is not set, resources in sub-accounts from certain tests will not be evaluated by Drata

## Related articles

- [Test 117: NoSQL Cluster Storage Utilization Monitored](test-117-nosql-cluster-storage-utilization-monitored.md)
- [Test 109: Logs are Centrally Stored](test-109-logs-are-centrally-stored.md)
- [Test 110: Only Authorized Users can Access Log Sinks](test-110-only-authorized-users-can-access-log-sinks.md)
- [Test 121: Logs Monitored for Suspicious Activity](test-121-logs-monitored-for-suspicious-activity.md)
- [Datadog Integration Guide](datadog-integration-guide.md)
