# Test 209: External Exposure of Cloud Resources

Source: https://help.drata.com/en/articles/8946449-test-209-external-exposure-of-cloud-resources
Collection: Monitoring Test Guidance
Updated: 2026-08-17
Fetched: 2026-11-22

## Article text

Drata collects data from your cloud security posture management (CSPM) software to determine if there are active issues related to external exposure of cloud resources.

## ASSOCIATED DRATA CONTROL

This test is part of the Cloud Data Storage Restricted, Network Security Controls and Inbound Traffic Restricted Between Untrusted and Trusted Networks controls that ensures that public access is restricted to your organization’s systems.

## WHAT TO DO IF A TEST FAILS

If Drata finds one or more issues from your CSPM, the test will fail. With a failed test, you will receive a list of issues along with associated entities and severity.

To remediate a failed test, you will need to exclude the issues or you will need to communicate to the Security team to fix and close the issues.

## Related articles

- [Test 123: Cloud Infrastructure Linked to Drata](test-123-cloud-infrastructure-linked-to-drata.md)
- [Wiz (CSPM) Integration Guide](wiz-cspm-integration-guide.md)
- [Test 210: Encryption in Transit](test-210-encryption-in-transit.md)
- [Test 208: Excessive Privileges Assigned](test-208-excessive-privileges-assigned.md)
- [Test 228: AWS Security Groups Restrict Public RDP Access](test-228-aws-security-groups-restrict-public-rdp-access.md)
