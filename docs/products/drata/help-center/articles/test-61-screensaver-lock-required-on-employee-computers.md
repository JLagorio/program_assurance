# Test 61:  Screensaver Lock Required on Employee Computers

Source: https://help.drata.com/en/articles/4778709-test-61-screensaver-lock-required-on-employee-computers
Collection: Monitoring Test Guidance
Updated: 2026-08-05
Fetched: 2026-11-22
Description: Drata inspects if employee computers have a required password 60 seconds or less after the machine has been idle for at least 15 minutes.

## Article text

**ASSOCIATED DRATA CONTROL**

This test is part of the **Login Password **control that ensures all company-issued computershave a required password 60 seconds or less after the machine has been idle for at least 15 minutes. These settings are required whether the device uses the Drata agent or is synced from an MDM connection.

**WHAT TO DO IF A TEST FAILS**

If Drata finds employees that do not have a screensaver lock that adheres to your current Code of Conduct the test will fail. With a failed test you will receive a list of employees that have not set up a compliant screensaver lock.

Drata identifies the failing devices as those that do not require a password to be entered 60 seconds or less after the machine has been idle for at least 15 minutes.

**STEPS TO REMEDIATE**

To remediate a failed test, you will need to advise these employees to enable the screensaver lock settings that adhere to your Code of Conduct.

Alternatively:

1. Navigate to the Personnel page
2. Select a Personnel and click to open the detail drawer
3. Upload evidence that the personnel has enabled the required screen lock settings

## Related articles

- [Test 63: Password Manager Records on Employee Computers](test-63-password-manager-records-on-employee-computers.md)
- [Test 55: Employees Acknowledge the Code of Conduct](test-55-employees-acknowledge-the-code-of-conduct.md)
- [Test 64: Malware Detection Software Installed](test-64-malware-detection-software-installed.md)
- [Test 47: Employee Background Checks](test-47-employee-background-checks.md)
- [Test 66: Hard-Disk Encryption Enabled on Employee Computers](test-66-hard-disk-encryption-enabled-on-employee-computers.md)
