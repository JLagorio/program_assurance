# Test 218: AWS EBS Volume Encryption

Source: https://help.drata.com/en/articles/9828784-test-218-aws-ebs-volume-encryption
Collection: Monitoring Test Guidance
Updated: 2026-11-14
Fetched: 2026-11-22
Description: Validates that default encryption for elastic block store (EBS) volume creation is enabled for every region where EC2 instances are detected

## Article text

Drata validates that default encryption for elastic block store (EBS) volume creation is enabled for every region where EC2 instances are detected. Elastic Compute Cloud (EC2) supports encryption at rest when using the Elastic Block Store (EBS) service. While disabled by default, forcing encryption at EBS volume creation is supported.

Encrypting data at rest reduces the likelihood that it is unintentionally exposed and can nullify the impact of disclosure if the encryption remains unbroken.

## ASSOCIATED DRATA CONTROL

This test is part of the **Encryption at Rest** control (DCF-54) that ensures data at rest is encrypted using strong cryptographic algorithms.

## WHAT TO DO IF A TEST FAILS

If Drata finds that the default encryption for EBS volumes at creation is not enabled in one or more regions where EC2 instances were detected, the test will fail.

**STEPS TO REMEDIATE**

1. From the Amazon EC2 console, under 'Account attributes', click EBS encryption, then 'Manage', and then the 'Enable' checkbox.
2. Click 'Update EBS encryption' and repeat for each failing region (EBS volume encryption is configured per region).

Note: Losing access or removing the KMS key in use by the EBS volumes will result in no longer being able to access the volumes.

## Center for Internet Security (CIS)

This test aligns with the Center for Internet Security’s (CIS) foundation benchmarks which provides prescriptive guidance for establishing a secure baseline configuration for Amazon Web Services. To learn more, refer to the [Center for Internet Security (CIS) section](october-2024-release-aws-drata-test.md#h_d20827a35e).

## Related articles

- [Test 68: Customer Data is Encrypted at Rest](test-68-customer-data-is-encrypted-at-rest.md)
- [Test 222: AWS CloudTrail Logs Encrypted](test-222-aws-cloudtrail-logs-encrypted.md)
- [Test 231: AWS EFS Encrypted at Rest](test-231-aws-efs-encrypted-at-rest.md)
- [Test 292: AWS EC2 Instances IMDSv1 Disabled](test-292-aws-ec2-instances-imdsv1-disabled.md)
- [Test 270: Azure SQL Data Encryption](test-270-azure-sql-data-encryption.md)
