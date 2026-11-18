# Encrypting Your Computer Hard Drives

Source: https://help.vanta.com/en/articles/11345839-encrypting-your-computer-hard-drives
Collection: Audit Readiness ; Audit Readiness › Security Posture Best Practices
Fetched: 2026-11-17

## Article text

Encryption helps safeguard the data stored on your device by ensuring it can only be accessed by authorised users. Enabling full disk encryption on your work device is an important security measure that helps protect sensitive information in the event of loss, theft, or unauthorised access.
 

## Encrypting macOS with FileVault
- 
Click on the Apple menu in the menu bar, then select System Settings
- 
Click on Security & Privacy 
- 
Click the FileVault tab
- 
If prompted, Click on the padlock icon 🔒, then enter an administrator name and password
- 
Click Turn On FileVault.
- 
For more info, click here <https://support.apple.com/en-us/HT204837>

## Encrypting Windows 10 and 11 Pro with BitLocker
Check if your device supports BitLocker encryption
- 
Open Start
- 
Search for System Information, right-click the top result, and select the Run as administrator option
- 
Click the System Summary branch from the left pane.
- 
Check the "Device Encryption Support" item, and if it reads Meets prerequisites, then your computer includes support file encryption
- 
Note: If the ''Device Encryption Support'' item reads ''Elevation Required to View'', you did not open the System information tab as an administrator 

## Turn on Device encryption:
- 
Open Settings
- 
Click on Privacy & Security (Win 11) or Update & Security (Win 10)
- 
Click on Device encryption.
- 
If the Device encryption page isn't available, your device does not support the encryption feature. However, you may still be able to enable Bitlocker.
- 
Under the Device encryption section, click the Turn on button

## Enable BitLocker
- 
Sign in to Windows with an administrator account
- 
In the search box on the taskbar, enter Manage BitLocker and select from results. OR select the Start button
- 
Under Windows System, select Control Panel
- 
In the Control Panel, select System and Security
- 
Then under BitLocker Drive Encryption, select Manage BitLocker. You’ll only see this option if BitLocker is available for your device
- 
Select Turn on BitLocker and follow the instructions provided
If Vanta is still reporting that the disk is not encrypted after following the above steps, please see our Troubleshooting Windows Disk Encryption <https://help.vanta.com/en/articles/11346055> guide
 

## Encrypting Linux
- 
Detecting disk encryption on Linux is complex and varies widely. We recommend you encrypt your disks with LUKS, follow this guide <https://help.ubuntu.com/community/Full_Disk_Encryption_Howto_2019>.

## Images

- none
