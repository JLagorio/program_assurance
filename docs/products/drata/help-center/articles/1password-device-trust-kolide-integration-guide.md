# 1Password Device Trust (Kolide) Integration Guide

Source: https://help.drata.com/en/articles/10298210-1password-device-trust-kolide-integration-guide
Collection: Connection Support › Other Guidance
Updated: 2026-03-04
Fetched: 2026-11-22

## Article text

The **1Password Device Trust (Kolide) integration** enables security and compliance teams to monitor **workstation security configurations** across macOS, Linux, and Windows devices. By connecting 1Password Device Trust (Kolide) to Drata, organizations can automatically collect evidence about device security settings and use that information for compliance monitoring.

---

## Prerequisites & Data Access

### 1Password Device Trust (Kolide) Access Requirements

- You must have **Administrator or Super Administrator access** in your **1Password Device Trust (Kolide)** account.
- You must create a **Custom API Token**.

API tokens provide **read access by default**, which is sufficient for this integration. You do **not** need to enable any write permissions.

### Drata Role Requirements

- To create or modify connections, you must have one of the following **Drata roles with write access**: Admin, Workspace Manager, or DevOps Engineer
- **Access Reviewers** can view the connection page but cannot create or modify connections

---

### Permissions & Required Access

| Permission | Why It’s Needed |
|---|---|
| API Token<br>(read access) | Allows Drata to retrieve workstation configuration data from 1Password Device Trust (Kolide) |

---

## Step-by-Step Setup

### Step 1: Create an API Token in 1Password Device Trust (Kolide)

1. Log in to your **1Password Device Trust (Kolide)** account.
2. Navigate to the **API token management** section.
3. Create a **Custom API Token**.
4. Copy the generated **API token** and store it securely.

Note: API tokens provide **read access by default**, which is sufficient for this integration.

Expected outcome:
You have generated the **API token** required to authenticate the integration.

---

### Step 2: Connect 1Password Device Trust (Kolide) in Drata

1. Log in to **Drata** → go to the **Connections** page.
2. Navigate to your **Available Connections**.
3. Search for and start the **1Password Device Trust (Kolide) connection process**.
4. Enter the **API token** when prompted.

Expected outcome:
The integration is successfully connected to Drata. After connecting the integration, go to **Settings → Personnel Compliance → Internal Security** and locate the **Workstation Configuration Monitoring** section.

Once enabled, Drata collects workstation configuration data from **macOS, Linux, and Windows devices** enrolled in your **Kolide environment**.

---

### Step 3: Map Device Checks to Drata Monitoring Tests

During the connection process, you can map **device configuration checks** from 1Password Device Trust (Kolide) to Drata monitoring tests.

Default mappings include the following examples.

**Screensaver Lock Required on Employee Computers**

- Linux Screen Lock – Require Gnome Secure Screen Lock Configuration
- Linux Screen Lock – Require Cinnamon Secure Screen Lock Configuration
- Linux Screen Lock – Require Mate Secure Screen Lock Configuration
- macOS Screen Lock – Require Secure Screen Lock Configuration
- Windows Screen Lock – Require Secure Screen Lock Configuration

**Password Manager Software Installed on Employee Computers**

- No default checks mapped

**Malware Detection Software Installed on Employee Computers**

- Windows Security Center – Require Antivirus to Be Enabled
- Gatekeeper – Require macOS Gatekeeper to Be Enabled

**Security Patches Auto-Applied on Employee Computers**

- Ubuntu – Require Unattended Upgrades to Be Properly Configured
- macOS Software Updates – Require Automatic Updates to Be Enabled
- macOS Software Updates – Ensure OS Version is Up-to-date
- Ubuntu – Ensure OS Version is Supported
- Windows Software Updates – Ensure Important OS Updates Are Installed

**Hard-Disk Encryption Enabled on Employee Computers**

- BitLocker – Require Primary Disk to Be Encrypted
- FileVault – Require Primary Disk to Be Encrypted
- Linux Disk Encryption – Require Disk To Be Encrypted

You can adjust these mappings if your organization uses **custom device checks**.

Expected outcome:
Device security checks are mapped to Drata monitoring tests.

---

## Important Notes

- **Data sync schedule:** Device check results are imported into Drata **nightly**.
- **Compliance evidence:** These results are used as evidence for the associated Drata monitoring tests.
- **Custom checks:** Organizations can adjust the mappings to use **custom checks** defined in their environment.

---

## Troubleshooting

### Test Failures in Drata

If a monitoring test fails in Drata, verify the corresponding check result in **1Password Device Trust (Kolide)**. If a check returns a **NULL result**, Drata may interpret the result as a test failure.

Review the check configuration and confirm the device check is returning a valid result.

---

## Additional Resources

1Password Device Trust (Kolide) API documentation
[https://www.kolide.com/docs/developers/api#creating-an-api-key](https://www.kolide.com/docs/developers/api#creating-an-api-key)

1Password Device Trust (Kolide) checks documentation
[https://www.kolide.com/docs/admins/checks](https://www.kolide.com/docs/admins/checks)

## Related articles

- [JumpCloud Integration Guide (MDM)](jumpcloud-integration-guide-mdm.md)
- [Hexnode UEM (macOS) Integration Guide](hexnode-uem-macos-integration-guide.md)
- [Hexnode UEM (Windows) Integration Guide](hexnode-uem-windows-integration-guide.md)
- [Workspace ONE MDM Integration Guide](workspace-one-mdm-integration-guide.md)
- [1Password Integration Guide](1password-integration-guide.md)
