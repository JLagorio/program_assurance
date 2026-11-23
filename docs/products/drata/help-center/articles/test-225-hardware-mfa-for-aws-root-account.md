# Test 225: Hardware MFA for AWS Root Account

Source: https://help.drata.com/en/articles/9828713-test-225-hardware-mfa-for-aws-root-account
Collection: Monitoring Test Guidance
Updated: 2026-10-20
Fetched: 2026-11-22
Description: Drata validates that hardware MFA is enabled for the root user account in AWS.

## Article text

Drata validates that hardware MFA is enabled for the root user account in AWS.

The 'root' user account is the most privileged user in an AWS account. MFA adds an extra layer of protection on top of a user name and password. With MFA enabled, when a user signs in to an AWS website, they will be prompted for their user name and password as well as for an authentication code from their AWS MFA device.

A hardware MFA has a smaller attack surface than a virtual MFA. For example, a hardware MFA does not suffer the attack surface introduced by the mobile smart phone on which a virtual MFA resides.

## ASSOCIATED DRATA CONTROL

This test is part of the **Root Infrastructure Account Monitored** control (DCF-90).

## WHAT TO DO IF A TEST FAILS

If Drata finds that hardware MFA is not enabled for the root user account in AWS, the test will fail. Additionally, the test will fail if the root account is secured with a virtual or software MFA instead of a hardware MFA, even though MFA is technically enabled.

**STEPS TO REMEDIATE**

1. Sign into AWS with the root account credentials and activate a hardware MFA from your dashboard, under 'Security Status.'
2. In the wizard, choose a 'Hardware MFA' device.
3. Enter the serial number that is found on the back of the MFA device in the 'Serial Number' field.
4. Enter the six-digit number displayed by the MFA device in the 'Authentication Code 1' field.
5. Wait 30 seconds while the device refreshes the code and then enter the next six-digit number in the 'Authentication Code 2' field.
6. Choose 'Next steps' and the MFA device should now be associated with this AWS account. **TROUBLESHOOTING ADDITIONAL ISSUES**
7. **Orphaned Virtual MFA Records**:
   - Review the AWS account for any virtual MFA records that are not linked to active IAM or root users.
   - Remove these orphaned records to prevent test failures.
8. **Data Sync Delays or Test Logic Discrepancies**:
   - If MFA is correctly configured but discrepancies persist, review the test logic to understand the specific conditions being checked.
   - Allow time for data synchronization between AWS and Drata, as delays can sometimes cause false positives.

## Center for Internet Security (CIS)

This test aligns with the Center for Internet Security’s (CIS) foundation benchmarks which provides prescriptive guidance for establishing a secure baseline configuration for Amazon Web Services. To learn more, refer to the [Center for Internet Security (CIS) section](october-2024-release-aws-drata-test.md#h_d20827a35e).

## Related articles

- [Test 86: MFA on Identity Provider](test-86-mfa-on-identity-provider.md)
- [Test 87: MFA on Version Control System](test-87-mfa-on-version-control-system.md)
- [Test 88: MFA on Infrastructure Console](test-88-mfa-on-infrastructure-console.md)
- [Test 124: Root Infrastructure Account Unused](test-124-root-infrastructure-account-unused.md)
- [Test 214: MFA for AWS Root Account](test-214-mfa-for-aws-root-account.md)
