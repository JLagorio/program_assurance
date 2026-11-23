# Multi-Device Support

Source: https://help.drata.com/en/articles/13613390-multi-device-support
Collection: Personnel Management › Drata Agent
Updated: 2026-11-14
Fetched: 2026-11-22
Description: Learn how Drata supports multiple devices per user, how devices are tracked, and how compliance responsibility is managed.

## Article text

Drata supports tracking **multiple devices per person** so organizations can verify that employees and contractors are working on secure, compliant machines.

This article explains:

- What multi-device support means in Drata
- How devices are added and tracked
- What happens when devices are missing, shared, or reassigned

### How multi-device support works

A single person in Drata can have **multiple devices** associated with their profile. Each device is evaluated individually for compliance, and the person is responsible for the compliance of the devices assigned to them.

Drata collects device data in one of two ways:

- **Drata Agent**, or
- **Mobile Device Management (MDM)** integration

---

### Prerequisites and supported scenarios

#### Supported

- Multiple laptops or desktops per person
- Devices added via **Drata Agent** or **MDM**
- One responsible owner per device

#### Not supported

- **Mobile devices**
- **Shared or kiosk devices** (used by more than one person)
- Multiple people sharing responsibility for the same device

#### Important behavior: One owner per device

Only **one person** can be responsible for a device’s compliance at a time. If ownership changes, Drata updates responsibility automatically when possible.

---

### JumpCloud MDM behavior

## Managing Devices in Kandji

To remove devices marked as 'erased' in Kandji from Drata's compliance checks:

1. **Remove or Un-assign Devices in Kandji**: Navigate to Kandji and either remove or un-assign the devices from a user.
2. **Automatic Sync with Drata**: Once the device is removed or un-assigned, Drata will automatically unlink and exclude it from compliance checks during the next MDM sync. This includes tests like ensuring malware detection software is installed on employee computers.

If a device has multiple owners in JumpCloud:

- Only **one person** is linked to the device in Drata
- Other owners will see a **Manually Configured** device in their personnel record

---

### Users without registered devices

If a person has no agent- or MDM-registered devices:

- A **Manually Configured** device appears in their personnel record
- Manual evidence can be uploaded to demonstrate compliance

---

### Adding multiple devices

#### Using the Drata Agent

Each device appears separately and is evaluated for compliance.

Install and register the Drata Agent on **each device** the person uses. Every registered device will appear individually in Drata.

---

#### Using MDM

All devices enrolled in MDM appear automatically in Drata.

Ensure devices are enrolled in your MDM system. Drata syncs device data automatically after Autopilot completes its daily sync.

---

### Viewing and managing devices

#### From My Drata

If an Admin enables **Workstation Configuration Monitoring**:

- Users can view their devices from **My Drata → Configure your devices**

If **Manual evidence uploads** are enabled:

- Users can upload evidence per device using **View / Upload Evidence**

---

#### From Personnel

**Expected outcome:** You can see how many devices are assigned and their compliance status.

- The **Personnel** page includes a **Device Compliance** column and filter
- If a person has multiple devices, the column shows the total count

Select a person to view the **Devices** section:

- Each device shows compliance status, OS, and identifier
- Select a device to view details or upload manual evidence

If no devices are registered, a **Manually Configured** device appears.

---

### Unlinking and re-linking devices

#### Automatic unlinking (MDM)

For supported MDM systems (including Kandji and excluding Workspace One):

- Drata automatically unlinks devices when they’re removed or reassigned in MDM

Kandji: If a device is removed from Kandji or unassigned from a user, Drata unlinks it during the next MDM sync and excludes it from that person’s compliance checks. To stop an old device from affecting compliance, remove or unassign it in Kandji, then wait for the next sync.

---

#### Manual unlinking

**Expected outcome:** The device no longer affects the person’s compliance.

1. Go to **Assets**
2. Select the device
3. Select **Unlink device**

This is useful for retired, lost, stolen, or broken devices.

If the device is still present in MDM, it can be linked again later.

If you want Drata to recognize the device from a different source, leave it linked. Drata can update the device source during a later sync if the incoming record matches the same serial number.

---

### Troubleshooting missing devices

If devices don’t appear under **Personnel** or **Assets**:

1. Verify the device is registered correctly
2. Check separation dates for returning personnel
3. If needed, remove outdated separation dates and trigger an MDM sync
4. Refresh and confirm the device appears

Intune: If devices are missing or showing the wrong compliance status, see the [Microsoft Intune Integration](microsoft-intune-integration-guide.md) guide for the policy, app and permission requirements for your connection. If you connected Intune before May 27, 2026, see the [legacy guide](legacy-microsoft-intune-integration-guide-windows.md) instead.

---

### Summary (explicit rules)

- One person can have **multiple devices**
- One device can have **only one owner**
- Devices must come from **Agent or MDM**
- Shared devices are **not supported**
- Missing devices default to **Manually Configured**

## Related articles

- [SentinelOne (EDR) Integration Guide](sentinelone-edr-integration-guide.md)
- [Understanding Device Linking, Removal, and Visibility in Drata](understanding-device-linking-removal-and-visibility-in-drata.md)
- [Multiple MDM Support (New Experience)](multiple-mdm-support-new-experience.md)
- [Microsoft Intune Integration guide](microsoft-intune-integration-guide.md)
- [How to collect evidence for DCF-574: Mobile device management software](how-to-collect-evidence-for-dcf-574-mobile-device-management-software.md)
