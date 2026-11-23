# Hexnode UEM (Windows) Integration Guide

Source: https://help.drata.com/en/articles/6093793-hexnode-uem-windows-integration-guide
Collection: Connection Support › Other Guidance
Updated: 2026-08-05
Fetched: 2026-11-22
Description: This article covers how to connect Hexnode UEM (Windows) to Drata.

## Article text

The Hexnode UEM (Windows) integration enables security and compliance teams to monitor device compliance for Windows endpoints. It connects Drata to Hexnode so your team can verify device security configurations and collect evidence that devices meet compliance requirements.

## Key Capabilities

- Device compliance monitoring: Verify that Windows security policies are configured and applied
- Endpoint policy verification: Confirm that required policies exist and are mapped to enrolled devices
- Automated evidence collection: Sync device compliance data into Drata

This integration is used to automate tests related to endpoint security configuration, helping prove compliance with device security and endpoint protection policies.

## Prerequisites & Data Access

- **Admin access** to your organization’s Hexnode account
- Devices must be **enrolled through the Hexnode application**
- Access to the following values from Hexnode:
   - **Server URL** (used as the API URL)
   - **API Key**
- Required Drata Role with Write access: Admin, Workspace Managers, DevOps Engineer
- Access Reviewers (Access Reviewers can only Read the connection page they can’t make changes)

Important limitations:

- Only **desktop devices are supported**. Tablets and mobile devices cannot be imported.
- **Pre-approved enrolled devices cannot be synced.**
- **Windows OS updates cannot currently be verified through Hexnode policy**. Evidence must be uploaded manually for this check.
- Hexnode **does not support a firewall policy for Windows devices**. A **Microsoft Defender policy** can be used instead.
- Accessing **BitLocker (disk encryption)** and **Microsoft Defender (antivirus)** policies requires the **Hexnode Ultra plan**.
- Hexnode **cannot detect browser extension password managers**. Users must install the **desktop password manager application** so it appears in the device’s Application List.

Drata verifies the following through the Hexnode connection:

- The required policy exists
- The policy is assigned to the device
- The device is compliant with that policy

### Permissions & Data Table

| Permission/Scope | Why It’s Needed |
|---|---|
| Hexnode Admin access | Allows configuration of policies and API access |
| API Key | Allows Drata to authenticate and retrieve device compliance data |
| Server URL (API URL) | Identifies the Hexnode instance for the connection |

## Step-by-Step Setup

### Step 1: Configure Required Windows Security Policies in Hexnode

Policies must exist in Hexnode for Drata to validate compliance checks.

Policies are created in **Hexnode → Policies → New Policy → New Blank Policy**.

### Disk Encryption (BitLocker)

1. Log in to **Hexnode Admin**.
2. Navigate to **Policies → My Policies → New Policy**.
3. Select **New Blank Policy**.
4. Create a policy name and description.

Important:
Include **“FileVault”** in the policy name so Drata can detect the policy.

1. Navigate to the **Windows** section.
2. Scroll to **Security → BitLocker**.
3. Select **Configure**.
4. Enable **Prompt for device encryption**.
5. Select **Policy Targets → Add Device** to assign the policy.
6. Click **Save**.

Expected outcome: A BitLocker disk encryption policy exists and is assigned to enrolled Windows devices.

---

### Screensaver (Lock Screen)

1. Navigate to **Policies → My Policies → New Policy**.
2. Select **New Blank Policy**.
3. Create a policy name including **“Screensaver”**.
4. Navigate to the **Windows** section.
5. Scroll to **Password** and select **Configure**.
6. Set **Auto-lock (in minutes)** to a value greater than **0**.
7. Select **Policy Targets → Add Device** to assign the policy.
8. Click **Save**.

Expected outcome: Windows devices automatically lock after inactivity.

---

### Antivirus (Microsoft Defender)

1. Navigate to **Policies → My Policies → New Policy**.
2. Select **New Blank Policy**.
3. Create a policy name including **“Anti-Virus”**.
4. Navigate to the **Windows** section.
5. Select **Microsoft Defender → Configure**.
6. Scroll to **Windows Defender Security Center** and configure recommended options.
7. Select **Policy Targets → Add Device** to assign the policy.
8. Click **Save**.

Expected outcome: Microsoft Defender antivirus protection is configured on devices.

## Step-by-Step Setup (Connection)

### Step 2: Retrieve Hexnode API Credentials

1. Log in to your **Hexnode Admin account**.
2. Select **Enroll** and note the **Server URL**.
   This will be used as the **API URL** in Drata.
3. Navigate to **Admin → API**.
4. Click the **lock icon** to reveal the **API Key**.
5. Copy the API Key.

Expected outcome: You have the Hexnode **Server URL** and **API Key** required for authentication.

### Step 3: Connect Hexnode in Drata

1. Log in to **Drata**.
2. Navigate to **Connections**.
3. Search for **Hexnode** and start the connection process.
4. Enter the following values:
   - **API URL** (include `https://`)
   - **API Token** (your Hexnode API Key)
5. Select **Save & Test Connection**.

Expected outcome:
Hexnode is successfully connected and device compliance data begins syncing to Drata.

## Step-by-Step Setup (Enable Device Automation)

### Step 4: Enable Hexnode as the Device Compliance Source

1. In Drata, navigate to** Settings → Personnel Compliance → Internal Security**.
2. Enable **Automated via Hexnode MDM**.
3. Disable **Automated via Drata Agent** if you want Hexnode to be the primary compliance source.

Important behavior:

If **both Hexnode and the Drata Agent are enabled**, the **Drata Agent takes precedence**. Device compliance data will come from the Agent rather than the connected MDM.

Expected outcome: Device compliance data is collected from Hexnode MDM.

## Important Notes

- Hexnode data is synced **daily after Drata Autopilot runs**.
- Devices must be **enrolled in Hexnode** to be monitored.
- Only **Windows desktop devices** are supported.
- Policy names must include the expected keywords (**FileVault**, **Screensaver**, **Anti-Virus**) for Drata to detect them correctly.
- Browser extension password managers cannot be detected by Hexnode. Users must install the **desktop application version** for compliance checks to pass.

## Related articles

- [Legacy: Microsoft Intune Integration Guide (Windows)](legacy-microsoft-intune-integration-guide-windows.md)
- [Kandji (now Iru) Integration Guide (MDM)](kandji-now-iru-integration-guide-mdm.md)
- [JumpCloud Integration Guide (MDM)](jumpcloud-integration-guide-mdm.md)
- [Hexnode UEM (macOS) Integration Guide](hexnode-uem-macos-integration-guide.md)
- [Microsoft Intune Integration guide](microsoft-intune-integration-guide.md)
