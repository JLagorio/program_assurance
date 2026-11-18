# Device not Checking In

Source: https://help.vanta.com/en/articles/11346021-device-not-checking-in
Collection: Optimizing your Workflow ; Optimizing your Workflow › Troubleshooting
Fetched: 2026-11-17

## Article text

This is a guide on how to fix a device not checking in.
 
If a device has not checked in on the Computers page <https://app.vanta.com/computers> for more than 24 hours and has been on and connected to the internet, you will want to try the steps below to resolve this issue. Ensure that any required password managers are installed on the device and check that network or firewall configurations are not obstructing communications with Vanta. Refer to Vanta's documentation for supported software and necessary network configurations.
 
 

## Procedure
To address devices not checking in, follow the troubleshooting steps below, starting with an agent reset:
 
 

## Mac
- 
Open terminal (easiest way is cmd + space bar & search for 'terminal')
- 
Copy/Paste sudo /usr/local/vanta/vanta-cli reset
- 
Hit 'Return'. It may ask you for a password (This is the password you use for opening your computer or installing applications)
- 
Restart the agent by running:sudo /usr/local/vanta/vanta-cli stop 
sudo /usr/local/vanta/vanta-cli start

## Windows
- 
Search for cmd.exe in the search bar. Right-click and select “Run as Administrator.”
- 
Type C:\PROGRA~1\Vanta\vanta-cli.exe reset and press return

## Linux
- 
Open terminal
- 
Copy/Paste sudo /var/vanta/vanta-cli reset
- 
Hit 'Return'. It may ask you for a password (This is the password you use for opening your computer or installing applications)
- 
Restart the agent by running:   sudo vanta-cli stop
   sudo vanta-cli start
 

## Common Issues
If the device still doesn't check in within 24 hours of running the reset command, we recommend uninstalling and reinstalling the agent.  <https://help.vanta.com/en/articles/11345408> Before uninstalling, ensure that the network and firewall settings are correctly configured to allow access to Vanta servers (https://osquery.vanta.com , https://app.vanta.com , https://agent-downloads.vanta.com). Verify these settings and retry the reset process before attempting a reinstall.
 
 

## Mac uninstall/reinstall
- 
Open Terminal (easiest way to find it is cmd+space bar "terminal")
- 
Copy and paste the code below into the Terminal:
​sudo /usr/local/vanta/vanta-cli uninstall
- 
To reinstall, please visit https://app.vanta.com/download <https://app.vanta.com/download>

## Windows uninstall/reinstall
- 
Go to Apps & Features, search for Vanta, and click the Uninstall button.
- 
Delete the files in the Vanta folder from this location C:\ProgramData\Vanta.
- 
Please reboot your machine before attempting to reinstall
- 
To reinstall, please visit https://app.vanta.com/download <https://app.vanta.com/download>.

## Linux uninstall/reinstall
- 
Open the command line, and run sudo vanta-cli uninstall
- 
To reinstall, please visit https://app.vanta.com/download <https://app.vanta.com/download>
 
If the Agent still fails to check in a few hours after trying this, please run our diagnostic tool, Doctor, and copy the full output to share with the Vanta support team:
 

## Mac
- 
Open terminal (easiest way is cmd + space bar & search for 'terminal')
- 
Copy/Paste sudo /usr/local/vanta/vanta-cli doctor
- 
Hit 'Return'. It may ask you for a password (This is the password you use for opening your computer or installing applications)

## Windows
- 
Search for cmd.exe in the search bar. Right-click and select “run as administrator.”
- 
Type C:\PROGRA~1\Vanta\vanta-cli doctor and press return

## Linux
- 
Open terminal
- 
Copy/Paste sudo /var/vanta/vanta-cli doctor
- 
Hit 'Return'. It may ask you for a password (This is the password you use for opening your computer or installing applications)

## Images

- none
