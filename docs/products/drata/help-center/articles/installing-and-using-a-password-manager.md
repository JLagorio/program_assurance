# Installing and Using a Password Manager

Source: https://help.drata.com/en/articles/4675829-installing-and-using-a-password-manager
Collection: Personnel Management › Device Compliance
Updated: 2026-09-10
Fetched: 2026-11-22
Description: Password managers like 1Password, LastPass, and others should be used.

## Article text

Your company may have specific guidance on how to set up a password manager. Verify this with your IT and compliance teams.

Passwords are a critical part of security. Password managers make it easier to create, store, and share passwords properly.

Below is a list of possible password managers your company may be using. Be sure to ask your IT Director or Manager which password manager is approved by your company. This should be stated in the company's Password Policy stored in Drata.

### Available Password Managers

The current supported password managers include, but are not limited to:

- **1Password**
   - If your company uses 1Password, download it directly from [1password.com/downloads](https://1password.com/downloads) and select the version for your operating system.
   - Once installed, sign in with your company 1Password account or the secret key and invitation link sent by your IT administrator.
- **Bitwarden**
- **Dashlane**
- **Enpass**
- **Intuitive Password**
- **KeePass / KeePassXC / KeeWeb**
- **Keeper**
- **LastPass**
- **NordPass**
- **pass **(a classic "standard Unix password manager" that uses GPG and Git)
- **Password Safe**
- **Pleasant Password Server**
- **SafeInCloud**
- **TeamPassword**
- **Cerby**
- **Thycotic Secret Server (now Delinea)**
- **System & OS Components**
   - **GNOME Keyring**
   - **Keychain (macOS)**
   - **KWallet**

**Notes:**

- Web browsers themselves (e.g., Chrome's built-in password manager) are not accepted as password managers due to security and auditor requirements.

If you use a password manager that Drata does not recognize, your Drata administrator can contact the Drata team to request an evaluation for adding it to the approved list.

## HERE'S HOW

Download and install your company's approved password manager. It might already be installed on your workstation if your company is using an MDM tool (Kandji, Jamf, etc.). If you are using the [Drata Agent](drata-agent-installation-link.md), it will automatically report your compliance status to Drata.

Make sure that proper preferences are set for your password manager:

- Set a strong unlock password
- Auto-lock after 5 minutes of inactivity
- Auto-lock at sleep

### macOS Native Password Manager

Currently, we do not scan and monitor the Mac OS native Password manager, because MacOS does not provide a straightforward method to determine if the native Password manager is being actively used, which poses challenges for ensuring compliance and proper security monitoring.

## Related articles

- [Test 63: Password Manager Records on Employee Computers](test-63-password-manager-records-on-employee-computers.md)
- [Test 89: Internal Password Policy for Employees](test-89-internal-password-policy-for-employees.md)
- [Test 62: Password Manager Required](test-62-password-manager-required.md)
- [1Password Device Trust (Kolide) Integration Guide](1password-device-trust-kolide-integration-guide.md)
- [Install the Drata Agent](install-the-drata-agent.md)
