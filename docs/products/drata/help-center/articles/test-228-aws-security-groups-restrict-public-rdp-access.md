# Test 228: AWS Security Groups Restrict Public RDP Access

Source: https://help.drata.com/en/articles/9828740-test-228-aws-security-groups-restrict-public-rdp-access
Collection: Monitoring Test Guidance
Updated: 2026-08-17
Fetched: 2026-11-22

## Article text

Drata validates that no security groups in the cloud infrastructure have inbound rules that allow access to RDP port (3389) with a source of `0.0.0.0/0` or `::/0`.

Security groups provide stateful filtering of ingress and egress network traffic to AWS resources. It is recommended that no security group allow unrestricted ingress access to remote server administration ports, such as SSH to port 22 and RDP to port 3389, using either the TDP (6), UDP (17) or ALL (-1) protocols.

Public access to remote server administration ports, such as 22 and 3389, increases resource attack surface and unnecessarily raises the risk of resource compromise.

## ASSOCIATED DRATA CONTROL

This test is part of the **Access to Remote Server Administration Ports Restricted** control (DCF-73) that network security controls are in place to restrict public access to remote server administration ports (e.g., SSH, RDP) to authorized IP addresses or address ranges only.

## WHAT TO DO IF A TEST FAILS

If Drata finds that one or more of your security groups allow public RDP access, the test will fail.

**STEPS TO REMEDIATE**

From the AWS Management Console, select 'VPCs' and, under 'Security Groups', perform the following steps for each failing security group:

1. Select the security group.
2. Click the 'Inbound Rules' tab.
3. Click the 'Edit inbound rules' button.
4. Either update the 'Source' field to a range other than `0.0.0.0/0` or `::/0`, or click 'Delete' to remove the rule.

## Center for Internet Security (CIS)

This test aligns with the Center for Internet Security’s (CIS) foundation benchmarks which provides prescriptive guidance for establishing a secure baseline configuration for Amazon Web Services. To learn more, refer to the [Center for Internet Security (CIS) section](october-2024-release-aws-drata-test.md#h_d20827a35e).

## Related articles

- [Test 119: Firewall Default Disallows Traffic](test-119-firewall-default-disallows-traffic.md)
- [Test 227: AWS Network ACLs Public Remote Server Administration Access Restricted](test-227-aws-network-acls-public-remote-server-administration-access-restricted.md)
- [Test 220: AWS RDS Public Access Restricted](test-220-aws-rds-public-access-restricted.md)
- [Test 291: AWS Security Groups HTTP Access Restricted](test-291-aws-security-groups-http-access-restricted.md)
- [Test 268: Azure Network Security Group SSH Public Access Restricted](test-268-azure-network-security-group-ssh-public-access-restricted.md)
