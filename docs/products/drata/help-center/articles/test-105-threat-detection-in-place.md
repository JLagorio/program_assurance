# Test 105: Threat Detection in Place

Source: https://help.drata.com/en/articles/4778757-test-105-threat-detection-in-place
Collection: Monitoring Test Guidance
Updated: 2026-08-05
Fetched: 2026-11-22
Description: Drata inspects your company AWS configuration to determine if AWS GuardDuty is in place to detect unauthorized file additions.

## Article text

## ASSOCIATED DRATA CONTROL

This test is part of the **Logging/Monitoring **control that ensures your company has AWS GuardDuty in place, if using an AWS Infrastructure. AWS GuardDuty must be configured within the cloud environment to detect unauthorized file additions, server instances, and application containers.

## WHAT TO DO IF A TEST FAILS

If Drata detects an AWS infrastructure where S3 buckets exist but cannot identify an active and properly configured AWS GuardDuty configuration, this test will fail. To remediate a failed test, enable and configure AWS GuardDuty to detect unauthorized file additions.

### Common reasons this test fails

- GuardDuty is not enabled in the region where AWS resources exist.
- GuardDuty is enabled in some regions but not all required regions.
- The Drata integration cannot retrieve GuardDuty detector information (for example, due to a region mismatch or insufficient permissions).
- S3 buckets exist in the account, but GuardDuty S3 protection is not enabled.

## STEPS FOR PASSING

To ensure a validated state when testing for AWS GuardDuty, complete the steps below. Once the provider steps are finished, return to Drata and re-run the test.

### How this test is evaluated

Drata evaluates this test based on whether your AWS account uses Amazon S3:

- If your account **does not have any S3 buckets**, this test will **pass automatically**.
- Once **S3 buckets are created**, AWS GuardDuty must be properly configured—including S3 protection—as outlined below. If these configurations are missing, the test will **fail**.

### AWS – GuardDuty

1. Go to the region
2. Go to [Amazon GuardDuty service](https://us-west-2.console.aws.amazon.com/guardduty/home?region=us-west-2#/)
3. Click on the "Get started" button
4. Enable S3 Monitoring under Guard Duty > Protection Plans > S3 Protection > Enable
5. Create an Event [here](https://us-west-2.console.aws.amazon.com/events/home?region=us-west-2#/rules/create) (switch to your region as needed) by clicking Create rule or navigate to Amazon EventBridge > Rules > Create Rule
   - Provide a Name and optional Description
   - Event bus: default
   - Toggle on "Enable the rule on the selected event bus"
   - Rule type: rule with an event pattern
   - Event Source: AWS events or EventBridge partner events
   - Event pattern -> Event source: AWS services
   - AWS service: GuardDuty
   - Event type: GuardDuty Finding
   - Target: This can be any valid target within the Event System, i.e. SNS
   - Click 'Configure details'
   - Click 'Create rule'

## HELPFUL RESOURCES

- [AWS Guard Duty](https://aws.amazon.com/guardduty/)

## Related articles

- [Test 30: Availability Zones Used](test-30-availability-zones-used.md)
- [Test 69: Customer Data in Cloud Storage is Encrypted at Rest](test-69-customer-data-in-cloud-storage-is-encrypted-at-rest.md)
- [Test 108: Storage Data Versioned or Retained](test-108-storage-data-versioned-or-retained.md)
- [Test 221: AWS S3 Bucket Access Logging](test-221-aws-s3-bucket-access-logging.md)
- [Test 226: AWS S3 Object-Level Logging for Read & Write Events](test-226-aws-s3-object-level-logging-for-read-write-events.md)
