# Test 219: AWS RDS Auto Minor Version Upgrade

Source: https://help.drata.com/en/articles/9828785-test-219-aws-rds-auto-minor-version-upgrade
Collection: Monitoring Test Guidance
Updated: 2026-08-17
Fetched: 2026-11-22
Description: Drata validates that the automatic minor version upgrade feature is enabled for AWS RDS instances.

## Article text

Drata validates that the automatic minor version upgrade feature is enabled for AWS RDS instances. Ensure that RDS database instances have the Auto Minor Version Upgrade flag enabled in order to receive automatic minor engine upgrades during the specified maintenance window. So, RDS instances can get the new features, bug fixes, and security patches for their database engines.

AWS RDS will occasionally deprecate minor engine versions and provide new ones for an upgrade. When the last version number within the release is replaced, the version changed is considered minor. With Auto Minor Version Upgrade feature enabled, the version upgrades will occur automatically during the specified maintenance window so your RDS instances can get the new features, bug fixes, and security patches for their database engines.

## ASSOCIATED DRATA CONTROL

This test is part of the **Automated Security Updates **control (DCF-152) that your company has implemented automated mechanisms (e.g., unattended upgrades, automated patching tools, etc.) to install security fixes to systems.

## WHAT TO DO IF A TEST FAILS

If Drata finds that the automatic minor version upgrade feature is disabled for one or more AWS RDS instances, the test will fail

### STEPS TO REMEDIATE

**Note**: Repeat this process for each RDS instance failing this test.

1. Navigate to the RDS dashboard from the AWS management console.
2. In the left navigation panel, click on 'Databases'.
3. Select the RDS instance that you want to update.
4. Click on the 'Modify' button placed on the top right side.
5. On the Modify DB Instance: <instance identifier> page, in the Maintenance section, select 'Auto minor version upgrade' and click on the 'Yes' radio button.
6. At the bottom of the page click on 'Continue', check 'Apply Immediately' to apply the changes immediately, or select 'Apply during the next scheduled maintenance window' to avoid any downtime.
7. Review the changes and click on Modify DB Instance. The instance status should change from available to modifying and back to available. Once the feature is enabled, the Auto Minor Version Upgrade status should change to 'Yes'.

## Center for Internet Security (CIS)

This test aligns with the Center for Internet Security’s (CIS) foundation benchmarks which provides prescriptive guidance for establishing a secure baseline configuration for Amazon Web Services. To learn more, refer to the [Center for Internet Security (CIS) section](october-2024-release-aws-drata-test.md#h_d20827a35e).

## Related articles

- [Virtual Asset Population: AWS](virtual-asset-population-aws.md)
- [Test 224: AWS VPC Flow Logging](test-224-aws-vpc-flow-logging.md)
- [Test 220: AWS RDS Public Access Restricted](test-220-aws-rds-public-access-restricted.md)
- [Test 290: AWS Database Writes I/O Monitored](test-290-aws-database-writes-i-o-monitored.md)
- [Test 292: AWS EC2 Instances IMDSv1 Disabled](test-292-aws-ec2-instances-imdsv1-disabled.md)
