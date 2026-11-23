# Test 208: Excessive Privileges Assigned

Source: https://help.drata.com/en/articles/8946448-test-208-excessive-privileges-assigned
Collection: Monitoring Test Guidance
Updated: 2025-08-27
Fetched: 2026-11-22

## Article text

Drata collects data from your cloud security posture management (CSPM) software to determine if there are active issues related to accounts with excessive administrative privileges.

## ASSOCIATED DRATA CONTROL

This test is part of the Privileged Access Restricted and Need-to-know Principle controls that ensures that only authorized personnel have access to system, resources and sensitive data.

## WHAT TO DO IF A TEST FAILS

If Drata finds one or more issues from your CSPM, the test will fail. With a failed test, you will receive a list of issues along with associated entities and severity.

To remediate a failed test, you will need to exclude the issues or you will need to communicate to the Security team to fix and close the issues.

## Related articles

- [Test 3: Least Privilege Policy for Customer Data Access](test-3-least-privilege-policy-for-customer-data-access.md)
- [Wiz (CSPM) Integration Guide](wiz-cspm-integration-guide.md)
- [Test 210: Encryption in Transit](test-210-encryption-in-transit.md)
- [Test 209: External Exposure of Cloud Resources](test-209-external-exposure-of-cloud-resources.md)
- [Test 217: AWS IAM Group-Based Access Control](test-217-aws-iam-group-based-access-control.md)
