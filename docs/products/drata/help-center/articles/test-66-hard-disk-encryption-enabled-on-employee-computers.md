# Test 66: Hard-Disk Encryption Enabled on Employee Computers

Source: https://help.drata.com/en/articles/4778714-test-66-hard-disk-encryption-enabled-on-employee-computers
Collection: Monitoring Test Guidance
Updated: 2026-08-05
Fetched: 2026-11-22
Description: Drata inspects your company computers to determine if each hard-disks is encrypted.

## Article text

**ASSOCIATED DRATA CONTROL**

This test is part of the **Hard-Disk Encryption** control that ensures all company-issued computers and workstations have encrypted hard disks, if using the Drata Agent. If using one of the MDM connections, the test ensures all company-issued computers and workstations are compliant with the mapped hard disk encryption device policy.

**WHAT TO DO IF A TEST FAILS**

If Drata finds computers or workstations that 1) do not have encrypted hard disks or 2) aren’t compliant with the mapped hard disk encryption device policy, the test will fail. With a failed test you will receive a list of computers/workstations that do not have encrypted hard disks or are not compliant with the mapped hard disk encryption device policy.

To remediate a failed test, you will need to advise the owners of these computers/workstations to properly configure their operating systems to enable hard-disk encryption or to be compliant with the mapped device policy.

**STEPS TO REMEDIATE**

If you are using the Drata Agent, ensure that the user has installed the Drata Agent and that the Agent is currently running on their system.

If you are using one of the MDM connections, ensure that:

1. The hard disk encryption policy exists
2. The hard disk encryption policy maps to the user’s device
3. The user’s device is compliant with the hard disk encryption policy

Alternatively:

1. Navigate to the Personnel page
2. Select a Personnel and click to open the detail drawer
3. Upload evidence that the personnel has encrypted their hard disk

## Related articles

- [Encrypting your Computer's Hard Drive](encrypting-your-computer-s-hard-drive.md)
- [Test 63: Password Manager Records on Employee Computers](test-63-password-manager-records-on-employee-computers.md)
- [Test 64: Malware Detection Software Installed](test-64-malware-detection-software-installed.md)
- [Test 65: Security Patches Auto-Applied](test-65-security-patches-auto-applied.md)
- [Test 127: Security Policies Cover Encryption](test-127-security-policies-cover-encryption.md)
