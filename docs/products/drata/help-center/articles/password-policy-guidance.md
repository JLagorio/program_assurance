# Password Policy Guidance

Source: https://help.drata.com/en/articles/7257685-password-policy-guidance
Collection: Policy Guidance
Updated: 2026-08-05
Fetched: 2026-11-22

## Article text

The following article contains guidance explaining portions of the Password Policy that we frequently see questions around, explaining what the sections mean.

Guidance statements will appear in bold and enclosed in brackets “[]” below the statements of the policy.

### Password Policy

### [COMPANY NAME]

______________________________________________________________________

### Purpose

This policy describes the procedure to select and securely manage passwords at [COMPANY NAME].

### Scope

This policy applies to all [COMPANY NAME] employees, contractors, and any other personnel who have an account on any system that resides at any company facility or has access to the company network.

### Roles and Responsibilities

**<ROLES AND RESPONSIBILITIES>**

**[Please see the following help article for information on how to fill out the Roles and Responsibilities section for the Password Policy: [https://help.drata.com/en/articles/5829670-roles-and-responsibilities-guidance](roles-and-responsibilities-guidance.md).]**

### Policy

If a password is suspected of being compromised, the password in question should be rotated and the Security Officer should be notified immediately.

A list of commonly-used, expected, or compromised passwords will be maintained by the designated official, and will be updated **<FREQUENCY>**.

**[This particular statement is specific only to NIST SP 800-53 framework and is not required for other frameworks]**

### Password Requirements/Authentication Protocol

- Complex passwords are required where possible. Complex passwords have at least 10 characters, 1+ uppercase letter(s), 1+ lowercase letter(s), 1+ non-alphanumeric character(s)
- Passwords must have at least 8 characters
- Do not reuse previously used passwords or their variants
- Do not use commonly used passwords
- Do not base passwords on dictionary words or combinations thereof
- Do not use the same passwords across distinct services and systems

**[These password requirements are all best practices and we recommend adherence to these requirements, regardless of the framework you are pursuing compliance with.]**

### MFA Requirements

- MFA must be enabled for any and all systems that provide the option for Multi-Factor Authentication (MFA)

### Password Distribution

If you are required to maintain your own secret authentication information, you will be provided initially with a unique, individual, and secure temporary secret authentication information in a secure manner, which you must acknowledge its receipt, and change on first use.

- Temporary secret authentication information must be non-guessable and unique for each user. Commonly-used compromised usernames, password combinations from hacked systems must not be used.
- The identity of a user prior to providing new, replacement or temporary authentication information must be verified and transmitted to the user in a secure manner (e.g., over an authenticated and protected channel). The use of unprotected (clear text) electronic mail messages for this purpose must be avoided.
- Records of significant events related to the allocation and management of authentication information must be maintained through approved record-keeping methods (e.g., by using an approved password vault tool).

**[The ‘Password Distribution’ section is only required for ISO 27001 and is optional for other frameworks. This is recommended though as a best practice.]**

### Password Protection

- All passwords are treated as confidential information and should not be shared with anyone. If you receive a request to share a password, deny the request and contact the system owner for assistance in provisioning an individual user account.
- Do not write down passwords, store them in emails, electronic notes, or mobile devices, or share them over the phone. If you must store passwords electronically, do so with a password manager that has been approved by [COMPANY NAME]:
- [COMPANY NAME]’s approved Password Manager: **<PASSWORD MANAGER>**

**[Password Managers are recommended but not required by SOC 2, ISO 27001, PCI DSS, or other security frameworks/standards. It is a security best practice to use a separate password manager, rather than memorizing each individual password or using integrated password managers built into web browsers. Commonly used password managers include 1Password, LastPass, Keeper, and Bitwarden. Additional password managers can be found here: [https://help.drata.com/en/articles/4675829-installing-and-using-a-password-manager](installing-and-using-a-password-manager.md)]**

- If you absolutely must share a password, do so through the approved password manager or grant access to an application through a single-sign-on (SSO) provider.

**[Shared accounts should only be used for non-critical systems that do not contain production or customer data.]**

- If you suspect a password has been compromised, rotate the password immediately and notify the Company’s Security Officer.
- Passwords stored in systems must be stored with a unique salt and as a one-way hash using an approved password hashing algorithm (pbkdf2, bcrypt, scrypt) and an HMAC-SHA256

**[This requirement should outline how your company secures stored passwords, including the type of algorithm you use to store the passwords. Since this should be reflective of your company, this can be replaced to reflect how your company stores passwords securely if you use another method than what we list here.]**

### Enforcement

- An employee or contractor found to have violated this policy may be subject to disciplinary action.

## Related articles

- [Asset Management Policy Guidance](asset-management-policy-guidance.md)
- [System Access Control Policy Guidance](system-access-control-policy-guidance.md)
- [Encryption Policy Guidance](encryption-policy-guidance.md)
- [Information Security Policy Guidance](information-security-policy-guidance.md)
- [Data Protection Policy Guidance](data-protection-policy-guidance.md)
