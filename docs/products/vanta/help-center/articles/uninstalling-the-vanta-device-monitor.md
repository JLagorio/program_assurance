# Uninstalling the Vanta Device Monitor

Source: https://help.vanta.com/en/articles/11345408-uninstalling-the-vanta-device-monitor
Collection: Continuous Monitoring ; Continuous Monitoring › Vanta Device Monitor
Fetched: 2026-11-17

## Article text

If you need to uninstall the Vanta Device Monitor on one of your devices, follow the instructions below based on the device's Operating System (OS).
 

## macOS
- 
Open Terminal. To do this, use the search (cmd + space bar) and search for Terminal. 
[image 01]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2455049622/7a041ab6f8d519767ece9848bc29/image.png?expires=1794967200&signature=abf30ccb11d264c4a4752e1df0be41dd468cbbdac2f66f1b87103ba0e30bfbf8&req=diQiE8l6lIddW%2FMW1HO4zWHCPpavKrr8li%2B4Pxjl%2FuUlOwH5iKnCB9YccAqG%0AtpjW%0A>
[image 02]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2455051526/d929d64cd02da2f4f38d8aa9cb1b/image.png?expires=1794967200&signature=26ee66ba1db915a67f985650035ce62c7e375265f3c423dd1ec7e0f7a38b285b&req=diQiE8l7nIRdX%2FMW1HO4zWx3jKbhcFKEsqaKBn764sBFkJ7ssZgtOLS7fl7f%0A0HOq%0A>
 
- 
Once open, copy/paste the command
sudo /usr/local/vanta/vanta-cli uninstall
​
[image 03]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2455052849/0011f211511434d0cbe04cb4f871/image.png?expires=1794967200&signature=06276d2676d7e77d59eed7f9b2c7d05305fe3e951695eaae7f4f5a83d397cd9d&req=diQiE8l7n4lbUPMW1HO4zQoEKXWS9PuM0T3LurpgzsyEtQDRZObbj8NdvOjX%0AKC4%2F%0A>
- 
Press Enter. You'll be prompted to enter your password (this is the password you use to log in to your computer or install applications).
[image 04]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2455053931/7aed6be3f3212050bb72651fcb65/image.png?expires=1794967200&signature=5f1f021f30f752a34c8724bfec0d5b2c644d4d2e75a6a21e5bd9399961c8a026&req=diQiE8l7nohcWPMW1HO4zakuVgvX11qb%2BM755z7HcxkflIBFC8q%2B9rIqC8Q4%0AkCw%2F%0A>

​Note: You will not see active typing, but the text is being captured.
- 
It is now uninstalled

## Windows
- 
Stop any tasks associated with the Vanta Device Monitor. You can do this by opening the Task Manager, either by pressing Ctrl + Shift + Esc or by clicking the Taskbar and selecting Task Manager.
- 
Select any Vanta Device Monitor tasks and click end task.
- 
Go to Apps & features, search for Vanta, and click on the Uninstall button.
- 
Delete the files in the Vanta folder from this location C:\ProgramData\Vanta.
- 
If you wish to uninstall the Vanta Device Monitor through PowerShell, check out the following article <https://help.vanta.com/en/articles/11345404-uninstalling-the-vanta-device-monitor-windows-powershell>

## Linux
- 
Open the command line, and copy/paste

### sudo vanta-cli uninstall

## Removing the Device from Vanta
- 
Uninstalling does not remove the Vanta Device Monitor registration within Vanta. As an admin, you can visit the Computers page <https://app.vanta.com/computers> to remove the Vanta Device Monitor, individually or in bulk <https://help.vanta.com/en/articles/11345960>.
- 
Do this only if the uninstall command did not remove the device from the user's profile.
- 
If an administrator performs this action rather than using the uninstall command, the device will be permanently disabled. Please reach out to [email protected] to re-enable the node key, allowing for future installations.
- 
Once a Vanta Device Monitor is disabled, Vanta will no longer pick up updates for that device through the Vanta Device Monitor. Monitors/Tests will no longer look at the Vanta Device Monitor.

## Images

- [image 01] ../../images/documentation/uninstalling-the-vanta-device-monitor--01.png
- [image 02] ../../images/documentation/uninstalling-the-vanta-device-monitor--02.png
- [image 03] ../../images/documentation/uninstalling-the-vanta-device-monitor--03.png
- [image 04] ../../images/documentation/uninstalling-the-vanta-device-monitor--04.png
