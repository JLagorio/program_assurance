# Configure Screen Lock on Windows Devices

Source: https://help.vanta.com/en/articles/11345843-configure-screen-lock-on-windows-devices
Collection: Audit Readiness ; Audit Readiness › Security Posture Best Practices
Fetched: 2026-11-17

## Article text

When passing screen-lock tests, the Vanta Device Monitor examines a device's user profile settings to ensure that workstations remain secure when users step away from them.
 
This ensures that sensitive information remains secure and inaccessible to unauthorized individuals in the event that a user leaves their workstation unattended.
 
 
If, despite proper configuration, the screen lock test does not pass, it could be due to device compatibility issues or incorrect interpretations of settings.
 
If a device has multiple user profiles, the Screensaver settings must be applied to all of them.
 
Note that the configuration steps provided are specific to Windows devices. For Linux users, Vanta does not natively detect screen lock settings. Instead, custom evidence must be used as a workaround for compliance.
 

## Configure Screen Lock
- 
Open the Start Menu
- 
Select Control Panel
- 
Search for Screen Saver and click on Change Screen Saver
- 
In the dropdown, select a Screen Saver option that is not None (e.g. “Ribbons”).
- 
Adjust the value in 'Wait for screen saver' to a minimum of 5 minutes and a maximum of 60 minutes.
- 
Check the resume and display the log-on screen. If this checkbox is not selected, the test will not pass.
- 
The Screenlock test should begin passing after the next check-in. These instructions are designed for Windows devices and align with Vanta's detection capabilities.
 

## Troubleshooting Steps
- 
If the screen lock test fails, ensure that the configuration matches the steps provided.
- 
Open cmd.exe as an administrator and run the following commands:
- 
C:\ProgramData\Vanta\vanta-cli.exe reset to reset the detection system.
- 
If the issue persists after 24 hours, run C:\ProgramData\Vanta\vanta-cli doctor to identify potential causes.
- 
Share command outputs with Vanta support for further analysis if the problem remains unresolved.
 
[image 01]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1527851255/956a5926892ba22d699a572e9b0c/image+%285%29.png?expires=1794967200&signature=4e02b8294b1507fc747022d6a7c3dc2d8d27faf359ff60eb215d462dcac17bea&req=dSUlEcF7nINaXPMW1HO4zdoj1N%2BCgW50b%2FoQ4B%2Bsrlq6wCFHgm9UI5KDLEUS%0A5l7a6I3GFZ9Gf0dBXCg%3D%0A>

## Images

- [image 01] ../../images/documentation/configure-screen-lock-on-windows-devices--01.png
