# Test 223: AWS CMK Rotation

Source: https://help.drata.com/en/articles/9828731-test-223-aws-cmk-rotation
Collection: Monitoring Test Guidance
Updated: 2024-10-30
Fetched: 2026-11-22
Description: Drata validates that key rotation is enabled for customer-created symmetric customer master keys (CMKs) in AWS Key Management Service (KMS).

## Article text

Drata validates that key rotation is enabled for customer-created symmetric customer master keys (CMKs) in AWS Key Management Service (KMS).

## Prerequisites

- Requires CMKs to have the following permissions to be monitored:
   - `kms:ListKeys`
   - `kms:DescribeKey`
   - `kms:GetKeyRotationStatus`
   - To add the necessary permissions for auto-rotation monitoring in the key policy of each CMK:
      1. Navigate to **AWS Key Management Service (KMS)** in the AWS Console.
      2. Select the **Customer managed keys **from the side menu.
      3. Select each CMK that requires monitoring (repeat the following steps for each key).
      4. Navigate to the **Key policy** tab.
      5. Edit the Key Policy JSON by adding a new statement or modifying an existing one:
         - Ensure that permissions for `kms:ListKeys`, `kms:DescribeKey`, and `kms:GetKeyRotationStatus` are included in the **Action **property.
         - Ensure the Principal is specified as `arn:aws:iam::<Account-ID>:role/DrataAutopilotRole`. "<Account-ID> " must be replaced with your AWS Account ID.
         - To scope the permissions to specific keys, use the key ARN(s) in the **Resource **property. Alternatively, set the **Resource** to `*` to apply to all CMKs

## ASSOCIATED DRATA CONTROL

This test is part of the Cryptographic Key Rotation control (DCF-779) that ensures your company has implemented processes to change cryptographic keys periodically based on a defined schedule.

## WHAT TO DO IF A TEST FAILS

If Drata finds that automatic rotation is not enabled for one or more CMKs in AWS KMS, the test will fail.

Rotating encryption keys helps reduce the potential impact of a compromised key as data encrypted with a new key cannot be accessed with a previous key that may have been exposed. Keys should be rotated every year, or upon an event that would result in the compromise of that key. It is recommended that CMK key rotation be enabled for symmetric keys. Key rotation can not be enabled for any asymmetric CMK.

### STEPS TO REMEDIATE

From the KMS console, under 'Customer-managed keys', select the key without automatic rotation enabled and check the 'Automatically rotate this KMS key every year' checkbox.

## Center for Internet Security (CIS)

This test aligns with the Center for Internet Security’s (CIS) foundation benchmarks which provides prescriptive guidance for establishing a secure baseline configuration for Amazon Web Services. To learn more, refer to the [Center for Internet Security (CIS) section](october-2024-release-aws-drata-test.md#h_d20827a35e).

## Related articles

- [Test 232: AWS IAM Access Key Rotation](test-232-aws-iam-access-key-rotation.md)
- [Test 222: AWS CloudTrail Logs Encrypted](test-222-aws-cloudtrail-logs-encrypted.md)
- [Test 234: AWS S3 HTTP Requests Denied](test-234-aws-s3-http-requests-denied.md)
- [Test 231: AWS EFS Encrypted at Rest](test-231-aws-efs-encrypted-at-rest.md)
- [Test 254: Azure Key Vaults Key Expiration](test-254-azure-key-vaults-key-expiration.md)
