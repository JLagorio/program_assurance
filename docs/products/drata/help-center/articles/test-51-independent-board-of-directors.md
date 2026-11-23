# Test 51: Independent Board of Directors

Source: https://help.drata.com/en/articles/4776954-test-51-independent-board-of-directors
Collection: Monitoring Test Guidance
Updated: 2026-08-05
Fetched: 2026-11-22
Description: Drata inspects your company records to determine if all of its Board of Directors' biographies were saved.

## Article text

**ASSOCIATED DRATA CONTROL**

This test is part of the **Independent Board of Directors **control that ensures the members of the Board of Directors are independent of management, if a Board of Directors exists.

**WHAT TO DO IF A TEST FAILS**

If Drata has identified that a Board of Directors does exist but cannot find members indicated within Drata the test will fail. In addition, if the profile URL for any board member is not publicly accessible on the internet, the test will fail.

To remediate a failed test you will need to input the appropriate members for the Board of Directors directly within Drata. LinkedIn profile URLs are the most reliable way to ensure the test passes.

**STEPS TO REMEDIATE**

1. Navigate to the Key Personnel Info page (account-settings/personnel)
2. Add/Verify that a user has been added as a Board of Directors members, with a public profile URL
3. Update settings
   - NOTE: If the monitoring test fails with properly-entered public URLs, try encoding the URLs as a troubleshooting step (refer to [this article](https://www.w3schools.com/tags/ref_urlencode.ASP) as a guide)

## Related articles

- [Test: Policies are Acknowledged](test-policies-are-acknowledged.md)
- [Test: Policies for a Security Team](test-policies-for-a-security-team.md)
- [Test 47: Employee Background Checks](test-47-employee-background-checks.md)
- [Test 50: Contractor Background Checks](test-50-contractor-background-checks.md)
- [Test 66: Hard-Disk Encryption Enabled on Employee Computers](test-66-hard-disk-encryption-enabled-on-employee-computers.md)
