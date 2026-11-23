# Auto-Lock your Workstation with Screensaver

Source: https://help.drata.com/en/articles/4675838-auto-lock-your-workstation-with-screensaver
Collection: Personnel Management › Device Compliance
Updated: 2026-11-14
Fetched: 2026-11-22
Description: Configuring your workstation to auto-lock (and require a password) when the screensaver activates

## Article text

Leaving your workstation unattended poses a security risk. An auto-locking screen saver helps prevent unauthorized access and ensures compliance. Follow this guide to pass the **[Screensaver Lock Required on Employee Computers](test-61-screensaver-lock-required-on-employee-computers.md)**.

- **Note**: Your company may have specific auto-lock guidance. Verify with your IT and compliance teams.

To pass the compliance check, your screen saver must activate and require a password within 15 minutes of inactivity. For example, you can set the screensaver to start after 10 minutes of inactivity and then require a password 5 minutes later, ensuring the total idle time does not exceed 15 minutes. This guide covers multiple configuration methods.

Other options are available for different systems, including managed policies on macOS and Group Policy (GPO) on Windows.

## Prerequisites

**General Requirement**: It is recommended to use the latest or current version of your operating system to ensure compatibility and security.

- For macOS, upgrade to macOS Sonoma 14.4.1 or above.
   - **Note**: macOS versions `13.x.x` and `14.x.x` are supported, but some settings may not be available in versions earlier than macOS 13.
- For Windows, upgrade to Windows 11.
   - **Note**: Windows 10 and 11 are both supported, but the instructions below are based on Windows 11, which has a new control panel structure. Some settings may be split between the new Settings interface and the old Control Panel.
- For Ubuntu, upgrade to Ubuntu 22 + GNOME.

**Compliance Note**

Failure to complete these steps will result in failing the test: [Screensaver Lock Required on Employee Computers](test-61-screensaver-lock-required-on-employee-computers.md).

**Policy Enforcement**

Managed policies (device policies) may be used to enforce any of the settings listed below.

## Configure your macOS

**ℹ️ Note**: You can choose between screen settings **or** display settings. Only one method is required to pass; you do not need to configure both.

### To pass with screen settings:

1. Navigate to **Lock Screen** using Spotlight or System Preferences.
2. Set Start Screen Saver when inactive to a value less than or equal to 15 minutes.
3. Set **Require password after screen saver begins or display is turned off** to **Immediately**.

### To pass with display settings (both battery and power adapter must pass):

1. Navigate to **Lock Screen** using Spotlight or System Preferences.
2. Set **Require password after screen saver begins or display is turned off** to **Immediately**.
3. Set Turn display off on battery when inactive to 15 minutes or less.
4. Set Turn display off on power adapter when inactive to a value less than or equal to 15 minutes.

## Configure your Windows

Microsoft’s Group Policy Objects (GPO) can be used to enforce any of the below settings with group policies.

**ℹ️ Note**: You can choose between screen settings, sleep settings **or** Policy Override. You do not have to complete all three; only one is required for you to pass.

### To pass with screen settings:

1. Navigate to **Screen saver settings** through the Start menu or Control Panel.
2. Select any screen saver except "None".
3. Set **Wait **to 15 minutes or less.
4. Ensure that the **On resume, display logon screen **checkbox is checked.
   - **Note**: The exact term may vary depending on the Windows version. In some versions, the label is different and can be referred to **Require a password on wakeup **or **Require sign-in when PC wakes from sleep**.

### To pass with Sleep Settings (both battery (DC) and power adapter (AC) must pass):

1. Open Settings.
2. Go to **System** and then select **Power & sleep**.
3. Select **Screen and sleep** for the active preferred power profile.
4. Set **When plugged in, put my device to sleep after** to a value less than or equal to 15 minutes.
5. Set **When on battery power, put my device to sleep after** to a value less than or equal to 15 minutes.
6. Select **Accounts** and then **Sign-in options**.
7. Under **Additional settings**, set **If you've been away, when should Windows require you to sign in again?** to **When PC wakes up from sleep**.

### To pass with the GPO Interactive logon: Machine inactivity limit

When a GPO is applied to a user's machine, it enforces specific settings configured by the organization's IT administrator. Those specific settings take precedence over manual changes you might attempt to make. Certain options in the system settings may be even inaccessible. To change these restricted settings, you must reach out to your IT administrator.

The specific Microsoft global policy object setting is called `Interactive logon: Machine inactivity limit`. You may read more about this [here](https://learn.microsoft.com/en-us/previous-versions/windows/it-pro/windows-10/security/threat-protection/security-policy-settings/interactive-logon-machine-inactivity-limit).

When the Machine inactivity limit group policy is set to an idle time above zero, all other settings are ignored. Ensure the idle time value is set between 1 and 15 minutes.

**Verify:**

Once applied, please review the GPO editor on the device to ensure that it has been applied properly. If the Drata compliance check is not passing after an agent sync, reboot the device and confirm the GPO modification is in place.

## Configure your Ubuntu

**ℹ️ Note**: You can choose between screen settings **or** suspend lock. Only one method is required to pass; you do not need to configure both.

### To pass with screen settings:

1. Navigate to Settings → Privacy → Screen.
2. Set **Blank Screen Delay** to a value less than or equal to 15 minutes.
3. Toggle **Automatic Screen Lock** to ON.
4. Set **Automatic Screen Lock Delay** to **Screen Turns Off**.

### To pass with Suspend lock (both battery (DC) and power adapter (AC))

1. Navigate to the **Power panel** in **Activities overview**.
2. Set the **Automatic Suspend** switch to **ON**.
3. Set On Battery Power switch to On and Delay to a value less than or equal to 15 minutes.
4. Set Plugged In switch to ON and Delay to a value less than or equal to 15 minutes.

## Related articles

- [Test 61:  Screensaver Lock Required on Employee Computers](test-61-screensaver-lock-required-on-employee-computers.md)
- [Jamf Integration Guide](jamf-integration-guide.md)
- [Legacy: Microsoft Intune Integration Guide (Windows)](legacy-microsoft-intune-integration-guide-windows.md)
- [NinjaOne Integration Guide](ninjaone-integration-guide.md)
- [Microsoft Intune Integration guide](microsoft-intune-integration-guide.md)
