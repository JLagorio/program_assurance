# Error: “Unable to connect to osquery”

Source: https://help.vanta.com/en/articles/11346014-error-unable-to-connect-to-osquery
Collection: Optimizing your Workflow ; Optimizing your Workflow › Troubleshooting
Fetched: 2026-11-17

## Article text

## Environment Details
Users with Vanta installed on a Mac device may see the following error after running the Vanta doctor:
[image 01]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516766764/3884072ae2077a9ac72b84530c2b/12842689424020?expires=1794967200&signature=e9fa285c008c8673b5f6d872c4f24010abea350a4fa2c52bd9c9b08a1a17833d&req=dSUmEM54m4ZZXfMW1HO4zQXf0TlTDLer2bS2I9aJbCoKFP1FlPVIeisOf%2F84%0AqjR2VPoeVrk4GEZMZzE%3D%0A>
 

## Resolution
Mac Device Restart
Sometimes the UNIX socket is being held open due to a hung process. Restarting the device can clear these socket processes and allow installation to continue.
​
Mac uninstall/reinstall
- 
Open Terminal (the most straightforward way to find it is cmd+space bar "terminal")
- 
Copy and paste the code below into the Terminal:
​sudo /usr/local/vanta/vanta-cli uninstall
- 
To reinstall, restart the device
- 
Then visit https://app.vanta.com/download <https://app.vanta.com/download>.
After Vanta is reinstalled, run the Vanta doctor to confirm the error is gone:
- 
Open terminal (easiest way is cmd + space bar & search for 'terminal')
- 
Copy/Paste sudo /usr/local/vanta/vanta-cli doctor
- 
Hit 'Return'. It may ask you for a password (use the password you have to download apps or to open your computer)

## Images

- [image 01] ../../images/documentation/error-unable-to-connect-to-osquery--01.png
