# Test 210: Encryption in Transit

Source: https://help.drata.com/en/articles/8946445-test-210-encryption-in-transit
Collection: Monitoring Test Guidance
Updated: 2025-08-27
Fetched: 2026-11-22

## Article text

Drata collects data from your cloud security posture management (CSPM) software to determine if there are active issues related to encryption of data in transit.

## ASSOCIATED DRATA CONTROL

This test is part of the Encryption of Data in Transit control that ensures that data in transit is encrypted using strong cryptographic algorithms.

## WHAT TO DO IF A TEST FAILS

If Drata finds one or more issues from your CSPM, the test will fail. With a failed test, you will receive a list of issues along with associated entities and severity.

To remediate a failed test, you will need to exclude the issues or you will need to communicate to the Security team to fix and close the issues.

## Related articles

- [Wiz (CSPM) Integration Guide](wiz-cspm-integration-guide.md)
- [Test 208: Excessive Privileges Assigned](test-208-excessive-privileges-assigned.md)
- [Test 209: External Exposure of Cloud Resources](test-209-external-exposure-of-cloud-resources.md)
- [Test 218: AWS EBS Volume Encryption](test-218-aws-ebs-volume-encryption.md)
- [Test 270: Azure SQL Data Encryption](test-270-azure-sql-data-encryption.md)
