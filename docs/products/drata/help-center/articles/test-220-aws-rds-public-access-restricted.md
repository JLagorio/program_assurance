# Test 220: AWS RDS Public Access Restricted

Source: https://help.drata.com/en/articles/9828787-test-220-aws-rds-public-access-restricted
Collection: Monitoring Test Guidance
Updated: 2026-11-14
Fetched: 2026-11-22
Description: Drata validates that AWS RDS database instances do not allow unrestricted public access (0.0.0.0/0).

## Article text

Drata validates that AWS RDS database instances do not allow unrestricted public access (0.0.0.0/0). Ensure that RDS database instances provisioned in your AWS account restrict unauthorized access in order to minimize security risks. To restrict access to any publicly accessible RDS database instance, you must disable the database PubliclyAccessible flag and update the VPC security group associated with the instance.

Ensure that no public-facing RDS database instances are provisioned in your AWS account and restrict unauthorized access in order to minimize security risks. When the RDS instance allows unrestricted access (0.0.0.0/0), everyone and everything on the Internet can establish a connection to your database and this can increase the opportunity for malicious activities such as brute force attacks, PostgreSQL injections, or DoS/DDoS attacks.

## ASSOCIATED DRATA CONTROL

This test is part of the **Restricted Public Access **control (DCF-75) that ensures cloud resources are configured to deny public access.

## WHAT TO DO IF A TEST FAILS

If Drata finds that one or more AWS RDS instances allow unrestricted access, the test will fail. When the RDS instance allows unrestricted access (0.0.0.0/0), everyone and everything on the Internet can establish a connection to your database and this can increase the opportunity for malicious activities such as brute force attacks, PostgreSQL injections, or DoS/DDoS attacks.

### STEPS TO REMEDIATE

For each failing RDS instance, update your subnet configuration from the 'Modify DB Instance' panel by ensuring the connectivity configuration is not publicly accessible and that the subnet configurations are updated so that the instance is not in a public subnet.

If the route table contains any entries with the GatewayId value set to `igw-xxxxxxxx` and the `DestinationCidrBlock` value set to `0.0.0.0/0`, the selected RDS database instance was provisioned inside a public subnet, therefore is not running within a logically isolated environment and does not adhere to AWS security best practices.

## Center for Internet Security (CIS)

This test aligns with the Center for Internet Security’s (CIS) foundation benchmarks which provides prescriptive guidance for establishing a secure baseline configuration for Amazon Web Services. To learn more, refer to the [Center for Internet Security (CIS) section](october-2024-release-aws-drata-test.md#h_d20827a35e).

## Related articles

- [Test 221: AWS S3 Bucket Access Logging](test-221-aws-s3-bucket-access-logging.md)
- [Test 227: AWS Network ACLs Public Remote Server Administration Access Restricted](test-227-aws-network-acls-public-remote-server-administration-access-restricted.md)
- [Test 228: AWS Security Groups Restrict Public RDP Access](test-228-aws-security-groups-restrict-public-rdp-access.md)
- [Test 219: AWS RDS Auto Minor Version Upgrade](test-219-aws-rds-auto-minor-version-upgrade.md)
- [Test 290: AWS Database Writes I/O Monitored](test-290-aws-database-writes-i-o-monitored.md)
