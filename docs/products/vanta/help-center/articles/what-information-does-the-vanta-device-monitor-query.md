# What Information does the Vanta Device Monitor query?

Source: https://help.vanta.com/en/articles/11345405-what-information-does-the-vanta-device-monitor-query
Collection: Continuous Monitoring ; Continuous Monitoring › Vanta Device Monitor
Fetched: 2026-11-17

## Article text

The Vanta application checks devices in your fleet to ensure they are configured securely and compliant. The Vanta Device Monitor checks several configurations, including whether the hard drive is encrypted and whether a password manager is installed. It does not transmit sensitive data, such as passwords, environment variables, or SSH keys, nor does it convey personal data, including messages or browsing history.
 
Here's the list of queries the Vanta Device Monitor  is making: 
- 
DiskEncryptionLinux
- 
DiskEncryptionMacos
- 
DiskEncryptionUnionLinux
- 
DiskEncryptionWindows
- 
DiskEncryptionWithFileVaultMacos
- 
Disk encryption status
- 
InstalledApps
- 
MacosBrowserExtensions
- 
MacDisplayTime
- 
OS Version
- 
MacScreenlock
- 
MacScreenlockManagedPolicy
- 
MacScreenSaverTimeout
- 
MacUsers
- 
OsqueryInfo
- 
OsVersion
- 
Preferences
- 
ConfigDataInstallPreference
- 
SSHUsers
- 
SystemInfo
- 
UserAdmins
- 
WindowsBrowserExtensions
- 
WindowsProgams
- 
WindowsScreenlock
- 
WindowsSecurityProducts
- 
WindowsUsers
To monitor the exact set of queries Vanta is running on your machines, you can run the following command:
 
Mac OS and Linux:sudo /usr/local/vanta/vanta-cli schedule
Windows:C:\ProgramData\Vanta\vanta-cli schedule

## Images

- none
