# Understanding the "Last Checked" Column on the Computers Page

Source: https://help.vanta.com/en/articles/11345936-understanding-the-last-checked-column-on-the-computers-page
Collection: Optimizing your Workflow ; Optimizing your Workflow › Troubleshooting
Fetched: 2026-11-17

## Article text

The "Last Checked" column on the Computers page helps indicate the last time a device communicated with Vanta. This value differs depending on whether the device is managed by the Vanta Device Monitor or a Mobile Device Management (MDM) system.
 

## Devices Managed by the Vanta Device Monitor
For devices monitored by the Vanta Device Monitor, the Last Checked value represents the most recent time the device successfully sent data to Vanta.
- 
If this timestamp is more than one day old, it may indicate the device is not regularly checking in.
- 
In such cases, the device owner should run the vanta doctor command to prompt the device to re-establish communication with Vanta.
 

## Devices Managed by MDM
For devices managed through a Mobile Device Management (MDM) system, the Last Checked column reflects the last time any resource or configuration change was recorded in the MDM.
- 
It is normal for this timestamp to appear several days old, since it only updates when a change is made within the MDM.
- 
No action is required unless the device appears out of compliance or is not receiving expected updates.

## Images

- none
