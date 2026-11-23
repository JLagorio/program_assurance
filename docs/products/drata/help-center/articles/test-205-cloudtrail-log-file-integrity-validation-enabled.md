# Test 205: CloudTrail log file integrity validation enabled

Source: https://help.drata.com/en/articles/10029049-test-205-cloudtrail-log-file-integrity-validation-enabled
Collection: Monitoring Test Guidance
Updated: 2024-10-29
Fetched: 2026-11-22
Description: Drata validates that AWS CloudTrail log validation is enabled on all trails.

## Article text

Drata validates that AWS CloudTrail log validation is enabled on all trails.

CloudTrail log file validation creates a digitally signed digest file containing a hash of
each log that CloudTrail writes to S3. These digest files can be used to determine
whether a log file was changed, deleted, or unchanged after CloudTrail delivered the
log. It is recommended that file validation be enabled on all CloudTrails.

## ASSOCIATED DRATA CONTROL

This test is part of the Change Detection Mechanism control (DCF-478) that ensures your company has enabled file integrity monitoring or a change-detection mechanism to detect unauthorized modification (including changes, additions, and deletions) of critical system files, configuration files, audit files, or content files to ensure critical data cannot be changed without generating alerts.

## WHAT TO DO IF A TEST FAILS

If it appears that AWS CloudTrail log validation is not enabled on one or more trails, your test will fail. Enabling log file validation will provide additional integrity checking of CloudTrail logs.

### STEPS TO REMEDIATE

**Note**: Do this for each trail that is failing this test.

1. Sign in to the AWS Management Console and open the IAM console at.
2. Click on Trails on the left navigation pane.
3. Click on a trail that's failing this test.
4. Within the 'General details' section click edit.
5. Under the 'Advanced settings' section ensure that 'Enable' is checked under 'Log file validation' and save changes.

## Center for Internet Security (CIS)

This test aligns with the Center for Internet Security’s (CIS) foundation benchmarks which provides prescriptive guidance for establishing a secure baseline configuration for Amazon Web Services. To learn more, refer to the [Center for Internet Security (CIS) section](october-2024-release-aws-drata-test.md#h_d20827a35e).

## Related articles

- [Test 221: AWS S3 Bucket Access Logging](test-221-aws-s3-bucket-access-logging.md)
- [Test 222: AWS CloudTrail Logs Encrypted](test-222-aws-cloudtrail-logs-encrypted.md)
- [Test 224: AWS VPC Flow Logging](test-224-aws-vpc-flow-logging.md)
- [Test 231: AWS EFS Encrypted at Rest](test-231-aws-efs-encrypted-at-rest.md)
- [Test 226: AWS S3 Object-Level Logging for Read & Write Events](test-226-aws-s3-object-level-logging-for-read-write-events.md)
