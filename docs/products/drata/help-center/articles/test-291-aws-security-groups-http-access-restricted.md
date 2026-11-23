# Test 291: AWS Security Groups HTTP Access Restricted

Source: https://help.drata.com/en/articles/9828797-test-291-aws-security-groups-http-access-restricted
Collection: Monitoring Test Guidance
Updated: 2026-08-17
Fetched: 2026-11-22
Description: Drata validates that AWS Security Groups restrict inbound HTTP access (Port 80) to specific IP or IP ranges only.

## Article text

## ASSOCIATED DRATA CONTROL

This test is part of the Network Security Controls control (DCF-85) that ensures network security controls are in place to limit inbound and outbound traffic to the environment to only what is necessary based on business justification. All other traffic is specifically denied.

## WHAT TO DO IF A TEST FAILS

If Drata finds that one or more AWS Security Groups do not restrict HTTP access (Port 80) to specific IP or IP ranges only, the test will fail.

**STEPS TO REMEDIATE**

1. Sign into AWS Management Console and navigate to the EC2 dashboard.
2. Click on 'Security groups' under 'Network & Security'.
3. Look for security groups failing this test or security groups that have inbound rules with '`FromPort`' and '`ToPort`' set to '`80`' and '`IpRanges.CidrIp`' set to '`0.0.0.0/0`' or '`Ipv6Ranges.CidrIp`' set to '`://0`'.
4. Select a security group and click on the 'Edit inbound rules' button from the 'Inbound rules' tab.
5. Restrict public access by locating the rule that allows inbound traffic on port '80' from '`0.0.0.0/0`' or '`::/0`' and either deleting the rule or modifying the source to restrict it to a specific IP address or range. To modify the rule, change the 'Source' from '`0.0.0.0/0`' or '`::/0`' to a more restrictive CIDR block, such as your organization's IP ranges.
6. Save changes and repeat for each failing security group.

## Related articles

- [Test 119: Firewall Default Disallows Traffic](test-119-firewall-default-disallows-traffic.md)
- [Test 227: AWS Network ACLs Public Remote Server Administration Access Restricted](test-227-aws-network-acls-public-remote-server-administration-access-restricted.md)
- [Test 228: AWS Security Groups Restrict Public RDP Access](test-228-aws-security-groups-restrict-public-rdp-access.md)
- [Test 233: AWS VPC Default Security Groups Restrict All Traffic](test-233-aws-vpc-default-security-groups-restrict-all-traffic.md)
- [Test 220: AWS RDS Public Access Restricted](test-220-aws-rds-public-access-restricted.md)
