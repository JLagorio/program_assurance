# Updating the Vanta Device Monitor

Source: https://help.vanta.com/en/articles/11345399-updating-the-vanta-device-monitor
Collection: Continuous Monitoring ; Continuous Monitoring › Vanta Device Monitor
Fetched: 2026-11-17

## Article text

The Vanta Device Monitor should auto-update. If the Vanta Device Monitor does not update automatically, you can follow the steps below to update it using the downloadable installer or manually.
 

## Before Updating the Vanta Device Monitor
- 
Make sure you have the Vanta Device Monitor installed on your computer.
- 
Make sure you have permission to install software on your computer.
 

## Updating the Vanta Device Monitor via Terminal/Command Line
Mac 
- 
Open terminal (easiest way is cmd + space bar & search for 'terminal')
- 
Copy/Paste sudo /usr/local/vanta/vanta-cli update --auto
- 
Hit 'Return'. It may ask you for a password (use the password you have to download apps or to open your computer)
Windows
- 
Search for cmd.exe in the search bar.
- 
Right-click and select “run as administrator.”
- 
Type C:\PROGRA~1\Vanta\vanta-cli update --auto
- 
Press return
 

## Updating the Vanta Device Monitor via the Installer
- 
Go to https://app.vanta.com/downloads <https://app.vanta.com/downloads>
- 
Download the most recent version of the Vanta Device Monitor installer by clicking the purple Download button.
- 
For Mac OS, once downloaded, double-click the installer to upgrade your Vanta Device Monitor to the latest version. You will be prompted to enter your computer password, and you may be prompted to enter the registration key again (which can be found on the user onboarding page)
- 
For Windows, double click on the installer, and then select the remove option first to uninstall the current version of the Vanta Device Monitor.
- 
Once the uninstallation is complete, double-click the installer you downloaded again, and this time, you will install the latest version. You may be prompted for your registration key, which can be found on the user onboarding page:
​

## Common Troubleshooting
If the device is still having issues, trying an uninstall/reinstall may help. This will also update the Vanta Device Monitor:
Mac uninstall/reinstall
- 
Open Terminal (easiest way to find it is cmd+space bar "terminal")
- 
Copy and paste the code below into the Terminal:
​sudo /usr/local/vanta/vanta-cli uninstall
- 
To reinstall, please visit https://app.vanta.com/download <https://app.vanta.com/download>.
Windows uninstall/reinstall
- 
Go to Apps & features, search for Vanta, and click on the Uninstall button.
- 
Delete the files in the Vanta folder from this location C:\ProgramData\Vanta.
- 
Please reboot your machine before attempting to reinstall
- 
To reinstall, please visit https://app.vanta.com/download <https://app.vanta.com/download>.

## Images

- none
