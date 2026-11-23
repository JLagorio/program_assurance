# Test 63: Password Manager Records on Employee Computers

Source: https://help.drata.com/en/articles/4775951-test-63-password-manager-records-on-employee-computers
Collection: Monitoring Test Guidance
Updated: 2026-10-28
Fetched: 2026-11-22
Description: Drata inspects your company computers to determine if each is running a password manager.

## Article text

**ASSOCIATED DRATA CONTROL**

This test is part of the **Password Manager **control that ensures all company-issued laptops have a [supported password manager](installing-and-using-a-password-manager.md) installed.

**WHAT TO DO IF A TEST FAILS**

If Drata finds computers or workstations that do not have a supported password manager installed, the test will fail. With a failed test you will receive a list of computers/workstations that do not have a supported password manager installed.

To remediate a failed test, you will need to advise the owners of these computers/workstations to install a supported password manager.

Devices may demonstrate proper password manager installation in the following ways:

- If using the Drata agent:
   - Installing a supported third-party desktop application or browser extension will be recognized as passing on any operating system
- If using an MDM integration:
   - For all MDM integrations, installing a supported third-party desktop application will be recognized as passing on any operating system
   - If using the JumpCloud MDM integration, using a supported Chrome Extension will be recognized as passing on any operating system
      - Drata also supports JumpCloud's Password Vault (see documentation [here](https://jumpcloud.com/blog/moving-to-the-new-password-vault-what-changes-and-how-to-migrate) and [here](https://jumpcloud.com/support/migrating-to-password-vault-from-jumpcloud-legacy-password-manager) and [here](https://jumpcloud.com/support/faq-migrating-from-jumpcloud-password-manager-to-password-vault)).
      - JumpCloud's recommended migration path is to uninstall the standalone Password Manager desktop app and move to the JumpCloud Go extension. JumpCloud Go is required to use the Vault, so every Vault user has it. At the same time, JumpCloud Go is also used just for login (SSO), so having it alone doesn't mean someone uses the Vault.
      - Drata users will pass that test according to the following two-part logic; both conditions must be met:
         1. **User is active in Password Vault, and**
         2. **Device has the JumpCloud Go extension installed**
   - If using any other MDM integration, only desktop applications will be recognized as passing on any operating system

**STEPS TO REMEDIATE**

To remediate a failed test, you will need to advise these employees to install a supported  password manager.

Alternatively:

1. Navigate to the Personnel page
2. Select a Personnel and click to open the detail drawer
3. Upload evidence that the personnel is using a Password Manager

**HELPFUL RESOURCES**

- [Why you should use a Password Manager](https://www.howtogeek.com/141500/why-you-should-use-a-password-manager-and-how-to-get-started/)
- [LastPass - Password Manager](https://www.lastpass.com/)
- [1Password - Password Manager](https://1password.com/)

## Related articles

- [Test 64: Malware Detection Software Installed](test-64-malware-detection-software-installed.md)
- [Test 65: Security Patches Auto-Applied](test-65-security-patches-auto-applied.md)
- [Test 62: Password Manager Required](test-62-password-manager-required.md)
- [Test 66: Hard-Disk Encryption Enabled on Employee Computers](test-66-hard-disk-encryption-enabled-on-employee-computers.md)
- [JumpCloud Integration Guide (MDM)](jumpcloud-integration-guide-mdm.md)
