# Supported Operating Systems for the Vanta Device Monitor

Source: https://help.vanta.com/en/articles/11345400-supported-operating-systems-for-the-vanta-device-monitor
Collection: Continuous Monitoring ; Continuous Monitoring › Vanta Device Monitor
Fetched: 2026-11-17

## Article text

⚠️Note: This article applies only to devices running the Vanta Device Monitor (VDM) agent installed directly on the machine. If your devices are managed through an MDM integration such as JumpCloud, Jamf, or Kandji, this article does not apply. Please refer to the relevant MDM integration article for supported operating systems, detection capabilities, and troubleshooting guidance.
 
 
The Vanta Device Monitor is supported in the following operating systems:
- 
MacOS 12 and higher
- 
Windows 10 and 11 (Must be 64-bit)
- 
Debian 10 and higher (excluding "testing" versions <https://www.debian.org/releases/>)
- 
Ubuntu 18.04 and higher
- 
Ubuntu versions such as Lubuntu, and Xubuntu may be supported by the Vanta Device Monitor, on the condition that the device supports a stable, unique hardware UUID available in /sys/class/dmi/id/product_uuid
⚠️Note: For Linux devices, the Vanta Device Monitor is only capable of performing checks for HD Encryption. Screenlock, Antivirus, and Password Manager detection is not supported on any Linux devices at this time.
 
⚠️ Note: At the moment browser extension detection is currently unavailable on macOS 27+ due to new security restrictions that require additional Full Disk Access permissions.) For reference, here’s the macOS 27 release note covering the security changes <https://developer.apple.com/documentation/macos-release-notes/macos-27-release-notes#System-Integrity-Protection>.
 
The Vanta Device Monitor does not support the following systems:
- 
Cloud servers (EC2, GCE ...)
- 
CloudPCs or any other Virtual Machines when running the Vanta Device Monitor agent directly. Note: virtual machines monitored via an MDM integration such as JumpCloud are not subject to this restriction — refer to the relevant MDM integration article.
- 
Windows Server (including CloudWindows DataCenter and other Windows Server OSs) — support for Windows Server is being deprecated. If you are currently using the Vanta Device Monitor on Windows Server, contact [email protected] for transition guidance.
- 
Pop!_OS
For more information on handling unsupported operating systems, please see this article. <https://help.vanta.com/en/articles/11345402>

## Images

- none
