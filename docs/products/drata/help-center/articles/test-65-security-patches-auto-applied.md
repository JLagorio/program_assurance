# Test 65: Security Patches Auto-Applied

Source: https://help.drata.com/en/articles/4776966-test-65-security-patches-auto-applied
Collection: Monitoring Test Guidance
Updated: 2026-11-14
Fetched: 2026-11-22
Description: Drata inspects your company computers to determine if each automatically applies operating system security patches.

## Article text

**ASSOCIATED DRATA CONTROL**

This test is part of the **Security Patches Automatically Applied **control that ensures all company-issued computer and workstation operating systems are configured to apply security patches automatically, if using the Drata Agent. If using one of the MDM connections, the test ensures all company-issued computers and workstations are compliant with the mapped security patches policy.

**WHAT TO DO IF A TEST FAILS**

If Drata finds computers or workstations that 1) are not automatically applying security patches or 2) aren't compliant with the mapped security patches policy, the test will fail. With a failed test you will receive a list of computers/workstations that do not have automatic updates configured or are not compliant with the mapped automatic updates policy.

To remediate a failed test, you will need to advise the owners of these computers/workstations to properly configure their operating systems to apply security patches automatically or to be compliant with the mapped device policy.

**STEPS TO REMEDIATE**

If you are using the Drata Agent, ensure that the user has installed the Drata Agent and that the Agent is currently running on their system.

If you are using one of the MDM connections, ensure that:

1. The automatic updates policy exists
2. The automatic updates policy maps to the user’s device
3. The user’s device is compliant with the automatic updates policy

Alternatively:

1. Navigate to the Personnel page
2. Select a Personnel and click to open the detail drawer
3. Upload evidence that the personnel has enabled auto updates for security patches

## Related articles

- [Test 63: Password Manager Records on Employee Computers](test-63-password-manager-records-on-employee-computers.md)
- [Test: Has Security Policies](test-has-security-policies.md)
- [Test 64: Malware Detection Software Installed](test-64-malware-detection-software-installed.md)
- [Test: Policies for a Security Team](test-policies-for-a-security-team.md)
- [Test 66: Hard-Disk Encryption Enabled on Employee Computers](test-66-hard-disk-encryption-enabled-on-employee-computers.md)
