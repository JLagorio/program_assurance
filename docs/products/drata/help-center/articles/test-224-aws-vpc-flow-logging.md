# Test 224: AWS VPC Flow Logging

Source: https://help.drata.com/en/articles/9828733-test-224-aws-vpc-flow-logging
Collection: Monitoring Test Guidance
Updated: 2026-11-14
Fetched: 2026-11-22
Description: Drata validates that VPC flow logging is enabled in all AWS VPCs.

## Article text

Drata validates that VPC flow logging is enabled in all AWS VPCs. VPC Flow Logs is a feature that enables you to capture information about the IP traffic going to and from network interfaces in your VPC. After you've created a flow log, you can view and retrieve its data in Amazon CloudWatch Logs. It is recommended that VPC Flow Logs be enabled for packet "Rejects" for VPCs.

VPC Flow Logs provide visibility into network traffic that traverses the VPC and can be used to detect anomalous traffic or provide insight during security workflows.

## ASSOCIATED DRATA CONTROL

This test is part of the **Audit Logging** control (DCF-406) that ensures audit logs are enabled and active for all system components and sensitive data in accordance with company policies.

## WHAT TO DO IF A TEST FAILS

If Drata finds that there is one or more VPCs with flow logging disabled, the test will fail. VPC Flow Logs provide visibility into network traffic that traverses the VPC and can be used to detect anomalous traffic or insight during security workflows. It is recommended that VPC Flow Logs be enabled for packet 'Rejects' for VPCs.

**STEPS TO REMEDIATE**

From the management console, select 'Services' and then 'VPC'. Select a VPC and click on 'create Flow Log'. For filter, select 'Reject' and enter in a 'Role' and 'Destination Log Group'.

**Note**: Setting the filter to 'Reject' will dramatically reduce the logging data accumulation for this recommendation and provide sufficient information for the purposes of breach detection, research and remediation. However, during periods of least privilege security group engineering, setting the filter to 'All' can be very helpful in discovering existing traffic flows required for proper operation of an already running environment.

## Center for Internet Security (CIS)

This test aligns with the Center for Internet Security’s (CIS) foundation benchmarks which provides prescriptive guidance for establishing a secure baseline configuration for Amazon Web Services. To learn more, refer to the [Center for Internet Security (CIS) section](october-2024-release-aws-drata-test.md#h_d20827a35e).

## Related articles

- [Test 221: AWS S3 Bucket Access Logging](test-221-aws-s3-bucket-access-logging.md)
- [Test 222: AWS CloudTrail Logs Encrypted](test-222-aws-cloudtrail-logs-encrypted.md)
- [Test 233: AWS VPC Default Security Groups Restrict All Traffic](test-233-aws-vpc-default-security-groups-restrict-all-traffic.md)
- [Test 226: AWS S3 Object-Level Logging for Read & Write Events](test-226-aws-s3-object-level-logging-for-read-write-events.md)
- [Test 205: CloudTrail log file integrity validation enabled](test-205-cloudtrail-log-file-integrity-validation-enabled.md)
