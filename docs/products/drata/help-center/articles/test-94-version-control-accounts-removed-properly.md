# Test 94: Version Control Accounts Removed Properly

Source: https://help.drata.com/en/articles/4777036-test-94-version-control-accounts-removed-properly
Collection: Monitoring Test Guidance
Updated: 2026-08-05
Fetched: 2026-11-22
Description: Drata inspects your company records to determine if terminated employee accounts are removed from version control within the specified SLA.

## Article text

**ASSOCIATED DRATA CONTROL**

This test is part of the **Terminated Employee Access Revoked Within One Business Day **control that ensures access to infrastructure and code review tools is removed from terminated employees within one business day.

**WHAT TO DO IF A TEST FAILS**

This test examines two things:

1. The System Access Control policy is in place and approved
2. Former employees have an Access Revoked date for their linked VCS Managed Account

Ensure your System Access Control policy is in place and approved by the owner.

If Drata finds terminated/separated employees that still have access to the company Version Control System the test will fail. With a failed test you will receive a list of terminated/separated employees that still retain access.

To remediate a failed test, you will need to revoke the user's Version Control System access or mark them as not terminated on the 'Personnel' page within Drata.

## Related articles

- [Test 1: Policies Cover Employee Access](test-1-policies-cover-employee-access.md)
- [Test 13: System Access Control Policy](test-13-system-access-control-policy.md)
- [Test: Policies are Acknowledged](test-policies-are-acknowledged.md)
- [Test 95: Infrastructure Accounts Properly Removed](test-95-infrastructure-accounts-properly-removed.md)
- [Test: Termination Process and Checklist](test-termination-process-and-checklist.md)
