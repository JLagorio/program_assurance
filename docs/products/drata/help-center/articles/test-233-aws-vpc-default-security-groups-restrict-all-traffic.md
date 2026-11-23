# Test 233: AWS VPC Default Security Groups Restrict All Traffic

Source: https://help.drata.com/en/articles/9828741-test-233-aws-vpc-default-security-groups-restrict-all-traffic
Collection: Monitoring Test Guidance
Updated: 2026-08-05
Fetched: 2026-11-22
Description: Drata validates that all AWS VPC default security groups are configured to restrict all traffic.

## Article text

Drata validates that all AWS VPC default security groups are configured to restrict all traffic. A VPC comes with a default security group whose initial settings deny all inbound traffic, allow all outbound traffic, and allow all traffic between instances assigned to the security group. If you don't specify a security group when you launch an instance, the instance is automatically assigned to this default security group. Security groups provide stateful filtering of ingress/egress network traffic to AWS resources. It is recommended that the default security group restrict all traffic.

Configuring all VPC default security groups to restrict all traffic will encourage least
privilege security group development and mindful placement of AWS resources into
security groups which will in-turn reduce the exposure of those resources.

## ASSOCIATED DRATA CONTROL

This test is part of the **Network Security Controls** control (DCF-85) that network security controls are in place to limit inbound and outbound traffic to the environment to only what is necessary based on business justification. All other traffic is specifically denied.

## WHAT TO DO IF A TEST FAILS

If Drata finds that one or more AWS VPC default security groups are not configured to restrict all traffic, the test will fail.

A VPC comes with a default security group whose initial settings deny all inbound traffic, allow all outbound traffic, and allow all traffic between instances assigned to the security group. If you don't specify a security group when you launch an instance, the instance is automatically assigned to this default security group. Configuring all VPC default security groups to restrict all traffic will encourage least privilege security group development and mindful placement of AWS resources into security groups which will in-turn reduce the exposure of those resources.

**STEPS TO REMEDIATE**

From the AWS Management Console, select 'VPCs' and, under 'Security Groups', perform the following steps for each default security group in each AWS region:

1. Select the default security group.
2. Click the 'Inbound Rules' tab and remove any inbound rules.
3. Click the 'Outbound rules' tab and remove any outbound rules.

**Recommended**: After remediating the default security group rules for all VPCs in all regions, ensure its intended use is clear by adding appropriate tags, such as "DO NOT USE - DO NOT ADD RULES." Leverage tagging policies to maintain consistency and provide operational awareness across your AWS environment.

## Center for Internet Security (CIS)

This test aligns with the Center for Internet Security’s (CIS) foundation benchmarks which provides prescriptive guidance for establishing a secure baseline configuration for Amazon Web Services. To learn more, refer to the [Center for Internet Security (CIS) section](october-2024-release-aws-drata-test.md#h_d20827a35e).

## Related articles

- [Test 119: Firewall Default Disallows Traffic](test-119-firewall-default-disallows-traffic.md)
- [Test 224: AWS VPC Flow Logging](test-224-aws-vpc-flow-logging.md)
- [Test 228: AWS Security Groups Restrict Public RDP Access](test-228-aws-security-groups-restrict-public-rdp-access.md)
- [Test 220: AWS RDS Public Access Restricted](test-220-aws-rds-public-access-restricted.md)
- [Test 291: AWS Security Groups HTTP Access Restricted](test-291-aws-security-groups-http-access-restricted.md)
