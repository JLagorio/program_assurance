# Troubleshooting Windows Disk Encryption

Source: https://help.vanta.com/en/articles/11346055-troubleshooting-windows-disk-encryption
Collection: Optimizing your Workflow ; Optimizing your Workflow › Troubleshooting
Fetched: 2026-11-17

## Article text

## Windows encryption troubleshooting
You have installed the Vanta Device Monitor and followed the steps <https://help.vanta.com/en/articles/11345839> to encrypt the disk on a Windows device. Vanta is still reporting that the disk is not encrypted.
 

### Verify Windows encryption with PowerShell
Before proceeding, run the Vanta CLI reset command to ensure the Vanta Device Monitor is properly initialized.
 
The Vanta CLI path can vary by Device Monitor version. Use the directory that contains vanta-cli on your device. Do not use C:\ProgramData\Vanta and C:\PROGRA~1\Vanta interchangeably.
- 
Open Command Prompt as an administrator.
- 
Navigate to the directory where the Vanta CLI is installed.
- 
Run the following command:vanta-cli reset
 
If the reset command is not available or the Vanta CLI cannot be found, contact Vanta Support before continuing.
 
    4. Open PowerShell as an administrator and run the following command:
 manage-bde -status
 
[image 01]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516768675/e311131921e256317e4a56822c84/8492642153748?expires=1794967200&signature=10d8813ebe37124b59368b59da504ae8d25c52feaf7e617002dd06cbc2074b62&req=dSUmEM54lYdYXPMW1HO4zYxZeHZEstYH24LmilW9bQV7iHcopeM3MjfDra0q%0ApHTTu0lMD0mVodl7gjU%3D%0A>
 
     5. Confirm that Percentage Encrypted is 100.0% and Protection Status is On.
 
A fully encrypted and protected drive should report both values as complete and enabled. If either value is different, there may have been an issue encrypting the disk. Try re-encrypting the disk before continuing.
 

### Reinstall the Vanta Device Monitor
If the disk is fully encrypted but Vanta still reports that it is not encrypted, reinstall the Vanta Device Monitor.
 
For the recommended Windows uninstall process, follow the instructions in Uninstalling the Vanta Device Monitor:
https://help.vanta.com/en/articles/11345408-uninstalling-the-vanta-device-monitor <https://help.vanta.com/en/articles/11345408-uninstalling-the-vanta-device-monitor>
- 
Stop any tasks associated with the Vanta Device Monitor.
Open Task Manager by pressing Ctrl + Shift + Esc, or by right-clicking the taskbar and selecting Task Manager.
 
Select any Vanta Device Monitor tasks and click End task.
 
  2. Go to Apps & features, search for Vanta, and select Uninstall.
  3. Delete the files in the Vanta folder at:
 
C:\ProgramData\Vanta
 
  4. Restart the machine.
  5. Reinstall the Vanta Device Monitor from:
 
https://app.vanta.com/download <https://app.vanta.com/download>
 
Vanta syncs monitored computer data hourly. After reinstalling the Vanta Device Monitor, allow up to one hour for Vanta to update the encryption requirement status before checking again.
 

### Collect information for Vanta Support
If disk encryption is still not showing correctly in Vanta after completing the steps above, contact Vanta Support and include the following information:
- 
A screenshot of the output from the manage-bde -status command.
- 
A screenshot of the output from the following Vanta CLI command:vanta-cli list encryption
Run the command from the directory where the Vanta CLI is installed.
 
[image 02]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516768673/4bd4132dc2d81f377ece28fbe7db/8493438303508?expires=1794967200&signature=c772c924861cd5b501755f54c6dce7f0ba991ad818078f96505df3f3febcd54a&req=dSUmEM54lYdYWvMW1HO4zWC0xldXwDViaLwBaP3WmpOfATee7hBFQ0tJuKie%0ABaLOPz3J%2F33RPkA0ChM%3D%0A>
- 
A zipped copy of the available Vanta Device Monitor logs.
The log folder is located in the Vanta Device Monitor installation directory. If you need help locating the folder, contact Vanta Support.
 
If severe issues persist, consider contacting Microsoft for advanced troubleshooting. You can also refer to the existing guides for Encrypting Your Computer Hard Drives and Encryption on Windows Home Edition.
 
 

## 

## macOS encryption verification
To verify that your macOS device encryption and Vanta Device Monitor setup are functioning correctly:
- 
Run the Vanta CLI Command:
- 
Open Terminal by pressing Cmd + Space, typing "Terminal" and pressing Enter.
- 
Execute the following command:     sudo /usr/local/vanta/vanta-cli doctor
- 
Review the output. If all checkups (e.g., platform, directory contents, communication with Vanta servers) pass, the Vanta Device Montior setup is working correctly.
- 
Check Encryption Recognition in Vanta:
- 
Verify that Vanta detects your laptop as encrypted by reviewing the encryption status under your account. If you receive alerts regarding encryption issues, confirm that these are not related to other devices linked to your account. For example, an unencrypted Windows machine could trigger alerts even if your macOS laptop is compliant.
- 
Resolve Tagging Issues with Iru: 
If your laptop was added via Iru but is incorrectly tagged as unencrypted:
- 
In the Iru admin console, click the device to open its device page. Only Iru administrators have access to this page.
- 
Click the Details tab and navigate to the Volumes section.
- 
If volumes are marked as unencrypted, ensure the device has been restarted after enabling FileVault. This step often resolves tagging discrepancies.

## Common Issues and Resolutions
- 
Device Mistakenly Tagged as Unencrypted: If Vanta is sending alerts suggesting your device is not encrypted while the disk is encrypted, ensure that the linked devices do not include unencrypted machines (e.g., older Windows laptops lacking encryption).
- 
Issues After Enabling Encryption: Some devices may need to be restarted to reflect encryption changes (e.g., macOS laptops using FileVault).
[image 03]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516768674/8190bcfb517c6079bd2cfd1a0f3f/8493686569364?expires=1794967200&signature=03e23dc98c9df3b8ea2de3c76065f7f8a6578f515908435d95e5f25dc9480949&req=dSUmEM54lYdYXfMW1HO4zWhs8B3RikUVXD5Xhs0ChnQGgQf18cina%2BQmBd6t%0ALk1FRQoAMEWlFQ2%2FskE%3D%0A>

## Images

- [image 01] ../../images/documentation/troubleshooting-windows-disk-encryption--01.png
- [image 02] ../../images/documentation/troubleshooting-windows-disk-encryption--02.png
- [image 03] ../../images/documentation/troubleshooting-windows-disk-encryption--03.png
