# Understanding Device Linking, Removal, and Visibility in Drata

Source: https://help.drata.com/en/articles/12401019-understanding-device-linking-removal-and-visibility-in-drata
Collection: Understand the Drata Platform › Assets
Updated: 2026-07-29
Fetched: 2026-11-22
Description: Learn how unlinking or removing a device affects compliance in Drata and follow troubleshooting steps if a device is missing from the Assets or Personnel pages.

## Article text

Device linking and visibility affect how Drata tracks assets and enforces compliance. This article explains when to unlink or remove a device, how it impacts compliance, and how to troubleshoot missing device data.

### When to Unlink or Remove a Device

Unlinking a device helps maintain an accurate and compliant asset inventory. You can unlink or remove a device when it is:

- Retired or no longer in use
- Lost or stolen
- Reassigned to another person

If a device is fully unlinked or removed:

- It is no longer monitored for compliance.
- It is removed from both the **Assets page** and the **Personnel page**.
- Drata will only evaluate compliance based on any remaining, registered devices.

If a person has multiple linked devices, unlinking one does not affect their compliance status.

## Use Cases / Best Practices

**Scenario 1: The device appears in Assets, but it’s not linked to a person**

1. Go to the **Assets page** and search by serial number or asset tag. You can also use the **All Providers** filter to select your connected MDM.
2. Open the device drawer and check the **Owner** field.

If the owner is missing or incorrect:

- Check your MDM system to ensure the device is assigned to the correct user.
- Confirm the user’s email in your MDM matches the email in their profile on the **Personnel page** in Drata.

**Scenario 2: The device is completely missing from Drata**

1. Confirm the device is properly registered in your MDM system.
2. On the **Personnel page**, select the affected person and check for a **separation date**.

If a separation date is listed:

- Drata will not sync devices for that person.
- If you're a Drata Admin, remove the separation date from the profile to re-enable syncing.
- Drata updates synced data on a regular schedule.

### When NOT to Unlink or Remove a Device

Over time, device management may shift between different sources. For example, a device that was previously managed by the Drata agent is now managed by a centralized MDM. If the device remains active, has the same serial number, and remains assigned to the same user, do not unlink it if the only change is which system is managing that device. Drata's next device sync will recognize and update the source without any manual action required.

## Related articles

- [SentinelOne (EDR) Integration Guide](sentinelone-edr-integration-guide.md)
- [Multi-Device Support](multi-device-support.md)
- [Managing Personnel Compliance in Drata Training Video (New Experience)](managing-personnel-compliance-in-drata-training-video-new-experience.md)
- [Getting Started with Drata: Personnel - Webinar Recording](getting-started-with-drata-personnel-webinar-recording.md)
- [Troubleshooting Identity Sync Issues in Drata](troubleshooting-identity-sync-issues-in-drata.md)
