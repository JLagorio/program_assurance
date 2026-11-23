# Test 110: Only Authorized Users can Access Log Sinks

Source: https://help.drata.com/en/articles/4778762-test-110-only-authorized-users-can-access-log-sinks
Collection: Monitoring Test Guidance
Updated: 2026-08-05
Fetched: 2026-11-22
Description: Drata inspects the access policy for the infrastructure logging system to determine if only authorized users can access log sinks.

## Article text

**ASSOCIATED DRATA CONTROL**

This test is part of the **Logs Centrally Stored **control that ensures your company uses a system that collects and stores server logs in a central location. This control also verifies the system can be queried in an ad hoc fashion by authorized users.

**WHAT TO DO IF A TEST FAILS**

If Drata finds users that have access to your infrastructure logging system that do not match against the list of infrastructure admins in your 'Company Settings' page the test will fail. With a failed test you will receive a list of authorized logging users that are not infrastructure admins.

To remediate a failed test, you will need to either revoke these users' access to the logging system or add them as infrastructure administrators in your Managed Accounts page in Drata. To see details on how this test operates as part of the Datadog connection, please go to [this article](datadog-integration-guide.md).

## Related articles

- [Test 6: Only Authorized Employees Access Version Control](test-6-only-authorized-employees-access-version-control.md)
- [Test 7: Only Authorized Employees Change Code](test-7-only-authorized-employees-change-code.md)
- [Test 109: Logs are Centrally Stored](test-109-logs-are-centrally-stored.md)
- [Test 111: Logs are Retained for 365 Days](test-111-logs-are-retained-for-365-days.md)
- [Test 121: Logs Monitored for Suspicious Activity](test-121-logs-monitored-for-suspicious-activity.md)
