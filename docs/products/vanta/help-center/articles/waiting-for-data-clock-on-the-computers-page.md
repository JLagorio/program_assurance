# "Waiting for data" Clock on the Computers Page

Source: https://help.vanta.com/en/articles/11346028-waiting-for-data-clock-on-the-computers-page
Collection: Optimizing your Workflow ; Optimizing your Workflow › Troubleshooting
Fetched: 2026-11-17

## Article text

Some devices on the computers page may show a grey clock, instead of a green checkmark for different device requirements that reads (when hovered over) waiting for data.
 
The waiting for data symbol can appear for any of the following requirements: password manager, HD encryption, antivirus, or screen lock.
​
[image 01]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516767216/4bacb7e4a1c0c3d9e2f8db19447b/27572332900756?expires=1794967200&signature=62b2e0aa55ef2641b222f29ee0f9f49bc97afc78182efcafdc39f037eb70b4db&req=dSUmEM54moNeX%2FMW1HO4zWu0sOLuVVkZRELQLMzdvlJMoe8KPNH1qW4fxftu%0AbO4SwAp2A0QrXBtWm7Q%3D%0A>
 

## Procedure
Have the device owner try the following:
 
Mac 
- 
Open terminal (easiest way is cmd + space bar & search for 'terminal')
- 
Copy/Paste sudo /usr/local/vanta/vanta-cli reset
- 
Hit 'Return'. It may ask you for a password (use the password you have to download apps or to open your computer)
Windows
- 
Search for cmd.exe in the search bar. Right-click and select “run as administrator.”
- 
Type C:\PROGRA~1\Vanta\vanta-cli reset and press return
After running the command, it can take a few hours for the device to check in again.
The waiting for data symbol should be replaced with the status of the requirement, indicated by a green checkmark or a black X. The black X indicates that the requirement is not being met on the device.
 

## Common Issues
If the waiting for data symbol still shows after trying the steps above, the device owner may need to reinstall the Vanta Device Monitor:
 
Mac uninstall/reinstall
- 
Open Terminal (the most straightforward way to find it is cmd+space bar "terminal")
- 
Copy and paste the code below into the Terminal:
​sudo /usr/local/vanta/vanta-cli uninstall
- 
To reinstall, please visit https://app.vanta.com/download <https://app.vanta.com/download>.
Windows uninstall/reinstall
- 
Go to Apps & features, search for Vanta and click on the Uninstall button.
- 
Delete the files in the Vanta folder from this location C:\ProgramData\Vanta.
- 
Please reboot your machine before attempting to reinstall
- 
To reinstall, please visit https://app.vanta.com/download <https://app.vanta.com/download>.

## Images

- [image 01] ../../images/ux/devices/waiting-for-data-clock-on-the-computers-page--01.png
