# Multiple MDM Support (New Experience)

Source: https://help.drata.com/en/articles/13613980-multiple-mdm-support-new-experience
Collection: Understand the Drata Platform › Connections
Updated: 2026-11-09
Fetched: 2026-11-22
Description: Connect multiple MDM providers to Drata to monitor devices across systems with automatic syncing and clear data priority rules.

## Article text

Drata supports connecting **multiple Mobile Device Management (MDM) providers** so you can monitor devices across different systems without consolidating everything into a single MDM.

This is useful for organizations that:

- Use different MDMs for different teams or operating systems
- Are migrating between MDM providers
- Manage contractors or subsidiaries with separate device management tools

---

### How multiple MDM support works

You can connect **more than one MDM** to Drata. Each connected MDM contributes device data, which Drata aligns to personnel for compliance monitoring.

⚠️ **Important: One MDM per Unique Device** 
Drata is designed to ingest data for **unique devices** from separate sources. It is not intended to "merge" or "stack" different compliance components (e.g., pulling encryption status from one MDM and screen lock status from another) for the same physical device. Each device should be managed by and synced from a single MDM source.

---

### Prerequisites

- Devices must already be enrolled in a **supported MDM**
- You must have permission to manage connections in Drata
- Workstation Configuration Monitoring must be enabled

---

### View supported MDMs

1. Go to **Connections**
2. Filter by the **MDM** category

Supported platforms include providers such as **Jamf, Intune, and Kandji**.

**Expected outcome:** You can confirm which MDM platforms Drata supports before connecting.

---

### Connect multiple MDMs

1. From **Connections**, select the MDM you want to connect
2. Follow the setup steps shown in the connection process
3. Repeat for each additional MDM you use

You can connect multiple MDMs without disabling existing connections.

**Expected outcome:** Drata receives device data from each connected MDM.

---

### Enable and verify MDM monitoring

1. Select your account name in the lower-left corner
2. Select **Settings**
3. Go to **Internal Security → Workstation Configuration Monitoring**
4. Confirm your connected MDMs are listed and enabled

**Expected outcome:** Devices from connected MDMs are actively monitored for compliance.

---

### MDM sync behavior and data priority

- Nightly sync
   - Drata syncs device information from all connected MDMs **nightly**
   - Synced data is aligned to personnel automatically
- Data priority rules
   - If the **Drata Agent** is installed on a device, **Agent data takes priority**
   - If no agent is present, **MDM data is used**
   - This prevents conflicting or duplicate device records

## Summary

- You can connect **multiple MDMs**
- Devices must already exist in an MDM before syncing
- Nightly sync keeps data current
- **Agent data overrides MDM data** when both are present

## Related articles

- [Rippling Integration Guide (HRIS, MDM, UAR)](rippling-integration-guide-hris-mdm-uar.md)
- [JumpCloud Integration Guide (MDM)](jumpcloud-integration-guide-mdm.md)
- [Hexnode UEM (Windows) Integration Guide](hexnode-uem-windows-integration-guide.md)
- [Understanding Device Linking, Removal, and Visibility in Drata](understanding-device-linking-removal-and-visibility-in-drata.md)
- [Multi-Device Support](multi-device-support.md)
