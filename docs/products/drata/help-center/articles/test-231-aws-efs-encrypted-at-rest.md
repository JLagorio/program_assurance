# Test 231: AWS EFS Encrypted at Rest

Source: https://help.drata.com/en/articles/9828789-test-231-aws-efs-encrypted-at-rest
Collection: Monitoring Test Guidance
Updated: 2026-11-14
Fetched: 2026-11-22
Description: Drata validates that AWS Elastic File System (EFS) data is encrypted at rest using AWS KMS for all regions.

## Article text

Drata validates that AWS Elastic File System (EFS) data is encrypted at rest using AWS KMS for all regions. EFS data should be encrypted at rest using AWS KMS (Key Management Service).

Data should be encrypted at rest to reduce the risk of a data breach via direct access to the storage device.

## ASSOCIATED DRATA CONTROL

This test is part of the **Encryption at Rest** control (DCF-54) that ensures data at rest is encrypted using strong cryptographic algorithms.

## WHAT TO DO IF A TEST FAILS

If Drata finds that one or more EFS file systems are not encrypted at rest in one or more regions, the test will fail. Data should be encrypted at rest to reduce the risk of a data breach via direct access to the storage device.

### STEPS TO REMEDIATE

EFS file system data at rest encryption must be turned on when creating the file system. If an EFS file system has been created without data at rest encryption enabled, then you must create another EFS file system with the correct configuration and transfer the data.

## Center for Internet Security (CIS)

This test aligns with the Center for Internet Security’s (CIS) foundation benchmarks which provides prescriptive guidance for establishing a secure baseline configuration for Amazon Web Services. To learn more, refer to the [Center for Internet Security (CIS) section](october-2024-release-aws-drata-test.md#h_d20827a35e).

## Related articles

- [Test 68: Customer Data is Encrypted at Rest](test-68-customer-data-is-encrypted-at-rest.md)
- [Test 69: Customer Data in Cloud Storage is Encrypted at Rest](test-69-customer-data-in-cloud-storage-is-encrypted-at-rest.md)
- [Test 222: AWS CloudTrail Logs Encrypted](test-222-aws-cloudtrail-logs-encrypted.md)
- [Test 223: AWS CMK Rotation](test-223-aws-cmk-rotation.md)
- [Test 218: AWS EBS Volume Encryption](test-218-aws-ebs-volume-encryption.md)
