# Test 109: Logs are Centrally Stored

Source: https://help.drata.com/en/articles/4778760-test-109-logs-are-centrally-stored
Collection: Monitoring Test Guidance
Updated: 2026-08-05
Fetched: 2026-11-22
Description: Drata inspects your company system configuration for collecting and storing logs to ensure logs are deposited in a central location.

## Article text

**ASSOCIATED DRATA CONTROL**

This test is part of the **Logs Centrally Stored **control that ensures your company uses a system that collects and stores server logs in a central location. This control also verifies the system can be queried in an ad hoc fashion by authorized users.

**WHAT TO DO IF A TEST FAILS**

If Drata finds that logging has not been enabled on your infrastructure, or that it is enabled but not being used, the test will fail.

To remediate a failed test, you will need to enable logging on your observability provider. To see details on how this test operates as part of the Datadog connection, please go to [this article](datadog-integration-guide.md).

## Related articles

- [Test 69: Customer Data in Cloud Storage is Encrypted at Rest](test-69-customer-data-in-cloud-storage-is-encrypted-at-rest.md)
- [Test 110: Only Authorized Users can Access Log Sinks](test-110-only-authorized-users-can-access-log-sinks.md)
- [Test 111: Logs are Retained for 365 Days](test-111-logs-are-retained-for-365-days.md)
- [Test 123: Cloud Infrastructure Linked to Drata](test-123-cloud-infrastructure-linked-to-drata.md)
- [Test 121: Logs Monitored for Suspicious Activity](test-121-logs-monitored-for-suspicious-activity.md)
