# Configuring Screen Lock on MacOS Devices

Source: https://help.vanta.com/en/articles/11345842-configuring-screen-lock-on-macos-devices
Collection: Audit Readiness ; Audit Readiness › Security Posture Best Practices
Fetched: 2026-11-17

## Article text

When passing screen-lock tests, the Vanta Device Monitor <https://help.vanta.com/en/articles/11345407-getting-started-with-the-vanta-device-monitor> (VDM) examines a device's user profile settings to ensure that workstations remain secure when users step away.
 
To meet common security requirements and allow VDM to function correctly, macOS devices must automatically lock after a period of inactivity and require a password to regain access.
 
 

## Conditions
To pass Vanta’s macOS screen lock check:
- 
A password must be required after the screen saver starts or the display turns off.
- 
Your device must require a password within 60 minutes of inactivity or less (this includes both the inactivity timeout and any “require password after…” delay).
[image 01]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2455047486/afb0a3b4d6be31478c43ac4db8da/image.png?expires=1794967200&signature=d6b578d0a90fd846ab5fd250dc97b47886ab06212d72f68a02589aeeafdca0f8&req=diQiE8l6moVXX%2FMW1HO4zSwN2IzdyZoM51qZAEbDCd8ib0zJaXgX4MpoOREs%0AHcoS%2BkwxIaaKCjNOE3A%3D%0A>
 
 

## Configuration
macOS settings vary by version and device type. For the most up-to-date configuration steps, refer to Apple’s official documentation:
- 
Require a password after waking your Mac <https://support.apple.com/guide/mac-help/require-a-password-after-waking-your-mac-mchlp2270/mac>
- 
Change Lock Screen settings on Mac <https://support.apple.com/guide/mac-help/change-lock-screen-settings-on-mac-mh11784/mac>
- 
Set sleep and wake settings for your Mac <https://support.apple.com/guide/mac-help/set-sleep-and-wake-settings-mchle41a6ccd/mac>
 

## Troubleshooting
- 
Your Mac must be set to require a password within 60 minutes of inactivity. In practice, that means your Mac should (1) start a screen saver or turn the display off after a period of inactivity, and then (2) prompt for a password when the user returns (either immediately or after a short delay). The combined time from “inactive” → “password required” must be 60 minutes or less.
- 
If discrepancies appear in compliance reports, confirm that your settings match the conditions above and allow time for Vanta to resync the device.
- 
If multiple people use the same Mac, make sure the screen lock/password settings are configured for each user account that signs into the device. Non-compliance in one profile can affect the overall device status.
- 
If you’re using display sleep to meet the requirement, confirm the display sleep timeout is set appropriately for all applicable power modes (for laptops: Battery and Power Adapter).
- 
Changes may take up to 24 hours to reflect in Vanta.

## Images

- [image 01] ../../images/documentation/configuring-screen-lock-on-macos-devices--01.png
